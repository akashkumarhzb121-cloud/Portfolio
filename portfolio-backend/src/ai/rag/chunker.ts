import type { KnowledgeSourceType, IKnowledgeChunkMetadata } from '../../models/knowledgeChunk.model.js';

export interface RawChunk {
  chunkId: string;
  source: string;
  sourceType: KnowledgeSourceType;
  projectSlug?: string;
  url?: string;
  title: string;
  content: string;
  metadata: IKnowledgeChunkMetadata;
  tags: string[];
}

/**
 * Chunker for Project files in ai-knowledge/projects/*.json
 */
export function chunkProject(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const projectSlug = filename.replace('.json', '').toLowerCase();
  const projectId = data.id || projectSlug;
  const projectName = data.name || projectId;
  const primaryUrl =
    data.links?.live_demo ||
    data.links?.portfolio ||
    data.links?.github_repo ||
    undefined;

  // 1. Overview chunk: Core problem, solution, role, metrics
  const overviewContent = [
    `Project: ${projectName}`,
    data.category ? `Category: ${data.category}` : null,
    data.tagline ? `Tagline: ${data.tagline}` : null,
    data.role ? `Role: ${data.role}` : null,
    data.timeline ? `Timeline: ${data.timeline}` : null,
    data.description ? `Description: ${data.description}` : null,
    data.problem ? `Problem Statement: ${data.problem}` : null,
    data.solution ? `Solution: ${data.solution}` : null,
    data.metrics_and_highlights && Array.isArray(data.metrics_and_highlights)
      ? `Key Metrics & Highlights:\n${data.metrics_and_highlights.map((m: string) => `- ${m}`).join('\n')}`
      : null
  ]
    .filter(Boolean)
    .join('\n\n');

  chunks.push({
    chunkId: `project:${projectId}:overview`,
    source: `projects/${filename}`,
    sourceType: 'project',
    projectSlug,
    url: primaryUrl,
    title: `${projectName} - Overview & Highlights`,
    content: overviewContent,
    metadata: {
      category: data.category,
      projectSlug,
      url: primaryUrl,
      role: data.role,
      timeline: data.timeline,
      featured: Boolean(data.featured),
      links: data.links || {}
    },
    tags: [projectName.toLowerCase(), projectId, projectSlug, data.category || '', 'overview'].filter(Boolean)
  });

  // 2. Architecture & Core Modules chunk
  if (data.architecture_and_core_modules) {
    const modules: string[] = [];
    for (const [moduleName, items] of Object.entries(data.architecture_and_core_modules)) {
      const cleanName = moduleName.replace(/_/g, ' ').toUpperCase();
      if (Array.isArray(items)) {
        modules.push(`${cleanName}:\n${items.map((it: string) => `• ${it}`).join('\n')}`);
      } else if (typeof items === 'string') {
        modules.push(`${cleanName}: ${items}`);
      }
    }

    if (modules.length > 0) {
      chunks.push({
        chunkId: `project:${projectId}:architecture`,
        source: `projects/${filename}`,
        sourceType: 'project',
        projectSlug,
        url: primaryUrl,
        title: `${projectName} - Architecture & Core Modules`,
        content: `Project: ${projectName} Technical Architecture:\n\n${modules.join('\n\n')}`,
        metadata: {
          category: data.category,
          projectSlug,
          url: primaryUrl,
          featured: Boolean(data.featured)
        },
        tags: [projectName.toLowerCase(), projectId, projectSlug, 'architecture', 'modules']
      });
    }
  }

  // 3. Tech Stack & Links chunk
  const techList: string[] = [];
  if (data.technologies) {
    for (const [layer, techArray] of Object.entries(data.technologies)) {
      if (Array.isArray(techArray)) {
        techList.push(`${layer.toUpperCase()}: ${techArray.join(', ')}`);
      }
    }
  }

  const linksList: string[] = [];
  if (data.links) {
    for (const [key, url] of Object.entries(data.links)) {
      linksList.push(`- ${key.replace(/_/g, ' ')}: ${url}`);
    }
  }

  const techContent = [
    `Project: ${projectName} Technologies & Resources`,
    techList.length > 0 ? `Tech Stack:\n${techList.join('\n')}` : null,
    linksList.length > 0 ? `Project Links:\n${linksList.join('\n')}` : null
  ]
    .filter(Boolean)
    .join('\n\n');

  chunks.push({
    chunkId: `project:${projectId}:tech`,
    source: `projects/${filename}`,
    sourceType: 'project',
    projectSlug,
    url: primaryUrl,
    title: `${projectName} - Tech Stack & Links`,
    content: techContent,
    metadata: {
      category: data.category,
      projectSlug,
      url: primaryUrl,
      technologies: techList,
      links: data.links || {}
    },
    tags: [projectName.toLowerCase(), projectId, projectSlug, 'technologies', 'tech stack', 'links']
  });

  return chunks;
}

