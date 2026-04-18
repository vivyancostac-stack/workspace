import { TILE } from "./CharacterRenderer.js";
import {
  drawFloorTile as lzFloor,
  drawProp as lzProp,
  preloadTilesets
} from "./TilesetRenderer.js";

preloadTilesets();

export const T = {
  FLOOR_WOOD: 0,
  FLOOR_CARPET: 1,
  FLOOR_TILE_KITCHEN: 2,
  WALL: 3,
  DOOR: 4,
  FLOOR_WHITE: 5,
  FLOOR_BATHROOM: 6
};

export const P = {
  NONE: 0,
  DESK: 1,
  CHAIR: 2,
  PLANT: 3,
  COUCH_LEFT: 4,
  COUCH_RIGHT: 5,
  TABLE: 6,
  FRIDGE: 7,
  COFFEE_MACHINE: 8,
  MONITOR: 9,
  WHITEBOARD: 10,
  RUG: 11,
  COFFEE_TABLE: 12,
  TOILET: 13,
  SINK: 14,
  PAINTING_BLUE: 15,
  PAINTING_RED: 16,
  PAINTING_GREEN: 17,
  CHAIR_MEETING: 18,
  COUCH_MID: 19,
  BOOKCASE: 20,
  CLOCK: 21
};

const BLOCKING_PROPS = new Set([
  P.DESK, P.TABLE, P.FRIDGE, P.COFFEE_MACHINE, P.WHITEBOARD,
  P.COFFEE_TABLE, P.TOILET, P.SINK, P.COUCH_LEFT, P.COUCH_RIGHT,
  P.COUCH_MID, P.BOOKCASE
]);
const WALL_PROPS = new Set([P.PAINTING_BLUE, P.PAINTING_RED, P.PAINTING_GREEN, P.CLOCK]);

// helper: fill rectangle of tiles
function fillTiles(tiles, x1, y1, x2, y2, val) {
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) tiles[y][x] = val;
}
// helper: draw wall perimeter of a rect (doesn't fill inside)
function wallPerimeter(tiles, x1, y1, x2, y2) {
  for (let x = x1; x <= x2; x++) { tiles[y1][x] = T.WALL; tiles[y2][x] = T.WALL; }
  for (let y = y1; y <= y2; y++) { tiles[y][x1] = T.WALL; tiles[y][x2] = T.WALL; }
}

// -----------------------------------------------------------------------------
// MAP LAYOUT (40 × 26) — REAL OFFICE FLOOR PLAN
// -----------------------------------------------------------------------------
//
// The building has one entrance (south, main door) leading into a reception,
// a central vertical corridor, and rooms organized in 3 horizontal bands:
//
//   ┌──────────────────────────────────────────┐
//   │   MEETING  │  MARIA  │  CARLOS  │  JOÃO  │  y=1..7    (private offices)
//   │  ─── D ────┼── D ────┼── D ─────┼── D ───│  y=8       (wall with doors)
//   │         CENTRAL CORRIDOR                 │  y=9..11   (walkway)
//   │  ── D ─────┼──── D ──┼─────── D ─────────│  y=12      (wall with doors)
//   │   DEV      │  BATH   │       LOUNGE      │  y=13..19  (workshops)
//   │  ─── D ────┼─── D ───┼────── D ──────────│  y=20      (wall with doors)
//   │           RECEPTION (Ana)                │  y=21..24  (lobby)
//   └─────────────── MAIN DOOR ────────────────┘  y=25       (outer wall + exit)
//
// Main entrance: tiles[25][19..20] = DOOR (visible south exit).

