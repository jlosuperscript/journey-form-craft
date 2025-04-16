
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order_index: number;
};

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    setQuestions(data || []);
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      return;
    }

    fetchQuestions();
  };

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{question.text}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
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
            <p>Type: {question.type}</p>
            <p>Required: {question.required ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuestionList;
