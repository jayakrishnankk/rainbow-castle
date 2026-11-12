// The swim steps, following the children's real swim-school levels (White, Red, Yellow).
// Princess Carsi is the swim teacher. In each step she shows the move at her spot in the shallow end
// ("Watch me!"), then the child whose turn it is copies it: each tap moves the child's own swimmer.
// Carsi says the cue words the children hear in their own lessons ("ears in, tummy up",
// "bubbles out, breathe in", "tuck and stand").
//
// Each step's run(ctx) is a short scripted scene (about 30–60 seconds) that waits for taps with
// ctx.ask([...buttons]) and returns a process-praise phrase; pool.js adds the child's name and gives
// that child the step's token. Nothing can go wrong: every button only moves the story on.
//
// ctx: C (the child's swimmer), T (Carsi), both see swimmer.js; P (pool geometry), say (Carsi speaks),
//      wait, ask, k() (whose turn), fx (particles at scene coordinates), sfx (shared/audio.js),
//      scene (props in index.html).
import { NOTES } from '../../../shared/audio.js';

const NUMBERS = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];

// ---------- the child's swimmer moving around the pool ----------

// the first water-safety rule: ask a grown-up before getting in (or jumping in)
async function askFirst(ctx, line = 'Ask me first!') {
  const { C, T, say, ask, sfx } = ctx;
  await say(line);
  await ask([{ id: 'ask', icon: '🙋', word: 'Ask' }]);
  C.set({ arms: 'cheer', face: 'wow' }, 250);
  sfx.chime();
  T.set({ arms: 'cheer' }, 250);
  await say(`Yes, ${ctx.k()}! Thank you for asking.`);
  C.set({ arms: 'down', face: 'happy' }, 250);
  T.set({ arms: 'down' }, 250);
}

async function stepsIn(ctx) {
  const { C, P, fx, sfx } = ctx;
  for (const s of P.steps) { await C.hop(s.x, s.y, 360); sfx.splash(0.2); }
  await C.hop(P.shallowX, P.FLOOR, 380);
  fx.drops(P.shallowX, P.WATER, 10, 4);
  C.set({ where: 'water' }, 0);
}

async function stepsOut(ctx) {
  const { C, P } = ctx;
  await standAt(ctx, P.shallowX);
  for (const s of [...P.steps].reverse()) await C.hop(s.x, s.y, 340);
  await C.hop(P.deckL, P.DECK, 380);
  C.set({ where: 'deck' }, 0);
}

// the child stands up in the shallow end at x (getting in first, or swimming over if floating)
async function standAt(ctx, x) {
  const { C, P, fx } = ctx;
  const s = C.state;
  if (s.where === 'deck') {
    await askFirst(ctx);
    await stepsIn(ctx);
  }
  const off = s.rot !== 0 || s.legs !== 'together' || Math.abs(s.y - (P.FLOOR - C.feet)) > 1;
  if (off && Math.abs(s.x - x) > 2) {
    const dir = x < s.x ? -1 : 1, ms = 500 + Math.abs(s.x - x) * 3;
    if (s.rot && s.rot * dir < 0) await C.set({ rot: 90 * dir }, 350); // face the way to go
    C.pulse('kick', ms);
    await C.set({ x, y: Math.min(s.y, P.WATER + 8) }, ms);
  }
  if (off) {
    await C.stand(x, P.FLOOR, 450, { face: 'happy' });
    fx.drops(x, P.WATER, 8, 4);
  } else if (Math.abs(s.x - x) > 2) {
    await C.set({ x }, 250 + Math.abs(s.x - x) * 3);
  }
}

// ---------- poses either swimmer can take (S = ctx.C or ctx.T) ----------

