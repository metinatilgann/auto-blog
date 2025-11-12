import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export async function getStaticProps() {
  const postsDir = path.join(process.cwd(), 'posts');
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
    <main style={{maxWidth:800, margin:'40px auto', padding:'0 16px', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto'}}>
      <h1>Auto Blog</h1>
      <p>RSS → (free LLM) summarization → Markdown → Vercel.</p>
      <ul style={{listStyle:'none', padding:0}}>
        {posts.map(p => (
          <li key={p.slug} style={{marginBottom:24}}>
            <h2 style={{margin:'6px 0'}}>
              <Link href={`/posts/${p.slug}`}>{p.title}</Link>
            </h2>
            <small>{new Date(p.date).toLocaleString()}</small>
            {p.image && <div style={{marginTop:8}}><img src={p.image} alt="" style={{maxWidth:'100%'}}/></div>}
            <p style={{opacity:.8}}>{p.excerpt || ''}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
