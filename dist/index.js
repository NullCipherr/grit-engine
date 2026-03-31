var tt = Object.defineProperty;
var et = (p, t, i) => t in p ? tt(p, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : p[t] = i;
var r = (p, t, i) => et(p, typeof t != "symbol" ? t + "" : t, i);
class it {
  constructor(t, i, s = 40) {
    r(this, "x");
    r(this, "y");
    r(this, "radius");
    r(this, "color");
    this.x = t, this.y = i, this.radius = s, this.color = "rgba(255, 255, 255, 0.1)";
  }
  draw(t) {
    t.save(), t.beginPath(), t.arc(this.x, this.y, this.radius, 0, Math.PI * 2), t.fillStyle = this.color, t.fill(), t.strokeStyle = "rgba(255, 255, 255, 0.2)", t.lineWidth = 2, t.stroke();
    const i = t.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    i.addColorStop(0, "rgba(102, 138, 255, 0.1)"), i.addColorStop(1, "rgba(102, 138, 255, 0)"), t.fillStyle = i, t.fill(), t.restore();
  }
  contains(t, i) {
    const s = t - this.x, a = i - this.y;
    return s * s + a * a <= this.radius * this.radius;
  }
}
let st = 0;
const z = 2e-4, O = 0.0141421356, rt = 16e4, G = 0.8, C = -0.7, q = 8, at = 33, Y = 0.02, H = 1e-3, W = 12;
class ot {
  constructor(t, i, s, a, e = Math.random) {
    r(this, "id");
    r(this, "x");
    r(this, "y");
    r(this, "vx");
    r(this, "vy");
    r(this, "ax");
    r(this, "ay");
    r(this, "life");
    r(this, "maxLife");
    r(this, "size");
    r(this, "baseSize");
    r(this, "hue");
    r(this, "mass");
    // Flocking cache / throttling
    r(this, "flockingTimer");
    r(this, "flockAvgVx");
    r(this, "flockAvgVy");
    r(this, "flockAvgX");
    r(this, "flockAvgY");
    r(this, "flockNeighborCount");
    // Fallback color cache
    r(this, "colorString");
    this.id = ++st, this.x = t, this.y = i, this.vx = (e() - 0.5) * 10, this.vy = (e() - 0.5) * 10, this.ax = 0, this.ay = 0, this.maxLife = a.particleLife + e() * 50, this.life = this.maxLife, this.baseSize = a.particleSize * (0.4 + e() * 0.8), this.size = this.baseSize, this.hue = 200 + e() * 60, this.mass = this.size, this.flockingTimer = this.id % 3 * 11, this.flockAvgVx = 0, this.flockAvgVy = 0, this.flockAvgX = this.x, this.flockAvgY = this.y, this.flockNeighborCount = 0, this.colorString = s;
  }
  update(t, i, s, a, e, n, o, h) {
    const {
      attraction: d,
      repulsion: c,
      vortex: E,
      flocking: F,
      collisions: P,
      gravity: R,
      friction: Q
    } = t;
    if (this.size = this.baseSize, this.mass = this.size > 0.1 ? this.size : 0.1, a !== null && e !== null) {
      const g = a - this.x, f = e - this.y, l = g * g + f * f;
      if (l < rt) {
        const u = (d - c) / (l + 500);
        this.ax += g * u, this.ay += f * u, E && (this.ax += f * 0.03, this.ay -= g * 0.03);
      }
    }
    const S = n.length;
    if (F && S > 0) {
      if (this.flockingTimer += h * 16.6667, this.flockingTimer >= at) {
        this.flockingTimer = 0;
        const g = S < q ? S : q;
        let f = 0, l = 0, u = 0, m = 0;
        for (let y = 0; y < g; y++) {
          const x = n[y];
          f += x.vx, l += x.vy, u += x.x, m += x.y;
        }
        const v = 1 / g;
        this.flockAvgVx = f * v, this.flockAvgVy = l * v, this.flockAvgX = u * v, this.flockAvgY = m * v, this.flockNeighborCount = g;
      }
      this.flockNeighborCount > 0 && (this.ax += (this.flockAvgVx - this.vx) * Y, this.ay += (this.flockAvgVy - this.vy) * Y, this.ax += (this.flockAvgX - this.x) * H, this.ay += (this.flockAvgY - this.y) * H);
    }
    if (P && S > 0) {
      const g = S < W ? S : W;
      for (let f = 0; f < g; f++) {
        const l = n[f];
        if (this.id >= l.id) continue;
        let u = l.x - this.x, m = l.y - this.y, v = u * u + m * m;
        const y = this.size + l.size;
        if (v < y * y) {
          let x = O;
          v <= 0 ? (u = 0.01, m = 0.01, v = z) : x = Math.sqrt(v);
          const A = u / x, b = m / x, _ = y - x, T = this.mass + l.mass, k = T > 0 ? 1 / T : 1, I = this.mass * k, D = l.mass * k;
          this.x -= A * _ * D, this.y -= b * _ * D, l.x += A * _ * I, l.y += b * _ * I;
          const J = this.vx - l.vx, Z = this.vy - l.vy, M = J * A + Z * b;
          if (M < 0) {
            const U = -1.8 * M / (1 / this.mass + 1 / l.mass), N = U * A, V = U * b;
            this.vx += N / this.mass, this.vy += V / this.mass, l.vx -= N / l.mass, l.vy -= V / l.mass;
          }
        }
      }
    }
    for (let g = 0; g < o.length; g++) {
      const f = o[g];
      let l = this.x - f.x, u = this.y - f.y, m = l * l + u * u;
      const v = this.size + f.radius;
      if (m < v * v) {
        let y = O;
        m <= 0 ? (l = 0.01, u = 0.01, m = z) : y = Math.sqrt(m);
        const x = l / y, A = u / y;
        this.x = f.x + x * v, this.y = f.y + A * v;
        const b = this.vx * x + this.vy * A;
        this.vx = (this.vx - 2 * b * x) * G, this.vy = (this.vy - 2 * b * A) * G;
      }
    }
    this.ay += R, this.vx += this.ax * h, this.vy += this.ay * h;
    const L = Math.pow(Q, h);
    this.vx *= L, this.vy *= L, this.x += this.vx * h, this.y += this.vy * h, this.ax = 0, this.ay = 0, this.x < this.size ? (this.x = this.size, this.vx *= C) : this.x > i - this.size && (this.x = i - this.size, this.vx *= C), this.y < this.size ? (this.y = this.size, this.vy *= C) : this.y > s - this.size && (this.y = s - this.size, this.vy *= C), this.life -= h;
  }
  draw(t, i, s) {
    const a = this.life > 0 ? this.life / this.maxLife : 0;
    if (t.globalAlpha = a, s) {
      const o = this.size * (i.bloom ? 3 : 1.5);
      t.drawImage(
        s,
        this.x - o,
        this.y - o,
        o * 2,
        o * 2
      );
      return;
    }
    const e = this.vx * this.vx + this.vy * this.vy, n = this.hue + Math.sqrt(e) * 5 | 0;
    this.colorString = `hsl(${n}, 85%, 65%)`, t.fillStyle = this.colorString, t.beginPath(), t.arc(this.x, this.y, this.size, 0, Math.PI * 2), t.fill();
  }
  isDead() {
    return this.life <= 0;
  }
}
const $ = [];
class nt {
  constructor(t) {
    r(this, "grid");
    r(this, "cellSize");
    r(this, "invCellSize");
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
  hash(t, i) {
    return t * 73856093 ^ i * 19349663 | 0;
  }
  add(t) {
    const i = this.toGridCoord(t.x), s = this.toGridCoord(t.y), a = this.hash(i, s);
    let e = this.grid.get(a);
    e || (e = [], this.grid.set(a, e)), e.push(t);
  }
  getNeighbors(t) {
    const i = this.toGridCoord(t.x), s = this.toGridCoord(t.y), a = [];
    for (let e = i - 1; e <= i + 1; e++)
      for (let n = s - 1; n <= s + 1; n++) {
        const o = this.grid.get(this.hash(e, n));
        if (o)
          for (let h = 0; h < o.length; h++) {
            const d = o[h];
            d !== t && a.push(d);
          }
      }
    return a.length > 0 ? a : $;
  }
  getNeighborsInto(t, i) {
    i.length = 0;
    const s = this.toGridCoord(t.x), a = this.toGridCoord(t.y);
    for (let e = s - 1; e <= s + 1; e++)
      for (let n = a - 1; n <= a + 1; n++) {
        const o = this.grid.get(this.hash(e, n));
        if (o)
          for (let h = 0; h < o.length; h++) {
            const d = o[h];
            d !== t && i.push(d);
          }
      }
  }
  getCellParticlesAt(t, i) {
    const s = this.toGridCoord(t), a = this.toGridCoord(i);
    return this.grid.get(this.hash(s, a)) ?? $;
  }
}
const X = 17 / 255, j = 19 / 255, K = 28 / 255, B = 7, w = B * 4;
class ht {
  constructor(t, i = 5e4) {
    r(this, "canvas");
    r(this, "gl");
    r(this, "program", null);
    r(this, "fadeProgram", null);
    r(this, "vao", null);
    r(this, "fadeVao", null);
    r(this, "instanceBuffer", null);
    r(this, "quadBuffer", null);
    r(this, "maxParticles");
    r(this, "instanceData");
    r(this, "uResolutionLoc", null);
    r(this, "uBloomLoc", null);
    r(this, "firstFrame", !0);
    r(this, "isContextLost", !1);
    r(this, "lastWidth", -1);
    r(this, "lastHeight", -1);
    r(this, "lastBloom", -1);
    // 360-step LUT for HSL(h, 0.85, 0.65) -> RGB
    r(this, "huePalette", new Float32Array(360 * 3));
    r(this, "handleContextLost", (t) => {
      t.preventDefault(), this.isContextLost = !0;
    });
    r(this, "handleContextRestored", () => {
      this.isContextLost = !1, this.initResources();
    });
    this.canvas = t;
    const s = t.getContext("webgl2", {
      antialias: !1,
      preserveDrawingBuffer: !1,
      alpha: !0,
      premultipliedAlpha: !0,
      powerPreference: "high-performance"
    });
    if (!s)
      throw new Error("WebGL2 not supported");
    this.gl = s, this.maxParticles = i, this.instanceData = new Float32Array(i * B), this.buildHuePalette(), this.initResources(), this.attachContextEvents();
  }
  attachContextEvents() {
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  detachContextEvents() {
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  buildHuePalette() {
    for (let t = 0; t < 360; t++) {
      const [i, s, a] = this.hslToRgb(t / 360, 0.85, 0.65), e = t * 3;
      this.huePalette[e] = i, this.huePalette[e + 1] = s, this.huePalette[e + 2] = a;
    }
  }
  hslToRgb(t, i, s) {
    if (i === 0) return [s, s, s];
    const a = (o, h, d) => {
      let c = d;
      return c < 0 && (c += 1), c > 1 && (c -= 1), c < 1 / 6 ? o + (h - o) * 6 * c : c < 1 / 2 ? h : c < 2 / 3 ? o + (h - o) * (2 / 3 - c) * 6 : o;
    }, e = s < 0.5 ? s * (1 + i) : s + i - s * i, n = 2 * s - e;
    return [
      a(n, e, t + 1 / 3),
      a(n, e, t),
      a(n, e, t - 1 / 3)
    ];
  }
  initResources() {
    const t = this.gl;
    this.disposeGpuResources();
    const i = `#version 300 es
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
    `, s = `#version 300 es
      precision highp float;

      in vec2 v_uv;
      in vec3 v_color;
      in float v_alpha;
      in float v_bloom;

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
        outColor = vec4(v_color * alpha, alpha);
      }
    `, a = `#version 300 es
      layout(location = 0) in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `, e = `#version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(${X.toFixed(8)}, ${j.toFixed(8)}, ${K.toFixed(8)}, 0.28);
      }
    `;
    this.program = this.createProgram(i, s), this.fadeProgram = this.createProgram(a, e), this.uResolutionLoc = t.getUniformLocation(this.program, "u_resolution"), this.uBloomLoc = t.getUniformLocation(this.program, "u_bloom");
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
    if (t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.bufferData(t.ARRAY_BUFFER, n, t.STATIC_DRAW), this.vao = t.createVertexArray(), !this.vao) throw new Error("Failed to create particle VAO");
    if (t.bindVertexArray(this.vao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), this.instanceBuffer = t.createBuffer(), !this.instanceBuffer) throw new Error("Failed to create instance buffer");
    if (t.bindBuffer(t.ARRAY_BUFFER, this.instanceBuffer), t.bufferData(t.ARRAY_BUFFER, this.instanceData.byteLength, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, w, 0), t.vertexAttribDivisor(1, 1), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, w, 8), t.vertexAttribDivisor(2, 1), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 3, t.FLOAT, !1, w, 12), t.vertexAttribDivisor(3, 1), t.enableVertexAttribArray(4), t.vertexAttribPointer(4, 1, t.FLOAT, !1, w, 24), t.vertexAttribDivisor(4, 1), this.fadeVao = t.createVertexArray(), !this.fadeVao) throw new Error("Failed to create fade VAO");
    t.bindVertexArray(this.fadeVao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.enable(t.BLEND), this.firstFrame = !0, this.lastWidth = -1, this.lastHeight = -1, this.lastBloom = -1;
  }
  createProgram(t, i) {
    const s = this.gl, a = s.createShader(s.VERTEX_SHADER);
    if (!a) throw new Error("Failed to create vertex shader");
    if (s.shaderSource(a, t), s.compileShader(a), !s.getShaderParameter(a, s.COMPILE_STATUS)) {
      const o = s.getShaderInfoLog(a) || "Unknown vertex shader error";
      throw s.deleteShader(a), new Error(`Vertex shader compile error: ${o}`);
    }
    const e = s.createShader(s.FRAGMENT_SHADER);
    if (!e)
      throw s.deleteShader(a), new Error("Failed to create fragment shader");
    if (s.shaderSource(e, i), s.compileShader(e), !s.getShaderParameter(e, s.COMPILE_STATUS)) {
      const o = s.getShaderInfoLog(e) || "Unknown fragment shader error";
      throw s.deleteShader(a), s.deleteShader(e), new Error(`Fragment shader compile error: ${o}`);
    }
    const n = s.createProgram();
    if (!n)
      throw s.deleteShader(a), s.deleteShader(e), new Error("Failed to create program");
    if (s.attachShader(n, a), s.attachShader(n, e), s.linkProgram(n), s.deleteShader(a), s.deleteShader(e), !s.getProgramParameter(n, s.LINK_STATUS)) {
      const o = s.getProgramInfoLog(n) || "Unknown program link error";
      throw s.deleteProgram(n), new Error(`Program link error: ${o}`);
    }
    return n;
  }
  render(t, i, s, a) {
    if (this.isContextLost || !this.program || !this.fadeProgram || !this.vao || !this.fadeVao || !this.instanceBuffer)
      return;
    const e = this.gl;
    e.viewport(0, 0, i, s), this.firstFrame && (e.clearColor(X, j, K, 1), e.clear(e.COLOR_BUFFER_BIT), this.firstFrame = !1), e.useProgram(this.fadeProgram), e.bindVertexArray(this.fadeVao), e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA), e.drawArrays(e.TRIANGLE_STRIP, 0, 4);
    const n = Math.min(t.length, this.maxParticles);
    let o = 0;
    for (let d = 0; d < n; d++) {
      const c = t[d], E = c.vx * c.vx + c.vy * c.vy, R = ((c.hue + Math.min(E * 1.25, 60) | 0) % 360 + 360) % 360 * 3;
      this.instanceData[o++] = c.x, this.instanceData[o++] = c.y, this.instanceData[o++] = c.size, this.instanceData[o++] = this.huePalette[R], this.instanceData[o++] = this.huePalette[R + 1], this.instanceData[o++] = this.huePalette[R + 2], this.instanceData[o++] = c.life > 0 ? c.life / c.maxLife : 0;
    }
    e.bindBuffer(e.ARRAY_BUFFER, this.instanceBuffer), e.bufferData(e.ARRAY_BUFFER, this.instanceData.byteLength, e.DYNAMIC_DRAW), e.bufferSubData(
      e.ARRAY_BUFFER,
      0,
      this.instanceData.subarray(0, n * B)
    ), e.useProgram(this.program), e.bindVertexArray(this.vao), (i !== this.lastWidth || s !== this.lastHeight) && (e.uniform2f(this.uResolutionLoc, i, s), this.lastWidth = i, this.lastHeight = s);
    const h = a ? 1 : 0;
    h !== this.lastBloom && (e.uniform1f(this.uBloomLoc, a ? 1 : 0), this.lastBloom = h), a ? e.blendFunc(e.ONE, e.ONE) : e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), e.drawArraysInstanced(e.TRIANGLE_STRIP, 0, 4, n), e.bindVertexArray(null);
  }
  resizeMaxParticles(t) {
    if (t !== this.maxParticles && (this.maxParticles = t, this.instanceData = new Float32Array(t * B), this.instanceBuffer)) {
      const i = this.gl;
      i.bindBuffer(i.ARRAY_BUFFER, this.instanceBuffer), i.bufferData(i.ARRAY_BUFFER, this.instanceData.byteLength, i.DYNAMIC_DRAW), i.bindBuffer(i.ARRAY_BUFFER, null);
    }
  }
  disposeGpuResources() {
    const t = this.gl;
    this.instanceBuffer && (t.deleteBuffer(this.instanceBuffer), this.instanceBuffer = null), this.quadBuffer && (t.deleteBuffer(this.quadBuffer), this.quadBuffer = null), this.vao && (t.deleteVertexArray(this.vao), this.vao = null), this.fadeVao && (t.deleteVertexArray(this.fadeVao), this.fadeVao = null), this.program && (t.deleteProgram(this.program), this.program = null), this.fadeProgram && (t.deleteProgram(this.fadeProgram), this.fadeProgram = null);
  }
  dispose() {
    this.detachContextEvents(), this.disposeGpuResources();
  }
}
class lt {
  constructor(t) {
    r(this, "worker");
    r(this, "listener");
    const i = `
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
    `, s = new Blob([i], { type: "application/javascript" }), a = URL.createObjectURL(s);
    this.worker = new Worker(a), URL.revokeObjectURL(a), this.listener = (e) => {
      t(e.data);
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
const ct = {
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
}, ft = 4294967296;
class dt {
  constructor(t) {
    r(this, "state");
    r(this, "initialSeed");
    const i = t >>> 0;
    this.state = i || 1, this.initialSeed = i || 1;
  }
  next() {
    this.state += 1831565813;
    let t = this.state;
    return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / ft;
  }
  setSeed(t) {
    const i = t >>> 0;
    this.initialSeed = i || 1, this.state = this.initialSeed;
  }
  getSeed() {
    return this.initialSeed;
  }
}
const ut = 200, gt = [];
class mt {
  constructor(t) {
    r(this, "canvas");
    r(this, "overlayCanvas");
    r(this, "overlayCtx");
    r(this, "maxParticles");
    r(this, "spawnBatch");
    r(this, "maxDpr");
    r(this, "executionMode");
    r(this, "onStats");
    r(this, "renderer");
    r(this, "grid");
    r(this, "requestId", null);
    r(this, "workerTicker", null);
    r(this, "running", !1);
    r(this, "paused", !1);
    r(this, "particles", []);
    r(this, "obstacles", []);
    r(this, "neighborsBuffer", []);
    r(this, "overlayDirty", !0);
    r(this, "pointer", { x: null, y: null });
    r(this, "config");
    r(this, "frameCount", 0);
    r(this, "lastTime", performance.now());
    r(this, "lastFpsTime", performance.now());
    r(this, "lastUiUpdate", performance.now());
    r(this, "fps", 0);
    r(this, "random", null);
    r(this, "seededRandom", null);
    r(this, "animate", (t) => {
      if (this.running) {
        if (this.paused)
          this.lastTime = t;
        else {
          const i = Math.min((t - this.lastTime) / 16.666, 3);
          this.lastTime = t;
          const { x: s, y: a } = this.pointer;
          this.grid.clear();
          for (let o = 0; o < this.particles.length; o++)
            this.grid.add(this.particles[o]);
          const e = this.config.flocking || this.config.collisions;
          for (let o = this.particles.length - 1; o >= 0; o--) {
            const h = this.particles[o];
            let d = gt;
            e ? (this.grid.getNeighborsInto(h, this.neighborsBuffer), d = this.neighborsBuffer) : this.neighborsBuffer.length = 0, h.update(
              this.config,
              this.canvas.width,
              this.canvas.height,
              s,
              a,
              d,
              this.obstacles,
              i
            ), h.isDead() && this.particles.splice(o, 1);
          }
          this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.config.bloom), this.redrawOverlay(), this.frameCount++;
          const n = t - this.lastFpsTime;
          n >= 1e3 && (this.fps = Math.round(this.frameCount * 1e3 / n), this.frameCount = 0, this.lastFpsTime = t), t - this.lastUiUpdate >= ut && (this.lastUiUpdate = t, this.emitStats());
        }
        this.requestId = requestAnimationFrame(this.animate);
      }
    });
    var i;
    this.canvas = t.canvas, this.overlayCanvas = t.overlayCanvas, this.overlayCtx = ((i = this.overlayCanvas) == null ? void 0 : i.getContext("2d")) ?? null, this.maxParticles = t.maxParticles ?? 5e4, this.spawnBatch = t.spawnBatch ?? 100, this.maxDpr = t.maxDpr ?? 2, this.executionMode = t.executionMode ?? "main-thread", this.onStats = t.onStats, this.config = {
      ...ct,
      ...t.config
    }, this.grid = new nt(t.gridCellSize ?? 40), this.renderer = new ht(this.canvas, this.maxParticles), this.configureRandom(t.seed), this.resize(), this.redrawOverlay();
  }
  start() {
    if (!this.running) {
      if (this.running = !0, this.lastTime = performance.now(), this.lastFpsTime = this.lastTime, this.lastUiUpdate = this.lastTime, this.executionMode === "worker-ticker" && typeof Worker < "u") {
        this.workerTicker = new lt((t) => {
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
    this.stop(), this.renderer.dispose();
  }
  resize() {
    const t = Math.min(window.devicePixelRatio || 1, this.maxDpr), i = this.canvas.getBoundingClientRect(), s = Math.max(1, Math.floor(i.width)), a = Math.max(1, Math.floor(i.height)), e = Math.max(1, Math.floor(s * t)), n = Math.max(1, Math.floor(a * t));
    (this.canvas.width !== e || this.canvas.height !== n) && (this.canvas.width = e, this.canvas.height = n, this.canvas.style.width = `${s}px`, this.canvas.style.height = `${a}px`), this.overlayCanvas && (this.overlayCanvas.width !== e || this.overlayCanvas.height !== n) && (this.overlayCanvas.width = e, this.overlayCanvas.height = n, this.overlayCanvas.style.width = `${s}px`, this.overlayCanvas.style.height = `${a}px`, this.overlayDirty = !0), this.overlayCtx && (this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0), this.overlayCtx.scale(t, t));
  }
  updateSettings(t) {
    this.config = {
      ...this.config,
      ...t
    };
  }
  getSettings() {
    return { ...this.config };
  }
  setPaused(t) {
    this.paused = t;
  }
  getPaused() {
    return this.paused;
  }
  setPointer(t, i) {
    this.pointer = { x: t, y: i };
  }
  clearPointer() {
    this.pointer = { x: null, y: null };
  }
  spawnAt(t, i) {
    if (this.particles.length >= this.maxParticles) return;
    const s = [
      "rgba(102, 138, 255, 1)",
      "rgba(156, 135, 188, 1)",
      "rgba(52, 211, 153, 1)"
    ], a = this.maxParticles - this.particles.length, e = a < this.spawnBatch ? a : this.spawnBatch;
    for (let n = 0; n < e; n++) {
      const o = this.getRandom(), h = s[o() * s.length | 0];
      this.particles.push(new ot(t, i, h, this.config, o));
    }
  }
  setSeed(t) {
    this.configureRandom(t);
  }
  getSeed() {
    var t;
    return ((t = this.seededRandom) == null ? void 0 : t.getSeed()) ?? null;
  }
  addObstacle(t, i) {
    this.obstacles.push(new it(t, i)), this.overlayDirty = !0;
  }
  clear() {
    this.particles.length = 0, this.obstacles.length = 0, this.neighborsBuffer.length = 0, this.overlayDirty = !0, this.emitStats(!0);
  }
  getStats() {
    return {
      particleCount: this.particles.length,
      fps: this.fps
    };
  }
  redrawOverlay() {
    if (!this.overlayCanvas || !this.overlayCtx || !this.overlayDirty) return;
    const t = this.overlayCanvas.getBoundingClientRect();
    this.overlayCtx.clearRect(0, 0, t.width, t.height);
    for (let i = 0; i < this.obstacles.length; i++)
      this.obstacles[i].draw(this.overlayCtx);
    this.overlayDirty = !1;
  }
  emitStats(t = !1) {
    var i;
    !this.onStats && !t || (i = this.onStats) == null || i.call(this, {
      particleCount: this.particles.length,
      fps: this.fps
    });
  }
  configureRandom(t) {
    if (typeof t != "number") {
      this.seededRandom = null, this.random = null;
      return;
    }
    this.seededRandom = new dt(t), this.random = () => this.seededRandom.next();
  }
  getRandom() {
    return this.random ?? Math.random;
  }
}
export {
  ct as DEFAULT_SIM_CONFIG,
  mt as GritEngine,
  it as Obstacle,
  ot as Particle,
  nt as SpatialGrid,
  ht as WebGLRenderer
};
