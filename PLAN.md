# Mrs Janin — Mobile Runner Plan

Mrs Janin is a single-screen, side-scrolling 2D runner. The player uses one-tap jump timing to clear a sequence of procedurally staged obstacles. Six missions progress from a gentle tutorial through faster gaps, mixed obstacle patterns, and a double-jump finale.

| Risk slice | Implementation | Completion check |
|---|---|---|
| One-touch jump | Pointer, touch, and keyboard events route to one semantic jump action. | A tap on the playfield or the jump pad launches Mrs Janin. |
| Reliable collisions | Axis-aligned hitboxes are checked each frame against obstacles. | Contact stops the run and opens the retry state. |
| Difficulty ramp | Mission specifications adjust speed, obstacle interval, target distance, and double-jump availability. | Each cleared mission unlocks the next and is visibly harder. |
| Mobile layout | A canvas scales to the device viewport while HUD and jump control stay within safe regions. | The game remains usable at a 375×812 viewport. |
| APK route | Capacitor configuration wraps the static build for Android. | A debug APK is produced if the installed Android toolchain permits it; otherwise the repository contains complete build instructions. |

The game is a polished vertical slice designed to run offline after the static bundle is loaded. It uses a lightweight custom `<canvas>` renderer instead of a game-engine dependency, keeping the source straightforward for a GitHub project.
