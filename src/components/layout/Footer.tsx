import Link from "next/link";

const LINKS = [
  { label: "Q&A",              href: "/qa" },
  { label: "About",            href: "/about" },
  { label: "Privacy Policy",   href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer
      className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-5 pb-35 text-[12px]"
      style={{ color: "var(--ink-3)" }}
    >
      {LINKS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className="transition-colors hover:text-foreground"
        >
          {label}
        </Link>
      ))}
      <a
        href="https://www.kapruka.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        aria-label="Kapruka online shop"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        Kapruka
      </a>
    </footer>
  );
}
