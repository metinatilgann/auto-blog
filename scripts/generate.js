/**
 * Pulls RSS, summarizes with Hugging Face (free, rate-limited),
 * searches a Pexels image, and writes Markdown files into /posts.
 * Intended to run in GitHub Actions on a schedule.
 */
import fs from 'fs';
import path from 'path';
import RSSParser from 'rss-parser';
import slugify from 'slugify';
import axios from 'axios';

const FEEDS = [
   'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://www.engadget.com/rss.xml',
  'https://www.wired.com/feed/rss',
  'https://arstechnica.com/feed/',
  'https://thenextweb.com/feed',
  'https://www.cnet.com/rss/news/',
  'https://feeds.feedburner.com/Gizmodo',
  'https://mashable.com/feeds/rss/all',
  'https://www.webtekno.com/rss',
  'https://shiftdelete.net/feed',
  'https://www.trthaber.com/xml_mobile.php?kat=bilim_teknoloji'  
];

const MAX_POSTS = parseInt(process.env.MAX_POSTS || '3', 10);
const HUGGING_FACE_MODEL = process.env.HF_MODEL || 'facebook/bart-large-cnn';
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN; // required for hosted inference
const PEXELS_KEY = process.env.PEXELS_API_KEY;  // optional

const POSTS_DIR = path.join(process.cwd(), 'posts');

function safeSlug(text) {
  return slugify(text, { lower: true, strict: true }).slice(0, 80);
}

async function summarize(text) {
  if (!HF_TOKEN) {
    // Fallback: return first 3 sentences
    return text.split('.').slice(0, 3).join('.') + '...';
  }
  const resp = await axios.post(
    `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`,
    { inputs: text.slice(0, 4000) },
    { headers: { Authorization: `Bearer ${HF_TOKEN}` }, timeout: 60000 }
  );
  const out = resp.data;
  if (Array.isArray(out) && out[0]?.summary_text) return out[0].summary_text;
  // Some models return different schema:
  if (typeof out === 'string') return out;
  return text.split('.').slice(0, 3).join('.') + '...';
}

async function findImage(query) {
  if (!PEXELS_KEY) return null;
  const r = await axios.get('https://api.pexels.com/v1/search', {
    params: { query, per_page: 1, orientation: 'landscape' },
    headers: { Authorization: PEXELS_KEY },
    timeout: 30000
  });
  return r.data?.photos?.[0]?.src?.large || null;
}

async function run() {
  const parser = new RSSParser();
  const feeds = await Promise.allSettled(FEEDS.map(f => parser.parseURL(f)));
  const items = feeds
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value.items || [])
    .sort((a,b) => new Date(b.isoDate || b.pubDate) - new Date(a.isoDate || a.pubDate))
    .slice(0, MAX_POSTS);

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

  for (const item of items) {
    const title = item.title?.trim() || 'Yeni Yazı';
    const slug = safeSlug(title);
    const filepath = path.join(POSTS_DIR, `${slug}.md`);
    if (fs.existsSync(filepath)) {
      console.log('Skip existing:', slug);
      continue;
    }

    const baseText = (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '');
    const summary = await summarize(`${title}. ${baseText}`);
    const image = await findImage(title);

    const md = `---
title: "${title.replace(/"/g, '\"')}"
date: "${new Date().toISOString()}"
image: ${image ? '"' + image + '"' : 'null'}
source: "${item.link}"
source_title: "${(item.title || '').replace(/"/g, '\"')}"
excerpt: "${(summary || '').replace(/"/g, '\"').slice(0, 200)}"
---

${summary}

`;
    fs.writeFileSync(filepath, md, 'utf8');
    console.log('Created:', filepath);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
