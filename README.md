# MoodChatting

MoodChatting is a full-stack social and mood-based chatting app designed to combine communication, personal notes, reminders, and emotional context in one experience.

This project is currently in active development. The core structure is already in place, and a solid foundation has been built, but it is not yet a polished production-ready app. That is normal for a real project at this stage, and the goal is to keep improving it steadily.

## Current status

Overall progress: about 60-70% of the core build is complete.

### Progress snapshot

- Backend foundation: ✅ Completed
- Authentication flow: ✅ Mostly working
- Database and model setup: ✅ In place
- Chat structure and real-time flow: ✅ Core setup exists
- Friends / social features: 🔧 In progress
- Blog and note features: 🔧 In progress
- Mood and dashboard features: 🔧 In progress
- UI polish and user experience: 🔧 In progress
- Testing, bug-fixing, and deployment readiness: ⏳ Planned

### A realistic view

This project is not "unfinished because it failed"; it is an active build with a good base and several features already connected. The remaining work is mostly about tightening the experience, finishing feature loops, fixing edge cases, and polishing the app so it feels smooth and complete.

If you are reading this project as a contributor or visitor, the important thing to know is: the foundation is healthy, and the work is progressing in the right direction.

---

## Project overview

### Core features

- User authentication and account flow
- Real-time messaging with Socket.IO
- Friend and social connection system
- Community channels
- Mood-based interaction and mode selection
- Notes and personal journaling
- Blog post system
- Reminder system with chatbot-style creation support
- Dashboard overview for activity and reminders

### Tech stack

- Frontend: React, TypeScript, Vite
- Backend: Express, TypeScript, Node.js
- Real-time layer: Socket.IO
- Database: Supabase / PostgreSQL
- Authentication: Supabase + JWT patterns

---

## What is already working well

- Project structure is organized and modular
- Backend routes and controllers are in place
- Frontend pages and routing are established
- Supabase integration and config are set up
- Reminder logic and chatbot-related flows are implemented
- Core app concepts are already connected in a meaningful way

## What still needs attention

- Final end-to-end testing across pages and actions
- UX polishing and visual consistency
- More edge-case fixes in chat and social flows
- Final validation of data flow between frontend and backend
- Deployment hardening and environment clean-up
- Quality checks and final feature stabilization

This is the kind of work that does not make the project weak; it simply means the project is being refined from a strong base.

---

## Folder structure

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
│   └── server.ts
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
└── vite_index.html
```

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Supabase project setup

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file in the root with values similar to:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
```

### Run the app

```bash
npm run dev
```

This starts the development server for the backend and the app foundation in the project environment.

---

## Roadmap

### Phase 1: Foundation
- ✅ Project structure setup
- ✅ Backend architecture
- ✅ Frontend app shell
- ✅ Database/config wiring

### Phase 2: Feature completion
- ✅ Core modules and flows
- 🔧 Social and chat refinement
- 🔧 Notes, blog, and dashboard polish
- 🔧 Reminder logic finalization

### Phase 3: Stability and quality
- ⏳ Bug fixing and validation
- ⏳ UI consistency improvements
- ⏳ Testing and optimization
- ⏳ Final deployment readiness

---

## Encouragement

A project like this is not defined only by how complete it looks today. It is defined by the fact that the foundation is solid, the ideas are clear, and the work is moving forward.

This app is already beyond the idea stage. It has structure, systems, and features in motion. The next step is not a restart; it is refinement.

The goal is not perfection right away. The goal is steady progress, stronger features, and a product that becomes easier to trust with each iteration.

---

## Notes

This README reflects the current development state honestly and positively. The project is still evolving, but it has a meaningful foundation and a clear direction.

If you are a contributor, feel free to build on the existing structure. If you are a visitor, consider this a strong early-stage product in progress rather than a dead or abandoned idea.


**Get Upcoming Reminders:**
```bash
curl http://localhost:3000/api/reminders/list/upcoming?days=7
```

**Get Statistics:**
```bash
curl http://localhost:3000/api/reminders/stats/summary
```

See [REMINDER_CHATBOT_GUIDE.md](./backend/REMINDER_CHATBOT_GUIDE.md) for comprehensive documentation.

## 📝 Key Accomplishments (v1.1.0)

### Type Safety Improvements
- ✅ Fixed TypeScript `RequestWithUser` interface across controllers to use proper `User` type
- ✅ Applied consistent type definitions from `backend/types/user.types.ts`
- ✅ Updated `blogcontroller.ts`, `friendcontroller.ts`, `friendship.controller.ts`
- ✅ Eliminated type incompatibility errors (TS2430)

### Reminder Chatbot System
- ✅ Implemented comprehensive reminder model with Supabase integration
- ✅ Built chatbot controller with natural language parsing
- ✅ Added 15+ API endpoints for reminder management
- ✅ Intelligent category and priority detection
- ✅ Recurring reminder support (daily, weekly, monthly, yearly)
- ✅ Advanced filtering: by status, category, date range, tags
- ✅ Reminder statistics and completion tracking
- ✅ Full documentation with examples

### Code Quality
- ✅ Consistent error handling across all routes
- ✅ Proper request/response types using `RequestWithUser`
- ✅ Comprehensive inline documentation
- ✅ Organized route structure with clear endpoints

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- CORS protection
- Rate limiting
- Security headers (Helmet)
- Input validation
- SQL injection protection via Supabase

## 📖 Documentation

- [Reminder Chatbot Guide](./backend/REMINDER_CHATBOT_GUIDE.md) - Comprehensive reminder system documentation with examples
- [Middleware Guide](./backend/MIDDLEWARE_GUIDE.md) - Middleware architecture and usage
- [Socket Guide](./frontend/socket/SOCKET_GUIDE.md) - Real-time communication setup

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