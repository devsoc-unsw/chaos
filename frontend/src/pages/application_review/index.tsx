import React, { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useParams } from "react-router-dom";
import ShortAnswer from "components/QuestionComponents/ShortAnswer";
import Dropdown, { NO_ANSWER_VALUE } from "components/QuestionComponents/Dropdown";
import MultiChoice from "components/QuestionComponents/MultiChoice";
import MultiSelect from "components/QuestionComponents/MultiSelect";
import Ranking from "components/QuestionComponents/Ranking";
import { getCampaign, getCampaignRoles, getCommonQuestions, getRoleQuestions, createOrGetApplication, getCommonApplicationAnswers, getApplicationAnswers, createAnswer, updateAnswer, deleteAnswer, updateApplicationRoles, getApplicationRoles, submitApplication } from "api";
import type { Campaign, Role, QuestionResponse, QuestionData, Answer, ApplicationRoleUpdateInput } from "types/api";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Info } from "lucide-react";

const ApplicationReview: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | string>("general");
  const [commonQuestions, setCommonQuestions] = useState<QuestionResponse[]>([]);
  const [questionsByRole, setQuestionsByRole] = useState<Record<string, QuestionResponse[]>>({});
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [commonAnswers, setCommonAnswers] = useState<Answer[]>([]);
  const [roleAnswers, setRoleAnswers] = useState<Record<string, Answer[]>>({});
  const cleanupInProgress = useRef<Set<string>>(new Set());

  
  // Moved merging state of answers in hashamp into mergeAnswersIntoState
  const extractAnswerValue = (answer: Answer): unknown =>
    (answer as unknown as { answer_data?: unknown; data?: unknown }).answer_data ??
    (answer as unknown as { answer_data?: unknown; data?: unknown }).data;

  const mergeAnswersIntoState = (answerList: Answer[]) => {
    const answerMap: Record<string, unknown> = {};
    answerList.forEach((answer) => {
      answerMap[answer.question_id] = extractAnswerValue(answer);
    });

    setAnswers((prev) => ({ ...prev, ...answerMap }));
  };

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      setLoading(true);
      try {
        const idStr = campaignId;
        const [c, r, common, application] = await Promise.all([
          getCampaign(idStr),
          getCampaignRoles(idStr),
          getCommonQuestions(idStr),
          createOrGetApplication(idStr),
        ]);
        setCampaign(c);
        setRoles(r);
        setApplicationId(application.application_id);
        const commonList = Array.isArray(common)
          ? common
          : (common as unknown as { questions?: QuestionResponse[] }).questions ?? [];
        setCommonQuestions(commonList);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  // Load common answers when application ID is available
  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const fetchedAnswers = await getCommonApplicationAnswers(applicationId);
        setCommonAnswers(fetchedAnswers);
        mergeAnswersIntoState(fetchedAnswers);
      } catch (error) {
        console.error('Failed to load common answers:', error);
      }
    })();
  }, [applicationId]);

  // Load application roles when application ID is available
  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const applicationRoles = await getApplicationRoles(applicationId);
        // Set selected role IDs based on loaded application roles
        const roleIds = applicationRoles.map(role => role.campaign_role_id);
        setSelectedRoleIds(roleIds);
      } catch (error) {
        console.error('Failed to load application roles:', error);
        // If no roles are found, that's OK - user can select roles
        setSelectedRoleIds([]);
      }
    })();
  }, [applicationId]);

  // Fetch role-specific questions when a new role is selected
  useEffect(() => {
    if (!campaignId || !applicationId) return;
    const id = campaignId;
    const missing = selectedRoleIds.filter((rid) => questionsByRole[rid] === undefined);
    if (missing.length === 0) return;
    (async () => {
      const updates: Record<string, QuestionResponse[]> = {};
      const roleAnswersUpdates: Record<string, Answer[]> = {};
      
      await Promise.all(
        missing.map(async (rid) => {
          const [questionsResp, answersResp] = await Promise.all([
            getRoleQuestions(id, rid),
            getApplicationAnswers(applicationId, rid)
          ]);
          
          updates[rid] = Array.isArray(questionsResp)
            ? questionsResp
            : (questionsResp as unknown as { questions?: QuestionResponse[] }).questions ?? [];
          
          roleAnswersUpdates[rid] = answersResp;
        })
      );
      
      setQuestionsByRole((prev) => ({ ...prev, ...updates }));
      setRoleAnswers((prev) => ({ ...prev, ...roleAnswersUpdates }));
      
      // Pre-fill answers state with role-specific answers
      Object.values(roleAnswersUpdates).forEach((answerList) => {
        mergeAnswersIntoState(answerList);
      });
    })();
  }, [selectedRoleIds, campaignId, questionsByRole, applicationId]);

  const syncRoles = async (nextSelectedRoles: string[]) => {
    if (!applicationId) {
      console.error("No applicationId available for syncing roles");
      return;
    }
    
    const payload: ApplicationRoleUpdateInput = {
      roles: nextSelectedRoles.map((rid, idx) => ({
        id: "0",
        application_id: applicationId,
        campaign_role_id: rid,
        preference: idx + 1,
      })),
    };
    
    console.log("🔄 Syncing roles:", { applicationId, selectedRoles: nextSelectedRoles, payload });
    
    try {
      const result = await updateApplicationRoles(applicationId, payload);
      console.log("✅ Roles synced successfully:", result);
    } catch (e) {
      console.error("❌ Failed to update application roles:", e);
      setValidationError(`Failed to save role selection: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const toggleRole = async (roleId: string) => {
    if (isSubmitted) {
      setValidationError('Cannot modify roles: Application has already been submitted.');
      return;
    }
    
    setSelectedRoleIds((prev: string[]) => {
      const next = prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId];
      // Don't use void - let the error be handled by syncRoles
      syncRoles(next).catch((e) => {
        console.error("Role toggle sync failed:", e);
      });
      return next;
    });
    // Clear validation error when user changes roles
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (isSubmitted) {
      setValidationError('Cannot modify roles: Application has already been submitted.');
      return;
    }
    
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Reorder within selected list
    if (source.droppableId === "selected-roles" && destination.droppableId === "selected-roles") {
      if (source.index === destination.index) return;
      setSelectedRoleIds((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        syncRoles(next).catch((e) => {
          console.error("Role reorder sync failed:", e);
        });
        return next;
      });
      return;
    }

    // Move from available -> selected (insert at destination.index)
    if (source.droppableId === "available-roles" && destination.droppableId === "selected-roles") {
      setSelectedRoleIds((prev) => {
        if (prev.includes(draggableId)) return prev; // already selected
        const next = [...prev];
        next.splice(destination.index, 0, draggableId);
        syncRoles(next).catch((e) => {
          console.error("Role add sync failed:", e);
        });
        return next;
      });
      return;
    }

    // Move from selected -> available (remove)
    if (source.droppableId === "selected-roles" && destination.droppableId === "available-roles") {
      setSelectedRoleIds((prev) => {
        const next = prev.filter((rid) => rid !== draggableId);
        syncRoles(next).catch((e) => {
          console.error("Role remove sync failed:", e);
        });
        return next;
      });
      return;
    }
  };

  const setAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear validation error when user makes changes
    if (validationError) {
      setValidationError(null);
    }
  };

  // Refresh answer ID when answer is not found in the state
  // Fixed the error of not loading answer state 
  const refreshAnswerId = async (
    questionId: string,
    question: QuestionResponse,
    questionRoleId: string | null
  ): Promise<string | undefined> => {
    if (!applicationId) {
      return undefined;
    }

    try {
      if (question.common) {
        const latest = await getCommonApplicationAnswers(applicationId);
        setCommonAnswers(latest);
        mergeAnswersIntoState(latest);
        const match = latest.find((answer) => answer.question_id === questionId);
        return match?.id;
      }

      const roleId =
        questionRoleId ??
        Object.entries(questionsByRole).find(([, questions]) =>
          questions.some((q) => String(q.id) === questionId)
        )?.[0];

      if (!roleId) {
        return undefined;
      }

      const latest = await getApplicationAnswers(applicationId, roleId);
      setRoleAnswers((prev) => ({ ...prev, [roleId]: latest }));
      mergeAnswersIntoState(latest);
      const match = latest.find((answer) => answer.question_id === questionId);
      return match?.id;
    } catch (error) {
      console.error("Failed to refresh answer data for question:", questionId, error);
      return undefined;
    }
  };

  const submitAnswer = async (questionId: string, value: unknown, questionType: string) => {
    if (isSubmitted) {
      setValidationError('Cannot modify answers: Application has already been submitted.');
      return;
    }
    
    if (!applicationId) {
      console.error("No applicationId available for submitting answer");
      setValidationError("Still preparing your application. Please wait a moment and try again.");
      return;
    }

    let questionRoleId: string | null = null;
    let question: QuestionResponse | undefined = commonQuestions.find((q) => String(q.id) === questionId);
    if (!question) {
      for (const [roleId, questions] of Object.entries(questionsByRole)) {
        const roleQuestion = questions.find((q) => String(q.id) === questionId);
        if (roleQuestion) {
          question = roleQuestion;
          questionRoleId = roleId;
          break;
        }
      }
    }

    if (!question) {
      console.error("Question not found:", questionId);
      return;
    }

    let answerId = getAnswerId(questionId);
    
    if (!answerId) {
      answerId = await refreshAnswerId(questionId, question, questionRoleId);
    }

    console.log("🔄 Submitting answer:", { questionId, value, questionType, answerId, applicationId });
    
    // Check if this is an update or create operation
    if (answerId) {
      console.log("📝 This is an UPDATE operation for existing answer:", answerId);
    } else {
      console.log("➕ This is a CREATE operation for new answer");
    }

    // Prepare outside try so we can use in catch for recovery
    let apiAnswerType: string = "";
    let apiAnswerData: unknown = "";

    try {
      // Check if the answer should be deleted (empty/blank)
      const shouldDelete =
        (questionType === "ShortAnswer" && (!value || String(value).trim() === "")) ||
        (questionType === "MultiSelect" && (!Array.isArray(value) || value.length === 0)) ||
        (questionType === "DropDown" && value === NO_ANSWER_VALUE);

      if (shouldDelete) {
        if (answerId) {
          // Delete existing answer
          await deleteAnswer(answerId);
          // Remove from local state
          setCommonAnswers(prev => prev.filter(a => a.id !== answerId));
          setRoleAnswers(prev => {
            const newRoleAnswers = { ...prev };
            Object.keys(newRoleAnswers).forEach(roleId => {
              newRoleAnswers[roleId] = newRoleAnswers[roleId].filter(a => a.id !== answerId);
            });
            return newRoleAnswers;
          });
        }
        // Update answers state to reflect the deletion
        // For dropdowns, set to NO_ANSWER_VALUE for review modal display
        if (questionType === "DropDown") {
          setAnswers(prev => ({ ...prev, [questionId]: NO_ANSWER_VALUE }));
        } else {
          setAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[questionId];
            return newAnswers;
          });
        }
        return;
      }

      // Determine the answer type for the API
      
      switch (questionType) {
        case "ShortAnswer":
          apiAnswerType = "ShortAnswer";
          apiAnswerData = String(value);
          break;
        case "MultiChoice":
        case "DropDown":
          apiAnswerType = questionType;
          apiAnswerData = value;
          break;
        case "MultiSelect":
        case "Ranking":
          apiAnswerType = questionType;
          apiAnswerData = Array.isArray(value) ? value : [];
          break;
        default:
          apiAnswerType = "ShortAnswer";
          apiAnswerData = String(value);
      }

      if (answerId) {
        // Update existing answer
        console.log("📝 Updating existing answer:", { answerId, questionId, apiAnswerType, apiAnswerData });
        const result = await updateAnswer(answerId, questionId, apiAnswerType as any, apiAnswerData as any);
        console.log("✅ Answer updated successfully:", result);
        updateStoredAnswerData(question, questionRoleId, answerId, apiAnswerData);
      } else {
        // Create new answer
        console.log("➕ Creating new answer:", { applicationId, questionId, apiAnswerType, apiAnswerData });
        const newAnswer = await createAnswer(applicationId, questionId, apiAnswerType as any, apiAnswerData as any);
        console.log("✅ Answer created successfully:", newAnswer);
        
        // Update local state with the new answer
        // Keep shape consistent with API (`answer_data`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newAnswerObj: any = {
          id: newAnswer?.id || String(Date.now()),
          question_id: questionId,
          answer_type: apiAnswerType,
          answer_data: apiAnswerData,
          created_at: new Date(),
          updated_at: new Date()
        } as Answer & { answer_data: unknown };

        // Add to appropriate state based on whether it's a common or role question
        if (question.common) {
          setCommonAnswers(prev => [
            ...prev.filter((answer) => answer.question_id !== questionId),
            newAnswerObj,
          ]);
        } else if (questionRoleId) {
          setRoleAnswers(prev => ({
            ...prev,
            [questionRoleId]: [
              ...(prev[questionRoleId] || []).filter((answer) => answer.question_id !== questionId),
              newAnswerObj,
            ],
          }));
        }

        // Update the main answers state so the review modal shows the correct value
        setAnswers(prev => ({ ...prev, [questionId]: apiAnswerData }));
      }
    } catch (error) {
      console.error('❌ Failed to submit answer:', error);
      const e: any = error;

      // Trying to fix MCQ Bad request error
      if (!answerId && e?.status === 500) {
        try {
          // First try from local state
          let existingId = getAnswerId(questionId);
          // If not found, fetch from server (common + each selected role)
          if (!existingId && applicationId) {
            const [common, ...roleAnsArrays] = await Promise.all([
              getCommonApplicationAnswers(applicationId),
              ...selectedRoleIds.map((rid) => getApplicationAnswers(applicationId, rid)),
            ]);
            const allAnswers = [
              ...common,
              ...roleAnsArrays.flat(),
            ];
            const found = allAnswers.find((a) => String(a.question_id) === String(questionId));
            if (found) existingId = found.id;
          }
          if (existingId) {
            console.warn('Recovering from create error by updating existing answer:', existingId);
            await updateAnswer(existingId, questionId, apiAnswerType as any, apiAnswerData as any);
            return;
          }
        } catch (recoveryErr) {
          console.error('Recovery update attempt failed:', recoveryErr);
        }
      }

      const serverMsg = e?.data?.message ?? e?.data?.error ?? e?.statusText;

      if (e?.status === 400 || e?.status === 422) {
        setValidationError(`Failed to save answer: ${serverMsg ?? 'Bad request'}`);
        return;
      }

      if (error instanceof Error && error.message.includes('Application closed')) {
        setValidationError('Cannot update answers: Application has been submitted or campaign has ended.');
      } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setValidationError('Network error: Failed to connect to server. Please check if the backend is running.');
      } else if (e?.status === 500) {
        setValidationError(`Server error while saving answer. ${serverMsg ? `Details: ${serverMsg}` : ''}`.trim());
      } else {
        setValidationError(`Failed to save answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Getting answer_id 
  const getAnswerId = useCallback(
    (questionId: string): string | undefined => {
      // Check common answers first
      const commonAnswer = commonAnswers.find((a) => a.question_id === questionId);
      if (commonAnswer) return commonAnswer.id;

      // Check role-specific answers
      for (const answersForRole of Object.values(roleAnswers)) {
        const roleAnswer = answersForRole.find((a) => a.question_id === questionId);
        if (roleAnswer) return roleAnswer.id;
      }

      return undefined;
    },
    [commonAnswers, roleAnswers]
  );

  // Getting answer_data 
  const getAnswerValue = useCallback(
    (questionId: string): unknown => {
      const commonAnswer = commonAnswers.find((a) => a.question_id === questionId);
      if (commonAnswer) {
        return extractAnswerValue(commonAnswer);
      }

      for (const answersForRole of Object.values(roleAnswers)) {
        const roleAnswer = answersForRole.find((a) => a.question_id === questionId);
        if (roleAnswer) {
          return extractAnswerValue(roleAnswer);
        }
      }

      return answers[questionId];
    },
    [answers, commonAnswers, roleAnswers]
  );

  // Replace answer Data in the list
  const replaceAnswerDataInList = (
    list: Answer[] | undefined,
    targetAnswerId: string,
    newValue: Answer["answer_data"]
  ): Answer[] | undefined => {
    if (!list) {
      return list;
    }

    return list.map((answer) =>
      answer.id === targetAnswerId ? ({ ...answer, answer_data: newValue } as Answer) : answer
    );
  };

  // Update stored answer data in the state
  const updateStoredAnswerData = useCallback(
    (
      question: QuestionResponse,
      questionRoleId: string | null,
      answerId: string,
      answerValue: unknown
    ) => {
      const questionId = String(question.id);
      const nextValue = answerValue as Answer["answer_data"];

      setAnswers((prev) => ({ ...prev, [questionId]: nextValue }));

      if (question.common) {
        setCommonAnswers(
          (prev) => replaceAnswerDataInList(prev, answerId, nextValue) ?? prev
        );
        return;
      }

      if (questionRoleId) {
        setRoleAnswers((prev) => {
          const nextList = replaceAnswerDataInList(prev[questionRoleId], answerId, nextValue);
          if (!nextList) {
            return prev;
          }
          return { ...prev, [questionRoleId]: nextList };
        });
        return;
      }

      setRoleAnswers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((rid) => {
          const nextList = replaceAnswerDataInList(updated[rid], answerId, nextValue);
          if (nextList) {
            updated[rid] = nextList;
          }
        });
        return updated;
      });
    },
    [setAnswers, setCommonAnswers, setRoleAnswers]
  );

  // Remove answer for a question from the state (only do this when we remove an option from a question)
  const removeAnswerForQuestion = useCallback(
    async (question: QuestionResponse, roleId: string | null) => {
      const questionId = String(question.id);
      if (cleanupInProgress.current.has(questionId)) {
        return;
      }

      cleanupInProgress.current.add(questionId);
      const answerId = getAnswerId(questionId);

      try {
        if (answerId) {
          await deleteAnswer(answerId);
        }
      } catch (error) {
        console.error("Failed to delete invalid answer:", { questionId, error });
      } finally {
        setCommonAnswers((prev) =>
          question.common ? prev.filter((answer) => answer.question_id !== questionId) : prev
        );

        if (!question.common) {
          if (roleId) {
            setRoleAnswers((prev) => ({
              ...prev,
              [roleId]: (prev[roleId] || []).filter((answer) => answer.question_id !== questionId),
            }));
          } else {
            setRoleAnswers((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((rid) => {
                updated[rid] = updated[rid].filter((answer) => answer.question_id !== questionId);
              });
              return updated;
            });
          }
        }

        setAnswers((prev) => {
          if (question.question_type === "DropDown") {
            return { ...prev, [questionId]: NO_ANSWER_VALUE };
          }
          if (!(questionId in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[questionId];
          return next;
        });

        cleanupInProgress.current.delete(questionId);
      }
    },
    [getAnswerId, setCommonAnswers, setRoleAnswers, setAnswers]
  );

  useEffect(() => {
    const shouldRemoveAnswer = (question: QuestionResponse, answerValue: unknown): boolean => {
      if (!question.data?.options || question.data.options.length === 0) {
        return false;
      }

      const validOptionIds = question.data.options.map((opt) => String(opt.id));

      if (question.question_type === "MultiChoice") {
        if (answerValue === undefined || answerValue === null) {
          return false;
        }
        return !validOptionIds.includes(String(answerValue));
      }

      if (question.question_type === "MultiSelect") {
        if (!Array.isArray(answerValue) || answerValue.length === 0) {
          return false;
        }
        return (answerValue as Array<string | number>).some(
          (value) => !validOptionIds.includes(String(value))
        );
      }

      return false;
    };

    const checkQuestions = (questions: QuestionResponse[], roleId: string | null) => {
      questions.forEach((question) => {
        if (question.question_type !== "MultiChoice" && question.question_type !== "MultiSelect") {
          return;
        }

        const questionId = String(question.id);
        const existingAnswer = answers[questionId];

        if (!shouldRemoveAnswer(question, existingAnswer)) {
          return;
        }

        void removeAnswerForQuestion(question, roleId);
      });
    };

    checkQuestions(commonQuestions, null);
    Object.entries(questionsByRole).forEach(([roleId, qs]) => {
      checkQuestions(qs ?? [], roleId);
    });
  }, [answers, commonQuestions, questionsByRole, removeAnswerForQuestion]);

  const formatAnswer = (question: QuestionResponse, answer: unknown): string => {
    if (answer === null || answer === undefined || answer === '') {
      return "No answer provided";
    }

    switch (question.question_type) {
      case "ShortAnswer":
        return String(answer);
      
      case "MultiChoice":
      case "DropDown":
        if (answer === NO_ANSWER_VALUE) {
          return "No answer provided";
        }
        const selectedOption = question.data?.options?.find(opt => opt.id === answer);
        return selectedOption ? selectedOption.text : String(answer);
      
      case "MultiSelect":
        if (Array.isArray(answer)) {
          const selectedOptions = (question.data?.options?.filter((opt) =>
            answer.map((id) => id?.toString()).includes(opt.id?.toString())
          ) ?? []).map((opt) => opt.text);
          return selectedOptions.length > 0 ? selectedOptions.join(", ") : "No selections";
        }
        return String(answer);

      case "Ranking":
        if (Array.isArray(answer)) {
          const optionMap = new Map(
            (question.data?.options ?? []).map((opt) => [opt.id?.toString(), opt.text])
          );
          const orderedLabels = answer
            .map((id) => optionMap.get(id?.toString()) ?? id?.toString())
            .filter((label): label is string => Boolean(label));
          return orderedLabels.length > 0 ? orderedLabels.join(", ") : "No selections";
        }
        return String(answer);
      
      default:
        return String(answer);
    }
  };

  const validateRequiredAnswers = (): { isValid: boolean; missingQuestions: string[] } => {
    const missingQuestions: string[] = [];
    
    // Check common questions
    commonQuestions.forEach(question => {
      if (question.required) {
        const answer = answers[String(question.id)];
        const isEmpty = answer === null || answer === undefined || answer === '' || 
                       answer === NO_ANSWER_VALUE || 
                       (Array.isArray(answer) && answer.length === 0);
        if (isEmpty) {
          missingQuestions.push(question.title);
        }
      }
    });
    
    // Check role-specific questions
    selectedRoleIds.forEach(roleId => {
      const roleQuestions = questionsByRole[roleId] || [];
      roleQuestions.forEach(question => {
        if (question.required) {
          const answer = answers[String(question.id)];
          const isEmpty = answer === null || answer === undefined || answer === '' || 
                         answer === NO_ANSWER_VALUE || 
                         (Array.isArray(answer) && answer.length === 0);
          if (isEmpty) {
            missingQuestions.push(question.title);
          }
        }
      });
    });
    
    return {
      isValid: missingQuestions.length === 0,
      missingQuestions
    };
  };

  const handleSubmitClick = () => {
    setValidationError(null); // Clear any previous errors
    
    const validation = validateRequiredAnswers();
    if (!validation.isValid) {
      setValidationError(`Please answer all required questions:\n${validation.missingQuestions.join('\n')}`);
      return;
    }
    
    // If validation passes, open the confirmation modal
    setShowSubmitDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!applicationId) return;
    
    setSubmitting(true);
    try {
      // Ensure roles are synced before submission
      console.log("🔄 Final sync before submission...");
      await syncRoles(selectedRoleIds);
      console.log("✅ Final role sync completed");
      
      await submitApplication(applicationId);
      setIsSubmitted(true);
      // alert('Application submitted successfully!');
      setShowSubmitDialog(false);
      // Optionally redirect or update UI
    } catch (error) {
      console.error('❌ Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const interactionDisabled = !applicationId || isSubmitted;

  const renderQuestion = (q: QuestionResponse) => {
    const options = (q.question_type === "MultiChoice" || q.question_type === "MultiSelect" || q.question_type === "DropDown" || q.question_type === "Ranking")
      ? ((q.data?.options ?? []).map((o) => ({ id: o.id, label: o.text })) ?? [])
      : [];
    const idStr = String(q.id);
    const answerValue = getAnswerValue(idStr);

    switch (q.question_type) {
      case "ShortAnswer":
        return (
          <ShortAnswer
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            defaultValue={(answerValue as string) ?? ""}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
            disabled={interactionDisabled}
            answerId={getAnswerId(idStr)}
          />
        );
      case "DropDown":
        return (
          <Dropdown
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={answerValue as string | number | undefined}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
            disabled={interactionDisabled}
            answerId={getAnswerId(idStr)}
          />
        );
      case "MultiChoice":
        return (
          <MultiChoice
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={answers[idStr] as string | number | undefined}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
            disabled={interactionDisabled}
            answerId={getAnswerId(idStr)}
          />
        );
      case "MultiSelect":
        return (
          <MultiSelect
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={(answerValue as Array<string | number>) ?? []}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
            disabled={interactionDisabled}
            answerId={getAnswerId(idStr)}
          />
        );
      case "Ranking":
        return (
          <Ranking
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={(answerValue as Array<string | number>) ?? []}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
            disabled={interactionDisabled}
            answerId={getAnswerId(idStr)}
          />
        );
      default:
        return null;
    }
  };

  if (loading || !campaign || !applicationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!campaign ? "Loading campaign data..." : "Preparing your application..."}
          </p>
        </div>
      </div>
    );
  }

  const activeRole = activeTab !== "general" ? roles.find((r) => String(r.id) === activeTab) : undefined;
  const activeRoleQuestions = activeTab !== "general" ? questionsByRole[activeTab] ?? [] : [];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
          <p className="text-gray-600">
            {new Date(campaign.starts_at).toLocaleDateString()} - {new Date(campaign.ends_at).toLocaleDateString()}
          </p>
          {applicationId && (
            <p className="text-sm text-gray-500 mt-2">
              Application ID: {applicationId}
            </p>
          )}
          {Object.keys(roleAnswers).length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Role Answers Loaded: {Object.keys(roleAnswers).join(', ')} 
              (Total: {Object.values(roleAnswers).reduce((sum, answers) => sum + answers.length, 0)} answers)
            </p>
          )}
        </div>

        <div className="flex gap-8 w-full">
          {/* Sidebar – multi-select roles */}
          <div className="w-80 flex-shrink-0">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Roles</h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {/* Selected roles (draggable & reorderable) */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Selected Roles</h3>
                  <p className="text-sm text-gray-500 mb-2">Drag to reorder based on preference</p>
                  <Droppable droppableId="selected-roles">
                   {(provided) => (
                     <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[12px] border-2 border-dashed border-gray-200 rounded-lg p-2">
                       {selectedRoleIds.length === 0 && (
                         <div className="text-sm text-gray-500 px-2 py-1">Drag a role from below to apply</div>
                       )}
                      {selectedRoleIds.map((rid, index) => {
                        const role = roles.find((r) => String(r.id) === rid);
                        if (!role) return null;
                        const selected = true;
                        return (
                          <Draggable key={rid} draggableId={rid} index={index}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-blue-200 text-blue-800 rounded-full">
                                      {index + 1}
                                    </span>
                                    <h3 className="font-medium text-sm truncate">{role.name}</h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {role.description && (
                                      <div className="group relative">
                                        <Info tw="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                          {role.description}
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                      </div>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      selected 
                                        ? "bg-blue-100 text-blue-700" 
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                      Selected
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                  </Droppable>
                </div>

                {/* Available roles (draggable into selected) */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Available Roles</h3>
                  <Droppable droppableId="available-roles">
                    {(provided) => (
                       <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[12px] border-2 border-dashed border-gray-200 rounded-lg p-2">
                         {roles.filter((r) => !selectedRoleIds.includes(String(r.id))).length === 0 && (
                           <div className="text-sm text-gray-500 px-2 py-1">All roles selected</div>
                         )}
                        {roles
                          .filter((r) => !selectedRoleIds.includes(String(r.id)))
                          .map((role, index) => (
                            <Draggable key={String(role.id)} draggableId={String(role.id)} index={index}>
                              {(dragProvided) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className="p-3 rounded-lg border-2 cursor-pointer transition-all bg-white border-gray-200 hover:border-gray-300"
                                  onClick={() => void toggleRole(String(role.id))}
                                >
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm">{role.name}</h3>
                                    <div className="flex items-center gap-2">
                                      {role.description && (
                                        <div className="group relative">
                                          <Info tw="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                            {role.description}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                          </div>
                                        </div>
                                      )}
                                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">Select</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs: General + selected roles */}
            <div className="flex border-b border-gray-200 mb-6 gap-2">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "general" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("general")}
              >
                General
              </button>
              {selectedRoleIds.map((rid) => (
                <button
                  key={rid}
                  className={`px-4 py-2 font-medium ${
                    activeTab === rid ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(rid)}
                >
                  {roles.find((r) => String(r.id) === rid)?.name ?? `Role ${rid}`}
                </button>
              ))}
            </div>

            {/* General questions */}
            {activeTab === "general" && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                {commonQuestions.length === 0 ? (
                  <p className="text-gray-600">No general questions.</p>
                ) : (
                  <div className="space-y-6">{commonQuestions.map(renderQuestion)}</div>
                )}
              </div>
            )}

            {/* Role-specific questions */}
            {activeTab !== "general" && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {activeRole?.name ?? "Role"} Questions
                </h3>
                {activeRoleQuestions.length === 0 ? (
                  <p className="text-gray-600">No role-specific questions.</p>
                ) : (
                  <div className="space-y-6">{activeRoleQuestions.map(renderQuestion)}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button - Fixed position bottom right */}
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
              <p className="text-red-700 text-sm whitespace-pre-line">
                {validationError}
              </p>
            </div>
          )}
          <Button 
            className="shadow-lg"
            size="lg"
            onClick={handleSubmitClick}
          >
            Submit
          </Button>
        </div>

        {/* Submit Confirmation Modal */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Confirm Application Submission
                {applicationId && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (ID: {applicationId})
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Please review your application before submitting. Once submitted, you won't be able to make changes.
              </p>
            </div>
            
            {/* Applied Roles Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Applied Roles:</h3>
              {selectedRoleIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedRoleIds.map((roleId) => {
                    const role = roles.find(r => String(r.id) === roleId);
                    return (
                      <span 
                        key={roleId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {role?.name || `Role ${roleId}`}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No roles selected</p>
              )}
            </div>

            {/* Common Questions Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">General Questions:</h3>
              {commonQuestions.length > 0 ? (
                <div className="space-y-4">
                  {commonQuestions.map((question) => (
                    <div key={question.id} className="border-l-4 border-gray-200 pl-4">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {question.title}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      {question.description && (
                        <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                      )}
                      <p className="text-gray-800 bg-gray-50 p-2 rounded">
                        {formatAnswer(question, answers[String(question.id)])}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No general questions</p>
              )}
            </div>

            {/* Role-specific Questions Sections */}
            {selectedRoleIds.map((roleId) => {
              const role = roles.find(r => String(r.id) === roleId);
              const roleQuestions = questionsByRole[roleId] || [];
              
              return (
                <div key={roleId} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {role?.name || `Role ${roleId}`} Questions:
                  </h3>
                  {roleQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {roleQuestions.map((question) => (
                        <div key={question.id} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {question.title}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </h4>
                          {question.description && (
                            <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                          )}
                          <p className="text-gray-800 bg-blue-50 p-2 rounded">
                            {formatAnswer(question, answers[String(question.id)])}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No questions for this role</p>
                  )}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowSubmitDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ApplicationReview;