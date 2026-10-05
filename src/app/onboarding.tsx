import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/DateField';
import { Card, Field, PrimaryButton } from '@/components/ui';
import { useStore } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, gradient, spacing } from '@/theme';

export default function Onboarding() {
  const { setCouple } = useStore();
  const insets = useSafeAreaInsets();
  const [partnerA, setPartnerA] = useState('');
  const [partnerB, setPartnerB] = useState('');
  const [startDate, setStartDate] = useState(toISO(today()));

  const canSave = partnerA.trim().length > 0 && partnerB.trim().length > 0;

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.emoji}>🌴💖🌊</Text>
            <Text style={styles.title}>Wir zwei</Text>
            <Text style={styles.subtitle}>Eure Geschichte, eure Erinnerungen, eure Wünsche – alles an einem Ort.</Text>
          </View>

          <Card style={styles.card}>
            <Field label="Dein Name" value={partnerA} onChangeText={setPartnerA} placeholder="z. B. Lena" />
            <Field label="Name deines Schatzes" value={partnerB} onChangeText={setPartnerB} placeholder="z. B. Max" />
            <DateField label="Zusammen seit" value={startDate} onChange={setStartDate} maximumDate={today()} />
            <View style={{ height: spacing.sm }} />
            <PrimaryButton
              title="Los geht's"
              icon="heart"
              disabled={!canSave}
              onPress={() => setCouple({ partnerA: partnerA.trim(), partnerB: partnerB.trim(), startDate })}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 44 },
  title: { fontSize: 44, fontWeight: '900', color: colors.white, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.white, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  card: { gap: spacing.md, padding: spacing.lg },
});
