var Pt = Object.defineProperty;
var wt = (h, t, e) => t in h ? Pt(h, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : h[t] = e;
var s = (h, t, e) => wt(h, typeof t != "symbol" ? t + "" : t, e);
class At {
  constructor(t, e, i = 40) {
    s(this, "x");
    s(this, "y");
    s(this, "radius");
    s(this, "color");
    this.x = t, this.y = e, this.radius = i, this.color = "rgba(255, 255, 255, 0.1)";
  }
  draw(t) {
    t.save(), t.beginPath(), t.arc(this.x, this.y, this.radius, 0, Math.PI * 2), t.fillStyle = this.color, t.fill(), t.strokeStyle = "rgba(255, 255, 255, 0.2)", t.lineWidth = 2, t.stroke();
    const e = t.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    e.addColorStop(0, "rgba(102, 138, 255, 0.1)"), e.addColorStop(1, "rgba(102, 138, 255, 0)"), t.fillStyle = e, t.fill(), t.restore();
  }
  contains(t, e) {
    const i = t - this.x, r = e - this.y;
    return i * i + r * r <= this.radius * this.radius;
  }
}
let kt = 0;
const X = 2e-4, Z = 0.0141421356, Ct = 16e4, tt = 0.8, _ = -0.7, et = 8, Mt = 33, it = 0.02, st = 1e-3, rt = 12;
class Ft {
  constructor(t, e, i, r, n = Math.random) {
    s(this, "id");
    s(this, "x");
    s(this, "y");
    s(this, "vx");
    s(this, "vy");
    s(this, "ax");
    s(this, "ay");
    s(this, "life");
    s(this, "maxLife");
    s(this, "size");
    s(this, "baseSize");
    s(this, "hue");
    s(this, "mass");
    // Flocking cache / throttling
    s(this, "flockingTimer");
    s(this, "flockAvgVx");
    s(this, "flockAvgVy");
    s(this, "flockAvgX");
    s(this, "flockAvgY");
    s(this, "flockNeighborCount");
    // Fallback color cache
    s(this, "colorString");
    this.id = ++kt, this.x = t, this.y = e, this.vx = (n() - 0.5) * 10, this.vy = (n() - 0.5) * 10, this.ax = 0, this.ay = 0, this.maxLife = r.particleLife + n() * 50, this.life = this.maxLife, this.baseSize = r.particleSize * (0.4 + n() * 0.8), this.size = this.baseSize, this.hue = 200 + n() * 60, this.mass = this.size, this.flockingTimer = this.id % 3 * 11, this.flockAvgVx = 0, this.flockAvgVy = 0, this.flockAvgX = this.x, this.flockAvgY = this.y, this.flockNeighborCount = 0, this.colorString = i;
  }
  update(t, e, i, r, n, a, l, o, c) {
    const d = c ?? ((m, g, f) => m + g * f), {
      attraction: u,
      repulsion: w,
      vortex: M,
      flocking: F,
      collisions: R,
      gravity: y,
      friction: I
    } = t;
    if (this.size = this.baseSize, this.mass = this.size > 0.1 ? this.size : 0.1, r !== null && n !== null) {
      const m = r - this.x, g = n - this.y, f = m * m + g * g;
      if (f < Ct) {
        const p = (u - w) / (f + 500);
        this.ax += m * p, this.ay += g * p, M && (this.ax += g * 0.03, this.ay -= m * 0.03);
      }
    }
    const k = a.length;
    if (F && k > 0) {
      if (this.flockingTimer += o * 16.6667, this.flockingTimer >= Mt) {
        this.flockingTimer = 0;
        const m = k < et ? k : et;
        let g = 0, f = 0, p = 0, x = 0;
        for (let S = 0; S < m; S++) {
          const b = a[S];
          g += b.vx, f += b.vy, p += b.x, x += b.y;
        }
        const v = 1 / m;
        this.flockAvgVx = g * v, this.flockAvgVy = f * v, this.flockAvgX = p * v, this.flockAvgY = x * v, this.flockNeighborCount = m;
      }
      this.flockNeighborCount > 0 && (this.ax += (this.flockAvgVx - this.vx) * it, this.ay += (this.flockAvgVy - this.vy) * it, this.ax += (this.flockAvgX - this.x) * st, this.ay += (this.flockAvgY - this.y) * st);
    }
    if (R && k > 0) {
      const m = k < rt ? k : rt;
      for (let g = 0; g < m; g++) {
        const f = a[g];
        if (this.id >= f.id) continue;
        let p = f.x - this.x, x = f.y - this.y, v = p * p + x * x;
        const S = this.size + f.size;
        if (v < S * S) {
          let b = Z;
          v <= 0 ? (p = 0.01, x = 0.01, v = X) : b = Math.sqrt(v);
          const A = p / b, C = x / b, E = S - b, G = this.mass + f.mass, q = G > 0 ? 1 / G : 1, Y = this.mass * q, j = f.mass * q;
          this.x -= A * E * j, this.y -= C * E * j, f.x += A * E * Y, f.y += C * E * Y;
          const bt = this.vx - f.vx, St = this.vy - f.vy, $ = bt * A + St * C;
          if ($ < 0) {
            const K = -1.8 * $ / (1 / this.mass + 1 / f.mass), Q = K * A, J = K * C;
            this.vx += Q / this.mass, this.vy += J / this.mass, f.vx -= Q / f.mass, f.vy -= J / f.mass;
          }
        }
      }
    }
    for (let m = 0; m < l.length; m++) {
      const g = l[m];
      let f = this.x - g.x, p = this.y - g.y, x = f * f + p * p;
      const v = this.size + g.radius;
      if (x < v * v) {
        let S = Z;
        x <= 0 ? (f = 0.01, p = 0.01, x = X) : S = Math.sqrt(x);
        const b = f / S, A = p / S;
        this.x = g.x + b * v, this.y = g.y + A * v;
        const C = this.vx * b + this.vy * A;
        this.vx = (this.vx - 2 * C * b) * tt, this.vy = (this.vy - 2 * C * A) * tt;
      }
    }
    this.ay += y, this.vx = d(this.vx, this.ax, o), this.vy = d(this.vy, this.ay, o);
    const z = Math.pow(I, o);
    this.vx *= z, this.vy *= z, this.x = d(this.x, this.vx, o), this.y = d(this.y, this.vy, o), this.ax = 0, this.ay = 0, this.x < this.size ? (this.x = this.size, this.vx *= _) : this.x > e - this.size && (this.x = e - this.size, this.vx *= _), this.y < this.size ? (this.y = this.size, this.vy *= _) : this.y > i - this.size && (this.y = i - this.size, this.vy *= _), this.life -= o;
  }
  draw(t, e, i) {
    const r = this.life > 0 ? this.life / this.maxLife : 0;
    if (t.globalAlpha = r, i) {
      const l = this.size * (e.bloom ? 3 : 1.5);
      t.drawImage(
        i,
        this.x - l,
        this.y - l,
        l * 2,
        l * 2
      );
      return;
    }
    const n = this.vx * this.vx + this.vy * this.vy, a = this.hue + Math.sqrt(n) * 5 | 0;
    this.colorString = `hsl(${a}, 85%, 65%)`, t.fillStyle = this.colorString, t.beginPath(), t.arc(this.x, this.y, this.size, 0, Math.PI * 2), t.fill();
  }
  isDead() {
    return this.life <= 0;
  }
}
const at = "#11131c", P = 48, D = 48, U = 16.67;
class O {
  constructor(t, e = 5e4) {
    s(this, "canvas");
    s(this, "ctx");
    s(this, "maxParticles");
    s(this, "firstFrame", !0);
    s(this, "drawStride", 1);
    s(this, "smoothedRenderMs", U);
    s(this, "solidColorPalette");
    s(this, "glowSpritePalette");
    this.canvas = t;
    const i = t.getContext("2d", { alpha: !0, desynchronized: !0 });
    if (!i)
      throw new Error("Canvas2D not supported");
    this.ctx = i, this.maxParticles = e, this.solidColorPalette = this.buildSolidPalette(), this.glowSpritePalette = this.buildGlowPalette();
  }
  render(t, e, i, r) {
    const n = performance.now(), a = this.ctx;
    this.firstFrame && (a.globalAlpha = 1, a.fillStyle = at, a.fillRect(0, 0, e, i), this.firstFrame = !1), this.updateQualityPolicy(t.length, r.bloom);
    const l = Math.max(0, Math.min(r.trailStrength, 1)), o = Math.min(Math.max(1 - l, 0.04), 0.92);
    a.globalCompositeOperation = "source-over", a.globalAlpha = o, a.fillStyle = at, a.fillRect(0, 0, e, i);
    const c = Math.min(this.maxParticles, t.length);
    if (a.globalCompositeOperation = r.bloom ? "lighter" : "source-over", this.drawStride > 1 ? this.renderFastPath(t, c, r.bloom) : this.renderQualityPath(t, c, r.bloom), r.vignette && this.drawStride < 4) {
      const u = a.createRadialGradient(
        e * 0.5,
        i * 0.5,
        Math.min(e, i) * 0.18,
        e * 0.5,
        i * 0.5,
        Math.max(e, i) * 0.75
      );
      u.addColorStop(0, "rgba(0, 0, 0, 0)"), u.addColorStop(1, "rgba(0, 0, 0, 0.4)"), a.globalAlpha = 1, a.globalCompositeOperation = "source-over", a.fillStyle = u, a.fillRect(0, 0, e, i);
    }
    const d = performance.now() - n;
    this.smoothedRenderMs += (d - this.smoothedRenderMs) * 0.08;
  }
  resizeMaxParticles(t) {
    this.maxParticles = t;
  }
  dispose() {
    this.ctx.globalCompositeOperation = "source-over", this.ctx.globalAlpha = 1;
  }
  updateQualityPolicy(t, e) {
    const i = t / Math.max(this.maxParticles, 1), r = e ? 1.45 : 1, n = this.smoothedRenderMs * r * (1 + i * 0.35);
    n > U * 1.45 ? this.drawStride = Math.min(this.drawStride + 1, 4) : n < U * 0.86 && (this.drawStride = Math.max(this.drawStride - 1, 1));
  }
  renderFastPath(t, e, i) {
    const r = this.ctx;
    for (let n = 0; n < e; n += this.drawStride) {
      const a = t[n], l = a.life > 0 ? a.life / a.maxLife : 0;
      if (l <= 0.01) continue;
      r.globalAlpha = l;
      const o = this.paletteIndex(a.hue + Math.min((a.vx * a.vx + a.vy * a.vy) * 1.25, 60));
      if (i) {
        const c = this.glowSpritePalette[o];
        if (c) {
          const d = a.size * 2.4, u = d * 2;
          r.drawImage(c, a.x - d, a.y - d, u, u);
        } else
          r.fillStyle = this.solidColorPalette[o], r.fillRect(a.x - a.size, a.y - a.size, a.size * 2, a.size * 2);
      } else
        r.fillStyle = this.solidColorPalette[o], r.fillRect(a.x - a.size, a.y - a.size, a.size * 2, a.size * 2);
    }
  }
  renderQualityPath(t, e, i) {
    const r = this.ctx;
    for (let n = 0; n < e; n++) {
      const a = t[n], l = a.life > 0 ? a.life / a.maxLife : 0;
      if (l <= 0.01) continue;
      r.globalAlpha = l;
      const o = this.paletteIndex(a.hue + Math.min((a.vx * a.vx + a.vy * a.vy) * 1.25, 60));
      if (i) {
        const c = this.glowSpritePalette[o];
        if (c) {
          const d = a.size * 2.6, u = d * 2;
          r.drawImage(c, a.x - d, a.y - d, u, u);
          continue;
        }
      }
      r.fillStyle = this.solidColorPalette[o], r.beginPath(), r.arc(a.x, a.y, a.size, 0, Math.PI * 2), r.fill();
    }
  }
  paletteIndex(t) {
    const e = (t % 360 + 360) % 360;
    return Math.floor(e / 360 * P) % P;
  }
  buildSolidPalette() {
    const t = new Array(P);
    for (let e = 0; e < P; e++) {
      const i = Math.floor(e / P * 360);
      t[e] = `hsl(${i}, 85%, 65%)`;
    }
    return t;
  }
  buildGlowPalette() {
    const t = new Array(P);
    if (typeof document > "u") {
      for (let e = 0; e < P; e++) t[e] = null;
      return t;
    }
    for (let e = 0; e < P; e++) {
      const i = Math.floor(e / P * 360), r = document.createElement("canvas");
      r.width = D, r.height = D;
      const n = r.getContext("2d");
      if (!n) {
        t[e] = null;
        continue;
      }
      const a = D * 0.5, l = n.createRadialGradient(a, a, 0, a, a, a);
      l.addColorStop(0, `hsla(${i}, 85%, 70%, 1)`), l.addColorStop(1, `hsla(${i}, 85%, 70%, 0)`), n.fillStyle = l, n.beginPath(), n.arc(a, a, a, 0, Math.PI * 2), n.fill(), t[e] = r;
    }
    return t;
  }
}
const nt = "#11131c", B = 5, yt = 64, Rt = `
let canvas = null;
let ctx = null;
let maxParticles = 50000;
let firstFrame = true;

self.onmessage = (event) => {
  const data = event.data;

  if (data.type === 'init') {
    canvas = data.canvas;
    if (typeof data.maxParticles === 'number') {
      maxParticles = data.maxParticles;
    }
    if (canvas) {
      ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      // Alguns navegadores aceitam OffscreenCanvas, mas falham com flags avançadas.
      // Fazemos fallback para assinatura básica antes de marcar erro fatal.
      if (!ctx) {
        ctx = canvas.getContext('2d');
      }
      if (!ctx) {
        self.postMessage({ type: 'error', message: 'offscreen-2d-context-unavailable' });
        return;
      }
      self.postMessage({ type: 'ready' });
    }
    return;
  }

  if (data.type === 'set-max-particles') {
    if (typeof data.maxParticles === 'number') {
      maxParticles = data.maxParticles;
    }
    return;
  }

  if (!ctx || !canvas) return;

  if (data.type === 'resize') {
    canvas.width = data.width;
    canvas.height = data.height;
    firstFrame = true;
    return;
  }

  if (data.type !== 'render') {
    return;
  }

  try {
    const width = data.width;
    const height = data.height;
    const bloom = data.bloom;
    const trailStrength = data.trailStrength;
    const vignette = data.vignette;

    if (firstFrame) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '${nt}';
      ctx.fillRect(0, 0, width, height);
      firstFrame = false;
    }

    const fadeAlpha = Math.min(Math.max(1 - trailStrength, 0.04), 0.92);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = '${nt}';
    ctx.fillRect(0, 0, width, height);

    const compression = data.compression || 'none';
    const packed = data.packed;
    const count = Math.min(data.count, maxParticles);
    ctx.globalCompositeOperation = bloom ? 'lighter' : 'source-over';

    for (let i = 0; i < count; i++) {
      const offset = i * ${B};
      let x = 0;
      let y = 0;
      let size = 0;
      let hue = 0;
      let alpha = 0;

      if (compression === 'quantized16') {
        x = (packed[offset] / 65535) * width;
        y = (packed[offset + 1] / 65535) * height;
        size = (packed[offset + 2] / 65535) * ${yt};
        hue = (packed[offset + 3] / 65535) * 360;
        alpha = packed[offset + 4] / 65535;
      } else {
        x = packed[offset];
        y = packed[offset + 1];
        size = packed[offset + 2];
        hue = packed[offset + 3];
        alpha = packed[offset + 4];
      }

      if (alpha <= 0.01) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'hsl(' + hue + ', 85%, 65%)';
      ctx.beginPath();
      ctx.arc(x, y, bloom ? size * 1.8 : size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (vignette) {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.18,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'render-error' });
  }

  self.postMessage({ type: 'rendered' });
};
`;
class Bt {
  constructor(t, e, i) {
    s(this, "worker");
    s(this, "workerUrl");
    s(this, "maxParticles");
    s(this, "packedDataFloat");
    s(this, "packedDataQ16");
    s(this, "compression");
    s(this, "inFlight", !1);
    s(this, "ready", !1);
    s(this, "failed", !1);
    s(this, "lastErrorReason", null);
    s(this, "lastWidth", -1);
    s(this, "lastHeight", -1);
    s(this, "onError", null);
    if (typeof Worker > "u" || typeof t.transferControlToOffscreen != "function")
      throw new Error("Offscreen worker rendering not supported");
    const r = new Blob([Rt], { type: "text/javascript" });
    this.workerUrl = URL.createObjectURL(r), this.worker = new Worker(this.workerUrl);
    const n = t.transferControlToOffscreen();
    this.maxParticles = e, this.compression = (i == null ? void 0 : i.compression) ?? "none", this.packedDataFloat = new Float32Array(e * B), this.packedDataQ16 = new Uint16Array(e * B), this.worker.onmessage = (a) => {
      var o, c;
      const l = (o = a.data) == null ? void 0 : o.type;
      if (l === "ready") {
        this.ready = !0;
        return;
      }
      l === "error" && (this.failed = !0, this.lastErrorReason = a.data.message ?? "offscreen-worker-render-error", (c = this.onError) == null || c.call(this, this.lastErrorReason)), this.inFlight = !1;
    }, this.worker.onerror = () => {
      var a;
      this.failed = !0, this.inFlight = !1, this.lastErrorReason = "offscreen-worker-error", (a = this.onError) == null || a.call(this, this.lastErrorReason);
    }, this.worker.postMessage(
      {
        type: "init",
        canvas: n,
        maxParticles: e
      },
      [n]
    );
  }
  render(t, e, i, r) {
    if (this.failed || !this.ready || this.inFlight) return;
    (e !== this.lastWidth || i !== this.lastHeight) && (this.worker.postMessage({ type: "resize", width: e, height: i }), this.lastWidth = e, this.lastHeight = i);
    const n = Math.min(t.length, this.maxParticles);
    let a = 0;
    for (let l = 0; l < n; l++) {
      const o = t[l], c = o.vx * o.vx + o.vy * o.vy, d = ((o.hue + Math.min(c * 1.25, 60)) % 360 + 360) % 360, u = o.life > 0 ? o.life / o.maxLife : 0;
      this.compression === "quantized16" ? (this.packedDataQ16[a++] = this.quantizeUnit(o.x / Math.max(e, 1)), this.packedDataQ16[a++] = this.quantizeUnit(o.y / Math.max(i, 1)), this.packedDataQ16[a++] = this.quantizeUnit(o.size / yt), this.packedDataQ16[a++] = this.quantizeUnit(d / 360), this.packedDataQ16[a++] = this.quantizeUnit(u)) : (this.packedDataFloat[a++] = o.x, this.packedDataFloat[a++] = o.y, this.packedDataFloat[a++] = o.size, this.packedDataFloat[a++] = d, this.packedDataFloat[a++] = u);
    }
    this.inFlight = !0, this.worker.postMessage({
      type: "render",
      compression: this.compression,
      width: e,
      height: i,
      count: n,
      bloom: r.bloom,
      trailStrength: r.trailStrength,
      vignette: r.vignette,
      packed: this.compression === "quantized16" ? this.packedDataQ16 : this.packedDataFloat
    });
  }
  resizeMaxParticles(t) {
    t !== this.maxParticles && (this.maxParticles = t, this.packedDataFloat = new Float32Array(t * B), this.packedDataQ16 = new Uint16Array(t * B), this.worker.postMessage({ type: "set-max-particles", maxParticles: t }));
  }
  setErrorHandler(t) {
    this.onError = t, this.onError && this.failed && this.lastErrorReason && this.onError(this.lastErrorReason);
  }
  dispose() {
    this.worker.terminate(), URL.revokeObjectURL(this.workerUrl);
  }
  quantizeUnit(t) {
    return Math.max(0, Math.min(1, t)) * 65535 | 0;
  }
}
const ot = 17 / 255, lt = 19 / 255, ht = 28 / 255, L = 7, T = L * 4, Et = 2;
class _t {
  constructor(t, e = 5e4) {
    s(this, "canvas");
    s(this, "gl");
    s(this, "program", null);
    s(this, "fadeProgram", null);
    s(this, "vaos", []);
    s(this, "fadeVao", null);
    s(this, "instanceBuffers", []);
    s(this, "activeInstanceSlot", 0);
    s(this, "quadBuffer", null);
    s(this, "maxParticles");
    s(this, "instanceData");
    s(this, "uResolutionLoc", null);
    s(this, "uBloomLoc", null);
    s(this, "uVignetteLoc", null);
    s(this, "uFadeAlphaLoc", null);
    s(this, "firstFrame", !0);
    s(this, "isContextLost", !1);
    s(this, "onError", null);
    s(this, "lastWidth", -1);
    s(this, "lastHeight", -1);
    s(this, "lastBloom", -1);
    s(this, "lastVignette", -1);
    s(this, "lastFadeAlpha", -1);
    // 360-step LUT for HSL(h, 0.85, 0.65) -> RGB
    s(this, "huePalette", new Float32Array(360 * 3));
    s(this, "handleContextLost", (t) => {
      var e;
      t.preventDefault(), this.isContextLost = !0, (e = this.onError) == null || e.call(this, "webgl-context-lost");
    });
    s(this, "handleContextRestored", () => {
      var t;
      this.isContextLost = !1;
      try {
        this.initResources();
      } catch {
        (t = this.onError) == null || t.call(this, "webgl-context-restore-failed");
      }
    });
    this.canvas = t;
    const i = t.getContext("webgl2", {
      antialias: !1,
      preserveDrawingBuffer: !1,
      alpha: !0,
      premultipliedAlpha: !0,
      powerPreference: "high-performance"
    });
    if (!i)
      throw new Error("WebGL2 not supported");
    this.gl = i, this.maxParticles = e, this.instanceData = new Float32Array(e * L), this.buildHuePalette(), this.initResources(), this.attachContextEvents();
  }
  attachContextEvents() {
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  detachContextEvents() {
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  buildHuePalette() {
    for (let t = 0; t < 360; t++) {
      const [e, i, r] = this.hslToRgb(t / 360, 0.85, 0.65), n = t * 3;
      this.huePalette[n] = e, this.huePalette[n + 1] = i, this.huePalette[n + 2] = r;
    }
  }
  hslToRgb(t, e, i) {
    if (e === 0) return [i, i, i];
    const r = (l, o, c) => {
      let d = c;
      return d < 0 && (d += 1), d > 1 && (d -= 1), d < 1 / 6 ? l + (o - l) * 6 * d : d < 1 / 2 ? o : d < 2 / 3 ? l + (o - l) * (2 / 3 - d) * 6 : l;
    }, n = i < 0.5 ? i * (1 + e) : i + e - i * e, a = 2 * i - n;
    return [
      r(a, n, t + 1 / 3),
      r(a, n, t),
      r(a, n, t - 1 / 3)
    ];
  }
  initResources() {
    const t = this.gl;
    this.disposeGpuResources();
    const e = `#version 300 es
      precision highp float;

      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_particlePos;
      layout(location = 2) in float a_particleSize;
      layout(location = 3) in vec3 a_particleColor;
      layout(location = 4) in float a_particleAlpha;

      uniform vec2 u_resolution;
      uniform float u_bloom;

      out vec2 v_uv;
      out vec3 v_color;
      out float v_alpha;
      out float v_bloom;

      void main() {
        float size = a_particleSize * mix(1.0, 3.0, step(0.5, u_bloom));
        vec2 pos = a_particlePos + a_position * size;

        vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
        clipSpace.y = -clipSpace.y;

        gl_Position = vec4(clipSpace, 0.0, 1.0);
        v_uv = a_position;
        v_color = a_particleColor;
        v_alpha = a_particleAlpha;
        v_bloom = u_bloom;
      }
    `, i = `#version 300 es
      precision highp float;

      in vec2 v_uv;
      in vec3 v_color;
      in float v_alpha;
      in float v_bloom;

      uniform vec2 u_resolution;
      uniform float u_vignette;

      out vec4 outColor;

      void main() {
        float dist = length(v_uv);

        float alpha = v_alpha;
        if (v_bloom > 0.5) {
          alpha *= exp(-dist * dist * 4.0);
        } else {
          alpha *= smoothstep(1.0, 0.8, dist);
        }

        alpha *= 1.0 - step(1.0, dist);

        if (u_vignette > 0.5) {
          vec2 uv = gl_FragCoord.xy / u_resolution;
          float d = distance(uv, vec2(0.5));
          float vignette = 1.0 - smoothstep(0.35, 0.75, d) * 0.35;
          alpha *= vignette;
        }

        outColor = vec4(v_color * alpha, alpha);
      }
    `, r = `#version 300 es
      layout(location = 0) in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `, n = `#version 300 es
      precision mediump float;
      uniform float u_fadeAlpha;
      out vec4 outColor;
      void main() {
        outColor = vec4(${ot.toFixed(8)}, ${lt.toFixed(8)}, ${ht.toFixed(8)}, u_fadeAlpha);
      }
    `;
    this.program = this.createProgram(e, i), this.fadeProgram = this.createProgram(r, n), this.uResolutionLoc = t.getUniformLocation(this.program, "u_resolution"), this.uBloomLoc = t.getUniformLocation(this.program, "u_bloom"), this.uVignetteLoc = t.getUniformLocation(this.program, "u_vignette"), this.uFadeAlphaLoc = t.getUniformLocation(this.fadeProgram, "u_fadeAlpha");
    const a = new Float32Array([
      -1,
      -1,
      1,
      -1,
      -1,
      1,
      1,
      1
    ]);
    if (this.quadBuffer = t.createBuffer(), !this.quadBuffer) throw new Error("Failed to create quad buffer");
    t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.bufferData(t.ARRAY_BUFFER, a, t.STATIC_DRAW), this.vaos = [], this.instanceBuffers = [];
    for (let l = 0; l < Et; l++) {
      const o = t.createVertexArray();
      if (!o) throw new Error("Failed to create particle VAO");
      const c = t.createBuffer();
      if (!c)
        throw t.deleteVertexArray(o), new Error("Failed to create instance buffer");
      t.bindVertexArray(o), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindBuffer(t.ARRAY_BUFFER, c), t.bufferData(t.ARRAY_BUFFER, this.instanceData.byteLength, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, T, 0), t.vertexAttribDivisor(1, 1), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, T, 8), t.vertexAttribDivisor(2, 1), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 3, t.FLOAT, !1, T, 12), t.vertexAttribDivisor(3, 1), t.enableVertexAttribArray(4), t.vertexAttribPointer(4, 1, t.FLOAT, !1, T, 24), t.vertexAttribDivisor(4, 1), this.vaos.push(o), this.instanceBuffers.push(c);
    }
    if (this.fadeVao = t.createVertexArray(), !this.fadeVao) throw new Error("Failed to create fade VAO");
    t.bindVertexArray(this.fadeVao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.enable(t.BLEND), this.firstFrame = !0, this.lastWidth = -1, this.lastHeight = -1, this.lastBloom = -1, this.lastVignette = -1, this.lastFadeAlpha = -1, this.activeInstanceSlot = 0;
  }
  createProgram(t, e) {
    const i = this.gl, r = i.createShader(i.VERTEX_SHADER);
    if (!r) throw new Error("Failed to create vertex shader");
    if (i.shaderSource(r, t), i.compileShader(r), !i.getShaderParameter(r, i.COMPILE_STATUS)) {
      const l = i.getShaderInfoLog(r) || "Unknown vertex shader error";
      throw i.deleteShader(r), new Error(`Vertex shader compile error: ${l}`);
    }
    const n = i.createShader(i.FRAGMENT_SHADER);
    if (!n)
      throw i.deleteShader(r), new Error("Failed to create fragment shader");
    if (i.shaderSource(n, e), i.compileShader(n), !i.getShaderParameter(n, i.COMPILE_STATUS)) {
      const l = i.getShaderInfoLog(n) || "Unknown fragment shader error";
      throw i.deleteShader(r), i.deleteShader(n), new Error(`Fragment shader compile error: ${l}`);
    }
    const a = i.createProgram();
    if (!a)
      throw i.deleteShader(r), i.deleteShader(n), new Error("Failed to create program");
    if (i.attachShader(a, r), i.attachShader(a, n), i.linkProgram(a), i.deleteShader(r), i.deleteShader(n), !i.getProgramParameter(a, i.LINK_STATUS)) {
      const l = i.getProgramInfoLog(a) || "Unknown program link error";
      throw i.deleteProgram(a), new Error(`Program link error: ${l}`);
    }
    return a;
  }
  render(t, e, i, r) {
    if (!this.program || !this.fadeProgram || !this.fadeVao || this.vaos.length === 0 || this.instanceBuffers.length === 0 || this.isContextLost)
      return;
    const n = this.gl;
    n.viewport(0, 0, e, i), this.firstFrame && (n.clearColor(ot, lt, ht, 1), n.clear(n.COLOR_BUFFER_BIT), this.firstFrame = !1);
    const a = Math.max(0, Math.min(r.trailStrength, 1)), l = Math.min(Math.max(1 - a, 0.04), 0.92);
    n.useProgram(this.fadeProgram), n.bindVertexArray(this.fadeVao), l !== this.lastFadeAlpha && (n.uniform1f(this.uFadeAlphaLoc, l), this.lastFadeAlpha = l), n.blendFunc(n.SRC_ALPHA, n.ONE_MINUS_SRC_ALPHA), n.drawArrays(n.TRIANGLE_STRIP, 0, 4);
    const o = Math.min(t.length, this.maxParticles);
    let c = 0;
    for (let R = 0; R < o; R++) {
      const y = t[R], I = y.vx * y.vx + y.vy * y.vy, m = ((y.hue + Math.min(I * 1.25, 60) | 0) % 360 + 360) % 360 * 3;
      this.instanceData[c++] = y.x, this.instanceData[c++] = y.y, this.instanceData[c++] = y.size, this.instanceData[c++] = this.huePalette[m], this.instanceData[c++] = this.huePalette[m + 1], this.instanceData[c++] = this.huePalette[m + 2], this.instanceData[c++] = y.life > 0 ? y.life / y.maxLife : 0;
    }
    const d = this.activeInstanceSlot, u = this.vaos[d], w = this.instanceBuffers[d];
    if (!u || !w)
      return;
    n.bindBuffer(n.ARRAY_BUFFER, w), n.bufferSubData(n.ARRAY_BUFFER, 0, this.instanceData, 0, o * L), n.useProgram(this.program), n.bindVertexArray(u), (e !== this.lastWidth || i !== this.lastHeight) && (n.uniform2f(this.uResolutionLoc, e, i), this.lastWidth = e, this.lastHeight = i);
    const M = r.bloom ? 1 : 0;
    M !== this.lastBloom && (n.uniform1f(this.uBloomLoc, M), this.lastBloom = M);
    const F = r.vignette ? 1 : 0;
    F !== this.lastVignette && (n.uniform1f(this.uVignetteLoc, F), this.lastVignette = F), r.bloom ? n.blendFunc(n.ONE, n.ONE) : n.blendFunc(n.ONE, n.ONE_MINUS_SRC_ALPHA), n.drawArraysInstanced(n.TRIANGLE_STRIP, 0, 4, o), n.bindVertexArray(null), this.activeInstanceSlot++, this.activeInstanceSlot >= this.instanceBuffers.length && (this.activeInstanceSlot = 0);
  }
  resizeMaxParticles(t) {
    if (t !== this.maxParticles && (this.maxParticles = t, this.instanceData = new Float32Array(t * L), this.instanceBuffers.length > 0)) {
      const e = this.gl;
      for (let i = 0; i < this.instanceBuffers.length; i++) {
        const r = this.instanceBuffers[i];
        r && (e.bindBuffer(e.ARRAY_BUFFER, r), e.bufferData(e.ARRAY_BUFFER, this.instanceData.byteLength, e.DYNAMIC_DRAW));
      }
      e.bindBuffer(e.ARRAY_BUFFER, null);
    }
  }
  setErrorHandler(t) {
    this.onError = t;
  }
  disposeGpuResources() {
    const t = this.gl;
    if (this.instanceBuffers.length > 0) {
      for (let e = 0; e < this.instanceBuffers.length; e++) {
        const i = this.instanceBuffers[e];
        i && t.deleteBuffer(i);
      }
      this.instanceBuffers = [];
    }
    if (this.quadBuffer && (t.deleteBuffer(this.quadBuffer), this.quadBuffer = null), this.vaos.length > 0) {
      for (let e = 0; e < this.vaos.length; e++) {
        const i = this.vaos[e];
        i && t.deleteVertexArray(i);
      }
      this.vaos = [];
    }
    this.fadeVao && (t.deleteVertexArray(this.fadeVao), this.fadeVao = null), this.program && (t.deleteProgram(this.program), this.program = null), this.fadeProgram && (t.deleteProgram(this.fadeProgram), this.fadeProgram = null);
  }
  dispose() {
    this.detachContextEvents(), this.disposeGpuResources();
  }
}
function Tt(h, t) {
  return t === "offscreen-worker" ? "offscreen-worker" : t === "canvas2d" ? "canvas2d" : t === "webgl2" || h.getContext("webgl2", {
    antialias: !1,
    preserveDrawingBuffer: !1,
    alpha: !0,
    premultipliedAlpha: !0,
    powerPreference: "high-performance"
  }) ? "webgl2" : "canvas2d";
}
function N(h, t, e, i) {
  const r = Tt(h, e);
  if (r === "offscreen-worker")
    try {
      return {
        renderer: new Bt(h, t, {
          compression: (i == null ? void 0 : i.workerTransportCompression) ?? "none"
        }),
        backend: r
      };
    } catch {
      return {
        renderer: new O(h, t),
        backend: "canvas2d"
      };
    }
  if (r === "webgl2")
    try {
      return {
        renderer: new _t(h, t),
        backend: r
      };
    } catch {
      return {
        renderer: new O(h, t),
        backend: "canvas2d"
      };
    }
  return {
    renderer: new O(h, t),
    backend: r
  };
}
const ct = [];
class Lt {
  constructor(t) {
    s(this, "grid");
    s(this, "cellSize");
    s(this, "invCellSize");
    this.grid = /* @__PURE__ */ new Map(), this.cellSize = t, this.invCellSize = 1 / t;
  }
  setCellSize(t) {
    this.cellSize = t, this.invCellSize = 1 / t, this.grid.clear();
  }
  clear() {
    for (const t of this.grid.values())
      t.length = 0;
  }
  toGridCoord(t) {
    return Math.floor(t * this.invCellSize);
  }
  hash(t, e) {
    return t * 73856093 ^ e * 19349663 | 0;
  }
  add(t) {
    const e = this.toGridCoord(t.x), i = this.toGridCoord(t.y), r = this.hash(e, i);
    let n = this.grid.get(r);
    n || (n = [], this.grid.set(r, n)), n.push(t);
  }
  getNeighbors(t) {
    const e = this.toGridCoord(t.x), i = this.toGridCoord(t.y), r = [];
    for (let n = e - 1; n <= e + 1; n++)
      for (let a = i - 1; a <= i + 1; a++) {
        const l = this.grid.get(this.hash(n, a));
        if (l)
          for (let o = 0; o < l.length; o++) {
            const c = l[o];
            c !== t && r.push(c);
          }
      }
    return r.length > 0 ? r : ct;
  }
  getNeighborsInto(t, e) {
    e.length = 0;
    const i = this.toGridCoord(t.x), r = this.toGridCoord(t.y);
    for (let n = i - 1; n <= i + 1; n++)
      for (let a = r - 1; a <= r + 1; a++) {
        const l = this.grid.get(this.hash(n, a));
        if (l)
          for (let o = 0; o < l.length; o++) {
            const c = l[o];
            c !== t && e.push(c);
          }
      }
  }
  getCellParticlesAt(t, e) {
    const i = this.toGridCoord(t), r = this.toGridCoord(e);
    return this.grid.get(this.hash(i, r)) ?? ct;
  }
}
class It {
  constructor(t, e) {
    s(this, "baseLimit");
    s(this, "options");
    s(this, "scale", 1);
    s(this, "activeParticleLimit");
    s(this, "frameCounter", 0);
    this.baseLimit = Math.max(1, t | 0), this.options = e, this.activeParticleLimit = this.baseLimit;
  }
  reset() {
    this.scale = 1, this.activeParticleLimit = this.baseLimit, this.frameCounter = 0;
  }
  update(t, e) {
    if (!this.options.enabled) {
      this.scale = 1, this.activeParticleLimit = this.baseLimit;
      return;
    }
    if (this.frameCounter++, this.frameCounter % this.options.updateIntervalFrames !== 0)
      return;
    const i = e > 0 ? e : t;
    if (i >= this.options.highWatermarkMs) {
      const r = (i - this.options.highWatermarkMs) / this.options.highWatermarkMs;
      this.scale -= this.options.dropRate * (1 + r);
    } else if (i <= this.options.lowWatermarkMs) {
      const r = (this.options.lowWatermarkMs - i) / this.options.lowWatermarkMs;
      this.scale += this.options.recoveryRate * (1 + r);
    }
    this.scale < this.options.minScale && (this.scale = this.options.minScale), this.scale > 1 && (this.scale = 1), this.activeParticleLimit = Math.max(1, Math.floor(this.baseLimit * this.scale));
  }
  setEnabled(t) {
    this.options.enabled = t, t || this.reset();
  }
  snapshot() {
    return {
      activeParticleLimit: this.activeParticleLimit,
      scale: this.scale
    };
  }
}
const H = 0;
class zt {
  constructor(t = 300, e = 0.25, i = 120) {
    s(this, "samples");
    s(this, "buckets");
    s(this, "bucketSizeMs");
    s(this, "maxBucketMs");
    s(this, "writeIndex", 0);
    s(this, "size", 0);
    s(this, "sumMs", 0);
    const r = Math.max(1, t | 0), n = Math.max(0.05, e), a = Math.max(16, i);
    this.samples = new Float32Array(r), this.bucketSizeMs = n, this.maxBucketMs = a, this.buckets = new Uint32Array(Math.floor(a / n) + 1);
  }
  push(t) {
    const e = this.clampFrameMs(t);
    if (this.size === this.samples.length) {
      const i = this.samples[this.writeIndex];
      this.sumMs -= i, this.buckets[this.toBucket(i)]--;
    } else
      this.size++;
    this.samples[this.writeIndex] = e, this.sumMs += e, this.buckets[this.toBucket(e)]++, this.writeIndex++, this.writeIndex >= this.samples.length && (this.writeIndex = 0);
  }
  reset() {
    this.samples.fill(0), this.buckets.fill(0), this.writeIndex = 0, this.size = 0, this.sumMs = 0;
  }
  snapshot(t) {
    const e = t ?? {
      sampleCount: 0,
      avgMs: 0,
      p95Ms: 0,
      p99Ms: 0
    };
    return this.size === 0 ? (e.sampleCount = 0, e.avgMs = 0, e.p95Ms = 0, e.p99Ms = 0, e) : (e.sampleCount = this.size, e.avgMs = this.sumMs / this.size, e.p95Ms = this.percentileFromHistogram(0.95), e.p99Ms = this.percentileFromHistogram(0.99), e);
  }
  clampFrameMs(t) {
    return !Number.isFinite(t) || t < H ? H : t > this.maxBucketMs ? this.maxBucketMs : t;
  }
  toBucket(t) {
    const e = Math.floor(t / this.bucketSizeMs);
    return e < 0 ? 0 : e >= this.buckets.length ? this.buckets.length - 1 : e;
  }
  percentileFromHistogram(t) {
    const e = Math.max(1, Math.ceil(this.size * t));
    let i = 0;
    for (let r = 0; r < this.buckets.length; r++)
      if (i += this.buckets[r], i >= e)
        return r * this.bucketSizeMs;
    return this.maxBucketMs;
  }
}
const W = {
  gravity: 0.05,
  friction: 0.98,
  attraction: 6,
  repulsion: 0,
  particleLife: 150,
  particleSize: 3,
  vortex: !1,
  bloom: !0,
  flocking: !0,
  collisions: !0,
  obstacleMode: !1
}, dt = {
  bloom: !0,
  trailStrength: 0.72,
  vignette: !1
}, Dt = {
  enabled: !0,
  targetFrameMs: 16.67,
  lowWatermarkMs: 13.5,
  highWatermarkMs: 20.5,
  minScale: 0.35,
  recoveryRate: 0.025,
  dropRate: 0.08,
  updateIntervalFrames: 24
};
function V(h, t, e) {
  return {
    preset: h,
    config: {
      ...W,
      ...t
    },
    postProcessing: {
      ...dt,
      ...e,
      bloom: e.bloom ?? t.bloom ?? dt.bloom
    }
  };
}
const Ut = {
  performance: V(
    "performance",
    {
      attraction: 3,
      repulsion: 0,
      gravity: 0.03,
      friction: 0.992,
      particleLife: 120,
      particleSize: 2.5,
      flocking: !1,
      collisions: !1,
      vortex: !1,
      bloom: !1
    },
    {
      bloom: !1,
      trailStrength: 0.64,
      vignette: !1
    }
  ),
  balanced: V(
    "balanced",
    {
      attraction: 6,
      repulsion: 0,
      gravity: 0.05,
      friction: 0.985,
      particleLife: 150,
      particleSize: 3,
      flocking: !0,
      collisions: !0,
      vortex: !1,
      bloom: !0
    },
    {
      bloom: !0,
      trailStrength: 0.72,
      vignette: !1
    }
  ),
  quality: V(
    "quality",
    {
      attraction: 10,
      repulsion: 2,
      gravity: 0.05,
      friction: 0.98,
      particleLife: 180,
      particleSize: 3.4,
      flocking: !0,
      collisions: !0,
      vortex: !0,
      bloom: !0
    },
    {
      bloom: !0,
      trailStrength: 0.8,
      vignette: !0
    }
  )
};
function ft(h) {
  return Ut[h];
}
function Jt() {
  return ["performance", "balanced", "quality"];
}
const xt = "grit-engine:telemetry:v2", ut = 24;
function Ot() {
  return typeof navigator > "u" || typeof screen > "u" ? "server" : [
    navigator.userAgent,
    navigator.hardwareConcurrency,
    screen.width,
    screen.height,
    window.devicePixelRatio
  ].join("|");
}
function mt() {
  if (typeof localStorage > "u")
    return { records: [] };
  try {
    const h = localStorage.getItem(xt);
    if (!h) return { records: [] };
    const t = JSON.parse(h);
    return Array.isArray(t.records) ? t : { records: [] };
  } catch {
    return { records: [] };
  }
}
function Nt(h) {
  if (!(typeof localStorage > "u"))
    try {
      localStorage.setItem(xt, JSON.stringify(h));
    } catch {
    }
}
class Ht {
  constructor(t) {
    s(this, "deviceId", Ot());
    s(this, "enabled");
    s(this, "sampleCount", 0);
    s(this, "avgP99Ms", 0);
    s(this, "avgFps", 0);
    this.enabled = t;
  }
  recommendPreset(t) {
    if (!this.enabled) return t;
    const i = mt().records.find((r) => r.deviceId === this.deviceId);
    return !i || i.samples < 30 ? t : i.avgP99Ms > 30 || i.avgFps < 35 ? "performance" : i.avgP99Ms < 16 && i.avgFps > 55 ? "quality" : "balanced";
  }
  capture(t, e) {
    this.enabled && (this.sampleCount++, this.avgP99Ms += (t - this.avgP99Ms) / this.sampleCount, this.avgFps += (e - this.avgFps) / this.sampleCount);
  }
  persist(t) {
    if (!this.enabled || this.sampleCount === 0) return;
    const i = mt().records.filter((r) => r.deviceId !== this.deviceId);
    i.unshift({
      deviceId: this.deviceId,
      preset: t,
      avgP99Ms: Number(this.avgP99Ms.toFixed(3)),
      avgFps: Number(this.avgFps.toFixed(2)),
      samples: this.sampleCount,
      updatedAt: Date.now()
    }), i.length > ut && (i.length = ut), Nt({ records: i });
  }
}
const Vt = new Uint8Array([
  0,
  97,
  115,
  109,
  1,
  0,
  0,
  0,
  1,
  8,
  1,
  96,
  3,
  124,
  124,
  124,
  1,
  124,
  3,
  2,
  1,
  0,
  7,
  13,
  1,
  9,
  105,
  110,
  116,
  101,
  103,
  114,
  97,
  116,
  101,
  0,
  0,
  10,
  12,
  1,
  10,
  0,
  32,
  0,
  32,
  1,
  32,
  2,
  162,
  160,
  11
]);
class Wt {
  constructor() {
    s(this, "ready", !1);
    s(this, "integrateFn", null);
  }
  async init() {
    if (!(typeof WebAssembly > "u"))
      try {
        const e = (await WebAssembly.instantiate(Vt)).instance.exports.integrate;
        typeof e == "function" && (this.integrateFn = e, this.ready = !0);
      } catch {
        this.integrateFn = null, this.ready = !1;
      }
  }
  mulAdd(t, e, i) {
    return this.integrateFn ? this.integrateFn(t, e, i) : t + e * i;
  }
  mulAddBatch(t, e, i, r) {
    const n = Math.min(t.length, e.length), a = r ?? new Float32Array(n);
    if (a.length < n)
      throw new Error("Buffer de saída insuficiente para mulAddBatch");
    if (!this.integrateFn) {
      for (let o = 0; o < n; o++)
        a[o] = t[o] + e[o] * i;
      return a;
    }
    const l = this.integrateFn;
    for (let o = 0; o < n; o++)
      a[o] = l(t[o], e[o], i);
    return a;
  }
}
class Gt {
  constructor(t) {
    s(this, "worker");
    s(this, "listener");
    const e = `
      let timer = null;
      self.onmessage = (event) => {
        if (event.data === 'start') {
          if (timer !== null) return;
          timer = setInterval(() => {
            self.postMessage(performance.now());
          }, 16);
          return;
        }

        if (event.data === 'stop') {
          if (timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        }
      };
    `, i = new Blob([e], { type: "application/javascript" }), r = URL.createObjectURL(i);
    this.worker = new Worker(r), URL.revokeObjectURL(r), this.listener = (n) => {
      t(n.data);
    }, this.worker.addEventListener("message", this.listener);
  }
  start() {
    this.worker.postMessage("start");
  }
  stop() {
    this.worker.postMessage("stop");
  }
  dispose() {
    this.worker.removeEventListener("message", this.listener), this.worker.terminate();
  }
}
const qt = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
function gt() {
  if (typeof WebAssembly > "u")
    return !1;
  try {
    return WebAssembly.validate(qt);
  } catch {
    return !1;
  }
}
function pt(h) {
  return h === "js" ? "js" : gt() ? "wasm" : "js";
}
const Yt = 4294967296;
class jt {
  constructor(t) {
    s(this, "state");
    s(this, "initialSeed");
    const e = t >>> 0;
    this.state = e || 1, this.initialSeed = e || 1;
  }
  next() {
    this.state += 1831565813;
    let t = this.state;
    return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / Yt;
  }
  setSeed(t) {
    const e = t >>> 0;
    this.initialSeed = e || 1, this.state = this.initialSeed;
  }
  getSeed() {
    return this.initialSeed;
  }
}
const $t = 200, Kt = [], vt = [
  "rgba(102, 138, 255, 1)",
  "rgba(156, 135, 188, 1)",
  "rgba(52, 211, 153, 1)"
];
class Xt {
  constructor(t) {
    s(this, "canvas");
    s(this, "overlayCanvas");
    s(this, "overlayCtx");
    s(this, "maxParticles");
    s(this, "spawnBatch");
    s(this, "maxDpr");
    s(this, "executionMode");
    s(this, "onStats");
    s(this, "workerTransportCompression");
    s(this, "runtimeBackendFallbackEnabled");
    s(this, "renderer");
    s(this, "renderBackend");
    s(this, "simulationBackend");
    s(this, "performancePreset");
    s(this, "hybridAdaptiveEnabled");
    s(this, "hybridCooldownTicks", 0);
    s(this, "adaptiveBudget");
    s(this, "activeParticleLimit");
    s(this, "grid");
    s(this, "requestId", null);
    s(this, "workerTicker", null);
    s(this, "running", !1);
    s(this, "paused", !1);
    s(this, "particles", []);
    s(this, "obstacles", []);
    s(this, "neighborsBuffer", []);
    s(this, "overlayDirty", !0);
    s(this, "pointer", { x: null, y: null });
    s(this, "config");
    s(this, "postProcessing");
    s(this, "frameCount", 0);
    s(this, "frameIndex", 0);
    s(this, "lastTime", performance.now());
    s(this, "lastFpsTime", performance.now());
    s(this, "lastUiUpdate", performance.now());
    s(this, "fps", 0);
    s(this, "random", null);
    s(this, "seededRandom", null);
    s(this, "telemetryTuner");
    s(this, "wasmKernel", null);
    s(this, "wasmMulAdd", null);
    s(this, "frameTimeWindow", new zt(360, 0.25, 120));
    s(this, "frameTimeSummary", {
      sampleCount: 0,
      avgMs: 0,
      p95Ms: 0,
      p99Ms: 0
    });
    s(this, "adaptiveScale", 1);
    s(this, "usedJSHeapSize");
    s(this, "jsHeapSizeLimit");
    s(this, "pluginsById", /* @__PURE__ */ new Map());
    s(this, "forcePlugins", []);
    s(this, "constraintPlugins", []);
    s(this, "framePlugins", []);
    s(this, "pluginFrameContext", {
      config: W,
      canvasWidth: 0,
      canvasHeight: 0,
      dt: 0,
      frame: 0,
      now: 0
    });
    s(this, "pluginParticleContext", {
      config: W,
      canvasWidth: 0,
      canvasHeight: 0,
      dt: 0,
      frame: 0,
      now: 0,
      pointerX: null,
      pointerY: null
    });
    s(this, "animate", (t) => {
      if (this.running) {
        if (this.paused)
          this.lastTime = t;
        else {
          const e = t - this.lastTime, i = Math.min(e / 16.666, 3);
          this.lastTime = t, this.frameIndex++, this.frameTimeWindow.push(e);
          const { x: r, y: n } = this.pointer;
          this.applyActiveParticleBudget(), this.grid.clear();
          const a = this.particles.length;
          for (let d = 0; d < a; d++)
            this.grid.add(this.particles[d]);
          const l = this.config.flocking || this.config.collisions;
          this.updatePluginContexts(i, t, r, n), this.runFrameStartPlugins();
          let o = 0;
          for (let d = 0; d < a; d++) {
            const u = this.particles[d];
            let w = Kt;
            l ? (this.grid.getNeighborsInto(u, this.neighborsBuffer), w = this.neighborsBuffer) : this.neighborsBuffer.length = 0, this.runForcePlugins(u), this.simulationBackend === "wasm" ? this.updateParticleWasmPath(u, w, r, n, i) : this.updateParticleJsPath(u, w, r, n, i), this.runConstraintPlugins(u), u.isDead() || (this.particles[o++] = u);
          }
          o !== a && (this.particles.length = o), this.runFrameEndPlugins(), this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.postProcessing), this.redrawOverlay(), this.frameCount++;
          const c = t - this.lastFpsTime;
          c >= 1e3 && (this.fps = Math.round(this.frameCount * 1e3 / c), this.frameCount = 0, this.lastFpsTime = t), t - this.lastUiUpdate >= $t && (this.lastUiUpdate = t, this.emitStats());
        }
        this.requestId = requestAnimationFrame(this.animate);
      }
    });
    var a, l, o;
    this.canvas = t.canvas, this.overlayCanvas = t.overlayCanvas, this.overlayCtx = ((a = this.overlayCanvas) == null ? void 0 : a.getContext("2d")) ?? null, this.maxParticles = t.maxParticles ?? 5e4, this.spawnBatch = t.spawnBatch ?? 100, this.maxDpr = t.maxDpr ?? 2, this.executionMode = t.executionMode ?? "main-thread", this.onStats = t.onStats, this.workerTransportCompression = t.workerTransportCompression ?? "none", this.runtimeBackendFallbackEnabled = t.runtimeBackendFallback ?? !0, this.hybridAdaptiveEnabled = t.hybridAdaptive ?? !0, this.telemetryTuner = new Ht(t.autoTune ?? !0);
    const e = t.performancePreset ?? "balanced";
    this.performancePreset = this.telemetryTuner.recommendPreset(e);
    const i = ft(this.performancePreset);
    this.config = {
      ...i.config,
      ...t.config
    }, this.postProcessing = {
      ...i.postProcessing,
      ...t.postProcessing,
      bloom: ((l = t.config) == null ? void 0 : l.bloom) ?? ((o = t.postProcessing) == null ? void 0 : o.bloom) ?? i.postProcessing.bloom
    }, this.adaptiveBudget = new It(this.maxParticles, {
      ...Dt,
      ...t.adaptiveBudget
    }), this.activeParticleLimit = this.maxParticles, this.grid = new Lt(t.gridCellSize ?? 40);
    const { renderer: r, backend: n } = N(this.canvas, this.maxParticles, t.renderBackend ?? "auto", {
      workerTransportCompression: this.workerTransportCompression
    });
    this.renderer = r, this.renderBackend = n, this.bindRendererErrorHandler(), this.simulationBackend = pt(t.simulationBackend ?? "auto"), this.tryInitializeWasmKernel(), this.configureRandom(t.seed), this.resize(), this.redrawOverlay();
  }
  start() {
    if (!this.running) {
      if (this.running = !0, this.lastTime = performance.now(), this.lastFpsTime = this.lastTime, this.lastUiUpdate = this.lastTime, this.frameTimeWindow.reset(), this.adaptiveBudget.reset(), this.activeParticleLimit = this.maxParticles, this.adaptiveScale = 1, this.executionMode === "worker-ticker" && typeof Worker < "u") {
        this.workerTicker = new Gt((t) => {
          this.animate(t);
        }), this.workerTicker.start();
        return;
      }
      this.requestId = requestAnimationFrame(this.animate);
    }
  }
  stop() {
    this.running = !1, this.workerTicker && (this.workerTicker.stop(), this.workerTicker.dispose(), this.workerTicker = null), this.requestId !== null && (cancelAnimationFrame(this.requestId), this.requestId = null);
  }
  dispose() {
    this.stop(), this.telemetryTuner.persist(this.performancePreset), this.clearPlugins(), this.renderer.dispose();
  }
  resize() {
    const t = Math.min(window.devicePixelRatio || 1, this.maxDpr), e = this.canvas.getBoundingClientRect(), i = Math.max(1, Math.floor(e.width)), r = Math.max(1, Math.floor(e.height)), n = Math.max(1, Math.floor(i * t)), a = Math.max(1, Math.floor(r * t));
    (this.canvas.width !== n || this.canvas.height !== a) && (this.canvas.width = n, this.canvas.height = a, this.canvas.style.width = `${i}px`, this.canvas.style.height = `${r}px`), this.overlayCanvas && (this.overlayCanvas.width !== n || this.overlayCanvas.height !== a) && (this.overlayCanvas.width = n, this.overlayCanvas.height = a, this.overlayCanvas.style.width = `${i}px`, this.overlayCanvas.style.height = `${r}px`, this.overlayDirty = !0), this.overlayCtx && (this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0), this.overlayCtx.scale(t, t));
  }
  updateSettings(t) {
    this.config = {
      ...this.config,
      ...t
    }, typeof t.bloom == "boolean" && (this.postProcessing = {
      ...this.postProcessing,
      bloom: t.bloom
    });
  }
  getSettings() {
    return { ...this.config };
  }
  updatePostProcessing(t) {
    this.postProcessing = {
      ...this.postProcessing,
      ...t
    };
  }
  getPostProcessing() {
    return { ...this.postProcessing };
  }
  getRenderBackend() {
    return this.renderBackend;
  }
  setRenderBackend(t) {
    const { renderer: e, backend: i } = N(this.canvas, this.maxParticles, t, {
      workerTransportCompression: this.workerTransportCompression
    });
    this.renderer.dispose(), this.renderer = e, this.renderBackend = i, this.bindRendererErrorHandler();
  }
  getSimulationBackend() {
    return this.simulationBackend;
  }
  setSimulationBackend(t) {
    this.simulationBackend = pt(t), this.tryInitializeWasmKernel();
  }
  getPerformancePreset() {
    return this.performancePreset;
  }
  setPerformancePreset(t) {
    const e = ft(t);
    this.performancePreset = t, this.config = { ...e.config }, this.postProcessing = { ...e.postProcessing };
  }
  setAdaptiveBudgetEnabled(t) {
    this.adaptiveBudget.setEnabled(t);
  }
  setPaused(t) {
    this.paused = t;
  }
  getPaused() {
    return this.paused;
  }
  setPointer(t, e) {
    this.pointer = { x: t, y: e };
  }
  clearPointer() {
    this.pointer = { x: null, y: null };
  }
  spawnAt(t, e) {
    if (this.particles.length >= this.activeParticleLimit) return;
    const i = this.activeParticleLimit - this.particles.length, r = i < this.spawnBatch ? i : this.spawnBatch;
    for (let n = 0; n < r; n++) {
      const a = this.getRandom(), l = vt[a() * vt.length | 0];
      this.particles.push(new Ft(t, e, l, this.config, a));
    }
  }
  setSeed(t) {
    this.configureRandom(t);
  }
  getSeed() {
    var t;
    return ((t = this.seededRandom) == null ? void 0 : t.getSeed()) ?? null;
  }
  addObstacle(t, e) {
    this.obstacles.push(new At(t, e)), this.overlayDirty = !0;
  }
  clear() {
    this.particles.length = 0, this.obstacles.length = 0, this.neighborsBuffer.length = 0, this.overlayDirty = !0, this.emitStats(!0);
  }
  getStats() {
    this.frameTimeWindow.snapshot(this.frameTimeSummary);
    const t = this.adaptiveBudget.snapshot();
    return this.sampleMemoryStats(), this.activeParticleLimit = t.activeParticleLimit, this.adaptiveScale = t.scale, {
      particleCount: this.particles.length,
      fps: this.fps,
      frameTimeAvgMs: this.frameTimeSummary.avgMs,
      frameTimeP95Ms: this.frameTimeSummary.p95Ms,
      frameTimeP99Ms: this.frameTimeSummary.p99Ms,
      activeParticleLimit: this.activeParticleLimit,
      adaptiveScale: this.adaptiveScale,
      effectivePreset: this.performancePreset,
      usedJSHeapSize: this.usedJSHeapSize,
      jsHeapSizeLimit: this.jsHeapSizeLimit
    };
  }
  registerPlugin(t) {
    var e;
    if (!t.id)
      throw new Error("Plugin precisa definir id único");
    if (this.pluginsById.has(t.id))
      throw new Error(`Plugin com id "${t.id}" já registrado`);
    this.pluginsById.set(t.id, t), t.applyForce && this.forcePlugins.push(t), t.applyConstraint && this.constraintPlugins.push(t), (t.onFrameStart || t.onFrameEnd) && this.framePlugins.push(t), (e = t.onRegister) == null || e.call(t);
  }
  unregisterPlugin(t) {
    var i;
    const e = this.pluginsById.get(t);
    return e ? (this.pluginsById.delete(t), this.forcePlugins = this.forcePlugins.filter((r) => r.id !== t), this.constraintPlugins = this.constraintPlugins.filter((r) => r.id !== t), this.framePlugins = this.framePlugins.filter((r) => r.id !== t), (i = e.onUnregister) == null || i.call(e), !0) : !1;
  }
  clearPlugins() {
    var t;
    for (const e of this.pluginsById.values())
      (t = e.onUnregister) == null || t.call(e);
    this.pluginsById.clear(), this.forcePlugins.length = 0, this.constraintPlugins.length = 0, this.framePlugins.length = 0;
  }
  getPlugins() {
    return Array.from(this.pluginsById.values());
  }
  updateParticleJsPath(t, e, i, r, n) {
    t.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      i,
      r,
      e,
      this.obstacles,
      n
    );
  }
  updateParticleWasmPath(t, e, i, r, n) {
    t.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      i,
      r,
      e,
      this.obstacles,
      n,
      this.wasmMulAdd ?? void 0
    );
  }
  updatePluginContexts(t, e, i, r) {
    this.pluginFrameContext.config = this.config, this.pluginFrameContext.canvasWidth = this.canvas.width, this.pluginFrameContext.canvasHeight = this.canvas.height, this.pluginFrameContext.dt = t, this.pluginFrameContext.frame = this.frameIndex, this.pluginFrameContext.now = e, this.pluginParticleContext.config = this.config, this.pluginParticleContext.canvasWidth = this.canvas.width, this.pluginParticleContext.canvasHeight = this.canvas.height, this.pluginParticleContext.dt = t, this.pluginParticleContext.frame = this.frameIndex, this.pluginParticleContext.now = e, this.pluginParticleContext.pointerX = i, this.pluginParticleContext.pointerY = r;
  }
  runFrameStartPlugins() {
    if (this.framePlugins.length !== 0)
      for (let t = 0; t < this.framePlugins.length; t++) {
        const e = this.framePlugins[t];
        e.enabled === !1 || !e.onFrameStart || e.onFrameStart(this.pluginFrameContext);
      }
  }
  runFrameEndPlugins() {
    if (this.framePlugins.length !== 0)
      for (let t = 0; t < this.framePlugins.length; t++) {
        const e = this.framePlugins[t];
        e.enabled === !1 || !e.onFrameEnd || e.onFrameEnd(this.pluginFrameContext);
      }
  }
  runForcePlugins(t) {
    if (this.forcePlugins.length !== 0)
      for (let e = 0; e < this.forcePlugins.length; e++) {
        const i = this.forcePlugins[e];
        i.enabled === !1 || !i.applyForce || i.applyForce(t, this.pluginParticleContext);
      }
  }
  runConstraintPlugins(t) {
    if (this.constraintPlugins.length !== 0)
      for (let e = 0; e < this.constraintPlugins.length; e++) {
        const i = this.constraintPlugins[e];
        i.enabled === !1 || !i.applyConstraint || i.applyConstraint(t, this.pluginParticleContext);
      }
  }
  redrawOverlay() {
    if (!this.overlayCanvas || !this.overlayCtx || !this.overlayDirty) return;
    const t = this.overlayCanvas.getBoundingClientRect();
    this.overlayCtx.clearRect(0, 0, t.width, t.height);
    for (let e = 0; e < this.obstacles.length; e++)
      this.obstacles[e].draw(this.overlayCtx);
    this.overlayDirty = !1;
  }
  emitStats(t = !1) {
    var i;
    this.frameTimeWindow.snapshot(this.frameTimeSummary), this.adaptiveBudget.update(this.frameTimeSummary.p95Ms, this.frameTimeSummary.p99Ms), this.telemetryTuner.capture(this.frameTimeSummary.p99Ms, this.fps), this.applyHybridRuntimeTuning();
    const e = this.adaptiveBudget.snapshot();
    this.sampleMemoryStats(), this.activeParticleLimit = e.activeParticleLimit, this.adaptiveScale = e.scale, !(!this.onStats && !t) && ((i = this.onStats) == null || i.call(this, {
      particleCount: this.particles.length,
      fps: this.fps,
      frameTimeAvgMs: this.frameTimeSummary.avgMs,
      frameTimeP95Ms: this.frameTimeSummary.p95Ms,
      frameTimeP99Ms: this.frameTimeSummary.p99Ms,
      activeParticleLimit: this.activeParticleLimit,
      adaptiveScale: this.adaptiveScale,
      effectivePreset: this.performancePreset,
      usedJSHeapSize: this.usedJSHeapSize,
      jsHeapSizeLimit: this.jsHeapSizeLimit
    }));
  }
  applyActiveParticleBudget() {
    this.particles.length <= this.activeParticleLimit || (this.particles.length = this.activeParticleLimit);
  }
  applyHybridRuntimeTuning() {
    if (!this.hybridAdaptiveEnabled) return;
    if (this.hybridCooldownTicks > 0) {
      this.hybridCooldownTicks--;
      return;
    }
    const t = this.frameTimeSummary.p99Ms;
    if (t > 30 && this.performancePreset !== "performance") {
      this.setPerformancePreset("performance"), this.setSimulationBackend("wasm"), this.hybridCooldownTicks = 12;
      return;
    }
    if (t < 14 && this.performancePreset === "performance") {
      this.setPerformancePreset("balanced"), this.hybridCooldownTicks = 12;
      return;
    }
    t < 10 && this.performancePreset === "balanced" && (this.setPerformancePreset("quality"), this.hybridCooldownTicks = 18);
  }
  tryInitializeWasmKernel() {
    this.simulationBackend === "wasm" && (this.wasmKernel || (this.wasmKernel = new Wt(), this.wasmKernel.init().then(() => {
      var t;
      (t = this.wasmKernel) != null && t.ready && (this.wasmMulAdd = (e, i, r) => this.wasmKernel.mulAdd(e, i, r));
    }).catch(() => {
      this.wasmMulAdd = null;
    })));
  }
  bindRendererErrorHandler() {
    var t, e;
    (e = (t = this.renderer).setErrorHandler) == null || e.call(t, (i) => {
      this.handleRendererRuntimeError(i);
    });
  }
  handleRendererRuntimeError(t) {
    if (!this.runtimeBackendFallbackEnabled) return;
    const e = this.resolveFallbackBackend(this.renderBackend);
    if (!e) return;
    let i = null;
    try {
      i = N(this.canvas, this.maxParticles, e, {
        workerTransportCompression: this.workerTransportCompression
      });
    } catch {
      return;
    }
    i && (this.renderer.dispose(), this.renderer = i.renderer, this.renderBackend = i.backend, this.bindRendererErrorHandler());
  }
  resolveFallbackBackend(t) {
    return t === "offscreen-worker" ? "webgl2" : t === "webgl2" ? "canvas2d" : null;
  }
  sampleMemoryStats() {
    const e = performance.memory;
    e && (typeof e.usedJSHeapSize == "number" && (this.usedJSHeapSize = e.usedJSHeapSize), typeof e.jsHeapSizeLimit == "number" && (this.jsHeapSizeLimit = e.jsHeapSizeLimit));
  }
  configureRandom(t) {
    if (typeof t != "number") {
      this.seededRandom = null, this.random = null;
      return;
    }
    this.seededRandom = new jt(t), this.random = () => this.seededRandom.next();
  }
  getRandom() {
    return this.random ?? Math.random;
  }
}
export {
  O as Canvas2DRenderer,
  Dt as DEFAULT_ADAPTIVE_BUDGET,
  dt as DEFAULT_POST_PROCESSING,
  W as DEFAULT_SIM_CONFIG,
  Xt as GritEngine,
  At as Obstacle,
  Bt as OffscreenWorkerRenderer,
  Ft as Particle,
  Lt as SpatialGrid,
  _t as WebGLRenderer,
  Jt as listPerformancePresets,
  ft as resolvePerformancePreset
};
