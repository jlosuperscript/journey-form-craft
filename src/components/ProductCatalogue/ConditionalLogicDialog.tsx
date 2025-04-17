import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  banner_message?: string;
};
type ConditionalLogicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'question' | 'section';
  entity: Question | Section;
  questions: Question[];
  answerOptions: {
    [key: string]: AnswerOption[];
  };
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
  const [conditionType, setConditionType] = useState<'is' | 'is_not'>('is');
  const [bannerMessage, setBannerMessage] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [currentBannerMessage, setCurrentBannerMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  useEffect(() => {
    const filteredQuestions = questions.filter(q => (entityType === 'section' || q.id !== (entity as Question).id) && (q.type === 'select' || q.type === 'multiple_choice' || q.type === 'boolean'));
    setAvailableQuestions(filteredQuestions);

    // Initialize banner message from existing logic
    if (entityType === 'section' && existingLogic.length > 0) {
      for (const logic of existingLogic) {
        if (logic.banner_message) {
          setCurrentBannerMessage(logic.banner_message);
          setBannerMessage(logic.banner_message);
          break;
        }
      }
    }
  }, [entity, questions, entityType, existingLogic]);
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
      banner_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      question_id: entityType === 'question' ? (entity as Question).id : null,
      section_id: entityType === 'section' ? (entity as Section).id : null
    };
    const {
      error
    } = await supabase.from('conditional_logic').insert(logicPayload);
    if (error) {
      toast.error('Failed to add conditional logic');
      console.error(error);
      return;
    }
    toast.success('Conditional logic added successfully');
    resetConditionForm();
    setIsAddingCondition(false);
    onLogicUpdated();
  };
  const handleDeleteLogic = async (logicId: string) => {
    const {
      error
    } = await supabase.from('conditional_logic').delete().eq('id', logicId);
    if (error) {
      toast.error('Failed to delete conditional logic');
      console.error(error);
      return;
    }
    toast.success('Conditional logic removed');
    onLogicUpdated();
  };
  const handleSaveChanges = async () => {
    // If there are existing logic rules and we're dealing with a section
    if (entityType === 'section') {
      // Update banner message in all existing logic entries for this section
      for (const logic of existingLogic) {
        const {
          error
        } = await supabase.from('conditional_logic').update({
          banner_message: bannerMessage
        }).eq('id', logic.id);
        if (error) {
          toast.error('Failed to update banner message');
          console.error(error);
          return;
        }
      }

      // If there's no logic but we want to save a banner message, create a default logic
      if (existingLogic.length === 0 && bannerMessage) {
        const defaultLogicPayload = {
          id: uuidv4(),
          entity_type: 'section',
          dependent_question_id: null,
          dependent_answer_value: null,
          not_condition: false,
          banner_message: bannerMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          section_id: (entity as Section).id
        };
        const {
          error
        } = await supabase.from('conditional_logic').insert(defaultLogicPayload);
        if (error) {
          toast.error('Failed to create banner message');
          console.error(error);
          return;
        }
      }
    }
    toast.success('Changes saved successfully');
    setCurrentBannerMessage(bannerMessage);
    setHasUnsavedChanges(false);
    onLogicUpdated();
    onOpenChange(false);
  };
  const resetConditionForm = () => {
    setSelectedDependentQuestion('');
    setSelectedAnswerValue('');
    setConditionType('is');
  };
  const resetAllChanges = () => {
    resetConditionForm();
    setBannerMessage(currentBannerMessage);
    setHasUnsavedChanges(false);
    setIsAddingCondition(false);
  };
  const getAnswerOptionsForQuestion = (questionId: string) => {
    const options = answerOptions[questionId] || [];
    const questionType = questions.find(q => q.id === questionId)?.type;
    if (questionType === 'boolean') {
      return [{
        id: 'yes',
        value: 'yes',
        text: 'Yes'
      }, {
        id: 'no',
        value: 'no',
        text: 'No'
      }];
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
  useEffect(() => {
    if (bannerMessage !== currentBannerMessage) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [bannerMessage, currentBannerMessage]);
  return <Dialog open={open} onOpenChange={newOpen => {
    if (!newOpen && hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onOpenChange(newOpen);
      }
    } else {
      onOpenChange(newOpen);
    }
  }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Conditional Logic for {entityType === 'question' ? 'Question' : 'Section'}: {getEntityName()}
          </DialogTitle>
          <DialogDescription>
            Set when this {entityType} should be displayed based on answers to questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {entityType === 'section' && <div className="space-y-2">
              <h3 className="text-sm font-medium">Warning Banner:</h3>
              <div className="space-y-2">
                <Textarea placeholder="This section is only visible when specific conditions are met..." value={bannerMessage} onChange={e => setBannerMessage(e.target.value)} className="resize-none" />
                <p className="text-xs text-gray-500">
                  This message will be shown when the section is hidden due to conditions not being met.
                </p>
              </div>
            </div>}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Conditions:</h3>
              <Button variant="outline" size="sm" onClick={() => setIsAddingCondition(true)} className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </div>

            {existingLogic.length > 0 ? <div className="space-y-2">
                {existingLogic.map(logic => {
              const dependentQuestion = questions.find(q => q.id === logic.dependent_question_id);
              return <div key={logic.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex flex-col">
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
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteLogic(logic.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>;
            })}
              </div> : <div className="text-sm text-gray-500 p-4 text-center border border-dashed rounded-md">
                No conditions set yet. Add a condition to determine when this {entityType} should be visible.
              </div>}

            {isAddingCondition && <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                <h4 className="text-sm font-semibold">Add New Condition</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm">Question</label>
                    <Select value={selectedDependentQuestion} onValueChange={value => {
                  setSelectedDependentQuestion(value);
                  setSelectedAnswerValue('');
                }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableQuestions.map(q => <SelectItem key={q.id} value={q.id}>
                            {q.short_id ? `[${q.short_id}] ` : ''}{q.text}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDependentQuestion && <>
                      <div>
                        <label className="block mb-2 text-sm">Condition</label>
                        <Select value={conditionType} onValueChange={value => setConditionType(value as 'is' | 'is_not')}>
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
                        <Select value={selectedAnswerValue} onValueChange={setSelectedAnswerValue}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an answer value" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAnswerOptionsForQuestion(selectedDependentQuestion).map(option => <SelectItem key={option.id} value={option.value}>
                                {option.text}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </>}

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={() => {
                  resetConditionForm();
                  setIsAddingCondition(false);
                }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddLogic}>
                      Add Condition
                    </Button>
                  </div>
                </div>
              </div>}
          </div>
        </div>

        <DialogFooter className="flex justify-between border-t pt-4 mt-4">
          <Button variant="ghost" onClick={resetAllChanges}>
            Reset
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={!hasUnsavedChanges && existingLogic.length === 0}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default ConditionalLogicDialog;