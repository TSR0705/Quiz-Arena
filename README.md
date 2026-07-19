# QuizArena

A premium assessment platform designed for immersive quiz-taking, real-time performance analytics, credentials validation, and progressive leaderboard systems.

---

## Overview

QuizArena is a full-stack web application that transforms basic quizzes into a focused, gamified assessment workspace. It allows users (and verified guests) to select specific topics, start timed assessments with interactive lifelines (hints, 50/50 eliminations), track active streaks/XP progress, and claim public verifiable certificates on perfect completions.

---

## Features

### Authentication & Sessions
- **Multi-tenant Flow**: Supports credential-based user accounts and ephemeral guest sessions.
- **Secure Persistence**: Employs HTTP-only cookies storing cryptographically signed JWT access/refresh tokens.
- **Auto-Sync Recovery**: Automatically saves drafts and syncs pending offline inputs to the database once a connection is restored.

### Quiz Engine (Assessment & Practice Modes)
- **Focus Mode**: Isolates the viewport, hiding distraction panels to center focus purely on the active questions.
- **Interactive Keyboard Controls**: Hotkeys mapped for selecting options (`1`–`4`), flagging questions (`f`), jumping pages (`ArrowLeft`/`ArrowRight`), and saving inputs (`Enter`).
- **Progress Trackers**: Sidebar navigations show progress bars, countdown timers, and flagged question matrices.
- **Urgency HUD**: Timers dynamically color-shift and trigger vibration-shakes as countdowns reach low/critical states.

### Certificates & Verification
- **Verifiable Credentials**: Automatically issues a verified digital certificate code on scoring 100% on assessments containing 5 or more questions.
- **Public Lookups**: Rate-limited open verification routes allow third parties to lookup and validate certificate codes.

### Dashboard & Leaderboard
- **Heatmap Grid**: Captures daily user activity logs, tracking weekly study hours, questions solved, and streak history.
- **Dynamic Leaderboards**: Real-time rank calculation filtered by specific category, topic, and difficulty thresholds.

---

## Tech Stack

- **Frontend**: React 18, Vite 4, Tailwind CSS, Framer Motion, Toastify
- **Backend**: Node.js, Express, Knex.js
- **Database**: PostgreSQL (Neon Serverless compatibility)
- **Email Service**: SendGrid REST Web API integration
- **Deployment**: Vercel

---

## Folder Structure

```text
Quiz Arena/
├── server/                 # Backend Node/Express Application
│   ├── bin/                # CLI Utilities (Database Importers)
│   ├── config/             # Database and Environment Initializers
│   ├── controllers/        # REST Route Controllers
│   ├── middleware/         # Auth Filters and Abuse Rate Limiters
│   ├── migrations/         # PostgreSQL Knex Schema Migrations
│   ├── routes/             # Express Route Mapping
│   ├── seeds/              # Database Categories, Badges, and Questions Seed
│   └── services/           # Service modules (scoring, emails)
├── src/                    # Frontend React SPA
│   ├── assets/             # Images and Static SVGs
│   ├── components/         # Reusable Panels, Modals, and Route Pages
│   ├── contexts/           # Global AuthContext providers
│   ├── styles/             # Tailwind utility presets
│   └── utils/              # Client API helpers
├── public/                 # Client Static Assets (Earth/Robot Models)
├── vercel.json             # Vercel Serverless routing rewrites
└── package.json            # Node project configuration
```

---

## Environment Variables

| Variable Name | Required? | Purpose | Default / Production Value |
|---|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection URI | `postgresql://...` |
| `JWT_SECRET` | Yes | Token cryptographical signature secret | Random 32+ character string |
| `REFRESH_TOKEN_SECRET` | Yes | Refresh token cryptographical signature secret | Random 32+ character string |
| `SENDGRID_API_KEY` | Yes | SendGrid Web API Access Key | `SG.q9MrN-q...` |
| `EMAIL_FROM` | Yes | Verified SendGrid sender email address | E.g. `no-reply@yourdomain.com` |
| `FRONTEND_URL` | Yes | Client public hosting URL | E.g. `https://quizarena.vercel.app` |
| `CORS_ORIGIN` | Yes | Authorized domain origin for CORS headers | E.g. `https://quizarena.vercel.app` |
| `NODE_ENV` | Yes | Runtime environment state | `production` or `development` |

---

## Scripts

### Client SPA (Root Folder)
- `npm run dev`: Launch the Vite development server.
- `npm run build`: Compile static production assets to `/dist`.
- `npm run preview`: Preview Vite production build locally.

### Express Backend (`/server` Folder)
- `npm start`: Boot node server.
- `npm run dev`: Boot node server with live-reloading nodemon.
- `npm run migrate`: Execute database schema migrations.
- `npm run seed`: Populate database with seed categories and questions.
- `npm run test`: Execute Jest integration and unit test suites.
