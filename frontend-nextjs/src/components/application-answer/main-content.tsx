"use client"

import { AnswerValue, MultiOptionQuestionOption, QuestionAndAnswer } from "@/models/question";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { getAllRoleAnswers, getAllCommonAnswers, updateAnswer, createAnswer, deleteAnswer  } from "@/models/answer";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import ShortAnswer from "./questions/shortanswer";
import Dropdown from "./questions/dropdown";
import Multichoice from "./questions/multichoice";
import MultiSelect from "./questions/multiselect";
import Ranking from "./questions/ranking";
import { buildAnswerPayload } from "@/lib/utils";
import { toast } from "sonner";

export default function MainContent({
  campaignId,
  applicationId,
  activeTab,
  dict,
  updateRoleAnswers,
  qaByRole
}: {
  campaignId: string;
  applicationId: string;
  activeTab: string;
  dict: any;
  updateRoleAnswers: (newQA:QuestionAndAnswer) => void;
  qaByRole?: Map<string, QuestionAndAnswer[]>;
}) {
    const generalTab = activeTab === "general"
    const queryClient = useQueryClient()
    const { data: questions } = useQuery({
    queryKey: generalTab
      ? [`${campaignId}-common-questions`]
      : [`${campaignId}-${activeTab}-role-questions`],
      queryFn: () =>
      generalTab
        ? getAllCommonQuestions(campaignId)
        : getAllRoleQuestions(campaignId, activeTab),
    });

    const { data: answers } = useQuery({
    queryKey: generalTab
      ? [`${applicationId}-common-answers`]
      : [`${applicationId}-${activeTab}-role-answers`],
      queryFn: () =>
      generalTab
        ? getAllCommonAnswers(applicationId)
        : getAllRoleAnswers(applicationId, activeTab),
    });

    const questionsAndAnswers =
      qaByRole?.has(activeTab)
        ? (qaByRole.get(activeTab) ?? [])
        : (questions && answers ? linkQuestionsAndAnswers(questions, answers) : []);
  
    // submits answer to a question
    const resyncQuestionFromServer = async (question: QuestionAndAnswer) => {
      const answersKey = generalTab
        ? [`${applicationId}-common-answers`]
        : [`${applicationId}-${activeTab}-role-answers`];
      const questionsKey = generalTab
        ? [`${campaignId}-common-questions`]
        : [`${campaignId}-${activeTab}-role-questions`];

      await queryClient.invalidateQueries({ queryKey: answersKey });

      const [qs, ans] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: questionsKey,
          queryFn: () =>
            generalTab
              ? getAllCommonQuestions(campaignId)
              : getAllRoleQuestions(campaignId, activeTab),
        }),
        queryClient.fetchQuery({
          queryKey: answersKey,
          queryFn: () =>
            generalTab
              ? getAllCommonAnswers(applicationId)
              : getAllRoleAnswers(applicationId, activeTab),
        }),
      ]);

      const fresh = linkQuestionsAndAnswers(qs, ans).find(
        (q) => q.question_id === question.question_id
      );
      updateRoleAnswers(fresh ?? question);
    };

    const submitAnswer = async (
      question: QuestionAndAnswer,
      value: AnswerValue,
      applicationId: string,
      answerId: string | undefined
    ):Promise<void>  =>  {
      const effectiveAnswerId = answerId ?? question.answer_id;
      const updatedQA: QuestionAndAnswer = {
        ...question,
        answer: value,
      };

      let payload;
      try {
        payload = buildAnswerPayload(question, value);
      } catch (err) {
        console.error("Failed to build answer payload", err);
        toast.error("Failed to submit answer");
        return;
      }

      try {
        // HANDLE EMPTY QUESTION
        if (payload.answer_data === null) {
          if (effectiveAnswerId) {
            await deleteAnswer(effectiveAnswerId);
            if (generalTab) {
              await queryClient.invalidateQueries({
                queryKey: [`${applicationId}-common-answers`]
              });
            } else {
              await queryClient.invalidateQueries({
                queryKey: [`${applicationId}-${activeTab}-role-answers`]
              })
            }
          }
          const deletedQA: QuestionAndAnswer = {
            ...question,
            answer_id: undefined,
            answer: "No Answer",
          };
          updateRoleAnswers(deletedQA);
          return
        }

        if (effectiveAnswerId) {
          await updateAnswer(effectiveAnswerId, payload);
          updateRoleAnswers(updatedQA);
        } else {
          const created = await createAnswer(applicationId, payload);
          updateRoleAnswers({ ...updatedQA, answer_id: String(created.id) });
        }
      } catch (err) {
        if (!effectiveAnswerId) {
          try {
            const answers = generalTab
              ? await getAllCommonAnswers(applicationId)
              : await getAllRoleAnswers(applicationId, activeTab);
            const found = answers.find(
              (a) => String(a.question_id) === String(question.question_id)
            );
            if (found) {
              await updateAnswer(found.id, payload);
              updateRoleAnswers({ ...updatedQA, answer_id: String(found.id) });
              return;
            }
          } catch (recoveryErr) {
            console.error("Recovery update failed:", recoveryErr);
          }
        }

        console.error("Failed to submit answer", err);
        toast.error("Failed to submit answer");
        try {
          await resyncQuestionFromServer(question);
        } catch (resyncErr) {
          console.error("Failed to resync answer from server", resyncErr);
          updateRoleAnswers(question);
        }
      }
    }

    // useEffect(() => {
    //   if (!questions || !answers) {
    //     return;
    //   }
    //   const linked = linkQuestionsAndAnswers(questions, answers)
    //   setQuestionsAndAnswers(linked);
    // }, [questions, answers]);

    const renderQuestion = (q:QuestionAndAnswer) => {
      switch (q.question_type) {
        case "ShortAnswer":
          return (
            <ShortAnswer
              question={q}
              applicationId={applicationId}
              answerId={q.answer_id}
              submitAnswer={submitAnswer}
              dict={dict}
            />
          );
        case "DropDown":
          return (
            <Dropdown
              question={q}
              applicationId={applicationId}
              answerId={q.answer_id}
              submitAnswer={submitAnswer}
              dict={dict}
              activeTab={activeTab}
            />
          );
        case "MultiChoice":
          return (
            <Multichoice
              question={q}
              applicationId={applicationId}
              answerId={q.answer_id}
              submitAnswer={submitAnswer}
              dict={dict}
            />
          );
        case "MultiSelect":
          return (
            <MultiSelect
              question={q}
              applicationId={applicationId}
              answerId={q.answer_id}
              submitAnswer={submitAnswer}
              dict={dict}
            />
          );
        case "Ranking":
          return (
            <Ranking
              question={q}
              applicationId={applicationId}
              answerId={q.answer_id}
              submitAnswer={submitAnswer}
              dict={dict}
            />
          );
        default:
          return (
            <p>
              {JSON.stringify(q, null, 2)}
            </p>
          );
      }
    };

    return (
        <div className="mb-6 rounded-xl border bg-card p-4 sm:p-6">
            <div className="space-y-4">
              {questionsAndAnswers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dict.applicationpage.no_questions}</p>
              ) : (
                questionsAndAnswers.map((qa) => (
                  <div key={qa.question_id}>
                    {renderQuestion(qa)}
                  </div>
                ))
              )}
            </div>
        </div>
    )
}