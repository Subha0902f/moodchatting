/**
 * SocketContext - React Context for Socket.io State Management
 * 
 * This module provides a React Context-based approach to managing socket state
 * across the entire application. It wraps the SocketManager and exposes
 * socket state and actions through a React Context.
 * 
 * Features:
 * - Global socket state management
 * - Automatic connection/disconnection based on auth state
 * - Real-time state updates for all components
 * - Proper cleanup on unmount
 * 
 * @module context/SocketContext
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import type {
  User,
  OnlineUser,
  ReceivedMessagePayload,
  SendMessagePayload,
  TypingUpdateData,
  UserPresenceUpdate,
  ReminderNotificationPayload,
  SocketErrorResponse,
} from '../types/socket.types';
import { socketManager } from '../socket/socket';

// ─── Context Value Type ───────────────────────────────────────────────────────

/**
 * The shape of the SocketContext value
 */
interface SocketContextValue {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  currentUser: User | null;

  // Online users
  onlineUsers: OnlineUser[];

  // Typing users (keyed by userId)
  typingUsers: Map<string, TypingUpdateData>;

  // Current chat room
  currentChatId: string | null;

  // Last error
  lastError: SocketErrorResponse | null;

  // Socket actions
  connect: (token: string, user: User) => void;
  disconnect: () => void;
  reconnect: (token: string, user: User) => void;

  // Chat actions
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  markMessageAsRead: (messageId: string, chatId: string) => void;
  requestOnlineUsers: (chatId: string) => void;

  // Typing actions
  startTyping: (chatId: string, userName?: string) => void;
  stopTyping: (chatId: string) => void;

  // Event subscription helpers
  onMessage: (handler: (message: ReceivedMessagePayload) => void) => () => void;
  onOnlineUsers: (handler: (users: OnlineUser[]) => void) => () => void;
  onPresence: (handler: (update: UserPresenceUpdate) => void) => () => void;
  onTyping: (handler: (data: TypingUpdateData) => void) => () => void;
  onReminder: (handler: (notification: ReminderNotificationPayload) => void) => () => void;
  onError: (handler: (error: SocketErrorResponse) => void) => () => void;
  onDisconnect: (handler: (reason: string) => void) => () => void;
  onConnect: (handler: (data: { userId: string; email: string; onlineCount: number }) => void) => () => void;
}

// ─── Create Context ───────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// ─── Provider Props ───────────────────────────────────────────────────────────

interface SocketProviderProps {
  children: ReactNode;
  /** Optional: Auto-connect when provider mounts with these credentials */
  authToken?: string;
  /** Optional: User to auto-connect with */
  user?: User;
}

// ─── Provider Component ───────────────────────────────────────────────────────

/**
 * SocketProvider - Provides socket functionality to the component tree
 * 
 * This provider manages the socket connection lifecycle and exposes
 * socket state and actions to all child components.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SocketProvider>
 *   <App />
 * </SocketProvider>
 * 
 * // With auto-connect
 * <SocketProvider authToken={token} user={currentUser}>
 *   <App />
 * </SocketProvider>
 * ```
 */
