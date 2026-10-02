// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';

const COMMENT_RE = /<!--[\s\S]*?-->/g;

// Drafts carry `<!-- UNVERIFIED: ... -->` notes. Strip every HTML comment from
// Markdown so they never reach the rendered page (screen or page source).
const stripHtmlComments = {
  name: 'strip-html-comments',
  /** @param {any} node @param {any} ctx */
  html(node, ctx) {
    if (!node.value.includes('<!--')) return;
    const value = node.value.replace(COMMENT_RE, '');
    if (value.trim() === '') ctx.removeNode(node);
    else ctx.setProperty(node, 'value', value);
  },
};

export default defineConfig({
  site: 'https://extensionlog.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    processor: satteri({ mdastPlugins: [stripHtmlComments] }),
  },
});
