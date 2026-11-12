# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, browser-only educational adventure game for young children, deployed to GitHub Pages. Current content: **Rainbow Castle** (`index.html`), a single-screen scene. Only build the room or world the user explicitly requests next; do not implement future ideas speculatively.

## Commands

There is no build, package manager, linter or test suite. Everything is plain HTML/CSS/JS served as-is.

- Run locally: `python3 -m http.server 8000` from the repo root, then open http://localhost:8000. **Required for new code**: ES modules (`<script type="module">`, `import`) fail under `file://` in most browsers, so do not tell the user to just double-click a file once modules exist.
- Verify a change: there are no automated tests. Load the page in a browser at phone width and a desktop width, and check the console for errors. For the inline script in `index.html`, the quickest syntax check is to paste it into `node --check` after extracting it to a temp file.
- Deploy: push to `main`. `.github/workflows/pages.yml` publishes the repo root to GitHub Pages. The repo's Pages setting must be "Source: GitHub Actions".

## Architecture

- **Static only, no build step.** Files are published exactly as they sit in the repo, so every path must be relative (no leading `/`) and work under the `/<repo-name>/` sub-path GitHub Pages uses.
- **One folder per room or world** under `rooms/<name>/` (`index.html` + its own `.js`/`.css`). Rooms are self-contained and must not import each other.
- **Reusable systems go in `shared/`** (ES modules), used by any room: audio, speech, input, praise/feedback, turn-taking timer. Before writing a helper inside a room, check whether it belongs in `shared/`. Build it there only once a second room needs it, not speculatively.
- **`assets/`** holds local images, audio and fonts. Prefer local over CDN.
- **Rainbow Castle is the exception** for now: its HTML, CSS and JS are all inline in `index.html` (about 1,000 lines). It works and must keep working. Migrating it into `rooms/rainbow-castle/` and `shared/` is a planned refactor; do it deliberately, as its own change, not as a side effect of a new feature. Moving it changes its URL, so update README.md when it happens.
- **Root `index.html`** is currently the game. If a hub/menu is added later, it becomes the root and Rainbow Castle moves into `rooms/`.
- `.nojekyll` stops GitHub Pages from running Jekyll, so files and folders with leading underscores are served. Keep it.

## Non-negotiable rules

- No frameworks, no build tools, no server-side code, no backend, no in-app purchases, ads, streaks, timers that pressure, or failure/losing states. A timer is only acceptable for teaching turn-taking (the existing sibling-turn timer is the model).
- Praise effort, curiosity, persistence and experimentation ("You kept trying different colors."). Never praise innate ability or outcomes ("You are smart", "You won", "Good job"). Note: Rainbow Castle's princess currently says "you are wonderful" (`index.html`, `HELLOS`); that breaks this rule and should be changed to effort/curiosity phrasing when that file is next touched.
- Audio must be optional and every sound must have a visual counterpart.
- Accessibility: touch targets large enough for small fingers, keyboard support on desktop, `aria-label`s on interactive elements, colour choices that do not rely on red/green distinction alone, and respect `prefers-reduced-motion` (the existing CSS already does this).
- Mobile-first. Test at phone width; iOS Safari needs speech and audio to start from a `touchend`/`click` (see the unlock logic in `index.html`), not `pointerdown`.
- Keep files small and documented where logic is non-obvious (for example, the iOS speech workaround and the turn timer).

## Documentation duties

- Any change to navigation or game structure (new room, moved file, new shared module) must update README.md in the same change.
- README.md is for parents and players; keep it plain-language. Architecture belongs here, not in README.md.
