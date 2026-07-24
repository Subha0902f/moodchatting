import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  ReceivedMessagePayload,
  SendMessagePayload,
  OnlineUser,
} from '../types/socket.types';
import { useSocket, useSocketMessages, useSocketTyping } from '../context/SocketContext';

interface Message extends Omit<ReceivedMessagePayload, 'senderId' | 'chatId'> {
  id: string;
  isOwn: boolean;
}

interface ChatWithSocketProps {
  chatId: string;
  userName: string;
  userId: string;
  contactName?: string;
  renderMessage?: (message: Message) => React.ReactNode;
  renderOnlineUsers?: (users: OnlineUser[]) => React.ReactNode;
  onNewMessage?: (message: ReceivedMessagePayload) => void;
}

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column' as const,
    backgroundColor: '#07090f',
    color: '#eee',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#0d1117',
    borderBottom: '1px solid #1e2530',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#e6e6e6',
  },
  onlineCount: {
    fontSize: '12px',
    color: '#c8f53d',
  },
  onlineUsers: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#07090f',
    borderBottom: '1px solid #1e2530',
    overflowX: 'auto' as const,
  },
  onlineUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#1e2530',
    borderRadius: '12px',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#c8f53d',
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
    backgroundColor: isOwn ? '#1a3a1a' : '#1e2530',
    border: isOwn ? '1px solid rgba(200,245,61,0.2)' : '1px solid #2a3040',
  }),
  messageSender: {
    fontSize: '11px',
    color: '#c8f53d',
    marginBottom: '2px',
  },
  messageText: {
    fontSize: '14px',
    lineHeight: 1.4,
    color: '#e6e6e6',
  },
  messageTime: {
    fontSize: '10px',
    color: '#666',
    marginTop: '4px',
    textAlign: 'right' as const,
  },
  typingIndicator: {
    padding: '8px 16px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#0d1117',
    borderTop: '1px solid #1e2530',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#1e2530',
    border: '1px solid #2a3040',
    borderRadius: '20px',
    color: '#eee',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#c8f53d',
    border: 'none',
    borderRadius: '20px',
    color: '#0a0a0a',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  connectionStatus: {
    padding: '4px 16px',
    fontSize: '11px',
    textAlign: 'center' as const,
    backgroundColor: '#0d1117',
    color: '#666',
  },
};

export const ChatWithSocket: React.FC<ChatWithSocketProps> = ({
  chatId,
  userName,
  userId,
  contactName,
  renderMessage,
  renderOnlineUsers,
  onNewMessage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isConnected,
    isConnecting,
    onlineUsers,
    sendMessage,
    startTyping,
    stopTyping,
    requestOnlineUsers,
  } = useSocket();

  const { typingUserList } = useSocketTyping(chatId, userName);

  // ── Message handler — stable ref so listener doesn't re-register ──────────
  const handleNewMessage = useCallback((message: ReceivedMessagePayload) => {
    console.log('Message received:', message);
    const newMessage: Message = {
      id: message.id || Date.now().toString(),
      message: message.message,
      timestamp: message.timestamp,
      isOwn: message.senderId === userId,
      senderName: message.senderName,
      status: message.status,
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });

    onNewMessage?.(message);
  }, [userId, onNewMessage]);

  useSocketMessages(chatId, handleNewMessage);

  useEffect(() => {
    if (!chatId) return;
    requestOnlineUsers(chatId);
  }, [chatId, requestOnlineUsers]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.trim()) {
      startTyping(chatId, userName);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chatId);
    }, 1000);
  }, [chatId, userName, startTyping, stopTyping]);

  // ── Send — no isConnected gate so it always fires ─────────────────────────
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
      console.log('handleSend called, text:', text); 
    if (!text) return;

  console.log('Sending message:', { chatId, message: text });
    console.log('Sending message:', { chatId, message: text });

    const payload: SendMessagePayload = {
      chatId,
      message: text,
      timestamp: new Date().toISOString(),
    };

    sendMessage(payload);
    setInputValue('');
    stopTyping(chatId);
  }, [inputValue, chatId, sendMessage, stopTyping]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      stopTyping(chatId);
    };
  }, [chatId, stopTyping]);

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessageBubble = (msg: Message) => {
    if (renderMessage) return renderMessage(msg);
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

  const renderOnlineUsersList = () => {
    if (renderOnlineUsers) return renderOnlineUsers(onlineUsers);
    if (onlineUsers.length === 0) return null;
    return (
      <div style={styles.onlineUsers}>
        {onlineUsers.slice(0, 10).map((user) => (
          <div key={user.id} style={styles.onlineUser}>
            <div style={styles.onlineDot} />
            <span>{user.fullName || user.email?.split('@')[0]}</span>
          </div>
        ))}
        {onlineUsers.length > 10 && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            +{onlineUsers.length - 10} more
          </span>
        )}
      </div>
    );
  };

  const connectionStatus = useMemo(() => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  }, [isConnected, isConnecting]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>{contactName || 'Chat'}</span>
        <span style={styles.onlineCount}>{onlineUsers.length} online</span>
      </div>

      {renderOnlineUsersList()}

      <div style={styles.connectionStatus}>{connectionStatus}</div>

      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map(renderMessageBubble)
        )}
        <div ref={messagesEndRef} />
      </div>

      {typingUserList.length > 0 && (
        <div style={styles.typingIndicator}>
          {typingUserList.length === 1
            ? `${typingUserList[0]} is typing...`
            : `${typingUserList[0]} and ${typingUserList.length - 1} others are typing...`}
        </div>
      )}

      <div style={styles.inputArea}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button
          onClick={handleSend}
          style={{
            ...styles.sendButton,
            opacity: !inputValue.trim() ? 0.5 : 1,
          }}
          disabled={!inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWithSocket;