# Socket.io Frontend Architecture Guide

This guide explains the complete socket architecture for the MoodChat React frontend, including setup, usage patterns, and best practices.

## 📁 Project Structure

```
frontend/
├── types/
│   └── socket.types.ts      # TypeScript interfaces and types
├── socket/
│   ├── socket.ts            # Main SocketManager class
│   ├── index.ts             # Module exports
│   └── SOCKET_GUIDE.md      # This documentation
├── context/
│   └── SocketContext.tsx    # React Context + hooks
├── components/
│   └── ChatWithSocket.tsx   # Example chat component
└── .env                     # Environment variables
```

## 🔧 Environment Configuration

Add these to your `.env` file:

```env
# Socket.io server URL
VITE_SOCKET_URL=http://localhost:5000

# Alternative: Use API URL
VITE_API_URL=http://localhost:5000
```

## 🚀 Quick Start

### 1. Wrap your app with SocketProvider

```tsx
// App.tsx or main.tsx
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, session } = useAuth();

  return (
    <SocketProvider 
      authToken={session?.access_token} 
      user={user ? {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name,
        avatarUrl: user.user_metadata?.avatar_url,
      } : undefined}
    >
      {/* Your app components */}
    </SocketProvider>
  );
}
```

### 2. Use the useSocket hook

```tsx
import { useSocket } from './context/SocketContext';

function MyComponent() {
  const {
    isConnected,
    sendMessage,
    onMessage,
  } = useSocket();

  useEffect(() => {
    const unsubscribe = onMessage((msg) => {
      console.log('New message:', msg);
    });
    return unsubscribe;
  }, [onMessage]);

  const handleSend = () => {
    sendMessage({
      chatId: 'room-123',
      message: 'Hello!',
    });
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSend}>Send Message</button>
    </div>
  );
}
```

## 📖 API Reference

### SocketContext Value

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Whether socket is currently connected |
| `isConnecting` | `boolean` | Whether socket is currently connecting |
| `currentUser` | `User \| null` | Current authenticated user |
| `onlineUsers` | `OnlineUser[]` | List of online users in current room |
| `typingUsers` | `Map<string, TypingUpdateData>` | Users currently typing |
| `currentChatId` | `string \| null` | Current chat room ID |
| `lastError` | `SocketErrorResponse \| null` | Last error that occurred |

### Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `connect` | `(token: string, user: User)` | Connect to socket server |
| `disconnect` | `()` | Disconnect from socket server |
| `reconnect` | `(token: string, user: User)` | Reconnect with new credentials |
| `joinChat` | `(chatId: string)` | Join a chat room |
| `leaveChat` | `(chatId: string)` | Leave a chat room |
| `sendMessage` | `(payload: SendMessagePayload)` | Send a message |
| `startTyping` | `(chatId: string, userName?: string)` | Start typing indicator |
| `stopTyping` | `(chatId: string)` | Stop typing indicator |
| `markMessageAsRead` | `(messageId: string, chatId: string)` | Mark message as read |
| `requestOnlineUsers` | `(chatId: string)` | Request online users list |

### Event Subscribers

| Event | Callback | Description |
|-------|----------|-------------|
| `onMessage` | `(message: ReceivedMessagePayload) => void` | New message received |
| `onConnect` | `(data: ConnectionData) => void` | Connected to server |
| `onDisconnect` | `(reason: string) => void` | Disconnected from server |
| `onOnlineUsers` | `(users: OnlineUser[]) => void` | Online users list updated |
| `onPresence` | `(update: UserPresenceUpdate) => void` | User online/offline status |
| `onTyping` | `(data: TypingUpdateData) => void` | Typing indicator update |
| `onReminder` | `(notification: ReminderNotificationPayload) => void` | Reminder notification |
| `onError` | `(error: SocketErrorResponse) => void` | Socket error |

## 🎯 Utility Hooks

### useSocketMessages

Automatically join a chat room and listen for messages:

```tsx
import { useSocketMessages } from './context/SocketContext';

function ChatWindow({ chatId }) {
  const [messages, setMessages] = useState([]);

  useSocketMessages(chatId, (msg) => {
    setMessages(prev => [...prev, msg]);
  });

  // Component will auto-join/leave chatId
  return <div>{/* render messages */}</div>;
}
```

### useSocketTyping

Handle typing indicators:

```tsx
import { useSocketTyping } from './context/SocketContext';

function MessageInput({ chatId, userName }) {
  const { isTyping, typingUserList, startTyping, stopTyping } = useSocketTyping(chatId, userName);

  return (
    <div>
      {isTyping && (
        <div>
          {typingUserList.length === 1
            ? `${typingUserList[0]} is typing...`
            : `${typingUserList.length} people are typing...`}
        </div>
      )}
      <input 
        onFocus={() => startTyping(chatId)}
        onBlur={() => stopTyping(chatId)}
      />
    </div>
  );
}
```

## 🔌 Direct SocketManager Usage

For advanced use cases, you can use the SocketManager directly:

```tsx
import { socketManager } from './socket/socket';

// Connect
socketManager.connect(token, user);

// Subscribe to events
const unsub = socketManager.onMessage((msg) => {
  console.log('Message:', msg);
});

// Send message
socketManager.sendMessage({ chatId: '123', message: 'Hello!' });

// Cleanup
unsub();
socketManager.disconnect();
```

