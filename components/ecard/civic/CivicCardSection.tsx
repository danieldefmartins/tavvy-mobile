/**
 * CivicCardSection -- Interactive civic engagement section for politician eCards (mobile).
 *
 * Renders three tabs: Proposals (with reaction voting + thermometer bar),
 * Q&A (sorted by upvotes, with candidate answers), and Goals/Commitments
 * (progress summary + status-coded list).
 *
 * Port of the web CivicCardSection.tsx (~1,010 lines) adapted for React Native.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Enable LayoutAnimation on Android
// ---------------------------------------------------------------------------
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CivicProposal {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  reactions: { support: number; needs_improvement: number; disagree: number };
}

export interface CivicQuestion {
  id: string;
  questionText: string;
  upvoteCount: number;
  answerText: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface CivicCommitment {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
  sortOrder: number;
}

export interface CivicCardSectionProps {
  cardId?: string;
  proposals: CivicProposal[];
  questions: CivicQuestion[];
  commitments: CivicCommitment[];
  accentColor: string;
  secondaryColor?: string;
  isPreview?: boolean;
  isDark?: boolean;
}

// ---------------------------------------------------------------------------
// Sample data for wizard preview
// ---------------------------------------------------------------------------
export const SAMPLE_CIVIC_DATA = {
  proposals: [
    {
      id: '1',
      title: 'Better Public Transit',
      description:
        'Expand bus routes and frequency to reduce commute times by 30%.',
      sortOrder: 1,
      reactions: { support: 127, needs_improvement: 23, disagree: 8 },
    },
    {
      id: '2',
      title: 'Green Energy Initiative',
      description:
        'Transition 60% of municipal buildings to solar power within 4 years.',
      sortOrder: 2,
      reactions: { support: 98, needs_improvement: 31, disagree: 15 },
    },
    {
      id: '3',
      title: 'Affordable Housing Fund',
      description:
        'Create a $50M fund for affordable housing development.',
      sortOrder: 3,
      reactions: { support: 156, needs_improvement: 18, disagree: 12 },
    },
  ] as CivicProposal[],
  questions: [
    {
      id: '1',
      questionText: 'What is your plan for reducing crime in downtown?',
      upvoteCount: 45,
      answerText:
        'We will increase community policing and invest in youth programs.',
      answeredAt: '2024-03-15',
      createdAt: '2024-03-10',
    },
    {
      id: '2',
      questionText: 'How will you address the teacher shortage?',
      upvoteCount: 32,
      answerText: null,
      answeredAt: null,
      createdAt: '2024-03-12',
    },
  ] as CivicQuestion[],
  commitments: [
    {
      id: '1',
      title: 'Fix potholes on Main Street',
      description: 'Complete road repairs within first 100 days.',
      status: 'completed' as const,
      sortOrder: 1,
    },
    {
      id: '2',
      title: 'Launch youth mentorship program',
      description: 'Partner with schools for after-school programs.',
      status: 'in_progress' as const,
      sortOrder: 2,
    },
    {
      id: '3',
      title: 'Build new community center',
      description: 'State-of-the-art facility in the East District.',
      status: 'planned' as const,
      sortOrder: 3,
    },
  ] as CivicCommitment[],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
type TabKey = 'proposals' | 'questions' | 'commitments';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'proposals', label: 'Proposals', icon: 'document-text-outline' },
  { key: 'questions', label: 'Q&A', icon: 'chatbubble-ellipses-outline' },
  { key: 'commitments', label: 'Goals', icon: 'flag-outline' },
];

const REACTION_TYPES = [
  {
    type: 'support' as const,
    emoji: '\uD83D\uDC4D',
    label: 'Support',
    color: '#22c55e',
  },
  {
    type: 'needs_improvement' as const,
    emoji: '\uD83E\uDD14',
    label: 'Review',
    color: '#f59e0b',
  },
  {
    type: 'disagree' as const,
    emoji: '\uD83D\uDC4E',
    label: 'Disagree',
    color: '#ef4444',
  },
];

const STATUS_CONFIG: Record<
  CivicCommitment['status'],
  { icon: string; label: string; color: string; bg: string; border: string }
> = {
  completed: {
    icon: 'checkmark-circle',
    label: 'Completed',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#22c55e',
  },
  in_progress: {
    icon: 'sync-circle',
    label: 'In Progress',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#f59e0b',
  },
  planned: {
    icon: 'clipboard-outline',
    label: 'Planned',
    color: '#94a3b8',
    bg: '#f8fafc',
    border: '#cbd5e1',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(100,100,100,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const CivicCardSection: React.FC<CivicCardSectionProps> = ({
  proposals: initialProposals,
  questions: initialQuestions,
  commitments,
  accentColor,
  isPreview = false,
  isDark = false,
}) => {
  // -- state ---------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabKey>('proposals');
  const [proposals, setProposals] = useState(initialProposals);
  const [questions] = useState(initialQuestions);
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(
    null,
  );
  const [userReactions, setUserReactions] = useState<Record<string, string>>(
    {},
  );

  // -- theme palette -------------------------------------------------------
  const t = useMemo(
    () => ({
      card: isDark ? '#1e1e2e' : '#FFFFFF',
      cardBorder: isDark ? '#2a2a3e' : '#f0f0f0',
      textPrimary: isDark ? '#e4e4f0' : '#1a1a2e',
      textSecondary: isDark ? '#a0a0b8' : '#666666',
      textMuted: isDark ? '#6e6e88' : '#999999',
      bg: isDark ? '#12121e' : '#f8f8f8',
      inputBg: isDark ? '#252538' : '#f8f8f8',
      inputBorder: isDark ? '#333350' : '#e8e8e8',
      shadow: isDark ? 'transparent' : 'rgba(0,0,0,0.04)',
    }),
    [isDark],
  );

  // -- handlers ------------------------------------------------------------
  const handleTabChange = useCallback((tab: TabKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  const toggleProposal = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedProposalId((prev) => (prev === id ? null : id));
  }, []);

  const handleReaction = useCallback(
    (proposalId: string, reactionType: string) => {
      if (isPreview) return;

      const prev = userReactions[proposalId];
      setUserReactions((r) => ({ ...r, [proposalId]: reactionType }));

      setProposals((ps) =>
        ps.map((p) => {
          if (p.id !== proposalId) return p;
          const nr = { ...p.reactions };
          if (prev) {
            nr[prev as keyof typeof nr] = Math.max(
              0,
              nr[prev as keyof typeof nr] - 1,
            );
          }
          nr[reactionType as keyof typeof nr]++;
          return { ...p, reactions: nr };
        }),
      );
    },
    [isPreview, userReactions],
  );

  // -- derived data --------------------------------------------------------
  const sortedProposals = useMemo(
    () => [...proposals].sort((a, b) => a.sortOrder - b.sortOrder),
    [proposals],
  );

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => b.upvoteCount - a.upvoteCount),
    [questions],
  );

  const sortedCommitments = useMemo(
    () => [...commitments].sort((a, b) => a.sortOrder - b.sortOrder),
    [commitments],
  );

  const commitmentCounts = useMemo(() => {
    const counts = { completed: 0, in_progress: 0, planned: 0 };
    commitments.forEach((c) => {
      counts[c.status]++;
    });
    return counts;
  }, [commitments]);

  // -----------------------------------------------------------------------
  // RENDER HELPERS
  // -----------------------------------------------------------------------

  // -- Tab Selector --------------------------------------------------------
  const renderTabs = () => (
    <View
      style={[
        styles.tabBar,
        { backgroundColor: t.bg, borderColor: t.cardBorder },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count =
          tab.key === 'proposals'
            ? proposals.length
            : tab.key === 'questions'
              ? questions.length
              : commitments.length;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && { backgroundColor: accentColor },
            ]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={14}
              color={isActive ? '#FFFFFF' : t.textMuted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? '#FFFFFF' : t.textSecondary },
                isActive && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
              {count > 0 ? ` (${count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // -- Thermometer Bar (reusable) ------------------------------------------
  const renderThermometer = (
    reactions: CivicProposal['reactions'],
    height: number = 6,
  ) => {
    const total =
      reactions.support + reactions.needs_improvement + reactions.disagree;
    if (total === 0) return null;

    const supportPct = (reactions.support / total) * 100;
    const improvePct = (reactions.needs_improvement / total) * 100;
    const disagreePct = (reactions.disagree / total) * 100;

    return (
      <View
        style={[
          styles.thermometerTrack,
          { height, backgroundColor: isDark ? '#2a2a3e' : '#f0f0f0' },
        ]}
      >
        {supportPct > 0 && (
          <View
            style={[
              styles.thermometerSegment,
              { width: `${supportPct}%` as any, backgroundColor: '#22c55e' },
            ]}
          />
        )}
        {improvePct > 0 && (
          <View
            style={[
              styles.thermometerSegment,
              { width: `${improvePct}%` as any, backgroundColor: '#f59e0b' },
            ]}
          />
        )}
        {disagreePct > 0 && (
          <View
            style={[
              styles.thermometerSegment,
              { width: `${disagreePct}%` as any, backgroundColor: '#ef4444' },
            ]}
          />
        )}
      </View>
    );
  };

  // -- Proposals Tab -------------------------------------------------------
  const renderProposals = () => {
    if (sortedProposals.length === 0) {
      return (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: t.card, borderColor: t.cardBorder },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={32}
            color={t.textMuted}
          />
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            No proposals yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {sortedProposals.map((proposal) => {
          const isExpanded = expandedProposalId === proposal.id;
          const pTotal =
            proposal.reactions.support +
            proposal.reactions.needs_improvement +
            proposal.reactions.disagree;
          const pSupportPct =
            pTotal > 0
              ? Math.round((proposal.reactions.support / pTotal) * 100)
              : 0;
          const userReaction = userReactions[proposal.id];

          return (
            <View
              key={proposal.id}
              style={[
                styles.proposalCard,
                {
                  backgroundColor: t.card,
                  borderColor: t.cardBorder,
                  shadowColor: t.shadow,
                },
              ]}
            >
              {/* Header - tappable to expand */}
              <TouchableOpacity
                style={styles.proposalHeader}
                onPress={() => toggleProposal(proposal.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.proposalTitle,
                      { color: t.textPrimary },
                    ]}
                  >
                    {proposal.title}
                  </Text>
                  {pTotal > 0 && (
                    <Text
                      style={[
                        styles.proposalMeta,
                        { color: t.textMuted },
                      ]}
                    >
                      {pSupportPct}% support - {pTotal} votes
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={t.textMuted}
                />
              </TouchableOpacity>

              {/* Expanded body */}
              {isExpanded && (
                <View style={styles.proposalBody}>
                  <Text
                    style={[
                      styles.proposalDescription,
                      { color: t.textSecondary },
                    ]}
                  >
                    {proposal.description}
                  </Text>

                  {/* Mini thermometer */}
                  {pTotal > 0 && (
                    <View style={{ marginBottom: 14 }}>
                      {renderThermometer(proposal.reactions)}
                    </View>
                  )}

                  {/* Reaction buttons */}
                  <View style={styles.reactionRow}>
                    {REACTION_TYPES.map(({ type, emoji, label, color }) => {
                      const isSelected = userReaction === type;
                      const count =
                        proposal.reactions[
                          type as keyof typeof proposal.reactions
                        ];
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.reactionButton,
                            {
                              backgroundColor: isSelected
                                ? hexToRgba(color, 0.15)
                                : isDark
                                  ? '#252538'
                                  : '#f8f8f8',
                              borderColor: isSelected
                                ? color
                                : 'transparent',
                              borderWidth: isSelected ? 1.5 : 0,
                            },
                          ]}
                          onPress={() =>
                            handleReaction(proposal.id, type)
                          }
                          activeOpacity={isPreview ? 1 : 0.7}
                          disabled={isPreview}
                        >
                          <Text style={styles.reactionEmoji}>{emoji}</Text>
                          <Text
                            style={[
                              styles.reactionLabel,
                              {
                                color: isSelected
                                  ? color
                                  : t.textSecondary,
                              },
                            ]}
                          >
                            {label}
                          </Text>
                          {count > 0 && (
                            <Text
                              style={[
                                styles.reactionCount,
                                { color: t.textMuted },
                              ]}
                            >
                              {count}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // -- Q&A Tab -------------------------------------------------------------
  const renderQuestions = () => {
    if (sortedQuestions.length === 0) {
      return (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: t.card, borderColor: t.cardBorder },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={32}
            color={t.textMuted}
          />
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            No questions yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {sortedQuestions.map((q) => (
          <View
            key={q.id}
            style={[
              styles.questionCard,
              {
                backgroundColor: t.card,
                borderColor: t.cardBorder,
                shadowColor: t.shadow,
              },
            ]}
          >
            <View style={styles.questionRow}>
              {/* Upvote button */}
              <TouchableOpacity
                style={[
                  styles.upvoteButton,
                  {
                    backgroundColor: isDark ? '#252538' : '#f8f8f8',
                    borderColor: t.inputBorder,
                  },
                ]}
                activeOpacity={isPreview ? 1 : 0.7}
                disabled={isPreview}
              >
                <Ionicons
                  name="chevron-up"
                  size={18}
                  color={accentColor}
                />
                <Text
                  style={[
                    styles.upvoteCount,
                    { color: t.textPrimary },
                  ]}
                >
                  {q.upvoteCount}
                </Text>
              </TouchableOpacity>

              {/* Question content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.questionText,
                    { color: t.textPrimary },
                  ]}
                >
                  {q.questionText}
                </Text>

                {/* Candidate answer */}
                {q.answerText && (
                  <View
                    style={[
                      styles.answerBox,
                      {
                        backgroundColor: hexToRgba(accentColor, 0.06),
                        borderLeftColor: accentColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.answerLabel,
                        { color: accentColor },
                      ]}
                    >
                      Candidate's answer
                    </Text>
                    <Text
                      style={[
                        styles.answerText,
                        { color: t.textSecondary },
                      ]}
                    >
                      {q.answerText}
                    </Text>
                  </View>
                )}

                {/* Unanswered indicator */}
                {!q.answerText && (
                  <View style={styles.pendingBadge}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={t.textMuted}
                    />
                    <Text
                      style={[
                        styles.pendingText,
                        { color: t.textMuted },
                      ]}
                    >
                      Awaiting answer
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // -- Goals / Commitments Tab ---------------------------------------------
  const renderCommitments = () => {
    if (sortedCommitments.length === 0) {
      return (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: t.card, borderColor: t.cardBorder },
          ]}
        >
          <Ionicons name="flag-outline" size={32} color={t.textMuted} />
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            No goals yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Progress summary */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: t.card,
              borderColor: t.cardBorder,
              shadowColor: t.shadow,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            {(
              ['completed', 'in_progress', 'planned'] as const
            ).map((status) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <View key={status} style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: cfg.color }]}>
                    {commitmentCounts[status]}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: t.textMuted }]}>
                    {cfg.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Commitment list */}
        {sortedCommitments.map((c) => {
          const cfg = STATUS_CONFIG[c.status];

          return (
            <View
              key={c.id}
              style={[
                styles.commitmentCard,
                {
                  backgroundColor: t.card,
                  borderColor: t.cardBorder,
                  borderLeftColor: cfg.border,
                  shadowColor: t.shadow,
                },
              ]}
            >
              <View style={styles.commitmentRow}>
                <Ionicons
                  name={cfg.icon as any}
                  size={20}
                  color={cfg.color}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.commitmentTitle,
                      { color: t.textPrimary },
                    ]}
                  >
                    {c.title}
                  </Text>
                  {c.description ? (
                    <Text
                      style={[
                        styles.commitmentDesc,
                        { color: t.textSecondary },
                      ]}
                    >
                      {c.description}
                    </Text>
                  ) : null}

                  {/* Status badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: cfg.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusBadgeText, { color: cfg.color }]}
                    >
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // -----------------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {renderTabs()}

      {activeTab === 'proposals' && renderProposals()}
      {activeTab === 'questions' && renderQuestions()}
      {activeTab === 'commitments' && renderCommitments()}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 4,
  },

  // -- Tabs ----------------------------------------------------------------
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },

  // -- Tab content wrapper -------------------------------------------------
  tabContent: {
    gap: 10,
  },

  // -- Empty state ---------------------------------------------------------
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },

  // -- Proposal card -------------------------------------------------------
  proposalCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  proposalTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  proposalMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  proposalBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  proposalDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },

  // -- Thermometer ---------------------------------------------------------
  thermometerTrack: {
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  thermometerSegment: {
    height: '100%',
  },

  // -- Reaction buttons ----------------------------------------------------
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 3,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  reactionCount: {
    fontSize: 10,
  },

  // -- Question card -------------------------------------------------------
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  questionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  upvoteButton: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 44,
  },
  upvoteCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // -- Answer box ----------------------------------------------------------
  answerBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 13,
    lineHeight: 19,
  },

  // -- Pending badge -------------------------------------------------------
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  pendingText: {
    fontSize: 12,
  },

  // -- Summary card --------------------------------------------------------
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  // -- Commitment card -----------------------------------------------------
  commitmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  commitmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commitmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  commitmentDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CivicCardSection;
