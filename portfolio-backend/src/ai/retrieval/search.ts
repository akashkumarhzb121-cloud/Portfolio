import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { KnowledgeChunk, type IKnowledgeChunk } from '../../models/knowledgeChunk.model.js';
import { classifyQueryIntent, type QueryAnalysis } from './intent.js';
import { collectKnowledgeFiles, generateDeterministicEmbedding } from '../rag/ingest.js';
import { chunkKnowledgeFile } from '../rag/chunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.resolve(__dirname, '../../../ai-knowledge');

let memoryChunksCache: any[] | null = null;

export function getInMemoryKnowledgeChunks(sourceTypeFilter?: string): any[] {
  if (!memoryChunksCache) {
    if (fs.existsSync(KNOWLEDGE_DIR)) {
      const files = collectKnowledgeFiles(KNOWLEDGE_DIR);
      const allChunks: any[] = [];
      for (const file of files) {
        if (file.relativePath.replace(/\\/g, '/') === 'akash.json') continue;
        try {
          const content = fs.readFileSync(file.fullPath, 'utf-8');
          const data = JSON.parse(content);
          const chunks = chunkKnowledgeFile(file.relativePath, data);
          for (const c of chunks) {
            allChunks.push({
              chunkId: c.chunkId,
              source: c.source,
              sourceType: c.sourceType,
              projectSlug: c.metadata?.projectSlug,
              url: c.metadata?.url,
              title: c.title,
              content: c.content,
              metadata: c.metadata || {},
              tags: c.tags || [],
              embedding: generateDeterministicEmbedding(c.content)
            });
          }
        } catch {}
      }
      memoryChunksCache = allChunks;
    } else {
      memoryChunksCache = [];
    }
  }

  if (sourceTypeFilter) {
    return memoryChunksCache.filter((c) => c.sourceType === sourceTypeFilter);
  }
  return memoryChunksCache;
}

export interface SearchResult {
  chunkId: string;
  source: string;
  sourceType: string;
  projectSlug?: string;
  url?: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  score: number;
}

export interface ScoredChunk extends SearchResult {
  semanticScore: number;
  lexicalScore: number;
  intentScore: number;
  qualityScore: number;
  finalScore: number;
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, sim));
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'from', 'up', 'down', 'in', 'out', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now', 'i', 'me', 'my', 'myself',
  'we', 'our', 'ours', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'do', 'does', 'did', 'doing', 'would', 'could'
]);

/**
 * Computes normalized lexical matching score [0.0 - 1.0]
 */
export function computeLexicalScore(
  normalizedQuery: string,
  chunk: any,
  analysis: QueryAnalysis
): number {
  const queryTokens = normalizedQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  if (queryTokens.length === 0) {
    return 0.1;
  }

  const titleLower = (chunk.title || '').toLowerCase();
  const contentLower = (chunk.content || '').toLowerCase();
  const tagsLower = Array.isArray(chunk.tags)
    ? chunk.tags.map((t: string) => t.toLowerCase())
    : [];
  const projectSlugLower = (chunk.projectSlug || '').toLowerCase();

  let rawScore = 0;

  // 1. Exact full-phrase match
  if (titleLower.includes(normalizedQuery)) rawScore += 0.5;
  else if (contentLower.includes(normalizedQuery)) rawScore += 0.3;

  // 2. Token matches across fields (with singular/plural stemming)
  let matchedTokens = 0;
  for (const token of queryTokens) {
    let tokenHit = false;
    const altToken = token.endsWith('s') && token.length > 3 ? token.slice(0, -1) : token + 's';
    const checkField = (field: string) => field.includes(token) || field.includes(altToken);

    if (checkField(titleLower)) {
      rawScore += 0.25;
      tokenHit = true;
    }
    if (tagsLower.some((t: string) => checkField(t))) {
      rawScore += 0.20;
      tokenHit = true;
    }
    if (projectSlugLower && checkField(projectSlugLower)) {
      rawScore += 0.30;
      tokenHit = true;
    }
    if (checkField(contentLower)) {
      rawScore += 0.10;
      tokenHit = true;
    }

    if (tokenHit) matchedTokens++;
  }

  // Token coverage bonus
  const tokenCoverage = matchedTokens / queryTokens.length;
  rawScore += tokenCoverage * 0.3;

  // 3. Category term expansion
  if (
    (analysis.isHiringQuery || analysis.isServicesQuery || analysis.isFreelanceQuery) &&
    (chunk.sourceType === 'services' || chunk.sourceType === 'contact')
  ) {
    rawScore += 0.35;
  }

  if (analysis.isPureContactQuery && chunk.sourceType === 'contact') {
    rawScore += 0.50;
  }

  if (analysis.isSkillsQuery && (chunk.sourceType === 'skills' || chunk.chunkId.includes('tech'))) {
    rawScore += 0.40;
  }

  if (
    analysis.namedProjectSlug &&
    (chunk.projectSlug === analysis.namedProjectSlug ||
      chunk.chunkId.includes(analysis.namedProjectSlug))
  ) {
    rawScore += 0.60;
  }

  if (
    (analysis.isJobQuery || analysis.isInternshipQuery || analysis.isAvailabilityQuery) &&
    (chunk.sourceType === 'faq' || chunk.sourceType === 'contact' || chunk.sourceType === 'profile')
  ) {
    rawScore += 0.45;
  }

  return Math.min(1.0, Math.max(0.0, rawScore));
}

