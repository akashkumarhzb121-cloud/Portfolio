import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { buildSystemPrompt } from '../prompts/systemPrompt.js';
import { searchKnowledge, type SearchResult } from '../retrieval/search.js';
import { classifyQueryIntent, type QueryAnalysis } from '../retrieval/intent.js';
import { getEmbedding } from '../rag/ingest.js';
import { Conversation, type IChatMessage } from '../../models/conversation.model.js';

// Initialize OpenAI-compatible LLM client (defaults to Groq free tier)
const chatClient = env.AI_API_KEY
  ? new OpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL || 'https://api.groq.com/openai/v1'
    })
  : null;

export interface GenerateChatOptions {
  message: string;
  conversationId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatSourceItem {
  title: string;
  type: string;
  url?: string;
}

export interface GenerateChatResponse {
  answer: string;
  sources: ChatSourceItem[];
  suggestedQuestions: string[];
  conversationId: string;
}

/**
 * Generates dynamic follow-up suggestions based on query intent & analysis
 */
function deriveSuggestedQuestions(analysis: QueryAnalysis): string[] {
  if (analysis.namedProjectSlug === 'rapidcare') {
    return [
      'What technologies power RapidCare?',
      'Can you show me Modplint Interiors?',
      'How do I hire Akash for a project?'
    ];
  }

  if (analysis.namedProjectSlug) {
    return [
      'What technologies power this project?',
      'What other projects has Akash built?',
      'How do I hire Akash for a project?'
    ];
  }

  if (analysis.isPureContactQuery) {
    return [
      'What services does Akash offer?',
      'What is Akash’s tech stack?',
      'Tell me about RapidCare'
    ];
  }

  if (analysis.isHiringQuery) {
    return [
      'What is Akash’s typical turnaround time?',
      'How can I contact Akash?',
      'Show me featured projects built with React and Node.js'
    ];
  }

  if (analysis.isSkillsQuery) {
    return [
      'Tell me about Akash’s DSA problem-solving record',
      'What projects has Akash built?',
      'How do I hire Akash for a project?'
    ];
  }

  if (analysis.isEducationQuery) {
    return [
      'What is Akash’s tech stack?',
      'What projects has Akash built?',
      'How do I contact Akash?'
    ];
  }

  if (analysis.isDSAQuery) {
    return [
      'What languages does Akash use for DSA?',
      'Tell me about Akash’s technical skills',
      'How do I hire Akash?'
    ];
  }

  // Default suggestions
  return [
    'Tell me about RapidCare',
    'What services does Akash offer?',
    'What is Akash’s tech stack?'
  ];
}

/**
 * Contextual fallback synthesizer when OpenAI API is not available or key is not set.
 * Uses query intent and top retrieved chunks to give structured, grounded answers.
 */
function generateContextualFallbackAnswer(
  message: string,
  chunks: SearchResult[],
  analysis: QueryAnalysis
): string {
  // Pure contact query
  if (analysis.isPureContactQuery) {
    return (
      "You can reach Akash Kumar directly through several channels:\n\n" +
      "- **Email**: [akashkumarhzb121@gmail.com](mailto:akashkumarhzb121@gmail.com)\n" +
      "- **Location**: India (available for global remote work & relocation)\n" +
      "- **Response Time**: Typically within 24 hours\n" +
      "- **Online Profiles**: [GitHub](https://github.com/akashkumarhzb121-cloud) | [LinkedIn](https://linkedin.com/in/akash-kumar-developer) | [Twitter](https://x.com/sky_kumar121)\n\n" +
      "You can also send a direct enquiry using the contact form on this portfolio."
    );
  }

  // Hiring / Pricing / Services query
  if (analysis.isHiringQuery) {
    const lower = message.toLowerCase();
    if (lower.includes('charge') || lower.includes('cost') || lower.includes('rate') || lower.includes('price')) {
      return (
        "Akash does not list fixed pricing because every project is tailored to specific technical requirements, scale, and deadlines. Pricing is scoped transparently based on your project goals.\n\n" +
        "**Services Offered:**\n" +
        "- **Full-Stack Web Applications**: Scalable apps built with React, Node.js, Express, and MongoDB\n" +
        "- **Creative Web & 3D**: Interactive 3D graphics and web experiences using Three.js and WebGL\n" +
        "- **AI & Smart Integrations**: Production RAG architectures, LLM pipelines, and AI assistants\n" +
        "- **UI/UX Modernization**: High-performance refactoring and responsive design\n\n" +
        "To get an accurate quote and timeline for your project, please reach out directly at **akashkumarhzb121@gmail.com** or submit an enquiry via the contact form below."
      );
    }

    return (
      "To hire Akash or collaborate on a project:\n\n" +
      "1. **Services Available**: Full-Stack Web Apps, Creative 3D Web, AI Integrations, and UI/UX Modernization.\n" +
      "2. **Process**: Initial consultation -> architecture & scope definition -> sprint development with updates -> deployment & handoff.\n" +
      "3. **Next Step**: Email **akashkumarhzb121@gmail.com** or send a message through the contact form below with your requirements."
    );
  }

  // Skills / Tech stack query
  if (analysis.isSkillsQuery) {
    return (
      "Here is a summary of Akash Kumar's core technical expertise:\n\n" +
      "- **Frontend**: React, Next.js, TypeScript, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS\n" +
      "- **3D & Creative**: Three.js, WebGL, OGL, Framer Motion, GSAP, Responsive 3D Canvas\n" +
      "- **Backend & APIs**: Node.js, Express.js, RESTful APIs, JWT Authentication, Microservices\n" +
      "- **Databases & Cloud**: MongoDB Atlas, Mongoose, Redis, Cloudinary, Vercel, Render\n" +
      "- **AI & Integrations**: Groq AI, LangChain, RAG Architectures, Vector Embeddings\n" +
      "- **DSA & Problem Solving**: Strong foundation in data structures & algorithms (C++, Java, JavaScript)\n\n" +
      "Feel free to ask for specific project implementations showcasing any of these technologies!"
    );
  }

  // Education query
  if (analysis.isEducationQuery) {
    return (
      "Akash Kumar's educational background:\n\n" +
      "- **Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering\n" +
      "- **Institution**: University College of Engineering and Technology (UCET), VBU, Hazaribagh\n" +
      "- **Core Subjects**: Data Structures & Algorithms, Database Management Systems (DBMS), Operating Systems, Computer Networks, Object-Oriented Programming (OOP), Software Engineering."
    );
  }

  // General questions (e.g. "What is React?", "What is JWT?")
  if (analysis.isGeneralQuestion && analysis.detectedTechnologies.length > 0) {
    const tech = analysis.detectedTechnologies[0];
    let techExplanation = `${tech} is a core technology commonly used in modern web development.`;
    if (tech.toLowerCase().includes('react')) {
      techExplanation = 'React is a popular open-source JavaScript library developed by Meta for building dynamic user interfaces, particularly single-page applications with component-driven architecture.';
    } else if (tech.toLowerCase().includes('jwt')) {
      techExplanation = 'JWT (JSON Web Token) is an open standard (RFC 7519) for securely transmitting information between parties as a compact, self-contained JSON object, commonly used for stateless authentication and authorization in modern REST APIs.';
    }

    return (
      `${techExplanation}\n\n` +
      `Akash Kumar actively leverages **${tech}** across multiple production projects in his full-stack portfolio, such as RapidCare and Modplint Interiors.`
    );
  }

  // Fallback with retrieved chunks
  if (chunks.length === 0) {
    return (
      "I'm SKY AI, Akash Kumar's portfolio assistant. I don't have that specific detail in my knowledge base, " +
      "but feel free to reach out to Akash directly at akashkumarhzb121@gmail.com or submit an enquiry below!"
    );
  }

  const primary = chunks[0];
  const secondary = chunks[1];

  let answer = `Here is what I found regarding your query:\n\n**${primary.title}**\n${primary.content.slice(0, 600)}`;

  if (secondary && secondary.title !== primary.title) {
    answer += `\n\n**${secondary.title}**\n${secondary.content.slice(0, 400)}`;
  }

  if (primary.metadata?.links && typeof primary.metadata.links === 'object') {
    const linkEntries = Object.entries(primary.metadata.links);
    if (linkEntries.length > 0) {
      answer += '\n\n**Helpful Links:**\n' +
        linkEntries.map(([name, url]) => `- [${name.replace(/_/g, ' ').toUpperCase()}](${url})`).join('\n');
    }
  }

  answer += '\n\n*Feel free to ask more details about Akash’s projects, tech stack, or services!*';
  return answer;
}

/**
 * Main chat generation function coordinating vector retrieval, conversation history, and LLM synthesis
 */
export async function generateChatResponse(
  options: GenerateChatOptions
): Promise<GenerateChatResponse> {
  const { message, conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, history = [] } = options;

  // 1. Classify query intent deterministically
  const analysis = classifyQueryIntent(message);

  // 2. Generate query embedding & retrieve relevant knowledge chunks
  let queryVector: number[] | undefined;
  try {
    queryVector = await getEmbedding(message);
  } catch (err) {
    console.warn('⚠️ Could not generate embedding for query:', err);
  }

  const retrievedChunks = await searchKnowledge(message, queryVector, 5);

  // 3. Prepare context string from retrieved chunks
  const contextString = retrievedChunks
    .map(
      (c, idx) =>
        `[Document ${idx + 1}: ${c.title} (${c.sourceType})]\n${c.content}`
    )
    .join('\n\n---\n\n');

  // 4. Prepare system prompt
  const systemPrompt = buildSystemPrompt({ retrievedContext: contextString });

  // 5. Construct messages payload with bounded history (last 6 messages max)
  const boundedHistory = history.slice(-6);

  const messagesPayload: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...boundedHistory.map((h) => ({
      role: h.role,
      content: h.content
    })),
    { role: 'user', content: message }
  ];

