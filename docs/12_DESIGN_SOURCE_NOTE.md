# BlastRadius Design Source Note

This document records the design brief supplied for BlastRadius so the implementation remains faithful to it.

## Source intent

The UI should feel **Cyber-Industrial, Hacker, and System-Level**: a clean, usable ZSH/BASH shell or tmux workspace, not a cliché “Matrix rain” interface.

### Visual signatures

- Monospace typography everywhere.
- Blinking block/underscore cursor as a restrained heartbeat motif.
- Shell metaphors such as `>`, `$`, `~`, `--help`, `[OK]`, `[WARN]`, `[ERR]`.
- Very subtle CRT scanlines.
- Rigid grid/tmux pane composition.
- Square corners and 1px borders.
- ASCII art used selectively for brand/graphic character.
- Typing effects used sparingly.
- Raw/data-forward visualizations such as textual bars rather than consumer-style glossy charts.

### Canonical color tokens

- `background`: `#0a0a0a`
- `primary`: `#33ff00`
- `secondary`: `#ffb000`
- `muted`: `#1f521f`
- `accent`: `#33ff00`
- `error`: `#ff3333`
- `border`: `#1f521f`

### Typography

Use JetBrains Mono, Fira Code, or VT323. Prefer JetBrains Mono for production readability. Headers may use uppercase. Body copy should remain readable; do not force uppercase for long prose.

### Geometry/effects

- radius: 0
- borders: 1px solid/dashed
- no conventional drop shadows
- restrained phosphor text glow
- optional scanline overlay with `pointer-events:none`

### Interaction motifs

Buttons may use labels like `[ EXPLORE INCIDENT ]` and invert on hover. Inputs can use shell-prompt framing. Focus state must remain visible and accessible. Motion must respect `prefers-reduced-motion`.

## Precedence rule

When aesthetics conflict with accessibility, truthfulness, performance, mobile usability, or maintainability, **accessibility/truthfulness/usability wins** while preserving the visual vocabulary where possible.

The UI must never simulate a terminal so literally that users are required to understand shell commands. Shell aesthetics are presentation, not an interaction prerequisite.

The production interpretation of this source is fully specified in `04_UI_UX_DESIGN_SPEC.md`.
