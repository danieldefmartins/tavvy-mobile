import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useThemeContext } from '../contexts/ThemeContext';

const DEMO_URL = 'https://tavvy.com/app/demo/restaurant';

// The shared demo runs the same menu, stories and ordering presentation as web.
// Keeping one demo prevents sample content and feature links drifting between apps.
export default function DemoRestaurantScreen({ navigation }: any) {
  const { theme, themeMode } = useThemeContext();
  const web = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [url, setUrl] = useState(DEMO_URL);
  const [failed, setFailed] = useState(false);
  const bridge = `try { localStorage.setItem('@tavvy_theme_mode', ${JSON.stringify(themeMode)}); navigator.share = function(data) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'share',title:data.title,url:data.url})); return Promise.resolve(); }; } catch(e) {} true;`;
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top','bottom']}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <TouchableOpacity accessibilityLabel="Back" onPress={() => canGoBack ? web.current?.goBack() : navigation.goBack()}><Text style={{ color: theme.text, fontWeight: '700' }}>‹ Back</Text></TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Open demo in browser" onPress={() => Linking.openURL(url)}><Text style={{ color: theme.text, fontSize: 12 }}>Open browser ↗</Text></TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Share restaurant demo" onPress={() => Share.share({ message: url, url })}><Text style={{ color: theme.text, fontWeight: '700' }}>Share</Text></TouchableOpacity>
    </View>
    {failed ? <View style={{ padding: 24 }}><Text style={{ color: theme.text }}>The restaurant demo needs an internet connection.</Text><TouchableOpacity onPress={() => setFailed(false)} style={{ paddingVertical: 20 }}><Text style={{ color: theme.text, fontWeight: '700' }}>Try again</Text></TouchableOpacity></View> : <WebView ref={web} source={{ uri: DEMO_URL }} style={{ flex: 1, backgroundColor: theme.background }} startInLoadingState renderLoading={() => <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center', top: 32 }} />} allowsInlineMediaPlayback javaScriptEnabled domStorageEnabled injectedJavaScriptBeforeContentLoaded={bridge}
      onError={() => setFailed(true)}
      onNavigationStateChange={state => { setCanGoBack(state.canGoBack); if (state.url.startsWith('https://tavvy.com/')) setUrl(state.url); }}
      onMessage={async event => {
        try {
          if (!event.nativeEvent.url.startsWith('https://tavvy.com/')) return;
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'share' && typeof data.url === 'string' && data.url.startsWith('https://tavvy.com/')) await Share.share({ message: data.url, url: data.url, title: data.title });
          if (['download-contact','download-qr'].includes(data.type) && typeof data.content === 'string' && data.content.length < 500000 && FileSystem.cacheDirectory) {
            const contact = data.type === 'download-contact';
            const path = `${FileSystem.cacheDirectory}trattoria-tavvy-demo.${contact ? 'vcf' : 'svg'}`;
            await FileSystem.writeAsStringAsync(path, data.content);
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: contact ? 'text/vcard' : 'image/svg+xml', UTI: contact ? 'public.vcard' : 'public.svg-image' });
          }
        } catch { Alert.alert('Could not share', 'Use Open browser to download this item.'); }
      }}
      setSupportMultipleWindows={false}
      onOpenWindow={({ nativeEvent }) => {
        if (nativeEvent.targetUrl.startsWith('https://tavvy.com/')) web.current?.injectJavaScript(`window.location.assign(${JSON.stringify(nativeEvent.targetUrl)}); true;`);
        else if (/^https?:\/\//.test(nativeEvent.targetUrl)) Linking.openURL(nativeEvent.targetUrl);
      }}
      onShouldStartLoadWithRequest={request => {
        if (request.url === 'about:blank' || request.url.startsWith('https://tavvy.com/')) return true;
        if (/^https?:\/\//.test(request.url)) Linking.openURL(request.url);
        return false;
      }}
    />}
  </SafeAreaView>;
}
