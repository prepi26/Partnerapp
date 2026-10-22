import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Field, GradientHeader, HeaderIcon, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { FAMILY_COLUMNS } from '@/data/columns';
import { errorMessage, useStore } from '@/data/store';
import { Family } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { formatDate } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

/** Startseite für Fachkräfte: alle Familien, die sie lesen dürfen. */
export default function Cases() {
  const { professional_access, userId, joinAsProfessional, signOut, refresh } = useStore();
  const t = useT();
  const tc = t.pro.cases;
  const [families, setFamilies] = useState<Record<string, Family>>({});
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const mine = professional_access.filter((p) => p.professional === userId);

  const ids = mine.map((p) => p.family_id).join(',');
  useEffect(() => {
    if (!ids) return;
    supabase
      .from('families')
      .select(FAMILY_COLUMNS)
      .in('id', ids.split(','))
      .then(({ data }) => setFamilies(Object.fromEntries(((data ?? []) as Family[]).map((f) => [f.id, f]))));
  }, [ids]);

  const join = async () => {
    setBusy(true);
    try {
      await joinAsProfessional(code);
      setCode('');
    } catch (e) {
      showError(tc.joinFailed, errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader
        title={tc.title}
        subtitle={tc.subtitle}
        right={<HeaderIcon icon="refresh" label={tc.refresh} onPress={() => refresh().catch(() => {})} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {mine.map((p) => {
            const f = families[p.family_id];
            const expired = new Date(p.expires_at) < new Date();
            const active = !!f && !p.revoked_at && !expired;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                disabled={!active}
                onPress={() => router.push({ pathname: '/case/[id]', params: { id: p.family_id } })}
              >
                <Card style={[styles.case, !active && { opacity: 0.6 }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.title}>
                      {f ? `${f.name_a} & ${f.name_b}${f.children ? ` · ${f.children}` : ''}` : tc.family}
                    </Text>
                    <Text style={styles.meta}>
                      {p.revoked_at
                        ? tc.accessRevoked
                        : expired
                          ? tc.accessExpired
                          : f
                            ? fmt(tc.sharedUntil, { date: formatDate(p.expires_at.slice(0, 10)) })
                            : tc.awaitingOtherParent}
                    </Text>
                  </View>
                  {active ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
                </Card>
              </Pressable>
            );
          })}

          <Card style={{ gap: spacing.md }}>
            <Text style={styles.title}>{tc.addFamily}</Text>
            <Field
              label={tc.codeLabel}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder={tc.codePlaceholder}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.code}
            />
            <PrimaryButton title={busy ? tc.checking : tc.redeem} icon="key-outline" disabled={busy || code.length !== 8} onPress={join} />
          </Card>

          <Text style={styles.note}>
            {tc.note}
          </Text>
          <SecondaryButton title={tc.signOut} icon="log-out-outline" onPress={signOut} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  case: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  code: { fontSize: 22, letterSpacing: 4, textAlign: 'center', fontWeight: '800' },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
