// FEATHER & FLEE — run state and simulation: Gobbles the turkey, the chasing
// farmer, hazards (ovens, fences, carving knives, mud) and pickups.
import {
  BASE_RUN_SPEED, CORN_SCORE, ESCAPE_DISTANCE_METRES, FARMER_GAP_LOSS_ON_HIT,
  FARMER_GAP_LOSS_ON_MUD, FARMER_GAP_RECOVERY_PER_SECOND, FEATHER_BOOST_SPEED,
  FEATHER_SCORE, GRAVITY, INVULNERABLE_SECONDS_AFTER_HIT, JUMP_VELOCITY,
  LANE_CHANGE_SPEED, LANE_COUNT, LANE_GROUND_Y, LEAP_BONUS_SCORE,
  MAX_FARMER_GAP_METRES, MAX_RUN_SPEED, MUD_SLOW_FACTOR, PIXELS_PER_METRE,
  SCORE_PER_METRE, SPEED_GAIN_PER_METRE, START_FARMER_GAP_METRES, START_LIVES,
  TURKEY_RUN_X,
} from './config.js';
import { createSeededRandom, pickOne, randomBetween, randomInteger } from './random.js';

export function createRunState(seed) {
  return {
    phase: 'title', // title | playing | paused | caught | escaped
    seed,
    random: createSeededRandom(seed),
    timeSeconds: 0,
    scrollPixels: 0,
    distanceMetres: 0,
    pickupScore: 0,
    leapBonusScore: 0,
    lives: START_LIVES,
    farmerGapMetres: START_FARMER_GAP_METRES,
    turkey: {
      lane: 1,
      groundY: LANE_GROUND_Y[1],
      jumpHeight: 0,
      verticalVelocity: 0,
      invulnerableSeconds: 0,
      mudSlowSeconds: 0,
      featherBoostSeconds: 0,
      runCycle: 0,
    },
    entities: [],
    particles: [],
    nextSpawnInPixels: 500,
    message: '',
    messageSeconds: 0,
    stats: { cornEaten: 0, feathersCaught: 0, leaps: 0, hits: 0 },
    events: [], // sound cues drained by main.js each frame
  };
}

export function totalScore(state) {
  return Math.floor(state.distanceMetres * SCORE_PER_METRE) + state.pickupScore + state.leapBonusScore;
}

export function currentRunSpeed(state) {
  let speed = Math.min(MAX_RUN_SPEED, BASE_RUN_SPEED + state.distanceMetres * SPEED_GAIN_PER_METRE);
  if (state.turkey.featherBoostSeconds > 0) speed += FEATHER_BOOST_SPEED;
  if (state.turkey.mudSlowSeconds > 0) speed *= MUD_SLOW_FACTOR;
  return speed;
}

export function farmerScreenX(state) {
  const gapPixels = 70 + state.farmerGapMetres * 7.5;
  return Math.max(30, Math.min(TURKEY_RUN_X - 90, TURKEY_RUN_X - gapPixels));
}

export function nearestLaneIndex(groundY) {
  let best = 0;
  let bestDistance = Infinity;
  LANE_GROUND_Y.forEach((y, i) => {
    const d = Math.abs(y - groundY);
    if (d < bestDistance) { bestDistance = d; best = i; }
  });
  return best;
}

export function moveTurkeyToLane(state, laneIndex) {
  const clamped = Math.max(0, Math.min(LANE_COUNT - 1, laneIndex));
  if (clamped !== state.turkey.lane) {
    state.turkey.lane = clamped;
    state.events.push('lane');
  }
}

export function makeTurkeyJump(state) {
  if (state.turkey.jumpHeight <= 0.5) {
    state.turkey.verticalVelocity = JUMP_VELOCITY;
    state.turkey.jumpHeight = 1;
    state.events.push('jump');
  }
}

function spawnParticleBurst(state, x, y, count, colour, spread) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x, y,
      vx: randomBetween(state.random, -spread, spread),
      vy: randomBetween(state.random, -spread, spread * 0.4),
      life: randomBetween(state.random, 0.3, 0.8),
      maxLife: 0.8,
      colour,
      size: randomBetween(state.random, 3, 8),
    });
  }
}

function showFloatingMessage(state, text) {
  state.message = text;
  state.messageSeconds = 1.4;
}

