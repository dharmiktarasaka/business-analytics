# STRATIQ Deployment Guide: Render Backend & Dual Vercel Frontends

This guide provides clear, step-by-step instructions to deploy the entire STRATIQ platform to production:
1. **Backend** on **Render** (Node.js/Express in `server/`)
2. **Main Client Website** on **Vercel** (`client/` - Project 1)
3. **Isolated Admin Panel** on **Vercel** (`admin/` - Project 2 with its own separate URL)

---

## Architecture Overview

```
                        ┌──────────────────────────────────────┐
                        │          MongoDB Atlas               │
                        │       (Encrypted Database)           │
                        └──────────────────▲───────────────────┘
                                           │
                                           │ Mongoose
                                           │
                        ┌──────────────────┴───────────────────┐
                        │          RENDER BACKEND              │
                        │   https://<your-backend>.onrender.com│
                        │      (Express + TypeScript)          │
                        │   Root Directory: server             │
                        └─────────▲──────────────────▲─────────┘
                                  │                  │
                CORS (Live API)   │                  │ CORS (x-admin-key)
                                  │                  │
        ┌─────────────────────────┴────────┐   ┌─────┴────────────────────────────┐
        │       VERCEL PROJECT 1           │   │         VERCEL PROJECT 2         │
        │     Main Advisory Platform       │   │    Isolated Admin Registry       │
        │ https://<your-app>.vercel.app    │   │  https://<your-admin>.vercel.app │
        │     Root Directory: client       │   │      Root Directory: admin       │
        └──────────────────────────────────┘   └──────────────────────────────────┘
```

Both frontends are completely decoupled and run on independent domains/URLs on Vercel, but communicate with the same centralized, secure backend on Render.

---

## Pre-Deployment Checklist: MongoDB Atlas IP Access

Before deploying to Render, verify that your MongoDB Atlas cluster allows inbound connections from Render:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left navigation, go to **Network Access**.
3. Check if `0.0.0.0/0` (Allow access from anywhere) is in the list:
   - If not, click **+ Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. (Render dynamically provisions IPs, so `0.0.0.0/0` is required).

---

## Part 1: Deploy Backend to Render

### Option A: Standard Web Service Setup (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub / GitLab repository containing this project.
3. Configure the service settings:
   - **Name**: `stratiq-backend` (or your preferred name)
   - **Region**: Choose the region closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: `server` ⚠️ *(Crucial: set this so Render builds inside the server folder)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free` (or higher tier)

4. Scroll down to **Environment Variables** and add the following keys:

| Environment Variable | Value Example / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` *(Render sets this automatically, but you can set 10000)* |
| `MONGODB_URI` | Your full MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/test?retryWrites=true&w=majority`) |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `ADMIN_SECRET_KEY` | Your chosen master key for the admin panel (e.g., `stratiq@admin2026`) |
| `CORS_ORIGIN` | `*` *(The backend already automatically permits all `*.vercel.app` domains, but you can also list specific custom domains separated by commas)* |

5. Click **Create Web Service**.
6. Render will run `npm install && npm run build` and start the server.
7. Once deployed, Render will provide a live URL like:
   `https://stratiq-backend.onrender.com`

> **Verification**: Open `https://<your-backend>.onrender.com` in your browser. You will see the live STRATIQ API status JSON showing `"status": "online"` and `"database": "MongoDB Atlas"`.

---

### Option B: Render Blueprint (`render.yaml`)
Alternatively, if you prefer automatic configuration via Infrastructure-as-Code:
1. In Render Dashboard, click **New +** > **Blueprint**.
2. Select your repository. Render will automatically read [`render.yaml`](./render.yaml).
3. Fill in your `MONGODB_URI` and `GEMINI_API_KEY` when prompted, and deploy.

---

## Part 2: Deploy Main Website to Vercel (Project 1)

1. Open your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** > **Project**.
2. Import the same repository.
3. In the project configuration screen:
   - **Project Name**: `stratiq-app` (or your preferred name)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client` ⚠️ *(Crucial)*
   - **Build and Output Settings**:
     - Build Command: `npm run build` (Default)
     - Output Directory: `dist` (Default)
     - Install Command: `npm install` (Default)
4. Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://<your-backend>.onrender.com` *(Use your actual Render URL from Part 1)* |

5. Click **Deploy**.
6. When deployment finishes, you will get your main site URL:
   `https://stratiq-app.vercel.app`

The included [`client/vercel.json`](./client/vercel.json) ensures all SPA routes (`/dashboard`, `/analysis`, etc.) resolve properly without 404s on page reload.

---

## Part 3: Deploy Admin Panel to Vercel (Project 2)

The Admin Portal is completely isolated in `admin/` and will be deployed as a **separate, distinct Vercel project with its own unique URL**.

