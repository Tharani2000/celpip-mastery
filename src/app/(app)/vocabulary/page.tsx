import { requireUserId } from "@/lib/auth";
import { vocabularyDeck } from "@/lib/services/vocabulary";
import { PageHeader } from "@/components/common";
import { VocabularyClient, type Word } from "@/components/vocabulary/vocabulary-client";
export const metadata = { title: "Vocabulary" };
export default async function Page() {
  const deck = await vocabularyDeck(await requireUserId());
  const words: Word[] = deck.map((w) => ({ id: w.id, word: w.word, pronunciation: w.pronunciation, partOfSpeech: w.partOfSpeech, category: w.category, difficulty: w.difficulty, meaning: w.meaning, example: w.example, synonyms: w.synonyms, antonyms: w.antonyms, usage: w.usage, status: w.status, due: w.due, preview: w.preview }));
  return <><PageHeader title="Vocabulary" description="Advanced words, idioms, phrasal verbs, collocations and Canadian expressions, scheduled with spaced repetition." /><VocabularyClient initial={words} /></>;
}
