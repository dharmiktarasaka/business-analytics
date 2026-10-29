# STRATIQ — AI Business Intelligence & Strategy Advisor

> **An enterprise-grade, full-stack AI business advisory and intelligence platform that analyzes business models, uncovers operational bottlenecks, evaluates competitive vectors, and generates board-ready consulting reports.**

---

## 🏛️ System Architecture

The application is structured into two modular, production-ready directories:

```
business-analytics/
├── client/                     # Frontend Application (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Modular layout, navigation, and stepper components
│   │   ├── context/            # AuthContext (Firebase + Dev guest mode) & BusinessContext
│   │   ├── pages/              # 14 distinct application pages & views
│   │   ├── services/           # API Client, Firebase, jsPDF report export, XLSX generator
│   │   ├── types/              # Domain TypeScript interfaces
│   │   ├── index.css           # Tailwind CSS v4 styling + print formatting
│   │   └── App.tsx             # Protected routing & application core
│   ├── .env.example            # Client environment configuration template
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express + TypeScript + MongoDB + Gemini)
│   ├── src/
│   │   ├── config/             # Environment variables and service credentials
│   │   ├── db/                 # Mongoose database connection & dual resilient fallback store
│   │   ├── middleware/         # Firebase Admin ID token verification & rate limiters
│   │   ├── models/             # Mongoose schemas for all 8 collections
│   │   ├── routes/             # RESTful endpoints for businesses, analyses, chat, reports, actions
│   │   ├── services/           # Gemini AI SDK service with schema validation & prompt templates
│   │   ├── types/              # Server-side TypeScript interfaces
│   │   └── index.ts            # Express server initialization, helmet, CORS, rate limiting
│   ├── .env.example            # Server environment configuration template
│   └── package.json
│
└── package.json                # Root management scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 2. Install Dependencies
Dependencies for both client and server are already installed. If running fresh on a new machine:
```bash
# In server directory:
cd server
npm install

# In client directory:
cd ../client
npm install
```

### 3. Start Development Servers

You can launch both the backend server and client frontend concurrently:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Server will listen on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Client will be accessible on http://localhost:5173
```

---

## 🔐 Credentials & Environment Setup

### 1. Google Gemini API Setup
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and generate a free Gemini API key.
3. Open `server/.env` and paste your key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
> *Note: If no Gemini key is provided, STRATIQ automatically utilizes its intelligent, rule-grounded strategic synthesizer based on your business answers so that testing and review can occur seamlessly.*

### 2. Firebase Authentication Setup (Google Sign-In)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Build > Authentication**, enable **Google** sign-in provider and **Email/Password**.
3. Under **Project Settings > General > Your Apps**, create a Web App and copy the config into `client/.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. For backend token verification, go to **Project Settings > Service Accounts**, click **Generate new private key**, and copy values into `server/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
> *Instant Reviewer Mode: If you do not have Firebase keys right now, simply click "Instant Reviewer Mode (One-Click)" on the login screen to preview the entire platform immediately.*

### 3. MongoDB Atlas Setup
1. Register for a free MongoDB cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user with read/write privileges.
3. Under **Network Access**, whitelist your IP or `0.0.0.0/0`.
4. Copy the connection string and paste into `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/business_advisor?retryWrites=true&w=majority
   ```
> *Resilient Fallback: If `MONGODB_URI` is left blank, the server automatically runs with its resilient In-Memory Store layer, ensuring zero downtime and instant local usability.*

---

## 📋 Complete User Workflow

1. **User Authentication**:
   - Google Sign-In via Firebase Auth.
   - Email/password registration.
   - Dev guest mode for zero-friction evaluation.
   - Multi-tenant data isolation: all profiles, analyses, chats, and reports are strictly scoped to `ownerId`.

2. **Personalized Onboarding**:
   - Impressive welcome interface explaining strategic diagnostic capabilities.
   - Direct CTA: "Analyze My Business".
   - Switcher to resume previously analyzed enterprises or launch fresh diagnostics.

3. **Multi-Step Business Information Stepper (9 Steps)**:
   - **Step 1: Identity** — Business name, industry, model (B2B, B2C, SaaS, Service, Hybrid), stage, country, URL.
   - **Step 2: Products & Services** — Value proposition, USP, pricing model, customer problems solved.
   - **Step 3: Target Audience** — Ideal customer profile (ICP), pain points, CAC, LTV.
   - **Step 4: Sales & Marketing** — Acquisition channels, marketing budget, conversion challenges.
   - **Step 5: Financial Overview** — Optional estimates for revenue, margins, cash flow status.
   - **Step 6: Operations & Team** — Operational bottlenecks, tools, automation opportunities.
   - **Step 7: Competition & Market** — Known competitors, market opportunities, barriers.
   - **Step 8: Challenges & Objectives** — Top hurdles, 30-90 day goals, 1-3 year targets, AI focus areas.
   - **Step 9: Review & Submit** — Clean summary of all entered information with auto-save timestamps.

