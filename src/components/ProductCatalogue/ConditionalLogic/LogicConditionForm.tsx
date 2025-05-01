
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Question } from "@/hooks/useQuestions";
import { getAnswerOptionsForQuestion } from "./utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type LogicConditionFormProps = {
  questions: Question[];
  answerOptions: { [key: string]: any };
  onAddLogic: (
    dependentQuestionId: string,
    answerValue: string,
    conditionType: "is" | "is_not",
    checkAnswerExistence?: boolean
  ) => Promise<void>;
  onCancel: () => void;
};

const LogicConditionForm: React.FC<LogicConditionFormProps> = ({
  questions,
  answerOptions,
  onAddLogic,
  onCancel,
}) => {
  const [selectedDependentQuestion, setSelectedDependentQuestion] = useState('');
  const [selectedAnswerValue, setSelectedAnswerValue] = useState('');
  const [conditionType, setConditionType] = useState<'is' | 'is_not'>('is');
  const [checkAnswerExistence, setCheckAnswerExistence] = useState(false);

  const handleAddLogic = async () => {
    if (!selectedDependentQuestion) return;
    
    // If we're checking existence, we don't need an answer value
    if (checkAnswerExistence || (selectedAnswerValue && !checkAnswerExistence)) {
      await onAddLogic(
        selectedDependentQuestion, 
        checkAnswerExistence ? "__EXISTS__" : selectedAnswerValue, 
        conditionType,
        checkAnswerExistence
      );
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
      <h4 className="text-sm font-semibold">Add New Condition</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm">Question</label>
          <Select
            value={selectedDependentQuestion}
            onValueChange={(value) => {
              setSelectedDependentQuestion(value);
              setSelectedAnswerValue('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a question" />
            </SelectTrigger>
            <SelectContent>
              {questions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.short_id ? `[${q.short_id}] ` : ''}{q.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDependentQuestion && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="check-existence" 
                checked={checkAnswerExistence} 
                onCheckedChange={(checked) => {
                  setCheckAnswerExistence(checked === true);
                  if (checked) setSelectedAnswerValue('');
                }}
              />
              <Label htmlFor="check-existence">
                Check if question has been answered (instead of checking specific answer)
              </Label>
            </div>

            <div>
              <label className="block mb-2 text-sm">Condition</label>
              <Select
                value={conditionType}
                onValueChange={(value) => setConditionType(value as 'is' | 'is_not')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="is">
                    {checkAnswerExistence ? 'has been answered' : 'is'}
                  </SelectItem>
                  <SelectItem value="is_not">
                    {checkAnswerExistence ? 'has not been answered' : 'is not'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!checkAnswerExistence && (
              <div>
                <label className="block mb-2 text-sm">Answer Value</label>
                <Select
                  value={selectedAnswerValue}
                  onValueChange={setSelectedAnswerValue}
                  disabled={checkAnswerExistence}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an answer value" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAnswerOptionsForQuestion(
                      selectedDependentQuestion,
                      questions,
                      answerOptions
                    ).map((option) => (
                      <SelectItem key={option.id} value={option.value}>
                        {option.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddLogic}
            disabled={!selectedDependentQuestion || (!selectedAnswerValue && !checkAnswerExistence)}
          >
            Add Condition
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LogicConditionForm;