export function buildOfficeMap() {
  const W = 40;
  const H = 26;
  const tiles = new Array(H).fill(0).map(() => new Array(W).fill(T.FLOOR_WOOD));
  const props = new Array(H).fill(0).map(() => new Array(W).fill(P.NONE));

  // Outer walls
  for (let x = 0; x < W; x++) { tiles[0][x] = T.WALL; tiles[H - 1][x] = T.WALL; }
  for (let y = 0; y < H; y++) { tiles[y][0] = T.WALL; tiles[y][W - 1] = T.WALL; }
  // Main entrance (south wall, double-door)
  tiles[H - 1][19] = T.DOOR;
  tiles[H - 1][20] = T.DOOR;

  // ------------------------- HORIZONTAL DIVIDERS -----------------------------
  // y=8, y=12, y=20 are internal horizontal walls.
  for (let x = 1; x <= W - 2; x++) {
    tiles[8][x]  = T.WALL;
    tiles[12][x] = T.WALL;
    tiles[20][x] = T.WALL;
  }
  // Doors in y=8 (reception band not above — this connects offices to corridor)
  tiles[8][5]  = T.DOOR; // Meeting
  tiles[8][15] = T.DOOR; // Maria
  tiles[8][25] = T.DOOR; // Carlos
  tiles[8][34] = T.DOOR; // João
  // Doors in y=12 (corridor to workshops)
  tiles[12][5]  = T.DOOR; // Dev
  tiles[12][17] = T.DOOR; // Bathroom
  tiles[12][30] = T.DOOR; // Lounge
  // Doors in y=20 (workshops to reception)
  tiles[20][5]  = T.DOOR;
  tiles[20][17] = T.DOOR;
  tiles[20][30] = T.DOOR;

  // --------------------- VERTICAL WALLS (inside bands) -----------------------
  // Offices row dividers (y=1..7)
  for (let y = 1; y <= 7; y++) {
    tiles[y][10] = T.WALL;
    tiles[y][20] = T.WALL;
    tiles[y][30] = T.WALL;
  }
  // Workshops row dividers (y=13..19)
  for (let y = 13; y <= 19; y++) {
    tiles[y][12] = T.WALL;
    tiles[y][23] = T.WALL;
  }

  // ============================= OFFICES (y=1..7) ============================
  // MEETING ROOM (x=1..9) — blue carpet
  fillTiles(tiles, 1, 1, 9, 7, T.FLOOR_CARPET);
  // long meeting table
  for (let x = 3; x <= 7; x++) props[4][x] = P.TABLE;
  props[3][3] = P.CHAIR_MEETING; props[3][5] = P.CHAIR_MEETING; props[3][7] = P.CHAIR_MEETING;
  props[5][3] = P.CHAIR_MEETING; props[5][5] = P.CHAIR_MEETING; props[5][7] = P.CHAIR_MEETING;
  props[1][2] = P.WHITEBOARD;
  props[1][8] = P.PAINTING_BLUE;
  props[7][1] = P.PLANT;

  // MARIA'S OFFICE (x=11..19) — carpet + small desk
  fillTiles(tiles, 11, 1, 19, 7, T.FLOOR_CARPET);
  props[3][14] = P.DESK; props[3][15] = P.DESK;
  props[2][15] = P.MONITOR;
  props[4][15] = P.CHAIR;
  props[1][12] = P.WHITEBOARD;   // OKR board
  props[1][18] = P.PAINTING_RED;
  props[7][12] = P.BOOKCASE;
  props[7][18] = P.PLANT;

  // CARLOS'S IT OFFICE (x=21..29) — tech tile + 2 monitors
  fillTiles(tiles, 21, 1, 29, 7, T.FLOOR_TILE_KITCHEN);
  props[3][24] = P.DESK; props[3][25] = P.DESK;
  props[2][24] = P.MONITOR; props[2][25] = P.MONITOR;
  props[4][25] = P.CHAIR;
  props[7][22] = P.BOOKCASE; props[7][23] = P.BOOKCASE; // server racks
  props[1][28] = P.CLOCK;
  props[1][22] = P.PAINTING_GREEN;
  props[7][28] = P.PLANT;

  // JOÃO'S CAFÉ (x=31..38) — kitchen tile + fridge/coffee
  fillTiles(tiles, 31, 1, 38, 7, T.FLOOR_TILE_KITCHEN);
  props[1][32] = P.FRIDGE;
  props[1][34] = P.COFFEE_MACHINE;
  props[1][36] = P.SINK;
  props[4][33] = P.TABLE;
  props[3][33] = P.CHAIR; props[5][33] = P.CHAIR;
  props[4][37] = P.TABLE;
  props[3][37] = P.CHAIR;
  props[7][32] = P.PLANT;
  props[7][37] = P.PLANT;

  // =========================== CORRIDOR (y=9..11) ============================
  // Stays FLOOR_WOOD default. Plants along the edges.
  props[9][1]  = P.PLANT;
  props[9][W-2] = P.PLANT;
  props[11][1] = P.PLANT;
  props[11][W-2] = P.PLANT;
  // A small rug in the middle as a focal point
  for (let x = 18; x <= 21; x++) props[10][x] = P.RUG;

  // =========================== WORKSHOPS (y=13..19) ==========================
  // DEV BULLPEN (x=1..11) — wood floor, 2 rows of desks facing north/south
  // Desks face north (monitor above desk, chair below)
  const devDeskRows = [
    { deskY: 14, monitorY: 13, chairY: 15 },
    { deskY: 18, monitorY: 17, chairY: 19 }
  ];
  const devXs = [3, 6, 9];
  for (const r of devDeskRows) {
    for (const x of devXs) {
      props[r.deskY][x]    = P.DESK;
      props[r.monitorY][x] = P.MONITOR;
      if (props[r.chairY][x] === P.NONE) props[r.chairY][x] = P.CHAIR;
    }
  }
  props[13][10] = P.PLANT;
  props[19][10] = P.PLANT;

  // BATHROOM (x=13..22) — bathroom tile, toilet + sink
  fillTiles(tiles, 13, 13, 22, 19, T.FLOOR_BATHROOM);
  props[14][14] = P.TOILET;
  props[14][16] = P.TOILET;
  props[14][18] = P.TOILET;
  props[18][14] = P.SINK;
  props[18][16] = P.SINK;
  props[18][18] = P.SINK;
  props[13][21] = P.PAINTING_BLUE;

  // LOUNGE (x=24..38) — wood + U-sofa + coffee table
  // Rug center
  for (let y = 15; y <= 17; y++) for (let x = 29; x <= 33; x++) props[y][x] = P.RUG;
  // U-shaped sofa
  props[14][29] = P.COUCH_LEFT;
  props[14][30] = P.COUCH_MID;
  props[14][31] = P.COUCH_MID;
  props[14][32] = P.COUCH_MID;
  props[14][33] = P.COUCH_RIGHT;
  props[15][28] = P.COUCH_LEFT;  props[16][28] = P.COUCH_RIGHT;
  props[15][34] = P.COUCH_LEFT;  props[16][34] = P.COUCH_RIGHT;
  // Coffee table in the middle
  props[16][31] = P.COFFEE_TABLE;
  // Bookcase + plants
  props[13][25] = P.BOOKCASE;
  props[13][37] = P.BOOKCASE;
  props[19][25] = P.PLANT;
  props[19][37] = P.PLANT;
  props[19][31] = P.PLANT;

  // ============================ RECEPTION (y=21..24) =========================
  fillTiles(tiles, 1, 21, W - 2, 24, T.FLOOR_WHITE);
  // Ana's central reception desk (wide)
  for (let x = 16; x <= 22; x++) props[22][x] = P.DESK;
  props[21][19] = P.MONITOR;
  // Waiting sofas on both sides
  props[23][3] = P.COUCH_LEFT;
  props[23][4] = P.COUCH_MID;
  props[23][5] = P.COUCH_RIGHT;
  props[23][34] = P.COUCH_LEFT;
  props[23][35] = P.COUCH_MID;
  props[23][36] = P.COUCH_RIGHT;
  // Coffee tables beside them
  props[24][4] = P.COFFEE_TABLE;
  props[24][35] = P.COFFEE_TABLE;
  // Decor: plants at corners, paintings on the north wall
  props[21][1]  = P.PLANT;
  props[21][10] = P.PAINTING_BLUE;
  props[21][14] = P.PAINTING_RED;
  props[21][24] = P.PAINTING_GREEN;
  props[21][28] = P.PAINTING_BLUE;
  props[21][W-2] = P.PLANT;
  // Rug in front of the desk
  for (let y = 23; y <= 23; y++) for (let x = 17; x <= 21; x++) props[y][x] = P.RUG;

  return { tiles, props, width: W, height: H };
}

