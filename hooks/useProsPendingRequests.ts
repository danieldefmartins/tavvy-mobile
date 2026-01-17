/**
 * useProsPendingRequests Hook (FIXED FINAL)
 * Handles auto-saving, resuming, and final creation of service requests.
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

  const createRequest = async (requestData: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from('project_requests')
        .insert({
          user_id: user?.id || null,
          category_id: requestData.categoryId || requestData.category_id,
          zip_code: requestData.zipCode || requestData.zip_code,
          city: requestData.city,
          state: requestData.state,
          description: requestData.description,
          dynamic_answers: requestData.dynamicAnswers || requestData.dynamic_answers || {},
          photos: requestData.photos || [],
          status: 'pending',
          customer_name: requestData.customerName,
          customer_email: requestData.customerEmail,
          customer_phone: requestData.customerPhone,
          privacy_preference: requestData.privacyPreference,
          is_anonymous_submission: true,
          contact_info_approved: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err: any) {
      console.error('Submission error:', err);
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
      if (error && error.code !== 'PGRST116') throw error;
      return data as PendingRequest | null;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // RENAME THIS TO MATCH THE SCREEN'S EXPECTATION
  const deleteProgress = useCallback(async (categoryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('pending_service_requests')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId);
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
    deleteProgress // EXPORT AS deleteProgress
  };
}
