import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { buildSystemPrompt } from '../prompts/systemPrompt.js';
import { searchKnowledge, type SearchResult } from '../retrieval/search.js';
import { classifyQueryIntent, type QueryAnalysis } from '../retrieval/intent.js';
import { getEmbedding } from '../rag/ingest.js';
import { Conversation, type IChatMessage } from '../../models/conversation.model.js';
import { detectStructuredQuery, executeStructuredQuery } from '../knowledge/index.js';

// Initialize OpenAI-compatible LLM client (defaults to Groq free tier)
export const chatClient = env.AI_API_KEY
  ? new OpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL || 'https://api.groq.com/openai/v1'
    })
  : null;

/**
 * Executes chat completion with resilient model fallback (e.g. if llama-3.3-70b-versatile returns 404 on Groq,
 * gracefully retries with active models like openai/gpt-oss-120b or openai/gpt-oss-20b)
 */
async function callChatCompletion(
  client: OpenAI,
  payload: {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  const preferredModel = env.AI_MODEL || 'openai/gpt-oss-120b';
  const fallbackModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  const modelsToTry = [preferredModel, ...fallbackModels.filter((m) => m !== preferredModel)];

  let lastError: unknown;
  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.3,
        max_tokens: payload.max_tokens ?? 800
      });
      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return content;
    } catch (err: any) {
      lastError = err;
      if (err?.status === 404 || err?.message?.includes('does not exist') || err?.message?.includes('not found')) {
        console.warn(`⚠️ Model ${model} not available on Groq, retrying with fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All model completions failed');
}

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
  if (analysis.isGreetingQuery || analysis.isCasualQuery) {
    return [
      'What technologies does Akash know?',
      'Tell me about RapidCare',
      'What services does Akash offer?'
    ];
  }

  if (analysis.isCapabilitiesQuery) {
    return [
      'What technologies does Akash know?',
      'Tell me about RapidCare',
      'How do I hire Akash for a project?'
    ];
  }

  if (analysis.namedProjectSlug === 'rapidcare') {
    return [
      'What technologies were used in RapidCare?',
      'Can Akash build something similar?',
      'How do I hire Akash for a project?'
    ];
  }

  if (analysis.namedProjectSlug) {
    return [
      'What technologies power this project?',
      'What other projects has Akash built?',
      'How do I contact Akash?'
    ];
  }

  if (analysis.isPureContactQuery) {
    return [
      'What services does Akash offer?',
      'What is Akash’s tech stack?',
      'Tell me about RapidCare'
    ];
  }

  if (analysis.isJobQuery || analysis.isInternshipQuery || analysis.isAvailabilityQuery) {
    return [
      'Can I interview Akash?',
      'What is Akash’s experience?',
      'What is Akash’s tech stack?'
    ];
  }

  if (analysis.isPricingQuery) {
    return [
      'How can I contact Akash?',
      'What services does Akash provide?',
      'Show me featured projects built with React'
    ];
  }

  if (analysis.isHiringQuery || analysis.isServicesQuery) {
    return [
      'How much does a project cost?',
      'How can I contact Akash?',
      'Tell me about RapidCare'
    ];
  }

  if (analysis.isSkillsQuery) {
    return [
      'Does Akash know DSA?',
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
      'What projects has Akash built?'
    ];
  }

  if (analysis.isGeneralQuestion) {
    const tech = analysis.detectedTechnologies[0] || 'modern tech';
    return [
      `Does Akash use ${tech}?`,
      'What is Akash’s tech stack?',
      'Tell me about RapidCare'
    ];
  }

  return [
    'Tell me about RapidCare',
    'What services does Akash offer?',
    'What is Akash’s tech stack?'
  ];
}

/**
 * Produces structured conversational answers for common intents.
 * Guarantees zero hallucinations and adheres to Section 23/24 principles.
 */
export function generateContextualFallbackAnswer(
  message: string,
  chunks: SearchResult[],
  analysis: QueryAnalysis
): string {
  // 1. Greeting
  if (analysis.isGreetingQuery) {
    return (
      "Hey! 👋 I'm SKY AI, Akash's portfolio assistant.\n\n" +
      "I can help you explore Akash's skills, projects, experience, services, and how to contact him.\n\n" +
      "What would you like to know? 🚀"
    );
  }

  // 1b. Gibberish / Nonsense
  if (analysis.isGibberishQuery) {
    return (
      "I'm not sure I understood that! Could you please rephrase or let me know what you'd like to explore about Akash?\n\n" +
      "For example, you can ask about his **technical skills**, **featured projects**, **experience**, **services**, or **how to contact him**."
    );
  }

  // 2. Capabilities
  if (analysis.isCapabilitiesQuery) {
    return (
      "I'm SKY AI, Akash's portfolio assistant 🤖\n\n" +
      "I can help you explore:\n\n" +
      "- 👨‍💻 **About Akash**: Background, bio, and engineering focus\n" +
      "- 🛠️ **Skills & Technologies**: Full-stack web, 3D/creative, databases, and tools\n" +
      "- 🚀 **Projects**: Architectures, live demos, and GitHub repositories\n" +
      "- 💼 **Experience & Roles**: Engineering work and real-world impact\n" +
      "- 🌐 **Services**: Custom web development, 3D experiences, and AI integration\n" +
      "- 📩 **Contact Information**: Direct email, LinkedIn, and enquiry channels\n" +
      "- 💻 **Opportunities**: Full-time roles, internships, and freelance collaboration\n" +
      "- 🧠 **Technical Topics**: Explanations of React, Node.js, Three.js, DSA, etc.\n\n" +
      "You can ask me something like:\n" +
      "- *\"What technologies does Akash know?\"*\n" +
      "- *\"Tell me about RapidCare.\"*\n" +
      "- *\"How can I hire Akash for a project?\"*"
    );
  }

  // 3. Casual
  if (analysis.isCasualQuery) {
    const lower = message.toLowerCase();
    if (lower.includes('how are you') || lower.includes('how is it going') || lower.includes('what s up') || lower.includes('whats up')) {
      return "I'm doing great, thanks for asking! 😊 I'm here and ready to help you explore Akash's portfolio, featured projects, or discuss work opportunities. How can I assist you today?";
    }
    if (lower.includes('nice website') || lower.includes('cool website') || lower.includes('this looks great') || lower.includes('like this website')) {
      return "Thank you! Akash designed and built this portfolio with modern web technologies, smooth animations, and interactive 3D elements. Let me know if you want to know how it was built or learn more about his work!";
    }
    if (lower.includes('thank')) {
      return "You're very welcome! Feel free to ask if there's anything else about Akash's work or projects you'd like to explore.";
    }
    if (lower.includes('who are you') || lower.includes('who am i talking to') || lower.includes('are you an ai') || lower.includes('your name')) {
      return "I'm SKY AI, Akash Kumar's portfolio assistant 🤖. I'm here to answer questions about Akash's engineering skills, featured projects, services, and how to get in touch with him.";
    }
    if (lower.includes('bye') || lower.includes('see you')) {
      return "Goodbye! Have a great day, and feel free to reach out to Akash whenever you're ready to collaborate.";
    }
    return "I'm here to help you navigate Akash Kumar's portfolio! Feel free to ask about his projects, technical skills, services, or how to get in touch.";
  }

  // 3b. Differentiator / Uniqueness ("How is he different from others?", "Why hire Akash?")
  if (analysis.isDifferentiatorQuery) {
    return (
      "What sets **Akash Kumar** apart from typical developers is his unique combination of **creative engineering, production-grade architecture, and problem-solving rigor**:\n\n" +
      "1. **Intersection of 3D Web & Full-Stack Systems**:\n" +
      "   Unlike developers who specialize exclusively in frontend or backend, Akash seamlessly bridges both worlds: creating immersive 3D/WebGL experiences (Three.js, React Three Fiber, Rapier Physics, GSAP, OGL) while engineering robust, scalable backends (Node.js, Express, MongoDB, Socket.IO).\n\n" +
      "2. **Real-World Product Ownership**:\n" +
      "   He doesn't just build clone apps—he engineers real-world platforms. From architecting **RapidCare** (an AI clinical triage and live ambulance dispatch network) to building commercial production platforms like **Modplint Interiors** with custom CMS workflows.\n\n" +
      "3. **Strong Algorithmic & Performance Mindset**:\n" +
      "   With 500+ algorithmic problems solved across LeetCode and GeeksforGeeks, he writes clean, optimized, memory-efficient code and is relentless about performance (60fps animations, optimized asset loading, and fast API response times).\n\n" +
      "4. **End-to-End Client & Team Execution**:\n" +
      "   Proven capability to communicate directly with clients, translate high-level requirements into technical architectures, and ship production-ready software on time.\n\n" +
      "Whether you need a high-impact interactive digital experience or a mission-critical web application, Akash brings both the creative vision and the technical muscle to deliver it."
    );
  }

  // 3c. Experience query ("Give Akash experiences", "Does Akash have experience?")
  if (analysis.isExperienceQuery) {
    return (
      "Akash Kumar's professional engineering experience & track record:\n\n" +
      "- **Web Development Intern at Novitech Pvt. Ltd.** (Remote):\n" +
      "  - Engineered and deployed two production client landing pages adhering to strict responsive design and cross-browser standards.\n" +
      "  - Optimized asset loading and performance across mobile, tablet, and desktop viewports.\n" +
      "  - Collaborated with engineering stakeholders for on-time delivery.\n\n" +
      "- **Freelance Full-Stack & Creative Developer**:\n" +
      "  - Architected and delivered end-to-end commercial client platforms such as **Modplint Interiors** (complete consultation pipeline and administrative CMS).\n" +
      "  - Developed production full-stack systems like **RapidCare** (real-time emergency triage with AI integration and live ambulance dispatch tracking).\n" +
      "  - Built immersive interactive 3D WebGL experiences using Three.js, React Three Fiber, Rapier Physics, and modern frontend tools.\n\n" +
      "He has proven hands-on experience building, deploying, and maintaining production-grade applications. Feel free to ask about any specific project or role!"
    );
  }

  // 4. Pricing query (Must precede pure contact and hiring)
  if (analysis.isPricingQuery) {
    return (
      "Akash's pricing depends on the project's requirements, features, complexity, and timeline. Pricing is scoped transparently based on your project goals.\n\n" +
      "**Services Offered:**\n" +
      "- **Full-Stack Web Applications**: Scalable apps built with React, Node.js, Express, and MongoDB\n" +
      "- **Creative Web & 3D Interactive**: 3D graphics, shaders, and animations using Three.js and WebGL\n" +
      "- **AI & Smart Integrations**: Production RAG architectures, LLM pipelines, and AI assistants\n" +
      "- **UI/UX Modernization**: High-performance refactoring and responsive design\n\n" +
      "To discuss your requirements and get an accurate quote, please contact Akash directly at **akashkumarhzb121@gmail.com** or send a message via the portfolio contact form."
    );
  }

  // 5. Named Project Query or Context Follow-up (e.g. RapidCare)
  if (analysis.namedProjectSlug) {
    const slug = analysis.namedProjectSlug;
    const lower = message.toLowerCase();

    if (slug === 'rapidcare') {
      if (lower.includes('technolog') || lower.includes('tech') || lower.includes('stack') || lower.includes('used') || lower.includes('built with')) {
        return (
          "Technologies used in **RapidCare**:\n\n" +
          "- **Frontend**: React, Tailwind CSS\n" +
          "- **Backend**: Node.js, Express.js\n" +
          "- **Database**: MongoDB\n" +
          "- **Real-Time Communication**: Socket.IO (for live emergency tracking and dispatch coordination)\n" +
          "- **AI Integration**: Groq AI (for automated triage protocol matching)\n" +
          "- **Authentication**: JWT (JSON Web Tokens)\n\n" +
          "Live Demo: [RapidCare Demo](https://rapidcare.vercel.app) | [GitHub Repository](https://github.com/akashkumarhzb121-cloud/rapidcare)"
        );
      }

      if (lower.includes('similar') || lower.includes('can akash build') || lower.includes('build something similar')) {
        return (
          "Yes, absolutely! Akash specializes in engineering scalable full-stack applications and real-time systems similar to RapidCare, incorporating role-based dashboards, automated workflows, and AI assistance.\n\n" +
          "To discuss building a custom solution, reach out to Akash at **akashkumarhzb121@gmail.com** or send a message through the contact form."
        );
      }

      if (lower.includes('problem') || lower.includes('solve')) {
        return (
          "**RapidCare** solves critical inefficiencies in emergency response workflows:\n\n" +
          "- **Problem**: Delayed patient triage, lack of real-time ambulance dispatch visibility, and disconnected bed allocation.\n" +
          "- **Solution**: RapidCare provides automated AI clinical triage assessment, real-time vehicle dispatch tracking via Socket.IO, and live bed reservation to eliminate waiting bottlenecks during medical emergencies."
        );
      }

      if (lower.includes('deployed') || lower.includes('live')) {
        return (
          "Yes, RapidCare is deployed and live! You can test the platform at [RapidCare Live](https://rapidcare.vercel.app) or explore the source code on [GitHub](https://github.com/akashkumarhzb121-cloud/rapidcare)."
        );
      }

      return (
        "**RapidCare** is an AI-driven clinical triage and emergency care continuity network developed by Akash Kumar.\n\n" +
        "- **Core Features**: Automated medical triage matching, real-time ambulance dispatch coordination via Socket.IO, and seamless bed reservation.\n" +
        "- **Tech Stack**: React, Node.js, Express, MongoDB, Socket.IO, Groq AI, and JWT.\n" +
        "- **Links**: [Live Demo](https://rapidcare.vercel.app) | [GitHub Repo](https://github.com/akashkumarhzb121-cloud/rapidcare)"
      );
    }
  }

  // 6. Pure contact query
  if (analysis.isPureContactQuery) {
    return (
      "You can reach Akash Kumar directly through several channels:\n\n" +
      "- **Email**: [akashkumarhzb121@gmail.com](mailto:akashkumarhzb121@gmail.com)\n" +
      "- **LinkedIn**: [Akash Kumar on LinkedIn](https://www.linkedin.com/in/akash-kumar-488074309)\n" +
      "- **GitHub**: [github.com/akashkumarhzb121-cloud](https://github.com/akashkumarhzb121-cloud)\n" +
      "- **Location**: India (open for remote work globally)\n" +
      "- **Response Time**: Typically within 24 hours\n\n" +
      "You can also send a direct enquiry using the interactive contact form on this portfolio."
    );
  }

  // 7. DSA query (Must precede general skills)
  if (analysis.isDSAQuery) {
    return (
      "Akash Kumar has a strong problem-solving foundation in Data Structures and Algorithms:\n\n" +
      "- **Languages Used**: C++, Java, JavaScript\n" +
      "- **Topics**: Arrays, Two Pointers, Trees, Graphs, Dynamic Programming, Recursion, Binary Search\n" +
      "- **Platforms**: Active practice on LeetCode, GeeksforGeeks, and CodeChef\n\n" +
      "He applies algorithmic efficiency to optimize web performance, system state management, and database query design."
    );
  }

  // 8. General technical questions (e.g. "What is React?", "What is Node.js?")
  if (analysis.isGeneralQuestion && analysis.detectedTechnologies.length > 0) {
    const tech = analysis.detectedTechnologies[0];
    let techExplanation = `${tech} is a core technology commonly used in modern web development.`;

    if (tech.toLowerCase().includes('react')) {
      techExplanation = "React is an open-source JavaScript library developed by Meta for building dynamic, component-driven user interfaces. It uses a virtual DOM for efficient updates and a declarative paradigm that makes UI state predictable and manageable.";
    } else if (tech.toLowerCase().includes('node')) {
      techExplanation = "Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 engine that allows developers to run JavaScript on the server side using an asynchronous, event-driven I/O model.";
    } else if (tech.toLowerCase().includes('mongo')) {
      techExplanation = "MongoDB is a popular open-source NoSQL document database that stores data in flexible, JSON-like BSON documents, providing high scalability, flexible schema design, and powerful indexing.";
    } else if (tech.toLowerCase().includes('jwt')) {
      techExplanation = "JWT (JSON Web Token) is an open standard (RFC 7519) for securely transmitting information between parties as a compact, self-contained JSON object, commonly used for stateless authentication and authorization in modern REST APIs.";
    }

    return (
      `${techExplanation}\n\n` +
      `Akash Kumar actively leverages **${tech}** across multiple production projects in his full-stack portfolio, including RapidCare and Modplint Interiors.`
    );
  }

  // 9. Job / Internship / Availability query
  if (analysis.isJobQuery || analysis.isInternshipQuery || analysis.isAvailabilityQuery) {
    return (
      "Yes! Akash is actively open to new engineering opportunities:\n\n" +
      "- **Roles**: Software Development Engineer (SDE) full-time roles, engineering internships, and high-impact freelance projects\n" +
      "- **Work Arrangements**: Open to remote, hybrid, or on-site arrangements\n" +
      "- **Core Focus**: Scalable full-stack systems, creative frontend development, and modern web architectures\n\n" +
      "To schedule an interview, discuss a role, or send a job opportunity, you can reach Akash directly at **akashkumarhzb121@gmail.com** or connect on [LinkedIn](https://www.linkedin.com/in/akash-kumar-488074309)."
    );
  }

  // 10. General project list query (Must precede profile and skills)
  if (analysis.isGeneralProjectListQuery) {
    return (
      "Here is the complete list of Akash Kumar's **11 documented projects**:\n\n" +
      "1. **RapidCare**: AI-driven clinical triage & emergency dispatch network with real-time Socket.IO ambulance tracking.\n" +
      "2. **Modplint Interiors**: Production commercial interior design web platform with consultation scheduling and media gallery.\n" +
      "3. **MERN Docs**: Full-stack developer documentation portal with versioned markdown management.\n" +
      "4. **Student Management System**: Enterprise student portal with role-based access control and analytics.\n" +
      "5. **Creative Portfolio & Digital Experience**: Modern portfolio with WebGL shaders, Three.js physics, and smooth Lenis scrolling.\n" +
      "6. **Netflix Clone**: Video streaming UI with TMDB API integration and responsive previews.\n" +
      "7. **Dribbble Clone**: Creative designer community showcase platform with media feeds.\n" +
      "8. **Kanban Board**: Drag-and-drop task management workflow with state persistence.\n" +
      "9. **Premier**: High-conversion landing page with modern typography and motion.\n" +
      "10. **Rock Paper Scissors**: Interactive game featuring score persistence and physics.\n" +
      "11. **Sharma Interior**: Digital studio showcase and consultation catalog for interior architecture.\n\n" +
      "Ask me about any specific project for details on its architecture and live demo!"
    );
  }

  // 11. Skills / Tech stack query
  if (analysis.isSkillsQuery) {
    const lower = message.toLowerCase();
    if (lower.includes('backend')) {
      return (
        "Akash Kumar's backend engineering expertise:\n\n" +
        "- **Core Runtime & Frameworks**: Node.js, Express.js\n" +
        "- **APIs & Protocols**: RESTful APIs, WebSockets (Socket.IO), JWT Authentication & RBAC\n" +
        "- **Databases**: MongoDB Atlas, Mongoose, Redis caching\n" +
        "- **Deployment**: Render, Vercel, Docker basics, automated CI/CD probes\n\n" +
        "He has engineered backend services for production apps like RapidCare, Modplint Interiors, and MERN Docs."
      );
    }

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

  // 12. Education query
  if (analysis.isEducationQuery) {
    return (
      "Akash Kumar's educational background:\n\n" +
      "- **Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering\n" +
      "- **Institution**: RTU, GIT (Global Institute of Technology), Jaipur\n" +
      "- **Core Focus**: Data Structures & Algorithms, Object-Oriented Programming (OOP), Database Management Systems (DBMS), Operating Systems, System Design."
    );
  }

  // 13. Hiring / Services query
  if (analysis.isHiringQuery || analysis.isServicesQuery || analysis.isFreelanceQuery) {
    return (
      "Yes — Akash is open to software development opportunities and client project work!\n\n" +
      "**Services Available:**\n" +
      "- **Full-Stack Web Applications**: Production systems built with React, Node.js, Express, and MongoDB\n" +
      "- **Creative Web & 3D Interactive**: High-performance 3D graphics and WebGL experiences with Three.js\n" +
      "- **AI & LLM Integrations**: RAG pipelines, chatbots, and smart assistant integrations\n" +
      "- **UI/UX Modernization**: Responsive layouts, performance optimization, and sleek interfaces\n\n" +
      "**How to Work Together:**\n" +
      "1. Reach out with your project ideas, requirements, or timeline.\n" +
      "2. Akash will discuss architecture, milestones, and provide a transparent estimate.\n" +
      "3. Send an email to **akashkumarhzb121@gmail.com** or submit an enquiry through the contact form below!"
    );
  }

  // 14. Fallback with retrieved chunks
  if (chunks.length === 0) {
    return (
      "I'm SKY AI, Akash Kumar's portfolio assistant. I don't have that specific detail in my knowledge base, " +
      "but feel free to reach out to Akash directly at akashkumarhzb121@gmail.com or submit an enquiry below!"
    );
  }

  const primary = chunks[0];
  const secondary = chunks[1];

  let cleanPrimary = primary.content
    .replace(/^Name:\s*.+$/gm, '')
    .replace(/^Title:\s*.+$/gm, '')
    .trim();

  let answer = `**${primary.title}**\n\n${cleanPrimary.slice(0, 600)}`;

  if (secondary && secondary.title !== primary.title) {
    let cleanSecondary = secondary.content
      .replace(/^Name:\s*.+$/gm, '')
      .replace(/^Title:\s*.+$/gm, '')
      .trim();
    answer += `\n\n**${secondary.title}**\n\n${cleanSecondary.slice(0, 400)}`;
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
  const {
    message,
    conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    history = []
  } = options;

  // 1. Classify query intent deterministically using conversation history
  const analysis = classifyQueryIntent(message, history);

  // 1b. Gibberish / Nonsense detection: instant friendly clarification, zero RAG, sources: []
  if (analysis.isGibberishQuery) {
    const answer = generateContextualFallbackAnswer(message, [], analysis);
    const suggestedQuestions = [
      "What technologies does Akash know?",
      "Tell me about Akash's projects",
      "How can I contact Akash?"
    ];

    try {
      const userMsg: IChatMessage = { role: 'user', content: message, timestamp: new Date() };
      const assistantMsg: IChatMessage = { role: 'assistant', content: answer, timestamp: new Date() };

      void Conversation.findOneAndUpdate(
        { conversationId },
        {
          $push: {
            messages: {
              $each: [userMsg, assistantMsg],
              $slice: -20
            }
          }
        },
        { upsert: true, returnDocument: 'after' }
      ).catch(() => {});
    } catch {}

    return {
      answer,
      sources: [],
      suggestedQuestions,
      conversationId
    };
  }

  // 2. Greetings and Capabilities: instant conversational response, zero RAG, sources: []
  if (analysis.isGreetingQuery || analysis.isCapabilitiesQuery) {
    const answer = generateContextualFallbackAnswer(message, [], analysis);
    const suggestedQuestions = deriveSuggestedQuestions(analysis);

    // Persist conversation history asynchronously
    try {
      const userMsg: IChatMessage = { role: 'user', content: message, timestamp: new Date() };
      const assistantMsg: IChatMessage = { role: 'assistant', content: answer, timestamp: new Date() };

      void Conversation.findOneAndUpdate(
        { conversationId },
        {
          $push: {
            messages: {
              $each: [userMsg, assistantMsg],
              $slice: -20
            }
          }
        },
        { upsert: true, returnDocument: 'after' }
      ).catch(() => {});
    } catch {}

    return {
      answer,
      sources: [],
      suggestedQuestions,
      conversationId
    };
  }

  const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

  // 3. For casual queries without substantive information requests: bypass retrieval, sources: []
  if (analysis.isCasualQuery) {
    let answer = '';
    if (chatClient && env.AI_API_KEY && !isTestEnv) {
      try {
        const systemPrompt = buildSystemPrompt({ retrievedContext: '' });
        const boundedHistory = history.slice(-4);
        answer = await callChatCompletion(chatClient, {
          messages: [
            { role: 'system', content: systemPrompt },
            ...boundedHistory.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
          ],
          temperature: 0.5,
          max_tokens: 300
        });
      } catch {
        answer = generateContextualFallbackAnswer(message, [], analysis);
      }
    } else {
      answer = generateContextualFallbackAnswer(message, [], analysis);
    }

    const suggestedQuestions = deriveSuggestedQuestions(analysis);
    return {
      answer,
      sources: [],
      suggestedQuestions,
      conversationId
    };
  }

  // 4. Structured Knowledge Query Detection (akash.json routing & exact operations)
  const structuredPlan = detectStructuredQuery(message, analysis);
  if (structuredPlan) {
    const structuredResult = executeStructuredQuery(structuredPlan);
    if (structuredResult.handled) {
      let answer = '';
      if (chatClient && env.AI_API_KEY && !isTestEnv) {
        try {
          const systemPrompt = buildSystemPrompt({ retrievedContext: structuredResult.text });
          const boundedHistory = history.slice(-4);
          answer = await callChatCompletion(chatClient, {
            messages: [
              { role: 'system', content: systemPrompt },
              ...boundedHistory.map((h) => ({ role: h.role, content: h.content })),
              { role: 'user', content: message }
            ],
            temperature: 0.3,
            max_tokens: 600
          });
        } catch {
          answer = structuredResult.text;
        }
      } else {
        answer = structuredResult.text;
      }

      const suggestedQuestions =
        structuredResult.suggestedQuestions || deriveSuggestedQuestions(analysis);

      // Persist conversation
      try {
        const userMsg: IChatMessage = { role: 'user', content: message, timestamp: new Date() };
        const assistantMsg: IChatMessage = { role: 'assistant', content: answer, timestamp: new Date() };
        void Conversation.findOneAndUpdate(
          { conversationId },
          { $push: { messages: { $each: [userMsg, assistantMsg], $slice: -20 } } },
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      } catch {}

      return {
        answer,
        sources: structuredResult.sources,
        suggestedQuestions,
        conversationId
      };
    }
  }

  // 5. Generate query embedding & retrieve relevant knowledge chunks
  let queryVector: number[] | undefined;
  try {
    queryVector = await getEmbedding(message);
  } catch (err) {
    console.warn('⚠️ Could not generate embedding for query:', err);
  }

  const retrievedChunks = await searchKnowledge(message, queryVector, 5, undefined, analysis, history);

  // 5. Prepare context string from retrieved chunks
  const contextString = retrievedChunks
    .map((c, idx) => `[Document ${idx + 1}: ${c.title} (${c.sourceType})]\n${c.content}`)
    .join('\n\n---\n\n');

  // 6. Prepare system prompt
  const systemPrompt = buildSystemPrompt({ retrievedContext: contextString });

  // 7. Construct messages payload with bounded history (last 6 messages max)
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

  // 8. Call LLM provider or fallback
  if (chatClient && env.AI_API_KEY && !isTestEnv) {
    try {
      answer = await callChatCompletion(chatClient, {
        messages: messagesPayload,
        temperature: 0.3,
        max_tokens: 800
      });
    } catch (err: any) {
      console.error('❌ LLM generation call failed:', err?.message || err);
      answer = generateContextualFallbackAnswer(message, retrievedChunks, analysis);
    }
  } else {
    answer = generateContextualFallbackAnswer(message, retrievedChunks, analysis);
  }

  // 9. Format and filter source citations returned to the frontend
  let filteredChunks = retrievedChunks;

  if (analysis.isPureContactQuery) {
    filteredChunks = filteredChunks.filter((c) => c.sourceType === 'contact' || c.sourceType === 'faq');
  } else if (analysis.isPricingQuery) {
    filteredChunks = filteredChunks.filter((c) => c.sourceType === 'faq' || c.sourceType === 'services' || c.sourceType === 'contact');
  } else if (analysis.isJobQuery || analysis.isInternshipQuery || analysis.isAvailabilityQuery) {
    filteredChunks = filteredChunks.filter((c) => c.sourceType !== 'project');
  } else if (analysis.namedProjectSlug) {
    filteredChunks = filteredChunks.filter(
      (c) =>
        c.projectSlug === analysis.namedProjectSlug ||
        c.chunkId.includes(analysis.namedProjectSlug!) ||
        c.sourceType !== 'project'
    );
  } else if (analysis.isSkillsQuery) {
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

  const uniqueSources = sources
    .filter((src, index, self) => index === self.findIndex((s) => s.title === src.title))
    .slice(0, 4);

  // 10. Dynamic suggested questions
  const suggestedQuestions = deriveSuggestedQuestions(analysis);

  // 11. Persist conversation history asynchronously
  try {
    const userMsg: IChatMessage = { role: 'user', content: message, timestamp: new Date() };
    const assistantMsg: IChatMessage = { role: 'assistant', content: answer, timestamp: new Date() };

    void Conversation.findOneAndUpdate(
      { conversationId },
      {
        $push: {
          messages: {
            $each: [userMsg, assistantMsg],
            $slice: -20
          }
        }
      },
      { upsert: true, returnDocument: 'after' }
    ).catch(() => {});
  } catch {}

  return {
    answer,
    sources: uniqueSources,
    suggestedQuestions,
    conversationId
  };
}
