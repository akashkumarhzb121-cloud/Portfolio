export type IntentType =
  | 'profile'
  | 'skills'
  | 'experience'
  | 'education'
  | 'services'
  | 'hiring'
  | 'contact'
  | 'project'
  | 'technology'
  | 'general'
  | 'faq'
  | 'availability'
  | 'pricing'
  | 'resume'
  | 'dsa'
  | 'mixed';

export interface ProjectMetadata {
  slug: string;
  name: string;
  aliases: string[];
}

export const KNOWN_PROJECTS: ProjectMetadata[] = [
  {
    slug: 'rapidcare',
    name: 'RapidCare',
    aliases: ['rapidcare', 'rapid care', 'emergency care', 'telemedicine', 'ambulance dispatch']
  },
  {
    slug: 'modplint-interiors',
    name: 'Modplint Interiors',
    aliases: ['modplint', 'modplint interiors', 'interior design']
  },
  {
    slug: 'student-management',
    name: 'Student Management System',
    aliases: ['student management', 'student management system', 'student portal']
  },
  {
    slug: 'mern-docs',
    name: 'MERN Docs',
    aliases: ['mern docs', 'merndocs', 'mern documentation']
  },
  {
    slug: 'portfolio',
    name: 'Portfolio',
    aliases: ['portfolio website', 'skykumar portfolio']
  },
  {
    slug: 'netflix-clone',
    name: 'Netflix Clone',
    aliases: ['netflix', 'netflix clone']
  },
  {
    slug: 'dribbble',
    name: 'Dribbble Clone',
    aliases: ['dribbble', 'dribbble clone']
  },
  {
    slug: 'kanban',
    name: 'Kanban Board',
    aliases: ['kanban', 'kanban board', 'task manager']
  },
  {
    slug: 'premier',
    name: 'Premier',
    aliases: ['premier']
  },
  {
    slug: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    aliases: ['rock paper scissors', 'rps']
  },
  {
    slug: 'sharma-interior',
    name: 'Sharma Interior',
    aliases: ['sharma interior', 'sharma interiors']
  }
];

export const KNOWN_TECHNOLOGIES: Array<{ name: string; aliases: string[] }> = [
  { name: 'React', aliases: ['react', 'react.js', 'reactjs'] },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { name: 'JavaScript', aliases: ['javascript', 'js'] },
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node'] },
  { name: 'Express', aliases: ['express', 'express.js', 'expressjs'] },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongoose'] },
  { name: 'Three.js', aliases: ['three.js', 'threejs', 'three'] },
  { name: 'WebGL', aliases: ['webgl', 'ogl', 'glsl', 'shaders'] },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss'] },
  { name: 'JWT', aliases: ['jwt', 'json web token'] },
  { name: 'Socket.IO', aliases: ['socket.io', 'socketio', 'websockets'] },
  { name: 'Groq', aliases: ['groq', 'groq ai', 'llama'] },
  { name: 'Docker', aliases: ['docker'] },
  { name: 'Redux', aliases: ['redux', 'zustand'] },
  { name: 'WebRTC', aliases: ['webrtc'] }
];

export interface QueryAnalysis {
  rawQuery: string;
  normalizedQuery: string;
  intents: IntentType[];
  namedProjectSlug?: string;
  detectedTechnologies: string[];
  isPureContactQuery: boolean;
  isHiringQuery: boolean;
  isServicesQuery: boolean;
  isSkillsQuery: boolean;
  isProfileQuery: boolean;
  isGeneralQuestion: boolean;
  isGeneralProjectListQuery: boolean;
  isEducationQuery: boolean;
  isDSAQuery: boolean;
}

/**
 * Normalizes text by removing non-alphanumeric punctuation and lowercasing
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministic intent classification & entity extraction without extra LLM overhead
 */
