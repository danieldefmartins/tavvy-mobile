/**
 * TemplateLayouts.tsx
 * 
 * Renders 8 distinct card layouts matching the web app templates.
 * Each layout has unique photo position, text arrangement, button style, etc.
 * 
 * Used by both ECardCreateScreen (editor) and ECardDashboardScreen (preview).
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TemplateLayout, ColorScheme } from '../../config/eCardTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Types ──
export interface CardData {
  profileImage: string | null;
  name: string;
  titleRole: string;
  bio: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

export interface LayoutProps {
  layout: TemplateLayout;
  color: ColorScheme;
  data: CardData;
  isEditable: boolean;
  // Editable callbacks (only used when isEditable=true)
  onChangeName?: (v: string) => void;
  onChangeTitle?: (v: string) => void;
  onChangeBio?: (v: string) => void;
  onChangeEmail?: (v: string) => void;
  onChangePhone?: (v: string) => void;
  onChangeWebsite?: (v: string) => void;
  onChangeAddress?: (v: string) => void;
  onPickPhoto?: () => void;
  // Computed colors
  textColor: string;
  textSecondary: string;
  isLightCard: boolean;
  // Children rendered after the layout-specific header (links, gallery, etc.)
  children?: React.ReactNode;
}

// ── Helper: Photo Avatar ──
function PhotoAvatar({ uri, size, borderColor, onPress, isEditable }: {
  uri: string | null; size: number; borderColor: string; onPress?: () => void; isEditable: boolean;
}) {
  const content = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor }} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderStyle: 'dashed', borderColor, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.1)' }}>
      <Ionicons name="camera" size={size > 100 ? 32 : 24} color={borderColor} />
    </View>
  );
  if (isEditable && onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  }
  return content;
}

// ── Helper: Editable Text ──
function EditableText({ value, onChange, placeholder, style, multiline, textAlign, isEditable, maxLength }: {
  value: string; onChange?: (v: string) => void; placeholder: string; style: any;
  multiline?: boolean; textAlign?: 'center' | 'left' | 'right'; isEditable: boolean; maxLength?: number;
}) {
  if (isEditable && onChange) {
    return (
      <TextInput
        style={style}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(128,128,128,0.5)"
        textAlign={textAlign || 'center'}
        multiline={multiline}
        maxLength={maxLength}
      />
    );
  }
  return <Text style={style} numberOfLines={multiline ? 3 : 1}>{value || placeholder}</Text>;
}

// ── Helper: Contact Row ──
function ContactRow({ icon, value, onChange, placeholder, keyboard, textColor, borderColor, isEditable }: {
  icon: string; value: string; onChange?: (v: string) => void; placeholder: string;
  keyboard?: any; textColor: string; borderColor: string; isEditable: boolean;
}) {
  return (
    <View style={[ls.contactRow, { borderBottomColor: borderColor }]}>
      <Ionicons name={icon as any} size={16} color={textColor} style={{ opacity: 0.6 }} />
      {isEditable && onChange ? (
        <TextInput
          style={[ls.contactInput, { color: textColor }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(128,128,128,0.4)"
          keyboardType={keyboard || 'default'}
          autoCapitalize="none"
        />
      ) : (
        <Text style={[ls.contactInput, { color: textColor }]} numberOfLines={1}>{value || placeholder}</Text>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════
export function renderTemplateLayout(props: LayoutProps) {
  switch (props.layout) {
    case 'basic': return renderBasicLayout(props);
    case 'blogger': return renderBloggerLayout(props);
    case 'business-card': return renderBusinessCardLayout(props);
    case 'full-width': return renderFullWidthLayout(props);
    case 'pro-realtor': return renderProRealtorLayout(props);
    case 'pro-creative': return renderProCreativeLayout(props);
    case 'pro-corporate': return renderProCorporateLayout(props);
    case 'pro-card': return renderProCardLayout(props);
    default: return renderBasicLayout(props);
  }
}

// ═══════════════════════════════════════════════════════════
// 1. BASIC — Linktree-style: centered circle photo, name, bio, stacked buttons
// ═══════════════════════════════════════════════════════════
function renderBasicLayout(p: LayoutProps) {
  const { color, data, textColor, textSecondary, isLightCard, isEditable, children } = p;
  const gradientColors: [string, string] = [color.primary, color.secondary];
  const borderCol = isLightCard ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)';

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ls.cardBase}>
      <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 8 }}>
        <PhotoAvatar uri={data.profileImage} size={110} borderColor={borderCol} onPress={p.onPickPhoto} isEditable={isEditable} />
      </View>
      <View style={ls.fieldsCenter}>
        <EditableText value={data.name} onChange={p.onChangeName} placeholder="Your Name" style={[ls.nameText, { color: textColor }]} isEditable={isEditable} />
        <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="Title / Role" style={[ls.titleText, { color: textSecondary }]} isEditable={isEditable} />
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Short bio..." style={[ls.bioText, { color: textSecondary }]} isEditable={isEditable} multiline maxLength={300} />
      </View>
      <View style={ls.contactSection}>
        <ContactRow icon="mail" value={data.email} onChange={p.onChangeEmail} placeholder="Email" keyboard="email-address" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
        <ContactRow icon="call" value={data.phone} onChange={p.onChangePhone} placeholder="Phone" keyboard="phone-pad" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
        <ContactRow icon="globe" value={data.website} onChange={p.onChangeWebsite} placeholder="Website" keyboard="url" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
        <ContactRow icon="location-outline" value={data.address} onChange={p.onChangeAddress} placeholder="City, State" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
      </View>
      {children}
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. BLOGGER — Script font, white card cutout, large photo overlapping top
// ═══════════════════════════════════════════════════════════
function renderBloggerLayout(p: LayoutProps) {
  const { color, data, isEditable, children } = p;
  const accentCol = color.accent || '#c8a87c';
  const bgCol = color.primary;
  const cardTxt = '#1a1a1a';
  const cardSub = '#666666';
  const borderCol = 'rgba(0,0,0,0.06)';

  return (
    <View style={[ls.cardBase, { backgroundColor: bgCol }]}>
      {/* Pastel background with white card cutout */}
      <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={ls.bloggerCard}>
          {/* Photo overlapping top */}
          <View style={{ marginTop: -50, alignItems: 'center' }}>
            <PhotoAvatar uri={data.profileImage} size={100} borderColor="#fff" onPress={p.onPickPhoto} isEditable={isEditable} />
          </View>
          {/* Script name */}
          <EditableText value={data.name} onChange={p.onChangeName} placeholder="Your Name" style={[ls.bloggerName, { color: cardTxt }]} isEditable={isEditable} />
          <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="TITLE / ROLE" style={[ls.bloggerTitle, { color: cardSub }]} isEditable={isEditable} />
          <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Short bio..." style={[ls.bioText, { color: cardSub, marginTop: 8 }]} isEditable={isEditable} multiline maxLength={300} />
          {/* Contact rows */}
          <View style={[ls.contactSection, { marginTop: 12 }]}>
            <ContactRow icon="mail" value={data.email} onChange={p.onChangeEmail} placeholder="Email" keyboard="email-address" textColor={cardTxt} borderColor={borderCol} isEditable={isEditable} />
            <ContactRow icon="call" value={data.phone} onChange={p.onChangePhone} placeholder="Phone" keyboard="phone-pad" textColor={cardTxt} borderColor={borderCol} isEditable={isEditable} />
            <ContactRow icon="globe" value={data.website} onChange={p.onChangeWebsite} placeholder="Website" keyboard="url" textColor={cardTxt} borderColor={borderCol} isEditable={isEditable} />
            <ContactRow icon="location-outline" value={data.address} onChange={p.onChangeAddress} placeholder="City, State" textColor={cardTxt} borderColor={borderCol} isEditable={isEditable} />
          </View>
        </View>
      </View>
      {/* Children (links, gallery, etc.) rendered outside the white card */}
      <View style={{ paddingHorizontal: 0 }}>
        {children}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. BUSINESS CARD — Dark top with photo + info, light bottom with about
