/* Seeds original CELPIP-style practice content, achievements, mock test templates and a demo account.
   Idempotent: safe to run repeatedly. */
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import content from "./content.json";
import { BADGES } from "../src/lib/gamification";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const LETTERS = "ABCDE";
/** Extra practice content lives in prisma/content-extra/*.json (same shapes as content.json). Missing files are skipped. */
function extra<T>(name: string): T[] {
  const p = path.join(process.cwd(), "prisma", "content-extra", `${name}.json`);
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as T[]) : [];
}
const LISTENING = [...content.listening, ...extra<(typeof content.listening)[number]>("listening-a"), ...extra<(typeof content.listening)[number]>("listening-b")];
const READING = [...content.reading, ...extra<(typeof content.reading)[number]>("reading-a"), ...extra<(typeof content.reading)[number]>("reading-b")];
const WRITING = [...content.writing, ...extra<(typeof content.writing)[number]>("writing")];
const SPEAKING = [...content.speaking, ...extra<(typeof content.speaking)[number]>("speaking-a"), ...extra<(typeof content.speaking)[number]>("speaking-b"), ...extra<(typeof content.speaking)[number]>("speaking-c")];
const VOCAB = [...content.vocab, ...extra<(typeof content.vocab)[number]>("vocab")];
const diff = (d?: string) => (d === "Intermediate" ? "INTERMEDIATE" : d === "Expert" ? "EXPERT" : "ADVANCED") as "INTERMEDIATE" | "ADVANCED" | "EXPERT";
type Q = { q: string; o: string[]; a: number; cat: string; e: string };

async function upsertExercise(data: Omit<Prisma.ExerciseCreateInput, "questions">, questions: Q[], labeled = false) {
  const ex = await prisma.exercise.upsert({ where: { slug: data.slug }, create: data, update: data });
  // Keep existing question rows (and so old attempt reviews) when the content has not changed.
  const have = await prisma.question.findMany({ where: { exerciseId: ex.id }, orderBy: { order: "asc" }, select: { text: true } });
  if (have.length === questions.length && have.every((h, i) => h.text === questions[i].q)) return ex;
  await prisma.question.deleteMany({ where: { exerciseId: ex.id } });
  for (const [i, q] of questions.entries()) {
    await prisma.question.create({ data: {
      exerciseId: ex.id, order: i + 1, skill: data.skill, taskType: data.taskType, difficulty: data.difficulty ?? "ADVANCED",
      text: q.q, category: q.cat, explanation: q.e, estimatedSeconds: data.skill === "LISTENING" ? 50 : 70,
      options: { create: q.o.map((t, k) => ({ order: k + 1, label: LETTERS[k], text: labeled && t.length === 1 ? (t === "E" ? "Not given" : `Paragraph ${t}`) : t, isCorrect: k === q.a })) }
    } });
  }
  return ex;
}

async function main() {
  for (const l of LISTENING) {
    await upsertExercise({ slug: l.id, skill: "LISTENING", taskType: l.type, part: l.part, title: l.title, context: l.context, difficulty: diff((l as { difficulty?: string }).difficulty), maxPlays: l.replays, timeLimitSec: l.questions.length * 50,
      script: { speakers: l.speakers, lines: l.script } as Prisma.InputJsonValue }, l.questions as Q[]);
  }
  for (const r of READING) {
    const rr = r as typeof r & { paragraphs?: boolean; diagram?: unknown; comment?: string; instructions?: string };
    await upsertExercise({ slug: r.id, skill: "READING", taskType: r.type, part: r.part, title: r.title, difficulty: diff((r as { difficulty?: string }).difficulty), timeLimitSec: r.timeLimit,
      passage: { paragraphs: r.passage, labeled: !!rr.paragraphs, diagram: rr.diagram ?? null, comment: rr.comment ?? null, instructions: rr.instructions ?? null } as Prisma.InputJsonValue }, r.questions as Q[], !!rr.paragraphs);
  }
  for (const w of WRITING) {
    const ww = w as typeof w & { points?: string[]; options?: string[]; register?: string };
    await upsertExercise({ slug: w.id, skill: "WRITING", taskType: w.task === 1 ? "Writing an Email" : "Responding to Survey Questions", part: w.task, title: w.title, difficulty: "ADVANCED", timeLimitSec: w.minutes * 60,
      config: { task: w.task, kind: w.kind, minutes: w.minutes, min: w.min, max: w.max, prompt: w.prompt, points: ww.points, options: ww.options, register: ww.register } as Prisma.InputJsonValue }, []);
  }
  for (const s of SPEAKING) {
    const ss = s as typeof s & { image?: string; choices?: unknown };
    await upsertExercise({ slug: s.id, skill: "SPEAKING", taskType: s.type, part: s.task, title: `Task ${s.task}: ${s.type}`, difficulty: "ADVANCED", timeLimitSec: s.prep + s.speak,
      config: { task: s.task, prep: s.prep, speak: s.speak, prompt: s.prompt, image: ss.image, choices: ss.choices } as Prisma.InputJsonValue }, []);
  }
  for (const v of VOCAB) {
    const data = { word: v.w, pronunciation: v.ipa, partOfSpeech: v.pos, category: v.cat, difficulty: v.lvl, meaning: v.m, example: v.ex, synonyms: v.syn, antonyms: v.ant, usage: v.use };
    await prisma.vocabularyWord.upsert({ where: { word: v.w }, create: data, update: data });
  }
  for (const b of BADGES) await prisma.achievement.upsert({ where: { key: b.key }, create: { key: b.key, name: b.name, description: b.description, icon: b.icon, xpReward: b.xpReward }, update: { name: b.name, description: b.description, icon: b.icon, xpReward: b.xpReward } });
  const mocks = [
    { slug: "full-mock", name: "Full mock test", kind: "FULL" as const, description: "Listening, Reading, Writing and Speaking in test order.", sections: [{ skill: "LISTENING" }, { skill: "READING" }, { skill: "WRITING" }, { skill: "SPEAKING" }] },
    ...(["LISTENING", "READING", "WRITING", "SPEAKING"] as const).map((s) => ({ slug: `section-${s.toLowerCase()}`, name: `${s[0]}${s.slice(1).toLowerCase()} section mock`, kind: "SECTION" as const, description: `One complete ${s.toLowerCase()} section under exam conditions.`, sections: [{ skill: s }] })),
    { slug: "custom", name: "Custom practice test", kind: "CUSTOM" as const, description: "Any combination of parts and tasks.", sections: [] }
  ];
  for (const m of mocks) await prisma.mockTest.upsert({ where: { slug: m.slug }, create: m, update: m });
  const email = "demo@celpip.local";
  if (!(await prisma.user.findUnique({ where: { email } }))) {
    await prisma.user.create({ data: { email, name: "Demo learner", passwordHash: await bcrypt.hash("practice123", 11), profile: { create: { displayName: "Demo learner" } }, goals: { create: { targetScore: 12, dailyMinutes: 45 } } } });
  }
  const counts = { exercises: await prisma.exercise.count(), questions: await prisma.question.count(), vocabulary: await prisma.vocabularyWord.count(), achievements: await prisma.achievement.count() };
  console.log("Seeded:", counts, "\nDemo account: demo@celpip.local / practice123");
}
main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
