# AGENTS.md: Riftline handoff

This file is for coding agents (Codex, Claude, or anything else that reads `AGENTS.md`). It carries the project context that used to live only in chat history and project memory, so a new agent can pick up where the last one stopped. Keep it up to date when decisions change.

## What Riftline is

A browser MOBA prototype by Vlad (GitHub `cvradu`). It has seven champions in progress, two maps, bots, online 1v1 by link, and menus.

- **Modes / maps:** the **Lane** (a space-bridge lane with towers and minion waves; Vlad calls this mode "ARAM") and the **Colosseum** (a best-of-3 1v1 duel arena with bushes, healing plants and a closing storm). These are the only two modes.
- **Roster on `main`:** Cora (Coralisse), Shade, Viktor, Black Jack, Marty Fish, M4NTi5 ("Mantis"). `const ROSTER` in `index.html`.
- **Eighth slot in progress:** Thistle, on an unmerged branch (see "Open work").
- Controls: every champion has a passive, Q, RMB, E, R, and a Space dash. The "W" slot in design talk maps to RMB in the game.

## Repo layout and how to run

| Path | What it holds |
|---|---|
| `index.html` | The whole game in one file (about 4,400 lines): simulation, champions (`const CH`), bots, netcode, rendering, menus, SFX |
| `assets/` | Sprite atlases, maps, icons and effects the game loads (`.webp`), built from `source-art/` by `tools/` |
| `source-art/` | Original art exactly as Vlad sent it, numbered in the order received. Never edit these; regenerate `assets/` from them |
| `tools/` | Python scripts that cut sheets, remove backgrounds, align frames on the feet and pack atlases into `assets/` (`atlas_<champ>.py`, plus per-champion folders) |
| `tests/` | Playwright scripts: bot matches, mechanics checks, screenshots, online sync |

**Play:** open `index.html` in Chrome or Edge, or run `python3 -m http.server` in the repo and open the printed address. No build step, no package manager.

**Tests:** `tests/mksite.sh` builds a test copy of the game that exposes hooks (`window.__riftline`, `window.__tc`, `window.__mk`, etc.), then run a script with Node + Playwright, e.g. `node tests/t112.js`. The online sync test needs the copy served on port 8765 with `MOCK=1`. **The scripts contain hard-coded paths from old cloud sessions** (`/tmp/claude-0/...`, `/home/user/riftline`); update those paths before running locally.

**Sharing builds with Vlad:** he play-tests from `raw.githack.com` links. Branch links get cached, so share links pinned to a commit SHA: `https://raw.githack.com/cvradu/Riftline/<sha>/index.html`.

## Code conventions

- Everything stays in `index.html`. Follow the existing style: compact one-line functions, short names, constants grouped near the champion they belong to (`BJ_*`, `MF_*`, `MT_*`, `VIK_*`, `CORA_*`).
- A champion is a `CH.<key>` entry (`base` stats, `castKind`, `dash`, `ab` abilities, `passive`) plus a `CHAMP_INFO` entry for the menu page, a `*Frame` sprite function, an atlas in `assets/`, and bot logic.
- Status effects are general systems, not per-champion: `bleed()`, `slow()`, `stun()`, `knockback()`, `knockUp()`, and (on the Thistle branch) `poison()` and grounding.
- Art pipeline: Vlad's painted sheet goes to `source-art/<n>.png`, a script in `tools/` cuts it into `assets/<champ>.webp`, and frame metadata is pasted into `index.html`.
- Balance is measured with Colosseum bot duels: 6 best-of-3 duels per opponent. Bot results also reflect how well each bot plays its champion, so a low win rate may be a bot problem.

## Working with Vlad

- Work on a branch, open a PR, and send a commit-pinned play link. Vlad merges.
- Vlad often types quickly with typos; read for intent and confirm when a request can be read two ways.
- He likes concrete options to pick from (A/B/C per ability slot), then iterates by feel after play-testing.

## Open work (branches and PRs)

None of these are merged into `main` yet. They all branch from `main` and touch `index.html`, so expect merge conflicts between them.

| Branch | PR | What it holds | State |
|---|---|---|---|
| `claude/project-thread-lthpf3` | #1 "Add poison, grounding and Thistle" | Poison status, grounding, Thistle with painted sprites, tuning, mana rule | Open, waiting on Vlad |
| `claude/project-thread-gjrq1y` | #2 "Marty's first voice line on basic attacks" | `assets/vo/marty_attack_1.mp3` and the VO hook in `SFX` | Open, waiting on Vlad |
| `claude/project-thread-kzni0m` | none yet | HD map art: lane and arena upscaled 4x with Real-ESRGAN (`tools/upscale/`), "Map look" setting HD (default) / Pixel | Pushed, no PR. Vlad hadn't confirmed it looks good |

### Thistle (new champion, PR #1)

Area-control garden mage. A cheerful kid gardener riding **Mother**, a huge, menacing carnivorous plant. Resource: mana ("Sap" in the fiction). Picked because the roster had no caster, controller or summoner.

- **Passive, Overgrowth:** slowed or grounded enemies take extra damage from all her abilities.
- **Q, Thornlash:** a vine whip, 450 long (650 was much too long). The tip hits harder. No poison.
- **RMB (W), Pollen Cloud:** the ONLY source of poison in her kit. Opens at radius 170 and spreads to 250 over 5s. 2 charges. Restricts the vision of enemies inside.
- **E, Burr Volley:** 3 flat thicket patches land in a line across the cursor for 4s. They slow and **ground** (no Space dash or kit dashes, e.g. Black Jack's Jetstep).
- **R, Mother's Maw (locked in by Vlad):** a flytrap swallows the enemy, then stays as a turret.
- **Space, Burrow:** 450 range. Tunnels under walls and rocks and surfaces on the far side (up to 260 further); stops short if there is no far side. Knocks back enemies at the exit.
- **Intended combo:** cloud, R, cloud, burrs, vine whip.

**Poison (general status, any future champion can apply it):** modeled on `bleed()` (4 ticks at 0.5s) but stacks. Each application refreshes the duration. Max 12 stacks. Each stack carries its own damage value (no shared base; each ability sets damage per stack) and a tick sums all stacks. At 12 stacks a new one replaces the oldest. Stacks fall off one at a time: after 2s without new poison, lose 1 stack per 0.5s tick while it keeps ticking.

**Mana rule (Vlad, 2026-11-02):** mana champions (`def.mana`, so far only Thistle) pay 80% less and regenerate mana 3x as fast in both modes. Constants: `const MANA={cost:0.2,regen:3}`.

**Art:** `source-art/69.png` (walk, 16x8 grid of 500px cells) and `source-art/70.png` (standing, 2x4), cut by `tools/atlas_thistle.py` into `assets/thistle.webp`. No attack frames yet.

**Balance (2026-10-30, before the mana change):** won 19 of 36 Colosseum duels. Strong vs Black Jack and Cora, hard-countered by Marty and Mantis (0 to 6 each). Whole-roster overall win rates: Marty 64%, Black Jack 56%, Thistle 56%, Mantis 53%, Shade 47%, Viktor 39%, Cora 36%. Her balance should be re-measured after the mana change.

### Marty Fish voice lines (PR #2)

Marty is a tiny squid in a salvage mech who speaks through a robot translator. He doesn't fully understand human customs, so the humor comes from misused turns of phrase and literal-minded idioms.

- Running gags: "I am not a fish" (the name was a clerical error), literal idioms ("I have kicked the bucket. I do not have feet. How."), bracketed `[TRANSLATOR]` interjections, and treating M4NTi5 as a robot cousin ("Robot! Hello, cousin! [M4NTi5 DOES NOT SHARE THIS SENTIMENT]"). Thistle sighting line: "A child on a salad. The salad has teeth. Human gardening is very advanced."
- About 100 draft lines live in a claude.ai doc that agents outside Claude can't read: https://claude.ai/artifact/SHM96kgGieL4v59ycjbwA4 . Ask Vlad to export it if you need them.
- Vlad records the lines himself. Recordings go in `assets/vo/` and the VO table in `SFX.voice`. The first one, `marty_attack_1.mp3`, plays with a 12% chance per basic attack, then at least 12s of silence, because Vlad wants lines "occasionally, not very often".
- Keep any new Marty lines or barks in this voice.

### Map sharpness (branch `claude/project-thread-kzni0m`)

Vlad said the map looked pixelated. Findings: the map paintings are small (lane about 1700px wide, arena 1254px) and the camera blows them up about 5x. Rendering at full resolution with smooth scaling made it look worse (blurry, smeared), so that was reverted. The fix was a 4x Real-ESRGAN upscale of both maps (`tools/upscale/sr.py`, `lane_build.py`), rendered at full resolution, with Pixel kept as an option. Layout, walls and brush positions are unchanged. The bigger images use about 200MB of GPU memory. Before/after images: ask Vlad. Next step: get Vlad's verdict, then open a PR.

## Ideas that were pitched but not chosen

Possible future champions from the Thistle brainstorm: Gilda Glass (glassblower artillery mage, Heat), Vesper the Lamplighter (lanterns linked by burning beams, Oil), Sundial (time-bending fields, Hours), Odessa (clockwork duelist, Tempo), Brother Gong (bell monk tank, Resonance).
