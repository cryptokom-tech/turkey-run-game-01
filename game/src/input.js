// FEATHER & FLEE — keyboard and mouse input: lane changes, jumping,
// starting, pausing, restarting and muting.
import { BUTTONS, VIEW_HEIGHT, pointInsideButton } from './config.js';
import { makeTurkeyJump, moveTurkeyToLane, startRun, togglePause } from './world.js';
import { toggleMute } from './audio.js';

export function handleKeyDown(state, event) {
  const key = event.key;
  if (['ArrowUp', 'ArrowDown', ' '].includes(key)) event.preventDefault();
  if (key === 'm' || key === 'M') { toggleMute(); return; }
  if (state.phase === 'title') {
    if (key === 'Enter' || key === ' ') startRun(state);
    return;
  }
  if (state.phase === 'caught' || state.phase === 'escaped') {
    if (key === 'r' || key === 'R' || key === 'Enter') startRun(state);
    return;
  }
  if (key === 'p' || key === 'P' || key === 'Escape') { togglePause(state); return; }
  if (state.phase !== 'playing') return;
  if (key === 'ArrowUp' || key === 'w' || key === 'W') moveTurkeyToLane(state, state.turkey.lane - 1);
  else if (key === 'ArrowDown' || key === 's' || key === 'S') moveTurkeyToLane(state, state.turkey.lane + 1);
  else if (key === ' ') makeTurkeyJump(state);
  else if (key === 'r' || key === 'R') startRun(state);
}

export function handleCanvasClick(state, px, py) {
  if (state.phase === 'title') {
    if (pointInsideButton(BUTTONS.start, px, py)) startRun(state);
    return;
  }
  if (state.phase === 'caught' || state.phase === 'escaped') {
    if (pointInsideButton(BUTTONS.restart, px, py)) startRun(state);
    return;
  }
  if (pointInsideButton(BUTTONS.pause, px, py)) { togglePause(state); return; }
  if (state.phase !== 'playing') return;
  if (pointInsideButton(BUTTONS.laneUp, px, py)) { moveTurkeyToLane(state, state.turkey.lane - 1); return; }
  if (pointInsideButton(BUTTONS.laneDown, px, py)) { moveTurkeyToLane(state, state.turkey.lane + 1); return; }
  if (pointInsideButton(BUTTONS.jump, px, py)) { makeTurkeyJump(state); return; }
  // Clicking the track: upper third steps up a lane, lower third steps down,
  // the middle band jumps.
  if (py < VIEW_HEIGHT * 0.42) moveTurkeyToLane(state, state.turkey.lane - 1);
  else if (py > VIEW_HEIGHT * 0.72) moveTurkeyToLane(state, state.turkey.lane + 1);
  else makeTurkeyJump(state);
}

export function canvasPointFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}
