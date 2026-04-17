import { buildOfficeMap, isBlocked, drawMap, zoneAt, NAMEPLATES } from "./Map.js";
import { drawCharacter, preloadCharacters, TILE } from "./CharacterRenderer.js";
import { Input } from "./Input.js";

const SPEED = 120; // px/sec
const CHAR_RADIUS = 8;
const PROXIMITY = 48; // px — how close to trigger NPC chat

// NPCs placed at fixed tile positions (center of tile)
const NPC_PLACEMENTS = [
  { id: "ana",    name: "Ana",    role: "Recepcionista",  tx: 19, ty: 5,  facing: 0 },
  { id: "maria",  name: "Maria",  role: "Gerente",        tx: 16, ty: 12, facing: 3 },
  { id: "carlos", name: "Carlos", role: "Suporte / TI",   tx: 26, ty: 12, facing: 3 },
  { id: "joao",   name: "João",   role: "Colega do Café", tx: 34, ty: 13, facing: 3 }
];

export class Game {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.callbacks = callbacks; // { onZoneChange, onNearbyNPCChange, onInteract }
    this.map = buildOfficeMap();
    this.input = new Input();
    this.inputEnabled = true;
    preloadCharacters();

    this.player = {
      id: "player",
      avatar: "Adam",
      x: 20 * TILE + TILE / 2,
      y: 3 * TILE + TILE / 2,
      dir: 0,
      phase: 0,
      moving: false
    };

    this.npcs = NPC_PLACEMENTS.map((n) => ({
      ...n,
      x: n.tx * TILE + TILE / 2,
      y: n.ty * TILE + TILE / 2,
      phase: Math.random()
    }));

