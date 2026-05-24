/**
 * Socket.io Handler for MoodChat Application
 * 
 * This module handles all real-time WebSocket communication using Socket.io.
 * It manages user connections, chat rooms, messaging, typing indicators,
 * online presence, and reminder notifications.
 * 
 * Architecture:
 * - JWT-based authentication for socket connections
 * - Room-based chat system using Socket.io rooms
 * - In-memory state management for online users and chat rooms
 * - Database persistence for messages using Supabase
 * 
 * @module sockets/socketHandler
 */

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';
import { envConfig } from '../config/env.config';
import { UserRole } from '../types/user.types';
import {
  SendMessagePayload,
  ReceivedMessagePayload,
  TypingPayload,
  ReminderNotificationPayload,
  OnlineUser,
  UserPresenceUpdate,
  SocketData,
  ChatRoom,
  DatabaseMessage,
  ServerEventNames,
} from '../types/socket.types';

// ─── Socket State Management ──────────────────────────────────────────────────

/**
 * Centralized state management for socket connections
 * This provides a single source of truth for all socket-related state
 */
const socketState = {
  /** Map of userId to their online user data */
  onlineUsers: new Map<string, OnlineUser>(),
  
  /** Map of userId to Set of their socketIds (users can have multiple connections) */
  userSockets: new Map<string, Set<string>>(),
  
  /** Map of socketId to userId for quick lookup */
  socketUser: new Map<string, string>(),
  
  /** Map of chatId to chat room data */
  chatRooms: new Map<string, ChatRoom>(),
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Verify JWT token from socket handshake
 * 
 * @param token - JWT token from socket handshake auth
 * @returns Decoded JWT payload or null if invalid
 */
const verifySocketToken = async (token: string): Promise<{
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
} | null> => {
  try {
    const decoded = jwt.verify(token, envConfig.jwt.secret) as {
      id: string;
      email: string;
      role: UserRole;
      fullName?: string;
      avatarUrl?: string;
      iat: number;
      exp: number;
    };

    // Fetch fresh user data from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      console.error('Socket auth: User not found in database');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.full_name || undefined,
      avatarUrl: user.avatar_url || undefined,
    };
  } catch (error) {
    console.error('Socket auth: Token verification failed:', error);
    return null;
  }
};

/**
 * Get the number of online users
 * 
 * @returns Number of currently online users
 */
const getOnlineCount = (): number => {
  return socketState.onlineUsers.size;
};

/**
 * Get list of online users for a specific chat room
 * 
 * @param chatId - The chat room ID
 * @returns Array of online users in the room
 */
const getOnlineUsersInRoom = (chatId: string): OnlineUser[] => {
  const room = socketState.chatRooms.get(chatId);
  if (!room) return [];

  const onlineUsers: OnlineUser[] = [];
  room.users.forEach((userId) => {
    const user = socketState.onlineUsers.get(userId);
    if (user) {
      onlineUsers.push(user);
    }
  });

  return onlineUsers;
};

/**
 * Broadcast online users list to all users in a room
 * 
 * @param io - Socket.io server instance
 * @param chatId - The chat room ID
 */
const broadcastOnlineUsers = (io: Server, chatId: string): void => {
  const onlineUsers = getOnlineUsersInRoom(chatId);
  io.to(chatId).emit(ServerEventNames.ONLINE_USERS, onlineUsers);
};

/**
 * Broadcast user presence update to all users in a room
 * 
 * @param io - Socket.io server instance
 * @param chatId - The chat room ID
 * @param update - The presence update data
 */
const broadcastPresence = (
  io: Server,
  chatId: string,
  update: UserPresenceUpdate
): void => {
  io.to(chatId).emit(ServerEventNames.USER_PRESENCE, update);
};

// ─── Database Operations ──────────────────────────────────────────────────────

/**
 * Save a message to the database
 * 
 * @param messageData - The message data to save
 * @returns The saved message with ID and timestamps
 */
const saveMessageToDatabase = async (
  messageData: DatabaseMessage
): Promise<DatabaseMessage | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          sender_id: messageData.sender_id,
          chat_id: messageData.chat_id,
          message: messageData.message,
          mode: messageData.mode || 'text',
          status: 'sent',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving message to database:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Database error while saving message:', error);
    return null;
  }
};

/**
 * Update message status in database
 * 
 * @param messageId - The message ID
 * @param status - The new status
 */