// Nameplates to render above private-office doors (door tile is on y=8)
export const NAMEPLATES = [
  { text: "Sala de Reunião", tx: 5,  ty: 8 },
  { text: "Maria — Gerente", tx: 15, ty: 8 },
  { text: "Carlos — TI",     tx: 25, ty: 8 },
  { text: "João — Café",     tx: 34, ty: 8 },
  { text: "Dev Bullpen",     tx: 5,  ty: 12 },
  { text: "Banheiro",        tx: 17, ty: 12 },
  { text: "Lounge",          tx: 30, ty: 12 }
];

export function isBlocked(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
  const tile = map.tiles[ty][tx];
  if (tile === T.WALL) return true;
  const prop = map.props[ty][tx];
  if (BLOCKING_PROPS.has(prop)) return true;
  return false;
}

export const ZONES = [
  { id: "meeting",    name: "Sala de Reunião",     x: 1,  y: 1,  w: 9,  h: 7,  private: true },
  { id: "maria",      name: "Escritório da Maria", x: 11, y: 1,  w: 9,  h: 7,  private: true },
  { id: "carlos",     name: "Sala de TI",          x: 21, y: 1,  w: 9,  h: 7,  private: true },
  { id: "joao",       name: "Café do João",        x: 31, y: 1,  w: 8,  h: 7,  private: false },
  { id: "corridor",   name: "Corredor",            x: 1,  y: 9,  w: 38, h: 3,  private: false },
  { id: "devbullpen", name: "Área Dev",            x: 1,  y: 13, w: 11, h: 7,  private: false },
  { id: "bathroom",   name: "Banheiro",            x: 13, y: 13, w: 10, h: 7,  private: true },
  { id: "lounge",     name: "Lounge",              x: 24, y: 13, w: 15, h: 7,  private: false },
  { id: "reception",  name: "Recepção",            x: 1,  y: 21, w: 38, h: 4,  private: false }
];

