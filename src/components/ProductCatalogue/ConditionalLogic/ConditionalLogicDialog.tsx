import React, { useState, useEffect } from 'react';
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

import { ConditionalLogicDialogProps, EntityType } from './types';
import { 
  getEntityName, 
  saveLogicToSupabase, 
  deleteLogicFromSupabase,
  updateBannerMessageInSupabase,
  createDummyLogicForBanner
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
  const [selectedDependentQuestion, setSelectedDependentQuestion] = useState('');
  const [selectedAnswerValue, setSelectedAnswerValue] = useState('');
  const [conditionType, setConditionType] = useState<'is' | 'is_not'>('is');
  const [bannerMessage, setBannerMessage] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [currentBannerMessage, setCurrentBannerMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogInternal, setDialogInternal] = useState(open);
  
  useEffect(() => {
    if (open) {
      setDialogInternal(true);
    }
  }, [open]);

  const handleDialogClose = () => {
    setDialogInternal(false);
    setTimeout(() => {
      onOpenChange(false);
    }, 300);
  };

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

  const handleAddLogic = async (
    dependentQuestionId: string,
    answerValue: string,
    conditionType: 'is' | 'is_not'
  ) => {
    if (!dependentQuestionId || !answerValue) {
      toast.error('Please select a question and answer value');
      return;
    }
    
    try {
      await saveLogicToSupabase(
        entityType,
        entityType === 'question' ? (entity as Question).id : (entity as any).id,
        dependentQuestionId,
        answerValue,
        conditionType === 'is_not'
      );
      
      toast.success('Conditional logic added successfully');
      setIsAddingCondition(false);
      onLogicUpdated();
    } catch (error) {
      toast.error('Failed to add conditional logic');
      console.error(error);
    }
  };

  const handleDeleteLogic = async (logicId: string) => {
    try {
      await deleteLogicFromSupabase(logicId);
      toast.success('Conditional logic removed');
      onLogicUpdated();
    } catch (error) {
      toast.error('Failed to delete conditional logic');
      console.error(error);
    }
  };

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
      onLogicUpdated();
      handleDialogClose();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAllChanges = () => {
    setSelectedDependentQuestion('');
    setSelectedAnswerValue('');
    setConditionType('is');
    setBannerMessage(currentBannerMessage);
    setHasUnsavedChanges(false);
    setIsAddingCondition(false);
  };

  useEffect(() => {
    if (bannerMessage !== currentBannerMessage) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [bannerMessage, currentBannerMessage]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        handleDialogClose();
      }
    } else if (!newOpen) {
      handleDialogClose();
    } else {
      setDialogInternal(true);
      onOpenChange(true);
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
