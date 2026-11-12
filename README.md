# Rainbow Castle Adventures

An interactive storybook for young children, made for two siblings aged 4 and 6. Tap, paint and explore magical worlds, discover how things work, and make up stories together.

It is meant to feel like a playable storybook or a toy box, not a test. There are no ads, no purchases, no scores, no timers to beat and no way to lose. Nobody needs to read to play: Princess Carsi speaks the instructions, and pictures show what to do.

## Play

Current world: **Rainbow Castle**. Visit the published GitHub Pages site, or run it locally (see below).

Works on iPad, Android tablets, phones and desktop browsers.

### Rainbow Castle

**What children do:** paint Princess Carsi's castle car with colours from the rainbow, switch day and night, and tap around the scene to find surprises.

**What they practise:** naming colours, cause and effect (tap something, see what happens), curiosity, and taking turns with a sibling.

How to play:

- **Rainbow**: tap a colour band to pick it up as your paint colour.
- **Castle car**: tap a part of the car to paint it. Drag across the rainbow to sweep through colours.
- **Princess Carsi**: tap her to hear what she says. Tap her magic wand to cast a spell.
- **Castle door**: tap it to see who comes to visit.
- **Sun / moon**: tap to switch between day and night.
- **Sky, clouds, flowers, stars and windows**: tap to discover what happens.
- **Buttons (top right)**: next colour, rainbow magic (paints everything), start over.
- **Two players**: the name badge at the top shows whose turn it is. Turns switch after a couple of minutes.

Keyboard: Tab moves between the three buttons, and Enter or Space presses them. The rest of the scene is touch and mouse only at present.

## How the game is organised

The game is a set of **worlds** (Rainbow Castle first; others may follow). Each world has **rooms**, and each room has a few short **activities**. New rooms are added one at a time, and each gets its own section above saying what children do there and what they practise.

## Design principles

- **Discovery is the reward.** Children keep playing because it is interesting and surprising, not for points or prizes.
- **Exploration over testing.** Nothing is a right or wrong answer, and an unexpected tap gets a playful response.
- **Praise for trying, not for winning.** Characters say things like "You kept trying" or "You noticed something new", never "Good job" or "You're so smart".
- **Grows with the children.** Every activity works for a 4-year-old, with extra things for an older child to discover.
- **Together, not against each other.** Built for siblings to take turns and explore together; nobody wins and nobody is compared.
- **Short and calm.** Something happens within seconds of a tap, and a whole activity takes a minute or two.
- **Safe and private.** No advertising, purchases, streaks, pressure, failure screens, accounts or sign-in.
- **Sound is optional.** Everything you hear also shows on screen.

## Run locally

Requires only a web browser and Python 3 (macOS and most Linux systems include it).

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Every push to `main` publishes the site to GitHub Pages through `.github/workflows/pages.yml`. In the repository settings, set **Pages → Source → GitHub Actions** once. The site is plain files, so any static host (Netlify, Azure Static Web Apps) also works.

## Project layout

```
index.html        Rainbow Castle (the current world)
worlds/           One folder per world, with a folder per room inside (added as they are built)
shared/           Code reused by several rooms (added when needed)
assets/           Local images, sounds and fonts
.github/          Deployment workflow
CLAUDE.md         Instructions for the AI coding assistant
```
