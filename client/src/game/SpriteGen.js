const TILE = 32;
const SCALE = 2; // each pixel of the sprite is 2x2 screen px

function shade(hex, amt) {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

// Character sprite is 12 wide × 18 tall logical pixels.
// Origin (cx, cy) = feet baseline center. Sprite extends up from there.
// At SCALE=2 → rendered as 24 × 36 screen pixels.

export function drawCharacter(ctx, cx, cy, dir, phase, moving, palette) {
  const px = (x) => Math.round(cx - 6 * SCALE + x * SCALE);
  const py = (y) => Math.round(cy - 18 * SCALE + y * SCALE);

  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(px(x), py(y), w * SCALE, h * SCALE);
  };
  const pix = (x, y, color) => rect(x, y, 1, 1, color);

  const skin = palette.skin;
  const skinDark = shade(skin, -35);
  const hair = palette.hair;
  const hairDark = shade(hair, -25);
  const shirt = palette.shirt;
  const shirtDark = shade(shirt, -25);
  const pants = palette.pants;
  const pantsDark = shade(pants, -15);
  const boot = "#1a1612";

  // shadow on the ground (at feet)
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 9, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // walk frame: 4 discrete frames
  const frameIdx = moving ? Math.floor(phase * 4) % 4 : 0;
  // leg offsets per frame [0, -1, 0, 1]
  const legTable = [0, -1, 0, 1];
  const legOffset = legTable[frameIdx];
  const leftLegY = 14 + (dir === 1 ? legOffset : legOffset);
  const rightLegY = 14 + (dir === 2 ? -legOffset : -legOffset);

  // For up/down movement, swing legs opposite; for side, one in front.
  const legL_off = (dir === 1 || dir === 2) ? Math.abs(legOffset) : legOffset;
  const legR_off = (dir === 1 || dir === 2) ? -Math.abs(legOffset) : -legOffset;

  // --- LEGS (2 legs, vertically offset for walk) ---
  // left leg
  rect(3, 14 + legL_off, 2, 3, pants);
  rect(3, 17 + legL_off, 2, 1, pantsDark);
  rect(3, 18 + legL_off, 2, 1, boot);
  // right leg
  rect(7, 14 + legR_off, 2, 3, pants);
  rect(7, 17 + legR_off, 2, 1, pantsDark);
  rect(7, 18 + legR_off, 2, 1, boot);

  // --- BODY (shirt) ---
  // shoulders
  rect(2, 8, 8, 1, shirtDark);
  rect(2, 9, 8, 4, shirt);
  rect(2, 13, 8, 1, shirtDark);
  // shirt collar detail
  pix(5, 8, shade(shirt, 20));
  pix(6, 8, shade(shirt, 20));

  // --- ARMS ---
  // arm swing phase (side dirs only)
  const armPhase = moving ? Math.sin(phase * Math.PI * 2) : 0;
  if (dir === 1) {
    // left: right arm forward
    rect(1, 9, 1, 4, shirt);
    pix(1, 13, skin);
    rect(10, 9, 1, 4, shirt);
    pix(10, 13, skin);
  } else if (dir === 2) {
    // right: left arm forward
    rect(1, 9, 1, 4, shirt);
    pix(1, 13, skin);
    rect(10, 9, 1, 4, shirt);
    pix(10, 13, skin);
  } else {
    // arms at sides, slight swing if moving
    const s = moving ? (frameIdx === 1 ? -1 : frameIdx === 3 ? 1 : 0) : 0;
    rect(1, 9 + s, 1, 4, shirt);
    pix(1, 13 + s, skin);
    rect(10, 9 - s, 1, 4, shirt);
    pix(10, 13 - s, skin);
  }

  // --- NECK ---
  rect(5, 7, 2, 1, skinDark);

  // --- HEAD ---
  if (dir === 3) {
    // facing up — show back of head (all hair)
    rect(3, 1, 6, 1, hairDark);
    rect(2, 2, 8, 5, hair);
    // ear hints
    pix(2, 4, skin);
    pix(9, 4, skin);
  } else {
    // face visible
    // hair crown
    rect(3, 1, 6, 1, hairDark);
    rect(2, 2, 8, 2, hair);
    // face (skin)
    rect(3, 4, 6, 3, skin);
    rect(2, 5, 1, 2, skin); // ears
    rect(9, 5, 1, 2, skin);

    // eyes + mouth based on dir
    if (dir === 0) {
      // facing down — full face
      // hair bangs fall forward
      rect(3, 3, 2, 1, hair);
      rect(7, 3, 2, 1, hair);
      // eyes
      pix(4, 5, "#111");
      pix(7, 5, "#111");
      pix(4, 5, "#111");
      // mouth
      rect(5, 6, 2, 1, skinDark);
    } else if (dir === 1) {
      // facing left — one eye, hair swept
      rect(2, 3, 4, 1, hair);
      pix(3, 5, "#111");
      rect(3, 6, 2, 1, skinDark);
    } else if (dir === 2) {
      // facing right
      rect(6, 3, 4, 1, hair);
      pix(8, 5, "#111");
      rect(7, 6, 2, 1, skinDark);
    }

    // cheek blush dot
    pix(3, 6, shade(skin, 10));
    pix(8, 6, shade(skin, 10));
  }
}

// character palettes
export const PALETTES = {
  player: { skin: "#f0c099", hair: "#4b2e1a", shirt: "#2d5aa8", pants: "#1a1a2e" },
  ana: { skin: "#f4a896", hair: "#3b2a1a", shirt: "#e05a7b", pants: "#2a2a3a" },
  maria: { skin: "#e8c39e", hair: "#5a2a1a", shirt: "#7a2a5a", pants: "#2a2a3a" },
  joao: { skin: "#d4a574", hair: "#1a1a1a", shirt: "#d4a017", pants: "#4a3520" },
  carlos: { skin: "#c68863", hair: "#2a2a2a", shirt: "#2d7a4a", pants: "#2a2a3a" }
};

export { TILE, SCALE, shade };
