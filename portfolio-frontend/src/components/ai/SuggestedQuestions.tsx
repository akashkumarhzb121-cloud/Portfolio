interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export default function SuggestedQuestions({
  questions,
  onSelectQuestion,
  disabled = false
}: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 pt-2 pb-1">
      <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-zinc-400">
        <span>Suggested questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(q)}
            className="text-left text-xs px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 hover:border-[#67E8F9]/50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
