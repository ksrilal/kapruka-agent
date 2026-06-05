import type { ReactNode } from "react";

// Renders a small subset of markdown: **bold**, *italic*, bullet lists, line breaks.
// Avoids a full react-markdown dependency for this contained use case.
export function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line — small gap
    if (!trimmed) {
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Bullet list item
    if (/^[-*•]\s+/.test(trimmed)) {
      nodes.push(
        <div key={key++} className="flex gap-2 leading-relaxed">
          <span className="mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--purple-light)" }} />
          <span>{inlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""), key++)}</span>
        </div>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s+/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)?.[1];
      nodes.push(
        <div key={key++} className="flex gap-2 leading-relaxed">
          <span className="shrink-0 font-semibold" style={{ color: "var(--purple-light)", minWidth: "1.2em" }}>{num}.</span>
          <span>{inlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""), key++)}</span>
        </div>
      );
      continue;
    }

    // Normal paragraph line
    nodes.push(<p key={key++} className="leading-relaxed">{inlineMarkdown(line, key++)}</p>);
  }

  return <>{nodes}</>;
}

// Handles **bold**, *italic*, `code` inline
function inlineMarkdown(text: string, baseKey: number): ReactNode {
  const parts: ReactNode[] = [];
  // Split on **bold**, *italic*, `code`
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = baseKey * 1000;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={idx++}>{text.slice(last, m.index)}</span>);
    if (m[2]) parts.push(<strong key={idx++} className="font-semibold text-foreground">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={idx++}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={idx++} className="rounded px-1 text-[13px]" style={{ background: "var(--surface-2)", color: "var(--purple-light)" }}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={idx++}>{text.slice(last)}</span>);

  return <>{parts}</>;
}
