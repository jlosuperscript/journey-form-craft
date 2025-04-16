
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import QuestionList from '@/components/ProductCatalogue/QuestionList';
import CreateQuestionDialog from '@/components/ProductCatalogue/CreateQuestionDialog';
import { useQuestions } from '@/hooks/useQuestions';

const ProductCatalogue: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { sections, fetchQuestions } = useQuestions();

  const handleQuestionCreated = () => {
    // Refresh questions immediately after creation
    fetchQuestions();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Catalogue</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Question
        </Button>
      </div>

      <QuestionList />

      <CreateQuestionDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        sections={sections}
        onQuestionCreated={handleQuestionCreated}
      />
    </div>
  );
};

export default ProductCatalogue;
