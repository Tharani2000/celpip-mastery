# Pra-Win 🌺

_Made for Praveen. Level up your Canadian English, eh?_

A gamified CELPIP General preparation platform for advanced learners targeting CELPIP 9–12. Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL and Auth.js.

> **Not affiliated with CELPIP or Paragon Testing Enterprises.** All practice content is original. Every score shown in the app is a clearly labelled, unofficial practice estimate — never an official CELPIP result. Confirm the current exam format at [celpip.ca](https://www.celpip.ca) before relying on the mock-test timings here; they reflect the format as understood at the time this was built and are scaled down to match a smaller question bank.

## Features implemented

- **My Plan** — a day-by-day 30-day study plan built from your daily minutes, rest days, skills, mock-test frequency and difficulty. Every day is editable (swap exercises, add your own tasks, make rest days, tick things off) and exercises complete automatically when practised. Rebuild it any time from the settings.
- **Dashboard** — welcome message, target score, overall preparation progress, daily goal with a progress bar, streak, total practice hours, skill cards for all four skills with estimated vs. target level, a level ladder visualization, a daily challenge, a rotating motivational quote, personalized recommendations, and an optional AI-generated daily study plan.
- **Listening** — six parts (Problem Solving, Daily Life Conversation, Information, News Item, Discussion, Viewpoints), each with an original advanced script, play-limited audio (HTML5 `<audio>` when a file exists, otherwise per-speaker browser speech synthesis), a countdown timer, question navigation, scoring, and full review with explanations.
- **Reading** — four parts (Correspondence, Apply a Diagram, For Information, For Viewpoints), with text highlighting, a timer, and review with explanations.
- **Writing** — both task types (email, survey response) with a live word counter, autosaving drafts, a timer, and AI evaluation across six dimensions (content, coherence, vocabulary, grammar, clarity, tone) with strengths, weaknesses, grammar corrections, vocabulary upgrades, sentence restructuring, recommendations and a sample response.
- **Speaking** — all eight task types with official-style preparation/speaking timers, `MediaRecorder`-based recording, live (or server-side) transcription, playback, and AI evaluation on fluency, vocabulary, grammar, coherence, relevance and development. Pronunciation is explicitly never scored.
- **Mock tests** — full, section-wise and custom tests under exam conditions (recordings play once, feedback hidden until the end), with a detailed results page (skill-wise levels, question-type analysis, areas to improve, recommended practice, full review).
- **Vocabulary** — 147 words/idioms/phrasal verbs/collocations/Canadian expressions, flip-animated flashcards, SM‑2-style spaced repetition (New → Learning → Review → Mastered), an 8-question mixed quiz, and a daily word challenge with AI-checked sentences.
- **Gamification** — XP, daily streaks, 10 achievement badges, daily challenges, weekly goals, level progression and personal bests, with rules against rewarding rushed, duplicate or non-improving submissions.
- **Analytics** — level-over-time chart, skill-wise progress, accuracy by question type, average completion time, a 14-day practice-minutes chart, vocabulary mastery breakdown, improvement trends, mock-test history, and personalized recommendations — all via Recharts.
- **Profile & goals** — target score, target exam date, daily study time, a generated daily plan, and learning history.
- **Security & quality** — authenticated routes (middleware + per-route checks), server-side Zod validation on every mutation, answers/explanations never sent to the client before scoring, rate-limited AI calls, accessible components (keyboard nav, focus rings, `aria-*`), light/dark themes, skeleton loaders and empty states, 42 unit tests, 13 integration tests against a real database, and 9 end-to-end browser tests.

## Project structure

```
prisma/
  schema.prisma          16 models: User, UserProfile, LearningGoal, Exercise, Question,
                          AnswerOption, PracticeAttempt, MockTest, MockTestAttempt,
                          WritingSubmission, SpeakingSubmission, VocabularyWord,
                          UserVocabularyProgress, Achievement, UserAchievement, DailyActivity
  migrations/0001_init/   hand-verified initial migration (applied and tested against Postgres 16)
  seed.ts                 seeds all practice content, achievements, mock templates, demo account
  content.json            the original practice content (shared source of truth)
scripts/
  generate-audio.ts       optional: generates real MP3 listening audio via OpenAI TTS
src/
  lib/
    scoring.ts, xp.ts, srs.ts, gamification.ts     pure, unit-tested business logic
    text-analysis.ts                               filler/connector/repetition analysis for feedback
    validation.ts                                  Zod schemas for every API input
    auth.ts                                         Auth.js config + requireUserId()/optionalUserId()
    api.ts                                          route() wrapper: auth, error mapping, rate limiting
    ai/
      provider.ts         Anthropic/OpenAI caller, JSON extraction, retry, error → notice mapping
      schemas.ts           Zod schemas validating every AI reply
      demo.ts              rule-based fallback evaluators (used when no AI key is configured)
      evaluate.ts          prompts + evaluateWriting/evaluateSpeaking/aiStudyPlan/evaluateMockBatch
      transcribe.ts        optional server-side speech-to-text (OpenAI)
    services/              all database access, one file per domain (practice, writing, speaking,
                            vocabulary, mock, stats, profile, activity/XP/streaks/badges)
  app/
    (auth)/login, (auth)/register
    (app)/dashboard, listening, reading, writing, speaking, mock, vocabulary,
          progress, achievements, profile, settings   — the 11 navigation sections
    api/...                                           18 REST route handlers
  components/
    ui/            shadcn/ui primitives (button, card, dialog, tabs, progress, ...)
    exercise/       audio player, passage+highlighting, question runner, timers, results review,
                    writing workspace, speaking recorder/session, feedback panels, original SVG scenes
    mock/           mock-test launcher and the exam-mode session runner
    dashboard/      level ladder, AI plan button
    charts/         Recharts wrappers (level trend, horizontal bars, minutes chart)
    vocabulary/      flashcards, browse, quiz, daily challenge
    settings/        profile form, settings client
tests/
  unit/            42 tests — scoring, XP rules, spaced repetition, gamification, text analysis,
                   AI provider (JSON parsing, retries, demo fallback), validation
  integration/     13 tests against a real PostgreSQL database — answer secrecy, server-side scoring,
                   anti-rush/anti-repeat XP, drafts, speaking storage/validation, a full mock end to
                   end, cross-user data isolation, progress reset
e2e/               9 Playwright browser tests — register → dashboard, listening, reading + highlight,
                   writing feedback, speaking with a fake mic, flashcards, a reading mock to results,
                   analytics/achievements rendering
```

## Database setup instructions

1. Provision a PostgreSQL 16+ database (local, Docker, or a managed provider).
2. Copy the environment template and fill it in (see below):
   ```bash
   cp .env.example .env
   ```
3. Install dependencies (this also runs `prisma generate`):
   ```bash
   npm install
   ```
4. Apply the schema:
   ```bash
   npm run db:migrate
   ```
5. Seed practice content, achievements, mock templates and a demo account:
   ```bash
   npm run db:seed
   ```
   This creates **demo@celpip.local / practice123** and prints a content summary. Seeding is idempotent — safe to re-run.
6. (Optional) Generate real listening audio instead of browser speech synthesis:
   ```bash
   npm run audio:generate
   ```
   Requires `OPENAI_API_KEY`. Without it, listening exercises fall back to per-speaker browser speech synthesis automatically.

To reset the database entirely during development: `npm run db:reset` (drops, recreates, migrates and reseeds).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `NEXTAUTH_SECRET` | Yes | Session signing secret. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | Base URL of the deployment (e.g. `http://localhost:3000`). |
| `AI_PROVIDER` | No | `anthropic` \| `openai` \| `demo`. Defaults to auto-detecting from the API keys below, or `demo` if none are set. |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | No | Enables Claude-based evaluation. |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | No | Enables GPT-based evaluation (and server-side speech-to-text). |
| `AI_RATE_LIMIT_PER_MINUTE` | No | Per-user cap on AI-evaluating endpoints. Default `6`. |
| `AI_TIMEOUT_MS` | No | AI request timeout. Default `60000`. |
| `TRANSCRIPTION_MODEL` | No | OpenAI transcription model. Default `whisper-1`. |
| `AUDIO_STORAGE_DIR` | No | Where speaking recordings are stored on disk. Default `./storage/audio`. **Use object storage (S3/R2/GCS) in production** — local disk doesn't survive redeploys on most hosts. |
| `MAX_AUDIO_MB` | No | Max upload size for a speaking recording. Default `15`. |

**Without any AI key configured**, the app runs fully: writing and speaking are evaluated by a rule-based demo mode, clearly labelled in the UI as "Demo evaluation" with an explanation of what it can't judge. Nothing is a placeholder or non-functional.

## Commands to run the application

```bash
npm run dev          # local development, http://localhost:3000
npm run build         # production build
npm start             # run the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
```

## Testing instructions

```bash
npm test                    # 42 unit tests — pure logic, no database needed
npm run test:integration    # 13 integration tests — needs DATABASE_URL pointed at a seeded database
npm run test:e2e            # 9 Playwright browser tests — builds & starts the app, needs a browser:
                             #   npx playwright install chromium   (first time only)
```

All three suites passed during development, including a full four-section mock test exercised end to end against a real PostgreSQL database, and a cross-user isolation check confirming one learner can never read or submit another's mock attempt.

## Notes and known limitations

- The exam structure (6 listening parts / 4 reading parts / 2 writing tasks / 8 speaking tasks, with the timings used here) reflects the CELPIP General format as understood when this was built. **Verify the current official format at celpip.ca** before relying on the mock engine for real test-day timing.
- This question bank is intentionally smaller than the real CELPIP test, so the mock engine scales listening/reading timing down proportionally — it's a rehearsal of structure and stamina, not a 1:1 timing clone.
- The in-memory rate limiter (`src/lib/rate-limit.ts`) is per-process. If you deploy more than one server instance, swap it for a shared store (e.g. Redis) — the call site (`route(..., { ai: true })` in `src/lib/api.ts`) is the only place that needs to change.
- Speaking pronunciation is **never** scored — a transcript has no acoustic information, and the AI prompts explicitly forbid guessing at it.
