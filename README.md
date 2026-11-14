# Intra-arterial lidocaine for uterine artery embolisation: slides

An interactive slide deck presenting:

> Haridasan T, Kena A, Nguyen L, Tan KT. Intra-arterial lidocaine as a pain management strategy for uterine artery embolisation: a systematic review and meta-analysis. CVIR Endovasc. 2026;9:121. https://doi.org/10.1186/s42155-026-00771-y

It is a static site (HTML, CSS and plain JavaScript) with no build step and no external requests. Fonts are self-hosted, so it also works offline.

## Presenting

| Key | Action |
| --- | --- |
| `→` `Space` `PgDn` | Next step or slide (works with most clickers) |
| `←` `PgUp` | Previous |
| `S` | Presenter view: notes, timer, next-slide preview. It stays in sync with the audience window. |
| `M` | List of all slides |
| `T` | Switch between light (DSA) and dark (roadmap) display |
| `F` | Full screen |
| `B` or `.` | Blank the screen |
| `3` then `Enter` | Jump to slide 3 |

Some slides reveal in steps, so press `→` until the slide is complete. Hover over chart elements to see the underlying numbers. The forest-plot and PRISMA slides include a button to open the original figure.

To export a PDF backup, print the page (Ctrl/Cmd + P) and choose Save as PDF. The output has one slide per page with every step revealed.

## Deploying to GitHub Pages

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. The deck will be published at `https://jason8908.github.io/slideshow-example/`. The QR code on the last slide points there.

To run it locally, serve the folder with `python3 -m http.server`, then open http://localhost:8000. Presenter sync needs the page to be served over HTTP rather than opened as a file.

## Editing

- **Slide text and speaker notes**: `index.html`. Each slide is a `<section class="slide">`, and its notes live in `<aside class="notes">`.
- **Numbers, studies and references**: `js/data.js`. Every chart is drawn from this file.
- **Citations**: add `<cite data-cite="key"></cite>` using a key from `REFS` in `js/data.js`. Numbers, the footer on each slide and the reference list are generated in order of first citation.

## Credits

The figures and data are from the article above, published Open Access under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The charts are redrawn from the published figures and tables. Fonts are Newsreader, Instrument Sans and IBM Plex Mono, all under the SIL Open Font License (see `assets/fonts/`).