  let answer = '';

  // 6. Call LLM provider (Groq or configured OpenAI-compatible endpoint) or fallback
  if (chatClient && env.AI_API_KEY) {
    try {
      const completion = await chatClient.chat.completions.create({
        model: env.AI_MODEL || 'llama-3.3-70b-versatile',
        messages: messagesPayload,
        temperature: 0.3,
        max_tokens: 800
      });

      answer = completion.choices[0]?.message?.content?.trim() || '';
    } catch (err: any) {
      console.error('❌ LLM generation call failed:', err?.message || err);
      // Fallback gracefully so visitor always receives high quality info
      answer = generateContextualFallbackAnswer(message, retrievedChunks, analysis);
    }
  } else {
    // Development or key-free fallback
    answer = generateContextualFallbackAnswer(message, retrievedChunks, analysis);
  }

  // 7. Format and filter source citations returned to the frontend
  let filteredChunks = retrievedChunks;

  if (analysis.isPureContactQuery) {
    // Pure contact questions must NEVER return project citations
    filteredChunks = filteredChunks.filter((c) => c.sourceType !== 'project');
  } else if (analysis.namedProjectSlug) {
    // Named project queries should only cite that project or general background
    filteredChunks = filteredChunks.filter(
      (c) =>
        c.projectSlug === analysis.namedProjectSlug ||
        c.chunkId.includes(analysis.namedProjectSlug!) ||
        c.sourceType !== 'project'
    );
  } else if (analysis.isSkillsQuery) {
    // Skills queries should not cite generic project overviews
    filteredChunks = filteredChunks.filter(
      (c) => c.sourceType !== 'project' || c.chunkId.includes('tech')
    );
  }

