import { io } from "socket.io-client";
import endPoints from "../constants/endPoints";

let socket = null;
/** Invalidate connection when auth changes (login / token refresh). */
let lastConnectKey = "";

/**
 * REST base is like `https://host/comesh/api` — Socket.IO must hit the HTTP server root
 * with the **default** namespace `/`. Using `https://host/comesh` makes the client join
 * namespace `/comesh`, which does not match `@WebSocketGateway()` (namespace `/`).
 */
const getSocketBaseUrl = () => {
  const raw = (endPoints.baseUrl || "").trim();
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return raw.replace(/\/api\/?$/i, "").replace(/\/comesh\/api\/?$/i, "").split("/comesh")[0] || raw;
  }
};

const connectKey = (token, userId) => `${String(userId || "")}|${String(token || "")}`;

const buildHandshakeHeaders = (bearer) => {
  const base = getSocketBaseUrl();
  const isNgrok = String(base).includes("ngrok");
  const h = {
    ...(bearer ? { Authorization: bearer } : {}),
    ...(isNgrok ? { "ngrok-skip-browser-warning": "true" } : {}),
  };
  return Object.keys(h).length ? h : undefined;
};

const connect = ({ token, userId }) => {
  const key = connectKey(token, userId);
  if (socket && lastConnectKey === key) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  if (socket) {
    try {
      socket.removeAllListeners();
    } catch {
      /* ignore */
    }
    socket.disconnect();
    socket = null;
  }
  lastConnectKey = key;

  const bearer = token ? `Bearer ${token}` : undefined;
  const handshakeHeaders = buildHandshakeHeaders(bearer);

  socket = io(getSocketBaseUrl(), {
    transports: ["websocket", "polling"],
    auth: bearer ? { token: bearer } : undefined,
    extraHeaders: handshakeHeaders,
    /** RN + ngrok: polling upgrade must send the header or handshake gets HTML interstitial. */
    transportOptions: handshakeHeaders
      ? {
          polling: { extraHeaders: handshakeHeaders },
        }
      : undefined,
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
  lastConnectKey = "";
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
