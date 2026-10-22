import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { WriteGate } from '@/components/SubscriptionBanner';
import { Card, Chip, Field, Label, PrimaryButton, showError } from '@/components/ui';
import { formatSize, MAX_DOCUMENT_BYTES, PickedFile } from '@/data/documents';
import { attempt, useFamily } from '@/data/store';
import { DocumentCategory } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { toISO, today } from '@/lib/dates';
import { documentCategories, documentCategory } from '@/lib/documentCategories';
import { close } from '@/lib/nav';
import { colors, radius, spacing } from '@/theme';

export default function DocumentNew() {
  const t = useT();
  const { otherName, addDocument } = useFamily();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('schule');
  const [withDate, setWithDate] = useState(false);
  const [docDate, setDocDate] = useState(toISO(today()));
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const accept = (picked: PickedFile) => {
    if (picked.size > MAX_DOCUMENT_BYTES) {
      showError(
        t.family.documentNew.tooBigTitle,
        fmt(t.family.documentNew.tooBigText, { size: formatSize(MAX_DOCUMENT_BYTES) }),
      );
      return;
    }
    setFile(picked);
    if (!title.trim()) setTitle(picked.name.replace(/\.[^.]+$/, '').slice(0, 200));
  };

  const pickPhoto = async (camera: boolean) => {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const a = result.assets[0];
    accept({
      uri: a.uri,
      name: a.fileName ?? 'Foto.jpg',
      mimeType: a.mimeType ?? 'image/jpeg',
      size: a.fileSize ?? 0,
    });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    accept({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size ?? 0 });
  };

  const health = category === 'gesundheit';
  const save = async () => {
    if (!file) return;
    setBusy(true);
    const ok = await attempt(() =>
      addDocument({
        file,
        title: title.trim(),
        category,
        doc_date: withDate ? docDate : null,
        healthConsent: health && consent,
      }),
    );
    if (ok) close();
    else setBusy(false);
  };

  return (
    <WriteGate>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {file ? (
            <Card style={styles.file}>
              <Ionicons
                name={file.mimeType === 'application/pdf' ? 'document-text' : 'image'}
                size={28}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.hint}>{file.size ? formatSize(file.size) : ''}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t.family.documentNew.otherFile} onPress={() => setFile(null)}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </Pressable>
            </Card>
          ) : (
            <View style={styles.pickers}>
              {Platform.OS !== 'web' ? (
                <PickButton icon="camera-outline" label={t.family.documentNew.takePhoto} onPress={() => pickPhoto(true)} />
              ) : null}
              <PickButton icon="image-outline" label={t.family.documentNew.fromPhotos} onPress={() => pickPhoto(false)} />
              <PickButton icon="document-outline" label={t.family.documentNew.pdfFile} onPress={pickFile} />
            </View>
          )}

          <Field
            label={t.family.documentNew.titleLabel}
            value={title}
            onChangeText={setTitle}
            placeholder={t.family.documentNew.titlePlaceholder}
            maxLength={200}
          />

          <Label>{t.family.documentNew.area}</Label>
          <View style={styles.chips}>
            {documentCategories(t).map((c) => (
              <Chip key={c.key} label={`${c.emoji} ${c.label}`} selected={category === c.key} onPress={() => setCategory(c.key)} />
            ))}
          </View>
          <Text style={styles.hint}>{fmt(t.family.examples, { examples: documentCategory(category, t).examples })}</Text>

          <View style={styles.chips}>
            <Chip label={t.family.documentNew.noDate} tint="accent" selected={!withDate} onPress={() => setWithDate(false)} />
            <Chip label={t.family.documentNew.withDate} tint="accent" selected={withDate} onPress={() => setWithDate(true)} />
          </View>
          {withDate ? (
            <DateField label={t.family.documentNew.dateLabel} value={docDate} onChange={setDocDate} maximumDate={today()} />
          ) : null}

          {health ? (
            <Card style={styles.consent}>
              <View style={styles.consentRow}>
                <Text style={styles.consentText}>{fmt(t.family.documentNew.healthConsent, { name: otherName })}</Text>
                <Switch value={consent} onValueChange={setConsent} trackColor={{ true: colors.primary }} />
              </View>
              <Text style={styles.hint}>{t.family.documentNew.healthHint}</Text>
            </Card>
          ) : null}

          <PrimaryButton
            title={busy ? t.family.documentNew.uploading : t.family.documentNew.share}
            icon="cloud-upload-outline"
            disabled={busy || !file || !title.trim() || (health && !consent)}
            onPress={save}
          />
          <Text style={styles.hint}>{fmt(t.family.documentNew.visibleHint, { name: otherName })}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </WriteGate>
  );
}

function PickButton({ icon, label, onPress }: { icon: 'camera-outline' | 'image-outline' | 'document-outline'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.pick, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={26} color={colors.primary} />
      <Text style={styles.pickText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  pickers: { flexDirection: 'row', gap: spacing.sm },
  pick: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryPale,
  },
  pickText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  file: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  fileName: { fontSize: 15, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  consent: { gap: spacing.sm, backgroundColor: colors.parentBPale },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  consentText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
});
