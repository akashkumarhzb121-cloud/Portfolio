export type StructuredOperationType =
  | 'GET'
  | 'COUNT'
  | 'LIST'
  | 'CHECK'
  | 'FILTER'
  | 'COMPARE'
  | 'AGGREGATE'
  | 'SUMMARY';

export type StructuredTarget =
  | 'identity'
  | 'profile'
  | 'skills'
  | 'services'
  | 'projects'
  | 'experience'
  | 'education'
  | 'contact'
  | 'faq'
  | 'dsa'
  | 'differentiator';

export interface StructuredQueryPlan {
  operation: StructuredOperationType;
  target: StructuredTarget;
  entity?: string;
  secondaryEntity?: string;
  field?: string;
  unknownPolicy?: string;
}

export interface StructuredSourceItem {
  title: string;
  type: string;
  url?: string;
  projectSlug?: string;
}

export interface StructuredResult {
  operation: StructuredOperationType;
  target: StructuredTarget;
  handled: boolean;
  text: string;
  sources: StructuredSourceItem[];
  suggestedQuestions?: string[];
  raw?: unknown;
}

export interface AkashIndexProjectItem {
  name: string;
  slug: string;
  source: string;
}

export interface AkashIndex {
  schemaVersion: string;
  type: string;
  identity: {
    name: string;
    displayName: string;
    role: string;
    portfolioUrl: string;
    description: string;
    primaryFocus: string[];
  };
  knowledgeSources: Record<string, string>;
  skills: {
    source: string;
    categories: string[];
    knownTechnologies: string[];
  };
  services: {
    source: string;
    categories: string[];
    pricingPolicy: {
      available: boolean;
      fixedPrice: boolean;
      rule: string;
      source: string;
    };
  };
  projects: {
    source: string;
    count: number;
    items: AkashIndexProjectItem[];
  };
  experience: { source: string };
  education: { source: string };
  contact: { source: string };
  faq: { source: string };
  dsa: { source: string };
  queryCapabilities: {
    supportedOperations: string[];
    examples: Array<Record<string, unknown>>;
  };
  queryRouting: Record<string, string[]>;
  groundingRules: string[];
}

export interface ProjectData {
  id?: string;
  name: string;
  category?: string;
  featured?: boolean;
  role?: string;
  timeline?: string;
  tagline?: string;
  description?: string;
  problem?: string;
  solution?: string;
  metrics_and_highlights?: string[];
  architecture_and_core_modules?: Record<string, unknown>;
  technologies?: Record<string, string[] | undefined>;
  links?: {
    live_demo?: string;
    github_repo?: string;
    portfolio?: string;
    client_repo?: string;
    server_repo?: string;
    [key: string]: string | undefined;
  };
}