export function zoneAt(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  for (const z of ZONES) {
    if (tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h) return z;
  }
  return null;
}

// =============== RENDERING ===============

export function drawMap(ctx, map, cam) {
  ctx.imageSmoothingEnabled = false;
  const startX = Math.max(0, Math.floor(cam.x / TILE));
  const endX = Math.min(map.width, Math.ceil((cam.x + cam.w) / TILE) + 1);
  const startY = Math.max(0, Math.floor(cam.y / TILE));
  const endY = Math.min(map.height, Math.ceil((cam.y + cam.h) / TILE) + 1);

  // floor + walls
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const t = map.tiles[y][x];
      drawTile(ctx, t, x * TILE - cam.x, y * TILE - cam.y, x, y, map);
    }
  }
  // rugs first (under other props)
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (map.props[y][x] === P.RUG) drawProp(ctx, P.RUG, x * TILE - cam.x, y * TILE - cam.y);
    }
  }
  // shadows under blocking furniture
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const p = map.props[y][x];
      if (BLOCKING_PROPS.has(p)) {
        const px = x * TILE - cam.x;
        const py = y * TILE - cam.y + TILE - 4;
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(px + 2, py, TILE - 4, 3);
      }
    }
  }
  // regular props
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const p = map.props[y][x];
      if (p === P.NONE || p === P.RUG) continue;
      drawProp(ctx, p, x * TILE - cam.x, y * TILE - cam.y);
    }
  }
}

// --- tile renderers ---

