"use client";
import { useRef } from "react";
import { Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReadingPassage } from "@/lib/content-types";

/** Reading passage with text highlighting. Highlights live in the DOM only, so re-renders elsewhere never wipe them. */
export function Passage({ passage, highlight = true }: { passage: ReadingPassage; highlight?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const add = () => { const s = window.getSelection(); if (!s || s.isCollapsed || !ref.current) return; const r = s.getRangeAt(0); if (!ref.current.contains(r.commonAncestorContainer)) return; try { const m = document.createElement("mark"); r.surroundContents(m); s.removeAllRanges(); } catch { /* selection spans paragraphs */ } };
  const clear = () => ref.current?.querySelectorAll("mark").forEach((m) => m.replaceWith(...Array.from(m.childNodes)));
  const onClick = (e: React.MouseEvent) => { const m = (e.target as HTMLElement).closest("mark"); if (m && window.getSelection()?.isCollapsed) m.replaceWith(...Array.from(m.childNodes)); };
  return (
    <div>
      {highlight && <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Highlighter className="size-4" />Select text to highlight. Click a highlight to remove it.</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={add}>Highlight selection</Button><Button variant="outline" size="sm" onClick={clear}>Clear</Button></div></div>}
      {passage.diagram && <div className="mb-4 overflow-x-auto rounded-xl border"><table className="w-full text-sm"><caption className="px-3 py-2 text-left text-muted-foreground">{passage.diagram.caption}</caption><thead><tr>{passage.diagram.headers.map((h) => <th key={h} scope="col" className="bg-secondary px-3 py-2 text-left font-display">{h}</th>)}</tr></thead><tbody>{passage.diagram.rows.map((r) => <tr key={r[0]} className="border-t">{r.map((c, i) => <td key={i} className={i === 0 ? "px-3 py-2 font-bold text-muted-foreground" : "px-3 py-2"}>{c}</td>)}</tr>)}</tbody></table></div>}
      <div ref={ref} className="passage space-y-3" onMouseUp={() => highlight && setTimeout(add, 10)} onClick={onClick} data-testid="passage">
        {passage.paragraphs.map((p, i) => {
          if (passage.labeled) { const m = p.match(/^([A-D])\. (.*)$/); if (m) return <p key={i}><b className="mr-2 font-display text-purple">{m[1]}</b>{m[2]}</p>; }
          if (passage.diagram) return <p key={i}>{p.split(/(__\d__)/).map((part, k) => /^__\d__$/.test(part) ? <span key={k} className="mx-0.5 rounded-md bg-blue/15 px-2 font-extrabold text-blue">{part.replace(/_/g, "")}</span> : part)}</p>;
          return <p key={i} className={i === 0 && p.startsWith("Subject:") ? "font-bold" : undefined}>{p}</p>;
        })}
      </div>
      {passage.comment && <div className="passage mt-4 rounded-xl border bg-secondary/50 p-4">{passage.comment}</div>}
    </div>
  );
}
