import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import ChatWindow, { type ChatMessageData } from './ChatWindow';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string>(() => {
    return `sky_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Light dismiss on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        chatContainerRef.current &&
        !chatContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Resolve chat endpoint with automatic fallback
  const getChatEndpoint = (): string => {
    const explicit = import.meta.env.VITE_AI_CHAT_ENDPOINT;
    if (explicit) return explicit;

    const contactEndpoint =
      import.meta.env.VITE_CONTACT_FORM_ENDPOINT ||
      'https://portfolio-5aso.onrender.com/api/contact';

    // Replace /contact with /ai/chat or append /api/ai/chat
    if (contactEndpoint.includes('/api/contact')) {
      return contactEndpoint.replace(/\/api\/contact\/?$/, '/api/ai/chat');
    }
    if (contactEndpoint.endsWith('/contact')) {
      return contactEndpoint.replace(/\/contact\/?$/, '/ai/chat');
    }
    return `${contactEndpoint.replace(/\/+$/, '')}/api/ai/chat`;
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessageData = {
        id: `msg_${Date.now()}_u`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const endpoint = getChatEndpoint();
        const historyPayload = messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content
        }));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            message: text.trim(),
            conversationId,
            history: historyPayload
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(
              'You have sent too many requests. Please wait a few moments before asking another question.'
            );
          }
          const errData = await response.json().catch(() => null);
          throw new Error(
            errData?.message || `Server responded with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMessage: ChatMessageData = {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content:
            data.answer ||
            "I couldn't generate a response right now. Please try again or reach out to Akash directly.",
          sources: data.sources || [],
          timestamp: new Date()
        };

        setMessages((prev) => [...prev, assistantMessage]);
        if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
          setSuggestedQuestions(data.suggestedQuestions);
        }
      } catch (err: any) {
        console.error('SKY AI chat query error:', err);
        setError(
          err?.message ||
            'Unable to communicate with SKY AI right now. Please check your network or try again shortly.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, messages]
  );

  const handleClearHistory = () => {
    setMessages([]);
    setError(null);
    setSuggestedQuestions([]);
    setConversationId(`sky_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleOpenContact = () => {
    setIsOpen(false);
    const contactElem = document.getElementById('contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={chatContainerRef} className="ai-assistant-wrapper">
      {/* 1. Chat Dialog Window */}
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={handleSendMessage}
        onClearHistory={handleClearHistory}
        suggestedQuestions={suggestedQuestions}
        onOpenContact={handleOpenContact}
      />

      {/* 2. Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close SKY AI assistant' : 'Open SKY AI assistant'}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-zinc-950/90 to-zinc-900/90 border border-zinc-700/80 hover:border-[#67E8F9] text-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.7),0_0_20px_rgba(103,232,249,0.25)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(103,232,249,0.45)] backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer"
        >
          {/* Subtle animated border glow */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#67E8F9]/20 via-[#A78BFA]/20 to-[#67E8F9]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />

          {isOpen ? (
            <X className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#67E8F9] group-hover:scale-110 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-xs font-mono font-medium tracking-wide text-zinc-200 group-hover:text-white">
                Ask <span className="text-[#67E8F9] font-bold">SKY AI</span>
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] opacity-80 group-hover:rotate-12 transition-transform duration-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
