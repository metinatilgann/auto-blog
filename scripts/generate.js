/**
 * RSS -> (HF özet ya da fallback) -> Markdown
 * Log'ları artırıldı, fallback yazı eklendi.
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
  'https://www.memurlar.net/siteneekle/',
  'https://www.kamugundemi.com/rss/',
  'https://www.kamudanhaber.net/rss',
  'mebhaberler.com/rss.html',
  'https://www.ntv.com.tr/rss'
];

const MAX_POSTS = parseInt(process.env.MAX_POSTS || '3', 10);
const HUGGING_FACE_MODEL = process.env.HF_MODEL || 'facebook/bart-large-cnn';
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || '';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';

const POSTS_DIR = path.join(process.cwd(), 'posts');

function safeSlug(text) {
  return slugify(text, { lower: true, strict: true }).slice(0, 80);
}
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function summarize(text) {
  if (!HF_TOKEN) {
    // basit fallback (ücretsiz, tokensız)
    return (text || '').split('.').slice(0, 3).join('.') + '...';
  }
  try {
    const resp = await axios.post(
      `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`,
      { inputs: (text || '').slice(0, 4000) },
      { headers: { Authorization: `Bearer ${HF_TOKEN}` }, timeout: 60000 }
    );
    const out = resp.data;
    if (Array.isArray(out) && out[0]?.summary_text) return out[0].summary_text;
    if (typeof out === 'string') return out;
    return (text || '').split('.').slice(0, 3).join('.') + '...';
  } catch (e) {
    console.log('HF summarize error:', e.message);
    return (text || '').split('.').slice(0, 3).join('.') + '...';
  }
}

async function findImage(query) {
  if (!PEXELS_KEY) return null;
  try {
    const r = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: PEXELS_KEY },
      timeout: 30000
    });
    return r.data?.photos?.[0]?.src?.large || null;
  } catch (e) {
    console.log('Pexels error:', e.message);
    return null;
  }
}

async function run() {
  console.log('FEEDS count:', FEEDS.length);
  ensureDir(POSTS_DIR);

  const parser = new RSSParser();
  const feedResults = await Promise.allSettled(FEEDS.map(f => parser.parseURL(f)));
  const okFeeds = feedResults.filter(r => r.status === 'fulfilled').map(r => r.value);
  console.log('Fetched feeds OK:', okFeeds.length, ' / total:', FEEDS.length);

  const items = okFeeds
    .flatMap(f => f.items || [])
    .sort((a,b) => new Date(b.isoDate || b.pubDate) - new Date(a.isoDate || a.pubDate))
    .slice(0, MAX_POSTS);

  console.log('Items to process:', items.length);

  let created = 0;

  for (const item of items) {
    try {
      const title = (item.title || 'Yeni Yazı').trim();
      const slug = safeSlug(title);
      const filepath = path.join(POSTS_DIR, `${slug}.md`);
      if (fs.existsSync(filepath)) {
        console.log('Skip existing:', slug);
        continue;
      }

      const plain = (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '');
      const summary = await summarize(`${title}. ${plain}`);
      const image = await findImage(title);

      const md = `---\n` +
        `title: "${title.replace(/"/g, '\\"')}"\n` +
        `date: "${new Date().toISOString()}"\n` +
        `image: ${image ? '"' + image + '"' : 'null'}\n` +
        `source: "${item.link || ''}"\n` +
        `source_title: "${(item.title || '').replace(/"/g, '\\"')}"\n` +
        `excerpt: "${(summary || '').replace(/"/g, '\\"').slice(0, 200)}"\n` +
        `---\n\n${summary}\n`;

      fs.writeFileSync(filepath, md, 'utf8');
      console.log('Created:', filepath);
      created++;
    } catch (e) {
      console.log('Create error for item:', e.message);
    }
  }

  if (created === 0) {
    const fallbackSlug = `deneme-${Date.now()}`;
    const fp = path.join(POSTS_DIR, `${fallbackSlug}.md`);
    const md = `---\n` +
      `title: "Otomatik Deneme Yazısı"\n` +
      `date: "${new Date().toISOString()}"\n` +
      `image: null\n` +
      `source: ""\n` +
      `source_title: ""\n` +
      `excerpt: "Bu yazı, akışın doğru çalıştığını göstermek için otomatik oluşturulmuştur."\n` +
      `---\n\nİlk çalıştırmada kaynaklardan içerik bulunamadı veya hepsi mevcuttu. Akış testi için bu yazı eklendi.\n`;
    fs.writeFileSync(fp, md, 'utf8');
    console.log('Fallback post created:', fp);
  }
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
