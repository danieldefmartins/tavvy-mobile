import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TEMPLATES, Template, getFreeTemplates, getPaidTemplates, getTemplatesForUser } from '../config/eCardTemplates';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.52;

// Sample images for realistic previews
const SAMPLE_AVATAR = require('../assets/ecard-sample-avatar.png');
const SAMPLE_BANNER = require('../assets/ecard-sample-banner.jpg');

interface RouteParams {
  mode?: 'create' | 'edit';
  cardId?: string;
  cardType?: 'business' | 'personal' | 'politician';
  existingData?: any;
  existingLinks?: any[];
  existingFeaturedSocials?: any[];
  preserveData?: boolean;
}

// All general templates shared by Business and Personal
const ALL_GENERAL_TEMPLATES = [
  'biz-traditional', 'biz-modern', 'biz-minimalist',
  'basic', 'blogger', 'business-card', 'pro-card',
  'cover-card', 'full-width', 'pro-realtor',
  'pro-creative', 'pro-corporate', 'premium-static',
];

// Card type → template ID mapping
const CARD_TYPE_TEMPLATES: Record<string, string[]> = {
  business: ALL_GENERAL_TEMPLATES,
  personal: ALL_GENERAL_TEMPLATES,
  politician: ['civic-card', 'civic-card-flag', 'civic-card-bold', 'civic-card-clean', 'civic-card-rally'],
};

// Super admin emails that have full access to all templates
const SUPER_ADMIN_EMAILS = [
  'daniel@360forbusiness.com',
  'alineedaniel@gmail.com',
  'alinecmartins4@gmail.com',
];

// ============================================================
// TEMPLATE-SPECIFIC PREVIEW RENDERERS
// Each one matches the reference images pixel-perfectly
// ============================================================

// --- BASIC: Linktree style ---
const BasicPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: colors.primary }]}>
    <View style={{ alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, flex: 1 }}>
      <Image source={SAMPLE_AVATAR} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 14 }} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>@janesmith</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
        Content creator & digital strategist helping brands grow online
      </Text>
      {['Get in Touch', 'Freebies & Resources', 'Read our Latest Blog', 'Shop Templates', 'Visit the Website'].map((label, i) => (
        <View key={i} style={{
          width: '100%', height: 48, borderRadius: 10,
          backgroundColor: colors.accent, marginBottom: 12,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: colors.accent === '#2d3436' || colors.accent === '#e94560' ? '#fff' : colors.primary, fontSize: 14, fontWeight: '500' }}>{label}</Text>
        </View>
      ))}
    </View>
  </View>
);

// --- BLOGGER: Hannah Stone style ---
const BloggerPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: colors.primary || colors.background }]}>
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 50, paddingHorizontal: 16 }}>
      {/* White inner card */}
      <View style={{
        backgroundColor: colors.cardBg || '#FFFFFF', borderRadius: 16, width: '100%', flex: 1,
        alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
        marginTop: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
      }}>
        <Text style={{ fontSize: 28, fontStyle: 'italic', fontWeight: '300', color: colors.text, marginBottom: 6 }}>Jane Smith</Text>
        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 20 }}>
          BUSINESS COACH & ENTREPRENEUR
        </Text>
        {['ABOUT', 'MY BLOG', 'SHOP', 'NEWSLETTER', 'FREEBIE', 'CONTACT'].map((label, i) => (
          <View key={i} style={{
            width: '100%', height: 40, borderRadius: 4,
            backgroundColor: colors.accent ? `${colors.accent}30` : `${colors.primary}30`,
            marginBottom: 10, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
          </View>
        ))}
      </View>
      {/* Overlapping circle photo */}
      <Image source={SAMPLE_AVATAR} style={{
        width: 110, height: 110, borderRadius: 55,
        position: 'absolute', top: 0,
        borderWidth: 4, borderColor: colors.cardBg || '#FFFFFF',
      }} />
    </View>
  </View>
);

// --- BUSINESS CARD: EdgeKart / Thomas Smith style ---
const BusinessCardPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: colors.cardBg || '#f8f9fa' }]}>
    {/* Dark top section */}
    <LinearGradient colors={[colors.primary, colors.secondary]} style={{
      paddingTop: 24, paddingBottom: 20, alignItems: 'center', paddingHorizontal: 20,
    }}>
      {/* Company logo + name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <Ionicons name="diamond" size={12} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>EdgeKart</Text>
      </View>
      {/* Circle photo */}
      <Image source={SAMPLE_AVATAR} style={{
        width: 96, height: 96, borderRadius: 48,
        borderWidth: 3, borderColor: colors.accent || '#fff',
        marginBottom: 14,
      }} />
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 2 }}>Thomas Smith</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>(He/Him)</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 }}>Solutions Manager</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>EdgeKart Public Solutions LLP</Text>
    </LinearGradient>

    {/* Action icon circles */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 16 }}>
      {[
        { icon: 'call', color: colors.accent || '#3b82f6' },
        { icon: 'mail', color: colors.accent || '#3b82f6' },
        { icon: 'globe', color: colors.accent || '#3b82f6' },
        { icon: 'location', color: colors.accent || '#3b82f6' },
      ].map((item, i) => (
        <View key={i} style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={item.icon as any} size={20} color={colors.text} />
        </View>
      ))}
    </View>

    {/* White bottom - About Me */}
    <View style={{ paddingHorizontal: 24, paddingTop: 8, flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>About Me</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18 }}>
        I am a skilled Solutions Manager with seven years of experience in solving problems and engaging customers across industries.
      </Text>
    </View>
  </View>
);

