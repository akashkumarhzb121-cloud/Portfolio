# Akash Kumar · Creative Portfolio & Digital Experience

[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-purple?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Configured-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

An editorial, high-performance developer portfolio showcasing creative frontend craft, interactive 3D WebGL physics, and full-stack software architecture. Built with **React 19**, **TypeScript**, **Three.js**, **OGL**, and **Tailwind CSS v4**.

---

## Table of Contents

- [Overview & Experience](#overview--experience)
- [Key Interactive Features](#key-interactive-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Featured Projects](#featured-projects)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Vercel Deployment Guide](#vercel-deployment-guide)
- [Performance & Accessibility](#performance--accessibility)
- [Author & Contact](#author--contact)

---

## Overview & Experience

This portfolio bridges the gap between expressive creative engineering and robust software architecture:
- **Kinetic & Atmospheric Motion**: Thoughtful micro-interactions, responsive physics, and sub-60fps canvas animations.
- **Continuous Master Grid**: Seamless, mathematically aligned 24px dark grid coordinate system extending unbroken across the entire site.
- **Production-Grade Architecture**: Strict TypeScript types, modular component composition, accessible forms with Zod validation, and optimized production bundle chunking.

---

## Key Interactive Features

### 1. Spaceship Cockpit Viewport & Hyperspace (`Hero.tsx`)
- Hyperspace lightspeed starfield simulation streaming past the screen.
- Sci-fi spaceship canopy windshield frame featuring chamfered tech corner brackets, visor LEDs, diagonal glass glare, cockpit telemetry HUD, and a central flight vector crosshair reticle.
- Particle-based interactive headline typography on "Akash Kumar".

### 2. 3D Text Reveal (`TextReveal3D.tsx`)
- 3D perspective typography reveal using GSAP and IntersectionObserver.
- Words rotate into position across the Z-axis with depth blur easing as the section enters the viewport.

### 3. 3D Curved Cylinder Tech Stack (`TechStack.tsx` & `CircularGallery.tsx`)
- WebGL curved cylinder gallery powered by **OGL**.
- **Idle Auto-Spin**: Gently auto-rotates in idle mode to invite engagement.
- **Scroll-Reactive**: Automatically spins with scroll momentum when scrolling past the section.
- **Interactive Controls**: Header spin buttons (`[ ← Spin Left ]`, `[ Spin Right → ]`), floating side arrow buttons, mobile triggers, and drag/wheel support.

### 4. Stay-in-Place Project Card Stacking (`Projects.tsx` & `ScrollStack.tsx`)
- Smooth inertial scrolling orchestrated with **Lenis**.
- Book-style pin stacking where each project card slides up and anchors sequentially without bouncing, shaking, or jitter.

### 5. Interactive 3D Physics Lanyard Card (`About.tsx` & `Lanyard.tsx`)
- Real-time 3D identity badge badge powered by **Three.js**, **React Three Fiber**, and **Rapier Physics**.
- Draggable with spring physics, realistic gravity, collision boundaries, and customized lanyard cord kinematics.

### 6. Capabilities & Accordion Gallery (`Services.tsx`)
- Interactive expanding service accordion with 3D tilt and parallax motion.
- SVG curve transitions connecting the dark grid theme and light section without harsh cuts.
- Curved **Bending Marquee** following custom SVG arc coordinates.

### 7. Global Screen-Blend Glow Cursor (`GlowCursor.tsx`)
- Custom dual-color pointer aura with smooth latency-free interpolation and screen-blended lighting.

---

## Technology Stack

### Frontend & Core
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Typography**: `@fontsource-variable/geist`

### 3D Graphics & Physics
- **Three.js**: WebGL rendering engine
- **React Three Fiber (@react-three/fiber)**: Declarative Three.js in React
- **React Three Drei (@react-three/drei)**: 3D scene utilities & camera controls
- **Rapier (@react-three/rapier)**: Real-time physics engine for the 3D lanyard
- **OGL**: Lightweight WebGL library powering the 3D curved cylinder gallery

### Animation & Smooth Motion
- **GSAP (GreenSock)**: Complex 3D transforms, timeline scrub, and text reveals
- **Motion (Framer Motion v13)**: Reactive layout animations and spring physics
- **Lenis**: Hardware-accelerated smooth inertial scrolling

### Forms, UI & Icons
- **React Hook Form**: Uncontrolled form management
- **Zod**: Runtime schema validation
- **Sonner**: Toast notifications
- **Lucide React**: Modern iconography

---

## Project Architecture

```
portfolio-frontend/
├── public/
│   ├── favicon.svg               # Site favicon
│   ├── images/
│   │   ├── profile/              # Author headshots & avatars
│   │   ├── projects/             # High-resolution project previews
│   │   └── tech/                 # Full-stack technology icons
│   ├── models/
│   │   └── card.glb              # 3D GLTF identity card asset
│   └── resume/
│       └── AKASH_KUMAR_RESUME.pdf# Downloadable resume
├── src/
│   ├── components/
│   │   ├── effects/              # WebGL & 3D interaction components
│   │   │   ├── AccordionGallery.tsx
│   │   │   ├── BendingMarquee.tsx
│   │   │   ├── CircularGallery.tsx    # 3D OGL cylinder gallery
│   │   │   ├── GlowCursor.tsx         # Screen-blended cursor trail
│   │   │   ├── Lanyard.tsx            # Rapier 3D physics badge
│   │   │   ├── Lightspeed.tsx         # Hyperspace starfield
│   │   │   ├── ParticleText.tsx       # Canvas particle text
│   │   │   ├── ScrollStack.tsx        # Stay-in-place book stack
│   │   │   ├── SpaceshipCockpitFrame.tsx # Cockpit HUD frame
│   │   │   ├── TextReveal3D.tsx       # GSAP 3D matrix reveal
│   │   │   └── TextScatter.tsx        # Kinetic scatter animation
│   │   ├── layout/               # Header, Navigation, Footer
│   │   ├── sections/             # Core page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── TechStack.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── About.tsx
│   │   │   └── Contact.tsx
│   │   └── ui/                   # Reusable UI primitives
│   ├── data/                     # Structured content data sources
│   ├── styles/                   # Design tokens and globals
│   ├── App.tsx                   # Master shell with global 24px grid
│   └── main.tsx                  # Application entry point
├── vercel.json                   # Vercel deployment & caching config
├── vite.config.ts                # Vite build pipeline & path aliases
└── package.json
```

---

## Featured Projects

1. **Immersive Product Studio**: An editorial 3D product storytelling platform with WebGL shader pipelines, real-time 360° model inspection, and GSAP scrubbed transitions.
2. **Enterprise Analytics Dashboard**: High-density financial dashboard handling 100,000+ data rows with virtualized tables, sub-second chart updates, and WCAG AA compliance.
3. **Creative Commerce Experience**: Architectural commerce storefront featuring headless persistent cart state, responsive media delivery, and fluid transitions.
4. **Full-Stack Cloud Workspace**: Multi-tenant collaboration engine with RBAC tiers, JWT authentication, MongoDB Atlas aggregation pipelines, and Dockerized Node/Express REST APIs.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` (or `pnpm` / `yarn`)

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/your-username/portfolio.git
   cd portfolio-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Available Scripts
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with Hot Module Replacement |
| `npm run build` | Runs TypeScript typecheck (`tsc -b`) and produces minified production build in `dist/` |
| `npm run preview` | Locally preview the production build at `http://localhost:4173` |
| `npm run lint` | Runs Oxlint to inspect codebase quality and hook integrity |

---

## Environment Variables

Create a `.env` file in the root of `portfolio-frontend`:

```env
# Optional: Formspree, Basin, or custom backend API endpoint for contact submissions
VITE_CONTACT_FORM_ENDPOINT=https://formspree.io/f/your_form_id
```

> [!NOTE]
> If `VITE_CONTACT_FORM_ENDPOINT` is not configured, the contact form gracefully falls back to opening the visitor's native email client with pre-filled subject and body.

---

## Vercel Deployment Guide

The project is pre-configured with [`vercel.json`](vercel.json) for 1-click zero-config deployment.

### Option 1: Deploy via GitHub (Recommended)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete portfolio with 3D interactions"
   git push origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. Import your GitHub repository.
4. If `portfolio-frontend` is inside a parent folder, set the **Root Directory** to `portfolio-frontend`. Otherwise, leave default `/`.
5. Click **Deploy**. Vercel will automatically build and distribute to global edge CDN.

### Option 2: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## Performance & Accessibility

- **Optimized 3D Loading**: Models and textures are loaded asynchronously with fallback visual placeholders to prevent layout shift.
- **Reduced Motion Support**: Animations respect system preferences via `prefers-reduced-motion` media query hooks.
- **Accessible Semantics**: Semantic HTML5 elements (`<section>`, `<main>`, `<header>`, `<footer>`), ARIA attributes, and accessible keyboard focus states throughout.
- **Edge Caching**: Built assets have 1-year immutable cache headers configured for instant repeat visits.

---

## Author & Contact

- **Name**: Akash Kumar
- **Role**: Creative Frontend Developer & Full-Stack Engineer
- **GitHub**: [github.com/akashkumar](https://github.com/akashkumar)
- **LinkedIn**: [linkedin.com/in/akashkumar](https://linkedin.com/in/akashkumar)

---

## License

This project is open-source under the [MIT License](LICENSE).
