import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { createECardPreviewMessage, ECARD_PREVIEW_READY } from '../../../lib/ecard/previewBridge';
import { useReleaseCopy } from '../../../hooks/useReleaseCopy';

const PREVIEW_LOCALES = new Set(['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'tr', 'hi', 'id', 'th', 'vi', 'nl']);
const SCREEN_WIDTH = 360, SCREEN_HEIGHT = 640;
function isPreviewPage(value: string): boolean {
  try { const url = new URL(value); return url.origin === 'https://tavvy.com' && /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?app\/ecard\/studio-preview\/?$/.test(url.pathname); } catch { return false; }
}
/** Uses the shared web template renderer with this editor's current in-memory data. */
export default function StudioPreview({ isDark }: { isDark: boolean }) {
  const { state } = useEditor();
  return <StudioPreviewFrame isDark={isDark} card={state.card} links={state.links} pendingUploads={state.pendingUploads.size} />;
}
export function StudioPreviewFrame({ isDark, card, links, pendingUploads = 0, showCaption = true }: { isDark: boolean; card: any; links: any[]; pendingUploads?: number; showCaption?: boolean }) {
  const copy = useReleaseCopy();
  const focused = useIsFocused();
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0].toLowerCase();
  const locale = PREVIEW_LOCALES.has(language) ? language : 'en';
  const previewUrl = `https://tavvy.com${locale === 'en' ? '' : `/${locale}`}/app/ecard/studio-preview`;
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [available, setAvailable] = useState({ width: 360, height: 580 });
  const payload = useMemo(() => {
    if (!card) return null;
    try { return createECardPreviewMessage(card, links); } catch { return null; }
  }, [card, links]);
  const send = useCallback(() => {
    if (!payload) return;
    ref.current?.injectJavaScript(`window.postMessage(${JSON.stringify(payload)},window.location.origin);true;`);
  }, [payload]);
  useEffect(() => { if (ready) send(); }, [ready, send]);
  useEffect(() => { setReady(false); setError(''); }, [previewUrl, focused]);
  useEffect(() => {
    if (ready || !focused) return;
    const timer = setTimeout(() => setError('The preview could not load. Your changes are still in the editor.'), 15000);
    return () => clearTimeout(timer);
  }, [ready, version, previewUrl, focused]);
  const color = isDark ? '#CBD5E1' : '#475569';
  const screenWidth = Math.max(1, Math.min(SCREEN_WIDTH, available.width - 34, (available.height - 34) * 9 / 16));
  const screenHeight = screenWidth * 16 / 9, scale = screenWidth / SCREEN_WIDTH;
  const showLoadFailure = () => { setReady(false); setError('The preview could not load. Your changes are still in the editor.'); };
  const retry = () => { setError(''); setReady(false); setVersion(value => value + 1); };
  return <View style={styles.root}>
    {!!pendingUploads && <Text style={[styles.notice, { color }]}>{copy('New photos appear here after they finish saving.')}</Text>}
    <View style={styles.stage} onLayout={event => setAvailable(event.nativeEvent.layout)}>
      <View style={[styles.phone, { width: screenWidth + 18, height: screenHeight + 18 }]} testID="ecard-preview-phone">
        <View style={[styles.screen, { width: screenWidth, height: screenHeight }]} testID="ecard-preview-screen">
          {focused && payload && <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, transform: [{ scale }], transformOrigin: 'top left' }}>
            <WebView key={`${previewUrl}-${version}`} ref={ref} source={{ uri: previewUrl }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#FFFFFF', opacity: ready ? 1 : 0 }}
              accessibilityLabel={copy('9:16 phone preview')} scrollEnabled showsVerticalScrollIndicator nestedScrollEnabled bounces={false}
              originWhitelist={['https://tavvy.com']} javaScriptEnabled domStorageEnabled incognito sharedCookiesEnabled={false}
              setSupportMultipleWindows={false} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
              onLoadEnd={send} onMessage={event => { if (isPreviewPage(event.nativeEvent.url) && event.nativeEvent.data === ECARD_PREVIEW_READY) { setError(''); setReady(true); send(); } }}
              onError={showLoadFailure}
              onHttpError={showLoadFailure}
              onContentProcessDidTerminate={showLoadFailure} onRenderProcessGone={showLoadFailure}
              onShouldStartLoadWithRequest={request => isPreviewPage(request.url) || request.url === 'about:blank'} />
          </View>}
          {(!ready || !payload) && <View style={styles.state} accessibilityLiveRegion="polite">
            {!error && payload && <ActivityIndicator accessibilityLabel={copy('Loading preview…')} color="#6C2496" />}
            <Text style={styles.stateText}>{!payload ? copy('This preview could not be prepared. Return to Edit to continue.') : error ? copy(error) : copy('Loading preview…')}</Text>
            {!!error && payload && <TouchableOpacity accessibilityRole="button" onPress={retry} style={styles.retry}><Text style={styles.retryText}>{copy('Retry preview')}</Text></TouchableOpacity>}
          </View>}
        </View>
      </View>
    </View>
    {showCaption && <View style={styles.caption}><Text style={[styles.captionTitle, { color }]}>{copy('Phone preview')} · 9:16</Text><Text style={[styles.captionText, { color }]}>{copy('Scroll inside to see the full card')}</Text></View>}
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  notice: { fontSize: 12, lineHeight: 18, paddingHorizontal: 16, paddingTop: 8, textAlign: 'center' },
  stage: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  phone: { padding: 8, backgroundColor: '#16181E', borderWidth: 1, borderColor: '#555963', borderRadius: 36, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 7 },
  screen: { overflow: 'hidden', borderRadius: 27, backgroundColor: '#FFFFFF' },
  state: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', gap: 12 },
  stateText: { color: '#475569', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF' },
  retryText: { color: '#334155', fontWeight: '600' },
  caption: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 4 },
  captionTitle: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  captionText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
