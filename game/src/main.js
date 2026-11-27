// FEATHER & FLEE — entry point: canvas setup, the game loop, staged
// screenshot scenes (?shot=...), and the window.__game play-test hook.
import { LANE_GROUND_Y, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import {
  createRunState, endRunAsCaught, endRunAsEscaped, makeEntity, makeTurkeyJump,
  moveTurkeyToLane, startRun, togglePause, totalScore, updateRun,
} from './world.js';
import { renderFrame } from './render.js';
import { canvasPointFromEvent, handleCanvasClick, handleKeyDown } from './input.js';
import {
  playCaughtSound, playClickSound, playCornSound, playEscapeFanfare,
  playFeatherSound, playHitSound, playJumpSound, playKnifeWarningSound, playMudSound,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || 20261127;
const shotScene = params.get('shot');

const state = createRunState(seed);

function drainSoundEvents() {
  for (const eventName of state.events) {
    if (eventName === 'jump') playJumpSound();
    else if (eventName === 'corn') playCornSound();
    else if (eventName === 'feather') playFeatherSound();
    else if (eventName === 'hit') playHitSound();
    else if (eventName === 'mud') playMudSound();
    else if (eventName === 'click') playClickSound();
    else if (eventName === 'knifeWarning') playKnifeWarningSound();
    else if (eventName === 'escaped') playEscapeFanfare();
    else if (eventName === 'caught') playCaughtSound();
  }
  state.events.length = 0;
}

function announcePhase() {
  if (statusLine) {
    statusLine.textContent =
      state.phase === 'playing' ? `Running. Score ${totalScore(state)}, distance ${Math.floor(state.distanceMetres)} metres, lives ${state.lives}.`
      : state.phase === 'escaped' ? 'Gobbles escaped through the Freedom Gate.'
      : state.phase === 'caught' ? 'Gobbles was caught by the farmer.'
      : state.phase === 'paused' ? 'Paused.'
      : 'FEATHER and FLEE title screen. Press Enter to start.';
  }
}

// --- Staged screenshot scenes: fixed, deterministic frames of real game code.
function stagePlayScene({ cover }) {
  state.phase = 'playing';
  state.timeSeconds = cover ? 14.6 : 9.2;
  state.distanceMetres = cover ? 486 : 238;
  state.scrollPixels = state.distanceMetres * 28;
  state.pickupScore = cover ? 650 : 250;
  state.leapBonusScore = cover ? 125 : 50;
  state.lives = cover ? 2 : 3;
  state.farmerGapMetres = cover ? 9 : 19;
  state.turkey.lane = 1;
  state.turkey.groundY = LANE_GROUND_Y[1];
  state.turkey.jumpHeight = cover ? 118 : 0;
  state.turkey.runCycle = cover ? 21.4 : 13.1;
  state.turkey.featherBoostSeconds = cover ? 1.8 : 0;
  state.message = cover ? 'LEAPED THE OVEN +25' : '+50 CORN!';
  state.messageSeconds = 1.2;
  state.entities = cover
    ? [
        { ...makeEntity('oven', 1, 430), resolved: false },
        { ...makeEntity('knife', 0, 845), fallProgress: 0.72, warned: true },
        { ...makeEntity('corn', 2, 640) },
        { ...makeEntity('feather', 0, 1010) },
        { ...makeEntity('mud', 2, 1080) },
        { ...makeEntity('fence', 2, 180) },
      ]
    : [
        { ...makeEntity('fence', 0, 820) },
        { ...makeEntity('corn', 1, 700) },
        { ...makeEntity('oven', 2, 980) },
        { ...makeEntity('knife', 2, 1150), fallProgress: 0.2, warned: true },
      ];
}

function stageTitleScene() {
  state.phase = 'title';
  state.timeSeconds = 3.4;
  state.scrollPixels = 1400;
  state.turkey.lane = 1;
  state.turkey.groundY = LANE_GROUND_Y[1];
  state.turkey.runCycle = 6.2;
  state.farmerGapMetres = 16;
  state.entities = [
    { ...makeEntity('oven', 2, 940) },
    { ...makeEntity('corn', 0, 760) },
  ];
}

function stageEscapeScene() {
  stagePlayScene({ cover: false });
  state.distanceMetres = 1200;
  state.scrollPixels = 1200 * 28;
  state.pickupScore = 1400;
  state.leapBonusScore = 375;
  state.stats.cornEaten = 18;
  state.stats.leaps = 15;
  state.lives = 2;
  state.entities = [];
  state.message = '';
  state.phase = 'escaped';
}

function stageCaughtScene() {
  stagePlayScene({ cover: false });
  state.distanceMetres = 612;
  state.scrollPixels = 612 * 28;
  state.pickupScore = 500;
  state.lives = 0;
  state.farmerGapMetres = 0;
  state.phase = 'caught';
}

const SHOT_STAGERS = {
  cover: () => stagePlayScene({ cover: true }),
  play: () => stagePlayScene({ cover: false }),
  title: stageTitleScene,
  start: stageTitleScene,
  escape: stageEscapeScene,
  end: stageEscapeScene,
  caught: stageCaughtScene,
};

if (shotScene && SHOT_STAGERS[shotScene]) {
  SHOT_STAGERS[shotScene]();
  renderFrame(ctx, state);
  window.__shotReady = true;
} else {
  let lastTimestamp = performance.now();
  function gameLoop(timestamp) {
    const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;
    if (state.phase === 'title') {
      // Idle backdrop behind the title panel.
      state.timeSeconds += dt;
      state.scrollPixels += 60 * dt;
      state.turkey.runCycle += dt * 4;
    }
    updateRun(state, dt);
    drainSoundEvents();
    renderFrame(ctx, state);
    announcePhase();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => handleKeyDown(state, event));
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPointFromEvent(canvas, event);
  handleCanvasClick(state, point.x, point.y);
  drainSoundEvents();
});

// Play-test hook used by the headless test harness.
window.__game = {
  state,
  start: () => startRun(state),
  laneUp: () => moveTurkeyToLane(state, state.turkey.lane - 1),
  laneDown: () => moveTurkeyToLane(state, state.turkey.lane + 1),
  jump: () => makeTurkeyJump(state),
  pauseToggle: () => togglePause(state),
  forceCaught: () => endRunAsCaught(state),
  forceEscape: () => endRunAsEscaped(state),
  score: () => totalScore(state),
  spawnForTest: (kind, lane, x) => { state.entities.push(makeEntity(kind, lane, x)); },
  viewSize: { width: VIEW_WIDTH, height: VIEW_HEIGHT },
};
window.__gameReady = true;