function drawTile(ctx, t, px, py, tx, ty, map) {
  // Try LimeZu first; if not loaded yet, fall back to procedural below.
  const floorKey =
    t === T.FLOOR_WOOD ? "wood" :
    t === T.FLOOR_CARPET ? "carpet" :
    t === T.FLOOR_TILE_KITCHEN ? "kitchen" :
    t === T.FLOOR_WHITE ? "white" :
    t === T.FLOOR_BATHROOM ? "bathroom" :
    t === T.WALL ? "wall" :
    t === T.DOOR ? "door" : null;
  if (floorKey && lzFloor(ctx, floorKey, px, py)) return;

  if (t === T.FLOOR_WOOD) {
    const a = (tx + ty) % 2 === 0 ? "#8a5a3b" : "#7a4d31";
    ctx.fillStyle = a;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(px, py + TILE - 1, TILE, 1);
    if (tx % 2 === 0) ctx.fillRect(px + TILE - 1, py, 1, TILE);
    // grain
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(px + 4, py + 8, TILE - 10, 1);
  } else if (t === T.FLOOR_CARPET) {
    ctx.fillStyle = "#3a5d8a";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(px + 6, py + 6, 2, 2);
    ctx.fillRect(px + 22, py + 16, 2, 2);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(px, py + TILE - 1, TILE, 1);
  } else if (t === T.FLOOR_TILE_KITCHEN) {
    ctx.fillStyle = "#d8dce0";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(px, py, TILE, 1);
    ctx.fillRect(px, py, 1, TILE);
    ctx.fillStyle = "#bcc2c6";
    ctx.fillRect(px + TILE - 2, py + TILE - 2, 2, 2);
  } else if (t === T.FLOOR_WHITE) {
    // white polished tile for reception
    const alt = ((tx + ty) % 2 === 0) ? "#efefef" : "#e4e4e4";
    ctx.fillStyle = alt;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(px, py, TILE, 1);
    ctx.fillRect(px, py, 1, TILE);
    // subtle shine
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(px + 3, py + 3, 3, 1);
  } else if (t === T.FLOOR_BATHROOM) {
    const alt = ((tx + ty) % 2 === 0) ? "#b8d4d8" : "#a4c4ca";
    ctx.fillStyle = alt;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(px, py, TILE, 1);
    ctx.fillRect(px, py, 1, TILE);
  } else if (t === T.WALL) {
    // layered wall
    ctx.fillStyle = "#3e3429";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#574638";
    ctx.fillRect(px, py, TILE, 6);
    ctx.fillStyle = "#2a211a";
    ctx.fillRect(px, py + TILE - 3, TILE, 3);
    // brick lines
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    if (ty % 2 === 0) {
      ctx.fillRect(px + TILE / 2, py + 6, 1, 10);
    } else {
      ctx.fillRect(px, py + 6, 1, 10);
      ctx.fillRect(px + TILE, py + 6, 1, 10);
    }
    ctx.fillRect(px, py + 16, TILE, 1);
  } else if (t === T.DOOR) {
    ctx.fillStyle = "#7a4d31";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#5a3823";
    ctx.fillRect(px + 4, py + 2, TILE - 8, TILE - 4);
    ctx.fillStyle = "#c8a048";
    ctx.fillRect(px + TILE - 10, py + TILE / 2, 2, 2); // handle
  }
}

// --- prop renderers ---

const PROP_TO_SPRITE = {
  [P.DESK]: "desk",
  [P.CHAIR]: "chair",
  [P.CHAIR_MEETING]: "chair_meeting",
  [P.MONITOR]: "monitor",
  [P.PLANT]: "plant_tall",
  [P.COFFEE_TABLE]: "coffee_table",
  [P.FRIDGE]: "fridge",
  [P.COFFEE_MACHINE]: "coffee_machine",
  [P.WHITEBOARD]: "whiteboard",
  [P.TABLE]: "table",
  [P.TOILET]: "toilet",
  [P.SINK]: "sink",
  [P.PAINTING_BLUE]: "painting",
  [P.PAINTING_RED]: "painting",
  [P.PAINTING_GREEN]: "painting",
  [P.BOOKCASE]: "bookcase",
  [P.CLOCK]: "clock",
  [P.RUG]: "rug"
};

