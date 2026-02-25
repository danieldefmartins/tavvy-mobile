/**
 * TypePicker -- Step 1 of creation wizard: choose card type.
 * Business, Personal, or Politician (with inline country picker).
 *
 * Ported from web: components/ecard/wizard/TypePicker.tsx
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const ACCENT = '#00C853';

// ── Country list (matches web) ──────────────────────────────
interface Country {
  code: string;
  name: string;
  nameLocal: string;
  flag: string;
  featured: boolean;
  template: string;
}

const COUNTRIES: Country[] = [
  { code: 'BR', name: 'Brazil', nameLocal: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}', featured: true, template: 'civic-card' },
  { code: 'US', name: 'United States', nameLocal: 'Estados Unidos', flag: '\u{1F1FA}\u{1F1F8}', featured: false, template: 'politician-generic' },
  { code: 'GB', name: 'United Kingdom', nameLocal: 'Reino Unido', flag: '\u{1F1EC}\u{1F1E7}', featured: false, template: 'politician-generic' },
  { code: 'CA', name: 'Canada', nameLocal: 'Canad\u00e1', flag: '\u{1F1E8}\u{1F1E6}', featured: false, template: 'politician-generic' },
  { code: 'MX', name: 'Mexico', nameLocal: 'M\u00e9xico', flag: '\u{1F1F2}\u{1F1FD}', featured: false, template: 'politician-generic' },
  { code: 'AR', name: 'Argentina', nameLocal: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}', featured: false, template: 'politician-generic' },
  { code: 'CO', name: 'Colombia', nameLocal: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}', featured: false, template: 'politician-generic' },
  { code: 'PT', name: 'Portugal', nameLocal: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}', featured: false, template: 'politician-generic' },
  { code: 'ES', name: 'Spain', nameLocal: 'Espa\u00f1a', flag: '\u{1F1EA}\u{1F1F8}', featured: false, template: 'politician-generic' },
  { code: 'FR', name: 'France', nameLocal: 'France', flag: '\u{1F1EB}\u{1F1F7}', featured: false, template: 'politician-generic' },
  { code: 'DE', name: 'Germany', nameLocal: 'Deutschland', flag: '\u{1F1E9}\u{1F1EA}', featured: false, template: 'politician-generic' },
  { code: 'AU', name: 'Australia', nameLocal: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', featured: false, template: 'politician-generic' },
  { code: 'IN', name: 'India', nameLocal: '\u092d\u093e\u0930\u0924', flag: '\u{1F1EE}\u{1F1F3}', featured: false, template: 'politician-generic' },
  { code: 'NG', name: 'Nigeria', nameLocal: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}', featured: false, template: 'politician-generic' },
  { code: 'JP', name: 'Japan', nameLocal: '\u65e5\u672c', flag: '\u{1F1EF}\u{1F1F5}', featured: false, template: 'politician-generic' },
];

// ── Type option definitions ─────────────────────────────────
interface TypeOption {
  id: string;
  name: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const TYPE_OPTIONS: TypeOption[] = [
  { id: 'business', name: 'Business', desc: 'For your company, store, or service', icon: 'business-outline', gradient: ['#3B82F6', '#1D4ED8'] },
  { id: 'personal', name: 'Personal', desc: 'Your personal brand & link page', icon: 'person', gradient: ['#8B5CF6', '#6D28D9'] },
  { id: 'politician', name: 'Politician', desc: 'For public servants & candidates', icon: 'flag-outline', gradient: [ACCENT, '#00A843'] },
];

// ── Props ───────────────────────────────────────────────────
interface TypePickerProps {
  onSelect: (type: string, countryCode?: string, countryTemplate?: string) => void;
  isDark: boolean;
}

export default function TypePicker({ onSelect, isDark }: TypePickerProps) {
  const [showCountries, setShowCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#888888';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7';

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameLocal.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [countrySearch]);

  // ── Country picker view ───────────────────────────────────
  if (showCountries) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.countryHeader}>
          <TouchableOpacity
            onPress={() => setShowCountries(false)}
            style={styles.countryBackBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color={textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.countryHeaderTitle, { color: textPrimary }]}>
              Select your country
            </Text>
            <Text style={[styles.countryHeaderSubtitle, { color: textSecondary }]}>
              Choose where the politician operates
            </Text>
          </View>
        </View>

        {/* Search input */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
              borderColor: border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search country..."
            placeholderTextColor={textSecondary}
            value={countrySearch}
            onChangeText={setCountrySearch}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {countrySearch.length > 0 && (
            <TouchableOpacity onPress={() => setCountrySearch('')}>
              <Ionicons name="close" size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Country list */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          style={styles.countryList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: country }) => (
            <TouchableOpacity
              onPress={() => onSelect('politician', country.code, country.template)}
              activeOpacity={0.7}
              style={[
                styles.countryRow,
                {
                  backgroundColor: country.featured
                    ? isDark
                      ? 'rgba(0,200,83,0.08)'
                      : 'rgba(0,200,83,0.06)'
                    : 'transparent',
                  borderColor: country.featured ? `${ACCENT}33` : 'transparent',
                  borderWidth: country.featured ? 1.5 : 0,
                  borderBottomWidth: country.featured ? 1.5 : 1,
                  borderBottomColor: country.featured ? `${ACCENT}33` : border,
                },
              ]}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.countryName,
                    {
                      color: textPrimary,
                      fontWeight: country.featured ? '600' : '500',
                    },
                  ]}
                >
                  {country.name}
                </Text>
                {country.nameLocal !== country.name && (
                  <Text style={[styles.countryLocalName, { color: textSecondary }]}>
                    {country.nameLocal}
                  </Text>
                )}
              </View>
              {country.featured && (
                <View style={styles.civicBadge}>
                  <Text style={styles.civicBadgeText}>Civic Card</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ── Type selection view ───────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textPrimary }]}>What kind of card?</Text>
      <Text style={[styles.subtitle, { color: textSecondary }]}>
        Select the type that best fits your needs
      </Text>

      <View style={styles.optionsContainer}>
        {TYPE_OPTIONS.map(({ id, name, desc, icon, gradient }, index) => (
          <Animated.View
            key={id}
            entering={FadeInDown.delay(index * 100).duration(400).springify()}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                id === 'politician' ? setShowCountries(true) : onSelect(id);
              }}
              style={[
                styles.typeCard,
                {
                  backgroundColor: cardBg,
                  borderColor: border,
                },
              ]}
            >
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons name={icon} size={26} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeName, { color: textPrimary }]}>{name}</Text>
                <Text style={[styles.typeDesc, { color: textSecondary }]}>{desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Type selection
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 13,
  },

  // Country picker
  countryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  countryBackBtn: {
    padding: 6,
  },
  countryHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countryHeaderSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  countryList: {
    flex: 1,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  countryFlag: {
    fontSize: 28,
  },
  countryName: {
    fontSize: 15,
  },
  countryLocalName: {
    fontSize: 12,
    marginTop: 1,
  },
  civicBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  civicBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
