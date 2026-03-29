export const BASE_URL = 'https://comesh-app-backend.onrender.com/comesh/api';
export const LOCAL_BASE_URL = 'https://comesh-app-backend.onrender.com/comesh/api';

export const ContentType = {
  PRIVACY_POLICY: "PRIVACY_POLICY",
  TERMS_AND_CONDITIONS: "TERMS_OF_SERVICE",
  ABOUT_US: "ABOUT_US"
}

export default endPoints = {
  baseUrl: BASE_URL,

  // Auth Endpoints
  Login: `/users/login`,
  Logout: `/users/logout`,
  VerfiyOTP: '/users/verifyUser',
  UpdateProfile: `/users/updateProfile`,
  /** Leading `/` required — else baseUrl `.../api` + `users/...` becomes `.../apiusers/...`. */
  Dashboard: "/users/dashboardListing",
  OthersProfile: "/users/othersProfile/",
  /** GET — same data as OthersProfile; preferred name (`getUserProfileById` on server). */
  UserById: (id) => `/users/by-id/${id}`,
  Block: "/users/blockUser",
  Report: "/report-user",
  Like: "/users/likeUser",
  Unlike: "/users/unLikeUser",
  superLike: "/users/superLikeUser",
  StaticContent: (type) => `/static-content/${type}`,
  DeactiveAccount: "/users/deactive",
  GetChats: "/chats",
  GetSingleChat: "/chats/getSingleChat/",
  UpdateChatSession: "/chats/updateChatSession",
  GetMessages: "/messages",
  /** POST JSON — text-only message (no media file). */
  SendMessageText: "/messages/text",
  GetNotifications: "/notifications",
  GetAllLikesUsers: "/users/getAllUsersWhoLikedMe",
  /** GET ?page=&limit=&search= — find users (auth) */
  SearchUsersList: "/users/list",
  RatingAndFeedback: "/rating-and-feedback"
};
