/**
 * Socket.io Service for MoodChat Frontend
 * 
 * This service manages all WebSocket connections and real-time communication
 * with the backend using Socket.io. It provides a clean API for the React
 * components to interact with the real-time features.
 * 
 * Features:
 * - JWT-based authentication
 * - Auto-reconnection with exponential backoff
 * - Event-driven message handling
 * - Typing indicators
 * - Online presence tracking
 * - Room-based chat management
 * 
 * @module services/socketService
 */

import { io, Socket } from 'socket.io-client';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

/**
 * User data structure
 */
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
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
 * Message payload for sending messages
 */
export interface SendMessagePayload {
  chatId: string;
  message: string;
  mode?: string;
  timestamp?: string;
}

/**
 * Received message payload
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
 * Typing indicator payload
 */
export interface TypingPayload {
  chatId: string;
  isTyping: boolean;
  userName?: string;
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

// ─── Event Handler Types ──────────────────────────────────────────────────────

/**
 * Callback function types for socket events
 */
export type MessageHandler = (message: ReceivedMessagePayload) => void;
export type ConnectionHandler = (data: { userId: string; email: string; onlineCount: number }) => void;
export type DisconnectionHandler = (reason: string) => void;
export type OnlineUsersHandler = (users: OnlineUser[]) => void;
export type PresenceHandler = (update: UserPresenceUpdate) => void;
export type TypingHandler = (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => void;
export type ErrorHandler = (error: { success: boolean; error: string }) => void;
export type ReminderHandler = (notification: ReminderNotificationPayload) => void;

// ─── Socket Service Class ─────────────────────────────────────────────────────

/**
 * SocketService - Singleton class for managing Socket.io connections
 * 
 * This class provides a centralized way to manage WebSocket connections
 * throughout the application. It handles authentication, event subscription,
 * and connection lifecycle management.
 */
class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private authToken: string | null = null;
  private currentUser: User | null = null;

  // Event handler storage
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<DisconnectionHandler> = new Set();
  private onlineUsersHandlers: Set<OnlineUsersHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reminderHandlers: Set<ReminderHandler> = new Set();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of SocketService
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // ─── Connection Management ──────────────────────────────────────────────────

  /**
   * Initialize and connect to the Socket.io server
   * 
   * @param token - JWT authentication token
   * @param user - Current user data
   * @returns The Socket instance
   */
  public connect(token: string, user: User): Socket {
    this.authToken = token;
    this.currentUser = user;

    // Get socket URL from environment variables (Vite)
    // Using a type-safe approach to access import.meta.env
    const getEnvVar = (key: string): string | undefined => {
      try {
        // @ts-expect-error - import.meta.env is a Vite feature
        return import.meta.env?.[key] as string | undefined;
      } catch {
        return undefined;
      }
    };

    const socketUrl = getEnvVar('VITE_SOCKET_URL') || 
                      getEnvVar('VITE_API_URL') || 
                      'http://localhost:5000';

    // Remove protocol if present for socket.io
    const cleanUrl = socketUrl.replace(/^https?:\/\//, '');

    console.log('🔌 Connecting to Socket.io server:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true,
    });

    // Set up event listeners
    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Set up all Socket.io event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket.io connected');
      this.notifyConnection({
        userId: this.currentUser?.id || '',
        email: this.currentUser?.email || '',
        onlineCount: 0,
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      this.isConnected = false;
      console.log('❌ Socket.io disconnected:', reason);
      this.notifyDisconnection(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.io connection error:', error);
      this.notifyError({
        success: false,
        error: error.message,
      });
    });

    // Server events
    this.socket.on('user_connected', (data: { success: boolean; message: string; data?: unknown }) => {
      console.log('📡 User connected event:', data);
      if (data.success && data.data) {
        const typedData = data.data as { userId: string; email: string; onlineCount?: number; chatId?: string; onlineUsers?: OnlineUser[] };
        if (typedData.onlineCount !== undefined) {
          this.notifyConnection({
            userId: typedData.userId,
            email: typedData.email,
            onlineCount: typedData.onlineCount,
          });
        }
        if (typedData.onlineUsers) {
          this.notifyOnlineUsers(typedData.onlineUsers);
        }
      }
    });

    this.socket.on('user_disconnected', (data: { userId: string; reason: string }) => {
      console.log('📡 User disconnected event:', data);
    });

    this.socket.on('receive_message', (message: ReceivedMessagePayload) => {
      console.log('📨 Received message:', message);
      this.notifyMessage(message);
    });

    this.socket.on('online_users', (users: OnlineUser[]) => {
      console.log('👥 Online users updated:', users);
      this.notifyOnlineUsers(users);
    });

    this.socket.on('user_presence', (update: UserPresenceUpdate) => {
      console.log('🔄 User presence update:', update);
      this.notifyPresence(update);
    });

    this.socket.on('typing_update', (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => {
      console.log('⌨️ Typing update:', data);
      this.notifyTyping(data);
    });

    this.socket.on('reminder_notification', (notification: ReminderNotificationPayload) => {
      console.log('🔔 Reminder notification:', notification);
      this.notifyReminder(notification);
    });

    this.socket.on('error', (error: { success: boolean; error: string }) => {
      console.error('Socket.io error:', error);
      this.notifyError(error);
    });

    // Message read confirmation
    this.socket.on('message_read', (data: { messageId: string; chatId: string }) => {
      console.log('📖 Message read:', data);
    });
  }

  // ─── Event Subscription Methods ─────────────────────────────────────────────

  /**
   * Subscribe to message events
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to connection events
   */
  public onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Subscribe to disconnection events
   */
  public onDisconnect(handler: DisconnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  /**
   * Subscribe to online users events
   */
  public onOnlineUsers(handler: OnlineUsersHandler): () => void {
    this.onlineUsersHandlers.add(handler);
    return () => this.onlineUsersHandlers.delete(handler);
  }

  /**
   * Subscribe to presence events
   */
  public onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  /**
   * Subscribe to typing events
   */
  public onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  /**
   * Subscribe to error events
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Subscribe to reminder notifications
   */
  public onReminder(handler: ReminderHandler): () => void {
    this.reminderHandlers.add(handler);
    return () => this.reminderHandlers.delete(handler);
  }

  // ─── Event Notification Methods ─────────────────────────────────────────────

  private notifyMessage(message: ReceivedMessagePayload): void {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  private notifyConnection(data: { userId: string; email: string; onlineCount: number }): void {
    this.connectionHandlers.forEach((handler) => handler(data));
  }

  private notifyDisconnection(reason: string): void {
    this.disconnectionHandlers.forEach((handler) => handler(reason));
  }

  private notifyOnlineUsers(users: OnlineUser[]): void {
    this.onlineUsersHandlers.forEach((handler) => handler(users));
  }

  private notifyPresence(update: UserPresenceUpdate): void {
    this.presenceHandlers.forEach((handler) => handler(update));
  }

  private notifyTyping(data: { chatId: string; userId: string; userName: string; isTyping: boolean }): void {
    this.typingHandlers.forEach((handler) => handler(data));
  }

  private notifyError(error: { success: boolean; error: string }): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private notifyReminder(notification: ReminderNotificationPayload): void {
    this.reminderHandlers.forEach((handler) => handler(notification));
  }

  // ─── Socket Actions ─────────────────────────────────────────────────────────

  /**
   * Join a chat room
   * 
   * @param chatId - The chat room ID to join
   */
  public joinChat(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join chat: Socket not connected');
      return;
    }

    console.log('🚪 Joining chat room:', chatId);
    this.socket.emit('join_chat', { chatId });
  }

  /**
   * Send a message to a chat room
   * 
   * @param payload - The message payload
   */
  public sendMessage(payload: SendMessagePayload): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot send message: Socket not connected');
      return;
    }

    console.log('📤 Sending message:', payload);
    this.socket.emit('send_message', {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Start typing indicator
   * 
   * @param chatId - The chat room ID
   * @param userName - Optional user name to display
   */
  public startTyping(chatId: string, userName?: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_start', {
      chatId,
      isTyping: true,
      userName,
    });
  }

  /**
   * Stop typing indicator
   * 
   * @param chatId - The chat room ID
   */
  public stopTyping(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_stop', {
      chatId,
      isTyping: false,
    });
  }

  /**
   * Mark a message as read
   * 
   * @param messageId - The message ID
   * @param chatId - The chat room ID
   */
  public markMessageAsRead(messageId: string, chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('mark_read', { messageId, chatId });
  }

  /**
   * Request online users for a specific room
   * 
   * @param chatId - The chat room ID
   */
  public requestOnlineUsers(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('get_online_users', { chatId });
  }

  /**
   * Leave a chat room
   * 
   * Note: On the client side, we emit a 'leave_chat' event to the server
   * which will handle removing the user from the room.
   * 
   * @param chatId - The chat room ID to leave
   */
  public leaveChat(chatId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    console.log('🚪 Leaving chat room:', chatId);
    // Emit event to server to leave the room
    this.socket.emit('leave_chat', { chatId });
  }

  // ─── Connection State ───────────────────────────────────────────────────────

  /**
   * Check if socket is connected
   */
  public get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the current user
   */
  public get user(): User | null {
    return this.currentUser;
  }

  /**
   * Get the Socket instance
   */
  public get socketInstance(): Socket | null {
    return this.socket;
  }

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  /**
   * Disconnect from the Socket.io server
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.io server');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Remove all event handlers
   */
  public clearHandlers(): void {
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
    this.disconnectionHandlers.clear();
    this.onlineUsersHandlers.clear();
    this.presenceHandlers.clear();
    this.typingHandlers.clear();
    this.errorHandlers.clear();
    this.reminderHandlers.clear();
  }

  /**
   * Reconnect to the server with a new token
   * 
   * @param token - New JWT token
   * @param user - Updated user data
   */
  public reconnect(token: string, user: User): void {
    this.disconnect();
    this.connect(token, user);
  }
}

// ─── Export Singleton Instance ────────────────────────────────────────────────

/**
 * Default export - singleton instance of SocketService
 */
export const socketService = SocketService.getInstance();

// ─── React Hook ───────────────────────────────────────────────────────────────

/**
 * Custom React hook for using socket service
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { socket, connected } = useSocket();
 *   
 *   useEffect(() => {
 *     const unsubscribe = socket.onMessage((message) => {
 *       setMessages(prev => [message, ...prev]);
 *     });
 *     return unsubscribe;
 *   }, [socket]);
 * }
 * ```
 */
export const useSocket = () => {
  const socket = socketService;
  return {
    socket,
    connected: socket.connected,
    user: socket.user,
  };
};

export default socketService;