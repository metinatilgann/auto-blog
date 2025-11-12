import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Layout from '../components/Layout';

export async function getStaticProps() {
  const postsDir = path.join(process.cwd(), 'posts');
  if (!fs.existsSync(postsDir)) return { props: { posts: [] } };

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const posts = files.map(fn => {
    const slug = fn.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(postsDir, fn), 'utf8');
    const { data } = matter(raw);
    return { slug, ...data };
  }).sort((a,b) => new Date(b.date) - new Date(a.date));

  return { props: { posts } };
}

export default function Home({ posts }) {
  return (
    <Layout>
      <h1 className="font-display text-3xl md:text-4xl mb-6">Günün Teknoloji Özeti</h1>
      <p className="meta mb-8">
        RSS → (LLM özet) → Markdown → Vercel. Otomatik güncellenir.
      </p>

      {posts.length === 0 && (
        <div className="card">Henüz yazı yok. Actions → “Auto Blog” → “Run workflow” ile içerik üret.</div>
      )}

      <ul className="grid gap-5">
        {posts.map(p => (
          <li key={p.slug} className="card">
            <h2 className="font-display text-xl">
              <Link className="hover:underline" href={`/posts/${p.slug}`}>{p.title}</Link>
            </h2>
            <div className="meta mt-1">{new Date(p.date).toLocaleString('tr-TR')}</div>
            {p.image && <img src={p.image} alt="" className="rounded-xl mt-4" />}
            {p.excerpt && <p className="mt-3 text-neutral-700 dark:text-neutral-300">{p.excerpt}</p>}
            <div className="mt-4">
              <Link className="btn" href={`/posts/${p.slug}`}>Devamını oku</Link>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
