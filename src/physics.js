function ThreeBodyPhysics(root) {
  "use strict";
  const G = 1;
  // Dormand–Prince 5(4) tableau
  const A = [[],[1/5],[3/40,9/40],[44/45,-56/15,32/9],
    [19372/6561,-25360/2187,64448/6561,-212/729],
    [9017/3168,-355/33,46732/5247,49/176,-5103/18656],
    [35/384,0,500/1113,125/192,-2187/6784,11/84]];
  const B = [35/384,0,500/1113,125/192,-2187/6784,11/84,0];
  const BS = [5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
  const E = B.map((b,i)=>b-BS[i]);

  // state layout: for body i: [x, y, vx, vy] at 4i
  function deriv(s, m, out) {
    const n = m.length;
    for (let i = 0; i < n; i++) { out[4*i] = s[4*i+2]; out[4*i+1] = s[4*i+3]; out[4*i+2] = 0; out[4*i+3] = 0; }
    for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
      const dx = s[4*j]-s[4*i], dy = s[4*j+1]-s[4*i+1];
      const r2 = dx*dx+dy*dy, inv = 1/(r2*Math.sqrt(r2));
      out[4*i+2] += G*m[j]*dx*inv; out[4*i+3] += G*m[j]*dy*inv;
      out[4*j+2] -= G*m[i]*dx*inv; out[4*j+3] -= G*m[i]*dy*inv;
    }
  }

  function System(state, masses, opts) {
    opts = opts || {};
    this.s = Float64Array.from(state);
    this.m = masses.slice();
    this.t = 0;
    this.h = 1e-3;
    this.tol = opts.tol || 1e-11;
    const L = this.s.length;
    this.k = Array.from({length:7}, ()=>new Float64Array(L));
    this.tmp = new Float64Array(L);
    this.y5 = new Float64Array(L);
    this.steps = 0;
    this.attempts = 0;
  }
  // one adaptive step, never past tMax. returns true if accepted
  System.prototype.tryStep = function (tMax) {
    const s = this.s, k = this.k, tmp = this.tmp, y5 = this.y5, L = s.length, m = this.m;
    this.attempts++;
    let h = Math.min(this.h, tMax - this.t);
    const clipped = h < this.h;
    deriv(s, m, k[0]);
    for (let st = 1; st < 7; st++) {
      const a = A[st];
      for (let q = 0; q < L; q++) { let acc = 0; for (let p = 0; p < st; p++) acc += a[p]*k[p][q]; tmp[q] = s[q] + h*acc; }
      deriv(tmp, m, k[st]);
    }
    let err = 0;
    for (let q = 0; q < L; q++) {
      let acc = 0, e = 0;
      for (let p = 0; p < 7; p++) { acc += B[p]*k[p][q]; e += E[p]*k[p][q]; }
      y5[q] = s[q] + h*acc;
      const sc = this.tol*(1 + Math.max(Math.abs(s[q]), Math.abs(y5[q])));
      const r = Math.abs(h*e)/sc; if (r > err) err = r;
    }
    const fac = err === 0 ? 5 : Math.min(5, Math.max(0.2, 0.9*Math.pow(err, -0.2)));
    if (err <= 1) {
      s.set(y5); this.t += h; this.steps++;
      if (!clipped) this.h = h*fac;           // don't let the landing step shrink h
      else if (fac < 1) this.h = h*fac;
      return true;
    }
    this.h = h*fac;
    return false;
  };
  System.prototype.advanceTo = function (tTarget, maxSteps) {
    maxSteps = maxSteps || 2e5; let n = 0;
    while (this.t < tTarget - 1e-14 && n++ < maxSteps) {
      this.tryStep(tTarget);
      if (this.h < 1e-13) this.h = 1e-13;
    }
    return this.t >= tTarget - 1e-14;
  };
  System.prototype.energy = function () {
    const s = this.s, m = this.m, n = m.length; let K = 0, U = 0;
    for (let i = 0; i < n; i++) {
      K += 0.5*m[i]*(s[4*i+2]**2 + s[4*i+3]**2);
      for (let j = i+1; j < n; j++) U -= G*m[i]*m[j]/Math.hypot(s[4*j]-s[4*i], s[4*j+1]-s[4*i+1]);
    }
    return K + U;
  };
  System.prototype.angMom = function () {
    const s = this.s, m = this.m; let Lz = 0;
    for (let i = 0; i < m.length; i++) Lz += m[i]*(s[4*i]*s[4*i+3] - s[4*i+1]*s[4*i+2]);
    return Lz;
  };
  System.prototype.clone = function () {
    const c = new System(this.s, this.m, {tol:this.tol}); c.t = this.t; c.h = this.h; return c;
  };

  // shift to centre-of-mass frame
  function toCOM(s, m) {
    let M = 0, X = 0, Y = 0, VX = 0, VY = 0;
    for (let i = 0; i < m.length; i++) { M += m[i]; X += m[i]*s[4*i]; Y += m[i]*s[4*i+1]; VX += m[i]*s[4*i+2]; VY += m[i]*s[4*i+3]; }
    for (let i = 0; i < m.length; i++) { s[4*i] -= X/M; s[4*i+1] -= Y/M; s[4*i+2] -= VX/M; s[4*i+3] -= VY/M; }
    return s;
  }
  // rigid rotation of a central configuration: v = omega x r (COM frame)
  function rotating(pos, m, omega) {
    const s = [];
    pos.forEach(p => s.push(p[0], p[1], 0, 0));
    toCOM(s, m);
    for (let i = 0; i < m.length; i++) { s[4*i+2] = -omega*s[4*i+1]; s[4*i+3] = omega*s[4*i]; }
    return s;
  }
  function lagrange(m, side) {
    const M = m[0]+m[1]+m[2], h = side*Math.sqrt(3)/2;
    return rotating([[-side/2, -h/3], [side/2, -h/3], [0, 2*h/3]], m, Math.sqrt(G*M/side**3));
  }
  // Šuvakov–Dmitrašinović style: x1=(-1,0), x2=(1,0), x3=(0,0), v1=v2=(p1,p2), v3=-2(p1,p2)
  function sd(p1, p2) { return [-1,0,p1,p2, 1,0,p1,p2, 0,0,-2*p1,-2*p2]; }

  // Hierarchical: a heavy body, a planet, and a moon around the planet
  function hierarchical() {
    const m = [1, 0.02, 0.0004];
    const a = 1, va = Math.sqrt(G*(m[0]+m[1])/a);
    const am = 0.08, vm = Math.sqrt(G*m[1]/am);
    const s = [0,0,0,0, a,0,0,va, a+am,0,0,va+vm];
    return { state: toCOM(s, m), masses: m };
  }

  function randomBound(rand, masses) {
    rand = rand || Math.random;
    const m = masses || [1,1,1];
    const s = [];
    for (let i = 0; i < 3; i++) {
      const r = Math.sqrt(rand()), th = 2*Math.PI*rand();
      s.push(r*Math.cos(th), r*Math.sin(th), rand()-0.5, rand()-0.5);
    }
    toCOM(s, m);
    // scale velocities so kinetic = 0.3 |U|  (bound: E < 0)
    let K = 0, U = 0;
    for (let i = 0; i < 3; i++) { K += 0.5*m[i]*(s[4*i+2]**2+s[4*i+3]**2); for (let j = i+1; j < 3; j++) U -= G*m[i]*m[j]/Math.hypot(s[4*j]-s[4*i], s[4*j+1]-s[4*i+1]); }
    const f = Math.sqrt(0.3*Math.abs(U)/Math.max(K,1e-12));
    for (let i = 0; i < 3; i++) { s[4*i+2] *= f; s[4*i+3] *= f; }
    return { state: s, masses: m };
  }

  // Has one body escaped? Returns its index or -1.
  function escaped(sys) {
    const s = sys.s, m = sys.m;
    for (let i = 0; i < 3; i++) {
      const j = (i+1)%3, k = (i+2)%3, mb = m[j]+m[k];
      const bx = (m[j]*s[4*j]+m[k]*s[4*k])/mb, by = (m[j]*s[4*j+1]+m[k]*s[4*k+1])/mb;
      const bvx = (m[j]*s[4*j+2]+m[k]*s[4*k+2])/mb, bvy = (m[j]*s[4*j+3]+m[k]*s[4*k+3])/mb;
      const rx = s[4*i]-bx, ry = s[4*i+1]-by, vx = s[4*i+2]-bvx, vy = s[4*i+3]-bvy;
      const r = Math.hypot(rx, ry), sep = Math.hypot(s[4*j]-s[4*k], s[4*j+1]-s[4*k+1]);
      if (r < 8*sep || rx*vx+ry*vy <= 0) continue;
      const mu = m[i]*mb/(m[i]+mb);
      if (0.5*mu*(vx*vx+vy*vy) - G*m[i]*mb/r > 0) return i;
    }
    return -1;
  }

  const presets = {
    pythagorean: () => ({ state: toCOM([1,3,0,0, -2,-1,0,0, 1,-1,0,0], [3,4,5]), masses: [3,4,5] }),
    figure8: () => ({ state: [-0.97000436,0.24308753, 0.466203685,0.43236573,
                               0.97000436,-0.24308753, 0.466203685,0.43236573,
                               0,0, -0.93240737,-0.86473146], masses: [1,1,1] }),
    butterfly: () => ({ state: sd(0.30689, 0.12551), masses: [1,1,1] }),
    moth: () => ({ state: sd(0.46444, 0.39606), masses: [1,1,1] }),
    lagrangeEqual: () => ({ state: lagrange([1,1,1], 1.6), masses: [1,1,1] }),
    lagrangeTrojan: () => ({ state: lagrange([1,0.01,0.0001], 1.6), masses: [1,0.01,0.0001] }),
    euler: () => { const m=[1,1,1], d=1, w=Math.sqrt(5*G/(4*d**3)); return { state: rotating([[-d,0],[0,0],[d,0]], m, w), masses: m }; },
    hierarchical,
  };

  root.ThreeBody = { System, presets, randomBound, escaped, toCOM, G };
}
if (typeof module !== "undefined") ThreeBodyPhysics(module.exports); else if (typeof window !== "undefined") ThreeBodyPhysics(window);