const updateMessageStatus = async (
  messageId: string,
  status: string
): Promise<void> => {
  try {
    await supabaseAdmin
      .from('messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId);
  } catch (error) {
    console.error('Error updating message status:', error);
  }
};

// ─── Socket Event Handlers ────────────────────────────────────────────────────

/**
 * Handle user connection and authentication
 * 
 * @param io - Socket.io server instance
 * @param socket - Connected socket
 */
const handleConnection = async (io: Server, socket: Socket): Promise<void> => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Extract token from handshake auth
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    console.log(`❌ Socket ${socket.id} rejected: No token provided`);
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Authentication required. Please provide a valid token.',
    });
    socket.disconnect(true);
    return;
  }

  // Verify the token
  const userData = await verifySocketToken(token);

  if (!userData) {
    console.log(`❌ Socket ${socket.id} rejected: Invalid token`);
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Invalid or expired token. Please log in again.',
    });
    socket.disconnect(true);
    return;
  }

  // Attach user data to socket
  const socketData: SocketData = {
    userId: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    role: userData.role,
    avatarUrl: userData.avatarUrl,
  };

  socket.data = socketData;

  // Store socket-user mapping
  socketState.socketUser.set(socket.id, userData.id);

  // Store user's socket IDs
  if (!socketState.userSockets.has(userData.id)) {
    socketState.userSockets.set(userData.id, new Set());
  }
  socketState.userSockets.get(userData.id)!.add(socket.id);

  // Update or add to online users
  const onlineUser: OnlineUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    avatarUrl: userData.avatarUrl,
    socketId: socket.id,
    lastSeen: new Date().toISOString(),
  };

  const wasOffline = !socketState.onlineUsers.has(userData.id);
  socketState.onlineUsers.set(userData.id, onlineUser);

  // Notify user of successful connection
  socket.emit(ServerEventNames.USER_CONNECTED, {
    success: true,
    message: 'Connected successfully',
    data: {
      userId: userData.id,
      email: userData.email,
      onlineCount: getOnlineCount(),
    },
  });

  console.log(
    `✅ User ${userData.email} (${userData.id}) connected via socket ${socket.id}`
  );

  // If user was offline, broadcast their online status to all their chat rooms
  if (wasOffline) {
    // Find all rooms this user is in and notify
    socketState.chatRooms.forEach((room, chatId) => {
      if (room.users.has(userData.id)) {
        broadcastPresence(io, chatId, {
          userId: userData.id,
          status: 'online',
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
        broadcastOnlineUsers(io, chatId);
      }
    });
  }
};

/**
 * Handle user joining a chat room
 * 
 * @param io - Socket.io server instance
 * @param socket - Socket instance
 * @param payload - Join chat payload
 */
const handleJoinChat = (io: Server, socket: Socket, payload: { chatId: string }): void => {
  const { chatId } = payload;

  if (!chatId || typeof chatId !== 'string') {
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Invalid chat ID provided',
    });
    return;
  }

  const userId = socket.data?.userId;
  if (!userId) {
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Not authenticated',
    });
    return;
  }

  // Join the Socket.io room
  socket.join(chatId);

  // Initialize or update chat room state
  if (!socketState.chatRooms.has(chatId)) {
    socketState.chatRooms.set(chatId, {
      chatId,
      users: new Set(),
    });
  }

  socketState.chatRooms.get(chatId)!.users.add(userId);

  console.log(`💬 User ${userId} joined chat room ${chatId}`);

  // Send confirmation to the user
  socket.emit(ServerEventNames.USER_CONNECTED, {
    success: true,
    message: `Joined chat room ${chatId}`,
    data: {
      chatId,
      onlineUsers: getOnlineUsersInRoom(chatId),
    },
  });

  // Notify others in the room about online users
  broadcastOnlineUsers(io, chatId);
};

/**
 * Handle user leaving a chat room
 * 
 * @param io - Socket.io server instance
 * @param socket - Socket instance
 * @param payload - Leave chat payload
 */
const handleLeaveChat = (io: Server, socket: Socket, payload: { chatId: string }): void => {
  const { chatId } = payload;

  if (!chatId || typeof chatId !== 'string') {
    return;
  }

  const userId = socket.data?.userId;
  if (!userId) {
    return;
  }

  // Leave the Socket.io room
  socket.leave(chatId);

  // Update chat room state
  const room = socketState.chatRooms.get(chatId);
  if (room) {
    room.users.delete(userId);
    
    // Clean up empty rooms
    if (room.users.size === 0) {
      socketState.chatRooms.delete(chatId);
    }
  }

  console.log(`🚪 User ${userId} left chat room ${chatId}`);

  // Notify others in the room about updated online users
  broadcastOnlineUsers(io, chatId);
};

/**
 * Handle sending a message
 * 
 * @param io - Socket.io server instance
 * @param socket - Socket instance
 * @param payload - Message payload
 */
