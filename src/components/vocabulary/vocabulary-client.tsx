"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Check, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/toaster";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

export type Word = { id: string; word: string; pronunciation: string; partOfSpeech: string; category: string; difficulty: string; meaning: string; example: string; synonyms: string[]; antonyms: string[]; usage: string; status: "NEW" | "LEARNING" | "REVIEW" | "MASTERED"; due: boolean; preview: string[] };
const tone = (s: Word["status"]) => (s === "MASTERED" ? "success" : s === "REVIEW" ? "blue" : s === "LEARNING" ? "warning" : "default") as "success";
const label = (s: string) => s[0] + s.slice(1).toLowerCase();
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function speak(text: string) { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); const v = speechSynthesis.getVoices().find((x) => /en-CA/i.test(x.lang)) ?? speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang)); if (v) u.voice = v; u.rate = 0.9; speechSynthesis.speak(u); }
const Hear = ({ w, text }: { w: Word; text?: string }) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); speak(w.word); }}><Volume2 />{text ?? "Hear it"}</Button>;

function Flashcards({ words, onUpdate }: { words: Word[]; onUpdate: (id: string, s: Word["status"]) => void }) {
  const { showXp, toast } = useToast();
  const build = (extra = 0) => { const due = shuffle(words.filter((w) => w.due)); const fresh = words.filter((w) => w.status === "NEW").slice(0, Math.max(extra, due.length >= 10 ? 0 : 6)); return [...due, ...fresh].slice(0, 20).map((w) => w.id); };
  const [queue, setQueue] = useState<string[]>(() => build()); const [i, setI] = useState(0); const [flipped, setFlipped] = useState(false); const shown = useRef(Date.now());
  const w = words.find((x) => x.id === queue[i]);
  const grade = async (g: 0 | 1 | 2 | 3) => {
    if (!w) return; const secs = (Date.now() - shown.current) / 1000;
    try { const r = await api<{ status: Word["status"]; events: { xp: number; reason: string }[] }>("/api/vocabulary", { method: "POST", json: { wordId: w.id, grade: g, secondsOnCard: Math.min(600, secs) } }); onUpdate(w.id, r.status); showXp(r.events); } catch (e) { toast((e as Error).message, "error"); return; }
    if (g === 0) setQueue((q) => [...q, w.id]); setI((n) => n + 1); setFlipped(false); shown.current = Date.now();
  };
  if (!w) return <Card className="flex flex-col items-center gap-3 p-10 text-center"><Check className="size-10 text-purple" /><h2 className="text-xl font-bold">{queue.length ? "Session complete" : "You’re all caught up"}</h2><p className="text-muted-foreground">{queue.length ? `You reviewed ${queue.length} card${queue.length === 1 ? "" : "s"}.` : "No cards are due right now."}</p><Button onClick={() => { setQueue(build(5)); setI(0); }}>Learn 5 new words</Button></Card>;
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-3 text-center text-sm text-muted-foreground">Card {i + 1} of {queue.length}. {flipped ? "How well did you know it?" : "Recall the meaning, then tap the card to check."}</p>
      <div className="flip-scene cursor-pointer" onClick={() => setFlipped(!flipped)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(!flipped); } }} role="button" tabIndex={0} aria-label={`Flashcard for ${w.word}. ${flipped ? "Showing answer" : "Press to reveal"}`} data-testid="flashcard">
        <motion.div className="flip-card relative min-h-[300px]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.3, 0.7, 0.2, 1] }}>
          <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-3xl border bg-gradient-to-br from-card to-accent p-6 text-center shadow-xl"><div className="flex gap-1.5"><Badge variant={tone(w.status)}>{label(w.status)}</Badge><Badge>{w.category}</Badge><Badge variant="primary">{w.difficulty}</Badge></div><div className="font-display text-4xl font-extrabold">{w.word}</div><p className="text-muted-foreground">{w.partOfSpeech}</p><Hear w={w} /></div>
          <div className="flip-face absolute inset-0 flex flex-col gap-2.5 overflow-auto rounded-3xl border bg-card p-6 shadow-xl" style={{ transform: "rotateY(180deg)" }}><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{w.word}</h2><Hear w={w} text={w.pronunciation} /></div><p className="text-lg">{w.meaning}</p><p className="italic text-muted-foreground">“{w.example}”</p>{w.synonyms.length > 0 && <p className="text-sm"><b>Synonyms:</b> {w.synonyms.join(", ")}</p>}{w.antonyms.length > 0 && <p className="text-sm"><b>Antonyms:</b> {w.antonyms.join(", ")}</p>}<p className="text-sm text-muted-foreground"><b>Usage:</b> {w.usage}</p></div>
        </motion.div>
      </div>
      {flipped ? <div className="mt-4 grid grid-cols-4 gap-2">{(["Again", "Hard", "Good", "Easy"] as const).map((l, g) => <Button key={l} variant={g === 2 ? "default" : "outline"} className="h-auto flex-col gap-0 py-2" onClick={() => grade(g as 0 | 1 | 2 | 3)} data-testid={`grade-${g}`}>{l}<small className="font-normal opacity-75">{w.preview[g]}</small></Button>)}</div>
        : <div className="mt-4 text-center"><Button onClick={() => setFlipped(true)}>Show answer</Button></div>}
    </div>
  );
}

