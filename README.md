# MoodChatting

A full-stack web application for mood-based chatting and social interaction, built with React, TypeScript, Vite, Express, and Supabase.

## 🌟 Features

- **Authentication** - Secure user authentication with Supabase
- **Real-time Chat** - Socket.IO powered instant messaging
- **Blog System** - Create and share blog posts
- **Channels** - Group conversations and community channels
- **Mood Modes** - Express your current mood and filter content
- **Friends System** - Add and manage friends
- **Notepad** - Personal notes and reminders
- **Dashboard** - Overview of your activity and stats

## 🏗️ Project Structure

```
moodchatting/
├── backend/                 # Express.js backend server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── sockets/            # Socket.IO handlers
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── server.ts           # Main server entry point
├── frontend/               # React + Vite frontend
│   ├── app.tsx/            # Main app component
│   ├── context/            # React context providers
│   ├── layouts/            # Page layouts
│   ├── pages/              # Application pages
│   ├── services/           # API and service layers
│   ├── socket/             # Socket.IO client
│   ├── types/              # TypeScript types
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── package.json            # Root package configuration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd moodchatting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Backend Configuration
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the development servers**

   **Option 1: Start both frontend and backend together**
   ```bash
   npm run dev
   ```

   **Option 2: Start them separately**
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health Check: http://localhost:3000/health
   - API Status: http://localhost:3000/api/status

## 📚 Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Socket.IO** - Real-time bidirectional communication
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/:id` - Get user by ID

### Friends
- `GET /friends` - Get all friends
- `POST /friends/request` - Send friend request
- `PUT /friends/accept/:id` - Accept friend request
- `DELETE /friends/:id` - Remove friend

### Chat & Messages
- `GET /chat` - Get all chats
- `GET /chat/:id` - Get chat by ID
- `POST /chat` - Create new chat
- `GET /messages/:chatId` - Get messages in chat
- `POST /messages` - Send message

### Channels
- `GET /channels` - Get all channels
- `POST /channels` - Create channel
- `GET /channels/:id` - Get channel details
- `PUT /channels/:id` - Update channel
- `DELETE /channels/:id` - Delete channel

### Blog
- `GET /blog` - Get all blog posts
- `POST /blog` - Create blog post
- `GET /blog/:id` - Get blog post by ID
- `PUT /blog/:id` - Update blog post
- `DELETE /blog/:id` - Delete blog post

### Mood Modes
- `GET /modes` - Get all mood modes
- `POST /modes` - Set current mood mode
- `PUT /modes/:id` - Update mood mode

### Notes
- `GET /notes` - Get all notes
- `POST /notes` - Create note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Reminders
- `GET /reminders` - Get all reminders
- `POST /reminders` - Create reminder
- `PUT /reminders/:id` - Update reminder
- `DELETE /reminders/:id` - Delete reminder

## 🎨 Frontend Pages

- **Login** - User authentication
- **Dashboard** - Main overview and activity feed
- **Profile** - User profile management
- **Blog** - Blog creation and viewing
- **Chat** - Real-time messaging
- **Channels** - Channel browsing and management
- **Modes** - Mood mode selection
- **Notepad** - Personal notes
- **Settings** - Application settings

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- `users` - User accounts and profiles
- `posts` - Blog posts
- `messages` - Chat messages
- `chats` - Chat conversations
- `channels` - Group channels
- `friends` - Friend relationships
- `mood_modes` - Mood mode configurations
- `notes` - Personal notes
- `reminders` - User reminders

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- CORS protection
- Rate limiting
- Security headers (Helmet)
- Input validation
- SQL injection protection via Supabase

## 🧪 Testing

Currently, basic testing is set up. To run tests:

```bash
npm test
```

## 📦 Build for Production

### Frontend
```bash
npm run build
```

### Backend
```bash
cd backend
npm run build
```

## 🚀 Deployment

### Environment Variables for Production

```env
# Required
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your_production_jwt_secret
```

### Deploy Backend
- Deploy to platforms like Heroku, Railway, Render, or VPS
- Ensure environment variables are set
- Set `NODE_ENV=production`

### Deploy Frontend
- Build the frontend: `npm run build`
- Deploy the `dist` folder to Vercel, Netlify, or your hosting provider
- Update `FRONTEND_URL` in backend environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- React and Vite teams for the excellent frontend tooling
- Socket.IO for real-time capabilities
- All contributors to this project

## 📞 Support

For support, please open an issue in the repository or contact the development team.

---

**Note**: This project is under active development. Some features may be incomplete or subject to change.