# Three-Body Lab

An interactive gravity simulator that shows what the three-body problem is, why it has no general closed-form solution, and what *has* been solved:

- **Exact special solutions**: Euler's collinear line (1767), Lagrange's equilateral triangle (1772), in unstable and stable (Trojan) forms.
- **Periodic orbits found by computer**: the figure-eight (Moore 1993, Chenciner & Montgomery 2000), and butterfly and moth (Šuvakov & Dmitrašinović 2013).
- **Chaos**: Burrau's Pythagorean problem and random starts. Every run has a shadow copy offset by 10⁻ⁿ, with a live plot of how fast the two diverge and where prediction breaks down.
- **The statistical solution** (Stone & Leigh 2019): run hundreds of random encounters in a background thread and tally which body gets ejected.

Open `index.html` in a browser. It is self-contained apart from Google Fonts.

## Layout

| Path | What |
|---|---|
| `src/physics.js` | N-body integrator (adaptive Dormand–Prince 5(4), no softening), presets, escape detection |
| `src/page.html` | UI, canvas rendering, ensemble worker |
| `build.sh` | Inlines physics into the page → `index.html` (and `dist/fragment.html` without the document wrapper) |
| `test/physics.test.js` | `node test/physics.test.js`: periodic orbits close, energy is conserved, the Pythagorean problem ejects the mass-3 body |

Edit files in `src/`, then run `./build.sh`.
