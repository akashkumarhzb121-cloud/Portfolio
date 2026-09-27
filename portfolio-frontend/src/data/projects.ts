import type { Project } from "@/types/portfolio";

export const projects: Project[] = [
  {
    id: "rapidcare",
    number: "01",
    title: "RapidCare",
    description: "An AI-powered healthcare platform designed to improve rural care continuity through intelligent triage, referral tracking, teleconsultation and emergency escalation.",
    image: "/images/projects/RapidCare.png",
    fallbackGradient: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "Socket.IO", "Groq AI", "JWT", "Tailwind CSS"],
    highlights: [
      "AI-driven triage & intelligent care-level routing",
      "Real-time ambulance dispatch with bed reservation",
      "Multilingual, voice-enabled & offline-first workflows"
    ],
    liveUrl: "https://rapidcare108.vercel.app",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/rapidcare",
    category: "HEALTHTECH · AI-POWERED CARE CONTINUITY",
    featured: true
  },
  {
    id: "modplint-interiors",
    number: "02",
    title: "Modplint Interiors",
    description: "A production digital platform for a real interior-design business, combining portfolio presentation, service discovery and client consultation workflows.",
    image: "/images/projects/Modplint Interiors.png",
    fallbackGradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "JWT", "Cloudinary", "REST APIs"],
    highlights: [
      "Portfolio, services, testimonials & consultation booking",
      "REST APIs with MongoDB Atlas & JWT authentication",
      "Cloudinary image management & production deployment"
    ],
    liveUrl: "https://www.modplintinteriors.com",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/modplint-frontend",
    category: "REAL-WORLD · INTERIOR DESIGN PLATFORM",
    featured: true
  },
  {
    id: "student-management-system",
    number: "03",
    title: "Student Management System",
    description: "A full-stack college ERP platform designed to centralize academic and administrative workflows for Admin, Faculty, and Students with secure role-based access.",
    image: "/images/projects/Student Management System.png",
    fallbackGradient: "linear-gradient(135deg, #2b1055 0%, #7597de 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "JWT", "REST APIs"],
    highlights: [
      "Role-based dashboards for Admin, Faculty & Students",
      "Attendance, fees, assignments, examinations & leave workflows",
      "JWT authentication, REST APIs & MongoDB"
    ],
    liveUrl: "https://collegesms.vercel.app",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/student-management-system-client",
    category: "COLLEGE ERP · FULL-STACK APPLICATION",
    featured: true
  },
  {
    id: "mern-docs",
    number: "04",
    title: "MERN Docs",
    description: "A developer-focused documentation platform covering the MERN ecosystem, backend engineering, security, deployment and advanced development concepts.",
    image: "/images/projects/MERN Docs.png",
    fallbackGradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "JavaScript", "REST APIs"],
    highlights: [
      "150+ technical topics with structured examples",
      "Documentation architecture built for learning & revision",
      "100+ organic users without paid promotion"
    ],
    liveUrl: "https://mernstacknotes.vercel.app",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/MERN-Developer-Handbook",
    category: "PRODUCT · DEVELOPER DOCUMENTATION",
    featured: true
  }
];