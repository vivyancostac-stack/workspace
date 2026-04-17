// Uses LimeZu Modern Interiors character spritesheets.
// Each run sheet is 384×32 = 24 frames (6 per direction × 4 directions),
// laid out horizontally. Frame is 16 wide × 32 tall.
// Assumed direction order in the strip:
//   frames 0-5   = down
//   frames 6-11  = up
//   frames 12-17 = right
//   frames 18-23 = left

const VALID_NAMES = ["Adam", "Alex", "Amelia", "Bob"];

export const CHAR_SHEETS = {
  ana:    "Amelia",
  maria:  "Bob",
  joao:   "Alex",
  carlos: "Adam"
};

function resolveSheetName(idOrName) {
  if (VALID_NAMES.includes(idOrName)) return idOrName;
  return CHAR_SHEETS[idOrName] || "Adam";
}

const DIR_OFFSET = {
  0: 0,    // down
  3: 6,    // up
  2: 12,   // right
  1: 18    // left
};

// public-relative paths served by vite from /public
const BASE = "/assets/Characters_free";

const imageCache = new Map();

function getSheet(name, kind) {
  const key = `${name}_${kind}`;
  if (imageCache.has(key)) return imageCache.get(key);
  const img = new Image();
  img.src = `${BASE}/${name}_${kind}_16x16.png`;
  imageCache.set(key, img);
  return img;
}

export function preloadCharacters() {
  for (const name of ["Adam", "Alex", "Amelia", "Bob"]) {
    getSheet(name, "run");
    getSheet(name, "idle");
  }
}

// Sprite rendered at 2× scale: 32 wide × 64 tall on screen.
// Character baseline (feet) aligns to cy. Tile is 32px, so the character
// extends ~2 tiles upward from its foot position.
const SCALE = 2;
const SPRITE_W = 16;
const SPRITE_H = 32;
const DRAW_W = SPRITE_W * SCALE;   // 32
const DRAW_H = SPRITE_H * SCALE;   // 64

export function drawCharacter(ctx, cx, cy, dir, phase, moving, charId) {
  // shadow at feet
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const name = resolveSheetName(charId);

  // While moving, use the run sheet (6-frame animation per direction).
  // While idle, use frame 0 of the same direction from the run sheet —
  // this avoids the idle-sheet direction-order ambiguity and always matches.
  const sheet = getSheet(name, "run");
  if (!sheet.complete || !sheet.naturalWidth) return;

  const base = DIR_OFFSET[dir] ?? 0;
  const frame = moving ? Math.floor(phase * 6) % 6 : 0;
  const frameIdx = base + frame;

  const sx = frameIdx * SPRITE_W;
  const sy = 0;

  // Position the sprite so the feet land at cy.
  // LimeZu sprites have ~2 transparent pixels of padding below the feet.
  const dx = Math.round(cx - DRAW_W / 2);
  const dy = Math.round(cy - DRAW_H + 4);

  const wasSmooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, sx, sy, SPRITE_W, SPRITE_H, dx, dy, DRAW_W, DRAW_H);
  ctx.imageSmoothingEnabled = wasSmooth;
}

export const TILE = 32;