/**
 * Chunker for profile.json
 */
export function chunkProfile(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const b = data.basics || {};
  const url = data.social_links?.portfolio || 'https://skykumar.vercel.app';

  const bioContent = [
    `Name: ${b.name || 'Akash Kumar'}`,
    `Title: ${b.title || 'Creative Technologist & Full-Stack Engineer'}`,
    `Tagline: ${b.tagline || ''}`,
    `Summary: ${b.summary || ''}`,
    `Location: ${b.location ? `${b.location.country} (Remote ready: ${b.location.remote_ready})` : 'India'}`,
    `Availability: ${b.availability || 'Open for roles & freelance'}`,
    data.current_focus ? `Current Focus:\n${(data.current_focus as string[]).map((f: string) => `- ${f}`).join('\n')}` : null,
    data.social_links ? `Profiles:\n${Object.entries(data.social_links).map(([k, v]) => `- ${k}: ${v}`).join('\n')}` : null
  ]
    .filter(Boolean)
    .join('\n\n');

  chunks.push({
    chunkId: 'profile:basics:bio',
    source: filename,
    sourceType: 'profile',
    url,
    title: 'Akash Kumar - Profile & Bio',
    content: bioContent,
    metadata: {
      url,
      links: data.social_links || {}
    },
    tags: ['profile', 'bio', 'akash kumar', 'about', 'who is akash', 'background', 'availability', 'location']
  });

  return chunks;
}

/**
 * Chunker for services.json
 */
export function chunkServices(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const services = data.services || [];
  const servicesUrl = 'https://skykumar.vercel.app/#services';

  for (const s of services) {
    const sId = s.id || s.name.toLowerCase().replace(/\s+/g, '-');
    const content = [
      `Service: ${s.name}`,
      s.tagline ? `Tagline: ${s.tagline}` : null,
      s.description ? `Description: ${s.description}` : null,
      s.deliverables && Array.isArray(s.deliverables)
        ? `Deliverables:\n${s.deliverables.map((d: string) => `- ${d}`).join('\n')}`
        : null,
      s.technologies && Array.isArray(s.technologies)
        ? `Technologies: ${s.technologies.join(', ')}`
        : null
    ]
      .filter(Boolean)
      .join('\n\n');

    chunks.push({
      chunkId: `service:${sId}:details`,
      source: filename,
      sourceType: 'services',
      url: servicesUrl,
      title: `Service: ${s.name}`,
      content,
      metadata: {
        category: s.name,
        url: servicesUrl,
        technologies: s.technologies || []
      },
      tags: ['services', 'service', sId, s.name.toLowerCase(), 'hire', 'consultation', 'client', 'pricing', 'offer']
    });
  }

  return chunks;
}

/**
 * Chunker for skills.json
 */
export function chunkSkills(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const categories = Object.entries(data);

  const formatted: string[] = [];
  const allSkills: string[] = [];

  for (const [catName, skillItems] of categories) {
    const cleanCat = catName.replace(/_/g, ' ').toUpperCase();
    if (Array.isArray(skillItems)) {
      const names = skillItems.map((item: any) =>
        typeof item === 'string' ? item : item.name || item.skill || JSON.stringify(item)
      );
      formatted.push(`${cleanCat}: ${names.join(', ')}`);
      allSkills.push(...names);
    }
  }

  chunks.push({
    chunkId: 'skills:technical:master',
    source: filename,
    sourceType: 'skills',
    url: 'https://skykumar.vercel.app/#tech-stack',
    title: 'Technical Skills & Proficiency Matrix',
    content: `Akash Kumar - Technical Skills Matrix & Stack:\n\n${formatted.join('\n\n')}`,
    metadata: {
      url: 'https://skykumar.vercel.app/#tech-stack',
      technologies: allSkills
    },
    tags: [
      'skills',
      'skill',
      'tech stack',
      'technologies',
      'languages',
      'tools',
      'what akash knows',
      'what does akash know',
      'what are things akash knows'
    ]
  });

  return chunks;
}

