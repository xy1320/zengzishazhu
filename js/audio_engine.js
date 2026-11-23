// Pure Vanilla JavaScript Web Audio Engine
// Handles studio Neural TTS playback, real-time PCM speech envelopes,
// original whimsical pentatonic folk score, and synchronized paper/foley SFX.

(function () {
  "use strict";

  function base64DataUriToArrayBuffer(dataUri) {
    const comma = dataUri.indexOf(",");
    const b64 = dataUri.slice(comma + 1);
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  // Note frequencies (D Major Pentatonic + warm chromatic accents)
  const N = {
    D2: 73.42, G2: 98.00, A2: 110.00, B2: 123.47,
    D3: 146.83, E3: 164.81, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
    Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
    Cs5: 554.37, D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
    D6: 1174.66, Fs6: 1479.98
  };

  class CollageAudioEngine {
    constructor(mediaBundle) {
      this.media = mediaBundle;
      this.duration = mediaBundle.filmDuration;
      this.ctx = null;
      this.masterGain = null;
      this.voiceGain = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.reverbSend = null;
      this.noiseBuffer = null;

      this.decodedClips = new Map(); // id -> { buffer, envelope60Hz }
      this.activeNodes = [];
      this.isReady = false;
      this.isPlaying = false;
      this.isMuted = false;

      this.playStartCtxTime = 0;
      this.playStartFilmTime = 0;
      this.pausedFilmTime = 0;

      // Pre-compute musical score events & SFX timeline once
      this.musicEvents = this._composeScore();
      this.sfxEvents = this._composeSfx();
    }

    async init() {
      if (this.isReady) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      // Gentle master dynamics compressor for broadcast-clean levels
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.008;
      comp.release.value = 0.18;

      this.masterGain.connect(comp);
      comp.connect(this.ctx.destination);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = 1.15;
      this.voiceGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.30;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.42;
      this.sfxGain.connect(this.masterGain);

      // Warm short room reverb for plucked instruments & chimes
      const convolver = this.ctx.createConvolver();
      convolver.buffer = this._createWarmImpulse(1.4, 2.8);
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = 0.28;
      this.reverbSend.connect(convolver);
      convolver.connect(this.masterGain);

      // Shared white/pink noise buffer for paper swishes & foley
      this.noiseBuffer = this._createNoiseBuffer(2.0);

      // Decode all 9 neural TTS MP3 buffers + extract 60Hz PCM RMS envelopes
      const decodePromises = this.media.clips.map(async (clip) => {
        const ab = base64DataUriToArrayBuffer(this.media.audio[clip.id]);
        const audioBuf = await this.ctx.decodeAudioData(ab);
        const env = this._computeEnvelope(audioBuf, 60);
        this.decodedClips.set(clip.id, { buffer: audioBuf, envelope: env });
      });
      await Promise.all(decodePromises);
      this.isReady = true;
    }

    _computeEnvelope(audioBuffer, fps) {
      const data = audioBuffer.getChannelData(0);
      const sr = audioBuffer.sampleRate;
      const step = Math.max(1, Math.floor(sr / fps));
      const frames = Math.ceil(data.length / step);
      const out = new Float32Array(frames);
      let maxVal = 0.01;
      for (let i = 0; i < frames; i++) {
        const start = i * step;
        const end = Math.min(data.length, start + step);
        let sum = 0;
        for (let j = start; j < end; j++) sum += data[j] * data[j];
        const rms = Math.sqrt(sum / Math.max(1, end - start));
        out[i] = rms;
        if (rms > maxVal) maxVal = rms;
      }
      // Normalize & smooth
      let smooth = 0;
      for (let i = 0; i < frames; i++) {
        const norm = Math.min(1, (out[i] / maxVal) * 1.45);
        smooth = smooth * 0.42 + norm * 0.58;
        out[i] = smooth;
      }
      return out;
    }

    _createWarmImpulse(seconds, decay) {
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * seconds);
      const buf = this.ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const env = Math.pow(1 - i / len, decay);
          const w = (Math.random() * 2 - 1) * env;
          lp = lp * 0.65 + w * 0.35;
          d[i] = lp;
        }
      }
      return buf;
    }

    _createNoiseBuffer(seconds) {
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * seconds);
      const buf = this.ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        d[i] = (b0 + b1 + b2 + white * 0.18) * 1.6;
      }
      return buf;
    }

    // Build a cohesive, expressive 55.5-second whimsical folk score
    _composeScore() {
      const ev = [];
      const add = (t, inst, freq, dur, vol, pan = 0) => ev.push({ t, inst, freq, dur, vol, pan });

      // --- ACT 1 (0.0s - 7.3s): Pastoral Whimsical Pentatonic Opening ---
      // Sweeping guzheng intro flourish
      [N.D4, N.E4, N.Fs4, N.A4, N.B4, N.D5, N.Fs5].forEach((f, i) => {
        add(0.18 + i * 0.095, "pluck", f, 1.3, 0.30, -0.35 + i * 0.11);
      });
      // Gentle village waltz bounce (1.2s .. 7.2s)
      const act1Bass = [
        [1.2, N.D3], [2.1, N.A2], [3.0, N.B2], [3.9, N.Fs3],
        [4.8, N.G2], [5.7, N.D3], [6.6, N.A2]
      ];
      act1Bass.forEach(([t, f]) => add(t, "bass", f, 0.65, 0.36, -0.1));
      const act1Mel = [
        [1.50, N.A4, 0.6], [1.95, N.B4, 0.45], [2.40, N.D5, 0.9],
        [3.30, N.B4, 0.5], [3.75, N.A4, 0.5], [4.20, N.Fs4, 0.85],
        [5.10, N.E4, 0.45], [5.55, N.Fs4, 0.45], [6.00, N.A4, 0.8], [6.85, N.E4, 0.7]
      ];
      act1Mel.forEach(([t, f, d], i) => add(t, "pluck", f, d + 0.4, 0.24, (i % 2 ? 0.22 : -0.22)));
      for (let t = 1.65; t < 7.1; t += 0.9) {
        add(t, "wood", 680, 0.08, 0.12, 0.15);
      }

      // --- ACT 2 (7.5s - 15.9s): Bustling Market Walk & Playful Toddler Tantrum ---
      for (let step = 0; step < 19; step++) {
        const t = 7.65 + step * 0.42;
        if (t > 15.5) break;
        const bassNote = [N.D3, N.A2, N.G2, N.A2][step % 4];
        if (step % 2 === 0) add(t, "bass", bassNote, 0.35, 0.32, -0.15);
        add(t + 0.21, "wood", step % 2 === 0 ? 780 : 620, 0.06, 0.14, 0.2);
      }
      const act2Mel = [
        [7.75, N.D5, 0.35], [8.17, N.E5, 0.35], [8.59, N.Fs5, 0.5], [9.01, N.D5, 0.4],
        [9.43, N.B4, 0.35], [9.85, N.A4, 0.5], [10.48, N.Fs4, 0.4], [10.90, N.A4, 0.5],
        // Playful comic sighing figures under crying boy
        [11.65, N.E5, 0.35], [12.05, N.D5, 0.45], [12.85, N.B4, 0.35], [13.25, N.A4, 0.4],
        [14.10, N.E5, 0.35], [14.55, N.D5, 0.4], [15.05, N.B4, 0.5]
      ];
      act2Mel.forEach(([t, f, d]) => add(t, "marimba", f, d, 0.24, 0.15));

      // --- ACT 3 (16.0s - 24.7s): Warm Promise & Joyful Hopping Home ---
      const act3Chords = [
        [16.2, [N.G3, N.B3, N.D4]],
        [17.8, [N.A3, N.D4, N.Fs4]],
        [19.3, [N.B3, N.D4, N.Fs4, N.A4]],
        [20.8, [N.A3, N.E4, N.A4]]
      ];
      act3Chords.forEach(([t, notes]) => {
        notes.forEach((f, i) => add(t + i * 0.06, "pluck", f, 1.4, 0.20, -0.25 + i * 0.18));
      });
      // Joyful skipping marimba & sparkle arpeggios when boy skips home (21.5s - 24.6s)
      const skipNotes = [N.D5, N.Fs5, N.A5, N.B5, N.A5, N.Fs5, N.E5, N.D5, N.E5, N.Fs5, N.A5];
      skipNotes.forEach((f, i) => {
        const t = 21.60 + i * 0.27;
        add(t, "marimba", f, 0.35, 0.26, (i % 2 ? 0.28 : -0.28));
        if (i % 2 === 0) add(t, "bass", i % 4 === 0 ? N.D3 : N.A2, 0.3, 0.30, 0);
      });

      // --- ACT 4 (25.1s - 36.4s): Sneaky Return -> FREEZE -> Comedic Chaos! ---
      // Brief cheerful return steps then SUDDEN FREEZE at 26.68s!
      add(25.30, "bass", N.D3, 0.3, 0.28);
      add(25.72, "marimba", N.A4, 0.3, 0.22);
      add(26.14, "bass", N.A2, 0.3, 0.28);
      // Silent comic tension beat after 26.68s freeze!
      // Sneaky tiptoe pizzicato under "There stood Zengzi, sharpening his blade..."
      const sneaky = [
        [28.10, N.B2], [28.45, N.D3], [28.80, N.E3], [29.15, N.Fs3],
        [29.95, N.G3], [30.35, N.A3], [30.75, N.B3]
      ];
      sneaky.forEach(([t, f]) => add(t, "bass", f, 0.22, 0.34, -0.1));
      // Frantic bouncy staccato under Wife's "Wait, stop! Only joking!"
      const frantic = [
        [32.15, N.E5], [32.45, N.D5], [32.95, N.B4], [33.40, N.A4],
        [34.10, N.E5], [34.50, N.Fs5], [34.95, N.E5], [35.40, N.D5]
      ];
      frantic.forEach(([t, f], i) => {
        add(t, "marimba", f, 0.22, 0.22, i % 2 ? 0.3 : -0.3);
        add(t, "wood", 840, 0.05, 0.11, 0);
      });

      // --- ACT 5 (36.8s - 45.8s): Zengzi's Serene, Heartfelt Philosophical Wisdom ---
      // Warm sustained bamboo-flute pads + tender slow harp chords
      const act5Pads = [
        [36.9, N.D4, 2.8, 0.16], [36.9, N.A4, 2.8, 0.12],
        [39.6, N.B3, 2.8, 0.16], [39.6, N.Fs4, 2.8, 0.12],
        [42.3, N.G3, 2.9, 0.17], [42.3, N.D4, 2.9, 0.13],
        [44.6, N.A3, 1.8, 0.15], [44.6, N.E4, 1.8, 0.11]
      ];
      act5Pads.forEach(([t, f, d, v]) => add(t, "flute", f, d, v, 0));

      const act5Harp = [
        [37.0, N.D3], [37.25, N.A3], [37.5, N.Fs4], [38.4, N.E4],
        [39.7, N.B2], [39.95, N.Fs3], [40.2, N.D4], [41.1, N.A4],
        [42.4, N.G2], [42.65, N.D3], [42.9, N.B3], [43.5, N.A3],
        [44.4, N.A2], [44.7, N.E3], [45.0, N.A3], [45.3, N.D4]
      ];
      act5Harp.forEach(([t, f], i) => add(t, "pluck", f, 2.2, 0.22, -0.28 + (i % 4) * 0.18));

      // --- ACT 6 (46.2s - 55.2s): Cozy Lantern Twilight Feast & Heartwarming Finale ---
      const act6Chords = [
        [46.3, [N.D3, N.A3, N.D4, N.Fs4, N.A4]],
        [48.2, [N.G2, N.D3, N.B3, N.D4, N.G4]],
        [50.1, [N.B2, N.Fs3, N.D4, N.Fs4, N.B4]],
        [51.9, [N.A2, N.E3, N.A3, N.E4, N.A4]],
        [53.2, [N.D2, N.D3, N.A3, N.D4, N.Fs4, N.A4, N.D5]]
      ];
      act6Chords.forEach(([t, notes], idx) => {
        notes.forEach((f, i) => {
          add(t + i * 0.085, "pluck", f, idx === 4 ? 2.6 : 1.9, idx === 4 ? 0.28 : 0.22, -0.35 + i * 0.12);
        });
      });
      // Twinkling lantern melody
      const finaleMel = [
        [46.9, N.A4, 0.6], [47.5, N.B4, 0.5], [48.4, N.D5, 0.8], [49.3, N.B4, 0.5],
        [50.3, N.A4, 0.6], [51.0, N.Fs4, 0.6], [52.0, N.E4, 0.8], [53.2, N.D5, 2.2]
      ];
      finaleMel.forEach(([t, f, d]) => add(t, "chime", f, d + 0.6, 0.16, 0.12));

      return ev;
    }

    _composeSfx() {
      return [
        { t: 0.12, type: "paper_unfold" },
        { t: 7.42, type: "paper_rip" },
        { t: 11.70, type: "teardrop", pitch: 580 },
        { t: 12.95, type: "teardrop", pitch: 660 },
        { t: 14.35, type: "teardrop", pitch: 520 },
        { t: 19.25, type: "bubble_pop" },
        { t: 21.55, type: "sparkle_gliss" },
        { t: 24.92, type: "paper_fold" },
        { t: 26.68, type: "comic_freeze" },
        { t: 27.05, type: "basket_thump" },
        { t: 29.38, type: "blade_shing" },
        { t: 30.82, type: "pig_squeal" },
        { t: 36.68, type: "wisdom_chime" },
        { t: 45.88, type: "cloud_whoosh" },
        { t: 49.95, type: "angel_harp" },
        { t: 53.05, type: "lantern_bell" }
      ];
    }

    // --- Synthesis Voices ---
    _playPluck(at, freq, dur, vol, pan) {
      const ctx = this.ctx;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq, at);
      osc2.frequency.setValueAtTime(freq * 2.0, at);

      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(Math.min(5200, freq * 7), at);
      filt.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.4), at + dur);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

      const g2 = ctx.createGain();
      g2.gain.value = 0.28;

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      osc1.connect(filt);
      osc2.connect(g2);
      g2.connect(filt);
      filt.connect(g);
      if (panner) {
        panner.pan.value = pan;
        g.connect(panner);
        panner.connect(this.musicGain);
        panner.connect(this.reverbSend);
      } else {
        g.connect(this.musicGain);
        g.connect(this.reverbSend);
      }

      osc1.start(at);
      osc2.start(at);
      osc1.stop(at + dur + 0.05);
      osc2.stop(at + dur + 0.05);
      this.activeNodes.push(osc1, osc2);
    }

    _playMarimba(at, freq, dur, vol, pan) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      osc.type = "sine";
      overtone.type = "sine";
      osc.frequency.setValueAtTime(freq, at);
      overtone.frequency.setValueAtTime(freq * 3.98, at);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

      const og = ctx.createGain();
      og.gain.setValueAtTime(vol * 0.22, at);
      og.gain.exponentialRampToValueAtTime(0.0001, at + Math.min(0.08, dur * 0.35));

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      osc.connect(g);
      overtone.connect(og);
      og.connect(g);
      if (panner) {
        panner.pan.value = pan;
        g.connect(panner);
        panner.connect(this.musicGain);
        panner.connect(this.reverbSend);
      } else {
        g.connect(this.musicGain);
      }
      osc.start(at);
      overtone.start(at);
      osc.stop(at + dur + 0.05);
      overtone.stop(at + dur + 0.05);
      this.activeNodes.push(osc, overtone);
    }

    _playBass(at, freq, dur, vol, pan) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, at);
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(520, at);
      filt.frequency.exponentialRampToValueAtTime(160, at + dur);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

      osc.connect(filt);
      filt.connect(g);
      g.connect(this.musicGain);
      osc.start(at);
      osc.stop(at + dur + 0.05);
      this.activeNodes.push(osc);
    }

    _playWood(at, freq, dur, vol, pan) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, at);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, at + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(at);
      osc.stop(at + dur + 0.03);
      this.activeNodes.push(osc);
    }

    _playFlute(at, freq, dur, vol) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, at);
      lfo.frequency.setValueAtTime(4.8, at);
      lfoGain.gain.setValueAtTime(freq * 0.007, at);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.45);
      g.gain.setValueAtTime(vol * 0.9, at + Math.max(0.5, dur - 0.55));
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

      osc.connect(g);
      g.connect(this.musicGain);
      g.connect(this.reverbSend);
      osc.start(at);
      lfo.start(at);
      osc.stop(at + dur + 0.06);
      lfo.stop(at + dur + 0.06);
      this.activeNodes.push(osc, lfo);
    }

    _playChime(at, freq, dur, vol, pan) {
      const ctx = this.ctx;
      [1, 2.756].forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * ratio, at);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(vol * (idx === 0 ? 1 : 0.25), at + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur * (idx === 0 ? 1 : 0.45));
        osc.connect(g);
        g.connect(this.musicGain);
        g.connect(this.reverbSend);
        osc.start(at);
        osc.stop(at + dur + 0.05);
        this.activeNodes.push(osc);
      });
    }

    // --- Handcrafted Pure-JS Foley SFX ---
    _playSfx(at, ev) {
      const ctx = this.ctx;
      const noiseBurst = (start, dur, freqStart, freqEnd, q, gainVal) => {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filt = ctx.createBiquadFilter();
        filt.type = "bandpass";
        filt.Q.value = q;
        filt.frequency.setValueAtTime(freqStart, start);
        filt.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(gainVal, start + dur * 0.18);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.connect(filt);
        filt.connect(g);
        g.connect(this.sfxGain);
        src.start(start, Math.random() * 0.5, dur + 0.04);
        this.activeNodes.push(src);
      };

      switch (ev.type) {
        case "paper_unfold":
          noiseBurst(at, 0.42, 650, 2200, 1.4, 0.35);
          break;
        case "paper_rip":
          noiseBurst(at, 0.32, 2400, 900, 2.0, 0.48);
          noiseBurst(at + 0.10, 0.24, 1800, 3200, 2.5, 0.32);
          break;
        case "paper_fold":
          noiseBurst(at, 0.38, 1200, 520, 1.5, 0.40);
          break;
        case "cloud_whoosh":
          noiseBurst(at, 0.65, 320, 1400, 1.0, 0.36);
          break;
        case "teardrop": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          const p = ev.pitch || 600;
          osc.frequency.setValueAtTime(p * 0.65, at);
          osc.frequency.exponentialRampToValueAtTime(p * 1.45, at + 0.11);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.linearRampToValueAtTime(0.26, at + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
          osc.connect(g);
          g.connect(this.sfxGain);
          osc.start(at);
          osc.stop(at + 0.16);
          this.activeNodes.push(osc);
          break;
        }
        case "bubble_pop": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(320, at);
          osc.frequency.exponentialRampToValueAtTime(860, at + 0.09);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.linearRampToValueAtTime(0.32, at + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
          osc.connect(g);
          g.connect(this.sfxGain);
          osc.start(at);
          osc.stop(at + 0.14);
          this.activeNodes.push(osc);
          break;
        }
        case "sparkle_gliss":
          [N.D5, N.Fs5, N.A5, N.D6, N.Fs6].forEach((f, i) => {
            this._playChime(at + i * 0.065, f, 0.55, 0.26, -0.2 + i * 0.1);
          });
          break;
        case "comic_freeze": {
          // Sharp theatrical woodblock clack + brief downward pitch-slide!
          this._playWood(at, 960, 0.09, 0.65, 0);
          this._playWood(at + 0.04, 1280, 0.08, 0.50, 0);
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(620, at);
          osc.frequency.exponentialRampToValueAtTime(160, at + 0.26);
          const f = ctx.createBiquadFilter();
          f.type = "lowpass";
          f.frequency.value = 1100;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.linearRampToValueAtTime(0.24, at + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
          osc.connect(f);
          f.connect(g);
          g.connect(this.sfxGain);
          osc.start(at);
          osc.stop(at + 0.30);
          this.activeNodes.push(osc);
          break;
        }
        case "basket_thump": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(165, at);
          osc.frequency.exponentialRampToValueAtTime(52, at + 0.16);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.45, at);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
          osc.connect(g);
          g.connect(this.sfxGain);
          osc.start(at);
          osc.stop(at + 0.20);
          noiseBurst(at, 0.12, 500, 260, 1.2, 0.25);
          this.activeNodes.push(osc);
          break;
        }
        case "blade_shing": {
          // Metallic resonant SHING!
          [2280, 3410, 4890, 6120].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq * 0.94, at);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.04, at + 0.12);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, at);
            g.gain.linearRampToValueAtTime(0.22 / (idx + 1), at + 0.018);
            g.gain.exponentialRampToValueAtTime(0.0001, at + 0.58 - idx * 0.08);
            osc.connect(g);
            g.connect(this.sfxGain);
            g.connect(this.reverbSend);
            osc.start(at);
            osc.stop(at + 0.65);
            this.activeNodes.push(osc);
          });
          noiseBurst(at, 0.22, 3200, 7200, 4.0, 0.28);
          break;
        }
        case "pig_squeal": {
          // Hilarious whimsical cartoon pig squeal-oink!
          const osc = ctx.createOscillator();
          const mod = ctx.createOscillator();
          const modG = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(360, at);
          osc.frequency.exponentialRampToValueAtTime(780, at + 0.13);
          osc.frequency.exponentialRampToValueAtTime(520, at + 0.24);
          osc.frequency.exponentialRampToValueAtTime(840, at + 0.34);
          mod.frequency.setValueAtTime(34, at);
          modG.gain.setValueAtTime(55, at);
          mod.connect(modG);
          modG.connect(osc.frequency);

          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.setValueAtTime(1150, at);
          bp.Q.value = 3.2;

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.linearRampToValueAtTime(0.32, at + 0.03);
          g.gain.setValueAtTime(0.28, at + 0.28);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);

          osc.connect(bp);
          bp.connect(g);
          g.connect(this.sfxGain);
          osc.start(at);
          mod.start(at);
          osc.stop(at + 0.45);
          mod.stop(at + 0.45);
          this.activeNodes.push(osc, mod);
          break;
        }
        case "wisdom_chime":
          this._playChime(at, N.D5, 1.8, 0.30, 0);
          this._playChime(at + 0.18, N.A5, 1.5, 0.20, 0.15);
          break;
        case "angel_harp":
          [N.A4, N.B4, N.D5, N.Fs5, N.A5, N.D6].forEach((f, i) => {
            this._playPluck(at + i * 0.075, f, 1.2, 0.24, -0.25 + i * 0.1);
          });
          break;
        case "lantern_bell":
          this._playChime(at, N.Fs5, 2.2, 0.24, -0.15);
          this._playChime(at + 0.16, N.D6, 2.4, 0.20, 0.15);
          break;
      }
    }

    _stopAllActive() {
      for (const node of this.activeNodes) {
        try { node.stop(); } catch (_) {}
        try { node.disconnect(); } catch (_) {}
      }
      this.activeNodes = [];
    }

    _scheduleFrom(filmOffset) {
      this._stopAllActive();
      const ctx = this.ctx;
      const now = ctx.currentTime + 0.03; // tiny lookahead for glitch-free start
      this.playStartCtxTime = now;
      this.playStartFilmTime = filmOffset;

      // Schedule automatic music ducking envelope around every voice clip
      const mg = this.musicGain.gain;
      mg.cancelScheduledValues(now);
      mg.setValueAtTime(0.32, now);
      for (const clip of this.media.clips) {
        const s = clip.cueStart;
        const e = clip.spokenEnd;
        if (e <= filmOffset) continue;
        const duckStart = now + Math.max(0, s - filmOffset - 0.15);
        const duckEnd = now + Math.max(0.05, e - filmOffset + 0.20);
        if (s <= filmOffset && filmOffset < e) {
          mg.setValueAtTime(0.17, now);
        } else {
          mg.setValueAtTime(0.32, Math.max(now, duckStart - 0.01));
          mg.linearRampToValueAtTime(0.17, duckStart + 0.15);
        }
        mg.setValueAtTime(0.17, Math.max(now, duckEnd - 0.15));
        mg.linearRampToValueAtTime(0.32, duckEnd + 0.18);
      }

      // Schedule all neural TTS dialogue clips
      for (const clip of this.media.clips) {
        const entry = this.decodedClips.get(clip.id);
        if (!entry) continue;
        const clipEnd = clip.cueStart + entry.buffer.duration;
        if (clipEnd <= filmOffset) continue;

        const src = ctx.createBufferSource();
        src.buffer = entry.buffer;
        src.connect(this.voiceGain);

        if (clip.cueStart >= filmOffset) {
          src.start(now + (clip.cueStart - filmOffset));
        } else {
          const skip = filmOffset - clip.cueStart;
          src.start(now, skip);
        }
        this.activeNodes.push(src);
      }

      // Schedule procedural score notes
      for (const ev of this.musicEvents) {
        if (ev.t < filmOffset - 0.02) continue;
        const at = now + Math.max(0, ev.t - filmOffset);
        if (ev.inst === "pluck") this._playPluck(at, ev.freq, ev.dur, ev.vol, ev.pan);
        else if (ev.inst === "marimba") this._playMarimba(at, ev.freq, ev.dur, ev.vol, ev.pan);
        else if (ev.inst === "bass") this._playBass(at, ev.freq, ev.dur, ev.vol, ev.pan);
        else if (ev.inst === "wood") this._playWood(at, ev.freq, ev.dur, ev.vol, ev.pan);
        else if (ev.inst === "flute") this._playFlute(at, ev.freq, ev.dur, ev.vol);
        else if (ev.inst === "chime") this._playChime(at, ev.freq, ev.dur, ev.vol, ev.pan);
      }

      // Schedule foley SFX
      for (const sfx of this.sfxEvents) {
        if (sfx.t < filmOffset - 0.02) continue;
        const at = now + Math.max(0, sfx.t - filmOffset);
        this._playSfx(at, sfx);
      }
    }

    async play(fromTime) {
      if (!this.isReady) await this.init();
      if (this.ctx.state === "suspended") await this.ctx.resume();
      const target = typeof fromTime === "number" ? fromTime : this.pausedFilmTime;
      const clamped = Math.max(0, Math.min(this.duration, target >= this.duration - 0.05 ? 0 : target));
      this._scheduleFrom(clamped);
      this.isPlaying = true;
    }

    pause() {
      if (!this.isPlaying) return;
      this.pausedFilmTime = this.getCurrentTime();
      this._stopAllActive();
      this.isPlaying = false;
    }

    seek(timeSec) {
      const clamped = Math.max(0, Math.min(this.duration, timeSec));
      this.pausedFilmTime = clamped;
      if (this.isPlaying) {
        this._scheduleFrom(clamped);
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
      }
    }

    getCurrentTime() {
      if (!this.isPlaying || !this.ctx) return this.pausedFilmTime;
      const elapsed = Math.max(0, this.ctx.currentTime - this.playStartCtxTime);
      const t = this.playStartFilmTime + elapsed;
      if (t >= this.duration) {
        this.pausedFilmTime = this.duration;
        this._stopAllActive();
        this.isPlaying = false;
        return this.duration;
      }
      return t;
    }

    // Returns live speech state (active clip, speaking character, real PCM amplitude 0..1, active word index)
    getSpeechState(t) {
      for (const clip of this.media.clips) {
        if (t >= clip.cueStart && t <= clip.spokenEnd + 0.18) {
          const localT = t - clip.cueStart;
          let energy = 0;
          const entry = this.decodedClips.get(clip.id);
          if (entry) {
            const idx = Math.floor(localT * 60);
            if (idx >= 0 && idx < entry.envelope.length) energy = entry.envelope[idx];
          } else {
            // Fallback smooth pulse before audio is decoded
            energy = 0.4 + 0.35 * Math.sin(localT * 18);
          }
          let activeWordIdx = -1;
          for (let i = 0; i < clip.words.length; i++) {
            const w = clip.words[i];
            if (localT >= w.start - 0.02) activeWordIdx = i;
          }
          return { clip, speaker: clip.speaker, energy, localT, activeWordIdx };
        }
      }
      return { clip: null, speaker: null, energy: 0, localT: 0, activeWordIdx: -1 };
    }
  }

  window.CollageAudioEngine = CollageAudioEngine;
})();
