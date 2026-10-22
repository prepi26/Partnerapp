import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { FamilyForm } from '@/components/FamilyForm';
import { useT } from '@/i18n';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

/** Weitere Familie anlegen oder beitreten – z. B. für ein Kind mit einem anderen Elternteil. */
export default function FamilyNew() {
  const t = useT();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>{t.home.families.addIntro}</Text>
        <FamilyForm onDone={close} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  intro: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
