
import { toast } from 'sonner';
import shortUUID from 'short-uuid';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Section } from '@/types/questionTypes';

export const generateShortId = (): string => {
  const translator = shortUUID();
  return translator.new().substring(0, 5).toUpperCase();
};

export const fetchSectionsData = async (): Promise<Section[]> => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('order_index');

  if (error) {
    console.error('Error fetching sections:', error);
    toast.error('Failed to load sections');
    return [];
  }

  return data || [];
};

export const moveSection = async (sections: Section[], sectionId: string, direction: 'up' | 'down'): Promise<boolean> => {
  const currentIndex = sections.findIndex(s => s.id === sectionId);
  if (
    (direction === 'up' && currentIndex === 0) || 
    (direction === 'down' && currentIndex === sections.length - 1)
  ) {
    return false; // Can't move further in this direction
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const targetSection = sections[targetIndex];
  const currentSection = sections[currentIndex];
  
  const { error: error1 } = await supabase
    .from('sections')
    .update({ order_index: targetSection.order_index })
    .eq('id', currentSection.id);
    
  const { error: error2 } = await supabase
    .from('sections')
    .update({ order_index: currentSection.order_index })
    .eq('id', targetSection.id);
  
  if (error1 || error2) {
    console.error('Error reordering sections:', error1 || error2);
    toast.error('Error reordering sections');
    return false;
  }
  
  toast.success('Sections reordered successfully');
  return true;
};

export const deleteQuestion = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting question:', error);
    toast.error('Error deleting question');
    return false;
  }

  toast.success('Question deleted successfully');
  return true;
};

export const moveQuestion = async (
  questions: Question[], 
  questionId: string, 
  direction: 'up' | 'down', 
  sectionId?: string
): Promise<boolean> => {
  let sectionQuestions = questions;
  if (sectionId) {
    sectionQuestions = questions.filter(q => q.section_id === sectionId);
  } else {
    sectionQuestions = questions.filter(q => !q.section_id);
  }
  
  const currentIndex = sectionQuestions.findIndex(q => q.id === questionId);
  if (
    (direction === 'up' && currentIndex === 0) || 
    (direction === 'down' && currentIndex === sectionQuestions.length - 1)
  ) {
    return false; // Can't move further in this direction
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const targetQuestion = sectionQuestions[targetIndex];
  const currentQuestion = sectionQuestions[currentIndex];
  
  const { error: error1 } = await supabase
    .from('questions')
    .update({ order_index: targetQuestion.order_index })
    .eq('id', currentQuestion.id);
    
  const { error: error2 } = await supabase
    .from('questions')
    .update({ order_index: currentQuestion.order_index })
    .eq('id', targetQuestion.id);
  
  if (error1 || error2) {
    console.error('Error reordering questions:', error1 || error2);
    toast.error('Error reordering questions');
    return false;
  }
  
  toast.success('Questions reordered successfully');
  return true;
};

export const createNewSection = async (title: string, sections: Section[]): Promise<Section | null> => {
  const maxOrderIndex = sections.length > 0 
    ? Math.max(...sections.map(s => s.order_index)) 
    : -1;
  
  const { data, error } = await supabase
    .from('sections')
    .insert({
      id: uuidv4(),
      title,
      order_index: maxOrderIndex + 1
    })
    .select();

  if (error) {
    console.error('Error creating section:', error);
    toast.error('Failed to create section');
    return null;
  }

  toast.success('Section created successfully');
  return data?.[0] || null;
};

import { Question } from '@/types/questionTypes';
