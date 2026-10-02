export const CATEGORIES = ['skills', 'plugins', 'connectors', 'building-this-blog'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  skills: 'Skills',
  plugins: 'Plugins',
  connectors: 'Connectors',
  'building-this-blog': 'Building This Blog',
};
