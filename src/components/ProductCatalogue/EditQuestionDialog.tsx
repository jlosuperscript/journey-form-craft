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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Upload } from 'lucide-react';

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order_index: number;
};

type AnswerOption = {
  id: string;
  question_id: string;
  text: string;
  value: string;
  order_index: number;
};

type EditQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  answerOptions: AnswerOption[];
  onQuestionUpdated: () => void;
};

const EditQuestionDialog: React.FC<EditQuestionDialogProps> = ({ 
  open, 
  onOpenChange,
  question,
  answerOptions,
  onQuestionUpdated
}) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<{text: string, value: string, id?: string}[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [bulkOptions, setBulkOptions] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  
  useEffect(() => {
    if (question) {
      setQuestionText(question.text);
      setQuestionType(question.type);
      setIsRequired(question.required);
      
      if (answerOptions && answerOptions.length > 0) {
        setOptions(answerOptions.map(option => ({
          id: option.id,
          text: option.text,
          value: option.value
        })));
      } else {
        setOptions([]);
      }
    }
  }, [question, answerOptions]);
  
  const needsOptions = questionType === 'select' || questionType === 'multiple_choice';

  const handleSubmit = async () => {
    if (!question) return;
    
    if (!questionText || !questionType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (needsOptions && options.length === 0) {
      toast.error('Please add at least one answer option');
      return;
    }

    const { error: questionError } = await supabase
      .from('questions')
      .update({
        text: questionText,
        type: questionType,
        required: isRequired
      })
      .eq('id', question.id);

    if (questionError) {
      toast.error('Failed to update question');
      console.error(questionError);
      return;
    }

    if (needsOptions) {
      const existingOptionIds = options.filter(o => o.id).map(o => o.id);
      const { error: deleteError } = await supabase
        .from('answer_options')
        .delete()
        .eq('question_id', question.id)
        .not('id', 'in', existingOptionIds.length > 0 ? `(${existingOptionIds.join(',')})` : '(null)');

      if (deleteError) {
        console.error('Failed to delete removed options:', deleteError);
      }

      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        
        if (option.id) {
          const { error: updateError } = await supabase
            .from('answer_options')
            .update({
              text: option.text,
              value: option.value,
              order_index: i
            })
            .eq('id', option.id);

          if (updateError) {
            console.error('Failed to update option:', updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('answer_options')
            .insert({
              question_id: question.id,
              text: option.text,
              value: option.value,
              order_index: i
            });

          if (insertError) {
            console.error('Failed to insert new option:', insertError);
          }
        }
      }
    }

    toast.success('Question updated successfully');
    onOpenChange(false);
    onQuestionUpdated();
  };

  const addAnswerOption = () => {
    if (!newOptionText.trim()) return;
    
    setOptions([
      ...options, 
      { 
        text: newOptionText, 
        value: newOptionText.toLowerCase().replace(/\s+/g, '_') 
      }
    ]);
    setNewOptionText('');
  };

  const removeAnswerOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleBulkOptionsAdd = () => {
    if (!bulkOptions.trim()) return;
    
    const optionsArray = bulkOptions
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => ({
        text: line.trim(),
        value: line.trim().toLowerCase().replace(/\s+/g, '_')
      }));
    
    setOptions([...options, ...optionsArray]);
    setBulkOptions('');
    setShowBulkInput(false);
  };

  const toggleBulkInput = () => {
    setShowBulkInput(!showBulkInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Modify your existing question
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block mb-2">Question Text</label>
            <Input 
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question"
            />
          </div>

          <div>
            <label className="block mb-2">Question Type</label>
            <Select 
              value={questionType} 
              onValueChange={setQuestionType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="select">Dropdown Select</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block">Answer Options</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={toggleBulkInput}
                >
                  {showBulkInput ? "Add Single Option" : "Add Multiple Options"}
                </Button>
              </div>
              
              {!showBulkInput ? (
                <div className="flex space-x-2">
                  <Input 
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Add answer option"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addAnswerOption}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea 
                    value={bulkOptions}
                    onChange={(e) => setBulkOptions(e.target.value)}
                    placeholder="Enter multiple options, one per line"
                    className="min-h-[100px]"
                  />
                  <Button 
                    type="button" 
                    onClick={handleBulkOptionsAdd}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add All Options
                  </Button>
                </div>
              )}
              
              {options.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Added Options ({options.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{option.text}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeAnswerOption(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="required"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked === true)}
            />
            <label htmlFor="required">
              Is this question required?
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Update Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionDialog;
