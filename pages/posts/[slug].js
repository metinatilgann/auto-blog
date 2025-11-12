import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), 'posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const paths = files.map(fn => ({ params: { slug: fn.replace(/\.md$/, '') } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const postsDir = path.join(process.cwd(), 'posts');
  const raw = fs.readFileSync(path.join(postsDir, `${params.slug}.md`), 'utf8');
  const { data, content } = matter(raw);
  return { props: { front: data, html: marked.parse(content) } };
}

export default function Post({ front, html }) {
  return (
    <main style={{maxWidth:800, margin:'40px auto', padding:'0 16px', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto'}}>
      <a href="/">← Home</a>
      <h1>{front.title}</h1>
      <small>{new Date(front.date).toLocaleString()}</small>
      {front.image && <div style={{marginTop:8}}><img src={front.image} alt="" style={{maxWidth:'100%'}}/></div>}
      <article dangerouslySetInnerHTML={{ __html: html }} />
      {front.source && <p><em>Kaynak: <a href={front.source} target="_blank" rel="nofollow noopener">{front.source_title || front.source}</a></em></p>}
    </main>
  );
}