// One spawn row: a hazard in one lane, sometimes a pickup in another lane,
// so there is always a survivable line.
function spawnNextObstacleRow(state) {
  const random = state.random;
  const spawnX = 1400;
  const hazardKind = pickOne(random, ['oven', 'oven', 'fence', 'knife', 'knife', 'mud', 'fence']);
  const hazardLane = randomInteger(random, 0, LANE_COUNT - 1);
  state.entities.push(makeEntity(hazardKind, hazardLane, spawnX));
  if (random() < 0.42) {
    const pickupKind = random() < 0.78 ? 'corn' : 'feather';
    let pickupLane = randomInteger(random, 0, LANE_COUNT - 1);
    if (pickupLane === hazardLane) pickupLane = (pickupLane + 1) % LANE_COUNT;
    state.entities.push(makeEntity(pickupKind, pickupLane, spawnX + randomBetween(random, 60, 220)));
  }
  if (state.distanceMetres > 350 && random() < 0.3) {
    let secondLane = randomInteger(random, 0, LANE_COUNT - 1);
    if (secondLane !== hazardLane) {
      state.entities.push(makeEntity(pickOne(random, ['fence', 'mud', 'oven']), secondLane, spawnX + 40));
    }
  }
}

export function makeEntity(kind, lane, x) {
  return { kind, lane, x, resolved: false, fallProgress: 0, warned: false, bobPhase: Math.random() * 6 };
}

function hurtTurkey(state, reason) {
  const turkey = state.turkey;
  if (turkey.invulnerableSeconds > 0) return;
  state.lives -= 1;
  state.stats.hits += 1;
  state.farmerGapMetres -= FARMER_GAP_LOSS_ON_HIT;
  turkey.invulnerableSeconds = INVULNERABLE_SECONDS_AFTER_HIT;
  state.events.push('hit');
  spawnParticleBurst(state, TURKEY_RUN_X, turkey.groundY - turkey.jumpHeight - 60, 14, '#e8dcc8', 160);
  showFloatingMessage(state, reason);
  if (state.lives <= 0) endRunAsCaught(state);
}

export function endRunAsCaught(state) {
  if (state.phase === 'caught' || state.phase === 'escaped') return;
  state.phase = 'caught';
  state.events.push('caught');
}

export function endRunAsEscaped(state) {
  if (state.phase === 'caught' || state.phase === 'escaped') return;
  state.phase = 'escaped';
  state.events.push('escaped');
}

function resolveTurkeyCollisions(state) {
  const turkey = state.turkey;
  const turkeyLane = nearestLaneIndex(turkey.groundY);
  for (const entity of state.entities) {
    if (entity.resolved) continue;
    const dx = entity.x - TURKEY_RUN_X;
    const sameLane = entity.lane === turkeyLane;
    if (entity.kind === 'corn' || entity.kind === 'feather') {
      if (sameLane && Math.abs(dx) < 52 && turkey.jumpHeight < 150) {
        entity.resolved = true;
        if (entity.kind === 'corn') {
          state.pickupScore += CORN_SCORE;
          state.stats.cornEaten += 1;
          state.farmerGapMetres = Math.min(MAX_FARMER_GAP_METRES, state.farmerGapMetres + 1.2);
          state.events.push('corn');
          showFloatingMessage(state, `+${CORN_SCORE} CORN!`);
        } else {
          state.pickupScore += FEATHER_SCORE;
          state.stats.feathersCaught += 1;
          turkey.featherBoostSeconds = 3;
          state.farmerGapMetres = Math.min(MAX_FARMER_GAP_METRES, state.farmerGapMetres + 3);
          state.events.push('feather');
          showFloatingMessage(state, `GOLDEN FEATHER +${FEATHER_SCORE}!`);
        }
        spawnParticleBurst(state, entity.x, LANE_GROUND_Y[entity.lane] - 70, 10, '#ffd94d', 120);
      }
      continue;
    }
    if (entity.kind === 'knife') {
      if (entity.fallProgress >= 1 && !entity.resolved) {
        entity.resolved = true;
        if (sameLane && Math.abs(dx) < 58) hurtTurkey(state, 'CARVING KNIFE!');
        else if (Math.abs(dx) < 58) { state.leapBonusScore += LEAP_BONUS_SCORE; }
      }
      continue;
    }
    if (Math.abs(dx) >= 54) continue;
    if (!sameLane) continue;
    if (entity.kind === 'oven') {
      entity.resolved = true;
      if (turkey.jumpHeight >= 92) {
        state.leapBonusScore += LEAP_BONUS_SCORE;
        state.stats.leaps += 1;
        showFloatingMessage(state, `LEAPED THE OVEN +${LEAP_BONUS_SCORE}`);
      } else hurtTurkey(state, 'INTO THE OVEN!');
    } else if (entity.kind === 'fence') {
      entity.resolved = true;
      if (turkey.jumpHeight >= 58) {
        state.leapBonusScore += LEAP_BONUS_SCORE;
        state.stats.leaps += 1;
        showFloatingMessage(state, `CLEARED THE FENCE +${LEAP_BONUS_SCORE}`);
      } else hurtTurkey(state, 'FENCE CRASH!');
    } else if (entity.kind === 'mud') {
      entity.resolved = true;
      if (turkey.jumpHeight < 12) {
        turkey.mudSlowSeconds = 1.5;
        state.farmerGapMetres -= FARMER_GAP_LOSS_ON_MUD;
        state.events.push('mud');
        showFloatingMessage(state, 'MUD! THE FARMER GAINS!');
        spawnParticleBurst(state, TURKEY_RUN_X, turkey.groundY - 8, 12, '#6b4a2a', 130);
      }
    }
  }
}

