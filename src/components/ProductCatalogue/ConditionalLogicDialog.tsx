
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
import { v4 as uuidv4 } from 'uuid';

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
  entity_type: string;
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  dependent_question?: Question;
};

type ConditionalLogicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'question' | 'section';
  entity: Question | Section;
  questions: Question[];
  answerOptions: {[key: string]: AnswerOption[]};
  existingLogic: ConditionalLogic[];
  onLogicUpdated: () => void;
};

const ConditionalLogicDialog: React.FC<ConditionalLogicDialogProps> = ({
  open,
  onOpenChange,
  entityType,
  entity,
  questions,
  answerOptions,
  existingLogic,
  onLogicUpdated
}) => {
  const [selectedDependentQuestion, setSelectedDependentQuestion] = useState('');
  const [selectedAnswerValue, setSelectedAnswerValue] = useState('');
  const [conditionType, setConditionType] = useState<'is'|'is_not'>('is');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const filteredQuestions = questions.filter(q => 
      (entityType === 'section' || q.id !== (entity as Question).id) && 
      (q.type === 'select' || q.type === 'multiple_choice' || q.type === 'boolean')
    );
    setAvailableQuestions(filteredQuestions);
  }, [entity, questions, entityType]);

  const handleAddLogic = async () => {
    if (!selectedDependentQuestion || !selectedAnswerValue) {
      toast.error('Please select a question and answer value');
      return;
    }

    const logicPayload = {
      id: uuidv4(),
      entity_type: entityType,
      dependent_question_id: selectedDependentQuestion,
      dependent_answer_value: selectedAnswerValue,
      not_condition: conditionType === 'is_not',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      question_id: entityType === 'question' ? (entity as Question).id : null,
      section_id: entityType === 'section' ? (entity as Section).id : null
    };

    const { error } = await supabase
      .from('conditional_logic')
      .insert(logicPayload);

    if (error) {
      toast.error('Failed to add conditional logic');
      console.error(error);
      return;
    }

    toast.success('Conditional logic added successfully');
    resetForm();
    onLogicUpdated();
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

  const getEntityName = () => {
    if (entityType === 'question') {
      const question = entity as Question;
      return `${question.short_id ? `[${question.short_id}] ` : ''}${question.text}`;
    } else {
      const section = entity as Section;
      return section.title;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Conditional Logic for {entityType === 'question' ? 'Question' : 'Section'}: {getEntityName()}
          </DialogTitle>
          <DialogDescription>
            Set when this {entityType} should be displayed based on answers to questions
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
                  {entityType === 'section' ? 'Add section logic' : 'Add Condition'}
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
