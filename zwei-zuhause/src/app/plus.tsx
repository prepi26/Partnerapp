import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

import { IconName, PrimaryButton, showError } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/config';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { errorMessage } from '@/data/store';
import { close } from '@/lib/nav';
import { colors, gradient, radius, shadow, spacing } from '@/theme';

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'document-text',
    title: 'Berichte als PDF',
    text: 'Umgang, Kosten, Nachrichten und Tagebuch – fertig für Jugendamt, Beratung oder Anwalt.',
  },
  { icon: 'camera', title: 'Belege fotografieren', text: 'Kassenbon zur Ausgabe – nie wieder „Das hast du nie bezahlt“.' },
  { icon: 'shield-checkmark', title: 'Nachweise, die halten', text: 'Mit Datum, Uhrzeit und Prüfsumme zu jedem Eintrag.' },
  { icon: 'heart', title: 'Unterstützt Zwei Zuhause', text: 'Keine Werbung, keine verkauften Daten. Server in der EU.' },
];

const PERIOD: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.ANNUAL]: 'Jährlich',
  [PACKAGE_TYPE.MONTHLY]: 'Monatlich',
  [PACKAGE_TYPE.LIFETIME]: 'Einmalig, für immer',
};

function perMonth(pkg: PurchasesPackage) {
  if (pkg.packageType !== PACKAGE_TYPE.ANNUAL) return null;
  return pkg.product.pricePerMonthString ? `nur ${pkg.product.pricePerMonthString} / Monat` : null;
}

export default function PlusScreen() {
  const { active, packages, purchase, restore } = usePlus();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Jahresabo vorauswählen – es ist das beste Angebot.
  const chosen =
    packages.find((p) => p.identifier === selected) ??
    packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    packages[0];

  const run = async (action: () => Promise<boolean>, failText: string) => {
    setBusy(true);
    try {
      if (await action()) close();
      else if (failText) showError('Nichts gefunden', failText);
    } catch (e) {
      showError('Das hat nicht geklappt', errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroEmoji}>🏠🏠</Text>
        <Text style={styles.heroTitle}>Zwei Zuhause Plus</Text>
        <Text style={styles.heroText}>
          Kalender, Kosten und Nachrichten bleiben kostenlos. Plus ist für alles, was du belegen musst.
        </Text>
      </LinearGradient>

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {active ? (
        <View style={styles.activeBox}>
          <Text style={styles.activeTitle}>Plus ist aktiv ✓</Text>
          <Text style={styles.small}>Verwalten oder kündigen kannst du dein Abo in den Einstellungen deines Handys.</Text>
        </View>
      ) : !purchasesAvailable ? (
        <Text style={styles.small}>Käufe sind nur in der iOS- und Android-App möglich.</Text>
      ) : packages.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            {packages.map((pkg) => {
              const isChosen = pkg.identifier === chosen?.identifier;
              const hint = perMonth(pkg);
              return (
                <Pressable
                  key={pkg.identifier}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isChosen }}
                  onPress={() => setSelected(pkg.identifier)}
                  style={[styles.option, isChosen && styles.optionChosen]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{PERIOD[pkg.packageType] ?? pkg.product.title}</Text>
                    {pkg.product.introPrice ? (
                      <Text style={styles.trial}>
                        {pkg.product.introPrice.price === 0
                          ? `${pkg.product.introPrice.periodNumberOfUnits} ${unit(pkg.product.introPrice.periodUnit)} gratis testen`
                          : `Erst ${pkg.product.introPrice.priceString}`}
                      </Text>
                    ) : hint ? (
                      <Text style={styles.trial}>{hint}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.price}>{pkg.product.priceString}</Text>
                  <Ionicons
                    name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isChosen ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            title={busy ? 'Einen Moment…' : 'Plus freischalten'}
            icon="shield-checkmark"
            disabled={busy || !chosen}
            onPress={() => chosen && run(() => purchase(chosen), '')}
          />
          <Text style={styles.small}>
            Das Abo gilt nur für dich, nicht für den anderen Elternteil. Es verlängert sich automatisch, bis du es
            mindestens 24 Stunden vor Ablauf in den Einstellungen von App Store bzw. Google Play kündigst.
          </Text>
        </>
      )}

      {purchasesAvailable && !active ? (
        <View style={styles.links}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => run(restore, 'Zu deinem Konto gibt es keinen aktiven Kauf.')}
          >
            <Text style={styles.link}>Käufe wiederherstellen</Text>
          </Pressable>
          {TERMS_URL ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.link}>Nutzungsbedingungen</Text>
            </Pressable>
          ) : null}
          {PRIVACY_URL ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.link}>Datenschutz</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function unit(u: string) {
  return { DAY: 'Tage', WEEK: 'Wochen', MONTH: 'Monate', YEAR: 'Jahre' }[u] ?? u;
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  hero: { borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  heroEmoji: { fontSize: 36 },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
  heroText: { color: colors.white, fontSize: 15, textAlign: 'center', opacity: 0.95, lineHeight: 21 },
  benefits: { gap: spacing.md },
  benefit: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  benefitText: { fontSize: 14, color: colors.textMuted, lineHeight: 19 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow,
  },
  optionChosen: { borderColor: colors.primary },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  trial: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '800', color: colors.text },
  activeBox: { backgroundColor: colors.primaryPale, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  activeTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  small: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  link: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' },
});
