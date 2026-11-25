# References

The sources behind every historical claim, number and starting condition in Three-Body Lab, grouped by topic. Each entry says what the simulator uses it for and how the citation was checked.

## How these were checked

Citations were checked by web search in November 2026 against publisher pages, arXiv, NASA ADS, or reputable secondary accounts. Wikipedia wasn't reachable from the build environment, so it was not used directly.

| Status | Meaning |
|---|---|
| **Checked** | Authors, title, venue and the specific claim were confirmed against a listing found during that search. |
| **Partly checked** | The paper and its claim were confirmed, but some bibliographic details (volume, pages) are from standard citations and weren't re-checked. |
| **Not checked** | A standard citation, included for completeness, that wasn't checked this time. |

Several results are also reproduced numerically by `test/physics.test.js`, which is an independent check on the starting conditions. See the [last section](#reproduced-in-the-simulator).

---

## Why there is no closed-form solution

**Bruns (1887).** H. Bruns, "Über die Integrale des Vielkörperproblems," *Acta Mathematica* 11, 25–96.
- Used for: no algebraic integrals exist beyond the classical ten (energy, momentum, angular momentum, centre-of-mass motion).
- Status: Checked. See the [MacTutor biography of Bruns](https://mathshistory.st-andrews.ac.uk/Biographies/Bruns/).

**Poincaré (1890).** H. Poincaré, "Sur le problème des trois corps et les équations de la dynamique," *Acta Mathematica* 13, 1–270.
- Used for: extending Bruns's result to analytic integrals; the discovery of sensitive dependence on initial conditions (the origin of chaos theory).
- Status: Checked.

**Barrow-Green (1997).** J. Barrow-Green, *Poincaré and the Three Body Problem*, History of Mathematics vol. 11, American Mathematical Society / London Mathematical Society.
- Used for: background on Poincaré's prize memoir and on Sundman. The standard history; recommended further reading.
- Status: Partly checked.

**Sundman (1912).** K. F. Sundman, "Mémoire sur le problème des trois corps," *Acta Mathematica* 36, 105–179.
- Used for: a convergent series solution exists whenever the total angular momentum isn't zero.
- Status: Partly checked. The result and year were confirmed by search; volume and pages weren't.

**The "10⁸,⁰⁰⁰,⁰⁰⁰ terms" estimate.** Usually credited to D. Beloriszky (1930), *Bulletin Astronomique* 6.
- Used for: how impractical Sundman's series is.
- Status: Not checked. The figure appears in many secondary accounts, but I couldn't get the 1930 paper. Treat it as an order-of-magnitude quote. The qualitative point, that the series converges far too slowly to use, is well supported, e.g. [arXiv:1704.08762](https://arxiv.org/abs/1704.08762) on the computational complexity of the three-body initial value problem.

## Exact special solutions

**Euler (1767).** L. Euler, "De motu rectilineo trium corporum se mutuo attrahentium," *Novi Commentarii Academiae Scientiarum Petropolitanae* 11, 144–151 (Eneström index E327).
- Used for: the *Euler line* configuration, three bodies on a rigidly rotating line.
- Status: Not checked.

**Lagrange (1772).** J.-L. Lagrange, "Essai sur le problème des trois corps," *Prix de l'Académie Royale des Sciences de Paris*, tome IX.
- Used for: the *Lagrange triangle* and *Trojan triangle* configurations, three bodies on a rigidly rotating equilateral triangle, for any masses.
- Status: Not checked.

**Gascheau (1843) and Routh (1875).** E. J. Routh, "On Laplace's three particles, with a supplement on the stability of steady motion," *Proceedings of the London Mathematical Society* s1-6, 86–97.
- Used for: the stability criterion 27(m₁m₂ + m₂m₃ + m₃m₁) < (m₁ + m₂ + m₃)². Equal masses fail it (unstable); masses 1 : 0.01 : 0.0001 pass it (stable). Jupiter's Trojan asteroids are the physical example.
- Status: Partly checked. The form of the inequality, the Gascheau/Routh attribution, and the equal-mass instability were confirmed by search; Routh's volume and pages weren't. Further reading: [Stability of Lagrange points (R. Fitzpatrick, UT Austin)](https://farside.ph.utexas.edu/teaching/celestial/Celestial/node86.html), [arXiv:1911.12269](https://arxiv.org/abs/1911.12269), [arXiv:0909.4907](https://arxiv.org/abs/0909.4907).

## Chaos: the Pythagorean problem

**Burrau (1913).** C. Burrau, "Numerische Berechnung eines Spezialfalles des Dreikörperproblems," *Astronomische Nachrichten* 195, 113–118.
- Used for: the *Pythagorean* configuration: masses 3, 4, 5 at rest at (1, 3), (−2, −1), (1, −1).
- Status: Not checked.

**Szebehely & Peters (1967).** V. Szebehely, C. F. Peters, "Complete solution of a general problem of three bodies," *The Astronomical Journal* 72, 876. doi:[10.1086/110355](https://doi.org/10.1086/110355). [ADS](https://ui.adsabs.harvard.edu/abs/1967AJ.....72..876S/abstract)
- Used for: the outcome. Two bodies form a permanent binary and the lightest (mass 3) is ejected. The simulator reproduces this; see the test.
- Status: Checked.

## Periodic orbits

**Moore (1993).** C. Moore, "Braids in classical dynamics," *Physical Review Letters* 70, 3675. doi:[10.1103/PhysRevLett.70.3675](https://doi.org/10.1103/PhysRevLett.70.3675)
- Used for: the figure-eight was first found numerically here.
- Status: Partly checked. The discovery was confirmed by search; volume and page weren't.

**Chenciner & Montgomery (2000).** A. Chenciner, R. Montgomery, "A remarkable periodic solution of the three-body problem in the case of equal masses," *Annals of Mathematics* 152, 881–901. [arXiv:math/0011268](https://arxiv.org/abs/math/0011268)
- Used for: proof that the figure-eight exists, and its starting conditions (computed by C. Simó): x₁ = −x₂ = (−0.97000436, 0.24308753), x₃ = 0, v₃ = (−0.93240737, −0.86473146), v₁ = v₂ = −v₃/2, period T ≈ 6.32591398. Its stability, reported numerically by Simó, is why the *Figure-eight* configuration is labelled stable.
- Status: Checked. See also the AMS feature column ["A new solution to the three body problem – and more"](https://www.ams.org/featurecolumn/archive/orbits3.html).

**Šuvakov & Dmitrašinović (2013).** M. Šuvakov, V. Dmitrašinović, "Three classes of Newtonian three-body planar periodic orbits," *Physical Review Letters* 110, 114301. [arXiv:1303.0181](https://arxiv.org/abs/1303.0181). [ADS](https://ui.adsabs.harvard.edu/abs/2013PhRvL.110k4301S)
- Used for: 13 new distinct equal-mass, zero-angular-momentum periodic orbits (15 sets of starting conditions), classified by topology. Starting conditions for *Butterfly I* and *Moth I*: x₁ = (−1, 0), x₂ = (1, 0), x₃ = (0, 0), v₁ = v₂ = (p₁, p₂), v₃ = −2(p₁, p₂).
  - Butterfly I: (p₁, p₂) = (0.30689, 0.12551), T = 6.2356
  - Moth I: (p₁, p₂) = (0.46444, 0.39606), T = 14.8939
- Status: Checked (paper and claim). The specific starting values were taken from the paper's table and confirmed numerically, not by re-reading the table: both orbits nearly close after the stated period (see below).

**Li (2013), comment.** "A comment on 'Three Classes of Newtonian Three-Body Planar Periodic Orbits'," [arXiv:1312.6796](https://arxiv.org/abs/1312.6796).
- Used for: the 2013 starting conditions were published to only 5 digits, which is not precise enough for some orbits. This explains why *Butterfly I* comes apart over long runs.
- Status: Partly checked. The argument was confirmed by search; the full author list wasn't.

**Li & Liao (2017).** X. Li, S. Liao, "More than six hundred new families of Newtonian periodic planar collisionless three-body orbits," *Science China Physics, Mechanics & Astronomy* 60, 129511. doi:[10.1007/s11433-017-9078-5](https://doi.org/10.1007/s11433-017-9078-5). [arXiv:1705.00527](https://arxiv.org/abs/1705.00527)
- Used for: "695 families" in the page's timeline.
- Status: Checked.

**Hristov, Hristova, Dmitrašinović & Tanikawa (2024).** I. Hristov, R. Hristova, V. Dmitrašinović, K. Tanikawa, "Three-body periodic collisionless equal-mass free-fall orbits revisited," *Celestial Mechanics and Dynamical Astronomy* 136, 7. doi:[10.1007/s10569-023-10177-w](https://doi.org/10.1007/s10569-023-10177-w). [arXiv:2308.16159](https://arxiv.org/abs/2308.16159) (2023)
- Used for: "12,409 distinct equal-mass free-fall orbits" in the timeline. This is the result popular articles reported as "12,000 new solutions."
- Status: Checked.

## Statistical solutions

**Stone & Leigh (2019).** N. C. Stone, N. W. C. Leigh, "A statistical solution to the chaotic, non-hierarchical three-body problem," *Nature* 576, 406–410. doi:[10.1038/s41586-019-1833-8](https://doi.org/10.1038/s41586-019-1833-8). [arXiv:1909.05272](https://arxiv.org/abs/1909.05272)
- Used for: the "statistical solution" framing. Assuming the encounter explores its phase space ergodically gives closed-form distributions of outcomes instead of trajectories. The ensemble panel illustrates this qualitatively; it doesn't reproduce the paper's ensembles.
- Status: Checked.

**Ginat & Perets (2021).** Y. B. Ginat, H. B. Perets, "Analytical, statistical approximate solution of dissipative and nondissipative binary-single stellar encounters," *Physical Review X* 11, 031020. doi:[10.1103/PhysRevX.11.031020](https://doi.org/10.1103/PhysRevX.11.031020). [arXiv:2011.00010](https://arxiv.org/abs/2011.00010)
- Used for: the random-walk statistical treatment mentioned in the timeline.
- Status: Checked.

**Valtonen & Karttunen (2006).** M. Valtonen, H. Karttunen, *The Three-Body Problem*, Cambridge University Press.
- Used for: background on escape statistics, including the long-established result that the lightest body is usually the one ejected. A textbook; recommended further reading.
- Status: Not checked.

## Numerical method

**Dormand & Prince (1980).** J. R. Dormand, P. J. Prince, "A family of embedded Runge–Kutta formulae," *Journal of Computational and Applied Mathematics* 6(1), 19–26. doi:[10.1016/0771-050X(80)90013-3](https://doi.org/10.1016/0771-050X(80)90013-3)
- Used for: the adaptive 5(4) integrator in `src/physics.js` (its coefficients and error estimate).
- Status: Not checked. These are the standard published coefficients, and the integrator's results (below) confirm they're correct.

## The novel and α Centauri

Used by the *Three suns, one planet* and *Real α Centauri* setups and by [docs/three-body-novel.md](docs/three-body-novel.md).

**Liu Cixin (2008).** 刘慈欣, *三体* (*The Three-Body Problem*). Serialized in *Science Fiction World* in 2006, published as a book in 2008. English translation by Ken Liu, Tor Books, 2014.
- Used for: the setting. A planet with three suns in the α Centauri system, stable and chaotic eras, "flying stars", dehydration, and civilizations destroyed by chaotic eras.
- Status: Partly checked. The details were confirmed against chapter summaries (below), not the text. The analysis describes the setting only in general terms and quotes nothing.

**Chapter summaries used to check the novel's details:**
- LitCharts: [ch. 7](https://www.litcharts.com/lit/the-three-body-problem/chapter-7-three-body-king-wen-of-zhou-and-the-long-night), [ch. 11](https://www.litcharts.com/lit/the-three-body-problem/chapter-11-three-body-mozi-and-the-fiery-flames), [ch. 15](https://www.litcharts.com/lit/the-three-body-problem/chapter-15-three-body-copernicus-universal-football-and-tri-solar-day), [ch. 19](https://www.litcharts.com/lit/the-three-body-problem/chapter-19-three-body-einstein-the-pendulum-monument-and-the-great-rip)
- [GradeSaver, Part II summary](https://www.gradesaver.com/the-three-body-problem/study-guide/summary-part-ii-three-body-chapters-4-7)
- Status: Checked for the meaning of "two flying stars" (a stable era is coming) and "three flying stars" (extreme cold), and for how stable and chaotic eras are described.

**Pourbaix & Boffin (2016).** D. Pourbaix, H. M. J. Boffin, "Parallax and masses of α Centauri revisited," *Astronomy & Astrophysics* 586, A90.
- Used for: masses of A and B (1.133 and 0.972 M☉), A–B orbital period (79.91 yr) and eccentricity (0.524). The simulator derives the semi-major axis (23.8 AU) from these with Kepler's third law. Commonly quoted values are around 23.3 AU; they differ because of the parallax used.
- Status: Partly checked. The values were confirmed against sources citing the paper; the title and volume weren't.

**Kervella, Thévenin & Lovis (2017).** P. Kervella, F. Thévenin, C. Lovis, "Proxima's orbit around α Centauri," *Astronomy & Astrophysics* 598, L7. doi:[10.1051/0004-6361/201629930](https://doi.org/10.1051/0004-6361/201629930). [arXiv:1611.03495](https://arxiv.org/abs/1611.03495)
- Used for: Proxima is bound to A and B. Eccentricity 0.50, closest approach 4.3 thousand AU, currently near its farthest point at 13.0 thousand AU, period about 550,000 years. The simulator uses a semi-major axis of 8,700 AU, consistent with those (4.3 / (1 − 0.5) ≈ 8.6 thousand AU), and a mass of 0.122 M☉.
- Status: Checked (orbit). The 8,700 AU figure is my inference from the published numbers.

**Kervella et al. (2017), interferometry.** P. Kervella, L. Bigot, A. Gallenne, F. Thévenin, "The radii and limb darkenings of α Centauri A and B," *Astronomy & Astrophysics* 597, A137. [arXiv:1610.06185](https://arxiv.org/abs/1610.06185)
- Used for: luminosities of A (1.52 L☉) and B (0.50 L☉) and radii (1.22 and 0.86 R☉). A's luminosity sets the planet's distance, 1.23 AU, where it gets Earth's sunlight.
- Status: Partly checked. The values were confirmed against the arXiv listing; the author list and volume weren't.

**Proxima's luminosity and brightness.** Bolometric luminosity 0.0016 L☉ (0.001567 ± 0.000020); apparent visual magnitude 11.1 at 1.30 parsecs.
- Used for: Proxima's sunlight in the *Real α Centauri* setup, and the docs' estimate that Proxima would look like a magnitude-4.5 star from the planet (my calculation).
- Status: Partly checked. The luminosity was confirmed by search; the magnitude and distance are standard values that weren't checked.

**Quarles & Lissauer (2016).** B. Quarles, J. J. Lissauer, "Long-term stability of planets in the α Centauri system," *The Astronomical Journal* 151, 111. doi:[10.3847/0004-6256/151/5/111](https://doi.org/10.3847/0004-6256/151/5/111). [arXiv:1604.04917](https://arxiv.org/abs/1604.04917)
- Used for: Earth-like planets around α Cen A or B can stay stable for billions of years inside roughly 2 AU. Supports the *Real α Centauri* result.
- Status: Checked (paper). The 2 AU figure comes from a [press summary](https://phys.org/news/2016-05-planets-alpha-centauri.html), not the paper's tables.

**Holman & Wiegert (1999).** M. J. Holman, P. A. Wiegert, "Long-term stability of planets in binary systems," *The Astronomical Journal* 117, 621.
- Used for: planets orbiting a binary from outside are stable only beyond roughly 2–4 times the binary's separation, depending on its eccentricity. The simulator's "stable around a pair" rule uses 2.5 times.
- Status: Not checked.

**Main-sequence approximations.** Luminosity ∝ M⁴ and radius ≈ M^0.8 R☉, for the invented suns only.
- Used for: sunlight and collision radii in *Three suns, one planet*. These are rough textbook scalings for stars near a solar mass; the results don't depend on them closely.
- Status: Not checked.

**Inverse, "What is the three-body problem in physics?"** ([link](https://www.inverse.com/science/what-is-the-three-body-problem-in-physics-space-science))
- Used for: background on how researchers view the novel's physics, including that a stable configuration of three comparable stars would have to be infinitely fine-tuned.
- Status: Secondary source.

## News and secondary sources consulted

These shaped the summary of what has and hasn't been solved. They're secondary sources; the papers above are the primary ones.

- [Physics World: three-body calculations suggest how black holes get close enough to merge](https://physicsworld.com/a/three-body-calculations-suggest-how-black-holes-get-close-enough-to-merge/). States that no general closed-form solution exists.
- [American Museum of Natural History: Cracking the three-body problem with chaos](https://www.amnh.org/explore/news-blogs/three-body-problem-chaos-theory). On Stone & Leigh; quotes the authors saying it is not an exact solution.
- [Technion: A centuries-old mystery solved](https://www.technion.ac.il/en/blog/2021/08/a-centuries-old-mystery-solved/). Press release for Ginat & Perets. Its headline overstates the paper, which calls its solution approximate.
- [Science Times: Mathematicians discover 12,000 new solutions to the infamous three-body problem](https://www.sciencetimes.com/articles/46011/20230916/mathematicians-discover-12-000-new-solutions-infamous-three-body-problem.htm). Popular coverage of the Hristov et al. preprint.
- [Scientific American: The three-body problem](https://www.scientificamerican.com/article/the-three-body-problem/). General background.
- [Science Times (2020): "Three body problem solved, works now"](https://www.sciencetimes.com/amp/articles/24684/20200113/three-body-problem-solved-works-now.htm). Low quality; **not relied on**. Listed because it's an example of the headlines this project responds to.

## Unverified claims

**Nagy (2026).** T. Nagy, "The Exact Latent Solution of the Gravitational Three-Body Problem," Zenodo record [19101229](https://zenodo.org/records/19101229), posted March 18, 2026.
- Used for: the 2026 entry in the page's timeline, as an example of a claimed general solution.
- Status: **Not evaluated.** Only the title and metadata were seen. Zenodo is an open repository with no peer review, and I'm not aware of any independent assessment. A general closed-form solution would have to get around the Bruns–Poincaré results, for example by redefining what counts as a solution. Read it yourself before drawing conclusions.

## Reproduced in the simulator

`test/physics.test.js` checks these. Each one independently confirms the starting conditions above and the integrator.

| Result | Source | Simulator |
|---|---|---|
| Figure-eight closes after T = 6.32591398 | Chenciner & Montgomery 2000 | returns to start within 4 × 10⁻⁸ |
| Lagrange triangle closes after one rotation | Lagrange 1772 | within 10⁻¹⁰ |
| Euler line closes after one rotation | Euler 1767 | within 10⁻¹⁰ |
| Pythagorean problem ejects the lightest body | Szebehely & Peters 1967 | mass 3 escapes, detected at t ≈ 60.5; energy conserved to ~10⁻⁸ |
| A planet near α Cen A stays stable | Quarles & Lissauer 2016 | one stable era for 200 years at 1.23 AU, sunlight within 1% |

Two more were checked by hand and aren't in the test suite:

- **Butterfly I and Moth I** close after their published periods to within 1.2 × 10⁻³ and 2.3 × 10⁻⁴. That's consistent with 5-digit starting values.
- **Trojan triangle** stays intact. A 10⁻⁶ shadow stays within 2 × 10⁻⁴ over t = 100, as Routh's criterion predicts.
