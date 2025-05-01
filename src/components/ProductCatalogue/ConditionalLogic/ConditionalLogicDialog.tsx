import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Question } from "@/hooks/useQuestions";

import BannerMessageField from './BannerMessageField';
import LogicConditionForm from './LogicConditionForm';
import ExistingLogicList from './ExistingLogicList';

import { 
  ConditionalLogicDialogProps, 
  EntityType,
  saveLogicToSupabase, 
  deleteLogicFromSupabase,
  updateBannerMessageInSupabase,
  createDummyLogicForBanner,
  getEntityName
} from './utils';

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
  // State management
  const [selectedDependentQuestion, setSelectedDependentQuestion] = useState('');
  const [selectedAnswerValue, setSelectedAnswerValue] = useState('');
  const [conditionType, setConditionType] = useState<'is' | 'is_not'>('is');
  const [bannerMessage, setBannerMessage] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [currentBannerMessage, setCurrentBannerMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog internal state with proper transition timing
  const [dialogInternal, setDialogInternal] = useState(open);
  const dialogTransitioningRef = useRef(false);
  
  // Sync internal state with external open prop
  useEffect(() => {
    if (open) {
      // Add delay before actually opening dialog
      const timer = setTimeout(() => {
        setDialogInternal(true);
        dialogTransitioningRef.current = false;
      }, 250); // Ensure any other UI elements have completed transitions
      return () => clearTimeout(timer);
    } else if (open === false) {
      // Mark as transitioning
      dialogTransitioningRef.current = true;
      // Add delay before closing
      const timer = setTimeout(() => {
        setDialogInternal(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Handle dialog close with improved timing
  const handleDialogClose = () => {
    // Prevent rapid open/close cycles
    if (dialogTransitioningRef.current) return;
    
    // Mark as transitioning
    dialogTransitioningRef.current = true;
    
    // Add initial delay before starting close animation
    setTimeout(() => {
      setDialogInternal(false);
      
      // Add another delay to ensure dialog is fully closed before updating parent state
      setTimeout(() => {
        dialogTransitioningRef.current = false;
        onOpenChange(false);
      }, 350); // Adjust timing to match or exceed animation duration
    }, 100);
  };

  // Initialize available questions and banner message
  useEffect(() => {
    const filteredQuestions = questions.filter(q => (
      (entityType === 'section' || q.id !== (entity as Question).id) && 
      (q.type === 'select' || q.type === 'multiple_choice' || q.type === 'boolean')
    ));
    setAvailableQuestions(filteredQuestions);

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

  // Add logic condition with debounce to prevent double submission
  const isAddingRef = useRef(false);
  const handleAddLogic = async (
    dependentQuestionId: string,
    answerValue: string,
    conditionType: 'is' | 'is_not',
    checkAnswerExistence: boolean = false
  ) => {
    if (!dependentQuestionId) {
      toast.error('Please select a question');
      return;
    }
    
    if (!answerValue && !checkAnswerExistence) {
      toast.error('Please select an answer value or check existence option');
      return;
    }
    
    // Prevent double submission
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    
    try {
      await saveLogicToSupabase(
        entityType,
        entityType === 'question' ? (entity as Question).id : (entity as any).id,
        dependentQuestionId,
        answerValue,
        conditionType === 'is_not',
        null,
        checkAnswerExistence
      );
      
      toast.success('Conditional logic added successfully');
      setIsAddingCondition(false);
      onLogicUpdated();
    } catch (error) {
      toast.error('Failed to add conditional logic');
      console.error(error);
    } finally {
      // Reset submission lock with delay
      setTimeout(() => {
        isAddingRef.current = false;
      }, 500);
    }
  };

  // Delete logic with debounce
  const isDeletingRef = useRef(false);
  const handleDeleteLogic = async (logicId: string) => {
    // Prevent double deletion
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    
    try {
      await deleteLogicFromSupabase(logicId);
      toast.success('Conditional logic removed');
      onLogicUpdated();
    } catch (error) {
      toast.error('Failed to delete conditional logic');
      console.error(error);
    } finally {
      // Reset deletion lock with delay
      setTimeout(() => {
        isDeletingRef.current = false;
      }, 500);
    }
  };

  // Save changes with improved error handling
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (entityType === 'section') {
        if (existingLogic.length > 0) {
          const firstLogic = existingLogic[0];
          await updateBannerMessageInSupabase(firstLogic.id, bannerMessage);
        } else if (bannerMessage) {
          await createDummyLogicForBanner(
            (entity as any).id,
            questions.length > 0 ? questions[0].id : '', 
            bannerMessage
          );
        }
      }
      
      setCurrentBannerMessage(bannerMessage);
      setHasUnsavedChanges(false);
      toast.success('Changes saved successfully');
      
      // Update logic with delay to ensure proper UI refresh
      setTimeout(() => {
        onLogicUpdated();
        
        // Close dialog with proper timing
        handleDialogClose();
      }, 300);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all form state
  const resetAllChanges = () => {
    setSelectedDependentQuestion('');
    setSelectedAnswerValue('');
    setConditionType('is');
    setBannerMessage(currentBannerMessage);
    setHasUnsavedChanges(false);
    setIsAddingCondition(false);
  };

  // Track unsaved changes
  useEffect(() => {
    if (bannerMessage !== currentBannerMessage) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [bannerMessage, currentBannerMessage]);

  // Handle dialog open state changes with unsaved changes check
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        handleDialogClose();
      }
    } else if (!newOpen) {
      handleDialogClose();
    } else {
      // When opening, sync internal state with delay for transitions
      setTimeout(() => {
        setDialogInternal(true);
        onOpenChange(true);
      }, 100);
    }
  };

  return (
    <Dialog 
      open={dialogInternal} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Conditional Logic for {entityType === 'question' ? 'Question' : 'Section'}: {getEntityName(entityType, entity)}
          </DialogTitle>
          <DialogDescription>
            Set when this {entityType} should be displayed based on answers to questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {entityType === 'section' && (
            <BannerMessageField 
              bannerMessage={bannerMessage}
              setBannerMessage={setBannerMessage}
            />
          )}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Conditions:</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddingCondition(true)} 
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </div>

            <ExistingLogicList 
              existingLogic={existingLogic}
              questions={questions}
              onDeleteLogic={handleDeleteLogic}
            />

            {isAddingCondition && (
              <LogicConditionForm 
                questions={availableQuestions}
                answerOptions={answerOptions}
                onAddLogic={handleAddLogic}
                onCancel={() => setIsAddingCondition(false)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between border-t pt-4 mt-4">
          <Button variant="ghost" onClick={resetAllChanges}>
            Reset
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionalLogicDialog;
