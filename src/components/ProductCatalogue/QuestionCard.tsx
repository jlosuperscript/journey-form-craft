
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order_index: number;
};

type AnswerOption = {
  id: string;
  question_id: string;
  text: string;
  value: string;
  order_index: number;
};

type ConditionalLogic = {
  id: string;
  question_id: string;
  dependent_question_id: string;
  dependent_answer_value: string;
  not_condition?: boolean;
  dependent_question?: Question;
};

type QuestionCardProps = {
  question: Question;
  answerOptions: AnswerOption[];
  conditionalLogic: ConditionalLogic[];
  onDelete: (id: string) => void;
  onOpenLogicDialog: (question: Question) => void;
  onOpenEditDialog: (question: Question) => void;
  onMoveQuestion: (questionId: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
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
  isLast
}) => {
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text';
      case 'select': return 'Dropdown Select';
      case 'multiple_choice': return 'Multiple Choice';
      case 'boolean': return 'Yes/No';
      case 'number': return 'Number';
      default: return type;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{question.text}</CardTitle>
          <div className="flex mt-2 gap-2">
            <Badge variant="outline">{getQuestionTypeLabel(question.type)}</Badge>
            {question.required && <Badge>Required</Badge>}
            {conditionalLogic.length > 0 && (
              <Badge variant="secondary">Conditional</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onMoveQuestion(question.id, 'up')}
              disabled={isFirst}
              title="Move Up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onMoveQuestion(question.id, 'down')}
              disabled={isLast}
              title="Move Down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onOpenLogicDialog(question)}
            title="Conditional Logic"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onOpenEditDialog(question)}
            title="Edit Question"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(question.type === 'select' || question.type === 'multiple_choice') && (
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-1">Answer Options:</h4>
            <div className="grid grid-cols-2 gap-2">
              {answerOptions.map((option) => (
                <div key={option.id} className="text-sm p-2 bg-gray-100 rounded-md">
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {conditionalLogic.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Conditional Logic:</h4>
            <div className="space-y-2">
              {conditionalLogic.map((logic) => (
                <div key={logic.id} className="text-sm">
                  <span>Show only when </span>
                  <span className="font-medium">{logic.dependent_question?.text}</span>
                  <span> is </span>
                  {logic.not_condition ? (
                    <span><strong>not</strong> "{logic.dependent_answer_value}"</span>
                  ) : (
                    <span className="font-medium">"{logic.dependent_answer_value}"</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
