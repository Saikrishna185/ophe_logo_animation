# Ophe Logo Animation — Motion (Vanilla JS) Architecture

Modern, offline-capable brand reveal animation built entirely using Motion's vanilla JavaScript API (`motion@14.6.0`, vendored at `vendor/motion.min.js`), plain HTML5, CSS3, and high-precision subpixel layout calculations. Zero framework or bundler dependencies.

## Final Composition

```
                    │
                    │
        [ O SYMBOL ] OPHE™
                    │
 ── Bringing HOPE to your doorsteps ──
                    │
```

Both the complete logo group and the complete tagline group align to the exact same vertical center axis (`viewportCenter = window.innerWidth / 2`), validated with subpixel `getBoundingClientRect()` measurements.

## Animation Sequence & Motion Architecture

```
                    OPHE
                      ↓
               letters rearrange
                      ↓
           slow "conform, then dissolve"
                      ↓
                    HOPE
             (centered + orange)
                      ↓
── Bringing  ←      HOPE      →  to your doorsteps ──
    (forms around stationary centered HOPE)
                      │
                      │  (moves down in S-curve & docks into lockup as ONE group)
                      ↓
        [ O SYMBOL ] OPHE™
                      
 ── Bringing HOPE to your doorsteps ──
```

### 1. Opening OPHE (0.00s – 0.45s)
- **Position**: Centered BOTH horizontally and vertically at viewport center (`viewportCenter`, `viewportMiddleY`).
- **Typography**: Uppercase, dark navy (`#1b2b33`), bold geometric sans-serif (self-hosted Montserrat 800).
- **Structure**: Four individual letter elements (`O`, `P`, `H`, `E`) in equal slots.

### 2. Smooth Letter Shuffle: OPHE → HOPE (0.45s – 1.85s)
- Coordinated sliding paths orchestrated with absolute start times:
  - `H` arcs overhead across slots 2 → 0 with collision clearance (`y` parabola, `zIndex: 10`, subtle tilt).
  - `O` glides smoothly underneath across slots 0 → 1 with subtle dip.
  - `P` slides across slots 1 → 2 with gentle wave motion.
  - `E` settles in slot 3 with micro-anticipation.
- Smooth color transition from dark navy (`#1b2b33`) to brand orange (`#fe5d3a`) runs 0.55s – 1.60s (`power1.inOut`).

### 3. Slow "Conform, then Dissolve" OPHE → HOPE (1.45s – 2.75s)
- **Shared Parent Enlargement**:
  - The shared wrapper `.tagline-hope-wrap` scales from `[0.94, 1.0]` over 1.45s – 2.75s (duration 1.30s, `sine.inOut`, `transformOrigin: center center`).
  - Because both the letter layer (`lettersWrap`) and artwork layer (`assetHope`) live inside this wrapper, their relative scale ratio is `1` by construction.
- **Letter Glyph Conform (1.85s – 2.40s)**:
  - Each letter (`H`, `O`, `P`, `E`) conforms its `x, y, scaleX, scaleY` over 0.55s (`sine.inOut`) to match the artwork glyph geometry with zero overshoot.
  - Targets are calibrated as fractional ratios of `hopeWidth` and `hopeHeight`, delivering **90.45% IoU** at desktop (1280x800) and **89.90% IoU** on mobile (390x844).
  - Montserrat 800 provides optimal ink weight parity against `06_hope.png`.
- **Artwork Fade Under Letters (2.20s – 2.55s)**:
  - `assetHope` remains completely invisible (opacity 0, visibility hidden) from 0.00s to 2.20s.
  - At 2.20s, it fades in beneath the letters (`opacity: 0 → 1`, 0.35s, `sine.out`). The letters remain fully opaque on top.
- **Letter Dissolve (2.45s – 2.75s)**:
  - With the underlying artwork already ~90–100% opaque, `lettersWrap` fades out cleanly (`opacity: 1 → 0`, 0.30s, `sine.inOut`), then hides at 2.75s.
  - Total orange ink coverage never dips below 97% of baseline.
- **Hold**: `HOPE` rests stationary and centered in the viewport for 0.55s (2.75s – 3.30s).

### 4. Build Complete Tagline Around Stationary HOPE (3.30s – 5.40s)
- `HOPE` remains stationary and centered until 3.30s.
- **Dynamic Viewport Fit (`buildOffsetX`)**:
  - Runtime measurement in `calculateLayout()` computes `buildOffsetX`: if the asymmetric tagline overflows on narrower screens (e.g. mobile 390px, 320px), the group slides smoothly leftward (`x: [0, buildOffsetX]`, duration 1.0s, `power2.out`, 3.30s – 4.30s) while wings enter.
  - Keeps the entire tagline inside the viewport with `>= 12px` margins on both sides without arbitrary breakpoints.
  - Desktop and tablet maintain offset `0` when fitting within margins.
- **Clamped Wing Entrances**:
  - Flanking wings entrance start offsets are clamped based on viewport width (`Math.min(130, Math.max(50, Math.round(vW * 0.22)))`) for a clean, proportional reveal.
- **Hold**: Complete tagline holds stably for ~0.77s (4.63s – 5.40s) before seamless handoff into descent.

### 5. Fluid S-Curve Tagline Drop-Down & Resolving OPHE™ Logo (5.40s – 7.25s)
- Entire `.final-tagline-group` (Left Line + Bringing + HOPE + to your doorsteps + Right Line) moves downward as **ONE UNIFIED GROUP**.
- **S-Curve Motion**: `y` translation uses `power2.inOut` (1.85s) while horizontal shift `x` uses `power3.inOut` (1.85s). The path starts mostly vertical, bends gently in the middle, and lands vertically.
- **Logo Blur & Scale Resolution**: Dominant OPHE™ logo (`01_ophe_symbol.png` + `02_ophe_wordmark.png` + `03_tm.png`) emerges blurred (`scale: [0.92, 1.0]`, `blur(14px) → blur(0px)`) and steadily clears over the full 1.85s descent window using `power2.inOut`, reaching razor sharpness at exactly 7.25s as the tagline lands. Opacity fades in over 1.4s with `sine.inOut` (from 5.55s).
- **Deterministic Filter Cleanup**: `filter: none` is explicitly applied with CSS priority at 7.25s to eliminate residual browser compositing layers.
- **Z-Order**: Tagline renders on `z-index: 10` above the logo (`z-index: 1`), ensuring flawless legibility as it passes downward.

### 6. Final Lockup & 3-Second Hold (7.25s – 10.25s+)
- Final composition rests in its complete, balanced lockup:
  - Logo is visually dominant.
  - Tagline is readable, balanced, directly underneath.
  - Both share the exact vertical center axis:
    `logoCenterX === taglineCenterX === viewportCenter`
- Holds clean, centered, and stable for **3.0 seconds**.
- Replay button fades in at 10.25s for interactive replay.

## Motion Ease Conversion Table

GSAP polynomial eases have been converted to exact CSS cubic-bezier curves for standard browser hardware-accelerated playback:

| Semantic Ease | GSAP Curve | Motion Cubic-Bezier Array |
|---|---|---|
| `power1.in` | Quad In | `[0.55, 0.085, 0.68, 0.53]` |
| `power1.out` | Quad Out | `[0.25, 0.46, 0.45, 0.94]` |
| `power1.inOut` | Quad InOut | `[0.455, 0.03, 0.515, 0.955]` |
| `power2.out` | Cubic Out | `[0.215, 0.61, 0.355, 1]` |
| `power2.inOut` | Cubic InOut | `[0.645, 0.045, 0.355, 1]` |
| `power3.out` | Quart Out | `[0.165, 0.84, 0.44, 1]` |
| `power3.inOut` | Quart InOut | `[0.77, 0, 0.175, 1]` |
| `sine.in` | Sine In | `[0.47, 0, 0.745, 0.715]` |
| `sine.out` | Sine Out | `[0.39, 0.575, 0.565, 1]` |
| `sine.inOut` | Sine InOut | `[0.445, 0.05, 0.55, 0.95]` |

## Technical Highlights
- **Motion Vanilla JS (`motion@14.6.0`)**: Sequenced via `animate(sequence)` returning standard playback controls (`masterControls.pause()`, `masterControls.time = T`, `masterControls.play()`, `masterControls.finished`).
- **Offline-First**: Fully self-contained inside `vendor/motion.min.js` with pinned CDN fallback (`https://cdn.jsdelivr.net/npm/motion@14.6.0/dist/motion.js`). Zero external runtime dependencies.
- **Clean Lifecycle & Teardown**: `teardown()` cancels controls and removes all inline styles prior to layout measurement. `applyInitialState()` deterministically writes initial styling before build and on replay.
- **Self-Hosted Typography**: Montserrat 700 & 800 woff2 loaded locally from `fonts/` with `font-display: block` and explicit `document.fonts.load()` awaiting before layout measurement.
- **Mobile Tagline Readability (< 600px)**: Uses 96% viewport width (cap 580px, maintaining >= 12px side margin) with flanking lines shortened by ~50% so words and HOPE render larger and clearer.
- **Subpixel Centering**: Exact horizontal centering verified via `getBoundingClientRect()`.
- **Debugging & Telemetry**: `validateAlignment()` logs detailed metrics only when `?debug=1` is present in URL.
- **Reduced Motion**: Respects `prefers-reduced-motion` by instantly rendering the final lockup with `filter: none`.
- **Keyframe Inspection**: Supports URL query parameters (e.g., `?time=5.8` or `?progress=1.0`) for inspecting specific timestamps.

## How to Run

1. Open `index.html` in any modern web browser or serve via:
   ```bash
   npx serve .
   ```
2. The animation runs automatically, holds for 3 seconds, and provides a replay button.
