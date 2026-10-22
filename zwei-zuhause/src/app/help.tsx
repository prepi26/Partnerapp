import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, IconName } from '@/components/ui';
import { colors, spacing } from '@/theme';

const URGENT: { label: string; number: string; text: string }[] = [
  { label: 'Notruf', number: '110', text: 'Bei akuter Gefahr für dich oder dein Kind' },
  { label: 'Hilfetelefon Gewalt gegen Frauen', number: '116016', text: 'Rund um die Uhr, anonym, mehrsprachig' },
  { label: 'Hilfetelefon Gewalt an Männern', number: '08001239900', text: 'Beratung für betroffene Männer' },
  { label: 'Nummer gegen Kummer – Kinder & Jugendliche', number: '116111', text: 'Für Kinder und Jugendliche, anonym' },
  { label: 'Elterntelefon', number: '08001110550', text: 'Kostenlose, anonyme Beratung für Eltern' },
];

const PLACES: { icon: IconName; title: string; text: string; url?: string }[] = [
  {
    icon: 'business-outline',
    title: 'Jugendamt',
    text: 'Berät kostenlos bei Trennung, Sorge und Umgang (§§ 17, 18 SGB VIII), hilft bei einer Elternvereinbarung und vermittelt begleiteten Umgang. Zuständig ist das Jugendamt am Wohnort des Kindes.',
  },
  {
    icon: 'people-outline',
    title: 'Erziehungs- und Familienberatung',
    text: 'Kostenlos und vertraulich, auch online – für Eltern und Kinder.',
    url: 'https://www.bke-beratung.de',
  },
  {
    icon: 'git-merge-outline',
    title: 'Mediation',
    text: 'Eine neutrale Person hilft euch, selbst eine Lösung zu finden. Oft schneller und günstiger als ein Gerichtsverfahren.',
  },
  {
    icon: 'briefcase-outline',
    title: 'Fachanwalt für Familienrecht',
    text: 'Für Fragen zu Sorgerecht, Umgang und Unterhalt im Einzelfall. Bei geringem Einkommen gibt es Beratungshilfe.',
  },
];

export default function Help() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Sofort Hilfe</Text>
      {URGENT.map((u) => (
        <Pressable
          key={u.number}
          accessibilityRole="button"
          accessibilityLabel={`${u.label} anrufen`}
          onPress={() => Linking.openURL(`tel:${u.number}`)}
          style={({ pressed }) => [styles.call, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="call" size={20} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.callTitle}>{u.label}</Text>
            <Text style={styles.callText}>{u.text}</Text>
          </View>
          <Text style={styles.callNumber}>{u.number.replace(/^0800(\d{3})(\d+)$/, '0800 $1 $2')}</Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Wenn du Angst vor dem anderen Elternteil hast</Text>
      <Card style={{ gap: spacing.sm }}>
        <Tip text="Deine Sicherheit geht vor. Eine gemeinsame App ist dann nicht der richtige Weg – hol dir zuerst Unterstützung (Hilfetelefon oben, rund um die Uhr)." />
        <Tip text="Das Jugendamt kann begleiteten Umgang oder Übergaben über Dritte organisieren. Das Familiengericht kann nach dem Gewaltschutzgesetz Kontakt- und Näherungsverbote aussprechen." />
        <Tip text="Zwei Zuhause speichert keinen Standort. Lesebestätigungen kannst du in den Einstellungen ausschalten, die App-Sperre schützt Nachrichten und Tagebuch." />
        <Tip text="Nachrichten lassen sich nicht löschen – auch nicht vom anderen Elternteil. Bedrohungen bleiben so dokumentiert." />
      </Card>

      <Text style={styles.section}>Beratung & Begleitung</Text>
      {PLACES.map((p) => (
        <Card key={p.title} style={styles.place}>
          <Ionicons name={p.icon} size={24} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.placeTitle}>{p.title}</Text>
            <Text style={styles.placeText}>{p.text}</Text>
            {p.url ? (
              <Text style={styles.link} onPress={() => Linking.openURL(p.url!)}>
                {p.url.replace('https://', '')}
              </Text>
            ) : null}
          </View>
        </Card>
      ))}

      <Text style={styles.section}>Gut zu wissen</Text>
      <Card style={{ gap: spacing.sm }}>
        <Tip text="Euer Kind hat ein eigenes Recht auf Umgang mit beiden Eltern. Sprecht gut voneinander – Kinder hören mehr, als man denkt." />
        <Tip text="Alltägliches entscheidet, wer das Kind gerade betreut. Wichtige Fragen (Schule, Operation, Auslandsreise, Umzug) entscheidet ihr bei gemeinsamer Sorge zusammen." />
        <Tip text="Eine Elternvereinbarung bindet euch nur gegenseitig. Vollstreckbar wird sie erst, wenn das Familiengericht sie billigt." />
        <Tip text="Nachrichten-Verläufe zeigen, wer was wann geschrieben hat – nicht, wer recht hat. Fachkräfte achten vor allem darauf, ob ihr im Sinne des Kindes kooperiert." />
      </Card>

      <Text style={styles.disclaimer}>
        Zwei Zuhause gibt allgemeine Informationen und ersetzt keine Rechtsberatung. Für deinen Einzelfall wende dich an das
        Jugendamt, eine Beratungsstelle oder eine Fachanwältin bzw. einen Fachanwalt für Familienrecht.
      </Text>
    </ScrollView>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipDot}>•</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
  },
  callTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  callText: { fontSize: 12, color: colors.white, opacity: 0.9 },
  callNumber: { fontSize: 15, fontWeight: '800', color: colors.white },
  place: { flexDirection: 'row', gap: spacing.md },
  placeTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  placeText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  link: { fontSize: 14, color: colors.primary, fontWeight: '700', marginTop: 2 },
  tip: { flexDirection: 'row', gap: spacing.sm },
  tipDot: { fontSize: 15, color: colors.primary, fontWeight: '900' },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: spacing.lg },
});
