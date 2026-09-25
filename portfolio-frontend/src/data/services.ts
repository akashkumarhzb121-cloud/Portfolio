import type { Service } from "@/types/portfolio";

export const services: Service[] = [
  {
    id: "web-development",
    number: "01",
    title: "Web Development",
    description: "Production-grade frontend web applications built with React, TypeScript, and modern bundlers. Prioritizing Core Web Vitals, accessible semantic HTML, and bulletproof responsive architecture.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Modern SPA & Static Architectures",
      "Component Libraries & Design Systems",
      "State Management & API Integration",
      "Performance & Core Web Vitals Optimization"
    ]
  },
  {
    id: "ui-ux-implementation",
    number: "02",
    title: "UI/UX Implementation",
    description: "Translating sophisticated Figma systems into pixel-perfect, accessible, and responsive components. Crafting micro-interactions, delightful state feedback, and intuitive user workflows.",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Pixel-Perfect Responsive Layouts",
      "Accessible WAI-ARIA Interactions",
      "Fluid Typography & Color Tokens",
      "Micro-interactions & State Feedback"
    ]
  },
  {
    id: "3d-interactive-ui",
    number: "03",
    title: "3D Interactive UI",
    description: "Immersive WebGL, Three.js, and shader-driven experiences seamlessly integrated into standard web interfaces. Enhancing brand storytelling without degrading performance or mobile usability.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Custom WebGL & Shader Effects",
      "Three.js & Canvas 3D Scenes",
      "GSAP ScrollTrigger Choreography",
      "Graceful Low-Power & Mobile Fallbacks"
    ]
  },
  {
    id: "backend-architecture",
    number: "04",
    title: "Backend & REST APIs",
    description: "Robust server-side architectures engineered with Node.js and Express.js. Designed for security, high concurrency, strict input validation, and clear API documentation.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Scalable RESTful API Design & Versioning",
      "JWT Authentication & RBAC Access Controls",
      "Secure Middleware Pipelines & Rate Limiting",
      "Postman API Documentation & Contract Testing"
    ]
  },
  {
    id: "database-cloud",
    number: "05",
    title: "Databases & Cloud Deploy",
    description: "Data layer engineering with MongoDB, Mongoose, and relational SQL databases. Complete with cloud cluster provisioning, media pipelines (Cloudinary), and automated deployment.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "MongoDB Atlas & SQL Schema Architecture",
      "Mongoose Data Models & Query Optimization",
      "Cloudinary Media Processing & CDN Pipelines",
      "Vercel & Render Automated CI/CD Deployments"
    ]
  }
];