    this.cam = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    this.currentZone = null;
    this.nearbyNPC = null;
    this.running = false;
    this.lastTs = 0;
    this._loop = this._loop.bind(this);
  }

  start() {
    this.running = true;
    requestAnimationFrame((t) => {
      this.lastTs = t;
      this._loop(t);
    });
  }

  stop() {
    this.running = false;
    this.input.destroy();
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.imageSmoothingEnabled = false;
    this.cam.w = w;
    this.cam.h = h;
  }

  setInputEnabled(enabled) {
    this.inputEnabled = enabled;
    this.input.setEnabled(enabled);
  }

  setPlayerAvatar(avatar) {
    this.player.avatar = avatar;
  }

  _loop(ts) {
    if (!this.running) return;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    this._update(dt);
    this._render();
    this.input.frameEnd();
    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    const p = this.player;
    let dx = 0;
    let dy = 0;
    if (this.inputEnabled) {
      if (this.input.isDown("w", "arrowup")) dy -= 1;
      if (this.input.isDown("s", "arrowdown")) dy += 1;
      if (this.input.isDown("a", "arrowleft")) dx -= 1;
      if (this.input.isDown("d", "arrowright")) dx += 1;
    }
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      // face direction (prioritize axis with larger movement)
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx < 0 ? 1 : 2;
      else p.dir = dy < 0 ? 3 : 0;
      // move with per-axis collision
      const nx = p.x + dx * SPEED * dt;
      const ny = p.y + dy * SPEED * dt;
      if (!this._collides(nx, p.y)) p.x = nx;
      if (!this._collides(p.x, ny)) p.y = ny;
      p.phase = (p.phase + dt * 3) % 1;
    }
    p.moving = moving;

    // camera follows player
    this.cam.x = Math.max(0, Math.min(this.map.width * TILE - this.cam.w, p.x - this.cam.w / 2));
    this.cam.y = Math.max(0, Math.min(this.map.height * TILE - this.cam.h, p.y - this.cam.h / 2));
    // if map smaller than viewport, center it
    if (this.map.width * TILE < this.cam.w) this.cam.x = (this.map.width * TILE - this.cam.w) / 2;
    if (this.map.height * TILE < this.cam.h) this.cam.y = (this.map.height * TILE - this.cam.h) / 2;

    // idle NPC bob
    for (const n of this.npcs) {
      n.phase = (n.phase + dt * 0.3) % 1;
    }

    // zone detection
    const zone = zoneAt(p.x, p.y);
    const zoneId = zone?.id || null;
    if (zoneId !== this._lastZoneId) {
      this._lastZoneId = zoneId;
      this.currentZone = zone;
      this.callbacks?.onZoneChange?.(zone);
    }

    // nearest NPC within proximity
    let nearest = null;
    let nearestD = PROXIMITY;
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < nearestD) {
        nearest = n;
        nearestD = d;
      }
    }
    const npcId = nearest?.id || null;
    if (npcId !== this._lastNpcId) {
      this._lastNpcId = npcId;
      this.nearbyNPC = nearest;
      this.callbacks?.onNearbyNPCChange?.(nearest);
    }

    // interact
    if (this.inputEnabled && this.input.consume("e") && nearest) {
      this.callbacks?.onInteract?.(nearest);
    }
  }

  _collides(px, py) {
    // sample corners of character circle
    const r = CHAR_RADIUS;
    const points = [
      [px - r, py - r],
      [px + r, py - r],
      [px - r, py + r],
      [px + r, py + r],
      [px, py + r] // feet
    ];
    for (const [x, y] of points) {
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (isBlocked(this.map, tx, ty)) return true;
    }
    // npc collision (circle vs circle)
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - px, n.y - py);
      if (d < r * 2) return true;
    }
    return false;
  }

  _render() {
    const { ctx } = this;
    ctx.fillStyle = "#0f0f15";
    ctx.fillRect(0, 0, this.cam.w, this.cam.h);

    drawMap(ctx, this.map, this.cam);
    this._drawNameplates();

    // gather drawables for y-sort so sprites overlap correctly
    const drawables = [];
    drawables.push({ y: this.player.y, draw: () => this._drawPlayer() });
    for (const n of this.npcs) {
      drawables.push({ y: n.y, draw: () => this._drawNPC(n) });
    }
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    // NPC interaction pulse
    if (this.nearbyNPC) {
      this._drawInteractPulse(this.nearbyNPC);
    }
  }

  _drawPlayer() {
    const p = this.player;
    drawCharacter(
      this.ctx,
      p.x - this.cam.x,
      p.y - this.cam.y,
      p.dir,
      p.phase,
      p.moving,
      p.avatar
    );
  }

  _drawNPC(n) {
    drawCharacter(
      this.ctx,
      n.x - this.cam.x,
      n.y - this.cam.y,
      n.facing,
      n.phase,
      false,
      n.id
    );
    // name tag
    const cx = n.x - this.cam.x;
    const cy = n.y - this.cam.y - 24;
    this.ctx.font = "11px system-ui, sans-serif";
    const label = n.name;
    const w = this.ctx.measureText(label).width + 10;
    this.ctx.fillStyle = "rgba(0,0,0,0.65)";
    this._roundRect(cx - w / 2, cy - 10, w, 14, 3);
    this.ctx.fillStyle = "#fff";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(label, cx, cy - 3);
  }

  _drawNameplates() {
    const ctx = this.ctx;
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const np of NAMEPLATES) {
      const cx = np.tx * TILE + TILE / 2 - this.cam.x;
      const cy = np.ty * TILE - 6 - this.cam.y;
      const w = ctx.measureText(np.text).width + 12;
      ctx.fillStyle = "rgba(20, 18, 14, 0.85)";
      this._roundRect(cx - w / 2, cy - 9, w, 16, 3);
      ctx.fillStyle = "#ffd166";
      ctx.fillText(np.text, cx, cy);
    }
  }

  _drawInteractPulse(n) {
    const cx = n.x - this.cam.x;
    const cy = n.y - this.cam.y + 22;
    const t = (performance.now() / 500) % 1;
    const r = 4 + Math.sin(t * Math.PI * 2) * 2;
    this.ctx.save();
    this.ctx.globalAlpha = 0.85;
    this.ctx.fillStyle = "#ffd166";
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.font = "bold 10px system-ui, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("E", cx, cy);
    this.ctx.restore();
  }

  _roundRect(x, y, w, h, r) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    c.fill();
  }
}
