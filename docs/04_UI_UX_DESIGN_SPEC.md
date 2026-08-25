# BlastRadius UI/UX Design Specification

**Design direction:** Cyber-Industrial / Hacker / System-Level  
**Primary principle:** make infrastructure risk understandable immediately without sacrificing provenance or technical depth.

This specification translates the supplied `design.md` into a production UX system for BlastRadius. It is not permission to build a novelty terminal. The terminal language is a visual metaphor layered over a conventional, accessible, discoverable web application.

---

## 1. UX thesis

BlastRadius deals with stressful, high-information situations. The interface therefore needs two simultaneous qualities:

1. **Fast comprehension** — a user should know what is failing, who reports it, and what is exposed without deciphering raw telemetry.
2. **Deep inspectability** — every summary should lead to methods, dependency paths, evidence, publisher identity, and Arkiv proof metadata.

The UI should feel like an operations console: precise, quiet, high-signal, and technically credible.

Do not make the UI look like a crypto casino, cyberpunk game, hacker movie, or generic SaaS dashboard.

---

## 2. Experience principles

### 2.1 Truth before decoration

Never display invented live metrics, fake incident counts, fake protocol logos, fake transaction hashes, or synthetic proof IDs to fill the screen.

If live data is unavailable:

```text
[DATA UNAVAILABLE]
current Arkiv state could not be read
last confirmed update: 12:31:42 UTC
```

is correct.

A visually impressive fake graph is not acceptable.

### 2.2 Progressive disclosure

Default hierarchy:

```text
WHAT IS WRONG?
    ↓
WHO SAYS SO / HOW MUCH AGREEMENT?
    ↓
WHAT IS EXPOSED?
    ↓
WHY IS IT EXPOSED?
    ↓
SHOW RAW CLAIM / METHOD / ARKIV PROOF
```

### 2.3 Public first

Viewing must not require signup or wallet connection.

Do not put a “Connect Wallet” CTA in the hero. Publisher workflows belong in CLI/admin/operator documentation, not as the primary public interaction.

### 2.4 Explicit uncertainty

Use distinct labels:

- `[OK] HEALTHY`
- `[WATCH]`
- `[DEGRADED]`
- `[CRITICAL]`
- `[UNKNOWN]`
- `[UNAVAILABLE]`
- `[PARTIAL RESULT]`

Never use color alone to communicate state.

### 2.5 Technical depth without jargon tax

Show concise plain-English explanations first, with expandable exact measurements underneath.

Example:

```text
SAFE HEAD IS 612s BEHIND THE METHOD'S CRITICAL THRESHOLD.

> measurements --expand
  unsafe head:      34711289
  safe head:        34710871
  finalized head:   34710203
  provider agreement: 2/3
```

The user does not need to type commands; the command language is visual framing only.

---

## 3. Design tokens

Implement tokens centrally, preferably CSS variables consumed by Tailwind/shadcn.

```css
:root {
  --bg: #0a0a0a;
  --fg: #33ff00;
  --primary: #33ff00;
  --secondary: #ffb000;
  --muted: #1f521f;
  --error: #ff3333;
  --border: #1f521f;

  --surface-1: #0d0d0d;
  --surface-2: #111511;
  --text-dim: #79a879;
  --text-neutral: #c8d2c8;
  --black: #050505;
}
```

The source design explicitly specifies primary/background/error/border. Additional neutrals may be derived only to improve readability and information hierarchy; keep them visually subordinate.

### Status mapping

- healthy: primary green
- watch/warning: amber
- degraded: amber with stronger label/pattern
- critical/error: red
- unknown: neutral/dim text + dashed boundary
- unavailable: red/amber semantic treatment depending failure type

Do not recolor entire pages red during incidents.

---

## 4. Typography

### Primary font

Use **JetBrains Mono** if licensing/bundle/performance setup is appropriate. Fallback:

```css
font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular,
  Menlo, Monaco, Consolas, "Liberation Mono", monospace;
```

### Hierarchy

Suggested responsive scale:

```text
hero display: clamp(2.5rem, 7vw, 6.5rem), tight line-height
h1:           clamp(2rem, 4vw, 4rem)
h2:           clamp(1.5rem, 2.5vw, 2.5rem)
h3:           1.125–1.5rem
body:         0.95–1rem
small/meta:   0.75–0.85rem
```

Headers use uppercase. Long body copy uses sentence/lowercase capitalization for readability.

Do not use tiny monospace as an excuse for dense unreadable screens.

