
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import shortUUID from 'short-uuid';
import { v4 as uuidv4 } from 'uuid';

export type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order_index: number;
  short_id?: string;
  section_id?: string;
};

export type Section = {
  id: string;
  title: string;
  order_index: number;
};

export type AnswerOption = {
  id: string;
  question_id: string;
  text: string;
  value: string;
  order_index: number;
};

export type ConditionalLogic = {
  id: string;
  question_id?: string;
  section_id?: string;
  entity_type: string;
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  banner_message?: string;
  dependent_question?: Question;
};

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [answerOptions, setAnswerOptions] = useState<{[key: string]: AnswerOption[]}>({});
  const [conditionalLogic, setConditionalLogic] = useState<{[key: string]: ConditionalLogic[]}>({});
  const [loading, setLoading] = useState(true);

  const generateShortId = () => {
    const translator = shortUUID();
    return translator.new().substring(0, 5).toUpperCase();
  };

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
      return [];
    }

    setSections(data || []);
    return data || [];
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      await fetchSections();
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('order_index');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        toast.error('Failed to load questions');
        setLoading(false);
        return;
      }

      const questionsToUpdate = questionsData?.filter(q => !q.short_id) || [];
      
      if (questionsToUpdate.length > 0) {
        for (const question of questionsToUpdate) {
          const shortId = generateShortId();
          const { error: updateError } = await supabase
            .from('questions')
            .update({ short_id: shortId })
            .eq('id', question.id);
          
          if (updateError) {
            console.error('Error updating question with short_id:', updateError);
          } else {
            question.short_id = shortId;
          }
        }
      }

      setQuestions(questionsData || []);

      const { data: optionsData, error: optionsError } = await supabase
        .from('answer_options')
        .select('*')
        .order('order_index');

      if (optionsError) {
        console.error('Error fetching answer options:', optionsError);
        toast.error('Failed to load answer options');
        setLoading(false);
        return;
      }

      const optionsByQuestion: {[key: string]: AnswerOption[]} = {};
      optionsData?.forEach(option => {
        if (!optionsByQuestion[option.question_id]) {
          optionsByQuestion[option.question_id] = [];
        }
        optionsByQuestion[option.question_id].push(option);
      });
      setAnswerOptions(optionsByQuestion);

      const { data: logicData, error: logicError } = await supabase
        .from('conditional_logic')
        .select('*');

      if (logicError) {
        console.error('Error fetching conditional logic:', logicError);
        toast.error('Failed to load conditional logic');
        setLoading(false);
        return;
      }

      const logicByQuestion: {[key: string]: ConditionalLogic[]} = {};
      const logicBySection: {[key: string]: ConditionalLogic[]} = {};
      
      for (const logic of logicData || []) {
        const { data: dependentQuestion, error: dependentError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', logic.dependent_question_id)
          .single();
        
        if (dependentError) {
          console.error('Error fetching dependent question:', dependentError);
          continue;
        }

        const logicWithDependent: ConditionalLogic = {
          ...logic,
          dependent_question: dependentQuestion
        };

        if (logic.entity_type === 'question' && logic.question_id) {
          if (!logicByQuestion[logic.question_id]) {
            logicByQuestion[logic.question_id] = [];
          }
          logicByQuestion[logic.question_id].push(logicWithDependent);
        } else if (logic.entity_type === 'section' && logic.section_id) {
          if (!logicBySection[logic.section_id]) {
            logicBySection[logic.section_id] = [];
          }
          logicBySection[logic.section_id].push(logicWithDependent);
        }
      }
      
      const combinedLogic = {...logicByQuestion, ...logicBySection};
      setConditionalLogic(combinedLogic);
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('An error occurred while loading questions');
    } finally {
      setLoading(false);
    }
  };

  const createSection = async (title: string) => {
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
    await fetchSections();
    return data?.[0];
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === sections.length - 1)
    ) {
      return; // Can't move further in this direction
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
      return;
    }
    
    toast.success('Sections reordered successfully');
    fetchQuestions();
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      toast.error('Error deleting question');
      return;
    }

    toast.success('Question deleted successfully');
    fetchQuestions();
  };

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down', sectionId?: string) => {
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
      return; // Can't move further in this direction
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
      return;
    }
    
    toast.success('Questions reordered successfully');
    fetchQuestions();
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return {
    questions,
    sections,
    answerOptions,
    conditionalLogic,
    loading,
    fetchQuestions,
    createSection,
    handleDeleteQuestion,
    handleMoveQuestion,
    handleMoveSection,
    generateShortId
  };
};
