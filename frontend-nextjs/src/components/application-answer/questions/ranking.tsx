import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AnswerValue, MultiOptionQuestionOption, QuestionAndAnswer } from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = '__NO_ANSWER__';

export interface RankedOption {
  id: string,
  display_order: number,
  text: string
}

export default function Ranking({
  question,
  applicationId,
  answerId,
  submitAnswer,
}: {
  question: any;
  dict: any
  applicationId: string;
  answerId?: string;
  submitAnswer: (question: QuestionAndAnswer, value: AnswerValue, applicationId: string, answerId?: string) => Promise<void>;
}) {
  const options: MultiOptionQuestionOption[] = (question as any).options ?? [];

  function reorderOptionsFromAnswer(
    answer: string | string[] | undefined,
    options: MultiOptionQuestionOption[]
  ): MultiOptionQuestionOption[] {
    if (!answer) return options;

    if (Array.isArray(answer)) {
      const ids = answer.map((id) => String(id));
      const ordered: MultiOptionQuestionOption[] = [];
      const used = new Set<string>();

      for (const id of ids) {
        const opt = options.find((o) => String(o.id) === id);
        if (opt) {
          ordered.push(opt);
          used.add(String(opt.id));
        }
      }

      const remaining = options.filter((o) => !used.has(String(o.id)));
      return [...ordered, ...remaining];
    }

    // assign labels to answers for ranking, vibed this cbf
    const labelsInOrder = String(answer)
      .split(",")
      .map((part) => part.trim())
      .map((part) => {
        const dot = part.indexOf(".");
        return dot === -1 ? part : part.slice(dot + 1).trim();
      });

    const ordered: MultiOptionQuestionOption[] = [];
    const used = new Set<string>();

    for (const label of labelsInOrder) {
      const opt = options.find((o) => o.text === label);
      if (opt) {
        ordered.push(opt);
        used.add(String(opt.id));
      }
    }

    const remaining = options.filter((o) => !used.has(String(o.id)));
    return [...ordered, ...remaining];
  }

  const [rankedOptions, setRankedOptions] = useState<RankedOption[]>(
    reorderOptionsFromAnswer(question.answer, options)
  );
  useEffect(() => {
    setRankedOptions(reorderOptionsFromAnswer(question.answer, options));
  }, [question.answer]);


  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(rankedOptions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setRankedOptions(items);
    submitAnswer(question, items.map(opt => String(opt.id)), applicationId, answerId);
  };


  return (
    <div className="mb-6 w-full">
      <div className="flex items-center mb-1">
        <label className="text-lg font-medium ">{question.text}</label>
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </div>

      {question.description && (
        <p className="mb-2 text-sm">{question.description}</p>
      )}


      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="ranking-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {rankedOptions.map((option, index) => (
                <Draggable
                  key={option.id.toString()}
                  draggableId={option.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center p-3 bg-card border-1 w-full max-w-4xl"
                    >
                      <span className="bg-primary-foreground text-foreground rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3 text-sm">
                        {index + 1}
                      </span>
                      <span className="text-foreground flex-1">{option.text}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}