# Riftline

A browser MOBA prototype: seven champions (Cora, Shade, Viktor, Black Jack, Marty Fish, M4NTi5, Thistle), a space-bridge lane and a colosseum arena, bots, online 1v1 by link, and menus.

## Layout

| Folder | What it holds |
|---|---|
| `index.html` | The whole game: simulation, bots, netcode, rendering, menus |
| `assets/` | Sprite atlases, maps, icons and effects the game loads (built from `source-art/` by `tools/`) |
| `source-art/` | The original art as it was sent: sprite sheets, maps, turrets, icons, stills. Numbered in the order received |
| `tools/` | Python scripts that turn source art into the atlases in `assets/` (cutting sheets, removing backgrounds and stray marks, aligning frames on the feet, packing) |
| `tests/` | Playwright scripts: bot matches, mechanics checks, screenshots, online sync between two browsers |

## Play

Open `index.html` in a browser (Chrome or Edge). Serving the folder works too: `python3 -m http.server` and open the printed address.

## Tests

`tests/mksite.sh` builds a test copy of the game with hooks for the scripts, then run any script with Node and Playwright, for example `node tests/t112.js` (Marty bot matches). The online sync test needs the test copy served on port 8765 and `MOCK=1`.

The paths inside the scripts point at the session folders they were written in, so they need their paths updated before running elsewhere.