## 🏗️ Architecture Patterns

### 1. Singleton Pattern

The `SocketManager` uses a singleton pattern to ensure only one socket connection exists:

```typescript
class SocketManager {
  private static instance: SocketManager;
  
  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
}

export const socketManager = SocketManager.getInstance();
```

### 2. Event Handler Management

Event handlers are stored in Sets to prevent duplicates:

```typescript
private messageHandlers: Set<MessageHandler> = new Set();

public onMessage(handler: MessageHandler): () => void {
  this.messageHandlers.add(handler);
  return () => this.messageHandlers.delete(handler); // Unsubscribe
}
```

### 3. Proper Cleanup

All subscriptions return unsubscribe functions:

```tsx
useEffect(() => {
  const unsubscribe = socketManager.onMessage(handleMessage);
  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

## 🛡️ Error Handling

### Connection Errors

```tsx
const { onError } = useSocket();

useEffect(() => {
  const unsub = onError((error) => {
    console.error('Socket error:', error.error);
    // Show error notification
  });
  return unsub;
}, [onError]);
```

### Reconnection

The socket automatically reconnects with exponential backoff. You can monitor reconnection status:

```tsx
const { isConnected, isConnecting } = useSocket();

if (isConnecting) {
  return <div>Reconnecting...</div>;
}

if (!isConnected) {
  return <div>Disconnected. Click to reconnect.</div>;
}
```

## 📝 Best Practices

### 1. Always Clean Up Subscriptions

```tsx
// ✅ Good
useEffect(() => {
  const unsub = onMessage(handleMessage);
  return unsub;
}, [onMessage, handleMessage]);

// ❌ Bad - memory leak
useEffect(() => {
  onMessage(handleMessage);
}, [onMessage, handleMessage]);
```

### 2. Use Context for Global State

Wrap your app with `SocketProvider` at the top level:

```tsx
// App.tsx
<SocketProvider authToken={token} user={user}>
  <AuthProvider>
    <Routes />
  </AuthProvider>
</SocketProvider>
```

### 3. Debounce Typing Indicators

```tsx
const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleTyping = () => {
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }
  
  startTyping(chatId);
  
  typingTimeoutRef.current = setTimeout(() => {
    stopTyping(chatId);
  }, 2000); // Stop after 2 seconds of inactivity
};
```

### 4. Handle Message Deduplication

```tsx
setMessages((prev) => {
  // Check if message already exists
  if (prev.some((m) => m.id === newMessage.id)) {
    return prev;
  }
  return [...prev, newMessage];
});
```

### 5. Optimize Re-renders

Use `useMemo` and `useCallback` for context values:

```tsx
const contextValue = useMemo(() => ({
  isConnected,
  sendMessage,
  // ... other values
}), [isConnected, sendMessage, /* dependencies */]);
```

## 🔧 Troubleshooting

### Socket Not Connecting

1. Check if `VITE_SOCKET_URL` is set correctly
2. Verify backend server is running
3. Check browser console for connection errors
4. Ensure JWT token is valid

### Messages Not Received

1. Verify you've joined the chat room: `joinChat(chatId)`
2. Check if `onMessage` handler is registered
3. Ensure chatId matches between sender and receiver

### Typing Indicators Not Working

1. Make sure both users are in the same chat room
2. Check if `startTyping` and `stopTyping` are called correctly
3. Verify the `userName` parameter is provided

## 📚 Type Definitions

Key types are defined in `frontend/types/socket.types.ts`:

```typescript
interface SendMessagePayload {
  chatId: string;
  message: string;
  mode?: string;
  timestamp?: string;
}

interface ReceivedMessagePayload {
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

interface OnlineUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  socketId: string;
  lastSeen?: string;
}
```

## 🎉 Complete Example

Here's a complete chat component:

```tsx
import React, { useState, useEffect } from 'react';
import { useSocket, useSocketTyping } from './context/SocketContext';

function ChatRoom({ chatId, userId, userName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const { sendMessage, onMessage, onlineUsers } = useSocket();
  const { typingUserList } = useSocketTyping(chatId, userName);

  // Listen for messages
  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.chatId === chatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, isOwn: msg.senderId === userId }];
        });
      }
    });
    return unsub;
  }, [chatId, userId, onMessage]);

  // Send message
  const handleSend = () => {
    if (!input.trim()) return;
    
    sendMessage({
      chatId,
      message: input.trim(),
    });
    
    setInput('');
  };

  return (
    <div>
      <div>
        <strong>Online:</strong> {onlineUsers.length} users
      </div>
      
      <div>
        {messages.map(msg => (
          <div key={msg.id} style={{ 
            textAlign: msg.isOwn ? 'right' : 'left' 
          }}>
            <strong>{msg.senderName || 'Anonymous'}:</strong>
            <span>{msg.message}</span>
          </div>
        ))}
        {typingUserList.length > 0 && (
          <div style={{ fontStyle: 'italic', color: '#888' }}>
            {typingUserList.join(', ')} typing...
          </div>
        )}
      </div>
      
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;
```

---

For more examples, see `frontend/components/ChatWithSocket.tsx`.