// --- FULL WIDTH: John Richards style ---
const FullWidthPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: colors.cardBg || '#0a0a0a' }]}>
    {/* Hero photo with gradient overlay */}
    <View style={{ height: CARD_HEIGHT * 0.52, position: 'relative', overflow: 'hidden' }}>
      <Image source={SAMPLE_AVATAR} style={{
        width: '100%', height: '100%', resizeMode: 'cover',
      }} />
      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', colors.primary || 'rgba(0,0,0,0.85)']}
        style={{ ...StyleSheet.absoluteFillObject }}
      />
      {/* Name overlaid on photo */}
      <View style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 }}>JANE{'\n'}SMITH</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Marketing Manager</Text>
        {/* Company pill */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: colors.accent || '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.3)', marginRight: 6 }} />
          <Text style={{ fontSize: 11, color: colors.primary === '#000000' ? '#000' : '#fff', fontWeight: '600' }}>Teamwork.Co</Text>
        </View>
      </View>
    </View>

    {/* Action icons row */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 14 }}>
      {['call', 'mail', 'chatbubble', 'globe', 'share-social'].map((icon, i) => (
        <View key={i} style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: colors.accent || '#333', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon as any} size={18} color={colors.primary === '#000000' ? '#000' : '#fff'} />
        </View>
      ))}
    </View>

    {/* About Me section */}
    <View style={{ paddingHorizontal: 20, flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>About Me</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
        Hi, I am Flody, working as marketing manager at Teamwork.co with a passion for building brands.
      </Text>
    </View>
  </View>
);

// --- PRO REALTOR: Hannah Realtor style ---
const ProRealtorPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: colors.primary || colors.background }]}>
    {/* Banner image */}
    <Image source={SAMPLE_BANNER} style={{
      width: '100%', height: CARD_HEIGHT * 0.28, resizeMode: 'cover',
    }} />

    {/* Arch photo overlapping banner */}
    <View style={{ alignItems: 'center', marginTop: -70 }}>
      <View style={{
        width: 120, height: 150, borderTopLeftRadius: 60, borderTopRightRadius: 60,
        borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
        overflow: 'hidden', borderWidth: 3, borderColor: colors.border || colors.accent || '#c8a87c',
        backgroundColor: '#f0f0f0',
      }}>
        <Image source={SAMPLE_AVATAR} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
      </View>
    </View>

    {/* Name section */}
    <View style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 12 }}>
      <Text style={{ fontSize: 20, color: colors.text }}>
        <Text style={{ fontWeight: '400' }}>HI </Text>
        <Text style={{ fontWeight: '800' }}>I'M JANE,</Text>
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
        YOUR LOCAL REALTOR
      </Text>
    </View>

    {/* Link buttons */}
    <View style={{ paddingHorizontal: 24, marginTop: 14 }}>
      {['ALL ABOUT ME', 'CLIENT TESTIMONIALS', 'VISIT MY WEBSITE', 'BOOK A FREE CONSULTATION'].map((label, i) => (
        <View key={i} style={{
          width: '100%', height: 40, borderRadius: 4,
          backgroundColor: colors.accent ? `${colors.accent}40` : 'rgba(200,168,124,0.25)',
          marginBottom: 8, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
        </View>
      ))}
    </View>

    {/* Social icons row */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 10 }}>
      {['logo-instagram', 'logo-twitter', 'logo-pinterest', 'logo-linkedin', 'logo-facebook', 'globe'].map((icon, i) => (
        <View key={i} style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: colors.accent || '#c8a87c', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon as any} size={16} color={colors.primary.startsWith('#f') || colors.primary === '#FFFFFF' ? '#fff' : colors.text} />
        </View>
      ))}
    </View>

    {/* Company footer bar */}
    <View style={{
      backgroundColor: colors.accent || '#c8a87c', paddingVertical: 8, alignItems: 'center',
      borderTopWidth: 2, borderTopColor: colors.border || colors.accent || '#c8a87c',
    }}>
      <Text style={{ fontSize: 9, fontWeight: '600', color: colors.primary.startsWith('#f') || colors.primary === '#FFFFFF' ? '#fff' : colors.text, letterSpacing: 2, textTransform: 'uppercase' }}>
        YOUR COMPANY NAME HERE
      </Text>
    </View>
  </View>
);

