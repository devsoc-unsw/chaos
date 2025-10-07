import React, { useState, useEffect, useMemo } from "react";
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
  const [commonAnswers, setCommonAnswers] = useState<Answer[]>([]);
  const [roleAnswers, setRoleAnswers] = useState<Record<string, Answer[]>>({});

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
        const answers = await getCommonApplicationAnswers(applicationId);
        setCommonAnswers(answers);

        // Pre-fill answers in the answers state
        const answerMap: Record<string, unknown> = {};
        answers.forEach(answer => {
          // API returns `answer_data` field
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          answerMap[answer.question_id] = (answer as any).answer_data ?? (answer as any).data;
        });
        setAnswers(prev => ({ ...prev, ...answerMap }));
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
      const answerMap: Record<string, unknown> = {};
      Object.values(roleAnswersUpdates).forEach(answers => {
        answers.forEach(answer => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          answerMap[answer.question_id] = (answer as any).answer_data ?? (answer as any).data;
        });
      });
      setAnswers(prev => ({ ...prev, ...answerMap }));
    })();
  }, [selectedRoleIds, campaignId, questionsByRole, applicationId]);

  const syncRoles = async (nextSelectedRoles: string[]) => {
    if (!applicationId) return;
    const payload: ApplicationRoleUpdateInput = {
      roles: nextSelectedRoles.map((rid, idx) => ({
        id: "0",
        application_id: applicationId,
        campaign_role_id: rid,
        preference: idx + 1,
      })),
    };
    try {
      await updateApplicationRoles(applicationId, payload);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to update application roles", e);
    }
  };

  const toggleRole = async (roleId: string) => {
    setSelectedRoleIds((prev: string[]) => {
      const next = prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId];
      void syncRoles(next);
      return next;
    });
    // Clear validation error when user changes roles
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Reorder within selected list
    if (source.droppableId === "selected-roles" && destination.droppableId === "selected-roles") {
      if (source.index === destination.index) return;
      setSelectedRoleIds((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        void syncRoles(next);
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
        void syncRoles(next);
        return next;
      });
      return;
    }

    // Move from selected -> available (remove)
    if (source.droppableId === "selected-roles" && destination.droppableId === "available-roles") {
      setSelectedRoleIds((prev) => {
        const next = prev.filter((rid) => rid !== draggableId);
        void syncRoles(next);
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

  const submitAnswer = async (questionId: string, value: unknown, questionType: string) => {
    if (!applicationId) return;

    const answerId = getAnswerId(questionId);
    const question = [...commonQuestions, ...Object.values(questionsByRole).flat()].find(q => String(q.id) === questionId);
    
    if (!question) return;

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
      let apiAnswerType: string;
      let apiAnswerData: unknown;
      
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
        await updateAnswer(answerId, questionId, apiAnswerType as any, apiAnswerData as any);
      } else {
        // Create new answer
        const newAnswer = await createAnswer(applicationId, questionId, apiAnswerType as any, apiAnswerData as any);
        
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
        if (commonQuestions.find(q => String(q.id) === questionId)) {
          setCommonAnswers(prev => [...prev, newAnswerObj]);
        } else {
          // Find which role this question belongs to
          for (const [roleId, questions] of Object.entries(questionsByRole)) {
            if (questions.find(q => String(q.id) === questionId)) {
              setRoleAnswers(prev => ({
                ...prev,
                [roleId]: [...(prev[roleId] || []), newAnswerObj]
              }));
              break;
            }
          }
        }

        // Update the main answers state so the review modal shows the correct value
        setAnswers(prev => ({ ...prev, [questionId]: apiAnswerData }));
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const getAnswerId = (questionId: string): string | undefined => {
    // Check common answers first
    const commonAnswer = commonAnswers.find(a => a.question_id === questionId);
    if (commonAnswer) return commonAnswer.id;
    
    // Check role-specific answers
    for (const [roleId, answers] of Object.entries(roleAnswers)) {
      const roleAnswer = answers.find(a => a.question_id === questionId);
      if (roleAnswer) return roleAnswer.id;
    }
    
    return undefined;
  };

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
        const selectedOption = question.data.options.find(opt => opt.id === answer);
        return selectedOption ? selectedOption.text : String(answer);
      
      case "MultiSelect":
      case "Ranking":
        if (Array.isArray(answer)) {
          const selectedOptions = question.data.options
            .filter(opt => answer.includes(opt.id))
            .map(opt => opt.text);
          return selectedOptions.length > 0 ? selectedOptions.join(", ") : "No selections";
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
      await submitApplication(applicationId);
      alert('Application submitted successfully!');
      setShowSubmitDialog(false);
      // Optionally redirect or update UI
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: QuestionResponse) => {
    const options = (q.question_type === "MultiChoice" || q.question_type === "MultiSelect" || q.question_type === "DropDown" || q.question_type === "Ranking")
      ? (q.data.options.map((o) => ({ id: o.id, label: o.text })) ?? [])
      : [];
    const idStr = String(q.id);

    switch (q.question_type) {
      case "ShortAnswer":
        return (
          <ShortAnswer
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            defaultValue={(answers[idStr] as string) ?? ""}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
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
            defaultValue={answers[idStr] as string | number | undefined}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
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
            defaultValue={(answers[idStr] as Array<string | number>) ?? []}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
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
            defaultValue={(answers[idStr] as Array<string | number>) ?? []}
            onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
            answerId={getAnswerId(idStr)}
          />
        );
      default:
        return null;
    }
  };

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign data...</p>
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