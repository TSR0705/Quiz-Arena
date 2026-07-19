<div align="center">
  
  # 🎯 QuizArena
  
  **A premium, immersive, production-grade assessment platform with real-time performance analytics, credentials verification, and streak trackers.**
  
  [![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)](https://quiz-arena-sepia.vercel.app/)
  [![Jest Tests](https://img.shields.io/badge/Tests-37%20Passed-brightgreen?style=flat-square&logo=jest)](https://github.com/TSR0705/Quiz-Arena)
  [![Database](https://img.shields.io/badge/DB-Neon%20PostgreSQL-blue?style=flat-square&logo=postgresql)](https://neon.tech)
  [![SendGrid](https://img.shields.io/badge/Email-SendGrid%20API-009BDE?style=flat-square&logo=sendgrid)](https://sendgrid.com)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

  <h4>
    <a href="https://quiz-arena-sepia.vercel.app/">Live Demo</a>
    <span> · </span>
    <a href="/docs/api.md">API Docs</a>
    <span> · </span>
    <a href="/docs/architecture.md">Architecture</a>
    <span> · </span>
    <a href="/docs/database.md">DB Schema</a>
  </h4>
  
</div>

---

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Folder Structure](#-folder-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Variables](#-environment-variables)
- [📦 Deployment](#-deployment)
- [📜 Scripts](#-scripts)

---

## ✨ Key Features

### 💻 Fullscreen Focus Assessment Mode
- **Zero Distractions**: Hides navigation menus, sidebar metrics, and notification banners when entering a quiz.
- **Smart Countdown HUD**: The timer dynamically color-shifts (Normal ➔ Pulsing Orange ➔ Pulsing Red with vibration shakes) as limits approach.
- **Hotkeys**: Full keyboard navigation support (keys `1`–`4` for options, `Arrow` keys to browse questions, `Enter` to draft save, and `f` to toggle flag).
- **Session Auto-Save & Sync**: Instant state backups on click. Answers queue locally when connection drops and sync automatically upon restoration.
- **Recovery Manager**: Detects tab closures or browser crashes mid-quiz, prompting the user with an immersive resume dialogue.

### 🏆 Gamification Engine
- **Contribution Heatmap**: Custom GitHub-style calendar tracking study logs, XP points, and completed sessions.
- **Active Streaks**: Streak logic validating consecutive learning days.
- **Dynamic Leaderboards**: Filter rankings by categories, subtopics, and difficulty tiers.

### 🛡️ Credentials & Verification
- **Verifiable Credentials**: Score 100% on assessments containing 5+ questions to generate a verified digital certificate.
- **Abuse Protections**: Open verification routes are shielded by request limiters to block lookup scraping.

---

## 🛠️ Tech Stack

### Frontend Client
- **Core**: React 18, Vite 4 (Vastly superior bundle speeds)
- **Styling**: Tailwind CSS (Tailored glassmorphism UI system)
- **Animation**: Framer Motion (Transitions and physics-based interactions)
- **Utilities**: Toastify (Alerts), Lucide-React (Vibrant icons)

### Backend Engine
- **Server**: Node.js & Express.js
- **Database Handler**: Knex.js query builder with `pg` native driver
- **Security Middleware**: Helmet headers configuration, custom map-based IP rate limiters
- **Email Service**: SendGrid REST Web API integration (Cold-start optimized)

### Production Services
- **Hosting**: Vercel (Edge-compatible serverless rewrites)
- **Database Host**: Neon Serverless PostgreSQL (SSL enforced)

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres" />
  <img src="https://img.shields.io/badge/SendGrid-009BDE?style=for-the-badge&logo=sendgrid&logoColor=white" alt="SendGrid" />
</p>

---

## 📁 Folder Structure

```text
Quiz Arena/
├── server/                 # Express backend application
│   ├── bin/                # CLI DB importers
│   ├── config/             # DB & env initializers
│   ├── controllers/        # REST Route Controllers
│   ├── middleware/         # Auth & Rate limiters
│   ├── migrations/         # Knex database migrations
│   ├── routes/             # Express API Routes
│   ├── seeds/              # Categories & questions seed
│   └── services/           # Scoring & SendGrid REST mailer
├── src/                    # Frontend React SPA
│   ├── assets/             # SVGs & images
│   ├── components/         # Focus mode quiz workspace, dashboard & profile
│   ├── contexts/           # AuthState providers
│   └── utils/              # Client API helpers
├── vercel.json             # Edge functions routing config
└── package.json            # Client configuration
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies in both root and server scopes:
```bash
# Clone the repository
git clone https://github.com/TSR0705/Quiz-Arena.git
cd Quiz-Arena

# Install Client dependencies
npm install

# Install Server dependencies
cd server
npm install
```

### 2. Database Initialization
```bash
# 1. Initialize local tables
node test-db.js

# 2. Run migrations
npm run migrate

# 3. Seed data
npm run seed
```

### 3. Run Development Servers
```bash
# In the server directory:
npm run dev

# In the root (client) directory:
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/quizarena
DATABASE_URL_TEST=postgres://postgres:password@localhost:5432/quizarena_test
JWT_SECRET=your_32_character_signing_key_here
REFRESH_TOKEN_SECRET=your_other_32_character_signing_key_here
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=verified-sender@domain.com
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

---

## 📦 Deployment

### Vercel Routing Map
Vercel routes requests based on the root-level [vercel.json](file:///c:/Users/ACER/OneDrive/Desktop/Quiz%20Arena/vercel.json):
- `/api/*` endpoints map directly to the Express server function entry [server/index.js](file:///c:/Users/ACER/OneDrive/Desktop/Quiz%20Arena/server/index.js).
- All other routes fall back to the Vite frontend SPA client build output in `dist/`.

---

## 📜 Scripts

### Client (Root)
- `npm run dev` — Launches client dev server.
- `npm run build` — Compiles static assets to `dist/`.

### Server (`/server`)
- `npm run dev` — Launches backend dev server with nodemon.
- `npm run test` — Runs Jest integration test suite.
- `npm run migrate` — Runs Knex schema updates.
- `npm run seed` — Populates database questions bank.