4. **Step 10: Progressive AI Analysis Workflow**:
   - Monitored real-time workflow stages:
     1. Organizing business information
     2. Evaluating business model
     3. Assessing strengths and weaknesses
     4. Identifying growth opportunities
     5. Evaluating business risks
     6. Preparing strategic recommendations
     7. Generating the business report
   - Retry capability and error handling.
   - Automatic celebration confetti upon completion.

5. **Analytical Capabilities & Modules**:
   - **Executive Dashboard**: Key findings, core strengths, priority bottlenecks, immediate 7-day action item.
   - **SWOT Matrix**: 4-quadrant matrix with evidence references linking findings back to user inputs.
   - **Pros & Cons Audit**: Segregates confirmed facts from AI-generated hypotheses.
   - **Ranked Growth Roadmap**: Scored by business impact, implementation effort, and cost range.
   - **Personalized AI Business Chat**: Grounded in the user's business profile and completed SWOT matrix. Allows one-click conversion of recommendations into tracked action items.
   - **Action Plan & Task Tracker**: Categorized across 7-day, 30-day, 90-day, and long-term milestones.
   - **Consulting Reports Library**: Board-ready 16-section strategic report generator with PDF download and Excel spreadsheet export.
   - **Settings & Privacy**: User preferences + GDPR complete account and data purge.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/session` | Synchronizes user profile from Firebase Auth token |
| `GET` | `/api/businesses` | Lists all businesses owned by authenticated user |
| `POST` | `/api/businesses` | Creates a new business diagnostic profile |
| `GET` | `/api/businesses/:id` | Retrieves single business profile by ID |
| `PATCH` | `/api/businesses/:id` | Updates business profile coordinates |
| `PUT` | `/api/businesses/:id/draft` | Autosaves stepper progress draft |
| `DELETE` | `/api/businesses/:id` | Deletes business and all related analyses/reports |
| `POST` | `/api/businesses/:id/analyze` | Initiates progressive AI analysis pipeline |
| `GET` | `/api/businesses/:id/analyses` | Lists all analysis runs for business |
| `GET` | `/api/analyses/:id` | Gets analysis status, current stage, and findings |
| `POST` | `/api/analyses/:id/retry` | Restarts a failed or interrupted analysis |
| `GET` | `/api/businesses/:id/conversations` | Lists AI advisory chat sessions |
| `POST` | `/api/businesses/:id/conversations` | Creates new conversation session |
| `GET` | `/api/conversations/:id/messages` | Fetches message stream for conversation |
| `POST` | `/api/conversations/:id/messages` | Sends message to AI advisor with context injection |
| `POST` | `/api/analyses/:id/reports` | Generates a 16-section board-grade consulting report |
| `GET` | `/api/businesses/:id/reports` | Lists all saved report versions |
| `GET` | `/api/reports/:id` | Retrieves full report document |
| `GET` | `/api/businesses/:id/actions` | Lists action items and tasks |
| `POST` | `/api/businesses/:id/actions` | Adds an action item |
| `PATCH` | `/api/actions/:id` | Updates task status (todo, in_progress, completed) |
| `DELETE` | `/api/actions/:id` | Deletes an action item |
| `GET` | `/api/settings` | Retrieves user settings |
| `PATCH` | `/api/settings` | Updates user settings |
| `DELETE` | `/api/account` | Permanently purges user account and all data (GDPR) |

---

## 🛡️ Security & Privacy Architecture

- **Server-Side API Keys**: Gemini API keys and database credentials are kept exclusively on the server.
- **Data Isolation**: Every database query filters strictly by `ownerId: req.user.uid`. Users cannot read or modify another user's records.
- **Token Verification**: Protected backend endpoints verify Firebase ID tokens via the Firebase Admin SDK.
- **Rate Limiting**: `express-rate-limit` prevents abuse and spamming on expensive AI endpoints.
- **GDPR Compliance**: The `/api/account` deletion endpoint completely purges all user profiles, analyses, chat histories, action items, and reports.

---

## 🧪 Production Build Verification

Both `client` and `server` compile with zero TypeScript errors:
```bash
# Verify server TypeScript compilation:
npm run build:server

# Verify client TypeScript and Vite production bundle:
npm run build:client
```
#   b u s i n e s s - a n a l y t i c s  
 