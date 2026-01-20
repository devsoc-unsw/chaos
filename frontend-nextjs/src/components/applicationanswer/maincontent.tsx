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

export default function MainContent({
  campaignId,
  applicationId,
  activeTab,
  dict,
  updateRoleAnswers
}: {
  campaignId: string;
  applicationId: string;
  activeTab: string;
  dict: any;
  updateRoleAnswers: (newQA:QuestionAndAnswer) => void;
//   activeRoleId: string;
}) {
    const [questionsAndAnswers, setQuestionsAndAnswers] =
    useState<QuestionAndAnswer[]>([]);

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
  
    // submits answer to a question
    const submitAnswer = async (
      question: QuestionAndAnswer,
      value: AnswerValue,
      applicationId: string,
      answerId: string | undefined
    ):Promise<void>  =>  {
      const updatedQA: QuestionAndAnswer = {
        ...question,
        answer: value,
      };

      try {
        const payload = buildAnswerPayload(question, value);

        // HANDLE EMPTY QUESTION
        if (payload.answer_data === null) {
          if (answerId) {
            await deleteAnswer(answerId);
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
        } else {
          if (answerId) {
            await updateAnswer(answerId, payload)
          } else {
            await createAnswer(applicationId, payload)
          }
        }
        updateRoleAnswers(updatedQA);
      } catch (err) {
        console.error("Failed to submit answer", err);
      }
    }

    useEffect(() => {
      if (!questions || !answers) {
        console.log("lolgetfucked")
        return;
      }
      console.log("godstained")
      const linked = linkQuestionsAndAnswers(questions, answers)
      console.log(linked)
      setQuestionsAndAnswers(linked);
    }, [questions, answers]);

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
        <div className="border-b border-gray-200 mb-6 gap-2">
            <div>
              {questionsAndAnswers.length === 0 ? (
                <p>{dict.applicationpage.no_questions}</p>
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