/**
 * CivicSection -- political/civic card fields.
 * Only shown when template is civic-card* or politician-generic.
 *
 * React Native port of the web CivicSection.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import EditorField from '../shared/EditorField';

interface CivicSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function CivicSection({ isDark }: CivicSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  if (!card) return null;

  const set = (field: string, value: string) =>
    dispatch({ type: 'SET_FIELD', field: field as any, value });

  return (
    <EditorSection
      id="civic"
      title="Civic & Campaign"
      icon="flag"
      defaultOpen={true}
      isDark={isDark}
    >
      <EditorField
        label="Ballot Number"
        value={card.ballot_number || ''}
        onChange={(v) => set('ballot_number', v)}
        placeholder="e.g. 12345"
        isDark={isDark}
      />

      <EditorField
        label="Party Name"
        value={card.party_name || ''}
        onChange={(v) => set('party_name', v)}
        placeholder="e.g. Democratic Party"
        isDark={isDark}
      />

      <EditorField
        label="Office Running For"
        value={card.office_running_for || ''}
        onChange={(v) => set('office_running_for', v)}
        placeholder="e.g. Mayor, City Council"
        isDark={isDark}
      />

      <EditorField
        label="Election Year"
        value={card.election_year || ''}
        onChange={(v) => {
          // Only allow numeric input for election year
          const cleaned = v.replace(/[^0-9]/g, '');
          set('election_year', cleaned);
        }}
        placeholder="e.g. 2026"
        isDark={isDark}
        maxLength={4}
      />

      <EditorField
        label="Campaign Slogan"
        value={card.campaign_slogan || ''}
        onChange={(v) => set('campaign_slogan', v)}
        placeholder="Your campaign slogan"
        isDark={isDark}
        maxLength={120}
      />

      <EditorField
        label="Region"
        value={card.region || ''}
        onChange={(v) => set('region', v)}
        placeholder="e.g. S\u00E3o Paulo, District 5"
        isDark={isDark}
      />
    </EditorSection>
  );
}

const styles = StyleSheet.create({});
