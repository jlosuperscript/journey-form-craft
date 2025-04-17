
import { useCallback } from 'react';
import { useFetchQuestions } from './useFetchQuestions';
import { 
  moveSection, 
  deleteQuestion, 
  moveQuestion, 
  createNewSection, 
  generateShortId 
} from './useQuestionsUtils';
import { Question, Section } from '@/types/questionTypes';

export const useQuestions = () => {
  const {
    questions,
    sections,
    answerOptions,
    conditionalLogic,
    sectionConditionalLogic,
    loading,
    fetchQuestions
  } = useFetchQuestions();

  const handleMoveSection = useCallback(async (sectionId: string, direction: 'up' | 'down') => {
    const success = await moveSection(sections, sectionId, direction);
    if (success) {
      fetchQuestions();
    }
  }, [sections, fetchQuestions]);

  const handleDeleteQuestion = useCallback(async (id: string) => {
    const success = await deleteQuestion(id);
    if (success) {
      fetchQuestions();
    }
  }, [fetchQuestions]);

  const handleMoveQuestion = useCallback(async (questionId: string, direction: 'up' | 'down', sectionId?: string) => {
    const success = await moveQuestion(questions, questionId, direction, sectionId);
    if (success) {
      fetchQuestions();
    }
  }, [questions, fetchQuestions]);

  const createSection = useCallback(async (title: string) => {
    const section = await createNewSection(title, sections);
    if (section) {
      await fetchQuestions();
    }
    return section;
  }, [sections, fetchQuestions]);

  return {
    questions,
    sections,
    answerOptions,
    conditionalLogic,
    sectionConditionalLogic,
    loading,
    fetchQuestions,
    createSection,
    handleDeleteQuestion,
    handleMoveQuestion,
    handleMoveSection,
    generateShortId
  };
};

// Re-export types for convenience
export type { Question, Section, AnswerOption, ConditionalLogic } from '@/types/questionTypes';
