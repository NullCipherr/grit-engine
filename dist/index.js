var Pt = Object.defineProperty;
var St = (h, t, e) => t in h ? Pt(h, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : h[t] = e;
var s = (h, t, e) => St(h, typeof t != "symbol" ? t + "" : t, e);
class wt {
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
let At = 0;
const Q = 2e-4, J = 0.0141421356, Ct = 16e4, Z = 0.8, _ = -0.7, tt = 8, Mt = 33, et = 0.02, it = 1e-3, st = 12;
class kt {
  constructor(t, e, i, r, a = Math.random) {
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
    this.id = ++At, this.x = t, this.y = e, this.vx = (a() - 0.5) * 10, this.vy = (a() - 0.5) * 10, this.ax = 0, this.ay = 0, this.maxLife = r.particleLife + a() * 50, this.life = this.maxLife, this.baseSize = r.particleSize * (0.4 + a() * 0.8), this.size = this.baseSize, this.hue = 200 + a() * 60, this.mass = this.size, this.flockingTimer = this.id % 3 * 11, this.flockAvgVx = 0, this.flockAvgVy = 0, this.flockAvgX = this.x, this.flockAvgY = this.y, this.flockNeighborCount = 0, this.colorString = i;
  }
  update(t, e, i, r, a, n, o, l, f) {
    const c = f ?? ((m, g, d) => m + g * d), {
      attraction: u,
      repulsion: w,
      vortex: k,
      flocking: F,
      collisions: R,
      gravity: y,
      friction: E
    } = t;
    if (this.size = this.baseSize, this.mass = this.size > 0.1 ? this.size : 0.1, r !== null && a !== null) {
      const m = r - this.x, g = a - this.y, d = m * m + g * g;
      if (d < Ct) {
        const p = (u - w) / (d + 500);
        this.ax += m * p, this.ay += g * p, k && (this.ax += g * 0.03, this.ay -= m * 0.03);
      }
    }
    const C = n.length;
    if (F && C > 0) {
      if (this.flockingTimer += l * 16.6667, this.flockingTimer >= Mt) {
        this.flockingTimer = 0;
        const m = C < tt ? C : tt;
        let g = 0, d = 0, p = 0, x = 0;
        for (let P = 0; P < m; P++) {
          const b = n[P];
          g += b.vx, d += b.vy, p += b.x, x += b.y;
        }
        const v = 1 / m;
        this.flockAvgVx = g * v, this.flockAvgVy = d * v, this.flockAvgX = p * v, this.flockAvgY = x * v, this.flockNeighborCount = m;
      }
      this.flockNeighborCount > 0 && (this.ax += (this.flockAvgVx - this.vx) * et, this.ay += (this.flockAvgVy - this.vy) * et, this.ax += (this.flockAvgX - this.x) * it, this.ay += (this.flockAvgY - this.y) * it);
    }
    if (R && C > 0) {
      const m = C < st ? C : st;
      for (let g = 0; g < m; g++) {
        const d = n[g];
        if (this.id >= d.id) continue;
        let p = d.x - this.x, x = d.y - this.y, v = p * p + x * x;
        const P = this.size + d.size;
        if (v < P * P) {
          let b = J;
          v <= 0 ? (p = 0.01, x = 0.01, v = Q) : b = Math.sqrt(v);
          const A = p / b, M = x / b, B = P - b, G = this.mass + d.mass, H = G > 0 ? 1 / G : 1, q = this.mass * H, Y = d.mass * H;
          this.x -= A * B * Y, this.y -= M * B * Y, d.x += A * B * q, d.y += M * B * q;
          const xt = this.vx - d.vx, bt = this.vy - d.vy, $ = xt * A + bt * M;
          if ($ < 0) {
            const K = -1.8 * $ / (1 / this.mass + 1 / d.mass), j = K * A, X = K * M;
            this.vx += j / this.mass, this.vy += X / this.mass, d.vx -= j / d.mass, d.vy -= X / d.mass;
          }
        }
      }
    }
    for (let m = 0; m < o.length; m++) {
      const g = o[m];
      let d = this.x - g.x, p = this.y - g.y, x = d * d + p * p;
      const v = this.size + g.radius;
      if (x < v * v) {
        let P = J;
        x <= 0 ? (d = 0.01, p = 0.01, x = Q) : P = Math.sqrt(x);
        const b = d / P, A = p / P;
        this.x = g.x + b * v, this.y = g.y + A * v;
        const M = this.vx * b + this.vy * A;
        this.vx = (this.vx - 2 * M * b) * Z, this.vy = (this.vy - 2 * M * A) * Z;
      }
    }
    this.ay += y, this.vx = c(this.vx, this.ax, l), this.vy = c(this.vy, this.ay, l);
    const I = Math.pow(E, l);
    this.vx *= I, this.vy *= I, this.x = c(this.x, this.vx, l), this.y = c(this.y, this.vy, l), this.ax = 0, this.ay = 0, this.x < this.size ? (this.x = this.size, this.vx *= _) : this.x > e - this.size && (this.x = e - this.size, this.vx *= _), this.y < this.size ? (this.y = this.size, this.vy *= _) : this.y > i - this.size && (this.y = i - this.size, this.vy *= _), this.life -= l;
  }
  draw(t, e, i) {
    const r = this.life > 0 ? this.life / this.maxLife : 0;
    if (t.globalAlpha = r, i) {
      const o = this.size * (e.bloom ? 3 : 1.5);
      t.drawImage(
        i,
        this.x - o,
        this.y - o,
        o * 2,
        o * 2
      );
      return;
    }
    const a = this.vx * this.vx + this.vy * this.vy, n = this.hue + Math.sqrt(a) * 5 | 0;
    this.colorString = `hsl(${n}, 85%, 65%)`, t.fillStyle = this.colorString, t.beginPath(), t.arc(this.x, this.y, this.size, 0, Math.PI * 2), t.fill();
  }
  isDead() {
    return this.life <= 0;
  }
}
const rt = "#11131c", S = 48, z = 48, D = 16.67;
class O {
  constructor(t, e = 5e4) {
    s(this, "canvas");
    s(this, "ctx");
    s(this, "maxParticles");
    s(this, "firstFrame", !0);
    s(this, "drawStride", 1);
    s(this, "smoothedRenderMs", D);
    s(this, "solidColorPalette");
    s(this, "glowSpritePalette");
    this.canvas = t;
    const i = t.getContext("2d", { alpha: !0, desynchronized: !0 });
    if (!i)
      throw new Error("Canvas2D not supported");
    this.ctx = i, this.maxParticles = e, this.solidColorPalette = this.buildSolidPalette(), this.glowSpritePalette = this.buildGlowPalette();
  }
  render(t, e, i, r) {
    const a = performance.now(), n = this.ctx;
    this.firstFrame && (n.globalAlpha = 1, n.fillStyle = rt, n.fillRect(0, 0, e, i), this.firstFrame = !1), this.updateQualityPolicy(t.length, r.bloom);
    const o = Math.max(0, Math.min(r.trailStrength, 1)), l = Math.min(Math.max(1 - o, 0.04), 0.92);
    n.globalCompositeOperation = "source-over", n.globalAlpha = l, n.fillStyle = rt, n.fillRect(0, 0, e, i);
    const f = Math.min(this.maxParticles, t.length);
    if (n.globalCompositeOperation = r.bloom ? "lighter" : "source-over", this.drawStride > 1 ? this.renderFastPath(t, f, r.bloom) : this.renderQualityPath(t, f, r.bloom), r.vignette && this.drawStride < 4) {
      const u = n.createRadialGradient(
        e * 0.5,
        i * 0.5,
        Math.min(e, i) * 0.18,
        e * 0.5,
        i * 0.5,
        Math.max(e, i) * 0.75
      );
      u.addColorStop(0, "rgba(0, 0, 0, 0)"), u.addColorStop(1, "rgba(0, 0, 0, 0.4)"), n.globalAlpha = 1, n.globalCompositeOperation = "source-over", n.fillStyle = u, n.fillRect(0, 0, e, i);
    }
    const c = performance.now() - a;
    this.smoothedRenderMs += (c - this.smoothedRenderMs) * 0.08;
  }
  resizeMaxParticles(t) {
    this.maxParticles = t;
  }
  dispose() {
    this.ctx.globalCompositeOperation = "source-over", this.ctx.globalAlpha = 1;
  }
  updateQualityPolicy(t, e) {
    const i = t / Math.max(this.maxParticles, 1), r = e ? 1.45 : 1, a = this.smoothedRenderMs * r * (1 + i * 0.35);
    a > D * 1.45 ? this.drawStride = Math.min(this.drawStride + 1, 4) : a < D * 0.86 && (this.drawStride = Math.max(this.drawStride - 1, 1));
  }
  renderFastPath(t, e, i) {
    const r = this.ctx;
    for (let a = 0; a < e; a += this.drawStride) {
      const n = t[a], o = n.life > 0 ? n.life / n.maxLife : 0;
      if (o <= 0.01) continue;
      r.globalAlpha = o;
      const l = this.paletteIndex(n.hue + Math.min((n.vx * n.vx + n.vy * n.vy) * 1.25, 60));
      if (i) {
        const f = this.glowSpritePalette[l];
        if (f) {
          const c = n.size * 2.4, u = c * 2;
          r.drawImage(f, n.x - c, n.y - c, u, u);
        } else
          r.fillStyle = this.solidColorPalette[l], r.fillRect(n.x - n.size, n.y - n.size, n.size * 2, n.size * 2);
      } else
        r.fillStyle = this.solidColorPalette[l], r.fillRect(n.x - n.size, n.y - n.size, n.size * 2, n.size * 2);
    }
  }
  renderQualityPath(t, e, i) {
    const r = this.ctx;
    for (let a = 0; a < e; a++) {
      const n = t[a], o = n.life > 0 ? n.life / n.maxLife : 0;
      if (o <= 0.01) continue;
      r.globalAlpha = o;
      const l = this.paletteIndex(n.hue + Math.min((n.vx * n.vx + n.vy * n.vy) * 1.25, 60));
      if (i) {
        const f = this.glowSpritePalette[l];
        if (f) {
          const c = n.size * 2.6, u = c * 2;
          r.drawImage(f, n.x - c, n.y - c, u, u);
          continue;
        }
      }
      r.fillStyle = this.solidColorPalette[l], r.beginPath(), r.arc(n.x, n.y, n.size, 0, Math.PI * 2), r.fill();
    }
  }
  paletteIndex(t) {
    const e = (t % 360 + 360) % 360;
    return Math.floor(e / 360 * S) % S;
  }
  buildSolidPalette() {
    const t = new Array(S);
    for (let e = 0; e < S; e++) {
      const i = Math.floor(e / S * 360);
      t[e] = `hsl(${i}, 85%, 65%)`;
    }
    return t;
  }
  buildGlowPalette() {
    const t = new Array(S);
    if (typeof document > "u") {
      for (let e = 0; e < S; e++) t[e] = null;
      return t;
    }
    for (let e = 0; e < S; e++) {
      const i = Math.floor(e / S * 360), r = document.createElement("canvas");
      r.width = z, r.height = z;
      const a = r.getContext("2d");
      if (!a) {
        t[e] = null;
        continue;
      }
      const n = z * 0.5, o = a.createRadialGradient(n, n, 0, n, n, n);
      o.addColorStop(0, `hsla(${i}, 85%, 70%, 1)`), o.addColorStop(1, `hsla(${i}, 85%, 70%, 0)`), a.fillStyle = o, a.beginPath(), a.arc(n, n, n, 0, Math.PI * 2), a.fill(), t[e] = r;
    }
    return t;
  }
}
const at = "#11131c", V = 5, Ft = `
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
      ctx.fillStyle = '${at}';
      ctx.fillRect(0, 0, width, height);
      firstFrame = false;
    }

    const fadeAlpha = Math.min(Math.max(1 - trailStrength, 0.04), 0.92);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = '${at}';
    ctx.fillRect(0, 0, width, height);

    const packed = data.packed;
    const count = Math.min(data.count, maxParticles);
    ctx.globalCompositeOperation = bloom ? 'lighter' : 'source-over';

    for (let i = 0; i < count; i++) {
      const offset = i * ${V};
      const x = packed[offset];
      const y = packed[offset + 1];
      const size = packed[offset + 2];
      const hue = packed[offset + 3];
      const alpha = packed[offset + 4];

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
class Rt {
  constructor(t, e) {
    s(this, "worker");
    s(this, "workerUrl");
    s(this, "maxParticles");
    s(this, "packedData");
    s(this, "inFlight", !1);
    s(this, "ready", !1);
    s(this, "failed", !1);
    s(this, "lastWidth", -1);
    s(this, "lastHeight", -1);
    if (typeof Worker > "u" || typeof t.transferControlToOffscreen != "function")
      throw new Error("Offscreen worker rendering not supported");
    const i = new Blob([Ft], { type: "text/javascript" });
    this.workerUrl = URL.createObjectURL(i), this.worker = new Worker(this.workerUrl);
    const r = t.transferControlToOffscreen();
    this.maxParticles = e, this.packedData = new Float32Array(e * V), this.worker.onmessage = (a) => {
      var o;
      const n = (o = a.data) == null ? void 0 : o.type;
      if (n === "ready") {
        this.ready = !0;
        return;
      }
      n === "error" && (this.failed = !0), this.inFlight = !1;
    }, this.worker.onerror = () => {
      this.failed = !0, this.inFlight = !1;
    }, this.worker.postMessage(
      {
        type: "init",
        canvas: r,
        maxParticles: e
      },
      [r]
    );
  }
  render(t, e, i, r) {
    if (this.failed || !this.ready || this.inFlight) return;
    (e !== this.lastWidth || i !== this.lastHeight) && (this.worker.postMessage({ type: "resize", width: e, height: i }), this.lastWidth = e, this.lastHeight = i);
    const a = Math.min(t.length, this.maxParticles);
    let n = 0;
    for (let o = 0; o < a; o++) {
      const l = t[o], f = l.vx * l.vx + l.vy * l.vy, c = ((l.hue + Math.min(f * 1.25, 60)) % 360 + 360) % 360, u = l.life > 0 ? l.life / l.maxLife : 0;
      this.packedData[n++] = l.x, this.packedData[n++] = l.y, this.packedData[n++] = l.size, this.packedData[n++] = c, this.packedData[n++] = u;
    }
    this.inFlight = !0, this.worker.postMessage({
      type: "render",
      width: e,
      height: i,
      count: a,
      bloom: r.bloom,
      trailStrength: r.trailStrength,
      vignette: r.vignette,
      packed: this.packedData
    });
  }
  resizeMaxParticles(t) {
    t !== this.maxParticles && (this.maxParticles = t, this.packedData = new Float32Array(t * V), this.worker.postMessage({ type: "set-max-particles", maxParticles: t }));
  }
  dispose() {
    this.worker.terminate(), URL.revokeObjectURL(this.workerUrl);
  }
}
const nt = 17 / 255, ot = 19 / 255, lt = 28 / 255, T = 7, L = T * 4, Bt = 2;
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
    s(this, "lastWidth", -1);
    s(this, "lastHeight", -1);
    s(this, "lastBloom", -1);
    s(this, "lastVignette", -1);
    s(this, "lastFadeAlpha", -1);
    // 360-step LUT for HSL(h, 0.85, 0.65) -> RGB
    s(this, "huePalette", new Float32Array(360 * 3));
    s(this, "handleContextLost", (t) => {
      t.preventDefault(), this.isContextLost = !0;
    });
    s(this, "handleContextRestored", () => {
      this.isContextLost = !1, this.initResources();
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
    this.gl = i, this.maxParticles = e, this.instanceData = new Float32Array(e * T), this.buildHuePalette(), this.initResources(), this.attachContextEvents();
  }
  attachContextEvents() {
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  detachContextEvents() {
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  buildHuePalette() {
    for (let t = 0; t < 360; t++) {
      const [e, i, r] = this.hslToRgb(t / 360, 0.85, 0.65), a = t * 3;
      this.huePalette[a] = e, this.huePalette[a + 1] = i, this.huePalette[a + 2] = r;
    }
  }
  hslToRgb(t, e, i) {
    if (e === 0) return [i, i, i];
    const r = (o, l, f) => {
      let c = f;
      return c < 0 && (c += 1), c > 1 && (c -= 1), c < 1 / 6 ? o + (l - o) * 6 * c : c < 1 / 2 ? l : c < 2 / 3 ? o + (l - o) * (2 / 3 - c) * 6 : o;
    }, a = i < 0.5 ? i * (1 + e) : i + e - i * e, n = 2 * i - a;
    return [
      r(n, a, t + 1 / 3),
      r(n, a, t),
      r(n, a, t - 1 / 3)
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
    `, a = `#version 300 es
      precision mediump float;
      uniform float u_fadeAlpha;
      out vec4 outColor;
      void main() {
        outColor = vec4(${nt.toFixed(8)}, ${ot.toFixed(8)}, ${lt.toFixed(8)}, u_fadeAlpha);
      }
    `;
    this.program = this.createProgram(e, i), this.fadeProgram = this.createProgram(r, a), this.uResolutionLoc = t.getUniformLocation(this.program, "u_resolution"), this.uBloomLoc = t.getUniformLocation(this.program, "u_bloom"), this.uVignetteLoc = t.getUniformLocation(this.program, "u_vignette"), this.uFadeAlphaLoc = t.getUniformLocation(this.fadeProgram, "u_fadeAlpha");
    const n = new Float32Array([
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
    t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.bufferData(t.ARRAY_BUFFER, n, t.STATIC_DRAW), this.vaos = [], this.instanceBuffers = [];
    for (let o = 0; o < Bt; o++) {
      const l = t.createVertexArray();
      if (!l) throw new Error("Failed to create particle VAO");
      const f = t.createBuffer();
      if (!f)
        throw t.deleteVertexArray(l), new Error("Failed to create instance buffer");
      t.bindVertexArray(l), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindBuffer(t.ARRAY_BUFFER, f), t.bufferData(t.ARRAY_BUFFER, this.instanceData.byteLength, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, L, 0), t.vertexAttribDivisor(1, 1), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, L, 8), t.vertexAttribDivisor(2, 1), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 3, t.FLOAT, !1, L, 12), t.vertexAttribDivisor(3, 1), t.enableVertexAttribArray(4), t.vertexAttribPointer(4, 1, t.FLOAT, !1, L, 24), t.vertexAttribDivisor(4, 1), this.vaos.push(l), this.instanceBuffers.push(f);
    }
    if (this.fadeVao = t.createVertexArray(), !this.fadeVao) throw new Error("Failed to create fade VAO");
    t.bindVertexArray(this.fadeVao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.enable(t.BLEND), this.firstFrame = !0, this.lastWidth = -1, this.lastHeight = -1, this.lastBloom = -1, this.lastVignette = -1, this.lastFadeAlpha = -1, this.activeInstanceSlot = 0;
  }
  createProgram(t, e) {
    const i = this.gl, r = i.createShader(i.VERTEX_SHADER);
    if (!r) throw new Error("Failed to create vertex shader");
    if (i.shaderSource(r, t), i.compileShader(r), !i.getShaderParameter(r, i.COMPILE_STATUS)) {
      const o = i.getShaderInfoLog(r) || "Unknown vertex shader error";
      throw i.deleteShader(r), new Error(`Vertex shader compile error: ${o}`);
    }
    const a = i.createShader(i.FRAGMENT_SHADER);
    if (!a)
      throw i.deleteShader(r), new Error("Failed to create fragment shader");
    if (i.shaderSource(a, e), i.compileShader(a), !i.getShaderParameter(a, i.COMPILE_STATUS)) {
      const o = i.getShaderInfoLog(a) || "Unknown fragment shader error";
      throw i.deleteShader(r), i.deleteShader(a), new Error(`Fragment shader compile error: ${o}`);
    }
    const n = i.createProgram();
    if (!n)
      throw i.deleteShader(r), i.deleteShader(a), new Error("Failed to create program");
    if (i.attachShader(n, r), i.attachShader(n, a), i.linkProgram(n), i.deleteShader(r), i.deleteShader(a), !i.getProgramParameter(n, i.LINK_STATUS)) {
      const o = i.getProgramInfoLog(n) || "Unknown program link error";
      throw i.deleteProgram(n), new Error(`Program link error: ${o}`);
    }
    return n;
  }
  render(t, e, i, r) {
    if (!this.program || !this.fadeProgram || !this.fadeVao || this.vaos.length === 0 || this.instanceBuffers.length === 0 || this.isContextLost)
      return;
    const a = this.gl;
    a.viewport(0, 0, e, i), this.firstFrame && (a.clearColor(nt, ot, lt, 1), a.clear(a.COLOR_BUFFER_BIT), this.firstFrame = !1);
    const n = Math.max(0, Math.min(r.trailStrength, 1)), o = Math.min(Math.max(1 - n, 0.04), 0.92);
    a.useProgram(this.fadeProgram), a.bindVertexArray(this.fadeVao), o !== this.lastFadeAlpha && (a.uniform1f(this.uFadeAlphaLoc, o), this.lastFadeAlpha = o), a.blendFunc(a.SRC_ALPHA, a.ONE_MINUS_SRC_ALPHA), a.drawArrays(a.TRIANGLE_STRIP, 0, 4);
    const l = Math.min(t.length, this.maxParticles);
    let f = 0;
    for (let R = 0; R < l; R++) {
      const y = t[R], E = y.vx * y.vx + y.vy * y.vy, m = ((y.hue + Math.min(E * 1.25, 60) | 0) % 360 + 360) % 360 * 3;
      this.instanceData[f++] = y.x, this.instanceData[f++] = y.y, this.instanceData[f++] = y.size, this.instanceData[f++] = this.huePalette[m], this.instanceData[f++] = this.huePalette[m + 1], this.instanceData[f++] = this.huePalette[m + 2], this.instanceData[f++] = y.life > 0 ? y.life / y.maxLife : 0;
    }
    const c = this.activeInstanceSlot, u = this.vaos[c], w = this.instanceBuffers[c];
    if (!u || !w)
      return;
    a.bindBuffer(a.ARRAY_BUFFER, w), a.bufferSubData(a.ARRAY_BUFFER, 0, this.instanceData, 0, l * T), a.useProgram(this.program), a.bindVertexArray(u), (e !== this.lastWidth || i !== this.lastHeight) && (a.uniform2f(this.uResolutionLoc, e, i), this.lastWidth = e, this.lastHeight = i);
    const k = r.bloom ? 1 : 0;
    k !== this.lastBloom && (a.uniform1f(this.uBloomLoc, k), this.lastBloom = k);
    const F = r.vignette ? 1 : 0;
    F !== this.lastVignette && (a.uniform1f(this.uVignetteLoc, F), this.lastVignette = F), r.bloom ? a.blendFunc(a.ONE, a.ONE) : a.blendFunc(a.ONE, a.ONE_MINUS_SRC_ALPHA), a.drawArraysInstanced(a.TRIANGLE_STRIP, 0, 4, l), a.bindVertexArray(null), this.activeInstanceSlot++, this.activeInstanceSlot >= this.instanceBuffers.length && (this.activeInstanceSlot = 0);
  }
  resizeMaxParticles(t) {
    if (t !== this.maxParticles && (this.maxParticles = t, this.instanceData = new Float32Array(t * T), this.instanceBuffers.length > 0)) {
      const e = this.gl;
      for (let i = 0; i < this.instanceBuffers.length; i++) {
        const r = this.instanceBuffers[i];
        r && (e.bindBuffer(e.ARRAY_BUFFER, r), e.bufferData(e.ARRAY_BUFFER, this.instanceData.byteLength, e.DYNAMIC_DRAW));
      }
      e.bindBuffer(e.ARRAY_BUFFER, null);
    }
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
function Lt(h, t) {
  return t === "offscreen-worker" ? "offscreen-worker" : t === "canvas2d" ? "canvas2d" : t === "webgl2" || h.getContext("webgl2", {
    antialias: !1,
    preserveDrawingBuffer: !1,
    alpha: !0,
    premultipliedAlpha: !0,
    powerPreference: "high-performance"
  }) ? "webgl2" : "canvas2d";
}
function ht(h, t, e) {
  const i = Lt(h, e);
  if (i === "offscreen-worker")
    try {
      return {
        renderer: new Rt(h, t),
        backend: i
      };
    } catch {
      return {
        renderer: new O(h, t),
        backend: "canvas2d"
      };
    }
  if (i === "webgl2")
    try {
      return {
        renderer: new _t(h, t),
        backend: i
      };
    } catch {
      return {
        renderer: new O(h, t),
        backend: "canvas2d"
      };
    }
  return {
    renderer: new O(h, t),
    backend: i
  };
}
const ct = [];
class Tt {
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
    let a = this.grid.get(r);
    a || (a = [], this.grid.set(r, a)), a.push(t);
  }
  getNeighbors(t) {
    const e = this.toGridCoord(t.x), i = this.toGridCoord(t.y), r = [];
    for (let a = e - 1; a <= e + 1; a++)
      for (let n = i - 1; n <= i + 1; n++) {
        const o = this.grid.get(this.hash(a, n));
        if (o)
          for (let l = 0; l < o.length; l++) {
            const f = o[l];
            f !== t && r.push(f);
          }
      }
    return r.length > 0 ? r : ct;
  }
  getNeighborsInto(t, e) {
    e.length = 0;
    const i = this.toGridCoord(t.x), r = this.toGridCoord(t.y);
    for (let a = i - 1; a <= i + 1; a++)
      for (let n = r - 1; n <= r + 1; n++) {
        const o = this.grid.get(this.hash(a, n));
        if (o)
          for (let l = 0; l < o.length; l++) {
            const f = o[l];
            f !== t && e.push(f);
          }
      }
  }
  getCellParticlesAt(t, e) {
    const i = this.toGridCoord(t), r = this.toGridCoord(e);
    return this.grid.get(this.hash(i, r)) ?? ct;
  }
}
class Et {
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
const U = 0;
class It {
  constructor(t = 300, e = 0.25, i = 120) {
    s(this, "samples");
    s(this, "buckets");
    s(this, "bucketSizeMs");
    s(this, "maxBucketMs");
    s(this, "writeIndex", 0);
    s(this, "size", 0);
    s(this, "sumMs", 0);
    const r = Math.max(1, t | 0), a = Math.max(0.05, e), n = Math.max(16, i);
    this.samples = new Float32Array(r), this.bucketSizeMs = a, this.maxBucketMs = n, this.buckets = new Uint32Array(Math.floor(n / a) + 1);
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
    return !Number.isFinite(t) || t < U ? U : t > this.maxBucketMs ? this.maxBucketMs : t;
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
}, ft = {
  bloom: !0,
  trailStrength: 0.72,
  vignette: !1
}, zt = {
  enabled: !0,
  targetFrameMs: 16.67,
  lowWatermarkMs: 13.5,
  highWatermarkMs: 20.5,
  minScale: 0.35,
  recoveryRate: 0.025,
  dropRate: 0.08,
  updateIntervalFrames: 24
};
function N(h, t, e) {
  return {
    preset: h,
    config: {
      ...W,
      ...t
    },
    postProcessing: {
      ...ft,
      ...e,
      bloom: e.bloom ?? t.bloom ?? ft.bloom
    }
  };
}
const Dt = {
  performance: N(
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
  balanced: N(
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
  quality: N(
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
function dt(h) {
  return Dt[h];
}
function Xt() {
  return ["performance", "balanced", "quality"];
}
const yt = "grit-engine:telemetry:v2", ut = 24;
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
    const h = localStorage.getItem(yt);
    if (!h) return { records: [] };
    const t = JSON.parse(h);
    return Array.isArray(t.records) ? t : { records: [] };
  } catch {
    return { records: [] };
  }
}
function Ut(h) {
  if (!(typeof localStorage > "u"))
    try {
      localStorage.setItem(yt, JSON.stringify(h));
    } catch {
    }
}
class Nt {
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
    }), i.length > ut && (i.length = ut), Ut({ records: i });
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
    this.worker = new Worker(r), URL.revokeObjectURL(r), this.listener = (a) => {
      t(a.data);
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
const Ht = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
function gt() {
  if (typeof WebAssembly > "u")
    return !1;
  try {
    return WebAssembly.validate(Ht);
  } catch {
    return !1;
  }
}
function pt(h) {
  return h === "js" ? "js" : gt() ? "wasm" : "js";
}
const qt = 4294967296;
class Yt {
  constructor(t) {
    s(this, "state");
    s(this, "initialSeed");
    const e = t >>> 0;
    this.state = e || 1, this.initialSeed = e || 1;
  }
  next() {
    this.state += 1831565813;
    let t = this.state;
    return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / qt;
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
class Qt {
  constructor(t) {
    s(this, "canvas");
    s(this, "overlayCanvas");
    s(this, "overlayCtx");
    s(this, "maxParticles");
    s(this, "spawnBatch");
    s(this, "maxDpr");
    s(this, "executionMode");
    s(this, "onStats");
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
    s(this, "frameTimeWindow", new It(360, 0.25, 120));
    s(this, "frameTimeSummary", {
      sampleCount: 0,
      avgMs: 0,
      p95Ms: 0,
      p99Ms: 0
    });
    s(this, "adaptiveScale", 1);
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
          const { x: r, y: a } = this.pointer;
          this.applyActiveParticleBudget(), this.grid.clear();
          const n = this.particles.length;
          for (let c = 0; c < n; c++)
            this.grid.add(this.particles[c]);
          const o = this.config.flocking || this.config.collisions;
          this.updatePluginContexts(i, t, r, a), this.runFrameStartPlugins();
          let l = 0;
          for (let c = 0; c < n; c++) {
            const u = this.particles[c];
            let w = Kt;
            o ? (this.grid.getNeighborsInto(u, this.neighborsBuffer), w = this.neighborsBuffer) : this.neighborsBuffer.length = 0, this.runForcePlugins(u), this.simulationBackend === "wasm" ? this.updateParticleWasmPath(u, w, r, a, i) : this.updateParticleJsPath(u, w, r, a, i), this.runConstraintPlugins(u), u.isDead() || (this.particles[l++] = u);
          }
          l !== n && (this.particles.length = l), this.runFrameEndPlugins(), this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.postProcessing), this.redrawOverlay(), this.frameCount++;
          const f = t - this.lastFpsTime;
          f >= 1e3 && (this.fps = Math.round(this.frameCount * 1e3 / f), this.frameCount = 0, this.lastFpsTime = t), t - this.lastUiUpdate >= $t && (this.lastUiUpdate = t, this.emitStats());
        }
        this.requestId = requestAnimationFrame(this.animate);
      }
    });
    var n, o, l;
    this.canvas = t.canvas, this.overlayCanvas = t.overlayCanvas, this.overlayCtx = ((n = this.overlayCanvas) == null ? void 0 : n.getContext("2d")) ?? null, this.maxParticles = t.maxParticles ?? 5e4, this.spawnBatch = t.spawnBatch ?? 100, this.maxDpr = t.maxDpr ?? 2, this.executionMode = t.executionMode ?? "main-thread", this.onStats = t.onStats, this.hybridAdaptiveEnabled = t.hybridAdaptive ?? !0, this.telemetryTuner = new Nt(t.autoTune ?? !0);
    const e = t.performancePreset ?? "balanced";
    this.performancePreset = this.telemetryTuner.recommendPreset(e);
    const i = dt(this.performancePreset);
    this.config = {
      ...i.config,
      ...t.config
    }, this.postProcessing = {
      ...i.postProcessing,
      ...t.postProcessing,
      bloom: ((o = t.config) == null ? void 0 : o.bloom) ?? ((l = t.postProcessing) == null ? void 0 : l.bloom) ?? i.postProcessing.bloom
    }, this.adaptiveBudget = new Et(this.maxParticles, {
      ...zt,
      ...t.adaptiveBudget
    }), this.activeParticleLimit = this.maxParticles, this.grid = new Tt(t.gridCellSize ?? 40);
    const { renderer: r, backend: a } = ht(this.canvas, this.maxParticles, t.renderBackend ?? "auto");
    this.renderer = r, this.renderBackend = a, this.simulationBackend = pt(t.simulationBackend ?? "auto"), this.tryInitializeWasmKernel(), this.configureRandom(t.seed), this.resize(), this.redrawOverlay();
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
    const t = Math.min(window.devicePixelRatio || 1, this.maxDpr), e = this.canvas.getBoundingClientRect(), i = Math.max(1, Math.floor(e.width)), r = Math.max(1, Math.floor(e.height)), a = Math.max(1, Math.floor(i * t)), n = Math.max(1, Math.floor(r * t));
    (this.canvas.width !== a || this.canvas.height !== n) && (this.canvas.width = a, this.canvas.height = n, this.canvas.style.width = `${i}px`, this.canvas.style.height = `${r}px`), this.overlayCanvas && (this.overlayCanvas.width !== a || this.overlayCanvas.height !== n) && (this.overlayCanvas.width = a, this.overlayCanvas.height = n, this.overlayCanvas.style.width = `${i}px`, this.overlayCanvas.style.height = `${r}px`, this.overlayDirty = !0), this.overlayCtx && (this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0), this.overlayCtx.scale(t, t));
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
    const { renderer: e, backend: i } = ht(this.canvas, this.maxParticles, t);
    this.renderer.dispose(), this.renderer = e, this.renderBackend = i;
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
    const e = dt(t);
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
    for (let a = 0; a < r; a++) {
      const n = this.getRandom(), o = vt[n() * vt.length | 0];
      this.particles.push(new kt(t, e, o, this.config, n));
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
    this.obstacles.push(new wt(t, e)), this.overlayDirty = !0;
  }
  clear() {
    this.particles.length = 0, this.obstacles.length = 0, this.neighborsBuffer.length = 0, this.overlayDirty = !0, this.emitStats(!0);
  }
  getStats() {
    this.frameTimeWindow.snapshot(this.frameTimeSummary);
    const t = this.adaptiveBudget.snapshot();
    return this.activeParticleLimit = t.activeParticleLimit, this.adaptiveScale = t.scale, {
      particleCount: this.particles.length,
      fps: this.fps,
      frameTimeAvgMs: this.frameTimeSummary.avgMs,
      frameTimeP95Ms: this.frameTimeSummary.p95Ms,
      frameTimeP99Ms: this.frameTimeSummary.p99Ms,
      activeParticleLimit: this.activeParticleLimit,
      adaptiveScale: this.adaptiveScale,
      effectivePreset: this.performancePreset
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
  updateParticleJsPath(t, e, i, r, a) {
    t.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      i,
      r,
      e,
      this.obstacles,
      a
    );
  }
  updateParticleWasmPath(t, e, i, r, a) {
    t.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      i,
      r,
      e,
      this.obstacles,
      a,
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
    this.activeParticleLimit = e.activeParticleLimit, this.adaptiveScale = e.scale, !(!this.onStats && !t) && ((i = this.onStats) == null || i.call(this, {
      particleCount: this.particles.length,
      fps: this.fps,
      frameTimeAvgMs: this.frameTimeSummary.avgMs,
      frameTimeP95Ms: this.frameTimeSummary.p95Ms,
      frameTimeP99Ms: this.frameTimeSummary.p99Ms,
      activeParticleLimit: this.activeParticleLimit,
      adaptiveScale: this.adaptiveScale,
      effectivePreset: this.performancePreset
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
  configureRandom(t) {
    if (typeof t != "number") {
      this.seededRandom = null, this.random = null;
      return;
    }
    this.seededRandom = new Yt(t), this.random = () => this.seededRandom.next();
  }
  getRandom() {
    return this.random ?? Math.random;
  }
}
export {
  O as Canvas2DRenderer,
  zt as DEFAULT_ADAPTIVE_BUDGET,
  ft as DEFAULT_POST_PROCESSING,
  W as DEFAULT_SIM_CONFIG,
  Qt as GritEngine,
  wt as Obstacle,
  Rt as OffscreenWorkerRenderer,
  kt as Particle,
  Tt as SpatialGrid,
  _t as WebGLRenderer,
  Xt as listPerformancePresets,
  dt as resolvePerformancePreset
};
