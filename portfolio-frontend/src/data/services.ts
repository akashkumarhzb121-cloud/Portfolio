import type { Service } from "@/types/portfolio";

export const services: Service[] = [
  {
    id: "web-development",
    number: "01",
    title: "Web Development",
    description: "Modern, responsive web applications built with React, TypeScript, and clean architecture.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Custom React & SPA applications",
      "Design systems & component libraries",
      "API integration & state management",
      "Performance & SEO optimization"
    ]
  },
  {
    id: "ui-ux-implementation",
    number: "02",
    title: "UI/UX Implementation",
    description: "Turning Figma designs into pixel-perfect, accessible, and responsive web interfaces.",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Pixel-perfect responsive layouts",
      "Accessible semantic HTML & ARIA",
      "Design tokens & fluid typography",
      "Micro-interactions & state feedback"
    ]
  },
  {
    id: "3d-interactive-ui",
    number: "03",
    title: "3D Interactive UI",
    description: "Interactive 3D scenes, WebGL shaders, and smooth canvas animations that enhance the experience.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "Three.js & Canvas 3D scenes",
      "Custom WebGL shader effects",
      "GSAP scroll-driven animations",
      "Mobile & low-power fallbacks"
    ]
  },
  {
    id: "backend-architecture",
    number: "04",
    title: "Backend & REST APIs",
    description: "Fast, secure REST APIs and backend services built with Node.js and Express.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "RESTful API design & architecture",
      "JWT authentication & role controls",
      "Input validation & rate limiting",
      "Clear documentation & testing"
    ]
  },
  {
    id: "database-cloud",
    number: "05",
    title: "Databases & Cloud Deploy",
    description: "Database modeling with MongoDB & SQL, cloud hosting, and automated CI/CD pipelines.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    link: "#contact",
    deliverables: [
      "MongoDB Atlas & SQL schema design",
      "Mongoose data models & queries",
      "Cloudinary media pipelines",
      "Automated deploy (Vercel & Render)"
    ]
  }
];