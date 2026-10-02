import type { QueryAnalysis } from '../retrieval/intent.js';
import type {
  StructuredQueryPlan,
  StructuredResult
} from './types.js';
import {
  executeCount,
  executeList,
  executeCheck,
  executeFilter,
  executeCompare,
  executeAggregate,
  executeSummary,
  executeGet
} from './operations.js';
import { KNOWN_PROJECTS } from '../retrieval/intent.js';

/**
 * Helper to extract matching project slug from text
 */
function extractProjectSlug(text: string): string | undefined {
  const normalized = text.toLowerCase().trim();
  for (const proj of KNOWN_PROJECTS) {
    if (proj.slug === normalized || proj.name.toLowerCase() === normalized) {
      return proj.slug;
    }
    for (const alias of proj.aliases) {
      if (normalized.includes(alias.toLowerCase())) {
        return proj.slug;
      }
    }
  }
  return undefined;
}

/**
 * Detects whether a query should be routed to a structured knowledge operation.
 * Returns a StructuredQueryPlan if a match is detected, or null to proceed to normal RAG.
 */
export function detectStructuredQuery(
  rawQuery: string,
  analysis: QueryAnalysis
): StructuredQueryPlan | null {
  const normalized = analysis.normalizedQuery;

  // Never hijack greetings, casual pleasantries, capabilities menu, or definition questions
  if (
    analysis.isGreetingQuery ||
    analysis.isCasualQuery ||
    analysis.isCapabilitiesQuery ||
    analysis.isGeneralQuestion
  ) {
    return null;
  }

  // 1. COUNT Operation: "How many projects does Akash have?"
  if (
    /\bhow many projects\b/i.test(normalized) ||
    /\bcount (of )?(his |akash'?s? )?projects\b/i.test(normalized) ||
    /\bnumber of (his |akash'?s? )?projects\b/i.test(normalized)
  ) {
    return {
      operation: 'COUNT',
      target: 'projects'
    };
  }

  // 2. LIST Operation: "List Akash's projects", "What are all his projects?", "give all projects details"
  if (
    /\b(?:list|give|show|tell me about|display)\s+(?:all\s+)?(?:akash'?s?\s+|his\s+)?projects?(?:\s+details)?\b/i.test(
      normalized
    ) ||
    /\bwhat are all (his |akash'?s? )?projects\b/i.test(normalized) ||
    /\ball projects (of |by )?akash\b/i.test(normalized) ||
    /\bshow (me )?(all |his )?projects\b/i.test(normalized) ||
    /\b(?:all|every)\s+projects?(?:\s+details)?\b/i.test(normalized) ||
    /\bdetails\s+of\s+all\s+projects\b/i.test(normalized)
  ) {
    return {
      operation: 'LIST',
      target: 'projects'
    };
  }

  // 3. COMPARE Operation: "Compare RapidCare and MERN Docs"
  const compareMatch =
    /\bcompare\s+([a-z0-9\s.-]+?)\s+(?:and|with|to|vs\.?)\s+([a-z0-9\s.-]+)\b/i.exec(normalized) ||
    /\bdifference between\s+([a-z0-9\s.-]+?)\s+and\s+([a-z0-9\s.-]+)\b/i.exec(normalized);

  if (compareMatch) {
    const slugA = extractProjectSlug(compareMatch[1]);
    const slugB = extractProjectSlug(compareMatch[2]);
    if (slugA && slugB && slugA !== slugB) {
      return {
        operation: 'COMPARE',
        target: 'projects',
        entity: slugA,
        secondaryEntity: slugB
      };
    }
  }

  // 4. FILTER Operation: "Which projects use React?", "Projects built with React"
  const filterMatch =
    /\b(?:which|what)\s+projects?\s+(?:use|used|using|leverage|have|are built (?:with|in|using))\s+([a-z0-9.+#]+)\b/i.exec(
      rawQuery
    ) ||
    /\bprojects?\s+(?:that use|using|built (?:with|in|using)|with)\s+([a-z0-9.+#]+)\b/i.exec(
      rawQuery
    );

  if (filterMatch) {
    const targetTech = filterMatch[1].trim();
    if (targetTech && !['he', 'akash', 'you'].includes(targetTech.toLowerCase())) {
      return {
        operation: 'FILTER',
        target: 'projects',
        entity: targetTech
      };
    }
  }

  // 5. CHECK Operation: "Does Akash know React?", "Does Akash know Python?"
  const checkMatch =
    /\bdoes (?:akash|he)\s+(?:know|use|work with|have experience with)\s+([a-z0-9.+#]+)\b/i.exec(
      rawQuery
    ) ||
    /\bis\s+([a-z0-9.+#]+)\s+(?:known by akash|in (?:his|akash'?s?)\s+(?:skills|stack|technologies)|a documented skill)\b/i.exec(
      rawQuery
    );

  if (checkMatch) {
    let candidate = checkMatch[1].trim();
    if (['it', 'this', 'that'].includes(candidate.toLowerCase()) && analysis.detectedTechnologies.length > 0) {
      candidate = analysis.detectedTechnologies[0];
    }
    if (candidate && !['dsa', 'anything', 'something', 'it', 'this', 'that'].includes(candidate.toLowerCase())) {
      return {
        operation: 'CHECK',
        target: 'skills',
        entity: candidate
      };
    }
  }

  // 6. AGGREGATE Operation: "What technologies does Akash use?", "What are rthings he know"
  if (
    /\bwhat technologies does (?:akash|he) use\b/i.test(normalized) ||
    /\bwhat technologies does (?:akash|he) use across (?:his )?projects\b/i.test(normalized) ||
    /\ball technologies (?:akash|he) (?:knows|uses)\b/i.test(normalized) ||
    /\bwhat is (?:akash'?s?|his) (?:full |complete )?tech stack\b/i.test(normalized) ||
    /\bwhat (?:are|is)?\s*(?:r?things?|thigns?|tings?|stuff|tech|skills?)\s*(?:does)?\s*(?:he|akash)\s*know\b/i.test(normalized) ||
    /\bthings\s+(?:he|akash)\s+knows?\b/i.test(normalized)
  ) {
    return {
      operation: 'AGGREGATE',
      target: 'skills'
    };
  }

  // 7. SUMMARY Operation: "Tell me about Akash", "Who is Akash?"
  if (
    /^(who is akash|tell me about akash|who is he|brief introduction about akash)\??$/i.test(
      normalized
    )
  ) {
    return {
      operation: 'SUMMARY',
      target: 'profile'
    };
  }

  // 8. GET Differentiator: "How is he different from others?", "What makes Akash unique?", "Why hire Akash?"
  if (
    analysis.isDifferentiatorQuery ||
    /\b(how is (?:akash|he) different|what makes (?:akash|he|him) different|what makes (?:akash|he|him) unique|why should (?:i|we) hire (?:akash|him)|why hire (?:akash|him)|why choose (?:akash|him)|what sets (?:akash|him) apart|how does (?:akash|he) stand out|different from others)\b/i.test(
      normalized
    )
  ) {
    return {
      operation: 'GET',
      target: 'differentiator'
    };
  }

  // 9. GET Experience: "Give Akash experiences", "Does Akash have experience?", "What is his work experience?"
  if (
    analysis.isExperienceQuery ||
    /\b(?:give|tell me about|what is|what are|does akash have|does he have|share|show)\s+(?:akash'?s?\s+|his\s+)?(?:work\s+)?experiences?\b/i.test(
      normalized
    ) ||
    /\bwhere has (?:akash|he) worked\b/i.test(normalized)
  ) {
    return {
      operation: 'GET',
      target: 'experience'
    };
  }

  // 10. GET Education: "Where did Akash study?", "What is Akash's education?"
  if (
    /\bwhere did (?:akash|he) study\b/i.test(normalized) ||
    /\bwhat is (?:akash'?s?|his) education\b/i.test(normalized) ||
    /\bwhich (?:college|university) did (?:akash|he) (?:attend|go to)\b/i.test(normalized)
  ) {
    return {
      operation: 'GET',
      target: 'education'
    };
  }

  // 11. GET Contact / Email: "How can I contact Akash?", "What is Akash's email?"
  if (
    analysis.isPureContactQuery &&
    (/\b(how (?:can|do) i (?:contact|reach)|what is (?:akash'?s?|his) email)\b/i.test(normalized))
  ) {
    return {
      operation: 'GET',
      target: 'contact'
    };
  }

  // 12. GET Pricing: "How much does Akash charge?", "How much does a website cost?"
  if (
    analysis.isPricingQuery &&
    (/\b(how much does|how much is|pricing|rates?|cost|quote)\b/i.test(normalized))
  ) {
    return {
      operation: 'GET',
      target: 'services',
      field: 'pricingPolicy'
    };
  }

  return null;
}

/**
 * Executes a structured query plan against the structured knowledge layer
 */
export function executeStructuredQuery(plan: StructuredQueryPlan): StructuredResult {
  switch (plan.operation) {
    case 'COUNT':
      return executeCount(plan);
    case 'LIST':
      return executeList(plan);
    case 'CHECK':
      return executeCheck(plan);
    case 'FILTER':
      return executeFilter(plan);
    case 'COMPARE':
      return executeCompare(plan);
    case 'AGGREGATE':
      return executeAggregate(plan);
    case 'SUMMARY':
      return executeSummary(plan);
    case 'GET':
      return executeGet(plan);
    default:
      return {
        operation: plan.operation,
        target: plan.target,
        handled: false,
        text: '',
        sources: []
      };
  }
}
