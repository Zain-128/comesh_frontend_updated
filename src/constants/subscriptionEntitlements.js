/**
 * Mirrors backend `TIER_LIMITS` (comesh-backend-/src/entitlements/subscription-tier.ts).
 * Used for UI hints; server enforces all limits.
 */

export const TIERS = {
  CREATOR_ACCESS: 'creator_access',
  COLLAB_PRO: 'collab_pro',
  CREATOR_PASSPORT: 'creator_passport',
  CREATOR_ELITE: 'creator_elite',
};

/** Mirrors `TIER_LIMITS` in `comesh-backend-/src/users/subscription-tier.ts`. */
const LIMITS = {
  [TIERS.CREATOR_ACCESS]: {
    maxDailySwipes: 20,
    maxProfileVideos: 2,
    advancedFilters: false,
    seeWhoLiked: false,
    directMessagingWithoutMatch: false,
    maxLocalMatchMiles: 50,
  },
  [TIERS.COLLAB_PRO]: {
    maxDailySwipes: null,
    maxProfileVideos: 10,
    advancedFilters: true,
    seeWhoLiked: true,
    directMessagingWithoutMatch: false,
    maxLocalMatchMiles: null,
  },
  [TIERS.CREATOR_PASSPORT]: {
    maxDailySwipes: null,
    maxProfileVideos: 10,
    advancedFilters: true,
    seeWhoLiked: true,
    directMessagingWithoutMatch: false,
    maxLocalMatchMiles: null,
  },
  [TIERS.CREATOR_ELITE]: {
    maxDailySwipes: null,
    maxProfileVideos: 10,
    advancedFilters: true,
    seeWhoLiked: true,
    directMessagingWithoutMatch: true,
    maxLocalMatchMiles: null,
  },
};

export function effectiveTier(user) {
  const raw = user?.subscriptionTier || TIERS.CREATOR_ACCESS;
  const tier = LIMITS[raw] ? raw : TIERS.CREATOR_ACCESS;
  const exp = user?.subscriptionExpiresAt;
  if (exp) {
    const t = new Date(exp).getTime();
    if (!Number.isNaN(t) && t < Date.now() && tier !== TIERS.CREATOR_ACCESS) {
      return TIERS.CREATOR_ACCESS;
    }
  }
  return tier;
}

export function tierLimits(user) {
  return LIMITS[effectiveTier(user)] || LIMITS[TIERS.CREATOR_ACCESS];
}

export function maxProfileVideos(user) {
  return tierLimits(user).maxProfileVideos;
}

export function canSeeWhoLiked(user) {
  return tierLimits(user).seeWhoLiked;
}

export function hasAdvancedFilters(user) {
  return tierLimits(user).advancedFilters;
}

/** Creator Elite — message before mutual connection (server also enforces on `createSingleChat`). */
export function canDirectMessageWithoutMatch(user) {
  return Boolean(tierLimits(user).directMessagingWithoutMatch);
}

/** `null` = nationwide / no hard cap in app; number = max discovery radius in miles for free tier. */
export function maxLocalMatchMiles(user) {
  const v = tierLimits(user).maxLocalMatchMiles;
  return v === undefined ? null : v;
}

export function swipeLimitReached(user) {
  const L = tierLimits(user);
  if (L.maxDailySwipes == null) return false;
  const day = new Date().toISOString().slice(0, 10);
  if (user?.swipeDayUtc !== day) return false;
  return (Number(user?.swipeCountDay) || 0) >= L.maxDailySwipes;
}

export function swipesRemainingLabel(user) {
  const L = tierLimits(user);
  if (L.maxDailySwipes == null) return 'Unlimited swipes';
  const day = new Date().toISOString().slice(0, 10);
  const used =
    user?.swipeDayUtc === day ? Number(user?.swipeCountDay) || 0 : 0;
  const left = Math.max(0, L.maxDailySwipes - used);
  return `${left} swipes left today`;
}