function Browse({ words }: { words: Word[] }) {
  const [q, setQ] = useState(""); const [cat, setCat] = useState("All"); const [st, setSt] = useState("All");
  const cats = ["All", ...Array.from(new Set(words.map((w) => w.category)))];
  const list = words.filter((w) => (cat === "All" || w.category === cat) && (st === "All" || w.status === st) && (!q || `${w.word} ${w.meaning}`.toLowerCase().includes(q.toLowerCase())));
  return <Card className="space-y-3 p-5">
    <div className="flex flex-wrap gap-2"><Input className="min-w-[200px] flex-1" type="search" placeholder="Search words or meanings" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vocabulary" /><Select className="w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">{cats.map((c) => <option key={c}>{c}</option>)}</Select><Select className="w-auto" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status">{["All", "NEW", "LEARNING", "REVIEW", "MASTERED"].map((s) => <option key={s} value={s}>{s === "All" ? "Any status" : label(s)}</option>)}</Select></div>
    {list.length ? list.map((w) => <details key={w.id} className="rounded-xl border"><summary className="flex cursor-pointer items-start justify-between gap-3 p-3"><span><b className="font-display text-lg">{w.word}</b> <span className="text-sm text-muted-foreground">{w.partOfSpeech}, {w.category}</span><br /><span className="text-sm text-muted-foreground">{w.meaning}</span></span><Badge variant={tone(w.status)}>{label(w.status)}</Badge></summary><div className="space-y-1.5 px-3 pb-3"><div className="flex gap-2"><Hear w={w} text={w.pronunciation} /><Badge variant="primary">{w.difficulty}</Badge></div><p className="italic text-muted-foreground">“{w.example}”</p>{w.synonyms.length > 0 && <p className="text-sm"><b>Synonyms:</b> {w.synonyms.join(", ")}</p>}<p className="text-sm text-muted-foreground"><b>Common usage:</b> {w.usage}</p></div></details>)
      : <p className="py-8 text-center text-muted-foreground">No words match. Try a different filter.</p>}
  </Card>;
}

