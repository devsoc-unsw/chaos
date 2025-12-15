import { CampaignRole } from "@/models/campaign";
import { Question, QuestionAndAnswer } from "@/models/question";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { getAllRoleAnswers, getAllCommonAnswers, updateAnswer, createAnswer  } from "@/models/answer";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import ShortAnswer from "./questions/shortanswer";
import Dropdown from "./questions/dropdown";
import MultiC from "./questions/dropdown";
import Multichoice from "./questions/multichoice";
import MultiSelect from "./questions/multiselect";
import Ranking from "./questions/ranking";
import { buildAnswerPayload } from "@/lib/utils";

export default function MainContent({
  campaignId,
  applicationId,
  activeTab,
  dict
}: {
  campaignId: string;
  applicationId: string;
  activeTab: string;
  dict: any;
//   activeRoleId: string;
}) {
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

    const submitAnswer = async (
      question: any,
      value: unknown,
      applicationId: string,
      answerId: string | undefined
    ):Promise<any>  =>  {
      const payload = buildAnswerPayload(question, value);
      console.log(payload)
      if (answerId) {
        return updateAnswer(answerId, payload);
      }

      return createAnswer(applicationId, payload);
    }
    const questionsAndAnswers = useMemo(() => {
        if (!questions || !answers) return [];
        return linkQuestionsAndAnswers(questions, answers);
    }, [questions, answers]);

    console.log(questionsAndAnswers);

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

    console.log(applicationId, activeTab)
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
            {/* <pre>
              {JSON.stringify(questionsAndAnswers, null, 2)}
            </pre> */}
        </div>
    )
}