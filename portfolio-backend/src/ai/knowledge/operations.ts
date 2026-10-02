import {
  loadAkashIndex,
  loadSourceFile,
  loadProjectBySlug,
  loadAllProjects
} from './loader.js';
import type {
  StructuredQueryPlan,
  StructuredResult,
  StructuredSourceItem,
  ProjectData
} from './types.js';

/**
 * Normalizes tech name for robust case-insensitive matching
 */
function normalizeTechName(tech: string): string {
  return tech.toLowerCase().replace(/[^\w]/g, '').trim();
}

/**
 * 1. COUNT Operation
 * E.g., "How many projects does Akash have?"
 */
export function executeCount(plan: StructuredQueryPlan): StructuredResult {
  if (plan.target === 'projects') {
    const projects = loadAllProjects();
    const count = projects.length;

    const featuredNames = projects
      .filter((p) => p.data.featured)
      .map((p) => `**${p.name}**`)
      .slice(0, 3)
      .join(', ');

    const text =
      `Akash Kumar has built **${count} documented projects** spanning full-stack web platforms, AI healthtech, and creative 3D WebGL experiences.\n\n` +
      `Notable featured projects include ${featuredNames || '**RapidCare**, **Modplint Interiors**, and **MERN Docs**'}.\n\n` +
      `You can ask me to list all projects or deep dive into any specific project's architecture and live demo!`;

    const sources: StructuredSourceItem[] = [
      {
        title: "Akash's Projects Catalog",
        type: 'project',
        url: 'https://skykumar.vercel.app/#projects'
      }
    ];

    return {
      operation: 'COUNT',
      target: 'projects',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        "List Akash's projects",
        'Tell me about RapidCare',
        'Which projects use React?'
      ]
    };
  }

  // Fallback for other count targets
  return {
    operation: 'COUNT',
    target: plan.target,
    handled: false,
    text: '',
    sources: []
  };
}

/**
 * 2. LIST Operation
 * E.g., "List Akash's projects"
 */
export function executeList(plan: StructuredQueryPlan): StructuredResult {
  if (plan.target === 'projects') {
    const projects = loadAllProjects();

    const formattedList = projects
      .map((p, idx) => {
        const tagline = p.data.tagline || p.data.category || 'Software Project';
        return `${idx + 1}. **${p.name}**: ${tagline}`;
      })
      .join('\n');

    const text =
      `Here is the complete list of Akash Kumar's **${projects.length} documented projects**:\n\n` +
      `${formattedList}\n\n` +
      `Ask me about any specific project for details on its technical architecture, tech stack, or live links!`;

    const sources: StructuredSourceItem[] = [
      {
        title: "Akash's Featured Projects",
        type: 'project',
        url: 'https://skykumar.vercel.app/#projects'
      }
    ];

    return {
      operation: 'LIST',
      target: 'projects',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        'Tell me about RapidCare',
        'Tell me about Modplint Interiors',
        'Which projects use React?'
      ]
    };
  }

  return {
    operation: 'LIST',
    target: plan.target,
    handled: false,
    text: '',
    sources: []
  };
}

/**
 * 3. CHECK Operation
 * E.g., "Does Akash know React?" -> Verified YES
 *       "Does Akash know Python?" -> Safe unknown (not documented)
 */
