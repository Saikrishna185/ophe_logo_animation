# Ophe Logo Animation — GSAP Rebuild

GSAP 3 brand reveal animation orchestrated via a sequential `gsap.timeline()` with `gsap.context()` cleanup, Flip plugin registration, and exact visual bounding box centering.

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
                    HOPE
             (centered + orange)
                      ↓
── Bringing  ←      HOPE      →  to your doorsteps ──
    (forms around stationary centered HOPE)
                      │
                      │  (moves down & docks into lockup as ONE group)
                      ↓
        [ O SYMBOL ] OPHE™
                      
 ── Bringing HOPE to your doorsteps ──
```

### 1. Opening OPHE (0.0s – 0.45s)
- **Position**: Centered BOTH horizontally and vertically at viewport center (`viewportCenter`, `viewportMiddleY`).
- **Typography**: Uppercase, dark navy (`#1b2b33`), bold geometric sans-serif (Montserrat 800).
- **Structure**: Four individual letter elements (`O`, `P`, `H`, `E`) in equal slots.

### 2. Smooth Letter Shuffle: OPHE → HOPE (0.45s – 1.95s)
- Rebuilt using **GSAP Timeline with coordinated sliding paths**:
  - `H` arcs overhead across slots 2 → 0 with collision clearance (`y` parabola, `zIndex: 10`, subtle tilt).
  - `O` glides smoothly underneath across slots 0 → 1 with subtle dip.
  - `P` slides across slots 1 → 2 with gentle wave motion.
  - `E` settles in slot 3 with micro-anticipation.
- Smooth color transition from dark navy (`#1b2b33`) to brand orange (`#fe5d3a`).
- Upon completion, `HOPE` is **perfectly centered** in the viewport.

### 3. Transition to Single Visual Element `06_hope.png` & Hold (1.95s – 3.2s)
- Seamless crossfade from letter spans into the official `06_hope.png` artwork asset.
- Guarantees authentic brand kerning, typography, and color.
- `HOPE` holds stationary and **perfectly centered** in the viewport.

### 4. Build Complete Tagline Around Stationary HOPE (3.2s – 5.3s)
- `HOPE` **remains 100% stationary** at the center.
- `[ LEFT LINE ]` (`04_left_line.png`) + `Bringing` (`05_bringing.png`) enter smoothly from the **LEFT**.
- `to your doorsteps` (`07_to_your_doorsteps.png`) + `[ RIGHT LINE ]` (`08_right_line.png`) enter smoothly from the **RIGHT**.
- Flanking words settle directly into place around HOPE.
- Complete tagline holds stably for ~0.8s for clear readability.

### 5. Move Tagline Downward & Reveal Dominant OPHE™ Logo (5.3s – 6.8s)
- Entire `.final-tagline-group` (Left Line + Bringing + HOPE + to your doorsteps + Right Line) moves downward as **ONE UNIFIED GROUP**.
- Downward translation (`y`) and horizontal recentering (`x`) glide smoothly together using GSAP `power3.inOut`.
- Dominant OPHE™ logo (`01_ophe_symbol.png` + `02_ophe_wordmark.png` + `03_tm.png`) reveals directly above it with opacity, scale (`0.94 → 1.0`), and subtle blur clearing (`10px → 0px`).

### 6. Final Lockup & 3-Second Hold (6.8s – 9.8s+)
- Final composition rests in its complete, balanced lockup:
  - Logo is visually dominant.
  - Tagline is readable, balanced, directly underneath.
  - Both share the exact vertical center axis:
    `logoCenterX === taglineCenterX === viewportCenter`
- Holds clean, centered, and stable for **3+ seconds**.
- Replay button fades in at 9.8s for smooth replay.

## Technical Highlights
- **GSAP 3 + Flip**: Timeline-driven sequential orchestration, Flip plugin registered.
- **GSAP Context**: Managed inside `gsap.context()` for clean scoping, teardown, and resize re-creation.
- **Zero Horizontal Drift & Exact Center**: Calibrated via `getBoundingClientRect()` on rendered artwork edges.
- **Responsive Layout**: Re-measures and adapts for desktop, tablet, and mobile (e.g., iPhone 390x844).
- **Reduced Motion**: Respects `prefers-reduced-motion` by jumping directly to the finished lockup.
- **Keyframe Inspection**: Supports URL query parameters (e.g., `?time=2.5` or `?progress=1.0`) for inspecting specific timestamps.

## How to Run

1. Open `index.html` in any modern web browser or serve via:
   ```bash
   npx serve .
   ```
2. The animation runs automatically, holds for 3 seconds, and provides a replay button.
