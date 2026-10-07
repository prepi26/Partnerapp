import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from '@/config';
import { supabase } from '@/lib/supabase';

import { useStore } from './store';

/** Name der Berechtigung in RevenueCat (Entitlements → Identifier). */
const ENTITLEMENT = 'plus';
/** So viele Momente kann ein Paar ohne Plus speichern (muss zu supabase/schema.sql passen). */
export const FREE_MEMORY_LIMIT = 10;

const apiKey = Platform.select({ ios: REVENUECAT_IOS_KEY, android: REVENUECAT_ANDROID_KEY, default: '' });
/** Käufe gibt es nur in der iOS-/Android-App mit eingetragenem RevenueCat-Key. */
export const purchasesAvailable = apiKey.length > 0;

let configured = false;

interface Plus {
  /** Plus ist für das Paar aktiv – egal welcher Partner bezahlt. */
  active: boolean;
  packages: PurchasesPackage[];
  purchase(pkg: PurchasesPackage): Promise<boolean>;
  restore(): Promise<boolean>;
}

const PlusContext = createContext<Plus | null>(null);

function hasEntitlement(info: CustomerInfo) {
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

/** Server informieren: er prüft den Kauf bei RevenueCat und schaltet Plus für beide frei. */
async function syncWithServer() {
  await supabase.functions.invoke('plus-sync').catch(() => {});
}

export function PlusProvider({ children }: { children: ReactNode }) {
  const { userId, couple, refresh } = useStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  // Eigener Kauf, bevor der Server ihn bestätigt hat.
  const [ownEntitlement, setOwnEntitlement] = useState(false);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let cancelled = false;
    const listener = (info: CustomerInfo) => setOwnEntitlement(hasEntitlement(info));
    (async () => {
      try {
        // Die Supabase-Nutzer-ID ist die RevenueCat-ID – so ordnet der Server Käufe dem Paar zu.
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
        // Store nicht erreichbar: Plus bleibt so, wie der Server es sagt.
      }
    })();
    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [userId]);

  const serverActive = !!couple?.plus_until && new Date(couple.plus_until) > new Date();

  // Eigenes Abo, aber Server weiß noch nichts davon (z. B. Kauf auf anderem Gerät): nachziehen.
  const coupleId = couple?.id;
  useEffect(() => {
    if (ownEntitlement && coupleId && !serverActive) syncWithServer().then(refresh, () => {});
  }, [ownEntitlement, coupleId, serverActive, refresh]);

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

  const value = useMemo<Plus>(
    () => ({
      active: serverActive || ownEntitlement,
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
    }),
    [afterPurchase, ownEntitlement, packages, serverActive],
  );

  return <PlusContext.Provider value={value}>{children}</PlusContext.Provider>;
}

export function usePlus() {
  const plus = useContext(PlusContext);
  if (!plus) throw new Error('usePlus muss innerhalb von <PlusProvider> verwendet werden');
  return plus;
}