  const sources: ChatSourceItem[] = filteredChunks.map((chunk) => {
    let url: string | undefined = chunk.url;
    if (!url && chunk.metadata?.links && typeof chunk.metadata.links === 'object') {
      const links = chunk.metadata.links as Record<string, string>;
      url = links.live_demo || links.portfolio || links.github_repo || Object.values(links)[0];
    }
    return {
      title: chunk.title,
      type: chunk.sourceType,
      url
    };
  });

  // Deduplicate sources by title and cap to top 4
  const uniqueSources = sources
    .filter((src, index, self) => index === self.findIndex((s) => s.title === src.title))
    .slice(0, 4);

  // 8. Dynamic suggested questions
  const suggestedQuestions = deriveSuggestedQuestions(analysis);

  // 9. Persist conversation history asynchronously (safely handled if DB is unavailable)
  try {
    const userMsg: IChatMessage = { role: 'user', content: message, timestamp: new Date() };
    const assistantMsg: IChatMessage = { role: 'assistant', content: answer, timestamp: new Date() };

    void Conversation.findOneAndUpdate(
      { conversationId },
      {
        $push: {
          messages: {
            $each: [userMsg, assistantMsg],
            $slice: -20 // keep last 20 messages
          }
        }
      },
      { upsert: true, new: true }
    ).catch(() => {
      // Ignore background persistence errors
    });
  } catch {
    // Non-blocking
  }

  return {
    answer,
    sources: uniqueSources,
    suggestedQuestions,
    conversationId
  };
}
