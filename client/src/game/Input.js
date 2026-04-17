export class Input {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.justPressed.add(k);
      this.keys.add(k);
      // prevent scroll on arrows/space when canvas has focus
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  isDown(...ks) {
    return ks.some((k) => this.keys.has(k));
  }

  consume(k) {
    if (this.justPressed.has(k)) {
      this.justPressed.delete(k);
      return true;
    }
    return false;
  }

  frameEnd() {
    this.justPressed.clear();
  }

  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  // disable movement keys while typing in chat
  setEnabled(enabled) {
    if (!enabled) this.keys.clear();
  }
}