1. In your [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** > **Project**.
2. Import the **same repository again**.
3. In the project configuration screen:
   - **Project Name**: `stratiq-admin` (e.g. `your-company-admin`)
   - **Framework Preset**: Select `Other`
   - **Root Directory**: Click **Edit** and select `admin` ⚠️ *(Crucial)*
   - **Build and Output Settings**:
     - Build Command: Leave blank / OFF (It's static HTML/Tailwind/JS)
     - Output Directory: Leave blank / `.`
     - Install Command: Leave blank / OFF
4. Click **Deploy**.
5. Once deployed, Vercel will give you a separate URL:
   `https://stratiq-admin.vercel.app`

### Pointing Admin Panel to Your Render Backend
You have two easy ways to set the Render Backend for your Admin Panel:

- **Method A (Zero Re-deploy via UI - Recommended)**:
  1. Open your deployed Admin Panel URL (`https://stratiq-admin.vercel.app`).
  2. On the Security Lock Screen, you will see a **Backend Server URL** input.
  3. Paste your Render backend URL (e.g., `https://stratiq-backend.onrender.com`).
  4. Enter your Master Admin Passkey (`stratiq@admin2026` or your custom `ADMIN_SECRET_KEY`) and click **Authenticate & Unlock Portal**.
  5. The URL is saved in your browser's `localStorage` and will persist automatically. You can also click the top navbar badge **Backend: <host>** anytime to test ping or change it!

- **Method B (Baked-in via `admin/config.js`)**:
  Before pushing to Git, open [`admin/config.js`](./admin/config.js) and set:
  ```javascript
  window.STRATIQ_BACKEND_URL = 'https://stratiq-backend.onrender.com';
  ```
  Commit and push; Vercel will automatically update.

---

## Part 4: Verification & Smoke Test Checklist

| Step | Action | Expected Result |
| :---: | :--- | :--- |
| **1** | Open Render Backend URL (`https://stratiq-backend.onrender.com`) | Returns JSON: `{"service": "STRATIQ Unified Backend Engine", "status": "online"}` |
| **2** | Open Backend Health URL (`https://stratiq-backend.onrender.com/api/health`) | Returns JSON: `{"status": "ok", "database": "connected"}` |
| **3** | Open Main Client on Vercel (`https://stratiq-app.vercel.app`) | App loads smoothly with animated UI, cards, and auth modals |
| **4** | Register a new user on Main Site | User registers, saves in MongoDB Atlas with encrypted password |
| **5** | Open Admin Panel on Vercel (`https://stratiq-admin.vercel.app`) | Isolated security screen opens with passkey prompt |
| **6** | Unlock Admin Portal with Master Key | Portal loads real data from MongoDB via Render backend |
| **7** | Click "Backend: <host>" badge in Admin navbar | Settings modal opens, test ping returns "Online! Service: Ready" |

---

## Troubleshooting Tips

### 1. Render Free Tier "Cold Start" Spin-Up
Render free tier Web Services spin down after 15 minutes of inactivity. When you make a request after inactivity, it may take 30-50 seconds to wake up.
- *Fix*: You can use a free uptime monitor (like [UptimeRobot](https://uptimerobot.com/) or [Cron-Job.org](https://cron-job.org/)) to ping `https://<your-backend>.onrender.com/api/health` every 10 minutes to keep it warm.

### 2. CORS Errors in Browser Console
If you see `Access to fetch has been blocked by CORS policy`:
- The backend in [`server/src/index.ts`](./server/src/index.ts) is already configured to automatically accept **any** `*.vercel.app` origin as well as `localhost`.
- If you use a custom domain on Vercel (e.g. `admin.mycompany.com`), add it to the `CORS_ORIGIN` environment variable on Render:
  `CORS_ORIGIN=https://mycompany.com,https://admin.mycompany.com`

### 3. MongoDB Connection Timeout
If Render logs show `MongoServerSelectionError`:
- Ensure you whitelisted `0.0.0.0/0` under **Network Access** in your MongoDB Atlas dashboard.
- Verify your database user username & password in `MONGODB_URI` have no special characters that need URL encoding (e.g. `@` should be `%40`).

---

## Summary of Projects & Folders

| Directory | Deployment Target | Role | Config File |
| :--- | :--- | :--- | :--- |
| `server/` | **Render Web Service** | Express API, MongoDB, Gemini AI, Admin API | [`render.yaml`](./render.yaml), [`server/.env.example`](./server/.env.example) |
| `client/` | **Vercel Project 1** | Main User-facing AI Business Advisory App | [`client/vercel.json`](./client/vercel.json), [`client/.env.example`](./client/.env.example) |
| `admin/` | **Vercel Project 2** | Standalone Enterprise Admin Registration Registry | [`admin/vercel.json`](./admin/vercel.json), [`admin/config.js`](./admin/config.js) |
