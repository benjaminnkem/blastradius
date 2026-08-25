# BlastRadius — Landing Page Image Generation and Asset Direction

The landing page should contain a small number of custom visual assets that make the product understandable immediately while matching the cyber-industrial/system-level design language. They are **illustrative brand assets**, not fake product telemetry.

The runtime product must not generate these images dynamically. Generate them during design/build, review them, optimize them, commit/store them as static assets, and provide responsive formats.

## 1. Asset principles

Every asset must:

- look like an infrastructure/risk-system artifact, not generic Web3 marketing art;
- use near-black, phosphor green, amber, and restrained red consistent with the UI;
- avoid neon-purple crypto gradients;
- avoid coins, rockets, astronauts, robots, glowing Ethereum logos, Matrix rain, generic dashboards, and photorealistic trading scenes;
- avoid any text that would become illegible or inaccurate; text labels should usually be added in HTML/CSS instead of baked into imagery;
- communicate dependency propagation / blast radius / infrastructure failure;
- feel sharp, technical, diagrammatic, industrial, and trustworthy;
- work on the `#0a0a0a` background;
- leave negative space for responsive composition;
- not depict fake protocol partnerships or recognizable logos unless permission/accuracy is established.

## 2. Required landing assets

Generate **three** core assets.

### Asset A — Hero: Dependency Blast Topology

**Purpose:** explain BlastRadius in one glance.

**Composition:** a technical network topology where a single infrastructure node emits a failure pulse through layered dependencies into several downstream DeFi operations. The propagation should be visually directional and legible, like a systems engineering diagram rather than an abstract neural network.

**Generation prompt:**

```text
Create a high-end cyber-industrial systems illustration for a DeFi infrastructure risk product called BlastRadius. Dark near-black background (#0a0a0a). A precise dependency topology diagram fills the frame: one upstream infrastructure node on the left/top becomes degraded and emits a restrained red/amber failure pulse through multiple layers of thin phosphor-green wiring into oracle, RPC, bridge, protocol and user-operation nodes. Some downstream paths remain green, exposed paths shift amber/red. The visual should feel like a clean UNIX/tmux network operations console transformed into an editorial technical illustration: monospaced-system aesthetic, square geometry, thin 1px-looking lines, grid alignment, tiny unlabeled status glyphs, subtle CRT texture, no rounded glass cards, no glossy gradients. No Matrix rain. No coins, robots, spaceships, stock charts, Ethereum logos or readable fake text. Strong negative space for web hero copy. Extremely crisp, restrained, professional, plausible infrastructure visualization, not sci-fi fantasy.
```

**Recommended aspect:** 16:10 or 3:2. Provide at least 2400px wide source.

**HTML overlay copy (not in image):**

```text
DEPENDENCY FAILURE DETECTED
ROOT: <dependency>
TRUSTED OBSERVERS: 2/3
EXPOSED OPERATIONS: 37
```

### Asset B — Provenance / Ephemeral Attestation

**Purpose:** communicate why Arkiv matters.

**Composition:** independent publisher nodes send short-lived signed health records into a common data plane; older records visibly decay/expire rather than accumulating as permanent “current” truth.

**Generation prompt:**

```text
Create a precise cyber-industrial technical illustration representing ephemeral, wallet-attributed health attestations in a shared Web3 data layer. Near-black background, phosphor green primary, amber secondary, sparse red warning. Three independent observer terminals/wallet nodes publish small signed data packets toward a central queryable state plane. Each packet has a visual lifetime bar or fading tail: newest packets are crisp, old packets decay and disappear, communicating expiration without literal words. Show provenance as distinct origin lines that remain traceable. Clean UNIX system-monitor aesthetic, square grid, thin lines, subtle scanlines, no generic blockchain cubes, no coins, no logos, no fake readable text, no neon purple, no glossy 3D. Sophisticated information-security editorial diagram.
```

**Recommended aspect:** 4:3.

### Asset C — Incident Investigation / Reverse Traversal

**Purpose:** show the product workflow from root dependency to exposed user action.

**Composition:** a root incident node at left, layered branching dependency paths, final operation leaves at right, with one selected path emphasized.

**Generation prompt:**

```text
Generate a clean systems-engineering illustration of reverse dependency traversal for a production DeFi risk application. Start with one degraded infrastructure root node at the far left and branch through sequencer/oracle/RPC/adapter/protocol layers to concrete operation endpoints at the right. Emphasize one complete causal path with brighter phosphor-green and amber lines while unrelated paths remain dim green. Near-black #0a0a0a canvas, rigid terminal-grid geometry, square nodes, 1px technical wiring, subtle CRT scanline depth, understated red only at the failing root, generous negative space. The result should resemble a serious NOC/SRE dependency map, not a consumer crypto dashboard. No readable text, no logos, no rounded cards, no gradients, no Matrix rain, no sci-fi characters.
```

**Recommended aspect:** 16:9.

## 3. Optional ASCII hero mark

Do not use image generation for the wordmark. Build a responsive ASCII/HTML brand mark so it remains crisp and accessible.

Example direction (Codex may refine):

```text
 ____  _        _    ____ _____
| __ )| |      / \  / ___|_   _|
|  _ \| |     / _ \ \___ \ | |
| |_) | |___ / ___ \ ___) || |
|____/|_____/_/   \_\____/ |_|
       R A D I U S _
```

Use `aria-label="BlastRadius"` and hide decorative ASCII from screen readers if a normal accessible name is present.

## 4. Asset pipeline

After generation:

1. Review for misleading logos/text/imagery.
2. Crop intentionally for desktop/tablet/mobile.
3. Export AVIF + WebP with PNG fallback only if needed.
4. Strip metadata not needed for delivery.
5. Keep source assets under `apps/web/public/brand/source/` only if repository policy permits; optimized runtime assets under `apps/web/public/brand/`.
6. Use Next.js `<Image>` where appropriate with explicit sizes.
7. Avoid images above the fold that delay LCP; hero asset must be optimized and sized responsively.
8. Set `priority` only for the true LCP image.
9. Decorative images use empty alt; informative images get concise alt describing the concept, not colors.

## 5. Codex behavior when image generation is unavailable

Codex must **not** substitute random stock photos, generic gradients, or fake screenshots.

If its environment has an approved image-generation tool, generate the assets from this file and save them into the product asset directory.

If it does not have image-generation capability:

- complete the page layout with a clearly named asset slot/component;
- use a CSS/SVG diagram only if it is a truthful first-party visualization, not a fake screenshot;
- report the three prompts above to the user as the exact outstanding asset generation step;
- do not mark the visual-asset gate complete until real assets are supplied/generated.

## 6. Do not generate fake product screenshots

Landing visuals may be conceptual diagrams. Any screenshot presented as the BlastRadius live dashboard must come from the actual implemented product against real data/test environment. Never image-generate a UI screenshot and imply it is operational evidence.

## 7. Motion treatment

Static images should carry the primary meaning. CSS may add subtle overlays:

- faint scanning line;
- low-frequency pulse along one path;
- tiny status cursor blink;
- noise/CRT layer.

Respect `prefers-reduced-motion`. Do not animate large backgrounds continuously on mobile if it harms performance/battery.

## 8. Visual acceptance gate

```text
[ ] custom assets match BlastRadius rather than generic Web3
[ ] no fake live metrics embedded in images
[ ] no unauthorized protocol/company logos
[ ] no readable AI-generated gibberish text
[ ] responsive crop works at 360px width
[ ] LCP asset optimized
[ ] alt/decorative treatment correct
[ ] reduced-motion experience remains understandable
[ ] visual style follows design.md tokens
```

