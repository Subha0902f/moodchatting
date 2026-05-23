/**
 * Socket.io Connection Manager for MoodChat Frontend
 * 
 * This module provides a centralized, singleton-based socket connection manager
 * that handles all WebSocket communication with the backend server.
 * 
 * Features:
 * - JWT-based authentication
 * - Auto-reconnection with exponential backoff
 * - Event-driven architecture
 * - Type-safe event handling
 * - Proper cleanup and listener management
 * 
 * @module socket/socket
 */

import { io, Socket } from 'socket.io-client';
import type {
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
import { ClientEvents, ServerEvents } from '../types/socket.types';

// ─── Environment Configuration ──────────────────────────────────────────────────

/**
 * Get environment variable safely (Vite-specific)
 * Returns undefined if the variable doesn't exist
 */
const getEnvVar = (key: string): string | undefined => {
  try {
    // @ts-expect-error - import.meta.env is a Vite feature
    return import.meta.env?.[key] as string | undefined;
  } catch {
    return undefined;
  }
};

/**
 * Default socket configuration
 */
const DEFAULT_CONFIG: Omit<SocketConfig, 'url' | 'authToken'> = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  timeout: 20000,
  transports: ['websocket', 'polling'],
};

// ─── Socket Manager Class ───────────────────────────────────────────────────────

/**
 * SocketManager - Singleton class for managing Socket.io connections
 * 
 * This class provides a centralized way to manage WebSocket connections
 * throughout the application. It handles authentication, event subscription,
 * and connection lifecycle management.
 * 
 * @example
 * ```typescript
 * // Get the singleton instance
 * const socketManager = SocketManager.getInstance();
 * 
 * // Connect with authentication
 * socketManager.connect(authToken, currentUser);
 * 
 * // Subscribe to events
 * const unsubscribe = socketManager.onMessage((message) => {
 *   console.log('New message:', message);
 * });
 * 
 * // Send a message
 * socketManager.sendMessage({ chatId: '123', message: 'Hello!' });
 * 
 * // Cleanup
 * unsubscribe();
 * socketManager.disconnect();
 * ```
 */
class SocketManager {
  private static instance: SocketManager;
  
  // Socket instance
  private socket: Socket | null = null;
  
  // Current state (private field with different name to avoid conflict with getter)
  private _state: SocketState = {
    isConnected: false,
    isConnecting: false,
    currentUser: null,
    authToken: null,
    onlineUsers: [],
    typingUsers: new Map(),
    currentChatId: null,
    lastError: null,
  };

  // Event handler storage - using Sets to prevent duplicate handlers
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<DisconnectionHandler> = new Set();
  private onlineUsersHandlers: Set<OnlineUsersHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reminderHandlers: Set<ReminderHandler> = new Set();
  private connectionErrorHandlers: Set<ConnectionErrorHandler> = new Set();

  // Track registered socket listeners to prevent duplicates
  private socketListenersRegistered = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of SocketManager
   */
  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  // ─── Connection Management ──────────────────────────────────────────────────

  /**
   * Initialize and connect to the Socket.io server
   * 
   * @param authToken - JWT authentication token
   * @param user - Current user data
   * @param customConfig - Optional custom configuration
   * @returns The Socket instance
   */
  public connect(
    authToken: string,
    user: User,
    customConfig?: Partial<SocketConfig>
  ): Socket {
    // Store auth token and user
    this._state.authToken = authToken;
    this._state.currentUser = user;
    this._state.isConnecting = true;

    // Merge configurations
    const config: SocketConfig = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      url: customConfig?.url || this.getSocketUrl(),
      authToken,
    };

    console.log('🔌 Connecting to Socket.io server:', config.url);

    // Create socket connection
    this.socket = io(config.url, {
      auth: {
        token: config.authToken,
      },
      transports: config.transports,
      reconnection: config.reconnection,
      reconnectionDelay: config.reconnectionDelay,
      reconnectionDelayMax: config.reconnectionDelayMax,
      reconnectionAttempts: config.reconnectionAttempts,
      timeout: config.timeout,
      autoConnect: true,
      forceNew: false, // Reuse existing connection if available
    });

    // Set up event listeners (only once)
    if (!this.socketListenersRegistered) {
      this.setupEventListeners();
      this.socketListenersRegistered = true;
    }

