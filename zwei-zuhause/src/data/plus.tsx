import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from '@/config';
import { supabase } from '@/lib/supabase';

import { useStore } from './store';

/** Name der Berechtigung in RevenueCat (Entitlements → Identifier). */
const ENTITLEMENT = 'plus';
/** Testzeit ab dem Beitritt des anderen Elternteils (muss zu family_active() in supabase/schema.sql passen). */
export const TRIAL_DAYS = 14;
/** Solange man allein ist: kostenlos höchstens so lange ab Anlegen der Familie. */
export const SOLO_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const apiKey = Platform.select({ ios: REVENUECAT_IOS_KEY, android: REVENUECAT_ANDROID_KEY, default: '' });
/** Käufe gibt es nur in der iOS-/Android-App mit eingetragenem RevenueCat-Key. */
export const purchasesAvailable = apiKey.length > 0;

let configured = false;

interface Plus {
  /** Familien-Abo aktiv – egal, welcher Elternteil zahlt. */
  active: boolean;
  /** Kostenlose Zeit läuft noch (allein oder Testtage nach dem Beitritt). */
  inTrial: boolean;
  /** Der andere ist noch nie beigetreten – die 14 Testtage haben noch nicht begonnen. */
  solo: boolean;
  /** Ganze Tage Testzeit, die noch übrig sind (0 = heute letzter Tag). */
  trialDaysLeft: number;
  /** Eintragen erlaubt (Abo oder Testzeit) – sonst nur lesen. Der Server prüft dasselbe. */
  canWrite: boolean;
  packages: PurchasesPackage[];
  purchase(pkg: PurchasesPackage): Promise<boolean>;
  restore(): Promise<boolean>;
}

const PlusContext = createContext<Plus | null>(null);

function hasEntitlement(info: CustomerInfo) {
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

/** Server informieren: er prüft den Kauf bei RevenueCat und schaltet das Abo für die ganze Familie frei. */
async function syncWithServer() {
  await supabase.functions.invoke('plus').catch(() => {});
}

export function PlusProvider({ children }: { children: ReactNode }) {
  const { userId, family, refresh } = useStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  // Eigener Kauf, bevor der Server ihn bestätigt hat.
  const [ownEntitlement, setOwnEntitlement] = useState(false);
  // „Jetzt“ für Testzeit und Abo-Ende – stündlich neu, damit eine offene App die Grenze mitbekommt.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let cancelled = false;
    const listener = (info: CustomerInfo) => setOwnEntitlement(hasEntitlement(info));
    (async () => {
      try {
        // Die Supabase-Nutzer-ID ist die RevenueCat-ID – so ordnet der Server Käufe der Familie zu.
        if (!configured) {
          Purchases.configure({ apiKey, appUserID: userId });
          configured = true;
        } else {
          await Purchases.logIn(userId);
        }
        Purchases.addCustomerInfoUpdateListener(listener);
        const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
        if (cancelled) return;
        setOwnEntitlement(hasEntitlement(info));
        setPackages(offerings.current?.availablePackages ?? []);
      } catch {
        // Store nicht erreichbar: es gilt, was der Server sagt.
      }
    })();
    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [userId]);

  const serverActive = !!family?.plus_until && new Date(family.plus_until).getTime() > now;
  const solo = !!family && !family.joined_at;
  const trialEnd = !family
    ? 0
    : family.joined_at
      ? new Date(family.joined_at).getTime() + TRIAL_DAYS * DAY_MS
      : new Date(family.created_at).getTime() + SOLO_DAYS * DAY_MS;
  const inTrial = trialEnd > now;
  const trialDaysLeft = inTrial ? Math.floor((trialEnd - now) / DAY_MS) : 0;

  // Eigenes Abo, aber Server weiß noch nichts davon (z. B. Kauf auf anderem Gerät): nachziehen.
  const familyId = family?.id;
  useEffect(() => {
    if (ownEntitlement && familyId && !serverActive) syncWithServer().then(refresh, () => {});
  }, [ownEntitlement, familyId, serverActive, refresh]);

  const afterPurchase = useCallback(
    async (info: CustomerInfo) => {
      const ok = hasEntitlement(info);
      setOwnEntitlement(ok);
      if (ok) {
        await syncWithServer();
        await refresh().catch(() => {});
      }
      return ok;
    },
    [refresh],
  );

  const value = useMemo<Plus>(() => {
    const active = serverActive || ownEntitlement;
    return {
      active,
      inTrial,
      solo,
      trialDaysLeft,
      canWrite: active || inTrial,
      packages,
      purchase: async (pkg) => {
        try {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          return await afterPurchase(customerInfo);
        } catch (e) {
          if ((e as { userCancelled?: boolean }).userCancelled) return false;
          throw e;
        }
      },
      restore: async () => afterPurchase(await Purchases.restorePurchases()),
    };
  }, [afterPurchase, inTrial, ownEntitlement, packages, serverActive, solo, trialDaysLeft]);

  return <PlusContext.Provider value={value}>{children}</PlusContext.Provider>;
}

export function usePlus() {
  const plus = useContext(PlusContext);
  if (!plus) throw new Error('usePlus muss innerhalb von <PlusProvider> verwendet werden');
  return plus;
}
