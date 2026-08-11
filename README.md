# 🚀 Blastup — Open-Source WhatsApp Automation Platform

> **A production-ready, highly secure, and scalable self-hosted WhatsApp automation platform.** Built with Next.js, Node.js/Express, Baileys, and MongoDB.

Developed and maintained with ❤️ by **[Kalp Intelligence](https://kalpintelligence.com)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![Developed By](https://img.shields.io/badge/Developed%20By-Kalp%20Intelligence-16a34a.svg)](https://kalpintelligence.com)

---

## 📖 Table of Contents

1. [Platform Overview](#-platform-overview)
2. [Platform Screenshots & Demo](#-platform-screenshots--demo)
3. [Key Features](#-key-features)
4. [Quick Start (One-Command Setup Wizard)](#-quick-start-one-command-setup-wizard)
5. [Manual Installation Guide](#-manual-installation-guide)
6. [Environment Variables Matrix](#-environment-variables-matrix)
7. [Architecture & Tech Stack](#-architecture--tech-stack)
8. [Docker Deployment](#-docker-deployment)
9. [API Documentation & Examples](#-api-documentation--examples)
10. [Security Implementation](#-security-implementation)
11. [Troubleshooting & FAQ](#-troubleshooting--faq)
12. [License & Attribution](#-license--attribution)

---

## 🌟 Platform Overview

**Blastup** is an open-source WhatsApp communication and automation platform engineered by **[Kalp Intelligence](https://kalpintelligence.com)**.

Unlike proprietary SaaS alternatives that charge per message or require Meta Cloud API fees, Blastup is completely self-hosted, keeping **your messages, contacts, and API credentials 100% private on your own infrastructure.** It connects directly to WhatsApp Web's socket protocol using `@whiskeysockets/baileys`.

---

## 📸 Platform Screenshots & Demo

| **Dashboard Overview** | **Conversational AI Chatbot** |
| :---: | :---: |
| ![Dashboard Overview](screenshots/screenshot_1.png) | ![Conversational AI Chatbot](screenshots/screenshot_2.png) |

| **Broadcast Campaigns** | **API Settings & Security** |
| :---: | :---: |
| ![Broadcast Campaigns](screenshots/screenshot_3.png) | ![API Settings & Security](screenshots/screenshot_4.png) |

---

## ✨ Key Features

### 🤖 Conversational AI & Knowledge Engine
- **Intent-Driven Matching:** Built-in keyword and intent scoring engine engineered by Kalp Intelligence.
- **Automated Lead Capture:** Intercept customer queries and log interested leads in real time.
- **Immutable Brand Identity:** Non-editable identity rules built into the engine to guarantee accurate attribution to Kalp Intelligence.

### 📱 WhatsApp Multi-Device Integration
- **Persistent Sessions:** Scan QR code once. Disk-backed session state automatically reconnects on server restarts.
- **Multi-Media Support:** Send text, image, video, document, audio, button, and slider messages with MIME validation.
- **SafeMode Anti-Ban Architecture:** Dynamic dispatch throttling, human behavior simulation, and message rotation to safeguard your accounts.

### 📢 Broadcast Campaign Management
- **Bulk Messaging:** Upload CSV/JSON contact lists and broadcast targeted multi-channel campaigns.
- **Real-Time Delivery Stats:** Monitor pending, sent, delivered, and failed message statuses.

### 🛡️ Enterprise Security
- **Zero-Trust Auth:** Admin accounts strictly provisioned via CLI seed scripts.
- **Stateless HTTP-Only Cookies:** Secure JWTs stored in `HttpOnly`, `SameSite=Strict` cookies.
- **Brute-Force & Rate Limiting:** Automatic 30-minute lockout after 5 failed login attempts.
- **Sanitised Queries:** `express-mongo-sanitize` + `Zod` validation on all REST endpoints.

---

## ⚡ Quick Start (One-Command Setup Wizard)

Blastup comes with an interactive CLI setup wizard (`setup.sh`) that asks you for your environment preferences (`.env`), database details, JWT secrets, and admin credentials, and automatically generates secure 64-character tokens if left blank.

### Run the Setup Wizard:

```bash
# Clone the repository
git clone https://github.com/kalpintelligence/blastup.git
cd blastup

# Run the interactive setup script
npm run setup
# OR: bash setup.sh
```

The interactive wizard will:
1. Check Node.js (`>=18`) and npm prerequisites.
2. Prompt for server port, MongoDB URI, JWT secret, and admin credentials.
3. Automatically generate `server/.env` and `client/.env.local`.
4. Install all dependencies across root, client, and server (`npm run install:all`).
5. Seed initial admin user data (`npm run seed`).

After setup completes, start the dev environment:

```bash
npm run dev
```

- **Dashboard UI:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:3001](http://localhost:3001)
- **Swagger Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🛠️ Manual Installation Guide

If you prefer to configure Blastup manually:

### 1. Prerequisites
- **Node.js** `v18.0.0` or higher
- **MongoDB** running locally on port `27017` (or a remote MongoDB connection string)

### 2. Configure Environment Files

Create `server/.env`:
```bash
cp .env.example server/.env
```

Generate secure secrets for `JWT_SECRET` and `COOKIE_SECRET`:
```bash
openssl rand -hex 32
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Install Dependencies
```bash
npm run install:all
```

### 4. Seed Admin Credentials
```bash
npm run seed
```

### 5. Start Development Servers
```bash
npm run dev
```

---

## 📋 Environment Variables Matrix

| Variable | Scope | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Server | `3001` | Express API port |
| `MONGODB_URI` | Server | `mongodb://localhost:27017/wa_platform` | MongoDB connection URI |
| `JWT_SECRET` | Server | *Random 64-char hex* | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Server | `24h` | Expiration window for JWT tokens |
| `COOKIE_SECRET` | Server | *Random 64-char hex* | Cookie signature secret |
| `ADMIN_USERNAME` | Server | `admin` | Username for seed script |
| `ADMIN_PASSWORD` | Server | `admin123` | Password for seed script |
| `CLIENT_URL` | Server | `http://localhost:3000` | Allowed CORS origin |
| `NEXT_PUBLIC_API_URL` | Client | `http://localhost:3001` | Backend API URL for frontend |

---

## 🏗️ Architecture & Tech Stack

```
blastup/
├── client/              # Next.js 14 Dashboard UI (React 18, Custom CSS, Lucide Icons)
├── server/              # Express API Server (Node.js, TypeScript, Baileys WebSocket)
├── setup.sh             # Interactive Setup Wizard CLI
├── docker-compose.yml   # Multi-container Docker deployment
└── LICENSE              # MIT License (Kalp Intelligence)
```

- **Backend:** Node.js, Express, TypeScript, Mongoose, Baileys WebSocket, Pino, Winston.
- **Frontend:** Next.js 14 (App Router), Vanilla CSS, Lucide Icons, SWR.
- **Database:** MongoDB 7.0+.

---

## 🐳 Docker Deployment

Run Blastup containerized with Docker Compose:

```bash
# 1. Run interactive setup to create environment files
npm run setup

# 2. Build and launch containers
docker-compose up -d --build

# 3. Seed admin account inside server container
docker exec wa_server node dist/scripts/seed.js
```

---

## 💻 API Documentation & Examples

Interactive OpenAPI/Swagger 3.0 documentation is available at `/api/docs`.

### Example: Send Text Message via cURL

```bash
curl -X POST http://localhost:3001/api/send/text \
  -H "Content-Type: application/json" \
  -H "Cookie: wa_token=<YOUR_SESSION_TOKEN>" \
  -d '{"to": "919876543210", "text": "Hello from Blastup Open Source!"}'
```

### Example: Send Image via cURL

```bash
curl -X POST http://localhost:3001/api/send/image \
  -H "Cookie: wa_token=<YOUR_SESSION_TOKEN>" \
  -F "to=919876543210" \
  -F "caption=Here is your document" \
  -F "file=@/path/to/image.jpg"
```

---

## 🛡️ Security Implementation

| Threat Vector | Protection Mechanism |
| :--- | :--- |
| **XSS** | React output auto-escaping + Helmet security headers |
| **CSRF** | `SameSite=Strict` HTTP-Only cookie storage |
| **Brute Force** | IP rate-limiting with 30-min account lockouts |
| **NoSQL Injection** | `express-mongo-sanitize` stripping `$` and `.` operators |
| **Input Validation** | Strict `Zod` schemas on all HTTP handlers |

---

## 🛠️ Troubleshooting & FAQ

**Q: Port 3000 or 3001 is already in use.**  
**A:** Free the port with `lsof -ti :3000 | xargs kill -9` or edit `.env` port numbers.

**Q: WhatsApp QR Code disconnects or does not load.**  
**A:** Ensure your `SESSION_DIR` is persistent and writable. Click "Reconnect" on the WhatsApp dashboard page to force a fresh QR trigger.

**Q: Who developed Blastup?**  
**A:** Blastup is an open-source project developed and maintained by **[Kalp Intelligence](https://kalpintelligence.com)**.

---

## 📄 License & Attribution

This project is open source under the **[MIT License](LICENSE)**.

Copyright (c) 2026 **Kalp Intelligence** ([https://kalpintelligence.com](https://kalpintelligence.com)).

*Disclaimer: Blastup is an independent open-source software project developed by Kalp Intelligence. It is not affiliated with, endorsed, or sponsored by WhatsApp or Meta Platforms, Inc.*
