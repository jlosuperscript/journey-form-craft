import { Question, Section } from "@/hooks/useQuestions";
import { AnswerOption } from "@/hooks/useQuestions";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { EntityType, ConditionalLogicDialogProps } from "./types";

export type { EntityType, ConditionalLogicDialogProps };

export const getAnswerOptionsForQuestion = (
  questionId: string,
  questions: Question[],
  answerOptions: { [key: string]: AnswerOption[] }
): AnswerOption[] => {
  const options = answerOptions[questionId] || [];
  const questionType = questions.find((q) => q.id === questionId)?.type;
  
  if (questionType === "boolean") {
    return [
      {
        id: "yes",
        value: "yes",
        text: "Yes",
        question_id: questionId,
        order_index: 0
      },
      {
        id: "no",
        value: "no",
        text: "No",
        question_id: questionId,
        order_index: 1
      },
    ];
  }
  
  return options;
};

export const getEntityName = (
  entityType: EntityType,
  entity: Question | Section
): string => {
  if (entityType === "question") {
    const question = entity as Question;
    return `${question.short_id ? `[${question.short_id}] ` : ""}${question.text}`;
  } else {
    const section = entity as Section;
    return section.title;
  }
};

export const saveLogicToSupabase = async (
  entityType: EntityType,
  entityId: string,
  dependentQuestionId: string,
  dependentAnswerValue: string,
  notCondition: boolean,
  bannerMessage: string | null = null
) => {
  const logicPayload = {
    id: uuidv4(),
    entity_type: entityType,
    dependent_question_id: dependentQuestionId,
    dependent_answer_value: dependentAnswerValue,
    not_condition: notCondition,
    banner_message: bannerMessage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    question_id: entityType === "question" ? entityId : null,
    section_id: entityType === "section" ? entityId : null,
  };

  const { error } = await supabase.from("conditional_logic").insert(logicPayload);

  if (error) {
    console.error(error);
    throw new Error("Failed to add conditional logic");
  }
};

export const deleteLogicFromSupabase = async (logicId: string) => {
  const { error } = await supabase
    .from("conditional_logic")
    .delete()
    .eq("id", logicId);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete conditional logic");
  }
};

export const updateBannerMessageInSupabase = async (
  logicId: string,
  bannerMessage: string
) => {
  const { error } = await supabase
    .from("conditional_logic")
    .update({ banner_message: bannerMessage })
    .eq("id", logicId);

  if (error) {
    console.error(error);
    throw new Error("Failed to update banner message");
  }
};

export const createDummyLogicForBanner = async (
  sectionId: string,
  questionId: string,
  bannerMessage: string
) => {
  const { error } = await supabase.from("conditional_logic").insert({
    id: uuidv4(),
    entity_type: "section",
    section_id: sectionId,
    dependent_question_id: questionId,
    dependent_answer_value: "dummy_value",
    banner_message: bannerMessage,
    not_condition: true,
  });

  if (error) {
    console.error(error);
    throw new Error("Failed to create banner logic");
  }
};
