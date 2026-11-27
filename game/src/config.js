// FEATHER & FLEE — shared tuning constants for the turkey escape runner.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

// Three farm lanes Gobbles can run in; values are the ground line (feet y).
export const LANE_GROUND_Y = [452, 540, 628];
export const LANE_COUNT = LANE_GROUND_Y.length;

export const TURKEY_RUN_X = 400; // Gobbles stays near this x; the farm scrolls past.
export const PIXELS_PER_METRE = 28;
export const ESCAPE_DISTANCE_METRES = 1200; // reach the Freedom Gate to win.

export const START_LIVES = 3;
export const START_FARMER_GAP_METRES = 26;
export const MAX_FARMER_GAP_METRES = 40;

export const BASE_RUN_SPEED = 340; // px per second at the start of a run
export const MAX_RUN_SPEED = 620;
export const SPEED_GAIN_PER_METRE = 0.22;
export const FEATHER_BOOST_SPEED = 190;
export const MUD_SLOW_FACTOR = 0.45;

export const JUMP_VELOCITY = -1020;
export const GRAVITY = 2700;
export const LANE_CHANGE_SPEED = 980; // px per second between lanes

export const CORN_SCORE = 50;
export const FEATHER_SCORE = 150;
export const LEAP_BONUS_SCORE = 25;
export const SCORE_PER_METRE = 2;

export const FARMER_GAP_RECOVERY_PER_SECOND = 0.55;
export const FARMER_GAP_LOSS_ON_HIT = 9;
export const FARMER_GAP_LOSS_ON_MUD = 4.5;
export const INVULNERABLE_SECONDS_AFTER_HIT = 1.4;

// Clickable on-screen buttons (also drawn by the renderer).
export const BUTTONS = {
  start: { x: 490, y: 520, w: 300, h: 76, label: 'START RUN' },
  restart: { x: 490, y: 470, w: 300, h: 76, label: 'RUN AGAIN' },
  laneUp: { x: 1052, y: 560, w: 64, h: 64, label: '▲' },
  laneDown: { x: 1052, y: 636, w: 64, h: 64, label: '▼' },
  jump: { x: 1132, y: 596, w: 124, h: 64, label: 'JUMP' },
  pause: { x: 1188, y: 16, w: 76, h: 48, label: '❚❚' },
};

export function pointInsideButton(button, px, py) {
  return px >= button.x && px <= button.x + button.w && py >= button.y && py <= button.y + button.h;
}
