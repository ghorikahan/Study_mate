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
│   │   └── index.js              # Controllers barrel export
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handler (CastError, 11000 duplicate, Validation, JWT)
│   │   ├── validator.js          # Request schema validation middleware (body, params, query)
│   │   └── index.js              # Middleware barrel export
│   ├── models/
│   │   ├── User.js               # User schema (bcrypt pre-save, comparePassword, streak, preferences)
│   │   ├── StudyPlan.js          # StudyPlan schema (milestones, subject, status, progressPercent virtual)
│   │   ├── Task.js               # Task schema (priority, deadline, isOverdue virtual, auto-sync completedAt)
│   │   ├── Exam.js               # Exam schema (countdown daysRemaining & syllabusProgressPercent virtuals)
│   │   ├── StudySession.js       # StudySession schema (pomodoro/stopwatch tracking, focus rating, duration)
│   │   ├── Notification.js       # Notification schema (read states, priority, scheduled reminders)
│   │   └── index.js              # Models barrel export
│   ├── routes/
│   │   ├── healthRoutes.js       # /api/health & /api/database-status routes
│   │   └── index.js              # Central API router aggregator
│   ├── utils/
│   │   ├── appError.js           # Custom operational AppError class
│   │   ├── asyncHandler.js       # Async wrapper eliminating try/catch boilerplate
│   │   ├── responseHandler.js    # Standardized successResponse & errorResponse helpers
│   │   └── index.js              # Utilities barrel export
│   ├── .env.example              # Template for environment variables (safe, no credentials)
│   ├── package.json              # Backend dependencies & npm scripts
│   ├── server.js                 # Express server entry point (CORS, body parsers, 404 handler)
│   ├── test_backend.js           # Comprehensive Day 3 automated test suite (41/41 passing)
│   └── test_health.js            # Standalone endpoint health test
│
├── frontend/
│   ├── app/                      # Expo Router navigation
│   │   ├── (tabs)/               # Bottom tab navigation
│   │   │   ├── _layout.tsx       # Tab bar configuration & custom icons
│   │   │   ├── index.tsx         # 🏠 Home tab (Greeting, streak stats, quick actions, empty states)
│   │   │   ├── planner.tsx       # 📖 Planner tab (Subjects carousel, filter chips, study plans)
│   │   │   ├── tasks.tsx         # ✅ Tasks tab (Task metrics, priority badges, overdue tracking)
│   │   │   ├── exams.tsx         # 📅 Exams tab (Exam countdown banner, subject cards, prep tips)
│   │   │   └── profile.tsx       # 👤 Profile tab (Avatar, study metrics, settings rows, sign out)
│   │   ├── _layout.tsx           # Stack root with dark theme StatusBar
│   │   └── index.tsx             # Root redirect to (tabs)
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
│   │   └── RoadmapCard.tsx       # 18-day feature tracker card
│   ├── constants/
│   │   ├── colors.ts             # Palette tokens & semantic variants
│   │   └── theme.ts              # Spacing, Radius, FontSize, FontWeight & Shadow tokens
│   ├── context/
│   │   └── index.ts              # State management providers
│   ├── hooks/
│   │   └── useBackendHealth.ts   # Custom health check hook with latency & error diagnostics
│   ├── services/
│   │   └── api.ts                # Central Axios client with EXPO_PUBLIC_API_URL
│   ├── types/
│   │   ├── api.ts                # TypeScript interfaces for API & health responses
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
| **Day 4** | 🔜 Up Next | User Authentication: Registration, Login, bcryptjs password hashing, JWT token issuance & verification middleware, Expo SecureStore token persistence |
| **Day 5–18** | 🔜 Scheduled | Dashboard stats → Study Planner CRUD → Task Management → Timetable → Exam Countdown Tracker → Focus Timer → Analytics & Charts → Profile & Settings → Notifications → Testing → Production |