export function executeCheck(plan: StructuredQueryPlan): StructuredResult {
  const queryTech = (plan.entity || '').trim();
  if (!queryTech) {
    return {
      operation: 'CHECK',
      target: 'skills',
      handled: false,
      text: '',
      sources: []
    };
  }

  const index = loadAkashIndex();
  const knownTechnologies = index.skills?.knownTechnologies || [];
  const normalizedQueryTech = normalizeTechName(queryTech);

  // Check in canonical known technologies list
  const matchedTech = knownTechnologies.find(
    (tech) => normalizeTechName(tech) === normalizedQueryTech
  );

  // Also check project technologies to find real-world usage evidence
  const allProjects = loadAllProjects();
  const usingProjects: string[] = [];

  for (const proj of allProjects) {
    const techObj = proj.data.technologies;
    if (!techObj) continue;

    let hasMatch = false;
    for (const techList of Object.values(techObj)) {
      if (Array.isArray(techList)) {
        if (techList.some((t) => normalizeTechName(t).includes(normalizedQueryTech))) {
          hasMatch = true;
          break;
        }
      }
    }

    if (hasMatch) {
      usingProjects.push(proj.name);
    }
  }

  // CASE 1: Technology is documented in Akash's skills
  if (matchedTech || usingProjects.length > 0) {
    const canonicalName = matchedTech || queryTech;
    let text = `Yes, Akash Kumar knows and actively works with **${canonicalName}**.`;

    if (usingProjects.length > 0) {
      const topProjects = usingProjects.slice(0, 3).map((p) => `**${p}**`).join(', ');
      text += ` It is a core part of his documented stack and is utilized across projects including ${topProjects}.`;
    } else {
      text += ` It is documented in his core technical skill set.`;
    }

    const sources: StructuredSourceItem[] = [
      {
        title: 'Skills Matrix & Technical Stack',
        type: 'skills',
        url: 'https://skykumar.vercel.app/#skills'
      }
    ];

    if (usingProjects.length > 0) {
      const firstSlug = allProjects.find((p) => p.name === usingProjects[0])?.slug;
      if (firstSlug) {
        sources.push({
          title: `${usingProjects[0]} - Project Architecture`,
          type: 'project',
          projectSlug: firstSlug
        });
      }
    }

    return {
      operation: 'CHECK',
      target: 'skills',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        `Which projects use ${canonicalName}?`,
        "What is Akash's tech stack?",
        'What services does Akash offer?'
      ]
    };
  }

  // CASE 2: Technology is NOT documented (Section 6B & 19: Unknown Fact Policy)
  // Explicitly state it is not currently documented; DO NOT say "No" unless documented as not a skill, and DO NOT guess/infer.
  const displayName = queryTech ? queryTech.charAt(0).toUpperCase() + queryTech.slice(1) : 'The requested technology';
  const text = `${displayName} is not currently listed in Akash's documented skill set.`;

  const sources: StructuredSourceItem[] = [
    {
      title: 'Skills Matrix & Technical Stack',
      type: 'skills',
      url: 'https://skykumar.vercel.app/#skills'
    }
  ];

  return {
    operation: 'CHECK',
    target: 'skills',
    handled: true,
    text,
    sources,
    suggestedQuestions: [
      'What technologies does Akash know?',
      "What is Akash's tech stack?",
      "List Akash's projects"
    ]
  };
}

/**
 * 4. FILTER Operation
 * E.g., "Which projects use React?"
 */
export function executeFilter(plan: StructuredQueryPlan): StructuredResult {
  const queryTech = (plan.entity || '').trim();
  const normalizedQueryTech = normalizeTechName(queryTech);

  const allProjects = loadAllProjects();
  const matchingProjects: Array<{ name: string; slug: string; data: ProjectData; matchedArea: string }> = [];

  for (const proj of allProjects) {
    const techObj = proj.data.technologies;
    if (!techObj) continue;

    let matchedArea = '';
    for (const [area, techList] of Object.entries(techObj)) {
      if (Array.isArray(techList)) {
        if (techList.some((t) => normalizeTechName(t).includes(normalizedQueryTech))) {
          matchedArea = area;
          break;
        }
      }
    }

    if (matchedArea) {
      matchingProjects.push({
        name: proj.name,
        slug: proj.slug,
        data: proj.data,
        matchedArea
      });
    }
  }

  const index = loadAkashIndex();
  const knownTech = (index.skills?.knownTechnologies || []).find(
    (t) => normalizeTechName(t) === normalizedQueryTech
  );
  const displayName =
    knownTech ||
    (queryTech ? queryTech.charAt(0).toUpperCase() + queryTech.slice(1) : 'the specified technology');

  if (matchingProjects.length > 0) {
    const formattedMatches = matchingProjects
      .map((p) => {
        const tagline = p.data.tagline || p.data.category || '';
        return `- **${p.name}**: ${tagline ? `${tagline} ` : ''}(${p.matchedArea})`;
      })
      .join('\n');

    const text =
      `The following **${matchingProjects.length} projects** in Akash's portfolio use **${displayName}**:\n\n` +
      `${formattedMatches}\n\n` +
      `Ask me about any of these projects for architectural breakdowns or live links!`;

    const sources: StructuredSourceItem[] = matchingProjects.slice(0, 3).map((p) => ({
      title: `${p.name} - Overview`,
      type: 'project',
      projectSlug: p.slug,
      url: p.data.links?.live_demo || p.data.links?.github_repo || undefined
    }));

    return {
      operation: 'FILTER',
      target: 'projects',
      handled: true,
      text,
      sources,
      suggestedQuestions: matchingProjects.slice(0, 3).map((p) => `Tell me about ${p.name}`)
    };
  }

  // No matches found for this technology
  const text = `None of Akash's documented projects currently list **${displayName}** in their architecture.`;
  const sources: StructuredSourceItem[] = [
    {
      title: "Akash's Projects Catalog",
      type: 'project',
      url: 'https://skykumar.vercel.app/#projects'
    }
  ];

  return {
    operation: 'FILTER',
    target: 'projects',
    handled: true,
    text,
    sources,
    suggestedQuestions: [
      'What technologies does Akash use?',
      "List Akash's projects",
      'What is his tech stack?'
    ]
  };
}

