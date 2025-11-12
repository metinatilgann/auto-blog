# Free Auto Blog (Vercel + GitHub)

- Pulls RSS items
- Summarizes with Hugging Face free inference (rate-limited)
- Finds an image via Pexels (optional)
- Writes Markdown files into `/posts`
- GitHub Actions commits the files, Vercel auto-deploys

## Quick Start
1. Create a new GitHub repo and push these files.
2. In repo **Settings → Secrets → Actions**, add:
   - `HUGGINGFACE_TOKEN` (optional but recommended)
   - `PEXELS_API_KEY` (optional)
3. Enable GitHub Pages or deploy to **Vercel** (recommended).
4. The workflow runs daily at 08:00 UTC or via **Run workflow** button.
