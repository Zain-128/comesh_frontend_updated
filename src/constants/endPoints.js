export const BASE_URL = 'http://167.99.148.81:3001/comesh/api/';
export const LOCAL_BASE_URL = 'http://192.168.1.42:3001/comesh/api/';

export const ContentType = {
  PRIVACY_POLICY: "PRIVACY_POLICY",
  TERMS_AND_CONDITIONS: "TERMS_OF_SERVICE",
  ABOUT_US: "ABOUT_US"
}

export default endPoints = {
  baseUrl: BASE_URL,

  // Auth Endpoints
  Login: `users/login`,
  Logout: `users/logout`,
  VerfiyOTP: 'users/verifyUser',
  UpdateProfile: `users/updateProfile`,
  Dashboard: "users/dashboardListing",
  OthersProfile: "users/othersProfile/",
  Block: "users/blockUser",
  Report: "report-user",
  Like: "users/likeUser",
  Unlike: "users/unLikeUser",
  superLike: "users/superLikeUser",
  StaticContent: (type) => `static-content/${type}`,
  DeactiveAccount: "users/deactive",
  GetChats: "/chats",
  GetSingleChat: "/chats/getSingleChat",
  UpdateChatSession: "/chats/updateChatSession",
  GetMessages: "/messages",
  GetNotifications: "/notifications",
  GetAllLikesUsers: "/users/getAllUsersWhoLikedMe",
  RatingAndFeedback: "/rating-and-feedback"
};
