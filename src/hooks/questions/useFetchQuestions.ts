
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Question, Section, AnswerOption, ConditionalLogic } from '@/types/questionTypes';
import { fetchSectionsData, generateShortId } from './useQuestionsUtils';

export const useFetchQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [answerOptions, setAnswerOptions] = useState<{[key: string]: AnswerOption[]}>({});
  const [conditionalLogic, setConditionalLogic] = useState<{[key: string]: ConditionalLogic[]}>({});
  const [sectionConditionalLogic, setSectionConditionalLogic] = useState<{[key: string]: ConditionalLogic[]}>({});
  const [loading, setLoading] = useState(true);

  const fetchSections = async (): Promise<Section[]> => {
    const sectionsData = await fetchSectionsData();
    setSections(sectionsData);
    return sectionsData;
  };

  const fetchQuestions = useCallback(async () => {
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

        if (logic.question_id) {
          if (!logicByQuestion[logic.question_id]) {
            logicByQuestion[logic.question_id] = [];
          }
          logicByQuestion[logic.question_id].push(logicWithDependent);
        } else if (logic.section_id) {
          if (!logicBySection[logic.section_id]) {
            logicBySection[logic.section_id] = [];
          }
          logicBySection[logic.section_id].push(logicWithDependent);
        }
      }
      
      setConditionalLogic(logicByQuestion);
      setSectionConditionalLogic(logicBySection);
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('An error occurred while loading questions');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    questions,
    sections,
    answerOptions,
    conditionalLogic,
    sectionConditionalLogic,
    loading,
    fetchQuestions
  };
};