/**
 * Computes category-intent affinity score [0.0 - 1.0]
 */
export function computeMetadataIntentScore(
  analysis: QueryAnalysis,
  chunk: any
): number {
  const st = chunk.sourceType;

  // 0. Greeting, Casual, Capabilities
  if (analysis.isGreetingQuery || analysis.isCasualQuery || analysis.isCapabilitiesQuery) {
    return 0.05;
  }

  // 1. User named or context-referenced a specific project (e.g. "Tell me about RapidCare")
  if (analysis.namedProjectSlug) {
    if (
      chunk.projectSlug === analysis.namedProjectSlug ||
      chunk.chunkId.includes(analysis.namedProjectSlug)
    ) {
      return 1.0;
    }
    // Strongly suppress unrelated projects when a specific project was asked
    if (st === 'project') {
      return 0.05;
    }
    return 0.2;
  }

  // 2. Pure contact query (e.g. "How can I contact Akash?", "What is Akash's email?")
  if (analysis.isPureContactQuery) {
    if (st === 'contact') return 1.0;
    if (st === 'faq' && (chunk.title.toLowerCase().includes('contact') || chunk.title.toLowerCase().includes('reach'))) {
      return 0.85;
    }
    if (st === 'profile') return 0.3;
    // Suppress projects completely for pure contact questions
    if (st === 'project') return 0.0;
    return 0.1;
  }

  // 3. Pricing query (e.g. "How much does Akash charge?")
  if (analysis.isPricingQuery) {
    if (st === 'faq') return 1.0;
    if (st === 'services') return 0.95;
    if (st === 'contact') return 0.85;
    if (st === 'project') return 0.05;
    return 0.2;
  }

  // 4. Job, Internship, Availability inquiries
  if (analysis.isJobQuery || analysis.isInternshipQuery || analysis.isAvailabilityQuery) {
    if (st === 'faq') return 1.0;
    if (st === 'contact') return 0.95;
    if (st === 'profile') return 0.90;
    if (st === 'experience') return 0.80;
    if (st === 'project') return 0.05;
    return 0.2;
  }

  // 5. Hiring or Client service query (e.g. "How do I hire Akash?", "What services does Akash offer?", "I want a website for my company")
  if (analysis.isHiringQuery || analysis.isServicesQuery || analysis.isFreelanceQuery) {
    if (st === 'services') return 1.0;
    if (st === 'contact') return 0.95;
    if (st === 'faq') return 0.75;
    if (st === 'experience') return 0.65;
    if (st === 'profile') return 0.55;
    if (st === 'project') return 0.35; // keep low so projects don't crowd out services/contact
    return 0.2;
  }

  // 6. Skills & Tech Stack query (e.g. "What are things Akash knows?", "What is Akash's tech stack?")
  if (analysis.isSkillsQuery) {
    if (st === 'skills') return 1.0;
    if (st === 'experience') return 0.85;
    if (st === 'education') return 0.7;
    if (st === 'profile') return 0.6;
    if (st === 'project') {
      return chunk.chunkId.includes('tech') ? 0.75 : 0.15;
    }
    return 0.2;
  }

  // 7. Profile query (e.g. "Tell me about Akash")
  if (analysis.isProfileQuery) {
    if (st === 'profile') return 1.0;
    if (st === 'skills') return 0.85;
    if (st === 'experience') return 0.8;
    if (st === 'services') return 0.75;
    if (st === 'education') return 0.7;
    if (st === 'project') return 0.25;
    return 0.2;
  }

  // 8. Education query (e.g. "What is Akash's education?")
  if (analysis.isEducationQuery) {
    if (st === 'education') return 1.0;
    if (st === 'experience') return 0.5;
    if (st === 'profile') return 0.4;
    if (st === 'project') return 0.05;
    return 0.1;
  }

  // 9. DSA query (e.g. "Does Akash know DSA?")
  if (analysis.isDSAQuery) {
    if (st === 'dsa') return 1.0;
    if (st === 'skills') return 0.7;
    if (st === 'project') return 0.05;
    return 0.1;
  }

  // 10. Resume query
  if (analysis.isResumeQuery) {
    if (st === 'profile') return 1.0;
    if (st === 'experience') return 0.9;
    if (st === 'skills') return 0.85;
    if (st === 'education') return 0.8;
    if (st === 'project') return 0.1;
    return 0.2;
  }

  // 11. General project list query (e.g. "What projects has Akash built?")
  if (analysis.isGeneralProjectListQuery) {
    if (st === 'project' && chunk.chunkId.includes('overview')) return 1.0;
    if (st === 'profile') return 0.8;
    if (st === 'skills') return 0.6;
    return 0.2;
  }

  // 12. General technical question (e.g. "What is React?", "What is JWT?")
  if (analysis.isGeneralQuestion) {
    const techMatches = analysis.detectedTechnologies.some((tech) => {
      const lower = tech.toLowerCase();
      return (
        (chunk.content || '').toLowerCase().includes(lower) ||
        (chunk.title || '').toLowerCase().includes(lower)
      );
    });

    if (techMatches) {
      if (st === 'skills') return 1.0;
      if (st === 'project' && chunk.chunkId.includes('tech')) return 0.85;
      if (st === 'experience') return 0.75;
      return 0.5;
    }
    return 0.2;
  }

  // 13. Default Intent Overlap fallback
  let score = 0.2;
  for (const intent of analysis.intents) {
    if (st === intent || (intent === 'services' && st === 'services') || (intent === 'skills' && st === 'skills')) {
      score += 0.3;
    }
  }

  // Soft penalty on arbitrary project chunks if no project was requested
  if (st === 'project' && !analysis.intents.includes('project')) {
    score *= 0.5;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Computes source quality score [0.0 - 1.0]
 */
export function computeSourceQualityScore(chunk: any): number {
  if (
    chunk.sourceType === 'profile' ||
    chunk.sourceType === 'contact' ||
    chunk.sourceType === 'skills' ||
    chunk.sourceType === 'services'
  ) {
    return 1.0;
  }
  if (chunk.metadata?.featured) {
    return 0.9;
  }
  if (chunk.chunkId.includes('overview')) {
    return 0.85;
  }
  return 0.7;
}

/**
 * Enforces source diversity so project chunks never overwhelm non-project queries
 */
export function enforceDiversity(
  scoredChunks: ScoredChunk[],
  analysis: QueryAnalysis,
  limit: number = 5
): SearchResult[] {
  // Case 0: Greeting, Casual, Capabilities -> no retrieval
  if (analysis.isGreetingQuery || analysis.isCasualQuery || analysis.isCapabilitiesQuery) {
    return [];
  }

  // Case A: Specific project named (e.g. "Tell me about RapidCare")
  if (analysis.namedProjectSlug) {
    const targetProjectChunks = scoredChunks.filter(
      (c) =>
        c.projectSlug === analysis.namedProjectSlug ||
        c.chunkId.includes(analysis.namedProjectSlug!)
    );
    const otherChunks = scoredChunks.filter(
      (c) =>
        c.projectSlug !== analysis.namedProjectSlug &&
        !c.chunkId.includes(analysis.namedProjectSlug!)
    );

    const result: SearchResult[] = [...targetProjectChunks.slice(0, 3)];
    for (const other of otherChunks) {
      if (result.length >= limit) break;
      result.push(other);
    }
    return result.slice(0, limit);
  }

  // Case B: Pure contact query (e.g. "How can I contact Akash?", "What is Akash's email?")
  if (analysis.isPureContactQuery) {
    const contactChunks = scoredChunks.filter(
      (c) => c.sourceType === 'contact' || c.sourceType === 'faq' || c.sourceType === 'profile'
    );
    // Explicitly zero project chunks for pure contact queries
    return contactChunks.slice(0, limit);
  }

  // Case C: Pricing query
  if (analysis.isPricingQuery) {
    const pricingChunks = scoredChunks.filter(
      (c) => c.sourceType === 'faq' || c.sourceType === 'services' || c.sourceType === 'contact'
    );
    return pricingChunks.slice(0, limit);
  }

  // Case D: Job / Internship / Availability inquiries
  if (analysis.isJobQuery || analysis.isInternshipQuery || analysis.isAvailabilityQuery) {
    const careerChunks = scoredChunks.filter(
      (c) => c.sourceType === 'faq' || c.sourceType === 'contact' || c.sourceType === 'profile' || c.sourceType === 'experience'
    );
    return careerChunks.slice(0, limit);
  }

  // Case E: Hiring or Client inquiry (e.g. "How do I hire Akash?", "I need a website for my company", "What services does Akash offer?")
  if (analysis.isHiringQuery || analysis.isServicesQuery || analysis.isFreelanceQuery) {
    const selected: SearchResult[] = [];
    const services = scoredChunks.filter((c) => c.sourceType === 'services');
    const contact = scoredChunks.filter((c) => c.sourceType === 'contact');
    const faq = scoredChunks.filter((c) => c.sourceType === 'faq');
    const experience = scoredChunks.filter((c) => c.sourceType === 'experience');
    const projects = scoredChunks.filter((c) => c.sourceType === 'project');

    if (analysis.isServicesQuery) {
      for (const s of services) {
        if (selected.length < limit) selected.push(s);
      }
      if (contact.length > 0 && selected.length < limit) selected.push(contact[0]);
      if (faq.length > 0 && selected.length < limit) selected.push(faq[0]);
      if (experience.length > 0 && selected.length < limit) selected.push(experience[0]);
    } else {
      if (services.length > 0) selected.push(services[0]);
      if (contact.length > 0) selected.push(contact[0]);
      if (services.length > 1) selected.push(services[1]);
      else if (faq.length > 0) selected.push(faq[0]);
      if (experience.length > 0 && selected.length < limit) selected.push(experience[0]);
      else if (faq.length > 0 && !selected.includes(faq[0]) && selected.length < limit) {
        selected.push(faq[0]);
      }
      if (projects.length > 0 && selected.length < limit) selected.push(projects[0]);
    }

    for (const c of scoredChunks) {
      if (selected.length >= limit) break;
      if (!selected.some((s) => s.chunkId === c.chunkId)) {
        selected.push(c);
      }
    }
    return selected.slice(0, limit);
  }

  // Case F: Skills & Tech stack query (e.g. "What are things Akash knows?")
  if (analysis.isSkillsQuery) {
    const selected: SearchResult[] = [];
    const skills = scoredChunks.filter((c) => c.sourceType === 'skills');
    const experience = scoredChunks.filter((c) => c.sourceType === 'experience');
    const education = scoredChunks.filter((c) => c.sourceType === 'education');
    const projectTech = scoredChunks.filter(
      (c) => c.sourceType === 'project' && c.chunkId.includes('tech')
    );
    const profile = scoredChunks.filter((c) => c.sourceType === 'profile');

    if (skills.length > 0) selected.push(skills[0]);
    if (experience.length > 0) selected.push(experience[0]);
    if (education.length > 0) selected.push(education[0]);
    if (projectTech.length > 0) selected.push(projectTech[0]);
    if (profile.length > 0 && selected.length < limit) selected.push(profile[0]);

    for (const c of scoredChunks) {
      if (selected.length >= limit) break;
      if (!selected.some((s) => s.chunkId === c.chunkId)) {
        selected.push(c);
      }
    }
    return selected.slice(0, limit);
  }

  // Case G: Education query
  if (analysis.isEducationQuery) {
    const education = scoredChunks.filter((c) => c.sourceType === 'education');
    const experience = scoredChunks.filter((c) => c.sourceType === 'experience');
    const profile = scoredChunks.filter((c) => c.sourceType === 'profile');

    const selected: SearchResult[] = [...education];
    for (const exp of experience) {
      if (selected.length >= limit) break;
      selected.push(exp);
    }
    for (const p of profile) {
      if (selected.length >= limit) break;
      selected.push(p);
    }
    return selected.slice(0, limit);
  }

  // Case H: DSA query
  if (analysis.isDSAQuery) {
    const dsaChunks = scoredChunks.filter((c) => c.sourceType === 'dsa');
    const skillsChunks = scoredChunks.filter((c) => c.sourceType === 'skills');
    const selected: SearchResult[] = [...dsaChunks];
    for (const s of skillsChunks) {
      if (selected.length < limit) selected.push(s);
    }
    return selected.slice(0, limit);
  }

  // Case I: General Technical Question (e.g. "What is React?")
  if (analysis.isGeneralQuestion) {
    const selected: SearchResult[] = [];
    const skills = scoredChunks.filter((c) => c.sourceType === 'skills');
    const techProjects = scoredChunks.filter(
      (c) => c.sourceType === 'project' && c.chunkId.includes('tech')
    );

    if (skills.length > 0) selected.push(skills[0]);
    if (techProjects.length > 0) selected.push(techProjects[0]);

    for (const c of scoredChunks) {
      if (selected.length >= limit) break;
      if (c.sourceType !== 'project' && !selected.some((s) => s.chunkId === c.chunkId)) {
        selected.push(c);
      }
    }
    return selected.slice(0, limit);
  }

  // Case J: General project list query (e.g. "What projects has Akash built?")
  if (analysis.isGeneralProjectListQuery) {
    const selected: SearchResult[] = [];
    const seenProjects = new Set<string>();

    for (const c of scoredChunks) {
      if (selected.length >= limit) break;
      if (c.sourceType === 'project') {
        const slug = c.projectSlug || c.chunkId.split(':')[1] || '';
        if (!seenProjects.has(slug)) {
          seenProjects.add(slug);
          selected.push(c);
        }
      }
    }

    const profile = scoredChunks.find((c) => c.sourceType === 'profile');
    if (profile && selected.length < limit) selected.push(profile);

    return selected.slice(0, limit);
  }

  // Case K: Default Diversity with project capping (max 2 project chunks)
  const selected: SearchResult[] = [];
  let projectCount = 0;
  const maxProjects = 2;

  for (const c of scoredChunks) {
    if (selected.length >= limit) break;
    if (c.sourceType === 'project') {
      if (projectCount < maxProjects) {
        selected.push(c);
        projectCount++;
      }
    } else {
      selected.push(c);
    }
  }

  for (const c of scoredChunks) {
    if (selected.length >= limit) break;
    if (!selected.some((s) => s.chunkId === c.chunkId)) {
      selected.push(c);
    }
  }

  return selected.slice(0, limit);
}

/**
 * Searches the KnowledgeChunk collection using Query-Aware Hybrid Retrieval:
 * finalScore = semanticScore * 0.45 + lexicalScore * 0.30 + metadataIntentScore * 0.20 + sourceQualityScore * 0.05
 * followed by source diversity enforcement.
 */
export async function searchKnowledge(
  query: string,
  queryVector?: number[],
  limit: number = 5,
  sourceTypeFilter?: string,
  existingAnalysis?: QueryAnalysis,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<SearchResult[]> {
  const analysis = existingAnalysis || classifyQueryIntent(query, history);

  // Instant bypass for greetings, casual pleasantries, or capability menu requests
  if (analysis.isGreetingQuery || analysis.isCasualQuery || analysis.isCapabilitiesQuery) {
    return [];
  }

  const matchFilter: Record<string, unknown> = {};
  if (sourceTypeFilter) {
    matchFilter.sourceType = sourceTypeFilter;
  }

  // Fetch candidate documents from MongoDB or in-memory fallback
  let candidates: any[] = [];
  try {
    if (mongoose.connection.readyState === 1) {
      candidates = await KnowledgeChunk.find(matchFilter).lean().exec();
    }
  } catch (err) {
    console.warn('⚠️ MongoDB retrieval query failed, using in-memory knowledge store:', err);
  }

  if (!candidates || candidates.length === 0) {
    candidates = getInMemoryKnowledgeChunks(sourceTypeFilter);
  }

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Compute hybrid scores for all candidates
  const scoredChunks: ScoredChunk[] = candidates.map((chunk: any) => {
    let semanticScore = 0;
    if (queryVector && queryVector.length > 0 && chunk.embedding && chunk.embedding.length === queryVector.length) {
      semanticScore = cosineSimilarity(queryVector, chunk.embedding);
    }

    const lexicalScore = computeLexicalScore(analysis.normalizedQuery, chunk, analysis);
    const intentScore = computeMetadataIntentScore(analysis, chunk);
    const qualityScore = computeSourceQualityScore(chunk);

    const finalScore =
      semanticScore * 0.45 +
      lexicalScore * 0.30 +
      intentScore * 0.20 +
      qualityScore * 0.05;

    return {
      chunkId: chunk.chunkId,
      source: chunk.source,
      sourceType: chunk.sourceType,
      projectSlug: chunk.projectSlug || chunk.metadata?.projectSlug,
      url: chunk.url || chunk.metadata?.url,
      title: chunk.title,
      content: chunk.content,
      metadata: chunk.metadata || {},
      tags: chunk.tags || [],
      score: finalScore,
      semanticScore,
      lexicalScore,
      intentScore,
      qualityScore,
      finalScore
    };
  });

  // Sort descending by finalScore
  scoredChunks.sort((a, b) => b.finalScore - a.finalScore);

  // Apply source diversity enforcement
  return enforceDiversity(scoredChunks, analysis, limit);
}