// --- PRO CREATIVE: Arianne / A.Rich Culture style ---
const ProCreativePreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF' }]}>
    {/* Colored top section */}
    <LinearGradient colors={[colors.primary, colors.secondary]} style={{
      height: CARD_HEIGHT * 0.42, alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Company logo badge in corner */}
      <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: colors.accent || '#f97316', width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>ARC</Text>
      </View>
      {/* Large circle photo */}
      <Image source={SAMPLE_AVATAR} style={{
        width: 130, height: 130, borderRadius: 65,
        borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)',
      }} />
    </LinearGradient>

    {/* Wave divider */}
    <Svg height="30" width={CARD_WIDTH} viewBox={`0 0 ${CARD_WIDTH} 30`} style={{ marginTop: -30 }}>
      <Path
        d={`M0,0 L0,10 Q${CARD_WIDTH * 0.25},30 ${CARD_WIDTH * 0.5},10 Q${CARD_WIDTH * 0.75},-10 ${CARD_WIDTH},10 L${CARD_WIDTH},0 Z`}
        fill={colors.primary}
      />
    </Svg>

    {/* White bottom section */}
    <View style={{ paddingHorizontal: 20, flex: 1, paddingTop: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 2 }}>Arianne S. Richardson</Text>
      <Text style={{ fontSize: 13, color: '#4b5563' }}>Founder & Principal Consultant</Text>
      <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.accent || colors.primary, marginBottom: 8 }}>A.Rich Culture</Text>
      <Text style={{ fontSize: 11, color: '#6b7280', lineHeight: 16, marginBottom: 12 }}>
        Business Consulting & Talent Management for Caribbean Creatives
      </Text>

      {/* Contact rows with colored icons */}
      {[
        { icon: 'mail', color: '#f97316', text: 'mail@arichculture.com' },
        { icon: 'call', color: '#22c55e', text: '+1 561 485 7408' },
        { icon: 'chatbubble', color: '#3b82f6', text: '12425568247' },
        { icon: 'globe', color: colors.primary, text: 'www.arichculture.com' },
      ].map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: row.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name={row.icon as any} size={16} color="#fff" />
          </View>
          <Text style={{ fontSize: 12, color: '#374151' }}>{row.text}</Text>
        </View>
      ))}
    </View>
  </View>
);

