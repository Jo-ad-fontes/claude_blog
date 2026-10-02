import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories';

// Source of truth for published articles lives outside the site, at the repo root.
// Only humans move files into articles/published/; an empty folder must still build.
// ARTICLES_DIR lets local previews point at another folder without touching published/.
const articles = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: process.env.ARTICLES_DIR
      ? pathToFileURL(resolve(process.env.ARTICLES_DIR) + sep)
      : '../articles/published',
    generateId: ({ entry, data }) =>
      typeof data.slug === 'string' ? data.slug : entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    seo_title: z.string(),
    meta_description: z.string(),
    primary_keyword: z.string(),
    tags: z.array(z.string()).default([]),
    category: z.enum(CATEGORIES),
    tested_at: z.coerce.date(),
    claude_code_version: z.string(),
    lang: z.string().default('en'),
  }),
});

export const collections = { articles };