function updateFarmerPursuit(state, dt) {
  state.farmerGapMetres += FARMER_GAP_RECOVERY_PER_SECOND * dt;
  if (state.turkey.featherBoostSeconds > 0) state.farmerGapMetres += 1.6 * dt;
  if (state.turkey.mudSlowSeconds > 0) state.farmerGapMetres -= 3.5 * dt; // stuck in mud, he closes in
  if (state.distanceMetres > 600) state.farmerGapMetres -= 0.18 * dt; // late-run pressure
  state.farmerGapMetres = Math.min(MAX_FARMER_GAP_METRES, state.farmerGapMetres);
  if (state.farmerGapMetres <= 0) endRunAsCaught(state);
}

export function updateRun(state, dt) {
  if (state.phase !== 'playing') return;
  state.timeSeconds += dt;
  const turkey = state.turkey;
  const speed = currentRunSpeed(state);

  state.scrollPixels += speed * dt;
  state.distanceMetres = state.scrollPixels / PIXELS_PER_METRE;
  turkey.runCycle += dt * (speed / 46);

  // Lane movement eases toward the target lane's ground line.
  const targetY = LANE_GROUND_Y[turkey.lane];
  const dy = targetY - turkey.groundY;
  const step = LANE_CHANGE_SPEED * dt;
  turkey.groundY += Math.abs(dy) <= step ? dy : Math.sign(dy) * step;

  // Jump physics.
  if (turkey.jumpHeight > 0 || turkey.verticalVelocity !== 0) {
    turkey.verticalVelocity += GRAVITY * dt;
    turkey.jumpHeight -= turkey.verticalVelocity * dt;
    if (turkey.jumpHeight <= 0) {
      turkey.jumpHeight = 0;
      turkey.verticalVelocity = 0;
      spawnParticleBurst(state, TURKEY_RUN_X, turkey.groundY - 4, 6, '#c9a86a', 70);
    }
  }

  turkey.invulnerableSeconds = Math.max(0, turkey.invulnerableSeconds - dt);
  turkey.mudSlowSeconds = Math.max(0, turkey.mudSlowSeconds - dt);
  turkey.featherBoostSeconds = Math.max(0, turkey.featherBoostSeconds - dt);
  state.messageSeconds = Math.max(0, state.messageSeconds - dt);

  // Spawn and move entities.
  state.nextSpawnInPixels -= speed * dt;
  if (state.nextSpawnInPixels <= 0) {
    spawnNextObstacleRow(state);
    const tightening = Math.min(120, state.distanceMetres * 0.09);
    state.nextSpawnInPixels = randomBetween(state.random, 330, 520) - tightening;
  }
  for (const entity of state.entities) {
    entity.x -= speed * dt;
    if (entity.kind === 'knife') {
      if (entity.x < 980 && !entity.warned) {
        entity.warned = true;
        state.events.push('knifeWarning');
      }
      if (entity.x < 980) entity.fallProgress = Math.min(1, entity.fallProgress + dt / 0.62);
    }
  }
  state.entities = state.entities.filter((e) => e.x > -160);

  // Particles.
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 420 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  resolveTurkeyCollisions(state);
  updateFarmerPursuit(state, dt);
  if (state.distanceMetres >= ESCAPE_DISTANCE_METRES) endRunAsEscaped(state);
}

export function startRun(state) {
  const fresh = createRunState(state.seed + 1);
  Object.assign(state, fresh);
  state.phase = 'playing';
  state.events.push('click');
}

export function togglePause(state) {
  if (state.phase === 'playing') state.phase = 'paused';
  else if (state.phase === 'paused') state.phase = 'playing';
}