/**
 * Chunker for dsa-summary.json
 */
export function chunkDSA(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const content = [
    'Data Structures & Algorithms (DSA) & Problem Solving Profile:',
    data.total_problems_solved ? `Total Problems Solved: ${data.total_problems_solved}` : null,
    data.platforms
      ? `Platform Breakdown:\n${Object.entries(data.platforms).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
      : null,
    data.core_topics_and_patterns && Array.isArray(data.core_topics_and_patterns)
      ? `Core Topics & Patterns:\n${data.core_topics_and_patterns.map((t: string) => `- ${t}`).join('\n')}`
      : null,
    data.highlights && Array.isArray(data.highlights)
      ? `Key Achievements:\n${data.highlights.map((h: string) => `- ${h}`).join('\n')}`
      : null
  ]
    .filter(Boolean)
    .join('\n\n');

  chunks.push({
    chunkId: 'dsa:summary:practice',
    source: filename,
    sourceType: 'dsa',
    title: 'Data Structures & Algorithms (DSA) Summary',
    content,
    metadata: {
      totalSolved: data.total_problems_solved,
      platforms: data.platforms || {}
    },
    tags: ['dsa', 'leetcode', 'algorithms', 'problem solving', 'data structures', 'codeforces', 'competitive programming']
  });

  return chunks;
}

/**
 * Chunker for experience.json
 */
export function chunkExperience(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const experiences = data.experience || data.positions || (Array.isArray(data) ? data : [data]);

  for (let idx = 0; idx < experiences.length; idx++) {
    const exp = experiences[idx];
    const role = exp.role || exp.title || 'Software Engineer';
    const company = exp.company || exp.organization || 'Experience';
    const content = [
      `Role: ${role} at ${company}`,
      exp.period || exp.timeline ? `Period: ${exp.period || exp.timeline}` : null,
      exp.location ? `Location: ${exp.location}` : null,
      exp.description ? `Description: ${exp.description}` : null,
      exp.highlights && Array.isArray(exp.highlights)
        ? `Highlights:\n${exp.highlights.map((h: string) => `- ${h}`).join('\n')}`
        : null,
      exp.technologies && Array.isArray(exp.technologies)
        ? `Technologies: ${exp.technologies.join(', ')}`
        : null
    ]
      .filter(Boolean)
      .join('\n\n');

    chunks.push({
      chunkId: `experience:${idx}:${company.toLowerCase().replace(/\s+/g, '-')}`,
      source: filename,
      sourceType: 'experience',
      title: `${role} - ${company}`,
      content,
      metadata: {
        role,
        company,
        timeline: exp.period || exp.timeline
      },
      tags: ['experience', 'work', role.toLowerCase(), company.toLowerCase(), 'career', 'employment']
    });
  }

  return chunks;
}

/**
 * Chunker for education.json
 */
export function chunkEducation(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const entries = data.education || (Array.isArray(data) ? data : [data]);

  for (let idx = 0; idx < entries.length; idx++) {
    const edu = entries[idx];
    const degree = edu.degree || 'Degree';
    const institution = edu.institution || edu.school || edu.college || 'Institution';
    const content = [
      `Degree: ${degree}`,
      `Institution: ${institution}`,
      edu.timeline || edu.period ? `Timeline: ${edu.timeline || edu.period}` : null,
      edu.grade || edu.cgpa ? `Grade / CGPA: ${edu.grade || edu.cgpa}` : null,
      edu.relevant_coursework && Array.isArray(edu.relevant_coursework)
        ? `Relevant Coursework: ${edu.relevant_coursework.join(', ')}`
        : null,
      edu.activities && Array.isArray(edu.activities)
        ? `Activities: ${edu.activities.join(', ')}`
        : null
    ]
      .filter(Boolean)
      .join('\n\n');

    chunks.push({
      chunkId: `education:${idx}:${institution.toLowerCase().replace(/\s+/g, '-')}`,
      source: filename,
      sourceType: 'education',
      title: `Education: ${degree} - ${institution}`,
      content,
      metadata: {
        degree,
        institution,
        timeline: edu.timeline || edu.period
      },
      tags: ['education', 'degree', 'college', 'university', degree.toLowerCase(), 'academics', 'cgpa']
    });
  }

  return chunks;
}

/**
 * Chunker for faq.json
 */
export function chunkFAQ(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const faqs = data.faqs || (Array.isArray(data) ? data : []);

  for (let idx = 0; idx < faqs.length; idx++) {
    const item = faqs[idx];
    const question = item.question || item.q || '';
    const answer = item.answer || item.a || '';
    const category = item.category || 'General';

    chunks.push({
      chunkId: `faq:${idx}:${category.toLowerCase()}`,
      source: filename,
      sourceType: 'faq',
      title: `FAQ: ${question}`,
      content: `Question: ${question}\nAnswer: ${answer}\nCategory: ${category}`,
      metadata: {
        category
      },
      tags: ['faq', category.toLowerCase(), ...(item.keywords || [])]
    });
  }

  return chunks;
}

/**
 * Chunker for contact.json
 */
export function chunkContact(filename: string, data: Record<string, any>): RawChunk[] {
  const chunks: RawChunk[] = [];
  const contactUrl = 'https://skykumar.vercel.app/#contact';
  const content = [
    'Akash Kumar Contact Channels & Consultation Details:',
    data.primary_email ? `Email: ${data.primary_email}` : 'Email: akashkumarhzb121@gmail.com',
    data.response_time ? `Typical Response Time: ${data.response_time}` : 'Response Time: Within 24 hours',
    data.preferred_mode ? `Preferred Mode of Work: ${data.preferred_mode}` : 'Remote / Hybrid',
    data.contact_note ? `Note: ${data.contact_note}` : null,
    data.links ? `Direct Links:\n${Object.entries(data.links).map(([k, v]) => `- ${k}: ${v}`).join('\n')}` : null
  ]
    .filter(Boolean)
    .join('\n\n');

  chunks.push({
    chunkId: 'contact:channels:details',
    source: filename,
    sourceType: 'contact',
    url: contactUrl,
    title: 'Contact Information & Inquiries',
    content,
    metadata: {
      url: contactUrl,
      email: data.primary_email || 'akashkumarhzb121@gmail.com',
      links: data.links || {}
    },
    tags: [
      'contact',
      'email',
      'reach out',
      'hire',
      'message',
      'how to contact',
      'how to reach',
      'contact akash',
      'email address'
    ]
  });

  return chunks;
}

/**
 * Master dispatcher to parse any knowledge JSON file into raw chunks
 */
export function chunkKnowledgeFile(relativePath: string, rawData: Record<string, any>): RawChunk[] {
  const normalized = relativePath.replace(/\\/g, '/');

  if (normalized.startsWith('projects/') || normalized.includes('/projects/')) {
    const filename = normalized.split('/').pop() || normalized;
    return chunkProject(filename, rawData);
  }

  const basename = normalized.split('/').pop() || normalized;
  switch (basename) {
    case 'profile.json':
      return chunkProfile(basename, rawData);
    case 'services.json':
      return chunkServices(basename, rawData);
    case 'skills.json':
      return chunkSkills(basename, rawData);
    case 'dsa-summary.json':
      return chunkDSA(basename, rawData);
    case 'experience.json':
      return chunkExperience(basename, rawData);
    case 'education.json':
      return chunkEducation(basename, rawData);
    case 'faq.json':
      return chunkFAQ(basename, rawData);
    case 'contact.json':
      return chunkContact(basename, rawData);
    default:
      // Fallback generic chunk
      return [
        {
          chunkId: `general:${basename}`,
          source: relativePath,
          sourceType: 'profile',
          title: basename.replace('.json', ''),
          content: JSON.stringify(rawData, null, 2),
          metadata: {},
          tags: ['general']
        }
      ];
  }
}
