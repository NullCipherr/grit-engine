var tt = Object.defineProperty;
var et = (p, t, i) => t in p ? tt(p, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : p[t] = i;
var a = (p, t, i) => et(p, typeof t != "symbol" ? t + "" : t, i);
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
class it {
  constructor(t, i, e = 40) {
    a(this, "x");
    a(this, "y");
    a(this, "radius");
    a(this, "color");
    this.x = t, this.y = i, this.radius = e, this.color = "rgba(255, 255, 255, 0.1)";
  }
  draw(t) {
    t.save(), t.beginPath(), t.arc(this.x, this.y, this.radius, 0, Math.PI * 2), t.fillStyle = this.color, t.fill(), t.strokeStyle = "rgba(255, 255, 255, 0.2)", t.lineWidth = 2, t.stroke();
    const i = t.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    i.addColorStop(0, "rgba(102, 138, 255, 0.1)"), i.addColorStop(1, "rgba(102, 138, 255, 0)"), t.fillStyle = i, t.fill(), t.restore();
  }
  contains(t, i) {
    const e = t - this.x, r = i - this.y;
    return e * e + r * r <= this.radius * this.radius;
  }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
let st = 0;
const O = 2e-4, k = 0.0141421356, at = 16e4, G = 0.8, R = -0.7, q = 8, rt = 33, Y = 0.02, H = 1e-3, W = 12;
class ot {
  constructor(t, i, e, r) {
    a(this, "id");
    a(this, "x");
    a(this, "y");
    a(this, "vx");
    a(this, "vy");
    a(this, "ax");
    a(this, "ay");
    a(this, "life");
    a(this, "maxLife");
    a(this, "size");
    a(this, "baseSize");
    a(this, "hue");
    a(this, "mass");
    // Flocking cache / throttling
    a(this, "flockingTimer");
    a(this, "flockAvgVx");
    a(this, "flockAvgVy");
    a(this, "flockAvgX");
    a(this, "flockAvgY");
    a(this, "flockNeighborCount");
    // Fallback color cache
    a(this, "colorString");
    this.id = ++st, this.x = t, this.y = i, this.vx = (Math.random() - 0.5) * 10, this.vy = (Math.random() - 0.5) * 10, this.ax = 0, this.ay = 0, this.maxLife = r.particleLife + Math.random() * 50, this.life = this.maxLife, this.baseSize = r.particleSize * (0.4 + Math.random() * 0.8), this.size = this.baseSize, this.hue = 200 + Math.random() * 60, this.mass = this.size, this.flockingTimer = this.id % 3 * 11, this.flockAvgVx = 0, this.flockAvgVy = 0, this.flockAvgX = this.x, this.flockAvgY = this.y, this.flockNeighborCount = 0, this.colorString = e;
  }
  update(t, i, e, r, s, h, o, n) {
    const {
      attraction: d,
      repulsion: c,
      vortex: F,
      flocking: P,
      collisions: w,
      gravity: _,
      friction: Q
    } = t;
    if (this.size = this.baseSize, this.mass = this.size > 0.1 ? this.size : 0.1, r !== null && s !== null) {
      const g = r - this.x, f = s - this.y, l = g * g + f * f;
      if (l < at) {
        const u = (d - c) / (l + 500);
        this.ax += g * u, this.ay += f * u, F && (this.ax += f * 0.03, this.ay -= g * 0.03);
      }
    }
    const S = h.length;
    if (P && S > 0) {
      if (this.flockingTimer += n * 16.6667, this.flockingTimer >= rt) {
        this.flockingTimer = 0;
        const g = S < q ? S : q;
        let f = 0, l = 0, u = 0, x = 0;
        for (let m = 0; m < g; m++) {
          const y = h[m];
          f += y.vx, l += y.vy, u += y.x, x += y.y;
        }
        const v = 1 / g;
        this.flockAvgVx = f * v, this.flockAvgVy = l * v, this.flockAvgX = u * v, this.flockAvgY = x * v, this.flockNeighborCount = g;
      }
      this.flockNeighborCount > 0 && (this.ax += (this.flockAvgVx - this.vx) * Y, this.ay += (this.flockAvgVy - this.vy) * Y, this.ax += (this.flockAvgX - this.x) * H, this.ay += (this.flockAvgY - this.y) * H);
    }
    if (w && S > 0) {
      const g = S < W ? S : W;
      for (let f = 0; f < g; f++) {
        const l = h[f];
        if (this.id >= l.id) continue;
        let u = l.x - this.x, x = l.y - this.y, v = u * u + x * x;
        const m = this.size + l.size;
        if (v < m * m) {
          let y = k;
          v <= 0 ? (u = 0.01, x = 0.01, v = O) : y = Math.sqrt(v);
          const A = u / y, b = x / y, C = m - y, D = this.mass + l.mass, I = D > 0 ? 1 / D : 1, T = this.mass * I, M = l.mass * I;
          this.x -= A * C * M, this.y -= b * C * M, l.x += A * C * T, l.y += b * C * T;
          const J = this.vx - l.vx, Z = this.vy - l.vy, V = J * A + Z * b;
          if (V < 0) {
            const N = -1.8 * V / (1 / this.mass + 1 / l.mass), U = N * A, z = N * b;
            this.vx += U / this.mass, this.vy += z / this.mass, l.vx -= U / l.mass, l.vy -= z / l.mass;
          }
        }
      }
    }
    for (let g = 0; g < o.length; g++) {
      const f = o[g];
      let l = this.x - f.x, u = this.y - f.y, x = l * l + u * u;
      const v = this.size + f.radius;
      if (x < v * v) {
        let m = k;
        x <= 0 ? (l = 0.01, u = 0.01, x = O) : m = Math.sqrt(x);
        const y = l / m, A = u / m;
        this.x = f.x + y * v, this.y = f.y + A * v;
        const b = this.vx * y + this.vy * A;
        this.vx = (this.vx - 2 * b * y) * G, this.vy = (this.vy - 2 * b * A) * G;
      }
    }
    this.ay += _, this.vx += this.ax * n, this.vy += this.ay * n;
    const L = Math.pow(Q, n);
    this.vx *= L, this.vy *= L, this.x += this.vx * n, this.y += this.vy * n, this.ax = 0, this.ay = 0, this.x < this.size ? (this.x = this.size, this.vx *= R) : this.x > i - this.size && (this.x = i - this.size, this.vx *= R), this.y < this.size ? (this.y = this.size, this.vy *= R) : this.y > e - this.size && (this.y = e - this.size, this.vy *= R), this.life -= n;
  }
  draw(t, i, e) {
    const r = this.life > 0 ? this.life / this.maxLife : 0;
    if (t.globalAlpha = r, e) {
      const o = this.size * (i.bloom ? 3 : 1.5);
      t.drawImage(
        e,
        this.x - o,
        this.y - o,
        o * 2,
        o * 2
      );
      return;
    }
    const s = this.vx * this.vx + this.vy * this.vy, h = this.hue + Math.sqrt(s) * 5 | 0;
    this.colorString = `hsl(${h}, 85%, 65%)`, t.fillStyle = this.colorString, t.beginPath(), t.arc(this.x, this.y, this.size, 0, Math.PI * 2), t.fill();
  }
  isDead() {
    return this.life <= 0;
  }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
const $ = [];
class ht {
  constructor(t) {
    a(this, "grid");
    a(this, "cellSize");
    a(this, "invCellSize");
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
    const i = this.toGridCoord(t.x), e = this.toGridCoord(t.y), r = this.hash(i, e);
    let s = this.grid.get(r);
    s || (s = [], this.grid.set(r, s)), s.push(t);
  }
  getNeighbors(t) {
    const i = this.toGridCoord(t.x), e = this.toGridCoord(t.y), r = [];
    for (let s = i - 1; s <= i + 1; s++)
      for (let h = e - 1; h <= e + 1; h++) {
        const o = this.grid.get(this.hash(s, h));
        if (o)
          for (let n = 0; n < o.length; n++) {
            const d = o[n];
            d !== t && r.push(d);
          }
      }
    return r.length > 0 ? r : $;
  }
  getNeighborsInto(t, i) {
    i.length = 0;
    const e = this.toGridCoord(t.x), r = this.toGridCoord(t.y);
    for (let s = e - 1; s <= e + 1; s++)
      for (let h = r - 1; h <= r + 1; h++) {
        const o = this.grid.get(this.hash(s, h));
        if (o)
          for (let n = 0; n < o.length; n++) {
            const d = o[n];
            d !== t && i.push(d);
          }
      }
  }
  getCellParticlesAt(t, i) {
    const e = this.toGridCoord(t), r = this.toGridCoord(i);
    return this.grid.get(this.hash(e, r)) ?? $;
  }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
const X = 17 / 255, j = 19 / 255, K = 28 / 255, E = 7, B = E * 4;
class nt {
  constructor(t, i = 5e4) {
    a(this, "canvas");
    a(this, "gl");
    a(this, "program", null);
    a(this, "fadeProgram", null);
    a(this, "vao", null);
    a(this, "fadeVao", null);
    a(this, "instanceBuffer", null);
    a(this, "quadBuffer", null);
    a(this, "maxParticles");
    a(this, "instanceData");
    a(this, "uResolutionLoc", null);
    a(this, "uBloomLoc", null);
    a(this, "firstFrame", !0);
    a(this, "isContextLost", !1);
    a(this, "lastWidth", -1);
    a(this, "lastHeight", -1);
    a(this, "lastBloom", -1);
    // 360-step LUT for HSL(h, 0.85, 0.65) -> RGB
    a(this, "huePalette", new Float32Array(360 * 3));
    a(this, "handleContextLost", (t) => {
      t.preventDefault(), this.isContextLost = !0;
    });
    a(this, "handleContextRestored", () => {
      this.isContextLost = !1, this.initResources();
    });
    this.canvas = t;
    const e = t.getContext("webgl2", {
      antialias: !1,
      preserveDrawingBuffer: !1,
      alpha: !0,
      premultipliedAlpha: !0,
      powerPreference: "high-performance"
    });
    if (!e)
      throw new Error("WebGL2 not supported");
    this.gl = e, this.maxParticles = i, this.instanceData = new Float32Array(i * E), this.buildHuePalette(), this.initResources(), this.attachContextEvents();
  }
  attachContextEvents() {
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  detachContextEvents() {
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost, !1), this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored, !1);
  }
  buildHuePalette() {
    for (let t = 0; t < 360; t++) {
      const [i, e, r] = this.hslToRgb(t / 360, 0.85, 0.65), s = t * 3;
      this.huePalette[s] = i, this.huePalette[s + 1] = e, this.huePalette[s + 2] = r;
    }
  }
  hslToRgb(t, i, e) {
    if (i === 0) return [e, e, e];
    const r = (o, n, d) => {
      let c = d;
      return c < 0 && (c += 1), c > 1 && (c -= 1), c < 1 / 6 ? o + (n - o) * 6 * c : c < 1 / 2 ? n : c < 2 / 3 ? o + (n - o) * (2 / 3 - c) * 6 : o;
    }, s = e < 0.5 ? e * (1 + i) : e + i - e * i, h = 2 * e - s;
    return [
      r(h, s, t + 1 / 3),
      r(h, s, t),
      r(h, s, t - 1 / 3)
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
    `, e = `#version 300 es
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
    `, r = `#version 300 es
      layout(location = 0) in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `, s = `#version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(${X.toFixed(8)}, ${j.toFixed(8)}, ${K.toFixed(8)}, 0.28);
      }
    `;
    this.program = this.createProgram(i, e), this.fadeProgram = this.createProgram(r, s), this.uResolutionLoc = t.getUniformLocation(this.program, "u_resolution"), this.uBloomLoc = t.getUniformLocation(this.program, "u_bloom");
    const h = new Float32Array([
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
    if (t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.bufferData(t.ARRAY_BUFFER, h, t.STATIC_DRAW), this.vao = t.createVertexArray(), !this.vao) throw new Error("Failed to create particle VAO");
    if (t.bindVertexArray(this.vao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), this.instanceBuffer = t.createBuffer(), !this.instanceBuffer) throw new Error("Failed to create instance buffer");
    if (t.bindBuffer(t.ARRAY_BUFFER, this.instanceBuffer), t.bufferData(t.ARRAY_BUFFER, this.instanceData.byteLength, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, B, 0), t.vertexAttribDivisor(1, 1), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, B, 8), t.vertexAttribDivisor(2, 1), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 3, t.FLOAT, !1, B, 12), t.vertexAttribDivisor(3, 1), t.enableVertexAttribArray(4), t.vertexAttribPointer(4, 1, t.FLOAT, !1, B, 24), t.vertexAttribDivisor(4, 1), this.fadeVao = t.createVertexArray(), !this.fadeVao) throw new Error("Failed to create fade VAO");
    t.bindVertexArray(this.fadeVao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.enable(t.BLEND), this.firstFrame = !0, this.lastWidth = -1, this.lastHeight = -1, this.lastBloom = -1;
  }
  createProgram(t, i) {
    const e = this.gl, r = e.createShader(e.VERTEX_SHADER);
    if (!r) throw new Error("Failed to create vertex shader");
    if (e.shaderSource(r, t), e.compileShader(r), !e.getShaderParameter(r, e.COMPILE_STATUS)) {
      const o = e.getShaderInfoLog(r) || "Unknown vertex shader error";
      throw e.deleteShader(r), new Error(`Vertex shader compile error: ${o}`);
    }
    const s = e.createShader(e.FRAGMENT_SHADER);
    if (!s)
      throw e.deleteShader(r), new Error("Failed to create fragment shader");
    if (e.shaderSource(s, i), e.compileShader(s), !e.getShaderParameter(s, e.COMPILE_STATUS)) {
      const o = e.getShaderInfoLog(s) || "Unknown fragment shader error";
      throw e.deleteShader(r), e.deleteShader(s), new Error(`Fragment shader compile error: ${o}`);
    }
    const h = e.createProgram();
    if (!h)
      throw e.deleteShader(r), e.deleteShader(s), new Error("Failed to create program");
    if (e.attachShader(h, r), e.attachShader(h, s), e.linkProgram(h), e.deleteShader(r), e.deleteShader(s), !e.getProgramParameter(h, e.LINK_STATUS)) {
      const o = e.getProgramInfoLog(h) || "Unknown program link error";
      throw e.deleteProgram(h), new Error(`Program link error: ${o}`);
    }
    return h;
  }
  render(t, i, e, r) {
    if (this.isContextLost || !this.program || !this.fadeProgram || !this.vao || !this.fadeVao || !this.instanceBuffer)
      return;
    const s = this.gl;
    s.viewport(0, 0, i, e), this.firstFrame && (s.clearColor(X, j, K, 1), s.clear(s.COLOR_BUFFER_BIT), this.firstFrame = !1), s.useProgram(this.fadeProgram), s.bindVertexArray(this.fadeVao), s.blendFunc(s.SRC_ALPHA, s.ONE_MINUS_SRC_ALPHA), s.drawArrays(s.TRIANGLE_STRIP, 0, 4);
    const h = Math.min(t.length, this.maxParticles);
    let o = 0;
    for (let d = 0; d < h; d++) {
      const c = t[d], F = c.vx * c.vx + c.vy * c.vy, _ = ((c.hue + Math.min(F * 1.25, 60) | 0) % 360 + 360) % 360 * 3;
      this.instanceData[o++] = c.x, this.instanceData[o++] = c.y, this.instanceData[o++] = c.size, this.instanceData[o++] = this.huePalette[_], this.instanceData[o++] = this.huePalette[_ + 1], this.instanceData[o++] = this.huePalette[_ + 2], this.instanceData[o++] = c.life > 0 ? c.life / c.maxLife : 0;
    }
    s.bindBuffer(s.ARRAY_BUFFER, this.instanceBuffer), s.bufferData(s.ARRAY_BUFFER, this.instanceData.byteLength, s.DYNAMIC_DRAW), s.bufferSubData(
      s.ARRAY_BUFFER,
      0,
      this.instanceData.subarray(0, h * E)
    ), s.useProgram(this.program), s.bindVertexArray(this.vao), (i !== this.lastWidth || e !== this.lastHeight) && (s.uniform2f(this.uResolutionLoc, i, e), this.lastWidth = i, this.lastHeight = e);
    const n = r ? 1 : 0;
    n !== this.lastBloom && (s.uniform1f(this.uBloomLoc, r ? 1 : 0), this.lastBloom = n), r ? s.blendFunc(s.ONE, s.ONE) : s.blendFunc(s.ONE, s.ONE_MINUS_SRC_ALPHA), s.drawArraysInstanced(s.TRIANGLE_STRIP, 0, 4, h), s.bindVertexArray(null);
  }
  resizeMaxParticles(t) {
    if (t !== this.maxParticles && (this.maxParticles = t, this.instanceData = new Float32Array(t * E), this.instanceBuffer)) {
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
const lt = {
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
}, ct = 200, ft = [];
class ut {
  constructor(t) {
    a(this, "canvas");
    a(this, "overlayCanvas");
    a(this, "overlayCtx");
    a(this, "maxParticles");
    a(this, "spawnBatch");
    a(this, "maxDpr");
    a(this, "onStats");
    a(this, "renderer");
    a(this, "grid");
    a(this, "requestId", null);
    a(this, "running", !1);
    a(this, "paused", !1);
    a(this, "particles", []);
    a(this, "obstacles", []);
    a(this, "neighborsBuffer", []);
    a(this, "overlayDirty", !0);
    a(this, "pointer", { x: null, y: null });
    a(this, "config");
    a(this, "frameCount", 0);
    a(this, "lastTime", performance.now());
    a(this, "lastFpsTime", performance.now());
    a(this, "lastUiUpdate", performance.now());
    a(this, "fps", 0);
    a(this, "animate", (t) => {
      if (this.running) {
        if (this.paused)
          this.lastTime = t;
        else {
          const i = Math.min((t - this.lastTime) / 16.666, 3);
          this.lastTime = t;
          const { x: e, y: r } = this.pointer;
          this.grid.clear();
          for (let o = 0; o < this.particles.length; o++)
            this.grid.add(this.particles[o]);
          const s = this.config.flocking || this.config.collisions;
          for (let o = this.particles.length - 1; o >= 0; o--) {
            const n = this.particles[o];
            let d = ft;
            s ? (this.grid.getNeighborsInto(n, this.neighborsBuffer), d = this.neighborsBuffer) : this.neighborsBuffer.length = 0, n.update(
              this.config,
              this.canvas.width,
              this.canvas.height,
              e,
              r,
              d,
              this.obstacles,
              i
            ), n.isDead() && this.particles.splice(o, 1);
          }
          this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.config.bloom), this.redrawOverlay(), this.frameCount++;
          const h = t - this.lastFpsTime;
          h >= 1e3 && (this.fps = Math.round(this.frameCount * 1e3 / h), this.frameCount = 0, this.lastFpsTime = t), t - this.lastUiUpdate >= ct && (this.lastUiUpdate = t, this.emitStats());
        }
        this.requestId = requestAnimationFrame(this.animate);
      }
    });
    var i;
    this.canvas = t.canvas, this.overlayCanvas = t.overlayCanvas, this.overlayCtx = ((i = this.overlayCanvas) == null ? void 0 : i.getContext("2d")) ?? null, this.maxParticles = t.maxParticles ?? 5e4, this.spawnBatch = t.spawnBatch ?? 100, this.maxDpr = t.maxDpr ?? 2, this.onStats = t.onStats, this.config = {
      ...lt,
      ...t.config
    }, this.grid = new ht(t.gridCellSize ?? 40), this.renderer = new nt(this.canvas, this.maxParticles), this.resize(), this.redrawOverlay();
  }
  start() {
    this.running || (this.running = !0, this.lastTime = performance.now(), this.lastFpsTime = this.lastTime, this.lastUiUpdate = this.lastTime, this.requestId = requestAnimationFrame(this.animate));
  }
  stop() {
    this.running = !1, this.requestId !== null && (cancelAnimationFrame(this.requestId), this.requestId = null);
  }
  dispose() {
    this.stop(), this.renderer.dispose();
  }
  resize() {
    const t = Math.min(window.devicePixelRatio || 1, this.maxDpr), i = this.canvas.getBoundingClientRect(), e = Math.max(1, Math.floor(i.width)), r = Math.max(1, Math.floor(i.height)), s = Math.max(1, Math.floor(e * t)), h = Math.max(1, Math.floor(r * t));
    (this.canvas.width !== s || this.canvas.height !== h) && (this.canvas.width = s, this.canvas.height = h, this.canvas.style.width = `${e}px`, this.canvas.style.height = `${r}px`), this.overlayCanvas && (this.overlayCanvas.width !== s || this.overlayCanvas.height !== h) && (this.overlayCanvas.width = s, this.overlayCanvas.height = h, this.overlayCanvas.style.width = `${e}px`, this.overlayCanvas.style.height = `${r}px`, this.overlayDirty = !0), this.overlayCtx && (this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0), this.overlayCtx.scale(t, t));
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
    const e = [
      "rgba(102, 138, 255, 1)",
      "rgba(156, 135, 188, 1)",
      "rgba(52, 211, 153, 1)"
    ], r = this.maxParticles - this.particles.length, s = r < this.spawnBatch ? r : this.spawnBatch;
    for (let h = 0; h < s; h++) {
      const o = e[Math.random() * e.length | 0];
      this.particles.push(new ot(t, i, o, this.config));
    }
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
}
export {
  lt as DEFAULT_SIM_CONFIG,
  ut as GritEngine,
  it as Obstacle,
  ot as Particle,
  ht as SpatialGrid,
  nt as WebGLRenderer
};
