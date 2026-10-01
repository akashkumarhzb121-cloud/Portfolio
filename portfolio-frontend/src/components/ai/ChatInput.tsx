import { useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function ChatInput({
  input,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Ask SKY AI anything about Akash, projects, or services...'
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height up to 120px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isLoading && input.trim()) {
          onSend();
        }
      }}
      className="relative flex items-end gap-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 focus-within:border-[#67E8F9]/60 focus-within:ring-1 focus-within:ring-[#67E8F9]/40 transition-all duration-200"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        maxLength={2000}
        className="w-full bg-transparent resize-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 py-1 px-1.5 min-h-[36px] max-h-[120px] leading-relaxed disabled:opacity-50"
      />

      <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="p-2 rounded-lg bg-gradient-to-r from-[#67E8F9] to-[#A78BFA] text-zinc-950 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
          ) : (
            <Send className="w-4 h-4 text-zinc-950" />
          )}
        </button>
      </div>
    </form>
  );
}
