# The Show Pulse

A stimulation-rating database of children's TV shows, built for the Dad Vibes Screen Time Hub.

- `public/data/shows.json` — the data. This is the single source of truth; edit this to add/change shows.
- `src/App.jsx` — the tool itself. Fetches `shows.json` at runtime, so data changes never require a code change.
- `RUBRIC.md` — the scoring rules, so every future addition (by you, me, or the weekly automation) stays consistent.
- `.github/workflows/weekly-update.yml` — the automation that researches and adds new shows weekly.

---

## Part 1 — Get it running locally (optional, but good to sanity-check)

You'll need [Node.js](https://nodejs.org) installed (any recent LTS version).

```bash
npm install
npm run dev
```

This opens the tool at `http://localhost:5173`. Confirm it loads all 503 shows and the filters work
before moving on.

---

## Part 2 — Push to GitHub

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new **empty** repository (don't let GitHub add a README — you already have one). Call
   it something like `show-pulse`.
3. From inside this project folder:

```bash
git init
git add .
git commit -m "Initial commit — The Show Pulse"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/show-pulse.git
git push -u origin main
```

Refresh the GitHub page — your code should be there.

---

## Part 3 — Deploy to Vercel

1. Create a free account at [vercel.com](https://vercel.com) — sign up with your GitHub account,
   it's the smoothest path.
2. Click **Add New → Project**, then select your `show-pulse` repo.
3. Vercel auto-detects it's a Vite project — leave the defaults, click **Deploy**.
4. After a minute or two, you'll get a live URL like `show-pulse-yourname.vercel.app`.

From now on: **every time you push to the `main` branch on GitHub, Vercel automatically rebuilds
and redeploys.** This is what makes the weekly automation work end-to-end — the bot commits, and
the site updates itself.

(Netlify works identically if you'd rather use that instead — same "connect repo, auto-deploy on
push" model.)

---

## Part 4 — Embed it in Kajabi via iframe

Once you have your live Vercel URL, add an iframe to the Kajabi page/tab where you want the tool
to appear. In Kajabi's page editor, add a **Custom HTML / Code Block** element and paste:

```html
<iframe
  src="https://show-pulse-yourname.vercel.app"
  style="width: 100%; height: 1400px; border: none; display: block;"
  loading="lazy"
  title="The Show Pulse"
></iframe>
```

A couple of things worth knowing:

- **Height is the main fiddly part with iframes.** A fixed height (like `1400px` above) is simplest
  but won't perfectly match content that changes length (e.g. filtering down to 3 shows vs. 500).
  If it feels off once it's live, tell me and I can add a small script to the tool that reports its
  own height to the parent page, which Kajabi can then use to auto-resize the iframe — a bit more
  setup, but a much better fit if this bothers you.
- Kajabi should let you gate the specific page/tab containing this iframe behind your paywall same
  as any other page — the iframe content itself doesn't need to know anything about Kajabi's access
  control, since the gate is on the page around it.

---

## Part 5 — Turn on the weekly auto-update (optional, whenever you're ready)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys).
2. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.
   Name it `ANTHROPIC_API_KEY`, paste in the key.
3. That's it — `.github/workflows/weekly-update.yml` will now run automatically every Monday. It
   researches 10 new shows, adds them to `shows.json` following the rules in `RUBRIC.md`, commits,
   and pushes. Vercel picks up the push and redeploys within a minute or two.
4. You can also trigger it manually any time: go to the **Actions** tab in GitHub → **Weekly show
   data update** → **Run workflow**.
5. Cost note: each run is capped at $3 and 40 turns (see the workflow file) as a safety limit —
   adjust those numbers if you want it to research more or less per week.

---

## Making ongoing changes

- **Add/edit/remove a show** → edit `public/data/shows.json` directly (or ask Claude Code to do it
  for you, referencing `RUBRIC.md`), commit, push. Site updates automatically.
- **Change the design or add a feature** → edit `src/App.jsx`, commit, push.
- **Flag a show as a personal recommendation** → add `"recommended": true` to that show's entry in
  `shows.json`.

If you want to keep talking through changes conversationally rather than editing code directly,
Claude Code (in your terminal, VS Code, or the desktop app) can make these edits for you against
this exact repo — just point it at the folder and describe what you want changed.
