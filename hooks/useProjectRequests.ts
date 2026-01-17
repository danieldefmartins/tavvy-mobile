/**
 * useProjectRequests Hook
 * Fetches and manages project requests (leads) from the database
 * Used by: ProsLeadsScreen, Pro Dashboard
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export type ProjectRequest = {
  id: string;
  category_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city: string;
  state: string;
  zip_code: string;
  description: string;
  dynamic_answers: Record<string, any>;
  photos: string[];
  status: string;
  is_anonymous_submission: boolean;
  contact_info_approved: boolean;
  created_at: string;
  timeline: string;
};

export function useProjectRequests() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all project requests (anonymous leads)
   */
  const fetchProjectRequests = useCallback(async (categoryId?: string, city?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('project_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRequests(data || []);
      return data || [];
    } catch (err: any) {
      console.error('Error fetching project requests:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single project request by ID
   */
  const getProjectRequest = useCallback(async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data as ProjectRequest;
    } catch (err: any) {
      console.error('Error fetching project request:', err);
      throw err;
    }
  }, []);

  /**
   * Create a bid/response to a project request
   */
  const createBid = useCallback(async (
    requestId: string,
    proId: string,
    estimateMin: number,
    estimateMax: number,
    message: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('project_bids')
        .insert({
          project_request_id: requestId,
          pro_id: proId,
          estimate_min: estimateMin,
          estimate_max: estimateMax,
          message: message,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating bid:', err);
      throw err;
    }
  }, []);

  /**
   * Approve contact info sharing for a project request
   */
  const approveContactInfo = useCallback(async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_requests')
        .update({ contact_info_approved: true })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error approving contact info:', err);
      throw err;
    }
  }, []);

  /**
   * Subscribe to real-time updates for project requests
   */
  const subscribeToRequests = useCallback((callback: (request: ProjectRequest) => void) => {
    const subscription = supabase
      .channel('project_requests_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_requests' },
        (payload) => {
          callback(payload.new as ProjectRequest);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    requests,
    loading,
    error,
    fetchProjectRequests,
    getProjectRequest,
    createBid,
    approveContactInfo,
    subscribeToRequests,
  };
}
