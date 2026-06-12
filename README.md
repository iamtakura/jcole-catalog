# J. Cole Catalog

A cinematic, scroll-driven archive of J. Cole's 2020s discography. Built to explore the stories, themes, and inspiration behind every song — from *The Off-Season* to *The Fall-Off*.

Live at **[iamtakura.github.io/jcole-catalog](https://iamtakura.github.io/jcole-catalog)**

---

## What it is

53 songs. Three albums. One legacy.

Each song has its own detail page with a full breakdown — summary, themes, story, and inspiration — alongside dynamic color theming extracted from the album artwork via Color Thief. No music playback. Just the art and the words.

---

## Stack

| Tool | Role |
|---|---|
| [Astro](https://astro.build) | Static site framework |
| [GSAP + ScrollTrigger](https://gsap.com) | Scroll animations |
| [Lenis](https://lenis.darkroom.engineering) | Smooth scroll |
| [Barba.js](https://barba.js.org) | Page transitions |
| [Color Thief](https://lokeshdhakar.com/projects/color-thief/) | Dynamic palette extraction from cover art |
| Vanilla JS | Client-side filtering |
| GitHub Pages | Deployment |

---

## Features

- Full catalog of 53 songs across *The Off-Season*, *Might Delete Later*, *The Fall-Off*, plus 2020s singles and features
- Filter by album, type (album track, mixtape, single, feature), mood, and year
- Search by song title
- Per-song detail pages with AI-generated breakdowns
- Dynamic background palette on detail pages driven by album cover colors
- Cinematic hero with GSAP entrance animations
- Smooth scroll via Lenis
- Page transitions via Barba.js
- Mobile responsive

---

## Song Data

All song data lives in `src/data/songs.json`. Each entry follows this schema:

```json
{
  "id": "amari",
  "title": "a m a r i",
  "album": "The Off-Season",
  "year": 2021,
  "type": "album_track",
  "features": [],
  "producers": ["Tae Beast"],
  "mood": ["introspective", "spiritual", "melancholic"],
  "cover_image": "/images/covers/the-off-season.png",
  "breakdown": {
    "summary": "...",
    "themes": ["faith", "identity", "legacy"],
    "story": "...",
    "inspiration": "..."
  }
}
```

**Mood tags:** `hype` · `chill` · `introspective` · `motivational` · `romantic` · `melancholic` · `aggressive` · `spiritual`

**Type values:** `album_track` · `mixtape_track` · `single` · `feature`

---

## Local Development

```bash
git clone https://github.com/iamtakura/jcole-catalog.git
cd jcole-catalog
npm install
npm run dev
```

---

## Deployment

Deployed to GitHub Pages via GitHub Actions on every push to `main`.

```bash
npm run build
```

Output goes to `dist/`. The Actions workflow handles the rest.

---

## Project Structure

```
jcole-catalog/
├── public/
│   └── images/
│       └── covers/       ← Album cover images
├── src/
│   ├── data/
│   │   └── songs.json    ← Full song dataset
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro         ← Catalog homepage
│   │   └── songs/
│   │       └── [id].astro      ← Dynamic song detail pages
│   ├── components/
│   │   ├── SongCard.astro
│   │   ├── FilterBar.astro
│   │   └── AlbumSection.astro
│   └── styles/
│       └── global.css
└── astro.config.mjs
```

---

## Acknowledgements

Built by [@iamtakura](https://github.com/iamtakura) · Dreamville forever.
