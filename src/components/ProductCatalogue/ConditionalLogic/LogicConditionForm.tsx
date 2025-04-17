
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Question } from "@/hooks/useQuestions";
import { getAnswerOptionsForQuestion } from "./utils";

type LogicConditionFormProps = {
  questions: Question[];
  answerOptions: { [key: string]: any };
  onAddLogic: (
    dependentQuestionId: string,
    answerValue: string,
    conditionType: "is" | "is_not"
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

  const handleAddLogic = async () => {
    if (!selectedDependentQuestion || !selectedAnswerValue) {
      return;
    }
    
    await onAddLogic(selectedDependentQuestion, selectedAnswerValue, conditionType);
    
    // Reset form
    setSelectedDependentQuestion('');
    setSelectedAnswerValue('');
    setConditionType('is');
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
                  <SelectItem value="is">is</SelectItem>
                  <SelectItem value="is_not">is not</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 text-sm">Answer Value</label>
              <Select
                value={selectedAnswerValue}
                onValueChange={setSelectedAnswerValue}
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
          </>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddLogic}
            disabled={!selectedDependentQuestion || !selectedAnswerValue}
          >
            Add Condition
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LogicConditionForm;
