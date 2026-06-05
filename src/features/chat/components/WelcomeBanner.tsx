"use client";

const SUGGESTIONS = [
  { icon: "🎂", label: "Birthday cake for Kandy" },
  { icon: "💐", label: "Flowers under LKR 2000" },
  { icon: "🎁", label: "Gift for my mum" },
  { icon: "📦", label: "Track order VIMP123" },
];

interface WelcomeBannerProps {
  onSend: (text: string) => void;
}

export function WelcomeBanner({ onSend }: WelcomeBannerProps) {
  return (
    <div className="mx-auto flex w-full max-w-(--chat-max) flex-col items-center gap-10 px-4 py-16 text-center animate-fade-up">
      {/* Hero text */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-label text-primary">Your personal concierge</div>
        <h1 className="text-display text-(--text-primary)">
          What are you<br />
          <span className="text-primary">looking for?</span>
        </h1>
        <p className="max-w-sm text-[15px] text-muted-foreground leading-relaxed">
          Find gifts, cakes, flowers, and anything else — delivered island-wide across Sri Lanka.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-2 gap-3 w-full sm:grid-cols-4 stagger">
        {SUGGESTIONS.map(({ icon, label }) => (
          <button
            key={label}
            onClick={() => onSend(`${icon} ${label}`)}
            className="animate-fade-up group flex flex-col items-start gap-2 rounded-2xl border border-border bg-(--surface) p-4 text-left shadow-(--shadow-xs) transition-all hover:border-primary/40 hover:shadow-(--shadow-md) hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-[13px] font-medium text-(--text-primary) leading-snug">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
