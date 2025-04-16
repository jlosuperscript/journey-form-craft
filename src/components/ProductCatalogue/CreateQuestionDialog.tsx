
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
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Section } from '@/hooks/useQuestions';
import { v4 as uuidv4 } from 'uuid';

type CreateQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  onQuestionCreated: () => void;
};

const CreateQuestionDialog: React.FC<CreateQuestionDialogProps> = ({ 
  open, 
  onOpenChange,
  sections,
  onQuestionCreated
}) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [isRequired, setIsRequired] = useState(true); // Set required to true by default
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [answerOptions, setAnswerOptions] = useState<{text: string, value: string}[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [bulkOptions, setBulkOptions] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  
  const needsOptions = questionType === 'select' || questionType === 'multiple_choice';

  // Reset form when dialog is opened
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!questionText || !questionType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (needsOptions && answerOptions.length === 0) {
      toast.error('Please add at least one answer option');
      return;
    }

    // Get the highest order_index to place this question at the end
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    if (fetchError) {
      toast.error('Failed to prepare for question creation');
      console.error(fetchError);
      return;
    }

    const highestOrderIndex = existingQuestions && existingQuestions.length > 0 
      ? existingQuestions[0].order_index 
      : -1;

    // Generate a new question ID
    const questionId = uuidv4();

    // Insert question
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert({
        id: questionId,
        text: questionText,
        type: questionType,
        required: isRequired,
        order_index: highestOrderIndex + 1,
        section_id: sectionId
      })
      .select();

    if (questionError) {
      toast.error('Failed to create question');
      console.error(questionError);
      return;
    }

    // Insert answer options if needed
    if (needsOptions) {
      const optionsToInsert = answerOptions.map((option, index) => ({
        question_id: questionId,
        text: option.text,
        value: option.value,
        order_index: index
      }));

      const { error: optionsError } = await supabase
        .from('answer_options')
        .insert(optionsToInsert);

      if (optionsError) {
        toast.error('Failed to create answer options');
        console.error(optionsError);
        return;
      }
    }

    toast.success('Question created successfully');
    resetForm();
    onOpenChange(false);
    onQuestionCreated(); // Call the callback to refresh questions
  };

  const createNewSection = async () => {
    if (!newSectionTitle.trim()) {
      toast.error('Section title cannot be empty');
      return;
    }

    // Get the max order_index to place the new section at the end
    const maxOrderIndex = sections.length > 0 
      ? Math.max(...sections.map(s => s.order_index)) 
      : -1;

    const newSectionId = uuidv4();
    
    const { data, error } = await supabase
      .from('sections')
      .insert({
        id: newSectionId,
        title: newSectionTitle,
        order_index: maxOrderIndex + 1
      })
      .select();

    if (error) {
      toast.error('Failed to create section');
      console.error(error);
      return;
    }

    toast.success('Section created successfully');
    setSectionId(newSectionId);
    setShowNewSectionInput(false);
    setNewSectionTitle('');
    onQuestionCreated(); // Refresh sections
  };

  const resetForm = () => {
    setQuestionText('');
    setQuestionType('');
    setIsRequired(true); // Reset to true (default)
    setSectionId(undefined);
    setAnswerOptions([]);
    setNewOptionText('');
    setBulkOptions('');
    setShowBulkInput(false);
    setNewSectionTitle('');
    setShowNewSectionInput(false);
  };

  const addAnswerOption = () => {
    if (!newOptionText.trim()) return;
    
    setAnswerOptions([
      ...answerOptions, 
      { 
        text: newOptionText, 
        value: newOptionText.toLowerCase().replace(/\s+/g, '_') 
      }
    ]);
    setNewOptionText('');
  };

  const removeAnswerOption = (index: number) => {
    setAnswerOptions(answerOptions.filter((_, i) => i !== index));
  };

  const handleBulkOptionsAdd = () => {
    if (!bulkOptions.trim()) return;
    
    // Split by new lines to create multiple options
    const optionsArray = bulkOptions
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => ({
        text: line.trim(),
        value: line.trim().toLowerCase().replace(/\s+/g, '_')
      }));
    
    setAnswerOptions([...answerOptions, ...optionsArray]);
    setBulkOptions('');
    setShowBulkInput(false);
  };

  const toggleBulkInput = () => {
    setShowBulkInput(!showBulkInput);
  };

  const toggleNewSectionInput = () => {
    setShowNewSectionInput(!showNewSectionInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Add a new question to your product catalogue
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

          <div>
            <label className="block mb-2">Section</label>
            <div className="flex space-x-2">
              <Select 
                value={sectionId} 
                onValueChange={setSectionId}
                disabled={showNewSectionInput}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a section (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_section">No Section</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={toggleNewSectionInput}
              >
                {showNewSectionInput ? "Cancel" : "New Section"}
              </Button>
            </div>
          </div>

          {showNewSectionInput && (
            <div className="flex space-x-2">
              <Input 
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Enter section title"
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={createNewSection}
              >
                Create
              </Button>
            </div>
          )}

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
              
              {answerOptions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Added Options ({answerOptions.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {answerOptions.map((option, index) => (
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
              onCheckedChange={() => setIsRequired(!isRequired)}
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
              Create Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionDialog;
