import type { Skill } from "@/types/portfolio";

export const skills: Skill[] = [
  // --- FRONTEND CORE ---
  {
    name: "React",
    category: "Frontend",
    iconName: "react",
    color: "#61DAFB",
    description: "Component architecture, hooks, concurrent rendering, and reactive state systems."
  },
  {
    name: "TypeScript",
    category: "Language",
    iconName: "typescript",
    color: "#3178C6",
    description: "Strict static typing, generative generics, and bulletproof frontend APIs."
  },
  {
    name: "JavaScript",
    category: "Frontend",
    iconName: "javascript",
    color: "#F7DF1E",
    description: "Modern ESNext, asynchronous runtime primitives, and DOM performance optimization."
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    iconName: "tailwind",
    color: "#06B6D4",
    description: "Design system tokens, custom utility architectures, and responsive precision."
  },
  {
    name: "Three.js",
    category: "3D & WebGL",
    iconName: "threejs",
    color: "#FFFFFF",
    description: "Real-time 3D scenes, shaders, camera rigs, and immersive canvas rendering."
  },
  {
    name: "GSAP",
    category: "Motion",
    iconName: "gsap",
    color: "#0AE448",
    description: "ScrollTrigger orchestrations, high-framerate timelines, and fluid UI transforms."
  },
  {
    name: "Figma",
    category: "Design",
    iconName: "figma",
    color: "#F24E1E",
    description: "Design-to-code translation, auto-layout tokens, wireframing, and interactive prototyping."
  },

  // --- BACKEND ARCHITECTURE ---
  {
    name: "Node.js",
    category: "Backend",
    iconName: "nodejs",
    color: "#5FA04E",
    description: "Event-driven asynchronous runtime, high-concurrency microservices, and tooling."
  },
  {
    name: "Express.js",
    category: "Backend",
    iconName: "express",
    color: "#FFFFFF",
    description: "Robust middleware chains, server routing, and scalable backend REST servers."
  },
  {
    name: "RESTful APIs",
    category: "Backend",
    iconName: "restapi",
    color: "#38BDF8",
    description: "Standard HTTP methods, stateless resource endpoints, and consistent API contracts."
  },
  {
    name: "REST API Design",
    category: "Backend",
    iconName: "apidesign",
    color: "#818CF8",
    description: "Resource versioning, status codes, query pagination, and payload validation."
  },
  {
    name: "JWT (JSON Web Tokens)",
    category: "Backend",
    iconName: "jwt",
    color: "#D63AFF",
    description: "Stateless cross-domain token signing, payload encryption, and secure claims."
  },
  {
    name: "Authentication",
    category: "Security",
    iconName: "auth",
    color: "#34D399",
    description: "Password hashing (bcrypt), multi-factor flows, session security, and OAuth2."
  },
  {
    name: "Authorization",
    category: "Security",
    iconName: "authz",
    color: "#F59E0B",
    description: "Permission validation, access guard middleware, and resource tenancy checks."
  },
  {
    name: "RBAC (Role-Based Access)",
    category: "Security",
    iconName: "rbac",
    color: "#EC4899",
    description: "Fine-grained user roles, granular permission hierarchies, and route security."
  },

  // --- DATABASES & ORMS ---
  {
    name: "MongoDB",
    category: "Databases",
    iconName: "mongodb",
    color: "#47A248",
    description: "NoSQL document storage, aggregation pipelines, and high-volume indexing."
  },
  {
    name: "MongoDB Atlas",
    category: "Databases",
    iconName: "mongodbatlas",
    color: "#00ED64",
    description: "Cloud database clustering, automated scaling, sharding, and VPC peering."
  },
  {
    name: "Mongoose",
    category: "Databases",
    iconName: "mongoose",
    color: "#880000",
    description: "Strict schema definition, model middleware, pre/post hooks, and data validation."
  },
  {
    name: "SQL",
    category: "Databases",
    iconName: "sql",
    color: "#00758F",
    description: "Relational database querying, joins, transactions (ACID), and index tuning."
  },
  {
    name: "Database Schema Design",
    category: "Databases",
    iconName: "schemadesign",
    color: "#6366F1",
    description: "Entity relationship modeling, normalization, foreign keys, and indexing."
  },
  {
    name: "CRUD Operations",
    category: "Databases",
    iconName: "crud",
    color: "#10B981",
    description: "Atomic database transactions, optimized batch queries, and data integrity."
  },

  // --- CS FUNDAMENTALS ---
  {
    name: "Data Structures & Algorithms",
    category: "CS Fundamentals",
    iconName: "dsa",
    color: "#F43F5E",
    description: "Time/space complexity (Big-O), trees, graphs, sorting, and dynamic programming."
  },
  {
    name: "OOP",
    category: "CS Fundamentals",
    iconName: "oop",
    color: "#A855F7",
    description: "Encapsulation, inheritance, polymorphism, abstraction, and SOLID principles."
  },
  {
    name: "DBMS",
    category: "CS Fundamentals",
    iconName: "dbms",
    color: "#3B82F6",
    description: "Concurrency control, indexing mechanisms, query optimization, and write-ahead logging."
  },
  {
    name: "Operating Systems",
    category: "CS Fundamentals",
    iconName: "os",
    color: "#EAB308",
    description: "Process scheduling, thread synchronization, memory management, and file I/O."
  },
  {
    name: "System Design",
    category: "CS Fundamentals",
    iconName: "systemdesign",
    color: "#14B8A6",
    description: "Load balancing, horizontal scaling, caching strategies (Redis), and reliability."
  },

  // --- TOOLS & CLOUD ---
  {
    name: "Git",
    category: "Tools & Cloud",
    iconName: "git",
    color: "#F05032",
    description: "Distributed version control, branching strategies, rebasing, and merge resolutions."
  },
  {
    name: "GitHub",
    category: "Tools & Cloud",
    iconName: "github",
    color: "#FFFFFF",
    description: "CI/CD GitHub Actions, pull request code reviews, and release management."
  },
  {
    name: "Postman",
    category: "Tools & Cloud",
    iconName: "postman",
    color: "#FF6C37",
    description: "API testing, automated request collections, mock servers, and contract testing."
  },
  {
    name: "Vercel",
    category: "Tools & Cloud",
    iconName: "vercel",
    color: "#FFFFFF",
    description: "Edge network deployments, serverless functions, and preview environments."
  },
  {
    name: "Render",
    category: "Tools & Cloud",
    iconName: "render",
    color: "#46E3B7",
    description: "Cloud web services, background worker hosting, managed databases, and zero-downtime deploys."
  },
  {
    name: "Cloudinary",
    category: "Tools & Cloud",
    iconName: "cloudinary",
    color: "#3448C5",
    description: "Cloud media storage, on-the-fly asset transformation, optimization, and global CDN delivery."
  },
  {
    name: "VS Code",
    category: "Tools & Cloud",
    iconName: "vscode",
    color: "#007ACC",
    description: "Custom developer workflows, debugging configurations, linters, and extensions."
  }
];