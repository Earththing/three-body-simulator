#!/usr/bin/env node
// Survey: how long does a planet last among three comparable suns?
//
//   node tools/novel-survey.js [runs=400] [seed=7] [years=150]
//
// Reproduces the statistics in docs/three-body-novel.md. Each run draws a random bound system of three suns
// (1.0, 0.9, 0.8 M☉, spread over 6–16 AU), puts an Earth-mass planet on a circular orbit 1 AU from one of them,
// and integrates until the planet is ejected or falls into a sun, or the time limit is reached. It uses the same
// integrator, status sampling (every 0.25 time units ≈ 14.5 days) and era rules as the page. 400 runs take a few
// minutes. Pass --json to also write every run's starting state and era list to survey-runs.json.

const T = require("../src/physics.js").ThreeBody;

const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
const RUNS = +(args[0] || 400), SEED = +(args[1] || 7), YEARS = +(args[2] || 150);
const WRITE_JSON = process.argv.includes("--json");

let seed = SEED;
const rand = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };   // Park–Miller, reproducible

const SUNS = [1.0, 0.9, 0.8], PLANET = 3e-6, YR = 2 * Math.PI, GRID = 0.25, HOLD = 3;
const radii = SUNS.map(T.starRadius).concat(4.26e-5);
const isStable = e => e.state === "stable" || e.state === "circumbinary";

const runs = [];
for (let r = 0; r < RUNS; r++) {
  const runSeed = seed;
  const L = 6 + 10 * rand(), host = Math.floor(rand() * 3);
  const s = [...T.randomBound(rand, SUNS).state];
  for (let i = 0; i < 3; i++) { s[4*i] *= L; s[4*i+1] *= L; s[4*i+2] /= Math.sqrt(L); s[4*i+3] /= Math.sqrt(L); }
  const ph = 2 * Math.PI * rand(), v = Math.sqrt(SUNS[host]);
  s.push(s[4*host] + Math.cos(ph), s[4*host+1] + Math.sin(ph), s[4*host+2] - v * Math.sin(ph), s[4*host+3] + v * Math.cos(ph));
  const m = [...SUNS, PLANET];
  T.toCOM(s, m);
  const start = s.slice();

  const sys = new T.System(s, m, { radii }), eras = new T.EraTracker(HOLD), buf = new Float64Array(16);
  const view = { s: buf, m: sys.m, alive: sys.alive, mergedInto: sys.mergedInto };
  let end = "survived", sunsBrokeUp = null, t = 0;
  while (t < YEARS * YR && sys.attempts < 3e6) {
    t += GRID; sys.advancePast(t, 3e6); sys.stateAt(t, buf);
    const st = T.planetStatus(view, 3, [0, 1, 2]);
    eras.update(t, st);
    if (sunsBrokeUp === null && T.escaped({ s: buf, m: sys.m }) >= 0) sunsBrokeUp = t / YR;
    if (st.state === "ejected" || st.state === "collided") { end = st.state; break; }
  }
  if (end === "survived" && t < YEARS * YR - 1) end = "step budget";
  const stableTime = eras.eras.filter(isStable).reduce((a, e) => a + e.t1 - e.t0, 0);
  runs.push({
    seed: runSeed, start, end, years: t / YR, sunsBrokeUp, stableFraction: stableTime / t,
    stableEras: eras.eras.filter(e => isStable(e) && e.t1 - e.t0 > 1.5 * YR).length,
    final: eras.current().state,
    eras: eras.eras.map(e => ({ state: e.state, host: e.host, host2: e.host2, from: e.t0 / YR, to: e.t1 / YR })),
  });
}

const lost = runs.filter(r => r.end === "ejected" || r.end === "collided");
const life = runs.map(r => (lost.includes(r) ? r.years : Infinity)).sort((a, b) => a - b);
const q = f => life[Math.min(life.length - 1, Math.floor(f * life.length))];
const pct = n => (100 * n / runs.length).toFixed(0) + "%";
const fmt = x => (x === Infinity ? `>${YEARS}` : x.toFixed(1));
const median = xs => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : NaN; };

console.log(`${RUNS} systems, seed ${SEED}, up to ${YEARS} years each\n`);
console.log("Outcome:");
for (const k of ["ejected", "collided", "survived", "step budget"]) console.log(`  ${k.padEnd(12)} ${runs.filter(r => r.end === k).length}`);
console.log(`\nPlanet lifetime (years): median ${fmt(q(0.5))}, quartiles ${fmt(q(0.25))} – ${fmt(q(0.75))}`);
for (const y of [10, 25, 50, 100, YEARS]) console.log(`  lost within ${String(y).padStart(3)} yr: ${pct(life.filter(x => x <= y).length)}`);
console.log(`\nStable eras (longer than 1.5 yr) before a lost planet was lost: median ${median(lost.map(r => r.stableEras))}, max ${Math.max(...lost.map(r => r.stableEras))}`);
const hist = {}; lost.forEach(r => { hist[r.stableEras] = (hist[r.stableEras] || 0) + 1; });
console.log("  " + Object.keys(hist).sort((a, b) => a - b).map(k => `${k}: ${hist[k]}`).join(", "));
console.log(`Lost planets that went before the suns themselves broke up: ${lost.filter(r => r.sunsBrokeUp === null || r.sunsBrokeUp >= r.years - 0.01).length} of ${lost.length}`);
const surv = runs.filter(r => r.end === "survived");
console.log(`\nSurvivors at ${YEARS} yr: ${surv.length}`);
for (const k of ["stable", "circumbinary", "chaotic"]) console.log(`  final era ${k.padEnd(12)} ${surv.filter(r => r.final === k).length}`);
console.log(`  suns had broken up (one escaping) ${surv.filter(r => r.sunsBrokeUp !== null).length}`);

if (WRITE_JSON) { require("fs").writeFileSync("survey-runs.json", JSON.stringify(runs)); console.log("\nwrote survey-runs.json"); }
