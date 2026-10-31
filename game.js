// Els Panets - variante de MR Taco President: el presidente come empanadillas venezolanas
(function () {
  "use strict";

  // ---------- Canvas / escalado responsive ----------
  const LW = 400, LH = 700; // resolución lógica (portrait, como el original)
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.min(vw / LW, vh / LH);
    const cssW = LW * scale, cssH = LH * scale;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(LW * dpr);
    canvas.height = Math.round(LH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  window.addEventListener("load", resize);
  resize();
  // red de seguridad: algunos navegadores reportan innerWidth/Height
  // como 0 en el primer tick antes de completar el layout inicial.
  setTimeout(resize, 0);
  setTimeout(resize, 300);

  // ---------- Audio sintetizado (sin archivos externos) ----------
  let actx = null;
  function audio() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    return actx;
  }
  function beep(freq, dur, type, vol, glide) {
    try {
      const ac = audio();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(freq + glide, 20), ac.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.2, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch (e) {}
  }
  function sndFlap() { beep(420, 0.09, "square", 0.15, 260); }
  function sndTaco() { beep(880, 0.12, "triangle", 0.2, 400); setTimeout(() => beep(1200, 0.08, "triangle", 0.15, 200), 60); }
  function sndPoint() { beep(1000, 0.1, "sine", 0.15, 300); }
  function sndHit() { beep(120, 0.35, "sawtooth", 0.25, -60); }

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }

  // ---------- Música de fondo sintetizada (loop tipo chiptune, sin archivos) ----------
  const MUSIC_KEY = "tacoSuitFlapMusic";
  let musicEnabled = localStorage.getItem(MUSIC_KEY) !== "0";
  let musicStarted = false;
  let musicGainNode = null;
  let musicTimer = null;
  let nextStepTime = 0;
  let stepIndex = 0;
  const STEP_DUR = 60 / 132 / 2; // corcheas a 132bpm
  const LOOKAHEAD = 0.12;
  const BASS_PATTERN = [110, null, 110, null, 146.83, null, 130.81, null, 110, null, 110, null, 164.81, null, 146.83, null];
  const LEAD_PATTERN = [null, 440, null, 523.25, null, 440, null, 392, null, 493.88, null, 440, null, 392, null, 349.23];

  function ensureMusicGain() {
    const ac = audio();
    if (!musicGainNode) {
      musicGainNode = ac.createGain();
      musicGainNode.gain.value = musicEnabled ? 0.16 : 0;
      musicGainNode.connect(ac.destination);
    }
    return musicGainNode;
  }

  function scheduleNote(time, freq, dur, type, vol) {
    if (!freq) return;
    const ac = audio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain).connect(musicGainNode);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  function musicScheduler() {
    const ac = audio();
    while (nextStepTime < ac.currentTime + LOOKAHEAD) {
      scheduleNote(nextStepTime, BASS_PATTERN[stepIndex % BASS_PATTERN.length], STEP_DUR * 0.85, "triangle", 0.5);
      scheduleNote(nextStepTime, LEAD_PATTERN[stepIndex % LEAD_PATTERN.length], STEP_DUR * 0.55, "square", 0.22);
      stepIndex++;
      nextStepTime += STEP_DUR;
    }
  }

  function startMusicIfNeeded() {
    if (musicStarted) return;
    musicStarted = true;
    ensureMusicGain();
    nextStepTime = audio().currentTime + 0.1;
    stepIndex = 0;
    musicTimer = setInterval(musicScheduler, 50);
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    localStorage.setItem(MUSIC_KEY, musicEnabled ? "1" : "0");
    if (musicGainNode) {
      musicGainNode.gain.setTargetAtTime(musicEnabled ? 0.16 : 0, audio().currentTime, 0.05);
    }
  }

  // ---------- Estado del juego ----------
  const STATE = { START: 0, PLAY: 1, OVER: 2, NAME_ENTRY: 3 };
  let state = STATE.START;

  const GRAVITY = 1500;      // px/s^2
  const FLAP_V = -420;       // px/s impulso al saltar
  const PIPE_W = 62;
  const GROUND_H = 90;
  let PIPE_GAP = 175;
  let PIPE_SPEED = 150;      // fijo según el nivel elegido

  const BEST_KEY = "tacoSuitFlapBest";
  const NAME_KEY = "tacoSuitFlapPlayerName";
  const HOLDER_KEY = "tacoSuitFlapRecordHolder";
  const DIFF_KEY = "tacoSuitFlapDifficulty";
  const SKIN_KEY = "tacoSuitFlapSkin";

  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let recordHolder = localStorage.getItem(HOLDER_KEY) || null;

  // ---------- Dificultad: en Els Panets siempre es la normal ----------
  const DIFFICULTIES = [
    { key: "normal", label: "JUGAR", speed: 155, gap: 175 },
  ];
  let difficulty = DIFFICULTIES[0];

  // Un solo botón, centrado, para empezar la partida
  const DIFF_BUTTONS = [{ diff: difficulty, x: 130, y: 222, w: 140, h: 42 }];

  function selectDifficulty(d) {
    difficulty = d;
    localStorage.setItem(DIFF_KEY, d.key);
  }

  // Caricatura del personaje: piel bronceada y pelo rubio, fijos para
  // cualquier traje que lleve puesto.
  const SKIN_TONE = "#e0995a";
  const HAIR_COLOR = "#f2c14e";

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    return "#" + c(r) + c(g) + c(b);
  }
  function lighten(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  }
  function darken(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
  }

  // ---------- Atuendos desbloqueables (mismo personaje, distinta ropa) ----------
  const SKINS = [
    { name: "Traje azul", type: "suit", suit: "#22335c", lapel: "#1b2a4a", tie: "#c0392b", unlockScore: 0 },
    { name: "Golf", type: "golf", suit: "#f5f5f5", lapel: "#c0392b", cap: "#c0392b", unlockScore: 10 },
    { name: "Esmoquin", type: "tuxedo", suit: "#14161b", lapel: "#2a2d33", tie: "#14161b", unlockScore: 25 },
    { name: "Traje blanco", type: "suit", suit: "#f2f0e6", lapel: "#d9d6c8", tie: "#c0392b", unlockScore: 50 },
  ];
  let skinIndex = Number(localStorage.getItem(SKIN_KEY) || 0);

  const SKIN_SWATCHES = SKINS.map((s, i) => ({
    index: i,
    x: LW / 2 - ((SKINS.length - 1) * 55) / 2 + i * 55,
    y: 335,
    r: 16,
  }));

  function isSkinUnlocked(i) {
    return best >= SKINS[i].unlockScore;
  }

  function currentSkin() {
    return isSkinUnlocked(skinIndex) ? SKINS[skinIndex] : SKINS[0];
  }

  function selectSkin(i) {
    if (isSkinUnlocked(i)) {
      skinIndex = i;
      localStorage.setItem(SKIN_KEY, String(i));
    }
  }

  // ---------- Paletas día / atardecer / noche (varían con la puntuación) ----------
  const PALETTES = [
    { sky1: [126, 214, 223], sky2: [78, 192, 202], cloud: [255, 255, 255], ground: [222, 209, 122] },
    { sky1: [255, 183, 94], sky2: [214, 101, 90], cloud: [255, 235, 205], ground: [196, 140, 88] },
    { sky1: [20, 26, 64], sky2: [10, 14, 38], cloud: [130, 138, 170], ground: [70, 64, 90] },
  ];
  function lerpColor(a, b, f) {
    return a.map((v, i) => Math.round(v + (b[i] - v) * f));
  }
  function currentPalette(scoreForPalette) {
    const cycle = 45, segLen = 15;
    const t = ((scoreForPalette % cycle) + cycle) % cycle;
    const idx = Math.floor(t / segLen);
    const f = (t % segLen) / segLen;
    const a = PALETTES[idx];
    const b = PALETTES[(idx + 1) % PALETTES.length];
    return {
      sky1: lerpColor(a.sky1, b.sky1, f),
      sky2: lerpColor(a.sky2, b.sky2, f),
      cloud: lerpColor(a.cloud, b.cloud, f),
      ground: lerpColor(a.ground, b.ground, f),
    };
  }

  const MUTE_BTN = { x: 30, y: 30, r: 18 };

  function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
  function pointInCircle(px, py, cx, cy, r) {
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy <= r * r;
  }
  function getEventPoint(e) {
    let cx, cy;
    if (e.changedTouches && e.changedTouches.length) {
      cx = e.changedTouches[0].clientX;
      cy = e.changedTouches[0].clientY;
    } else if (typeof e.clientX === "number") {
      cx = e.clientX;
      cy = e.clientY;
    } else {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return { x: (cx - rect.left) * (LW / rect.width), y: (cy - rect.top) * (LH / rect.height) };
  }

  // ---------- Overlay HTML para pedir el nombre (solo la primera vez) ----------
  const nameOverlay = document.getElementById("nameOverlay");
  const nameInput = document.getElementById("nameInput");
  const nameSubmit = document.getElementById("nameSubmit");

  function showNameOverlay() {
    nameOverlay.classList.remove("hidden");
    nameInput.value = "";
    setTimeout(() => nameInput.focus(), 50);
  }

  function hideNameOverlay() {
    nameOverlay.classList.add("hidden");
  }

  // Guarda el nombre del recordista y publica la puntuación en el ranking
  // global (si el módulo de Firebase cargó correctamente).
  function publishRecord(name) {
    recordHolder = name;
    localStorage.setItem(HOLDER_KEY, name);
    if (window.TacoLeaderboard) {
      window.TacoLeaderboard.submitScore(name, score, tacosEaten);
    }
  }

  function submitName() {
    const name = nameInput.value.trim().slice(0, 12) || "Jugador";
    localStorage.setItem(NAME_KEY, name);
    publishRecord(name);
    hideNameOverlay();
    state = STATE.OVER;
  }

  nameSubmit.addEventListener("click", submitName);
  nameInput.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") submitName();
  });

  // ---------- Overlay HTML del ranking global ----------
  const leaderboardOverlay = document.getElementById("leaderboardOverlay");
  const leaderboardList = document.getElementById("leaderboardList");
  const leaderboardClose = document.getElementById("leaderboardClose");
  const LEADERBOARD_BTN = { x: LW - 30, y: 30, r: 18 };

  function showLeaderboardOverlay() {
    leaderboardOverlay.classList.remove("hidden");
    leaderboardList.innerHTML = '<li class="lbEmpty">Cargando…</li>';
    if (!window.TacoLeaderboard) {
      leaderboardList.innerHTML = '<li class="lbEmpty">Sin conexión al ranking</li>';
      return;
    }
    window.TacoLeaderboard.fetchTop(10)
      .then((rows) => {
        if (!rows || rows.length === 0) {
          leaderboardList.innerHTML = '<li class="lbEmpty">Aún no hay puntuaciones</li>';
          return;
        }
        leaderboardList.innerHTML = rows
          .map((r, i) => {
            const name = String(r.name || "Jugador").replace(/[<>&]/g, "");
            return `<li><span class="lbRank">#${i + 1}</span><span class="lbName">${name}</span><span class="lbScore">${r.score}</span></li>`;
          })
          .join("");
      })
      .catch(() => {
        leaderboardList.innerHTML = '<li class="lbEmpty">No se pudo cargar el ranking</li>';
      });
  }

  function hideLeaderboardOverlay() {
    leaderboardOverlay.classList.add("hidden");
  }

  leaderboardClose.addEventListener("click", hideLeaderboardOverlay);

  const player = {
    x: 100, y: LH / 2, r: 16,
    vy: 0, rot: 0, flapPhase: 0,
  };

  let pipes = [];      // {x, gapY, passed, hasTaco, tacoEaten}
  let particles = [];  // partículas al comer taco / chocar
  let groundX = 0;
  let score = 0;
  let tacosEaten = 0;
  let spawnTimer = 0;
  let elapsed = 0;
  let lastTime = 0;

  function reset() {
    player.y = LH / 2;
    player.vy = 0;
    player.rot = 0;
    pipes = [];
    particles = [];
    groundX = 0;
    score = 0;
    tacosEaten = 0;
    spawnTimer = 0;
    elapsed = 0;
    PIPE_SPEED = difficulty.speed;
    PIPE_GAP = difficulty.gap;
  }

  function startGame() {
    state = STATE.PLAY;
    reset();
    player.vy = FLAP_V;
    sndFlap();
  }

  function flap() {
    if (state === STATE.PLAY) {
      player.vy = FLAP_V;
      sndFlap();
    } else if (state === STATE.OVER) {
      state = STATE.START;
    }
  }

  // ---------- Input ----------
  function onPress(e) {
    if (state === STATE.NAME_ENTRY) return; // lo maneja el overlay HTML
    if (e) e.preventDefault();
    startMusicIfNeeded();

    const pt = e ? getEventPoint(e) : null;

    if (pt && pointInCircle(pt.x, pt.y, MUTE_BTN.x, MUTE_BTN.y, MUTE_BTN.r)) {
      toggleMusic();
      return;
    }

    if (state !== STATE.PLAY && pt && pointInCircle(pt.x, pt.y, LEADERBOARD_BTN.x, LEADERBOARD_BTN.y, LEADERBOARD_BTN.r)) {
      showLeaderboardOverlay();
      return;
    }

    if (state === STATE.START && pt) {
      for (const b of DIFF_BUTTONS) {
        if (pointInRect(pt.x, pt.y, b.x, b.y, b.w, b.h)) {
          selectDifficulty(b.diff);
          startGame();
          return;
        }
      }
      for (const s of SKIN_SWATCHES) {
        if (pointInCircle(pt.x, pt.y, s.x, s.y, s.r)) {
          selectSkin(s.index);
          return;
        }
      }
      return; // toque fuera de los botones: no hace nada en la pantalla de inicio
    }

    flap();
  }
  canvas.addEventListener("touchstart", onPress, { passive: false });
  canvas.addEventListener("mousedown", onPress);
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.code !== "ArrowUp") return;
    if (state === STATE.NAME_ENTRY) return;
    e.preventDefault();
    startMusicIfNeeded();
    if (state === STATE.START) startGame();
    else flap();
  });

  // ---------- Generación de tuberías ----------
  function spawnPipe() {
    const margin = 60;
    const gapY = margin + Math.random() * (LH - GROUND_H - margin * 2 - PIPE_GAP);
    pipes.push({
      x: LW + PIPE_W,
      gapY: gapY,
      passed: false,
      hasTaco: Math.random() < 0.85,
      tacoEaten: false,
      tacoBob: Math.random() * Math.PI * 2,
    });
  }

  // ---------- Update ----------
  function update(dt) {
    elapsed += dt;
    groundX -= PIPE_SPEED * dt;
    if (groundX <= -48) groundX += 48;

    if (state !== STATE.PLAY) {
      // animación idle en pantalla de inicio / game over
      player.flapPhase += dt * 6;
      if (state === STATE.START) {
        player.y = 95 + Math.sin(elapsed * 2.2) * 12;
      }
      return;
    }

    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    player.rot = Math.max(-0.5, Math.min(1.1, player.vy / 500));
    player.flapPhase += dt * (player.vy < 0 ? 14 : 6);

    // techo
    if (player.y - player.r < 0) {
      player.y = player.r;
      player.vy = 0;
    }

    // suelo -> game over
    if (player.y + player.r > LH - GROUND_H) {
      player.y = LH - GROUND_H - player.r;
      crash();
      return;
    }

    // tuberías
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnPipe();
      spawnTimer = 1.6;
    }

    for (const p of pipes) {
      p.x -= PIPE_SPEED * dt;
      p.tacoBob += dt * 3;

      // colisión con tubería
      const withinX = player.x + player.r > p.x && player.x - player.r < p.x + PIPE_W;
      if (withinX) {
        const topH = p.gapY;
        const botY = p.gapY + PIPE_GAP;
        if (player.y - player.r < topH || player.y + player.r > botY) {
          crash();
          return;
        }
      }

      // puntuación al pasar
      if (!p.passed && p.x + PIPE_W < player.x - player.r) {
        p.passed = true;
        score++;
        sndPoint();
      }

      // taco: colisión circular
      if (p.hasTaco && !p.tacoEaten) {
        const tx = p.x + PIPE_W / 2;
        const ty = p.gapY + PIPE_GAP / 2;
        const dx = player.x - tx, dy = player.y - ty;
        if (Math.sqrt(dx * dx + dy * dy) < player.r + 14) {
          p.tacoEaten = true;
          tacosEaten++;
          score += 3;
          sndTaco();
          vibrate(15);
          spawnParticles(tx, ty, "#ffb347", 14);
        }
      }
    }
    pipes = pipes.filter((p) => p.x > -PIPE_W - 10);

    // partículas
    for (const pt of particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 600 * dt;
      pt.life -= dt;
    }
    particles = particles.filter((pt) => pt.life > 0);
  }

  function spawnParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
        life: 0.5 + Math.random() * 0.4, color, r: 2 + Math.random() * 3,
      });
    }
  }

  function crash() {
    if (state !== STATE.PLAY) return;
    sndHit();
    vibrate([40, 30, 60]);
    spawnParticles(player.x, player.y, "#e63946", 20);

    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));

      const storedName = localStorage.getItem(NAME_KEY);
      if (!storedName) {
        // primer récord de siempre: pedir el nombre una única vez
        state = STATE.NAME_ENTRY;
        showNameOverlay();
        return;
      }
      publishRecord(storedName);
    }
    state = STATE.OVER;
  }

  // ---------- Dibujo ----------
  function drawBackground(palette) {
    const g = ctx.createLinearGradient(0, 0, 0, LH);
    g.addColorStop(0, `rgb(${palette.sky1.join(",")})`);
    g.addColorStop(1, `rgb(${palette.sky2.join(",")})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LW, LH);

    // nubes
    ctx.fillStyle = `rgba(${palette.cloud.join(",")},0.85)`;
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 140 + (elapsed * 15) % 560) % (LW + 160)) - 80;
      const cy = 70 + i * 90;
      cloud(cx, cy);
    }

    // silueta food-truck lejana
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    roundRect(30, LH - GROUND_H - 70, 90, 50, 6);
    ctx.fill();
  }

  function cloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 8, 22, 0, Math.PI * 2);
    ctx.arc(x + 42, y, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPipe(p) {
    const topH = p.gapY;
    const botY = p.gapY + PIPE_GAP;
    const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
    grad.addColorStop(0, "#3fae4a");
    grad.addColorStop(0.5, "#6fe07d");
    grad.addColorStop(1, "#2f8c3a");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#245f2b";
    ctx.lineWidth = 3;

    // tubo superior
    ctx.fillRect(p.x, 0, PIPE_W, topH);
    ctx.strokeRect(p.x, 0, PIPE_W, topH);
    ctx.fillRect(p.x - 5, topH - 22, PIPE_W + 10, 22);
    ctx.strokeRect(p.x - 5, topH - 22, PIPE_W + 10, 22);

    // tubo inferior
    ctx.fillRect(p.x, botY, PIPE_W, LH - GROUND_H - botY);
    ctx.strokeRect(p.x, botY, PIPE_W, LH - GROUND_H - botY);
    ctx.fillRect(p.x - 5, botY, PIPE_W + 10, 22);
    ctx.strokeRect(p.x - 5, botY, PIPE_W + 10, 22);

    if (p.hasTaco && !p.tacoEaten) {
      drawTaco(p.x + PIPE_W / 2, p.gapY + PIPE_GAP / 2 + Math.sin(p.tacoBob) * 6, p.tacoBob);
    }
  }

  // Empanadilla venezolana: media luna de masa de maíz frita, dorada, con el
  // borde pellizcado y las burbujitas típicas de la fritura.
  function drawTaco(x, y, rot, size) {
    const k = (size || 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(rot * 0.5) * 0.15);
    ctx.scale(k, k);
    const R = 19, cy = 6;
    // sombra suave
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(1, cy + 4, R, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // cuerpo en media luna, con la base algo abombada
    const body = new Path2D();
    body.arc(0, cy, R, Math.PI, 0);
    body.quadraticCurveTo(0, cy + 6, -R, cy);
    body.closePath();
    const g = ctx.createLinearGradient(0, cy - R, 0, cy + 5);
    g.addColorStop(0, "#f7c25a");
    g.addColorStop(0.55, "#eb9a2e");
    g.addColorStop(1, "#c96d16");
    ctx.fillStyle = g;
    ctx.fill(body);
    ctx.strokeStyle = "#9c4f0c";
    ctx.lineWidth = 1.6;
    ctx.stroke(body);
    // relleno que asoma por la barriga (bulto)
    ctx.fillStyle = "rgba(255,230,160,0.35)";
    ctx.beginPath();
    ctx.ellipse(-2, cy - 7, 9, 5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // borde pellizcado (repulgue) a lo largo de la curva
    ctx.strokeStyle = "#b8600f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, cy, R - 4, Math.PI + 0.08, -0.08);
    ctx.stroke();
    ctx.strokeStyle = "#8a440a";
    ctx.lineWidth = 1.3;
    for (let i = 0; i <= 10; i++) {
      const t = Math.PI + (Math.PI * i) / 10;
      const c = Math.cos(t), sn = Math.sin(t);
      ctx.beginPath();
      ctx.moveTo(c * (R - 4), cy + sn * (R - 4));
      ctx.lineTo(c * (R - 0.5), cy + sn * (R - 0.5));
      ctx.stroke();
    }
    // burbujitas de la fritura
    const dots = [[-8, -3, 1.6], [-3, -9, 1.2], [4, -5, 1.5], [9, -1, 1.1], [-11, 3, 1.1], [2, 1, 1.3], [7, -10, 1]];
    for (const [dx, dy, r] of dots) {
      ctx.fillStyle = "rgba(150,70,10,0.55)";
      ctx.beginPath(); ctx.arc(dx, cy + dy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,240,190,0.7)";
      ctx.beginPath(); ctx.arc(dx - 0.5, cy + dy - 0.6, r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    // brillo de aceite
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, cy, R - 7, Math.PI + 0.55, Math.PI + 1.15);
    ctx.stroke();
    ctx.restore();
  }

  // Texto con una empanadilla pequeña delante (en lugar del emoji del taco)
  function textWithEmpanada(txt, cx, y, stroke) {
    const w = ctx.measureText(txt).width, icon = 26;
    const x0 = cx - (w + icon) / 2;
    const align = ctx.textAlign;
    drawTaco(x0 + 11, y - 9, 0, 0.6);
    ctx.textAlign = "left";
    if (stroke) ctx.strokeText(txt, x0 + icon, y);
    ctx.fillText(txt, x0 + icon, y);
    ctx.textAlign = align;
  }

  function drawGround(palette) {
    const g = palette.ground;
    const dark = g.map((v) => Math.round(v * 0.82));
    const darker = g.map((v) => Math.round(v * 0.55));
    ctx.fillStyle = `rgb(${g.join(",")})`;
    ctx.fillRect(0, LH - GROUND_H, LW, GROUND_H);
    ctx.fillStyle = `rgb(${dark.join(",")})`;
    for (let x = groundX; x < LW; x += 48) {
      ctx.fillRect(x, LH - GROUND_H, 24, 14);
    }
    ctx.fillStyle = `rgb(${darker.join(",")})`;
    ctx.fillRect(0, LH - GROUND_H, LW, 6);
  }

  // El "pájaro": un ejecutivo con traje que aletea los brazos
  function drawPlayer() {
    const skin = currentSkin();
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rot);

    const armSwing = Math.sin(player.flapPhase) * 22;

    // brazo trasero
    ctx.strokeStyle = skin.lapel;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.lineTo(-16, 2 - armSwing * 0.8);
    ctx.stroke();

    // cuerpo: camisa/chaqueta base, según el atuendo (con degradado para dar volumen)
    const suitGrad = ctx.createLinearGradient(-13, -8, 10, 16);
    suitGrad.addColorStop(0, lighten(skin.suit, 0.22));
    suitGrad.addColorStop(1, darken(skin.suit, 0.12));
    ctx.fillStyle = suitGrad;
    roundRect(-13, -8, 26, 24, 8);
    ctx.fill();

    if (skin.type === "golf") {
      // polo con cuello abierto, sin corbata
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(5, -8);
      ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.lapel;
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-1, -8);
      ctx.lineTo(-3, -2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -8);
      ctx.lineTo(1, -8);
      ctx.lineTo(3, -2);
      ctx.closePath();
      ctx.fill();
    } else if (skin.type === "tuxedo") {
      // pechera blanca + pajarita
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(5, -8);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.tie;
      ctx.beginPath();
      ctx.moveTo(0, -6.5);
      ctx.lineTo(-6, -9);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -6.5);
      ctx.lineTo(6, -9);
      ctx.lineTo(6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -6.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // solapas de satén
      ctx.fillStyle = skin.lapel;
      ctx.beginPath();
      ctx.moveTo(-13, -6);
      ctx.lineTo(-5, -8);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(13, -6);
      ctx.lineTo(5, -8);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // traje clásico: camisa + corbata larga + solapas
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(5, -8);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.tie;
      ctx.beginPath();
      ctx.moveTo(-2.5, -7);
      ctx.lineTo(2.5, -7);
      ctx.lineTo(1.8, 12);
      ctx.lineTo(0, 17);
      ctx.lineTo(-1.8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.lapel;
      ctx.beginPath();
      ctx.moveTo(-13, -6);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(13, -6);
      ctx.lineTo(4, -8);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fill();
    }

    // cuello corto (conecta la cabeza con el cuello de la camisa)
    ctx.fillStyle = darken(SKIN_TONE, 0.08);
    roundRect(-4, -10, 8, 6, 2);
    ctx.fill();

    // cabeza: cuadrada y redondeada (estilo icono/sticker), con degradado sutil
    const headGrad = ctx.createRadialGradient(-3, -19, 2, 0, -16, 15);
    headGrad.addColorStop(0, lighten(SKIN_TONE, 0.22));
    headGrad.addColorStop(0.75, SKIN_TONE);
    headGrad.addColorStop(1, darken(SKIN_TONE, 0.1));
    ctx.fillStyle = headGrad;
    roundRect(-10.5, -26.5, 21, 21, 6);
    ctx.fill();
    // sombra de mandíbula
    ctx.fillStyle = "rgba(150,90,45,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, -7.5, 7.5, 2, 0, 0, Math.PI);
    ctx.fill();

    // pelo rubio peinado hacia atrás, con mechones y brillo para dar volumen
    ctx.fillStyle = darken(HAIR_COLOR, 0.15);
    ctx.beginPath();
    ctx.ellipse(1, -23.5, 12.8, 8.8, -0.12, Math.PI * 0.9, Math.PI * 2.2);
    ctx.fill();
    ctx.fillStyle = HAIR_COLOR;
    ctx.beginPath();
    ctx.ellipse(1, -24, 12.2, 8, -0.12, Math.PI * 0.92, Math.PI * 2.16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -20);
    ctx.quadraticCurveTo(16, -23, 11, -28);
    ctx.quadraticCurveTo(6, -26, 9, -20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -19);
    ctx.quadraticCurveTo(-13, -22, -9, -25);
    ctx.quadraticCurveTo(-6, -22, -8, -19);
    ctx.fill();
    // mechones finos (textura)
    ctx.strokeStyle = lighten(HAIR_COLOR, 0.35);
    ctx.lineWidth = 0.8;
    ctx.lineCap = "round";
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, -29 + Math.abs(i) * 0.15);
      ctx.quadraticCurveTo(i + 2, -25, i + 3, -21);
      ctx.stroke();
    }
    // brillo superior del pelo
    ctx.strokeStyle = lighten(HAIR_COLOR, 0.45);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-1, -27, 7, 3, -0.2, Math.PI * 1.1, Math.PI * 1.8);
    ctx.stroke();

    if (skin.cap) {
      // gorra sobre el pelo
      ctx.fillStyle = skin.cap;
      ctx.beginPath();
      ctx.ellipse(1, -25, 11.5, 7, -0.1, Math.PI * 1.02, Math.PI * 2.05);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(10.5, -20, 6, 2.4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ceja fruncida y marcada, con sombra en el entrecejo
    ctx.fillStyle = "rgba(150,90,45,0.3)";
    ctx.beginPath();
    ctx.moveTo(1, -16.5);
    ctx.lineTo(4.5, -18.5);
    ctx.lineTo(3, -13.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(HAIR_COLOR, 0.4);
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0.5, -16.8);
    ctx.quadraticCurveTo(4, -18.8, 7.5, -16.5);
    ctx.stroke();
    ctx.lineCap = "butt";

    // ojo entrecerrado (rasgo característico): línea gruesa, casi cerrado
    ctx.strokeStyle = darken(SKIN_TONE, 0.55);
    ctx.lineCap = "round";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, -14.3);
    ctx.quadraticCurveTo(4.8, -15.6, 7.5, -14.2);
    ctx.stroke();
    ctx.lineCap = "butt";
    // sombra bajo el ojo
    ctx.fillStyle = "rgba(150,90,45,0.2)";
    ctx.beginPath();
    ctx.ellipse(4.8, -13, 3, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // nariz (línea simple)
    ctx.strokeStyle = darken(SKIN_TONE, 0.25);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(8.5, -15);
    ctx.quadraticCurveTo(9.8, -12, 8.2, -10.2);
    ctx.stroke();
    ctx.lineCap = "butt";

    // boca fruncida (gesto característico)
    ctx.fillStyle = "#b5654a";
    ctx.beginPath();
    ctx.ellipse(5, -8.3, 2.1, 1.2, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(4.6, -8.6, 0.7, 0.35, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // brazo delantero
    ctx.strokeStyle = skin.suit;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(18, 2 + armSwing);
    ctx.stroke();
    // mano
    ctx.fillStyle = SKIN_TONE;
    ctx.beginPath();
    ctx.arc(18, 2 + armSwing, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // piernas
    ctx.strokeStyle = skin.lapel;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-5, 14);
    ctx.lineTo(-7, 22);
    ctx.moveTo(5, 14);
    ctx.lineTo(8, 22);
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(-8, 23, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(9, 23, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life * 2);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawScore() {
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 4;
    ctx.font = "bold 44px 'Segoe UI', sans-serif";
    ctx.strokeText(String(score), LW / 2, 80);
    ctx.fillText(String(score), LW / 2, 80);

    ctx.font = "bold 16px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#fff3d6";
    textWithEmpanada("x " + tacosEaten, LW / 2, 108, true);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = "rgba(20,25,45,0.82)";
    roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawStart() {
    drawPlayer();
    panel(50, 140, 300, 300);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px 'Segoe UI', sans-serif";
    ctx.fillText("ELS PANETS", LW / 2, 178);
    ctx.font = "14px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#dfe6f5";
    ctx.fillText("Toca para empezar", LW / 2, 202);

    // botón de jugar
    for (const b of DIFF_BUTTONS) {
      const active = difficulty.key === b.diff.key;
      ctx.fillStyle = active ? "#4ec0ca" : "rgba(255,255,255,0.12)";
      roundRect(b.x, b.y, b.w, b.h, 10);
      ctx.fill();
      ctx.strokeStyle = active ? "#fff" : "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      roundRect(b.x, b.y, b.w, b.h, 10);
      ctx.stroke();
      ctx.fillStyle = active ? "#10233a" : "#fff";
      ctx.font = "bold 16px 'Segoe UI', sans-serif";
      ctx.fillText(b.diff.label, b.x + b.w / 2, b.y + b.h / 2 + 5);
    }

    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#dfe6f5";
    textWithEmpanada("Come empanadillas para sumar puntos", LW / 2, 288);

    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#b9c2d6";
    ctx.fillText("Traje", LW / 2, 312);

    // trajes desbloqueables
    for (const s of SKIN_SWATCHES) {
      const skin = SKINS[s.index];
      const unlocked = isSkinUnlocked(s.index);
      const active = s.index === skinIndex && unlocked;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = unlocked ? skin.suit : "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.strokeStyle = active ? "#ffd76e" : "rgba(255,255,255,0.4)";
      ctx.stroke();
      if (!unlocked) {
        ctx.font = "13px sans-serif";
        ctx.fillStyle = "#dfe6f5";
        ctx.fillText("🔒", s.x, s.y + 4);
      }
    }
    ctx.font = "11px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8b93ad";
    ctx.fillText("Desbloqueas trajes en 10, 25 y 50 puntos", LW / 2, 362);

    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#b9c2d6";
    ctx.fillText("Mejor puntuación: " + best, LW / 2, 400);
    if (recordHolder) {
      ctx.fillText("Récord de " + recordHolder, LW / 2, 420);
    }
  }

  function drawOver() {
    panel(LW / 2 - 130, 220, 260, 220);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px 'Segoe UI', sans-serif";
    ctx.fillText("¡Chocaste!", LW / 2, 270);
    ctx.font = "bold 20px 'Segoe UI', sans-serif";
    ctx.fillText("Puntos: " + score, LW / 2, 310);
    textWithEmpanada("comidas: " + tacosEaten, LW / 2, 340);
    ctx.font = "14px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffd76e";
    ctx.fillText(
      "Mejor: " + best + (recordHolder ? " (" + recordHolder + ")" : ""),
      LW / 2,
      370
    );
    ctx.fillStyle = "#dfe6f5";
    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillText("Toca para reintentar", LW / 2, 410);
  }

  function drawMuteButton() {
    ctx.beginPath();
    ctx.arc(MUTE_BTN.x, MUTE_BTN.y, MUTE_BTN.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,25,45,0.55)";
    ctx.fill();
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(musicEnabled ? "🔊" : "🔇", MUTE_BTN.x, MUTE_BTN.y + 1);
    ctx.textBaseline = "alphabetic";
  }

  function drawLeaderboardButton() {
    ctx.beginPath();
    ctx.arc(LEADERBOARD_BTN.x, LEADERBOARD_BTN.y, LEADERBOARD_BTN.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,25,45,0.55)";
    ctx.fill();
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🌍", LEADERBOARD_BTN.x, LEADERBOARD_BTN.y + 1);
    ctx.textBaseline = "alphabetic";
  }

  function render() {
    const palette = currentPalette(state === STATE.PLAY ? score : 0);
    drawBackground(palette);
    for (const p of pipes) drawPipe(p);
    drawParticles();
    drawGround(palette);

    if (state === STATE.START) {
      drawStart();
    } else {
      drawPlayer();
      drawScore();
      if (state === STATE.OVER) drawOver();
    }
    drawMuteButton();
    if (state !== STATE.PLAY) drawLeaderboardButton();
  }

  // ---------- Loop principal ----------
  function loop(t) {
    if (!lastTime) lastTime = t;
    let dt = (t - lastTime) / 1000;
    lastTime = t;
    dt = Math.min(dt, 0.033); // evita saltos grandes si la pestaña estuvo en background

    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- PWA: registrar service worker ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
