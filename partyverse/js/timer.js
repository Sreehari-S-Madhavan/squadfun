/**
 * timer.js — Accurate countdown timer
 *
 * Uses Date.now() timestamps instead of relying on setInterval drift.
 * Survives brief backgrounding because elapsed time is recalculated on tick.
 *
 * Usage:
 *   const t = new Timer(60, onTick, onExpire);
 *   t.start();
 *   t.pause();
 *   t.resume();
 *   t.reset(90);
 *   t.destroy();
 */

export class Timer {
  /**
   * @param {number} durationSec  — total countdown seconds
   * @param {(remaining: number, fraction: number) => void} onTick
   * @param {() => void} onExpire
   */
  constructor(durationSec, onTick, onExpire) {
    this.duration   = durationSec;
    this.onTick     = onTick;
    this.onExpire   = onExpire;

    this._startedAt  = null;   // Date.now() when timer last (re)started
    this._elapsed    = 0;      // ms elapsed before last pause
    this._rafId      = null;
    this._running    = false;
    this._expired    = false;
  }

  /** Remaining seconds (rounded) */
  get remaining() {
    if (!this._running && !this._startedAt) return this.duration;
    const totalElapsedMs = this._elapsed + (this._running ? Date.now() - this._startedAt : 0);
    return Math.max(0, this.duration - Math.floor(totalElapsedMs / 1000));
  }

  /** 0–1 fraction of time consumed */
  get fraction() {
    return Math.min(1, 1 - this.remaining / this.duration);
  }

  start() {
    if (this._running || this._expired) return;
    this._startedAt = Date.now();
    this._running   = true;
    this._tick();
  }

  pause() {
    if (!this._running) return;
    this._elapsed  += Date.now() - this._startedAt;
    this._running   = false;
    cancelAnimationFrame(this._rafId);
    this.onTick(this.remaining, this.fraction);
  }

  resume() {
    if (this._running || this._expired) return;
    this._startedAt = Date.now();
    this._running   = true;
    this._tick();
  }

  reset(newDuration) {
    cancelAnimationFrame(this._rafId);
    this.duration   = newDuration ?? this.duration;
    this._startedAt = null;
    this._elapsed   = 0;
    this._running   = false;
    this._expired   = false;
    this.onTick(this.duration, 0);
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    this._running = false;
  }

  /** Serialize for localStorage recovery */
  serialize() {
    return {
      duration:    this.duration,
      elapsed:     this._elapsed + (this._running ? Date.now() - this._startedAt : 0),
      running:     this._running,
    };
  }

  /** Restore from serialized state (call start() yourself if needed) */
  static restore(data, onTick, onExpire) {
    const t = new Timer(data.duration, onTick, onExpire);
    t._elapsed = data.elapsed || 0;
    return t;
  }

  _tick() {
    const rem = this.remaining;
    this.onTick(rem, this.fraction);

    if (rem <= 0) {
      this._expired = true;
      this._running = false;
      this.onExpire();
      return;
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }
}