// --- PRO CORPORATE: Arch Gleason / Blue style ---
const ProCorporatePreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF' }]}>
    {/* Blue gradient top with decorative circles */}
    <LinearGradient colors={[colors.primary, colors.secondary]} style={{
      height: CARD_HEIGHT * 0.28, position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0,
    }}>
      {/* Decorative translucent circles */}
      <View style={{ position: 'absolute', left: -30, top: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <View style={{ position: 'absolute', left: 10, top: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View style={{ position: 'absolute', right: -20, top: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' }} />
    </LinearGradient>

    {/* Circle photo overlapping */}
    <View style={{ alignItems: 'center', marginTop: -50 }}>
      <Image source={SAMPLE_AVATAR} style={{
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 4, borderColor: '#FFFFFF',
      }} />
    </View>

    {/* Name and title */}
    <View style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 2 }}>Jane Smith</Text>
      <Text style={{ fontSize: 13, color: '#6b7280' }}>General Contractor</Text>
    </View>

    {/* Action icon circles */}
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 14 }}>
      {['call', 'mail', 'chatbubble', 'logo-whatsapp'].map((icon, i) => (
        <View key={i} style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
        }}>
          <Ionicons name={icon as any} size={18} color={colors.primary} />
        </View>
      ))}
    </View>

    {/* Industry section */}
    <View style={{ paddingHorizontal: 20, flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name="business" size={16} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937' }}>Industry</Text>
      </View>
      <View style={{
        backgroundColor: `${colors.primary}15`, paddingVertical: 8, paddingHorizontal: 14,
        borderRadius: 8, marginBottom: 12, alignSelf: 'flex-start',
        borderLeftWidth: 3, borderLeftColor: colors.primary,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>Construction</Text>
      </View>

      {/* Services grid */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="construct" size={16} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937' }}>Services</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {['Remodeling', 'Roofing', 'Plumbing', 'Electrical', 'Painting', 'Flooring'].map((service, i) => (
          <View key={i} style={{
            backgroundColor: `${colors.primary}12`, paddingVertical: 6, paddingHorizontal: 12,
            borderRadius: 16, borderWidth: 1, borderColor: `${colors.primary}30`,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.primary }}>{service}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

// --- PRO CARD: Craft Media / Aisha Khan style ---
const ProCardPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF' }]}>
    {/* Dark navy top section */}
    <View style={{
      backgroundColor: colors.primary, paddingTop: 20, paddingHorizontal: 20,
      height: CARD_HEIGHT * 0.48, position: 'relative', overflow: 'hidden',
    }}>
      {/* Company logo + name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="paper-plane" size={18} color={colors.accent || '#d4af37'} style={{ marginRight: 8 }} />
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Craft Media</Text>
          <Text style={{ fontSize: 8, fontWeight: '600', color: colors.accent || '#d4af37', letterSpacing: 2, textTransform: 'uppercase' }}>CREATIVE AGENCY</Text>
        </View>
      </View>

      {/* Name + title (left) and Photo (right) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.accent || '#d4af37', marginBottom: 2 }}>Ms. Aisha Khan</Text>
          <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, marginBottom: 6 }}>(she/her)</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent || '#d4af37' }}>Creative Director</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Craft Media</Text>
        </View>
        {/* Photo with decorative ring */}
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            borderWidth: 2, borderColor: `${colors.accent || '#d4af37'}50`,
            alignItems: 'center', justifyContent: 'center',
            position: 'absolute',
          }} />
          <View style={{
            width: 130, height: 130, borderRadius: 65,
            borderWidth: 1, borderColor: `${colors.accent || '#d4af37'}25`,
            borderStyle: 'dashed',
            alignItems: 'center', justifyContent: 'center',
            position: 'absolute',
          }} />
          <Image source={SAMPLE_AVATAR} style={{
            width: 110, height: 110, borderRadius: 55,
            borderWidth: 3, borderColor: colors.accent || '#d4af37',
          }} />
        </View>
      </View>
    </View>

    {/* Diagonal transition (simulated with angled view) */}
    <View style={{ height: 30, backgroundColor: colors.primary, marginTop: -1 }}>
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 0, borderTopRightRadius: 30,
      }} />
    </View>

    {/* White bottom section */}
    <View style={{ paddingHorizontal: 20, flex: 1, paddingTop: 4 }}>
      <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 18, marginBottom: 12 }}>
        Passionate creative director with a love for storytelling.
      </Text>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />

      {/* Contact rows */}
      {[
        { icon: 'call', text: '+44 20 1234 5678', label: 'Work' },
        { icon: 'mail', text: 'aisha@craftmedia.co.uk', label: 'Work' },
        { icon: 'globe', text: 'www.craftmedia.co.uk', label: 'Company' },
      ].map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name={row.icon as any} size={16} color={colors.accent || '#d4af37'} />
          </View>
          <View>
            <Text style={{ fontSize: 13, color: '#1f2937', fontWeight: '500' }}>{row.text}</Text>
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>{row.label}</Text>
          </View>
        </View>
      ))}

      {/* Add to Contacts button */}
      <View style={{
        backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10,
        alignItems: 'center', marginTop: 4,
      }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>+ Add to Contacts</Text>
      </View>
    </View>
  </View>
);