    return this.socket;
  }

  /**
   * Get socket URL from environment variables
   */
  private getSocketUrl(): string {
    const socketUrl = getEnvVar('VITE_SOCKET_URL');
    const apiUrl = getEnvVar('VITE_API_URL');
    
    if (socketUrl) {
      return socketUrl;
    }
    if (apiUrl) {
      return apiUrl;
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
  }

  /**
   * Set up all Socket.io event listeners
   * This method is called once during connection
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // ─── Connection Events ────────────────────────────────────────────────────

    this.socket.on(ServerEvents.CONNECT, () => {
      this._state.isConnected = true;
      this._state.isConnecting = false;
      console.log('✅ Socket.io connected successfully');
      
      // Notify connection handlers
      this.notifyConnection({
        userId: this._state.currentUser?.id || '',
        email: this._state.currentUser?.email || '',
        onlineCount: 0,
      });
    });

    this.socket.on(ServerEvents.DISCONNECT, (reason: string) => {
      this._state.isConnected = false;
      this._state.isConnecting = false;
      console.log('❌ Socket.io disconnected:', reason);
      this.notifyDisconnection(reason);
    });

    this.socket.on(ServerEvents.CONNECT_ERROR, (error: Error) => {
      this._state.isConnecting = false;
      this._state.isConnected = false;
      console.error('Socket.io connection error:', error);
      this.notifyConnectionError(error);
    });

    this.socket.on(ServerEvents.RECONNECT, (attemptNumber: number) => {
      console.log('🔄 Socket.io reconnecting (attempt', attemptNumber + ')');
    });

    this.socket.on(ServerEvents.RECONNECT_ERROR, (error: Error) => {
      console.error('Socket.io reconnection error:', error);
    });

    // ─── Server Events ────────────────────────────────────────────────────────

    // User connected event
    this.socket.on(ServerEvents.USER_CONNECTED, (data) => {
      console.log('📡 User connected event:', data);
      if (data.success && data.data) {
        const typedData = data.data as {
          userId: string;
          email: string;
          onlineCount?: number;
          chatId?: string;
          onlineUsers?: OnlineUser[];
        };
        
        if (typedData.onlineCount !== undefined) {
          this.notifyConnection({
            userId: typedData.userId,
            email: typedData.email,
            onlineCount: typedData.onlineCount,
          });
        }
        
        if (typedData.onlineUsers) {
          this._state.onlineUsers = typedData.onlineUsers;
          this.notifyOnlineUsers(typedData.onlineUsers);
        }
      }
    });

    // Receive message event
    this.socket.on(ServerEvents.RECEIVE_MESSAGE, (message: ReceivedMessagePayload) => {
      console.log('📨 Received message:', message);
      this.notifyMessage(message);
    });

    // Online users list update
    this.socket.on(ServerEvents.ONLINE_USERS, (users: OnlineUser[]) => {
      console.log('👥 Online users updated:', users);
      this._state.onlineUsers = users;
      this.notifyOnlineUsers(users);
    });

    // User presence update (online/offline)
    this.socket.on(ServerEvents.USER_PRESENCE, (update: UserPresenceUpdate) => {
      console.log('🔄 User presence update:', update);
      this.notifyPresence(update);
    });

    // Typing indicator update
    this.socket.on(ServerEvents.TYPING_UPDATE, (data: TypingUpdateData) => {
      console.log('⌨️ Typing update:', data);
      
      // Update typing users map
      if (data.isTyping) {
        this._state.typingUsers.set(data.userId, data);
      } else {
        this._state.typingUsers.delete(data.userId);
      }
      
      this.notifyTyping(data);
    });

    // Reminder notification
    this.socket.on(ServerEvents.REMINDER_NOTIFICATION, (notification: ReminderNotificationPayload) => {
      console.log('🔔 Reminder notification:', notification);
      this.notifyReminder(notification);
    });

    // Error event
    this.socket.on(ServerEvents.ERROR, (error: { success: boolean; error: string; code?: string }) => {
      console.error('Socket.io error:', error);
      this._state.lastError = error as SocketErrorResponse;
      this.notifyError(error as SocketErrorResponse);
    });

    // Message read confirmation
    this.socket.on(ServerEvents.MESSAGE_READ, (data: { messageId: string; chatId: string }) => {
      console.log('📖 Message read confirmation:', data);
    });

    // User disconnected event
    this.socket.on(ServerEvents.USER_DISCONNECTED, (data: { userId: string; reason: string }) => {
      console.log('📡 User disconnected event:', data);
    });
  }

  // ─── Event Subscription Methods ─────────────────────────────────────────────

  /**
   * Subscribe to message received events
   * @param handler - Callback function for message events
   * @returns Unsubscribe function
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to connection events
   * @param handler - Callback function for connection events
   * @returns Unsubscribe function
   */
  public onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Subscribe to disconnection events
   * @param handler - Callback function for disconnection events
   * @returns Unsubscribe function
   */
  public onDisconnect(handler: DisconnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  /**
   * Subscribe to online users list updates
   * @param handler - Callback function for online users events
   * @returns Unsubscribe function
   */
  public onOnlineUsers(handler: OnlineUsersHandler): () => void {
    this.onlineUsersHandlers.add(handler);
    return () => this.onlineUsersHandlers.delete(handler);
  }

  /**
   * Subscribe to user presence updates (online/offline)
   * @param handler - Callback function for presence events
   * @returns Unsubscribe function
   */
  public onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  /**
   * Subscribe to typing indicator updates
   * @param handler - Callback function for typing events
   * @returns Unsubscribe function
   */
  public onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  /**
   * Subscribe to socket error events
   * @param handler - Callback function for error events
   * @returns Unsubscribe function
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Subscribe to reminder notifications
   * @param handler - Callback function for reminder events
   * @returns Unsubscribe function
   */
  public onReminder(handler: ReminderHandler): () => void {
    this.reminderHandlers.add(handler);
    return () => this.reminderHandlers.delete(handler);
  }

  /**
   * Subscribe to connection error events
   * @param handler - Callback function for connection error events
   * @returns Unsubscribe function
   */
  public onConnectionError(handler: ConnectionErrorHandler): () => void {
    this.connectionErrorHandlers.add(handler);
    return () => this.connectionErrorHandlers.delete(handler);
  }

  // ─── Event Notification Methods (Private) ───────────────────────────────────

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

  private notifyTyping(data: TypingUpdateData): void {
    this.typingHandlers.forEach((handler) => handler(data));
  }

  private notifyError(error: SocketErrorResponse): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private notifyReminder(notification: ReminderNotificationPayload): void {
    this.reminderHandlers.forEach((handler) => handler(notification));
  }

  private notifyConnectionError(error: Error): void {
    this.connectionErrorHandlers.forEach((handler) => handler(error));
  }

  // ─── Socket Actions ─────────────────────────────────────────────────────────

  /**
   * Join a chat room
   * @param chatId - The chat room ID to join
   */
  public joinChat(chatId: string): void {
    if (!this.socket || !this._state.isConnected) {
      console.warn('Cannot join chat: Socket not connected');
      return;
    }

    console.log('🚪 Joining chat room:', chatId);
    this._state.currentChatId = chatId;
    this.socket.emit(ClientEvents.JOIN_CHAT, { chatId });
  }

  /**
   * Leave a chat room
   * @param chatId - The chat room ID to leave
   */
  public leaveChat(chatId: string): void {
    if (!this.socket || !this._state.isConnected) {
      console.warn('Cannot leave chat: Socket not connected');
      return;
    }

    console.log('🚪 Leaving chat room:', chatId);
    this.socket.emit(ClientEvents.LEAVE_CHAT, { chatId });
    
    // Clear typing users for this room
    this._state.typingUsers.clear();
    this._state.currentChatId = null;
  }

  /**
   * Send a message to a chat room
   * @param payload - The message payload
   */
  public sendMessage(payload: SendMessagePayload): void {
    if (!this.socket || !this._state.isConnected) {
      console.warn('Cannot send message: Socket not connected');
      return;
    }

    console.log('📤 Sending message:', payload);
    this.socket.emit(ClientEvents.SEND_MESSAGE, {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Start typing indicator
   * @param chatId - The chat room ID
   * @param userName - Optional user name to display
   */
  public startTyping(chatId: string, userName?: string): void {
    if (!this.socket || !this._state.isConnected) {
      return;
    }

    const payload: TypingPayload = {
      chatId,
      isTyping: true,
      userName,
    };
    this.socket.emit(ClientEvents.TYPING_START, payload);
  }

  /**
   * Stop typing indicator
   * @param chatId - The chat room ID
   */
  public stopTyping(chatId: string): void {
    if (!this.socket || !this._state.isConnected) {
      return;
    }

    const payload: TypingPayload = {
      chatId,
      isTyping: false,
    };
    this.socket.emit(ClientEvents.TYPING_STOP, payload);
  }

  /**
   * Mark a message as read
   * @param messageId - The message ID
   * @param chatId - The chat room ID
   */
  public markMessageAsRead(messageId: string, chatId: string): void {
    if (!this.socket || !this._state.isConnected) {
      return;
    }

    this.socket.emit(ClientEvents.MARK_READ, { messageId, chatId });
  }

  /**
   * Request online users for a specific room
   * @param chatId - The chat room ID
   */
  public requestOnlineUsers(chatId: string): void {
    if (!this.socket || !this._state.isConnected) {
      return;
    }

    this.socket.emit(ClientEvents.GET_ONLINE_USERS, { chatId });
  }

  // ─── Connection State Getters ───────────────────────────────────────────────

  /**
   * Check if socket is currently connected
   */
  public get connected(): boolean {
    return this._state.isConnected;
  }

  /**
   * Check if socket is currently connecting
   */
  public get connecting(): boolean {
    return this._state.isConnecting;
  }

  /**
   * Get the current authenticated user
   */
  public get currentUser(): User | null {
    return this._state.currentUser;
  }

  /**
   * Get the current socket instance
   */
  public get socketInstance(): Socket | null {
    return this.socket;
  }

  /**
   * Get the current socket state
   */
  public get socketState(): SocketState {
    return { ...this._state };
  }

  /**
   * Get online users in current chat room
   */
  public get onlineUsers(): OnlineUser[] {
    return [...this._state.onlineUsers];
  }

  /**
   * Get typing users in current chat room
   */
  public get typingUsers(): Map<string, TypingUpdateData> {
    return new Map(this._state.typingUsers);
  }

  /**
   * Get current chat room ID
   */
  public get currentChatId(): string | null {
    return this._state.currentChatId;
  }

  // ─── Cleanup Methods ────────────────────────────────────────────────────────

  /**
   * Disconnect from the Socket.io server
   * This will remove all listeners and close the connection
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.io server');
      
      // Remove all socket listeners
      this.socket.removeAllListeners();
      
      // Disconnect
      this.socket.disconnect();
      
      // Clear state
      this.socket = null;
      this._state.isConnected = false;
      this._state.isConnecting = false;
      this._state.currentChatId = null;
      this._state.typingUsers.clear();
      this._state.onlineUsers = [];
      this.socketListenersRegistered = false;
    }
  }

  /**
   * Remove all event handlers
   * This does not disconnect, just clears subscriptions
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
    this.connectionErrorHandlers.clear();
  }

  /**
   * Reconnect to the server with a new token
   * @param authToken - New JWT token
   * @param user - Updated user data
   */
  public reconnect(authToken: string, user: User): void {
    this.disconnect();
    this.connect(authToken, user);
  }

  /**
   * Reset the socket manager to initial state
   * Useful for testing or when user logs out
   */
  public reset(): void {
    this.disconnect();
    this.clearHandlers();
    this._state = {
      isConnected: false,
      isConnecting: false,
      currentUser: null,
      authToken: null,
      onlineUsers: [],
      typingUsers: new Map(),
      currentChatId: null,
      lastError: null,
    };
  }
}

// ─── Export Singleton Instance ────────────────────────────────────────────────

/**
 * Default export - singleton instance of SocketManager
 * 
 * @example
 * ```typescript
 * import socketManager from './socket/socket';
 * 
 * // Connect
 * socketManager.connect(token, user);
 * 
 * // Subscribe to events
 * const unsub = socketManager.onMessage(setMessage);
 * 
 * // Cleanup
 * return () => {
 *   unsub();
 *   socketManager.disconnect();
 * };
 * ```
 */
export const socketManager = SocketManager.getInstance();

// Named export for class (useful for testing)
export { SocketManager };

export default socketManager;