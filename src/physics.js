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

  // state layout: for body i: [x, y, vx, vy] at 4i. Bodies with alive[i] = 0 are frozen and exert no force.
  function deriv(s, m, out, alive) {
    const n = m.length;
    for (let i = 0; i < n; i++) {
      const on = alive[i];
      out[4*i] = on ? s[4*i+2] : 0; out[4*i+1] = on ? s[4*i+3] : 0; out[4*i+2] = 0; out[4*i+3] = 0;
    }
    for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
      if (!alive[i] || !alive[j]) continue;
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
    this.alive = new Uint8Array(this.m.length).fill(1);
    // For frame-independent runs: the last accepted step, for interpolation (see advancePast / stateAt).
    this.sPrev = Float64Array.from(state); this.tPrev = 0; this.sBak = new Float64Array(L);
    // Optional collision radii. Bodies that touch merge into the heavier one (mass and momentum conserved).
    this.radii = opts.radii || null;
    this.mergedInto = new Int32Array(this.m.length).fill(-1);
    this.events = [];
  }
  // Take a body out of the simulation (e.g. a planet that fell into a star). It stays where it is and stops interacting.
  System.prototype.remove = function (i) { this.alive[i] = 0; };
  // one adaptive step, never past tMax. returns true if accepted
  System.prototype.tryStep = function (tMax) {
    const s = this.s, k = this.k, tmp = this.tmp, y5 = this.y5, L = s.length, m = this.m;
    this.attempts++;
    let h = Math.min(this.h, tMax - this.t);
    const clipped = h < this.h;
    deriv(s, m, k[0], this.alive);
    for (let st = 1; st < 7; st++) {
      const a = A[st];
      for (let q = 0; q < L; q++) { let acc = 0; for (let p = 0; p < st; p++) acc += a[p]*k[p][q]; tmp[q] = s[q] + h*acc; }
      deriv(tmp, m, k[st], this.alive);
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
      if (this.radii) this.checkCollisions();
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
  // Advance with unclipped adaptive steps until t >= tTarget. Unlike advanceTo, the step sequence (and so the
  // trajectory) does not depend on which targets are asked for, so a run is identical however it is displayed.
  System.prototype.advancePast = function (tTarget, maxSteps) {
    maxSteps = maxSteps || 1e5; let n = 0;
    while (this.t < tTarget && n++ < maxSteps) {
      const t0 = this.t; this.sBak.set(this.s);
      if (this.tryStep(Infinity)) { this.sPrev.set(this.sBak); this.tPrev = t0; }
      else if (this.h < 1e-13) this.h = 1e-13;
    }
    return this.t >= tTarget;
  };
  // State at time t within the last step: cubic Hermite in position, linear in velocity.
  System.prototype.stateAt = function (t, out) {
    out = out || new Float64Array(this.s.length);
    const a = this.sPrev, b = this.s, h = this.t - this.tPrev;
    if (h <= 0 || t >= this.t) { out.set(b); return out; }
    const u = Math.max(0, (t - this.tPrev) / h), u2 = u*u, u3 = u2*u;
    const h00 = 2*u3 - 3*u2 + 1, h10 = u3 - 2*u2 + u, h01 = -2*u3 + 3*u2, h11 = u3 - u2;
    for (let i = 0; i < b.length; i += 4) {
      out[i]   = h00*a[i]   + h10*h*a[i+2] + h01*b[i]   + h11*h*b[i+2];
      out[i+1] = h00*a[i+1] + h10*h*a[i+3] + h01*b[i+1] + h11*h*b[i+3];
      out[i+2] = a[i+2] + u*(b[i+2] - a[i+2]);
      out[i+3] = a[i+3] + u*(b[i+3] - a[i+3]);
    }
    return out;
  };
  System.prototype.checkCollisions = function () {
    const R = this.radii, s = this.s, m = this.m, al = this.alive, n = m.length;
    for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
      if (!al[i] || !al[j] || R[i] + R[j] <= 0) continue;
      if (Math.hypot(s[4*j] - s[4*i], s[4*j+1] - s[4*i+1]) >= R[i] + R[j]) continue;
      const hv = m[i] >= m[j] ? i : j, lt = hv === i ? j : i, M = m[i] + m[j];
      for (let q = 0; q < 4; q++) s[4*hv+q] = (m[hv]*s[4*hv+q] + m[lt]*s[4*lt+q]) / M;
      m[hv] = M; al[lt] = 0; this.mergedInto[lt] = hv;
      this.events.push({ t: this.t, body: lt, into: hv });
    }
  };
  System.prototype.energy = function () {
    const s = this.s, m = this.m, n = m.length, a = this.alive; let K = 0, U = 0;
    for (let i = 0; i < n; i++) {
      if (!a[i]) continue;
      K += 0.5*m[i]*(s[4*i+2]**2 + s[4*i+3]**2);
      for (let j = i+1; j < n; j++) if (a[j]) U -= G*m[i]*m[j]/Math.hypot(s[4*j]-s[4*i], s[4*j+1]-s[4*i+1]);
    }
    return K + U;
  };
  System.prototype.angMom = function () {
    const s = this.s, m = this.m; let Lz = 0;
    for (let i = 0; i < m.length; i++) Lz += m[i]*(s[4*i]*s[4*i+3] - s[4*i+1]*s[4*i+2]);
    return Lz;
  };
  System.prototype.clone = function () {
    const c = new System(this.s, this.m, {tol:this.tol}); c.t = this.t; c.h = this.h; c.alive.set(this.alive); return c;
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

  // ---------- planets among several suns (lengths in AU, masses in solar masses, G = 1, so 2π time units = 1 year) ----------
  const R_SUN_AU = 0.00465;
  function starRadius(m) { return R_SUN_AU * Math.pow(m, 0.8); }   // rough main-sequence radius

  // Classify a planet's situation right now. `sys` is a System or a view { s, m, alive, mergedInto }.
  //  stable:       bound to one sun, and the other suns' tidal pull is < stableRatio of that sun's pull
  //  circumbinary: bound to a close pair of suns, well outside the pair, with the third sun's tidal pull small
  //  chaotic:      anything else while still in the system
  //  ejected:      unbound from all the suns together and heading out
  //  collided:     merged into a sun (see System radii)
  function planetStatus(sys, p, stars, stableRatio) {
    stableRatio = stableRatio || 0.01;
    const s = sys.s, m = sys.m, al = sys.alive;
    if (!al[p]) return { state: "collided", host: sys.mergedInto ? sys.mergedInto[p] : -1, rho: 0 };
    const px = s[4*p], py = s[4*p+1], pvx = s[4*p+2], pvy = s[4*p+3];
    let host = -1, rho = Infinity;
    for (const j of stars) {
      if (!al[j]) continue;
      const dx = px - s[4*j], dy = py - s[4*j+1], r = Math.hypot(dx, dy);
      const dvx = pvx - s[4*j+2], dvy = pvy - s[4*j+3];
      if (0.5*(dvx*dvx + dvy*dvy) - G*m[j]/r >= 0) continue;
      let q = 0;
      for (const k of stars) {
        if (k === j || !al[k]) continue;
        const d = Math.hypot(s[4*k] - s[4*j], s[4*k+1] - s[4*j+1]);
        q += 2*m[k]*r*r*r / (m[j]*d*d*d);
      }
      if (q < rho) { rho = q; host = j; }
    }
    if (host >= 0 && rho < stableRatio) return { state: "stable", host, rho };
    // Orbiting a pair of suns from outside (2.5× the pair's separation is roughly the stability limit for such orbits).
    const live = stars.filter(k => al[k]);
    for (let a = 0; a < live.length; a++) for (let b = a+1; b < live.length; b++) {
      const j = live[a], k = live[b], mb = m[j] + m[k];
      const bx = (m[j]*s[4*j] + m[k]*s[4*k]) / mb, by = (m[j]*s[4*j+1] + m[k]*s[4*k+1]) / mb;
      const bvx = (m[j]*s[4*j+2] + m[k]*s[4*k+2]) / mb, bvy = (m[j]*s[4*j+3] + m[k]*s[4*k+3]) / mb;
      const r = Math.hypot(px - bx, py - by), sep = Math.hypot(s[4*j] - s[4*k], s[4*j+1] - s[4*k+1]);
      if (r < 2.5*sep || 0.5*((pvx - bvx)**2 + (pvy - bvy)**2) - G*mb/r >= 0) continue;
      let q = 0;
      for (const l of live) if (l !== j && l !== k) { const d = Math.hypot(s[4*l] - bx, s[4*l+1] - by); q += 2*m[l]*r*r*r / (mb*d*d*d); }
      if (q < stableRatio) return { state: "circumbinary", host: j, host2: k, rho: q };
    }
    let M = 0, X = 0, Y = 0, VX = 0, VY = 0;
    for (const k of stars) { if (!al[k]) continue; M += m[k]; X += m[k]*s[4*k]; Y += m[k]*s[4*k+1]; VX += m[k]*s[4*k+2]; VY += m[k]*s[4*k+3]; }
    X /= M; Y /= M; VX /= M; VY /= M;
    let Rmax = 0, pot = 0;
    for (const k of stars) {
      if (!al[k]) continue;
      Rmax = Math.max(Rmax, Math.hypot(s[4*k] - X, s[4*k+1] - Y));
      pot -= G*m[k] / Math.hypot(px - s[4*k], py - s[4*k+1]);
    }
    const rx = px - X, ry = py - Y, vx = pvx - VX, vy = pvy - VY;
    if (0.5*(vx*vx + vy*vy) + pot > 0 && Math.hypot(rx, ry) > 3*Rmax && rx*vx + ry*vy > 0) return { state: "ejected", host: -1, rho };
    return { state: "chaotic", host, rho };
  }

  // Starlight at the planet, in units of what Earth gets from the Sun.
  function sunlight(sys, p, stars, lum) {
    const s = sys.s; let S = 0;
    stars.forEach((k, i) => { if (sys.alive[k]) S += lum[i] / ((s[4*p] - s[4*k])**2 + (s[4*p+1] - s[4*k+1])**2); });
    return S;
  }

  // Turns noisy instantaneous statuses into eras: a change only counts once it has lasted `hold` time units.
  function EraTracker(hold) { this.hold = hold; this.eras = []; this.cand = null; }
  EraTracker.prototype.update = function (t, st) {
    const key = st.state === "stable" ? "stable:" + st.host : st.state === "circumbinary" ? "cb:" + st.host + "-" + st.host2 : st.state;
    const cur = this.eras[this.eras.length - 1];
    if (!cur) { this.eras.push({ t0: t, t1: t, state: st.state, host: st.host, host2: st.host2, key }); return; }
    if (cur.state === "ejected" || cur.state === "collided") { cur.t1 = t; return; }
    if (key === cur.key) { this.cand = null; cur.t1 = t; return; }
    if (!this.cand || this.cand.key !== key) this.cand = { t0: t, key, state: st.state, host: st.host, host2: st.host2 };
    const terminal = st.state === "ejected" || st.state === "collided";
    if (terminal || t - this.cand.t0 >= this.hold) {
      cur.t1 = this.cand.t0;
      this.eras.push({ t0: this.cand.t0, t1: t, state: this.cand.state, host: this.cand.host, host2: this.cand.host2, key });
      this.cand = null;
    } else cur.t1 = t;
  };
  EraTracker.prototype.current = function () { return this.eras[this.eras.length - 1]; };

  // Real α Centauri: A and B (Pourbaix & Boffin 2016), Proxima (Kervella et al. 2017), and an Earth-like planet
  // at the distance from A where it would get Earth's sunlight. Bodies: A, B, Proxima, planet.
  function alphaCentauri() {
    const mA = 1.133, mB = 0.972, mC = 0.122, mPl = 3e-6, M = mA + mB;
    const Pyr = 79.91, e = 0.524, a = Math.cbrt(M * Pyr * Pyr);         // Kepler III in AU, yr, M☉ → 23.8 AU
    const r = a * (1 + e), v = Math.sqrt(G * M * (1 - e) / (a * (1 + e)));  // start at apastron
    const ax = -mB / M * r, bx = mA / M * r, avy = -mB / M * v, bvy = mA / M * v;
    const aPl = Math.sqrt(1.52), vPl = Math.sqrt(G * mA / aPl);         // L_A ≈ 1.52 L☉ → 1.23 AU
    const aC = 8700, eC = 0.5, rC = aC * (1 + eC), vC = Math.sqrt(G * (M + mC) * (1 - eC) / (aC * (1 + eC)));
    const th = 0.75 * Math.PI;                                          // Proxima near apastron, about 13,000 AU out
    const s = [ax, 0, 0, avy,  bx, 0, 0, bvy,
                rC * Math.cos(th), rC * Math.sin(th), -vC * Math.sin(th), vC * Math.cos(th),
                ax - aPl, 0, 0, avy - vPl];
    const m = [mA, mB, mC, mPl];
    return { state: toCOM(s, m), masses: m, radii: [1.22*R_SUN_AU, 0.86*R_SUN_AU, 0.15*R_SUN_AU, 4.26e-5] };
  }

  // Three comparable suns (1.0, 0.9, 0.8 M☉) and an Earth-mass planet starting 1 AU from the 1.0 M☉ sun.
  // Run 1003911449 of tools/novel-survey.js: the clearest of 400 random starts at showing the novel's alternating
  // stable and chaotic eras. Full precision matters: the system is chaotic. Bodies: sun 1, sun 2, sun 3, planet.
  function threeSuns() {
    const s = [3.768099938331081, 8.571330459105033, -0.17001610717458965, -0.017502257796965126, -7.111120057820148, -9.848057673703977, -0.04009459058191543, -0.11355295554397023, 3.289867268256239, 0.36486944589578113, 0.25762740658397554, 0.14962121936383121, 4.766367353909452, 8.630170640906941, -0.22885628897649743, 0.980765157781405];
    return { state: s, masses: [1.0, 0.9, 0.8, 3e-6], radii: [1.0, 0.9, 0.8].map(starRadius).concat(4.26e-5) };
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
    alphaCentauri,
    threeSuns,
  };

  root.ThreeBody = { System, presets, randomBound, escaped, toCOM, G, planetStatus, sunlight, EraTracker, starRadius };
}
if (typeof module !== "undefined") ThreeBodyPhysics(module.exports); else if (typeof window !== "undefined") ThreeBodyPhysics(window);