// lie flat in the water: kind 'front' (face in) or 'back'; dir 1 = head to the right
const lieDown = (ctx, S, x, kind, dir = 1, extra = {}, ms = 550) =>
  S.set({ x, y: ctx.P.WATER + (kind === 'front' ? 8 : 4), rot: 90 * dir,
    facing: kind === 'front' ? 'away' : 'front', arms: 'starfish', legs: 'apart', face: 'happy', ...extra }, ms);

// knees to tummy, a little ball just under the surface
const tuck = (ctx, S, x) => S.set({ x, y: ctx.P.WATER + 30, rot: 0, legs: 'tuck', arms: 'hug', facing: 'front', face: 'puff' }, 450);

// crouch under the water, bubbles out
const dipUnder = (ctx, S, ms = 420) => S.set({ y: ctx.P.FLOOR - 36.5 * S.scale, legs: 'tuck', arms: 'hug', face: 'puff' }, ms);

async function popUp(ctx, S) {
  const { P, fx, sfx } = ctx;
  await S.set({ y: P.FLOOR - S.feet, legs: 'together', arms: 'cheer', face: 'wow' }, 360);
  fx.drops(S.state.x, P.WATER, 12, 5); sfx.splash(0.35);
  S.set({ arms: 'down' }, 400);
}

// ---------- Carsi showing a move ----------

// Carsi back on her spot, standing and watching
const coachReady = (ctx, ms = 450) =>
  ctx.T.stand(ctx.P.coachX, ctx.P.FLOOR, ms, { face: 'happy', goggles: false, board: false, vest: false });

// "Watch me!": Carsi does the move, then hands over to the child
async function show(ctx, line, move) {
  await ctx.say(line);
  await move(ctx.T);
  await coachReady(ctx);
  await ctx.say(`Your turn, ${ctx.k()}!`);
}

// a few kicks or strokes on the spot
async function demoSwim(ctx, kind, how) {
  const { T, P, fx, sfx, wait } = ctx;
  await lieDown(ctx, T, P.coachX, kind, 1, { arms: 'up', legs: 'together' });
  for (let i = 0; i < 4; i++) {
    T.pulse('kick', 600);
    if (how === 'stroke') T.stroke(i % 2 ? 'R' : 'L');
    fx.drops(P.coachX - 105, P.WATER, 5, 3, 8);
    if (kind === 'front') fx.mouthBubbles(3, T);
    sfx.splash(0.15);
    await wait(520);
  }
}

// ---------- the child swimming across ----------

// swim from one x to another, one tap = one kick or one arm stroke.
// kind 'front' (face in) or 'back'; how 'kick' or 'stroke'. With roll: true a Roll button
// appears too and the child rolls between front and back whenever they choose.
async function swim(ctx, { from, to, kind, how, roll = false }) {
  const { C, P, fx, sfx, ask, say } = ctx;
  const dir = to > from ? 1 : -1;
  await lieDown(ctx, C, from, kind, dir, { arms: 'up', legs: 'together' });
  const go = how === 'kick'
    ? { id: 'go', icon: '🦶', word: 'Kick' }
    : { id: 'go', icon: '💪', word: 'Reach' };
  const buttons = roll ? [go, { id: 'roll', icon: '🔄', word: 'Roll' }] : [go];
  let x = from, side = 'L', strokes = 0, rolled = false;
  while ((to - x) * dir > 1) {
    const a = await ask(buttons);
    if (a === 'roll') {
      await C.roll();
      rolled = true;
      sfx.splash(0.2);
      const onBack = C.state.facing === 'front';
      say(onBack ? 'Roll and rest. Breathe!' : 'Face in. Bubbles!');
      if (onBack) fx.drops(C.state.x, P.WATER, 6, 3);
      continue;
    }
    strokes++;
    x = dir > 0 ? Math.min(to, x + (how === 'kick' ? 50 : 62)) : Math.max(to, x - (how === 'kick' ? 50 : 62));
    C.pulse('kick', 750);
    if (how === 'stroke') { C.stroke(side); side = side === 'L' ? 'R' : 'L'; }
    C.set({ x }, 700);
    fx.drops(x - dir * 95, P.WATER, 6, 4, 10);
    sfx.splash(0.2);
    if (C.state.facing === 'away') fx.mouthBubbles(4);
    if (how === 'stroke' && !roll && kind === 'front' && strokes % 3 === 0) say('Breathe!');
    else if (strokes % 4 === 0) say(how === 'kick' ? 'Kick, kick, kick!' : 'Reach and pull!');
  }
  if (roll && !rolled) {
    await say('Now roll and rest!');
    await ask([buttons[1]]);
    await C.roll();
    await say('Roll and rest. Breathe!');
  }
}

