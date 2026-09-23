# MoodChatting

MoodChatting is a full-stack social and mood-aware chat application built to combine messaging, personal journaling, reminders, community channels, and emotional tracking in a single platform.

## Project status

This project is in active development and has already reached a solid foundation stage. The app has a working backend structure, frontend pages, database integration, and several core features connected together.

Current overall status:
- Backend foundation: complete
- Frontend app shell: complete
- Authentication and protected routes: implemented
- User management and profiles: implemented
- Friend system: implemented in structure and flow
- Chat and real-time messaging: implemented
- Channels: implemented
- Notes and blog features: implemented
- Mood/mode features: implemented
- Reminder system: implemented
- UI polish and stabilization: still in progress
- End-to-end testing and deployment readiness: planned

## What we have done so far

### Core application foundation
- Set up a full Express + TypeScript backend with modular controllers, routes, middleware, and utilities
- Configured a Vite + React + TypeScript frontend app structure
- Added environment configuration and Supabase integration
- Set up middleware for CORS, Helmet security headers, rate limiting, validation, and error handling
- Implemented Socket.IO infrastructure for real-time communication

### Authentication and user flow
- Built auth routes and protected middleware
- Added user account-related endpoints and access checks
- Integrated JWT-based request protection for secured routes
- Added role-aware access patterns for protected API endpoints

### Social and messaging features
- Built user/friend relationship logic and friend routes
- Implemented chat routes and message handling
- Added real-time socket communication for messaging interactions
- Included support for channels/community-style communication

### Content and productivity features
- Added blog-related routes and controllers
- Added note-taking routes for personal journaling
- Implemented mood/mode management routes and related frontend pages
- Added a reminder system with categories, priorities, recurring rules, filtering, and summary stats
- Built dashboard-style sections to support overview and workflow tracking

### Security and quality work
- Added API protection, validation, and structured error responses
- Used typed request patterns for authenticated users
- Kept backend structure organized around controllers, models, and routes
- Added project documentation for reminders, middleware, and socket usage

## Tech stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Real-time layer: Socket.IO
- Database: Supabase / PostgreSQL
- Authentication: JWT and Supabase-based patterns
- Styling: custom frontend styling and component-based UI

## Project structure

```bash
moodchatting/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── types/
│   ├── utils/
│   ├── server.ts
│   ├── MIDDLEWARE_GUIDE.md
│   └── REMINDER_CHATBOT_GUIDE.md
├── frontend/
│   ├── app.tsx/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── socket/
│   └── types/
├── package.json
├── README.md
├── tsconfig.json
├── vite_index.html
└── .env.example (if used in your environment)
```

## Current feature status

| Area | Status |
| --- | --- |
| Backend setup | ✅ Complete |
| Frontend app setup | ✅ Complete |
| Auth flow | ✅ Implemented |
| Users and profiles | ✅ Implemented |
| Friends system | ✅ Implemented |
| Chat and messaging | ✅ Implemented |
| Channels | ✅ Implemented |
| Blog | ✅ Implemented |
| Notes | ✅ Implemented |
| Mood / mode system | ✅ Implemented |
| Reminder system | ✅ Implemented |
| UI polishing | 🔧 In progress |
| Testing | ⏳ Planned |
| Deployment hardening | ⏳ Planned |

## Getting started

### Prerequisites
- Node.js 18+
- npm
- A Supabase project and valid environment variables

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root with values similar to:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

### Run the app

```bash
npm run dev
```

This starts the backend development server for the app.

### Type check

```bash
npm run typecheck
```

## Key documentation

- [backend/REMINDER_CHATBOT_GUIDE.md](backend/REMINDER_CHATBOT_GUIDE.md) - Reminder system documentation
- [backend/MIDDLEWARE_GUIDE.md](backend/MIDDLEWARE_GUIDE.md) - Middleware and backend request flow
- [frontend/socket/SOCKET_GUIDE.md](frontend/socket/SOCKET_GUIDE.md) - Socket.IO usage and real-time communication

## Roadmap

### Phase 1: Foundation
- ✅ Project structure and architecture
- ✅ Backend and frontend setup
- ✅ Database and config wiring
- ✅ Secure API foundation

### Phase 2: Feature completion
- ✅ Authentication and users
- ✅ Friends, chat, channels
- ✅ Notes, blog, mood, and reminders
- ✅ Real-time communication

### Phase 3: Production readiness
- 🔧 Fixing edge cases and validation
- 🔧 UI consistency and polish
- 🔧 Testing and regression checks
- 🔧 Deployment readiness and final cleanup

## Notes

MoodChatting is no longer just an idea or a blank project structure. It already includes the major building blocks for a meaningful social and mood-aware app. The remaining work is focused on refinement, stabilization, and final hardening rather than rebuilding the foundation from scratch.

The project is in a healthy intermediate stage: the core features exist, the architecture is in place, and the next steps are about making the experience smoother, more reliable, and ready for broader use.


---

**Note**: This project is under active development. Some features may be incomplete or subject to change.