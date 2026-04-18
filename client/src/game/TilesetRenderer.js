// Loads LimeZu Modern Interiors tilesets and draws tiles by (col, row) coords.
//
// Room_Builder_free_16x16.png = 272×368 = 17 cols × 23 rows — walls + floors.
// Interiors_free_16x16.png    = 256×1424 = 16 cols × 89 rows — furniture.
//
// Layout references (approximate, tweak if you find better matches):
//
// Room_Builder:
//   rows 0-3: wall caps / ceiling / corner pieces (complicated to use as
//             single tiles — we keep walls procedural to avoid glitches)
//   rows 4-12, cols 0-8:   3 vertical wood plank strips (orange/cream/dark)
//   rows 4-12, cols 9-12:  brick, white/cream tile, cyan-diamond, gray
//   rows 13-22: more floor variations (blue tile, dirt, marble)
//
// Interiors: huge 16×89 sheet. Furniture rows are grouped by category,
//   starting near row 0 with beds and going through appliances, desks,
//   couches, plants, fixtures toward the bottom.

const TILE_SRC = 16;
export const TILE = 32;

const sheets = {};
function load(key, url) {
  if (sheets[key]) return sheets[key];
  const img = new Image();
  img.src = url;
  sheets[key] = img;
  return img;
}

export function preloadTilesets() {
  load("rooms", "/assets/Interiors_free/16x16/Room_Builder_free_16x16.png");
  load("interiors", "/assets/Interiors_free/16x16/Interiors_free_16x16.png");
}

// -------------------- Floor coordinates --------------------
// Second pass. If any still look wrong, open /tiles.html, hover over a tile
// you want, and swap the (col, row) below.
export const FLOOR_TILES = {
  // warm orange wood planks (left strip, mid-height)
  wood:     [1, 10],
  // blue-gray marble/carpet (bottom-left area — cool blue tone)
  carpet:   [1, 18],
  // cream tile (middle strip area) — soft for reception
  white:    [4, 10],
  // darker wood / terracotta for kitchen warmth
  kitchen:  [10, 8],
  // cyan diamond pattern (mid-right) for bathroom
  bathroom: [10, 11]
};

// Doors rendered as a floor variant (walls are procedural; see Map.js fallback).
// A warm cream floor tile works as a threshold.
export const DOOR_FLOOR = [4, 12];

// -------------------- Prop coordinates --------------------
// w/h in source tiles (16px each). offsetY lifts tall props so the base
// aligns to the tile's bottom.
export const PROP_SPRITES = {
  plant_small:    { col: 12, row: 29, w: 1, h: 2, offsetY: -1 },
  plant_tall:     { col: 11, row: 29, w: 1, h: 2, offsetY: -1 },
  desk:           { col: 0,  row: 44, w: 2, h: 1 },
  monitor:        { col: 2,  row: 46, w: 1, h: 1 },
  chair:          { col: 4,  row: 47, w: 1, h: 1 },
  chair_meeting:  { col: 5,  row: 47, w: 1, h: 1 },
  couch_3:        { col: 0,  row: 80, w: 3, h: 2, offsetY: -1 },
  coffee_table:   { col: 4,  row: 83, w: 2, h: 1 },
  bookcase:       { col: 14, row: 65, w: 2, h: 3, offsetY: -2 },
  fridge:         { col: 0,  row: 60, w: 1, h: 2, offsetY: -1 },
  coffee_machine: { col: 1,  row: 60, w: 1, h: 1 },
  table:          { col: 4,  row: 45, w: 2, h: 1 },
  whiteboard:     { col: 11, row: 39, w: 2, h: 2, offsetY: -1 },
  painting:       { col: 10, row: 30, w: 1, h: 1 },
  toilet:         { col: 0,  row: 74, w: 1, h: 2, offsetY: -1 },
  sink:           { col: 2,  row: 74, w: 1, h: 2, offsetY: -1 },
  clock:          { col: 11, row: 30, w: 1, h: 1 },
  rug:            { col: 6,  row: 34, w: 2, h: 2 }
};

// -------------------- Drawing --------------------

// Floors + walls fall back to procedural (guaranteed to render).
// Returning false everywhere forces Map.js to use its procedural renderer.
// This avoids black voids from mis-guessed LimeZu tile coordinates.
export function drawFloorTile(_ctx, _coordKey, _dx, _dy) {
  return false;
}

// Props also fall back to procedural for now — the LimeZu coord guesses were
// producing "half-a-bed" sprites in slots we meant to be monitors/toilets/etc.
// Procedural isn't as pretty but it's consistent and readable.
export function drawProp(_ctx, _spriteKey, _dx, _dy) {
  return false;
}
