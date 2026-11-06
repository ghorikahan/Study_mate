# 🎓 StudyMate – Smart Study Planner

> **"Plan Smart. Study Better. Achieve More."**

StudyMate is a full-stack, college-level mobile application designed to empower students with intelligent study planning, automated task scheduling, countdown exam tracking, deep focus timers, and comprehensive productivity analytics.

---

## 📱 Tech Stack

### Frontend
- **Framework**: React Native with [Expo SDK 58](https://expo.dev)
- **Language**: TypeScript
- **Routing**: [Expo Router v5](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: React Native `StyleSheet` with Premium Dark UI System
- **Icons**: Lucide React Native (`lucide-react-native`)
- **Storage**: `expo-secure-store`
- **Networking**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Security**: JWT (JSON Web Tokens), bcryptjs, CORS, Dotenv
- **Process Management**: Nodemon for local hot reloading

---

## 🎨 Design System

| Element | Color Hex | Preview |
|---|---|---|
| **Background** | `#0B0D12` | Dark obsidian deep canvas |
| **Card / Surface** | `#151923` | Elevated dark container |
| **Card Secondary** | `#1C2230` | Inset element surface |
| **Primary Accent** | `#8B5CF6` | Vibrant electric purple |
| **Secondary Accent** | `#22D3EE` | Radiant neon cyan |
| **Text Primary** | `#F9FAFB` | Crisp light text |
| **Text Secondary** | `#9CA3AF` | Subdued secondary text |
| **Borders** | `#262B36` | Sleek border dividers |

---

## 📂 Project Architecture

```
StudyMate/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection & health reporting
│   ├── controllers/              # Request controllers
│   ├── middleware/               # Auth, validation & error middleware
│   ├── models/                   # Mongoose schemas (User, Task, Exam, etc.)
│   ├── routes/                   # API routes
│   │   └── healthRoutes.js       # /api/health endpoint
│   ├── utils/                    # Helper functions & token utilities
│   ├── .env.example              # Template for environment variables
│   ├── package.json              # Backend dependencies & scripts
│   ├── server.js                 # Express server entry point
│   └── test_health.js            # Automated backend health diagnostic
│
├── frontend/
│   ├── app/                      # Expo Router screens
│   │   ├── _layout.tsx           # Dark theme Stack root layout
│   │   └── index.tsx             # Dashboard with real-time backend connection indicator
│   ├── components/               # Modular UI components
│   │   ├── ConnectionIndicator.tsx # Live API connection pill & ping latency
│   │   ├── DashboardHeader.tsx   # StudyMate branding & tagline
│   │   └── RoadmapCard.tsx       # 18-day feature tracker
│   ├── constants/                # Colors, typography, spacing tokens
│   ├── context/                  # State management providers
│   ├── hooks/                    # Custom hooks (useBackendHealth)
│   ├── services/                 # Central Axios API client
│   ├── types/                    # TypeScript interfaces & types
│   ├── app.json                  # Expo application configuration
│   ├── package.json              # Frontend dependencies & scripts
│   └── tsconfig.json             # TypeScript configuration
│
├── .gitignore                    # Git ignore rules for node_modules, .env, .expo
└── README.md                     # Project documentation
```

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
   *(Optional for Day 1: Add your MongoDB Atlas connection string to `MONGODB_URI` in `.env`)*
3. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
4. Verify backend health check:
   - Browser / curl: `http://localhost:5000/api/health`
   - Or run automated check: `npm test`

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
   - Scan the QR code displayed in your terminal.
4. Setting up Backend Connection on Physical Device:
   - Find your PC's local Wi-Fi IP address (`ipconfig` on Windows, e.g. `192.168.1.50`).
   - In the StudyMate app dashboard, type `http://192.168.1.50:5000` into the **Target API URL** input field.
   - Tap **Test Link** — the status dot will instantly turn green showing **"Backend Connected"** with live ping latency!

---

## 🗓️ 18-Day Milestone Progress

| Day | Status | Description |
|-----|--------|-------------|
| Day 1 | ✅ Done | Project initialization, folder architecture, Express backend, GET / & GET /api/health, MongoDB config (Atlas .env), Axios service, dark dashboard with real-time connection indicator |
| Day 2 | ✅ Done | Reusable UI system (Button, Input, Card, Header, Badge, EmptyState, Loading), bottom tab navigation (Home, Planner, Tasks, Exams, Profile), polished empty states and responsive dark layouts |
| Day 3 | ✅ Done | Express & MongoDB backend foundation: User, StudyPlan, Task, Exam, StudySession, Notification Mongoose models with timestamps & compound indexes, centralized error handling, request validator, consistent JSON responses, secure CORS, /api/health & /api/database-status diagnostic endpoints |
| Day 4–18 | 🔜 Upcoming | Authentication & JWT → Dashboard stats → Study Planner CRUD → Task Management → Timetable → Exam Tracker → Timer → Analytics → Profile → Notifications → Offline Sync → Testing → Production |
| Day 3–18 | 🔜 Upcoming | Authentication → Dashboard stats → CRUD features → Timer → Analytics → Profile → Notifications → Testing → Production |
