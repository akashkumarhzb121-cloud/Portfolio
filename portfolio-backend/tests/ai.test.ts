import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import path from 'path';
import fs from 'fs';
import { chunkProject, chunkServices, chunkProfile, chunkKnowledgeFile } from '../src/ai/rag/chunker.js';
import { collectKnowledgeFiles, getEmbedding, generateDeterministicEmbedding } from '../src/ai/rag/ingest.js';
import { cosineSimilarity, searchKnowledge } from '../src/ai/retrieval/search.js';
import { classifyQueryIntent } from '../src/ai/retrieval/intent.js';
import { generateChatResponse } from '../src/ai/llm/generate.js';
import {
  loadAkashIndex,
  loadProjectBySlug,
  loadAllProjects,
  detectStructuredQuery,
  executeStructuredQuery
} from '../src/ai/knowledge/index.js';
import { env } from '../src/config/env.js';
import { ContactEnquiry } from '../src/models/enquiry.model.js';
import * as emailService from '../src/services/email.service.js';

// Mock Resend email service
vi.mock('../src/services/email.service.js', () => ({
  sendContactNotification: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock_ai_msg_id'
  })
}));

// Mock Mongoose models
vi.mock('../src/models/enquiry.model.js', () => {
  return {
    ContactEnquiry: {
      create: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          _id: 'mock_ai_enquiry_id',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )
    }
  };
});

const { mockKnowledgeBase } = vi.hoisted(() => {
  const mockKnowledgeBase = [
    {
      chunkId: 'profile:overview',
      source: 'profile.json',
      sourceType: 'profile',
      title: 'Akash Kumar - Profile Overview',
      content: 'Akash Kumar is a Creative Technologist & Full-Stack Engineer based in India, specializing in high-performance web applications, 3D interactive experiences, and AI integrations.',
      metadata: { name: 'Akash Kumar', title: 'Creative Technologist & Full-Stack Engineer' },
      tags: ['profile', 'about', 'akash', 'bio'],
      embedding: [0.1, 0.1, 0.1]
    },
    {
      chunkId: 'contact:reach',
      source: 'contact.json',
      sourceType: 'contact',
      title: 'Contact Information & Channels',
      content: 'Akash Kumar can be reached via email at akashkumarhzb121@gmail.com. Location: India (remote-ready). Typical response time: within 24 hours. Profiles: GitHub, LinkedIn, Twitter.',
      metadata: { email: 'akashkumarhzb121@gmail.com', location: 'India' },
      tags: ['contact', 'email', 'reach', 'hire', 'message'],
      embedding: [0.2, 0.2, 0.2]
    },
    {
      chunkId: 'skills:matrix',
      source: 'skills.json',
      sourceType: 'skills',
      title: 'Technical Skills Matrix & Stack',
      content: 'Frontend: React, Next.js, TypeScript, Tailwind CSS. Creative 3D: Three.js, WebGL, OGL. Backend: Node.js, Express, REST APIs, JWT Authentication. Databases: MongoDB Atlas, Mongoose, Redis. AI: Groq, LangChain, RAG.',
      metadata: { category: 'Technical Skills' },
      tags: ['skills', 'tech stack', 'react', 'node', 'typescript', 'jwt', 'mongo'],
      embedding: [0.3, 0.3, 0.3]
    },
    {
      chunkId: 'service:full-stack-apps:details',
      source: 'services.json',
      sourceType: 'services',
      title: 'Service: Full-Stack Web Applications',
      content: 'Scalable, production-ready web apps built from concept to deployment with React, Node.js and MongoDB. Deliverables include architecture, responsive UI, secure APIs, and database design.',
      metadata: { category: 'Full-Stack Web Applications' },
      tags: ['services', 'full-stack', 'hire', 'pricing', 'website', 'consultation'],
      embedding: [0, 1, 0]
    },
    {
      chunkId: 'service:creative-3d:details',
      source: 'services.json',
      sourceType: 'services',
      title: 'Service: Creative Web & 3D Interactive',
      content: 'Interactive 3D graphics, WebGL shaders, Three.js animations, and modern digital portfolio design.',
      metadata: { category: 'Creative Web & 3D' },
      tags: ['services', '3d', 'threejs', 'webgl', 'creative'],
      embedding: [0, 0.8, 0.2]
    },
    {
      chunkId: 'faq:hiring:terms',
      source: 'faq.json',
      sourceType: 'faq',
      title: 'FAQ: Hiring, Pricing & Process',
      content: 'How do I hire Akash for a project? Project pricing depends on scope, complexity, and timelines. Rates are transparently scoped. Akash is available for full-time roles, contracts, and freelance projects.',
      metadata: { category: 'Hiring FAQ' },
      tags: ['faq', 'hiring', 'pricing', 'charge', 'cost', 'process'],
      embedding: [0.4, 0.4, 0.4]
    },
    {
      chunkId: 'faq:availability:roles',
      source: 'faq.json',
      sourceType: 'faq',
      title: 'FAQ: Availability & Collaboration',
      content: 'Are you available for full-time roles, internships, or freelance work? Yes. I am actively open to Software Development Engineer (SDE) full-time roles, engineering internships, and selective high-impact freelance projects. I am comfortable working across remote, hybrid, or on-site arrangements.',
      metadata: { category: 'Availability FAQ' },
      tags: ['faq', 'availability', 'internship', 'job', 'roles', 'open to work'],
      embedding: [0.45, 0.45, 0.45]
    },
    {
      chunkId: 'education:degree:rtu',
      source: 'education.json',
      sourceType: 'education',
      title: 'Education: B.Tech in Computer Science',
      content: 'Bachelor of Technology (B.Tech) in Computer Science & Engineering from RTU, GIT, Jaipur. Coursework: Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks.',
      metadata: { institution: 'RTU, GIT' },
      tags: ['education', 'degree', 'btech', 'college', 'coursework'],
      embedding: [0.5, 0.5, 0.5]
    },
    {
      chunkId: 'dsa:practice:record',
      source: 'dsa.json',
      sourceType: 'dsa',
      title: 'DSA Practice & Problem Solving',
      content: 'Active problem solving on LeetCode, GeeksforGeeks, and CodeChef using C++, Java, and JavaScript. Topics include Graphs, Trees, Dynamic Programming, and Two Pointers.',
      metadata: { category: 'DSA Practice' },
      tags: ['dsa', 'leetcode', 'algorithms', 'data structures'],
      embedding: [0.6, 0.6, 0.6]
    },
    {
      chunkId: 'experience:roles:summary',
      source: 'experience.json',
      sourceType: 'experience',
      title: 'Work Experience & Engineering Roles',
      content: 'Full-stack developer delivering production client applications, responsive frontends, secure backend microservices, and modern UI/UX architecture.',
      metadata: { category: 'Experience' },
      tags: ['experience', 'work', 'roles', 'career'],
      embedding: [0.7, 0.7, 0.7]
    },
    {
      chunkId: 'project:rapidcare:overview',
      source: 'projects/rapidcare.json',
      sourceType: 'project',
      projectSlug: 'rapidcare',
      title: 'RapidCare - Overview & Highlights',
      content: 'RapidCare is an AI-driven clinical triage and emergency care continuity network with automated ambulance dispatch and bed reservation.',
      metadata: {
        category: 'AI Healthcare',
        projectSlug: 'rapidcare',
        links: {
          live_demo: 'https://rapidcare.vercel.app',
          github_repo: 'https://github.com/akashkumarhzb121-cloud/rapidcare'
        }
      },
      tags: ['rapidcare', 'healthtech', 'ai triage', 'project'],
      embedding: [1, 0, 0]
    },
    {
      chunkId: 'project:rapidcare:tech',
      source: 'projects/rapidcare.json',
      sourceType: 'project',
      projectSlug: 'rapidcare',
      title: 'RapidCare - Technologies & Architecture',
      content: 'Technologies used in RapidCare: React, Node.js, Express, MongoDB, Socket.IO, Groq AI, JWT, Tailwind CSS.',
      metadata: {
        category: 'Technologies',
        projectSlug: 'rapidcare',
        links: {
          live_demo: 'https://rapidcare.vercel.app'
        }
      },
      tags: ['rapidcare', 'react', 'node', 'jwt', 'groq', 'tech'],
      embedding: [0.9, 0.1, 0]
    },
    {
      chunkId: 'project:modplint-interiors:overview',
      source: 'projects/modplint-interiors.json',
      sourceType: 'project',
      projectSlug: 'modplint-interiors',
      title: 'Modplint Interiors - Overview & Highlights',
      content: 'Modplint Interiors is a production digital platform for a real interior-design business, combining portfolio presentation and client consultation booking.',
      metadata: {
        category: 'Interior Design',
        projectSlug: 'modplint-interiors',
        links: {
          live_demo: 'https://modplint.com',
          github_repo: 'https://github.com/akashkumarhzb121-cloud/modplint'
        }
      },
      tags: ['modplint', 'interior design', 'project'],
      embedding: [0, 0, 1]
    },
    {
      chunkId: 'project:modplint-interiors:tech',
      source: 'projects/modplint-interiors.json',
      sourceType: 'project',
      projectSlug: 'modplint-interiors',
      title: 'Modplint Interiors - Technologies & Architecture',
      content: 'Technologies used in Modplint Interiors: React, Node.js, Express, MongoDB Atlas, Cloudinary, JWT authentication, Tailwind CSS.',
      metadata: {
        category: 'Technologies',
        projectSlug: 'modplint-interiors'
      },
      tags: ['modplint', 'react', 'mongodb', 'jwt', 'tech'],
      embedding: [0, 0.2, 0.8]
    },
    {
      chunkId: 'project:mern-docs:overview',
      source: 'projects/mern-docs.json',
      sourceType: 'project',
      projectSlug: 'mern-docs',
      title: 'MERN Docs - Overview & Highlights',
      content: 'MERN Docs is a full-stack technical documentation platform with markdown rendering and versioned content management.',
      metadata: {
        category: 'Developer Tooling',
        projectSlug: 'mern-docs'
      },
      tags: ['mern docs', 'documentation', 'project'],
      embedding: [0.1, 0.8, 0.1]
    }
  ];
  return { mockKnowledgeBase };
});

