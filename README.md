# 🎓 StudyMate – Smart Study Planner

> **"Plan Smart. Study Better. Achieve More."**

StudyMate is a full-stack, college-level mobile application designed to empower students with intelligent study planning, automated task scheduling, countdown exam tracking, deep focus timers, and comprehensive productivity analytics.

---

## 📱 Tech Stack

### Frontend
- **Framework**: React Native with [Expo SDK 58](https://expo.dev)
- **Language**: TypeScript
- **Routing**: [Expo Router v5](https://docs.expo.dev/router/introduction/) (File-based tab & stack navigation)
- **Styling**: React Native `StyleSheet` with Premium Dark UI System
- **Icons**: Lucide React Native (`lucide-react-native`)
- **Storage**: `expo-secure-store`
- **Networking**: Axios with centralized error interceptors & runtime endpoint switching

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Security**: JWT (JSON Web Tokens), bcryptjs, Secure CORS, Dotenv
- **Architecture**: Modular separation (Config, Controllers, Middlewares, Models, Routes, Utils)
- **Reliability**: Centralized error handling, schema validation, consistent JSON responses

---

## 🎨 Design System

| Element | Color Hex | Preview / Purpose |
|---|---|---|
| **Background** | `#0B0D12` | Dark obsidian deep canvas |
| **Card / Surface** | `#151923` | Elevated dark container |
| **Card Secondary** | `#1C2230` | Inset element surface |
| **Card Elevated** | `#1E2638` | Highlighted modal / popover surface |
| **Primary Accent** | `#8B5CF6` | Vibrant electric purple |
| **Secondary Accent** | `#22D3EE` | Radiant neon cyan |
| **Text Primary** | `#F9FAFB` | Crisp light text |
| **Text Secondary** | `#9CA3AF` | Subdued secondary text |
| **Borders** | `#262B36` | Sleek border dividers |
| **Success** | `#10B981` | Completed tasks, connected status |
| **Warning** | `#F59E0B` | Upcoming exams, caution alerts |
| **Error** | `#EF4444` | Overdue tasks, disconnected status |

---

## 📂 Project Architecture

```
StudyMate/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection, lifecycle listeners & status diagnostics
│   ├── controllers/
│   │   ├── healthController.js   # GET /api/health and GET /api/database-status handlers
│   │   ├── authController.js     # register, login, getMe, logout handlers
│   │   ├── dashboardController.js # GET /api/dashboard/summary real-time stats aggregator
│   │   ├── studyPlanController.js # Full CRUD study plan handlers with user ownership isolation
│   │   └── index.js              # Controllers barrel export
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handler (CastError, 11000 duplicate, Validation, JWT)
│   │   ├── validator.js          # Request schema validation middleware (body, params, query)
│   │   ├── protect.js            # JWT authentication middleware (Bearer token verification)
│   │   ├── restrictTo.js         # Role-based authorization middleware (student/admin)
│   │   └── index.js              # Middleware barrel export
│   ├── models/
│   │   ├── User.js               # User schema (bcrypt pre-save, comparePassword, streak, preferences)
│   │   ├── StudyPlan.js          # StudyPlan schema (subject, topic, date, startTime, duration, priority, status)
│   │   ├── Task.js               # Task schema (priority, deadline, isOverdue virtual, auto-sync completedAt)
│   │   ├── Exam.js               # Exam schema (countdown daysRemaining & syllabusProgressPercent virtuals)
│   │   ├── StudySession.js       # StudySession schema (pomodoro/stopwatch tracking, focus rating, duration)
│   │   ├── Notification.js       # Notification schema (read states, priority, scheduled reminders)
│   │   └── index.js              # Models barrel export
│   ├── routes/
│   │   ├── healthRoutes.js       # /api/health & /api/database-status routes
│   │   ├── authRoutes.js         # /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout
│   │   ├── dashboardRoutes.js    # /api/dashboard/summary route
│   │   ├── studyPlanRoutes.js    # Full CRUD study plan routes (GET, POST, PUT, PATCH, DELETE)
│   │   └── index.js              # Central API router aggregator
│   ├── utils/
│   │   ├── appError.js           # Custom operational AppError class
│   │   ├── asyncHandler.js       # Async wrapper eliminating try/catch boilerplate
│   │   ├── responseHandler.js    # Standardized successResponse & errorResponse helpers
│   │   ├── jwtHelper.js          # generateToken & verifyToken helpers (JWT signing/verification)
│   │   └── index.js              # Utilities barrel export
│   ├── .env.example              # Template for environment variables (safe, no credentials)
│   ├── package.json              # Backend dependencies & npm scripts
│   ├── server.js                 # Express server entry point (CORS, body parsers, 404 handler)
│   ├── test_backend.js           # Comprehensive Day 3 automated test suite (41/41 passing)
│   ├── test_auth.js              # Day 4 authentication test suite (15/15 unit tests passing)
│   ├── test_dashboard.js         # Day 6 dashboard summary test suite (passing)
│   ├── test_study_plans.js       # Day 7 study planner CRUD test suite (passing)
│   └── test_health.js            # Standalone endpoint health test
│
├── frontend/
│   ├── app/                      # Expo Router navigation
│   │   ├── (auth)/               # 🔐 Authentication screens
│   │   │   ├── _layout.tsx       # Auth stack navigation layout
│   │   │   ├── login.tsx         # Premium Login screen with validation & quick-fill demo
│   │   │   └── register.tsx      # Registration screen with password strength bar
│   │   ├── (tabs)/               # 📱 Bottom tab navigation
│   │   │   ├── _layout.tsx       # Tab bar configuration & custom icons
│   │   │   ├── index.tsx         # 🏠 Home tab (Greeting, streak stats, quick actions, empty states)
│   │   │   ├── planner.tsx       # 📖 Planner tab (Subjects carousel, filter chips, study plans)
│   │   │   ├── tasks.tsx         # ✅ Tasks tab (Task metrics, priority badges, overdue tracking)
│   │   │   ├── exams.tsx         # 📅 Exams tab (Exam countdown banner, subject cards, prep tips)
│   │   │   └── profile.tsx       # 👤 Profile tab (User info, study metrics, settings rows, sign out)
│   │   ├── _layout.tsx           # Root layout with AuthProvider, route protection & dark splash screen
│   │   └── index.tsx             # Root auth redirect guard
│   ├── components/               # Modular UI components
│   │   ├── ui/                   # Reusable UI component library
│   │   │   ├── Badge.tsx         # Color-coded badge pills with optional dot
│   │   │   ├── Button.tsx        # Primary, secondary, outline, ghost & danger button variants
│   │   │   ├── Card.tsx          # Default, elevated, outlined & flat card surfaces
│   │   │   ├── EmptyState.tsx    # Polished empty state with icon, message & action button
│   │   │   ├── Header.tsx        # Screen header with title, subtitle & action slots
│   │   │   ├── Input.tsx         # Form input with focus states, error text & icon slots
│   │   │   ├── Loading.tsx       # Activity spinner & full-screen loading overlay
│   │   │   └── index.ts          # UI library barrel export
│   │   ├── ConnectionIndicator.tsx # Live API connection pill & ping latency
│   │   ├── DashboardHeader.tsx   # StudyMate branding & tagline
│   │   ├── RoadmapCard.tsx       # 18-day feature tracker card
│   │   └── StudyPlanModal.tsx    # Create & Edit Study Plan modal with input validation & presets
│   ├── constants/
│   │   ├── colors.ts             # Palette tokens & semantic variants
│   │   └── theme.ts              # Spacing, Radius, FontSize, FontWeight & Shadow tokens
│   ├── context/
│   │   ├── AuthContext.tsx       # Authentication context, session restoration, login/register/logout
│   │   └── index.ts              # Context barrel export
│   ├── hooks/
│   │   ├── useBackendHealth.ts   # Custom health check hook with latency & error diagnostics
│   │   ├── useDashboard.ts       # Live dashboard summary hook with pull-to-refresh & auto-load
│   │   └── useStudyPlans.ts      # Study planner hook with CRUD handlers, filters & state management
│   ├── services/
│   │   ├── api.ts                # Central Axios client with token injection & 401 interceptors
│   │   ├── authService.ts        # Auth API endpoints (login, register, me, logout, error handling)
│   │   ├── dashboardService.ts   # Dashboard stats API service (GET /api/dashboard/summary)
│   │   ├── studyPlanService.ts   # Study planner REST client (create, read, update, delete, toggle)
│   │   └── storage.ts            # Secure token & user persistence via expo-secure-store
│   ├── types/
│   │   ├── api.ts                # TypeScript interfaces for API & health responses
│   │   ├── auth.ts               # User, AuthState, AuthCredentials, Response interfaces
│   │   ├── dashboard.ts          # Dashboard summary, task items, upcoming exam interfaces
│   │   ├── studyPlan.ts          # StudyPlan, inputs, filters, and response interfaces
│   │   └── index.ts              # Types barrel export
│   ├── app.json                  # Expo SDK 58 application configuration
│   ├── package.json              # Frontend dependencies & scripts
│   ├── tsconfig.json             # TypeScript config with path aliases (@/*)
│   └── .env.example              # Frontend environment template
│
├── .gitignore                    # Git ignore rules for node_modules, .env*, .expo, dist
└── README.md                     # Project documentation & roadmap
```

---

## 📡 Backend API Endpoints (Current)

| Method | Endpoint | Description | Access | Response Format |
|---|---|---|---|---|
| `GET` | `/` | API banner, documentation link & operational status | Public | `{ success: true, message, data }` |
| `GET` | `/api/health` | Uptime, system memory (RSS, heap), version, and health status | Public | `{ success: true, message, data }` |
| `GET` | `/api/database-status` | Real-time MongoDB Atlas status, host, name, and registered models | Public | `{ success: true, message, data }` |
| `POST` | `/api/auth/register` | Create new account — validates name/email/password, hashes password, returns JWT | Public | `{ success, message, data: { token, user } }` |
| `POST` | `/api/auth/login` | Authenticate — validates credentials, compares hashed password, returns JWT | Public | `{ success, message, data: { token, user } }` |
| `GET` | `/api/auth/me` | Get current authenticated user profile (password never returned) | 🔒 Protected | `{ success, message, data: { user } }` |
| `POST` | `/api/auth/logout` | Stateless logout — instructs client to delete stored token | 🔒 Protected | `{ success: true, message }` |
| `GET` | `/api/dashboard/summary` | Real-time user dashboard summary (tasks, study hours, streak, exams, 7-day breakdown) | 🔒 Protected | `{ success: true, message, data: DashboardSummary }` |
| `POST` | `/api/study-plans` | Create study plan (subject, topic, date, startTime, duration, priority) | 🔒 Protected | `{ success: true, message, data: { studyPlan } }` |
| `GET` | `/api/study-plans` | Read user study plans with subject, priority, date, and search filters | 🔒 Protected | `{ success: true, message, data: { studyPlans, total, subjects } }` |
| `GET` | `/api/study-plans/:id` | Read single study plan (user ownership enforced) | 🔒 Protected | `{ success: true, message, data: { studyPlan } }` |
| `PUT` | `/api/study-plans/:id` | Update study plan fields (user ownership enforced) | 🔒 Protected | `{ success: true, message, data: { studyPlan } }` |
| `PATCH` | `/api/study-plans/:id/status` | Quick toggle study plan status (active <-> completed) | 🔒 Protected | `{ success: true, message, data: { studyPlan } }` |
| `DELETE` | `/api/study-plans/:id` | Delete study plan (user ownership enforced) | 🔒 Protected | `{ success: true, message }` |
| `*` | `*` | 404 Route Not Found handler | Public | `{ success: false, message: "Endpoint ... does not exist" }` |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22.23.1)
- **npm**: v9+ (tested on 10.9.8)
- **Git**: v2+
- **Expo Go App**: Installed on your Android device (from Google Play Store)

---

### 2. Backend Setup & Run

1. Open a terminal and navigate to `StudyMate/backend`:
   ```bash
   cd StudyMate/backend
   ```
2. Create your `.env` file from `.env.example`:
   ```bash
   copy .env.example .env
   ```
   *(Add your MongoDB Atlas connection string to `MONGODB_URI` in `.env` when ready)*
3. Start the backend server:
   ```bash
   npm run dev
   ```
4. Run the automated Day 3 test suite:
   ```bash
   npm test
   ```
5. Run the Day 4 authentication test suite (unit tests run without MongoDB):
   ```bash
   npm run test:auth
   ```
6. Run all test suites at once:
   ```bash
   npm run test:all
   ```

---

### 3. Frontend Setup & Run (Android Expo Go)

1. Open a second terminal and navigate to `StudyMate/frontend`:
   ```bash
   cd StudyMate/frontend
   ```
2. Start the Expo development server:
   ```bash
   npm run start
   ```
3. Open on your Android Phone:
   - Ensure your **phone and computer are connected to the same Wi-Fi network**.
   - Open the **Expo Go** app on your Android phone.
   - Scan the QR code displayed in your terminal or paste `exp://<YOUR_IP>:8081`.

---

## 🗓️ 18-Day Milestone Progress

| Day | Status | Description |
|-----|--------|-------------|
| **Day 1** | ✅ Done | Project initialization, folder architecture, Express backend, GET / & GET /api/health, MongoDB config (Atlas .env), Axios service, dark dashboard with real-time connection indicator |
| **Day 2** | ✅ Done | Reusable UI system (Button, Input, Card, Header, Badge, EmptyState, Loading), bottom tab navigation (Home, Planner, Tasks, Exams, Profile), polished empty states and responsive dark layouts |
| **Day 3** | ✅ Done | Express & MongoDB backend foundation: User, StudyPlan, Task, Exam, StudySession, Notification Mongoose models with timestamps & compound indexes, centralized error handling, request validator, consistent JSON responses, secure CORS, /api/health & /api/database-status diagnostic endpoints (41/41 test assertions passing) |
| **Day 4** | ✅ Done | Secure Authentication APIs: POST /api/auth/register (bcrypt hashing, JWT), POST /api/auth/login (credential validation, generic errors), GET /api/auth/me (protect middleware, fresh user fetch), POST /api/auth/logout (stateless), JWT `protect` middleware, role-based `restrictTo` middleware, `jwtHelper` utility, 15/15 auth tests passing |
| **Day 5** | ✅ Done | React Native Authentication Integration: Premium dark Login & Registration screens with validation & password strength indicator, AuthContext with session restoration & auto-refresh, Expo SecureStore JWT persistence, Axios Bearer token injection & 401 interceptors, reactive route protection & splash screen, Profile sign-out flow with confirmation modal |
| **Day 6** | ✅ Done | Personalized StudyMate Dashboard: GET /api/dashboard/summary backend aggregation (tasks, study hours, streak, upcoming exams, 7-day breakdown), frontend dashboard integration, personalized greeting, streak highlight, weekly activity chart, live today's tasks & upcoming exams with empty states, quick actions grid, pull-to-refresh & error retry |
| **Day 7** | ✅ Done | Complete Study Planner Module: Full CRUD REST APIs (POST, GET, PUT, PATCH, DELETE /api/study-plans) with strict user ownership isolation, Mongoose schema with subject/topic/date/startTime/duration/priority, frontend StudyPlanModal (create & edit with validation), dynamic subject chips filter, status/date tabs, search bar, completion toggle, pull-to-refresh, empty states, and comprehensive test suite passing |
| **Day 8** | 🔜 Up Next | Smart Task Management Module (CRUD, Priority Badges, Due Dates, Overdue Alerts) |
| **Day 9–18** | 🔜 Scheduled | Timetable → Exam Countdown Tracker → Focus Timer → Analytics & Charts → Profile & Settings → Notifications → Testing → Production |
