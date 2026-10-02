import { useState, useRef, useEffect } from 'react';
import { Bot, X, Trash2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import ChatMessage, { type ChatSource } from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageData[];
  isLoading: boolean;
  error?: string | null;
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  suggestedQuestions: string[];
  onOpenContact?: () => void;
  onOpenAdminHistory?: () => void;
}

export default function ChatWindow({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearHistory,
  suggestedQuestions,
  onOpenContact,
  onOpenAdminHistory
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on message or loading state change
  useEffect(() => {
    const messagesList = messagesListRef.current;
    if (isOpen && messagesList) {
      messagesList.scrollTo({ top: messagesList.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    onSendMessage(msg);
  };

  const handleSelectSuggested = (q: string) => {
    onSendMessage(q);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SKY AI Assistant"
      className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[calc(100vh-6.5rem)] flex flex-col rounded-2xl border border-zinc-800/90 bg-[#0a0a0f]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(103,232,249,0.1)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* 1. Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#67E8F9]/20 to-[#A78BFA]/20 border border-[#67E8F9]/40 flex items-center justify-center shadow-[0_0_12px_rgba(103,232,249,0.2)]">
            <Bot className="w-4 h-4 text-[#67E8F9]" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
              title={isLoading ? 'Thinking...' : 'Ready'}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-zinc-100 tracking-wide font-mono">
                SKY AI
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#67E8F9]/10 text-[#67E8F9] border border-[#67E8F9]/20">
                RAG 2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Portfolio & Client Questions</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenAdminHistory && (
            <button
              type="button"
              onClick={onOpenAdminHistory}
              title="Admin: View conversation history"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-[#67E8F9] hover:bg-zinc-800/60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              title="Clear chat"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close chat"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Container */}
      <div
        ref={messagesListRef}
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-[#67E8F9]" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-semibold text-base">
                Welcome to SKY AI
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
                I’m trained on Akash’s verified projects, technical stack, services, and credentials.
              </p>
            </div>

            <div className="w-full pt-2">
              <SuggestedQuestions
                questions={[
                  'Tell me about RapidCare platform',
                  'What services does Akash provide?',
                  'What is Akash’s tech stack?',
                  'How do I hire Akash for a project?'
                ]}
                onSelectQuestion={handleSelectSuggested}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                timestamp={m.timestamp}
                sources={m.sources}
                onOpenContact={onOpenContact}
              />
            ))}

            {isLoading && (
              <div className="flex gap-3 w-full my-2 text-sm justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#67E8F9]/20 to-[#A78BFA]/20 border border-[#67E8F9]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[#67E8F9]" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-zinc-900/90 border border-zinc-800 text-zinc-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#67E8F9] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#67E8F9] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#67E8F9] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs my-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {!isLoading && suggestedQuestions.length > 0 && (
              <SuggestedQuestions
                questions={suggestedQuestions}
                onSelectQuestion={handleSelectSuggested}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </div>

      {/* 3. Input & Footer */}
      <div className="shrink-0 p-3 border-t border-zinc-800/80 bg-zinc-950/80">
        <ChatInput
          input={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
        />
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 px-1 font-mono">
          <span>Grounded on Akash’s verified records</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
