import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import Layout from '../../components/Layout';

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), 'posts');
  if (!fs.existsSync(postsDir)) return { paths: [], fallback: false };
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
    <Layout>
      <article className="prose-custom">
        <h1 className="font-display">{front.title}</h1>
        <p className="meta">{new Date(front.date).toLocaleString('tr-TR')}</p>
        {front.image && <img src={front.image} alt="" />}
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {front.source && (
          <p className="meta">
            Kaynak: <a href={front.source} target="_blank" rel="nofollow noopener">{front.source_title || front.source}</a>
          </p>
        )}
      </article>
    </Layout>
  );
}