type QuizQ = { q: string; o: string[]; a: number; e: string };
function makeQuiz(words: Word[]): QuizQ[] {
  const qs: QuizQ[] = [];
  for (const w of shuffle(words)) {
    if (qs.length >= 8) break; const others = shuffle(words.filter((x) => x.id !== w.id)); const type = qs.length % 3;
    if (type === 0) { const o = shuffle([w.word, ...others.slice(0, 3).map((x) => x.word)]); qs.push({ q: `Which word or phrase means: “${w.meaning}”`, o, a: o.indexOf(w.word), e: `${w.word}: ${w.example}` }); }
    else if (type === 1) { const at = w.example.toLowerCase().indexOf(w.word.toLowerCase()); if (at < 0) continue; const blank = w.example.slice(0, at) + "_____" + w.example.slice(at + w.word.length); const o = shuffle([w.word, ...others.slice(0, 3).map((x) => x.word)]); qs.push({ q: `Complete the sentence: “${blank}”`, o, a: o.indexOf(w.word), e: `“${w.example}”` }); }
    else { if (!w.synonyms.length) continue; const wrong = others.filter((x) => x.synonyms.length && !w.synonyms.includes(x.synonyms[0])).slice(0, 3).map((x) => x.synonyms[0]); if (wrong.length < 3) continue; const o = shuffle([w.synonyms[0], ...wrong]); qs.push({ q: `Which is closest in meaning to “${w.word}”?`, o, a: o.indexOf(w.synonyms[0]), e: `${w.word} ≈ ${w.synonyms.join(", ")}. ${w.meaning}` }); }
  }
  return qs;
}
function Quiz({ words }: { words: Word[] }) {
  const { showXp } = useToast(); const [qs, setQs] = useState<QuizQ[] | null>(null); const [i, setI] = useState(0); const [ans, setAns] = useState<number[]>([]); const start = useRef(0);
  const next = async () => { const n = i + 1; setI(n); if (n >= qs!.length) { const sc = ans.filter((a, k) => a === qs![k].a).length; try { const r = await api<{ events: { xp: number; reason: string }[] }>("/api/vocabulary/quiz", { method: "POST", json: { correct: sc, total: qs!.length, durationSec: (Date.now() - start.current) / 1000 } }); showXp(r.events); } catch { /* ignore */ } } };
  if (!qs) return <Card className="flex flex-col items-center gap-3 p-10 text-center"><Star className="size-10 text-purple" /><h2 className="text-xl font-bold">Vocabulary quiz</h2><p className="text-muted-foreground">Eight mixed questions: meanings, sentence completion and synonyms.</p><Button onClick={() => { setQs(makeQuiz(words)); setI(0); setAns([]); start.current = Date.now(); }}>Start quiz</Button></Card>;
  if (i >= qs.length) { const sc = ans.filter((a, k) => a === qs[k].a).length; return <Card className="flex flex-col items-center gap-3 p-10 text-center"><Star className="size-10 text-purple" /><h2 className="text-xl font-bold">{sc} of {qs.length} correct</h2><Button onClick={() => { setQs(makeQuiz(words)); setI(0); setAns([]); start.current = Date.now(); }}>New quiz</Button></Card>; }
  const q = qs[i]; const a = ans[i];
  return <Card className="max-w-2xl space-y-3 p-5"><p className="text-sm text-muted-foreground">Question {i + 1} of {qs.length}</p><h3 className="font-sans text-lg font-bold">{q.q}</h3>
    {q.o.map((o, k) => <button key={o} disabled={a !== undefined} onClick={() => setAns((s) => { const c = [...s]; c[i] = k; return c; })} className={cn("flex w-full items-start gap-3 rounded-2xl border-[1.5px] p-3.5 text-left", a !== undefined && k === q.a && "border-success bg-success/10", a === k && k !== q.a && "border-destructive bg-destructive/10")}><span className="grid size-6 place-items-center rounded-md bg-secondary text-xs font-extrabold">{"ABCD"[k]}</span>{o}</button>)}
    {a !== undefined && <><p className="rounded-xl bg-secondary/70 p-3 text-sm text-muted-foreground">{q.e}</p><div className="text-right"><Button onClick={next}>{i === qs.length - 1 ? "See score" : "Next question"}</Button></div></>}</Card>;
}

