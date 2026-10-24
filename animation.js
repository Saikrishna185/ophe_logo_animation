/**
 * OPHE Logo Animation — GSAP 3 Orchestrated Suite
 * 
 * Visual Bounding Box Centering Architecture & Flow:
 * 1. Initial State: Uppercase OPHE centered horizontally and vertically at viewport center.
 * 2. Letter Shuffle: Four individual letter elements (O, P, H, E) smoothly rearrange into HOPE
 *    via coordinated sliding paths with collision clearance.
 * 3. Seamless Asset Crossfade: Transitions into official 06_hope.png asset while holding centered.
 * 4. Tagline Reveal: Bringing and Left Line enter from left, to your doorsteps and Right Line from right,
 *    settling into final positions around stationary HOPE. Tagline holds briefly.
 * 5. Downward Motion & Logo Reveal: Complete tagline group moves downward as ONE unit while
 *    OPHE™ logo is revealed directly above it.
 * 6. Final Composition: Both logo and tagline share exact horizontal center of the viewport.
 *    Composition holds for 3 seconds.
 * 7. Verification: getBoundingClientRect() validation confirms subpixel visual alignment.
 */

(function () {
  'use strict';

  // Register GSAP Flip plugin if loaded
  if (typeof Flip !== 'undefined' && typeof gsap !== 'undefined') {
    gsap.registerPlugin(Flip);
  }

  // DOM Elements
  let stage, scene;
  let logoGroup, logoSymbol, logoWordmark, logoTm;
  let taglineGroup, taglineHope, assetHope, lettersWrap;
  let letterO, letterP, letterH, letterE;
  let leftLine, pieceBringing, pieceDoorsteps, rightLine;
  let replayBtn;

  // Layout & coordinate cache
  const layout = {
    vW: 0,
    vH: 0,
    viewportCenter: 0,
    viewportMiddleY: 0,
    logoWidth: 0,
    logoHeight: 0,
    finalLogoX: 0,
    finalLogoY: 0,
    taglineWidth: 0,
    hopeWidth: 0,
    hopeHeight: 0,
    slotWidth: 0,
    startX: 0,
    startY: 0,
    finalTaglineX: 0,
    finalTaglineY: 0,
    hopeCenterInTagline: 0,
    taglineCenterInTagline: 0,
  };

  let masterTimeline = null;
  let currentContext = null;
  let resizeTimeout = null;

  /**
   * Calculate all responsive sizing and precise coordinates using getBoundingClientRect()
   */
  function calculateLayout() {
    layout.vW = window.innerWidth;
    layout.vH = window.innerHeight;
    const viewportCenter = layout.vW / 2;
    const viewportMiddleY = layout.vH / 2;
    layout.viewportCenter = viewportCenter;
    layout.viewportMiddleY = viewportMiddleY;

    // 1. Tagline Sizing (Enhanced for readability):
    // Desktop (>= 1024px): 60–68% of viewport width (max 1280px)
    // Tablet (600–1023px): 75–82% of viewport width (max 880px)
    // Mobile (< 600px): 90–94% of viewport width (max 580px)
    let targetTaglineW;
    if (layout.vW >= 1024) {
      targetTaglineW = Math.min(layout.vW * 0.68, 1280);
    } else if (layout.vW >= 600) {
      targetTaglineW = Math.min(layout.vW * 0.82, 880);
    } else {
      targetTaglineW = Math.min(layout.vW * 0.94, 580);
    }
    targetTaglineW = Math.max(300, targetTaglineW);
    layout.taglineWidth = targetTaglineW;

    // Scale relative to master reference width (1908px)
    const scale = targetTaglineW / 1908;

    // Proportional dimensions of tagline elements
    const leftLineW = Math.round(160 * scale);
    const leftLineH = Math.max(3, Math.round(13 * scale));
    const gapLine = Math.max(5, Math.round(18 * scale));

    const bringingW = Math.round(413 * scale);
    const gapWord = Math.max(4, Math.round(14 * scale));

    layout.hopeWidth = Math.round(311 * scale);
    layout.hopeHeight = Math.round(85 * scale);
    layout.slotWidth = layout.hopeWidth / 4;

    const doorstepsW = Math.round(841 * scale);
    const rightLineW = Math.round(156 * scale);
    const rightLineH = Math.max(3, Math.round(13 * scale));

    // Apply dimensions to DOM
    if (leftLine) {
      leftLine.style.width = `${leftLineW}px`;
      leftLine.style.height = `${leftLineH}px`;
      leftLine.style.marginRight = `${gapLine}px`;
    }

    if (pieceBringing) {
      pieceBringing.style.width = `${bringingW}px`;
      pieceBringing.style.marginRight = `${gapWord}px`;
    }

    if (taglineHope) {
      taglineHope.style.width = `${layout.hopeWidth}px`;
      taglineHope.style.height = `${layout.hopeHeight}px`;
    }

    if (pieceDoorsteps) {
      pieceDoorsteps.style.width = `${doorstepsW}px`;
      pieceDoorsteps.style.marginLeft = `${gapWord}px`;
    }

    if (rightLine) {
      rightLine.style.width = `${rightLineW}px`;
      rightLine.style.height = `${rightLineH}px`;
      rightLine.style.marginLeft = `${gapLine}px`;
    }

    if (lettersWrap) {
      lettersWrap.style.fontSize = `${Math.round(layout.hopeHeight * 0.92)}px`;
    }

    // 2. Dominant OPHE™ Logo Sizing:
    // Sized larger than the tagline, dominating the lockup
    let targetLogoW = Math.min(layout.vW * 0.78, targetTaglineW * 1.15);
    layout.logoWidth = Math.round(targetLogoW);
    layout.logoHeight = Math.round(layout.logoWidth * (526 / 1893));

    if (logoGroup) {
      logoGroup.style.width = `${layout.logoWidth}px`;
      logoGroup.style.height = `${layout.logoHeight}px`;
    }

    // 3. Exact Coordinate Measurements using getBoundingClientRect():
    // Reset positions to origin for zero-offset measurement
    taglineGroup.style.left = '0px';
    taglineGroup.style.top = '0px';
    taglineGroup.style.transform = 'none';

    logoGroup.style.left = '0px';
    logoGroup.style.top = '0px';
    logoGroup.style.transform = 'none';

    // Measure actual rendered visible bounds of complete tagline (leftLine to rightLine)
    const leftRect = leftLine.getBoundingClientRect();
    const rightRect = rightLine.getBoundingClientRect();
    const hopeRect = taglineHope.getBoundingClientRect();

    const taglineVisLeft = leftRect.left;
    const taglineVisRight = rightRect.right;
    const taglineVisCenter = (taglineVisLeft + taglineVisRight) / 2;

    const hopeVisLeft = hopeRect.left;
    const hopeVisRight = hopeRect.right;
    const hopeVisCenter = (hopeVisLeft + hopeVisRight) / 2;
    const hopeVisMiddleY = (hopeRect.top + hopeRect.bottom) / 2;

    layout.hopeCenterInTagline = hopeVisCenter;
    layout.taglineCenterInTagline = taglineVisCenter;

    // Start position: Center HOPE horizontally and vertically at viewport center
    layout.startX = viewportCenter - hopeVisCenter;
    layout.startY = viewportMiddleY - hopeVisMiddleY;

    // Final tagline X: Center COMPLETE tagline horizontally at viewport center
    layout.finalTaglineX = viewportCenter - taglineVisCenter;

    // Measure actual rendered visible bounds of complete logo (logoSymbol to logoTm)
    const symRect = logoSymbol.getBoundingClientRect();
    const tmRect = logoTm.getBoundingClientRect();
    const logoVisLeft = symRect.left;
    const logoVisRight = tmRect.right;
    const logoVisCenter = (logoVisLeft + logoVisRight) / 2;

    // Final logo X: Center COMPLETE logo horizontally at viewport center
    layout.finalLogoX = viewportCenter - logoVisCenter;

    // 4. Vertical Positions for final balanced lockup:
    const verticalGap = Math.max(20, Math.round(layout.logoHeight * 0.16));
    const compTotalH = layout.logoHeight + verticalGap + layout.hopeHeight;
    const compTop = viewportMiddleY - compTotalH / 2;

    layout.finalLogoY = compTop;
    layout.finalTaglineY = compTop + layout.logoHeight + verticalGap;

    // Set base positions
    taglineGroup.style.left = `${layout.startX}px`;
    taglineGroup.style.top = `${layout.startY}px`;

    logoGroup.style.left = `${layout.finalLogoX}px`;
    logoGroup.style.top = `${layout.finalLogoY}px`;
  }

  /**
   * Validate subpixel alignment using getBoundingClientRect()
   */
  function validateAlignment() {
    const symRect = logoSymbol.getBoundingClientRect();
    const tmRect = logoTm.getBoundingClientRect();
    const logoCenterX = (symRect.left + tmRect.right) / 2;

    const leftRect = leftLine.getBoundingClientRect();
    const rightRect = rightLine.getBoundingClientRect();
    const taglineCenterX = (leftRect.left + rightRect.right) / 2;

    const viewportCenterX = window.innerWidth / 2;
    const logoDiff = Math.abs(logoCenterX - viewportCenterX);
    const taglineDiff = Math.abs(taglineCenterX - viewportCenterX);

    console.log(
      `%c[Ophe GSAP Validation]%c Viewport: ${viewportCenterX.toFixed(1)}px | Logo Center: ${logoCenterX.toFixed(1)}px (diff: ${logoDiff.toFixed(2)}px) | Tagline Center: ${taglineCenterX.toFixed(1)}px (diff: ${taglineDiff.toFixed(2)}px)`,
      'color: #fe5d3a; font-weight: bold;',
      'color: #1b2b33;'
    );

    return { logoDiff, taglineDiff, isCentered: logoDiff < 1.5 && taglineDiff < 1.5 };
  }

  /**
   * Build and run the orchestrated GSAP master timeline
   */
  function buildAndRunAnimation() {
    // Teardown previous GSAP context to prevent conflicting tweens/transforms
    if (currentContext) {
      currentContext.revert();
    }

    currentContext = gsap.context(() => {
      calculateLayout();

      const {
        slotWidth,
        hopeHeight,
        startX,
        startY,
        finalTaglineX,
        finalTaglineY,
      } = layout;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Initial visual states
      gsap.set(logoGroup, { autoAlpha: 0, scale: 0.94, filter: 'blur(10px)' });
      gsap.set([leftLine, pieceBringing, pieceDoorsteps, rightLine], { autoAlpha: 0 });
      gsap.set(assetHope, { autoAlpha: 0 });
      gsap.set(lettersWrap, { autoAlpha: 1 });
      gsap.set([letterO, letterP, letterH, letterE], {
        x: 0,
        y: 0,
        rotation: 0,
        color: '#1b2b33',
      });
      gsap.set(letterH, { zIndex: 10 });
      gsap.set(taglineGroup, { x: 0, y: 0 });
      if (replayBtn) gsap.set(replayBtn, { autoAlpha: 0, pointerEvents: 'none' });

      // Master Timeline
      masterTimeline = gsap.timeline({
        paused: false,
        onComplete: () => {
          validateAlignment();
        },
      });

      if (prefersReducedMotion) {
        // Reduced motion: jump immediately to final composition
        gsap.set(lettersWrap, { autoAlpha: 0 });
        gsap.set(assetHope, { autoAlpha: 1 });
        gsap.set([leftLine, pieceBringing, pieceDoorsteps, rightLine], { autoAlpha: 1, x: 0 });
        gsap.set(taglineGroup, { x: finalTaglineX - startX, y: finalTaglineY - startY });
        gsap.set(logoGroup, { autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
        if (replayBtn) gsap.set(replayBtn, { autoAlpha: 0.9, pointerEvents: 'auto' });
        validateAlignment();
        return;
      }

      // ==============================================================
      // PHASE 1: 0.0s – 2.0s: OPHE holds centered, then smoothly shuffles into HOPE
      // ==============================================================
      // 0.0s to 0.45s: Hold OPHE centered in dark navy
      // 0.45s to 1.95s: Controlled sliding paths with slight overlaps

      const shuffleStart = 0.45;
      const arcH = -Math.round(hopeHeight * 0.58);
      const dipO = Math.round(hopeHeight * 0.18);
      const waveP = -Math.round(hopeHeight * 0.12);

      // Letter H: moves from Slot 2 to Slot 0 (-2 slots) along a smooth overhead arc
      masterTimeline.to(letterH, {
        x: -2 * slotWidth,
        duration: 1.4,
        ease: 'power2.inOut',
      }, shuffleStart);

      masterTimeline.to(letterH, {
        y: arcH,
        duration: 0.7,
        ease: 'power1.out',
      }, shuffleStart);

      masterTimeline.to(letterH, {
        y: 0,
        duration: 0.7,
        ease: 'power1.in',
      }, shuffleStart + 0.7);

      masterTimeline.to(letterH, {
        rotation: -4,
        duration: 0.7,
        ease: 'power1.out',
      }, shuffleStart);

      masterTimeline.to(letterH, {
        rotation: 0,
        duration: 0.7,
        ease: 'power1.in',
      }, shuffleStart + 0.7);

      // Letter O: moves from Slot 0 to Slot 1 (+1 slot) along a gentle under-curve
      masterTimeline.to(letterO, {
        x: 1 * slotWidth,
        duration: 1.32,
        ease: 'power2.inOut',
      }, shuffleStart + 0.08);

      masterTimeline.to(letterO, {
        y: dipO,
        duration: 0.66,
        ease: 'power1.out',
      }, shuffleStart + 0.08);

      masterTimeline.to(letterO, {
        y: 0,
        duration: 0.66,
        ease: 'power1.in',
      }, shuffleStart + 0.74);

      masterTimeline.to(letterO, {
        rotation: 3,
        duration: 0.66,
        ease: 'power1.out',
      }, shuffleStart + 0.08);

      masterTimeline.to(letterO, {
        rotation: 0,
        duration: 0.66,
        ease: 'power1.in',
      }, shuffleStart + 0.74);

      // Letter P: moves from Slot 1 to Slot 2 (+1 slot)
      masterTimeline.to(letterP, {
        x: 1 * slotWidth,
        duration: 1.25,
        ease: 'power2.inOut',
      }, shuffleStart + 0.15);

      masterTimeline.to(letterP, {
        y: waveP,
        duration: 0.62,
        ease: 'power1.out',
      }, shuffleStart + 0.15);

      masterTimeline.to(letterP, {
        y: 0,
        duration: 0.63,
        ease: 'power1.in',
      }, shuffleStart + 0.77);

      // Letter E: subtle settle in Slot 3
      masterTimeline.to(letterE, {
        y: -Math.round(hopeHeight * 0.08),
        duration: 0.45,
        ease: 'sine.out',
      }, shuffleStart + 0.22);

      masterTimeline.to(letterE, {
        y: 0,
        duration: 0.45,
        ease: 'sine.in',
      }, shuffleStart + 0.67);

      // Smooth color transition to brand orange (#fe5d3a)
      masterTimeline.to([letterO, letterP, letterH, letterE], {
        color: '#fe5d3a',
        duration: 1.15,
        ease: 'power1.inOut',
      }, shuffleStart + 0.2);

      // ==============================================================
      // PHASE 2: 1.95s – 3.2s: Seamless Crossfade to 06_hope.png & Hold Centered
      // ==============================================================
      // Seamless crossfade: lettersWrap -> assetHope
      masterTimeline.to(assetHope, {
        autoAlpha: 1,
        duration: 0.38,
        ease: 'power1.inOut',
      }, 1.95);

      masterTimeline.to(lettersWrap, {
        autoAlpha: 0,
        duration: 0.38,
        ease: 'power1.inOut',
      }, 1.95);

      // 2.33s – 3.2s: HOPE holds stationary, perfectly centered in viewport

      // ==============================================================
      // PHASE 3: 3.2s – 5.3s: Build Complete Tagline Around Stationary HOPE
      // ==============================================================
      // Left wing: Left Line & Bringing enter from left
      masterTimeline.fromTo([leftLine, pieceBringing], {
        autoAlpha: 0,
        x: -130,
      }, {
        autoAlpha: 1,
        x: 0,
        duration: 1.15,
        ease: 'power3.out',
        stagger: 0.06,
      }, 3.2);

      // Right wing: to your doorsteps & Right Line enter from right
      masterTimeline.fromTo([pieceDoorsteps, rightLine], {
        autoAlpha: 0,
        x: 130,
      }, {
        autoAlpha: 1,
        x: 0,
        duration: 1.15,
        ease: 'power3.out',
        stagger: 0.06,
      }, 3.32);

      // 4.47s – 5.3s: Complete tagline holds stably centered for readability (0.83s hold)

      // ==============================================================
      // PHASE 4: 5.3s – 6.8s: Move Tagline Downward & Reveal Dominant OPHE™ Logo
      // ==============================================================
      // The entire tagline group moves down and centers as ONE unified unit
      const taglineShiftX = finalTaglineX - startX;
      const taglineShiftY = finalTaglineY - startY;

      masterTimeline.to(taglineGroup, {
        x: taglineShiftX,
        y: taglineShiftY,
        duration: 1.45,
        ease: 'power3.inOut',
      }, 5.3);

      // Simultaneously, the dominant OPHE™ logo is revealed above it
      masterTimeline.fromTo(logoGroup, {
        autoAlpha: 0,
        scale: 0.94,
        filter: 'blur(10px)',
      }, {
        autoAlpha: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.35,
        ease: 'power2.out',
      }, 5.55);

      // ==============================================================
      // PHASE 5: 6.8s – 9.8s+ (3.0s Hold of Final Balanced Composition)
      // ==============================================================
      // Replay button appears cleanly at 9.8s
      masterTimeline.to(replayBtn, {
        autoAlpha: 0.88,
        duration: 0.45,
        ease: 'power2.out',
        pointerEvents: 'auto',
      }, 9.8);

      // Support inspecting specific keyframes via URL query params (e.g., ?time=2.5 or ?progress=1)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('time')) {
        const t = parseFloat(urlParams.get('time'));
        masterTimeline.pause();
        masterTimeline.seek(t);
        validateAlignment();
      } else if (urlParams.has('progress')) {
        const p = parseFloat(urlParams.get('progress'));
        masterTimeline.pause();
        masterTimeline.progress(p);
        validateAlignment();
      }
    });
  }

  /**
   * Replay handler
   */
  function handleReplay() {
    if (replayBtn) {
      gsap.to(replayBtn, { autoAlpha: 0, duration: 0.2, pointerEvents: 'none' });
    }
    if (masterTimeline) {
      masterTimeline.restart();
    } else {
      buildAndRunAnimation();
    }
  }

  /**
   * Handle responsive viewport resize and orientation changes
   */
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentProgress = masterTimeline ? masterTimeline.progress() : 0;
      buildAndRunAnimation();
      if (currentProgress >= 0.98) {
        masterTimeline.progress(1);
      } else if (currentProgress > 0) {
        masterTimeline.progress(currentProgress);
      }
    }, 120);
  }

  /**
   * Initialization
   */
  function init() {
    stage = document.getElementById('stage');
    scene = document.getElementById('scene');

    logoGroup = document.getElementById('logoGroup');
    logoSymbol = document.getElementById('logoSymbol');
    logoWordmark = document.getElementById('logoWordmark');
    logoTm = document.getElementById('logoTm');

    taglineGroup = document.getElementById('taglineGroup');
    taglineHope = document.getElementById('taglineHope');
    assetHope = document.getElementById('assetHope');
    lettersWrap = document.getElementById('lettersWrap');

    letterO = document.getElementById('letterO');
    letterP = document.getElementById('letterP');
    letterH = document.getElementById('letterH');
    letterE = document.getElementById('letterE');

    leftLine = document.getElementById('leftLine');
    pieceBringing = document.getElementById('pieceBringing');
    pieceDoorsteps = document.getElementById('pieceDoorsteps');
    rightLine = document.getElementById('rightLine');
    replayBtn = document.getElementById('replayBtn');

    if (replayBtn) {
      replayBtn.addEventListener('click', handleReplay);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Ensure web fonts and images are ready before calculating layout
    const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const imgs = Array.from(document.querySelectorAll('img'));
    const imgPromises = imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });

    Promise.all([fontReady, ...imgPromises]).then(() => {
      buildAndRunAnimation();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
