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

interface SocketContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  currentUser: User | null;
  onlineUsers: OnlineUser[];
  typingUsers: Map<string, TypingUpdateData>;
  currentChatId: string | null;
  lastError: SocketErrorResponse | null;
  connect: (token: string, user: User) => void;
  disconnect: () => void;
  reconnect: (token: string, user: User) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  markMessageAsRead: (messageId: string, chatId: string) => void;
  requestOnlineUsers: (chatId: string) => void;
  startTyping: (chatId: string, userName?: string) => void;
  stopTyping: (chatId: string) => void;
  onMessage: (handler: (message: ReceivedMessagePayload) => void) => () => void;
  onOnlineUsers: (handler: (users: OnlineUser[]) => void) => () => void;
  onPresence: (handler: (update: UserPresenceUpdate) => void) => () => void;
  onTyping: (handler: (data: TypingUpdateData) => void) => () => void;
  onReminder: (handler: (notification: ReminderNotificationPayload) => void) => () => void;
  onError: (handler: (error: SocketErrorResponse) => void) => () => void;
  onDisconnect: (handler: (reason: string) => void) => () => void;
  onConnect: (handler: (data: { userId: string; email: string; onlineCount: number }) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
  authToken?: string;
  user?: User;
}

export function SocketProvider({ children, authToken, user }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUpdateData>>(new Map());
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<SocketErrorResponse | null>(null);

  // ── refs ──────────────────────────────────────────────────────────────────
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const currentChatIdRef = useRef<string | null>(null);
 
  useEffect(() => {
    return () => {
      unsubscribeRefs.current.forEach((u) => u());
      socketManager.disconnect();
    };
  }, []);

  const connect = useCallback((token: string, user: User) => {
    // Prevent duplicate connections
  

    setCurrentUser(user);
    setIsConnecting(true);
    socketManager.connect(token, user);

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
        setOnlineUsers((prev) => {
          if (update.status === 'online') {
            const exists = prev.find((u) => u.id === update.userId);
            if (!exists) {
              return [...prev, {
                id: update.userId,
                email: '',
                socketId: update.socketId || '',
                lastSeen: update.timestamp,
              }];
            }
          } else {
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
    ];

    unsubscribers.forEach((u) => unsubscribeRefs.current.push(u));
  }, []);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
   
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentUser(null);
    setOnlineUsers([]);
    setTypingUsers(new Map());
    setCurrentChatId(null);
    currentChatIdRef.current = null;
    setLastError(null);
    unsubscribeRefs.current = [];
  }, []);

  const reconnect = useCallback((token: string, user: User) => {

    disconnect();
    connect(token, user);
  }, [disconnect, connect]);

  // ── joinChat and leaveChat both use the same ref ──────────────────────────
  const joinChat = useCallback((chatId: string) => {
    currentChatIdRef.current = chatId;
    setCurrentChatId(chatId);
    setTypingUsers(new Map());
    socketManager.joinChat(chatId);
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketManager.leaveChat(chatId);
    if (currentChatIdRef.current === chatId) {
      currentChatIdRef.current = null;
      setCurrentChatId(null);
      setTypingUsers(new Map());
    }
  }, []);

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    socketManager.sendMessage(payload);
  }, []);

  const markMessageAsRead = useCallback((messageId: string, chatId: string) => {
    socketManager.markMessageAsRead(messageId, chatId);
  }, []);

  const requestOnlineUsers = useCallback((chatId: string) => {
    socketManager.requestOnlineUsers(chatId);
  }, []);

  const startTyping = useCallback((chatId: string, userName?: string) => {
    socketManager.startTyping(chatId, userName);
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    socketManager.stopTyping(chatId);
  }, []);

  // ── event subscriptions — stable, never change ────────────────────────────
  const onMessage = useCallback((handler: (message: ReceivedMessagePayload) => void) => {
    return socketManager.onMessage(handler);
  }, []);

  const onOnlineUsers = useCallback((handler: (users: OnlineUser[]) => void) => {
    return socketManager.onOnlineUsers(handler);
  }, []);

  const onPresence = useCallback((handler: (update: UserPresenceUpdate) => void) => {
    return socketManager.onPresence(handler);
  }, []);

  const onTyping = useCallback((handler: (data: TypingUpdateData) => void) => {
    return socketManager.onTyping(handler);
  }, []);

  const onReminder = useCallback((handler: (notification: ReminderNotificationPayload) => void) => {
    return socketManager.onReminder(handler);
  }, []);

  const onError = useCallback((handler: (error: SocketErrorResponse) => void) => {
    return socketManager.onError(handler);
  }, []);

  const onDisconnect = useCallback((handler: (reason: string) => void) => {
    return socketManager.onDisconnect(handler);
  }, []);

  const onConnect = useCallback((handler: (data: { userId: string; email: string; onlineCount: number }) => void) => {
    return socketManager.onConnect(handler);
  }, []);

  const contextValue = useMemo<SocketContextValue>(() => ({
    isConnected, isConnecting, currentUser, onlineUsers, typingUsers,
    currentChatId, lastError,
    connect, disconnect, reconnect,
    joinChat, leaveChat, sendMessage, markMessageAsRead, requestOnlineUsers,
    startTyping, stopTyping,
    onMessage, onOnlineUsers, onPresence, onTyping, onReminder,
    onError, onDisconnect, onConnect,
  }), [
    isConnected, isConnecting, currentUser, onlineUsers, typingUsers,
    currentChatId, lastError,
    connect, disconnect, reconnect,
    joinChat, leaveChat, sendMessage, markMessageAsRead, requestOnlineUsers,
    startTyping, stopTyping,
    onMessage, onOnlineUsers, onPresence, onTyping, onReminder,
    onError, onDisconnect, onConnect,
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (authToken && user) connect(authToken, user);
  }, [authToken, user]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function useSocketMessages(
  chatId: string | null,
  onNewMessage: (message: ReceivedMessagePayload) => void
): void {
  const { onMessage, joinChat, leaveChat } = useSocket();
  const handlerRef = useRef(onNewMessage);

  // Keep handler ref current without re-running the effect
  useEffect(() => {
    handlerRef.current = onNewMessage;
  });

  useEffect(() => {
    if (!chatId) return;

    joinChat(chatId);

    const unsubscribe = onMessage((message) => {
      if (message.chatId === chatId) {
        handlerRef.current(message);
      }
    });

    return () => {
      unsubscribe();
      leaveChat(chatId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);
}

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