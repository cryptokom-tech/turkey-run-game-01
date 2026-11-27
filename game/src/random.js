// Deterministic seeded random numbers, so staged screenshot scenes and
// play-tests reproduce exactly while ordinary runs still vary by seed.

export function createSeededRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export function randomBetween(random, min, max) {
  return min + random() * (max - min);
}

export function randomInteger(random, minInclusive, maxInclusive) {
  return minInclusive + Math.floor(random() * (maxInclusive - minInclusive + 1));
}

export function pickOne(random, items) {
  return items[Math.floor(random() * items.length)];
}
