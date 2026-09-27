# Portfolio Backend Service

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.2-black?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Mongoose-emerald?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Resend](https://img.shields.io/badge/Resend-Email_API-black?logo=resend&logoColor=white)](https://resend.com)
[![Render Ready](https://img.shields.io/badge/Render-Configured-46E3B7?logo=render&logoColor=white)](https://render.com)

A high-reliability, production-ready backend service providing contact inquiry capture, strict input validation, MongoDB Atlas persistence, rate limiting, and Resend email notifications for Akash Kumar's portfolio.

---

## Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Separation & Independence](#project-separation--independence)
- [Endpoint Specifications](#endpoint-specifications)
- [Environment Variables](#environment-variables)
- [Local Setup & Development](#local-setup--development)
- [Automated Testing](#automated-testing)
- [MongoDB Atlas Setup Guide](#mongodb-atlas-setup-guide)
- [Resend Setup Guide](#resend-setup-guide)
- [Render Deployment Guide](#render-deployment-guide)
- [Failure & Duplicate Submission Policy](#failure--duplicate-submission-policy)

---

## Architecture & Tech Stack

- **Runtime**: Node.js (>= 20) with ESM (`"type": "module"`)
- **Language**: TypeScript with strict types (`NodeNext` resolution)
- **Framework**: Express 5
- **Database & ODM**: MongoDB Atlas with Mongoose
- **Validation**: Zod schema validation
- **Email Engine**: Resend API
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
- **`201 Created`**: Both MongoDB persistence and Resend email notification succeeded.
```json
{
  "success": true,
  "message": "Message delivered successfully! I will reply shortly."
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
- **`502 Bad Gateway`**: Enquiry was recorded in MongoDB Atlas, but Resend email dispatch failed.
```json
{
  "success": false,
  "message": "Your enquiry was recorded in the database, but email notification delivery failed. Please reach out directly if urgent.",
  "enquiryId": "65fc12a3b4c5d6e7f8a90123"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` in `portfolio-backend`:
```bash
cp .env.example .env
```

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port for Express server (assigned automatically on Render) |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGODB_URI` | **Required** | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/portfolio` | Connection URI for MongoDB Atlas database |
| `FRONTEND_ORIGINS`| **Required** | `http://localhost:5173,https://your-portfolio.vercel.app` | Comma-separated whitelist of allowed frontend origins (CORS) |
| `RESEND_API_KEY` | **Required** | `re_xxxxxxxxxxxxxxxxxxxx` | Secret API key from Resend dashboard |
| `CONTACT_EMAIL` | **Required** | `akash@example.com` | Destination inbox for enquiry notifications |
| `EMAIL_FROM` | Optional | `Portfolio Contact <onboarding@resend.dev>` | Verified sender email address |

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
- Resend email failure handling (`502` with enquiry record saved)
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

## MongoDB Atlas Setup Guide

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Sandbox** or production cluster.
3. Under **Database Access**, create a user with `Read and write to any database` privileges.
4. Under **Network Access**, add an IP Access entry:
   - For Render deployment, add `0.0.0.0/0` (Allow access from anywhere) since Render instances use dynamic outbound IPs.
5. In your cluster dashboard, click **Connect** -> **Drivers** -> **Node.js**.
6. Copy the connection string into `MONGODB_URI`, replacing `<username>` and `<password>`. Example:
   ```env
   MONGODB_URI=mongodb+srv://my_user:secretpassword@cluster0.mongodb.net/portfolio?retryWrites=true&w=majority
   ```

---

## Resend Setup Guide

1. Register at [Resend.com](https://resend.com/).
2. Go to **API Keys** and generate a new key with sending permissions.
3. Paste the key into `RESEND_API_KEY`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   ```
4. For initial testing, set `EMAIL_FROM=Portfolio Contact <onboarding@resend.dev>`.
5. For production, add and verify your custom domain in Resend DNS settings, then set `EMAIL_FROM=Portfolio Contact <contact@yourdomain.com>`.

---

## Render Deployment Guide

1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing `portfolio-backend`.
4. Configure the Web Service settings:
   - **Name**: `portfolio-backend` (or your preferred name)
   - **Root Directory**: `portfolio-backend` *(crucial!)*
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
5. In **Advanced** -> **Health Check Path**:
   - Set to `/health`
6. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your MongoDB Atlas connection string>`
   - `FRONTEND_ORIGINS`: `https://your-portfolio.vercel.app,http://localhost:5173`
   - `RESEND_API_KEY`: `<your Resend API key>`
   - `CONTACT_EMAIL`: `<your recipient email>`
   - `EMAIL_FROM`: `Portfolio Contact <onboarding@resend.dev>` (or your verified domain)
7. Click **Create Web Service**.
8. Once deployed, copy your Render public URL (e.g. `https://portfolio-backend-xyz.onrender.com`).
9. Update your frontend environment variable `VITE_CONTACT_FORM_ENDPOINT` to `https://portfolio-backend-xyz.onrender.com/api/contact`.

---

## Failure & Duplicate Submission Policy

- **Atomic Status Tracking**: Every enquiry begins with `emailStatus: 'pending'`. Upon email dispatch confirmation, it transitions to `'sent'`. If email dispatch fails, it is marked as `'failed'` with `emailError` containing the exact error.
- **No False Positives**: The frontend is explicitly notified via `502 Bad Gateway` if email delivery fails. It will **never** display a success toast if your inbox was not reached.
- **Retry Handling**: If a visitor retries after an email delivery failure or network error, a fresh enquiry record is created in MongoDB with its own unique `_id` and timestamp. The site owner can still retrieve all enquiries directly from MongoDB Atlas at any time.
