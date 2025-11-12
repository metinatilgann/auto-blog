import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="tr" className="bg-neutral-50 dark:bg-neutral-950">
      <Head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@600&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0ea5e9" />
      </Head>
      <body className="font-body text-neutral-900 dark:text-neutral-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
