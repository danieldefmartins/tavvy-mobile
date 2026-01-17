/**
 * useProsPendingRequests Hook
 * Handles auto-saving, resuming, and final creation of service requests.
 * Install path: hooks/useProsPendingRequests.ts
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export type PendingRequest = {
  id: string;
  user_id: string;
  category_id: string;
  step: number;
  form_data: any;
  updated_at: string;
};

export function useProsPendingRequests() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new finalized service request (lead)
   */
  const createRequest = async (requestData: {
    category_id: string;
    zip_code: string;
    city: string;
    state: string;
    description: string;
    dynamic_answers: any;
    photos?: string[];
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate complexity using the database function (optional, won't block submission)
      let complexityData = { level: 'Standard', score: 0, factors: [] };
      try {
        const { data, error: complexityError } = await supabase
          .rpc('calculate_job_complexity', { dynamic_answers: requestData.dynamic_answers });
        if (!complexityError && data) complexityData = data;
      } catch (err) {
        console.error('Complexity calculation error (non-blocking):', err);
      }

      const { data, error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          category_id: requestData.category_id,
          zip_code: requestData.zip_code,
          city: requestData.city,
          state: requestData.state,
          description: requestData.description,
          dynamic_answers: requestData.dynamic_answers,
          photos: requestData.photos || [],
          complexity_data: complexityData || { level: 'Standard', score: 0, factors: [] },
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = useCallback(async (categoryId: string, step: number, formData: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('pending_service_requests')
        .upsert({
          user_id: user.id,
          category_id: categoryId,
          step: step,
          form_data: formData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,category_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to save progress');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingRequest = useCallback(async (categoryId?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from('pending_service_requests')
        .select('*')
        .eq('user_id', user.id);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
      return data as PendingRequest | null;
    } catch (err) {
      console.error('Error fetching pending request:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pending request');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePendingRequest = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('pending_service_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting pending request:', err);
    }
  }, []);

  return {
    loading,
    error,
    createRequest,
    saveProgress,
    getPendingRequest,
    deletePendingRequest
  };
}
