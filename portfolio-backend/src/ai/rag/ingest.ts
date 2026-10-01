import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { KnowledgeChunk } from '../../models/knowledgeChunk.model.js';
import { chunkKnowledgeFile, type RawChunk } from './chunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize dedicated embedding client (separate from Groq / chat LLM provider)
const embeddingClient = env.EMBEDDING_API_KEY
  ? new OpenAI({
      apiKey: env.EMBEDDING_API_KEY,
      baseURL: env.EMBEDDING_BASE_URL || undefined
    })
  : null;

/**
 * Deterministic pseudo-embedding for testing, offline mode, or when no embedding provider key is set.
 * Ensures zero-cost, zero-crash RAG operations without requiring an OpenAI API key.
 */
export function generateDeterministicEmbedding(text: string, dimensions = 1536): number[] {
  const vec = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const index = (code * 37 + i * 17) % dimensions;
    vec[index] += 1;
  }
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) sumSq += vec[i] * vec[i];
  const magnitude = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dimensions; i++) vec[i] = vec[i] / magnitude;
  return vec;
}

/**
 * Generates an embedding vector using a dedicated embedding provider,
 * or falls back to a deterministic vector. Never uses Groq chat models for embeddings.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (embeddingClient && env.EMBEDDING_API_KEY) {
    try {
      const response = await embeddingClient.embeddings.create({
        model: env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text.replace(/\n+/g, ' ').slice(0, 8000)
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn('⚠️ Embedding provider call failed, falling back to deterministic vector:', err);
      return generateDeterministicEmbedding(text);
    }
  }

  // When no separate embedding key is set, use deterministic vectors so RAG runs completely free
  return generateDeterministicEmbedding(text);
}

/**
 * Reads all knowledge files from ai-knowledge directory
 */
export function collectKnowledgeFiles(baseDir: string): { relativePath: string; fullPath: string }[] {
  const files: { relativePath: string; fullPath: string }[] = [];

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push({ relativePath, fullPath });
      }
    }
  }

  walk(baseDir);
  return files;
}

/**
 * Main ingestion function to chunk and persist all knowledge JSONs
 */
export async function ingestKnowledgeBase(customBaseDir?: string): Promise<{
  filesProcessed: number;
  chunksIngested: number;
}> {
  // Resolve ai-knowledge folder path
  const knowledgeDir =
    customBaseDir ||
    path.resolve(__dirname, '../../../ai-knowledge');

  if (!fs.existsSync(knowledgeDir)) {
    throw new Error(`ai-knowledge directory not found at: ${knowledgeDir}`);
  }

  const files = collectKnowledgeFiles(knowledgeDir);
  let totalChunksIngested = 0;

  console.log(`\n📚 Starting knowledge ingestion from: ${knowledgeDir}`);
  console.log(`Found ${files.length} knowledge files to process.`);

  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file.fullPath, 'utf-8');
      const data = JSON.parse(fileContent);
      const rawChunks: RawChunk[] = chunkKnowledgeFile(file.relativePath, data);

      for (const chunk of rawChunks) {
        // Embed title + content for optimal semantic retrieval
        const embeddingText = `${chunk.title}\n${chunk.content}`;
        const embedding = await getEmbedding(embeddingText);

        await KnowledgeChunk.findOneAndUpdate(
          { chunkId: chunk.chunkId },
          {
            chunkId: chunk.chunkId,
            source: chunk.source,
            sourceType: chunk.sourceType,
            projectSlug: chunk.projectSlug,
            url: chunk.url,
            title: chunk.title,
            content: chunk.content,
            metadata: {
              ...chunk.metadata,
              projectSlug: chunk.projectSlug,
              url: chunk.url
            },
            tags: chunk.tags,
            embedding
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        totalChunksIngested++;
      }

      console.log(`  ✓ Processed ${file.relativePath} (${rawChunks.length} chunks)`);
    } catch (err) {
      console.error(`  ❌ Failed processing ${file.relativePath}:`, err);
    }
  }

  console.log(`\n✨ Ingestion complete! Total ${totalChunksIngested} chunks stored.\n`);
  return {
    filesProcessed: files.length,
    chunksIngested: totalChunksIngested
  };
}

// Standalone execution handler
async function runStandalone() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(env.MONGODB_URI);
      console.log('Connected to MongoDB.');
    }

    await ingestKnowledgeBase();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Fatal ingestion error:', error);
    process.exit(1);
  }
}

// If executed directly via CLI
const isDirectRun =
  process.argv[1]?.endsWith('ingest.ts') ||
  process.argv[1]?.endsWith('ingest.js') ||
  process.argv[1]?.includes('ingest');

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  void runStandalone();
}
