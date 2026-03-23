import { io } from "socket.io-client";
import endPoints from "../constants/endPoints";

let socket = null;

const getSocketBaseUrl = () => {
  const baseUrl = endPoints.baseUrl || "";
  return baseUrl.replace(/\/api\/?$/, "");
};

const connect = ({ token, userId }) => {
  if (socket?.connected) return socket;
  const bearer = token ? `Bearer ${token}` : undefined;

  socket = io(getSocketBaseUrl(), {
    transports: ["websocket", "polling"],
    auth: bearer ? { token: bearer } : undefined,
    extraHeaders: bearer ? { Authorization: bearer } : undefined,
    query: userId ? { userId } : undefined,
    reconnection: true,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    if (userId) socket.emit("user-online", userId);
  });

  return socket;
};

const getSocket = () => socket;

const disconnect = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

const joinChat = (chatId) => {
  if (!socket || !chatId) return;
  socket.emit("join-chat", chatId);
};

const leaveChat = (chatId) => {
  if (!socket || !chatId) return;
  socket.emit("leave-chat", chatId);
};

const sendMessage = ({ chatId, content, messageType = "text", senderId, receiverId }) => {
  if (!socket) return;
  const payload = {
    chatId,
    conversationId: chatId,
    content,
    text: content,
    message: content,
    type: messageType === "text" ? "TEXT" : messageType,
    senderId,
    receiverId,
    to: receiverId,
    from: senderId,
  };
  socket.emit("sendMessage", payload);
  socket.emit("send-message", payload);
  socket.emit("send_message", payload);
};

const sendTypingStart = ({ chatId, userId, receiverId }) => {
  if (!socket || !chatId || !userId) return;
  const payload = { chatId, conversationId: chatId, userId, receiverId };
  socket.emit("typing_start", payload);
  socket.emit("typing-start", payload);
};

const sendTypingStop = ({ chatId, userId, receiverId }) => {
  if (!socket || !chatId || !userId) return;
  const payload = { chatId, conversationId: chatId, userId, receiverId };
  socket.emit("typing_stop", payload);
  socket.emit("typing-stop", payload);
};

const markMessageRead = ({ chatId, userId, messageId }) => {
  if (!socket || !chatId || !userId) return;
  const payload = { chatId, conversationId: chatId, userId, messageId };
  socket.emit("markAsRead", payload);
  socket.emit("mark_message_read", payload);
  socket.emit("mark-message-read", payload);
  socket.emit("mark_as_read", payload);
};

const on = (eventName, handler) => {
  if (!socket || !eventName || !handler) return () => {};
  socket.on(eventName, handler);
  return () => socket?.off(eventName, handler);
};

export default {
  connect,
  getSocket,
  disconnect,
  joinChat,
  leaveChat,
  sendMessage,
  sendTypingStart,
  sendTypingStop,
  markMessageRead,
  on,
};