vi.mock('../src/models/knowledgeChunk.model.js', () => {
  return {
    KnowledgeChunk: {
      aggregate: vi.fn().mockRejectedValue(new Error('Vector search index not configured in test')),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockKnowledgeBase)
        })
      }),
      findOneAndUpdate: vi.fn().mockResolvedValue({})
    }
  };
});

vi.mock('../src/models/conversation.model.js', () => {
  return {
    Conversation: {
      findOneAndUpdate: vi.fn().mockResolvedValue({})
    }
  };
});

describe('AI RAG Chunker Tests', () => {
  it('correctly chunks project data into overview, architecture, and tech chunks', () => {
    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      category: 'Web App',
      tagline: 'A fast web application',
      problem: 'Slow latency',
      solution: 'Optimized caching',
      architecture_and_core_modules: {
        core_api: ['Express routes', 'Mongoose models']
      },
      technologies: {
        frontend: ['React', 'TypeScript'],
        backend: ['Node.js']
      },
      links: {
        live_demo: 'https://test.com',
        github_repo: 'https://github.com/test'
      }
    };

    const chunks = chunkProject('test.json', mockProject);
    expect(chunks.length).toBe(3);

    const overview = chunks.find((c) => c.chunkId.includes('overview'));
    expect(overview).toBeDefined();
    expect(overview?.title).toBe('Test Project - Overview & Highlights');
    expect(overview?.content).toContain('Problem Statement: Slow latency');

    const arch = chunks.find((c) => c.chunkId.includes('architecture'));
    expect(arch).toBeDefined();
    expect(arch?.content).toContain('CORE API');

    const tech = chunks.find((c) => c.chunkId.includes('tech'));
    expect(tech).toBeDefined();
    expect(tech?.metadata.links).toHaveProperty('live_demo');
  });

  it('correctly chunks services.json', () => {
    const mockServices = {
      services: [
        {
          id: 'web-apps',
          name: 'Web Apps',
          tagline: 'Modern websites',
          description: 'High-performance web apps',
          deliverables: ['Custom design', 'Responsive layout'],
          technologies: ['React', 'Tailwind']
        }
      ]
    };

    const chunks = chunkServices('services.json', mockServices);
    expect(chunks.length).toBe(1);
    expect(chunks[0].chunkId).toBe('service:web-apps:details');
    expect(chunks[0].content).toContain('Custom design');
  });

  it('correctly parses profile.json using master dispatcher', () => {
    const mockProfile = {
      basics: {
        name: 'Akash Kumar',
        title: 'Full-Stack Engineer',
        summary: 'Specializing in web and 3D'
      }
    };

    const chunks = chunkKnowledgeFile('profile.json', mockProfile);
    expect(chunks.length).toBe(1);
    expect(chunks[0].sourceType).toBe('profile');
    expect(chunks[0].content).toContain('Akash Kumar');
  });

  it('scans and chunks all real ai-knowledge JSON files without errors', () => {
    const knowledgeDir = path.resolve(__dirname, '../ai-knowledge');
    const files = collectKnowledgeFiles(knowledgeDir);

    expect(files.length).toBeGreaterThanOrEqual(19);

    let totalChunks = 0;
    for (const file of files) {
      const content = fs.readFileSync(file.fullPath, 'utf-8');
      const data = JSON.parse(content);
      const chunks = chunkKnowledgeFile(file.relativePath, data);
      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.chunkId).toBeDefined();
        expect(chunk.title).toBeDefined();
        expect(chunk.content.length).toBeGreaterThan(0);
      }
      totalChunks += chunks.length;
    }

    expect(totalChunks).toBeGreaterThan(30);
  });
});

