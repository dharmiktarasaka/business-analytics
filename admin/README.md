# STRATIQ Standalone Restricted Admin Portal

An **isolated, standalone administrative portal** located exclusively in the **`admin/`** folder.

It is **NOT linked anywhere on the main website** (regular users have zero visibility or navigation to admin pages), while securely connecting to the backend to stream real-time registration intake data with zero-knowledge password protection.

---

## 📁 Standalone Architecture (`admin/`)

All admin code, views, assets, and authentication logic live strictly inside this standalone directory:

```
business-analytics/
├── admin/                         # Isolated Standalone Admin Portal
│   ├── index.html                 # Secure Admin Web App with Lock Gate
│   ├── app.js                     # Secure API client, live filters & modal logic
│   ├── styles.css                 # Dark-mode enterprise UI & glassmorphism theme
│   ├── server.js                  # Standalone local HTTP server (Port 5174)
│   ├── package.json               # Standalone npm scripts
│   └── README.md                  # Documentation & Security guide
├── client/                        # Main Website (100% Unlinked from Admin)
└── server/                        # API Server with Protected /api/admin Endpoints
```

---

## 🔒 Full Security Features

### 1. Zero Website Linking
- **No navigation items**: Completely removed from Navbar, Sidebar, and client routes.
- Regular visitors to the website have no way to access or discover the admin panel.

### 2. Master Passkey Gate (`x-admin-key`)
- Access to the admin portal requires authentication with the **Master Admin Passkey**.
- **Default Master Key**: `stratiq@admin2026` (configured via `ADMIN_SECRET_KEY` in `server/.env`).
- Every API request sends the encrypted security header:
  ```http
  x-admin-key: stratiq@admin2026
  ```
- Unauthorized requests or attempts without the passkey are rejected with `401 Unauthorized`.

### 3. Encrypted & Hidden Password Policy
- **Zero Cleartext Exposure**: User passwords are encrypted in the database.
- **Masked by Default**: Rendered in the UI as `••••••••••••` with a security shield.
- **Audit Hash Inspection**: Admins can click **"Show Encrypted Hash"** to inspect the salted cryptographic token (`enc_aes256_...` or SHA-256 digest) with a one-click copy button.
- **Complexity Metadata**: Displays algorithm rating (`Enterprise`, `Strong`) and character count without exposing raw secrets.

---

## 📋 Registration Intake Details Displayed

For every registered user in the system, the portal displays:
- **Full Display Name** (`displayName`)
- **Registered Gmail / Corporate Email** (`email`)
- **Mobile / Phone Number** (`mobileNumber`)
- **Reported Business Yearly Revenue** (`yearlyRevenue`)
- **Enterprise / Business Name** (`businessName`)
- **Registration Timestamp & Relative Time** (`createdAt`, e.g. *"2 hours ago"*)
- **Unique System UID** (`uid`)
- **Associated Business Profile**: Industry, Country, Business Model, Growth Stage, and Completion %
- **Advisory Engagement**: Strategic AI analyses generated

---

## 🚀 How to Run the Admin Portal

### Option A: Standalone Admin Server (Recommended)
From the project root:
```bash
npm run admin
```
Or directly inside the `admin` folder:
```bash
cd admin
npm start
```
> Opens the isolated admin portal on **`http://localhost:5174`**

### Option B: Built-in Express Route
The backend server (`http://localhost:5000`) also securely serves the `admin/` static files at:
> **`http://localhost:5000/admin`** or **`http://localhost:5000/admin-portal`**

### Option C: Direct File Opening
You can double-click and open **`admin/index.html`** directly in any modern browser!

---

## 🔑 Login Credentials

- **Master Passkey**: `stratiq@admin2026`
- **Connected API**: `http://localhost:5000/api/admin`
