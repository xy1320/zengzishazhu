// Pure Vanilla JavaScript Tactile Paper-Collage Graphics Library
// Synthesizes handmade paper textures, torn-paper terrain, stop-motion boiling ink,
// articulated cutout rendering, and whimsical mixed-media props & transitions.

(function () {
  "use strict";

  const W = 1920;
  const H = 1080;

  // --- Math, Easing & Stop-Motion Helpers ---
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
  const smoothstep = (t) => {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
  };
  const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeInCubic = (t) => Math.pow(clamp(t, 0, 1), 3);
  const easeInOutCubic = (t) => {
    const c = clamp(t, 0, 1);
    return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
  };
  const easeOutBack = (t, s = 1.70158) => {
    const c = clamp(t, 0, 1) - 1;
    return 1 + (s + 1) * c * c * c + s * c * c;
  };
  const easeOutElastic = (t) => {
    const c = clamp(t, 0, 1);
    if (c === 0 || c === 1) return c;
    return Math.pow(2, -9 * c) * Math.sin((c * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  };

  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  // Authentic stop-motion 10fps "frame boil" micro-jitter
  function boil(t, seed = 1, fps = 10) {
    const f = Math.floor(t * fps);
    return {
      dx: (hash(f * 13.7 + seed * 3.1) - 0.5) * 2,
      dy: (hash(f * 29.3 + seed * 7.7) - 0.5) * 2,
      rot: (hash(f * 41.1 + seed * 11.3) - 0.5) * 2
    };
  }

  // --- Procedural Handmade Paper & Gouache Texture Factory ---
  function createPaperTexture(baseRGB, opts = {}) {
    const size = opts.size || 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");

    const img = g.createImageData(size, size);
    const d = img.data;
    const grain = opts.grain ?? 9;
    const seed = opts.seed ?? 1;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n1 = (hash(x * 0.7 + y * 57.3 + seed * 19) - 0.5) * grain * 2;
        // Seamlessly tileable dry-brush gouache texture (exact integer cycles per tile!)
        const tx = (x / size) * Math.PI * 2;
        const ty = (y / size) * Math.PI * 2;
        const brush = Math.sin(ty * 6 + Math.sin(tx * 2 + seed) * 1.4) * (opts.brush ?? 3.5);
        const cross = Math.cos(tx * 5 + ty * 2 + seed) * (opts.cross ?? 1.6);
        const delta = n1 + brush + cross;
        d[idx] = clamp(baseRGB[0] + delta, 0, 255);
        d[idx + 1] = clamp(baseRGB[1] + delta * 0.95, 0, 255);
        d[idx + 2] = clamp(baseRGB[2] + delta * 0.88, 0, 255);
        d[idx + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    // Subtle organic paper fibers & pigment flecks
    g.save();
    for (let i = 0; i < (opts.fibers ?? 90); i++) {
      const fx = hash(i * 11.3 + seed) * size;
      const fy = hash(i * 23.7 + seed) * size;
      const len = 5 + hash(i * 37.1 + seed) * 14;
      const ang = hash(i * 51.9 + seed) * Math.PI * 2;
      g.strokeStyle = i % 2 === 0 ? "rgba(255,250,240,0.22)" : "rgba(60,42,24,0.08)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(fx, fy);
      g.lineTo(fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
      g.stroke();
    }

    // Optional vintage pattern overlay (polka dots, linen weave, or abstract brush strokes)
    if (opts.pattern === "linen") {
      g.strokeStyle = "rgba(75,58,36,0.08)";
      g.lineWidth = 1;
      for (let k = 0; k < size; k += 10) {
        g.beginPath(); g.moveTo(0, k); g.lineTo(size, k); g.stroke();
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k, size); g.stroke();
      }
    } else if (opts.pattern === "dots") {
      g.fillStyle = "rgba(255,248,236,0.20)";
      for (let y = 12; y < size; y += 26) {
        for (let x = 12; x < size; x += 26) {
          g.beginPath();
          g.arc(x + ((y / 26) % 2) * 13, y, 3.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    } else if (opts.pattern === "parchment") {
      // Delicate antique speckles & faint ruled woodblock border marks
      for (let i = 0; i < 40; i++) {
        g.fillStyle = "rgba(110,78,42,0.07)";
        g.beginPath();
        g.arc(hash(i * 7.1 + 3) * size, hash(i * 19.3 + 5) * size, 1.5 + hash(i * 31) * 4, 0, Math.PI * 2);
        g.fill();
      }
    } else if (opts.pattern === "stars") {
      for (let i = 0; i < 36; i++) {
        const sx = hash(i * 17.3 + 9) * size;
        const sy = hash(i * 29.1 + 4) * size;
        g.fillStyle = `rgba(255,244,205,${0.18 + hash(i * 43) * 0.4})`;
        g.beginPath();
        g.arc(sx, sy, 0.8 + hash(i * 61) * 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    return c;
  }

  class CollageTextures {
    constructor(ctx) {
      this.canvases = {
        cream: createPaperTexture([245, 237, 220], { grain: 8, brush: 3, pattern: "parchment", seed: 1 }),
        sage: createPaperTexture([148, 172, 138], { grain: 10, brush: 7, pattern: "dots", seed: 2 }),
        sageDark: createPaperTexture([112, 138, 108], { grain: 10, brush: 6, seed: 3 }),
        ochre: createPaperTexture([218, 180, 118], { grain: 10, brush: 6, pattern: "linen", seed: 4 }),
        kraft: createPaperTexture([191, 152, 104], { grain: 12, brush: 5, seed: 5 }),
        terracotta: createPaperTexture([196, 82, 58], { grain: 9, brush: 6, seed: 6 }),
        indigo: createPaperTexture([38, 52, 82], { grain: 9, brush: 6, pattern: "stars", seed: 7 }),
        skyDay: createPaperTexture([226, 233, 222], { grain: 7, brush: 7, seed: 8 }),
        road: createPaperTexture([232, 214, 178], { grain: 11, brush: 4, pattern: "linen", seed: 9 }),
        blush: createPaperTexture([230, 182, 170], { grain: 8, brush: 5, pattern: "dots", seed: 10 })
      };
      this.patterns = {};
      for (const [k, c] of Object.entries(this.canvases)) {
        this.patterns[k] = ctx.createPattern(c, "repeat");
      }
    }
  }

  // --- Core Drawing Primitives ---

  function drawSkyBackdrop(ctx, tex, nightMix = 0) {
    ctx.save();
    // Base gouache sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (nightMix < 0.01) {
      grad.addColorStop(0, "#DCE5DB");
      grad.addColorStop(0.55, "#F3ECD9");
      grad.addColorStop(1, "#EAD8B6");
    } else if (nightMix > 0.99) {
      grad.addColorStop(0, "#1B2642");
      grad.addColorStop(0.55, "#2C3D63");
      grad.addColorStop(1, "#5A4E68");
    } else {
      // Smooth daylight -> twilight blend
      const mixC = (a, b, m) => `rgb(${Math.round(lerp(a[0], b[0], m))},${Math.round(lerp(a[1], b[1], m))},${Math.round(lerp(a[2], b[2], m))})`;
      grad.addColorStop(0, mixC([220, 229, 219], [27, 38, 66], nightMix));
      grad.addColorStop(0.55, mixC([243, 236, 217], [44, 61, 99], nightMix));
      grad.addColorStop(1, mixC([234, 216, 182], [90, 78, 104], nightMix));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Overlay tactile handmade rice-paper grain
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = nightMix > 0.5 ? tex.patterns.indigo : tex.patterns.cream;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Draw a torn-paper hill silhouette with deckled white torn-fiber top lip & cast shadow
  function drawTornHill(ctx, opts) {
    const {
      yBase = 780,
      amp1 = 55,
      amp2 = 24,
      freq1 = 0.0028,
      freq2 = 0.0072,
      phase = 0,
      seed = 1,
      pattern,
      scrollX = 0,
      popUp = 1,
      lipColor = "#F8F2E4"
    } = opts;

    const pts = [];
    const step = 18;
    for (let x = -80; x <= W + 80; x += step) {
      const wx = x + scrollX;
      const hillY =
        yBase +
        Math.sin(wx * freq1 + phase) * amp1 +
        Math.cos(wx * freq2 + phase * 1.7) * amp2;
      // Organic deckled torn-paper micro-teeth
      const tear = (hash(Math.round(wx / step) * 19.3 + seed * 7.1) - 0.5) * 9;
      pts.push([x, hillY + tear]);
    }

    ctx.save();
    // Pop-up book hinge from bottom edge
    if (popUp < 0.999) {
      const p = easeOutBack(popUp, 1.35);
      ctx.translate(W * 0.5, H);
      ctx.scale(1, Math.max(0.02, p));
      ctx.translate(-W * 0.5, -H);
    }

    // 1. Cast shadow + fuzzy white torn-paper fiber lip slightly above main color
    ctx.save();
    ctx.shadowColor = "rgba(28, 20, 12, 0.22)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = -5;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] - 5);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] - 5);
    ctx.lineTo(W + 80, H + 80);
    ctx.lineTo(-80, H + 80);
    ctx.closePath();
    ctx.fillStyle = lipColor;
    ctx.fill();
    ctx.restore();

    // 2. Main painted-paper hill body
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(W + 80, H + 80);
    ctx.lineTo(-80, H + 80);
    ctx.closePath();
    ctx.save();
    ctx.translate(-scrollX * 0.5, 0);
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.restore();

    // Subtle hand-inked top contour sketch accent
    ctx.strokeStyle = "rgba(42, 34, 28, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + 2);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw winding torn-paper village lane
  function drawVillageRoad(ctx, tex, yTop, yBottom, scrollX = 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-60, yTop);
    for (let x = -60; x <= W + 60; x += 24) {
      const y = yTop + Math.sin((x + scrollX) * 0.0045) * 20 + (hash(x * 0.13 + 9) - 0.5) * 5;
      ctx.lineTo(x, y);
    }
    for (let x = W + 60; x >= -60; x -= 24) {
      const y = yBottom + Math.sin((x + scrollX) * 0.0045 + 0.4) * 16 + (hash(x * 0.17 + 19) - 0.5) * 6;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.shadowColor = "rgba(35, 25, 14, 0.18)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = "#F7F0E0";
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.save();
    ctx.clip();
    ctx.translate(-scrollX * 0.8, 0);
    ctx.fillStyle = tex.patterns.road;
    ctx.fillRect(scrollX * 0.8 - 80, yTop - 40, W + 200, yBottom - yTop + 100);
    ctx.restore();

    // Hand-drawn ink pebbles & cart-track dashes
    ctx.strokeStyle = "rgba(75, 55, 36, 0.25)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([14, 20]);
    ctx.beginPath();
    for (let x = -60; x <= W + 60; x += 30) {
      const y = (yTop + yBottom) * 0.5 + Math.sin((x + scrollX) * 0.0045 + 0.2) * 18;
      if (x === -60) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // --- Articulated Hand-Painted Cutout Sprite Renderer ---
  function drawCutoutSprite(ctx, img, x, y, opts = {}) {
    if (!img) return;
    const {
      height = 380,
      flipX = false,
      rot = 0,
      sx = 1,
      sy = 1,
      alpha = 1,
      popUp = 1,
      speechEnergy = 0,
      t = 0,
      seed = 1,
      boilAmt = 1.0,
      groundShadow = true,
      shadowScale = 1.0
    } = opts;

    const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    const drawH = height;
    const drawW = height * aspect;

    const b = boil(t, seed, 10);
    const jx = b.dx * 1.4 * boilAmt;
    const jy = b.dy * 1.2 * boilAmt;
    const jrot = b.rot * 0.011 * boilAmt;

    // Live audio-driven expressive talk bob!
    const talkStretchY = 1 + speechEnergy * 0.042;
    const talkSquashX = 1 - speechEnergy * 0.022;
    const talkTilt = Math.sin(t * 17 + seed) * speechEnergy * 0.045;
    const talkLift = speechEnergy * 5.5;

    const popScaleY = popUp < 0.999 ? Math.max(0.01, easeOutBack(popUp, 1.5)) : 1;

    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);

    // Soft elliptical paper-stage contact shadow on ground
    if (groundShadow && popScaleY > 0.25) {
      ctx.save();
      ctx.fillStyle = "rgba(38, 28, 18, 0.19)";
      ctx.beginPath();
      ctx.ellipse(x, y + 4, drawW * 0.34 * shadowScale * Math.min(1, popScaleY), 15 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Transform anchored at bottom-center (feet / base)
    ctx.translate(x + jx, y + jy - talkLift);
    ctx.rotate(rot + jrot + talkTilt);
    ctx.scale((flipX ? -1 : 1) * sx * talkSquashX, sy * talkStretchY * popScaleY);

    // Authentic paper-cutout drop shadow onto backdrop
    ctx.shadowColor = "rgba(30, 22, 14, 0.28)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = flipX ? -8 : 8;
    ctx.shadowOffsetY = 11;

    ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
    ctx.restore();
  }

  // --- Whimsical Hand-Crafted Procedural Props ---

  function drawPuppetString(ctx, x, y, topY = -20) {
    ctx.save();
    ctx.strokeStyle = "rgba(65, 56, 48, 0.35)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawPaperSun(ctx, x, y, t, scale = 1, tex) {
    const b = boil(t, 33, 8);
    const sway = Math.sin(t * 1.1) * 8;
    const cx = x + sway + b.dx;
    const cy = y + b.dy;
    drawPuppetString(ctx, cx, cy - 64 * scale);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Rotating paper-cut rays
    ctx.save();
    ctx.rotate(t * 0.28 + b.rot * 0.02);
    ctx.shadowColor = "rgba(45, 30, 12, 0.22)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 7;

    const rays = 14;
    ctx.beginPath();
    for (let i = 0; i < rays * 2; i++) {
      const ang = (i / (rays * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? 96 : 62;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#F7EFE0";
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.beginPath();
    for (let i = 0; i < rays * 2; i++) {
      const ang = (i / (rays * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? 88 : 58;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#E4AC3C";
    ctx.fill();
    ctx.strokeStyle = "#3A2C20";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    // Inner painted marigold disc
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = "#F2C656";
    ctx.fill();
    ctx.strokeStyle = "#3A2C20";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Whimsical little painted rosy cheeks & gentle storybook sun smile
    ctx.fillStyle = "rgba(210, 95, 72, 0.42)";
    ctx.beginPath(); ctx.arc(-20, 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3A2C20";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    // Closed happy eyes
    ctx.beginPath(); ctx.arc(-15, -6, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(15, -6, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    // Smile
    ctx.beginPath(); ctx.arc(0, 6, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

    // Tiny brass brad pin at top
    drawBrassBrad(ctx, 0, -56, 4.5);
    ctx.restore();
  }

  function drawPaperCloud(ctx, x, y, scale, t, seed = 1, nightMix = 0) {
    const b = boil(t, seed + 50, 8);
    const cx = x + b.dx * 1.2;
    const cy = y + Math.sin(t * 0.9 + seed) * 6 + b.dy;
    drawPuppetString(ctx, cx, cy - 32 * scale);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const buildPath = (pad) => {
      ctx.beginPath();
      ctx.moveTo(-78 - pad, 24 + pad);
      ctx.bezierCurveTo(-104 - pad, 24 + pad, -106 - pad, -14 - pad, -72 - pad, -22 - pad);
      ctx.bezierCurveTo(-66 - pad, -58 - pad, -16 - pad, -64 - pad, 4, -40 - pad);
      ctx.bezierCurveTo(28 + pad, -62 - pad, 76 + pad, -46 - pad, 76 + pad, -14 - pad);
      ctx.bezierCurveTo(106 + pad, -8 - pad, 102 + pad, 24 + pad, 74 + pad, 24 + pad);
      ctx.closePath();
    };

    ctx.shadowColor = "rgba(26, 20, 14, 0.18)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;
    buildPath(4);
    ctx.fillStyle = nightMix > 0.5 ? "#D5D9E4" : "#FBF6EA";
    ctx.fill();
    ctx.shadowColor = "transparent";

    buildPath(0);
    ctx.fillStyle = nightMix > 0.5 ? "#A9B4CC" : "#F3ECDC";
    ctx.fill();

    // Hand-stitched dashed thread detail along inner rim
    ctx.strokeStyle = nightMix > 0.5 ? "rgba(42,52,78,0.45)" : "rgba(75,62,48,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawMaskingTape(ctx, x, y, w, h, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(235, 214, 165, 0.72)";
    ctx.strokeStyle = "rgba(155, 130, 88, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + 2);
    ctx.lineTo(w / 2 - 4, h / 2);
    ctx.lineTo(-w / 2 + 3, h / 2 - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBrassBrad(ctx, x, y, r = 5) {
    ctx.save();
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    grad.addColorStop(0, "#FBE4A0");
    grad.addColorStop(0.6, "#C99432");
    grad.addColorStop(1, "#7B5316");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(65,42,10,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Draw decorative torn-paper rectangle card
  function drawTornCard(ctx, x, y, w, h, fill, borderColor, seed = 1) {
    const pts = [];
    const segsX = Math.max(8, Math.floor(w / 28));
    const segsY = Math.max(4, Math.floor(h / 24));
    const x0 = x - w / 2, y0 = y - h / 2;

    for (let i = 0; i <= segsX; i++) {
      const px = x0 + (i / segsX) * w;
      const py = y0 + (hash(i * 13.1 + seed) - 0.5) * 6;
      pts.push([px, py]);
    }
    for (let i = 1; i <= segsY; i++) {
      const px = x0 + w + (hash(i * 29.7 + seed + 10) - 0.5) * 6;
      const py = y0 + (i / segsY) * h;
      pts.push([px, py]);
    }
    for (let i = segsX - 1; i >= 0; i--) {
      const px = x0 + (i / segsX) * w;
      const py = y0 + h + (hash(i * 41.3 + seed + 20) - 0.5) * 6;
      pts.push([px, py]);
    }
    for (let i = segsY - 1; i >= 1; i--) {
      const px = x0 + (hash(i * 53.9 + seed + 30) - 0.5) * 6;
      const py = y0 + (i / segsY) * h;
      pts.push([px, py]);
    }

    ctx.save();
    ctx.shadowColor = "rgba(28, 19, 11, 0.28)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 9;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowColor = "transparent";

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hand-crafted English collage title / quote banner
  function drawCollageBanner(ctx, title, subtitle, x, y, progress, t, opts = {}) {
    if (progress <= 0.01) return;
    const p = easeOutBack(progress, 1.35);
    const b = boil(t, opts.seed || 77, 8);
    const w = opts.width || 760;
    const h = opts.height || (subtitle ? 176 : 112);

    ctx.save();
    ctx.globalAlpha = clamp(progress * 2.2, 0, 1);
    ctx.translate(x + b.dx, y + b.dy);
    ctx.rotate((opts.rot || -0.015) + b.rot * 0.008);
    ctx.scale(p, p);

    // Outer cream torn cardstock
    drawTornCard(ctx, 0, 0, w, h, opts.cardFill || "#F9F1DF", "#33271E", opts.seed || 77);

    // Inner double-ink editorial frame
    ctx.strokeStyle = opts.accent || "#C34B32";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-w / 2 + 16, -h / 2 + 14, w - 32, h - 28);

    // Masking tape strips at upper corners
    drawMaskingTape(ctx, -w / 2 + 26, -h / 2 + 6, 76, 22, -0.45);
    drawMaskingTape(ctx, w / 2 - 26, -h / 2 + 6, 76, 22, 0.42);

    // Crisp English letterpress title
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.titleColor || "#221B16";
    ctx.font = `900 ${opts.titleSize || 54}px "Georgia", "Palatino Linotype", "Times New Roman", serif`;
    ctx.fillText(title, 0, subtitle ? -20 : 2);

    if (subtitle) {
      // Ornamental ink divider
      ctx.strokeStyle = opts.accent || "#C34B32";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-120, 16);
      ctx.lineTo(120, 16);
      ctx.stroke();

      ctx.fillStyle = opts.subColor || "#6E3B2B";
      ctx.font = `italic 600 ${opts.subSize || 27}px "Georgia", "Palatino Linotype", serif`;
      ctx.fillText(subtitle, 0, 44);
    }

    ctx.restore();
  }

  // Animated torn-paper speech scrap with word-by-word reveal
  function drawSpeechScrap(ctx, text, x, y, tailDir, progress, t, opts = {}) {
    if (progress <= 0.01) return;
    const p = easeOutBack(clamp(progress * 1.4, 0, 1), 1.6);
    const b = boil(t, opts.seed || 91, 10);
    const maxW = opts.width || 440;
    const h = opts.height || 104;

    ctx.save();
    ctx.globalAlpha = clamp(progress * 2.5, 0, 1);
    ctx.translate(x + b.dx * 1.5, y + b.dy * 1.5);
    ctx.rotate((opts.rot || 0) + b.rot * 0.014);
    ctx.scale(p, p);

    // Little hand-cut triangular paper pointer tail
    ctx.save();
    ctx.shadowColor = "rgba(25,18,12,0.22)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = opts.fill || "#FFF9EC";
    ctx.strokeStyle = "#2A211B";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    if (tailDir === "down-left") {
      ctx.moveTo(-maxW * 0.25, h * 0.42);
      ctx.lineTo(-maxW * 0.34, h * 0.80);
      ctx.lineTo(-maxW * 0.08, h * 0.45);
    } else if (tailDir === "down-right") {
      ctx.moveTo(maxW * 0.25, h * 0.42);
      ctx.lineTo(maxW * 0.34, h * 0.80);
      ctx.lineTo(maxW * 0.08, h * 0.45);
    } else {
      ctx.moveTo(-16, h * 0.42);
      ctx.lineTo(0, h * 0.76);
      ctx.lineTo(18, h * 0.42);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawTornCard(ctx, 0, 0, maxW, h, opts.fill || "#FFF9EC", "#2A211B", opts.seed || 91);

    // Text with line wrap
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.textColor || "#221A14";
    ctx.font = `900 ${opts.fontSize || 31}px "Trebuchet MS", "Georgia", sans-serif`;

    const lines = Array.isArray(text) ? text : [text];
    const lineH = (opts.fontSize || 31) * 1.24;
    const startY = -((lines.length - 1) * lineH) / 2;
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, 0, startY + idx * lineH);
    });

    ctx.restore();
  }

  // Jagged comic burst cutout stamp ("SHING!", "ONLY JOKING?!")
  function drawComicStamp(ctx, text, x, y, progress, t, opts = {}) {
    if (progress <= 0.01) return;
    const p = easeOutElastic(clamp(progress * 1.35, 0, 1));
    const b = boil(t, opts.seed || 144, 12);
    const rx = opts.rx || 145;
    const ry = opts.ry || 74;

    ctx.save();
    ctx.globalAlpha = clamp(progress * 3, 0, 1);
    ctx.translate(x + b.dx * 2, y + b.dy * 2);
    ctx.rotate((opts.rot || -0.14) + b.rot * 0.025);
    ctx.scale(p, p);

    const spikes = opts.spikes || 14;
    const traceStar = (mul) => {
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const ang = (i / (spikes * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? 1.0 * mul : 0.68 * mul;
        const px = Math.cos(ang) * rx * r;
        const py = Math.sin(ang) * ry * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    ctx.shadowColor = "rgba(25, 16, 10, 0.30)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 8;
    traceStar(1.08);
    ctx.fillStyle = "#FFF8E8";
    ctx.fill();
    ctx.shadowColor = "transparent";

    traceStar(1.0);
    ctx.fillStyle = opts.bg || "#D14A32";
    ctx.fill();
    ctx.strokeStyle = "#221814";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.fg || "#FFF8E6";
    ctx.font = `900 ${opts.fontSize || 42}px "Georgia", "Impact", serif`;
    ctx.fillText(text, 0, 2);

    ctx.restore();
  }

  // Hand-drawn cutout teardrop arcing through the air
  function drawTeardrop(ctx, x, y, rot, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);

    ctx.shadowColor = "rgba(20, 30, 45, 0.22)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;

    // White scissor-cut border
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.bezierCurveTo(16, -4, 18, 18, 0, 22);
    ctx.bezierCurveTo(-18, 18, -16, -4, 0, -24);
    ctx.closePath();
    ctx.fillStyle = "#FAF5E8";
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Painted cerulean gouache drop
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(11, -3, 13, 13, 0, 16);
    ctx.bezierCurveTo(-13, 13, -11, -3, 0, -18);
    ctx.closePath();
    ctx.fillStyle = "#77B5D9";
    ctx.fill();
    ctx.strokeStyle = "#25394D";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Little highlight
    ctx.fillStyle = "#EEF8FF";
    ctx.beginPath();
    ctx.ellipse(-3.5, 2, 2.5, 5.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sparkling gold cutout star
  function drawPaperStar(ctx, x, y, r, rot, color = "#E8B138") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const trace = (rad) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 === 0 ? rad : rad * 0.44;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
    };
    trace(r + 4);
    ctx.fillStyle = "#FAF4E4";
    ctx.fill();
    trace(r);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#3A2918";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  // Foreground hanging plum blossom branch frame
  function drawPlumBranch(ctx, x, y, scale, t, flip = false) {
    const sway = Math.sin(t * 1.4 + (flip ? 2 : 0)) * 0.035;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.rotate(sway);

    ctx.shadowColor = "rgba(25, 18, 12, 0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 8;

    // Main gnarled ink branch
    ctx.strokeStyle = "#4A3628";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(95, 35, 220, 95);
    ctx.quadraticCurveTo(280, 122, 340, 108);
    ctx.stroke();

    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(115, 45);
    ctx.quadraticCurveTo(165, 105, 195, 165);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(185, 80);
    ctx.quadraticCurveTo(245, 55, 295, 25);
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Hand-cut painted plum blossoms
    const flowers = [
      [85, 24, 18], [160, 72, 22], [238, 102, 20],
      [318, 106, 17], [190, 152, 19], [278, 32, 21], [135, 105, 16]
    ];
    flowers.forEach(([fx, fy, fr], i) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(i * 0.8 + Math.sin(t * 2 + i) * 0.08);
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.fillStyle = "#F9F1E4";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * fr * 0.62, Math.sin(a) * fr * 0.62, fr * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i % 2 === 0 ? "#E38278" : "#EEA396";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * fr * 0.62, Math.sin(a) * fr * 0.62, fr * 0.44, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#E8B743";
      ctx.beginPath();
      ctx.arc(0, 0, fr * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  // Hanging glowing twilight red paper lantern
  function drawLantern(ctx, x, y, scale, t, seed = 1, glowAmt = 1) {
    const sway = Math.sin(t * 1.8 + seed * 1.9) * 0.075;
    drawPuppetString(ctx, x, y - 55 * scale);

    ctx.save();
    ctx.translate(x, y - 55 * scale);
    ctx.rotate(sway);
    ctx.translate(0, 55 * scale);
    ctx.scale(scale, scale);

    // Warm candlelight radial aura
    if (glowAmt > 0.05) {
      const rg = ctx.createRadialGradient(0, 0, 10, 0, 0, 165);
      rg.addColorStop(0, `rgba(255, 206, 110, ${0.42 * glowAmt})`);
      rg.addColorStop(0.5, `rgba(240, 130, 62, ${0.18 * glowAmt})`);
      rg.addColorStop(1, "rgba(240, 120, 50, 0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, 165, 0, Math.PI * 2);
      ctx.fill();
    }

    // White paper cutout silhouette
    ctx.shadowColor = "rgba(15, 10, 8, 0.35)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#FAF2DF";
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Vermilion painted lantern body
    const lg = ctx.createRadialGradient(-10, -8, 6, 0, 0, 52);
    lg.addColorStop(0, "#F8B655");
    lg.addColorStop(0.55, "#DA5638");
    lg.addColorStop(1, "#A63322");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3A1E15";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Ribbed ink arcs
    ctx.strokeStyle = "rgba(70, 24, 16, 0.45)";
    ctx.lineWidth = 1.8;
    [-22, 0, 22].forEach((rx) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.abs(rx) + 8, 49, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Gold caps & swaying tassel
    ctx.fillStyle = "#DDA33A";
    ctx.strokeStyle = "#3A2315";
    ctx.lineWidth = 2;
    ctx.fillRect(-18, -56, 36, 10);
    ctx.strokeRect(-18, -56, 36, 10);
    ctx.fillRect(-16, 46, 32, 9);
    ctx.strokeRect(-16, 46, 32, 9);

    ctx.strokeStyle = "#E2A73B";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 55);
    ctx.quadraticCurveTo(Math.sin(t * 3 + seed) * 7, 74, Math.sin(t * 3 + seed) * 11, 92);
    ctx.stroke();

    ctx.restore();
  }

  // Tumbling woven market basket + flying vegetables for Act 4 freeze gag
  function drawTumblingBasket(ctx, x, y, rot, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);

    ctx.shadowColor = "rgba(25, 18, 10, 0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 7;

    // White paper cutout margin
    ctx.fillStyle = "#FAF3E4";
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Handle arc
    ctx.strokeStyle = "#6B4A2B";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, -10, 36, Math.PI, 0);
    ctx.stroke();

    // Basket body
    ctx.fillStyle = "#C99B5B";
    ctx.strokeStyle = "#3C2816";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-42, -8);
    ctx.lineTo(42, -8);
    ctx.lineTo(30, 38);
    ctx.lineTo(-30, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cross-weave ink lines
    ctx.strokeStyle = "rgba(75, 48, 22, 0.55)";
    ctx.lineWidth = 2;
    for (let yy = 4; yy <= 28; yy += 11) {
      ctx.beginPath(); ctx.moveTo(-36, yy); ctx.lineTo(36, yy); ctx.stroke();
    }
    for (let xx = -22; xx <= 22; xx += 14) {
      ctx.beginPath(); ctx.moveTo(xx, -7); ctx.lineTo(xx * 0.78, 37); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlyingVeggie(ctx, x, y, rot, type) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (type === "radish") {
      ctx.fillStyle = "#FAF4E5";
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#D45242";
      ctx.strokeStyle = "#2E1C16";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 4, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#6F9E68";
      ctx.beginPath(); ctx.ellipse(-5, -14, 5, 11, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(5, -14, 5, 11, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      // Green scallion cutout
      ctx.fillStyle = "#FAF4E5";
      ctx.fillRect(-10, -30, 20, 60);
      ctx.fillStyle = "#6D9F62";
      ctx.strokeStyle = "#2A3A24";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-5, -24, 10, 36, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#EFE6D0";
      ctx.beginPath(); ctx.roundRect(-6, 8, 12, 16, 5); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // Act 3 Whimsical Thought-Bubble: Pig sitting cozily in a festive paper pot!
  function drawThoughtCloudFeast(ctx, x, y, progress, t, pigImg) {
    if (progress <= 0.01) return;
    const p = easeOutBack(progress, 1.45);
    const b = boil(t, 204, 8);

    ctx.save();
    ctx.globalAlpha = clamp(progress * 2.2, 0, 1);

    // Trailing little thought-bubble puffs
    [[-120, 130, 14], [-85, 95, 22]].forEach(([ox, oy, r], i) => {
      const pp = easeOutBack(clamp((progress - i * 0.12) * 2, 0, 1));
      ctx.save();
      ctx.translate(x + ox, y + oy);
      ctx.scale(pp, pp);
      ctx.fillStyle = "#FFF9EC";
      ctx.strokeStyle = "#3A2C20";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Main scalloped paper thought cloud
    ctx.translate(x + b.dx * 1.5, y + b.dy * 1.5);
    ctx.scale(p, p);

    ctx.shadowColor = "rgba(30, 22, 14, 0.25)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 9;
    ctx.fillStyle = "#FFF9ED";
    ctx.strokeStyle = "#32261E";
    ctx.lineWidth = 3;

    const lobes = [
      [-92, 10, 56], [-45, -42, 62], [35, -46, 66],
      [96, -2, 58], [62, 52, 54], [-18, 58, 56], [-78, 46, 48]
    ];
    ctx.beginPath();
    lobes.forEach(([lx, ly, lr]) => {
      ctx.moveTo(lx + lr, ly);
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Inner rosy watercolor wash circle
    ctx.fillStyle = "#FBE9D4";
    ctx.beginPath();
    ctx.ellipse(0, 6, 118, 76, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute tiny rosy pig peeking happily over a decorative painted feast bowl!
    if (pigImg) {
      const aspect = pigImg.naturalWidth / pigImg.naturalHeight;
      const ph = 112;
      const pw = ph * aspect;
      ctx.save();
      ctx.translate(0, -4 + Math.sin(t * 5) * 4);
      ctx.rotate(Math.sin(t * 3.5) * 0.06);
      ctx.drawImage(pigImg, -pw * 0.5, -ph * 0.58, pw, ph);
      ctx.restore();
    }

    // Painted terracotta feast bowl in front of the pig
    ctx.fillStyle = "#C95238";
    ctx.strokeStyle = "#2E1E16";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-74, 16);
    ctx.lineTo(74, 16);
    ctx.quadraticCurveTo(64, 72, 0, 74);
    ctx.quadraticCurveTo(-64, 72, -74, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold decorative waves on bowl
    ctx.strokeStyle = "#F4D17A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-54, 38);
    ctx.quadraticCurveTo(-27, 26, 0, 38);
    ctx.quadraticCurveTo(27, 50, 54, 38);
    ctx.stroke();

    // Twinkling cutout stars around the thought cloud
    drawPaperStar(ctx, -118, -56, 16, t * 1.4, "#E9B53B");
    drawPaperStar(ctx, 116, -48, 13, -t * 1.6, "#DC654A");
    drawPaperStar(ctx, 108, 48, 12, t * 1.2, "#E9B53B");

    ctx.restore();
  }

  // Act 5 Poetic Metaphor Inset: Parent & Child Paper Dolls linked by Red Thread
  function drawPaperDollVignette(ctx, x, y, progress, t) {
    if (progress <= 0.01) return;
    const p = easeOutBack(progress, 1.3);
    const b = boil(t, 311, 8);

    ctx.save();
    ctx.globalAlpha = clamp(progress * 2.2, 0, 1);
    ctx.translate(x + b.dx, y + b.dy);
    ctx.rotate(0.025 + b.rot * 0.008);
    ctx.scale(p, p);

    const w = 470, h = 250;
    drawTornCard(ctx, 0, 0, w, h, "#F8EED8", "#3A2D22", 311);
    drawMaskingTape(ctx, -w / 2 + 24, -h / 2 + 6, 70, 20, -0.5);
    drawMaskingTape(ctx, w / 2 - 24, -h / 2 + 6, 70, 20, 0.48);

    // Subtle vintage sepia interior box
    ctx.strokeStyle = "rgba(130, 86, 52, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);

    // Ground ink rule
    ctx.strokeStyle = "#4A3A2E";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-190, 74);
    ctx.lineTo(190, 74);
    ctx.stroke();

    // Animated mirrored walk cycle! Child mimics parent's exact step 0.22s later!
    const drawSilhouetteDoll = (dx, dy, scale, phase, fill) => {
      const step = Math.sin(phase);
      const lift = Math.abs(Math.cos(phase)) * 6;
      ctx.save();
      ctx.translate(dx, dy - lift);
      ctx.scale(scale, scale);

      ctx.fillStyle = fill;
      ctx.strokeStyle = "#FAF3E2";
      ctx.lineWidth = 4;

      // Head
      ctx.beginPath(); ctx.arc(0, -108, 22, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      // Robe torso
      ctx.beginPath();
      ctx.moveTo(-14, -84);
      ctx.lineTo(14, -84);
      ctx.lineTo(28, -14);
      ctx.lineTo(-28, -14);
      ctx.closePath();
      ctx.stroke(); ctx.fill();

      // Swinging outstretched arm
      ctx.save();
      ctx.translate(8, -74);
      ctx.rotate(-0.45 + step * 0.42);
      ctx.fillRect(-5, 0, 12, 42);
      ctx.restore();

      // Stepping legs
      ctx.save();
      ctx.translate(-8, -16);
      ctx.rotate(step * 0.35);
      ctx.fillRect(-5, 0, 11, 24);
      ctx.restore();
      ctx.save();
      ctx.translate(8, -16);
      ctx.rotate(-step * 0.35);
      ctx.fillRect(-5, 0, 11, 24);
      ctx.restore();

      ctx.restore();
    };

    const pPhase = t * 3.2;
    const cPhase = t * 3.2 - 0.55; // Child mirrors parent's motion!

    // Glowing red silk thread linking parent's heart to child's heart
    ctx.save();
    ctx.strokeStyle = "#C9402E";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(-88, 12);
    ctx.quadraticCurveTo(0, -26 + Math.sin(t * 4) * 10, 92, 34);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawSilhouetteDoll(-95, 74, 1.05, pPhase, "#2E3F5E");
    drawSilhouetteDoll(95, 74, 0.68, cPhase, "#C96A32");

    // Tiny caption inside vignette
    ctx.fillStyle = "#5B4332";
    ctx.font = 'italic 600 20px "Georgia", serif';
    ctx.textAlign = "center";
    ctx.fillText("Every step is watched & learned", 0, -90);

    ctx.restore();
  }

  // Act 6 Whimsical Cheeky Angel Piglet floating peacefully into the starry twilight!
  function drawAngelPig(ctx, x, y, scale, t, pigImg) {
    if (!pigImg) return;
    const bob = Math.sin(t * 2.4) * 12;
    const flap = Math.sin(t * 8.5) * 0.34;
    const b = boil(t, 412, 10);

    ctx.save();
    ctx.translate(x + b.dx, y + bob + b.dy);
    ctx.scale(scale, scale);

    // Subtle heavenly moonlight aura
    const rg = ctx.createRadialGradient(0, -10, 10, 0, -10, 130);
    rg.addColorStop(0, "rgba(255, 245, 200, 0.36)");
    rg.addColorStop(1, "rgba(255, 245, 200, 0)");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, -10, 130, 0, Math.PI * 2); ctx.fill();

    // Flapping hand-cut paper angel wings clearly silhouetted behind pig
    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.translate(dir * 42, -26);
      ctx.rotate(dir * (0.22 + flap));
      ctx.fillStyle = "#FFFDF6";
      ctx.strokeStyle = "#3E352E";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.bezierCurveTo(dir * 52, -56, dir * 102, -24, dir * 74, 14);
      ctx.bezierCurveTo(dir * 52, 32, dir * 24, 24, 0, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Delicate feather ink ticks
      ctx.strokeStyle = "rgba(65,55,48,0.45)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(dir * 26, 2);
      ctx.lineTo(dir * 58, -8);
      ctx.moveTo(dir * 24, 10);
      ctx.lineTo(dir * 52, 8);
      ctx.stroke();
      ctx.restore();
    });

    // Smiling pig cutout
    const aspect = pigImg.naturalWidth / pigImg.naturalHeight;
    const ph = 110;
    const pw = ph * aspect;
    ctx.drawImage(pigImg, -pw * 0.5, -ph * 0.65, pw, ph);

    // Fluffy little cotton cloud underneath
    ctx.fillStyle = "#FBF7EC";
    ctx.strokeStyle = "#4A433D";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-34, 34, 24, 0, Math.PI * 2);
    ctx.arc(0, 38, 28, 0, Math.PI * 2);
    ctx.arc(36, 34, 24, 0, Math.PI * 2);
    ctx.fill();

    // Gleaming golden paper halo floating above head
    ctx.strokeStyle = "#F5C64B";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(-10, -82 + Math.sin(t * 4) * 3, 28, 8, -0.08, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Rising hand-drawn curled gouache steam wisps from the feast pot
  function drawPotSteam(ctx, x, y, t) {
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const cycle = ((t * 0.38 + i * 0.25) % 1);
      const baseX = x + (i - 1.5) * 42;
      const rise = cycle * 155;
      const alpha = Math.sin(cycle * Math.PI) * 0.62;
      const sway = Math.sin(t * 2.4 + i * 1.9) * 14;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(baseX, y - rise * 0.45);
      // Soft cream chalk halo
      ctx.strokeStyle = "rgba(255, 249, 232, 0.48)";
      ctx.lineWidth = 10 - cycle * 4;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.bezierCurveTo(-20 + sway, -18, 22 - sway, -56, -6 + sway * 0.6, -96 - cycle * 24);
      ctx.stroke();
      // Crisp inner wispy thread
      ctx.strokeStyle = "rgba(255, 252, 242, 0.85)";
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // --- Authentic Paper-Craft Scene Transitions ---

  // Diagonal torn-paper strip wipe (progress 0 -> 1)
  function drawTornStripWipe(ctx, progress, tex) {
    if (progress <= 0 || progress >= 1) return;
    // Peaks at 0.5 covering entire screen, then sweeps off
    const xPos = lerp(-W * 1.25, W * 1.35, easeInOutCubic(progress));
    const stripW = W * 1.25;
    ctx.save();
    ctx.translate(xPos, 0);
    ctx.beginPath();
    ctx.moveTo(0, -40);
    for (let y = -40; y <= H + 40; y += 26) {
      ctx.lineTo(stripW + (hash(y * 0.31 + 11) - 0.5) * 34, y);
    }
    for (let y = H + 40; y >= -40; y -= 26) {
      ctx.lineTo((hash(y * 0.27 + 23) - 0.5) * 34, y);
    }
    ctx.closePath();
    ctx.shadowColor = "rgba(25, 18, 12, 0.35)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#FAF4E5";
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.clip();
    ctx.fillStyle = tex.patterns.ochre;
    ctx.fillRect(14, -40, stripW - 28, H + 80);
    ctx.restore();
  }

  // Origami Page-Turn Fold transition (progress 0 -> 1)
  function drawPageFoldWipe(ctx, progress, tex) {
    if (progress <= 0 || progress >= 1) return;
    const p = easeInOutCubic(progress);
    // Sweeps right-to-left like flipping a storybook page
    const foldX = lerp(W + 120, -260, p);
    const flapW = Math.sin(p * Math.PI) * 340 + 40;

    ctx.save();
    // Cast shadow behind turning page crease
    const sg = ctx.createLinearGradient(foldX - 90, 0, foldX, 0);
    sg.addColorStop(0, "rgba(25,18,12,0)");
    sg.addColorStop(1, "rgba(25,18,12,0.38)");
    ctx.fillStyle = sg;
    ctx.fillRect(foldX - 90, 0, 90, H);

    // Curled underside of turning cream page
    const pg = ctx.createLinearGradient(foldX, 0, foldX + flapW, 0);
    pg.addColorStop(0, "#E7D9BC");
    pg.addColorStop(0.35, "#FAF4E6");
    pg.addColorStop(0.85, "#E2D1B0");
    pg.addColorStop(1, "#CBB68E");
    ctx.fillStyle = pg;
    ctx.fillRect(foldX, 0, flapW, H);

    ctx.strokeStyle = "rgba(95, 74, 48, 0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(foldX, 0);
    ctx.lineTo(foldX, H);
    ctx.stroke();
    ctx.restore();
  }

  // Billowing paper-cloud transition sweep (Act 5 -> Act 6)
  function drawCloudSweepWipe(ctx, progress) {
    if (progress <= 0 || progress >= 1) return;
    const p = easeInOutCubic(progress);
    const alpha = Math.sin(p * Math.PI);
    const cx = lerp(-350, W + 350, p);
    ctx.save();
    ctx.globalAlpha = clamp(alpha * 1.25, 0, 1);
    for (let i = 0; i < 11; i++) {
      const py = (i / 10) * H + Math.sin(i * 2.1) * 55;
      const ox = (hash(i * 19.7) - 0.5) * 420;
      const r = 180 + hash(i * 31.3) * 140;
      ctx.fillStyle = i % 2 === 0 ? "#FAF4E5" : "#EDE2CB";
      ctx.beginPath();
      ctx.arc(cx + ox, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Subtle paper-theater frame vignette around edges
  function drawPaperFrame(ctx, nightMix = 0) {
    ctx.save();
    const rg = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.34, W * 0.5, H * 0.5, W * 0.62);
    rg.addColorStop(0, "rgba(0,0,0,0)");
    rg.addColorStop(1, nightMix > 0.5 ? "rgba(10,14,26,0.42)" : "rgba(62,44,24,0.22)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // Subtle hand-ruled matte paper border
    ctx.strokeStyle = nightMix > 0.5 ? "rgba(248,236,204,0.22)" : "rgba(58,42,28,0.24)";
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 20, W - 44, H - 40);
    ctx.restore();
  }

  window.CollageGFX = {
    W, H,
    clamp, lerp, invLerp, smoothstep,
    easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack, easeOutElastic,
    hash, boil,
    CollageTextures,
    drawSkyBackdrop, drawTornHill, drawVillageRoad,
    drawCutoutSprite, drawPuppetString, drawPaperSun, drawPaperCloud,
    drawMaskingTape, drawBrassBrad, drawTornCard,
    drawCollageBanner, drawSpeechScrap, drawComicStamp,
    drawTeardrop, drawPaperStar, drawPlumBranch, drawLantern,
    drawTumblingBasket, drawFlyingVeggie,
    drawThoughtCloudFeast, drawPaperDollVignette, drawAngelPig, drawPotSteam,
    drawTornStripWipe, drawPageFoldWipe, drawCloudSweepWipe, drawPaperFrame
  };
})();