// ---------- the steps ----------

const white = [
  {
    id: 'askFirst', icon: '👍', word: 'Ask first',
    async run(ctx) {
      const { C, T, P, say, ask, fx, sfx } = ctx;
      if (C.state.where !== 'deck') await stepsOut(ctx);
      T.set({ arms: 'cheer' }, 300);
      await say('Hand up, and ask before you get in.');
      T.set({ arms: 'down' }, 300);
      await askFirst(ctx, `Your turn, ${ctx.k()}! Ask me.`);
      await say('Walk down the steps. Slow!');
      for (let i = 0; i < 3; i++) {
        await ask([{ id: 'step', icon: '🦶', word: 'Step' }]);
        const s = P.steps[i];
        await C.hop(s.x, s.y, 380);
        sfx.bell(NOTES[i * 2]); sfx.splash(0.2);
        fx.drops(s.x, P.WATER, 6, 3);
        say(NUMBERS[i]);
      }
      await C.hop(P.shallowX, P.FLOOR, 400);
      C.set({ where: 'water', arms: 'cheer', face: 'wow' }, 300);
      fx.drops(P.shallowX, P.WATER, 14, 5);
      await say("You're in! Slow and safe.");
      C.set({ arms: 'down', face: 'happy' }, 300);
      return 'you asked first, then went slow and safe.';
    }
  },
  {
    id: 'pour', icon: '🚿', word: 'Water on head',
    async run(ctx) {
      const { C, P, say, ask, scene, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch me pour water on my head!', async T => {
        scene.bucket(true, T);
        await wait(300);
        await scene.pour(T);
        T.set({ face: 'scrunch' }, 0);
        await wait(500);
        T.set({ face: 'wow' }, 0);
        await say('Like rain!');
        scene.bucket(false);
      });
      scene.bucket(true, C);
      const lines = ['Splash!', 'Like rain!', 'Eyes open!'];
      for (let i = 0; i < 3; i++) {
        await ask([{ id: 'pour', icon: '🪣', word: 'Pour' }]);
        await scene.pour(C);
        C.set({ face: i < 2 ? 'scrunch' : 'wow' }, 0);
        await say(lines[i]);
        await wait(300);
        C.set({ face: 'happy' }, 0);
      }
      scene.bucket(false);
      return 'you tried it again and again.';
    }
  },
  {
    id: 'look', icon: '🥽', word: 'Look under',
    async run(ctx) {
      const { C, P, say, ask, scene, wait, fx, sfx } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Goggles on. Big breath. Look under!', async T => {
        T.set({ goggles: true }, 0); sfx.pop();
        await wait(400);
        await dipUnder(ctx, T);
        fx.mouthBubbles(5, T);
        const [ch, name] = scene.friend(T);
        scene.peek(ch, false);
        await wait(1300);
        scene.peek(null);
        await popUp(ctx, T);
        await say(`I saw ${name}!`);
      });
      let looks = 0, sawBlurry = false, sawClear = false;
      while (looks < 3) {
        const g = C.state.goggles;
        const a = await ask([{ id: 'look', icon: '👀', word: 'Look' }, { id: 'goggles', icon: '🥽', word: g ? 'Off' : 'On' }]);
        if (a === 'goggles') {
          C.set({ goggles: !g }, 0); sfx.pop();
          await say(g ? 'Goggles off!' : 'Goggles on!');
          continue;
        }
        C.set({ face: 'puff' }, 0); sfx.tone(300, { dur: 0.5, vol: 0.12, slideTo: 600 });
        await wait(300);
        await dipUnder(ctx, C);
        sfx.splash(0.3);
        fx.mouthBubbles(6);
        const [ch, name] = scene.friend(C);
        scene.peek(ch, !C.state.goggles);
        await wait(1500);
        scene.peek(null);
        await popUp(ctx, C);
        looks++;
        if (C.state.goggles) { sawClear = true; await say(`You saw ${name}!`); }
        else if (!sawBlurry) { sawBlurry = true; await say('Blurry! Try the goggles.'); }
        else await say(`Blurry ${name}!`);
      }
      C.set({ goggles: false }, 0);
      return sawClear && sawBlurry ? 'you noticed what goggles do.' : 'you looked under again and again.';
    }
  },
  {
    id: 'tuckFront', icon: '🧍', word: 'Tuck and stand',
    async run(ctx) {
      const { C, P, say, ask, fx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch: float, tuck, stand!', async T => {
        await lieDown(ctx, T, P.coachX, 'front');
        fx.mouthBubbles(4, T);
        await wait(500);
        await tuck(ctx, T, P.coachX);
        await wait(300);
        await T.stand(P.coachX, P.FLOOR, 400, { arms: 'cheer', face: 'wow' });
        fx.drops(P.coachX, P.WATER, 10, 5);
      });
      for (let r = 0; r < 2; r++) {
        await ask([{ id: 'float', icon: '⭐', word: 'Float' }]);
        await lieDown(ctx, C, P.spotX, 'front');
        fx.mouthBubbles(6);
        say('Face in. Starfish!');
        await ask([{ id: 'tuck', icon: '⚽', word: 'Tuck' }]);
        await tuck(ctx, C, P.spotX);
        say('Knees to tummy!');
        await ask([{ id: 'stand', icon: '🧍', word: 'Stand' }]);
        await C.stand(P.spotX, P.FLOOR, 400, { arms: 'cheer', face: 'wow' });
        fx.drops(P.spotX, P.WATER, 12, 5);
        await say('Tuck and stand!');
        C.set({ arms: 'down', face: 'happy' }, 300);
      }
      return 'you practised tuck and stand two times.';
    }
  },
  {
    id: 'whiteBench', icon: '🤝', word: 'Hold hands', bench: true,
    async run(ctx) {
      const { C, T, P, say, ask, scene, wait, fx, sfx } = ctx;
      await standAt(ctx, P.spotX);
      await say('Hold my hands. Under for five!');
      await ask([{ id: 'hold', icon: '🤝', word: 'Hold' }]);
      await T.set({ x: P.spotX + 70, arms: 'out' }, 600);
      scene.hand(true, P.spotX + 35, P.WATER - 10);
      C.set({ face: 'puff', arms: 'out' }, 0);
      await wait(400);
      await dipUnder(ctx, C, 700);
      C.set({ face: 'calm' }, 0);
      scene.dots(5);
      for (let i = 0; i < 5; i++) {
        await wait(800);
        scene.dot(i);
        sfx.bell(NOTES[i]);
        fx.mouthBubbles(3);
        say(NUMBERS[i]);
      }
      await wait(500);
      scene.hand(false);
      await popUp(ctx, C);
      scene.dots(0);
      await say('You stayed calm under the water!');
      await coachReady(ctx);
      return 'you held on and counted to five with me.';
    }
  }
];

