# MoodChatting

MoodChatting is a full-stack social and mood-aware chat application. It brings together messaging, friends, community channels, journaling, reminders, blog posts, and mood modes.

## Current status

The project has a working application structure with a React frontend, an Express API, Supabase integration, and Socket.IO support. The main feature areas are represented in the frontend and backend, but testing, edge-case handling, and deployment hardening are still in progress. Feature presence should not be taken as end-to-end or production verification.

| Area | Current state |
| --- | --- |
| Backend API and middleware | Implemented; needs continued validation |
| Frontend routes and app shell | Implemented |
| Authentication and protected pages | Implemented; needs end-to-end testing |
| Users, profiles, friends, and chat | Implemented in the application structure |
| Channels, blog, notes, and mood modes | Implemented in the application structure |
| Reminders | CRUD and chatbot-related API documented |
| Real-time communication | Socket.IO server and client integration present |
| Automated tests | Not configured yet; `npm test` is a placeholder |
| UI polish and deployment readiness | In progress |

## Features

- Account authentication and protected application routes
- User profiles and friend-related workflows
- Chat and message APIs with Socket.IO support
- Community channels
- Blog posts and personal notes
- Mood/mode selection
- Reminders with documented categories, priorities, recurrence, filtering, and chatbot endpoints
- Dashboard and settings pages

## Technology

- Frontend: React 19, TypeScript, Vite, React Router
- Backend: Node.js, Express 5, TypeScript
- Real-time communication: Socket.IO
- Database and auth integration: Supabase
- Supporting libraries: Axios, Zustand, Helmet, and express-rate-limit

## Project layout

```text
moodchatting/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── types/
│   ├── utils/
│   └── server.ts
├── frontend/
│   ├── app.tsx/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   └── socket/
├── package.json
├── index.html
└── tsconfig.json
```

## Getting started

### Prerequisites

- Node.js and npm
- A Supabase project

### Install dependencies

```bash
npm install
```

### Configure the backend

Create a `.env` file in the project root. The backend currently requires all four Supabase/JWT values below:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=use_a_long_random_secret
```

Optional settings:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_EXPIRES_IN=7d
```

Keep service-role credentials and JWT secrets private. Do not commit `.env` files.

### Start the application

Run the backend from the project root:

```bash
npm run dev
```

In a second terminal, start the Vite frontend:

```bash
npm run dev:frontend
```

The frontend is served by Vite, normally at `http://localhost:5173`. The backend defaults to port `5000`; its `/health` endpoint can be used to check that it is running. The backend checks its Supabase connection during startup.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the backend in watch mode |
| `npm run dev:backend` | Alias for the backend development command |
| `npm run dev:frontend` | Run the Vite frontend |
| `npm start` | Start the backend without watch mode |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Placeholder; automated tests are not configured |

## Documentation

- [backend/REMINDER_CHATBOT_GUIDE.md](backend/REMINDER_CHATBOT_GUIDE.md): Reminder API and chatbot behavior
- [backend/MIDDLEWARE_GUIDE.md](backend/MIDDLEWARE_GUIDE.md): Backend middleware and request flow
- [frontend/socket/SOCKET_GUIDE.md](frontend/socket/SOCKET_GUIDE.md): Socket.IO client usage

## Next steps

- Add automated tests for key API and user flows
- Validate authentication, messaging, and reminder workflows end to end
- Continue UI consistency and edge-case work
- Review environment and deployment configuration before production use

MoodChatting is under active development. APIs and features may change as implementation and validation continue.