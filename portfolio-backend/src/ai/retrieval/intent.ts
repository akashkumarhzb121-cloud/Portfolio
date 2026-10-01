export type IntentType =
  | 'greeting'
  | 'casual'
  | 'capabilities'
  | 'profile'
  | 'skills'
  | 'experience'
  | 'education'
  | 'services'
  | 'hiring'
  | 'job'
  | 'internship'
  | 'freelance'
  | 'pricing'
  | 'contact'
  | 'project'
  | 'technology'
  | 'general'
  | 'faq'
  | 'availability'
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
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node js', 'node'] },
  { name: 'JavaScript', aliases: ['javascript', 'vanilla js', 'js'] },
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
  isGreetingQuery: boolean;
  isCasualQuery: boolean;
  isCapabilitiesQuery: boolean;
  isJobQuery: boolean;
  isInternshipQuery: boolean;
  isFreelanceQuery: boolean;
  isPricingQuery: boolean;
  isResumeQuery: boolean;
  isAvailabilityQuery: boolean;
  isFollowUp: boolean;
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
 * Scans conversation history to resolve implicit references to projects or technologies.
 */
function resolveContextFromHistory(
  normalizedQuery: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): { projectSlug?: string; technology?: string } {
  if (!history || history.length === 0) return {};

  const followUpIndicators = [
    /\b(it|this|that|the project|this project|that project|the app|this app|the system)\b/i,
    /\b(technolog(y|ies)|stack|languages?|frameworks?)\s+(were|was|did he|are)\s+(used|utilized|built with)\b/i,
    /\bwhat (tech|stack|technologies|tools) (did he use|were used|is used)\b/i,
    /\b(what problem does it solve|how does it work|is it deployed|live demo|live link)\b/i,
    /\b(can akash build something similar|build something similar|similar project|something similar)\b/i,
    /\b(tell me more about it|tell me more|details)\b/i,
    /\bdoes akash use it\b/i
  ];

  const hasFollowUp = followUpIndicators.some((pat) => pat.test(normalizedQuery));

  let matchedProject: string | undefined;
  let matchedTech: string | undefined;

  for (let i = history.length - 1; i >= 0; i--) {
    const text = normalizeText(history[i].content);

    if (!matchedProject) {
      for (const proj of KNOWN_PROJECTS) {
        for (const alias of proj.aliases) {
          const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
          if (pattern.test(text)) {
            matchedProject = proj.slug;
            break;
          }
        }
        if (matchedProject) break;
      }
    }

    if (!matchedTech) {
      for (const tech of KNOWN_TECHNOLOGIES) {
        for (const alias of tech.aliases) {
          const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
          if (pattern.test(text)) {
            matchedTech = tech.name;
            break;
          }
        }
        if (matchedTech) break;
      }
    }

    if (matchedProject && matchedTech) break;
  }

  return {
    projectSlug: hasFollowUp ? matchedProject : undefined,
    technology: hasFollowUp || normalizedQuery.includes('it') ? matchedTech : undefined
  };
}

/**
 * Deterministic intent classification & entity extraction without extra LLM overhead
 */