const red = [
  {
    id: 'floats', icon: '⭐', word: 'Float',
    async run(ctx) {
      const { C, P, say, ask, scene, fx, sfx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch me float. Ears in, tummy up!', async T => {
        await lieDown(ctx, T, P.coachX, 'back');
        scene.stars(true);
        await wait(1300);
        scene.stars(false);
      });
      await ask([{ id: 'float', icon: '⭐', word: 'Float' }]);
      scene.hand(true, P.spotX + 20, P.WATER + 50);
      await lieDown(ctx, C, P.spotX, 'back');
      scene.stars(true);
      await say("I'm holding you. Ears in, tummy up!");
      await ask([{ id: 'go', icon: '👋', word: 'Let go' }]);
      scene.hand(false);
      sfx.chime();
      await say("You're floating by yourself!");
      await ask([{ id: 'flip', icon: '🔄', word: 'Flip' }]);
      scene.stars(false);
      await C.roll();
      fx.mouthBubbles(6);
      await say('On your tummy. Bubbles!');
      await ask([{ id: 'stand', icon: '🧍', word: 'Stand' }]);
      await C.stand(P.spotX, P.FLOOR, 450, { arms: 'cheer', face: 'wow' });
      fx.drops(P.spotX, P.WATER, 12, 5);
      C.set({ arms: 'down', face: 'happy' }, 300);
      return 'you floated with help, then tried it by yourself.';
    }
  },
  {
    id: 'bob', icon: '🫧', word: 'Bobbing',
    async run(ctx) {
      const { C, P, say, ask, scene, fx, sfx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch me bob. Bubbles out, breathe in!', async T => {
        for (let i = 0; i < 2; i++) {
          T.set({ face: 'blow' }, 0);
          await dipUnder(ctx, T, 350);
          fx.mouthBubbles(6, T);
          sfx.bloop();
          await wait(450);
          await popUp(ctx, T);
          await wait(200);
        }
      });
      scene.dots(5);
      for (let i = 0; i < 5; i++) {
        await ask([{ id: 'bob', icon: '🫧', word: 'Bob' }]);
        C.set({ face: 'blow' }, 0);
        await dipUnder(ctx, C, 350);
        fx.mouthBubbles(8);
        for (let k = 0; k < 3; k++) sfx.bloop(k * 0.1);
        await wait(450);
        await popUp(ctx, C);
        scene.dot(i);
        sfx.bell(NOTES[i]);
        say(NUMBERS[i]);
      }
      await wait(600);
      scene.dots(0);
      await say('Five bobs!');
      return 'you kept going all the way to five.';
    }
  },
  {
    id: 'tuckBack', icon: '🔙', word: 'Tuck from back',
    async run(ctx) {
      const { C, P, say, ask, fx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch: back float, tuck, stand!', async T => {
        await lieDown(ctx, T, P.coachX, 'back');
        await wait(500);
        await tuck(ctx, T, P.coachX);
        await wait(300);
        await T.stand(P.coachX, P.FLOOR, 400, { arms: 'cheer', face: 'wow' });
        fx.drops(P.coachX, P.WATER, 10, 5);
      });
      for (let r = 0; r < 2; r++) {
        await ask([{ id: 'float', icon: '⭐', word: 'Back float' }]);
        await lieDown(ctx, C, P.spotX, 'back');
        say('Tummy up!');
        await ask([{ id: 'tuck', icon: '⚽', word: 'Tuck' }]);
        await tuck(ctx, C, P.spotX);
        say('Chin down, knees up!');
        await ask([{ id: 'stand', icon: '🧍', word: 'Stand' }]);
        await C.stand(P.spotX, P.FLOOR, 400, { arms: 'cheer', face: 'wow' });
        fx.drops(P.spotX, P.WATER, 12, 5);
        await say('Tuck and stand!');
        C.set({ arms: 'down', face: 'happy' }, 300);
      }
      return 'you practised it two times.';
    }
  },
  {
    id: 'kick', icon: '🦶', word: 'Kicking',
    async run(ctx) {
      const { C, P, say } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch me kick!', async T => {
        T.set({ board: true }, 0);
        await demoSwim(ctx, 'front', 'kick');
      });
      C.set({ board: true }, 0);
      await say('Kickboard! Kick on your tummy.');
      await swim(ctx, { from: P.spotX, to: 740, kind: 'front', how: 'kick' });
      C.set({ board: false }, 0);
      await say('Now kick on your back!');
      await swim(ctx, { from: 740, to: 430, kind: 'back', how: 'kick' });
      await C.stand(430, P.FLOOR, 450, { arms: 'cheer', face: 'wow' });
      C.set({ arms: 'down', face: 'happy' }, 300);
      return 'you kept kicking, kick after kick.';
    }
  },
  {
    id: 'redBench', icon: '🦺', word: 'Jump in', bench: true,
    async run(ctx) {
      const { C, P, say, ask, scene, fx, sfx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'In deep water, float on your back. Like this!', async T => {
        await lieDown(ctx, T, P.coachX, 'back');
        await wait(1000);
      });
      await say('Climb out at the ladder.');
      await ask([{ id: 'climb', icon: '🪜', word: 'Climb' }]);
      C.pulse('kick', 1600);
      await C.set({ x: P.ladderX - 20, y: P.WATER + 10, rot: 0, arms: 'up' }, 1600);
      await C.set({ x: P.ladderX, y: P.DECK - C.feet + 30 }, 700);
      await C.hop(P.deckR, P.DECK, 400);
      C.set({ where: 'deckR', arms: 'down' }, 0);
      await say('Life jacket on!');
      await ask([{ id: 'vest', icon: '🦺', word: 'Put on' }]);
      scene.vestHook(false);
      C.set({ vest: true }, 0); sfx.pop();
      await say('Snug and safe!');
      await askFirst(ctx, 'Ask me before you jump!');
      await ask([{ id: 'jump', icon: '🌊', word: 'Jump' }]);
      await C.set({ x: 860, y: P.DECK - C.feet - 70, arms: 'cheer', face: 'wow' }, 320);
      await C.set({ x: 760, y: P.WATER - 10, legs: 'together' }, 380);
      sfx.splash(1); fx.drops(760, P.WATER, 30, 9, 30); fx.ring(760, P.WATER);
      C.set({ where: 'water' }, 0);
      await lieDown(ctx, C, 740, 'back', -1);
      await say('Float on your back!');
      await wait(400);
      await say('Kick to the steps!');
      await swim(ctx, { from: 740, to: 440, kind: 'back', how: 'kick' });
      await C.stand(440, P.FLOOR, 450, { arms: 'cheer', face: 'wow' });
      C.set({ vest: false, arms: 'down', face: 'happy' }, 300);
      scene.vestHook(true);
      return 'you put on your life jacket and asked first.';
    }
  }
];

