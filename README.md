# Rainbow Castle

An interactive storybook adventure for young children. Tap, paint and explore. There are no ads, no purchases, no timers to beat and no way to lose.

## Play

Current room: **Rainbow Castle**. Open `index.html` in a browser, or visit the published GitHub Pages site.

Works on iPad, Android tablets, phones and desktop browsers.

### How to play

- **Rainbow**: tap a colour band to pick it up as your paint colour.
- **Castle car**: tap a part of the car to paint it. Drag across the rainbow to sweep through colours.
- **Princess Carsi**: tap her to hear what she says. Tap her magic wand to cast a spell.
- **Castle door**: tap it to see who comes to visit.
- **Sun / moon**: tap to switch between day and night.
- **Sky, clouds, flowers, stars and windows**: tap to discover what happens.
- **Buttons (top right)**: next colour, rainbow magic (paints everything), start over.
- **Two players**: the name badge at the top shows whose turn it is. Turns switch after a couple of minutes.

Keyboard: Tab moves between the three buttons, and Enter or Space presses them. The rest of the scene is touch and mouse only at present.

## Run locally

Requires only a web browser and Python 3 (macOS and most Linux systems include it).

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Every push to `main` publishes the site to GitHub Pages through `.github/workflows/pages.yml`. In the repository settings, set **Pages → Source → GitHub Actions** once.

## Project layout

```
index.html        Rainbow Castle (the current room)
rooms/            One folder per room or world (added as they are built)
shared/           Code reused by several rooms (added when needed)
assets/           Local images, sounds and fonts
.github/          Deployment workflow
CLAUDE.md         Instructions for the AI coding assistant
```

## Design principles

- Exploration over testing: nothing is a right or wrong answer.
- Praise effort and curiosity, never outcomes.
- No advertising, purchases, streaks, pressure or failure screens.
- No account or sign-in is needed.
