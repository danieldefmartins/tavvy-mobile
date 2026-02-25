/**
 * eCard Editor Context -- wraps the editor reducer and provides
 * typed dispatch + state to all editor section components.
 *
 * React Native port: queries Supabase directly instead of via lib/ecard.ts abstraction.
 * Uses `digital_cards` and `digital_card_links` tables.
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  EditorState,
  EditorAction,
  CardData,
  LinkItem,
  editorReducer,
  initialEditorState,
} from './editorReducer';
import { supabase } from '../../lib/supabaseClient';
import { resolveTemplateId } from '../../config/eCardTemplates';

// ── Context shape ────────────────────────────────────────────────────────────

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  loadCard: (cardId: string) => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const loadCard = useCallback(async (cardId: string) => {
    try {
      // Fetch card and links in parallel
      const [cardResult, linksResult] = await Promise.all([
        supabase
          .from('digital_cards')
          .select('*')
          .eq('id', cardId)
          .single(),
        supabase
          .from('digital_card_links')
          .select('*')
          .eq('card_id', cardId)
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      if (cardResult.error || !cardResult.data) {
        dispatch({
          type: 'SET_LOAD_ERROR',
          error: cardResult.error?.message || 'Card not found',
        });
        return;
      }

      const card = cardResult.data;
      const links = linksResult.data || [];

      // Normalize featured_socials: handle both flat strings and objects
      const rawSocials = card.featured_socials || [];
      const normalizedSocials = Array.isArray(rawSocials)
        ? rawSocials.map((item: any) => {
            if (typeof item === 'string') return { platform: item, url: '' };
            return item;
          })
        : [];

      // Resolve template ID (handles migration from old template IDs)
      const resolvedTemplate = resolveTemplateId(
        card.template_id || card.theme || 'basic'
      );

      const normalizedCard: CardData = {
        ...card,
        featured_socials: normalizedSocials,
        template_id: resolvedTemplate,
      };

      const normalizedLinks: LinkItem[] = links.map((l: any) => ({
        id: l.id,
        card_id: l.card_id,
        platform: l.icon || l.platform || 'other',
        title: l.title,
        url: l.url,
        icon: l.icon,
        sort_order: l.sort_order,
        is_active: l.is_active,
        clicks: l.clicks,
      }));

      dispatch({ type: 'LOAD_CARD', card: normalizedCard, links: normalizedLinks });
    } catch (err) {
      console.error('[EditorContext] Failed to load card:', err);
      dispatch({ type: 'SET_LOAD_ERROR', error: 'Failed to load card' });
    }
  }, []);

  return (
    <EditorContext.Provider value={{ state, dispatch, loadCard }}>
      {children}
    </EditorContext.Provider>
  );
}

// ── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Hook to access the editor context. Must be used within an EditorProvider.
 */
export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return ctx;
}
