import globalActions from '../redux/actions/globalActions';
import { updateUserLikes } from '../redux/userSlice';
import {
  assertCanLike,
  assertCanOpenMessage,
  assertCanSuperLike,
  getMatchStatus,
  MATCH_STATUS,
} from '../constants/subscriptionLikeMessagingRules';
import { findChatWithPeerId } from './matchHelpers';
import { showMatchNotification } from './matchNotificationModal';

function navigateToSubscription(navigation) {
  if (navigation?.navigate) {
    navigation.navigate('Subscription');
  }
}

/**
 * Central like / unlike / super-like / open-chat with plan checks + modals.
 */
export async function performLike({
  dispatch,
  userData,
  userId,
  navigation,
  chats,
  callbacks = {},
}) {
  const gate = assertCanLike(userData);
  if (!gate.allowed) {
    showMatchNotification({
      variant: 'limit',
      title: gate.title,
      message: gate.message,
      primaryLabel: 'Upgrade plan',
      secondaryLabel: 'Not now',
      onPrimary: () => navigateToSubscription(navigation),
    });
    return false;
  }
  const theyLikedBefore = (userData?.likedBySomeone || []).some(
    (x) => String(x) === String(userId),
  );

  return new Promise((resolve) => {
    dispatch(
      globalActions.likeUser({
        userId,
        callback: (data) => {
          if (data?.success) {
            dispatch(updateUserLikes({ userId, type: 'like' }));
            dispatch(globalActions.GetChats({ callback: () => {} }));
            dispatch(globalActions.getLikesUsers({ callback: () => {} }));

            if (theyLikedBefore) {
              showMatchNotification({
                variant: 'match',
                title: "It's a match!",
                message: 'You both liked each other. Start the conversation now.',
                primaryLabel: 'Send message',
                secondaryLabel: 'Keep browsing',
                onPrimary: async () => {
                  if (navigation) {
                    await openChatWithPeer({
                      dispatch,
                      navigation,
                      userData,
                      chats,
                      peerUserId: userId,
                      skipGate: true,
                    });
                  }
                },
              });
            } else {
              showMatchNotification({
                variant: 'liked',
                placement: 'toast',
                title: 'Liked',
                message: 'Chat opens if they like you back.',
              });
            }

            callbacks.onSuccess?.(data);
            resolve(true);
          } else {
            resolve(false);
          }
        },
      }),
    );
  });
}

export async function performUnlike({ dispatch, userId, callbacks = {} }) {
  return new Promise((resolve) => {
    dispatch(
      globalActions.unLikeUser({
        userId,
        callback: (data) => {
          if (data?.success) {
            dispatch(updateUserLikes({ userId, type: 'unlike' }));
            callbacks.onSuccess?.(data);
            resolve(true);
          } else {
            resolve(false);
          }
        },
      }),
    );
  });
}

/** Undo last pass (swipe left) — clears unlike on server and unlocks like again. */
export async function performRewind({ dispatch, callbacks = {} }) {
  return new Promise((resolve) => {
    dispatch(
      globalActions.rewindUser({
        callback: (data) => {
          if (data?.success && data?.data?._id) {
            dispatch(
              updateUserLikes({ userId: data.data._id, type: 'rewind' }),
            );
            callbacks.onSuccess?.(data.data);
            resolve(data.data);
          } else {
            showMatchNotification({
              variant: 'info',
              title: 'Rewind',
              message:
                data?.message ||
                'No passed profiles to rewind. Swipe left on someone first.',
              primaryLabel: 'OK',
              secondaryLabel: null,
            });
            resolve(null);
          }
        },
      }),
    );
  });
}

export async function performSuperLike({
  dispatch,
  userData,
  userId,
  navigation,
  callbacks = {},
}) {
  const gate = assertCanSuperLike(userData);
  if (!gate.allowed) {
    showMatchNotification({
      variant: 'upgrade',
      title: gate.title,
      message: gate.message,
      primaryLabel: 'View plans',
      secondaryLabel: 'Not now',
      onPrimary: () => navigateToSubscription(navigation),
    });
    return false;
  }
  return new Promise((resolve) => {
    dispatch(
      globalActions.SuperLikeUser({
        userId,
        callback: (data) => {
          if (data?.success) {
            dispatch(updateUserLikes({ userId, type: 'like' }));
            showMatchNotification({
              variant: 'super_like',
              placement: 'toast',
              title: 'Super like sent',
              message: 'Chat opens if they like you back.',
            });
            callbacks.onSuccess?.(data);
            resolve(true);
          } else {
            resolve(false);
          }
        },
      }),
    );
  });
}

export async function openChatWithPeer({
  dispatch,
  navigation,
  userData,
  chats,
  peerUserId,
  skipGate = false,
}) {
  if (!skipGate) {
    const gate = assertCanOpenMessage(userData, peerUserId);
    if (!gate.allowed) {
      const status = getMatchStatus(userData, peerUserId);

      if (status === MATCH_STATUS.THEY_LIKED) {
        showMatchNotification({
          variant: 'like_back',
          title: gate.title,
          message: gate.message,
          primaryLabel: 'Like back',
          secondaryLabel: 'Not now',
          onPrimary: () =>
            performLike({
              dispatch,
              userData,
              userId: peerUserId,
              navigation,
              chats,
            }),
        });
        return false;
      }

      if (status === MATCH_STATUS.YOU_LIKED) {
        showMatchNotification({
          variant: 'waiting',
          title: gate.title,
          message: gate.message,
          primaryLabel: 'OK',
          secondaryLabel: null,
        });
        return false;
      }

      showMatchNotification({
        variant: 'upgrade',
        title: gate.title,
        message: gate.message,
        primaryLabel: 'View plans',
        secondaryLabel: 'Not now',
        onPrimary: () => navigateToSubscription(navigation),
      });
      return false;
    }
  }

  let chat = findChatWithPeerId(chats, peerUserId);
  if (!chat) {
    try {
      const res = await dispatch(
        globalActions.GetChats({ callback: () => {} }),
      ).unwrap();
      if (res?.success) {
        chat = findChatWithPeerId(res.data, peerUserId);
      }
    } catch {
      /* ignore */
    }
  }

  if (chat) {
    navigation.navigate('Messages', { item: chat });
    return true;
  }

  showMatchNotification({
    variant: 'info',
    title: 'Chat syncing',
    message:
      'Your conversation will appear under Chat shortly. Check the Chat tab in a moment.',
    primaryLabel: 'Open Chat',
    secondaryLabel: 'Close',
    onPrimary: () => navigation.navigate('Chat'),
  });
  return false;
}
