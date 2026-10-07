import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { attempt, useCouple } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, gradient, radius, shadow, spacing } from '@/theme';

const COOLDOWN_MS = 3000;

function times(n: number) {
  return n === 1 ? '1×' : `${n}×`;
}

/** Startbildschirm: ein Tipp schickt ein Herz an den Partner. */
export function ThinkingCard() {
  const { thoughts, userId, partnerName, sendThought } = useCouple();
  const [cooling, setCooling] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));

  const day = toISO(today());
  const todays = thoughts.filter((t) => toISO(new Date(t.created_at)) === day);
  const mine = todays.filter((t) => t.from_id === userId).length;
  const theirs = todays.length - mine;

  const send = async () => {
    if (cooling) return;
    setCooling(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    await attempt(sendThought);
    setTimeout(() => setCooling(false), COOLDOWN_MS);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${partnerName} ein Herz schicken`} onPress={send}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <Text style={styles.heart}>💗</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{cooling ? 'Herz verschickt!' : 'Ich denk an dich'}</Text>
            <Text style={styles.sub}>
              {mine || theirs
                ? `Heute: du ${times(mine)} · ${partnerName} ${times(theirs)}`
                : `Ein Tipp – und ${partnerName} sieht ein Herz`}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

/** Zeigt ein pulsierendes Herz, wenn der Partner an einen gedacht hat. Einmal pro App, über den Tabs. */
export function ThoughtReceiver() {
  const { thoughts, userId, partnerName } = useCouple();
  const key = `wir-zwei/seen-thought/${userId}`;
  // undefined = noch nicht geladen; '' = noch nie etwas gesehen.
  const [seenAt, setSeenAt] = useState<string | undefined>(undefined);
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((v) => setSeenAt(v ?? ''))
      .catch(() => setSeenAt(''));
  }, [key]);

  const unseen = seenAt === undefined ? [] : thoughts.filter((t) => t.from_id !== userId && t.created_at > seenAt);
  const latest = unseen.reduce<string>((max, t) => (t.created_at > max ? t.created_at : max), '');
  const visible = unseen.length > 0;

  useEffect(() => {
    if (!visible) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.25,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, latest, pulse]);

  if (!visible) return null;

  const dismiss = () => {
    setSeenAt(latest);
    AsyncStorage.setItem(key, latest).catch(() => {});
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Schließen" onPress={dismiss} style={styles.overlay}>
      <View style={styles.bubble}>
        <Animated.Text style={[styles.bigHeart, { transform: [{ scale: pulse }] }]}>💗</Animated.Text>
        <Text style={styles.overlayTitle}>{partnerName} denkt an dich</Text>
        {unseen.length > 1 ? <Text style={styles.overlaySub}>{unseen.length}× seit du zuletzt hier warst</Text> : null}
        <Text style={styles.overlayHint}>Tippen zum Schließen</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg },
  heart: { fontSize: 40 },
  title: { color: colors.white, fontSize: 20, fontWeight: '800' },
  sub: { color: colors.white, fontSize: 14, opacity: 0.95, marginTop: 2 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(46,31,71,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 340,
    ...shadow,
  },
  bigHeart: { fontSize: 88 },
  overlayTitle: { fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center' },
  overlaySub: { fontSize: 15, color: colors.pink, fontWeight: '700' },
  overlayHint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
});
