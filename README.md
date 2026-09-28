# Mrs Janin — Mobile Runner

**Mrs Janin** is a mobile-first 2D side-scrolling runner made with **HTML, CSS, and JavaScript**. Guide Mrs Janin through six increasingly difficult paper-cut road missions by timing jumps over crates, thorn bushes, and rolling wheels.

## Play the Game

Install Node.js and pnpm, then run the following commands in the project root.

```bash
pnpm install
pnpm dev
```

Open the local Vite URL in a desktop browser or on a phone connected to the same network. The gameplay is designed for a vertical viewport and a one-thumb tap action.

| Input | Action |
|---|---|
| Tap the course | Jump |
| Tap **JUMP** | Jump |
| Space, Up Arrow, or W | Jump during desktop testing |
| Escape or pause control | Pause the current run |
| Second tap in Missions 3–6 | Double jump |

Add `?demo` to the game URL to run the deterministic presentation mode. This is helpful when previewing the course without manual interaction.

## Mission Progression

| Mission | Challenge introduced | Goal |
|---:|---|---|
| 01 | Gentle road blocks | Learn the jump timing |
| 02 | Faster obstacle arrival | Hold a consistent rhythm |
| 03 | Double-jump unlock | Use the second hop |
| 04 | Thorn bush patterns | Make tighter landings |
| 05 | Rolling wheel pressure | React to quicker approach speeds |
| 06 | Full Janin Dash | Finish the hardest mixed course |

## Source Layout

| Location | Purpose |
|---|---|
| `client/index.html` | The standalone HTML game shell. |
| `client/src/main.js` | Browser boot sequence, controls, and accessible UI bindings. |
| `client/src/game.js` | Canvas renderer, physics, mission data, obstacles, scoring, and collision handling. |
| `client/src/style.css` | The mobile Paper-Cut Dash visual system. |
| `client/src/assets.js` | Managed visual asset URLs and image preloading. |
| `android/` | Generated Capacitor Android wrapper project. |
| `capacitor.config.ts` | Android wrapper configuration. |

## Build a Debug APK

The repository includes a Capacitor Android wrapper. To create a debug APK on a machine with Android SDK API 36, Android Build Tools, and a Java Development Kit installed, run:

```bash
pnpm install
pnpm android:debug
```

The generated file will be located at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The debug APK from the original build is attached to the [GitHub releases](https://github.com/Apurba94/mrs-janin-jumping-2d-game/releases). It predates the fixes in this repository; build from source for the current version.

This project intentionally produces a **debug APK**. Creating a signed release APK requires an Android signing keystore owned and secured by the publisher.

## Build the Web Version

```bash
pnpm build
```

The production web assets are emitted under `dist/public/`.

## Assets

The game mark ships as `client/public/mrs-janin-logo.svg`. The world, runner and obstacles are drawn procedurally on the canvas, so the game needs no other image files. Optional bitmap art can be added in `client/src/assets.js`; it is drawn when present.

## Tests

```bash
pnpm test
```

Runs the game loop headless and checks mission pacing (each mission delivers the obstacles its goal names), collisions, the mission-3 double jump, course completion, and that a blocked `localStorage` cannot stop the game from loading.

## Credits

Created by **Janin A Apurba**. Released under the [MIT License](LICENSE).

## Follow Janin on YouTube

If this project helped you, please follow and subscribe:

- **Study with Janin**: [youtube.com/@studywithjanin](https://www.youtube.com/@studywithjanin)
- **Pomodoro Study with Janin**: [youtube.com/@pomodorostudywithjanin3326](https://www.youtube.com/@pomodorostudywithjanin3326)
