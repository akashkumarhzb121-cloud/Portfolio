import type { Project } from "@/types/portfolio";

export const projects: Project[] = [
  {
    id: "immersive-studio",
    number: "01",
    title: "Immersive Product Studio",
    description: "An editorial, motion-led product storytelling platform built with real-time 3D viewport controls, smooth kinetic typography, and accessible micro-interactions. Features WebGL shader pipeline, interactive 360° model inspection, and custom GSAP scrubbed scroll transitions engineered for sub-60fps rendering.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
    technologies: ["React", "TypeScript", "Three.js", "GSAP", "Tailwind CSS", "WebGL", "Figma"],
    highlights: [
      "Real-time 60fps WebGL canvas viewport controls",
      "Dynamic GSAP timeline orchestration and kinetic text",
      "Adaptive device responsive 3D model streaming"
    ],
    liveUrl: "https://github.com/akashkumar",
    githubUrl: "https://github.com/akashkumar",
    category: "Creative 3D & Frontend Architecture",
    featured: true
  },
  {
    id: "analytics-dashboard",
    number: "02",
    title: "Analytics Dashboard",
    description: "A high-density financial analytics suite delivering sub-second updates, customizable data visualizations, intuitive keyboard shortcuts, and strict accessibility compliance. Engineered with virtualized table grids handling 100k+ data points, dynamic filter presets, and automated export pipelines.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Data Viz", "Zod", "REST APIs", "Node.js"],
    highlights: [
      "Sub-second streaming chart updates and metrics",
      "Virtualized data tables supporting 100,000+ rows",
      "Accessible keyboard shortcuts & WCAG 2.1 AA audit"
    ],
    liveUrl: "https://github.com/akashkumar",
    githubUrl: "https://github.com/akashkumar",
    category: "Enterprise FinTech Platform",
    featured: true
  },
  {
    id: "creative-commerce",
    number: "03",
    title: "Creative Commerce",
    description: "A luxury architectural commerce storefront fusing editorial visual pacing with instant client-side transitions, headless cart state, and smooth scroll choreography. Built with optimized responsive media delivery, reactive checkout flows, and sub-100ms page transitions across catalog views.",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2b1055 0%, #7597de 100%)",
    technologies: ["React", "Motion", "Tailwind CSS", "Figma", "Shadcn/UI", "TypeScript", "State Mgmt"],
    highlights: [
      "Headless cart architecture with persistent local cache",
      "Editorial scroll choreography and fluid transitions",
      "Sub-100ms instant catalog navigation and checkout flow"
    ],
    liveUrl: "https://github.com/akashkumar",
    githubUrl: "https://github.com/akashkumar",
    category: "E-Commerce Experience",
    featured: true
  },
  {
    id: "cloud-collaboration-engine",
    number: "04",
    title: "Full-Stack Cloud Workspace",
    description: "A secure, multi-tenant collaboration engine featuring real-time presence synchronization, RBAC permission tiers, JWT authentication, and high-throughput MongoDB cluster aggregation pipelines. Implements resilient Node.js / Express REST API architecture with production Docker deployments.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    technologies: ["Node.js", "Express.js", "MongoDB", "JWT & RBAC", "React", "REST APIs", "Mongoose"],
    highlights: [
      "Role-Based Access Control (RBAC) with JWT session cookies",
      "MongoDB Atlas aggregation pipelines for analytics",
      "RESTful API design with thorough validation and error handling"
    ],
    liveUrl: "https://github.com/akashkumar",
    githubUrl: "https://github.com/akashkumar",
    category: "Full-Stack Cloud Architecture",
    featured: true
  }
];