/**
 * OPHE Logo Animation — Motion (vanilla JS) Sequence Engine
 * Stage 2: Slow "conform, then dissolve" OPHE -> HOPE
 */

(function () {
  'use strict';

  const { animate } = window.Motion;

  // Cubic bezier easing curves exact conversion
  const EASE = {
    power1In: [0.55, 0.085, 0.68, 0.53],
    power1Out: [0.25, 0.46, 0.45, 0.94],
    power1InOut: [0.455, 0.03, 0.515, 0.955],
    power2Out: [0.215, 0.61, 0.355, 1],
    power2InOut: [0.645, 0.045, 0.355, 1],
    power3Out: [0.165, 0.84, 0.44, 1],
    power3InOut: [0.77, 0, 0.175, 1],
    sineIn: [0.47, 0, 0.745, 0.715],
    sineOut: [0.39, 0.575, 0.565, 1],
    sineInOut: [0.445, 0.05, 0.55, 0.95],
  };

  // Measured conform targets as fractions of hopeWidth and hopeHeight (Weight 800)
  const CONFORM_TARGETS = {
    H: { dx: 2.0 / 139, dy: -0.5 / 38, sx: 29 / 22, sy: 33 / 24 },
    O: { dx: 2.2 / 139, dy: -0.5 / 38, sx: 34.5 / 26, sy: 34 / 25 },
    P: { dx: 0.8 / 139, dy: -0.5 / 38, sx: 27.5 / 22, sy: 33 / 24 },
    E: { dx: -4.0 / 139, dy: -0.5 / 38, sx: 24 / 19, sy: 33 / 24 },
  };

  // DOM Elements
  let logoGroup, logoSymbol, logoTm;
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
    buildOffsetX: 0,
  };

  let masterControls = null;
  let resizeTimeout = null;

  /**
   * Apply initial inline styles directly before layout measurement and on replay
   */
  function applyInitialState() {
    if (logoGroup) {
      logoGroup.style.opacity = '0';
      logoGroup.style.visibility = 'hidden';
      logoGroup.style.transform = 'scale(0.92)';
      logoGroup.style.transformOrigin = 'center center';
      logoGroup.style.filter = 'blur(14px)';
      logoGroup.style.removeProperty('filter');
      logoGroup.style.filter = 'blur(14px)';
    }

    const wingElements = [leftLine, pieceBringing, pieceDoorsteps, rightLine];
    for (const el of wingElements) {
      if (el) {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        el.style.transform = 'none';
        el.style.transformOrigin = 'center center';
      }
    }

    if (taglineHope) {
      taglineHope.style.transform = 'scale(0.94)';
      taglineHope.style.transformOrigin = 'center center';
    }

    if (assetHope) {
      assetHope.style.opacity = '0';
      assetHope.style.visibility = 'hidden';
      assetHope.style.transform = 'none';
      assetHope.style.transformOrigin = 'center center';
    }

    if (lettersWrap) {
      lettersWrap.style.opacity = '1';
      lettersWrap.style.visibility = 'visible';
      lettersWrap.style.transform = 'none';
      lettersWrap.style.transformOrigin = 'center center';
    }

    const letters = [letterO, letterP, letterH, letterE];
    for (const l of letters) {
      if (l) {
        l.style.transform = 'none';
        l.style.color = '#1b2b33';
        l.style.transformOrigin = 'center center';
      }
    }
    if (letterH) letterH.style.zIndex = '10';

    if (taglineGroup) {
      taglineGroup.style.transform = 'none';
      taglineGroup.style.transformOrigin = 'center center';
    }

    if (replayBtn) {
      replayBtn.style.opacity = '0';
      replayBtn.style.visibility = 'hidden';
      replayBtn.style.pointerEvents = 'none';
    }
  }

  /**
   * Cancel running controls and clear all inline styles
   */
  function teardown() {
    if (masterControls) {
      try { masterControls.cancel(); } catch (e) {}
      masterControls = null;
    }

    const allElements = [
      logoGroup,
      taglineGroup,
      taglineHope,
      assetHope,
      lettersWrap,
      letterO,
      letterP,
      letterH,
      letterE,
      leftLine,
      pieceBringing,
      pieceDoorsteps,
      rightLine,
    ];

    for (const el of allElements) {
      if (el) {
        el.style.transform = 'none';
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.removeProperty('visibility');
        el.style.filter = '';
        el.style.removeProperty('filter');
        el.style.color = '';
        el.style.left = '0px';
        el.style.top = '0px';
      }
    }

    if (replayBtn) {
      replayBtn.style.opacity = '';
      replayBtn.style.visibility = '';
      replayBtn.style.removeProperty('visibility');
      replayBtn.style.removeProperty('left');
      replayBtn.style.removeProperty('top');
      replayBtn.style.removeProperty('transform');
      replayBtn.style.pointerEvents = 'none';
    }
  }

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

    // Reference constants:
    const REF_LEFT_LINE = 160;
    const REF_LEFT_LINE_H = 13;
    const REF_GAP_LINE = 18;
    const REF_BRINGING = 413;
    const REF_GAP_WORD = 14;
    const REF_HOPE = 311;
    const REF_HOPE_H = 85;
    const REF_DOORSTEPS = 841;
    const REF_RIGHT_LINE = 156;
    const REF_RIGHT_LINE_H = 13;

    const isMobile = layout.vW < 600;
    let targetTaglineW;
    let leftLineRefW, rightLineRefW;
    let scale;

    if (isMobile) {
      targetTaglineW = Math.min(layout.vW * 0.96, 580);
      targetTaglineW = Math.min(targetTaglineW, layout.vW - 24);
      targetTaglineW = Math.max(200, targetTaglineW);

      leftLineRefW = REF_LEFT_LINE * 0.5;
      rightLineRefW = REF_RIGHT_LINE * 0.5;

      const refTaglineW =
        leftLineRefW +
        REF_GAP_LINE +
        REF_BRINGING +
        REF_GAP_WORD +
        REF_HOPE +
        REF_GAP_WORD +
        REF_DOORSTEPS +
        REF_GAP_LINE +
        rightLineRefW;

      scale = targetTaglineW / refTaglineW;
    } else {
      if (layout.vW >= 1024) {
        targetTaglineW = Math.min(layout.vW * 0.68, 1280);
      } else {
        targetTaglineW = Math.min(layout.vW * 0.82, 880);
      }
      targetTaglineW = Math.max(300, targetTaglineW);

      leftLineRefW = REF_LEFT_LINE;
      rightLineRefW = REF_RIGHT_LINE;

      const refTaglineW =
        REF_LEFT_LINE +
        REF_GAP_LINE +
        REF_BRINGING +
        REF_GAP_WORD +
        REF_HOPE +
        REF_GAP_WORD +
        REF_DOORSTEPS +
        REF_GAP_LINE +
        REF_RIGHT_LINE;

      scale = targetTaglineW / refTaglineW;
    }

    layout.taglineWidth = targetTaglineW;

    const leftLineW = Math.round(leftLineRefW * scale);
    const leftLineH = Math.max(3, Math.round(REF_LEFT_LINE_H * scale));
    const gapLine = Math.max(4, Math.round(REF_GAP_LINE * scale));

    const bringingW = Math.round(REF_BRINGING * scale);
    const gapWord = Math.max(3, Math.round(REF_GAP_WORD * scale));

    layout.hopeWidth = Math.round(REF_HOPE * scale);
    layout.hopeHeight = Math.round(REF_HOPE_H * scale);
    layout.slotWidth = layout.hopeWidth / 4;

    const doorstepsW = Math.round(REF_DOORSTEPS * scale);
    const rightLineW = Math.round(rightLineRefW * scale);
    const rightLineH = Math.max(3, Math.round(REF_RIGHT_LINE_H * scale));

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
      taglineHope.style.transform = 'none'; // measure with transform cleared
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

    let targetLogoW = Math.min(layout.vW * 0.78, targetTaglineW * 1.15);
    layout.logoWidth = Math.round(targetLogoW);
    layout.logoHeight = Math.round(layout.logoWidth * (526 / 1893));

    if (logoGroup) {
      logoGroup.style.width = `${layout.logoWidth}px`;
      logoGroup.style.height = `${layout.logoHeight}px`;
    }

    // Measure with transforms cleared
    taglineGroup.style.left = '0px';
    taglineGroup.style.top = '0px';
    taglineGroup.style.transform = 'none';

    logoGroup.style.left = '0px';
    logoGroup.style.top = '0px';
    logoGroup.style.transform = 'none';

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

    layout.startX = viewportCenter - hopeVisCenter;
    layout.startY = viewportMiddleY - hopeVisMiddleY;

    layout.finalTaglineX = viewportCenter - taglineVisCenter;

    const rightEdgeAtStart = layout.startX + taglineVisRight;
    const leftEdgeAtStart = layout.startX + taglineVisLeft;
    const rightOverflow = rightEdgeAtStart - (layout.vW - 12);

    if (rightOverflow > 0) {
      let offset = -rightOverflow;
      const minOffset = 12 - leftEdgeAtStart;
      if (offset < minOffset) {
        offset = minOffset;
      }
      layout.buildOffsetX = offset;
    } else {
      layout.buildOffsetX = 0;
    }

    const symRect = logoSymbol.getBoundingClientRect();
    const tmRect = logoTm.getBoundingClientRect();
    const logoVisLeft = symRect.left;
    const logoVisRight = tmRect.right;
    const logoVisCenter = (logoVisLeft + logoVisRight) / 2;

    layout.finalLogoX = viewportCenter - logoVisCenter;

    const verticalGap = Math.max(20, Math.round(layout.logoHeight * 0.16));
    const compTotalH = layout.logoHeight + verticalGap + layout.hopeHeight;
    const compTop = viewportMiddleY - compTotalH / 2;

    layout.finalLogoY = compTop;
    layout.finalTaglineY = compTop + layout.logoHeight + verticalGap;

    taglineGroup.style.left = `${layout.startX}px`;
    taglineGroup.style.top = `${layout.startY}px`;

    logoGroup.style.left = `${layout.finalLogoX}px`;
    logoGroup.style.top = `${layout.finalLogoY}px`;
  }

  /**
   * Validate alignment
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

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === '1') {
      const hopeRect = taglineHope ? taglineHope.getBoundingClientRect() : null;
      const data = {
        viewportCenterX,
        logoCenterX,
        taglineCenterX,
        logoDiff,
        taglineDiff,
        isCentered: logoDiff < 1.5 && taglineDiff < 1.5,
        hopeX: hopeRect ? Number(((hopeRect.left + hopeRect.right) / 2).toFixed(2)) : 0,
        hopeY: hopeRect ? Number(((hopeRect.top + hopeRect.bottom) / 2).toFixed(2)) : 0,
        hopeW: hopeRect ? Number(hopeRect.width.toFixed(2)) : 0,
        hopeH: hopeRect ? Number(hopeRect.height.toFixed(2)) : 0,
        buildOffsetX: Number(layout.buildOffsetX.toFixed(2)),
        logoFilter: logoGroup ? window.getComputedStyle(logoGroup).filter : '',
      };
      document.documentElement.dataset.debug = JSON.stringify(data);
    }

    return { logoDiff, taglineDiff, isCentered: logoDiff < 1.5 && taglineDiff < 1.5 };
  }

  /**
   * Synchronize discrete visibility and blur filter state on seek
   */
  function syncVisibilityAndFilter(t) {
    if (assetHope) assetHope.style.setProperty('visibility', t >= 2.20 ? 'visible' : 'hidden', 'important');
    if (lettersWrap) lettersWrap.style.setProperty('visibility', t < 2.75 ? 'visible' : 'hidden', 'important');
    if (leftLine) leftLine.style.setProperty('visibility', t >= 3.30 ? 'visible' : 'hidden', 'important');
    if (pieceBringing) pieceBringing.style.setProperty('visibility', t >= 3.36 ? 'visible' : 'hidden', 'important');
    if (pieceDoorsteps) pieceDoorsteps.style.setProperty('visibility', t >= 3.42 ? 'visible' : 'hidden', 'important');
    if (rightLine) rightLine.style.setProperty('visibility', t >= 3.48 ? 'visible' : 'hidden', 'important');
    if (logoGroup) {
      logoGroup.style.setProperty('visibility', t >= 5.55 ? 'visible' : 'hidden', 'important');
      if (t >= 7.25) {
        logoGroup.style.setProperty('filter', 'none', 'important');
      } else {
        logoGroup.style.removeProperty('filter');
      }
    }
    if (replayBtn) {
      replayBtn.style.setProperty('visibility', t >= 10.25 ? 'visible' : 'hidden', 'important');
      replayBtn.style.pointerEvents = t >= 10.25 ? 'auto' : 'none';
    }
  }

  /**
   * Build Motion Sequence
   */
  function buildAndRunAnimation() {
    teardown();
    applyInitialState();
    calculateLayout();

    const {
      slotWidth,
      hopeWidth,
      hopeHeight,
      startX,
      startY,
      finalTaglineX,
      finalTaglineY,
    } = layout;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (taglineHope) {
        taglineHope.style.transform = 'none';
      }
      if (lettersWrap) {
        lettersWrap.style.opacity = '0';
        lettersWrap.style.visibility = 'hidden';
        lettersWrap.style.transform = 'none';
      }
      if (assetHope) {
        assetHope.style.opacity = '1';
        assetHope.style.visibility = 'visible';
        assetHope.style.transform = 'none';
      }
      const wingElements = [leftLine, pieceBringing, pieceDoorsteps, rightLine];
      for (const el of wingElements) {
        if (el) {
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.transform = 'none';
        }
      }
      if (taglineGroup) {
        taglineGroup.style.transform = `translate(${finalTaglineX - startX}px, ${finalTaglineY - startY}px)`;
      }
      if (logoGroup) {
        logoGroup.style.opacity = '1';
        logoGroup.style.visibility = 'visible';
        logoGroup.style.transform = 'scale(1)';
        logoGroup.style.filter = 'none';
      }
      if (replayBtn) {
        replayBtn.style.opacity = '0.9';
        replayBtn.style.visibility = 'visible';
        replayBtn.style.pointerEvents = 'auto';
      }
      validateAlignment();
      return;
    }

    // Motion Sequence definitions
    const shuffleStart = 0.45;
    const arcH = -Math.round(hopeHeight * 0.58);
    const dipO = Math.round(hopeHeight * 0.18);
    const waveP = -Math.round(hopeHeight * 0.12);

    const wingOffset = Math.min(130, Math.max(50, Math.round(layout.vW * 0.22)));

    const taglineShiftX = finalTaglineX - startX;
    const taglineShiftY = finalTaglineY - startY;

    // Letter conform target offsets & scales
    const hConformX = -2 * slotWidth + CONFORM_TARGETS.H.dx * hopeWidth;
    const hConformY = CONFORM_TARGETS.H.dy * hopeHeight;

    const oConformX = 1 * slotWidth + CONFORM_TARGETS.O.dx * hopeWidth;
    const oConformY = CONFORM_TARGETS.O.dy * hopeHeight;

    const pConformX = 1 * slotWidth + CONFORM_TARGETS.P.dx * hopeWidth;
    const pConformY = CONFORM_TARGETS.P.dy * hopeHeight;

    const eConformX = 0 + CONFORM_TARGETS.E.dx * hopeWidth;
    const eConformY = CONFORM_TARGETS.E.dy * hopeHeight;

    const sequence = [
      // ==============================================================
      // PHASE 1: 0.45s – 1.85s: Letter Shuffle
      // ==============================================================
      // Letter H
      [letterH, { x: [0, -2 * slotWidth] }, { at: shuffleStart, duration: 1.4, ease: EASE.power2InOut }],
      [letterH, { y: [0, arcH] }, { at: shuffleStart, duration: 0.7, ease: EASE.power1Out }],
      [letterH, { y: [arcH, 0] }, { at: shuffleStart + 0.7, duration: 0.7, ease: EASE.power1In }],
      [letterH, { rotate: [0, -4] }, { at: shuffleStart, duration: 0.7, ease: EASE.power1Out }],
      [letterH, { rotate: [-4, 0] }, { at: shuffleStart + 0.7, duration: 0.7, ease: EASE.power1In }],

      // Letter O
      [letterO, { x: [0, 1 * slotWidth] }, { at: shuffleStart + 0.08, duration: 1.32, ease: EASE.power2InOut }],
      [letterO, { y: [0, dipO] }, { at: shuffleStart + 0.08, duration: 0.66, ease: EASE.power1Out }],
      [letterO, { y: [dipO, 0] }, { at: shuffleStart + 0.74, duration: 0.66, ease: EASE.power1In }],
      [letterO, { rotate: [0, 3] }, { at: shuffleStart + 0.08, duration: 0.66, ease: EASE.power1Out }],
      [letterO, { rotate: [3, 0] }, { at: shuffleStart + 0.74, duration: 0.66, ease: EASE.power1In }],

      // Letter P
      [letterP, { x: [0, 1 * slotWidth] }, { at: shuffleStart + 0.15, duration: 1.25, ease: EASE.power2InOut }],
      [letterP, { y: [0, waveP] }, { at: shuffleStart + 0.15, duration: 0.62, ease: EASE.power1Out }],
      [letterP, { y: [waveP, 0] }, { at: shuffleStart + 0.77, duration: 0.63, ease: EASE.power1In }],

      // Letter E
      [letterE, { y: [0, -Math.round(hopeHeight * 0.08)] }, { at: shuffleStart + 0.22, duration: 0.45, ease: EASE.sineOut }],
      [letterE, { y: [-Math.round(hopeHeight * 0.08), 0] }, { at: shuffleStart + 0.67, duration: 0.45, ease: EASE.sineIn }],

      // Color transition (ends at 1.60s)
      [letterO, { color: ['#1b2b33', '#fe5d3a'] }, { at: 0.55, duration: 1.05, ease: EASE.power1InOut }],
      [letterP, { color: ['#1b2b33', '#fe5d3a'] }, { at: 0.55, duration: 1.05, ease: EASE.power1InOut }],
      [letterH, { color: ['#1b2b33', '#fe5d3a'] }, { at: 0.55, duration: 1.05, ease: EASE.power1InOut }],
      [letterE, { color: ['#1b2b33', '#fe5d3a'] }, { at: 0.55, duration: 1.05, ease: EASE.power1InOut }],

      // ==============================================================
      // PHASE 2: 1.45s – 2.75s: Slow "Conform, then Dissolve" OPHE -> HOPE
      // ==============================================================
      // Shared parent scale [0.94, 1.0] from 1.45s to 2.75s (1.30s, ease sine.inOut)
      [taglineHope, { scale: [0.94, 1.0] }, { at: 1.45, duration: 1.30, ease: EASE.sineInOut }],

      // 1.85s – 2.40s: CONFORM (0.55s, ease sine.inOut)
      [letterH, {
        x: [-2 * slotWidth, hConformX],
        y: [0, hConformY],
        scaleX: [1.0, CONFORM_TARGETS.H.sx],
        scaleY: [1.0, CONFORM_TARGETS.H.sy],
        rotate: [0, 0],
      }, { at: 1.85, duration: 0.55, ease: EASE.sineInOut }],

      [letterO, {
        x: [1 * slotWidth, oConformX],
        y: [0, oConformY],
        scaleX: [1.0, CONFORM_TARGETS.O.sx],
        scaleY: [1.0, CONFORM_TARGETS.O.sy],
        rotate: [0, 0],
      }, { at: 1.85, duration: 0.55, ease: EASE.sineInOut }],

      [letterP, {
        x: [1 * slotWidth, pConformX],
        y: [0, pConformY],
        scaleX: [1.0, CONFORM_TARGETS.P.sx],
        scaleY: [1.0, CONFORM_TARGETS.P.sy],
        rotate: [0, 0],
      }, { at: 1.85, duration: 0.55, ease: EASE.sineInOut }],

      [letterE, {
        x: [0, eConformX],
        y: [0, eConformY],
        scaleX: [1.0, CONFORM_TARGETS.E.sx],
        scaleY: [1.0, CONFORM_TARGETS.E.sy],
        rotate: [0, 0],
      }, { at: 1.85, duration: 0.55, ease: EASE.sineInOut }],

      // Initial visibility tracks from 0.0s
      [lettersWrap, { visibility: ['visible', 'visible'] }, { at: 0.0, duration: 2.75 }],
      [assetHope, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 2.20 }],

      // 2.20s – 2.55s: assetHope opacity 0 -> 1 (0.35s, sine.out, under letters)
      [assetHope, { visibility: ['visible', 'visible'] }, { at: 2.20, duration: 0.001 }],
      [assetHope, { opacity: [0, 1] }, { at: 2.20, duration: 0.35, ease: EASE.sineOut }],

      // 2.45s – 2.75s: lettersWrap opacity 1 -> 0 (0.30s, sine.inOut)
      [lettersWrap, { opacity: [1, 0] }, { at: 2.45, duration: 0.30, ease: EASE.sineInOut }],
      [lettersWrap, { visibility: ['hidden', 'hidden'] }, { at: 2.75, duration: 0.001 }],

      // Initial hidden visibility tracks from 0.0s
      [leftLine, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 3.30 }],
      [pieceBringing, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 3.36 }],
      [pieceDoorsteps, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 3.42 }],
      [rightLine, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 3.48 }],
      [logoGroup, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 5.55 }],
      [replayBtn, { visibility: ['hidden', 'hidden'] }, { at: 0.0, duration: 10.25 }],

      // ==============================================================
      // PHASE 3: 3.30s – 5.40s: Tagline Wings Build & Slide
      // ==============================================================
      [taglineGroup, { x: [0, layout.buildOffsetX] }, { at: 3.30, duration: 1.0, ease: EASE.power2Out }],

      [leftLine, { visibility: ['visible', 'visible'] }, { at: 3.30, duration: 0.001 }],
      [leftLine, { opacity: [0, 1] }, { at: 3.30, duration: 1.15, ease: EASE.power3Out }],
      [leftLine, { x: [-wingOffset, 0] }, { at: 3.30, duration: 1.15, ease: EASE.power3Out }],

      [pieceBringing, { visibility: ['visible', 'visible'] }, { at: 3.36, duration: 0.001 }],
      [pieceBringing, { opacity: [0, 1] }, { at: 3.36, duration: 1.15, ease: EASE.power3Out }],
      [pieceBringing, { x: [-wingOffset, 0] }, { at: 3.36, duration: 1.15, ease: EASE.power3Out }],

      [pieceDoorsteps, { visibility: ['visible', 'visible'] }, { at: 3.42, duration: 0.001 }],
      [pieceDoorsteps, { opacity: [0, 1] }, { at: 3.42, duration: 1.15, ease: EASE.power3Out }],
      [pieceDoorsteps, { x: [wingOffset, 0] }, { at: 3.42, duration: 1.15, ease: EASE.power3Out }],

      [rightLine, { visibility: ['visible', 'visible'] }, { at: 3.48, duration: 0.001 }],
      [rightLine, { opacity: [0, 1] }, { at: 3.48, duration: 1.15, ease: EASE.power3Out }],
      [rightLine, { x: [wingOffset, 0] }, { at: 3.48, duration: 1.15, ease: EASE.power3Out }],

      // ==============================================================
      // PHASE 4: 5.40s – 7.25s: S-Curve Descent & OPHE Logo
      // ==============================================================
      [taglineGroup, { y: [0, taglineShiftY] }, { at: 5.40, duration: 1.85, ease: EASE.power2InOut }],
      [taglineGroup, { x: [layout.buildOffsetX, taglineShiftX] }, { at: 5.40, duration: 1.85, ease: EASE.power3InOut }],

      [logoGroup, { scale: [0.92, 1.0] }, { at: 5.40, duration: 1.85, ease: EASE.power2InOut }],
      [logoGroup, { filter: ['blur(14px)', 'blur(0px)'] }, { at: 5.40, duration: 1.85, ease: EASE.power2InOut }],
      [logoGroup, { visibility: ['visible', 'visible'] }, { at: 5.55, duration: 0.001 }],
      [logoGroup, { opacity: [0, 1] }, { at: 5.55, duration: 1.40, ease: EASE.sineInOut }],
      [logoGroup, { filter: 'none' }, { at: 7.25 }],

      // ==============================================================
      // PHASE 5: 10.25s: Replay Button
      // ==============================================================
      [replayBtn, { visibility: ['visible', 'visible'] }, { at: 10.25, duration: 0.001 }],
      [replayBtn, { opacity: [0, 0.88] }, { at: 10.25, duration: 0.45, ease: EASE.power2Out }]
    ];

    masterControls = animate(sequence);

    masterControls.finished.then(() => {
      validateAlignment();
      if (replayBtn) replayBtn.style.pointerEvents = 'auto';
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('time')) {
      const t = parseFloat(urlParams.get('time'));
      masterControls.pause();
      masterControls.time = t;
      syncVisibilityAndFilter(t);
      validateAlignment();
    } else if (urlParams.has('progress')) {
      const p = parseFloat(urlParams.get('progress'));
      masterControls.pause();
      const targetTime = p * masterControls.duration;
      masterControls.time = targetTime;
      syncVisibilityAndFilter(targetTime);
      validateAlignment();
    }
  }

  function handleReplay() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (replayBtn) {
      replayBtn.style.opacity = '0';
      replayBtn.style.visibility = 'hidden';
      replayBtn.style.pointerEvents = 'none';
    }
    applyInitialState();
    if (masterControls) {
      masterControls.time = 0;
      masterControls.play();
    } else {
      buildAndRunAnimation();
    }
  }

  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const prevTime = masterControls ? masterControls.time : 0;
      buildAndRunAnimation();
      if (prevTime > 0 && masterControls) {
        masterControls.time = prevTime;
        syncVisibilityAndFilter(prevTime);
      }
    }, 120);
  }

  function init() {
    logoGroup = document.getElementById('logoGroup');
    logoSymbol = document.getElementById('logoSymbol');
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

    const fontReady = document.fonts
      ? Promise.all([
          document.fonts.ready,
          document.fonts.load('800 1em Montserrat'),
          document.fonts.load('700 1em Montserrat'),
        ])
      : Promise.resolve();

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
