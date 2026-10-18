import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/data/auth';
import { useOptionalStore } from '@/data/store';
import { clearPendingInvite, savePendingInvite } from '@/lib/invite';
import { colors } from '@/theme';

/**
 * Ziel der Einladungslinks https://prepi26.github.io/j/?c=CODE.
 * Merkt sich den Code und schickt zum Login bzw. ins Onboarding, wo er schon eingetragen ist.
 */
export default function InviteLink() {
  const { c } = useLocalSearchParams<{ c?: string }>();
  const { session } = useAuth();
  const store = useOptionalStore();
  const alreadyPaired = !!store?.couple;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = alreadyPaired ? clearPendingInvite() : savePendingInvite(c);
    task.finally(() => setReady(true));
  }, [alreadyPaired, c]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!session) return <Redirect href="/login" />;
  if (alreadyPaired) return <Redirect href="/" />;
  return <Redirect href="/onboarding" />;
}
