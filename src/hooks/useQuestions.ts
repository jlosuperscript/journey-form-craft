
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
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
  question_id: string;
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  dependent_question?: Question;
};

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<{[key: string]: AnswerOption[]}>({});
  const [conditionalLogic, setConditionalLogic] = useState<{[key: string]: ConditionalLogic[]}>({});
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch all questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('order_index');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        toast.error('Failed to load questions');
        return;
      }

      setQuestions(questionsData || []);

      // Fetch all answer options
      const { data: optionsData, error: optionsError } = await supabase
        .from('answer_options')
        .select('*')
        .order('order_index');

      if (optionsError) {
        console.error('Error fetching answer options:', optionsError);
        toast.error('Failed to load answer options');
        return;
      }

      // Group options by question_id
      const optionsByQuestion: {[key: string]: AnswerOption[]} = {};
      optionsData?.forEach(option => {
        if (!optionsByQuestion[option.question_id]) {
          optionsByQuestion[option.question_id] = [];
        }
        optionsByQuestion[option.question_id].push(option);
      });
      setAnswerOptions(optionsByQuestion);

      // Fetch conditional logic
      const { data: logicData, error: logicError } = await supabase
        .from('conditional_logic')
        .select('*');

      if (logicError) {
        console.error('Error fetching conditional logic:', logicError);
        toast.error('Failed to load conditional logic');
        return;
      }

      // Now fetch dependent questions separately
      const logicByQuestion: {[key: string]: ConditionalLogic[]} = {};
      
      for (const logic of logicData || []) {
        // Get dependent question details
        const { data: dependentQuestion, error: dependentError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', logic.dependent_question_id)
          .single();
        
        if (dependentError) {
          console.error('Error fetching dependent question:', dependentError);
          continue;
        }

        // Add the logic with the dependent question
        const logicWithDependent: ConditionalLogic = {
          ...logic,
          dependent_question: dependentQuestion
        };

        if (!logicByQuestion[logic.question_id]) {
          logicByQuestion[logic.question_id] = [];
        }
        logicByQuestion[logic.question_id].push(logicWithDependent);
      }
      
      setConditionalLogic(logicByQuestion);
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('An error occurred while loading questions');
    } finally {
      setLoading(false);
    }
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

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === questions.length - 1)
    ) {
      return; // Can't move further in this direction
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetQuestion = questions[targetIndex];
    const currentQuestion = questions[currentIndex];
    
    // Swap order_index values
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
    answerOptions,
    conditionalLogic,
    loading,
    fetchQuestions,
    handleDeleteQuestion,
    handleMoveQuestion
  };
};
