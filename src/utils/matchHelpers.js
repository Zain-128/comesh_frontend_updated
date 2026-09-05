/** True if `id` appears in a string/ObjectId id array. */
export function userIdInList(list, id) {
  if (id == null || !Array.isArray(list)) return false;
  const target = String(id);
  return list.some((entry) => String(entry) === target);
}

/** Both users liked each other (match). */
export function isMutualLike(userData, otherUserId) {
  return (
    userIdInList(userData?.likedByMe, otherUserId) &&
    userIdInList(userData?.likedBySomeone, otherUserId)
  );
}

/** Find 1:1 chat row whose peer is `peerUserId`. */
export function findChatWithPeerId(chatsState, peerUserId) {
  const rows = chatsState?.data;
  if (!peerUserId || !Array.isArray(rows)) return null;
  const target = String(peerUserId);
  return (
    rows.find((chat) => {
      const peer = chat?.usersData?.[0];
      return peer?._id != null && String(peer._id) === target;
    }) ?? null
  );
}

/** Normalize getAllUsersWhoLikedMe API payload. */
export function parseLikedBySomeoneResponse(apiResult) {
  if (!apiResult) return [];
  const root = apiResult?.data ?? apiResult;
  if (Array.isArray(root?.likedBySomeone)) {
    return root.likedBySomeone.filter((u) => u && (u._id != null || u.id != null));
  }
  if (Array.isArray(root) && root[0]?.likedBySomeone) {
    return root[0].likedBySomeone.filter(
      (u) => u && (u._id != null || u.id != null),
    );
  }
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    const list = root.likedBySomeone;
    if (Array.isArray(list)) {
      return list.filter((u) => u && (u._id != null || u.id != null));
    }
  }
  return [];
}
