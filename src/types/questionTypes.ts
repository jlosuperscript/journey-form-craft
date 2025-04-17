
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
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  dependent_question?: Question;
  is_answered_condition?: boolean;
};
