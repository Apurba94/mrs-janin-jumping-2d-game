# Mrs Janin — Generated Asset Manifest

**Art direction:** a vertically framed 2D paper-cut mobile runner with indigo dusk sky, parchment terrain, marigold progress marks, coral danger edges, visible deckled paper grain, and strong clean silhouettes. Assets feel hand-assembled yet remain legible at a glance on a small phone screen.

| Asset | Role | Intended display size | Managed URL |
|---|---|---:|---|
| In-game visual target | Visual QA reference for the start screen and course composition | Full 9:16 viewport | `/manus-storage/mrs-janin-runner-reference_097ad176.png` |
| Mrs Janin runner | Character art shown in the briefing and canvas sprite reference | 112×112 px | `/manus-storage/mrs-janin-runner_49c6c1a6.png` |
| Obstacle kit | Source reference for crate, bush, and rolling wheel canvas obstacles | 82–112 px high | `/manus-storage/mrs-janin-obstacles_93d35ae2.png` |
| Parallax world | Full-viewport visual background, cover-scaled without horizontal repetition | 9:16 viewport | `/manus-storage/mrs-janin-world_b51214b2.png` |
| Jump arc mark | Menu and app visual brand mark | 96×96 px | `/manus-storage/mrs-janin-logo_f1801a23.png` |

The renderer uses the background and character art directly, while obstacle geometry is augmented with code-drawn hitbox silhouettes to retain collision accuracy. Original generated images are maintained outside the project directory; the static runtime refers only to the managed URLs above.
