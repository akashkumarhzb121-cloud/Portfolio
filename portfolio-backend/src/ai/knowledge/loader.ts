import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AkashIndex, ProjectData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to ai-knowledge directory
const KNOWLEDGE_DIR = path.resolve(__dirname, '../../../ai-knowledge');

// In-memory cache to prevent reading files on every chat request
interface KnowledgeCache {
  akashIndex: AkashIndex | null;
  files: Map<string, unknown>;
  projects: Map<string, ProjectData>;
  allProjectsLoaded: boolean;
}

const cache: KnowledgeCache = {
  akashIndex: null,
  files: new Map(),
  projects: new Map(),
  allProjectsLoaded: false
};

/**
 * Clears the in-memory knowledge cache (useful for tests or hot reloads)
 */
export function clearKnowledgeCache(): void {
  cache.akashIndex = null;
  cache.files.clear();
  cache.projects.clear();
  cache.allProjectsLoaded = false;
}

/**
 * Loads the root canonical index: ai-knowledge/akash.json
 */
export function loadAkashIndex(): AkashIndex {
  if (cache.akashIndex) {
    return cache.akashIndex;
  }

  const indexPath = path.join(KNOWLEDGE_DIR, 'akash.json');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`akash.json not found at ${indexPath}`);
  }

  const raw = fs.readFileSync(indexPath, 'utf-8');
  cache.akashIndex = JSON.parse(raw) as AkashIndex;
  return cache.akashIndex;
}

/**
 * Loads a specific JSON file from the ai-knowledge directory
 */
export function loadSourceFile<T = unknown>(relativePath: string): T | null {
  const normalized = relativePath.replace(/\\/g, '/');
  if (cache.files.has(normalized)) {
    return cache.files.get(normalized) as T;
  }

  const fullPath = path.join(KNOWLEDGE_DIR, normalized);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[KnowledgeLoader] Source file not found: ${fullPath}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(raw) as T;
    cache.files.set(normalized, parsed);
    return parsed;
  } catch (err) {
    console.error(`[KnowledgeLoader] Failed to parse JSON file at ${fullPath}:`, err);
    return null;
  }
}

/**
 * Loads a project by slug (e.g. 'rapidcare', 'modplint-interiors', 'mern-docs')
 */
export function loadProjectBySlug(slug: string): ProjectData | null {
  const normalizedSlug = slug.toLowerCase().trim();
  if (cache.projects.has(normalizedSlug)) {
    return cache.projects.get(normalizedSlug) || null;
  }

  // Check akash.json index items
  const index = loadAkashIndex();
  const indexItem = index.projects.items.find(
    (item) => item.slug.toLowerCase() === normalizedSlug || item.name.toLowerCase() === normalizedSlug
  );

  let targetFilename: string | null = null;
  if (indexItem) {
    targetFilename = indexItem.source;
  } else {
    // Check projects directory directly
    const projectsDir = path.join(KNOWLEDGE_DIR, 'projects');
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir);
      const match = files.find(
        (f) => f.toLowerCase().replace('.json', '') === normalizedSlug
      );
      if (match) {
        targetFilename = `projects/${match}`;
      }
    }
  }

  if (!targetFilename) return null;

  const projectData = loadSourceFile<ProjectData>(targetFilename);
  if (projectData) {
    cache.projects.set(normalizedSlug, projectData);
  }
  return projectData;
}

/**
 * Loads all projects from ai-knowledge/projects/ and akash.json
 */
export function loadAllProjects(): Array<{ slug: string; name: string; data: ProjectData }> {
  if (cache.allProjectsLoaded) {
    const results: Array<{ slug: string; name: string; data: ProjectData }> = [];
    for (const [slug, data] of cache.projects.entries()) {
      results.push({ slug, name: data.name, data });
    }
    return results;
  }

  const index = loadAkashIndex();
  const results: Array<{ slug: string; name: string; data: ProjectData }> = [];

  // Use items in akash.json
  for (const item of index.projects.items) {
    const data = loadSourceFile<ProjectData>(item.source);
    if (data) {
      cache.projects.set(item.slug.toLowerCase(), data);
      results.push({ slug: item.slug, name: data.name || item.name, data });
    }
  }

  // Also check if any additional files exist in projects/ directory
  const projectsDir = path.join(KNOWLEDGE_DIR, 'projects');
  if (fs.existsSync(projectsDir)) {
    const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const slug = f.replace('.json', '').toLowerCase();
      if (!cache.projects.has(slug)) {
        const data = loadSourceFile<ProjectData>(`projects/${f}`);
        if (data) {
          cache.projects.set(slug, data);
          results.push({ slug, name: data.name || slug, data });
        }
      }
    }
  }

  cache.allProjectsLoaded = true;
  return results;
}
