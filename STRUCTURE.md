# Mrs Janin — Source Structure

| File | Responsibility |
|---|---|
| `client/index.html` | Minimal HTML document and direct JavaScript entry point. |
| `client/src/main.js` | Application boot sequence, renderer setup, event listeners, and stateful game loop. |
| `client/src/game.js` | Game model: missions, jumping physics, obstacles, collision logic, score, and progression. |
| `client/src/style.css` | Paper-Cut Dash visual system, mobile-safe layouts, HUD, menus, and touch-control styling. |
| `client/src/assets.js` | Uploaded art URLs and reusable asset loading. |
| `capacitor.config.ts` | Android wrapper configuration for an APK build. |

The renderer owns the high-frequency canvas redraw. HTML provides the accessible overlay, settings, mission transitions, and thumb-sized interaction targets. This separation prevents DOM updates from being required every animation frame.
