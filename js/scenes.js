// Pure Vanilla JavaScript Director & Scene Choreography Engine
// "The Promise & The Pig" — A Whimsical Hand-Drawn Collage Tale of Zengzi (55.5s)

(function () {
  "use strict";

  const G = window.CollageGFX;
  const W = G.W;
  const H = G.H;

  class ZengziDirector {
    constructor(ctx, images) {
      this.ctx = ctx;
      this.img = images; // map of Image elements keyed by sprite name
      this.tex = new G.CollageTextures(ctx);
      // Pre-seeded drifting plum petals
      this.petals = Array.from({ length: 22 }, (_, i) => ({
        x: G.hash(i * 17.3) * W,
        y: G.hash(i * 31.7) * H,
        speedX: 28 + G.hash(i * 43.1) * 35,
        speedY: 18 + G.hash(i * 59.3) * 28,
        size: 6 + G.hash(i * 71.9) * 7,
        phase: G.hash(i * 89.1) * Math.PI * 2,
        rotSpeed: (G.hash(i * 97.3) - 0.5) * 2.5
      }));
    }

    render(t, speechState, showSubtitles = true) {
      const ctx = this.ctx;
      ctx.save();

      // Determine active act (with smooth transition overlays)
      if (t < 7.62) {
        this._renderAct1Village(ctx, t, speechState);
      } else if (t < 25.20) {
        this._renderAct2And3Road(ctx, t, speechState);
      } else if (t < 36.72) {
        this._renderAct4Twist(ctx, t, speechState);
      } else if (t < 46.20) {
        this._renderAct5Wisdom(ctx, t, speechState);
      } else {
        this._renderAct6Finale(ctx, t, speechState);
      }

      // Authentic handmade paper-craft transitions layered cleanly over cut points
      if (t >= 7.25 && t <= 7.98) {
        G.drawTornStripWipe(ctx, G.invLerp(7.25, 7.98, t), this.tex);
      }
      if (t >= 24.82 && t <= 25.56) {
        G.drawPageFoldWipe(ctx, G.invLerp(24.82, 25.56, t), this.tex);
      }
      if (t >= 45.78 && t <= 46.58) {
        G.drawCloudSweepWipe(ctx, G.invLerp(45.78, 46.58, t));
      }

      // Subtle paper-theater frame matte & vignette
      const nightMix = t >= 46.20 ? 1 : 0;
      G.drawPaperFrame(ctx, nightMix);

      // Clean live English word-synced caption ribbon (hidden during title/end cards if no speech)
      if (showSubtitles && speechState && speechState.clip) {
        this._renderSubtitleRibbon(ctx, speechState, t);
      }

      ctx.restore();
    }

    // =========================================================================
    // ACT 1 (0.00s - 7.62s): Pop-Up Village Opening & Title Banner
    // =========================================================================
    _renderAct1Village(ctx, t, speech) {
      G.drawSkyBackdrop(ctx, this.tex, 0);

      // Gentle storybook camera drift & push-in
      const camScale = G.lerp(1.0, 1.055, G.easeInOutCubic(G.invLerp(0.5, 7.4, t)));
      const camX = G.lerp(0, -35, G.easeInOutCubic(G.invLerp(0.5, 7.4, t)));

      ctx.save();
      ctx.translate(W * 0.5 + camX, H * 0.5);
      ctx.scale(camScale, camScale);
      ctx.translate(-W * 0.5, -H * 0.5);

      // Hanging paper sun drops in on a string
      const sunDrop = G.easeOutBack(G.invLerp(0.15, 1.15, t), 1.4);
      G.drawPaperSun(ctx, 1650, G.lerp(-140, 165, sunDrop), t, 1.05, this.tex);

      // Drifting stitched paper clouds
      G.drawPaperCloud(ctx, 320 + t * 14, 155, 0.92, t, 1, 0);
      G.drawPaperCloud(ctx, 980 + t * 10, 118, 0.72, t, 2, 0);
      G.drawPaperCloud(ctx, 1360 + t * 12, 225, 0.62, t, 3, 0);

      // Layered torn-paper hills unfolding like a pop-up book!
      G.drawTornHill(ctx, {
        yBase: 675, amp1: 68, amp2: 26, phase: 0.5, seed: 11,
        pattern: this.tex.patterns.sage, popUp: G.invLerp(0.05, 0.85, t)
      });
      G.drawTornHill(ctx, {
        yBase: 760, amp1: 42, amp2: 18, phase: 2.2, seed: 12,
        pattern: this.tex.patterns.sageDark, popUp: G.invLerp(0.15, 0.95, t)
      });
      G.drawTornHill(ctx, {
        yBase: 855, amp1: 22, amp2: 10, phase: 1.0, seed: 13,
        pattern: this.tex.patterns.ochre, popUp: G.invLerp(0.22, 1.05, t)
      });

      // Hand-painted village cottage & courtyard fence
      G.drawCutoutSprite(ctx, this.img.village_cottage, 490, 915, {
        height: 550, popUp: G.invLerp(0.32, 1.15, t), t, seed: 10, boilAmt: 0.45, groundShadow: false
      });

      // Plump rosy pig snoozing peacefully on the right courtyard!
      const pigPop = G.invLerp(1.0, 1.85, t);
      const pigBreathe = 1 + Math.sin(t * 2.8) * 0.025;
      G.drawCutoutSprite(ctx, this.img.pig_happy, 1565, 922, {
        height: 220, popUp: pigPop, sx: pigBreathe, sy: 2 - pigBreathe, t, seed: 22
      });
      // Floating hand-inked "Zzz" above cozy pig
      if (t > 1.8) {
        for (let z = 0; z < 3; z++) {
          const cyc = ((t * 0.55 + z * 0.33) % 1);
          const zx = 1525 + Math.sin(cyc * 5 + z) * 14 + cyc * 24;
          const zy = 715 - cyc * 95;
          ctx.save();
          ctx.globalAlpha = Math.sin(cyc * Math.PI) * 0.85;
          ctx.fillStyle = "#3E2E22";
          ctx.font = `italic 800 ${20 + z * 5}px "Georgia", serif`;
          ctx.fillText("z", zx, zy);
          ctx.restore();
        }
      }

      // Cast pops up right on the narrator's exact word cues!
      // "wise scholar Zengzi" (~4.45s), "his wife" (~5.35s), "their little boy" (~6.15s)
      if (t >= 4.25) {
        G.drawCutoutSprite(ctx, this.img.zengzi_wise, 865, 932, {
          height: 415, popUp: G.invLerp(4.25, 4.95, t), t, seed: 31
        });
      }
      if (t >= 5.15) {
        G.drawCutoutSprite(ctx, this.img.wife_market, 1110, 938, {
          height: 365, flipX: true, popUp: G.invLerp(5.15, 5.85, t), t, seed: 32
        });
      }
      if (t >= 6.00) {
        const boyHop = Math.abs(Math.sin(t * 6.5)) * 16;
        G.drawCutoutSprite(ctx, this.img.boy_happy, 1295, 940 - boyHop, {
          height: 245, popUp: G.invLerp(6.00, 6.65, t), t, seed: 33
        });
      }

      // Drifting pink plum petals & foreground hanging plum branch
      this._drawDriftingPetals(ctx, t, 1.0);
      G.drawPlumBranch(ctx, -18, 25, 0.92, t, false);

      ctx.restore();

      // Opening Collage Title Banner ("THE PROMISE & THE PIG") unfolds & floats gracefully away
      const bannerIn = G.invLerp(0.35, 1.25, t);
      const bannerOut = 1 - G.easeInCubic(G.invLerp(3.35, 4.15, t));
      if (bannerOut > 0.01) {
        const liftY = G.lerp(0, -140, 1 - bannerOut);
        G.drawCollageBanner(
          ctx,
          "THE PROMISE & THE PIG",
          "A Whimsical Tale of Zengzi",
          W * 0.5,
          290 + liftY,
          bannerIn * bannerOut,
          t,
          { width: 840, height: 192, titleSize: 56, subSize: 29, seed: 77 }
        );
      }
    }

    // =========================================================================
    // ACT 2 & 3 (7.62s - 25.20s): Village Road, Tantrum, Promise & Joyful Skip
    // =========================================================================
    _renderAct2And3Road(ctx, t, speech) {
      G.drawSkyBackdrop(ctx, this.tex, 0);

      // Parallax road scroll while walking (7.6s -> 12.6s), then steady for conversation, slight drift on skip
      const walkScroll = G.easeOutCubic(G.invLerp(7.6, 12.6, t)) * 340;
      // Camera zooms warmly in for the boy's plea & mother's promise (12.6s -> 21.3s)
      const zoomIn = G.easeInOutCubic(G.invLerp(12.5, 13.6, t));
      const zoomOut = G.easeInOutCubic(G.invLerp(21.1, 22.3, t));
      const zoom = 1 + (zoomIn - zoomOut) * 0.13;
      const focusX = G.lerp(W * 0.5, 1020, zoomIn - zoomOut);
      const focusY = G.lerp(H * 0.5, 620, zoomIn - zoomOut);

      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);

      // Sun & drifting paper clouds
      G.drawPaperSun(ctx, 1680 - walkScroll * 0.08, 155, t, 0.95, this.tex);
      G.drawPaperCloud(ctx, 350 - walkScroll * 0.15 + (t - 7.6) * 10, 145, 0.85, t, 4, 0);
      G.drawPaperCloud(ctx, 1180 - walkScroll * 0.18 + (t - 7.6) * 8, 175, 0.70, t, 5, 0);

      // Distant hills & winding village road
      G.drawTornHill(ctx, {
        yBase: 645, amp1: 62, amp2: 24, phase: 1.4, seed: 21,
        pattern: this.tex.patterns.sage, scrollX: walkScroll * 0.35
      });
      G.drawTornHill(ctx, {
        yBase: 745, amp1: 36, amp2: 15, phase: 3.1, seed: 22,
        pattern: this.tex.patterns.sageDark, scrollX: walkScroll * 0.65
      });

      // Distant village cottage receding on the left
      G.drawCutoutSprite(ctx, this.img.village_cottage, 220 - walkScroll * 0.45, 790, {
        height: 310, t, seed: 18, boilAmt: 0.35, groundShadow: false
      });

      // Winding torn-paper village lane
      G.drawVillageRoad(ctx, this.tex, 765, 975, walkScroll);

      // Foreground low meadow strip
      G.drawTornHill(ctx, {
        yBase: 970, amp1: 16, amp2: 8, phase: 0.8, seed: 23,
        pattern: this.tex.patterns.ochre, scrollX: walkScroll * 1.1
      });

      // --- WIFE CHOREOGRAPHY ---
      let wifeX, wifeY = 918, wifeFlip = false, wifeRot = 0;
      const wifeSpeak = speech.speaker === "Wife" ? speech.energy : 0;

      if (t < 12.6) {
        // Walking cheerfully to market
        const p = G.easeOutCubic(G.invLerp(7.6, 12.6, t));
        wifeX = G.lerp(490, 1245, p);
        const step = Math.abs(Math.sin(t * 7.8));
        wifeY = 918 - step * 18;
        wifeRot = Math.sin(t * 7.8) * 0.045;
      } else if (t < 21.55) {
        // Turns gently back toward her crying son (flips left at 15.6s!)
        wifeX = 1245;
        wifeFlip = t >= 15.65;
        // Smooth flip squeeze at 15.55..15.80
        wifeRot = t >= 16.0 ? -0.055 : 0;
      } else {
        // Waves goodbye & continues happily to market off-screen right
        const p = G.easeInCubic(G.invLerp(21.7, 24.9, t));
        wifeX = G.lerp(1245, 2080, p);
        wifeFlip = false;
        wifeY = 918 - Math.abs(Math.sin(t * 8.2)) * 18;
        wifeRot = Math.sin(t * 8.2) * 0.05;
      }

      // Smooth paper-card horizontal flip width scaling
      let wifeScaleX = 1;
      if (t >= 15.50 && t <= 15.82) {
        wifeScaleX = Math.max(0.08, Math.abs(Math.cos(G.invLerp(15.50, 15.82, t) * Math.PI)));
      }

      G.drawCutoutSprite(ctx, this.img.wife_market, wifeX, wifeY, {
        height: 415,
        flipX: wifeFlip,
        sx: wifeScaleX,
        rot: wifeRot,
        speechEnergy: wifeSpeak,
        t, seed: 41
      });

      // --- LITTLE BOY CHOREOGRAPHY ---
      const boySpeak = speech.speaker === "Boy" ? speech.energy : 0;
      const isBoyHappy = t >= 21.55;

      let boyX, boyY = 925, boyFlip = false, boyRot = 0, boySx = 1, boySy = 1;
      if (!isBoyHappy) {
        const chaseP = G.easeOutCubic(G.invLerp(7.8, 12.6, t));
        boyX = G.lerp(160, 860, chaseP);
        // Frantic toddling hop while chasing, trembling tantrum hop while pleading
        const hopFreq = t < 12.6 ? 11.5 : (t < 16.0 ? 13.5 : 5.0);
        const hopAmp = t < 16.0 ? 24 : 7;
        boyY = 925 - Math.abs(Math.sin(t * hopFreq)) * hopAmp;
        boyRot = Math.sin(t * hopFreq) * (t < 16.0 ? 0.08 : 0.03);
      } else {
        // Beaming joy! Pops in place then skips joyfully left back toward home!
        const popT = G.invLerp(21.55, 22.05, t);
        const skipP = G.easeInOutCubic(G.invLerp(22.0, 24.8, t));
        boyX = G.lerp(860, 120, skipP);
        boyFlip = true; // Facing left heading back home!
        const skipBounce = Math.abs(Math.sin((t - 21.55) * 9.5));
        boyY = 925 - skipBounce * 58;
        boyRot = Math.sin((t - 21.55) * 9.5) * 0.12;
        const popScale = G.easeOutBack(popT, 1.8);
        boySx = popScale;
        boySy = popScale;
      }

      G.drawCutoutSprite(ctx, isBoyHappy ? this.img.boy_happy : this.img.boy_crying, boyX, boyY, {
        height: 295,
        flipX: boyFlip,
        rot: boyRot,
        sx: boySx,
        sy: boySy,
        speechEnergy: boySpeak,
        t, seed: 42
      });

      // Comical arcing paper-cut teardrops spraying while boy cries (10.5s - 18.8s)
      if (t >= 10.4 && t <= 19.0) {
        const tearIntensity = t < 16.0 ? 1.0 : G.invLerp(19.0, 16.0, t);
        for (let i = 0; i < 6; i++) {
          const cyc = ((t * 1.45 + i * 0.167) % 1);
          const dir = i % 2 === 0 ? -1 : 1;
          const tx = boyX + dir * (35 + cyc * 145);
          const ty = (boyY - 195) - Math.sin(cyc * Math.PI) * 95 + cyc * cyc * 175;
          const trot = dir * (0.4 + cyc * 1.8);
          ctx.save();
          ctx.globalAlpha = Math.sin(cyc * Math.PI) * tearIntensity;
          G.drawTeardrop(ctx, tx, ty, trot, 0.72 + (i % 3) * 0.14);
          ctx.restore();
        }
      }

      // Boy's plea speech scrap ("WAIT FOR ME! / I WANNA COME TOO!") synced to boy_1
      if (t >= 12.75 && t <= 16.05) {
        const sIn = G.invLerp(12.75, 13.15, t);
        const sOut = 1 - G.invLerp(15.75, 16.05, t);
        const lines = t < 14.45 ? ["WAIT FOR ME!"] : ["WAIT FOR ME!", "I WANNA COME TOO!"];
        G.drawSpeechScrap(ctx, lines, boyX - 40, boyY - 365, "down-right", sIn * sOut, t, {
          width: 420, height: t < 14.45 ? 92 : 124, rot: -0.05, fontSize: 30, seed: 91
        });
      }

      // Act 3 Whimsical Thought Cloud Feast! Pops right when wife says "roast the pig" (19.20s - 22.05s)
      if (t >= 19.15 && t <= 22.15) {
        const cIn = G.invLerp(19.15, 19.75, t);
        const cOut = 1 - G.invLerp(21.70, 22.15, t);
        G.drawThoughtCloudFeast(ctx, 905, 305, cIn * cOut, t, this.img.pig_happy);
      }

      // Mother's playful promise speech ribbon ("WE'LL ROAST THE PIG!")
      if (t >= 19.30 && t <= 21.65) {
        const rIn = G.invLerp(19.30, 19.70, t);
        const rOut = 1 - G.invLerp(21.30, 21.65, t);
        G.drawSpeechScrap(ctx, ["WE'LL ROAST THE PIG!"], 1380, 425, "down-left", rIn * rOut, t, {
          width: 455, height: 94, fill: "#FFF3D6", textColor: "#9E2E1D", rot: 0.04, fontSize: 31, seed: 95
        });
      }

      // Golden paper star explosion when boy turns joyful at 21.55s!
      if (t >= 21.55 && t <= 23.10) {
        const ep = G.invLerp(21.55, 23.10, t);
        for (let s = 0; s < 10; s++) {
          const ang = (s / 10) * Math.PI * 2 + 0.3;
          const dist = 45 + G.easeOutCubic(ep) * (180 + (s % 3) * 55);
          const sx = 860 + Math.cos(ang) * dist;
          const sy = 760 + Math.sin(ang) * dist - ep * 35;
          ctx.save();
          ctx.globalAlpha = 1 - G.easeInCubic(ep);
          G.drawPaperStar(ctx, sx, sy, 16 + (s % 3) * 5, ang + ep * 4, s % 2 === 0 ? "#EBB538" : "#D9573B");
          ctx.restore();
        }
      }

      this._drawDriftingPetals(ctx, t, 0.7);
      ctx.restore();
    }

    // =========================================================================
    // ACT 4 (25.20s - 36.72s): The Courtyard Return & Hilarious Cleaver Twist!
    // =========================================================================
    _renderAct4Twist(ctx, t, speech) {
      G.drawSkyBackdrop(ctx, this.tex, 0);

      // Dramatic camera snap & shake on the exact FREEZE frame (26.68s) & SHING frame (29.38s)!
      const panReveal = G.easeInOutCubic(G.invLerp(27.5, 29.0, t));
      const freezeShake = t >= 26.68 && t <= 27.15 ? Math.sin(t * 75) * (1 - G.invLerp(26.68, 27.15, t)) * 16 : 0;
      const shingShake = t >= 29.38 && t <= 29.75 ? Math.sin(t * 85) * (1 - G.invLerp(29.38, 29.75, t)) * 10 : 0;
      const camZoom = G.lerp(1.04, 1.09, panReveal);
      const camOffX = G.lerp(45, -55, panReveal) + freezeShake + shingShake;

      ctx.save();
      ctx.translate(W * 0.5 + camOffX, H * 0.5 + freezeShake * 0.4);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-W * 0.5, -H * 0.5);

      G.drawPaperSun(ctx, 1680, 150, t, 0.92, this.tex);
      G.drawPaperCloud(ctx, 290 + (t - 25) * 9, 140, 0.8, t, 6, 0);
      G.drawPaperCloud(ctx, 1080 + (t - 25) * 7, 130, 0.72, t, 7, 0);

      // Village courtyard hills & cottage
      G.drawTornHill(ctx, { yBase: 685, amp1: 54, amp2: 20, phase: 0.7, seed: 31, pattern: this.tex.patterns.sage });
      G.drawTornHill(ctx, { yBase: 815, amp1: 24, amp2: 10, phase: 1.9, seed: 32, pattern: this.tex.patterns.ochre });

      G.drawCutoutSprite(ctx, this.img.village_cottage, 330, 880, {
        height: 490, t, seed: 10, boilAmt: 0.4, groundShadow: false
      });

      // --- ZENGZI WITH CLEAVER (Center-Right) ---
      const zengziX = 1175;
      // Subtle earnest blade-raising rhythm on "sharpening his blade"
      const raisePulse = t >= 29.1 && t <= 31.8 ? Math.sin((t - 29.1) * 9) * 0.05 : 0;
      G.drawCutoutSprite(ctx, this.img.zengzi_cleaver, zengziX, 935, {
        height: 465,
        rot: raisePulse,
        t, seed: 51
      });

      // Gleaming silver star-glint flashing across Zengzi's cleaver at 29.38s!
      if (t >= 29.30 && t <= 30.35) {
        const gp = G.invLerp(29.30, 30.35, t);
        const glintX = zengziX + 108;
        const glintY = 530;
        const gScale = Math.sin(gp * Math.PI) * 1.45;
        ctx.save();
        ctx.translate(glintX, glintY);
        ctx.rotate(gp * 1.6);
        ctx.scale(gScale, gScale);
        ctx.fillStyle = "#FFFDF5";
        ctx.strokeStyle = "#E8B138";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = i % 2 === 0 ? 58 : 14;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Comic burst stamp "SHING!" right beside the cleaver!
      if (t >= 29.38 && t <= 31.60) {
        const sIn = G.invLerp(29.38, 29.72, t);
        const sOut = 1 - G.invLerp(31.20, 31.60, t);
        G.drawComicStamp(ctx, "SHING!", zengziX + 205, 425, sIn * sOut, t, {
          rx: 138, ry: 70, bg: "#E3A634", fg: "#231912", rot: 0.14, fontSize: 44, seed: 144
        });
      }

      // --- STARTLED PIG LEAPING IN COMEDIC PANIC (Right) ---
      const pigCalm = t < 28.4;
      let pigY = 928, pigRot = 0, pigX = 1585;
      if (!pigCalm) {
        // Frantic comic leaps peaking right on "startled pig" (30.82s)!
        const panicBoost = t >= 30.65 && t <= 32.0 ? 1.5 : 1.0;
        const leap = Math.abs(Math.sin((t - 28.4) * 7.8));
        pigY = 910 - leap * 95 * panicBoost;
        pigRot = Math.sin((t - 28.4) * 7.8) * 0.18;
        pigX = 1585 + Math.sin((t - 28.4) * 5.2) * 28;
      }
      G.drawCutoutSprite(ctx, pigCalm ? this.img.pig_happy : this.img.pig_panicked, pigX, pigY, {
        height: 265,
        rot: pigRot,
        shadowScale: pigCalm ? 1 : 0.72,
        t, seed: 52
      });

      // Flying comic sweat drops & panic lines around startled pig!
      if (!pigCalm) {
        for (let d = 0; d < 4; d++) {
          const cyc = ((t * 1.9 + d * 0.25) % 1);
          const ang = -2.2 + d * 0.75;
          const sx = pigX + Math.cos(ang) * (95 + cyc * 80);
          const sy = (pigY - 140) + Math.sin(ang) * (75 + cyc * 70);
          ctx.save();
          ctx.globalAlpha = Math.sin(cyc * Math.PI) * 0.9;
          G.drawTeardrop(ctx, sx, sy, ang + Math.PI / 2, 0.65);
          ctx.restore();
        }
      }

      // --- WIFE RETURNING -> SUDDEN COMIC FREEZE & SHOCKED PROTEST ---
      const isFrozen = t >= 26.68;
      const wifeSpeak = speech.speaker === "Wife" ? speech.energy : 0;

      if (!isFrozen) {
        const walkP = G.easeOutCubic(G.invLerp(25.2, 26.68, t));
        const wx = G.lerp(180, 585, walkP);
        const wy = 928 - Math.abs(Math.sin(t * 8.0)) * 18;
        G.drawCutoutSprite(ctx, this.img.wife_market, wx, wy, {
          height: 405, rot: Math.sin(t * 8.0) * 0.04, t, seed: 53
        });
      } else {
        // Steps urgently forward when pleading "Wait, stop! Only joking!"
        const rushP = G.easeOutCubic(G.invLerp(32.1, 33.4, t));
        const wx = G.lerp(595, 745, rushP);
        const jolt = t < 27.1 ? Math.sin((t - 26.68) * 45) * 10 * (1 - G.invLerp(26.68, 27.1, t)) : 0;
        G.drawCutoutSprite(ctx, this.img.wife_shocked, wx + jolt, 932, {
          height: 415,
          speechEnergy: wifeSpeak * 1.35,
          t, seed: 54
        });

        // Dramatic radiating hand-drawn shock lines around her head at 26.68s - 27.65s
        if (t <= 27.75) {
          const sa = 1 - G.invLerp(27.2, 27.75, t);
          ctx.save();
          ctx.globalAlpha = sa;
          ctx.strokeStyle = "#C8422B";
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          for (let k = 0; k < 8; k++) {
            const ang = -Math.PI * 0.95 + (k / 7) * Math.PI * 0.9;
            ctx.beginPath();
            ctx.moveTo(wx + 25 + Math.cos(ang) * 95, 560 + Math.sin(ang) * 95);
            ctx.lineTo(wx + 25 + Math.cos(ang) * 145, 560 + Math.sin(ang) * 145);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Tumbling dropped market basket + flying radish & scallion (26.68s - 28.6s)!
        if (t <= 28.8) {
          const bp = G.invLerp(26.68, 28.6, t);
          const bx = G.lerp(540, 310, bp);
          // Bouncing parabolic trajectory
          let by;
          if (bp < 0.45) {
            const u = bp / 0.45;
            by = 760 - Math.sin(u * Math.PI) * 185 + u * 140;
          } else {
            const u = (bp - 0.45) / 0.55;
            by = 900 - Math.sin(u * Math.PI) * 52;
          }
          G.drawTumblingBasket(ctx, bx, by, -bp * 7.5, 1.0);
          G.drawFlyingVeggie(ctx, G.lerp(540, 210, bp), 740 - Math.sin(Math.min(1, bp * 1.5) * Math.PI) * 230 + bp * 180, bp * 10, "radish");
          G.drawFlyingVeggie(ctx, G.lerp(550, 415, bp), 730 - Math.sin(Math.min(1, bp * 1.3) * Math.PI) * 210 + bp * 190, -bp * 8, "scallion");
        }
      }

      // Wife's frantic speech scraps ("WAIT—STOP!" & "ONLY JOKING?!") synced to wife_2!
      if (t >= 32.10 && t <= 36.40) {
        if (t < 34.70) {
          const pIn = G.invLerp(32.10, 32.42, t);
          const pOut = 1 - G.invLerp(34.40, 34.70, t);
          const txt = t < 33.55 ? ["WAIT — STOP!"] : ["WAIT — STOP!", "WHAT ARE YOU DOING?!"];
          G.drawSpeechScrap(ctx, txt, 690, 405, "down-left", pIn * pOut, t, {
            width: 450, height: t < 33.55 ? 92 : 128, fill: "#FFF4E4", textColor: "#B32B1D", rot: -0.04, fontSize: 31, seed: 112
          });
        } else {
          const jIn = G.invLerp(34.70, 35.05, t);
          const jOut = 1 - G.invLerp(36.10, 36.45, t);
          G.drawComicStamp(ctx, "ONLY JOKING?!", 855, 365, jIn * jOut, t, {
            rx: 262, ry: 96, bg: "#C9402C", fg: "#FFF9EA", rot: -0.05, fontSize: 36, seed: 155
          });
        }
      }

      ctx.restore();
    }

    // =========================================================================
    // ACT 5 (36.72s - 46.20s): Zengzi's Serene Timeless Wisdom & Red Thread
    // =========================================================================
    _renderAct5Wisdom(ctx, t, speech) {
      G.drawSkyBackdrop(ctx, this.tex, 0);

      // Warm amber storybook wash gently enters to set a reflective philosophical mood
      const warmFade = G.easeOutCubic(G.invLerp(36.72, 37.9, t));
      ctx.save();
      ctx.fillStyle = `rgba(224, 174, 96, ${0.22 * warmFade})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Gentle slow camera push-in onto wise Zengzi
      const camZoom = G.lerp(1.0, 1.055, G.easeInOutCubic(G.invLerp(36.8, 45.8, t)));
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-W * 0.5, -H * 0.5);

      G.drawPaperCloud(ctx, 320 + (t - 36.7) * 7, 145, 0.78, t, 8, 0);
      G.drawTornHill(ctx, { yBase: 715, amp1: 48, amp2: 18, phase: 0.9, seed: 41, pattern: this.tex.patterns.sage });
      G.drawTornHill(ctx, { yBase: 830, amp1: 20, amp2: 10, phase: 2.1, seed: 42, pattern: this.tex.patterns.ochre });

      // Soft theatrical golden paper-iris halo glowing warmly behind Zengzi!
      const haloR = G.lerp(160, 355, warmFade);
      const rg = ctx.createRadialGradient(690, 560, 40, 690, 560, haloR);
      rg.addColorStop(0, `rgba(255, 240, 190, ${0.65 * warmFade})`);
      rg.addColorStop(0.65, `rgba(240, 198, 118, ${0.24 * warmFade})`);
      rg.addColorStop(1, "rgba(240, 198, 118, 0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(690, 560, haloR, 0, Math.PI * 2);
      ctx.fill();

      // Wife listening quietly with bowed thoughtful posture on the left
      G.drawCutoutSprite(ctx, this.img.wife_market, 290, 938, {
        height: 385, rot: 0.045, t, seed: 61, boilAmt: 0.55
      });

      // Wise scholar Zengzi center-left, calm & luminous, synced to ChristopherNeural voice!
      const zSpeak = speech.speaker === "Zengzi" ? speech.energy : 0;
      G.drawCutoutSprite(ctx, this.img.zengzi_wise, 690, 945, {
        height: 495,
        speechEnergy: zSpeak,
        t, seed: 62, boilAmt: 0.65
      });

      // Poetic Paper-Doll Mirror Vignette unfolds at 39.20s ("They learn everything by watching us")!
      if (t >= 39.15) {
        const vigIn = G.invLerp(39.15, 40.0, t);
        G.drawPaperDollVignette(ctx, 1385, 345, vigIn, t);
      }

      // Kinetic Letterpress Quote Strips synced to Zengzi's iconic moral line!
      // "Deceive him today" -> 42.28s | "teach him to deceive tomorrow" -> 43.87s
      if (t >= 42.20) {
        const q1 = G.invLerp(42.20, 42.78, t);
        G.drawCollageBanner(ctx, "DECEIVE HIM TODAY...", null, 1385, 625, q1, t, {
          width: 620, height: 98, titleSize: 38, cardFill: "#FBF3E1", accent: "#394D70", rot: -0.018, seed: 81
        });
      }
      if (t >= 43.78) {
        const q2 = G.invLerp(43.78, 44.36, t);
        G.drawCollageBanner(ctx, "...TEACH HIM TOMORROW.", null, 1385, 745, q2, t, {
          width: 660, height: 102, titleSize: 38, cardFill: "#C94C35", titleColor: "#FFF8EA", accent: "#F2CE7E", rot: 0.016, seed: 82
        });
      }

      this._drawDriftingPetals(ctx, t, 0.85);
      G.drawPlumBranch(ctx, -20, 20, 0.85, t, false);
      ctx.restore();
    }

    // =========================================================================
    // ACT 6 (46.20s - 55.50s): Starry Lantern Twilight Feast & Storybook Finale
    // =========================================================================
    _renderAct6Finale(ctx, t, speech) {
      G.drawSkyBackdrop(ctx, this.tex, 1);

      // Twinkling hand-cut gold paper stars scattered in the indigo twilight sky!
      for (let i = 0; i < 24; i++) {
        const sx = 80 + G.hash(i * 19.1 + 3) * (W - 160);
        const sy = 55 + G.hash(i * 37.3 + 7) * 440;
        const tw = 0.45 + 0.55 * Math.sin(t * 2.6 + i * 1.7);
        ctx.save();
        ctx.globalAlpha = tw * 0.85;
        G.drawPaperStar(ctx, sx, sy, 5 + (i % 3) * 3.5, t * 0.4 + i, "#F5CE67");
        ctx.restore();
      }

      // Crescent painted paper moon hanging on a delicate string on the left
      const moonDrop = G.easeOutBack(G.invLerp(46.25, 47.15, t), 1.3);
      const moonY = G.lerp(-100, 165, moonDrop);
      G.drawPuppetString(ctx, 215, moonY - 45);
      ctx.save();
      ctx.translate(215, moonY);
      ctx.rotate(-0.2 + Math.sin(t * 1.2) * 0.05);
      ctx.shadowColor = "rgba(255, 226, 140, 0.45)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#F7DC88";
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.arc(18, -8, 42, 1.65 * Math.PI, 0.35 * Math.PI, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Twilight clouds
      G.drawPaperCloud(ctx, 640 + (t - 46) * 8, 170, 0.72, t, 9, 1);
      G.drawPaperCloud(ctx, 1340 + (t - 46) * 6, 155, 0.68, t, 10, 1);

      // Cheeky Whimsical Wink: Smiling Angel-Piglet floating happily upward in the starry sky! (49.3s+)
      if (t >= 49.15) {
        const ap = G.easeOutCubic(G.invLerp(49.15, 53.5, t));
        const pigSkyX = G.lerp(1540, 1620, ap);
        const pigSkyY = G.lerp(420, 235, ap);
        ctx.save();
        ctx.globalAlpha = G.invLerp(49.15, 50.0, t);
        G.drawAngelPig(ctx, pigSkyX, pigSkyY, 0.92, t, this.img.pig_happy);
        ctx.restore();
      }

      // Moonlit courtyard hills & cottage silhouette glow
      G.drawTornHill(ctx, { yBase: 690, amp1: 48, amp2: 18, phase: 0.6, seed: 51, pattern: this.tex.patterns.sageDark, lipColor: "#DDD6C5" });
      G.drawTornHill(ctx, { yBase: 820, amp1: 20, amp2: 10, phase: 1.5, seed: 52, pattern: this.tex.patterns.kraft, lipColor: "#E8DFC8" });

      G.drawCutoutSprite(ctx, this.img.village_cottage, 300, 880, {
        height: 440, t, seed: 10, boilAmt: 0.35, groundShadow: false
      });

      // Warm cozy hearth glow radiating behind the family feast table!
      const glowPulse = 0.92 + Math.sin(t * 3.5) * 0.08;
      const hearth = ctx.createRadialGradient(960, 770, 40, 960, 770, 520);
      hearth.addColorStop(0, `rgba(255, 200, 110, ${0.38 * glowPulse})`);
      hearth.addColorStop(0.55, `rgba(235, 136, 68, ${0.14 * glowPulse})`);
      hearth.addColorStop(1, "rgba(235, 136, 68, 0)");
      ctx.fillStyle = hearth;
      ctx.beginPath();
      ctx.arc(960, 770, 520, 0, Math.PI * 2);
      ctx.fill();

      // Family gathered warmly around the feast!
      const famPop = G.invLerp(46.25, 47.05, t);
      G.drawCutoutSprite(ctx, this.img.zengzi_wise, 555, 922, {
        height: 430, popUp: famPop, t, seed: 71
      });
      G.drawCutoutSprite(ctx, this.img.wife_market, 1385, 922, {
        height: 390, flipX: true, popUp: famPop, t, seed: 72
      });
      const boyJoyHop = Math.abs(Math.sin(t * 5.2)) * 18;
      G.drawCutoutSprite(ctx, this.img.boy_happy, 745, 920 - boyJoyHop, {
        height: 270, popUp: famPop, t, seed: 73
      });

      // Centerpiece hand-painted Feast Table + billowing gouache steam!
      G.drawPotSteam(ctx, 1020, 705, t);
      G.drawCutoutSprite(ctx, this.img.feast_table, 1020, 950, {
        height: 310, popUp: G.invLerp(46.35, 47.15, t), t, seed: 74, boilAmt: 0.5
      });

      // Five glowing hand-painted red paper lanterns descending on strings across top!
      const lanternSpecs = [
        [430, 175, 0.85, 1],
        [720, 145, 0.96, 2],
        [1020, 165, 0.88, 3],
        [1310, 142, 0.94, 4],
        [1745, 190, 0.82, 5]
      ];
      lanternSpecs.forEach(([lx, ly, ls, seed], idx) => {
        const drop = G.easeOutBack(G.invLerp(46.28 + idx * 0.12, 47.25 + idx * 0.12, t), 1.35);
        G.drawLantern(ctx, lx, G.lerp(-140, ly, drop), ls, t, seed, 1.0);
      });

      // --- GRAND STORYBOOK END CARD (52.65s - 55.50s) ---
      if (t >= 52.55) {
        const cardP = G.invLerp(52.55, 53.45, t);
        // Gentle twilight veil keeping the warm family feast clearly visible below
        ctx.save();
        ctx.fillStyle = `rgba(18, 24, 42, ${0.42 * G.easeOutCubic(cardP)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        G.drawCollageBanner(
          ctx,
          "A PROMISE IS A PROMISE.",
          "The Tale of Zengzi  •  Han Feizi (c. 3rd Century BCE)",
          W * 0.5,
          335,
          cardP,
          t,
          { width: 960, height: 204, titleSize: 56, subSize: 26, rot: 0, seed: 99 }
        );

        // Decorative little gilded FIN marker neatly tucked in the open sky beneath the card
        if (cardP > 0.5) {
          const sp = G.easeOutBack(G.invLerp(0.5, 1.0, cardP), 1.6);
          ctx.save();
          ctx.translate(W * 0.5, 466);
          ctx.scale(sp, sp);
          G.drawPaperStar(ctx, -95, 0, 12, t * 0.8, "#E8B138");
          G.drawPaperStar(ctx, 95, 0, 12, -t * 0.8, "#E8B138");
          ctx.fillStyle = "#FAF1DC";
          ctx.font = 'italic 700 22px "Georgia", serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("FIN", 0, 1);
          ctx.restore();
        }
      }
    }

    // Gentle floating plum blossom petals across scenes
    _drawDriftingPetals(ctx, t, alphaMul = 1) {
      ctx.save();
      ctx.globalAlpha = 0.82 * alphaMul;
      for (const p of this.petals) {
        const x = (p.x + t * p.speedX) % (W + 120) - 60;
        const y = (p.y + t * p.speedY + Math.sin(t * 2 + p.phase) * 28) % (H + 80) - 40;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * p.rotSpeed + p.phase);
        ctx.fillStyle = "#F4B4AA";
        ctx.strokeStyle = "rgba(180, 90, 82, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // Crisp editorial English closed-caption ribbon with live active-word highlight
    _renderSubtitleRibbon(ctx, speech, t) {
      const { clip, speaker, activeWordIdx } = speech;
      const fadeIn = G.invLerp(clip.cueStart, clip.cueStart + 0.18, t);
      const fadeOut = 1 - G.invLerp(clip.spokenEnd, clip.spokenEnd + 0.18, t);
      const alpha = G.clamp(Math.min(fadeIn, fadeOut), 0, 1);
      if (alpha <= 0.02) return;

      const speakerColors = {
        Narrator: "#2F4362",
        Wife: "#B8422D",
        Boy: "#C68621",
        Zengzi: "#3D5B47"
      };
      const badgeColor = speakerColors[speaker] || "#2F4362";

      ctx.save();
      ctx.globalAlpha = alpha;

      // Measure text to size the cream parchment ribbon neatly
      ctx.font = '600 28px "Georgia", "Palatino Linotype", serif';
      const badgeText = speaker.toUpperCase();
      ctx.font = '700 18px "Trebuchet MS", sans-serif';
      const badgeW = ctx.measureText(badgeText).width + 28;

      ctx.font = '600 28px "Georgia", "Palatino Linotype", serif';
      const fullText = clip.text;
      const textW = ctx.measureText(fullText).width;
      const boxW = Math.min(W - 140, badgeW + textW + 64);
      const boxH = 62;
      const bx = (W - boxW) * 0.5;
      const by = H - 88;

      // Soft cream parchment pill with thin ink rule
      ctx.shadowColor = "rgba(18, 14, 10, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = "rgba(250, 243, 227, 0.94)";
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.strokeStyle = "rgba(56, 42, 30, 0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Speaker tag pill
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(bx + 14, by + 15, badgeW, 32, 7);
      ctx.fill();

      ctx.fillStyle = "#FFF9EC";
      ctx.font = '800 16px "Trebuchet MS", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, bx + 14 + badgeW * 0.5, by + 32);

      // Render words with subtle warm highlight on the active spoken word
      const textStartX = bx + 28 + badgeW;
      const maxTextW = boxW - badgeW - 44;
      const fontSize = textW > maxTextW ? Math.floor(28 * (maxTextW / textW)) : 28;
      ctx.font = `600 ${fontSize}px "Georgia", "Palatino Linotype", serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // Split clip.text by spaces and align highlight smoothly with activeWordIdx
      const tokens = fullText.split(" ");
      let curX = textStartX;
      const cy = by + 32;
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        const isSpoken = i <= activeWordIdx;
        const isCurrent = i === activeWordIdx;
        ctx.fillStyle = isCurrent ? "#B53824" : (isSpoken ? "#1F1813" : "rgba(55, 44, 34, 0.52)");
        ctx.fillText(tok, curX, cy);
        curX += ctx.measureText(tok + " ").width;
      }

      ctx.restore();
    }
  }

  window.ZengziDirector = ZengziDirector;
})();