export function SocketProvider({ children, authToken, user }: SocketProviderProps) {
  // Local state for real-time updates
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUpdateData>>(new Map());
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<SocketErrorResponse | null>(null);

  // Refs to store unsubscribe functions
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Helper to register unsubscribe functions
  const registerUnsubscribe = useCallback((unsubscribe: () => void) => {
    unsubscribeRefs.current.push(unsubscribe);
  }, []);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      socketManager.disconnect();
    };
  }, []);

  // Connect function
  const connect = useCallback((token: string, user: User) => {
    setCurrentUser(user);
    setIsConnecting(true);

    // Connect to socket
    socketManager.connect(token, user);

    // Set up event listeners and store unsubscribe functions
    const unsubscribers = [
      socketManager.onConnect((data) => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('SocketContext: Connected as', data.email);
      }),
      socketManager.onDisconnect((reason) => {
        setIsConnected(false);
        setIsConnecting(false);
        console.log('SocketContext: Disconnected -', reason);
      }),
      socketManager.onOnlineUsers((users) => {
        setOnlineUsers(users);
      }),
      socketManager.onPresence((update) => {
        // Update online users based on presence
        setOnlineUsers((prev) => {
          if (update.status === 'online') {
            // Add or update user
            const exists = prev.find((u) => u.id === update.userId);
            if (!exists) {
              // We don't have full user info, so we'll just note they're online
              return [...prev, {
                id: update.userId,
                email: '',
                socketId: update.socketId || '',
                lastSeen: update.timestamp,
              }];
            }
          } else {
            // Remove user or mark as offline
            return prev.filter((u) => u.id !== update.userId);
          }
          return prev;
        });
      }),
      socketManager.onTyping((data) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (data.isTyping) {
            next.set(data.userId, data);
          } else {
            next.delete(data.userId);
          }
          return next;
        });
      }),
      socketManager.onError((error) => {
        setLastError(error);
      }),
      socketManager.onMessage((message) => {
        // Update current chat if needed
        if (message.chatId !== currentChatId) {
          setCurrentChatId(message.chatId);
        }
      }),
    ];

    unsubscribers.forEach(registerUnsubscribe);
  }, [currentChatId, registerUnsubscribe]);

  // Disconnect function
  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentUser(null);
    setOnlineUsers([]);
    setTypingUsers(new Map());
    setCurrentChatId(null);
    setLastError(null);
    unsubscribeRefs.current = [];
  }, []);

  // Reconnect function
  const reconnect = useCallback((token: string, user: User) => {
    disconnect();
    connect(token, user);
  }, [disconnect, connect]);

  // Chat actions
  const joinChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    setTypingUsers(new Map()); // Clear typing users when joining new chat
    socketManager.joinChat(chatId);
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketManager.leaveChat(chatId);
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setTypingUsers(new Map());
    }
  }, [currentChatId]);

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    socketManager.sendMessage(payload);
  }, []);

  const markMessageAsRead = useCallback((messageId: string, chatId: string) => {
    socketManager.markMessageAsRead(messageId, chatId);
  }, []);

  const requestOnlineUsers = useCallback((chatId: string) => {
    socketManager.requestOnlineUsers(chatId);
  }, []);

  // Typing actions
  const startTyping = useCallback((chatId: string, userName?: string) => {
    socketManager.startTyping(chatId, userName);
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    socketManager.stopTyping(chatId);
  }, []);

  // Event subscription helpers (for components that need direct access)
  const onMessage = useCallback((handler: (message: ReceivedMessagePayload) => void) => {
    const unsubscribe = socketManager.onMessage(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onOnlineUsers = useCallback((handler: (users: OnlineUser[]) => void) => {
    const unsubscribe = socketManager.onOnlineUsers(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onPresence = useCallback((handler: (update: UserPresenceUpdate) => void) => {
    const unsubscribe = socketManager.onPresence(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onTyping = useCallback((handler: (data: TypingUpdateData) => void) => {
    const unsubscribe = socketManager.onTyping(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onReminder = useCallback((handler: (notification: ReminderNotificationPayload) => void) => {
    const unsubscribe = socketManager.onReminder(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onError = useCallback((handler: (error: SocketErrorResponse) => void) => {
    const unsubscribe = socketManager.onError(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onDisconnect = useCallback((handler: (reason: string) => void) => {
    const unsubscribe = socketManager.onDisconnect(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  const onConnect = useCallback((handler: (data: { userId: string; email: string; onlineCount: number }) => void) => {
    const unsubscribe = socketManager.onConnect(handler);
    registerUnsubscribe(unsubscribe);
    return unsubscribe;
  }, [registerUnsubscribe]);

  // Memoize context value
  const contextValue = useMemo<SocketContextValue>(() => ({
    // Connection state
    isConnected,
    isConnecting,
    currentUser,

    // Online users
    onlineUsers,

    // Typing users
    typingUsers,

    // Current chat room
    currentChatId,

    // Last error
    lastError,

    // Socket actions
    connect,
    disconnect,
    reconnect,

    // Chat actions
    joinChat,
    leaveChat,
    sendMessage,
    markMessageAsRead,
    requestOnlineUsers,

    // Typing actions
    startTyping,
    stopTyping,

    // Event subscription helpers
    onMessage,
    onOnlineUsers,
    onPresence,
    onTyping,
    onReminder,
    onError,
    onDisconnect,
    onConnect,
  }), [
    isConnected,
    isConnecting,
    currentUser,
    onlineUsers,
    typingUsers,
    currentChatId,
    lastError,
    connect,
    disconnect,
    reconnect,
    joinChat,
    leaveChat,
    sendMessage,
    markMessageAsRead,
    requestOnlineUsers,
    startTyping,
    stopTyping,
    onMessage,
    onOnlineUsers,
    onPresence,
    onTyping,
    onReminder,
    onError,
    onDisconnect,
    onConnect,
  ]);

  // Auto-connect if credentials provided
  useEffect(() => {
    if (authToken && user) {
      connect(authToken, user);
    }
  }, [authToken, user, connect]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// ─── Custom Hook ──────────────────────────────────────────────────────────────

/**
 * useSocket - Hook to access socket context
 * 
 * @returns The socket context value
 * @throws Error if used outside of SocketProvider
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const {
 *     isConnected,
 *     sendMessage,
 *     onMessage,
 *   } = useSocket();
 * 
 *   useEffect(() => {
 *     const unsub = onMessage((msg) => {
 *       setMessages(prev => [msg, ...prev]);
 *     });
 *     return unsub;
 *   }, [onMessage]);
 * 
 *   const handleSend = () => {
 *     sendMessage({ chatId: '123', message: 'Hello!' });
 *   };
 * }
 * ```
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// ─── Utility Hook for Message Handling ────────────────────────────────────────

/**
 * useSocketMessages - Hook specifically for handling messages in a chat
 * 
 * @param chatId - The chat room ID to listen to
 * @param onNewMessage - Callback when a new message is received
 * 
 * @example
 * ```tsx
 * function ChatWindow({ chatId }) {
 *   const [messages, setMessages] = useState([]);
 *   
 *   useSocketMessages(chatId, (msg) => {
 *     setMessages(prev => [...prev, msg]);
 *   });
 * }
 * ```
 */
export function useSocketMessages(
  chatId: string | null,
  onNewMessage: (message: ReceivedMessagePayload) => void
): void {
  const { onMessage, joinChat, leaveChat } = useSocket();

  useEffect(() => {
    if (!chatId) return;

    // Join the chat room
    joinChat(chatId);

    // Subscribe to messages
    const unsubscribe = onMessage((message) => {
      if (message.chatId === chatId) {
        onNewMessage(message);
      }
    });

    // Cleanup on unmount or chatId change
    return () => {
      unsubscribe();
      leaveChat(chatId);
    };
  }, [chatId, onMessage, onNewMessage, joinChat, leaveChat]);
}

// ─── Utility Hook for Typing Indicators ───────────────────────────────────────

/**
 * useSocketTyping - Hook for handling typing indicators in a chat
 * 
 * @param chatId - The chat room ID
 * @param userName - The current user's name to display
 * 
 * @example
 * ```tsx
 * function MessageInput({ chatId, userName }) {
 *   const { startTyping, stopTyping, typingUsers } = useSocketTyping(chatId, userName);
 *   
 *   const handleTyping = () => startTyping(chatId, userName);
 *   const handleStopTyping = () => stopTyping(chatId);
 * }
 * ```
 */
export function useSocketTyping(chatId: string | null, userName?: string) {
  const { typingUsers, startTyping, stopTyping } = useSocket();

  const isTyping = useMemo(() => {
    if (!chatId) return false;
    return Array.from(typingUsers.values()).some(
      (t) => t.chatId === chatId && t.isTyping
    );
  }, [chatId, typingUsers]);

  const typingUserList = useMemo(() => {
    if (!chatId) return [];
    return Array.from(typingUsers.values())
      .filter((t) => t.chatId === chatId && t.isTyping)
      .map((t) => t.userName);
  }, [chatId, typingUsers]);

  return {
    isTyping,
    typingUserList,
    startTyping: (id: string) => startTyping(id, userName),
    stopTyping: (id: string) => stopTyping(id),
  };
}

export default SocketContext;