/**
 * 5. COMPARE Operation
 * E.g., "Compare RapidCare and MERN Docs"
 */
export function executeCompare(plan: StructuredQueryPlan): StructuredResult {
  const slugA = (plan.entity || '').toLowerCase().trim();
  const slugB = (plan.secondaryEntity || '').toLowerCase().trim();

  const projA = loadProjectBySlug(slugA);
  const projB = loadProjectBySlug(slugB);

  if (!projA || !projB) {
    return {
      operation: 'COMPARE',
      target: 'projects',
      handled: false,
      text: '',
      sources: []
    };
  }

  // Extract technologies
  const getTechSummary = (data: ProjectData) => {
    if (!data.technologies) return 'Modern web technologies';
    const all: string[] = [];
    for (const list of Object.values(data.technologies)) {
      if (Array.isArray(list)) all.push(...list.slice(0, 4));
    }
    return all.slice(0, 8).join(', ');
  };

  const text =
    `### Comparison: **${projA.name}** vs. **${projB.name}**\n\n` +
    `| Attribute | **${projA.name}** | **${projB.name}** |\n` +
    `| :--- | :--- | :--- |\n` +
    `| **Category** | ${projA.category || 'Web Application'} | ${projB.category || 'Web Application'} |\n` +
    `| **Core Purpose** | ${projA.tagline || projA.description?.slice(0, 100) || 'Production platform'} | ${projB.tagline || projB.description?.slice(0, 100) || 'Production platform'} |\n` +
    `| **Key Technologies** | ${getTechSummary(projA)} | ${getTechSummary(projB)} |\n` +
    `| **Role** | ${projA.role || 'Full-Stack Engineer'} | ${projB.role || 'Full-Stack Engineer'} |\n` +
    `| **Timeline** | ${projA.timeline || 'Recent'} | ${projB.timeline || 'Recent'} |\n\n` +
    `**Key Architecture Differences:**\n` +
    `- **${projA.name}**: ${projA.solution?.slice(0, 160) || projA.description?.slice(0, 160)}...\n` +
    `- **${projB.name}**: ${projB.solution?.slice(0, 160) || projB.description?.slice(0, 160)}...\n\n` +
    `Both projects demonstrate Akash's full-stack engineering proficiency in building production-ready architectures!`;

  const sources: StructuredSourceItem[] = [
    {
      title: `${projA.name} - Architecture`,
      type: 'project',
      projectSlug: slugA,
      url: projA.links?.live_demo || projA.links?.github_repo
    },
    {
      title: `${projB.name} - Architecture`,
      type: 'project',
      projectSlug: slugB,
      url: projB.links?.live_demo || projB.links?.github_repo
    }
  ];

  return {
    operation: 'COMPARE',
    target: 'projects',
    handled: true,
    text,
    sources,
    suggestedQuestions: [
      `What technologies were used in ${projA.name}?`,
      `What technologies were used in ${projB.name}?`,
      "What is Akash's tech stack?"
    ]
  };
}

