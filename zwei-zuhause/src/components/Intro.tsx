import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { isProEntry } from '@/lib/proEntry';
import { colors, gradient, radius, spacing } from '@/theme';

const KEY = 'zweizuhause.introSeen';

/** Emojis der vier Seiten; Titel und Texte im Wörterbuch (t.auth.intro.slides). */
const SLIDE_EMOJI = ['🏠🏠', '👀', '🔒', '🤝'];

/** Die vier Einführungsseiten. */
export function Intro({ onDone }: { onDone: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const slides = t.auth.intro.slides.map((s, i) => ({ ...s, emoji: SLIDE_EMOJI[i] }));
  const slide = slides[page];
  const last = page === slides.length - 1;

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.screen, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}
    >
      <View style={styles.top}>
        {!last ? (
          <Pressable accessibilityRole="button" onPress={onDone} hitSlop={12}>
            <Text style={styles.skip}>{t.auth.intro.skip}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
      </View>
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View key={s.title} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.footer}>
        {/* Weißer Knopf – der Verlaufs-Knopf ginge auf dem Verlauf unter. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => (last ? onDone() : setPage(page + 1))}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.buttonText}>{last ? t.auth.intro.start : t.auth.intro.next}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

/** Zeigt die Einführung einmal beim allerersten Start, danach nie wieder (außer über die Einstellungen). */
export function IntroGate({ children }: { children: ReactNode }) {
  // Fachkräfte über den Browser-Link brauchen die Einführung für Eltern nicht.
  const [seen, setSeen] = useState<boolean | null>(() => (isProEntry() ? true : null));

  useEffect(() => {
    if (isProEntry()) return;
    AsyncStorage.getItem(KEY)
      .then((v) => setSeen(v === '1'))
      .catch(() => setSeen(true));
  }, []);

  if (seen === null) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!seen) {
    return (
      <Intro
        onDone={() => {
          setSeen(true);
          AsyncStorage.setItem(KEY, '1').catch(() => {});
        }}
      />
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.lg },
  top: { height: 24, alignItems: 'flex-end' },
  skip: { color: colors.white, fontSize: 15, fontWeight: '600', opacity: 0.9 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 64 },
  title: { fontSize: 30, fontWeight: '900', color: colors.white, textAlign: 'center', letterSpacing: -0.5 },
  text: { fontSize: 17, color: colors.white, textAlign: 'center', lineHeight: 25, opacity: 0.95, maxWidth: 360 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: colors.white, width: 22 },
  footer: { gap: spacing.sm },
  button: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '800', color: colors.primary },
});
