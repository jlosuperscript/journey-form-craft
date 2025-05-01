
import { Question, Section, AnswerOption } from "@/hooks/useQuestions";

export type ConditionalLogic = {
  id: string;
  question_id?: string;
  section_id?: string;
  entity_type: string;
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  dependent_question?: Question;
  banner_message?: string;
  check_answer_existence?: boolean; // New field to check if question is answered
};

export type EntityType = 'question' | 'section';

export type ConditionalLogicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entity: Question | Section;
  questions: Question[];
  answerOptions: {
    [key: string]: AnswerOption[];
  };
  existingLogic: ConditionalLogic[];
  onLogicUpdated: () => void;
};