describe('Vector Retrieval & Math Tests', () => {
  it('calculates cosine similarity accurately', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(Math.SQRT1_2);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('configures Groq as default LLM provider and decouples embeddings', () => {
    expect(env.AI_BASE_URL).toContain('groq.com');
    expect(['llama-3.3-70b-versatile', 'openai/gpt-oss-120b']).toContain(env.AI_MODEL);
    expect(env.EMBEDDING_MODEL).toBe('text-embedding-3-small');
  });

  it('uses deterministic embeddings when no separate EMBEDDING_API_KEY is configured', async () => {
    const embedding = await getEmbedding('Test content for embedding generation');
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);

    const embedding2 = await getEmbedding('Test content for embedding generation');
    expect(embedding).toEqual(embedding2);
  });

  it('produces normalized unit-length deterministic vectors', () => {
    const vec = generateDeterministicEmbedding('Sample text string');
    expect(vec.length).toBe(1536);
    const sumSq = vec.reduce((sum, val) => sum + val * val, 0);
    expect(sumSq).toBeCloseTo(1.0);
  });
});

describe('AI API Endpoints (/api/ai)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/ai/chat', () => {
    it('rejects empty or whitespace-only message with 400', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({ message: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.message).toBeDefined();
    });

    it('rejects messages longer than 2000 characters with 400', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'a'.repeat(2001) });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('successfully processes query and returns answer, sources, and suggested questions', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Tell me about RapidCare emergency healthcare platform'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.answer).toBeDefined();
      expect(typeof response.body.answer).toBe('string');
      expect(Array.isArray(response.body.sources)).toBe(true);
      expect(Array.isArray(response.body.suggestedQuestions)).toBe(true);
      expect(response.body.conversationId).toBeDefined();
    });

    it('filters out project sources when user asks pure contact questions', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'How can I contact Akash?'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.answer).toBeDefined();
      const projectSources = response.body.sources.filter((s: any) => s.type === 'project');
      expect(projectSources.length).toBe(0);
      const contactSources = response.body.sources.filter((s: any) => s.type === 'contact' || s.type === 'faq');
      expect(contactSources.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/ai/lead', () => {
    it('validates lead input and creates contact enquiry', async () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@client.com',
        service: 'Creative 3D Web',
        message: 'We want to hire Akash for an interactive 3D landing page.'
      };

      const response = await request(app)
        .post('/api/ai/lead')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(ContactEnquiry.create).toHaveBeenCalledWith(payload);
      expect(emailService.sendContactNotification).toHaveBeenCalledWith(payload);
    });

    it('rejects invalid lead submission with 400', async () => {
      const invalidPayload = {
        name: 'J',
        email: 'not-an-email',
        service: '',
        message: 'Short'
      };

      const response = await request(app)
        .post('/api/ai/lead')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Deterministic Query Intent Classification', () => {
    it('correctly classifies hiring queries', () => {
      const analysis = classifyQueryIntent('How do I hire Akash for a project?');
      expect(analysis.isHiringQuery).toBe(true);
      expect(analysis.isPureContactQuery).toBe(false);
    });

    it('correctly classifies pure contact queries', () => {
      const a1 = classifyQueryIntent('How can I contact Akash?');
      expect(a1.isPureContactQuery).toBe(true);

      const a2 = classifyQueryIntent("What is Akash's email?");
      expect(a2.isPureContactQuery).toBe(true);
    });

    it('correctly classifies skills queries', () => {
      const a1 = classifyQueryIntent('What are things Akash knows?');
      expect(a1.isSkillsQuery).toBe(true);

      const a2 = classifyQueryIntent("What is Akash's tech stack?");
      expect(a2.isSkillsQuery).toBe(true);
    });

    it('correctly identifies named project queries', () => {
      const a1 = classifyQueryIntent('Tell me about RapidCare.');
      expect(a1.namedProjectSlug).toBe('rapidcare');

      const a2 = classifyQueryIntent('Tell me about Modplint Interiors.');
      expect(a2.namedProjectSlug).toBe('modplint-interiors');
    });

    it('correctly classifies education queries', () => {
      const analysis = classifyQueryIntent("What is Akash's education?");
      expect(analysis.isEducationQuery).toBe(true);
    });

    it('correctly classifies general technical concept queries', () => {
      const a1 = classifyQueryIntent('What is React?');
      expect(a1.isGeneralQuestion).toBe(true);
      expect(a1.detectedTechnologies).toContain('React');

      const a2 = classifyQueryIntent('What is JWT?');
      expect(a2.isGeneralQuestion).toBe(true);
      expect(a2.detectedTechnologies).toContain('JWT');
    });

    it('correctly classifies profile inquiries', () => {
      const analysis = classifyQueryIntent('Tell me about Akash.');
      expect(analysis.isProfileQuery).toBe(true);
    });

    it('correctly classifies general project list queries', () => {
      const analysis = classifyQueryIntent('What projects has Akash built?');
      expect(analysis.isGeneralProjectListQuery).toBe(true);
    });
  });

  describe('Comprehensive 22-Intent Classification Suite', () => {
    it('1. classifies greeting intent correctly', () => {
      expect(classifyQueryIntent('Hi').isGreetingQuery).toBe(true);
      expect(classifyQueryIntent('Hello').isGreetingQuery).toBe(true);
      expect(classifyQueryIntent('Hey').isGreetingQuery).toBe(true);
      expect(classifyQueryIntent('Good morning').isGreetingQuery).toBe(true);
    });

    it('2. classifies casual intent correctly', () => {
      expect(classifyQueryIntent('How are you?').isCasualQuery).toBe(true);
      expect(classifyQueryIntent('Nice website').isCasualQuery).toBe(true);
      expect(classifyQueryIntent('Thank you').isCasualQuery).toBe(true);
      expect(classifyQueryIntent('Who are you?').isCasualQuery).toBe(true);
    });

    it('3. classifies capabilities intent correctly', () => {
      expect(classifyQueryIntent('What can you do?').isCapabilitiesQuery).toBe(true);
      expect(classifyQueryIntent('What can I ask you?').isCapabilitiesQuery).toBe(true);
      expect(classifyQueryIntent('How can you help me?').isCapabilitiesQuery).toBe(true);
    });

    it('4. classifies profile intent correctly', () => {
      expect(classifyQueryIntent('Who is Akash?').intents).toContain('profile');
      expect(classifyQueryIntent('Tell me about Akash.').intents).toContain('profile');
    });

    it('5. classifies skills intent correctly', () => {
      expect(classifyQueryIntent('What technologies does Akash know?').intents).toContain('skills');
      expect(classifyQueryIntent("What is his tech stack?").intents).toContain('skills');
    });

    it('6. classifies experience intent correctly', () => {
      expect(classifyQueryIntent("What is Akash's experience?").intents).toContain('experience');
      expect(classifyQueryIntent('What has Akash worked on?').intents).toContain('experience');
    });

    it('7. classifies education intent correctly', () => {
      expect(classifyQueryIntent('Where did Akash study?').intents).toContain('education');
      expect(classifyQueryIntent("What is Akash's education?").intents).toContain('education');
    });

    it('8. classifies services intent correctly', () => {
      expect(classifyQueryIntent('What services does Akash offer?').intents).toContain('services');
      expect(classifyQueryIntent('Can Akash build a website for my company?').intents).toContain('services');
    });

    it('9. classifies hiring intent correctly', () => {
      expect(classifyQueryIntent('I want to hire Akash.').intents).toContain('hiring');
      expect(classifyQueryIntent('How do I hire Akash?').intents).toContain('hiring');
    });

    it('10. classifies job intent correctly', () => {
      expect(classifyQueryIntent('Is Akash looking for a job?').isJobQuery).toBe(true);
      expect(classifyQueryIntent('Can I interview Akash?').intents).toContain('job');
    });

    it('11. classifies internship intent correctly', () => {
      expect(classifyQueryIntent('Is Akash looking for internships?').isInternshipQuery).toBe(true);
      expect(classifyQueryIntent('Can I hire Akash as an intern?').isInternshipQuery).toBe(true);
    });

    it('12. classifies freelance intent correctly', () => {
      expect(classifyQueryIntent('Does Akash take freelance projects?').isFreelanceQuery).toBe(true);
      expect(classifyQueryIntent('Is Akash available for freelance work?').isFreelanceQuery).toBe(true);
    });

    it('13. classifies pricing intent correctly', () => {
      expect(classifyQueryIntent('How much does Akash charge?').isPricingQuery).toBe(true);
      expect(classifyQueryIntent('What is the cost of a website?').isPricingQuery).toBe(true);
      expect(classifyQueryIntent('How much does it cost?').isPricingQuery).toBe(true);
    });

    it('14. classifies contact intent correctly', () => {
      expect(classifyQueryIntent('How can I contact Akash?').intents).toContain('contact');
      expect(classifyQueryIntent("What is Akash's email?").intents).toContain('contact');
      expect(classifyQueryIntent('Can I see his GitHub?').intents).toContain('contact');
    });

    it('15. classifies project intent correctly', () => {
      expect(classifyQueryIntent('What projects has Akash built?').intents).toContain('project');
      expect(classifyQueryIntent('Tell me about RapidCare.').intents).toContain('project');
    });

    it('16. classifies technology intent correctly', () => {
      expect(classifyQueryIntent('Does Akash know React?').intents).toContain('technology');
      expect(classifyQueryIntent('What is Node.js?').intents).toContain('technology');
    });

    it('17. classifies general technical question intent correctly', () => {
      expect(classifyQueryIntent('What is React?').intents).toContain('general');
      expect(classifyQueryIntent('What is MongoDB?').intents).toContain('general');
    });

    it('18. classifies faq intent correctly', () => {
      expect(classifyQueryIntent('How can I contact Akash?').intents).toContain('faq');
    });

    it('19. classifies availability intent correctly', () => {
      expect(classifyQueryIntent('Is Akash open to work?').isAvailabilityQuery).toBe(true);
      expect(classifyQueryIntent('Is he available for work?').isAvailabilityQuery).toBe(true);
    });

    it('20. classifies resume intent correctly', () => {
      expect(classifyQueryIntent("Can I see Akash's resume?").isResumeQuery).toBe(true);
      expect(classifyQueryIntent('Where can I download his resume?').isResumeQuery).toBe(true);
    });

    it('21. classifies dsa intent correctly', () => {
      expect(classifyQueryIntent('Does Akash know DSA?').isDSAQuery).toBe(true);
      expect(classifyQueryIntent('What languages does he use for DSA?').isDSAQuery).toBe(true);
    });

    it('22. classifies mixed intent correctly', () => {
      const analysis = classifyQueryIntent('Tell me about Akash and how I can hire him.');
      expect(analysis.intents).toContain('mixed');
    });
  });

  describe('Query-Aware Hybrid Retrieval for 15 Golden Test Cases', () => {
    it('Case 1: "How do I hire Akash for a project?" prioritizes services and contact, not a random project', async () => {
      const results = await searchKnowledge('How do I hire Akash for a project?');
      expect(results.length).toBeGreaterThan(0);
      expect(['services', 'contact', 'faq']).toContain(results[0].sourceType);
      const projectCount = results.filter((r) => r.sourceType === 'project').length;
      expect(projectCount).toBeLessThanOrEqual(1);
    });

    it('Case 2: "How can I contact Akash?" returns contact with 0 project chunks', async () => {
      const results = await searchKnowledge('How can I contact Akash?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('contact');
      const projectCount = results.filter((r) => r.sourceType === 'project').length;
      expect(projectCount).toBe(0);
    });

    it('Case 3: "What are things Akash knows?" returns skills as top result', async () => {
      const results = await searchKnowledge('What are things Akash knows?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('skills');
    });

    it('Case 4: "What is Akash\'s tech stack?" returns skills matrix and tech chunks', async () => {
      const results = await searchKnowledge("What is Akash's tech stack?");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('skills');
      const hasSkillsOrTech = results.some((r) => r.sourceType === 'skills' || r.chunkId.includes('tech'));
      expect(hasSkillsOrTech).toBe(true);
    });

    it('Case 5: "Tell me about RapidCare." prioritizes RapidCare project chunks', async () => {
      const results = await searchKnowledge('Tell me about RapidCare.');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].projectSlug).toBe('rapidcare');
    });

    it('Case 6: "Tell me about Modplint Interiors." prioritizes Modplint Interiors project chunks', async () => {
      const results = await searchKnowledge('Tell me about Modplint Interiors.');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].projectSlug).toBe('modplint-interiors');
    });

    it('Case 7: "What services does Akash offer?" returns services as top result', async () => {
      const results = await searchKnowledge('What services does Akash offer?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('services');
    });

    it('Case 8: "I want to make a website for my company." returns services and contact', async () => {
      const results = await searchKnowledge('I want to make a website for my company.');
      expect(results.length).toBeGreaterThan(0);
      const types = results.map((r) => r.sourceType);
      expect(types).toContain('services');
      expect(types).toContain('contact');
    });

    it('Case 9: "How much does Akash charge?" returns services, FAQ, and contact without random project dominating', async () => {
      const results = await searchKnowledge('How much does Akash charge?');
      expect(results.length).toBeGreaterThan(0);
      const topTypes = results.slice(0, 3).map((r) => r.sourceType);
      expect(topTypes.some((t) => t === 'services' || t === 'faq' || t === 'contact')).toBe(true);
    });

    it('Case 10: "What is React?" retrieves skills or tech containing React', async () => {
      const results = await searchKnowledge('What is React?');
      expect(results.length).toBeGreaterThan(0);
      const mentionsReact = results.some((r) => r.content.toLowerCase().includes('react'));
      expect(mentionsReact).toBe(true);
    });

    it('Case 11: "What is JWT?" retrieves skills or tech containing JWT', async () => {
      const results = await searchKnowledge('What is JWT?');
      expect(results.length).toBeGreaterThan(0);
      const mentionsJwt = results.some((r) => r.content.toLowerCase().includes('jwt'));
      expect(mentionsJwt).toBe(true);
    });

    it('Case 12: "Tell me about Akash." returns profile as top result', async () => {
      const results = await searchKnowledge('Tell me about Akash.');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('profile');
    });

    it('Case 13: "What projects has Akash built?" returns distinct project overviews', async () => {
      const results = await searchKnowledge('What projects has Akash built?');
      expect(results.length).toBeGreaterThan(0);
      const projectSlugs = results.filter((r) => r.sourceType === 'project').map((r) => r.projectSlug);
      const uniqueSlugs = new Set(projectSlugs);
      expect(uniqueSlugs.size).toBe(projectSlugs.length);
    });

    it('Case 14: "What is Akash\'s email?" returns contact chunk only with 0 project chunks', async () => {
      const results = await searchKnowledge("What is Akash's email?");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('contact');
      const projectCount = results.filter((r) => r.sourceType === 'project').length;
      expect(projectCount).toBe(0);
    });

    it('Case 15: "What is Akash\'s education?" returns education as top result', async () => {
      const results = await searchKnowledge("What is Akash's education?");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('education');
    });
  });

  describe('The 30 Section 27 Queries Verification', () => {
    it('1. "Hi" returns conversational greeting with empty sources', async () => {
      const res = await generateChatResponse({ message: 'Hi' });
      expect(res.answer).toContain('SKY AI');
      expect(res.sources).toEqual([]);
    });

    it('2. "Hello" returns conversational greeting with empty sources', async () => {
      const res = await generateChatResponse({ message: 'Hello' });
      expect(res.answer).toContain('SKY AI');
      expect(res.sources).toEqual([]);
    });

    it('3. "How are you?" returns casual response with empty sources', async () => {
      const res = await generateChatResponse({ message: 'How are you?' });
      expect(res.answer.length).toBeGreaterThan(0);
      expect(res.sources).toEqual([]);
    });

    it('4. "What can you do?" returns capabilities menu with empty sources', async () => {
      const res = await generateChatResponse({ message: 'What can you do?' });
      expect(res.answer).toContain('About Akash');
      expect(res.answer).toContain('Skills');
      expect(res.sources).toEqual([]);
    });

    it('5. "Who is Akash?" returns profile information', async () => {
      const res = await generateChatResponse({ message: 'Who is Akash?' });
      expect(res.answer).toContain('Akash');
      expect(res.sources.some((s) => s.type === 'profile')).toBe(true);
    });

    it('6. "Tell me about Akash." returns profile overview', async () => {
      const res = await generateChatResponse({ message: 'Tell me about Akash.' });
      expect(res.answer).toContain('Akash');
      expect(res.sources.some((s) => s.type === 'profile')).toBe(true);
    });

    it('7. "What technologies does Akash know?" returns skills overview', async () => {
      const res = await generateChatResponse({ message: 'What technologies does Akash know?' });
      expect(res.answer).toContain('React');
      expect(res.sources.some((s) => s.type === 'skills')).toBe(true);
    });

    it('8. "What is his tech stack?" returns tech stack details', async () => {
      const res = await generateChatResponse({ message: 'What is his tech stack?' });
      expect(res.answer).toContain('Frontend');
      expect(res.sources.some((s) => s.type === 'skills')).toBe(true);
    });

    it('9. "What projects has Akash built?" returns list of featured projects', async () => {
      const res = await generateChatResponse({ message: 'What projects has Akash built?' });
      expect(res.answer).toContain('RapidCare');
      expect(res.sources.some((s) => s.type === 'project')).toBe(true);
    });

    it('10. "Tell me about RapidCare." returns RapidCare details and links', async () => {
      const res = await generateChatResponse({ message: 'Tell me about RapidCare.' });
      expect(res.answer).toContain('RapidCare');
      expect(res.sources.some((s) => s.title.includes('RapidCare'))).toBe(true);
    });

    it('11. "What technologies were used in RapidCare?" returns RapidCare stack', async () => {
      const res = await generateChatResponse({ message: 'What technologies were used in RapidCare?' });
      expect(res.answer).toContain('React');
      expect(res.answer).toContain('Socket.IO');
      expect(res.sources.some((s) => s.title.includes('RapidCare'))).toBe(true);
    });

    it('12. "What services does Akash offer?" returns available engineering services', async () => {
      const res = await generateChatResponse({ message: 'What services does Akash offer?' });
      expect(res.answer).toContain('Full-Stack Web Applications');
      expect(res.sources.some((s) => s.type === 'services')).toBe(true);
    });

    it('13. "I want to make a website for my company." returns services and contact', async () => {
      const res = await generateChatResponse({ message: 'I want to make a website for my company.' });
      expect(res.answer).toContain('Services Available');
      expect(res.sources.some((s) => s.type === 'services' || s.type === 'contact')).toBe(true);
    });

    it('14. "I want to hire Akash." returns hiring process and contact channel', async () => {
      const res = await generateChatResponse({ message: 'I want to hire Akash.' });
      expect(res.answer).toContain('akashkumarhzb121@gmail.com');
      expect(res.sources.some((s) => s.type === 'services' || s.type === 'contact')).toBe(true);
    });

    it('15. "How can I contact Akash?" returns direct contact info with 0 project sources', async () => {
      const res = await generateChatResponse({ message: 'How can I contact Akash?' });
      expect(res.answer).toContain('akashkumarhzb121@gmail.com');
      const projectSources = res.sources.filter((s) => s.type === 'project');
      expect(projectSources.length).toBe(0);
    });

    it('16. "What is Akash\'s email?" returns email address with 0 project sources', async () => {
      const res = await generateChatResponse({ message: "What is Akash's email?" });
      expect(res.answer).toContain('akashkumarhzb121@gmail.com');
      const projectSources = res.sources.filter((s) => s.type === 'project');
      expect(projectSources.length).toBe(0);
    });

    it('17. "Is Akash looking for internships?" confirms internship interest with 0 project sources', async () => {
      const res = await generateChatResponse({ message: 'Is Akash looking for internships?' });
      expect(res.answer.toLowerCase()).toContain('internship');
      const projectSources = res.sources.filter((s) => s.type === 'project');
      expect(projectSources.length).toBe(0);
    });

    it('18. "Is Akash open to work?" confirms work availability', async () => {
      const res = await generateChatResponse({ message: 'Is Akash open to work?' });
      expect(res.answer.toLowerCase()).toContain('open');
      expect(res.sources.some((s) => s.type === 'faq' || s.type === 'contact' || s.type === 'profile')).toBe(true);
    });

    it('19. "Can I interview Akash?" gives direct interview & contact info', async () => {
      const res = await generateChatResponse({ message: 'Can I interview Akash?' });
      expect(res.answer).toContain('akashkumarhzb121@gmail.com');
    });

    it('20. "How much does Akash charge?" states pricing depends on scope without hallucinating', async () => {
      const res = await generateChatResponse({ message: 'How much does Akash charge?' });
      expect(res.answer.toLowerCase()).toContain('pricing depends');
      expect(res.answer).toContain('akashkumarhzb121@gmail.com');
      const projectSources = res.sources.filter((s) => s.type === 'project');
      expect(projectSources.length).toBe(0);
    });

    it('21. "What is React?" provides technical explanation and connects to Akash', async () => {
      const res = await generateChatResponse({ message: 'What is React?' });
      expect(res.answer).toContain('React');
      expect(res.answer).toContain('JavaScript library');
      expect(res.sources.some((s) => s.type === 'skills')).toBe(true);
    });

    it('22. "What is Node.js?" provides technical explanation and connects to Akash', async () => {
      const res = await generateChatResponse({ message: 'What is Node.js?' });
      expect(res.answer).toContain('Node.js');
      expect(res.answer).toContain('runtime');
    });

    it('23. "What is MongoDB?" provides technical explanation and connects to Akash', async () => {
      const res = await generateChatResponse({ message: 'What is MongoDB?' });
      expect(res.answer).toContain('MongoDB');
      expect(res.answer).toContain('database');
    });

    it('24. "Can Akash build a full-stack application?" confirms capability', async () => {
      const res = await generateChatResponse({ message: 'Can Akash build a full-stack application?' });
      expect(res.answer).toContain('Full-Stack Web Applications');
      expect(res.sources.some((s) => s.type === 'services')).toBe(true);
    });

    it('25. "Can Akash build a 3D website?" confirms creative 3D capabilities', async () => {
      const res = await generateChatResponse({ message: 'Can Akash build a 3D website?' });
      expect(res.answer).toContain('3D');
      expect(res.sources.some((s) => s.type === 'services')).toBe(true);
    });

    it('26. "Where did Akash study?" mentions RTU / B.Tech Computer Science', async () => {
      const res = await generateChatResponse({ message: 'Where did Akash study?' });
      expect(res.answer).toContain('RTU');
      expect(res.sources.some((s) => s.type === 'education')).toBe(true);
    });

    it('27. "What is Akash\'s experience?" returns work experience', async () => {
      const res = await generateChatResponse({ message: "What is Akash's experience?" });
      expect(res.answer.length).toBeGreaterThan(0);
      expect(res.sources.some((s) => s.type === 'experience' || s.type === 'profile')).toBe(true);
    });

    it('28. "Does Akash know DSA?" confirms DSA problem-solving track record', async () => {
      const res = await generateChatResponse({ message: 'Does Akash know DSA?' });
      expect(res.answer).toContain('Data Structures and Algorithms');
      expect(res.sources.some((s) => s.type === 'dsa')).toBe(true);
    });

    it('29. "Can I see his GitHub?" provides GitHub profile link', async () => {
      const res = await generateChatResponse({ message: 'Can I see his GitHub?' });
      expect(res.answer).toContain('github.com/akashkumarhzb121-cloud');
      const projectSources = res.sources.filter((s) => s.type === 'project');
      expect(projectSources.length).toBe(0);
    });

    it('30. "Can I send him a project proposal?" provides proposal inquiry guidance', async () => {
      const res = await generateChatResponse({ message: 'Can I send him a project proposal?' });
      expect(res.answer).toContain('akashkumarhzb121@gmail.com');
      expect(res.sources.some((s) => s.type === 'contact' || s.type === 'services' || s.type === 'faq')).toBe(true);
    });
  });

  describe('The 5 Section 27 Multi-Turn Conversations (TEST A - TEST E)', () => {
    it('TEST A: RapidCare follow-up retains project context across turns', async () => {
      // Turn 1
      const turn1 = await generateChatResponse({
        message: 'Tell me about RapidCare.'
      });
      expect(turn1.answer).toContain('RapidCare');

      // Turn 2
      const historyTurn2 = [
        { role: 'user' as const, content: 'Tell me about RapidCare.' },
        { role: 'assistant' as const, content: turn1.answer }
      ];
      const turn2 = await generateChatResponse({
        message: 'What technologies did he use?',
        history: historyTurn2
      });
      expect(turn2.answer).toContain('RapidCare');
      expect(turn2.answer).toContain('React');
      expect(turn2.answer).toContain('Socket.IO');

      // Turn 3
      const historyTurn3 = [
        ...historyTurn2,
        { role: 'user' as const, content: 'What technologies did he use?' },
        { role: 'assistant' as const, content: turn2.answer }
      ];
      const turn3 = await generateChatResponse({
        message: 'Can Akash build something similar?',
        history: historyTurn3
      });
      expect(turn3.answer).toContain('RapidCare');
      expect(turn3.answer).toContain('akashkumarhzb121@gmail.com');
    });

    it('TEST B: Client enquiry flow transitions from scope to pricing to contact', async () => {
      // Turn 1: Project request
      const turn1 = await generateChatResponse({
        message: 'I want a website for my company.'
      });
      expect(turn1.answer).toContain('Services Available');

      // Turn 2: Pricing question
      const historyTurn2 = [
        { role: 'user' as const, content: 'I want a website for my company.' },
        { role: 'assistant' as const, content: turn1.answer }
      ];
      const turn2 = await generateChatResponse({
        message: 'How much does it cost?',
        history: historyTurn2
      });
      expect(turn2.answer.toLowerCase()).toContain('pricing depends');
      expect(turn2.sources.filter((s) => s.type === 'project').length).toBe(0);

      // Turn 3: Contact question
      const historyTurn3 = [
        ...historyTurn2,
        { role: 'user' as const, content: 'How much does it cost?' },
        { role: 'assistant' as const, content: turn2.answer }
      ];
      const turn3 = await generateChatResponse({
        message: 'How can I contact Akash?',
        history: historyTurn3
      });
      expect(turn3.answer).toContain('akashkumarhzb121@gmail.com');
      expect(turn3.sources.filter((s) => s.type === 'project').length).toBe(0);
    });

    it('TEST C: Candidate evaluation transitions from bio to backend skills to availability', async () => {
      // Turn 1: Bio
      const turn1 = await generateChatResponse({
        message: 'Tell me about Akash.'
      });
      expect(turn1.answer).toContain('Akash');

      // Turn 2: Backend skills
      const historyTurn2 = [
        { role: 'user' as const, content: 'Tell me about Akash.' },
        { role: 'assistant' as const, content: turn1.answer }
      ];
      const turn2 = await generateChatResponse({
        message: 'What about his backend skills?',
        history: historyTurn2
      });
      expect(turn2.answer).toContain('Node.js');
      expect(turn2.answer).toContain('Express.js');

      // Turn 3: Availability
      const historyTurn3 = [
        ...historyTurn2,
        { role: 'user' as const, content: 'What about his backend skills?' },
        { role: 'assistant' as const, content: turn2.answer }
      ];
      const turn3 = await generateChatResponse({
        message: 'Is he available for work?',
        history: historyTurn3
      });
      expect(turn3.answer.toLowerCase()).toContain('open');
      expect(turn3.sources.filter((s) => s.type === 'project').length).toBe(0);
    });

    it('TEST D: Greeting to capabilities to projects list', async () => {
      // Turn 1: Greeting
      const turn1 = await generateChatResponse({
        message: 'Hi'
      });
      expect(turn1.answer).toContain('SKY AI');
      expect(turn1.sources).toEqual([]);

      // Turn 2: Capabilities
      const historyTurn2 = [
        { role: 'user' as const, content: 'Hi' },
        { role: 'assistant' as const, content: turn1.answer }
      ];
      const turn2 = await generateChatResponse({
        message: 'What can you do?',
        history: historyTurn2
      });
      expect(turn2.answer).toContain('About Akash');
      expect(turn2.sources).toEqual([]);

      // Turn 3: Projects overview
      const historyTurn3 = [
        ...historyTurn2,
        { role: 'user' as const, content: 'What can you do?' },
        { role: 'assistant' as const, content: turn2.answer }
      ];
      const turn3 = await generateChatResponse({
        message: "Tell me about Akash's projects.",
        history: historyTurn3
      });
      expect(turn3.answer).toContain('RapidCare');
      expect(turn3.sources.some((s) => s.type === 'project')).toBe(true);
    });

    it('TEST E: Technical concept to Akash connection with conversation context', async () => {
      // Turn 1: What is React?
      const turn1 = await generateChatResponse({
        message: 'What is React?'
      });
      expect(turn1.answer).toContain('React');

      // Turn 2: Does Akash use it?
      const historyTurn2 = [
        { role: 'user' as const, content: 'What is React?' },
        { role: 'assistant' as const, content: turn1.answer }
      ];
      const turn2 = await generateChatResponse({
        message: 'Does Akash use it?',
        history: historyTurn2
      });
      expect(turn2.answer).toContain('React');
    });
  });

  describe('Structured Knowledge Layer (akash.json) Operations', () => {
    it('loads akash.json index properly with 11 projects and knowledge sources', () => {
      const index = loadAkashIndex();
      expect(index.schemaVersion).toBe('1.0');
      expect(index.identity.name).toBe('Akash Kumar');
      expect(index.projects.items.length).toBeGreaterThanOrEqual(11);
      expect(index.skills.knownTechnologies).toContain('React');
      expect(index.skills.knownTechnologies).not.toContain('Python');
    });

    it('1. "Does Akash know React?" executes structured CHECK with verified confirmation', async () => {
      const res = await generateChatResponse({ message: 'Does Akash know React?' });
      expect(res.answer.toLowerCase()).toContain('yes');
      expect(res.answer).toContain('React');
      expect(res.sources.some((s) => s.type === 'skills')).toBe(true);
    });

    it('2. "Does Akash know Python?" executes structured CHECK and safely states unknown without hallucinating', async () => {
      const res = await generateChatResponse({ message: 'Does Akash know Python?' });
      expect(res.answer).toContain('Python');
      expect(res.answer.toLowerCase()).toContain('not currently listed');
      expect(res.answer.toLowerCase()).not.toContain('no, akash');
    });

    it('3. "How many projects does Akash have?" executes structured COUNT and returns dynamic project count', async () => {
      const allProjects = loadAllProjects();
      const res = await generateChatResponse({ message: 'How many projects does Akash have?' });
      expect(res.answer).toContain(`${allProjects.length} documented projects`);
      expect(res.sources.some((s) => s.type === 'project')).toBe(true);
    });

    it('4. "List Akash\'s projects" executes structured LIST returning project names from the index', async () => {
      const res = await generateChatResponse({ message: "List Akash's projects" });
      expect(res.answer).toContain('RapidCare');
      expect(res.answer).toContain('Modplint Interiors');
      expect(res.answer).toContain('MERN Docs');
      expect(res.sources.some((s) => s.type === 'project')).toBe(true);
    });

    it('5. "Which projects use React?" executes structured FILTER checking actual project JSON technology fields', async () => {
      const res = await generateChatResponse({ message: 'Which projects use React?' });
      expect(res.answer).toContain('RapidCare');
      expect(res.answer).toContain('MERN Docs');
      expect(res.answer).toContain('React');
      expect(res.sources.some((s) => s.type === 'project')).toBe(true);
    });

    it('6. "What technologies does Akash use?" executes structured AGGREGATE across skills and projects', async () => {
      const res = await generateChatResponse({ message: 'What technologies does Akash use?' });
      expect(res.answer).toContain('React');
      expect(res.answer).toContain('Node.js');
      expect(res.answer).toContain('Three.js');
      expect(res.sources.some((s) => s.type === 'skills')).toBe(true);
    });

    it('7. "Compare RapidCare and MERN Docs" executes structured COMPARE comparing documented fields', async () => {
      const res = await generateChatResponse({ message: 'Compare RapidCare and MERN Docs' });
      expect(res.answer).toContain('RapidCare');
      expect(res.answer).toContain('MERN Docs');
      expect(res.answer).toContain('Category');
      expect(res.sources.length).toBeGreaterThanOrEqual(2);
      expect(res.sources.some((s) => s.title.includes('RapidCare'))).toBe(true);
      expect(res.sources.some((s) => s.title.includes('MERN Docs'))).toBe(true);
    });

    it('8. "Tell me about Akash" executes structured SUMMARY combining profile, skills, and experience', async () => {
      const res = await generateChatResponse({ message: 'Tell me about Akash' });
      expect(res.answer).toContain('Akash Kumar');
      expect(res.answer).toContain('Full-Stack');
      expect(res.sources.some((s) => s.type === 'profile')).toBe(true);
    });

    it('9. "Where did Akash study?" mentions RTU / GIT / Jaipur and never old UCET / VBU', async () => {
      const res = await generateChatResponse({ message: 'Where did Akash study?' });
      expect(res.answer).toContain('RTU');
      expect(res.answer).toContain('Jaipur');
      expect(res.answer).not.toContain('UCET');
      expect(res.answer).not.toContain('VBU');
      expect(res.sources.some((s) => s.type === 'education')).toBe(true);
    });
  });

  describe('Natural Persona, Differentiator, Experience & Gibberish Handling', () => {
    it('handles gibberish / nonsense inputs ("guhoio", "abcd gioho", "hioihohh") with friendly clarification and empty sources', async () => {
      const gibberishQueries = ['guhoio', 'abcd gioho', 'hioihohh'];
      for (const query of gibberishQueries) {
        const res = await generateChatResponse({ message: query });
        expect(res.answer.toLowerCase()).toContain('not sure i understood');
        expect(res.sources.length).toBe(0);
        expect(res.answer).not.toContain('Akash Kumar - Profile & Bio');
        expect(res.answer).not.toContain('Name: Akash Kumar');
      }
    });

    it('answers "how is he different from others" with a compelling logical synthesis of 3D, full-stack, product ownership, and DSA', async () => {
      const res = await generateChatResponse({ message: 'how is he different from others' });
      expect(res.answer).toContain('Akash Kumar');
      expect(res.answer.toLowerCase()).toContain('3d');
      expect(res.answer.toLowerCase()).toContain('full-stack');
      expect(res.answer).toContain('RapidCare');
      expect(res.answer).toContain('500+');
      expect(res.sources.length).toBeGreaterThan(0);
    });

    it('answers "give all projects details" by returning all documented projects in the portfolio', async () => {
      const res = await generateChatResponse({ message: 'give all projects details' });
      expect(res.answer).toContain('documented projects');
      expect(res.answer).toContain('RapidCare');
      expect(res.answer).toContain('Modplint Interiors');
      expect(res.answer).toContain('MERN Docs');
      expect(res.answer).toContain('Student Management System');
      expect(res.answer).toContain('Creative Portfolio');
      expect(res.sources.some((s) => s.type === 'project')).toBe(true);
    });

    it('correctly handles typos like "What are rthings he know" as a skills inquiry', async () => {
      const res = await generateChatResponse({ message: 'What are rthings he know' });
      expect(res.answer).toContain('React');
      expect(res.answer).toContain('Node.js');
      expect(res.sources.some((s) => s.type === 'skills')).toBe(true);
    });

    it('answers "give akash experiences" with Novitech internship and freelance production deliveries', async () => {
      const res = await generateChatResponse({ message: 'give akash experiences' });
      expect(res.answer).toContain('Novitech Pvt. Ltd.');
      expect(res.answer).toContain('Modplint Interiors');
      expect(res.answer).toContain('RapidCare');
      expect(res.sources.some((s) => s.type === 'experience' || s.type === 'project')).toBe(true);
    });

    it('answers "does akash have experience" by detailing his real experience rather than generic profile dump', async () => {
      const res = await generateChatResponse({ message: 'does akash have experience' });
      expect(res.answer).toContain('Novitech Pvt. Ltd.');
      expect(res.answer).not.toContain('Here is what I found regarding your query');
    });
  });
});
