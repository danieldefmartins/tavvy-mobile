import { useReleaseCopy } from '../../../hooks/useReleaseCopy';
/** Native eCard studio. Editor theme is independent of the card's chosen design. */
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../../lib/supabaseClient';
import { saveQRCodeToCameraRoll } from '../../../lib/ecard/saveQRCode';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import { saveBeforePublishing, nativeECardRequiresPro } from '../../../lib/ecard/editorActions';
import { getTemplateById } from '../../../config/eCardTemplates';
import LivePreviewCard from './LivePreviewCard';
import StudioPreview from './StudioPreview';
import ProfileSection from './sections/ProfileSection';
import ContactSection from './sections/ContactSection';
import SocialSection from './sections/SocialSection';
import LinksSection from './sections/LinksSection';
import MediaSection from './sections/MediaSection';
import TemplateColorSection from './sections/TemplateColorSection';
import ImagesLayoutSection from './sections/ImagesLayoutSection';
import TypographySection from './sections/TypographySection';
import CivicSection from './sections/CivicSection';
import MobileBusinessSection from './sections/MobileBusinessSection';
import AdvancedSection from './sections/AdvancedSection';

type StudioTab = 'content' | 'design' | 'more';
const tabs: { id: StudioTab; label: string; icon: any }[] = [
  { id: 'content', label: 'Content', icon: 'create-outline' },
  { id: 'design', label: 'Design', icon: 'color-palette-outline' },
  { id: 'more', label: 'More features', icon: 'options-outline' },
];
interface Props { isDark: boolean; isPro: boolean; userId?: string; onBack: () => void; onPreview: () => void }
export default function CardStudioLayout({ isDark, isPro, userId, onBack, onPreview }: Props) {
  const copy = useReleaseCopy();
  const insets = useSafeAreaInsets(), navigation = useNavigation<any>();
  const { state, dispatch } = useEditor();
  const { isSaving, isDirty, lastSaved, saveError, saveNow } = useAutoSave({ userId, isPro });
  const [tab, setTab] = useState<StudioTab>("content"), [mode, setMode] = useState<'edit' | 'preview'>("edit");
  const [compact, setCompact] = useState(false), [showQR, setShowQR] = useState(false);
  const [publishing, setPublishing] = useState(false), [actionError, setActionError] = useState('');
  const qrRef = useRef<any>(null), publishingRef = useRef(false);
  const card = state.card;
  const bg = isDark ? '#111827' : '#F4F6F8', panel = isDark ? '#1F2937' : '#FFFFFF';
  const text = isDark ? '#F8FAFC' : '#111827', muted = isDark ? '#CBD5E1' : '#475569', border = isDark ? '#374151' : '#D1D5DB';
  const template = getTemplateById(card?.template_id || 'basic');
  const templateId = card?.template_id || 'basic';
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const hasAdvanced = templateId.startsWith('pro-') || templateId === 'business-card' || templateId === 'cover-card';
  const cardUrl = card?.slug ? `https://tavvy.com/${encodeURIComponent(card.slug)}` : '';
  const busy = isSaving || publishing;
  const status = saveError ? "Could not save" : isSaving ? "Saving…" : isDirty ? "Unsaved changes" : lastSaved ? "Saved" : "Saved";
  const save = useCallback(async () => { setActionError(''); return saveNow(); }, [saveNow]);

  // Back gestures and the phone's Back button must not silently discard typed work.
  usePreventRemove(isDirty, ({ data }) => {
    Alert.alert('Save your changes?', 'Your latest edits have not been saved.', [
      { text: copy('Keep editing'), style: "cancel" },
      { text: 'Discard changes', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
      { text: 'Save and leave', onPress: async () => { if (await save()) navigation.dispatch(data.action); } },
    ]);
  });
  const requirePublished = (action: () => void) => {
    if (!card?.is_published || !cardUrl) { Alert.alert('This card is a draft', 'Publish after saving to make your card and QR code available to other people.'); return; }
    if (isDirty || saveError) { Alert.alert('Share the published version?', 'Your unsaved changes are not included in the link yet.', [{ text: copy('Keep editing'), style: "cancel" }, { text: 'Share published version', onPress: action }]); return; }
    action();
  };
  const share = () => requirePublished(() => { void Share.share(Platform.OS === 'ios' ? { url: cardUrl } : { message: cardUrl }).catch(() => undefined); });
  const publish = async () => {
    if (!card || !userId || publishingRef.current) return;
    if (!isPro && nativeECardRequiresPro(card, state.links, !!template?.isPremium)) { Alert.alert(copy('Pro features'), copy('Gallery photos, embedded videos, contact forms and professional credentials are Pro extras.'), [{ text: copy('Keep editing'), style: "cancel" }, { text: copy('View Pro plan'), onPress: () => navigation.navigate('ECardPremiumUpsell') }]); return; }
    publishingRef.current = true; setPublishing(true); setActionError('');
    try {
      const saved = await saveBeforePublishing(saveNow, async () => {
        const { error, data } = await supabase.from('digital_cards').update({ is_published: true }).eq('id', card.id).eq('user_id', userId).select('id,is_published').single();
        if (error || !data?.is_published) throw new Error(error?.message || 'Your card could not be published. Your saved work is still available.');
        dispatch({ type: 'PUBLICATION_UPDATED', published: true });
      });
      if (!saved) setActionError('Your latest changes have not saved. Retry Save before publishing.');
      else Alert.alert('Card published', 'Your card is now available at its public link.');
    } catch (error) { setActionError((error as Error).message); }
    finally { publishingRef.current = false; setPublishing(false); }
  };
  const common = { isDark, isPro };
  return <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
    <View style={[styles.header, { backgroundColor: panel, borderBottomColor: border }]}>
      <View style={styles.headingRow}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy("Back to cards")} onPress={onBack} style={styles.iconButton}><Ionicons name="chevron-back" size={24} color={text} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: text }]} numberOfLines={1}>{card?.card_name || card?.full_name || "Edit card"}</Text><Text style={{ color: muted, fontSize: 12 }}>{card?.is_published ? copy("Published") : copy("Draft")} · {isPro ? copy("Pro plan") : copy("Free plan")}</Text></View>
      </View>
      <View style={styles.toolbar}>
        <View style={[styles.segment, { borderColor: border }]}>{(["edit", "preview"] as const).map(value => <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{ selected: mode === value }} style={[styles.modeButton, { backgroundColor: mode === value ? (isDark ? '#374151' : '#E2E8F0') : 'transparent' }]} onPress={() => setMode(value)}><Text style={{ color: text, fontWeight: '600' }}>{value === 'edit' ? copy("Edit") : copy("Preview")}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity accessibilityRole="button" disabled={busy || (!isDirty && !saveError)} onPress={() => void save()} style={[styles.action, { borderColor: border, opacity: busy ? 0.6 : 1 }]}>{isSaving && <ActivityIndicator size="small" color={text} />}<Text style={{ color: text, fontWeight: '600' }}>{saveError ? "Retry save" : isSaving ? copy("Saving…") : copy("Save")}</Text></TouchableOpacity>
        {!card?.is_published && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void publish()} style={[styles.action, styles.primary, { opacity: busy ? 0.6 : 1 }]}><Text style={styles.primaryText}>{publishing ? copy("Publishing…") : copy("Publish")}</Text></TouchableOpacity>}
        {!!card?.is_published && <TouchableOpacity accessibilityRole="button" onPress={share} style={[styles.action, styles.primary]}><Text style={styles.primaryText}>{copy("Share")}</Text></TouchableOpacity>}
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: saveError ? '#DC2626' : muted, fontSize: 12, paddingVertical: 5 }}>{copy(status)}{card?.is_published && isDirty ? ' · Published card updates when changes save' : ''}</Text>
      {!!(saveError || actionError) && <Text accessibilityRole="alert" style={{ color: isDark ? '#FCA5A5' : '#B91C1C', paddingBottom: 8 }}>{copy(saveError || actionError)} Your edits remain in this editor.</Text>}
    </View>
    {mode === 'preview' ? <><StudioPreview isDark={isDark} /><TouchableOpacity accessibilityRole="button" onPress={onPreview} style={[styles.fullPreview, { backgroundColor: panel, paddingBottom: Math.max(insets.bottom, 12) }]}><Text style={{ color: text, fontWeight: '600' }}>{copy("Open full preview")}</Text></TouchableOpacity></> : <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {tab === 'content' && <><Text style={[styles.intro, { color: muted }]}>Add the links and actions people need first. Profile, contact information, and social icons are below.</Text><LinksSection {...common} /><ProfileSection {...common} /><ContactSection {...common} /><SocialSection {...common} /><TouchableOpacity accessibilityRole="button" onPress={() => setCompact(value => !value)} style={styles.fullPreview}><Text style={{ color: muted }}>{compact ? 'Hide compact preview' : 'Show compact preview'}</Text></TouchableOpacity>{compact && <LivePreviewCard isDark={isDark} onExpandPreview={() => setMode("preview")} />}</>}
        {tab === 'design' && <><Text style={[styles.intro, { color: muted }]}>Keep your current design or choose another. {template?.name || 'This design'} · {template?.isPremium ? 'Pro design' : 'Free design'}</Text><TemplateColorSection {...common} /><TypographySection {...common} /><ImagesLayoutSection {...common} /></>}
        {tab === 'more' && <><Text style={[styles.intro, { color: muted }]}>{copy('Gallery photos, embedded videos, contact forms and professional credentials are Pro extras.')} {copy('Your existing content stays on your card.')}</Text><MediaSection {...common} />{isCivic && <CivicSection {...common} />}{templateId === 'mobile-business' && <MobileBusinessSection {...common} />}{hasAdvanced && <AdvancedSection {...common} />}<View style={[styles.sharing, { backgroundColor: panel, borderColor: border }]}><Text style={{ color: text, fontWeight: '700' }}>{copy("Share your card")}</Text><Text style={{ color: muted, marginTop: 8 }}>{card?.is_published ? 'Share the published card or save its QR code.' : 'Publish your saved draft before sharing.'}</Text><View style={styles.toolbar}><TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={share} accessibilityRole="button"><Text style={{ color: text }}>{copy("Share link")}</Text></TouchableOpacity><TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={() => requirePublished(() => setShowQR(true))} accessibilityRole="button"><Text style={{ color: text }}>{copy("QR code")}</Text></TouchableOpacity></View></View></>}
      </ScrollView>
      <View style={[styles.tabs, { backgroundColor: panel, borderTopColor: border, paddingBottom: Math.max(insets.bottom, 8) }]}>{tabs.map(item => <TouchableOpacity key={item.id} style={styles.tab} onPress={() => setTab(item.id)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }}><Ionicons name={item.icon} size={21} color={tab === item.id ? '#16A34A' : muted} /><Text style={{ color: tab === item.id ? '#16A34A' : muted, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{copy(item.label)}</Text></TouchableOpacity>)}</View>
    </KeyboardAvoidingView>}
    <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}><View style={styles.overlay}><View style={[styles.qrPanel, { backgroundColor: panel }]}><Text style={[styles.title, { color: text }]}>{copy("QR code")}</Text><Text style={{ color: muted, marginVertical: 12 }}>Scan to view your published card</Text><View style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12 }}><QRCode value={cardUrl || 'https://tavvy.com'} size={200} backgroundColor="#FFFFFF" color="#000000" getRef={(value: any) => { qrRef.current = value; }} /></View><Text numberOfLines={1} style={{ color: muted, marginVertical: 12 }}>{cardUrl}</Text><View style={styles.toolbar}><TouchableOpacity style={[styles.action, styles.primary]} onPress={() => saveQRCodeToCameraRoll(qrRef.current)}><Text style={styles.primaryText}>{copy("Save PNG")}</Text></TouchableOpacity><TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={share}><Text style={{ color: text }}>{copy("Share")}</Text></TouchableOpacity><TouchableOpacity style={[styles.action, { borderColor: border }]} onPress={() => setShowQR(false)}><Text style={{ color: text }}>{copy("Close")}</Text></TouchableOpacity></View></View></View></Modal>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, header: { paddingHorizontal: 12, borderBottomWidth: 1 }, headingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 }, title: { fontSize: 17, fontWeight: '700' }, iconButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 6 }, segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' }, modeButton: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' }, action: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }, primary: { backgroundColor: '#15803D', borderColor: '#15803D' }, primaryText: { color: '#FFFFFF', fontWeight: '700' }, content: { padding: 16, paddingBottom: 30 }, intro: { fontSize: 14, lineHeight: 21, marginBottom: 16 }, fullPreview: { minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 12 }, tabs: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 }, tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 }, sharing: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 12 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 }, qrPanel: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 20, alignItems: 'center' },
});
