import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { buildSystemPrompt } from '../prompts/systemPrompt.js';
import { searchKnowledge, type SearchResult } from '../retrieval/search.js';
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
 * Generates dynamic follow-up suggestions based on retrieved sources & intent
 */
function deriveSuggestedQuestions(userMessage: string, chunks: SearchResult[]): string[] {
  const lower = userMessage.toLowerCase();

  if (lower.includes('rapidcare') || lower.includes('health')) {
    return [
      'What technologies power RapidCare?',
      'Can you show me Modplint Interiors?',
      'How do I hire Akash for a project?'
    ];
  }

  if (lower.includes('hire') || lower.includes('service') || lower.includes('cost') || lower.includes('quote')) {
    return [
      'What is Akash’s typical turnaround time?',
      'Tell me about full-stack web applications',
      'What 3D and WebGL services are offered?'
    ];
  }

  if (lower.includes('skills') || lower.includes('stack') || lower.includes('tech')) {
    return [
      'Tell me about Akash’s DSA problem-solving record',
      'Show me featured projects built with React and Node.js',
      'How does Akash integrate AI into web applications?'
    ];
  }

  // Default suggested chips
  return [
    'Tell me about RapidCare',
    'What services does Akash offer?',
    'What is Akash’s tech stack?'
  ];
}

/**
 * Offline/development fallback synthesizer when OpenAI API is not available or key is not set
 */
function generateContextualFallbackAnswer(message: string, chunks: SearchResult[]): string {
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

  // 1. Generate query embedding & retrieve relevant knowledge chunks
  let queryVector: number[] | undefined;
  try {
    queryVector = await getEmbedding(message);
  } catch (err) {
    console.warn('⚠️ Could not generate embedding for query:', err);
  }

  const retrievedChunks = await searchKnowledge(message, queryVector, 5);

  // 2. Prepare context string from retrieved chunks
  const contextString = retrievedChunks
    .map(
      (c, idx) =>
        `[Document ${idx + 1}: ${c.title} (${c.sourceType})]\n${c.content}`
    )
    .join('\n\n---\n\n');

  // 3. Prepare system prompt
  const systemPrompt = buildSystemPrompt({ retrievedContext: contextString });

  // 4. Construct messages payload with bounded history (last 6 messages max)
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

  // 5. Call LLM provider (Groq or configured OpenAI-compatible endpoint) or fallback
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
      answer = generateContextualFallbackAnswer(message, retrievedChunks);
    }
  } else {
    // Development or key-free fallback
    answer = generateContextualFallbackAnswer(message, retrievedChunks);
  }

  // 6. Format sources
  const sources: ChatSourceItem[] = retrievedChunks.map((chunk) => {
    let url: string | undefined;
    if (chunk.metadata?.links && typeof chunk.metadata.links === 'object') {
      const links = chunk.metadata.links as Record<string, string>;
      url = links.live_demo || links.portfolio || links.github_repo || Object.values(links)[0];
    }
    return {
      title: chunk.title,
      type: chunk.sourceType,
      url
    };
  });

  // Deduplicate sources by title
  const uniqueSources = sources.filter(
    (src, index, self) => index === self.findIndex((s) => s.title === src.title)
  );

  // 7. Dynamic suggested questions
  const suggestedQuestions = deriveSuggestedQuestions(message, retrievedChunks);

  // 8. Persist conversation history asynchronously (safely handled if DB is unavailable)
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
