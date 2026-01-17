/**
 * useProsServiceQuestions Hook
 * Fetches dynamic, category-specific questions from Supabase
 * 
 * This enables a Yelp/Thumbtack-style progressive questioning system
 * where questions are tailored to the specific service category.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export type ServiceQuestion = {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text' | 'number';
  options?: string[] | null;
  order: number;
  required: boolean;
};

/**
 * Fetch all questions for a specific service category
 * Questions are ordered by the 'order' field for consistent display
 */
export function useProsServiceQuestions(categoryId?: string) {
  return useQuery({
    queryKey: ['pros', 'service_questions', categoryId],
    queryFn: async (): Promise<ServiceQuestion[]> => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from('service_category_questions')
        .select('id, category_id, question_text, question_type, options, order, required')
        .eq('category_id', categoryId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching service questions:', error);
        throw error;
      }

      // Parse options from JSONB if they're stored as JSON
      return (data ?? []).map((q) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      })) as ServiceQuestion[];
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 2,
  });
}

/**
 * Fetch a single question by ID
 */
export function useProsServiceQuestion(questionId?: string) {
  return useQuery({
    queryKey: ['pros', 'service_question', questionId],
    queryFn: async (): Promise<ServiceQuestion | null> => {
      if (!questionId) return null;

      const { data, error } = await supabase
        .from('service_category_questions')
        .select('id, category_id, question_text, question_type, options, order, required')
        .eq('id', questionId)
        .single();

      if (error) {
        console.error('Error fetching service question:', error);
        return null;
      }

      if (!data) return null;

      return {
        ...data,
        options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options,
      } as ServiceQuestion;
    },
    enabled: !!questionId,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
