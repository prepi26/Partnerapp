import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FamilyForm } from '@/components/FamilyForm';
import { SecondaryButton } from '@/components/ui';
import { useStore } from '@/data/store';
import { useT } from '@/i18n';
import { colors, gradient, spacing } from '@/theme';

export default function Onboarding() {
  const t = useT();
  const o = t.auth.onboarding;
  const { signOut } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.hero}>
            <Text style={styles.title}>{o.title}</Text>
            <Text style={styles.subtitle}>{o.subtitle}</Text>
          </View>

          <FamilyForm allowPro />

          <Text style={styles.privacy}>🔒 {o.privacy}</Text>

          <SecondaryButton title={o.signOut} onPress={signOut} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 34, fontWeight: '900', color: colors.white, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.white, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  privacy: { fontSize: 14, color: colors.white, textAlign: 'center', lineHeight: 20, opacity: 0.95 },
});
