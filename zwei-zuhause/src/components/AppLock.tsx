import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui';
import { useT } from '@/i18n';
import { loadAppLock, LOCK_AFTER_MS, unlock } from '@/lib/appLock';
import { colors, gradient, spacing } from '@/theme';

/**
 * Sperrt die App mit Face ID / Fingerabdruck / Gerätecode, wenn in den Einstellungen eingeschaltet.
 * Sobald die App in den Hintergrund geht, wird sie verdeckt – auch in der App-Übersicht des Handys.
 */
export function AppLock({ children }: { children: ReactNode }) {
  const t = useT();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(true);
  const [covered, setCovered] = useState(false);
  const backgroundAt = useRef<number | null>(null);
  const prompting = useRef(false);

  const tryUnlock = async () => {
    if (prompting.current) return;
    prompting.current = true;
    const ok = await unlock();
    prompting.current = false;
    if (ok) setLocked(false);
  };

  useEffect(() => {
    loadAppLock().then((on) => {
      setEnabled(on);
      if (!on) setLocked(false);
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      // Einstellung kann sich inzwischen geändert haben.
      const on = await loadAppLock();
      setEnabled(on);
      if (!on) {
        setLocked(false);
        setCovered(false);
        return;
      }
      if (state === 'active') {
        setCovered(false);
        const away = backgroundAt.current ? Date.now() - backgroundAt.current : 0;
        backgroundAt.current = null;
        if (away > LOCK_AFTER_MS) setLocked(true);
      } else if (!prompting.current) {
        // Face ID selbst schickt die App kurz auf „inactive“ – das ist kein Verlassen.
        setCovered(true);
        if (state === 'background' && backgroundAt.current === null) backgroundAt.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  // Beim Sperren direkt nach Face ID fragen.
  useEffect(() => {
    if (!enabled || !locked || covered || prompting.current) return;
    prompting.current = true;
    unlock().then((ok) => {
      prompting.current = false;
      if (ok) setLocked(false);
    });
  }, [enabled, locked, covered]);

  if (enabled === null) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  const showCover = enabled && (locked || covered);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showCover ? (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Zwei Zuhause</Text>
          {locked ? (
            <View style={styles.button}>
              <Text style={styles.text}>{t.auth.appLock.locked}</Text>
              <PrimaryButton title={t.auth.appLock.unlock} icon="lock-open-outline" onPress={tryUnlock} />
            </View>
          ) : null}
        </LinearGradient>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: { width: 120, height: 120, borderRadius: 28 },
  title: { fontSize: 30, fontWeight: '900', color: colors.white },
  text: { fontSize: 15, color: colors.white, textAlign: 'center', opacity: 0.95 },
  button: { gap: spacing.md, width: 260 },
});