const handleSendMessage = async (
  io: Server,
  socket: Socket,
  payload: SendMessagePayload
): Promise<void> => {
  const { chatId, message, mode } = payload;

  if (!chatId || !message) {
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Chat ID and message are required',
    });
    return;
  }

  const userId = socket.data?.userId;
  if (!userId) {
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Not authenticated',
    });
    return;
  }

  // Prepare message for database
  const messageData: DatabaseMessage = {
    sender_id: userId,
    chat_id: chatId,
    message,
    mode: mode || 'text',
    status: 'sent',
  };

  // Save to database
  const savedMessage = await saveMessageToDatabase(messageData);

  if (!savedMessage) {
    socket.emit(ServerEventNames.ERROR, {
      success: false,
      error: 'Failed to save message',
    });
    return;
  }

  // Prepare the received message payload
  const receivedMessage: ReceivedMessagePayload = {
    id: savedMessage.id,
    senderId: userId,
    senderEmail: socket.data?.email,
    senderName: socket.data?.fullName,
    chatId,
    message,
    mode: mode || 'text',
    timestamp: savedMessage.created_at || new Date().toISOString(),
    status: 'sent',
  };

  // Broadcast to all users in the chat room (including sender)
  io.to(chatId).emit(ServerEventNames.RECEIVE_MESSAGE, receivedMessage);

  console.log(`📝 Message sent in chat ${chatId} by user ${userId}`);
};

/**
 * Handle typing indicator start
 * 
 * @param io - Socket.io server instance
 * @param socket - Socket instance
 * @param payload - Typing payload
 */
const handleTypingStart = (_io: Server, socket: Socket, payload: TypingPayload): void => {
  const { chatId, userName } = payload;

  if (!chatId) {
    return;
  }

  const userId = socket.data?.userId;
  if (!userId) {
    return;
  }

  // Broadcast typing indicator to others in the room
  socket.to(chatId).emit(ServerEventNames.TYPING_UPDATE, {
    chatId,
    userId,
    userName: userName || socket.data?.fullName || 'Someone',
    isTyping: true,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle typing indicator stop
 * 
 * @param io - Socket.io server instance
 * @param socket - Socket instance
 * @param payload - Typing payload
 */
const handleTypingStop = (_io: Server, socket: Socket, payload: TypingPayload): void => {
  const { chatId } = payload;

  if (!chatId) {
    return;
  }

  const userId = socket.data?.userId;
  if (!userId) {
    return;
  }

  // Broadcast typing stop to others in the room
  socket.to(chatId).emit(ServerEventNames.TYPING_UPDATE, {
    chatId,
    userId,
    isTyping: false,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle user disconnection
 * 
 * @param io - Socket.io server instance
 * @param socket - Socket instance
 */
const handleDisconnection = (io: Server, socket: Socket): void => {
  const userId = socket.data?.userId;
  const socketId = socket.id;

  console.log(`🔌 Socket disconnected: ${socketId}`);

  if (!userId) {
    // Socket was never authenticated, just clean up
    socketState.socketUser.delete(socketId);
    return;
  }

  // Remove socket from user's socket set
  const userSockets = socketState.userSockets.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);

    // If user has no more sockets, they're fully offline
    if (userSockets.size === 0) {
      socketState.userSockets.delete(userId);
      socketState.onlineUsers.delete(userId);

      console.log(`⭕ User ${userId} is now fully offline`);

      // Notify all chat rooms this user was in
      socketState.chatRooms.forEach((room, chatId) => {
        if (room.users.has(userId)) {
          broadcastPresence(io, chatId, {
            userId,
            status: 'offline',
            socketId,
            timestamp: new Date().toISOString(),
          });
          broadcastOnlineUsers(io, chatId);
        }
      });
    } else {
      // User still has other connections, update the socketId reference
      const onlineUser = socketState.onlineUsers.get(userId);
      if (onlineUser) {
        onlineUser.socketId = Array.from(userSockets)[0]; // Use first remaining socket
        socketState.onlineUsers.set(userId, onlineUser);
      }
    }
  }

  // Clean up socket-user mapping
  socketState.socketUser.delete(socketId);

  // Leave all rooms
  socket.rooms.forEach((room) => {
    if (room !== socketId) {
      socket.leave(room);
    }
  });

  console.log(`✅ Cleaned up socket ${socketId} for user ${userId}`);
};

/**
 * Send a reminder notification to a specific user
 * 
 * @param io - Socket.io server instance
 * @param userId - The user ID to notify
 * @param payload - Reminder notification payload
 */
export const sendReminderNotification = (
  io: Server,
  userId: string,
  payload: ReminderNotificationPayload
): void => {
  const userSockets = socketState.userSockets.get(userId);

  if (!userSockets || userSockets.size === 0) {
    console.log(`⚠️ Cannot send reminder to user ${userId}: User is offline`);
    return;
  }

  // Send to all of user's socket connections
  userSockets.forEach((socketId) => {
    io.to(socketId).emit(ServerEventNames.REMINDER_NOTIFICATION, payload);
  });

  console.log(`🔔 Reminder sent to user ${userId}: ${payload.title}`);
};

/**
 * Broadcast a message to all users in a chat room
 * Utility function for external use
 * 
 * @param io - Socket.io server instance
 * @param chatId - The chat room ID
 * @param event - The event name
 * @param data - The data to broadcast
 */
export const broadcastToRoom = (
  io: Server,
  chatId: string,
  event: string,
  data: unknown
): void => {
  io.to(chatId).emit(event, data);
};

/**
 * Get online users in a specific chat room
 * Utility function for external use
 * 
 * @param chatId - The chat room ID
 * @returns Array of online users
 */
export const getRoomOnlineUsers = (chatId: string): OnlineUser[] => {
  return getOnlineUsersInRoom(chatId);
};

/**
 * Check if a user is online
 * 
 * @param userId - The user ID to check
 * @returns True if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return socketState.onlineUsers.has(userId);
};

/**
 * Get all online users
 * 
 * @returns Map of all online users
 */
export const getAllOnlineUsers = (): Map<string, OnlineUser> => {
  return new Map(socketState.onlineUsers);
};

// ─── Socket.io Middleware ─────────────────────────────────────────────────────

/**
 * Socket.io authentication middleware
 * Validates JWT token before allowing connection
 */
const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    const error = new Error('Authentication required');
    (error as any).data = { content: 'Please provide a valid authentication token' };
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwt.secret);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      throw new Error('Invalid token payload');
    }
    next();
  } catch (error) {
    const err = error as Error & { data?: unknown };
    err.data = { content: 'Invalid or expired token' };
    next(err);
  }
};

