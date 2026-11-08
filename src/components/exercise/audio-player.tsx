"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, mmss, wordCount } from "@/lib/utils";
import type { ListeningScript } from "@/lib/content-types";

const lineSec = (t: string, rate: number) => wordCount(t) / 2.55 / rate + 0.35;
const FEMALE = /female|samantha|victoria|karen|moira|tessa|zira|aria|jenny|susan|allison|ava|serena|fiona|libby|sonia|natasha|clara/i;
const MALE = /male|daniel|alex|fred|david|mark|guy|ryan|thomas|george|oliver|aaron|liam/i;

/** Plays exercise audio with the HTML5 Audio API when an audio file exists, otherwise voices the script with
 *  the browser's speech engine (one voice per speaker where available). Enforces the play limit. */
export function AudioPlayer({ script, audioUrl, maxPlays, exam, rate = 1, onEnded, autoStart }: { script: ListeningScript; audioUrl?: string | null; maxPlays: number; exam?: boolean; rate?: number; onEnded?: () => void; autoStart?: boolean }) {
  const [plays, setPlays] = useState(0); const [playing, setPlaying] = useState(false); const [elapsed, setElapsed] = useState(0); const [line, setLine] = useState(-1); const [duration, setDuration] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null); const token = useRef(0); const lineIdx = useRef(0); const lineStart = useRef(0); const ended = useRef(onEnded); ended.current = onEnded;
  const tts = !audioUrl; const supported = !tts || (typeof window !== "undefined" && "speechSynthesis" in window);
  const total = tts ? script.lines.reduce((n, l) => n + lineSec(l[1], rate), 0) : duration;

  useEffect(() => { if (!tts) { const a = new Audio(audioUrl!); a.preload = "auto"; a.onloadedmetadata = () => setDuration(a.duration); a.ontimeupdate = () => setElapsed(a.currentTime); a.onended = () => { setPlaying(false); ended.current?.(); }; audio.current = a; return () => { a.pause(); }; } }, [audioUrl, tts]);
  useEffect(() => () => { token.current++; if (typeof window !== "undefined" && "speechSynthesis" in window) speechSynthesis.cancel(); }, []);
  useEffect(() => { if (!tts || !playing) return; const id = setInterval(() => { let s = 0; for (let i = 0; i < lineIdx.current; i++) s += lineSec(script.lines[i][1], rate); s += Math.min(lineSec(script.lines[lineIdx.current]?.[1] ?? "", rate), (Date.now() - lineStart.current) / 1000); setElapsed(s); }, 250); return () => clearInterval(id); }, [tts, playing, rate, script.lines]);

  const speakFrom = useCallback((from: number) => {
    const tok = ++token.current; speechSynthesis.cancel();
    const voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); const used = new Set<string>(); const cast: Record<string, SpeechSynthesisVoice | undefined> = {};
    const pool = [...voices.filter((v) => /en-CA/i.test(v.lang)), ...voices.filter((v) => !/en-CA/i.test(v.lang))];
    for (const [k, sp] of Object.entries(script.speakers)) { const hint = sp.voice === "m" ? MALE : FEMALE; const v = pool.find((x) => !used.has(x.name) && hint.test(x.name)) ?? pool.find((x) => !used.has(x.name)) ?? pool[0]; if (v) used.add(v.name); cast[k] = v; }
    const next = (i: number) => {
      if (tok !== token.current) return;
      if (i >= script.lines.length) { setPlaying(false); setLine(-1); setElapsed(total); ended.current?.(); return; }
      lineIdx.current = i; lineStart.current = Date.now(); setLine(i);
      const [k, text] = script.lines[i]; const u = new SpeechSynthesisUtterance(text); const v = cast[k]; if (v) u.voice = v; u.lang = v?.lang ?? "en-CA"; u.rate = rate; u.pitch = script.speakers[k]?.voice === "m" ? 0.9 : script.speakers[k]?.voice === "f2" ? 1.18 : 1.05;
      let done = false; const go = () => { if (done) return; done = true; clearTimeout(wd); setTimeout(() => next(i + 1), 280); };
      const wd = setTimeout(go, (lineSec(text, rate) * 1.8 + 3) * 1000); u.onend = go; u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") go(); };
      speechSynthesis.speak(u);
    };
    setTimeout(() => next(from), 60);
  }, [script, rate, total]);

  const start = () => { if (plays >= maxPlays) return; setPlays((p) => p + 1); setPlaying(true); setElapsed(0); if (tts) { lineIdx.current = 0; speakFrom(0); } else { audio.current!.currentTime = 0; void audio.current!.play(); } };
  const toggle = () => {
    if (playing) { if (exam) return; setPlaying(false); if (tts) { token.current++; speechSynthesis.cancel(); } else audio.current!.pause(); return; }
    if (plays === 0 || (tts ? lineIdx.current === 0 && elapsed === 0 : false)) return start();
    if (!exam) { setPlaying(true); if (tts) speakFrom(lineIdx.current); else void audio.current!.play(); }
  };
  const startRef = useRef(start); startRef.current = start;
  useEffect(() => { if (!autoStart || !supported) return; const t = setTimeout(() => startRef.current(), 700); return () => clearTimeout(t); }, [autoStart, supported]);

  const left = maxPlays - plays; const prog = total ? Math.min(1, elapsed / total) : 0;
  if (!supported) return <p className="rounded-xl bg-warning/15 p-3 text-sm">Your browser can’t play audio for this exercise. Try Chrome, Edge or Safari.</p>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">{Object.entries(script.speakers).map(([k, sp], i) => (
        <span key={k} className={cn("flex items-center gap-2 rounded-full border bg-secondary/60 py-1.5 pl-1.5 pr-3 text-sm font-bold transition", line >= 0 && script.lines[line]?.[0] === k && "border-cyan ring-2 ring-cyan/30")}>
          <span className="grid size-7 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: ["#6B4EF0", "#2F6BFF", "#13B5C6"][i % 3] }}>{sp.name[0]}</span>{sp.name}</span>))}</div>
      <div className="flex items-center gap-4">
        <button onClick={toggle} disabled={(exam && (playing || plays > 0)) || (!playing && left <= 0 && elapsed === 0) || (!playing && left <= 0 && prog >= 1)} aria-label={playing ? "Pause" : "Play"} className="grid size-[60px] shrink-0 place-items-center rounded-full text-white brand-gradient shadow-lg disabled:opacity-45" data-testid="play">
          {playing ? <Pause className="size-6 fill-current" /> : <Play className="ml-0.5 size-6 fill-current" />}</button>
        <div className="min-w-0 flex-1">
          <div className="flex h-10 items-center gap-[3px]" aria-hidden="true">{Array.from({ length: 56 }, (_, i) => <i key={i} className={cn("flex-1 rounded-sm bg-border transition-colors", i / 56 < prog && "bg-purple")} style={{ height: 14 + Math.round(Math.abs(Math.sin(i * 1.7) * 18 + Math.cos(i * 0.6) * 7)) }} />)}</div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>{mmss(elapsed)} / {mmss(total)}</span><span>{exam ? (playing ? "Playing once" : plays ? "Recording finished" : "Press play to begin") : `${left} play${left === 1 ? "" : "s"} left`}</span></div>
        </div>
      </div>
      {!exam && !playing && plays > 0 && left > 0 && <Button variant="outline" size="sm" onClick={start}><RotateCcw />Replay recording</Button>}
    </div>
  );
}
