import type { ReactNode } from 'react';
import { Bot, User, ExternalLink, ArrowRight } from 'lucide-react';

export interface ChatSource {
  title: string;
  type: string;
  url?: string;
}

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
  sources?: ChatSource[];
  onOpenContact?: () => void;
}

/**
 * Lightweight safe markdown renderer for chat messages
 */
function renderFormattedContent(text: string) {
  // Split lines
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Check if line is a bullet item
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ');
    const cleanedLine = isBullet ? line.trim().replace(/^[-•*]\s+/, '') : line;

    // Process inline tokens: links, bold, code
    const parts: ReactNode[] = [];
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(cleanedLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(cleanedLine.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('[') && token.includes('](')) {
        const linkText = token.substring(1, token.indexOf(']('));
        const linkUrl = token.substring(token.indexOf('](') + 2, token.length - 1);
        parts.push(
          <a
            key={`link-${lineIdx}-${match.index}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#67E8F9] hover:text-[#A78BFA] underline underline-offset-2 font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            {linkText}
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />
          </a>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`bold-${lineIdx}-${match.index}`} className="text-zinc-100 font-semibold">
            {token.substring(2, token.length - 2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={`code-${lineIdx}-${match.index}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-800 text-[#67E8F9] font-mono text-[11px]"
          >
            {token.substring(1, token.length - 1)}
          </code>
        );
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < cleanedLine.length) {
      parts.push(cleanedLine.substring(lastIndex));
    }

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc text-zinc-300 my-0.5">
          {parts}
        </li>
      );
    }

    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }

    return (
      <p key={lineIdx} className="my-0.5 leading-relaxed">
        {parts}
      </p>
    );
  });
}

export default function ChatMessage({
  role,
  content,
  timestamp,
  sources,
  onOpenContact
}: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  // Check if content suggests hiring or getting in touch
  const isHiringOrContact =
    isAssistant &&
    (content.toLowerCase().includes('reach out directly') ||
      content.toLowerCase().includes('akashkumarhzb121@gmail.com') ||
      content.toLowerCase().includes('contact section') ||
      content.toLowerCase().includes('hire akash'));

  return (
    <div
      className={`flex gap-3 w-full my-2 text-sm ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#67E8F9]/20 to-[#A78BFA]/20 border border-[#67E8F9]/40 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(103,232,249,0.15)]">
          <Bot className="w-4 h-4 text-[#67E8F9]" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl p-3.5 ${
          isAssistant
            ? 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/80 shadow-md backdrop-blur-sm'
            : 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm ml-auto'
        }`}
      >
        <div className="space-y-1">{renderFormattedContent(content)}</div>

        {/* Source citation chips */}
        {isAssistant && sources && sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 mr-1">
              Sources:
            </span>
            {sources.map((src, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
              >
                <span>{src.title}</span>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#67E8F9] hover:text-[#A78BFA]"
                    title="Open link"
                  >
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Quick action button for hiring / consultation */}
        {isHiringOrContact && onOpenContact && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#67E8F9]/10 to-[#A78BFA]/10 border border-[#67E8F9]/30 text-[#67E8F9] hover:text-white hover:border-[#67E8F9] transition-all duration-200 active:scale-95"
            >
              <span>Connect with Akash</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {timestamp && (
          <span className="text-[10px] text-zinc-500 block text-right mt-1 font-mono">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {!isAssistant && (
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