export function classifyQueryIntent(
  query: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): QueryAnalysis {
  const normalized = normalizeText(query);
  const intents: Set<IntentType> = new Set();
  const detectedTech: string[] = [];
  let namedProjectSlug: string | undefined;

  // 1. Detect Named Projects in current query
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

  // 2. Detect Technologies in current query
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

  // Disambiguate: "node.js" / "node js" should detect Node.js, not JavaScript
  if (detectedTech.includes('Node.js') && normalized.includes('node')) {
    const jsIndex = detectedTech.indexOf('JavaScript');
    if (jsIndex >= 0) detectedTech.splice(jsIndex, 1);
  }

  // 3. Resolve context from conversation history if needed
  let isFollowUp = false;
  if (history && history.length > 0) {
    const context = resolveContextFromHistory(normalized, history);
    if (!namedProjectSlug && context.projectSlug) {
      namedProjectSlug = context.projectSlug;
      intents.add('project');
      isFollowUp = true;
    }
    if (context.technology && !detectedTech.includes(context.technology)) {
      detectedTech.push(context.technology);
      intents.add('technology');
      intents.add('skills');
      isFollowUp = true;
    }
  }

  // 4. Greeting Intent (standalone pleasantries)
  const isGreetingQuery =
    /^(hi|hey|hello|hii|heyy|heya|howdy|yo|greetings|good\s+(morning|afternoon|evening|day))\b/i.test(
      normalized
    ) &&
    !normalized.includes('project') &&
    !normalized.includes('rapidcare') &&
    !normalized.includes('contact') &&
    !normalized.includes('hire') &&
    !normalized.includes('skill') &&
    !normalized.includes('experience') &&
    !normalized.includes('education') &&
    !normalized.includes('service') &&
    !normalized.includes('cost') &&
    !normalized.includes('price') &&
    !normalized.includes('dsa') &&
    !normalized.includes('resume') &&
    !normalized.includes('github') &&
    !normalized.includes('linkedin');

  if (isGreetingQuery) {
    intents.add('greeting');
  }

  // 5. Casual Intent
  const casualPatterns = [
    /\b(how are you|how is it going|how s it going|how are things|what s up|whats up|how do you do)\b/i,
    /\b(nice to meet you|pleasure to meet you)\b/i,
    /\b(who am i talking to|who are you|are you an ai|are you a bot|are you human|what is your name|what s your name)\b/i,
    /\b(thank you|thanks|thanks a lot|thank you so much|thx|appreciate it)\b/i,
    /\b(bye|goodbye|see you|see ya|have a good day|take care)\b/i,
    /\b(nice website|cool website|love this website|like this website|this looks great|awesome site|great design|impressive website|cool portfolio)\b/i
  ];
  const isCasualQuery =
    !isGreetingQuery &&
    casualPatterns.some((p) => p.test(normalized)) &&
    !normalized.includes('akash') &&
    !normalized.includes('project');

  if (isCasualQuery) {
    intents.add('casual');
  }

  // 6. Capabilities Intent
  const capabilitiesPatterns = [
    /\b(what can you do|what can i ask you|how can you help me|what are you able to do|what are your capabilities|what do you do|help me|what can this bot do)\b/i,
    /^(help|capabilities|menu)$/i
  ];
  const isCapabilitiesQuery = capabilitiesPatterns.some((p) => p.test(normalized));
  if (isCapabilitiesQuery) {
    intents.add('capabilities');
  }

  // 7. Contact Intent
  const contactPatterns = [
    /\b(contact|email|reach|phone|call|message|get in touch|touch|connect with|reach out|talk to|mail)\b/i,
    /\b(how (can|do) i (contact|reach)|what is (akash'?s|his) email)\b/i,
    /\b(github|linkedin|twitter|proposal|send proposal|submit proposal)\b/i
  ];
  if (contactPatterns.some((p) => p.test(normalized))) {
    intents.add('contact');
    intents.add('faq');
  }

  // 8. Hiring Intent
  const hiringPatterns = [
    /\b(hire|hiring|work with|collaborate|contract|contractor|take on|consultation)\b/i,
    /\b(build a (website|web app|app|platform)|make a (website|web app|app)|need a (website|developer|engineer))\b/i,
    /\b(looking for a (developer|engineer)|want to (build|make|create)|start a project)\b/i
  ];
  if (hiringPatterns.some((p) => p.test(normalized))) {
    intents.add('hiring');
    intents.add('services');
    intents.add('contact');
  }

  // 9. Job Intent
  const jobPatterns = [
    /\b(job|jobs|full-?time|part-?time|open to work|looking for a job|recruit akash|interview akash|job opportunity|hire full-?time)\b/i
  ];
  const isJobQuery = jobPatterns.some((p) => p.test(normalized));
  if (isJobQuery) {
    intents.add('job');
    intents.add('availability');
    intents.add('contact');
  }

  // 10. Internship Intent
  const internshipPatterns = [
    /\b(intern|internship|internships|hire as an intern|hire akash as an intern|internship opportunity)\b/i
  ];
  const isInternshipQuery = internshipPatterns.some((p) => p.test(normalized));
  if (isInternshipQuery) {
    intents.add('internship');
    intents.add('job');
    intents.add('availability');
    intents.add('contact');
  }

  // 11. Freelance Intent
  const freelancePatterns = [
    /\b(freelance|freelancer|freelancing|contract work)\b/i
  ];
  const isFreelanceQuery = freelancePatterns.some((p) => p.test(normalized));
  if (isFreelanceQuery) {
    intents.add('freelance');
    intents.add('services');
    intents.add('hiring');
  }

  // 12. Pricing Intent
  const pricingPatterns = [
    /\b(cost|charge|price|pricing|rate|rates|fee|fees|quote|how much does|how much is|budget|hourly)\b/i
  ];
  const isPricingQuery = pricingPatterns.some((p) => p.test(normalized));
  if (isPricingQuery) {
    intents.add('pricing');
    intents.add('services');
    intents.add('contact');
  }

  // 13. Services Intent
  const servicePatterns = [
    /\b(service|services|offer|provide|capabilities|deliverables|what (does he|do you) (offer|provide|do|build))\b/i,
    /\b(can akash build|can he build|can akash create|can he create|can akash make)\b/i,
    /\b(website for my company|business website|web application|3d website|full-stack application)\b/i
  ];
  if (servicePatterns.some((p) => p.test(normalized))) {
    intents.add('services');
  }

  // 14. Skills & Tech Stack Intent
  const isCanBuildQuery = /\b(can (akash|he) (build|create|make)|want to (build|make|create)|build a|create a|make a)\b/i.test(normalized);
  const skillsPatterns = [
    /\b(skills?|tech stack|technologies|tools?|languages?|proficiency|frameworks?)\b/i,
    /\bwhat (does|are things) akash know\b/i,
    /\bwhat does (he|akash) know\b/i,
    /\bwhat (programming )?languages does (he|akash) (use|know)\b/i,
    /\bdoes (akash|he) (know|use|work with)\b/i,
    /\bwhat about his backend skills\b/i
  ];
  if (!isCanBuildQuery && (skillsPatterns.some((p) => p.test(normalized)) || (/\bstack\b/i.test(normalized) && !normalized.includes('full-stack') && !normalized.includes('full stack')))) {
    intents.add('skills');
  }

  // 15. Projects Intent (Generic)
  const generalProjectPatterns = [
    /\b(projects?|case stud(y|ies)|portfolio|what projects? has (he|akash) (built|made)|show me (his )?work|what has he built)\b/i
  ];
  if (generalProjectPatterns.some((p) => p.test(normalized))) {
    intents.add('project');
  }

  // 16. Profile / About Intent
  const profilePatterns = [
    /\b(who is akash|tell me about akash|about akash|bio|background|who is he|location|where is he from|based in)\b/i,
    /\b(who is the developer|developer behind this website|brief introduction about akash|what kind of developer)\b/i
  ];
  const isProjectSpecific = /\b(projects?|what has he built|show me his work)\b/i.test(normalized);
  if (profilePatterns.some((p) => p.test(normalized)) && !isProjectSpecific) {
    intents.add('profile');
  }

  // If query is about sending a proposal, route to contact/services rather than general project
  const isProposalQuery = /\b(proposal|project proposal|send proposal|submit proposal)\b/i.test(normalized);
  if (isProposalQuery) {
    intents.add('contact');
    intents.add('services');
    intents.delete('project');
  }

  // 17. Experience Intent
  const experiencePatterns = [
    /\b(experience|work experience|work history|career|past roles?|worked at|what has akash worked on)\b/i
  ];
  if (experiencePatterns.some((p) => p.test(normalized))) {
    intents.add('experience');
  }

  // 18. Education Intent
  const educationPatterns = [
    /\b(education|degree|college|university|cgpa|grade|school|studied|btech|academics|where did akash study)\b/i
  ];
  if (educationPatterns.some((p) => p.test(normalized))) {
    intents.add('education');
  }

  // 19. DSA / Problem Solving Intent
  const dsaPatterns = [
    /\b(dsa|data structures?|algorithms?|leetcode|codeforces|codechef|geeksforgeeks|problem solving|competitive programming)\b/i
  ];
  if (dsaPatterns.some((p) => p.test(normalized))) {
    intents.add('dsa');
  }

  // 20. Availability & Resume Intent
  const isAvailabilityQuery =
    /\b(availab(le|ility)|open to (work|roles)|full-?time|part-?time|remote)\b/i.test(normalized) ||
    isJobQuery;
  if (isAvailabilityQuery) {
    intents.add('availability');
  }

  const isResumeQuery = /\b(resume|cv|curriculum vitae|download resume)\b/i.test(normalized);
  if (isResumeQuery) {
    intents.add('resume');
  }

  // 21. General Technical Question Detection
  const isDefinitionQuestion =
    /^(what is|what are|explain|how does .+ work|difference between)\s+([a-z0-9\s.-]+)\??$/i.test(
      normalized
    ) &&
    !normalized.includes('akash') &&
    !normalized.includes('you') &&
    !normalized.includes('his') &&
    !normalized.includes('rapidcare') &&
    !normalized.includes('modplint') &&
    !normalized.includes('mern docs');

  if (isDefinitionQuestion) {
    intents.add('general');
    if (detectedTech.length > 0) {
      intents.add('technology');
      intents.add('skills');
    }
  }

  // 22. Specific Boolean Flags for Retrieval Steering
  const isPureContactQuery =
    !isGreetingQuery &&
    !isCasualQuery &&
    !isCapabilitiesQuery &&
    !isPricingQuery &&
    ((intents.has('contact') && !intents.has('project') && !intents.has('hiring') && !isJobQuery && !isInternshipQuery) ||
      /\b(what is (akash'?s|his) email|how (can|do) i (contact|reach) akash|can i see his github|can i send (him )?a (project )?proposal)\b/i.test(
        normalized
      ));

  const isServicesQuery =
    intents.has('services') ||
    /\b(service|services|what (does|can) (akash|he) (offer|provide))\b/i.test(normalized);

  const isHiringQuery =
    intents.has('hiring') ||
    isPricingQuery ||
    isFreelanceQuery ||
    /\b(i want to hire akash|how do i hire akash)\b/i.test(normalized);

  const isGeneralProjectListQuery =
    !namedProjectSlug &&
    (/\b(what projects? has (akash|he) (built|made)|show me (his )?projects?|what has akash built|tell me about (akash|his)(?:'|\s)?s? projects|list (of )?projects)\b/i.test(
      normalized
    ) ||
      (normalized.includes('projects') && !intents.has('contact') && !isPureContactQuery));

  const isProfileQuery =
    (intents.has('profile') && !isGeneralProjectListQuery) ||
    (/\btell me about akash\b/i.test(normalized) && !normalized.includes('project'));

  const isDSAQuery = intents.has('dsa');

  const isSkillsQuery =
    !isDSAQuery &&
    !isDefinitionQuestion &&
    !isCanBuildQuery &&
    ((intents.has('skills') && !namedProjectSlug) ||
      /\b(what does akash know|what are things akash knows|what is akash(?:'|\s)?s? tech stack|what technologies does akash know|does akash know|does he know)\b/i.test(
        normalized
      ));

  const isEducationQuery =
    intents.has('education') && !namedProjectSlug;

  // If query is "Tell me about Akash", composite intent
  if (isProfileQuery) {
    intents.add('skills');
    intents.add('experience');
    intents.add('services');
  }

  // If multiple distinct core categories are triggered, mark as mixed
  if (
    (intents.has('services') && intents.has('contact')) ||
    (intents.has('profile') && intents.has('hiring')) ||
    (intents.has('skills') && intents.has('project')) ||
    intents.size >= 3
  ) {
    intents.add('mixed');
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
    isDSAQuery,
    isGreetingQuery,
    isCasualQuery,
    isCapabilitiesQuery,
    isJobQuery,
    isInternshipQuery,
    isFreelanceQuery,
    isPricingQuery,
    isResumeQuery,
    isAvailabilityQuery,
    isFollowUp
  };
}