// --- COVER CARD: Cover photo top, white bottom with contact rows ---
const CoverCardPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF' }]}>
    {/* Cover photo section */}
    <View style={{
      width: '100%', height: CARD_HEIGHT * 0.42, position: 'relative',
      backgroundColor: colors.primary, overflow: 'hidden',
    }}>
      <Image source={SAMPLE_BANNER} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {/* Company logo overlay */}
      <View style={{
        position: 'absolute', top: 12, right: 12,
        backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
      }}>
        <Ionicons name="business" size={18} color={colors.primary} />
      </View>
    </View>

    {/* Wavy accent transition */}
    <Svg width="100%" height={20} viewBox="0 0 400 20" preserveAspectRatio="none" style={{ marginTop: -16 }}>
      <Path d="M0 20 C100 0 200 18 300 4 C350 -2 380 8 400 0 L400 20 Z" fill="#ffffff" />
      <Path d="M0 20 C80 6 160 20 260 6 C320 -1 370 12 400 4 L400 20 Z" fill={colors.accent || '#f97316'} opacity={0.15} />
    </Svg>

    {/* White bottom section */}
    <View style={{ paddingHorizontal: 20, flex: 1, paddingTop: 2 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 }}>Arianne S. Richardson</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#444', marginBottom: 2 }}>Founder & Principal Consultant</Text>
      <Text style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 8 }}>A.Rich Culture</Text>
      <Text style={{ fontSize: 11, color: '#555', lineHeight: 16, marginBottom: 10 }}>
        Business Consulting & Talent Management for Caribbean Creatives
      </Text>

      {/* Contact rows with colored circle icons */}
      {[
        { icon: 'mail', text: 'mail@arichculture.com', color: colors.primary },
        { icon: 'call', text: '+1 561 485 7408', color: colors.accent || '#f97316' },
        { icon: 'chatbubble', text: 'Send a Text', color: colors.primary },
        { icon: 'globe', text: 'www.arichculture.com', color: colors.accent || '#f97316' },
      ].map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: row.color, alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <Ionicons name={row.icon as any} size={14} color="#fff" />
          </View>
          <Text style={{ fontSize: 12, color: '#333', fontWeight: '500' }}>{row.text}</Text>
        </View>
      ))}
    </View>
  </View>
);