function drawProp(ctx, p, px, py) {
  const spriteKey = PROP_TO_SPRITE[p];
  if (spriteKey && lzProp(ctx, spriteKey, px, py)) return;

  switch (p) {
    case P.DESK: return drawDesk(ctx, px, py);
    case P.CHAIR: return drawChair(ctx, px, py, "#2a2a2a");
    case P.CHAIR_MEETING: return drawChair(ctx, px, py, "#5a3a28");
    case P.MONITOR: return drawMonitor(ctx, px, py);
    case P.PLANT: return drawPlant(ctx, px, py);
    case P.COUCH_LEFT: return drawCouch(ctx, px, py, "left");
    case P.COUCH_RIGHT: return drawCouch(ctx, px, py, "right");
    case P.COUCH_MID: return drawCouch(ctx, px, py, "mid");
    case P.TABLE: return drawTable(ctx, px, py);
    case P.COFFEE_TABLE: return drawCoffeeTable(ctx, px, py);
    case P.FRIDGE: return drawFridge(ctx, px, py);
    case P.COFFEE_MACHINE: return drawCoffeeMachine(ctx, px, py);
    case P.WHITEBOARD: return drawWhiteboard(ctx, px, py);
    case P.RUG: return drawRug(ctx, px, py);
    case P.TOILET: return drawToilet(ctx, px, py);
    case P.SINK: return drawSink(ctx, px, py);
    case P.PAINTING_BLUE: return drawPainting(ctx, px, py, "#3a5d8a");
    case P.PAINTING_RED: return drawPainting(ctx, px, py, "#8a3a3a");
    case P.PAINTING_GREEN: return drawPainting(ctx, px, py, "#3a7a4a");
    case P.BOOKCASE: return drawBookcase(ctx, px, py);
    case P.CLOCK: return drawClock(ctx, px, py);
  }
}

function drawDesk(ctx, px, py) {
  // top
  ctx.fillStyle = "#6b4a2e";
  ctx.fillRect(px + 2, py + 8, TILE - 4, TILE - 16);
  ctx.fillStyle = "#8a6440";
  ctx.fillRect(px + 2, py + 8, TILE - 4, 2);
  // legs
  ctx.fillStyle = "#3a2718";
  ctx.fillRect(px + 4, py + TILE - 10, 3, 6);
  ctx.fillRect(px + TILE - 7, py + TILE - 10, 3, 6);
  // drawer
  ctx.fillStyle = "#4a3220";
  ctx.fillRect(px + 6, py + 14, TILE - 12, 3);
  ctx.fillStyle = "#c8a048";
  ctx.fillRect(px + TILE / 2 - 2, py + 15, 4, 1);
}

function drawChair(ctx, px, py, color) {
  // seat
  ctx.fillStyle = color;
  ctx.fillRect(px + 8, py + 14, TILE - 16, TILE - 18);
  // back
  ctx.fillStyle = color;
  ctx.fillRect(px + 8, py + 8, TILE - 16, 7);
  // shine
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(px + 9, py + 9, TILE - 18, 1);
  // legs
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(px + 9, py + TILE - 4, 2, 3);
  ctx.fillRect(px + TILE - 11, py + TILE - 4, 2, 3);
}

function drawMonitor(ctx, px, py) {
  // stand
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(px + TILE / 2 - 3, py + TILE - 12, 6, 4);
  ctx.fillRect(px + TILE / 2 - 6, py + TILE - 8, 12, 2);
  // screen bezel
  ctx.fillStyle = "#111";
  ctx.fillRect(px + 5, py + 6, TILE - 10, 18);
  // screen content (blue)
  ctx.fillStyle = "#2d5aa8";
  ctx.fillRect(px + 7, py + 8, TILE - 14, 14);
  // code lines
  ctx.fillStyle = "#7ab8ff";
  ctx.fillRect(px + 8, py + 10, 8, 1);
  ctx.fillRect(px + 8, py + 12, 12, 1);
  ctx.fillRect(px + 10, py + 14, 8, 1);
  ctx.fillRect(px + 8, py + 16, 14, 1);
}

