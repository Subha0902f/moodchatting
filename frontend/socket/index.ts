/**
 * Socket Module Exports
 * 
 * This file provides clean exports for the socket module.
 * 
 * @module socket
 */

// Main socket manager
export { socketManager, SocketManager } from './socket';

// Re-export types for convenience
export type {
  User,
  OnlineUser,
  ReceivedMessagePayload,
  SendMessagePayload,
  TypingPayload,
  TypingUpdateData,
  UserPresenceUpdate,
  ReminderNotificationPayload,
  SocketConfig,
  SocketState,
  SocketErrorResponse,
  MessageHandler,
  ConnectionHandler,
  DisconnectionHandler,
  OnlineUsersHandler,
  PresenceHandler,
  TypingHandler,
  ErrorHandler,
  ReminderHandler,
  ConnectionErrorHandler,
} from '../types/socket.types';

export {
  ClientEvents,
  ServerEvents,
} from '../types/socket.types';

export type {
  ClientEventKeys,
  ClientEventTypes,
  ServerEventKeys,
  ServerEventTypes,
} from '../types/socket.types';