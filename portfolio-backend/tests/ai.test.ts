import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import path from 'path';
import fs from 'fs';
import { chunkProject, chunkServices, chunkProfile, chunkKnowledgeFile } from '../src/ai/rag/chunker.js';
import { collectKnowledgeFiles, getEmbedding, generateDeterministicEmbedding } from '../src/ai/rag/ingest.js';
import { cosineSimilarity } from '../src/ai/retrieval/search.js';
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

vi.mock('../src/models/knowledgeChunk.model.js', () => {
  const mockChunks = [
    {
      chunkId: 'project:rapidcare:overview',
      source: 'projects/rapidcare.json',
      sourceType: 'project',
      title: 'RapidCare - Overview & Highlights',
      content: 'RapidCare is an AI-driven clinical triage and emergency care continuity network with automated ambulance dispatch.',
      metadata: {
        category: 'AI Healthcare',
        links: {
          live_demo: 'https://rapidcare.vercel.app',
          github_repo: 'https://github.com/akashkumarhzb121-cloud/rapidcare'
        }
      },
      tags: ['rapidcare', 'healthtech', 'ai triage'],
      embedding: [1, 0, 0]
    },
    {
      chunkId: 'service:full-stack-apps:details',
      source: 'services.json',
      sourceType: 'service',
      title: 'Service: Full-Stack Web Applications',
      content: 'Scalable, production-ready web apps built from concept to deployment with React, Node.js and MongoDB.',
      metadata: {
        category: 'Full-Stack Web Applications'
      },
      tags: ['service', 'full-stack', 'hire'],
      embedding: [0, 1, 0]
    }
  ];

  return {
    KnowledgeChunk: {
      aggregate: vi.fn().mockRejectedValue(new Error('Vector search index not configured in test')),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockChunks)
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
});
