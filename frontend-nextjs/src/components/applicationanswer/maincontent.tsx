import { CampaignRole } from "@/models/campaign";
import { Question } from "@/models/question";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { getAllRoleAnswers, getAllCommonAnswers  } from "@/models/answer";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import ShortAnswer from "./questions/shortanswer";

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

    const questionsAndAnswers = useMemo(() => {
        if (!questions || !answers) return [];
        return linkQuestionsAndAnswers(questions, answers);
    }, [questions, answers]);

    const renderQuestion = (q:any, idx:number) => {
      // const options = (q.question_type === "MultiChoice" || q.question_type === "MultiSelect" || q.question_type === "DropDown" || q.question_type === "Ranking")
      //   ? ((q.data?.options ?? []).map((o) => ({ id: o.id, label: o.text })) ?? [])
      //   : [];
      // const idStr = String(q.id);

      switch (q.question_type) {
        case "ShortAnswer":
          return (
            <ShortAnswer
              question={q}
              dict={dict}
            />
          );
        // case "DropDown":
        //   return (
        //     <Dropdown
        //       key={idStr}
        //       id={idStr}
        //       question={q.title}
        //       description={q.description}
        //       required={q.required}
        //       options={options}
        //       defaultValue={answers[idStr] as string | number | undefined}
        //       onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
        //       answerId={getAnswerId(idStr)}
        //     />
        //   );
        // case "MultiChoice":
        //   return (
        //     <MultiChoice
        //       key={idStr}
        //       id={idStr}
        //       question={q.title}
        //       description={q.description}
        //       required={q.required}
        //       options={options}
        //       defaultValue={answers[idStr] as string | number | undefined}
        //       onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
        //       answerId={getAnswerId(idStr)}
        //     />
        //   );
        // case "MultiSelect":
        //   return (
        //     <MultiSelect
        //       key={idStr}
        //       id={idStr}
        //       question={q.title}
        //       description={q.description}
        //       required={q.required}
        //       options={options}
        //       defaultValue={(answers[idStr] as Array<string | number>) ?? []}
        //       onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
        //       answerId={getAnswerId(idStr)}
        //     />
        //   );
        // case "Ranking":
        //   return (
        //     <Ranking
        //       key={idStr}
        //       id={idStr}
        //       question={q.title}
        //       description={q.description}
        //       required={q.required}
        //       options={options}
        //       defaultValue={(answers[idStr] as Array<string | number>) ?? []}
        //       onSubmit={(qid, val) => submitAnswer(qid, val, q.question_type)}
        //       answerId={getAnswerId(idStr)}
        //     />
        //   );
        default:
          return null;
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