function Daily({ word }: { word: Word }) {
  const { showXp } = useToast(); const [text, setText] = useState(""); const [fb, setFb] = useState<{ ok: boolean; feedback: string; improved?: string } | null>(null); const [busy, setBusy] = useState(false);
  const check = async () => { setBusy(true); try { const r = await api<{ ok: boolean; feedback: string; improved?: string; events: { xp: number; reason: string }[] }>("/api/vocabulary/challenge", { method: "POST", json: { wordId: word.id, sentence: text } }); setFb(r); showXp(r.events); } catch (e) { setFb({ ok: false, feedback: (e as Error).message }); } setBusy(false); };
  return <div className="grid items-start gap-4 md:grid-cols-2">
    <Card className="space-y-2.5 p-6"><div className="flex gap-1.5"><Badge variant={tone(word.status)}>{label(word.status)}</Badge><Badge>{word.category}</Badge><Badge variant="primary">{word.difficulty}</Badge></div><h2 className="text-4xl font-extrabold">{word.word}</h2><div className="flex items-center gap-2"><span className="text-muted-foreground">{word.partOfSpeech}</span><Hear w={word} text={word.pronunciation} /></div><p className="text-lg">{word.meaning}</p><p className="italic text-muted-foreground">“{word.example}”</p>{word.synonyms.length > 0 && <p className="text-sm"><b>Synonyms:</b> {word.synonyms.join(", ")}</p>}<p className="text-sm text-muted-foreground"><b>Usage:</b> {word.usage}</p></Card>
    <Card className="space-y-3 p-6"><h2 className="text-xl font-bold">Daily word challenge</h2><p className="text-muted-foreground">Write one original sentence using “{word.word}” in a CELPIP-style context: an email, an opinion or a workplace situation.</p><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your sentence…" /><Button onClick={check} disabled={busy || !text.trim()}>{busy ? "Checking…" : "Check my sentence"}</Button>
      {fb && <Notice tone={fb.ok ? "success" : "warning"}>{fb.feedback}{fb.improved && <><br /><b>Try:</b> {fb.improved}</>}</Notice>}</Card>
  </div>;
}

export function VocabularyClient({ initial }: { initial: Word[] }) {
  const [words, setWords] = useState(initial);
  const onUpdate = (id: string, status: Word["status"]) => setWords((ws) => ws.map((w) => (w.id === id ? { ...w, status, due: false } : w)));
  const counts = useMemo(() => ({ NEW: 0, LEARNING: 0, REVIEW: 0, MASTERED: 0, ...Object.fromEntries(["NEW", "LEARNING", "REVIEW", "MASTERED"].map((s) => [s, words.filter((w) => w.status === s).length])) }), [words]);
  const [dayIdx, setDayIdx] = useState(0); useEffect(() => setDayIdx(Math.floor(Date.now() / 86_400_000) % words.length), [words.length]);
  return (<>
    <div className="mb-4 flex flex-wrap gap-1.5">{(["NEW", "LEARNING", "REVIEW", "MASTERED"] as const).map((s) => <Badge key={s} variant={tone(s)}>{counts[s]} {s.toLowerCase()}</Badge>)}</div>
    <Tabs defaultValue="study"><TabsList><TabsTrigger value="study">Flashcards</TabsTrigger><TabsTrigger value="browse">Browse words</TabsTrigger><TabsTrigger value="quiz">Quiz</TabsTrigger><TabsTrigger value="daily">Word of the day</TabsTrigger></TabsList>
      <TabsContent value="study"><Flashcards words={words} onUpdate={onUpdate} /></TabsContent><TabsContent value="browse"><Browse words={words} /></TabsContent><TabsContent value="quiz"><Quiz words={words} /></TabsContent><TabsContent value="daily"><Daily word={words[dayIdx]} /></TabsContent></Tabs>
  </>);
}
