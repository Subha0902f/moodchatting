/**
 * Socket.io Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for Socket.io
 * real-time communication in the MoodChat application.
 */

import { UserRole } from './user.types';

// ─── Socket Event Payloads ────────────────────────────────────────────────────

/**
 * Message data sent from client to server
 */
export interface SendMessagePayload {
  chatId: string;
  message: string;
  mode?: string;
  timestamp?: string;
}

/**
 * Message data received by clients
 */
export interface ReceivedMessagePayload {
  id?: string;
  senderId: string;
  senderEmail?: string;
  senderName?: string;
  chatId: string;
  message: string;
  mode?: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

/**
 * Chat room join payload
 */
export interface JoinChatPayload {
  chatId: string;
}

/**
 * Typing indicator payload
 */
export interface TypingPayload {
  chatId: string;
  isTyping: boolean;
  userName?: string;
}

/**
 * Reminder notification payload
 */
export interface ReminderNotificationPayload {
  userId: string;
  reminderId: string;
  title: string;
  message: string;
  scheduledTime: string;
}

/**
 * Online user information
 */
export interface OnlineUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  socketId: string;
  lastSeen?: string;
}

/**
 * User presence update
 */
export interface UserPresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
  socketId?: string;
  timestamp: string;
}

// ─── Socket Event Names (for string constants) ───────────────────────────────

export const ClientEventNames = {
  JOIN_CHAT: 'join_chat',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  DISCONNECT: 'disconnect',
} as const;

export const ServerEventNames = {
  USER_CONNECTED: 'user_connected',
  USER_DISCONNECTED: 'user_disconnected',
  RECEIVE_MESSAGE: 'receive_message',
  ONLINE_USERS: 'online_users',
  USER_PRESENCE: 'user_presence',
  TYPING_UPDATE: 'typing_update',
  REMINDER_NOTIFICATION: 'reminder_notification',
  ERROR: 'error',
} as const;

// ─── Socket Event Maps (for typed Socket.IO) ─────────────────────────────────

/**
 * Client -> Server event map for Socket.IO typing
 * Maps event names to their payload types
 */
export interface ClientToServerEvents {
  join_chat: (payload: JoinChatPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
  typing_start: (payload: TypingPayload) => void;
  typing_stop: (payload: TypingPayload) => void;
  disconnect: () => void;
}

/**
 * Server -> Client event map for Socket.IO typing
 * Maps event names to their payload types
 */
export interface ServerToClientEvents {
  user_connected: (user: OnlineUser) => void;
  user_disconnected: (userId: string) => void;
  receive_message: (payload: ReceivedMessagePayload) => void;
  online_users: (users: OnlineUser[]) => void;
  user_presence: (update: UserPresenceUpdate) => void;
  typing_update: (payload: TypingPayload) => void;
  reminder_notification: (payload: ReminderNotificationPayload) => void;
  error: (response: SocketErrorResponse) => void;
}

// ─── Socket Data Structures ───────────────────────────────────────────────────

/**
 * Extended Socket data attached to each socket instance
 */
export interface SocketData {
  userId: string;
  email: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
}

/**
 * Room information
 */
export interface ChatRoom {
  chatId: string;
  users: Set<string>; // Set of userIds
}

/**
 * Socket manager state
 */
export interface SocketState {
  onlineUsers: Map<string, OnlineUser>; // userId -> OnlineUser
  userSockets: Map<string, Set<string>>; // userId -> Set of socketIds
  socketUser: Map<string, string>; // socketId -> userId
  chatRooms: Map<string, ChatRoom>; // chatId -> ChatRoom
}

// ─── Socket Response Types ────────────────────────────────────────────────────

/**
 * Success response for socket operations
 */
export interface SocketSuccessResponse {
  success: true;
  message: string;
  data?: unknown;
}

/**
 * Error response for socket operations
 */
export interface SocketErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * Generic socket response
 */
export type SocketResponse = SocketSuccessResponse | SocketErrorResponse;

// ─── Database Message Interface ───────────────────────────────────────────────

/**
 * Message structure for database storage
 */
export interface DatabaseMessage {
  id?: string;
  sender_id: string;
  chat_id: string;
  message: string;
  mode?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Socket.io Server Types ───────────────────────────────────────────────────

import type { Server as SocketIOServer, Socket } from 'socket.io';

/**
 * Typed Socket.io Server
 */
export type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
>;

/**
 * Typed Socket
 */
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents
>;

/**
 * Socket handler initialization function type
 */
export type SocketHandlerInit = (io: TypedServer) => void;