export function classifyQueryIntent(query: string): QueryAnalysis {
  const normalized = normalizeText(query);
  const intents: Set<IntentType> = new Set();
  const detectedTech: string[] = [];
  let namedProjectSlug: string | undefined;

  // 1. Detect Named Projects
  for (const proj of KNOWN_PROJECTS) {
    for (const alias of proj.aliases) {
      const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (pattern.test(normalized)) {
        namedProjectSlug = proj.slug;
        intents.add('project');
        break;
      }
    }
    if (namedProjectSlug) break;
  }

  // 2. Detect Technologies
  for (const tech of KNOWN_TECHNOLOGIES) {
    for (const alias of tech.aliases) {
      const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (pattern.test(normalized)) {
        detectedTech.push(tech.name);
        intents.add('technology');
        break;
      }
    }
  }

  // 3. Contact & Reach Intent
  const contactPatterns = [
    /\b(contact|email|reach|phone|call|message|get in touch|touch|connect with|reach out|talk to|mail)\b/i,
    /\b(how (can|do) i (contact|reach)|what is (akash'?s|his) email)\b/i
  ];
  if (contactPatterns.some((p) => p.test(normalized))) {
    intents.add('contact');
  }

  // 4. Hiring & Client Intent
  const hiringPatterns = [
    /\b(hire|hiring|work with|collaborate|freelance|contract|contractor|take on|available for work|consultation)\b/i,
    /\b(build a (website|web app|app|platform)|make a (website|web app|app)|need a (website|developer|engineer))\b/i,
    /\b(looking for a (developer|engineer)|want to (build|make|create)|start a project)\b/i
  ];
  if (hiringPatterns.some((p) => p.test(normalized))) {
    intents.add('hiring');
    intents.add('services');
    intents.add('contact');
  }

  // 5. Pricing & Rates Intent
  const pricingPatterns = [
    /\b(cost|charge|price|pricing|rate|rates|fee|fees|quote|how much does|budget|hourly)\b/i
  ];
  if (pricingPatterns.some((p) => p.test(normalized))) {
    intents.add('pricing');
    intents.add('services');
    intents.add('contact');
  }

  // 6. Services Intent
  const servicePatterns = [
    /\b(service|services|offer|provide|capabilities|deliverables|what (does he|do you) (offer|provide|do|build))\b/i
  ];
  if (servicePatterns.some((p) => p.test(normalized))) {
    intents.add('services');
  }

  // 7. Skills & Tech Stack Intent
  const skillsPatterns = [
    /\b(skills?|tech stack|stack|technologies|tools?|languages?|proficiency|frameworks?)\b/i,
    /\bwhat (does|are things) akash know\b/i,
    /\bwhat does (he|akash) know\b/i,
    /\bwhat (programming )?languages does (he|akash) (use|know)\b/i
  ];
  if (skillsPatterns.some((p) => p.test(normalized))) {
    intents.add('skills');
  }

  // 8. Projects Intent (Generic)
  const generalProjectPatterns = [
    /\b(projects?|case stud(y|ies)|portfolio|what projects? has (he|akash) (built|made)|show me (his )?work)\b/i
  ];
  if (generalProjectPatterns.some((p) => p.test(normalized))) {
    intents.add('project');
  }

  // 9. Profile / About Intent
  const profilePatterns = [
    /\b(who is akash|tell me about akash|about akash|bio|background|who is he|location|where is he from|based in)\b/i
  ];
  if (profilePatterns.some((p) => p.test(normalized))) {
    intents.add('profile');
  }

  // 10. Experience Intent
  const experiencePatterns = [
    /\b(experience|work experience|work history|career|past roles?|worked at)\b/i
  ];
  if (experiencePatterns.some((p) => p.test(normalized))) {
    intents.add('experience');
  }

  // 11. Education Intent
  const educationPatterns = [
    /\b(education|degree|college|university|cgpa|grade|school|studied|btech|academics)\b/i
  ];
  if (educationPatterns.some((p) => p.test(normalized))) {
    intents.add('education');
  }

  // 12. DSA / Problem Solving Intent
  const dsaPatterns = [
    /\b(dsa|data structures?|algorithms?|leetcode|codeforces|codechef|geeksforgeeks|problem solving|competitive programming)\b/i
  ];
  if (dsaPatterns.some((p) => p.test(normalized))) {
    intents.add('dsa');
  }

  // 13. Availability & Resume Intent
  if (/\b(availab(le|ility)|open to (work|roles)|full-?time|part-?time|remote)\b/i.test(normalized)) {
    intents.add('availability');
  }
  if (/\b(resume|cv|curriculum vitae|download resume)\b/i.test(normalized)) {
    intents.add('resume');
  }

  // 14. General Technical Question Detection
  // e.g. "What is React?", "What is JWT?", "Explain WebGL"
  const isDefinitionQuestion =
    /^(what is|what are|explain|how does .+ work|difference between)\s+([a-z0-9\s.-]+)\??$/i.test(
      normalized
    ) &&
    !normalized.includes('akash') &&
    !normalized.includes('you') &&
    !normalized.includes('his') &&
    !normalized.includes('rapidcare') &&
    !normalized.includes('modplint');

  if (isDefinitionQuestion) {
    intents.add('general');
    if (detectedTech.length > 0) {
      intents.add('technology');
      intents.add('skills');
    }
  }

  // Specific high-level intent flags for retrieval steering
  const isPureContactQuery =
    (intents.has('contact') && !intents.has('project') && !intents.has('hiring')) ||
    /\b(what is (akash'?s|his) email|how (can|do) i (contact|reach) akash)\b/i.test(normalized);

  const isServicesQuery =
    intents.has('services') ||
    /\b(service|services|what (does|can) (akash|he) (offer|provide))\b/i.test(normalized);

  const isHiringQuery =
    intents.has('hiring') ||
    intents.has('pricing') ||
    isServicesQuery;

  const isSkillsQuery =
    (intents.has('skills') && !namedProjectSlug) ||
    /\b(what does akash know|what are things akash knows|what is akash'?s tech stack)\b/i.test(
      normalized
    );

  const isProfileQuery =
    intents.has('profile') ||
    /\btell me about akash\b/i.test(normalized);

  const isGeneralProjectListQuery =
    !namedProjectSlug &&
    /\b(what projects? has (akash|he) (built|made)|show me (his )?projects?|what has akash built)\b/i.test(
      normalized
    );

  const isEducationQuery =
    intents.has('education') && !namedProjectSlug;

  const isDSAQuery = intents.has('dsa');

  // If query is "Tell me about Akash", composite intent
  if (isProfileQuery) {
    intents.add('skills');
    intents.add('experience');
    intents.add('services');
  }

  if (intents.size === 0) {
    intents.add('mixed');
  }

  return {
    rawQuery: query,
    normalizedQuery: normalized,
    intents: Array.from(intents),
    namedProjectSlug,
    detectedTechnologies: detectedTech,
    isPureContactQuery,
    isHiringQuery,
    isServicesQuery,
    isSkillsQuery,
    isProfileQuery,
    isGeneralQuestion: isDefinitionQuestion,
    isGeneralProjectListQuery,
    isEducationQuery,
    isDSAQuery
  };
}
