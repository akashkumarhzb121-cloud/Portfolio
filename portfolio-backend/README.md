# Portfolio Backend Service

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.2-black?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Mongoose-emerald?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Render Ready](https://img.shields.io/badge/Render-Configured-46E3B7?logo=render&logoColor=white)](https://render.com)

A small contact API that validates enquiries, stores them in MongoDB, and sends inbox notifications through Resend.

---

## Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Separation & Independence](#project-separation--independence)
- [Endpoint Specifications](#endpoint-specifications)
- [Environment Variables](#environment-variables)
- [Local Setup & Development](#local-setup--development)
- [Automated Testing](#automated-testing)
- [MongoDB Atlas Setup Guide](#mongodb-atlas-setup-guide)
- [Resend Setup](#resend-email-setup)
- [Render Deployment Guide](#render-deployment-guide)
- [Failure & Duplicate Submission Policy](#failure--duplicate-submission-policy)

---

## Architecture & Tech Stack

- **Runtime**: Node.js (>= 20) with ESM (`"type": "module"`)
- **Language**: TypeScript with strict types (`NodeNext` resolution)
- **Framework**: Express 5
- **Database & ODM**: MongoDB Atlas with Mongoose
- **Validation**: Zod schema validation
- **Email**: Resend HTTP API
- **Security & Protection**:
  - `helmet`: Secure HTTP response headers
  - `cors`: Strict origin whitelisting (`FRONTEND_ORIGINS`) with no wildcards
  - `express-rate-limit`: IP-based rate limiting (5 requests per 15 minutes)
  - Request body payload size cap (`32kb`) to prevent memory exhaustion attacks
- **Testing**: Vitest + Supertest

---

## Project Separation & Independence

- **Backend (`portfolio-backend`)**: Deployed as an independent Web Service on **Render**.
- **Frontend (`portfolio-frontend`)**: Deployed as a static application on **Vercel**.
- **Root Directory Rule**:
  - Render must be pointed to `portfolio-backend` as its Root Directory.
  - Vercel must be pointed to `portfolio-frontend` as its Root Directory.
  - Backend secrets (`MONGODB_URI`, `RESEND_API_KEY`) must **never** be placed in frontend code or Vercel environment variables.

---

## Endpoint Specifications

### 1. Health Check
- **Method**: `GET /health` (also available at `/api/health`)
- **Purpose**: Render health check probe and uptime monitoring.
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "portfolio-backend",
  "timestamp": "2026-09-27T12:00:00.000Z",
  "uptime": 128
}
```

---

### 2. Contact Inquiry Submission
- **Method**: `POST /api/contact`
- **Rate Limit**: 5 submissions per 15 minutes per IP address.
- **Request Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "service": "Full-Stack Web Development",
  "message": "We would like to discuss building an AI-powered SaaS product."
}
```

#### Field Validation Rules
| Field | Type | Rules | Example |
| :--- | :--- | :--- | :--- |
| `name` | string | Trimmed, min 2 chars, max 100 chars | `"Akash Kumar"` |
| `email` | string | Trimmed, valid email format, max 255 chars | `"contact@example.com"` |
| `service` | string | Trimmed, min 1 char, max 100 chars | `"Full-Stack Web Development"` |
| `message` | string | Trimmed, min 10 chars, max 5000 chars | `"Project details..."` |

#### Responses
- **`201 Created`**: The enquiry was saved to MongoDB. Resend notification is dispatched asynchronously and may fail independently.
```json
{
  "success": true,
  "message": "Message received successfully! I will reply shortly."
}
```
- **`400 Bad Request`**: Validation failed or malformed JSON payload.
```json
{
  "success": false,
  "message": "Validation failed. Please check your submission.",
  "errors": {
    "email": ["Please provide a valid email address"]
  }
}
```
- **`429 Too Many Requests`**: Rate limit exceeded for this IP.
```json
{
  "success": false,
  "message": "Too many contact requests from this network. Please wait 15 minutes before retrying or reach out directly via email."
}
```
- **`500 Internal Server Error`**: MongoDB database persistence failed.
```json
{
  "success": false,
  "message": "Database error: unable to save your enquiry. Please try again or email directly."
}
```
Email notification failures are logged by the backend and do not change the response after the enquiry has been saved.

---

## Environment Variables

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port for Express server (assigned automatically on Render) |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGODB_URI` | **Required** | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/portfolio` | Connection URI for MongoDB Atlas database |
| `FRONTEND_ORIGINS`| **Required** | `http://localhost:5173,https://your-portfolio.vercel.app` | Comma-separated whitelist of allowed frontend origins (CORS) |
| `RESEND_API_KEY` | **Required** | `re_...` | Resend API key |
| `CONTACT_EMAIL` | Optional | `akashkumarhzb121@gmail.com` | Inbox that receives contact notifications |

Create a `.env` file in this directory for local development and set `RESEND_API_KEY`. Contact notifications are sent from `onboarding@resend.dev` until a sender domain is verified.

---

## Local Setup & Development

### 1. Install Dependencies
```bash
cd portfolio-backend
npm install
```

### 2. Configure Environment
Create `.env` using `.env.example` as a template and fill in your real credentials.

### 3. Run Development Server
```bash
npm run dev
```
Starts server with `tsx watch` for auto-reloading upon file changes.

### 4. Build Production Bundle
```bash
npm run build
```
Compiles TypeScript into `dist/`.

### 5. Start Production Server
```bash
npm start
```
Runs `node dist/server.js`.

---

## Automated Testing

The backend includes a complete test suite powered by Vitest and Supertest testing all happy and edge paths:
- Health check endpoints (`/health` and `/api/health`)
- Input validation (name, email, service, message lengths & formats)
- MongoDB save failure handling (`500`)
- Email failure handling (`502` with enquiry record saved)
- Centralized error and 404 handlers

Run tests once:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run TypeScript type check without emitting:
```bash
npm run typecheck
```

---

## Resend Email Setup

1. Create an API key in your [Resend dashboard](https://resend.com/api-keys).
2. Set `RESEND_API_KEY` in the backend environment.
3. Set `CONTACT_EMAIL` to the inbox that should receive portfolio enquiries.
4. Until your sending domain is verified, the backend uses `onboarding@resend.dev` as the sender. Resend sandbox restrictions may limit recipients to the account owner.

---

## MongoDB Atlas Setup Guide

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Sandbox** or production cluster.
3. Under **Database Access**, create a user with `Read and write to any database` privileges.
4. Under **Network Access**, add an IP Access entry:
   - For Render deployment, add `0.0.0.0/0` (Allow access from anywhere) since Render instances use dynamic outbound IPs.
5. In your cluster dashboard, click **Connect** -> **Drivers** -> **Node.js**.
6. Copy the connection string into `MONGODB_URI`, replacing `<username>` and `<password>`.
   *(Note: If you accidentally keep `<>` in your password, the backend automatically sanitizes it).*

---

## Render Deployment Guide & Troubleshooting

### Why the Initial Deploy Error Occurred:
If you encountered:
```
Error: Cannot find module '/opt/render/project/src/portfolio-backend/index.js'
```
This happens when Render uses its default Web Service settings:
- Default Build Command: `npm install` (which skipped building TypeScript `dist/`)
- Default Start Command: `node index.js` (which looked for `index.js` in root)

### How We Fixed It (100% Fail-Safe):
1. **Added `index.js` Launcher**: Root `index.js` delegates directly to `./dist/server.js`.
2. **Added `postinstall` Script**: `npm install` now automatically triggers `tsc -p tsconfig.json`, building `dist/` even if you leave the default build command as `npm install`.
3. **Updated `"main"`**: Points to `dist/server.js`.

### Render Web Service Settings:
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service** (or edit your existing service).
3. Configure the Web Service settings:
   - **Name**: `portfolio-backend`
   - **Root Directory**: `portfolio-backend` *(crucial!)*
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build` (or `npm run build`)
   - **Start Command**: `npm start` (or `node dist/server.js`)
   - **Plan**: `Free`
4. In **Advanced** -> **Health Check Path**:
   - Set to `/health`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your MongoDB Atlas connection string>`
   - `FRONTEND_ORIGINS`: `https://your-portfolio.vercel.app,http://localhost:5173`
   - `RESEND_API_KEY`: `<your Resend API key>`
   - `CONTACT_EMAIL`: `<inbox for notifications>`
6. Click **Manual Deploy** -> **Deploy latest commit**.
7. Once deployed, verify `https://your-service.onrender.com/health` returns status `200 OK`.

---

## Failure & Duplicate Submission Policy

- **Persistence First**: The API returns `201 Created` as soon as an enquiry is saved. Resend notifications run asynchronously; a success response confirms persistence, not inbox delivery.
- **Delivery Diagnostics**: Resend failures are logged server-side with the enquiry ID and delivery error.
- **Retry Handling**: If a visitor retries after an uncertain network failure, a fresh enquiry record is created in MongoDB with its own unique `_id` and timestamp. The site owner can retrieve all enquiries directly from MongoDB Atlas at any time.
