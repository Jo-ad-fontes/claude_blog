import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

// No publish date exists in front matter yet, so "latest" means most recently tested.
export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('articles');
  return all.sort((a, b) => b.data.tested_at.getTime() - a.data.tested_at.getTime());
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