// ─── Main Socket Handler Initialization ───────────────────────────────────────

/**
 * Initialize Socket.io event handlers
 * 
 * This function sets up all Socket.io event listeners and middleware.
 * It should be called once during server startup.
 * 
 * @param io - Socket.io server instance
 */
export const initializeSocket = (io: Server): void => {
  console.log('🚀 Initializing Socket.io handlers...');

  // Apply authentication middleware to all socket connections
  io.use(socketAuthMiddleware);

  // Main socket connection handler
  io.on('connection', (socket: Socket) => {
    // Handle connection
    handleConnection(io, socket);

    // ─── Event Listeners ──────────────────────────────────────────────────

    // Join a chat room
    socket.on('join_chat', (payload: { chatId: string }) => {
      handleJoinChat(io, socket, payload);
    });

    // Leave a chat room
    socket.on('leave_chat', (payload: { chatId: string }) => {
      handleLeaveChat(io, socket, payload);
    });

    // Send a message
    socket.on('send_message', async (payload: SendMessagePayload) => {
      await handleSendMessage(io, socket, payload);
    });

    // Typing indicators
    socket.on('typing_start', (payload: TypingPayload) => {
      handleTypingStart(io, socket, payload);
    });

    socket.on('typing_stop', (payload: TypingPayload) => {
      handleTypingStop(io, socket, payload);
    });

    // Mark message as read
    socket.on('mark_read', (payload: { messageId: string; chatId: string }) => {
      const { messageId, chatId } = payload;
      updateMessageStatus(messageId, 'read')
        .then(() => {
          // Notify others that message was read
          socket.to(chatId).emit('message_read', { messageId, chatId });
        })
        .catch(console.error);
    });

    // Request online users for a room
    socket.on('get_online_users', (payload: { chatId: string }) => {
      const { chatId } = payload;
      const onlineUsers = getOnlineUsersInRoom(chatId);
      socket.emit(ServerEventNames.ONLINE_USERS, onlineUsers);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnection(io, socket);
    });

    // Handle connection errors
    socket.on('error', (error: Error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    console.log(`✅ Socket handlers registered for ${socket.id}`);
  });

  // Global error handling
  io.on('connect_error', (error: Error) => {
    console.error('Socket.io connection error:', error);
  });

  console.log('✅ Socket.io handlers initialized successfully');
  console.log(`📊 Current online users: ${getOnlineCount()}`);
};

/**
 * Clean up socket state (useful for testing or graceful shutdown)
 */
export const cleanupSocketState = (): void => {
  socketState.onlineUsers.clear();
  socketState.userSockets.clear();
  socketState.socketUser.clear();
  socketState.chatRooms.clear();
};

export default initializeSocket;