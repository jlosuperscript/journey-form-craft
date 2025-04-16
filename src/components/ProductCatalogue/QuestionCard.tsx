
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronUp, ChevronDown, Trash2, MessageSquare, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Question, AnswerOption, ConditionalLogic } from '@/hooks/useQuestions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type QuestionCardProps = {
  question: Question;
  answerOptions: AnswerOption[];
  conditionalLogic: ConditionalLogic[];
  onDelete: (id: string) => void;
  onOpenLogicDialog: (question: Question) => void;
  onOpenEditDialog: (question: Question) => void;
  onMoveQuestion: (questionId: string, direction: 'up' | 'down', sectionId?: string) => void;
  isFirst: boolean;
  isLast: boolean;
  sectionId?: string;
};

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answerOptions,
  conditionalLogic,
  onDelete,
  onOpenLogicDialog,
  onOpenEditDialog,
  onMoveQuestion,
  isFirst,
  isLast,
  sectionId
}) => {
  const handleMoveUp = () => {
    onMoveQuestion(question.id, 'up', sectionId);
  };

  const handleMoveDown = () => {
    onMoveQuestion(question.id, 'down', sectionId);
  };

  const renderQuestionTypeInfo = () => {
    switch (question.type) {
      case 'text':
        return <span className="text-gray-500">Text input</span>;
      case 'select':
        return <span className="text-gray-500">Dropdown select with {answerOptions.length} options</span>;
      case 'multiple_choice':
        return <span className="text-gray-500">Multiple choice with {answerOptions.length} options</span>;
      case 'boolean':
        return <span className="text-gray-500">Yes/No question</span>;
      case 'number':
        return <span className="text-gray-500">Number input</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="mr-2 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {question.short_id || 'Q'}
          </span>
          {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMoveUp}
            disabled={isFirst}
            className={isFirst ? 'opacity-50' : ''}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMoveDown}
            disabled={isLast}
            className={isLast ? 'opacity-50' : ''}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenEditDialog(question)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit question
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenLogicDialog(question)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Conditional logic
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(question.id)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-sm">{renderQuestionTypeInfo()}</div>

        {/* Show answer options if applicable */}
        {(question.type === 'select' || question.type === 'multiple_choice') && answerOptions.length > 0 && (
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="options">
              <AccordionTrigger className="text-sm py-1">
                Answer Options ({answerOptions.length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-sm">
                  {answerOptions.map(option => (
                    <li key={option.id} className="px-2 py-1 bg-gray-50 rounded">
                      {option.text}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Show conditional logic if applicable */}
        {conditionalLogic.length > 0 && (
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="logic">
              <AccordionTrigger className="text-sm py-1">
                Conditional Logic ({conditionalLogic.length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-sm">
                  {conditionalLogic.map(logic => (
                    <li key={logic.id} className="px-2 py-1 bg-gray-50 rounded">
                      Show when{' '}
                      <span className="font-medium">
                        {logic.dependent_question?.text || 'Unknown question'}
                      </span>{' '}
                      is {logic.not_condition ? 'not ' : ''}
                      <span className="font-medium">{logic.dependent_answer_value}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