// --- BIZ TRADITIONAL: Accent bar + centered logo + round photo + centered name + contact rows ---
const BizTraditionalPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF' }]}>
    {/* Top accent bar */}
    <View style={{ width: '100%', height: 5, backgroundColor: colors.primary || '#0c1b3a' }} />
    {/* Logo + company */}
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, gap: 8 }}>
      <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.primary || '#0c1b3a', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="business" size={14} color={colors.accent || '#c9a84c'} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary || '#0c1b3a', letterSpacing: 0.5 }}>Apex Industries</Text>
    </View>
    {/* Gold accent line */}
    <View style={{ width: 40, height: 2, backgroundColor: colors.accent || '#c9a84c', alignSelf: 'center', marginVertical: 10 }} />
    {/* Centered photo */}
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, borderColor: colors.accent || '#c9a84c', overflow: 'hidden' }}>
        <Image source={SAMPLE_AVATAR} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    </View>
    {/* Name + Title centered */}
    <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 }}>James Mitchell</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary || '#0c1b3a' }}>Senior Consultant</Text>
    </View>
    {/* Divider */}
    <View style={{ width: '70%', height: 1, backgroundColor: '#e5e5e5', alignSelf: 'center', marginVertical: 10 }} />
    {/* Contact rows */}
    {[
      { icon: 'call-outline' as const, text: '+1 555-234-5678', label: 'Phone' },
      { icon: 'mail-outline' as const, text: 'james@apex.com', label: 'Email' },
      { icon: 'globe-outline' as const, text: 'www.apexindustries.com', label: 'Website' },
      { icon: 'location-outline' as const, text: '123 Business Ave, NY', label: 'Address' },
    ].map((row, i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 6 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${colors.primary || '#0c1b3a'}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Ionicons name={row.icon} size={13} color={colors.primary || '#0c1b3a'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: '#333' }} numberOfLines={1}>{row.text}</Text>
          <Text style={{ fontSize: 9, color: '#999' }}>{row.label}</Text>
        </View>
      </View>
    ))}
    {/* Bottom accent bar */}
    <View style={{ width: '100%', height: 3, backgroundColor: colors.accent || '#c9a84c', marginTop: 'auto' }} />
  </View>
);