function drawPlant(ctx, px, py) {
  // pot
  ctx.fillStyle = "#6a3a1a";
  ctx.fillRect(px + 10, py + 20, TILE - 20, 9);
  ctx.fillStyle = "#8a4a22";
  ctx.fillRect(px + 10, py + 20, TILE - 20, 2);
  // leaves
  ctx.fillStyle = "#2a6a30";
  ctx.fillRect(px + 6, py + 8, TILE - 12, 14);
  ctx.fillStyle = "#3a9a40";
  ctx.fillRect(px + 8, py + 6, TILE - 16, 8);
  ctx.fillStyle = "#4aaa50";
  ctx.fillRect(px + 12, py + 4, 8, 4);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(px + 13, py + 6, 2, 1);
}

function drawCouch(ctx, px, py, kind) {
  const base = "#7a4a3a";
  const top = "#9a6a52";
  const cushion = "#b88068";
  // backrest
  ctx.fillStyle = base;
  ctx.fillRect(px, py + 4, TILE, 10);
  ctx.fillStyle = top;
  ctx.fillRect(px, py + 4, TILE, 2);
  // seat
  ctx.fillStyle = cushion;
  ctx.fillRect(px, py + 14, TILE, 14);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(px, py + 14, TILE, 1);
  // armrests at ends
  if (kind === "left") {
    ctx.fillStyle = base;
    ctx.fillRect(px, py + 8, 5, 20);
    ctx.fillStyle = top;
    ctx.fillRect(px, py + 8, 5, 2);
  } else if (kind === "right") {
    ctx.fillStyle = base;
    ctx.fillRect(px + TILE - 5, py + 8, 5, 20);
    ctx.fillStyle = top;
    ctx.fillRect(px + TILE - 5, py + 8, 5, 2);
  }
  // cushion seam
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(px + TILE / 2, py + 14, 1, 14);
}

function drawTable(ctx, px, py) {
  ctx.fillStyle = "#6b4a2e";
  ctx.fillRect(px, py + 4, TILE, TILE - 8);
  ctx.fillStyle = "#8a6440";
  ctx.fillRect(px, py + 4, TILE, 2);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(px, py + TILE - 5, TILE, 1);
}

function drawCoffeeTable(ctx, px, py) {
  // shorter, oval-ish
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(px + 4, py + 12, TILE - 8, 14);
  ctx.fillStyle = "#5a3a24";
  ctx.fillRect(px + 4, py + 12, TILE - 8, 2);
  // a coffee cup
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 12, py + 16, 5, 4);
  ctx.fillStyle = "#6b3a1a";
  ctx.fillRect(px + 13, py + 17, 3, 1);
  // magazine
  ctx.fillStyle = "#c8544a";
  ctx.fillRect(px + 18, py + 18, 8, 6);
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 20, py + 20, 4, 1);
}

function drawFridge(ctx, px, py) {
  ctx.fillStyle = "#d5d9dc";
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = "#aab0b4";
  ctx.fillRect(px + 2, py + TILE / 2, TILE - 4, 1); // split
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(px + TILE - 8, py + 8, 2, 5); // top handle
  ctx.fillRect(px + TILE - 8, py + TILE - 13, 2, 5); // bottom handle
  // magnet
  ctx.fillStyle = "#e05a5a";
  ctx.fillRect(px + 6, py + 10, 3, 3);
}

function drawCoffeeMachine(ctx, px, py) {
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 8);
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(px + 6, py + 4, TILE - 12, 3);
  ctx.fillStyle = "#c2410c";
  ctx.fillRect(px + 10, py + 10, 3, 3);
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 11, py + 18, TILE - 22, 6);
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(px + 13, py + 19, TILE - 26, 2);
}

