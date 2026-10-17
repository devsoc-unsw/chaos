'use client';

import {
  AnswerValue,
  QuestionAndAnswer,
} from '@/models/question';
import ShortAnswer from './questions/shortanswer';
import Dropdown from './questions/dropdown';
import Multichoice from './questions/multichoice';
import MultiSelect from './questions/multiselect';
import Ranking from './questions/ranking';

export type SubmitAnswerFn = (
  question: QuestionAndAnswer,
  value: AnswerValue,
  applicationId: string,
  answerId: string | undefined,
) => Promise<void>;

export default function MainContent({
  applicationId,
  activeTab,
  dict,
  tabQuestions,
  submitAnswer,
}: {
  applicationId: string;
  activeTab: string;
  dict: any;
  tabQuestions: QuestionAndAnswer[];
  submitAnswer: SubmitAnswerFn;
}) {
  
  const renderQuestion = (q: QuestionAndAnswer) => {
    switch (q.question_type) {
      case 'ShortAnswer':
        return (
          <ShortAnswer
            question={q}
            applicationId={applicationId}
            answerId={q.answer_id}
            submitAnswer={submitAnswer}
            dict={dict}
          />
        );
      case 'DropDown':
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
      case 'MultiChoice':
        return (
          <Multichoice
            question={q}
            applicationId={applicationId}
            answerId={q.answer_id}
            submitAnswer={submitAnswer}
            dict={dict}
          />
        );
      case 'MultiSelect':
        return (
          <MultiSelect
            question={q}
            applicationId={applicationId}
            answerId={q.answer_id}
            submitAnswer={submitAnswer}
            dict={dict}
          />
        );
      case 'Ranking':
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
        return <p>{JSON.stringify(q, null, 2)}</p>;
    }
  };

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-4">
        {tabQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dict.applicationpage.no_questions}
          </p>
        ) : (
          tabQuestions.map((qa) => (
            <div key={qa.question_id}>{renderQuestion(qa)}</div>
          ))
        )}
      </div>
    </div>
  );
}
