# WhatsApp Automation Platform

> **A production-ready, highly secure, and scalable self-hosted WhatsApp automation platform.** Built with Next.js, Node.js/Express, MongoDB, and Baileys.

![License](https://img.shields.io/badge/license-Private-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Express%20%7C%20MongoDB-green)

---

## 📖 Table of Contents

1. [Platform Overview](#-platform-overview)
2. [Key Features](#-key-features)
3. [Architecture & Tech Stack](#-architecture--tech-stack)
4. [Getting Started (Local Development)](#-getting-started-local-development)
5. [Production Deployment](#-production-deployment)
6. [Security Implementation](#-security-implementation)
7. [API Documentation & Examples](#-api-documentation--examples)
8. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Platform Overview

The **WhatsApp Automation Platform** is a full-stack monorepo designed to manage a WhatsApp connection programmatically while providing a beautiful, Notion-inspired dashboard to monitor and interact with the service.

Unlike SaaS alternatives that charge per message or per month, this platform is completely self-hosted, ensuring that **your messages, contacts, and API keys never leave your infrastructure.** It connects directly to WhatsApp Web's socket API using the `Baileys` library.

---

## ✨ Key Features

### 🛡️ Security First
- **Zero-Trust Auth:** No signups. Accounts are strictly provisioned by the admin via seed scripts.
- **Stateless JWTs:** Uses `HttpOnly`, `Secure`, `SameSite=Strict` cookies. No tokens in local storage.
- **Brute-Force Protection:** Rate limiting and automatic 30-minute account lockouts after 5 failed attempts.
- **Injection Proof:** Strict `Zod` validation on all endpoints + NoSQL injection sanitization.

### 📱 WhatsApp Integration
- **Persistent Sessions:** Scan the QR code once. The session is saved to the disk and automatically restored on restarts.
- **Auto-Reconnect:** Built-in exponential backoff for network drops.
- **Full Sync:** Automatically synchronizes contacts, chat history, and new messages to MongoDB.
- **Media Support:** Send text, images, videos, audio, and documents with auto-MIME validation.

### 📊 Dashboard & Monitoring
- **Real-time Stats:** Monitor RAM usage, MongoDB status, and WhatsApp connection state.
- **Audit Logging:** Every login, failed attempt, and WhatsApp state change is logged and auto-deleted after 30 days.
- **Swagger UI:** Built-in interactive API documentation at `/api/docs`.

---

## 🏗️ Architecture & Tech Stack

The repository is structured as a Monorepo:

### 1. Backend (Server)
- **Node.js + Express:** High-performance REST API.
- **TypeScript:** Strict typing for all controllers, services, and middleware.
- **Mongoose + MongoDB:** Data persistence for chats, contacts, messages, and logs.
- **Baileys:** The core WhatsApp Web socket library.
- **Pino & Winston:** Pino for silent Baileys internal logging, Winston for structured application logging.

### 2. Frontend (Client)
- **Next.js 14 (App Router):** Fast, React-based dashboard.
- **Vanilla CSS:** Custom design system without heavy frameworks like Tailwind, keeping CSS payload under 20kb.
- **Lucide Icons:** Clean, lightweight SVG icons.
- **Client-Side Fetching:** Optimized API wrappers with automatic session cookie forwarding.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js** `v18.0.0` or higher
- **MongoDB** running locally on port `27017` (or a remote URI)

### 2. Configure Environment
Create the environment file at the root of the project:
```bash
cp .env.example .env
```
Edit `.env` and provide secure values for `JWT_SECRET` and `COOKIE_SECRET` (generate them using `openssl rand -hex 32`).

### 3. Install Dependencies
Install packages for both the server and the client using the root script:
```bash
npm run install:all
```

### 4. Create Admin Account
Before you can log in, you must seed the database with the initial admin user. The credentials will be pulled from `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your `.env` file.
```bash
npm run seed
```

### 5. Start the Monorepo
Run both the Next.js frontend and Express backend concurrently:
```bash
npm run dev
```

- **Dashboard:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:3001](http://localhost:3001)
- **Swagger Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🌍 Production Deployment

This platform includes production-ready Docker and PM2 configurations.

### Option A: Docker Compose (Recommended)
This approach sets up MongoDB, the Node.js API, and the Next.js client in isolated containers with auto-restart policies.

```bash
# 1. Prepare environment variables
cp .env.example .env
nano .env # Set NODE_ENV=production and secure passwords

# 2. Build and start containers in the background
docker compose up -d --build

# 3. Seed the admin account (Run once)
docker exec wa_server node dist/scripts/seed.js
```

### Option B: PM2 on a VPS (Ubuntu/Debian)
If you prefer running directly on the host machine:

```bash
# 1. Build projects
npm run build

# 2. Start using the ecosystem config
pm2 start ecosystem.config.js --env production

# 3. Save PM2 state for reboots
pm2 save
pm2 startup
```

### Reverse Proxy (Nginx)
Use the provided `nginx/nginx.conf` as a template. It includes:
- SSL/TLS configuration
- Path routing (`/api/` -> Express, `/` -> Next.js)
- Rate limiting zones
- Security headers (HSTS, X-Frame-Options)

---

## 🔒 Security Implementation

Security is a primary focus. Here is how common attack vectors are mitigated:

| Threat Vector | Mitigation Strategy |
|---------------|---------------------|
| **XSS (Cross-Site Scripting)** | Next.js auto-escapes React variables. API uses Helmet for strict Content Security Policies (CSP). |
| **CSRF (Cross-Site Request Forgery)** | Authentication relies on `SameSite=Strict` cookies, preventing cross-origin credential attachment. |
| **Session Hijacking** | Tokens are hashed (SHA-256) before storing in MongoDB. A stolen database leak will not reveal valid tokens. |
| **Brute Force Attacks** | Configurable rate-limiting. Default: 5 failed logins triggers a 30-minute lock for the IP/Username. |
| **NoSQL Injection** | `express-mongo-sanitize` strips `$` and `.` operators from all incoming JSON bodies and query strings. |
| **Path Traversal** | File uploads are rigorously validated. Paths are normalized using `path.join` and checked against the base upload directory. |

---

## 💻 API Documentation & Examples

A fully interactive Swagger/OpenAPI 3.0 playground is available at `/api/docs`. 

All `/api/whatsapp/*`, `/api/chats/*`, and `/api/send/*` routes require a valid session cookie.

### Example: Sending a Text Message

**Using cURL:**
```bash
curl -X POST http://localhost:3001/api/send/text \
  -H "Content-Type: application/json" \
  -H "Cookie: wa_token=<YOUR_SESSION_TOKEN>" \
  -d '{"to": "919876543210", "text": "Hello from WA Platform!"}'
```

**Using Fetch (JavaScript):**
```javascript
const response = await fetch('http://localhost:3001/api/send/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Note: 'credentials: include' must be set in browsers to send cookies
  },
  body: JSON.stringify({
    to: '919876543210',
    text: 'Hello from WA Platform!'
  })
});
const data = await response.json();
```

### Example: Sending an Image

When sending media, use `multipart/form-data`.

**Using cURL:**
```bash
curl -X POST http://localhost:3001/api/send/image \
  -H "Cookie: wa_token=<YOUR_SESSION_TOKEN>" \
  -F "to=919876543210" \
  -F "caption=Here is the invoice" \
  -F "file=@/path/to/local/invoice.jpg"
```

---

## 🛠️ Troubleshooting & FAQ

**Q: I get `Error: listen EADDRINUSE: address already in use :::3000`**  
**A:** Another process is using port 3000 or 3001. Run `killall -9 node` or use `lsof -ti :3000 | xargs kill -9` to free the ports.

**Q: WhatsApp keeps disconnecting or logging out.**  
**A:** Ensure your `SESSION_DIR` is persistent. If using Docker, ensure the `server_sessions` volume is properly mapped. If the session folder is wiped on restart, you will have to re-scan the QR code.

**Q: Cannot send files larger than 1MB.**  
**A:** Check the `MAX_FILE_SIZE` variable in your `.env`. Also, if using Nginx, ensure `client_max_body_size` is set high enough (e.g., `client_max_body_size 12M;`).

**Q: The dashboard loads but shows "Not connected" and no QR code.**  
**A:** Click the "Reconnect" button on the WhatsApp page. If the Baileys socket closed due to a timeout, this forces a fresh connection attempt and will generate a new QR code.

---

## 📄 License

This software is for private, self-hosted use. It is not affiliated with, endorsed, or sponsored by WhatsApp or Meta Platforms, Inc. Usage of this software must comply with WhatsApp's Terms of Service.
