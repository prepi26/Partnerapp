import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState, GradientHeader, showError, tap } from '@/components/ui';
import { errorMessage, useFamily } from '@/data/store';
import { Message } from '@/data/types';
import { formatTimestamp } from '@/lib/dates';
import { toneHints } from '@/lib/tone';
import { colors, radius, spacing } from '@/theme';

/** Vor dem Senden kurz nachfragen, wenn der Ton-Check etwas findet. */
function confirmTone(hints: string[], onSend: () => void) {
  const message = `${hints.join('\n\n')}\n\nNachrichten lassen sich später nicht mehr ändern.`;
  if (Platform.OS === 'web') {
    if (window.confirm(`Nochmal lesen?\n\n${message}`)) onSend();
    return;
  }
  Alert.alert('Nochmal lesen?', message, [
    { text: 'Überarbeiten', style: 'cancel' },
    { text: 'Trotzdem senden', onPress: onSend },
  ]);
}

export default function Messages() {
  const { messages, me, otherName, otherJoined, sendMessage, markRead } = useFamily();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const list = useRef<FlatList<Message>>(null);

  useFocusEffect(
    useCallback(() => {
      markRead().catch(() => {});
    }, [markRead]),
  );

  const send = async () => {
    const clean = text.trim();
    if (!clean) return;
    setSending(true);
    try {
      await sendMessage(clean);
      setText('');
      tap();
    } catch (e) {
      showError('Nicht gesendet', errorMessage(e));
    }
    setSending(false);
  };

  const trySend = () => {
    const hints = toneHints(text);
    if (hints.length) confirmTone(hints, send);
    else send();
  };

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader title="Nachrichten" subtitle={`mit ${otherName} · nicht löschbar`} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.content}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="Sachlich bleiben"
              text={
                otherJoined
                  ? 'Jede Nachricht wird mit Datum, Uhrzeit und Prüfsumme gespeichert und kann nicht gelöscht werden. Das schützt euch beide.'
                  : `Sobald ${otherName} verbunden ist, könnt ihr hier schreiben.`
              }
            />
          }
          renderItem={({ item }) => <Bubble message={item} mine={item.sender_key === me} />}
        />
        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={otherJoined ? 'Nachricht schreiben…' : `${otherName} ist noch nicht verbunden`}
            placeholderTextColor={colors.textMuted}
            editable={otherJoined}
            multiline
            maxLength={4000}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Senden"
            disabled={sending || !text.trim() || !otherJoined}
            onPress={trySend}
            style={({ pressed }) => [
              styles.send,
              (sending || !text.trim() || !otherJoined) && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message: m, mine }: { message: Message; mine: boolean }) {
  return (
    <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.text, mine && { color: colors.white }]}>{m.text}</Text>
      </View>
      <Text style={styles.meta}>
        {formatTimestamp(m.created_at)}
        {mine ? (m.read_at ? ` · gelesen ${formatTimestamp(m.read_at)}` : ' · zugestellt') : ''} · #{m.hash.slice(0, 8)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  bubbleWrap: { maxWidth: '85%', gap: 2 },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  text: { fontSize: 16, color: colors.text, lineHeight: 22 },
  meta: { fontSize: 11, color: colors.textMuted, paddingHorizontal: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 140,
    backgroundColor: colors.muted,
    borderRadius: 21,
    paddingHorizontal: spacing.md,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
