/** Read-only playback of published article narration. Consumers never generate assets. */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';

type Voice = 'female' | 'male';
interface AudioPlayerProps {
  articleId: string;
  audioUrl?: string | null;
  maleUrl?: string | null;
  audioDuration?: number | null;
  backgroundColor?: string;
  textColor?: string;
}
const TEAL = '#0D9488';
const SPEEDS = [1, 1.25, 1.5, 2, 0.75];
const time = (seconds: number) => `${Math.floor(Math.max(0, seconds || 0) / 60)}:${Math.floor(Math.max(0, seconds || 0) % 60).toString().padStart(2, '0')}`;

export default function AudioPlayer({ articleId, audioUrl, maleUrl, audioDuration, backgroundColor = '#F0FDFA', textColor = '#115E59' }: AudioPlayerProps) {
  const copy = useReleaseCopy();
  const [voice, setVoice] = useState<Voice>(audioUrl ? 'female' : 'male');
  const activeVoice: Voice = voice === 'female' && audioUrl ? 'female' : voice === 'male' && maleUrl ? 'male' : audioUrl ? 'female' : 'male';
  const source = activeVoice === 'female' ? audioUrl : maleUrl;
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(false);
  const sound = useRef<Audio.Sound | null>(null);
  const generation = useRef(0);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const speedRef = useRef(1);
  const seeking = useRef(false);
  const resume = useRef<{ position: number; playing: boolean } | null>(null);
  const track = useRef<View>(null);
  const trackBounds = useRef({ x: 0, width: 0 });

  const release = () => {
    const old = sound.current;
    sound.current = null;
    if (old) { old.setOnPlaybackStatusUpdate(null); void old.unloadAsync().catch(() => {}); }
  };
  const update = (status: AVPlaybackStatus, ticket: number) => {
    if (generation.current !== ticket) return;
    if (!status.isLoaded) { if (status.error) { setError(true); setPlaying(false); setLoading(false); } return; }
    const total = (status.durationMillis || 0) / 1000;
    durationRef.current = total;
    setDuration(total);
    if (!seeking.current) { positionRef.current = status.positionMillis / 1000; setPosition(positionRef.current); }
    setPlaying(status.isPlaying);
    if (status.didJustFinish) setPlaying(false);
  };
  const load = async (url: string, shouldPlay: boolean, start = 0) => {
    const ticket = ++generation.current;
    release(); setLoading(true); setError(false);
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: true, playsInSilentModeIOS: true, shouldDuckAndroid: true, playThroughEarpieceAndroid: false });
      const result = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false, rate: speedRef.current }, status => update(status, ticket));
      if (generation.current !== ticket) { await result.sound.unloadAsync(); return; }
      sound.current = result.sound;
      const total = result.status.isLoaded ? (result.status.durationMillis || 0) / 1000 : 0;
      if (start > 0 && total > 0) await result.sound.setPositionAsync(Math.min(start, Math.max(0, total - 0.1)) * 1000);
      if (generation.current === ticket && shouldPlay) await result.sound.playAsync();
    } catch { if (generation.current === ticket) { setError(true); setPlaying(false); } }
    finally { if (generation.current === ticket) setLoading(false); }
  };
  useEffect(() => {
    generation.current++; release(); setPlaying(false); setLoading(false); setError(false); setPosition(0); positionRef.current = 0;
    const initial = activeVoice === 'female' && Number.isFinite(audioDuration) ? Math.max(0, audioDuration || 0) : 0;
    setDuration(initial); durationRef.current = initial;
    const pending = resume.current; resume.current = null;
    if (source && pending) void load(source, pending.playing, pending.position);
    return () => { generation.current++; release(); };
    // Source identity controls lifecycle. Playback speed and status do not reload audio.
  }, [source, articleId]);

  const toggle = async () => {
    if (!source || loading) return;
    if (!sound.current || error) { await load(source, true); return; }
    try {
      if (playing) await sound.current.pauseAsync();
      else { if (durationRef.current && positionRef.current >= durationRef.current - 0.1) await sound.current.setPositionAsync(0); await sound.current.playAsync(); }
    } catch { setError(true); setPlaying(false); }
  };
  const seek = async (seconds: number) => {
    const next = Math.max(0, Math.min(durationRef.current, seconds));
    positionRef.current = next; setPosition(next);
    try { if (sound.current) await sound.current.setPositionAsync(next * 1000); } catch { setError(true); }
  };
  const changeVoice = (next: Voice) => {
    if (next === activeVoice) return;
    resume.current = { position: positionRef.current, playing };
    setVoice(next);
  };
  const changeSpeed = async () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    speedRef.current = next; setSpeed(next);
    try { if (sound.current) await sound.current.setRateAsync(next, true); } catch { setError(true); }
  };
  const scrub = (pageX: number) => {
    const { x, width } = trackBounds.current;
    if (!width || !sound.current) return;
    const next = Math.max(0, Math.min(1, (pageX - x) / width)) * durationRef.current;
    positionRef.current = next; setPosition(next);
  };
  const progress = duration ? Math.max(0, Math.min(1, position / duration)) : 0;

  return <View style={[styles.container, { backgroundColor }]}>
    <View style={styles.heading}><Ionicons name="headset-outline" size={20} color={textColor} /><Text style={[styles.title, { color: textColor }]}>{copy('Listen to this article')}</Text></View>
    {!source ? <Text style={{ color: textColor }}>{copy('Audio is not available for this article yet.')}</Text> : <>
      {!!audioUrl && !!maleUrl && <View style={styles.voices}>{(['female', 'male'] as Voice[]).map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: activeVoice === value }} onPress={() => changeVoice(value)} style={[styles.voice, activeVoice === value && { backgroundColor: TEAL }]}><Text style={{ color: activeVoice === value ? '#fff' : textColor, fontWeight: '700' }}>{copy(value === 'female' ? 'Female' : 'Male')}</Text></TouchableOpacity>)}</View>}
      <View style={styles.controls}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy(playing ? 'Pause' : 'Play')} accessibilityState={{ disabled: loading }} onPress={toggle} disabled={loading} style={styles.play}>{loading ? <ActivityIndicator color="#fff" /> : <Ionicons name={playing ? 'pause' : 'play'} size={24} color="#fff" />}</TouchableOpacity>
        <View style={styles.timeline}><View ref={track} accessibilityRole="adjustable" accessibilityLabel={copy('Audio position')} accessibilityValue={{ min: 0, max: Math.floor(duration), now: Math.floor(position), text: `${time(position)} / ${time(duration)}` }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={e => { void seek(positionRef.current + (e.nativeEvent.actionName === 'increment' ? 15 : -15)); }} onLayout={() => track.current?.measureInWindow((x, _y, width) => { trackBounds.current = { x, width }; })} onStartShouldSetResponder={() => !!sound.current} onResponderGrant={e => { seeking.current = true; scrub(e.nativeEvent.pageX); }} onResponderMove={e => scrub(e.nativeEvent.pageX)} onResponderRelease={() => { seeking.current = false; void seek(positionRef.current); }} onResponderTerminate={() => { seeking.current = false; }} style={styles.trackTouch}><View style={[styles.track, { backgroundColor: textColor, opacity: 0.2 }]} /><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View><View style={styles.times}><Text style={{ color: textColor }}>{time(position)}</Text><Text style={{ color: textColor }}>{time(duration)}</Text></View></View>
      </View>
      <View style={styles.secondary}><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Back 15 seconds')} onPress={() => { void seek(positionRef.current - 15); }} style={styles.action}><Ionicons name="play-back" size={18} color={textColor} /><Text style={{ color: textColor }}>15s</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Playback speed')} onPress={changeSpeed} style={styles.action}><Text style={{ color: textColor, fontWeight: '700' }}>{speed}×</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Forward 15 seconds')} onPress={() => { void seek(positionRef.current + 15); }} style={styles.action}><Text style={{ color: textColor }}>15s</Text><Ionicons name="play-forward" size={18} color={textColor} /></TouchableOpacity></View>
      {error && <Text accessibilityRole="alert" style={{ color: textColor }}>{copy('Audio could not play. Tap Play to try again.')}</Text>}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { fontSize: 15, fontWeight: '700' },
  voices: { flexDirection: 'row', gap: 8 }, voice: { minHeight: 44, minWidth: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14 }, play: { width: 48, height: 48, borderRadius: 24, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  timeline: { flex: 1 }, trackTouch: { height: 44, justifyContent: 'center' }, track: { height: 5, borderRadius: 3, width: '100%', position: 'absolute' }, fill: { height: 5, borderRadius: 3, backgroundColor: TEAL, position: 'absolute' }, times: { flexDirection: 'row', justifyContent: 'space-between' },
  secondary: { flexDirection: 'row', justifyContent: 'space-evenly' }, action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 60, gap: 5 },
});
