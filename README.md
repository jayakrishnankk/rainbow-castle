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
- **Castle door**: tap it to follow Princess Carsi inside to the swimming pool.
- **Sun / moon**: tap to switch between day and night.
- **Sky, clouds, flowers, stars and windows**: tap to discover what happens.
- **Buttons (top right)**: next colour, rainbow magic (paints everything), start over.
- **Two players**: the name badge at the top shows whose turn it is. Each turn lasts a random 3 to 5 minutes. (Grown-ups can set one child per device, see below.)

Keyboard: Tab moves between the three buttons, and Enter or Space presses them. The rest of the scene is touch and mouse only at present.

### Swimming Pool (inside Rainbow Castle)

**What children do:** Princess Carsi is the swim teacher, and Avni and Ansh are her students. For each skill Carsi shows the move first ("Watch me!"), then the child copies it: each tap on the big button at the bottom moves the child's own swimmer (step in, face in, float, kick, reach and pull). The skills follow real swim-school levels (White, Red and Yellow caps):

- **White cap**: ask before getting in, water poured on your head, looking underwater with and without goggles, tuck and stand from the front, and holding Carsi's hands to go under for five.
- **Red cap**: floating on the back and front, bobbing five times, tuck and stand from the back, kicking with a kickboard, and climbing out, putting on a life jacket and jumping into the deep end.
- **Yellow cap**: front stroke, back stroke, turning to swim to a toy you choose, rolling over to rest, and treading water for ten.

Each child has their own cap level and their own tokens. When a child finishes a skill, a golden token with that skill's picture flies to their card at the top (Avni on the left, Ansh on the right) and onto the path at the bottom, and Carsi says what the child did ("you asked first, then went slow and safe"). After the last skill of a cap level the child gets the next cap colour. There are no points, no totals and nothing to lose, and any learned skill can be played again by tapping its token. The cap button at the left of the path switches between cap levels already reached. Blue and Green caps will come later.

**Taking turns:** each turn lasts a random 3 to 5 minutes; the bar under the swimming child's card shows the time left. A skill that is still going is always finished before the turn passes.

**One child per device (for grown-ups):** if Avni and Ansh each play on their own tablet, press and hold the name cards at the top (in the castle: the name badge) for 2 seconds and choose "Only Avni" or "Only Ansh". That device then always plays as that child, with no turn timer. Choose "Avni and Ansh" to go back to taking turns. The setting is kept on that device.

Progress and the players setting are saved in this browser on this device only (nothing is sent anywhere). Clearing the browser's site data starts both children from the White cap again.

**What they practise:** the real cue words from their swim lessons ("ears in, tummy up", "bubbles out, breathe in", "tuck and stand"), water safety (always ask before getting in, life jackets in deep water), counting to five and ten, noticing (what goggles change), choosing a direction, and taking turns with a sibling.

How to play:

- **Path of buttons (bottom)**: the swimming child's own path. The glowing one is the next skill. Golden ones are skills already learned; tap one to practise it again.
- **During a skill**: watch Carsi, then tap the big button (or your swimmer) to make your move. ↩ stops and goes back to the path.
- **Duck, beach ball, whale fountain, water, stars and flags**: tap them for surprises.
- **Castle button (top left)**: back outside to the castle. **Speaker (top right)**: sound on or off.

Keyboard: Tab moves between all the buttons, and Enter or Space presses them.

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
index.html        Rainbow Castle (the castle outside)
worlds/castle/pool/  The swimming pool inside the castle
shared/           Code reused by several rooms (speech, sounds, sparkles, turns)
assets/           Local images, sounds and fonts
.github/          Deployment workflow
CLAUDE.md         Instructions for the AI coding assistant
```
