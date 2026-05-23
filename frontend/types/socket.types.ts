/**
 * Socket.io Type Definitions for Frontend
 * 
 * This file contains all TypeScript interfaces and types for Socket.io
 * real-time communication with the backend server.
 * 
 * These types mirror the backend socket.types.ts to ensure type safety
 * across the full-stack application.
 * 
 * @module types/socket.types
 */

// ─── User Types ─────────────────────────────────────────────────────────────────

/**
 * Basic user information structure
 */
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Online user information with socket details
 */
export interface OnlineUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  socketId: string;
  lastSeen?: string;
}

// ─── Message Types ──────────────────────────────────────────────────────────────

/**
 * Message status enumeration
 */
export type MessageStatus = 'sent' | 'delivered' | 'read';

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
 * Message data received by clients from server
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
  status?: MessageStatus;
}

// ─── Chat Types ─────────────────────────────────────────────────────────────────

/**
 * Chat room join payload
 */
export interface JoinChatPayload {
  chatId: string;
}

/**
 * Chat room leave payload
 */
export interface LeaveChatPayload {
  chatId: string;
}

/**
 * Chat room information
 */
export interface ChatRoom {
  chatId: string;
  users: Set<string>;
}

// ─── Typing Indicator Types ─────────────────────────────────────────────────────

/**
 * Typing indicator payload
 */
export interface TypingPayload {
  chatId: string;
  isTyping: boolean;
  userName?: string;
}

/**
 * Typing update event data
 */
export interface TypingUpdateData {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

// ─── Presence Types ─────────────────────────────────────────────────────────────

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'offline';

/**
 * User presence update event
 */
export interface UserPresenceUpdate {
  userId: string;
  status: PresenceStatus;
  socketId?: string;
  timestamp: string;
}

// ─── Notification Types ─────────────────────────────────────────────────────────

/**
 * Reminder notification payload from server
 */
export interface ReminderNotificationPayload {
  userId: string;
  reminderId: string;
  title: string;
  message: string;
  scheduledTime: string;
}

// ─── Socket Event Names ─────────────────────────────────────────────────────────

/**
 * Client -> Server event names
 * Use these constants to ensure type-safe event emission
 */
export const ClientEvents = {
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MARK_READ: 'mark_read',
  GET_ONLINE_USERS: 'get_online_users',
  DISCONNECT: 'disconnect',
} as const;

export type ClientEventKeys = keyof typeof ClientEvents;
export type ClientEventTypes = (typeof ClientEvents)[ClientEventKeys];

/**
 * Server -> Client event names
 * Use these constants to ensure type-safe event listening
 */
export const ServerEvents = {
  USER_CONNECTED: 'user_connected',
  USER_DISCONNECTED: 'user_disconnected',
  RECEIVE_MESSAGE: 'receive_message',
  ONLINE_USERS: 'online_users',
  USER_PRESENCE: 'user_presence',
  TYPING_UPDATE: 'typing_update',
  REMINDER_NOTIFICATION: 'reminder_notification',
  ERROR: 'error',
  MESSAGE_READ: 'message_read',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
} as const;

export type ServerEventKeys = keyof typeof ServerEvents;
export type ServerEventTypes = (typeof ServerEvents)[ServerEventKeys];

// ─── Socket Response Types ──────────────────────────────────────────────────────

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
 * Generic socket response type
 */
export type SocketResponse = SocketSuccessResponse | SocketErrorResponse;

/**
 * User connected event data
 */
export interface UserConnectedData {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    onlineCount?: number;
    chatId?: string;
    onlineUsers?: OnlineUser[];
  };
}

// ─── Socket Configuration Types ────────────────────────────────────────────────

/**
 * Socket connection configuration options
 */
export interface SocketConfig {
  /** Backend server URL */
  url: string;
  /** JWT authentication token */
  authToken: string;
  /** Enable auto-reconnection (default: true) */
  reconnection?: boolean;
  /** Reconnection delay in ms (default: 1000) */
  reconnectionDelay?: number;
  /** Maximum reconnection delay (default: 5000) */
  reconnectionDelayMax?: number;
  /** Maximum reconnection attempts (default: 10) */
  reconnectionAttempts?: number;
  /** Connection timeout in ms (default: 20000) */
  timeout?: number;
  /** Transport options (default: ['websocket', 'polling']) */
  transports?: string[];
}

// ─── Event Handler Callback Types ──────────────────────────────────────────────

/**
 * Callback for message received events
 */
export type MessageHandler = (message: ReceivedMessagePayload) => void;

/**
 * Callback for connection events
 */
export type ConnectionHandler = (data: {
  userId: string;
  email: string;
  onlineCount: number;
}) => void;

/**
 * Callback for disconnection events
 */
export type DisconnectionHandler = (reason: string) => void;

/**
 * Callback for online users list updates
 */
export type OnlineUsersHandler = (users: OnlineUser[]) => void;

/**
 * Callback for user presence updates
 */
export type PresenceHandler = (update: UserPresenceUpdate) => void;

/**
 * Callback for typing indicator updates
 */
export type TypingHandler = (data: TypingUpdateData) => void;

/**
 * Callback for socket error events
 */
export type ErrorHandler = (error: SocketErrorResponse) => void;

/**
 * Callback for reminder notifications
 */
export type ReminderHandler = (notification: ReminderNotificationPayload) => void;

/**
 * Callback for connection error events
 */
export type ConnectionErrorHandler = (error: Error) => void;

// ─── Socket State Types ────────────────────────────────────────────────────────

/**
 * Current socket connection state
 */
export interface SocketState {
  /** Whether socket is currently connected */
  isConnected: boolean;
  /** Whether socket is currently connecting */
  isConnecting: boolean;
  /** Current authenticated user */
  currentUser: User | null;
  /** Current authentication token */
  authToken: string | null;
  /** Online users in current chat room */
  onlineUsers: OnlineUser[];
  /** Users currently typing in current chat room */
  typingUsers: Map<string, TypingUpdateData>;
  /** Current chat room ID */
  currentChatId: string | null;
  /** Last error that occurred */
  lastError: SocketErrorResponse | null;
}

// ─── Socket.io Client Types ────────────────────────────────────────────────────

/**
 * Re-export Socket type from socket.io-client for convenience
 */
export type { Socket } from 'socket.io-client';

/**
 * Re-export ManagerOptions for socket configuration
 */
export type { ManagerOptions } from 'socket.io-client';