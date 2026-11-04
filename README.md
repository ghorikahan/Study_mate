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

## 🗓️ 18-Day Milestone Plan

- **Day 1**: ✅ Project Initialization, Architecture, Backend Health & Dark Dashboard
- **Day 2**: 🔒 User Registration, Login, JWT Authentication & SecureStore
- **Day 3**: 📊 Dashboard Layout, Statistics & Quick Actions
- **Day 4**: 📝 Study Planner Module & Subject Organization
- **Day 5**: ✅ Task Management (CRUD, Prioritization, Deadlines)
- **Day 6**: 📅 Weekly Study Timetable & Schedule Grid
- **Day 7**: 🎯 Exam Countdown Tracker & Syllabus Manager
- **Day 8**: ⏱️ Focus Study Timer (Pomodoro & Custom Sessions)
- **Day 9**: 📈 Study Analytics & Visual Progress Charts
- **Day 10**: 👤 User Profile, Preferences & Avatar Uploads
- **Day 11**: 🔔 Study Reminders & Local Notifications
- **Day 12**: 🔍 Global Search & Filtering
- **Day 13**: 🌐 Offline Sync & Local Cache Resilience
- **Day 14**: 🎨 Advanced UI Polish & Micro-interactions
- **Day 15**: 🛡️ Security Audit, Input Sanitization & Error Boundaries
- **Day 16**: 🧪 End-to-End Testing & Bug Squashing
- **Day 17**: 🚀 Production Build Configuration & Performance Profiling
- **Day 18**: 📦 Final College Project Submission & Presentation Packaging

