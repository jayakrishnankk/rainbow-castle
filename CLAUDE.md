# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Rainbow Castle Adventures**: a static, browser-only interactive storybook for two siblings, Avni (6, a girl, she/her) and Ansh (4, a boy, he/him), deployed to GitHub Pages. It should feel like a playable storybook, a toy box and a discovery world, never like a test or a reward machine. The universe grows world by world, and the content grows with the children.

Current content: **Rainbow Castle** (`index.html`), a single-screen scene, and its first room, the **Swimming Pool** (`worlds/castle/pool/`), reached through the castle door. The pool follows the children's swim-school levels (White, Red, Yellow built; Blue and Green later): each skill is a short scripted scene in `skills.js`, `pool.js` runs it and draws the room, `swimmer.js` draws the posable swimmers. Carsi is the swim teacher and Avni and Ansh are her students: in each skill Carsi demonstrates, then the playing child copies the move with their own swimmer. The second world is the **School**: the road sign by the castle drives Carsi's car to the school yard (`worlds/school/index.html`, the world's map, run by `school.js`: tap the windows, bell, clock, car; the door walks Carsi in), and from there into the **Kindergarten** class (`worlds/school/kindergarten/`). The class has nine classmates on a rug (`shared/classmates.js`: names, looks, favourite thing, SVG drawing; refer to them by name, never he/she); tapping one picks the next lesson's helper, who brings their favourite thing. Carsi teaches adding and taking away up to 20 on ten-frames: `lessons.js` holds the sizes (5, 10, 20), themes, problem maker and praise; `kindergarten.js` runs the lesson as a tap-driven story (show, add or take away, count) with no question to answer. Build only the world, room or activity the user explicitly requests next; future ideas stay ideas until asked for.

## Commands

There is no build, package manager, linter or test suite. Everything is plain HTML/CSS/JS served as-is.

- Run locally: `python3 -m http.server 8000` from the repo root, then open http://localhost:8000. **Required for new code**: ES modules (`<script type="module">`, `import`) fail under `file://` in most browsers, so do not tell the user to just double-click a file once modules exist.
- Verify a change: there are no automated tests. Load the page in a browser at phone width and a desktop width, and check the console for errors. For the inline script in `index.html`, the quickest syntax check is to paste it into `node --check` after extracting it to a temp file.
- Deploy: push to `main`. `.github/workflows/pages.yml` publishes the repo root to GitHub Pages. The repo's Pages setting must be "Source: GitHub Actions".

## Architecture

Navigation model: **World → Room → Activity** (for example Rainbow Castle → Swimming Pool → floating).

- **Static only, no build step.** Files are published exactly as they sit in the repo, so every path must be relative (no leading `/`) and work under the `/<repo-name>/` sub-path GitHub Pages uses. Must also run unchanged on any static host (Azure Static Web Apps, Netlify).
- **One folder per room**, nested in its world: `worlds/<world>/<room>/` holding the room's `index.html` and its own `.js`/`.css`; `worlds/<world>/index.html` is the world's map. Activities live inside their room's folder. Rooms are self-contained and never import each other.
- **Reusable systems go in `shared/`** (ES modules): speech, audio, input, character dialogue, praise/feedback, particles, room navigation, turn-taking timer. Before writing a helper inside a room, check `shared/`. Move a helper there when a second room needs it; build none speculatively (no inventory, journal or save system until a requested feature needs one).
- **`assets/`** holds local images, sounds and fonts (`assets/images/`, `assets/sounds/`). Prefer local over CDN. Story text and dialogue lines that several rooms share go in `data/` as JSON once that need appears.
- **Rainbow Castle is the exception** for now: its HTML, CSS and JS are all inline in `index.html` (about 1,000 lines). It works and must keep working. Migrating it into `worlds/castle/` and `shared/` is a planned refactor; do it deliberately, as its own change, never as a side effect of a new feature. Moving it changes its URL, so update README.md when it happens.
- **Root `index.html`** is currently the game. A second world (the School) now exists, reached by driving from the castle rather than from a picker; turning the root into a world picker and moving Rainbow Castle into `worlds/castle/` is still the planned castle refactor, done as its own change.
- Shared modules so far: `shared/audio.js` (synth sounds, mute), `shared/speech.js` (speech with the iOS unlock), `shared/particles.js` (canvas sparkles, drops, bubbles), `shared/turns.js` (the two kids; the turn travels between pages as `?turn=0|1`; the players setting), `shared/players.js` (the parent-only panel, opened by holding the name badge/cards for 2 s, that picks both children or only one on this device), `shared/classmates.js` (the school classmates and their SVG drawings, used by the school yard and the class). Rainbow Castle still has its own inline copies until the castle refactor.
- **Saved state** (`localStorage`, every access in try/catch; pages must work without it; nothing leaves the device):
  - `rainbowCastle.pool.v2`: each child's own cap level and tokens, `{ kids: [{ level, tokens }, { level, tokens }] }` (index 0 Avni, 1 Ansh). The old shared `v1` key is removed on load.
  - `rainbowCastle.kindergarten.v1`: each child's own number size, `{ kids: [{ size }, { size }] }` with size 5, 10 or 20 (defaults: Avni 20, Ansh 5).
  - `rainbowCastle.players.v1`: `'0'` or `'1'` when a parent chose "only Avni" or "only Ansh" for this device (each child on their own device); absent means both take turns. In solo mode that child always plays and there is no turn timer. The castle's inline script reads this key directly.
- `.nojekyll` stops GitHub Pages from running Jekyll, so files and folders with leading underscores are served. Keep it.

## Non-negotiable rules

- No frameworks, no build tools, no server-side code, no backend, no accounts, no in-app purchases or ads.
- **Discovery is the reward.** No scores, streaks, leaderboards, rankings, badges-for-counts or competitive rewards. No failure states: nothing to lose, no game-over, no lost progress, no "wrong". An unexpected action gets playful redirection ("That didn't work yet. Let's try another idea.").
- **Skill tokens (approved by the user for the pool):** each skill a child learns gives that child one token showing that skill's picture, placed on its spot in their path and on their own card at the top (Avni left, Ansh right, side by side). Allowed because there is no count or total, nothing marks who is ahead or names a winner, tokens are never lost, and every learned skill stays replayable. Don't add tallies, stars-per-skill or a "collected X of Y" anywhere.
- A timer is only acceptable for teaching turn-taking (the sibling-turn timer is the model: a random 3–5 minutes per turn in the castle and the pool, paused while the page is hidden, and in the pool a running skill always finishes before the turn passes); never a timer that pressures.
- **Process praise only.** Name what the child did: effort, persistence, curiosity, noticing, experimenting, practising ("You kept trying different colours.", "You noticed something new.", "You found another way."). Outcome or ability praise ("Good job", "Perfect", "You're smart", "You won", "You're the best") breaks this rule.
- Audio must be optional and every sound must have a visual counterpart.
- Accessibility: touch targets large enough for small fingers, keyboard support on desktop, `aria-label`s on interactive elements, colour choices that do not rely on red/green distinction alone, and respect `prefers-reduced-motion` (the existing CSS already does this).
- Mobile-first. Test at phone width; iOS Safari needs speech and audio to start from a `touchend`/`click` (see the unlock logic in `index.html`), not `pointerdown`.
- Keep files small and documented where logic is non-obvious (for example, the iOS speech workaround and the turn timer).

## Designing for Avni (6) and Ansh (4)

Apply this to every room, activity, character line and story beat.

- **Pre-reader baseline.** Ansh cannot read; Avni is an emerging reader. Nothing requires reading to progress. Instructions are spoken (when audio is on) and shown with pictures or animation. Text is a few simple words.
- **Grows with them.** Every activity works fully for a 4-year-old. Add depth as an optional layer the older child can reach (counting the things she painted, a word appearing under a picture, a "what happens if…" twist), never as a gate the younger child is stuck behind. Revisit difficulty as they grow; the user will say when.
- **One new idea at a time.** Introduce one concept per activity and reveal more gradually. Offer at most 3–5 choices at once in any menu or prompt (a scene may hold more tappable things to discover).
- **Fast and short.** Something meaningful happens within 5–15 seconds of a tap; a complete activity takes 1–3 minutes. Keep animations and dialogue short; avoid passive waiting.
- **Explore, don't quiz.** Prefer "what happens if…", hidden surprises, cause and effect, choices and open-ended play. Teach through experience, not explanation ("Let's try floating.", not "Today we will learn about buoyancy."). Right/wrong answers are never the main mechanic; drills and worksheets are out.
- **Let's explore together.** Design for two siblings at one screen: turn-taking, cooperative discovery, shared storytelling, helping each other. Never compare the children or name a winner.
- **Real skills, naturally.** Where it fits the play: language, early numeracy, patterns, cause and effect, creativity, problem solving, emotions, cooperation and physical-world concepts (floating, kicking and breathing in a pool; sorting and storytelling in a toy room; prediction and observation in a magic room).

### Princess Carsi

The main guide and play partner. She welcomes the children, introduces activities, asks questions, tells stories, demonstrates, explains discoveries and celebrates effort. Her lines are short, warm and age-appropriate. She is a guide, never a judge: no grading, no evaluating, no comparing siblings. Other characters follow the same rules.

### Design check

Before implementing a new world, room or activity, every answer must be yes, or redesign first:

1. Is it playful and understandable by a typical 4-year-old?
2. Does it invite exploration, with something meaningful within 15 seconds?
3. Does it teach through experience rather than explanation?
4. Does it work without reading, with no failure state?
5. Does all feedback praise process?
6. Does it support the siblings playing together?

## Adding a room or world

1. Add a section for it to README.md: what the children do there and what they practise (its educational intent), in plain language.
2. Create the folder and its `index.html` under `worlds/<world>/<room>/`.
3. Build its interactions, reusing or extending `shared/`.
4. Connect it to the world's map and back.

**Done** means: tested at phone and desktop width, keyboard accessible, works from a GitHub Pages sub-path, no console errors, passes the design check, README.md updated.

## Documentation duties

- Any change to navigation or game structure (new world or room, moved file, new shared module) updates README.md in the same change.
- README.md is for parents and players; keep it plain-language. Architecture belongs here, not in README.md.
