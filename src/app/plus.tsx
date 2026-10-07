import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

import { IconName, PrimaryButton, showError } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/config';
import { FREE_MEMORY_LIMIT, purchasesAvailable, usePlus } from '@/data/plus';
import { errorMessage, useCouple } from '@/data/store';
import { colors, gradient, radius, shadow, spacing } from '@/theme';

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'people', title: 'Ein Abo für euch beide', text: 'Einer zahlt, beide haben alles.' },
  {
    icon: 'images',
    title: 'Unbegrenzte Momente',
    text: `Statt ${FREE_MEMORY_LIMIT} – haltet eure ganze Geschichte fest.`,
  },
  { icon: 'chatbubbles', title: '3 Themen-Fragen täglich', text: 'Tiefgang 🌊, Zukunft 🏡 und Prickelnd 🌶️.' },
  { icon: 'heart', title: 'Unterstützt Wir zwei', text: 'Keine Werbung, keine verkauften Daten. Versprochen.' },
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
  const { partnerName } = useCouple();
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
      if (await action()) router.back();
      else if (failText) showError('Nichts gefunden', failText);
    } catch (e) {
      showError('Das hat nicht geklappt', errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroEmoji}>💖✨</Text>
        <Text style={styles.heroTitle}>Wir zwei Plus</Text>
        <Text style={styles.heroText}>Mehr Nähe, mehr Erinnerungen – für dich und {partnerName}.</Text>
      </LinearGradient>

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon} size={20} color={colors.pink} />
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
          <Text style={styles.activeTitle}>Plus ist aktiv 🎉</Text>
          <Text style={styles.small}>
            Danke! Kündigen oder ändern geht jederzeit in den Abo-Einstellungen von App Store bzw. Google Play.
          </Text>
        </View>
      ) : !purchasesAvailable ? (
        <Text style={styles.small}>Plus kannst du in der iPhone- oder Android-App abschließen.</Text>
      ) : packages.length === 0 ? (
        <ActivityIndicator color={colors.pink} />
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
                    color={isChosen ? colors.pink : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            title={busy ? 'Einen Moment…' : 'Plus freischalten'}
            icon="sparkles"
            disabled={busy || !chosen}
            onPress={() => chosen && run(() => purchase(chosen), '')}
          />
          <Text style={styles.small}>
            Abos verlängern sich automatisch, bis du sie mindestens 24 Stunden vor Ablauf in den Einstellungen von App
            Store bzw. Google Play kündigst.
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
  heroEmoji: { fontSize: 40 },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: '800' },
  heroText: { color: colors.white, fontSize: 16, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  benefits: { gap: spacing.md },
  benefit: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkPale,
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
  optionChosen: { borderColor: colors.pink },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  trial: { fontSize: 13, color: colors.pink, fontWeight: '600', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '800', color: colors.text },
  activeBox: { backgroundColor: colors.pinkPale, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  activeTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  small: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  link: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' },
});
