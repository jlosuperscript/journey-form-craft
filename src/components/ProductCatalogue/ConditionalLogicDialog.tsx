
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order_index: number;
  short_id?: string;
};

type Section = {
  id: string;
  title: string;
  order_index: number;
};

type AnswerOption = {
  id: string;
  question_id: string;
  text: string;
  value: string;
  order_index: number;
};

type ConditionalLogic = {
  id: string;
  question_id?: string;
  section_id?: string;
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  dependent_question?: Question;
};

type ConditionalLogicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question;
  section?: Section;
  questions: Question[];
  answerOptions: {[key: string]: AnswerOption[]};
  existingLogic: ConditionalLogic[];
  onLogicUpdated: () => void;
};

const ConditionalLogicDialog: React.FC<ConditionalLogicDialogProps> = ({
  open,
  onOpenChange,
  question,
  section,
  questions,
  answerOptions,
  existingLogic,
  onLogicUpdated
}) => {
  const [selectedDependentQuestion, setSelectedDependentQuestion] = useState('');
  const [selectedAnswerValue, setSelectedAnswerValue] = useState('');
  const [conditionType, setConditionType] = useState<'is'|'is_not'>('is');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  
  const isSection = !!section;
  const targetId = isSection ? section.id : question?.id;
  const targetName = isSection ? section.title : question?.text;
  const targetShortId = isSection ? null : question?.short_id;

  useEffect(() => {
    // Filter out current question (if applicable) and questions without answer options
    let filteredQuestions = questions.filter(q => 
      (isSection || q.id !== question?.id) && 
      (q.type === 'select' || q.type === 'multiple_choice' || q.type === 'boolean')
    );
    setAvailableQuestions(filteredQuestions);
  }, [question, section, questions, isSection]);

  const handleAddLogic = async () => {
    if (!selectedDependentQuestion || !selectedAnswerValue) {
      toast.error('Please select a question and answer value');
      return;
    }

    try {
      // For sections, we need to handle section_id
      if (isSection && targetId) {
        const { error } = await supabase
          .from('conditional_logic')
          .insert({
            section_id: targetId,
            dependent_question_id: selectedDependentQuestion,
            dependent_answer_value: selectedAnswerValue,
            not_condition: conditionType === 'is_not',
            question_id: null
          });

        if (error) {
          toast.error('Failed to add conditional logic');
          console.error(error);
          return;
        }
      } 
      // For questions, we handle question_id
      else if (!isSection && targetId) {
        const { error } = await supabase
          .from('conditional_logic')
          .insert({
            question_id: targetId,
            dependent_question_id: selectedDependentQuestion,
            dependent_answer_value: selectedAnswerValue,
            not_condition: conditionType === 'is_not',
            section_id: null
          });

        if (error) {
          toast.error('Failed to add conditional logic');
          console.error(error);
          return;
        }
      }

      toast.success('Conditional logic added successfully');
      resetForm();
      onLogicUpdated();
    } catch (error) {
      console.error('Error adding conditional logic:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteLogic = async (logicId: string) => {
    const { error } = await supabase
      .from('conditional_logic')
      .delete()
      .eq('id', logicId);

    if (error) {
      toast.error('Failed to delete conditional logic');
      console.error(error);
      return;
    }

    toast.success('Conditional logic removed');
    onLogicUpdated();
  };

  const resetForm = () => {
    setSelectedDependentQuestion('');
    setSelectedAnswerValue('');
    setConditionType('is');
  };

  const getAnswerOptionsForQuestion = (questionId: string) => {
    const options = answerOptions[questionId] || [];
    const questionType = questions.find(q => q.id === questionId)?.type;
    
    if (questionType === 'boolean') {
      return [
        { id: 'yes', value: 'yes', text: 'Yes' },
        { id: 'no', value: 'no', text: 'No' }
      ];
    }
    
    return options;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Conditional Logic for {isSection ? 'Section: ' : ''}{targetShortId ? `[${targetShortId}] ` : ''}{targetName}
          </DialogTitle>
          <DialogDescription>
            Set when this {isSection ? 'section' : 'question'} should be displayed based on answers to other questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {existingLogic.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Existing Conditions:</h3>
              {existingLogic.map((logic) => {
                const dependentQuestion = questions.find(q => q.id === logic.dependent_question_id);
                return (
                  <div key={logic.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="text-sm">
                      Show when{" "}
                      <span className="font-medium">
                        {dependentQuestion?.short_id ? `[${dependentQuestion.short_id}] ` : ''}
                        {dependentQuestion?.text}
                      </span>
                      {" "}
                      <span className="font-medium">
                        {logic.not_condition ? "is not" : "is"}
                      </span>
                      {" "}
                      <span className="font-medium">"{logic.dependent_answer_value}"</span>
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteLogic(logic.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Add New Condition:</h3>
            
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
                    {availableQuestions.map((q) => (
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
                        {getAnswerOptionsForQuestion(selectedDependentQuestion).map((option) => (
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
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Reset
                </Button>
                <Button onClick={handleAddLogic}>
                  Add Condition
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionalLogicDialog;
