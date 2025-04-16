
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ConditionalLogicDialog from './ConditionalLogicDialog';
import EditQuestionDialog from './EditQuestionDialog';
import QuestionCard from './QuestionCard';
import { useQuestions } from '@/hooks/useQuestions';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Section } from '@/hooks/useQuestions';

const QuestionList: React.FC = () => {
  const {
    questions,
    sections,
    answerOptions,
    conditionalLogic,
    loading,
    fetchQuestions,
    handleDeleteQuestion,
    handleMoveQuestion,
    handleMoveSection
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

  // Group questions by section
  const questionsBySection: { [key: string]: any[] } = {};
  const unsectionedQuestions: any[] = [];

  questions.forEach(question => {
    if (question.section_id && sections.some(s => s.id === question.section_id)) {
      if (!questionsBySection[question.section_id]) {
        questionsBySection[question.section_id] = [];
      }
      questionsBySection[question.section_id].push(question);
    } else {
      unsectionedQuestions.push(question);
    }
  });

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

  const renderQuestionCard = (question: any, index: number, sectionQuestions: any[], sectionId?: string) => (
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
      isLast={index === sectionQuestions.length - 1}
      sectionId={sectionId}
    />
  );

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-8">
      {/* Render sectioned questions */}
      {sortedSections.map((section, sectionIndex) => {
        const sectionQuestions = questionsBySection[section.id] || [];
        const isFirstSection = sectionIndex === 0;
        const isLastSection = sectionIndex === sortedSections.length - 1;
        
        return (
          <div key={section.id} className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveSection(section.id, 'up')}
                  disabled={isFirstSection}
                  className={isFirstSection ? 'opacity-50' : ''}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveSection(section.id, 'down')}
                  disabled={isLastSection}
                  className={isLastSection ? 'opacity-50' : ''}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator />
            {sectionQuestions.length > 0 ? (
              <div className="space-y-4">
                {sectionQuestions.map((question, index) => 
                  renderQuestionCard(question, index, sectionQuestions, section.id)
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No questions in this section yet. Create your first question and assign it to this section.
              </div>
            )}
          </div>
        );
      })}

      {/* Render unsectioned questions */}
      {unsectionedQuestions.length > 0 && (
        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">Unsectioned Questions</h2>
          </div>
          <Separator />
          {unsectionedQuestions.map((question, index) => 
            renderQuestionCard(question, index, unsectionedQuestions)
          )}
        </div>
      )}

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
            sections={sections}
          />
        </>
      )}
    </div>
  );
};

export default QuestionList;