/**
 * 6. AGGREGATE Operation
 * E.g., "What technologies does Akash use?"
 */
export function executeAggregate(plan: StructuredQueryPlan): StructuredResult {
  const index = loadAkashIndex();
  const knownTechnologies = index.skills?.knownTechnologies || [];

  const languages = ['C', 'C++', 'Java', 'JavaScript', 'TypeScript'];
  const frontend = ['React', 'Next.js', 'Tailwind CSS', 'HTML', 'CSS', 'Redux', 'Redux Toolkit'];
  const backend = ['Node.js', 'Express.js', 'REST APIs', 'Socket.IO', 'JWT'];
  const databases = ['MongoDB', 'Mongoose', 'SQL', 'PostgreSQL', 'Redis'];
  const creative3D = ['Three.js', 'React Three Fiber', 'Drei', 'OGL', 'GSAP', 'Motion', 'Lenis'];
  const tools = ['Git', 'GitHub', 'Vite', 'Docker', 'Vercel', 'Render'];

  const text =
    `Akash Kumar leverages a comprehensive modern technology stack across his full-stack and 3D creative work:\n\n` +
    `- **Core Languages**: ${languages.join(', ')}\n` +
    `- **Frontend Architecture**: ${frontend.join(', ')}\n` +
    `- **3D & Creative Web**: ${creative3D.join(', ')}\n` +
    `- **Backend & APIs**: ${backend.join(', ')}\n` +
    `- **Databases & Storage**: ${databases.join(', ')}\n` +
    `- **DevOps & Cloud**: ${tools.join(', ')}\n\n` +
    `He applies these technologies across real-world systems like RapidCare, Modplint Interiors, and MERN Docs.`;

  const sources: StructuredSourceItem[] = [
    {
      title: 'Skills Matrix & Technology Index',
      type: 'skills',
      url: 'https://skykumar.vercel.app/#skills'
    }
  ];

  return {
    operation: 'AGGREGATE',
    target: 'skills',
    handled: true,
    text,
    sources,
    suggestedQuestions: [
      'Which projects use React?',
      'Tell me about RapidCare',
      'What services does Akash offer?'
    ]
  };
}

/**
 * 7. SUMMARY Operation
 * E.g., "Tell me about Akash", "Who is Akash?"
 */
export function executeSummary(plan: StructuredQueryPlan): StructuredResult {
  const index = loadAkashIndex();
  const identity = index.identity;

  const text =
    `**Akash Kumar** is a **${identity.role}** based in India (remote-ready globally) focused on building modern web applications, interactive 3D digital experiences, and scalable full-stack products.\n\n` +
    `**Core Highlights:**\n` +
    `- **Full-Stack Engineering**: Production web systems built with React, Node.js, Express, and MongoDB\n` +
    `- **Creative 3D & WebGL**: Interactive experiences powered by Three.js, React Three Fiber, Rapier Physics, and OGL\n` +
    `- **Featured Projects**: Architected platforms like RapidCare (AI emergency triage & ambulance dispatch), Modplint Interiors, and MERN Docs\n` +
    `- **Education**: Bachelor of Technology (B.Tech) in Computer Science & Engineering from RTU, GIT, Jaipur\n` +
    `- **Open to**: Full-time Software Development Engineer (SDE) roles, engineering internships, and high-impact client projects\n\n` +
    `Feel free to ask about his skills, projects, or how to collaborate!`;

  const sources: StructuredSourceItem[] = [
    {
      title: 'Akash Kumar - Profile Overview',
      type: 'profile',
      url: 'https://skykumar.vercel.app'
    },
    {
      title: 'Skills Matrix',
      type: 'skills',
      url: 'https://skykumar.vercel.app/#skills'
    }
  ];

  return {
    operation: 'SUMMARY',
    target: 'profile',
    handled: true,
    text,
    sources,
    suggestedQuestions: [
      "What is Akash's tech stack?",
      "What projects has Akash built?",
      'How do I hire Akash for a project?'
    ]
  };
}