// ═══════════════════════════════════════════════════════════
function renderBusinessCardLayout(p: LayoutProps) {
  const { color, data, isEditable, children } = p;
  const darkBg = color.primary;
  const lightBg = color.cardBg || '#f8f9fa';
  const accentCol = color.accent || '#d4af37';
  const borderCol = 'rgba(0,0,0,0.06)';
  const isLightBottom = true;

  return (
    <View style={ls.cardBase}>
      {/* Dark top section */}
      <View style={[ls.businessTop, { backgroundColor: darkBg }]}>
        {/* Company name */}
        <View style={ls.businessCompanyRow}>
          <View style={[ls.businessCompanyDot, { backgroundColor: accentCol }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>T</Text>
          </View>
          <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="Company / Title" style={[ls.businessCompanyText, { color: '#fff' }]} isEditable={isEditable} textAlign="left" />
        </View>
        {/* Photo centered */}
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <PhotoAvatar uri={data.profileImage} size={100} borderColor="rgba(255,255,255,0.9)" onPress={p.onPickPhoto} isEditable={isEditable} />
        </View>
        {/* Name */}
        <EditableText value={data.name} onChange={p.onChangeName} placeholder="Your Name" style={[ls.businessName, { color: '#fff' }]} isEditable={isEditable} />
      </View>
      {/* Action icons row */}
      <View style={[ls.businessIconRow, { backgroundColor: lightBg }]}>
        {[
          { icon: 'call', color: accentCol },
          { icon: 'mail', color: accentCol },
          { icon: 'globe', color: accentCol },
          { icon: 'location', color: accentCol },
        ].map((item, i) => (
          <View key={i} style={[ls.businessIconCircle, { backgroundColor: accentCol }]}>
            <Ionicons name={item.icon as any} size={18} color="#fff" />
          </View>
        ))}
      </View>
      {/* Light bottom — About Me */}
      <View style={[ls.businessBottom, { backgroundColor: lightBg }]}>
        <Text style={ls.businessAboutTitle}>About Me</Text>
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Write about yourself..." style={[ls.bioText, { color: '#666', textAlign: 'left' }]} isEditable={isEditable} multiline maxLength={300} textAlign="left" />
        <View style={[ls.contactSection, { marginTop: 12 }]}>
          <ContactRow icon="mail" value={data.email} onChange={p.onChangeEmail} placeholder="Email" keyboard="email-address" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="call" value={data.phone} onChange={p.onChangePhone} placeholder="Phone" keyboard="phone-pad" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="globe" value={data.website} onChange={p.onChangeWebsite} placeholder="Website" keyboard="url" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="location-outline" value={data.address} onChange={p.onChangeAddress} placeholder="City, State" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
        </View>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. FULL WIDTH — Hero photo with gradient overlay, bold name on image
// ═══════════════════════════════════════════════════════════
function renderFullWidthLayout(p: LayoutProps) {
  const { color, data, isEditable, children } = p;
  const darkBg = color.primary || '#000';
  const accentCol = color.accent || '#fff';
  const borderCol = 'rgba(0,0,0,0.06)';

  return (
    <View style={ls.cardBase}>
      {/* Hero photo section */}
      <View style={ls.fullWidthHero}>
        {data.profileImage ? (
          <TouchableOpacity activeOpacity={isEditable ? 0.8 : 1} onPress={isEditable ? p.onPickPhoto : undefined} style={{ flex: 1 }}>
            <Image source={{ uri: data.profileImage }} style={ls.fullWidthHeroImage} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[ls.fullWidthHeroPlaceholder, { backgroundColor: darkBg }]} onPress={isEditable ? p.onPickPhoto : undefined} activeOpacity={0.8}>
            <Ionicons name="camera" size={40} color="rgba(255,255,255,0.4)" />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 }}>Tap to add hero photo</Text>
          </TouchableOpacity>
        )}
        {/* Gradient overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={ls.fullWidthOverlay} />
        {/* Name overlaid at bottom-left */}
        <View style={ls.fullWidthNameOverlay}>
          <EditableText value={data.name} onChange={p.onChangeName} placeholder="YOUR NAME" style={ls.fullWidthName} isEditable={isEditable} textAlign="left" />
          <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="Title / Role" style={ls.fullWidthTitle} isEditable={isEditable} textAlign="left" />
        </View>
      </View>
      {/* Action icons */}
      <View style={[ls.fullWidthIconRow, { backgroundColor: '#111' }]}>
        {['call', 'mail', 'chatbubble', 'globe'].map((icon, i) => (
          <View key={i} style={ls.fullWidthIconCircle}>
            <Ionicons name={icon as any} size={16} color="#fff" />
          </View>
        ))}
      </View>
      {/* White bottom — About Me */}
      <View style={ls.fullWidthBottom}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111' }}>About Me</Text>
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Write about yourself..." style={[ls.bioText, { color: '#666', textAlign: 'left', marginTop: 8 }]} isEditable={isEditable} multiline maxLength={300} textAlign="left" />
        <View style={[ls.contactSection, { marginTop: 12 }]}>
          <ContactRow icon="mail" value={data.email} onChange={p.onChangeEmail} placeholder="Email" keyboard="email-address" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="call" value={data.phone} onChange={p.onChangePhone} placeholder="Phone" keyboard="phone-pad" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="globe" value={data.website} onChange={p.onChangeWebsite} placeholder="Website" keyboard="url" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="location-outline" value={data.address} onChange={p.onChangeAddress} placeholder="City, State" textColor="#333" borderColor={borderCol} isEditable={isEditable} />
        </View>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. PRO REALTOR — Arch photo, "Hi I'm...", accent-tab buttons
// ═══════════════════════════════════════════════════════════
function renderProRealtorLayout(p: LayoutProps) {
  const { color, data, textColor, textSecondary, isLightCard, isEditable, children } = p;
  const bgCol = color.primary;
  const accentCol = color.accent || '#c8a87c';
  const borderCol = isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={[ls.cardBase, { backgroundColor: bgCol }]}>
      {/* Banner area */}
      <View style={[ls.realtorBanner, { backgroundColor: color.secondary || bgCol }]}>
        {data.profileImage ? (
          <Image source={{ uri: data.profileImage }} style={ls.realtorBannerImage} blurRadius={8} />
        ) : null}
        <View style={ls.realtorBannerOverlay} />
      </View>
      {/* Arch-framed portrait overlapping banner */}
      <View style={ls.realtorArchContainer}>
        <TouchableOpacity activeOpacity={isEditable ? 0.8 : 1} onPress={isEditable ? p.onPickPhoto : undefined}>
          <View style={[ls.realtorArch, { borderColor: bgCol }]}>
            {data.profileImage ? (
              <Image source={{ uri: data.profileImage }} style={ls.realtorArchImage} />
            ) : (
              <View style={[ls.realtorArchPlaceholder, { backgroundColor: 'rgba(128,128,128,0.2)' }]}>
                <Ionicons name="camera" size={28} color="rgba(128,128,128,0.5)" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      {/* Name section */}
      <View style={ls.realtorNameSection}>
        <Text style={[ls.realtorHi, { color: textSecondary }]}>HI </Text>
        <EditableText value={data.name} onChange={p.onChangeName} placeholder="YOUR NAME" style={[ls.realtorName, { color: textColor }]} isEditable={isEditable} />
        <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="YOUR LOCAL REALTOR" style={[ls.realtorSubtitle, { color: textSecondary }]} isEditable={isEditable} />
      </View>
      {/* Bio */}
      <View style={{ paddingHorizontal: 28, marginTop: 8 }}>
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Short bio..." style={[ls.bioText, { color: textSecondary }]} isEditable={isEditable} multiline maxLength={300} />
      </View>
      {/* Contact */}
      <View style={[ls.contactSection, { paddingHorizontal: 28, marginTop: 12 }]}>
        <ContactRow icon="mail" value={data.email} onChange={p.onChangeEmail} placeholder="Email" keyboard="email-address" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
        <ContactRow icon="call" value={data.phone} onChange={p.onChangePhone} placeholder="Phone" keyboard="phone-pad" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
        <ContactRow icon="globe" value={data.website} onChange={p.onChangeWebsite} placeholder="Website" keyboard="url" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
        <ContactRow icon="location-outline" value={data.address} onChange={p.onChangeAddress} placeholder="City, State" textColor={textColor} borderColor={borderCol} isEditable={isEditable} />
      </View>
      {/* Company footer */}
      <View style={[ls.realtorFooter, { borderTopColor: accentCol }]}>
        <Text style={[ls.realtorFooterText, { color: accentCol }]}>YOUR COMPANY NAME</Text>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. PRO CREATIVE — Bold colored top with photo, white bottom with contact rows
// ═══════════════════════════════════════════════════════════
function renderProCreativeLayout(p: LayoutProps) {
  const { color, data, isEditable, children } = p;
  const gradientColors: [string, string] = [color.primary, color.secondary];
  const accentCol = color.accent || '#f97316';
  const cardBg = color.cardBg || '#fff';
  const borderCol = 'rgba(0,0,0,0.06)';

  return (
    <View style={ls.cardBase}>
      {/* Colored gradient top with large photo */}
      <LinearGradient colors={gradientColors} style={ls.creativeTop}>
        {/* Company logo top-right */}
        <View style={ls.creativeLogoBadge}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>CS</Text>
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 28 }}>
          <PhotoAvatar uri={data.profileImage} size={140} borderColor="rgba(255,255,255,0.3)" onPress={p.onPickPhoto} isEditable={isEditable} />
        </View>
      </LinearGradient>
      {/* White bottom section */}
      <View style={[ls.creativeBottom, { backgroundColor: cardBg }]}>
        <EditableText value={data.name} onChange={p.onChangeName} placeholder="Your Name" style={[ls.creativeName]} isEditable={isEditable} textAlign="left" />
        <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="Title / Role" style={[ls.creativeTitle]} isEditable={isEditable} textAlign="left" />
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Short bio..." style={[ls.bioText, { color: '#777', textAlign: 'left', marginTop: 8 }]} isEditable={isEditable} multiline maxLength={300} textAlign="left" />
        {/* Contact rows with colored icons */}
        <View style={{ marginTop: 16, gap: 12 }}>
          {[
            { icon: 'mail', value: data.email, onChange: p.onChangeEmail, placeholder: 'Email', bg: '#FF6B35', kb: 'email-address' },
            { icon: 'call', value: data.phone, onChange: p.onChangePhone, placeholder: 'Phone', bg: '#4CAF50', kb: 'phone-pad' },
            { icon: 'globe', value: data.website, onChange: p.onChangeWebsite, placeholder: 'Website', bg: accentCol, kb: 'url' },
            { icon: 'location', value: data.address, onChange: p.onChangeAddress, placeholder: 'City, State', bg: '#2196F3', kb: 'default' },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[ls.creativeContactIcon, { backgroundColor: row.bg }]}>
                <Ionicons name={row.icon as any} size={16} color="#fff" />
              </View>
              {isEditable && row.onChange ? (
                <TextInput
                  style={{ flex: 1, fontSize: 13, color: '#444' }}
                  value={row.value}
                  onChangeText={row.onChange}
                  placeholder={row.placeholder}
                  placeholderTextColor="rgba(128,128,128,0.4)"
                  keyboardType={row.kb as any}
                  autoCapitalize="none"
                />
              ) : (
                <Text style={{ flex: 1, fontSize: 13, color: '#444' }}>{row.value || row.placeholder}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. PRO CORPORATE — Decorative circles, centered photo, action icons, industry section
// ═══════════════════════════════════════════════════════════
function renderProCorporateLayout(p: LayoutProps) {
  const { color, data, textColor, textSecondary, isLightCard, isEditable, children } = p;
  const gradientColors: [string, string] = [color.primary, color.secondary];
  const accentCol = color.accent || '#fff';
  const cardBg = color.cardBg || 'transparent';
  const borderCol = isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={ls.cardBase}>
      {/* Gradient top with decorative shapes */}
      <LinearGradient colors={gradientColors} style={ls.corporateTop}>
        {/* Decorative circles */}
        <View style={[ls.corporateCircle1, { backgroundColor: `${accentCol}40` }]} />
        <View style={[ls.corporateCircle2, { backgroundColor: `${accentCol}20` }]} />
        <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 16, zIndex: 1 }}>
          <PhotoAvatar uri={data.profileImage} size={100} borderColor="rgba(255,255,255,0.9)" onPress={p.onPickPhoto} isEditable={isEditable} />
        </View>
      </LinearGradient>
      {/* Name section */}
      <View style={[ls.corporateNameSection, { backgroundColor: cardBg === 'transparent' ? color.primary : cardBg }]}>
        <EditableText value={data.name} onChange={p.onChangeName} placeholder="Your Name" style={[ls.corporateName, { color: cardBg === 'transparent' ? '#fff' : '#1a1a1a' }]} isEditable={isEditable} />
        <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="Title / Role" style={[ls.corporateTitle, { color: cardBg === 'transparent' ? 'rgba(255,255,255,0.6)' : '#777' }]} isEditable={isEditable} />
      </View>
      {/* Action icons */}
      <View style={[ls.corporateIconRow, { backgroundColor: cardBg === 'transparent' ? color.primary : cardBg }]}>
        {['call', 'mail', 'chatbubble', 'logo-whatsapp'].map((icon, i) => (
          <View key={i} style={ls.corporateIconCircle}>
            <Ionicons name={icon as any} size={18} color="#555" />
          </View>
        ))}
      </View>
      {/* Bio + Contact */}
      <View style={[ls.corporateContent, { backgroundColor: cardBg === 'transparent' ? color.primary : cardBg }]}>
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Short bio..." style={[ls.bioText, { color: cardBg === 'transparent' ? 'rgba(255,255,255,0.7)' : '#666', textAlign: 'left' }]} isEditable={isEditable} multiline maxLength={300} textAlign="left" />
        <View style={[ls.contactSection, { marginTop: 12 }]}>
          <ContactRow icon="mail" value={data.email} onChange={p.onChangeEmail} placeholder="Email" keyboard="email-address" textColor={cardBg === 'transparent' ? '#fff' : '#333'} borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="call" value={data.phone} onChange={p.onChangePhone} placeholder="Phone" keyboard="phone-pad" textColor={cardBg === 'transparent' ? '#fff' : '#333'} borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="globe" value={data.website} onChange={p.onChangeWebsite} placeholder="Website" keyboard="url" textColor={cardBg === 'transparent' ? '#fff' : '#333'} borderColor={borderCol} isEditable={isEditable} />
          <ContactRow icon="location-outline" value={data.address} onChange={p.onChangeAddress} placeholder="City, State" textColor={cardBg === 'transparent' ? '#fff' : '#333'} borderColor={borderCol} isEditable={isEditable} />
        </View>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. PRO CARD — Dark top with name+photo side-by-side, diagonal split, white bottom
// ═══════════════════════════════════════════════════════════
function renderProCardLayout(p: LayoutProps) {
  const { color, data, isEditable, children } = p;
  const darkBg = color.primary;
  const accentCol = color.accent || '#d4af37';
  const cardBg = color.cardBg || '#fff';
  const borderCol = 'rgba(0,0,0,0.06)';

  return (
    <View style={ls.cardBase}>
      {/* Dark top section */}
      <View style={[ls.proCardTop, { backgroundColor: darkBg }]}>
        {/* Company logo + name */}
        <View style={ls.proCardCompanyRow}>
          <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play-forward" size={18} color={accentCol} />
          </View>
          <View>
            <EditableText value={data.titleRole} onChange={p.onChangeTitle} placeholder="Company Name" style={[ls.proCardCompanyName, { color: '#fff' }]} isEditable={isEditable} textAlign="left" />
            <Text style={[ls.proCardCompanySub, { color: accentCol }]}>CREATIVE AGENCY</Text>
          </View>
        </View>
        {/* Name (left) + Photo (right) */}
        <View style={ls.proCardSplitRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <EditableText value={data.name} onChange={p.onChangeName} placeholder="Your Name" style={[ls.proCardName, { color: accentCol }]} isEditable={isEditable} textAlign="left" />
            <Text style={[ls.proCardRole, { color: accentCol }]}>Creative Director</Text>
          </View>
          {/* Large photo with decorative ring */}
          <TouchableOpacity activeOpacity={isEditable ? 0.8 : 1} onPress={isEditable ? p.onPickPhoto : undefined}>
            <View style={[ls.proCardPhotoRing, { borderColor: `${accentCol}40` }]}>
              <View style={[ls.proCardPhotoDash, { borderColor: `${accentCol}30` }]}>
                {data.profileImage ? (
                  <Image source={{ uri: data.profileImage }} style={ls.proCardPhotoImage} />
                ) : (
                  <View style={[ls.proCardPhotoPlaceholder, { backgroundColor: 'rgba(128,128,128,0.2)' }]}>
                    <Ionicons name="camera" size={28} color="rgba(128,128,128,0.5)" />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {/* Angled transition */}
      <View style={{ height: 40, position: 'relative' }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: darkBg }]} />
        <View style={[ls.proCardAngle, { borderBottomColor: cardBg }]} />
      </View>
      {/* White bottom section */}
      <View style={[ls.proCardBottom, { backgroundColor: cardBg }]}>
        <EditableText value={data.bio} onChange={p.onChangeBio} placeholder="Short bio..." style={[ls.bioText, { color: '#555', textAlign: 'left' }]} isEditable={isEditable} multiline maxLength={300} textAlign="left" />
        <View style={{ height: 1, backgroundColor: '#e5e5e5', marginVertical: 16 }} />
        {/* Contact rows */}
        <View style={{ gap: 14 }}>
          {[
            { icon: 'call', value: data.phone, onChange: p.onChangePhone, placeholder: 'Phone', label: 'Work', kb: 'phone-pad' },
            { icon: 'mail', value: data.email, onChange: p.onChangeEmail, placeholder: 'Email', label: 'Work', kb: 'email-address' },
            { icon: 'globe', value: data.website, onChange: p.onChangeWebsite, placeholder: 'Website', label: 'Company', kb: 'url' },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[ls.proCardContactIcon, { backgroundColor: darkBg }]}>
                <Ionicons name={row.icon as any} size={16} color={accentCol} />
              </View>
              <View style={{ flex: 1 }}>
                {isEditable && row.onChange ? (
                  <TextInput
                    style={{ fontSize: 13, color: '#333', fontWeight: '500' }}
                    value={row.value}
                    onChangeText={row.onChange}
                    placeholder={row.placeholder}
                    placeholderTextColor="rgba(128,128,128,0.4)"
                    keyboardType={row.kb as any}
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={{ fontSize: 13, color: '#333', fontWeight: '500' }}>{row.value || row.placeholder}</Text>
                )}
                <Text style={{ fontSize: 10, color: '#999' }}>{row.label}</Text>
              </View>
            </View>
          ))}
        </View>
        {/* Add to Contacts button */}
        <View style={[ls.proCardAddBtn, { backgroundColor: darkBg }]}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>+ Add to Contacts</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const ls = StyleSheet.create({
  // Shared
  cardBase: { overflow: 'hidden' },
  fieldsCenter: { paddingHorizontal: 20, alignItems: 'center', width: '100%' },
  nameText: { fontSize: 22, fontWeight: '700', textAlign: 'center', paddingVertical: 4, width: '100%' },
  titleText: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingVertical: 2, width: '100%' },
  bioText: { fontSize: 13, textAlign: 'center', paddingVertical: 4, lineHeight: 20, width: '100%' },
  contactSection: { width: '100%', paddingHorizontal: 20, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1 },
  contactInput: { flex: 1, fontSize: 13, paddingVertical: 4 },

  // Blogger
  bloggerCard: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 24, paddingBottom: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 3, marginTop: 50 },
  bloggerName: { fontSize: 28, fontWeight: '400', textAlign: 'center', fontStyle: 'italic', letterSpacing: -0.5, marginTop: 14, width: '100%' },
  bloggerTitle: { fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2.5, fontWeight: '600', marginTop: 6, width: '100%' },

  // Business Card
  businessTop: { padding: 24, alignItems: 'center' },
  businessCompanyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, alignSelf: 'center' },
  businessCompanyDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  businessCompanyText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  businessName: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 10, width: '100%' },
  businessIconRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 16 },
  businessIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  businessBottom: { padding: 24 },
  businessAboutTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },

  // Full Width
  fullWidthHero: { width: '100%', height: 300, position: 'relative', overflow: 'hidden' },
  fullWidthHeroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  fullWidthHeroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullWidthOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },
  fullWidthNameOverlay: { position: 'absolute', bottom: 20, left: 24, right: 24, zIndex: 2 },
  fullWidthName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1, textTransform: 'uppercase', width: '100%' },
  fullWidthTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 6, width: '100%' },
  fullWidthIconRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 14 },
  fullWidthIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  fullWidthBottom: { backgroundColor: '#fff', padding: 24 },

  // Pro Realtor
  realtorBanner: { width: '100%', height: 180, overflow: 'hidden', position: 'relative' },
  realtorBannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  realtorBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  realtorArchContainer: { alignItems: 'center', marginTop: -70, zIndex: 2 },
  realtorArch: { width: 130, height: 160, borderRadius: 65, overflow: 'hidden', borderWidth: 3 },
  realtorArchImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  realtorArchPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  realtorNameSection: { alignItems: 'center', marginTop: 14, paddingHorizontal: 28 },
  realtorHi: { fontSize: 12, fontWeight: '400' },
  realtorName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', width: '100%' },
  realtorSubtitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '500', marginTop: 4, textAlign: 'center', width: '100%' },
  realtorFooter: { width: '100%', paddingVertical: 10, marginTop: 16, borderTopWidth: 2, alignItems: 'center' },
  realtorFooterText: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },

  // Pro Creative
  creativeTop: { paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', position: 'relative' },
  creativeLogoBadge: { position: 'absolute', top: 16, right: 20, width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  creativeBottom: { padding: 24 },
  creativeName: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', width: '100%' },
  creativeTitle: { fontSize: 14, color: '#555', fontWeight: '500', marginTop: 2, width: '100%' },
  creativeContactIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Pro Corporate
  corporateTop: { paddingHorizontal: 24, overflow: 'hidden', position: 'relative' },
  corporateCircle1: { position: 'absolute', top: -20, left: -30, width: 100, height: 100, borderRadius: 50 },
  corporateCircle2: { position: 'absolute', top: 10, right: -10, width: 60, height: 60, borderRadius: 30 },
  corporateNameSection: { paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  corporateName: { fontSize: 24, fontWeight: '700', textAlign: 'center', width: '100%' },
  corporateTitle: { fontSize: 14, marginTop: 4, textAlign: 'center', width: '100%' },
  corporateIconRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 12 },
  corporateIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  corporateContent: { paddingHorizontal: 24, paddingBottom: 24 },

  // Pro Card
  proCardTop: { padding: 24, paddingBottom: 0 },
  proCardCompanyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  proCardCompanyName: { fontSize: 14, fontWeight: '700' },
  proCardCompanySub: { fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  proCardSplitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  proCardName: { fontSize: 26, fontWeight: '700', lineHeight: 32, width: '100%' },
  proCardRole: { fontSize: 14, fontWeight: '600', marginTop: 10 },
  proCardPhotoRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 2, padding: 4 },
  proCardPhotoDash: { flex: 1, borderRadius: 65, borderWidth: 2, borderStyle: 'dashed', padding: 3 },
  proCardPhotoImage: { width: '100%', height: '100%', borderRadius: 65, resizeMode: 'cover' },
  proCardPhotoPlaceholder: { flex: 1, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  proCardAngle: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 0, borderLeftWidth: SCREEN_WIDTH, borderBottomWidth: 40, borderLeftColor: 'transparent' },
  proCardBottom: { padding: 24, paddingTop: 8 },
  proCardContactIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  proCardAddBtn: { width: '100%', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
});
