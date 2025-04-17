
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ConditionalLogicDialog from './ConditionalLogicDialog';
import EditQuestionDialog from './EditQuestionDialog';
import QuestionCard from './QuestionCard';
import { useQuestions, Section, Question } from '@/hooks/useQuestions';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, GripVertical, Code, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isLogicDialogOpen, setIsLogicDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [logicEntityType, setLogicEntityType] = useState<'question' | 'section'>('question');

  const handleOpenLogicDialog = (question: Question) => {
    setSelectedQuestion(question);
    setSelectedSection(null);
    setLogicEntityType('question');
    setIsLogicDialogOpen(true);
  };

  const handleOpenSectionLogicDialog = (section: Section) => {
    setSelectedSection(section);
    setSelectedQuestion(null);
    setLogicEntityType('section');
    setIsLogicDialogOpen(true);
  };

  const handleOpenEditDialog = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditDialogOpen(true);
  };

  const handleCloseLogicDialog = () => {
    setTimeout(() => {
      setIsLogicDialogOpen(false);
    }, 50);
  };

  const handleCloseEditDialog = () => {
    setTimeout(() => {
      setIsEditDialogOpen(false);
    }, 50);
  };

  const questionsBySection: {
    [key: string]: Question[];
  } = {};
  const unsectionedQuestions: Question[] = [];
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
    return <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-20 w-full" />
          </div>)}
      </div>;
  }

  const renderQuestionCard = (question: Question, index: number, sectionQuestions: Question[], sectionId?: string) => <QuestionCard key={question.id} question={question} answerOptions={answerOptions[question.id] || []} conditionalLogic={conditionalLogic[question.id] || []} onDelete={handleDeleteQuestion} onOpenLogicDialog={handleOpenLogicDialog} onOpenEditDialog={handleOpenEditDialog} onMoveQuestion={handleMoveQuestion} isFirst={index === 0} isLast={index === sectionQuestions.length - 1} sectionId={sectionId} />;

  const hasSectionLogic = (sectionId: string) => {
    return conditionalLogic[sectionId] && conditionalLogic[sectionId].length > 0;
  };

  const getSectionBannerMessage = (sectionId: string) => {
    if (!conditionalLogic[sectionId] || conditionalLogic[sectionId].length === 0) {
      return null;
    }
    
    for (const logic of conditionalLogic[sectionId]) {
      if (logic.banner_message) {
        return logic.banner_message;
      }
    }
    
    return null;
  };

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  return <div className="space-y-8">
      {sortedSections.map((section, sectionIndex) => {
      const sectionQuestions = questionsBySection[section.id] || [];
      const isFirstSection = sectionIndex === 0;
      const isLastSection = sectionIndex === sortedSections.length - 1;
      const sectionHasLogic = hasSectionLogic(section.id);
      const bannerMessage = getSectionBannerMessage(section.id);
      
      return <div key={section.id} className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
                {sectionHasLogic && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Section Logic</span>}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => handleOpenSectionLogicDialog(section)}>
                  <Code className="h-4 w-4" />
                  {sectionHasLogic ? 'Edit Logic' : 'Add Logic'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleMoveSection(section.id, 'up')} disabled={isFirstSection} className={isFirstSection ? 'opacity-50' : ''}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleMoveSection(section.id, 'down')} disabled={isLastSection} className={isLastSection ? 'opacity-50' : ''}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator />
            
            {bannerMessage && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">{bannerMessage}</AlertTitle>
              </Alert>
            )}
            
            {sectionQuestions.length > 0 ? <div className="space-y-4">
                {sectionQuestions.map((question, index) => renderQuestionCard(question, index, sectionQuestions, section.id))}
              </div> : <div className="p-4 text-center text-gray-500">
                No questions in this section yet. Create your first question and assign it to this section.
              </div>}
          </div>;
    })}

      {unsectionedQuestions.length > 0 && <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">Unsectioned Questions</h2>
          </div>
          <Separator />
          {unsectionedQuestions.map((question, index) => renderQuestionCard(question, index, unsectionedQuestions))}
        </div>}

      {questions.length === 0 && <div className="text-center p-8 border rounded-lg">
          <p className="text-gray-500">No questions yet. Create your first question to get started.</p>
        </div>}

      {(selectedQuestion || selectedSection) && <>
          <ConditionalLogicDialog open={isLogicDialogOpen} onOpenChange={open => {
        if (!open) handleCloseLogicDialog();else setIsLogicDialogOpen(open);
      }} entityType={logicEntityType} entity={logicEntityType === 'question' ? selectedQuestion! : selectedSection!} questions={questions} answerOptions={answerOptions} existingLogic={logicEntityType === 'question' && selectedQuestion ? conditionalLogic[selectedQuestion.id] || [] : logicEntityType === 'section' && selectedSection ? conditionalLogic[selectedSection.id] || [] : []} onLogicUpdated={fetchQuestions} />
          {selectedQuestion && <EditQuestionDialog open={isEditDialogOpen} onOpenChange={open => {
        if (!open) handleCloseEditDialog();else setIsEditDialogOpen(open);
      }} question={selectedQuestion} answerOptions={answerOptions[selectedQuestion.id] || []} onQuestionUpdated={fetchQuestions} sections={sections} />}
        </>}
    </div>;
};

export default QuestionList;
