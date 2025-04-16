
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CreateQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateQuestionDialog: React.FC<CreateQuestionDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const handleSubmit = async () => {
    if (!questionText || !questionType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        text: questionText,
        type: questionType,
        required: isRequired,
        order_index: 0 // You might want to implement a more sophisticated ordering
      });

    if (error) {
      toast.error('Failed to create question');
      console.error(error);
      return;
    }

    toast.success('Question created successfully');
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setQuestionText('');
    setQuestionType('');
    setIsRequired(false);
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
                <SelectItem value="select">Multiple Choice</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
