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