// --- BIZ MODERN: Dark gradient top + name left + photo right + curved transition + white bottom ---
const BizModernPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF' }]}>
    {/* Dark top */}
    <LinearGradient
      colors={[colors.primary || '#0f2b5b', colors.secondary || '#1a3f7a']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: '100%', height: CARD_HEIGHT * 0.38, paddingHorizontal: 20, paddingTop: 16, position: 'relative' }}
    >
      {/* Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <View style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="business" size={11} color="#fff" />
        </View>
        <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>Modern Living</Text>
      </View>
      {/* Name + Title (left side) */}
      <View style={{ paddingRight: 90 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', lineHeight: 24 }}>Daniel Rodriguez</Text>
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: 2 }}>(he/him)</Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Showroom Manager</Text>
      </View>
      {/* Photo (right, overlapping) */}
      <View style={{ position: 'absolute', right: 20, bottom: -28 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', overflow: 'hidden' }}>
          <Image source={SAMPLE_AVATAR} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      </View>
    </LinearGradient>
    {/* Curved transition */}
    <Svg width="100%" height={18} viewBox="0 0 400 20" preserveAspectRatio="none" style={{ marginTop: -1 }}>
      <Path d="M0 0 L400 0 L400 20 C300 0 100 0 0 20 Z" fill={colors.primary || '#0f2b5b'} />
    </Svg>
    {/* White bottom */}
    <View style={{ paddingHorizontal: 20, flex: 1, paddingTop: 16 }}>
      <Text style={{ fontSize: 11, color: '#555', lineHeight: 16, marginBottom: 12 }}>Creating engaging showroom experiences for customers.</Text>
      {[
        { icon: 'call' as const, text: '+1 555-987-6543', label: 'Work' },
        { icon: 'mail' as const, text: 'daniel@modernliving.com', label: 'Work' },
        { icon: 'globe' as const, text: 'www.modernliving.com', label: 'Company' },
      ].map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${colors.primary || '#0f2b5b'}12`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Ionicons name={row.icon} size={14} color={colors.primary || '#0f2b5b'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#333' }} numberOfLines={1}>{row.text}</Text>
            <Text style={{ fontSize: 9, color: '#999', fontWeight: '500' }}>{row.label}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

// --- BIZ MINIMALIST: Clean white, thin lines, square photo, minimal icons ---
const BizMinimalistPreview = ({ colors }: { colors: any }) => (
  <View style={[prev.card, { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingTop: 24 }]}>
    {/* Small logo */}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <View style={{ width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: colors.primary || '#111', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="business" size={11} color={colors.primary || '#111'} />
      </View>
      <Text style={{ fontSize: 9, fontWeight: '500', color: '#999', letterSpacing: 1.5, textTransform: 'uppercase' }}>Apex Industries</Text>
    </View>
    {/* Square photo */}
    <View style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
      <Image source={SAMPLE_AVATAR} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
    {/* Name */}
    <Text style={{ fontSize: 22, fontWeight: '300', color: colors.primary || '#111', letterSpacing: -0.5, marginBottom: 2 }}>James Mitchell</Text>
    <Text style={{ fontSize: 9, fontWeight: '500', color: '#999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Senior Consultant</Text>
    {/* Thin line */}
    <View style={{ width: 32, height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 }} />
    {/* Contact rows - ultra clean */}
    {[
      { icon: 'call-outline' as const, text: '+1 555-234-5678' },
      { icon: 'mail-outline' as const, text: 'james@apex.com' },
      { icon: 'globe-outline' as const, text: 'www.apexindustries.com' },
      { icon: 'location-outline' as const, text: '123 Business Ave, New York' },
    ].map((row, i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
        <Ionicons name={row.icon} size={15} color={colors.primary || '#111'} />
        <Text style={{ fontSize: 12, color: '#333' }} numberOfLines={1}>{row.text}</Text>
      </View>
    ))}
    {/* Social icons row */}
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
      {['logo-instagram', 'logo-tiktok', 'logo-linkedin'].map((icon, i) => (
        <Ionicons key={i} name={icon as any} size={16} color="#999" />
      ))}
    </View>
  </View>
);

// ============================================================
// MAIN GALLERY SCREEN
// ============================================================

const ECardTemplateGalleryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams || {};
  const { user, isPro } = useAuth();
  
  const isSuperAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
  const hasProAccess = isPro || isSuperAdmin;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'free' | 'premium' | 'pro'>('all');
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Pro templates are paid templates with layout starting with 'pro-'
  const isProTemplate = (t: Template) => t.layout.startsWith('pro-');

  const allTemplates = useMemo(() => {
    // First filter by card type if specified
    const cardType = params.cardType;
    const allowedIds = cardType ? CARD_TYPE_TEMPLATES[cardType] : null;
    let templates = allowedIds ? TEMPLATES.filter(t => allowedIds.includes(t.id)) : TEMPLATES;

    switch (selectedCategory) {
      case 'free':
        templates = templates.filter(t => !t.isPremium);
        break;
      case 'premium':
        templates = templates.filter(t => t.isPremium && !isProTemplate(t));
        break;
      case 'pro':
        templates = templates.filter(t => isProTemplate(t));
        break;
      default:
        if (hasProAccess) {
          const proTemplates = templates.filter(t => isProTemplate(t));
          const otherTemplates = templates.filter(t => !isProTemplate(t));
          templates = [...proTemplates, ...otherTemplates];
        }
        break;
    }
    return templates;
  }, [selectedCategory, hasProAccess, params.cardType]);

  const handleSelectTemplate = (template: Template) => {
    navigation.navigate('ECardColorPicker', {
      templateId: template.id,
      mode: params.mode || 'create',
      cardId: params.cardId,
      existingData: params.existingData,
      existingLinks: params.existingLinks,
      existingFeaturedSocials: params.existingFeaturedSocials,
      preserveData: params.preserveData,
    });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Render the correct template-specific preview
  const renderTemplatePreview = (template: Template) => {
    const previewColors = template.colorSchemes[0];
    switch (template.layout) {
      case 'basic': return <BasicPreview colors={previewColors} />;
      case 'blogger': return <BloggerPreview colors={previewColors} />;
      case 'business-card': return <BusinessCardPreview colors={previewColors} />;
      case 'full-width': return <FullWidthPreview colors={previewColors} />;
      case 'pro-realtor': return <ProRealtorPreview colors={previewColors} />;
      case 'pro-creative': return <ProCreativePreview colors={previewColors} />;
      case 'pro-corporate': return <ProCorporatePreview colors={previewColors} />;
      case 'pro-card': return <ProCardPreview colors={previewColors} />;
      case 'cover-card': return <CoverCardPreview colors={previewColors} />;
      case 'biz-traditional': return <BizTraditionalPreview colors={previewColors} />;
      case 'biz-modern': return <BizModernPreview colors={previewColors} />;
      case 'biz-minimalist': return <BizMinimalistPreview colors={previewColors} />;
      default: return <BasicPreview colors={previewColors} />;
    }
  };

  const renderTemplateCard = ({ item, index }: { item: Template; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.88, 1, 0.88],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slideContainer}>
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale }], opacity }]}>
          {/* The actual template preview */}
          <View style={{ position: 'relative' }}>
            {renderTemplatePreview(item)}

            {/* Pro Badge */}
            {isProTemplate(item) && (
              <View style={[styles.premiumBadge, styles.proBadge]}>
                <Ionicons name="briefcase" size={12} color="#fff" />
                <Text style={[styles.premiumBadgeText, styles.proBadgeText]}>PRO</Text>
              </View>
            )}

            {/* Premium Badge */}
            {item.isPremium && !isProTemplate(item) && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#000" />
                <Text style={styles.premiumBadgeText}>$4.99/mo</Text>
              </View>
            )}

            {/* Free Badge */}
            {!item.isPremium && !isProTemplate(item) && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            )}

            {/* No lock overlay — anyone can create with pro templates, payment required to publish */}
          </View>

          {/* Template Info */}
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={styles.templateDescription}>{item.description}</Text>
            <Text style={styles.colorCount}>{item.colorSchemes.length} color schemes</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const currentTemplate = allTemplates[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Template</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Swipe to browse • Tap to select</Text>

      {/* Template Gallery */}
      <FlatList
        ref={flatListRef}
        data={allTemplates}
        renderItem={renderTemplateCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.flatListContent}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {allTemplates.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: isProTemplate(allTemplates[index]) ? '#10b981' : 
                                   allTemplates[index].isPremium ? '#d4af37' : '#fff',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'free', 'premium', 'pro'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterTab,
              selectedCategory === cat && styles.filterTabActive,
              cat === 'pro' && styles.filterTabPro,
              cat === 'pro' && selectedCategory === cat && styles.filterTabProActive,
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
          >
            <Text style={[
              styles.filterTabText,
              selectedCategory === cat && styles.filterTabTextActive,
              cat === 'pro' && styles.filterTabTextPro,
            ]}>
              {cat === 'all' ? 'All' : cat === 'free' ? 'Free' : cat === 'premium' ? 'Premium' : 'Pro'}
            </Text>

          </TouchableOpacity>
        ))}
      </View>

      {/* Select Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.selectButton,
            currentTemplate?.isPremium && styles.selectButtonPremium,
            currentTemplate && isProTemplate(currentTemplate) && styles.selectButtonPro,
          ]}
          onPress={() => {
            if (currentTemplate) {
              handleSelectTemplate(currentTemplate);
            }
          }}
        >
          <Text style={styles.selectButtonText}>
            {currentTemplate && isProTemplate(currentTemplate) 
              ? 'Use Pro Template' 
              : currentTemplate?.isPremium 
                ? 'Select Premium Template' 
                : 'Use This Template'}
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color="#fff" 
            style={styles.selectButtonIcon} 
          />
        </TouchableOpacity>

        <View style={styles.categoryFilter}>
          <Text style={styles.categoryLabel}>
            {currentIndex + 1} of {allTemplates.length} templates
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================

// Preview card base styles
const prev = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 44,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 8,
  },
  flatListContent: {
    alignItems: 'center',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  // Badges
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#d4af37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  freeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: '#10b981',
  },
  proBadgeText: {
    color: '#fff',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    zIndex: 20,
  },
  lockText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  // Template info below card
  templateInfo: {
    marginTop: 14,
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 70,
  },
  templateName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  colorCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  // Bottom
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectButtonPremium: {
    backgroundColor: '#d4af37',
  },
  selectButtonPro: {
    backgroundColor: '#10b981',
  },
  selectButtonDisabled: {
    backgroundColor: '#374151',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonIcon: {
    marginLeft: 8,
  },
  categoryFilter: {
    alignItems: 'center',
  },
  categoryLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabPro: {
    borderWidth: 1,
    borderColor: '#10b981',
  },
  filterTabProActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterTabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterTabTextPro: {
    color: '#10b981',
  },
});

export default ECardTemplateGalleryScreen;
