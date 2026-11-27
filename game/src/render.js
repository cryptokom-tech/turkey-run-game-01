// FEATHER & FLEE — all canvas drawing: autumn farm at golden hour, Gobbles
// the turkey, the chasing farmer, ovens, carving knives, HUD and screens.
import {
  BUTTONS, ESCAPE_DISTANCE_METRES, LANE_GROUND_Y, MAX_FARMER_GAP_METRES,
  TURKEY_RUN_X, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';
import { currentRunSpeed, farmerScreenX, totalScore } from './world.js';
import { isMuted } from './audio.js';

const FONT = 'Verdana, Geneva, sans-serif';

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGoldenHourSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, 430);
  sky.addColorStop(0, '#3d2b5c');
  sky.addColorStop(0.45, '#b34a3a');
  sky.addColorStop(0.8, '#f08c3c');
  sky.addColorStop(1, '#ffc65c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // Low sun.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(1060, 300, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,214,120,0.35)';
  ctx.beginPath();
  ctx.arc(1060, 300, 96, 0, Math.PI * 2);
  ctx.fill();
  // Clouds.
  ctx.fillStyle = 'rgba(255,190,140,0.55)';
  for (const [cx, cy, s] of [[180, 90, 1], [520, 60, 0.7], [860, 120, 0.85], [1180, 70, 0.6]]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 50 * s, cy + 8 * s, 60 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParallaxHillsAndBarn(ctx, scrollPixels) {
  // Far hills.
  ctx.fillStyle = '#7a3b4d';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  for (let x = 0; x <= VIEW_WIDTH; x += 40) {
    ctx.lineTo(x, 360 + Math.sin((x + scrollPixels * 0.08) * 0.008) * 26);
  }
  ctx.lineTo(VIEW_WIDTH, 430);
  ctx.lineTo(0, 430);
  ctx.closePath();
  ctx.fill();
  // Near hill band.
  ctx.fillStyle = '#9c5a33';
  ctx.fillRect(0, 398, VIEW_WIDTH, 40);
  // Red barn drifting slowly past.
  const barnX = 900 - ((scrollPixels * 0.18) % 1700);
  ctx.fillStyle = '#a83226';
  ctx.fillRect(barnX, 300, 150, 100);
  ctx.fillStyle = '#7e241b';
  ctx.beginPath();
  ctx.moveTo(barnX - 12, 302);
  ctx.lineTo(barnX + 75, 258);
  ctx.lineTo(barnX + 162, 302);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f3e2c7';
  ctx.lineWidth = 5;
  ctx.strokeRect(barnX + 52, 332, 46, 68);
  ctx.beginPath();
  ctx.moveTo(barnX + 52, 332); ctx.lineTo(barnX + 98, 400);
  ctx.moveTo(barnX + 98, 332); ctx.lineTo(barnX + 52, 400);
  ctx.stroke();
  // Fence posts along the horizon, scrolling with the world.
  ctx.fillStyle = '#5d3a1e';
  const postSpacing = 120;
  const offset = -(scrollPixels % postSpacing);
  for (let x = offset; x < VIEW_WIDTH; x += postSpacing) {
    ctx.fillRect(x, 404, 10, 34);
  }
  ctx.fillRect(0, 412, VIEW_WIDTH, 6);
  ctx.fillRect(0, 426, VIEW_WIDTH, 6);
}

function drawThreeLaneDirtTrack(ctx, scrollPixels) {
  const laneColours = ['#b57e42', '#a96f36', '#9a622c'];
  LANE_GROUND_Y.forEach((groundY, lane) => {
    const top = groundY - 44;
    ctx.fillStyle = laneColours[lane];
    ctx.fillRect(0, top, VIEW_WIDTH, 88);
    // Dark separator so the three lanes read at a glance.
    ctx.fillStyle = 'rgba(70,40,12,0.55)';
    ctx.fillRect(0, top, VIEW_WIDTH, 5);
    // Scrolling dashes marking the lane.
    ctx.fillStyle = 'rgba(255,238,200,0.5)';
    const dashSpacing = 90;
    const offset = -(scrollPixels % dashSpacing);
    for (let x = offset; x < VIEW_WIDTH; x += dashSpacing) {
      ctx.fillRect(x, groundY + 30, 44, 6);
    }
    // Dirt speckles.
    ctx.fillStyle = 'rgba(90,55,20,0.35)';
    const speckleSpacing = 150;
    const sOff = -((scrollPixels * 1.0 + lane * 53) % speckleSpacing);
    for (let x = sOff; x < VIEW_WIDTH; x += speckleSpacing) {
      ctx.beginPath();
      ctx.ellipse(x + 30, groundY + 12, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // Grass strip at the very bottom.
  ctx.fillStyle = '#6d7a2e';
  ctx.fillRect(0, VIEW_HEIGHT - 26, VIEW_WIDTH, 26);
}

function drawFallingAutumnLeaves(ctx, timeSeconds, scrollPixels) {
  ctx.fillStyle = 'rgba(230,120,40,0.8)';
  for (let i = 0; i < 22; i++) {
    const seed = i * 173.3;
    const x = ((seed * 7 - scrollPixels * 0.4 - timeSeconds * 30) % (VIEW_WIDTH + 60) + VIEW_WIDTH + 60) % (VIEW_WIDTH + 60) - 30;
    const y = 60 + ((seed + timeSeconds * (24 + (i % 5) * 7)) % 420);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(timeSeconds * 2 + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawTurkeyGobbles(ctx, x, groundY, jumpHeight, runCycle, invulnerable) {
  const y = groundY - jumpHeight;
  ctx.save();
  ctx.translate(x, y);
  if (invulnerable) ctx.globalAlpha = 0.45 + 0.3 * Math.sin(runCycle * 6);
  // Shadow on the ground.
  ctx.fillStyle = 'rgba(40,20,5,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, jumpHeight + 4, 46 - Math.min(20, jumpHeight * 0.08), 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Fanned tail feathers.
  const tailColours = ['#c1440e', '#e07b24', '#8a4b1f', '#d95f16', '#a83226'];
  for (let i = 0; i < 5; i++) {
    const angle = -2.35 + i * 0.32 + Math.sin(runCycle * 2 + i) * 0.04;
    ctx.fillStyle = tailColours[i];
    ctx.save();
    ctx.translate(-34, -52);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, -34, 13, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,160,0.7)';
    ctx.beginPath();
    ctx.ellipse(0, -58, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs, running.
  ctx.strokeStyle = '#d98a2b';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const legSwing = jumpHeight > 2 ? 0.5 : Math.sin(runCycle * 3.2) * 16;
  ctx.beginPath();
  ctx.moveTo(-8, -26); ctx.lineTo(-8 + legSwing, -2);
  ctx.moveTo(12, -26); ctx.lineTo(12 - legSwing, -2);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#7a4a24';
  ctx.beginPath();
  ctx.ellipse(0, -52, 52, 38, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#96622f';
  ctx.beginPath();
  ctx.ellipse(8, -46, 38, 26, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Wing, flapping harder while airborne.
  const flap = jumpHeight > 2 ? Math.sin(runCycle * 9) * 0.5 : Math.sin(runCycle * 3.2) * 0.12;
  ctx.save();
  ctx.translate(-4, -58);
  ctx.rotate(-0.25 + flap);
  ctx.fillStyle = '#5d3717';
  ctx.beginPath();
  ctx.ellipse(-16, 6, 30, 15, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Neck and head.
  ctx.fillStyle = '#7a4a24';
  ctx.beginPath();
  ctx.ellipse(38, -78, 16, 24, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a7fb5';
  ctx.beginPath();
  ctx.arc(50, -100, 16, 0, Math.PI * 2);
  ctx.fill();
  // Wattle and snood.
  ctx.fillStyle = '#d92b2b';
  ctx.beginPath();
  ctx.ellipse(60, -84, 7, 13, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(56, -106, 5, 10, 0.7, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2a81d';
  ctx.beginPath();
  ctx.moveTo(62, -102);
  ctx.lineTo(84, -96);
  ctx.lineTo(62, -90);
  ctx.closePath();
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#14100c';
  ctx.beginPath();
  ctx.arc(54, -104, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFarmerChasingWithNet(ctx, x, groundY, runCycle) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.fillStyle = 'rgba(40,20,5,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const legSwing = Math.sin(runCycle * 3.4) * 18;
  // Legs in overalls.
  ctx.strokeStyle = '#2e4a7a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -58); ctx.lineTo(-4 + legSwing, -2);
  ctx.moveTo(8, -58); ctx.lineTo(8 - legSwing, -2);
  ctx.stroke();
  // Boots.
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(-14 + legSwing, -8, 22, 8);
  ctx.fillRect(-2 - legSwing, -8, 22, 8);
  // Torso: plaid shirt + overalls bib.
  ctx.fillStyle = '#b03a2e';
  ctx.beginPath();
  ctx.ellipse(2, -84, 26, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e4a7a';
  ctx.fillRect(-12, -96, 30, 34);
  // Back arm pumping.
  ctx.strokeStyle = '#b03a2e';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-14, -100);
  ctx.lineTo(-26 - legSwing * 0.5, -72);
  ctx.stroke();
  // Front arm holding the net up high.
  ctx.beginPath();
  ctx.moveTo(16, -102);
  ctx.lineTo(38, -128);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(38, -128);
  ctx.lineTo(64, -158);
  ctx.stroke();
  ctx.strokeStyle = '#e8e2d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(76, -166, 22, 17, 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(60, -178); ctx.lineTo(92, -154);
  ctx.moveTo(58, -160); ctx.lineTo(94, -172);
  ctx.stroke();
  // Head, beard, straw hat.
  ctx.fillStyle = '#f0b98a';
  ctx.beginPath();
  ctx.arc(4, -128, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6e4520';
  ctx.beginPath();
  ctx.ellipse(10, -116, 12, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c24a';
  ctx.beginPath();
  ctx.ellipse(4, -142, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -148, 17, 10, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14100c';
  ctx.beginPath();
  ctx.arc(12, -130, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlowingOven(ctx, x, groundY, timeSeconds) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.fillStyle = 'rgba(40,20,5,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 3, 52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#4a4f57';
  roundedRect(ctx, -46, -96, 92, 96, 8);
  ctx.fill();
  ctx.fillStyle = '#33373e';
  ctx.fillRect(-46, -96, 92, 16);
  // Burners.
  ctx.fillStyle = '#1d1f23';
  ctx.beginPath(); ctx.arc(-22, -88, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, -88, 10, 0, Math.PI * 2); ctx.fill();
  // Glowing oven door with a roast silhouette inside.
  const glow = 0.75 + 0.25 * Math.sin(timeSeconds * 7);
  ctx.fillStyle = `rgba(255,${Math.floor(120 + 60 * glow)},30,1)`;
  roundedRect(ctx, -34, -66, 68, 52, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,40,10,0.85)';
  ctx.beginPath();
  ctx.ellipse(0, -38, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#202226';
  ctx.lineWidth = 4;
  roundedRect(ctx, -34, -66, 68, 52, 6);
  ctx.stroke();
  // Handle and warning label.
  ctx.fillStyle = '#c8ccd2';
  ctx.fillRect(-34, -74, 68, 6);
  ctx.fillStyle = '#ffd94d';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('OVEN', 0, -104);
  // Heat shimmer flames.
  ctx.fillStyle = 'rgba(255,150,40,0.8)';
  for (let i = -1; i <= 1; i++) {
    const h = 12 + 6 * Math.sin(timeSeconds * 11 + i * 2);
    ctx.beginPath();
    ctx.moveTo(i * 18 - 6, -96);
    ctx.lineTo(i * 18, -96 - h);
    ctx.lineTo(i * 18 + 6, -96);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFenceHurdle(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.fillStyle = '#6e4520';
  ctx.fillRect(-44, -58, 10, 58);
  ctx.fillRect(34, -58, 10, 58);
  ctx.fillRect(-52, -52, 104, 10);
  ctx.fillRect(-52, -30, 104, 10);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(-52, -52, 104, 4);
  ctx.restore();
}

function drawMudPuddle(ctx, x, groundY, timeSeconds) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.fillStyle = '#4a2f16';
  ctx.beginPath();
  ctx.ellipse(0, -4, 58, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4a2a';
  ctx.beginPath();
  ctx.ellipse(-8, -6, 36, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,230,190,0.5)';
  const bubble = (timeSeconds * 30) % 24;
  ctx.beginPath();
  ctx.arc(-18 + bubble, -8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFallingCarvingKnife(ctx, entity, groundY) {
  // Falls from just above the top of the screen to the lane, staying visible
  // for most of the drop so the warning reads clearly.
  const fallY = -40 + entity.fallProgress * (groundY - 46 + 40);
  // Warning shadow + marker on the lane it will hit.
  ctx.save();
  ctx.fillStyle = 'rgba(160,20,10,0.4)';
  ctx.beginPath();
  ctx.ellipse(entity.x, groundY - 2, 30 + entity.fallProgress * 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (entity.fallProgress < 1) {
    ctx.fillStyle = '#ffdf3d';
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', entity.x, groundY - 22);
  }
  // The knife itself: long blade, dark handle, falling point-down.
  ctx.translate(entity.x, fallY);
  ctx.rotate(0.12);
  ctx.fillStyle = '#e9edf2';
  ctx.beginPath();
  ctx.moveTo(-7, -70);
  ctx.lineTo(7, -70);
  ctx.lineTo(5, 30);
  ctx.lineTo(0, 52);
  ctx.lineTo(-5, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b9c2cc';
  ctx.beginPath();
  ctx.moveTo(0, -70); ctx.lineTo(7, -70); ctx.lineTo(5, 30); ctx.lineTo(0, 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2412';
  roundedRect(ctx, -6, -104, 12, 36, 5);
  ctx.fill();
  ctx.restore();
}

function drawCornPickup(ctx, x, groundY, timeSeconds) {
  const bob = Math.sin(timeSeconds * 4 + x * 0.02) * 5;
  ctx.save();
  ctx.translate(x, groundY - 56 + bob);
  ctx.rotate(-0.4);
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0a81e';
  for (let row = -3; row <= 3; row++) {
    for (let col = -1; col <= 1; col++) {
      ctx.beginPath();
      ctx.arc(col * 8, row * 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#5d8a3c';
  ctx.beginPath();
  ctx.ellipse(-12, 24, 8, 18, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, 24, 8, 18, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGoldenFeatherPickup(ctx, x, groundY, timeSeconds) {
  const bob = Math.sin(timeSeconds * 5 + x * 0.03) * 6;
  ctx.save();
  ctx.translate(x, groundY - 62 + bob);
  ctx.rotate(0.5 + Math.sin(timeSeconds * 3) * 0.15);
  ctx.fillStyle = 'rgba(255,215,80,0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.ellipse(0, -8, 12, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -36);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.restore();
}

function drawFreedomGate(ctx, state) {
  // The gate stands at the escape distance; it scrolls in during the last stretch.
  const metresLeft = ESCAPE_DISTANCE_METRES - state.distanceMetres;
  if (metresLeft > 60) return;
  const gateX = TURKEY_RUN_X + metresLeft * 28;
  if (gateX > VIEW_WIDTH + 160) return;
  ctx.save();
  ctx.translate(gateX, 0);
  ctx.fillStyle = '#7a4a24';
  ctx.fillRect(-70, 300, 16, 330);
  ctx.fillRect(54, 300, 16, 330);
  ctx.fillStyle = '#96622f';
  ctx.fillRect(-84, 268, 168, 40);
  ctx.fillStyle = '#fff3cf';
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM', 0, 297);
  ctx.restore();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.fillStyle = filled ? '#e8323e' : 'rgba(120,100,90,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-14, -4, -8, -16, 0, -7);
  ctx.bezierCurveTo(8, -16, 14, -4, 0, 8);
  ctx.fill();
  ctx.restore();
}

function drawButton(ctx, button, fill, textColour, fontSize = 26) {
  ctx.fillStyle = fill;
  roundedRect(ctx, button.x, button.y, button.w, button.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = textColour;
  ctx.font = `bold ${fontSize}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 2);
  ctx.textBaseline = 'alphabetic';
}

export function drawHudScoreDistanceLives(ctx, state) {
  // Top bar backing.
  ctx.fillStyle = 'rgba(24,12,4,0.72)';
  roundedRect(ctx, 12, 10, 1008, 86, 14);
  ctx.fill();
  ctx.textAlign = 'left';
  // Score.
  ctx.fillStyle = '#ffd94d';
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('SCORE', 30, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillText(String(totalScore(state)), 30, 78);
  // Distance + progress to the Freedom Gate.
  ctx.fillStyle = '#ffd94d';
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('DISTANCE', 330, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillText(`${Math.floor(state.distanceMetres)} m`, 330, 78);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundedRect(ctx, 520, 56, 260, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#7ee787';
  const progress = Math.min(1, state.distanceMetres / ESCAPE_DISTANCE_METRES);
  if (progress > 0.01) {
    roundedRect(ctx, 520, 56, 260 * progress, 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = '#cfe8ff';
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(`FREEDOM GATE ${ESCAPE_DISTANCE_METRES} m`, 520, 48);
  // Lives.
  ctx.fillStyle = '#ffd94d';
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('LIVES', 830, 36);
  for (let i = 0; i < 3; i++) drawHeart(ctx, 852 + i * 44, 66, 34, i < state.lives);
  // Farmer danger meter.
  ctx.fillStyle = 'rgba(24,12,4,0.72)';
  roundedRect(ctx, 12, 104, 430, 54, 12);
  ctx.fill();
  ctx.fillStyle = '#ffb3a0';
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText('FARMER', 28, 128);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundedRect(ctx, 28, 136, 398, 14, 7);
  ctx.fill();
  const gapFraction = Math.max(0, Math.min(1, state.farmerGapMetres / MAX_FARMER_GAP_METRES));
  ctx.fillStyle = gapFraction < 0.25 ? '#ff4444' : gapFraction < 0.5 ? '#ff9f2e' : '#7ee787';
  if (gapFraction > 0.01) {
    roundedRect(ctx, 28, 136, 398 * gapFraction, 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(gapFraction < 0.25 ? 'HE IS RIGHT BEHIND YOU!' : 'gap to the farmer', 140, 128);
  // Speed + mute hint on a dark pill for contrast.
  const kmh = Math.round(currentRunSpeed(state) * 0.11);
  ctx.fillStyle = 'rgba(24,12,4,0.72)';
  roundedRect(ctx, 12, VIEW_HEIGHT - 64, isMuted() ? 300 : 190, 34, 9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`SPEED ${kmh} km/h${isMuted() ? '   SOUND OFF (M)' : ''}`, 24, VIEW_HEIGHT - 41);
}

function drawTouchButtons(ctx) {
  drawButton(ctx, BUTTONS.laneUp, 'rgba(24,12,4,0.75)', '#ffffff', 26);
  drawButton(ctx, BUTTONS.laneDown, 'rgba(24,12,4,0.75)', '#ffffff', 26);
  drawButton(ctx, BUTTONS.jump, 'rgba(46,125,50,0.9)', '#ffffff', 24);
  drawButton(ctx, BUTTONS.pause, 'rgba(24,12,4,0.75)', '#ffffff', 20);
}

function drawFloatingMessage(ctx, state) {
  if (state.messageSeconds <= 0 || !state.message) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.messageSeconds);
  ctx.font = `bold 34px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(30,15,0,0.85)';
  ctx.strokeText(state.message, VIEW_WIDTH / 2, 210);
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(state.message, VIEW_WIDTH / 2, 210);
  ctx.restore();
}

function drawDangerVignette(ctx, state) {
  if (state.phase !== 'playing' || state.farmerGapMetres >= 8) return;
  const pulse = 0.16 + 0.1 * Math.sin(state.timeSeconds * 8);
  const gradient = ctx.createRadialGradient(640, 360, 320, 640, 360, 760);
  gradient.addColorStop(0, 'rgba(200,30,10,0)');
  gradient.addColorStop(1, `rgba(200,30,10,${pulse})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function drawTitleScreen(ctx, state) {
  ctx.fillStyle = 'rgba(20,8,2,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = 'rgba(30,16,6,0.92)';
  roundedRect(ctx, 240, 58, 800, 560, 24);
  ctx.fill();
  ctx.strokeStyle = '#f2a81d';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = `bold 72px ${FONT}`;
  ctx.fillText('FEATHER & FLEE', 640, 150);
  ctx.fillStyle = '#ffb3a0';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText('The Great Gobble Escape', 640, 192);
  ctx.fillStyle = '#ffffff';
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Gobbles the turkey refuses to be Thanksgiving dinner.', 640, 238);
  ctx.fillText('Outrun the farmer, leap the ovens, dodge the carving knives,', 640, 266);
  ctx.fillText(`and reach the Freedom Gate at ${ESCAPE_DISTANCE_METRES} m!`, 640, 294);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = `bold 21px ${FONT}`;
  ctx.fillText('CONTROLS', 640, 344);
  ctx.fillStyle = '#ffffff';
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Up / W  ·  Down / S — change lane      Space — jump', 640, 378);
  ctx.fillText('Mouse — click upper / lower track to switch lane, JUMP to leap', 640, 406);
  ctx.fillText('P — pause      M — mute      R — restart', 640, 434);
  ctx.fillStyle = '#7ee787';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Corn +50 · Feather = boost · Mud slows you!', 640, 476);
  drawButton(ctx, BUTTONS.start, '#2e7d32', '#ffffff', 30);
  // Gobbles and the farmer flank the start button on the title panel.
  drawTurkeyGobbles(ctx, 352, 602, 0, state.turkey.runCycle, false);
  drawFarmerChasingWithNet(ctx, 908, 602, state.turkey.runCycle + 1.7);
}

function drawEndScreen(ctx, state) {
  const escaped = state.phase === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(8,40,14,0.55)' : 'rgba(40,6,2,0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = 'rgba(30,16,6,0.94)';
  roundedRect(ctx, 300, 120, 680, 440, 24);
  ctx.fill();
  ctx.strokeStyle = escaped ? '#7ee787' : '#ff6b5e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#7ee787' : '#ff6b5e';
  ctx.font = `bold 76px ${FONT}`;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 230);
  ctx.fillStyle = '#ffffff';
  ctx.font = `22px ${FONT}`;
  ctx.fillText(
    escaped
      ? 'Gobbles bursts through the Freedom Gate. No dinner tonight!'
      : 'The farmer nets Gobbles. Thanksgiving is back on the menu...',
    640, 276,
  );
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(`SCORE  ${totalScore(state)}`, 640, 336);
  ctx.font = `24px ${FONT}`;
  ctx.fillText(`Distance  ${Math.floor(state.distanceMetres)} m      Corn  ${state.stats.cornEaten}      Leaps  ${state.stats.leaps}`, 640, 380);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = `19px ${FONT}`;
  ctx.fillText('Press R or click RUN AGAIN to try another escape.', 640, 420);
  drawButton(ctx, BUTTONS.restart, '#2e7d32', '#ffffff', 28);
}

function drawPausedOverlay(ctx) {
  ctx.fillStyle = 'rgba(10,6,2,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 64px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 340);
  ctx.font = `22px ${FONT}`;
  ctx.fillText('Press P to keep running.', 640, 386);
}

export function renderFrame(ctx, state) {
  drawGoldenHourSky(ctx);
  drawParallaxHillsAndBarn(ctx, state.scrollPixels);
  drawThreeLaneDirtTrack(ctx, state.scrollPixels);
  drawFreedomGate(ctx, state);
  drawFallingAutumnLeaves(ctx, state.timeSeconds, state.scrollPixels);

  // Entities back lane first so nearer lanes overlap correctly.
  const sorted = [...state.entities].sort((a, b) => a.lane - b.lane);
  for (const entity of sorted) {
    if (entity.resolved && entity.kind !== 'knife') continue;
    const groundY = LANE_GROUND_Y[entity.lane];
    if (entity.kind === 'oven') drawGlowingOven(ctx, entity.x, groundY, state.timeSeconds);
    else if (entity.kind === 'fence') drawFenceHurdle(ctx, entity.x, groundY);
    else if (entity.kind === 'mud') drawMudPuddle(ctx, entity.x, groundY, state.timeSeconds);
    else if (entity.kind === 'knife') drawFallingCarvingKnife(ctx, entity, groundY);
    else if (entity.kind === 'corn') drawCornPickup(ctx, entity.x, groundY, state.timeSeconds);
    else if (entity.kind === 'feather') drawGoldenFeatherPickup(ctx, entity.x, groundY, state.timeSeconds);
  }

  // Farmer on Gobbles' lane, then Gobbles.
  const farmerY = LANE_GROUND_Y[state.turkey.lane];
  drawFarmerChasingWithNet(ctx, farmerScreenX(state), farmerY, state.turkey.runCycle + 1.7);
  drawTurkeyGobbles(
    ctx, TURKEY_RUN_X, state.turkey.groundY, state.turkey.jumpHeight,
    state.turkey.runCycle, state.turkey.invulnerableSeconds > 0,
  );

  // Particles.
  for (const particle of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.colour;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawDangerVignette(ctx, state);
  if (state.phase !== 'title') drawHudScoreDistanceLives(ctx, state);
  if (state.phase === 'playing' || state.phase === 'paused') drawTouchButtons(ctx);
  drawFloatingMessage(ctx, state);
  if (state.phase === 'title') drawTitleScreen(ctx, state);
  if (state.phase === 'paused') drawPausedOverlay(ctx);
  if (state.phase === 'caught' || state.phase === 'escaped') drawEndScreen(ctx, state);
}
