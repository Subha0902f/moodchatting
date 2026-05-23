/**
 * ChatWithSocket - Example Chat Component with Socket.io Integration
 * 
 * This component demonstrates how to integrate the socket system
 * into a React chat component with real-time messaging, typing indicators,
 * and online user presence.
 * 
 * @component
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  ReceivedMessagePayload,
  SendMessagePayload,
  OnlineUser,
} from '../types/socket.types';
import { useSocket, useSocketTyping } from '../context/SocketContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message extends Omit<ReceivedMessagePayload, 'senderId' | 'chatId'> {
  id: string;
  isOwn: boolean;
}

interface ChatWithSocketProps {
  /** The chat room ID to connect to */
  chatId: string;
  /** Current user's display name for typing indicators */
  userName: string;
  /** Current user's ID */
  userId: string;
  /** Optional: Custom message renderer */
  renderMessage?: (message: Message) => React.ReactNode;
  /** Optional: Custom online users renderer */
  renderOnlineUsers?: (users: OnlineUser[]) => React.ReactNode;
  /** Optional: Callback when a new message arrives */
  onNewMessage?: (message: ReceivedMessagePayload) => void;
}

// ─── Styles (inline for demo, use CSS modules in production) ──────────────────

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column' as const,
    backgroundColor: '#1a1a2e',
    color: '#eee',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#16213e',
    borderBottom: '1px solid #0f3460',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
  },
  onlineCount: {
    fontSize: '12px',
    color: '#4ade80',
  },
  onlineUsers: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #0f3460',
    overflowX: 'auto' as const,
  },
  onlineUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#0f3460',
    borderRadius: '12px',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4ade80',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  messageWrapper: (isOwn: boolean) => ({
    display: 'flex',
    justifyContent: isOwn ? 'flex-end' : 'flex-start',
  }),
  messageBubble: (isOwn: boolean) => ({
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
    backgroundColor: isOwn ? '#0f3460' : '#16213e',
    border: isOwn ? 'none' : '1px solid #0f3460',
  }),
  messageSender: {
    fontSize: '11px',
    color: '#4ade80',
    marginBottom: '2px',
  },
  messageText: {
    fontSize: '14px',
    lineHeight: 1.4,
  },
  messageTime: {
    fontSize: '10px',
    color: '#888',
    marginTop: '4px',
    textAlign: 'right' as const,
  },
  typingIndicator: {
    padding: '8px 16px',
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#16213e',
    borderTop: '1px solid #0f3460',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #0f3460',
    borderRadius: '20px',
    color: '#eee',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#0f3460',
    border: 'none',
    borderRadius: '20px',
    color: '#eee',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  connectionStatus: {
    padding: '4px 16px',
    fontSize: '11px',
    textAlign: 'center' as const,
    backgroundColor: '#16213e',
    color: '#888',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * ChatWithSocket Component
 * 
 * A fully functional chat component with real-time messaging,
 * typing indicators, and online user presence.
 */
export const ChatWithSocket: React.FC<ChatWithSocketProps> = ({
  chatId,
  userName,
  userId,
  renderMessage,
  renderOnlineUsers,
  onNewMessage,
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Socket context
  const {
    isConnected,
    isConnecting,
    onlineUsers,
    sendMessage,
    startTyping,
    stopTyping,
    onMessage,
    currentChatId,
  } = useSocket();

  // Typing hook
  const { typingUserList } = useSocketTyping(chatId, userName);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onMessage((message: ReceivedMessagePayload) => {
      if (message.chatId === chatId) {
        const newMessage: Message = {
          id: message.id || Date.now().toString(),
          message: message.message,
          timestamp: message.timestamp,
          isOwn: message.senderId === userId,
          senderName: message.senderName,
          status: message.status,
        };

        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // Call custom callback if provided
        onNewMessage?.(message);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chatId, userId, onMessage, onNewMessage]);

  // Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim() && !isInputFocused) {
      startTyping(chatId, userName);
    } else if (!value.trim()) {
      stopTyping(chatId);
    }

    // Debounce typing stop
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (!value.trim()) {
        stopTyping(chatId);
      }
    }, 1000);
  }, [chatId, userName, isInputFocused, startTyping, stopTyping]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsInputFocused(true);
    if (inputValue.trim()) {
      startTyping(chatId, userName);
    }
  }, [chatId, userName, inputValue, startTyping]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsInputFocused(false);
    if (!inputValue.trim()) {
      stopTyping(chatId);
    }
  }, [chatId, inputValue, stopTyping]);

  // Handle send
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || !isConnected) return;

    const payload: SendMessagePayload = {
      chatId,
      message: text,
      timestamp: new Date().toISOString(),
    };

    sendMessage(payload);
    setInputValue('');
    stopTyping(chatId);
  }, [inputValue, isConnected, chatId, sendMessage, stopTyping]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping(chatId);
    };
  }, [chatId, stopTyping]);

  // Format time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Render a single message
  const renderMessageBubble = (msg: Message) => {
    if (renderMessage) {
      return renderMessage(msg);
    }

    return (
      <div key={msg.id} style={styles.messageWrapper(msg.isOwn)}>
        <div style={styles.messageBubble(msg.isOwn)}>
          {!msg.isOwn && msg.senderName && (
            <div style={styles.messageSender}>{msg.senderName}</div>
          )}
          <div style={styles.messageText}>{msg.message}</div>
          {msg.timestamp && (
            <div style={styles.messageTime}>{formatTime(msg.timestamp)}</div>
          )}
        </div>
      </div>
    );
  };

  // Render online users
  const renderOnlineUsersList = () => {
    if (renderOnlineUsers) {
      return renderOnlineUsers(onlineUsers);
    }

    if (onlineUsers.length === 0) return null;

    return (
      <div style={styles.onlineUsers}>
        {onlineUsers.slice(0, 10).map((user) => (
          <div key={user.id} style={styles.onlineUser}>
            <div style={styles.onlineDot} />
            <span>{user.fullName || user.email.split('@')[0]}</span>
          </div>
        ))}
        {onlineUsers.length > 10 && (
          <span style={{ fontSize: '12px', color: '#888' }}>
            +{onlineUsers.length - 10} more
          </span>
        )}
      </div>
    );
  };

  // Connection status message
  const connectionStatus = useMemo(() => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  }, [isConnected, isConnecting]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.headerTitle}>Chat</span>
          {currentChatId && (
            <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
              #{currentChatId.slice(0, 8)}
            </span>
          )}
        </div>
        <span style={styles.onlineCount}>
          {onlineUsers.length} online
        </span>
      </div>

      {/* Online Users */}
      {renderOnlineUsersList()}

      {/* Connection Status */}
      <div style={styles.connectionStatus}>
        {connectionStatus}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map(renderMessageBubble)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUserList.length > 0 && (
        <div style={styles.typingIndicator}>
          {typingUserList.length === 1
            ? `${typingUserList[0]} is typing...`
            : typingUserList.length === 2
              ? `${typingUserList.join(' and ')} are typing...`
              : `${typingUserList[0]} and ${typingUserList.length - 1} others are typing...`
          }
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={styles.input}
          disabled={!isConnected}
        />
        <button
          onClick={handleSend}
          style={{
            ...styles.sendButton,
            opacity: !isConnected || !inputValue.trim() ? 0.5 : 1,
          }}
          disabled={!isConnected || !inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWithSocket;