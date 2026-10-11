# Carom

Carom is a browser paddle duel built around curved shots and bank plays. Move your paddle as it hits the ball to add spin, thread shots around the two center obstacles, and win by two after reaching 11 points. Play against the AI or share a keyboard in Versus mode.

## Run

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. To make a self-contained static site, run `npm run build`; the site is written to `dist/`. Serve that directory from the root of any static host. `npm run preview` serves the built site locally.

## Controls

| Action | Key |
| --- | --- |
| Left paddle | W / S |
| Right paddle (Versus) | ↑ / ↓ |
| Either movement pair (Solo) | W / S or ↑ / ↓ |
| Select menu item | Enter / Space |
| Pause / resume | P / Escape |
| Mute | M |

Use the movement keys to navigate menus. Menus also accept mouse clicks and touch taps. Press backtick to toggle the engine diagnostics overlay.

## Checks

Run `npm run typecheck`, `npm run lint`, `npm run format`, and `npm test`. The game uses the Simple 2D engine for the frame loop, input, audio, canvas fit, and diagnostics. All graphics and sounds are generated in code.
