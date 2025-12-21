import { CampaignRole } from "@/models/campaign";
import { Question, QuestionAndAnswer } from "@/models/question";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { getAllRoleAnswers, getAllCommonAnswers, updateAnswer, createAnswer  } from "@/models/answer";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import ShortAnswer from "./questions/shortanswer";
import Dropdown from "./questions/dropdown";
import MultiC from "./questions/dropdown";
import Multichoice from "./questions/multichoice";
import MultiSelect from "./questions/multiselect";
import Ranking from "./questions/ranking";
import { buildAnswerPayload } from "@/lib/utils";
import ReviewCard from "./reviewcard"

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
  updateRoleAnswers: (roleId:string, newQA:QuestionAndAnswer) => void;
//   activeRoleId: string;
}) {
    const [questionsAndAnswers, setQuestionsAndAnswers] =
    useState<QuestionAndAnswer[]>([]);

    const generalTab = activeTab === "general"
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
      question: any,
      value: unknown,
      applicationId: string,
      answerId: string | undefined
    ):Promise<any>  =>  {
      const updatedQA: QuestionAndAnswer = {
        ...question,
        answer: value,
      };

      updateRoleAnswers(activeTab, updatedQA);
      const payload = buildAnswerPayload(question, value);
      if (answerId) {
        return updateAnswer(answerId, payload);
      }

      return createAnswer(applicationId, payload);
    }

    useEffect(() => {
      if (!questions || !answers) return;
      const linked = linkQuestionsAndAnswers(questions, answers)
      setQuestionsAndAnswers(linked);
    }, [questions, answers]);

    const renderQuestion = (q:QuestionAndAnswer, idx:number) => {
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
                <p>No questions</p>
              ) : (
                questionsAndAnswers.map((qa, idx) => (
                  <div key={qa.question_id}>
                    {renderQuestion(qa, idx)}
                  </div>
                ))
              )}
            </div>
        </div>
    )
}