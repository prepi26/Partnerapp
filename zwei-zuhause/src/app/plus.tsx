import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

import { IconName, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/config';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { errorMessage, useFamily } from '@/data/store';
import { Dict, fmt, useT } from '@/i18n';
import { formatDate, toISO } from '@/lib/dates';
import { close } from '@/lib/nav';
import { colors, gradient, radius, shadow, spacing } from '@/theme';

function benefits(t: Dict): { icon: IconName; title: string; text: string }[] {
  const b = t.money.plus.benefits;
  return [
    { icon: 'people', title: b.familyTitle, text: b.familyText },
    { icon: 'apps', title: b.allTitle, text: b.allText },
    { icon: 'shield-checkmark', title: b.proofTitle, text: b.proofText },
    { icon: 'heart', title: b.supportTitle, text: b.supportText },
  ];
}

function period(t: Dict): Partial<Record<PACKAGE_TYPE, string>> {
  return {
    [PACKAGE_TYPE.ANNUAL]: t.money.plus.period.annual,
    [PACKAGE_TYPE.MONTHLY]: t.money.plus.period.monthly,
    [PACKAGE_TYPE.LIFETIME]: t.money.plus.period.lifetime,
  };
}

function perMonth(pkg: PurchasesPackage, t: Dict) {
  if (pkg.packageType !== PACKAGE_TYPE.ANNUAL) return null;
  return pkg.product.pricePerMonthString
    ? fmt(t.money.plus.perMonth, { price: pkg.product.pricePerMonthString })
    : null;
}

export default function PlusScreen() {
  const t = useT();
  const {
    active,
    inTrial,
    solo,
    promoUntil,
    trialDaysLeft,
    packages,
    purchase,
    restore,
    myPlan,
    coveredElsewhere,
    moveHere,
  } = usePlus();
  const { otherName, family, families, redeemPromo } = useFamily();
  const p = t.money.plus;
  const [promo, setPromo] = useState('');
  const trialText = !inTrial
    ? p.trialOver
    : promoUntil
      ? fmt(p.promoActive, { date: formatDate(toISO(promoUntil), t) })
      : solo
        ? fmt(p.trialSolo, { name: otherName, n: trialDaysLeft })
        : trialDaysLeft === 0
          ? p.trialLastDay
          : trialDaysLeft === 1
            ? p.trialLeftOne
            : fmt(p.trialLeftOther, { n: trialDaysLeft });
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Plus Mehrfamilie nur zeigen, wenn es passt: mehrere Familien oder schon „Plus“ für eine Familie.
  const multiFamily = families.length > 1;
  const singles = packages.filter((pkg) => !isMulti(pkg));
  const multis = multiFamily || myPlan === 'single' ? packages.filter(isMulti) : [];
  const shown = [...singles, ...multis];
  // Jahresabo vorauswählen – bei mehreren Familien das für mehrere Familien.
  const chosen =
    shown.find((pkg) => pkg.identifier === selected) ??
    (multiFamily ? multis : singles).find((pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL) ??
    shown[0];

  const redeem = async () => {
    setBusy(true);
    try {
      const until = await redeemPromo(promo);
      setPromo('');
      showError(p.promoDoneTitle, fmt(p.promoActive, { date: formatDate(toISO(new Date(until)), t) }));
    } catch (e) {
      showError(t.common.failed, errorMessage(e));
    }
    setBusy(false);
  };

  const run = async (action: () => Promise<boolean>, failText: string) => {
    setBusy(true);
    try {
      if (await action()) close();
      else if (failText) showError(t.money.plus.nothingFound, failText);
    } catch (e) {
      showError(t.common.failed, errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroEmoji}>🏠🏠</Text>
        <Text style={styles.heroTitle}>{t.money.plus.heroTitle}</Text>
        <Text style={styles.heroText}>{t.money.plus.heroText}</Text>
      </LinearGradient>

      {!active ? (
        <View style={[styles.trialBox, !inTrial && styles.trialOver]}>
          <Text style={styles.trialText}>{trialText}</Text>
        </View>
      ) : null}

      {!active && !family.promo_until ? (
        <View style={styles.promo}>
          <Text style={styles.promoTitle}>{p.promoTitle}</Text>
          <Text style={styles.small}>{p.promoHint}</Text>
          <View style={styles.promoRow}>
            <TextInput
              value={promo}
              onChangeText={(text) =>
                setPromo(
                  text
                    .toUpperCase()
                    .replace(/[^A-Z0-9-]/g, '')
                    .slice(0, 20),
                )
              }
              placeholder={p.promoPlaceholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              style={styles.promoInput}
            />
            <Pressable
              accessibilityRole="button"
              disabled={busy || promo.length < 4}
              onPress={redeem}
              style={[styles.promoButton, (busy || promo.length < 4) && { opacity: 0.45 }]}
            >
              <Text style={styles.promoButtonText}>{p.promoRedeem}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.benefits}>
        {benefits(t).map((b) => (
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
          <Text style={styles.activeTitle}>{t.money.plus.activeTitle}</Text>
          <Text style={styles.small}>{t.money.plus.activeText}</Text>
        </View>
      ) : !purchasesAvailable ? (
        <Text style={styles.small}>{t.money.plus.unavailable}</Text>
      ) : packages.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {coveredElsewhere ? (
            <View style={styles.promo}>
              <Text style={styles.small}>{fmt(p.coveredElsewhere, { name: coveredElsewhere })}</Text>
              {myPlan === 'single' ? (
                <SecondaryButton
                  title={p.moveHere}
                  icon="swap-horizontal"
                  onPress={() => !busy && run(async () => (await moveHere(), true), '')}
                />
              ) : null}
            </View>
          ) : multiFamily ? (
            <Text style={styles.small}>{p.multiHint}</Text>
          ) : null}
          {[
            { title: multis.length ? p.tierSingle : null, list: singles },
            { title: p.tierMulti, list: multis },
          ]
            .filter((g) => g.list.length)
            .map((g) => (
              <View key={g.title ?? 'single'} style={{ gap: spacing.sm }}>
                {g.title ? <Text style={styles.tier}>{g.title}</Text> : null}
                {g.list.map((pkg) => {
                  const isChosen = pkg.identifier === chosen?.identifier;
                  const hint = perMonth(pkg, t);
                  return (
                    <Pressable
                      key={pkg.identifier}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isChosen }}
                      onPress={() => setSelected(pkg.identifier)}
                      style={[styles.option, isChosen && styles.optionChosen]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>{period(t)[pkg.packageType] ?? pkg.product.title}</Text>
                        {pkg.product.introPrice ? (
                          <Text style={styles.trial}>
                            {pkg.product.introPrice.price === 0
                              ? trial(pkg.product.introPrice.periodNumberOfUnits, pkg.product.introPrice.periodUnit, t)
                              : fmt(t.money.plus.introPrice, { price: pkg.product.introPrice.priceString })}
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
            ))}

          <PrimaryButton
            title={busy ? t.money.plus.busy : t.money.plus.unlock}
            icon="shield-checkmark"
            disabled={busy || !chosen}
            onPress={() => chosen && run(() => purchase(chosen), '')}
          />
          <Text style={styles.small}>{t.money.plus.terms}</Text>
        </>
      )}

      {purchasesAvailable && !active ? (
        <View style={styles.links}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(restore, t.money.plus.noPurchase)}>
            <Text style={styles.link}>{t.money.plus.restore}</Text>
          </Pressable>
          {TERMS_URL ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.link}>{t.money.plus.termsLink}</Text>
            </Pressable>
          ) : null}
          {PRIVACY_URL ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.link}>{t.money.plus.privacyLink}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

/** Pakete für Plus Mehrfamilie erkennt die App am Namen (z. B. „plus_multi_yearly“ in App Store und RevenueCat). */
function isMulti(pkg: PurchasesPackage) {
  return /multi/i.test(pkg.identifier) || /multi/i.test(pkg.product.identifier);
}

function trial(n: number, u: string, t: Dict) {
  const s = t.money.plus.trial;
  const one = n === 1;
  const template = {
    DAY: one ? s.dayOne : s.dayOther,
    WEEK: one ? s.weekOne : s.weekOther,
    MONTH: one ? s.monthOne : s.monthOther,
    YEAR: one ? s.yearOne : s.yearOther,
  }[u];
  return template ? fmt(template, { n }) : fmt(s.fallback, { n, unit: u });
}

const styles = StyleSheet.create({
  trialBox: { backgroundColor: colors.primaryPale, borderRadius: radius.md, padding: spacing.md },
  trialOver: { backgroundColor: colors.parentBPale },
  trialText: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 21 },
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
  tier: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.xs },
  promo: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  promoTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  promoRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  promoInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
  },
  promoButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  promoButtonText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  link: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' },
});
