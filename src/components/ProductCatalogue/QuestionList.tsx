
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ConditionalLogicDialog from './ConditionalLogicDialog';
import EditQuestionDialog from './EditQuestionDialog';
import QuestionCard from './QuestionCard';
import { useQuestions } from '@/hooks/useQuestions';

const QuestionList: React.FC = () => {
  const {
    questions,
    answerOptions,
    conditionalLogic,
    loading,
    fetchQuestions,
    handleDeleteQuestion,
    handleMoveQuestion
  } = useQuestions();
  
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isLogicDialogOpen, setIsLogicDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenLogicDialog = (question: any) => {
    setSelectedQuestion(question);
    setIsLogicDialogOpen(true);
  };

  const handleOpenEditDialog = (question: any) => {
    setSelectedQuestion(question);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          answerOptions={answerOptions[question.id] || []}
          conditionalLogic={conditionalLogic[question.id] || []}
          onDelete={handleDeleteQuestion}
          onOpenLogicDialog={handleOpenLogicDialog}
          onOpenEditDialog={handleOpenEditDialog}
          onMoveQuestion={handleMoveQuestion}
          isFirst={index === 0}
          isLast={index === questions.length - 1}
        />
      ))}

      {questions.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-gray-500">No questions yet. Create your first question to get started.</p>
        </div>
      )}

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
