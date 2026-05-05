import React, {useEffect, useMemo, useState} from 'react';
import {useRoute} from '@react-navigation/native';
import {
  StatusBar,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {AppContainer} from '../../../components/layouts/AppContainer';
import AdIcon from 'react-native-vector-icons/AntDesign';
import {Typography} from '../../../components/Typography';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../constants/colors';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import apiRequest from '../../../utils/apiRequest';
import endPoints from '../../../constants/endPoints';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import userActions from '../../../redux/actions/userActions';
import {setFirstTime} from '../../../redux/userSlice';
import {
  SUBSCRIPTION_PLANS_DEFINITION,
  SUBSCRIPTION_PAYWALL_FOOTNOTE,
} from '../../../constants/subscriptionProducts';
import {
  effectiveTier,
  TIERS,
} from '../../../constants/subscriptionEntitlements';
import {
  initConnection,
  requestPurchase,
  finishTransaction,
  fetchProducts,
  getAvailablePurchases,
  getReceiptIOS,
  syncIOS,
  currentEntitlementIOS,
  latestTransactionIOS,
  purchaseUpdatedListener,
  purchaseErrorListener,
  DUPLICATE_PURCHASE_CODE,
} from 'react-native-iap';

/** Paywall gradient (matches design reference) */
const SUBSCRIPTION_GRADIENT = ['#B020F0', '#1040E0'];
const PRICE_ACCENT = '#F020B0';
const CHECK_BLUE = '#1424FF';
const SUBTITLE_MUTED = '#707070';

const IAP_LOG = '[IAP Subscription]';

function iapDebug(tag, payload) {
  if (payload === undefined) {
    console.log(`${IAP_LOG} ${tag}`);
    return;
  }
  console.log(`${IAP_LOG} ${tag}`, payload);
}

function summarizeError(e) {
  if (e == null) {
    return e;
  }
  if (typeof e === 'string') {
    return e;
  }
  if (typeof e !== 'object') {
    return String(e);
  }
  return {
    message: e.message,
    code: e.code,
    name: e.name,
    productId: e.productId,
    userInfo: e.userInfo,
    domain: e.domain,
    stackPreview: typeof e.stack === 'string' ? e.stack.slice(0, 400) : undefined,
  };
}

function storeProductSku(p) {
  if (!p || typeof p !== 'object') {
    return undefined;
  }
  return p.productId ?? p.id;
}

/** StoreKit 2 / Nitro sometimes align plan id on `currentPlanId` or `ids` instead of `productId`. */
function purchaseMatchesExpectedSku(p, sku) {
  if (!sku || !p || typeof p !== 'object') {
    return false;
  }
  const primary = storeProductSku(p);
  if (primary === sku) {
    return true;
  }
  if (p.currentPlanId === sku) {
    return true;
  }
  if (Array.isArray(p.ids) && p.ids.includes(sku)) {
    return true;
  }
  /** Upgrade/downgrade in same subscription group: transaction still shows old `productId`. */
  const r = p.renewalInfoIOS;
  if (r && typeof r === 'object') {
    if (r.autoRenewPreference === sku) {
      return true;
    }
    if (r.pendingUpgradeProductId === sku) {
      return true;
    }
  }
  return false;
}

/** App Store “already subscribed” — recover purchase from StoreKit instead of failing immediately. */
function isRecoverableStoreOwnershipError(error) {
  const code = String(error?.code ?? '').toLowerCase();
  const msg = String(error?.message ?? '').toLowerCase();
  return (
    code === 'already-owned' ||
    code.includes('already-owned') ||
    msg.includes('already owned') ||
    msg.includes('item already owned')
  );
}

/** Backend verify needs the tier user selected; during upgrade receipt row may still show old SKU. */
function resolveVerifyProductId(latestPurchase, selectedSku) {
  if (!selectedSku) {
    return storeProductSku(latestPurchase);
  }
  const r = latestPurchase?.renewalInfoIOS;
  if (r && typeof r === 'object') {
    if (
      r.pendingUpgradeProductId === selectedSku ||
      r.autoRenewPreference === selectedSku
    ) {
      return selectedSku;
    }
  }
  return storeProductSku(latestPurchase) || selectedSku;
}

function productIdToPlanId(pid) {
  if (!pid || typeof pid !== 'string') {
    return null;
  }
  const row = SUBSCRIPTION_PLANS_DEFINITION.find((p) => p.productId === pid);
  return row?.id ?? null;
}

function tierRankPlanId(planId) {
  const R = {
    [TIERS.CREATOR_ACCESS]: 0,
    collab_pro: 1,
    creator_passport: 2,
    creator_elite: 3,
  };
  return planId != null && R[planId] !== undefined ? R[planId] : -1;
}

/** Highest tier implied by this receipt row (handles upgrades via renewalInfo). */
function bestTierIdFromPurchase(p) {
  if (!p || typeof p !== 'object') {
    return null;
  }
  const sku = storeProductSku(p);
  const r = p.renewalInfoIOS;
  const candidates = [
    r?.autoRenewPreference,
    r?.pendingUpgradeProductId,
    sku,
  ].filter((x) => typeof x === 'string' && x.length > 0);
  let best = null;
  let bestRank = -1;
  for (const pid of candidates) {
    const planId = productIdToPlanId(pid);
    if (!planId) {
      continue;
    }
    const tr = tierRankPlanId(planId);
    if (tr > bestRank) {
      bestRank = tr;
      best = planId;
    }
  }
  return best;
}

function bestTierFromStorePurchases(purchases) {
  if (!Array.isArray(purchases) || !purchases.length) {
    return null;
  }
  let best = null;
  let bestR = -1;
  for (const p of purchases) {
    const tid = bestTierIdFromPurchase(p);
    if (!tid) {
      continue;
    }
    const r = tierRankPlanId(tid);
    if (r > bestR) {
      bestR = r;
      best = tid;
    }
  }
  return best;
}

/** Prefer backend when it’s higher; if backend is still free, trust StoreKit. */
function mergedSubscriptionTier(user, storeTierId) {
  const backend = effectiveTier(user);
  if (!storeTierId) {
    return backend;
  }
  const br = tierRankPlanId(backend);
  const sr = tierRankPlanId(storeTierId);
  if (backend === TIERS.CREATOR_ACCESS) {
    return storeTierId;
  }
  return sr >= br ? storeTierId : backend;
}

function summarizeStoreSubscription(p) {
  if (!p || typeof p !== 'object') {
    return p;
  }
  return {
    id: p.id,
    productId: storeProductSku(p),
    title: p.title,
    displayPrice: p.displayPrice,
    price: p.price,
    localizedPrice: p.localizedPrice,
    currency: p.currency,
    platform: p.platform,
    subscriptionPeriodUnitIOS: p.subscriptionPeriodUnitIOS,
    subscriptionPeriodNumberIOS: p.subscriptionPeriodNumberIOS,
  };
}

function summarizePurchase(p) {
  if (!p || typeof p !== 'object') {
    return p;
  }
  return {
    productId: storeProductSku(p),
    currentPlanId: p.currentPlanId,
    ids: p.ids,
    id: p.id,
    transactionId: p.transactionId,
    transactionDate: p.transactionDate,
    transactionReceiptLength: p.transactionReceipt
      ? String(p.transactionReceipt).length
      : 0,
    purchaseTokenLength: p.purchaseToken
      ? String(p.purchaseToken).length
      : 0,
    platform: p.platform,
    isAutoRenewing: p.isAutoRenewing,
    expirationDateIOS: p.expirationDateIOS,
    originalTransactionDateIOS: p.originalTransactionDateIOS,
    originalTransactionIdentifierIOS: p.originalTransactionIdentifierIOS,
  };
}

function normalizeSubscriptionList(products) {
  if (Array.isArray(products)) {
    return products;
  }
  if (products && typeof products === 'object') {
    return [products];
  }
  return [];
}

function dedupePurchases(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    if (!p || typeof p !== 'object') {
      continue;
    }
    const id = String(p.id ?? p.transactionId ?? '');
    const pid = String(storeProductSku(p) ?? '');
    const key = `${id}#${pid}`;
    if (!id && !pid) {
      continue;
    }
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * StoreKit 2 often omits listener/promise results; fetch entitlement + latest tx + avail list.
 * Each syncIOS + getAvailablePurchases round-trip can trigger Apple ID password prompts — use
 * skipSync/lightweight on polls and mutex in the purchase flow to avoid hammering the store.
 */
async function collectIosPurchasesForSku(sku, flowId, options = {}) {
  const {skipSync = false, lightweight = false} = options;
  const collected = [];
  if (Platform.OS !== 'ios') {
    return collected;
  }
  if (!skipSync) {
    try {
      await syncIOS();
      iapDebug('collectIosPurchases syncIOS OK', {flowId});
    } catch (e) {
      iapDebug('collectIosPurchases syncIOS error', {
        flowId,
        error: summarizeError(e),
      });
    }
  }

  if (!lightweight) {
    try {
      const ent = await currentEntitlementIOS(sku);
      if (ent) {
        iapDebug('collectIosPurchases currentEntitlementIOS', {
          flowId,
          summary: summarizePurchase(ent),
        });
        collected.push(ent);
      }
    } catch (e) {
      iapDebug('collectIosPurchases currentEntitlementIOS error', {
        flowId,
        error: summarizeError(e),
      });
    }

    try {
      const lt = await latestTransactionIOS(sku);
      if (lt) {
        iapDebug('collectIosPurchases latestTransactionIOS', {
          flowId,
          summary: summarizePurchase(lt),
        });
        collected.push(lt);
      }
    } catch (e) {
      iapDebug('collectIosPurchases latestTransactionIOS error', {
        flowId,
        error: summarizeError(e),
      });
    }
  }

  const pullAvail = async (onlyActive) => {
    try {
      const raw = await getAvailablePurchases({
        onlyIncludeActiveItemsIOS: onlyActive,
      });
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      iapDebug('collectIosPurchases getAvailablePurchases', {
        flowId,
        onlyIncludeActiveItemsIOS: onlyActive,
        count: list.length,
      });
      collected.push(...list);
    } catch (e) {
      iapDebug('collectIosPurchases getAvailablePurchases error', {
        flowId,
        onlyIncludeActiveItemsIOS: onlyActive,
        error: summarizeError(e),
      });
    }
  };

  await pullAvail(true);

  return dedupePurchases(collected);
}

function purchaseRenewalPrefersSku(p, sku) {
  const r = p?.renewalInfoIOS;
  if (!r || typeof r !== 'object' || !sku) {
    return false;
  }
  return r.autoRenewPreference === sku || r.pendingUpgradeProductId === sku;
}

function pickBestPurchaseForSku(candidates, sku) {
  const matches = candidates.filter((p) => purchaseMatchesExpectedSku(p, sku));
  matches.sort((a, b) => {
    const br = purchaseRenewalPrefersSku(b, sku) ? 1 : 0;
    const ar = purchaseRenewalPrefersSku(a, sku) ? 1 : 0;
    if (br !== ar) {
      return br - ar;
    }
    return Number(b.transactionDate || 0) - Number(a.transactionDate || 0);
  });
  return matches[0];
}

/**
 * Apple `verifyReceipt` expects base64 **app receipt** bytes, not StoreKit 2
 * `purchaseToken` (JWS) — sending JWS causes status **21002** (malformed receipt-data).
 */
async function receiptDataForLegacyAppleVerify(latestPurchase) {
  if (Platform.OS !== 'ios') {
    return (
      latestPurchase?.transactionReceipt ||
      latestPurchase?.purchaseToken ||
      undefined
    );
  }
  try {
    const receipt = await getReceiptIOS();
    const s = receipt != null ? String(receipt).trim() : '';
    if (s.length > 80) {
      iapDebug('receipt for verify: using getReceiptIOS (app receipt)', {
        length: s.length,
      });
      return s;
    }
    iapDebug('receipt for verify: getReceiptIOS too short or empty', {
      length: s.length,
    });
  } catch (e) {
    iapDebug('receipt for verify: getReceiptIOS failed', summarizeError(e));
  }
  iapDebug(
    'receipt for verify: no usable receipt — do not send purchaseToken (JWS)',
    {hasPurchaseToken: Boolean(latestPurchase?.purchaseToken)},
  );
  return undefined;
}

/**
 * react-native-iap v14 / StoreKit 2: `requestPurchase` often resolves with no
 * return value; the purchase is delivered on `purchaseUpdatedListener` instead.
 */
function requestSubscriptionAndGetPurchase(sku) {
  const flowId = `flow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  iapDebug('purchaseFlow start', {flowId, sku});

  return new Promise((resolve, reject) => {
    let settled = false;
    let recoveryInFlight = false;
    let timer;
    let pollTimer = null;
    let pollKickTimer = null;

    const stopPoll = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (pollKickTimer) {
        clearTimeout(pollKickTimer);
        pollKickTimer = null;
      }
    };

    const cleanUp = (purchaseSub, errorSub, reason) => {
      iapDebug('purchaseFlow cleanup', {flowId, sku, reason});
      stopPoll();
      if (timer) {
        clearTimeout(timer);
      }
      try {
        purchaseSub.remove();
      } catch (e) {
        iapDebug('purchaseFlow cleanup purchaseSub.remove error', summarizeError(e));
      }
      try {
        errorSub.remove();
      } catch (e) {
        iapDebug('purchaseFlow cleanup errorSub.remove error', summarizeError(e));
      }
    };

    const tryRecoverPurchaseFromStore = async (opts = {}) => {
      if (settled || Platform.OS !== 'ios') {
        return false;
      }
      if (recoveryInFlight) {
        iapDebug('purchaseFlow recovery skipped (in flight)', {flowId});
        return false;
      }
      recoveryInFlight = true;
      try {
        const candidates = await collectIosPurchasesForSku(sku, flowId, opts);
        const best = pickBestPurchaseForSku(candidates, sku);
        iapDebug('purchaseFlow recovery pick', {
          flowId,
          sku,
          candidateCount: candidates.length,
          best: best ? summarizePurchase(best) : null,
        });
        if (settled) {
          return false;
        }
        if (
          best &&
          (best.purchaseToken || best.transactionReceipt || best.id)
        ) {
          settled = true;
          cleanUp(purchaseSub, errorSub, 'recovery_collectIosPurchases');
          resolve(best);
          return true;
        }
      } catch (e) {
        iapDebug('purchaseFlow recovery error', {
          flowId,
          error: summarizeError(e),
        });
      } finally {
        recoveryInFlight = false;
      }
      return false;
    };

    const startPollingRecovery = () => {
      if (pollTimer || settled || Platform.OS !== 'ios') {
        return;
      }
      iapDebug('purchaseFlow starting poll (promise empty; listener may not fire)', {
        flowId,
        intervalMs: 4000,
      });
      pollKickTimer = setTimeout(() => {
        void tryRecoverPurchaseFromStore({skipSync: true, lightweight: true});
      }, 400);
      pollTimer = setInterval(() => {
        void tryRecoverPurchaseFromStore({skipSync: true, lightweight: true});
      }, 4000);
    };

    const purchaseSub = purchaseUpdatedListener((purchase) => {
      const pSku = storeProductSku(purchase);
      const matches = purchaseMatchesExpectedSku(purchase, sku);
      iapDebug('purchaseUpdatedListener event', {
        flowId,
        sku,
        settled,
        purchaseSku: pSku,
        currentPlanId: purchase?.currentPlanId,
        ids: purchase?.ids,
        matchesExpected: matches,
        summary: summarizePurchase(purchase),
      });
      if (settled) {
        iapDebug('purchaseUpdatedListener ignored (already settled)', {flowId});
        return;
      }
      if (matches) {
        settled = true;
        cleanUp(purchaseSub, errorSub, 'listener_match');
        resolve(purchase);
      } else if (purchaseRenewalPrefersSku(purchase, sku)) {
        settled = true;
        cleanUp(purchaseSub, errorSub, 'listener_renewal_pref');
        resolve(purchase);
      } else {
        iapDebug('purchaseUpdatedListener ignored (different sku)', {
          flowId,
          expected: sku,
          got: pSku,
        });
      }
    });

    const runRecoveryThenReject = (reason, fallbackMessage) => {
      void (async () => {
        for (let a = 0; a < 8 && !settled; a++) {
          iapDebug('purchaseFlow error-path recovery attempt', {flowId, sku, a});
          const recovered = await tryRecoverPurchaseFromStore({
            skipSync: a > 0,
            lightweight: a > 0,
          });
          if (recovered || settled) {
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (settled) {
          return;
        }
        settled = true;
        cleanUp(purchaseSub, errorSub, reason);
        reject(new Error(fallbackMessage));
      })();
    };

    const errorSub = purchaseErrorListener((error) => {
      iapDebug('purchaseErrorListener event', {
        flowId,
        sku,
        settled,
        error: summarizeError(error),
        rawCode: error?.code,
        rawProductId: error?.productId,
      });
      if (settled) {
        iapDebug('purchaseErrorListener ignored (already settled)', {flowId});
        return;
      }
      if (error?.productId && error.productId !== sku) {
        iapDebug('purchaseErrorListener ignored (different productId)', {
          flowId,
          expected: sku,
          got: error.productId,
        });
        return;
      }
      if (Platform.OS === 'ios' && isRecoverableStoreOwnershipError(error)) {
        iapDebug(
          'purchaseErrorListener already-owned / owned — recovering purchase from StoreKit',
          {flowId, sku},
        );
        runRecoveryThenReject(
          'already_owned_no_recovery',
          error?.message ||
            'Could not load your subscription from the App Store. Tap Restore Purchases.',
        );
        return;
      }
      if (error?.code === DUPLICATE_PURCHASE_CODE && Platform.OS === 'ios') {
        iapDebug(
          'purchaseErrorListener duplicate-purchase; recovery',
          {flowId, sku},
        );
        runRecoveryThenReject(
          'duplicate_no_recovery',
          error?.message ||
            'Duplicate purchase signal — try Restore Purchases.',
        );
        return;
      }
      settled = true;
      cleanUp(purchaseSub, errorSub, 'store_error');
      reject(
        new Error(
          error?.message ||
            String(error?.code || '') ||
            'Purchase was cancelled or failed.',
        ),
      );
    });

    timer = setTimeout(() => {
      void (async () => {
        iapDebug('purchaseFlow timeout fired', {flowId, sku, settled});
        if (settled) {
          return;
        }
        if (Platform.OS === 'ios') {
          for (let attempt = 0; attempt < 10 && !settled; attempt++) {
            iapDebug('purchaseFlow timeout recovery attempt', {
              flowId,
              attempt,
            });
            const recovered = await tryRecoverPurchaseFromStore({
              skipSync: attempt > 0,
              lightweight: attempt > 0,
            });
            if (recovered || settled) {
              return;
            }
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
        if (settled) {
          return;
        }
        settled = true;
        cleanUp(purchaseSub, errorSub, 'timeout_120s');
        reject(
          new Error(
            'Timed out waiting for purchase confirmation. If you were charged, tap Restore Purchases.',
          ),
        );
      })();
    }, 120000);
    iapDebug('purchaseFlow timeout scheduled', {flowId, ms: 120000});

    iapDebug('requestPurchase invoking', {
      flowId,
      type: 'subs',
      appleSku: sku,
    });
    requestPurchase({
      type: 'subs',
      request: {
        apple: {sku},
      },
    })
      .then((purchase) => {
        const latest = Array.isArray(purchase)
          ? purchase[purchase.length - 1]
          : purchase;
        iapDebug('requestPurchase promise settled', {
          flowId,
          sku,
          settled,
          isArray: Array.isArray(purchase),
          arrayLength: Array.isArray(purchase) ? purchase.length : undefined,
          hasLatest: Boolean(latest),
          latestSummary: latest ? summarizePurchase(latest) : null,
        });
        if (settled) {
          iapDebug('requestPurchase then branch skipped (listener won)', {
            flowId,
          });
          return;
        }
        if (latest) {
          settled = true;
          cleanUp(purchaseSub, errorSub, 'promise_return');
          resolve(latest);
        } else {
          iapDebug('requestPurchase resolved empty; waiting on listener + poll', {
            flowId,
            sku,
          });
          void tryRecoverPurchaseFromStore();
          startPollingRecovery();
        }
      })
      .catch((err) => {
        iapDebug('requestPurchase promise rejected', {
          flowId,
          sku,
          settled,
          error: summarizeError(err),
        });
        if (settled) {
          iapDebug('requestPurchase catch ignored (already settled)', {flowId});
          return;
        }
        settled = true;
        cleanUp(purchaseSub, errorSub, 'promise_reject');
        reject(err);
      });
  });
}

function clonePlans() {
  return SUBSCRIPTION_PLANS_DEFINITION.map((p) => ({
    ...p,
    features: [...p.features],
  }));
}

function formatSubscriptionExpiry(iso) {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Select the plan row that matches merged tier (StoreKit + backend) or product id fallback. */
function findPlanIndexForCurrentSubscription(plansList, user, mergedTierHint) {
  if (!Array.isArray(plansList) || !plansList.length) {
    return 0;
  }
  const tier =
    mergedTierHint && mergedTierHint !== TIERS.CREATOR_ACCESS
      ? mergedTierHint
      : effectiveTier(user);
  let idx = plansList.findIndex((p) => p.id === tier);
  if (idx >= 0) {
    return idx;
  }
  const pid = String(user?.subscriptionProductId || '')
    .trim()
    .toLowerCase();
  if (pid) {
    idx = plansList.findIndex(
      (p) =>
        p.productId && String(p.productId).trim().toLowerCase() === pid,
    );
    if (idx >= 0) {
      return idx;
    }
  }
  return 0;
}

const Subscription = props => {
  const route = useRoute();
  const fromOnboarding = route.params?.fromOnboarding === true;
  const dispatch = useDispatch();
  const userData = useSelector((s) => s.user?.userData);
  const [plans, setPlans] = useState(clonePlans);

  useEffect(() => {
    iapDebug('Subscription screen mounted', {
      fromOnboarding,
      routeName: route.name,
      routeParams: route.params ?? null,
    });
  }, [fromOnboarding, route.name, route.params]);

  const finishOnboarding = () => dispatch(setFirstTime(false));
  const leaveScreen = () => {
    if (fromOnboarding) {
      finishOnboarding();
    } else {
      props.navigation.goBack();
    }
  };
  const [active, setActive] = useState(0);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  /** `purchase` = StoreKit sheet / listeners; `verify` = receipt + server (different overlay copy). */
  const [purchaseUiPhase, setPurchaseUiPhase] = useState('purchase');
  const [storeReady, setStoreReady] = useState(false);
  /** Highest tier from StoreKit active purchases (fills gaps when API still shows free). */
  const [storeDetectedTier, setStoreDetectedTier] = useState(null);

  const mergedPaidTier = useMemo(
    () => mergedSubscriptionTier(userData, storeDetectedTier),
    [
      userData?.subscriptionTier,
      userData?.subscriptionExpiresAt,
      userData?.subscriptionProductId,
      storeDetectedTier,
    ],
  );

  useEffect(() => {
    const idx = findPlanIndexForCurrentSubscription(
      plans,
      userData,
      mergedPaidTier,
    );
    setActive(idx);
  }, [
    plans,
    userData?.subscriptionTier,
    userData?.subscriptionExpiresAt,
    userData?.subscriptionProductId,
    mergedPaidTier,
  ]);

  const currentPlanTitle = useMemo(() => {
    if (!mergedPaidTier || mergedPaidTier === TIERS.CREATOR_ACCESS) {
      return null;
    }
    const def = SUBSCRIPTION_PLANS_DEFINITION.find(
      (p) => p.id === mergedPaidTier,
    );
    return def?.title ?? null;
  }, [mergedPaidTier]);

  const subscriptionExpiryLabel = useMemo(
    () => formatSubscriptionExpiry(userData?.subscriptionExpiresAt),
    [userData?.subscriptionExpiresAt],
  );

  const selectedPlan = plans[active] ?? plans[0];

  const alreadyOwnsSelection = useMemo(
    () =>
      Boolean(
        selectedPlan?.id &&
          selectedPlan.id !== 'creator_access' &&
          mergedPaidTier === selectedPlan.id,
      ),
    [selectedPlan?.id, mergedPaidTier],
  );

  const continueLabel = useMemo(() => {
    if (alreadyOwnsSelection) {
      return fromOnboarding ? 'Continue to app' : 'Done';
    }
    const p = selectedPlan?.price ?? '0';
    if (String(p).toLowerCase() === 'free') return 'Continue — Free';
    return `Continue — $${p}/mo`;
  }, [alreadyOwnsSelection, selectedPlan, fromOnboarding]);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  useEffect(() => {
    let cancelled = false;
    iapDebug('paywall API effect mount', {
      endpoint: endPoints.SubscriptionPaywall,
    });
    (async () => {
      try {
        iapDebug('paywall API request start', {});
        const res = await apiRequest.get(endPoints.SubscriptionPaywall);
        if (cancelled) {
          iapDebug('paywall API response ignored (unmounted)', {});
          return;
        }
        const payload = res.data?.data ?? res.data;
        const visible = payload?.visiblePaidTiers?.map((t) => t.tier) ?? [];
        iapDebug('paywall API response', {
          status: res.status,
          visiblePaidTiers: visible,
          payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
        });
        if (!visible.length) {
          iapDebug('paywall API no visiblePaidTiers; keeping default plans', {});
        }
        if (!cancelled && visible.length) {
          const next = SUBSCRIPTION_PLANS_DEFINITION.filter(
            (p) => p.id === 'creator_access' || visible.includes(p.id),
          );
          if (next.length) {
            iapDebug('paywall API applying filtered plans', {
              visiblePaidTiers: visible,
              planIds: next.map((p) => p.id),
            });
            setPlans(
              next.map((p) => ({...p, features: [...p.features]})),
            );
          } else {
            iapDebug('paywall API visible tiers produced empty next[]', {
              visible,
            });
          }
        }
      } catch (e) {
        iapDebug('paywall API request failed; keeping default plans', summarizeError(e));
      }
    })();
    return () => {
      cancelled = true;
      iapDebug('paywall API effect cleanup', {});
    };
  }, []);

  useEffect(() => {
    iapDebug('IAP store effect mount', {
      platform: Platform.OS,
    });
    if (Platform.OS !== 'ios') {
      iapDebug('skip StoreKit (not iOS); configured SKUs', {
        skus: SUBSCRIPTION_PLANS_DEFINITION.filter((p) => p.productId).map(
          (p) => p.productId,
        ),
      });
      return;
    }
    let mounted = true;
    (async () => {
      const toastDetail = (e) => {
        const m = String(e?.message || e?.code || e || 'Unknown error').trim();
        return m.length > 140 ? `${m.slice(0, 137)}…` : m;
      };
      try {
        iapDebug('initConnection start', {});
        await initConnection();
        iapDebug('initConnection OK', {});
      } catch (err) {
        console.error(
          `${IAP_LOG} initConnection failed`,
          summarizeError(err),
          err,
        );
        if (mounted) {
          Toast.show({
            type: 'error',
            text1: 'App Store connection',
            text2: toastDetail(err),
          });
        }
        return;
      }

      const paidSkus = SUBSCRIPTION_PLANS_DEFINITION.filter(
        (p) => p.id !== 'creator_access' && p.productId,
      ).map((p) => p.productId);
      iapDebug('fetchProducts (subs) request', {skus: paidSkus, type: 'subs'});

      try {
        if (paidSkus.length) {
          const products = await fetchProducts({
            skus: paidSkus,
            type: 'subs',
          });
          const list = normalizeSubscriptionList(products);
          iapDebug('fetchProducts raw shape', {
            typeof: typeof products,
            isArray: Array.isArray(products),
            arrayLength: Array.isArray(products) ? products.length : undefined,
          });
          iapDebug('fetchProducts normalized', {
            count: list.length,
            summary: list.map(summarizeStoreSubscription),
          });
          const returnedIds = new Set(
            list.map((x) => storeProductSku(x)).filter(Boolean),
          );
          const missingSkus = paidSkus.filter((sku) => !returnedIds.has(sku));
          if (missingSkus.length) {
            console.warn(
              `${IAP_LOG} App Store returned no product for SKUs`,
              missingSkus,
            );
            iapDebug('fetchProducts missing SKUs detail', {
              missingSkus,
              returnedIds: [...returnedIds],
            });
            if (mounted && list.length > 0) {
              Toast.show({
                type: 'info',
                text1: 'Subscriptions',
                text2: `Some SKUs missing from store: ${missingSkus.join(', ')}. Fix IDs in App Store Connect or subscriptionProducts.js.`,
              });
            }
          }
          if (mounted && list.length) {
            iapDebug('merging store prices into local plans', {
              matchedSkus: list.map((x) => storeProductSku(x)).filter(Boolean),
            });
            setPlans((prev) =>
              prev.map((p) => {
                const sku = p.productId;
                const m = list.find((x) => storeProductSku(x) === sku);
                if (!m) {
                  return p;
                }
                const rawPrice =
                  m.price ||
                  m.displayPrice ||
                  (typeof m.priceAmountMicros === 'number'
                    ? String(m.priceAmountMicros / 1000000)
                    : p.price);
                const nextPrice =
                  typeof rawPrice === 'string'
                    ? rawPrice.replace(/[^0-9.]/g, '') || p.price
                    : p.price;
                iapDebug('plan price merge', {
                  planId: p.id,
                  sku,
                  prevPrice: p.price,
                  nextPrice,
                  storeSummary: summarizeStoreSubscription(m),
                });
                return {
                  ...p,
                  price: nextPrice,
                };
              }),
            );
          } else if (mounted && paidSkus.length) {
            console.warn(
              `${IAP_LOG} empty product list — check App Store Connect, sandbox Apple ID, and Paid Apps Agreement`,
            );
            Toast.show({
              type: 'info',
              text1: 'Subscriptions',
              text2:
                'Store returned no products for your SKUs. Confirm subscriptions are Cleared for Sale, linked to this bundle ID, and test on device or with a .storekit file.',
            });
          }
        }
      } catch (err) {
        iapDebug('fetchProducts failed', summarizeError(err));
        console.error(
          `${IAP_LOG} fetchProducts failed`,
          summarizeError(err),
          err,
        );
        if (mounted) {
          Toast.show({
            type: 'error',
            text1: 'Could not load products',
            text2: toastDetail(err),
          });
        }
      }

      let detectedTier = null;
      try {
        const rawPurchases = await getAvailablePurchases({
          onlyIncludeActiveItemsIOS: true,
          alsoPublishToEventListenerIOS: false,
        });
        const purchaseList = Array.isArray(rawPurchases)
          ? rawPurchases
          : rawPurchases
            ? [rawPurchases]
            : [];
        detectedTier = bestTierFromStorePurchases(purchaseList);
        iapDebug('StoreKit merged tier hint', {
          activePurchaseCount: purchaseList.length,
          detectedTier,
        });
      } catch (e) {
        iapDebug('store tier detection failed', summarizeError(e));
      }

      if (mounted) {
        setStoreDetectedTier(detectedTier);
        setStoreReady(true);
        iapDebug('storeReady=true (free plan & restore still available)', {});
      } else {
        iapDebug('store effect finished after unmount; not setting storeReady', {});
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const verifyAndActivate = async ({receiptData, productId}) => {
    const receiptLen = receiptData ? String(receiptData).length : 0;
    const receiptPrefix =
      receiptData && typeof receiptData === 'string'
        ? receiptData.slice(0, 24)
        : typeof receiptData;
    iapDebug('verifyAndActivate start', {
      productId,
      receiptDataLength: receiptLen,
      receiptPrefixPreview: receiptPrefix,
      hasTransactionReceipt: Boolean(receiptData),
    });
    let verifyRes;
    try {
      verifyRes = await dispatch(
        userActions.VerifyIosSubscription({
          receiptData,
          productId,
        }),
      ).unwrap();
    } catch (e) {
      iapDebug('verifyAndActivate dispatch/unwrap failed', summarizeError(e));
      throw e;
    }
    iapDebug('verifyAndActivate dispatch unwrap result', {
      success: verifyRes?.success,
      message: verifyRes?.message,
      keys:
        verifyRes && typeof verifyRes === 'object'
          ? Object.keys(verifyRes)
          : [],
    });
    Toast.show({
      type: verifyRes?.success ? 'success' : 'error',
      text1: verifyRes?.success ? 'Subscribed' : 'Subscription',
      text2:
        verifyRes?.message ||
        (verifyRes?.success
          ? 'Your subscription is active now.'
          : 'Could not verify subscription.'),
    });
    return verifyRes;
  };

  const onContinue = async () => {
    iapDebug('onContinue pressed', {
      hasSelectedPlan: Boolean(selectedPlan),
      planId: selectedPlan?.id,
      productId: selectedPlan?.productId,
      storeReady,
      purchaseLoading,
      platform: Platform.OS,
      fromOnboarding,
    });
    if (!selectedPlan) {
      iapDebug('onContinue abort: no selectedPlan', {});
      return;
    }
    if (selectedPlan.id === 'creator_access') {
      iapDebug('onContinue: free plan path → leaveScreen', {});
      Toast.show({
        type: 'success',
        text1: 'Free Plan',
        text2: 'You are already on Creator Access.',
      });
      leaveScreen();
      return;
    }

    if (alreadyOwnsSelection) {
      iapDebug(
        'onContinue: StoreKit/backend tier matches selection — skip purchase',
        {planId: selectedPlan.id, mergedPaidTier},
      );
      try {
        setPurchaseUiPhase('verify');
        setPurchaseLoading(true);
        if (Platform.OS === 'ios' && selectedPlan.productId) {
          const receiptData = await receiptDataForLegacyAppleVerify(null);
          if (receiptData) {
            await verifyAndActivate({
              receiptData,
              productId: selectedPlan.productId,
            });
          }
        }
      } catch (e) {
        iapDebug('onContinue already-owned verify failed', summarizeError(e));
      } finally {
        setPurchaseLoading(false);
        setPurchaseUiPhase('purchase');
      }
      leaveScreen();
      return;
    }

    if (Platform.OS !== 'ios') {
      iapDebug('onContinue: non-iOS path', {fromOnboarding});
      Toast.show({
        type: 'info',
        text1: 'Coming soon',
        text2: 'In-app subscriptions are currently enabled on iOS.',
      });
      if (fromOnboarding) {
        finishOnboarding();
      }
      return;
    }

    if (!selectedPlan.productId) {
      iapDebug('onContinue abort: missing productId on plan', {
        planId: selectedPlan.id,
      });
      Toast.show({
        type: 'error',
        text1: 'Missing product',
        text2: 'Selected plan product is not configured.',
      });
      return;
    }
    if (!storeReady) {
      iapDebug('onContinue abort: store not ready', {});
      Toast.show({
        type: 'info',
        text1: 'Store',
        text2: 'App Store products are still loading. Try again in a moment.',
      });
      return;
    }

    try {
      setPurchaseUiPhase('purchase');
      setPurchaseLoading(true);
      iapDebug('onContinue starting purchase flow', {
        sku: selectedPlan.productId,
        planTitle: selectedPlan.title,
      });
      const latest = await requestSubscriptionAndGetPurchase(
        selectedPlan.productId,
      );
      iapDebug('onContinue purchase resolved', summarizePurchase(latest));

      setPurchaseUiPhase('verify');
      const receiptData = await receiptDataForLegacyAppleVerify(latest);
      iapDebug('onContinue receipt for Apple verifyReceipt', {
        length: receiptData ? String(receiptData).length : 0,
        looksLikeJws:
          typeof receiptData === 'string' && receiptData.split('.').length === 3,
      });
      if (!receiptData) {
        throw new Error(
          'Could not read App Store receipt for verification. Try Restore Purchases.',
        );
      }
      const verifyProductId = resolveVerifyProductId(
        latest,
        selectedPlan.productId,
      );
      const verifyRes = await verifyAndActivate({
        receiptData,
        productId: verifyProductId,
      });

      iapDebug('finishTransaction start', summarizePurchase(latest));
      await finishTransaction({purchase: latest, isConsumable: false});
      iapDebug('finishTransaction OK', {productId: verifyProductId});

      if (verifyRes?.success) {
        iapDebug('onContinue success → leaveScreen', {fromOnboarding});
        leaveScreen();
      } else {
        iapDebug('onContinue verify not success; staying on screen', {
          message: verifyRes?.message,
        });
      }
    } catch (error) {
      console.warn(
        `${IAP_LOG} purchase error`,
        summarizeError(error),
      );
      const msg =
        error?.message ||
        'Purchase failed or was cancelled. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Purchase',
        text2: msg,
      });
    } finally {
      iapDebug('onContinue finally purchaseLoading=false', {});
      setPurchaseLoading(false);
      setPurchaseUiPhase('purchase');
    }
  };

  const onRestorePurchases = async () => {
    iapDebug('onRestorePurchases pressed', {platform: Platform.OS});
    if (Platform.OS !== 'ios') {
      iapDebug('onRestorePurchases skip (not iOS)', {});
      return;
    }
    try {
      setPurchaseUiPhase('verify');
      setPurchaseLoading(true);
      iapDebug('restore getAvailablePurchases start', {});
      const purchases = await getAvailablePurchases();
      const all = Array.isArray(purchases) ? purchases : purchases ? [purchases] : [];
      iapDebug('restore getAvailablePurchases done', {
        rawType: typeof purchases,
        count: all.length,
        summary: all.map(summarizePurchase),
      });
      const paidSkus = new Set(
        SUBSCRIPTION_PLANS_DEFINITION.filter((p) => p.productId).map(
          (p) => p.productId,
        ),
      );
      const candidate = all
        .filter((p) => paidSkus.has(storeProductSku(p)))
        .sort((a, b) => {
          const ta = Number(a.transactionDate || 0);
          const tb = Number(b.transactionDate || 0);
          return tb - ta;
        })[0];

      if (!candidate) {
        iapDebug('restore paidSkus filter', {
          paidSkus: [...paidSkus],
          allSkus: all.map((p) => storeProductSku(p)),
        });
        console.warn(`${IAP_LOG} restore no matching subscription in purchase history`);
        Toast.show({
          type: 'info',
          text1: 'Restore',
          text2: 'No previous subscription purchase found.',
        });
        return;
      }

      iapDebug('restore using candidate', summarizePurchase(candidate));
      const restoreReceipt = await receiptDataForLegacyAppleVerify(candidate);
      if (!restoreReceipt) {
        throw new Error(
          'Could not read App Store receipt for verification. Try again or reinstall the app.',
        );
      }
      const verifyRes = await verifyAndActivate({
        receiptData: restoreReceipt,
        productId: storeProductSku(candidate),
      });
      if (verifyRes?.success) {
        iapDebug('restore verify success → leaveScreen', {});
        leaveScreen();
      } else {
        iapDebug('restore verify not success', {
          message: verifyRes?.message,
        });
      }
    } catch (error) {
      console.error(
        `${IAP_LOG} restore error`,
        summarizeError(error),
        error,
      );
      Toast.show({
        type: 'error',
        text1: 'Restore',
        text2: error?.message || 'Could not restore purchases.',
      });
    } finally {
      iapDebug('onRestorePurchases finally purchaseLoading=false', {});
      setPurchaseLoading(false);
      setPurchaseUiPhase('purchase');
    }
  };

  return (
    <AppContainer>
      <Modal
        animationType="fade"
        transparent
        visible={purchaseLoading}
        onRequestClose={() => {}}>
        <View style={styles.purchaseLoadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Typography
            textType="semiBold"
            size={16}
            color="#fff"
            align="center"
            style={{marginTop: 16}}>
            {purchaseUiPhase === 'verify'
              ? 'Activating subscription…'
              : 'Completing purchase…'}
          </Typography>
          <Typography
            textType="regular"
            size={13}
            color="rgba(255,255,255,0.85)"
            align="center"
            style={{marginTop: 8, paddingHorizontal: 24}}>
            {purchaseUiPhase === 'verify'
              ? 'Confirming with Comesh.'
              : 'Confirming with the App Store. Do not close the app.'}
          </Typography>
        </View>
      </Modal>
      <SimpleHeader
        {...props}
        title={'Subscription'}
        onHeaderBack={fromOnboarding ? finishOnboarding : undefined}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Typography children={'Select a plan'} textType="bold" size={18} />
        <Typography
          children={SUBSCRIPTION_PAYWALL_FOOTNOTE}
          textType="regular"
          size={12}
          color={SUBTITLE_MUTED}
        />

        {currentPlanTitle ? (
          <View style={styles.currentPlanBanner}>
            <Typography
              textType="semiBold"
              size={13}
              color={CHECK_BLUE}
              children={`Your current plan: ${currentPlanTitle}`}
            />
            {subscriptionExpiryLabel ? (
              <Typography
                textType="regular"
                size={12}
                color={SUBTITLE_MUTED}
                style={{marginTop: 4}}
                children={`Renews or expires ${subscriptionExpiryLabel}`}
              />
            ) : null}
          </View>
        ) : null}

        {plans.map((plan, index) => {
          const isActive = index === active;
          const isUsersCurrentPlan =
            plan.id !== 'creator_access' && mergedPaidTier === plan.id;
          return (
            <View key={plan.id}>
              {plan.badge || isUsersCurrentPlan ? (
                <View style={styles.badgeRow}>
                  {isUsersCurrentPlan ? (
                    <View style={[styles.badge, styles.yourPlanBadge]}>
                      <Typography
                        size={11}
                        color="#fff"
                        textType="semiBold"
                        children="Your plan"
                      />
                    </View>
                  ) : null}
                  {plan.badge ? (
                    <View style={styles.badge}>
                      <Typography
                        size={11}
                        color="#fff"
                        textType="semiBold"
                        children={plan.badge}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={purchaseLoading}
                onPress={() => {
                  if (purchaseLoading) {
                    return;
                  }
                  iapDebug('plan card selected', {
                    index,
                    planId: plan.id,
                    productId: plan.productId,
                  });
                  setActive(index);
                }}
                style={[
                  styles.cardTouchable,
                  !isActive && styles.cardTouchableInactive,
                ]}>
                {isActive ? (
                  <LinearGradient
                    pointerEvents="none"
                    colors={SUBSCRIPTION_GRADIENT}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <View style={styles.cardInner}>
                  <View style={styles.cardContent}>
                    <Typography
                      children={plan.title}
                      size={16}
                      textType="bold"
                      color={isActive ? '#fff' : colors.black}
                    />
                    <Typography
                      children={plan.body}
                      size={13}
                      textType="regular"
                      color={
                        isActive ? 'rgba(255,255,255,0.92)' : SUBTITLE_MUTED
                      }
                    />
                  </View>
                  <View style={styles.priceRow}>
                    {String(plan.price).toLowerCase() === 'free' ? (
                      <Typography
                        children={plan.price}
                        size={22}
                        textType="bold"
                        color={isActive ? '#fff' : PRICE_ACCENT}
                      />
                    ) : (
                      <>
                        <Typography
                          children={'$'}
                          textType="bold"
                          size={14}
                          color={isActive ? '#fff' : PRICE_ACCENT}
                        />
                        <View style={styles.priceInner}>
                          <Typography
                            children={plan.price}
                            size={26}
                            textType="bold"
                            color={isActive ? '#fff' : PRICE_ACCENT}
                          />
                          <Typography
                            children={`/${plan.unit}`}
                            size={14}
                            textType="semiBold"
                            color={
                              isActive
                                ? 'rgba(255,255,255,0.95)'
                                : colors.black
                            }
                          />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.includeCard}>
          <View style={styles.includeLabel}>
            <Typography
              size={12}
              textType="semiBold"
              children={`Included with ${selectedPlan?.title ?? 'plan'}`}
              color={CHECK_BLUE}
            />
          </View>
          {(selectedPlan?.features ?? []).map((line, idx) => (
            <View
              key={`${selectedPlan.id}-f-${idx}`}
              style={styles.featureRow}>
              <AdIcon name={'check'} color={CHECK_BLUE} size={18} />
              <Typography children={line} textType="semiBold" size={14} />
            </View>
          ))}
        </View>

        <PrimaryButton
          disabled={
            purchaseLoading ||
            (!storeReady &&
              selectedPlan?.id !== 'creator_access' &&
              !alreadyOwnsSelection)
          }
          text={
            purchaseLoading
              ? 'Processing…'
              : !storeReady &&
                  selectedPlan?.id !== 'creator_access' &&
                  !alreadyOwnsSelection
                ? 'Preparing Store…'
                : continueLabel
          }
          onPress={onContinue}
        />
        {Platform.OS === 'ios' ? (
          <TouchableOpacity
            disabled={purchaseLoading}
            style={styles.restoreBtn}
            onPress={onRestorePurchases}>
            <Typography
              size={13}
              textType="semiBold"
              color={purchaseLoading ? '#999' : CHECK_BLUE}
              children="Restore Purchases"
            />
          </TouchableOpacity>
        ) : null}
        {fromOnboarding ? (
          <TouchableOpacity
            style={styles.skipOnboarding}
            onPress={finishOnboarding}
            activeOpacity={0.85}>
            <Typography
              size={14}
              textType="semiBold"
              color={SUBTITLE_MUTED}
              children="Skip for now — go to app"
            />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </AppContainer>
  );
};

export default Subscription;

const styles = StyleSheet.create({
  purchaseLoadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 4,
    marginBottom: 6,
  },
  yourPlanBadge: {
    backgroundColor: '#0d9488',
  },
  currentPlanBanner: {
    borderWidth: 1,
    borderColor: '#c8d4ff',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  cardTouchable: {
    borderRadius: 14,
    minHeight: 92,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  cardTouchableInactive: {
    backgroundColor: colors.white,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingRight: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'flex-end',
  },
  priceInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  badge: {
    backgroundColor: PRICE_ACCENT,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  includeCard: {
    borderWidth: 1,
    borderColor: '#b2b2b2',
    borderRadius: 20,
    marginTop: 16,
    paddingTop: 22,
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: colors.white,
  },
  includeLabel: {
    position: 'absolute',
    top: -11,
    backgroundColor: colors.white,
    borderColor: '#b2b2b2',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restoreBtn: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  skipOnboarding: {
    marginTop: 16,
    marginBottom: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
