
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ConditionalLogicDialog from './ConditionalLogicDialog';
import EditQuestionDialog from './EditQuestionDialog';
import { toast } from 'sonner';

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

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<{[key: string]: AnswerOption[]}>({});
  const [conditionalLogic, setConditionalLogic] = useState<{[key: string]: ConditionalLogic[]}>({});
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isLogicDialogOpen, setIsLogicDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    // Fetch all questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .order('order_index');

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
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

    // Fetch conditional logic - Fix is here
    const { data: logicData, error: logicError } = await supabase
      .from('conditional_logic')
      .select('*');

    if (logicError) {
      console.error('Error fetching conditional logic:', logicError);
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

  const handleOpenLogicDialog = (question: Question) => {
    setSelectedQuestion(question);
    setIsLogicDialogOpen(true);
  };

  const handleOpenEditDialog = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditDialogOpen(true);
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
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{question.text}</CardTitle>
              <div className="flex mt-2 gap-2">
                <Badge variant="outline">{getQuestionTypeLabel(question.type)}</Badge>
                {question.required && <Badge>Required</Badge>}
                {conditionalLogic[question.id] && conditionalLogic[question.id].length > 0 && (
                  <Badge variant="secondary">Conditional</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleMoveQuestion(question.id, 'up')}
                  disabled={questions.indexOf(question) === 0}
                  title="Move Up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleMoveQuestion(question.id, 'down')}
                  disabled={questions.indexOf(question) === questions.length - 1}
                  title="Move Down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleOpenLogicDialog(question)}
                title="Conditional Logic"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleOpenEditDialog(question)}
                title="Edit Question"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={() => handleDeleteQuestion(question.id)}
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
                  {answerOptions[question.id]?.map((option) => (
                    <div key={option.id} className="text-sm p-2 bg-gray-100 rounded-md">
                      {option.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {conditionalLogic[question.id] && conditionalLogic[question.id].length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-1">Conditional Logic:</h4>
                <div className="space-y-2">
                  {conditionalLogic[question.id].map((logic) => (
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
      ))}

      {selectedQuestion && (
        <>
          <ConditionalLogicDialog
            open={isLogicDialogOpen}
            onOpenChange={setIsLogicDialogOpen}
            question={selectedQuestion}
            questions={questions}
            answerOptions={answerOptions}
            existingLogic={conditionalLogic[selectedQuestion.id] || []}
            onLogicUpdated={fetchQuestions}
          />
          <EditQuestionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            question={selectedQuestion}
            answerOptions={answerOptions[selectedQuestion.id] || []}
            onQuestionUpdated={fetchQuestions}
          />
        </>
      )}
    </div>
  );
};

export default QuestionList;
