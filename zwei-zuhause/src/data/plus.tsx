import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from '@/config';
import { supabase } from '@/lib/supabase';

import { useStore } from './store';

/** Berechtigungen in RevenueCat (Entitlements → Identifier): eine Familie bzw. bis zu drei Familien. */
const ENTITLEMENT = 'plus';
const ENTITLEMENT_MULTI = 'plus_multi';
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
  /** Eigenes Abo: 'multi' (bis zu 3 Familien), 'single' (1 Familie) oder null. */
  myPlan: 'multi' | 'single' | null;
  /** Mein Abo gilt für eine andere meiner Familien, nicht für die geöffnete: Name des anderen Elternteils dort. */
  coveredElsewhere: string | null;
  /** Das eigene Abo auf die geöffnete Familie legen (bei „Plus“ für eine Familie). */
  moveHere(): Promise<void>;
  /** Kostenlose Zeit läuft noch (allein oder Testtage nach dem Beitritt). */
  inTrial: boolean;
  /** Der andere ist noch nie beigetreten – die 14 Testtage haben noch nicht begonnen. */
  solo: boolean;
  /** Kostenlos per Gutschein bis (nur solange er noch läuft). */
  promoUntil: Date | null;
  /** Ganze Tage Testzeit, die noch übrig sind (0 = heute letzter Tag). */
  trialDaysLeft: number;
  /** Eintragen erlaubt (Abo oder Testzeit) – sonst nur lesen. Der Server prüft dasselbe. */
  canWrite: boolean;
  packages: PurchasesPackage[];
  purchase(pkg: PurchasesPackage): Promise<boolean>;
  restore(): Promise<boolean>;
}

const PlusContext = createContext<Plus | null>(null);

function planOf(info: CustomerInfo): 'multi' | 'single' | null {
  if (info.entitlements.active[ENTITLEMENT_MULTI]) return 'multi';
  return info.entitlements.active[ENTITLEMENT] ? 'single' : null;
}

/**
 * Server informieren: er prüft den Kauf bei RevenueCat und schaltet das Abo frei – zuerst für die geöffnete Familie,
 * bei Plus Mehrfamilie auch für bis zu zwei weitere.
 */
async function syncWithServer(familyId: string | undefined) {
  await supabase.functions.invoke('plus', { body: { family: familyId } }).catch(() => {});
}

export function PlusProvider({ children }: { children: ReactNode }) {
  const { userId, family, families, refresh } = useStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  // Eigenes Abo laut Store (der Server entscheidet, für welche Familien es gilt).
  const [myPlan, setMyPlan] = useState<'multi' | 'single' | null>(null);
  // „Jetzt“ für Testzeit und Abo-Ende – stündlich neu, damit eine offene App die Grenze mitbekommt.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let cancelled = false;
    const listener = (info: CustomerInfo) => setMyPlan(planOf(info));
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
        setMyPlan(planOf(info));
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
  // Ein Gutschein verlängert die kostenlose Zeit (der Server rechnet ihn ab Ende der Testzeit).
  const promoEnd = family?.promo_until ? new Date(family.promo_until).getTime() : 0;
  const promoActive = promoEnd > now && promoEnd > trialEnd;
  const freeEnd = Math.max(trialEnd, promoEnd);
  const inTrial = freeEnd > now;
  const trialDaysLeft = inTrial ? Math.floor((freeEnd - now) / DAY_MS) : 0;

  // Wofür gilt mein Abo gerade? (vom Server gesetzt)
  const coveredByMe = families.filter(
    (f) => f.plus_payer === userId && !!f.plus_until && new Date(f.plus_until).getTime() > now,
  );
  const elsewhere = family && !serverActive ? coveredByMe.find((f) => f.id !== family.id) : undefined;
  const coveredElsewhere = elsewhere ? (elsewhere.parent_a === userId ? elsewhere.name_b : elsewhere.name_a) : null;

  // Eigenes Abo, aber der Server weiß noch von keiner Familie (z. B. Kauf auf anderem Gerät): nachziehen.
  const familyId = family?.id;
  const noneCovered = coveredByMe.length === 0;
  useEffect(() => {
    if (myPlan && familyId && noneCovered) syncWithServer(familyId).then(refresh, () => {});
  }, [myPlan, familyId, noneCovered, refresh]);

  const afterPurchase = useCallback(
    async (info: CustomerInfo) => {
      const plan = planOf(info);
      setMyPlan(plan);
      if (plan) {
        await syncWithServer(familyId);
        await refresh().catch(() => {});
      }
      return !!plan;
    },
    [familyId, refresh],
  );

  const value = useMemo<Plus>(() => {
    const active = serverActive;
    return {
      active,
      myPlan,
      coveredElsewhere,
      moveHere: async () => {
        await syncWithServer(familyId);
        await refresh().catch(() => {});
      },
      inTrial,
      solo: solo && !promoActive,
      promoUntil: promoActive ? new Date(promoEnd) : null,
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
  }, [
    afterPurchase,
    coveredElsewhere,
    familyId,
    inTrial,
    myPlan,
    packages,
    promoActive,
    promoEnd,
    refresh,
    serverActive,
    solo,
    trialDaysLeft,
  ]);

  return <PlusContext.Provider value={value}>{children}</PlusContext.Provider>;
}

export function usePlus() {
  const plus = useContext(PlusContext);
  if (!plus) throw new Error('usePlus muss innerhalb von <PlusProvider> verwendet werden');
  return plus;
}
