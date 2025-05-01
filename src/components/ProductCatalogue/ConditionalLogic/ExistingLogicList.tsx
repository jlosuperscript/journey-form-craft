
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Question } from "@/hooks/useQuestions";
import { ConditionalLogic } from './types';

type ExistingLogicListProps = {
  existingLogic: ConditionalLogic[];
  questions: Question[];
  onDeleteLogic: (logicId: string) => Promise<void>;
};

const ExistingLogicList: React.FC<ExistingLogicListProps> = ({ 
  existingLogic,
  questions,
  onDeleteLogic
}) => {
  if (existingLogic.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 text-center border border-dashed rounded-md">
        No conditions set yet. Add a condition to determine when this item should be visible.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {existingLogic.map(logic => {
        const dependentQuestion = questions.find(q => q.id === logic.dependent_question_id);
        
        // Special handling for existence checks
        const isExistenceCheck = logic.check_answer_existence || logic.dependent_answer_value === "__EXISTS__";
        
        return (
          <div key={logic.id} className="flex items-center justify-between p-2 border rounded-md">
            <div className="flex flex-col">
              <span className="text-sm">
                Show when{" "}
                <span className="font-medium">
                  {dependentQuestion?.short_id ? `[${dependentQuestion.short_id}] ` : ''}
                  {dependentQuestion?.text}
                </span>
                {" "}
                <span className="font-medium">
                  {isExistenceCheck 
                    ? (logic.not_condition ? "has not been answered" : "has been answered")
                    : (logic.not_condition ? "is not" : "is")}
                </span>
                {" "}
                {!isExistenceCheck && (
                  <span className="font-medium">"{logic.dependent_answer_value}"</span>
                )}
              </span>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => onDeleteLogic(logic.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default ExistingLogicList;
