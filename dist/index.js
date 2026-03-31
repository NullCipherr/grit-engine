var ot = Object.defineProperty;
var lt = (u, t, e) => t in u ? ot(u, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : u[t] = e;
var r = (u, t, e) => lt(u, typeof t != "symbol" ? t + "" : t, e);
class ht {
  constructor(t, e, i = 40) {
    r(this, "x");
    r(this, "y");
    r(this, "radius");
    r(this, "color");
    this.x = t, this.y = e, this.radius = i, this.color = "rgba(255, 255, 255, 0.1)";
  }
  draw(t) {
    t.save(), t.beginPath(), t.arc(this.x, this.y, this.radius, 0, Math.PI * 2), t.fillStyle = this.color, t.fill(), t.strokeStyle = "rgba(255, 255, 255, 0.2)", t.lineWidth = 2, t.stroke();
    const e = t.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    e.addColorStop(0, "rgba(102, 138, 255, 0.1)"), e.addColorStop(1, "rgba(102, 138, 255, 0)"), t.fillStyle = e, t.fill(), t.restore();
  }
  contains(t, e) {
    const i = t - this.x, a = e - this.y;
    return i * i + a * a <= this.radius * this.radius;
  }
}
let ct = 0;
const G = 2e-4, H = 0.0141421356, ft = 16e4, W = 0.8, E = -0.7, Y = 8, ut = 33, q = 0.02, $ = 1e-3, j = 12;
class dt {
  constructor(t, e, i, a, s = Math.random) {
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
    this.id = ++ct, this.x = t, this.y = e, this.vx = (s() - 0.5) * 10, this.vy = (s() - 0.5) * 10, this.ax = 0, this.ay = 0, this.maxLife = a.particleLife + s() * 50, this.life = this.maxLife, this.baseSize = a.particleSize * (0.4 + s() * 0.8), this.size = this.baseSize, this.hue = 200 + s() * 60, this.mass = this.size, this.flockingTimer = this.id % 3 * 11, this.flockAvgVx = 0, this.flockAvgVy = 0, this.flockAvgX = this.x, this.flockAvgY = this.y, this.flockNeighborCount = 0, this.colorString = i;
  }
  update(t, e, i, a, s, n, o, l) {
    const {
      attraction: c,
      repulsion: h,
      vortex: P,
      flocking: S,
      collisions: d,
      gravity: _,
      friction: w
    } = t;
    if (this.size = this.baseSize, this.mass = this.size > 0.1 ? this.size : 0.1, a !== null && s !== null) {
      const v = a - this.x, g = s - this.y, f = v * v + g * g;
      if (f < ft) {
        const m = (c - h) / (f + 500);
        this.ax += v * m, this.ay += g * m, P && (this.ax += g * 0.03, this.ay -= v * 0.03);
      }
    }
    const C = n.length;
    if (S && C > 0) {
      if (this.flockingTimer += l * 16.6667, this.flockingTimer >= ut) {
        this.flockingTimer = 0;
        const v = C < Y ? C : Y;
        let g = 0, f = 0, m = 0, x = 0;
        for (let b = 0; b < v; b++) {
          const y = n[b];
          g += y.vx, f += y.vy, m += y.x, x += y.y;
        }
        const p = 1 / v;
        this.flockAvgVx = g * p, this.flockAvgVy = f * p, this.flockAvgX = m * p, this.flockAvgY = x * p, this.flockNeighborCount = v;
      }
      this.flockNeighborCount > 0 && (this.ax += (this.flockAvgVx - this.vx) * q, this.ay += (this.flockAvgVy - this.vy) * q, this.ax += (this.flockAvgX - this.x) * $, this.ay += (this.flockAvgY - this.y) * $);
    }
    if (d && C > 0) {
      const v = C < j ? C : j;
      for (let g = 0; g < v; g++) {
        const f = n[g];
        if (this.id >= f.id) continue;
        let m = f.x - this.x, x = f.y - this.y, p = m * m + x * x;
        const b = this.size + f.size;
        if (p < b * b) {
          let y = H;
          p <= 0 ? (m = 0.01, x = 0.01, p = G) : y = Math.sqrt(p);
          const A = m / y, R = x / y, F = b - y, I = this.mass + f.mass, T = I > 0 ? 1 / I : 1, D = this.mass * T, U = f.mass * T;
          this.x -= A * F * U, this.y -= R * F * U, f.x += A * F * D, f.y += R * F * D;
          const at = this.vx - f.vx, nt = this.vy - f.vy, V = at * A + nt * R;
          if (V < 0) {
            const O = -1.8 * V / (1 / this.mass + 1 / f.mass), N = O * A, z = O * R;
            this.vx += N / this.mass, this.vy += z / this.mass, f.vx -= N / f.mass, f.vy -= z / f.mass;
          }
        }
      }
    }
    for (let v = 0; v < o.length; v++) {
      const g = o[v];
      let f = this.x - g.x, m = this.y - g.y, x = f * f + m * m;
      const p = this.size + g.radius;
      if (x < p * p) {
        let b = H;
        x <= 0 ? (f = 0.01, m = 0.01, x = G) : b = Math.sqrt(x);
        const y = f / b, A = m / b;
        this.x = g.x + y * p, this.y = g.y + A * p;
        const R = this.vx * y + this.vy * A;
        this.vx = (this.vx - 2 * R * y) * W, this.vy = (this.vy - 2 * R * A) * W;
      }
    }
    this.ay += _, this.vx += this.ax * l, this.vy += this.ay * l;
    const B = Math.pow(w, l);
    this.vx *= B, this.vy *= B, this.x += this.vx * l, this.y += this.vy * l, this.ax = 0, this.ay = 0, this.x < this.size ? (this.x = this.size, this.vx *= E) : this.x > e - this.size && (this.x = e - this.size, this.vx *= E), this.y < this.size ? (this.y = this.size, this.vy *= E) : this.y > i - this.size && (this.y = i - this.size, this.vy *= E), this.life -= l;
  }
  draw(t, e, i) {
    const a = this.life > 0 ? this.life / this.maxLife : 0;
    if (t.globalAlpha = a, i) {
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
    const s = this.vx * this.vx + this.vy * this.vy, n = this.hue + Math.sqrt(s) * 5 | 0;
    this.colorString = `hsl(${n}, 85%, 65%)`, t.fillStyle = this.colorString, t.beginPath(), t.arc(this.x, this.y, this.size, 0, Math.PI * 2), t.fill();
  }
  isDead() {
    return this.life <= 0;
  }
}
const X = "#11131c";
class K {
  constructor(t, e = 5e4) {
    r(this, "canvas");
    r(this, "ctx");
    r(this, "maxParticles");
    r(this, "firstFrame", !0);
    this.canvas = t;
    const i = t.getContext("2d", { alpha: !0, desynchronized: !0 });
    if (!i)
      throw new Error("Canvas2D not supported");
    this.ctx = i, this.maxParticles = e;
  }
  render(t, e, i, a) {
    const s = this.ctx;
    this.firstFrame && (s.globalAlpha = 1, s.fillStyle = X, s.fillRect(0, 0, e, i), this.firstFrame = !1);
    const n = Math.max(0, Math.min(a.trailStrength, 1)), o = Math.min(Math.max(1 - n, 0.04), 0.92);
    s.globalCompositeOperation = "source-over", s.globalAlpha = o, s.fillStyle = X, s.fillRect(0, 0, e, i);
    const l = Math.min(this.maxParticles, t.length);
    s.globalCompositeOperation = a.bloom ? "lighter" : "source-over";
    for (let c = 0; c < l; c++) {
      const h = t[c], P = h.life > 0 ? h.life / h.maxLife : 0;
      s.globalAlpha = P;
      const S = h.vx * h.vx + h.vy * h.vy, d = h.hue + Math.min(S * 1.25, 60) | 0;
      if (a.bloom) {
        const _ = h.size * 2.6, w = s.createRadialGradient(h.x, h.y, 0, h.x, h.y, _);
        w.addColorStop(0, `hsla(${d}, 85%, 70%, 1)`), w.addColorStop(1, `hsla(${d}, 85%, 70%, 0)`), s.fillStyle = w, s.beginPath(), s.arc(h.x, h.y, _, 0, Math.PI * 2), s.fill();
      } else
        s.fillStyle = `hsl(${d}, 85%, 65%)`, s.beginPath(), s.arc(h.x, h.y, h.size, 0, Math.PI * 2), s.fill();
    }
    if (a.vignette) {
      const c = s.createRadialGradient(
        e * 0.5,
        i * 0.5,
        Math.min(e, i) * 0.18,
        e * 0.5,
        i * 0.5,
        Math.max(e, i) * 0.75
      );
      c.addColorStop(0, "rgba(0, 0, 0, 0)"), c.addColorStop(1, "rgba(0, 0, 0, 0.4)"), s.globalAlpha = 1, s.globalCompositeOperation = "source-over", s.fillStyle = c, s.fillRect(0, 0, e, i);
    }
  }
  resizeMaxParticles(t) {
    this.maxParticles = t;
  }
  dispose() {
    this.ctx.globalCompositeOperation = "source-over", this.ctx.globalAlpha = 1;
  }
}
const J = 17 / 255, Q = 19 / 255, Z = 28 / 255, L = 7, k = L * 4;
class gt {
  constructor(t, e = 5e4) {
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
    r(this, "uVignetteLoc", null);
    r(this, "uFadeAlphaLoc", null);
    r(this, "firstFrame", !0);
    r(this, "isContextLost", !1);
    r(this, "lastWidth", -1);
    r(this, "lastHeight", -1);
    r(this, "lastBloom", -1);
    r(this, "lastVignette", -1);
    r(this, "lastFadeAlpha", -1);
    // 360-step LUT for HSL(h, 0.85, 0.65) -> RGB
    r(this, "huePalette", new Float32Array(360 * 3));
    r(this, "handleContextLost", (t) => {
      t.preventDefault(), this.isContextLost = !0;
    });
    r(this, "handleContextRestored", () => {
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
      const [e, i, a] = this.hslToRgb(t / 360, 0.85, 0.65), s = t * 3;
      this.huePalette[s] = e, this.huePalette[s + 1] = i, this.huePalette[s + 2] = a;
    }
  }
  hslToRgb(t, e, i) {
    if (e === 0) return [i, i, i];
    const a = (o, l, c) => {
      let h = c;
      return h < 0 && (h += 1), h > 1 && (h -= 1), h < 1 / 6 ? o + (l - o) * 6 * h : h < 1 / 2 ? l : h < 2 / 3 ? o + (l - o) * (2 / 3 - h) * 6 : o;
    }, s = i < 0.5 ? i * (1 + e) : i + e - i * e, n = 2 * i - s;
    return [
      a(n, s, t + 1 / 3),
      a(n, s, t),
      a(n, s, t - 1 / 3)
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
    `, a = `#version 300 es
      layout(location = 0) in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `, s = `#version 300 es
      precision mediump float;
      uniform float u_fadeAlpha;
      out vec4 outColor;
      void main() {
        outColor = vec4(${J.toFixed(8)}, ${Q.toFixed(8)}, ${Z.toFixed(8)}, u_fadeAlpha);
      }
    `;
    this.program = this.createProgram(e, i), this.fadeProgram = this.createProgram(a, s), this.uResolutionLoc = t.getUniformLocation(this.program, "u_resolution"), this.uBloomLoc = t.getUniformLocation(this.program, "u_bloom"), this.uVignetteLoc = t.getUniformLocation(this.program, "u_vignette"), this.uFadeAlphaLoc = t.getUniformLocation(this.fadeProgram, "u_fadeAlpha");
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
    if (t.bindBuffer(t.ARRAY_BUFFER, this.instanceBuffer), t.bufferData(t.ARRAY_BUFFER, this.instanceData.byteLength, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, k, 0), t.vertexAttribDivisor(1, 1), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, k, 8), t.vertexAttribDivisor(2, 1), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 3, t.FLOAT, !1, k, 12), t.vertexAttribDivisor(3, 1), t.enableVertexAttribArray(4), t.vertexAttribPointer(4, 1, t.FLOAT, !1, k, 24), t.vertexAttribDivisor(4, 1), this.fadeVao = t.createVertexArray(), !this.fadeVao) throw new Error("Failed to create fade VAO");
    t.bindVertexArray(this.fadeVao), t.bindBuffer(t.ARRAY_BUFFER, this.quadBuffer), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.disable(t.DEPTH_TEST), t.disable(t.CULL_FACE), t.enable(t.BLEND), this.firstFrame = !0, this.lastWidth = -1, this.lastHeight = -1, this.lastBloom = -1, this.lastVignette = -1, this.lastFadeAlpha = -1;
  }
  createProgram(t, e) {
    const i = this.gl, a = i.createShader(i.VERTEX_SHADER);
    if (!a) throw new Error("Failed to create vertex shader");
    if (i.shaderSource(a, t), i.compileShader(a), !i.getShaderParameter(a, i.COMPILE_STATUS)) {
      const o = i.getShaderInfoLog(a) || "Unknown vertex shader error";
      throw i.deleteShader(a), new Error(`Vertex shader compile error: ${o}`);
    }
    const s = i.createShader(i.FRAGMENT_SHADER);
    if (!s)
      throw i.deleteShader(a), new Error("Failed to create fragment shader");
    if (i.shaderSource(s, e), i.compileShader(s), !i.getShaderParameter(s, i.COMPILE_STATUS)) {
      const o = i.getShaderInfoLog(s) || "Unknown fragment shader error";
      throw i.deleteShader(a), i.deleteShader(s), new Error(`Fragment shader compile error: ${o}`);
    }
    const n = i.createProgram();
    if (!n)
      throw i.deleteShader(a), i.deleteShader(s), new Error("Failed to create program");
    if (i.attachShader(n, a), i.attachShader(n, s), i.linkProgram(n), i.deleteShader(a), i.deleteShader(s), !i.getProgramParameter(n, i.LINK_STATUS)) {
      const o = i.getProgramInfoLog(n) || "Unknown program link error";
      throw i.deleteProgram(n), new Error(`Program link error: ${o}`);
    }
    return n;
  }
  render(t, e, i, a) {
    if (!this.program || !this.fadeProgram || !this.vao || !this.fadeVao || !this.instanceBuffer || this.isContextLost)
      return;
    const s = this.gl;
    s.viewport(0, 0, e, i), this.firstFrame && (s.clearColor(J, Q, Z, 1), s.clear(s.COLOR_BUFFER_BIT), this.firstFrame = !1);
    const n = Math.max(0, Math.min(a.trailStrength, 1)), o = Math.min(Math.max(1 - n, 0.04), 0.92);
    s.useProgram(this.fadeProgram), s.bindVertexArray(this.fadeVao), o !== this.lastFadeAlpha && (s.uniform1f(this.uFadeAlphaLoc, o), this.lastFadeAlpha = o), s.blendFunc(s.SRC_ALPHA, s.ONE_MINUS_SRC_ALPHA), s.drawArrays(s.TRIANGLE_STRIP, 0, 4);
    const l = Math.min(t.length, this.maxParticles);
    let c = 0;
    for (let S = 0; S < l; S++) {
      const d = t[S], _ = d.vx * d.vx + d.vy * d.vy, B = ((d.hue + Math.min(_ * 1.25, 60) | 0) % 360 + 360) % 360 * 3;
      this.instanceData[c++] = d.x, this.instanceData[c++] = d.y, this.instanceData[c++] = d.size, this.instanceData[c++] = this.huePalette[B], this.instanceData[c++] = this.huePalette[B + 1], this.instanceData[c++] = this.huePalette[B + 2], this.instanceData[c++] = d.life > 0 ? d.life / d.maxLife : 0;
    }
    s.bindBuffer(s.ARRAY_BUFFER, this.instanceBuffer), s.bufferData(s.ARRAY_BUFFER, this.instanceData.byteLength, s.DYNAMIC_DRAW), s.bufferSubData(s.ARRAY_BUFFER, 0, this.instanceData.subarray(0, l * L)), s.useProgram(this.program), s.bindVertexArray(this.vao), (e !== this.lastWidth || i !== this.lastHeight) && (s.uniform2f(this.uResolutionLoc, e, i), this.lastWidth = e, this.lastHeight = i);
    const h = a.bloom ? 1 : 0;
    h !== this.lastBloom && (s.uniform1f(this.uBloomLoc, h), this.lastBloom = h);
    const P = a.vignette ? 1 : 0;
    P !== this.lastVignette && (s.uniform1f(this.uVignetteLoc, P), this.lastVignette = P), a.bloom ? s.blendFunc(s.ONE, s.ONE) : s.blendFunc(s.ONE, s.ONE_MINUS_SRC_ALPHA), s.drawArraysInstanced(s.TRIANGLE_STRIP, 0, 4, l), s.bindVertexArray(null);
  }
  resizeMaxParticles(t) {
    if (t !== this.maxParticles && (this.maxParticles = t, this.instanceData = new Float32Array(t * L), this.instanceBuffer)) {
      const e = this.gl;
      e.bindBuffer(e.ARRAY_BUFFER, this.instanceBuffer), e.bufferData(e.ARRAY_BUFFER, this.instanceData.byteLength, e.DYNAMIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null);
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
function mt(u, t) {
  return t === "canvas2d" ? "canvas2d" : t === "webgl2" || u.getContext("webgl2", {
    antialias: !1,
    preserveDrawingBuffer: !1,
    alpha: !0,
    premultipliedAlpha: !0,
    powerPreference: "high-performance"
  }) ? "webgl2" : "canvas2d";
}
function tt(u, t, e) {
  const i = mt(u, e);
  if (i === "webgl2")
    try {
      return {
        renderer: new gt(u, t),
        backend: i
      };
    } catch {
      return {
        renderer: new K(u, t),
        backend: "canvas2d"
      };
    }
  return {
    renderer: new K(u, t),
    backend: i
  };
}
const et = [];
class vt {
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
  hash(t, e) {
    return t * 73856093 ^ e * 19349663 | 0;
  }
  add(t) {
    const e = this.toGridCoord(t.x), i = this.toGridCoord(t.y), a = this.hash(e, i);
    let s = this.grid.get(a);
    s || (s = [], this.grid.set(a, s)), s.push(t);
  }
  getNeighbors(t) {
    const e = this.toGridCoord(t.x), i = this.toGridCoord(t.y), a = [];
    for (let s = e - 1; s <= e + 1; s++)
      for (let n = i - 1; n <= i + 1; n++) {
        const o = this.grid.get(this.hash(s, n));
        if (o)
          for (let l = 0; l < o.length; l++) {
            const c = o[l];
            c !== t && a.push(c);
          }
      }
    return a.length > 0 ? a : et;
  }
  getNeighborsInto(t, e) {
    e.length = 0;
    const i = this.toGridCoord(t.x), a = this.toGridCoord(t.y);
    for (let s = i - 1; s <= i + 1; s++)
      for (let n = a - 1; n <= a + 1; n++) {
        const o = this.grid.get(this.hash(s, n));
        if (o)
          for (let l = 0; l < o.length; l++) {
            const c = o[l];
            c !== t && e.push(c);
          }
      }
  }
  getCellParticlesAt(t, e) {
    const i = this.toGridCoord(t), a = this.toGridCoord(e);
    return this.grid.get(this.hash(i, a)) ?? et;
  }
}
class pt {
  constructor(t) {
    r(this, "worker");
    r(this, "listener");
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
    `, i = new Blob([e], { type: "application/javascript" }), a = URL.createObjectURL(i);
    this.worker = new Worker(a), URL.revokeObjectURL(a), this.listener = (s) => {
      t(s.data);
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
const xt = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
function it() {
  if (typeof WebAssembly > "u")
    return !1;
  try {
    return WebAssembly.validate(xt);
  } catch {
    return !1;
  }
}
function st(u) {
  return u === "js" ? "js" : it() ? "wasm" : "js";
}
const M = {
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
}, rt = {
  bloom: !0,
  trailStrength: 0.72,
  vignette: !1
}, yt = 4294967296;
class bt {
  constructor(t) {
    r(this, "state");
    r(this, "initialSeed");
    const e = t >>> 0;
    this.state = e || 1, this.initialSeed = e || 1;
  }
  next() {
    this.state += 1831565813;
    let t = this.state;
    return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / yt;
  }
  setSeed(t) {
    const e = t >>> 0;
    this.initialSeed = e || 1, this.state = this.initialSeed;
  }
  getSeed() {
    return this.initialSeed;
  }
}
const At = 200, Pt = [];
class Ct {
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
    r(this, "renderBackend");
    r(this, "simulationBackend");
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
    r(this, "postProcessing");
    r(this, "frameCount", 0);
    r(this, "frameIndex", 0);
    r(this, "lastTime", performance.now());
    r(this, "lastFpsTime", performance.now());
    r(this, "lastUiUpdate", performance.now());
    r(this, "fps", 0);
    r(this, "random", null);
    r(this, "seededRandom", null);
    r(this, "pluginsById", /* @__PURE__ */ new Map());
    r(this, "forcePlugins", []);
    r(this, "constraintPlugins", []);
    r(this, "framePlugins", []);
    r(this, "pluginFrameContext", {
      config: M,
      canvasWidth: 0,
      canvasHeight: 0,
      dt: 0,
      frame: 0,
      now: 0
    });
    r(this, "pluginParticleContext", {
      config: M,
      canvasWidth: 0,
      canvasHeight: 0,
      dt: 0,
      frame: 0,
      now: 0,
      pointerX: null,
      pointerY: null
    });
    r(this, "animate", (t) => {
      if (this.running) {
        if (this.paused)
          this.lastTime = t;
        else {
          const e = Math.min((t - this.lastTime) / 16.666, 3);
          this.lastTime = t, this.frameIndex++;
          const { x: i, y: a } = this.pointer;
          this.grid.clear();
          for (let o = 0; o < this.particles.length; o++)
            this.grid.add(this.particles[o]);
          const s = this.config.flocking || this.config.collisions;
          this.updatePluginContexts(e, t, i, a), this.runFrameStartPlugins();
          for (let o = this.particles.length - 1; o >= 0; o--) {
            const l = this.particles[o];
            let c = Pt;
            s ? (this.grid.getNeighborsInto(l, this.neighborsBuffer), c = this.neighborsBuffer) : this.neighborsBuffer.length = 0, this.runForcePlugins(l), this.simulationBackend === "wasm" ? this.updateParticleWasmPath(l, c, i, a, e) : this.updateParticleJsPath(l, c, i, a, e), this.runConstraintPlugins(l), l.isDead() && this.particles.splice(o, 1);
          }
          this.runFrameEndPlugins(), this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.postProcessing), this.redrawOverlay(), this.frameCount++;
          const n = t - this.lastFpsTime;
          n >= 1e3 && (this.fps = Math.round(this.frameCount * 1e3 / n), this.frameCount = 0, this.lastFpsTime = t), t - this.lastUiUpdate >= At && (this.lastUiUpdate = t, this.emitStats());
        }
        this.requestId = requestAnimationFrame(this.animate);
      }
    });
    var a, s, n;
    this.canvas = t.canvas, this.overlayCanvas = t.overlayCanvas, this.overlayCtx = ((a = this.overlayCanvas) == null ? void 0 : a.getContext("2d")) ?? null, this.maxParticles = t.maxParticles ?? 5e4, this.spawnBatch = t.spawnBatch ?? 100, this.maxDpr = t.maxDpr ?? 2, this.executionMode = t.executionMode ?? "main-thread", this.onStats = t.onStats, this.config = {
      ...M,
      ...t.config
    }, this.postProcessing = {
      ...rt,
      ...t.postProcessing,
      bloom: ((s = t.config) == null ? void 0 : s.bloom) ?? ((n = t.postProcessing) == null ? void 0 : n.bloom) ?? rt.bloom
    }, this.grid = new vt(t.gridCellSize ?? 40);
    const { renderer: e, backend: i } = tt(this.canvas, this.maxParticles, t.renderBackend ?? "auto");
    this.renderer = e, this.renderBackend = i, this.simulationBackend = st(t.simulationBackend ?? "auto"), this.configureRandom(t.seed), this.resize(), this.redrawOverlay();
  }
  start() {
    if (!this.running) {
      if (this.running = !0, this.lastTime = performance.now(), this.lastFpsTime = this.lastTime, this.lastUiUpdate = this.lastTime, this.executionMode === "worker-ticker" && typeof Worker < "u") {
        this.workerTicker = new pt((t) => {
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
    this.stop(), this.clearPlugins(), this.renderer.dispose();
  }
  resize() {
    const t = Math.min(window.devicePixelRatio || 1, this.maxDpr), e = this.canvas.getBoundingClientRect(), i = Math.max(1, Math.floor(e.width)), a = Math.max(1, Math.floor(e.height)), s = Math.max(1, Math.floor(i * t)), n = Math.max(1, Math.floor(a * t));
    (this.canvas.width !== s || this.canvas.height !== n) && (this.canvas.width = s, this.canvas.height = n, this.canvas.style.width = `${i}px`, this.canvas.style.height = `${a}px`), this.overlayCanvas && (this.overlayCanvas.width !== s || this.overlayCanvas.height !== n) && (this.overlayCanvas.width = s, this.overlayCanvas.height = n, this.overlayCanvas.style.width = `${i}px`, this.overlayCanvas.style.height = `${a}px`, this.overlayDirty = !0), this.overlayCtx && (this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0), this.overlayCtx.scale(t, t));
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
    const { renderer: e, backend: i } = tt(this.canvas, this.maxParticles, t);
    this.renderer.dispose(), this.renderer = e, this.renderBackend = i;
  }
  getSimulationBackend() {
    return this.simulationBackend;
  }
  setSimulationBackend(t) {
    this.simulationBackend = st(t);
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
    if (this.particles.length >= this.maxParticles) return;
    const i = [
      "rgba(102, 138, 255, 1)",
      "rgba(156, 135, 188, 1)",
      "rgba(52, 211, 153, 1)"
    ], a = this.maxParticles - this.particles.length, s = a < this.spawnBatch ? a : this.spawnBatch;
    for (let n = 0; n < s; n++) {
      const o = this.getRandom(), l = i[o() * i.length | 0];
      this.particles.push(new dt(t, e, l, this.config, o));
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
    this.obstacles.push(new ht(t, e)), this.overlayDirty = !0;
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
    return e ? (this.pluginsById.delete(t), this.forcePlugins = this.forcePlugins.filter((a) => a.id !== t), this.constraintPlugins = this.constraintPlugins.filter((a) => a.id !== t), this.framePlugins = this.framePlugins.filter((a) => a.id !== t), (i = e.onUnregister) == null || i.call(e), !0) : !1;
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
  updateParticleJsPath(t, e, i, a, s) {
    t.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      i,
      a,
      e,
      this.obstacles,
      s
    );
  }
  updateParticleWasmPath(t, e, i, a, s) {
    t.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      i,
      a,
      e,
      this.obstacles,
      s
    );
  }
  updatePluginContexts(t, e, i, a) {
    this.pluginFrameContext = {
      config: this.config,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      dt: t,
      frame: this.frameIndex,
      now: e
    }, this.pluginParticleContext = {
      ...this.pluginFrameContext,
      pointerX: i,
      pointerY: a
    };
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
    var e;
    !this.onStats && !t || (e = this.onStats) == null || e.call(this, {
      particleCount: this.particles.length,
      fps: this.fps
    });
  }
  configureRandom(t) {
    if (typeof t != "number") {
      this.seededRandom = null, this.random = null;
      return;
    }
    this.seededRandom = new bt(t), this.random = () => this.seededRandom.next();
  }
  getRandom() {
    return this.random ?? Math.random;
  }
}
export {
  K as Canvas2DRenderer,
  rt as DEFAULT_POST_PROCESSING,
  M as DEFAULT_SIM_CONFIG,
  Ct as GritEngine,
  ht as Obstacle,
  dt as Particle,
  vt as SpatialGrid,
  gt as WebGLRenderer
};
