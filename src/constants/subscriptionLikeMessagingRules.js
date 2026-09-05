/**
 * Like + messaging rules copy and checks — driven by PLAN_CAPABILITIES / user tier.
 */

import { SUBSCRIPTION_PLANS_DEFINITION } from './subscriptionProducts';
import {
  canDirectMessageWithoutMatch,
  canOpenChatWithUser,
  canSeeWhoLiked,
  canUseSuperLike,
  effectiveTier,
  swipeLimitReached,
  swipesRemainingLabel,
  tierLimits,
  upgradePlanHint,
} from './subscriptionEntitlements';
import { userIdInList } from '../utils/matchHelpers';

export const MATCH_STATUS = {
  NONE: 'none',
  YOU_LIKED: 'you_liked',
  THEY_LIKED: 'they_liked',
  MUTUAL: 'mutual',
};

export function getCurrentPlanTitle(user) {
  const tier = effectiveTier(user);
  const plan = SUBSCRIPTION_PLANS_DEFINITION.find((p) => p.id === tier);
  return plan?.title || 'Creator Access';
}

export function getMatchStatus(user, otherUserId) {
  if (!otherUserId) return MATCH_STATUS.NONE;
  const iLiked = userIdInList(user?.likedByMe, otherUserId);
  const theyLiked = userIdInList(user?.likedBySomeone, otherUserId);
  if (iLiked && theyLiked) return MATCH_STATUS.MUTUAL;
  if (iLiked) return MATCH_STATUS.YOU_LIKED;
  if (theyLiked) return MATCH_STATUS.THEY_LIKED;
  return MATCH_STATUS.NONE;
}

/** Short lines for profile / chat context. */
export function getProfileInteractionHints(user, otherUserId) {
  const status = getMatchStatus(user, otherUserId);
  const hints = [];
  const plan = getCurrentPlanTitle(user);

  if (status === MATCH_STATUS.MUTUAL) {
    hints.push({ type: 'success', text: 'Match — you can message each other.' });
  } else if (status === MATCH_STATUS.THEY_LIKED) {
    hints.push({
      type: 'info',
      text: 'They liked you. Like back to match and unlock chat.',
    });
  } else if (status === MATCH_STATUS.YOU_LIKED) {
    hints.push({
      type: 'info',
      text: 'You liked them. When they like you back, chat opens automatically.',
    });
  } else {
    hints.push({
      type: 'muted',
      text: 'Like them to connect. Messaging starts after a mutual like (match).',
    });
  }

  if (canDirectMessageWithoutMatch(user)) {
    hints.push({
      type: 'elite',
      text: `${plan}: Direct Connect — message from profile without waiting for a match.`,
    });
  } else {
    hints.push({
      type: 'muted',
      text: `${plan}: Messaging only after you both like each other.`,
    });
  }

  if (!canUseSuperLike(user)) {
    hints.push({
      type: 'locked',
      text: `Super like requires ${upgradePlanHint('superLike')} or above.`,
    });
  }

  hints.push({
    type: 'muted',
    text: 'Tap anyone in Likes on the Chat tab to view their profile.',
  });

  const L = tierLimits(user);
  if (L.maxDailySwipes != null) {
    hints.push({
      type: swipeLimitReached(user) ? 'locked' : 'muted',
      text: swipesRemainingLabel(user),
    });
  }

  return hints;
}

export function getLikesTabRules(user) {
  const plan = getCurrentPlanTitle(user);
  if (canSeeWhoLiked(user)) {
    return {
      title: `Likes · ${plan}`,
      items: [
        'See everyone who liked you.',
        'Tap a profile to view and message after you match.',
        'Like back on Home or their profile to start a chat.',
      ],
    };
  }
  return {
    title: `Likes · ${plan}`,
    items: [
      'People who liked you appear here — tap to open their profile.',
      'Like them back on their profile or Home to match and chat.',
      `Upgrade to ${upgradePlanHint('seeWhoLiked')} for extra visibility features.`,
    ],
  };
}

export function getMessagesTabRules(user) {
  const plan = getCurrentPlanTitle(user);
  if (canDirectMessageWithoutMatch(user)) {
    return {
      title: `Messages · ${plan}`,
      items: [
        'Direct Connect: message users from their profile without a mutual like.',
        'Match chats also appear here when you both like each other.',
      ],
    };
  }
  return {
    title: `Messages · ${plan}`,
    items: [
      'Conversations appear after a mutual like (you both liked each other).',
      'If someone liked you, like them back to open chat.',
      `Need unlimited swipes or see who liked you? Upgrade to ${upgradePlanHint('swipes')}.`,
    ],
  };
}

export function getHomeSwipeRules(user) {
  const plan = getCurrentPlanTitle(user);
  const L = tierLimits(user);
  const items = [];
  if (L.maxDailySwipes == null) {
    items.push('Unlimited likes (swipes) on your plan.');
  } else {
    items.push(swipesRemainingLabel(user));
    items.push(`Daily cap: ${L.maxDailySwipes} likes. Upgrade to ${upgradePlanHint('swipes')} for unlimited.`);
  }
  items.push('Swipe right = like · left = pass · up = super like (paid plans).');
  items.push('Chat unlocks when you and they both liked each other.');
  if (!canSeeWhoLiked(user)) {
    items.push(`Who liked you is blurred on Chat until ${upgradePlanHint('seeWhoLiked')}.`);
  }
  return { title: `Discover · ${plan}`, items };
}

export function assertCanLike(user) {
  if (swipeLimitReached(user)) {
    return {
      allowed: false,
      title: 'Daily like limit',
      message: `${swipesRemainingLabel(user)}. Upgrade to ${upgradePlanHint('swipes')} for unlimited likes.`,
    };
  }
  return { allowed: true };
}

export function assertCanSuperLike(user) {
  if (!canUseSuperLike(user)) {
    return {
      allowed: false,
      title: upgradePlanHint('superLike'),
      message: 'Super like is available on Collab Pro and above.',
    };
  }
  return { allowed: true };
}

export function assertCanOpenMessage(user, otherUserId) {
  if (!otherUserId) {
    return { allowed: false, title: 'Message', message: 'Profile not loaded.' };
  }
  if (canOpenChatWithUser(user, otherUserId)) {
    return { allowed: true };
  }
  const status = getMatchStatus(user, otherUserId);
  if (status === MATCH_STATUS.THEY_LIKED) {
    return {
      allowed: false,
      title: 'Match required',
      message: 'They already liked you — like them back to start chatting.',
    };
  }
  if (status === MATCH_STATUS.YOU_LIKED) {
    return {
      allowed: false,
      title: 'Waiting for match',
      message: 'You liked them. Chat opens when they like you back.',
    };
  }
  if (canDirectMessageWithoutMatch(user)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    title: 'Match required',
    message: `Your plan (${getCurrentPlanTitle(user)}): message after mutual like. Upgrade to ${upgradePlanHint('directMessage')} for Direct Connect.`,
  };
}

/** Toast copy after a successful like. */
export function likeSuccessMessage(user, otherUserId) {
  const theyLiked = userIdInList(user?.likedBySomeone, otherUserId);
  if (theyLiked) {
    return {
      type: 'success',
      text1: "It's a match!",
      text2: 'You can message from Chat or their profile.',
    };
  }
  return {
    type: 'success',
    text1: 'Liked',
    text2: 'If they like you back, chat will open automatically.',
  };
}
