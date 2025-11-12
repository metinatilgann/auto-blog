export default function Layout({ children }) {
  return (
    <div>
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur">
        <div className="container-main flex items-center justify-between">
          <a href="/" className="font-display text-2xl">Auto<span className="text-sky-500">Blog</span></a>
          <nav className="flex gap-2">
            <a className="btn" href="/">Ana Sayfa</a>
            <a className="btn" href="https://github.com">GitHub</a>
          </nav>
        </div>
      </header>
      <main className="container-main">{children}</main>
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center meta">
        © {new Date().getFullYear()} AutoBlog • Next.js + Tailwind • Vercel
      </footer>
    </div>
  );
}
