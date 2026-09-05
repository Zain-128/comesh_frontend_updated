/**
 * Plan limits from SUBSCRIPTION_PLANS_DEFINITION / PLAN_CAPABILITIES (subscriptionProducts.js).
 * Server enforces the same caps in comesh-backend-/src/users/subscription-tier.ts.
 */

import {
  PLAN_CAPABILITIES,
  PLAN_IDS,
  capabilitiesForPlanId,
} from './subscriptionProducts';

export const TIERS = {
  CREATOR_ACCESS: PLAN_IDS.CREATOR_ACCESS,
  COLLAB_PRO: PLAN_IDS.COLLAB_PRO,
  CREATOR_PASSPORT: PLAN_IDS.CREATOR_PASSPORT,
  CREATOR_ELITE: PLAN_IDS.CREATOR_ELITE,
};

const LIMITS = PLAN_CAPABILITIES;

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
  return capabilitiesForPlanId(effectiveTier(user));
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

export function canUseSuperLike(user) {
  return Boolean(tierLimits(user).canUseSuperLike);
}

export function canChangeLocation(user) {
  return Boolean(tierLimits(user).canChangeLocation);
}

export function hasAnalyticsAccess(user) {
  return Boolean(tierLimits(user).analytics);
}

/** Creator Elite — message without mutual match (server enforces on createSingleChat). */
export function canDirectMessageWithoutMatch(user) {
  return Boolean(tierLimits(user).directMessagingWithoutMatch);
}

/** Show message action on profile when mutual match or Elite Direct Connect. */
export function canOpenChatWithUser(user, otherUserId) {
  if (!otherUserId) return false;
  if (canDirectMessageWithoutMatch(user)) return true;
  const likedByMe = user?.likedByMe || [];
  const likedBySomeone = user?.likedBySomeone || [];
  const id = String(otherUserId);
  return (
    likedByMe.some((x) => String(x) === id) &&
    likedBySomeone.some((x) => String(x) === id)
  );
}

/** `null` = nationwide; number = max discovery radius in miles (Creator Access: 50). */
export function maxLocalMatchMiles(user) {
  const v = tierLimits(user).maxLocalMatchMiles;
  return v === undefined ? null : v;
}

/** Max value for location filter slider (miles). */
export function discoveryRadiusSliderMax(user) {
  const cap = maxLocalMatchMiles(user);
  return cap == null ? 100 : cap;
}

/**
 * Clamp dashboard/filter payload to the user's plan before API calls.
 */
export function sanitizeDiscoveryFilters(params, user) {
  if (!params || typeof params !== 'object') return params ?? {};
  const out = { ...params };
  const mileCap = maxLocalMatchMiles(user);

  if (mileCap != null) {
    if (out.maxDistance != null) {
      out.maxDistance = Math.min(Number(out.maxDistance) || mileCap, mileCap);
    }
    if (out.minDistance != null) {
      out.minDistance = Math.min(Number(out.minDistance) || 0, mileCap);
    }
  }

  if (!hasAdvancedFilters(user)) {
    delete out.minFollowers;
    delete out.maxFollowers;
  }

  return out;
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

export function upgradePlanHint(featureKey) {
  const hints = {
    seeWhoLiked: 'Collab Pro',
    advancedFilters: 'Collab Pro',
    superLike: 'Collab Pro',
    location: 'Creator Passport',
    directMessage: 'Creator Elite',
    videos: 'Collab Pro',
    swipes: 'Collab Pro',
  };
  return hints[featureKey] || 'a paid plan';
}
