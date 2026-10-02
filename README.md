# Akash Kumar · Full-Stack Developer Portfolio & SKY AI Assistant

[![React 19](https://img.shields.io/badge/Frontend-React_19-blue?logo=react&logoColor=white)](https://react.dev/)
[![Node.js 20+](https://img.shields.io/badge/Backend-Node.js_20%2B-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_Strict-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/3D_Graphics-Three.js_%2B_OGL-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Groq AI](https://img.shields.io/badge/AI_Engine-Groq_Llama_3.3_70B-orange?logo=fastapi&logoColor=white)](https://groq.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-emerald?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel Ready](https://img.shields.io/badge/Frontend_Deploy-Vercel-black?logo=vercel&logoColor=white)](https://skykumar.vercel.app/)
[![Render Ready](https://img.shields.io/badge/Backend_Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![Tests Passing](https://img.shields.io/badge/Vitest-116%20Passed-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)

Welcome to the source code repository for Akash Kumar's production developer portfolio. This system combines **creative frontend engineering** (WebGL shaders, real-time Rapier 3D physics, GSAP timelines, and Lenis smooth scrolling) with a **production backend** hosting **SKY AI**, a conversational assistant powered by **RAG (Retrieval-Augmented Generation)** on Groq Cloud LPUs with an administrative conversation management dashboard.

- **Live Frontend**: [skykumar.vercel.app](https://skykumar.vercel.app/)
- **Backend API**: Hosted on Render (`https://portfolio-backend.onrender.com`)

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Repository Organization](#repository-organization)
- [Technology Stack & Roles](#technology-stack--roles)
- [How SKY AI (RAG Assistant) Works](#how-sky-ai-rag-assistant-works)
- [End-to-End Chatbot Flowchart](#end-to-end-chatbot-flowchart)
- [Local Quickstart Guide](#local-quickstart-guide)
- [Environment Variables Matrix](#environment-variables-matrix)
- [Automated Testing Suite](#automated-testing-suite)
- [Deployment Strategy](#deployment-strategy)
- [Author & Connect](#author--connect)

---

## System Architecture

The application is architected as two decoupled, independently deployable services:

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Vercel)"]
        Browser(["Visitor Browser / Device"])
        UI["React 19 + Tailwind v4 UI"]
        Canvas3D["3D Canvas (Three.js + Rapier + OGL)"]
        Scroll["Lenis + GSAP Smooth Scroll Engine"]
        ChatWidget["SKY AI Chat Drawer (src/components/ai)"]
        AdminModal["Admin History Dashboard (AdminHistoryModal)"]
        
        Browser <--> UI
        UI --- Canvas3D
        UI --- Scroll
        UI --- ChatWidget
        ChatWidget --- AdminModal
    end

    subgraph ServerLayer["Backend Web Service (Render)"]
        API["Express 5 REST API"]
        RateLimits["Rate Limiters (IP-based)"]
        AdminAuth["Admin Auth Middleware (x-admin-key / Bearer / ?key=)"]
        IntentEngine["Deterministic Intent Classifier (22 Intents)"]
        ContextResolver["Multi-Turn Context Resolver"]
        HybridSearch["RAG Hybrid Retrieval Engine"]
        ContactService["Contact & Lead Pipeline (Non-blocking)"]
        AdminAPI["Admin Conversation History APIs"]
        
        API --> RateLimits
        RateLimits --> IntentEngine
        RateLimits --> AdminAuth --> AdminAPI
        IntentEngine --> ContextResolver
        ContextResolver --> HybridSearch
        RateLimits --> ContactService
    end

    subgraph ExternalServices["External Cloud Services"]
        Mongo[("MongoDB Atlas Database")]
        Groq["Groq Cloud LPUs (Llama 3.3-70B)"]
        Resend["Resend Email API"]
    end

    ChatWidget -->|"POST /api/ai/chat"| API
    AdminModal -->|"GET / DELETE /api/ai/admin/conversations"| API
    UI -->|"POST /api/contact"| API
    
    HybridSearch <-->|"Vector / Chunks"| Mongo
    ContactService -->|"Save Enquiries"| Mongo
    AdminAPI <-->|"Manage Transcripts"| Mongo
    ContextResolver -->|"Fetch Sessions"| Mongo
    
    HybridSearch -->|"Prompt + Chunks"| Groq
    Groq -->|"Answer Stream"| API
    
    ContactService -->|"Async Email Alert"| Resend
```

---

## Repository Organization

```
Portfolio/
├── portfolio-frontend/                   # Client-side SPA (React 19 + Vite)
│   ├── public/                           # 3D models (.glb), profile images, resume PDF
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/                       # SKY AI chat widget, window, inputs, and AdminHistoryModal
│   │   │   ├── effects/                  # 3D Lanyard, Lightspeed, Cockpit HUD, OGL cylinder
│   │   │   ├── layout/                   # Header and Footer layout chrome
│   │   │   ├── sections/                 # Hero, TechStack, Projects, Services, About, Contact
│   │   │   └── ui/                       # Reusable UI primitives (Buttons, Badges)
│   │   ├── data/                         # Projects, skills, and service data catalogs
│   │   ├── styles/                       # Tailwind v4 globals, grid layout tokens
│   │   ├── App.tsx                       # Master root shell with Lenis-GSAP synchronization
│   │   └── main.tsx                      # Vite React entry
│   ├── vercel.json                       # Vercel SPA routing and immutable cache rules
│   └── package.json
│
├── portfolio-backend/                    # Server-side API & AI microservice (Express 5)
│   ├── ai-knowledge/                     # Structured ground-truth portfolio knowledge base
│   │   ├── profile.json                  # Bio, title, developer philosophy
│   │   ├── skills.json                   # Technical competencies matrix
│   │   ├── services.json                 # Available client offerings and engagement steps
│   │   ├── contact.json                  # Contact channels, email, response times
│   │   ├── faq.json                      # Frequently asked questions for clients/recruiters
│   │   ├── experience.json               # Work history and engineering achievements
│   │   ├── education.json                # B.Tech in CSE (RTU, GIT, Jaipur) coursework
│   │   ├── dsa-summary.json              # Algorithmic problem-solving metrics (LeetCode)
│   │   └── projects/                     # 11 In-depth technical project dossiers
│   ├── src/
│   │   ├── ai/
│   │   │   ├── llm/generate.ts           # Groq API client, fast-path generator & fallback
│   │   │   ├── prompts/systemPrompt.ts   # Natural persona prompt & strict guardrails
│   │   │   ├── rag/                      # Chunker and knowledge ingestion pipeline
│   │   │   └── retrieval/                # 22-category intent classifier & hybrid search
│   │   ├── config/                       # Database, environment, and Resend configs
│   │   ├── controllers/                  # Handlers for AI chat, AI lead, and contact
│   │   ├── middleware/                   # Rate limiters, error handling, 404 handler
│   │   ├── models/                       # Mongoose schemas (Enquiry, KnowledgeChunk, Conversation)
│   │   ├── routes/                       # Express route declarations (/api/ai, /api/contact)
│   │   ├── schemas/                      # Zod validation schemas
│   │   ├── middleware/                   # Security, rate limiting, and adminAuth
│   │   ├── services/                     # Resend email notifications
│   │   ├── app.ts                        # Express server setup, CORS & admin routes
│   │   └── server.ts                     # HTTP listener & database connection
│   ├── tests/                            # 116 Vitest unit and integration tests
│   ├── index.js                          # Root launcher delegating to dist/server.js
│   └── package.json
│
└── README.md                             # Monorepo root documentation (this file)
```

---

## Technology Stack & Roles

### Frontend
- **React 19**: Modern declarative UI with concurrent rendering.
- **TypeScript 6**: Strict type contracts and full compile-time safety.
- **Tailwind CSS v4**: High-performance CSS styling via `@tailwindcss/vite`.
- **Three.js & React Three Fiber**: WebGL 3D rendering pipeline for the interactive ID card.
- **Rapier Physics (`@react-three/rapier`)**: Rigid body dynamics, gravity, and collision simulation for the 3D draggable badge.
- **OGL**: Ultra-lightweight WebGL library powering the 3D curved cylinder tech stack.
- **GSAP & Motion (Framer Motion v13)**: Complex 3D transforms, timeline scrubs, and responsive layout transitions.
- **Lenis**: Hardware-accelerated inertial scrolling locked into the GSAP ticker (`lagSmoothing(0)`).
- **Zod & React Hook Form**: Fast, uncontrolled form inputs with schema validation.

### Backend
- **Node.js (>= 20)**: Modern asynchronous runtime with native ESM.
- **Express 5**: Fast, minimal web server handling REST endpoints.
- **MongoDB Atlas & Mongoose**: Cloud document database for contact enquiries, chat sessions, and vector knowledge chunks.
- **Groq Cloud LPUs**: Fast LLM inference executing `llama-3.3-70b-versatile` at ~500+ tokens/second.
- **Resend**: Transactional HTTP email API for immediate inbox alerts on contact submissions.
- **Helmet & CORS**: Strict security headers, method allowlists, and origin whitelisting (`FRONTEND_ORIGINS`).
- **Vitest & Supertest**: Fast test runner validating 116 test cases in under 3 seconds.

---

## How SKY AI (RAG Assistant) Works

**SKY AI** is not just a generic chatbot wrapper. It is a purpose-built portfolio assistant designed to converse naturally, understand visitor intent, and ground every factual claim in verified data:

1. **Deterministic Intent Classification ([`intent.ts`](file:///c:/Users/akash/Desktop/Website_References/portfolio-backend/src/ai/retrieval/intent.ts))**:
   - Every message is classified across **22 categories** (e.g., `greeting`, `skills`, `projects`, `services`, `pricing`, `contact`, `internship`, `dsa`, etc.).
   - **Zero-Latency Fast Path**: Inquiries like *"Hi"*, *"Hello"*, or *"What can you do?"* bypass knowledge retrieval entirely, returning a natural greeting or assistant menu in `< 1ms` with empty sources (`sources: []`).

2. **Multi-Turn Context & Pronoun Resolution**:
   - If a visitor asks *"What technologies did he use?"* or *"Can Akash build something similar?"*, the context resolver inspects previous conversation turns and resolves pronouns to the active project slug (e.g., `rapidcare`).

3. **Hybrid Retrieval Scoring ([`search.ts`](file:///c:/Users/akash/Desktop/Website_References/portfolio-backend/src/ai/retrieval/search.ts))**:
   - Candidate chunks from `ai-knowledge/` are evaluated using a multi-factor hybrid formula:
     $$\text{finalScore} = 0.45 \cdot \text{semantic} + 0.30 \cdot \text{lexical} + 0.20 \cdot \text{intentAffinity} + 0.05 \cdot \text{quality}$$
   - **Diversity Enforcement**: Pure contact, job, internship, or pricing questions strictly suppress project chunks so random projects never displace contact information.

4. **Natural Persona & Guardrails ([`systemPrompt.ts`](file:///c:/Users/akash/Desktop/Website_References/portfolio-backend/src/ai/prompts/systemPrompt.ts))**:
   - Directly answers questions in the first sentence.
   - Zero robotic phrasing (*"According to the retrieved documents"*).
   - Transparent pricing: clarifies that rates depend on project scope and invites direct proposals without hallucinating fees.

---

## End-to-End Chatbot Flowchart

```mermaid
flowchart TD
    Start(["Visitor types message in Chatbot UI"]) --> API["POST /api/ai/chat"]
    API --> RateCheck{"Rate limit check passed?"}
    
    RateCheck -- "No" --> Err429["429 Too Many Requests"]
    RateCheck -- "Yes" --> IntentEngine["Intent Classification (intent.ts)"]
    
    IntentEngine --> FastCheck{"Is Greeting or Capabilities?"}
    FastCheck -- "Yes" --> FastResp["Generate Instant Fast-Path Response (sources: [])"]
    FastResp --> ReturnClient["Return JSON to Client"]
    
    FastCheck -- "No (Factual Query)" --> ContextEngine["Resolve Context from History (Pronouns / Active Project)"]
    ContextEngine --> Retrieval["Hybrid Search (Vector + Lexical + Intent Affinity)"]
    
    Retrieval --> DiversityFilter["Enforce Diversity & Penalize Irrelevant Projects"]
    DiversityFilter --> PromptAssembly["Assemble Grounded Prompt (System Prompt + History + Top Chunks)"]
    
    PromptAssembly --> Groq["Groq Cloud LPUs (Llama 3.3-70B)"]
    Groq --> PostProcess["Format Verified Sources & Clickable Suggestion Chips"]
    PostProcess --> ReturnClient
```

---

## Local Quickstart Guide

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **MongoDB Atlas**: Free M0 sandbox or local MongoDB instance
- **Groq API Key**: Free API key from [console.groq.com](https://console.groq.com/)
- **Resend API Key**: Free API key from [resend.com](https://resend.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/akashkumarhzb121-cloud/Portfolio.git
cd Portfolio
```

### 2. Set Up and Run the Backend
```bash
cd portfolio-backend
npm install

# Create .env file with your credentials
cp .env.example .env

# Start backend in development mode (runs at http://localhost:5000)
npm run dev
```

### 3. Set Up and Run the Frontend (in a new terminal)
```bash
cd portfolio-frontend
npm install

# Create .env.local file
cp .env.example .env.local

# Start frontend development server (runs at http://localhost:5173)
npm run dev
```

---

## Environment Variables Matrix

### Frontend (`portfolio-frontend/.env.local`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_CONTACT_FORM_ENDPOINT` | Backend contact endpoint | `http://localhost:5000/api/contact` |
| `VITE_AI_CHAT_ENDPOINT` | Optional explicit AI chat endpoint | `http://localhost:5000/api/ai/chat` |

### Backend (`portfolio-backend/.env`)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment mode | `development` / `production` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/portfolio` |
| `FRONTEND_ORIGINS` | **Yes** | Whitelisted CORS origins | `http://localhost:5173,https://skykumar.vercel.app` |
| `RESEND_API_KEY` | **Yes** | Resend email API key | `re_123456789...` |
| `CONTACT_EMAIL` | No | Destination inbox for notifications | `akashkumarhzb121@gmail.com` |
| `AI_API_KEY` | **Yes** | Groq API key | `gsk_...` |
| `AI_MODEL` | No | Groq LLM model name | `llama-3.3-70b-versatile` |
| `AI_BASE_URL` | No | OpenAI-compatible endpoint | `https://api.groq.com/openai/v1` |
| `ADMIN_API_KEY` | No | Secret key for conversation history dashboard | `Sonan@121` |

---

## Automated Testing Suite

The repository includes a comprehensive, automated test suite with **116 passing tests** across 4 test suites:

```bash
cd portfolio-backend
npm test
```

```
 Test Files  4 passed (4)
      Tests  116 passed (116)
   Duration  2.85s
```

### What Is Tested:
1. **`tests/adminAuth.test.ts` (7 tests)**: Validates `x-admin-key`, `Authorization: Bearer`, `?key=` query parameter fallback, whitespace trimming, string array headers, and 401 rejections on missing or incorrect credentials.
2. **`tests/email.service.test.ts` (3 tests)**: Resend API dispatch, timeout handling, connection failure fallbacks.
3. **`tests/contact.test.ts` (12 tests)**: Zod validation, payload limits, rate limits, non-blocking asynchronous email dispatch, MongoDB persistence, centralized error handling.
4. **`tests/ai.test.ts` (94 tests)**:
   - Chunkers for all 9 data types.
   - Classification accuracy across **all 22 intent categories**.
   - The **15 Golden Retrieval Ranking Cases** (verifying that pure contact, job, or pricing queries return 0 project chunks).
   - **All 30 Section 27 Single-Turn Queries** (greetings, skills, projects, pricing, DSA, GitHub, etc.).
   - **The 5 Multi-Turn Conversations** (TEST A through TEST E) verifying context retention and pronoun resolution.

---

## Deployment Strategy

```mermaid
flowchart LR
    Repo["GitHub Repository (main branch)"]
    
    Repo -->|"Trigger on Push (portfolio-frontend/)"| Vercel["Vercel (Frontend SPA)"]
    Repo -->|"Trigger on Push (portfolio-backend/)"| Render["Render (Backend Service)"]
    
    Vercel -->|"Live at"| Site["https://skykumar.vercel.app"]
    Render -->|"Live at"| API["https://portfolio-backend.onrender.com"]
    
    Site <-->|"HTTPS API Calls"| API
```

### Frontend on Vercel
- **Root Directory**: `portfolio-frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_CONTACT_FORM_ENDPOINT` pointing to your Render backend.

### Backend on Render
- **Root Directory**: `portfolio-backend`
- **Environment**: `Node`
- **Build Command**: `npm ci --include=dev && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Environment Variables**: Configure all secrets (`MONGODB_URI`, `RESEND_API_KEY`, `AI_API_KEY`, etc.).

---

## Author & Connect

- **Author**: Akash Kumar
- **Role**: Creative Frontend Developer & Full-Stack Engineer
- **Email**: [akashkumarhzb121@gmail.com](mailto:akashkumarhzb121@gmail.com)
- **GitHub**: [github.com/akashkumarhzb121-cloud](https://github.com/akashkumarhzb121-cloud)
- **LinkedIn**: [linkedin.com/in/akash-kumar-488074309](https://www.linkedin.com/in/akash-kumar-488074309)
- **Portfolio**: [skykumar.vercel.app](https://skykumar.vercel.app)

---

## License

This project is licensed under the [MIT License](LICENSE).
