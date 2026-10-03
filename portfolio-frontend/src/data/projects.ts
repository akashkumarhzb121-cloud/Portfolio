import type { Project } from "@/types/portfolio";

export const projects: Project[] = [
  {
    id: "rapidcare",
    number: "01",
    title: "RapidCare",
    description: "Emergency telemedicine platform with AI clinical triage, patient routing, and real-time ambulance dispatch.",
    image: "/images/projects/RapidCare.png",
    fallbackGradient: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "Socket.IO", "Groq AI", "JWT", "Tailwind CSS"],
    highlights: [
      "AI clinical triage & care routing",
      "Real-time dispatch & bed reservation",
      "Multilingual & offline-first support"
    ],
    liveUrl: "https://rapidcare108.vercel.app",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/rapidcare",
    category: "HEALTHTECH · AI PLATFORM",
    featured: true
  },
  {
    id: "modplint-interiors",
    number: "02",
    title: "Modplint Interiors",
    description: "Production website for an interior design studio featuring dynamic project portfolios and consultation booking.",
    image: "/images/projects/Modplint Interiors.png",
    fallbackGradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "JWT", "Cloudinary", "REST APIs"],
    highlights: [
      "Portfolio showcase & client inquiries",
      "REST APIs with MongoDB Atlas & JWT",
      "Cloudinary media optimization"
    ],
    liveUrl: "https://www.modplintinteriors.com",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/modplint-frontend",
    category: "COMMERCIAL · INTERIOR STUDIO",
    featured: true
  },
  {
    id: "student-management-system",
    number: "03",
    title: "Student Management System",
    description: "College ERP portal centralizing academic workflows with role-based access for admins, faculty, and students.",
    image: "/images/projects/Student Management System.png",
    fallbackGradient: "linear-gradient(135deg, #2b1055 0%, #7597de 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "JWT", "REST APIs"],
    highlights: [
      "Role-based dashboards (Admin, Faculty, Student)",
      "Attendance, fee & exam management",
      "Secure JWT authentication & REST APIs"
    ],
    liveUrl: "https://collegesms.vercel.app",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/student-management-system-client",
    category: "COLLEGE ERP · FULL-STACK",
    featured: true
  },
  {
    id: "mern-docs",
    number: "04",
    title: "MERN Docs",
    description: "Documentation platform and developer guide covering full-stack MERN architecture and backend engineering.",
    image: "/images/projects/MERN Docs.png",
    fallbackGradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    technologies: ["React", "Node.js", "Express.js", "MongoDB", "JavaScript", "REST APIs"],
    highlights: [
      "150+ topics with practical code examples",
      "Full-stack architecture reference",
      "100+ active organic learners"
    ],
    liveUrl: "https://mernstacknotes.vercel.app",
    githubUrl: "https://github.com/akashkumarhzb121-cloud/MERN-Developer-Handbook",
    category: "DEVELOPER DOCS · MERN",
    featured: true
  }
];