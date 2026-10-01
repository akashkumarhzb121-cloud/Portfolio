import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import path from 'path';
import fs from 'fs';
import { chunkProject, chunkServices, chunkProfile, chunkKnowledgeFile } from '../src/ai/rag/chunker.js';
import { collectKnowledgeFiles, getEmbedding, generateDeterministicEmbedding } from '../src/ai/rag/ingest.js';
import { cosineSimilarity, searchKnowledge } from '../src/ai/retrieval/search.js';
import { classifyQueryIntent } from '../src/ai/retrieval/intent.js';
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
      chunkId: 'education:degree:ucet',
      source: 'education.json',
      sourceType: 'education',
      title: 'Education: B.Tech in Computer Science',
      content: 'Bachelor of Technology (B.Tech) in Computer Science & Engineering from UCET, VBU, Hazaribagh. Coursework: Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks.',
      metadata: { institution: 'UCET, VBU' },
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
    // Identical unit vectors
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
    // Orthogonal vectors
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
    // 45 degree angle
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(Math.SQRT1_2);
    // Empty vectors
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('configures Groq as default LLM provider and decouples embeddings', () => {
    expect(env.AI_BASE_URL).toContain('groq.com');
    expect(env.AI_MODEL).toBe('llama-3.3-70b-versatile');
    expect(env.EMBEDDING_MODEL).toBe('text-embedding-3-small');
  });

  it('uses deterministic embeddings when no separate EMBEDDING_API_KEY is configured', async () => {
    const embedding = await getEmbedding('Test content for embedding generation');
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);

    // Verify determinism across identical input
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
      // Ensure no project chunks leaked into sources
      const projectSources = response.body.sources.filter((s: any) => s.type === 'project');
      expect(projectSources.length).toBe(0);
      // Ensure contact or faq is cited
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

  describe('Query-Aware Hybrid Retrieval for 15 Golden Test Cases', () => {
    // 1. "How do I hire Akash for a project?"
    it('Case 1: "How do I hire Akash for a project?" prioritizes services and contact, not a random project', async () => {
      const results = await searchKnowledge('How do I hire Akash for a project?');
      expect(results.length).toBeGreaterThan(0);
      expect(['services', 'contact', 'faq']).toContain(results[0].sourceType);
      // Project chunks should never dominate hiring queries
      const projectCount = results.filter((r) => r.sourceType === 'project').length;
      expect(projectCount).toBeLessThanOrEqual(1);
    });

    // 2. "How can I contact Akash?"
    it('Case 2: "How can I contact Akash?" returns contact with 0 project chunks', async () => {
      const results = await searchKnowledge('How can I contact Akash?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('contact');
      const projectCount = results.filter((r) => r.sourceType === 'project').length;
      expect(projectCount).toBe(0);
    });

    // 3. "What are things Akash knows?"
    it('Case 3: "What are things Akash knows?" returns skills as top result', async () => {
      const results = await searchKnowledge('What are things Akash knows?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('skills');
    });

    // 4. "What is Akash's tech stack?"
    it('Case 4: "What is Akash\'s tech stack?" returns skills matrix and tech chunks', async () => {
      const results = await searchKnowledge("What is Akash's tech stack?");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('skills');
      const hasSkillsOrTech = results.some((r) => r.sourceType === 'skills' || r.chunkId.includes('tech'));
      expect(hasSkillsOrTech).toBe(true);
    });

    // 5. "Tell me about RapidCare."
    it('Case 5: "Tell me about RapidCare." prioritizes RapidCare project chunks', async () => {
      const results = await searchKnowledge('Tell me about RapidCare.');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].projectSlug).toBe('rapidcare');
    });

    // 6. "Tell me about Modplint Interiors."
    it('Case 6: "Tell me about Modplint Interiors." prioritizes Modplint Interiors project chunks', async () => {
      const results = await searchKnowledge('Tell me about Modplint Interiors.');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].projectSlug).toBe('modplint-interiors');
    });

    // 7. "What services does Akash offer?"
    it('Case 7: "What services does Akash offer?" returns services as top result', async () => {
      const results = await searchKnowledge('What services does Akash offer?');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('services');
    });

    // 8. "I want to make a website for my company."
    it('Case 8: "I want to make a website for my company." returns services and contact', async () => {
      const results = await searchKnowledge('I want to make a website for my company.');
      expect(results.length).toBeGreaterThan(0);
      const types = results.map((r) => r.sourceType);
      expect(types).toContain('services');
      expect(types).toContain('contact');
    });

    // 9. "How much does Akash charge?"
    it('Case 9: "How much does Akash charge?" returns services, FAQ, and contact without random project dominating', async () => {
      const results = await searchKnowledge('How much does Akash charge?');
      expect(results.length).toBeGreaterThan(0);
      const topTypes = results.slice(0, 3).map((r) => r.sourceType);
      expect(topTypes.some((t) => t === 'services' || t === 'faq' || t === 'contact')).toBe(true);
    });

    // 10. "What is React?"
    it('Case 10: "What is React?" retrieves skills or tech containing React', async () => {
      const results = await searchKnowledge('What is React?');
      expect(results.length).toBeGreaterThan(0);
      const mentionsReact = results.some((r) => r.content.toLowerCase().includes('react'));
      expect(mentionsReact).toBe(true);
    });

    // 11. "What is JWT?"
    it('Case 11: "What is JWT?" retrieves skills or tech containing JWT', async () => {
      const results = await searchKnowledge('What is JWT?');
      expect(results.length).toBeGreaterThan(0);
      const mentionsJwt = results.some((r) => r.content.toLowerCase().includes('jwt'));
      expect(mentionsJwt).toBe(true);
    });

    // 12. "Tell me about Akash."
    it('Case 12: "Tell me about Akash." returns profile as top result', async () => {
      const results = await searchKnowledge('Tell me about Akash.');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('profile');
    });

    // 13. "What projects has Akash built?"
    it('Case 13: "What projects has Akash built?" returns distinct project overviews', async () => {
      const results = await searchKnowledge('What projects has Akash built?');
      expect(results.length).toBeGreaterThan(0);
      const projectSlugs = results.filter((r) => r.sourceType === 'project').map((r) => r.projectSlug);
      // Ensure distinct projects (no duplicate project slugs)
      const uniqueSlugs = new Set(projectSlugs);
      expect(uniqueSlugs.size).toBe(projectSlugs.length);
    });

    // 14. "What is Akash's email?"
    it('Case 14: "What is Akash\'s email?" returns contact chunk only with 0 project chunks', async () => {
      const results = await searchKnowledge("What is Akash's email?");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('contact');
      const projectCount = results.filter((r) => r.sourceType === 'project').length;
      expect(projectCount).toBe(0);
    });

    // 15. "What is Akash's education?"
    it('Case 15: "What is Akash\'s education?" returns education as top result', async () => {
      const results = await searchKnowledge("What is Akash's education?");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].sourceType).toBe('education');
    });
  });
});