/**
 * 8. GET Operation (Specific authoritative facts)
 * E.g. Education, Contact, Pricing, DSA
 */
export function executeGet(plan: StructuredQueryPlan): StructuredResult {
  // Education
  if (plan.target === 'education') {
    const text =
      `Akash Kumar is pursuing a **Bachelor of Technology (B.Tech) in Computer Science & Engineering** from **RTU, GIT (Global Institute of Technology), Jaipur** (2024 - 2028).\n\n` +
      `**Core Academic Focus:**\n` +
      `- Data Structures & Algorithms (DSA)\n` +
      `- Object-Oriented Programming (OOP)\n` +
      `- Database Management Systems (DBMS)\n` +
      `- Operating Systems & System Design`;

    const sources: StructuredSourceItem[] = [
      {
        title: 'Education - B.Tech Computer Science & Engineering',
        type: 'education',
        url: 'https://skykumar.vercel.app/#about'
      }
    ];

    return {
      operation: 'GET',
      target: 'education',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        "What is Akash's tech stack?",
        'Does Akash know DSA?',
        "What projects has Akash built?"
      ]
    };
  }

  // Contact
  if (plan.target === 'contact') {
    const contactData = loadSourceFile<Record<string, string>>('contact.json') || {};
    const email = contactData.email || 'akashkumarhzb121@gmail.com';
    const linkedin = contactData.linkedin || 'https://www.linkedin.com/in/akash-kumar-488074309';
    const github = contactData.github || 'https://github.com/akashkumarhzb121-cloud';

    const text =
      `You can reach Akash Kumar directly through several channels:\n\n` +
      `- **Email**: [${email}](mailto:${email})\n` +
      `- **LinkedIn**: [Akash Kumar on LinkedIn](${linkedin})\n` +
      `- **GitHub**: [github.com/akashkumarhzb121-cloud](${github})\n` +
      `- **Location**: India (open for global remote work)\n` +
      `- **Typical Response Time**: Within 24 hours\n\n` +
      `You can also send a direct enquiry using the interactive contact form on this portfolio.`;

    const sources: StructuredSourceItem[] = [
      {
        title: 'Contact Information & Inquiries',
        type: 'contact',
        url: 'https://skykumar.vercel.app/#contact'
      }
    ];

    return {
      operation: 'GET',
      target: 'contact',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        'What services does Akash offer?',
        'How do I hire Akash for a project?',
        "What is Akash's tech stack?"
      ]
    };
  }

  // Pricing
  if (plan.target === 'services' && plan.field === 'pricingPolicy') {
    const text =
      `Akash's pricing depends on the project's requirements, scope, features, complexity, and timeline. Pricing is scoped transparently based on your specific project goals.\n\n` +
      `**Services Offered:**\n` +
      `- **Full-Stack Web Applications**: Scalable apps built with React, Node.js, Express, and MongoDB\n` +
      `- **Creative Web & 3D Interactive**: 3D graphics, shaders, and animations using Three.js and WebGL\n` +
      `- **AI & Smart Integrations**: Production RAG architectures, LLM pipelines, and AI assistants\n` +
      `- **UI/UX Modernization**: High-performance refactoring and responsive design\n\n` +
      `To discuss your requirements and get an accurate quote, please contact Akash directly at **akashkumarhzb121@gmail.com** or send a message via the portfolio contact form.`;

    const sources: StructuredSourceItem[] = [
      {
        title: 'Services & Pricing Policy',
        type: 'services',
        url: 'https://skykumar.vercel.app/#services'
      },
      {
        title: 'Contact Information',
        type: 'contact',
        url: 'https://skykumar.vercel.app/#contact'
      }
    ];

    return {
      operation: 'GET',
      target: 'services',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        'How can I contact Akash?',
        'What services does Akash offer?',
        'Tell me about RapidCare'
      ]
    };
  }

  // Experience
  if (plan.target === 'experience') {
    const text =
      `**Akash Kumar's Professional Experience & Engineering Track Record:**\n\n` +
      `- **Web Development Intern at Novitech Pvt. Ltd.** (Remote):\n` +
      `  - Developed and deployed two client-ready production landing pages adhering to strict responsive design and cross-browser standards.\n` +
      `  - Optimized asset loading and performance across mobile, tablet, and desktop viewports.\n` +
      `  - Collaborated with engineering stakeholders for on-time delivery.\n\n` +
      `- **Freelance Full-Stack & Creative Developer**:\n` +
      `  - Architected and delivered end-to-end commercial client platforms such as **Modplint Interiors** (complete consultation pipeline and administrative CMS).\n` +
      `  - Developed production full-stack systems like **RapidCare** (real-time emergency triage with AI integration and live ambulance dispatch tracking).\n` +
      `  - Built immersive interactive 3D WebGL experiences using Three.js, React Three Fiber, Rapier Physics, and modern frontend tools.\n\n` +
      `He has proven hands-on experience building, deploying, and maintaining production-grade applications. Ask me about any specific project or role!`;

    const sources: StructuredSourceItem[] = [
      {
        title: 'Work Experience - Novitech Pvt. Ltd.',
        type: 'experience',
        url: 'https://skykumar.vercel.app/#experience'
      },
      {
        title: 'Commercial Client Work - Modplint Interiors',
        type: 'project',
        projectSlug: 'modplint-interiors',
        url: 'https://modplintinteriors.com'
      }
    ];

    return {
      operation: 'GET',
      target: 'experience',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        'Tell me about his work at Novitech',
        'Tell me about Modplint Interiors',
        'How can I hire Akash for a project?'
      ]
    };
  }

  // Differentiator
  if (plan.target === 'differentiator') {
    const text =
      `What sets **Akash Kumar** apart from typical developers is his unique combination of **creative engineering, production-grade architecture, and problem-solving rigor**:\n\n` +
      `1. **Intersection of 3D Web & Full-Stack Systems**:\n` +
      `   Unlike developers who specialize exclusively in frontend or backend, Akash seamlessly bridges both worlds: creating immersive 3D/WebGL experiences (Three.js, React Three Fiber, Rapier Physics, GSAP, OGL) while engineering robust, scalable backends (Node.js, Express, MongoDB, Socket.IO).\n\n` +
      `2. **Real-World Product Ownership**:\n` +
      `   He doesn't just build clone apps—he engineers real-world platforms. From architecting **RapidCare** (an AI clinical triage and live ambulance dispatch network) to building commercial production platforms like **Modplint Interiors** with custom CMS workflows.\n\n` +
      `3. **Strong Algorithmic & Performance Mindset**:\n` +
      `   With 500+ algorithmic problems solved across LeetCode and GeeksforGeeks, he writes clean, optimized, memory-efficient code and is relentless about performance (60fps animations, optimized asset loading, and fast API response times).\n\n` +
      `4. **End-to-End Client & Team Execution**:\n` +
      `   Proven capability to communicate directly with clients, translate high-level requirements into technical architectures, and ship production-ready software on time.\n\n` +
      `Whether you need a high-impact interactive digital experience or a mission-critical web application, Akash brings both the creative vision and the technical muscle to deliver it.`;

    const sources: StructuredSourceItem[] = [
      {
        title: 'Akash Kumar - Profile Overview',
        type: 'profile',
        url: 'https://skykumar.vercel.app'
      },
      {
        title: 'Skills Matrix & 3D Interactive Stack',
        type: 'skills',
        url: 'https://skykumar.vercel.app/#skills'
      },
      {
        title: 'RapidCare - Full-Stack Architecture',
        type: 'project',
        projectSlug: 'rapidcare',
        url: 'https://rapidcare.vercel.app'
      }
    ];

    return {
      operation: 'GET',
      target: 'differentiator',
      handled: true,
      text,
      sources,
      suggestedQuestions: [
        'What technologies does Akash use?',
        'Tell me about RapidCare',
        'How can I hire Akash for a project?'
      ]
    };
  }

  return {
    operation: 'GET',
    target: plan.target,
    handled: false,
    text: '',
    sources: []
  };
}