const yellow = [
  {
    id: 'frontStroke', icon: '💪', word: 'Front stroke',
    async run(ctx) {
      const { P, say } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch: big arms, reach and pull!', () => demoSwim(ctx, 'front', 'stroke'));
      await swim(ctx, { from: P.spotX, to: 760, kind: 'front', how: 'stroke' });
      await say('Across the pool!');
      await standAt(ctx, 440);
      return 'you kept reaching and pulling, again and again.';
    }
  },
  {
    id: 'backStroke', icon: '🙃', word: 'Back stroke',
    async run(ctx) {
      const { P, say } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch: on my back, arms go over!', () => demoSwim(ctx, 'back', 'stroke'));
      await swim(ctx, { from: P.spotX, to: 760, kind: 'back', how: 'stroke' });
      await say('Across the pool!');
      await standAt(ctx, 440);
      return 'you kept going, arm after arm.';
    }
  },
  {
    id: 'steer', icon: '↔️', word: 'Change way',
    async run(ctx) {
      const { C, P, say, ask, scene, sfx, fx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch me turn around!', async T => {
        await lieDown(ctx, T, P.coachX, 'front', 1, { arms: 'up', legs: 'together' });
        T.pulse('kick', 700);
        await wait(500);
        await T.set({ rot: -90 }, 500);
        T.pulse('kick', 700);
        await wait(600);
      });
      const toys = scene.toys(true);
      await say('Swim to a toy. You choose!');
      const seen = new Set();
      await lieDown(ctx, C, P.spotX, 'front', 1, { arms: 'up', legs: 'together' });
      while (seen.size < toys.length) {
        const id = await ask(toys.map(t => ({ id: t.id, icon: t.ch, word: t.word })));
        const t = toys.find(t => t.id === id);
        const dir = t.x > C.state.x ? 1 : -1;
        if (dir * C.state.rot < 0) { say('Turn around!'); await C.set({ rot: 90 * dir }, 500); }
        const goal = t.x - dir * 70, dist = Math.abs(goal - C.state.x);
        C.pulse('kick', dist * 4 + 200);
        const arms = setInterval(() => C.stroke(Math.random() < 0.5 ? 'L' : 'R'), 380);
        fx.mouthBubbles(4);
        try { await C.set({ x: goal }, Math.max(400, dist * 4)); } finally { clearInterval(arms); }
        scene.wiggleToy(id); sfx.chime();
        seen.add(id);
        await say(t.line);
        await wait(200);
      }
      scene.toys(false);
      await standAt(ctx, 440);
      return 'you chose where to go and turned to get there.';
    }
  },
  {
    id: 'roll', icon: '🔄', word: 'Roll',
    async run(ctx) {
      const { P, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch: swim, roll, rest!', async T => {
        await demoSwim(ctx, 'front', 'stroke');
        await T.roll();
        await wait(700);
      });
      await swim(ctx, { from: P.spotX, to: 760, kind: 'front', how: 'stroke', roll: true });
      await standAt(ctx, 440);
      return 'you chose when to roll and rest.';
    }
  },
  {
    id: 'yellowBench', icon: '🌊', word: 'Tread', bench: true,
    async run(ctx) {
      const { C, P, say, ask, scene, sfx, fx, wait } = ctx;
      await standAt(ctx, P.spotX);
      await show(ctx, 'Watch me tread water!', async T => {
        await T.set({ y: P.WATER + 30, arms: 'out' }, 400);
        T.pulse('tread', 1800);
        await wait(1800);
      });
      await say('Swim to the deep water!');
      C.pulse('kick', 1400);
      await C.set({ x: 760, y: P.WATER + 30, arms: 'out' }, 1400);
      await say('Tread water for ten.');
      await ask([{ id: 'tread', icon: '🌊', word: 'Tread' }]);
      scene.dots(10);
      for (let i = 0; i < 10; i++) {
        C.pulse('tread', 1200);
        scene.dot(i);
        sfx.bell(NOTES[i % 7] * (i < 7 ? 1 : 2));
        say(NUMBERS[i]);
        if (i % 3 === 0) fx.drops(760, P.WATER, 4, 2);
        await wait(750);
      }
      scene.dots(0);
      C.set({ arms: 'cheer', face: 'wow' }, 300);
      await say('Ten! Now swim, roll, swim!');
      await swim(ctx, { from: 760, to: 420, kind: 'front', how: 'stroke', roll: true });
      await C.stand(420, P.FLOOR, 450, { arms: 'cheer', face: 'wow' });
      C.set({ arms: 'down', face: 'happy' }, 300);
      return 'you kept going, one step after another.';
    }
  }
];

// cap: the swim cap a child wears while learning that level. After Yellow comes the next colour.
export const LEVELS = [
  { id: 'white', name: 'White', cap: '#FFFFFF', steps: white },
  { id: 'red', name: 'Red', cap: '#FF5A5F', steps: red },
  { id: 'yellow', name: 'Yellow', cap: '#FFD93D', steps: yellow }
];
export const NEXT_CAP = { name: 'Blue', cap: '#4D96FF' };
