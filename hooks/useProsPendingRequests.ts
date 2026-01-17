/**
 * useProsPendingRequests Hook (FIXED)
 * Handles auto-saving, resuming, and final creation of service requests.
 * 
 * CHANGES:
 * 1. Removed mandatory auth check to allow anonymous submissions.
 * 2. Updated table name to 'project_requests' to match database.
 * 3. Added support for anonymous tracking fields.
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
    categoryId: string;
    zipCode: string;
    city: string;
    state: string;
    description: string;
    dynamicAnswers: any;
    photos?: string[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    privacyPreference?: string;
    isAnonymousSubmission?: boolean;
    contactInfoApproved?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      // Get current user if available, but don't block if not
      const { data: { user } } = await supabase.auth.getUser();

      // Calculate complexity using the database function (optional, won't block submission)
      let complexityData = { level: 'Standard', score: 0, factors: [] };
      try {
        const { data, error: complexityError } = await supabase
          .rpc('calculate_job_complexity', { dynamic_answers: requestData.dynamicAnswers });
        if (!complexityError && data) complexityData = data;
      } catch (err) {
        console.error('Complexity calculation error (non-blocking):', err);
      }

      // Use 'project_requests' as the primary table name
      const { data, error: insertError } = await supabase
        .from('project_requests')
        .insert({
          user_id: user?.id || null, // Optional user_id
          category_id: requestData.categoryId,
          zip_code: requestData.zipCode,
          city: requestData.city,
          state: requestData.state,
          description: requestData.description,
          dynamic_answers: requestData.dynamicAnswers,
          photos: requestData.photos || [],
          complexity_data: complexityData || { level: 'Standard', score: 0, factors: [] },
          status: 'pending',
          // Anonymous tracking fields
          customer_name: requestData.customerName,
          customer_email: requestData.customerEmail,
          customer_phone: requestData.customerPhone,
          privacy_preference: requestData.privacyPreference,
          is_anonymous_submission: requestData.isAnonymousSubmission ?? true,
          contact_info_approved: requestData.contactInfoApproved ?? false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }
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

  const deletePendingRequest = useCallback(async (categoryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('pending_service_requests')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId);
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
