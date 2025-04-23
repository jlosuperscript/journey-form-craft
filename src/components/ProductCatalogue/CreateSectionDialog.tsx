
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuestions } from '@/hooks/useQuestions';
import { toast } from 'sonner';

type CreateSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionCreated: () => void;
};

const CreateSectionDialog: React.FC<CreateSectionDialogProps> = ({ 
  open, 
  onOpenChange,
  onSectionCreated
}) => {
  const [title, setTitle] = useState('');
  const { createSection } = useQuestions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogInternal, setDialogInternal] = useState(open);
  
  useEffect(() => {
    if (open) {
      setDialogInternal(true);
    }
  }, [open]);
  
  const handleDialogClose = () => {
    setDialogInternal(false);
    // Add timeout to ensure dialog is fully closed before updating parent state
    setTimeout(() => {
      onOpenChange(false);
    }, 300); // Adjust timing to match animation duration
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Section title cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSection(title);
      toast.success('Section created successfully');
      setTitle('');
      handleDialogClose();
      onSectionCreated();
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogInternal} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleDialogClose();
      } else {
        setDialogInternal(true);
        onOpenChange(true);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Section</DialogTitle>
          <DialogDescription>
            Add a new section to group related questions together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block mb-2 font-medium">Section Title</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter section title"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleDialogClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
          >
            Create Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSectionDialog;
