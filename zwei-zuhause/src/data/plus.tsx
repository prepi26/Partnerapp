import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from '@/config';

import { useStore } from './store';

/** Name der Berechtigung in RevenueCat (Entitlements → Identifier). */
const ENTITLEMENT = 'plus';

const apiKey = Platform.select({ ios: REVENUECAT_IOS_KEY, android: REVENUECAT_ANDROID_KEY, default: '' });
/** Käufe gibt es nur in der iOS-/Android-App mit eingetragenem RevenueCat-Key. */
export const purchasesAvailable = apiKey.length > 0;

let configured = false;

interface Plus {
  /** Plus gilt pro Elternteil – getrennte Eltern teilen sich kein Abo. */
  active: boolean;
  packages: PurchasesPackage[];
  purchase(pkg: PurchasesPackage): Promise<boolean>;
  restore(): Promise<boolean>;
}

const PlusContext = createContext<Plus | null>(null);

function hasEntitlement(info: CustomerInfo) {
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

export function PlusProvider({ children }: { children: ReactNode }) {
  const { userId } = useStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let cancelled = false;
    const listener = (info: CustomerInfo) => setActive(hasEntitlement(info));
    (async () => {
      try {
        // Die Supabase-Nutzer-ID ist die RevenueCat-ID – so bleibt Plus beim Gerätewechsel erhalten.
        if (!configured) {
          Purchases.configure({ apiKey, appUserID: userId });
          configured = true;
        } else {
          await Purchases.logIn(userId);
        }
        Purchases.addCustomerInfoUpdateListener(listener);
        const [info, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
        if (cancelled) return;
        setActive(hasEntitlement(info));
        setPackages(offerings.current?.availablePackages ?? []);
      } catch {
        // Store nicht erreichbar: Plus bleibt aus, bis er wieder antwortet.
      }
    })();
    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [userId]);

  const afterPurchase = useCallback(async (info: CustomerInfo) => {
    const ok = hasEntitlement(info);
    setActive(ok);
    return ok;
  }, []);

  const value = useMemo<Plus>(
    () => ({
      active,
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
    [active, afterPurchase, packages],
  );

  return <PlusContext.Provider value={value}>{children}</PlusContext.Provider>;
}

export function usePlus() {
  const plus = useContext(PlusContext);
  if (!plus) throw new Error('usePlus muss innerhalb von <PlusProvider> verwendet werden');
  return plus;
}
