// Pure Vanilla JavaScript Application Controller
// Loads bundled hand-painted cutouts, wires the Web Audio engine & 60fps Canvas loop,
// and manages the tactile paper-theater player UI.

(function () {
  "use strict";

  const media = window.ZENGZI_MEDIA;
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");

  const startOverlay = document.getElementById("startOverlay");
  const startBtn = document.getElementById("startBtn");
  const endOverlay = document.getElementById("endOverlay");
  const replayOverlayBtn = document.getElementById("replayOverlayBtn");
  const controlsBar = document.getElementById("controlsBar");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const restartBtn = document.getElementById("restartBtn");
  const muteBtn = document.getElementById("muteBtn");
  const ccBtn = document.getElementById("ccBtn");
  const fsBtn = document.getElementById("fsBtn");
  const scrubber = document.getElementById("scrubber");
  const progressFill = document.getElementById("progressFill");
  const playhead = document.getElementById("playhead");
  const timeDisplay = document.getElementById("timeDisplay");
  const actLabel = document.getElementById("actLabel");
  const theater = document.getElementById("theater");

  const ACTS = [
    { t: 0.0,  label: "I. The Quiet Village" },
    { t: 7.5,  label: "II. Off to Market" },
    { t: 16.0, label: "III. The Casual Promise" },
    { t: 25.2, label: "IV. The Startled Pig" },
    { t: 36.7, label: "V. Zengzi's Wisdom" },
    { t: 46.2, label: "VI. A Promise Kept" }
  ];

  const audio = new window.CollageAudioEngine(media);
  let director = null;
  let images = {};
  let showSubtitles = true;
  let currentTime = 1.6; // Poster frame preview before clicking play
  let hasStarted = false;
  let isDragging = false;
  let rafId = null;
  let hideTimer = null;

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function getActLabel(t) {
    let cur = ACTS[0].label;
    for (const a of ACTS) {
      if (t >= a.t) cur = a.label;
    }
    return cur;
  }

  function loadAllImages() {
    const entries = Object.entries(media.images);
    return Promise.all(
      entries.map(([key, info]) => new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => { images[key] = im; resolve(); };
        im.onerror = reject;
        im.src = info.dataUri;
      }))
    );
  }

  function updateUI(t) {
    const pct = Math.max(0, Math.min(100, (t / media.filmDuration) * 100));
    progressFill.style.width = `${pct}%`;
    playhead.style.left = `${pct}%`;
    timeDisplay.textContent = `${fmtTime(t)} / ${fmtTime(media.filmDuration)}`;
    actLabel.textContent = getActLabel(t);
    playPauseBtn.textContent = audio.isPlaying ? "❚❚" : "▶";
    playPauseBtn.setAttribute("aria-label", audio.isPlaying ? "Pause" : "Play");
  }

  function renderFrame(t) {
    if (!director) return;
    const speech = audio.getSpeechState(t);
    director.render(t, speech, showSubtitles);
    updateUI(t);
  }

  function tick() {
    if (audio.isPlaying && !isDragging) {
      currentTime = audio.getCurrentTime();
      if (!audio.isPlaying && currentTime >= media.filmDuration - 0.02) {
        // Reached end of film cleanly
        currentTime = media.filmDuration;
        renderFrame(currentTime);
        endOverlay.classList.add("visible");
        controlsBar.classList.remove("hidden");
        return;
      }
    }
    renderFrame(currentTime);
    if (audio.isPlaying) {
      rafId = requestAnimationFrame(tick);
    }
  }

  async function startPlayback(fromTime) {
    hasStarted = true;
    startOverlay.classList.add("hidden");
    endOverlay.classList.remove("visible");
    if (typeof fromTime === "number") currentTime = fromTime;
    await audio.play(currentTime);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
    scheduleHideControls();
  }

  function togglePlayPause() {
    if (!hasStarted) {
      startPlayback(0);
      return;
    }
    if (audio.isPlaying) {
      audio.pause();
      currentTime = audio.getCurrentTime();
      cancelAnimationFrame(rafId);
      renderFrame(currentTime);
      controlsBar.classList.remove("hidden");
      clearTimeout(hideTimer);
    } else {
      const startAt = currentTime >= media.filmDuration - 0.1 ? 0 : currentTime;
      startPlayback(startAt);
    }
  }

  function seekToClientX(clientX) {
    const rect = scrubber.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    currentTime = ratio * media.filmDuration;
    endOverlay.classList.remove("visible");
    audio.seek(currentTime);
    renderFrame(currentTime);
  }

  function scheduleHideControls() {
    clearTimeout(hideTimer);
    controlsBar.classList.remove("hidden");
    if (audio.isPlaying) {
      hideTimer = setTimeout(() => {
        if (audio.isPlaying && !isDragging) controlsBar.classList.add("hidden");
      }, 2600);
    }
  }

  function populateChapterTicks() {
    for (let i = 1; i < ACTS.length; i++) {
      const tickEl = document.createElement("span");
      tickEl.className = "chapter-tick";
      tickEl.style.left = `${(ACTS[i].t / media.filmDuration) * 100}%`;
      tickEl.title = ACTS[i].label;
      scrubber.appendChild(tickEl);
    }
  }

  // --- Wire UI Events ---
  startBtn.addEventListener("click", () => startPlayback(0));
  replayOverlayBtn.addEventListener("click", () => startPlayback(0));
  playPauseBtn.addEventListener("click", togglePlayPause);
  restartBtn.addEventListener("click", () => startPlayback(0));

  canvas.addEventListener("click", () => {
    if (hasStarted) togglePlayPause();
  });

  muteBtn.addEventListener("click", () => {
    const next = !audio.isMuted;
    audio.setMuted(next);
    muteBtn.textContent = next ? "🔇" : "🔊";
    muteBtn.classList.toggle("dimmed", next);
  });

  ccBtn.addEventListener("click", () => {
    showSubtitles = !showSubtitles;
    ccBtn.classList.toggle("active", showSubtitles);
    renderFrame(currentTime);
  });

  fsBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      theater.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  scrubber.addEventListener("pointerdown", (e) => {
    isDragging = true;
    scrubber.setPointerCapture(e.pointerId);
    seekToClientX(e.clientX);
  });
  scrubber.addEventListener("pointermove", (e) => {
    if (isDragging) seekToClientX(e.clientX);
  });
  scrubber.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    scrubber.releasePointerCapture(e.pointerId);
  });

  theater.addEventListener("mousemove", scheduleHideControls);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); togglePlayPause(); }
    else if (e.key === "r" || e.key === "R") { startPlayback(0); }
    else if (e.key === "m" || e.key === "M") { muteBtn.click(); }
    else if (e.key === "c" || e.key === "C") { ccBtn.click(); }
    else if (e.key === "f" || e.key === "F") { fsBtn.click(); }
    else if (e.code === "ArrowRight") {
      currentTime = Math.min(media.filmDuration, currentTime + 3);
      audio.seek(currentTime);
      renderFrame(currentTime);
    } else if (e.code === "ArrowLeft") {
      currentTime = Math.max(0, currentTime - 3);
      audio.seek(currentTime);
      renderFrame(currentTime);
    }
  });

  // Expose clean inspection API
  window.ZENGZI_PLAYER = {
    seekAndDraw(t) {
      hasStarted = true;
      startOverlay.classList.add("hidden");
      endOverlay.classList.remove("visible");
      audio.pause();
      currentTime = Math.max(0, Math.min(media.filmDuration, t));
      renderFrame(currentTime);
    },
    play: () => startPlayback(0),
    pause: () => { if (audio.isPlaying) togglePlayPause(); },
    getDuration: () => media.filmDuration
  };

  // Boot sequence
  loadAllImages().then(() => {
    director = new window.ZengziDirector(ctx, images);
    populateChapterTicks();
    renderFrame(1.55); // Crisp sunlit poster frame behind Start Medallion
    startBtn.disabled = false;
    startBtn.querySelector(".btn-label").textContent = "Watch Film (0:55)";
  }).catch((err) => {
    console.error("Failed to load collage cutouts:", err);
  });
})();