function drawWhiteboard(ctx, px, py) {
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(px + 1, py + 2, TILE - 2, TILE - 8);
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(px + 3, py + 4, TILE - 6, TILE - 12);
  // marker scribbles
  ctx.fillStyle = "#3b6ad4";
  ctx.fillRect(px + 6, py + 8, 4, 2);
  ctx.fillRect(px + 12, py + 8, 10, 1);
  ctx.fillStyle = "#c2410c";
  ctx.fillRect(px + 6, py + 14, 16, 1);
  ctx.fillStyle = "#2a7a3a";
  ctx.fillRect(px + 10, py + 18, 10, 1);
  // tray
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(px + 4, py + TILE - 6, TILE - 8, 2);
}

function drawRug(ctx, px, py) {
  ctx.fillStyle = "#7a2e3b";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#5a1e2b";
  ctx.fillRect(px, py, TILE, 2);
  ctx.fillRect(px, py + TILE - 2, TILE, 2);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(px + 4, py + 4, TILE - 8, 1);
  ctx.fillRect(px + 4, py + TILE - 5, TILE - 8, 1);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(px + TILE / 2, py + 6, 1, TILE - 12);
}

function drawToilet(ctx, px, py) {
  // tank
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(px + 8, py + 4, TILE - 16, 10);
  // bowl
  ctx.fillRect(px + 6, py + 12, TILE - 12, 14);
  ctx.fillStyle = "#c8ccd0";
  ctx.fillRect(px + 6, py + 12, TILE - 12, 1);
  // seat opening
  ctx.fillStyle = "#5a7a8a";
  ctx.fillRect(px + 10, py + 16, TILE - 20, 7);
  // handle
  ctx.fillStyle = "#aaa";
  ctx.fillRect(px + TILE - 11, py + 7, 2, 2);
}

function drawSink(ctx, px, py) {
  // base cabinet
  ctx.fillStyle = "#d4d8db";
  ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12);
  // basin
  ctx.fillStyle = "#5a6b74";
  ctx.fillRect(px + 8, py + 10, TILE - 16, 10);
  ctx.fillStyle = "#3a4a54";
  ctx.fillRect(px + 10, py + 12, TILE - 20, 6);
  // faucet
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(px + TILE / 2 - 1, py + 6, 2, 6);
  ctx.fillRect(px + TILE / 2 - 3, py + 4, 6, 2);
}

function drawPainting(ctx, px, py, accent) {
  // frame
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(px + 4, py + 4, TILE - 8, 18);
  ctx.fillStyle = "#6a4828";
  ctx.fillRect(px + 5, py + 5, TILE - 10, 16);
  // canvas
  ctx.fillStyle = accent;
  ctx.fillRect(px + 7, py + 7, TILE - 14, 12);
  // abstract mark
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(px + 9, py + 10, TILE - 18, 2);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(px + 11, py + 14, TILE - 22, 2);
}

function drawBookcase(ctx, px, py) {
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 6);
  // shelves with colored books
  const shelves = [6, 14, 22];
  const colors = ["#c84a4a", "#4a7ac8", "#c8a048", "#7aaa4a", "#a84ac8"];
  for (const sy of shelves) {
    ctx.fillStyle = "#1a1008";
    ctx.fillRect(px + 4, py + sy + 6, TILE - 8, 1);
    // books
    let x = px + 4;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[(i + sy) % colors.length];
      const bw = 4;
      ctx.fillRect(x, py + sy, bw - 1, 6);
      x += bw;
    }
  }
}

function drawClock(ctx, px, py) {
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(px + 8, py + 6, TILE - 16, TILE - 20);
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(px + 10, py + 8, TILE - 20, TILE - 24);
  // hands
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(px + TILE / 2 - 1, py + 10, 1, 4);
  ctx.fillRect(px + TILE / 2, py + TILE / 2 - 2, 4, 1);
  ctx.fillRect(px + TILE / 2 - 1, py + TILE / 2 - 1, 2, 2);
}
