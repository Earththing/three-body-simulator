// node test/physics.test.js — checks the integrator against known results.
const assert = require("assert");
const { ThreeBody: T } = require("../src/physics.js");
function run(key, tEnd) {
  const p = T.presets[key](), s = new T.System(p.state, p.masses), E0 = s.energy(), s0 = Float64Array.from(s.s);
  s.advanceTo(tEnd, 1e7);
  const ret = Math.max(...s.s.map((v, i) => Math.abs(v - s0[i])));
  return { s, ret, dE: Math.abs((s.energy() - E0) / E0) };
}
let r = run("figure8", 6.32591398);
assert(r.ret < 1e-6, "figure-eight closes after one period: " + r.ret);
assert(r.dE < 1e-9, "figure-eight energy conserved");
r = run("lagrangeEqual", 2 * Math.PI / Math.sqrt(3 / 1.6 ** 3));
assert(r.ret < 1e-8, "Lagrange triangle returns after one rotation");
r = run("euler", 2 * Math.PI / Math.sqrt(5 / 4));
assert(r.ret < 1e-8, "Euler line returns after one rotation");
// Pythagorean problem: Szebehely & Peters (1967) — mass 3 (index 0) is ejected.
const p = T.presets.pythagorean(), s = new T.System(p.state, p.masses), E0 = s.energy();
let esc = -1; while (s.t < 100 && esc < 0) { s.advanceTo(s.t + 0.5, 1e7); esc = T.escaped(s); }
assert.strictEqual(esc, 0, "Pythagorean: lightest body ejected");
assert(Math.abs((s.energy() - E0) / E0) < 1e-6, "Pythagorean energy conserved through close encounters");
console.log("all physics tests passed; Pythagorean ejection detected at t =", s.t);

// Planet diagnostics.
{
  // A lone sun with a circular planet at 1 AU is stable; inside the sun it has collided.
  const sys = new T.System([0, 0, 0, 0, 1, 0, 0, 1], [1, 3e-6]);
  assert.strictEqual(T.planetStatus(sys, 1, [0]).state, "stable");
  // Dropped from rest it falls in, merges into the sun, and momentum is conserved.
  const fall = new T.System([0, 0, 0, 0, 0.5, 0, 0, 0], [1, 3e-6], { radii: [T.starRadius(1), 4.26e-5] });
  fall.advancePast(1);
  assert.strictEqual(fall.events.length, 1, "one merger");
  const st = T.planetStatus(fall, 1, [0]);
  assert.strictEqual(st.state, "collided"); assert.strictEqual(st.host, 0);
  assert(Math.abs(fall.m[0] - (1 + 3e-6)) < 1e-15 && Math.abs(fall.s[2]) < 1e-12, "mass and momentum conserved in merger");
}
{
  // Real α Centauri: a planet 1.23 AU from A stays in one stable era for 200 years (B is never closer than ~11 AU).
  const p = T.presets.alphaCentauri(), s = new T.System(p.state, p.masses), eras = new T.EraTracker(3);
  while (s.t < 2 * Math.PI * 200) { s.advanceTo(s.t + 0.5, 1e7); eras.update(s.t, T.planetStatus(s, 3, [0, 1, 2])); }
  assert.strictEqual(eras.eras.length, 1, "α Cen planet: one era");
  assert.strictEqual(eras.eras[0].state, "stable");
  assert.strictEqual(eras.eras[0].host, 0, "α Cen planet orbits A");
}
{
  // Removing a body stops it interacting and keeps energy bookkeeping consistent.
  const p = T.presets.threeSuns(), s = new T.System(p.state, p.masses);
  s.remove(3); const E0 = s.energy(); s.advanceTo(20, 1e7);
  assert(Math.abs((s.energy() - E0) / E0) < 1e-8, "energy conserved after removing the planet");
}
{
  // advancePast gives the same trajectory whatever targets it is asked for.
  const p = T.presets.pythagorean(), a = new T.System(p.state, p.masses), b = new T.System(p.state, p.masses);
  a.advancePast(30);
  for (let t = 0.0137; t < 30; t += 0.0137) b.advancePast(t);
  b.advancePast(30);
  assert.strictEqual(a.t, b.t); assert.deepStrictEqual(Array.from(a.s), Array.from(b.s), "frame-independent trajectory");
}
console.log("planet tests passed");
