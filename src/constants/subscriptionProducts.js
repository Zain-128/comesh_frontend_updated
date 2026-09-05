/**
 * App Store Connect auto-renewing subscription product IDs (1 month billing).
 * Apple bills and renews automatically per App Store terms; copy below is for UX only.
 *
 * `capabilities` on each plan is the single source of truth for app + backend limits
 * (see subscriptionEntitlements.js and comesh-backend-/src/users/subscription-tier.ts).
 */

export const IAP_SUBSCRIPTION_PRODUCT_IDS = {
  collab_pro: 'com.comesh.collab_pro',
  creator_passport: 'com.comesh.creater_passport',
  creator_elite: 'com.comesh.creater_ellite',
};

export const PLAN_IDS = {
  CREATOR_ACCESS: 'creator_access',
  COLLAB_PRO: 'collab_pro',
  CREATOR_PASSPORT: 'creator_passport',
  CREATOR_ELITE: 'creator_elite',
};

/** Machine-readable limits per plan (mirrors backend TIER_LIMITS). */
export const PLAN_CAPABILITIES = {
  [PLAN_IDS.CREATOR_ACCESS]: {
    maxDailySwipes: 20,
    maxProfileVideos: 2,
    advancedFilters: false,
    seeWhoLiked: false,
    /** Free: message only after mutual match (like back). */
    directMessagingWithoutMatch: false,
    maxLocalMatchMiles: 50,
    canChangeLocation: false,
    canUseSuperLike: false,
    multiCityMatch: false,
    travelModeBadge: false,
    hotspotAccess: false,
    priorityPlacement: false,
    dailyBoost: false,
    eliteBadge: false,
    topPlacement: false,
    priorityInbox: false,
    analytics: false,
    earlyFeatureAccess: false,
  },
  [PLAN_IDS.COLLAB_PRO]: {
    maxDailySwipes: null,
    maxProfileVideos: 10,
    advancedFilters: true,
    seeWhoLiked: true,
    directMessagingWithoutMatch: false,
    maxLocalMatchMiles: null,
    canChangeLocation: false,
    canUseSuperLike: true,
    multiCityMatch: false,
    travelModeBadge: false,
    hotspotAccess: false,
    priorityPlacement: false,
    dailyBoost: false,
    eliteBadge: false,
    topPlacement: false,
    priorityInbox: false,
    analytics: false,
    earlyFeatureAccess: false,
  },
  [PLAN_IDS.CREATOR_PASSPORT]: {
    maxDailySwipes: null,
    maxProfileVideos: 10,
    advancedFilters: true,
    seeWhoLiked: true,
    directMessagingWithoutMatch: false,
    maxLocalMatchMiles: null,
    canChangeLocation: true,
    canUseSuperLike: true,
    multiCityMatch: true,
    travelModeBadge: true,
    hotspotAccess: true,
    priorityPlacement: true,
    dailyBoost: false,
    eliteBadge: false,
    topPlacement: false,
    priorityInbox: false,
    analytics: false,
    earlyFeatureAccess: false,
  },
  [PLAN_IDS.CREATOR_ELITE]: {
    maxDailySwipes: null,
    maxProfileVideos: 10,
    advancedFilters: true,
    seeWhoLiked: true,
    directMessagingWithoutMatch: true,
    maxLocalMatchMiles: null,
    canChangeLocation: true,
    canUseSuperLike: true,
    multiCityMatch: true,
    travelModeBadge: true,
    hotspotAccess: true,
    priorityPlacement: true,
    dailyBoost: true,
    eliteBadge: true,
    topPlacement: true,
    priorityInbox: true,
    analytics: true,
    earlyFeatureAccess: true,
  },
};

/** Shown under the paywall title (not legal terms — link users to App Store subscription management). */
export const SUBSCRIPTION_PAYWALL_FOOTNOTE =
  'Paid plans are monthly subscriptions with automatic renewal until you cancel in App Store settings.';

/** Full plan rows for the Subscription screen (Creator Access is free — no IAP product). */
export const SUBSCRIPTION_PLANS_DEFINITION = [
  {
    id: PLAN_IDS.CREATOR_ACCESS,
    productId: null,
    title: 'Creator Access',
    body: 'Get in and start matching',
    price: 'Free',
    unit: '',
    capabilities: PLAN_CAPABILITIES[PLAN_IDS.CREATOR_ACCESS],
    features: [
      '20 swipes per day',
      'Local matches (50-mile radius)',
      'Upload up to 2 videos',
      'Basic profile (niche + bio)',
      'Messaging after matching only',
      'Limited daily matches',
    ],
  },
  {
    id: PLAN_IDS.COLLAB_PRO,
    productId: IAP_SUBSCRIPTION_PRODUCT_IDS.collab_pro,
    title: 'Collab Pro',
    subtitle: 'Most Popular',
    badge: 'Most Popular',
    body: 'Unlimited collabs, real growth',
    price: '9.99',
    unit: 'mo',
    capabilities: PLAN_CAPABILITIES[PLAN_IDS.COLLAB_PRO],
    features: [
      'Unlimited swipes and matches',
      'See who liked you',
      'Upload up to 10 videos',
      'Advanced filters',
      'Boosted visibility',
      'Nationwide matching',
    ],
  },
  {
    id: PLAN_IDS.CREATOR_PASSPORT,
    productId: IAP_SUBSCRIPTION_PRODUCT_IDS.creator_passport,
    title: 'Creator Passport',
    body: 'Your network, worldwide',
    price: '14.99',
    unit: 'mo',
    capabilities: PLAN_CAPABILITIES[PLAN_IDS.CREATOR_PASSPORT],
    features: [
      'Everything in Collab Pro',
      'Change location',
      'Match in multiple cities',
      'Travel Mode badge',
      'Hotspot access',
      'Priority placement',
    ],
  },
  {
    id: PLAN_IDS.CREATOR_ELITE,
    productId: IAP_SUBSCRIPTION_PRODUCT_IDS.creator_elite,
    title: 'Creator Elite',
    body: 'Be seen first. Get picked faster',
    price: '29.99',
    unit: 'mo',
    capabilities: PLAN_CAPABILITIES[PLAN_IDS.CREATOR_ELITE],
    features: [
      'Everything in Creator Passport',
      'Daily boost',
      'Elite badge',
      'Top placement',
      'Direct Connect messaging',
      'Priority inbox',
      'Analytics',
      'Early feature access',
    ],
  },
];

export function capabilitiesForPlanId(planId) {
  const key = planId && PLAN_CAPABILITIES[planId] ? planId : PLAN_IDS.CREATOR_ACCESS;
  return PLAN_CAPABILITIES[key];
}