---

## 5. Geometry

- border radius: `0px`
- panel border: `1px solid var(--border)`
- alternate inactive border: dashed
- no conventional drop shadows
- use whitespace + borders + contrast for hierarchy
- strict spacing scale, e.g. 4/8/12/16/24/32/48/64 px
- max readable prose width: ~70–80 characters where practical

---

## 6. Effects

### Allowed

- subtle primary text glow on selected headings/status;
- very faint CRT scanline overlay;
- blinking cursor on hero or selected active state;
- short typewriter animation on first hero appearance;
- restrained 1–2px glitch offset on deliberate hover accent;
- progress bars with textual/block characters.

### Prohibited

- Matrix rain;
- constant full-screen flicker;
- random glitching that makes text move while reading;
- loud VHS distortion;
- parallax that harms graph usability;
- animated fake telemetry;
- auto-scrolling logs that contain fake data;
- motion that ignores `prefers-reduced-motion`.

### Reduced motion

When reduced motion is requested:

- disable typewriter animation;
- disable cursor blink or use a static cursor;
- remove glitch offsets;
- make graph transitions immediate/short.

---

## 7. Core component primitives

Build reusable components instead of one-off ASCII/CSS in each page.

### `TerminalShell`

Provides:

- global scanline overlay;
- page grid;
- header/navigation;
- skip-to-content link;
- command/search affordance;
- app status area.

### `Pane`

Square bordered window.

Props conceptually:

```ts
interface PaneProps {
  title: string;
  status?: 'normal' | 'warning' | 'critical';
  actions?: ReactNode;
  children: ReactNode;
}
```

Header may render:

```text
+--[ SYSTEM STATUS ]--------------------------------+
```

but prefer CSS border/header composition over brittle literal ASCII on narrow screens.

### `StatusTag`

Examples:

```text
[OK]
[WATCH]
[CRITICAL]
[UNKNOWN]
```

Always includes visible text.

### `BracketButton`

Examples:

```text
[ EXPLORE INCIDENT ]
[ VIEW PROOF ]
```

Hover: primary background, black text. Preserve normal `<button>`/`<a>` semantics.

### `MetricBar`

Example:

```text
SEVERITY   [||||||||||||||||||..] 91/100
AGREEMENT  [|||||||||||||.......] 2/3
```

Use CSS/ARIA rather than literal characters only so screen readers receive meaningful values.

### `ProofRow`

Key/value row optimized for addresses, blocks, entity IDs, timestamps; copy affordance where useful.

### `CommandSearch`

Visually:

```text
search@blastradius:~$ [ dependency / protocol / chain ... ]
```

Behavior is a normal accessible search box with suggestions.

### `FreshnessIndicator`

Displays:

```text
updated 18s ago
```

then transitions to stale/unknown thresholds based on endpoint semantics.

### `ClaimRow`

Shows publisher alias/address, state, severity, observed time, method, expiry remaining.

### `DependencyPath`

Horizontal/vertical path representation with explicit arrows and status at each node.

---

## 8. Global navigation

Desktop header:

```text
BLASTRADIUS_    /SYSTEM    /PROTOCOLS    /METHODS    /ABOUT        [SEARCH /]
```

Do not crowd top navigation with internal publisher/admin controls.

Mobile:

- compact logo;
- `[MENU]` button;
- full-height square-edged menu pane;
- search remains easy to reach.

Current route is indicated through inverted/underlined treatment, not color alone.

---

## 9. Landing page

Route: `/`

### 9.1 Hero

Desktop structure:

```text
┌──────────────────────────────────────────────────────────────┐
│ BLASTRADIUS_                                                 │
│                                                              │
│ KNOW THE BLAST                                               │
│ RADIUS BEFORE                                                │
│ YOU ACT._                                                    │
│                                                              │
│ Live, provenance-aware DeFi dependency exposure.             │
│ See what a failing sequencer, oracle, or RPC can actually    │
│ reach — and who is reporting it.                             │
│                                                              │
│ [ EXPLORE SYSTEM ]   [ HOW IT WORKS ]                        │
└──────────────────────────────────────────────────────────────┘
```

A generated infrastructure illustration may sit to the right on wide screens or below copy on mobile.

The typewriter effect should run once and stop. Do not delay CTA availability.

### 9.2 Live status strip

Only real data:

```text
LIVE_  active incidents: 2  |  monitored deps: 14  |  coverage: 92%
```

If data unavailable:

```text
LIVE_  [DATA UNAVAILABLE] current network state cannot be confirmed
```

Do not use hardcoded animation counters.

### 9.3 Product explanation

Three panes:

```text
01 / OBSERVE
Independent monitors inspect real sequencers, oracles and RPC paths.

02 / ATTEST
Short-lived claims are published to Arkiv with immutable creator provenance.

03 / TRAVERSE
BlastRadius resolves the dependency graph to the protocol operations at risk.
```

### 9.4 Propagation visual

Use conceptual illustration or an explicitly labeled example:

```text
SEQUENCER:BASE
    ↓
CHAIN:BASE
    ↓
ORACLE ADAPTER
    ↓
PROTOCOL MARKET
    ↓
BORROW OPERATION
```

If the data is illustrative, label `EXAMPLE PATH`, not `LIVE`.

### 9.5 Why Arkiv

Four concise system-level points:

- `[QUERYABLE]` shared public state
- `[ATTRIBUTED]` immutable creator provenance
- `[EXPIRING]` health claims lose influence naturally
- `[RECONSTRUCTABLE]` versioned dependency history

### 9.6 Final CTA

```text
> ready to inspect the system?
[ OPEN BLASTRADIUS ]
```

---

## 10. System dashboard

Route: `/system`

### Desktop grid

```text
┌──────────────── SYSTEM SUMMARY ────────────────┐┌── FILTERS ────────┐
│ CURRENT STATE                                  ││ type: ALL          │
│ active incidents ...                           ││ chain: ALL         │
│ observer coverage ...                          ││ status: ALL        │
└────────────────────────────────────────────────┘└────────────────────┘

┌──────────────── LIVE DEPENDENCIES ────────────────────────────────────┐
│ [CRITICAL] Base Sequencer   2/3 observers   18s ago   [EXPLORE]     │
│ [OK]       ETH/USD Oracle   3/3 observers   21s ago   [DETAIL]      │
│ [UNKNOWN]  RPC Group X      1/3 observers   34s ago   [DETAIL]      │
└───────────────────────────────────────────────────────────────────────┘
```

### Requirements

- filter without page reload;
- URL-query-state for shareability when practical;
- sort critical/unavailable first, then recency;
- status + label + agreement + freshness visible in rows;
- do not overwhelm with every low-level measurement;
- include clear empty state if no supported dependencies match.

---

## 11. Incident/dependency page

Routes:

- `/incidents/[dependency]`
- `/dependencies/[id]`

They may share a feature composition; incident route focuses degraded current state.

### Above the fold

```text
[CRITICAL] SEQUENCER:BASE                               updated 18s ago

SAFE HEAD PROGRESSION IS OUTSIDE THE CURRENT METHOD THRESHOLD.

OBSERVERS              BLAST RADIUS
2/3 -> CRITICAL        9 protocols
1/3 -> HEALTHY         37 operations
split: YES             11 critical

[ EXPLORE GRAPH ] [ VIEW CLAIMS ] [ VIEW METHOD ]
```

### Claims pane

```text
+--[ TRUSTED OBSERVERS ]------------------------------------------+
| 0x12...ab  [CRITICAL] severity 91  observed 18s ago  expires 4m |
| 0x34...cd  [CRITICAL] severity 88  observed 31s ago  expires 4m |
| 0x56...ef  [OK]       severity 08  observed 24s ago  expires 4m |
+----------------------------------------------------------------+
```

Clicking a claim opens a side pane or proof page with exact Arkiv metadata.

### Protocol response pane

Separate heading and visual treatment:

```text
+--[ PROTOCOL STATEMENTS ]-----------------------------------------+
| PROTOCOL A / creator 0x...                                      |
| [ACTION] disable_deposits                                       |
| published 2m ago                                                |
+-----------------------------------------------------------------+
```

Do not visually merge responses into observer consensus.

---

## 12. Dependency graph screen

This is the product’s highest-value technical visualization.

### Graph semantics

- root dependency is prominent;
- downstream direction visually flows toward affected operations;
- node styles encode status/type using label + border + subtle color;
- edges expose criticality and source on interaction;
- selection opens a detail pane rather than navigating away unexpectedly;
- user can isolate one protocol or operation path;
- graph can reset to root.

Example:

```text
                    ┌──────────────────────┐
                    │ [CRITICAL]           │
                    │ BASE SEQUENCER       │
                    │ severity 91          │
                    └──────────┬───────────┘
                               │
                      ┌────────▼────────┐
                      │ CHAIN:BASE      │
                      └───┬────────┬────┘
                          │        │
               ┌──────────▼──┐  ┌──▼───────────┐
               │ ORACLE      │  │ RPC GROUP    │
               └──────┬──────┘  └────┬─────────┘
                      │              ...
               ┌──────▼───────┐
               │ PROTOCOL A   │
               └──────┬───────┘
                      │
               ┌──────▼───────┐
               │ BORROW       │
               │ score 88     │
               └──────────────┘
```

### Large graph UX

Do not dump 500 nodes at once.

- initial focused radius/depth;
- collapse branches;
- `EXPAND N DEPENDENTS` controls;
- protocol filter;
- operation filter;
- minimap only if genuinely useful and accessible;
- performance budget for layout;
- maintain keyboard-accessible path list alternative.

### Mobile fallback

Default to ordered path cards:

```text
PATH 01 / SCORE 88
Base Sequencer
  -> Base chain environment
  -> ETH/USD oracle adapter
  -> Protocol A WETH market
  -> Borrow
```

Graph may be opt-in full-screen.

---

## 13. Protocol exposure page

Route: `/protocols/[id]`

Header:

```text
PROTOCOL A / BASE
current exposure: [SEVERE]
3 affected operations across 2 root dependencies
```

Group by operation:

```text
BORROW
  [88] root: Base Sequencer
  primary path: sequencer -> chain -> oracle -> market -> borrow
  alternate paths: 1
  protocol response: disable_borrows
  [ VIEW PATH ]
```

Healthy/unmodeled sections must distinguish:

- no current degraded upstream dependency;
- no verified dependency modeled;
- data unavailable.

---

## 14. Proof page

Route: `/proof/[entityKey]`

Purpose: make Arkiv visible and credible rather than hiding it behind BlastRadius summaries.

Render:

```text
+--[ ARKIV ENTITY PROOF ]---------------------------------------+
| entity key        0x...                                      |
| project           blastradius-v1                              |
| kind              health_assertion                            |
| creator           0x...     [TRUSTED MONITOR]                 |
| owner             0x...                                      |
| created block     ...                                        |
| expires block     ...                                        |
| state             CRITICAL                                   |
| severity          91                                         |
| method            sequencer-health-v1@1                      |
| evidence hash     sha256:...                                  |
+---------------------------------------------------------------+

[ OPEN IN ARKIV EXPLORER ]   (only if current network has one)
```

Requirements:

- values come from API/Arkiv;
- long hashes/addresses wrap or scroll safely;
- copy controls have accessible labels;
- do not render payload HTML;
- show validation warning if entity does not match BlastRadius schema/project;
- show current trust classification separately from immutable creator data.

---

## 15. Methodology page

Route: `/methods/[methodId]`

Display:

- method ID/version;
- creator/provenance;
- dependency type;
- sample/publication policy;
- checks;
- thresholds;
- limitations;
- current dependencies using method;
- exact Arkiv proof.

This page is important because severity must not appear as unexplained magic.

---

## 16. Search UX

Search supports known:

- dependency IDs/labels;
- protocols;
- chains;
- entity keys when exact;
- method IDs.

Suggestions grouped by type:

```text
> base

DEPENDENCIES
  sequencer:base              SEQUENCER
  chain:base                  CHAIN

PROTOCOLS
  protocol-a:base             PROTOCOL
```

Keyboard:

- `/` focuses search unless user is typing in an input;
- arrow keys navigate suggestions;
- Enter selects;
- Escape closes.

Do not make shell command knowledge necessary.

---

## 17. Error and maintenance UX

### API failure

```text
[ERR] CURRENT DATA COULD NOT BE LOADED
BlastRadius could not reach its read API.
[ RETRY ]
request: br_...
```

### Arkiv unavailable

```text
[DATA UNAVAILABLE]
Current Arkiv state cannot be confirmed.
No health conclusion is being shown.
last successful read: 12:31:42 UTC
```

### Partial graph

```text
[PARTIAL RESULT]
Traversal reached a configured safety bound.
Displayed impact is incomplete; do not interpret the counts as total exposure.
```

### Unsupported target

```text
[NOT MODELED]
BlastRadius has no verified dependency data for this operation yet.
```

---

## 18. Landing-page generated image style

Use generated images as conceptual infrastructure art, not as screenshots of the live product.

Desired visual language:

- black/charcoal industrial space;
- thin phosphor-green topology lines;
- amber annotations/signals;
- restrained red failure propagation;
- modular racks/nodes/data planes;
- technical cross-section/blueprint feeling;
- no people;
- no coins/token symbols;
- no padlocks or hooded hackers;
- no Matrix glyph rain;
- no embedded fake UI labels/metrics;
- no third-party logos.

Detailed prompts are in `10_LANDING_ASSET_GENERATION.md`.

---

## 19. Responsive behavior

Breakpoints should follow actual content rather than device brand names.

### Wide desktop

- 12-column strict grid;
- split panes;
- graph + side inspector simultaneously;
- hero copy/illustration side-by-side.

### Laptop/tablet landscape

- reduce pane density;
- graph inspector becomes drawer/panel;
- summary cards remain 2-column where readable.

### Tablet/mobile

- stack panes;
- full-width buttons as needed;
- prevent monospace overflow;
- use wrapping with explicit continuation marker only when helpful;
- graph defaults to path list;
- horizontal data tables become key/value cards or scroll regions with labels;
- touch targets >=44 CSS px where practical.

Never shrink body text below comfortable reading size just to preserve a terminal-like line width.

---

## 20. Accessibility

Must satisfy WCAG 2.2 AA as a release target.

Requirements:

- semantic landmark structure;
- skip link;
- logical heading hierarchy;
- labels for every control;
- status text not color-only;
- visible keyboard focus via inversion/border, not relying only on browser outline removal;
- graph information available in non-canvas/non-visual path representation;
- screen-reader meaningful progress/severity values;
- reduced-motion support;
- no rapid flashes;
- links distinguishable from body text;
- copy buttons announce success non-intrusively;
- live incident refresh does not unexpectedly steal focus;
- ARIA live regions used sparingly for material updates only.

The source design says “focus: no ring, just blinking cursor”; for production accessibility, do **not** remove focus indication. Translate the idea into a strong inverted terminal focus state.

---

## 21. Performance UX

- optimize generated landing assets as AVIF/WebP with responsive sizes;
- lazy-load below-fold art;
- do not load React Flow on landing page if no interactive graph appears there;
- dynamically load heavy graph components on graph routes;
- avoid unnecessary client components in Next.js;
- use server rendering for public shell/content where useful;
- TanStack Query hydrates only current data needed;
- keep scanline effect pure CSS, no canvas/video;
- font subset/preload deliberately; avoid many weights.

---

## 22. Content voice

Voice: concise, technical, calm.

Good:

```text
2/3 trusted observers report DEGRADED.
```

Bad:

```text
MASSIVE FAILURE DETECTED!!! YOUR FUNDS MAY BE AT RISK!!!
```

Good:

```text
Affected means the modeled operation depends on a degraded upstream component. It does not guarantee transaction failure or loss.
```

Bad:

```text
Your borrow will fail.
```

---

## 23. Design QA checklist

Before release, verify:

- [ ] No rounded corners accidentally inherited from shadcn defaults.
- [ ] No generic gradient SaaS hero.
- [ ] No Matrix rain.
- [ ] Monospace is applied consistently without harming readability.
- [ ] Every health state has a text label.
- [ ] Green is not used to represent unavailable/unknown.
- [ ] No fake live metrics/screenshots/incidents.
- [ ] Landing page makes product understandable before Arkiv jargon.
- [ ] Incident first screen answers what/who/exposure.
- [ ] Claims and protocol responses are visually separate.
- [ ] Proof page exposes Arkiv creator and expiry metadata.
- [ ] Graph has path-list alternative.
- [ ] Long hashes/addresses do not break layout.
- [ ] Mobile has no accidental horizontal page scrolling.
- [ ] Keyboard search/navigation works.
- [ ] Focus states are clearly visible.
- [ ] Reduced motion disables typing/blink/glitch effects.
- [ ] Scanlines remain subtle enough for long reading.
- [ ] Contrast checked with actual token combinations.
- [ ] Critical red is reserved for actual critical/error semantics.
- [ ] Loading skeletons do not look like real telemetry.
- [ ] Error messages explain whether data is unknown vs unavailable.
- [ ] Core Web Vitals are measured on production build.

---

## 24. UI implementation rule for Codex

Before building any page, Codex must inspect existing components/styles and centralize tokens. It should first build/validate shared primitives (`Pane`, `StatusTag`, `BracketButton`, `MetricBar`, `ProofRow`, `CommandSearch`, `FreshnessIndicator`, `ClaimRow`, `DependencyPath`) and then compose pages.

Do not allow each page to invent its own terminal styling.
