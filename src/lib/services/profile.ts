import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { activeGoal } from "./activity";

export class EmailTakenError extends Error { status = 409; }

export async function createUser(input: { name: string; email: string; password: string }) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new EmailTakenError("An account with this email already exists.");
  const passwordHash = await bcrypt.hash(input.password, 11);
  return prisma.user.create({ data: { email: input.email, name: input.name, passwordHash, profile: { create: { displayName: input.name } }, goals: { create: { targetScore: 12, dailyMinutes: 45 } } }, select: { id: true, email: true, name: true } });
}

export async function getProfile(userId: string) {
  const [user, profile, goal] = await Promise.all([prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, createdAt: true } }), prisma.userProfile.findUnique({ where: { userId } }), activeGoal(userId)]);
  return { email: user?.email ?? "", name: user?.name ?? "", createdAt: user?.createdAt ?? new Date(), displayName: profile?.displayName ?? user?.name ?? "", theme: profile?.theme ?? "system", ttsRate: profile?.ttsRate ?? 1, aiMode: profile?.aiMode ?? "auto", xp: profile?.xp ?? 0,
    targetScore: goal?.targetScore ?? 12, examDate: goal?.examDate ? goal.examDate.toISOString().slice(0, 10) : null, dailyMinutes: goal?.dailyMinutes ?? 45 };
}

export async function updateProfile(userId: string, p: { displayName?: string; targetScore?: number; examDate?: string | null; dailyMinutes?: number; theme?: string; ttsRate?: number; aiMode?: string }) {
  await prisma.userProfile.upsert({ where: { userId }, create: { userId, displayName: p.displayName, theme: p.theme, ttsRate: p.ttsRate, aiMode: p.aiMode }, update: { displayName: p.displayName, theme: p.theme, ttsRate: p.ttsRate, aiMode: p.aiMode } });
  if (p.targetScore !== undefined || p.examDate !== undefined || p.dailyMinutes !== undefined) {
    const g = await activeGoal(userId);
    const data = { targetScore: p.targetScore, dailyMinutes: p.dailyMinutes, examDate: p.examDate === undefined ? undefined : p.examDate ? new Date(`${p.examDate}T12:00:00Z`) : null };
    if (g) await prisma.learningGoal.update({ where: { id: g.id }, data }); else await prisma.learningGoal.create({ data: { userId, ...data } });
  }
  return getProfile(userId);
}

export async function learningHistory(userId: string, take = 20) {
  const [a, w, s, m] = await Promise.all([
    prisma.practiceAttempt.findMany({ where: { userId, fromMock: false }, orderBy: { createdAt: "desc" }, take, include: { exercise: { select: { title: true } } } }),
    prisma.writingSubmission.findMany({ where: { userId, status: "EVALUATED", fromMock: false }, orderBy: { createdAt: "desc" }, take, include: { exercise: { select: { title: true } } } }),
    prisma.speakingSubmission.findMany({ where: { userId, fromMock: false }, orderBy: { createdAt: "desc" }, take, include: { exercise: { select: { taskType: true } } } }),
    prisma.mockTestAttempt.findMany({ where: { userId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take })
  ]);
  return [
    ...a.map((x) => ({ at: x.createdAt, skill: x.skill.toLowerCase(), label: `${x.exercise.title}: ${x.correct}/${x.total}` })),
    ...w.map((x) => ({ at: x.createdAt, skill: "writing", label: `${x.exercise.title}: level ${x.estimatedLevel}` })),
    ...s.map((x) => ({ at: x.createdAt, skill: "speaking", label: `${x.exercise.taskType}: level ${x.estimatedLevel ?? "—"}` })),
    ...m.map((x) => ({ at: x.completedAt ?? x.startedAt, skill: "mock", label: `${x.label}: overall ${x.overallLevel ?? "—"}` }))
  ].sort((x, y) => y.at.getTime() - x.at.getTime()).slice(0, take);
}

export async function exportData(userId: string) {
  const [profile, goals, attempts, writing, speaking, mocks, vocab, achievements, days] = await Promise.all([
    getProfile(userId), prisma.learningGoal.findMany({ where: { userId } }), prisma.practiceAttempt.findMany({ where: { userId } }),
    prisma.writingSubmission.findMany({ where: { userId } }), prisma.speakingSubmission.findMany({ where: { userId }, select: { id: true, exerciseId: true, transcript: true, durationSec: true, estimatedLevel: true, evaluation: true, createdAt: true } }),
    prisma.mockTestAttempt.findMany({ where: { userId } }), prisma.userVocabularyProgress.findMany({ where: { userId }, include: { word: { select: { word: true } } } }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: { select: { key: true, name: true } } } }), prisma.dailyActivity.findMany({ where: { userId } })
  ]);
  return { exportedAt: new Date().toISOString(), profile, goals, attempts, writing, speaking, mocks, vocab, achievements, days };
}

export async function resetProgress(userId: string) {
  await prisma.$transaction([
    prisma.practiceAttempt.deleteMany({ where: { userId } }), prisma.writingSubmission.deleteMany({ where: { userId } }), prisma.speakingSubmission.deleteMany({ where: { userId } }),
    prisma.mockTestAttempt.deleteMany({ where: { userId } }), prisma.userVocabularyProgress.deleteMany({ where: { userId } }), prisma.userAchievement.deleteMany({ where: { userId } }),
    prisma.dailyActivity.deleteMany({ where: { userId } }), prisma.userProfile.update({ where: { userId }, data: { xp: 0 } })
  ]);
}
