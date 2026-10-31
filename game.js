// Els Panets — variante de MR Taco President: el presidente vuela por Caracas
// comiendo empanadillas venezolanas. Rehecho entero el 31/10/2026:
// dibujo a la resolución real de la pantalla, escenario por capas, columnas
// coloniales, personaje nuevo, menús nuevos, «prepárate», medallas, música.
(function () {
  "use strict";

  // ---------- Pantalla ----------
  // Ancho lógico fijo (400) y alto según la forma de la pantalla, para llenar
  // el móvil sin bandas. Se dibuja a los píxeles reales: nada borroso.
  const LW = 400;
  let LH = 700;
  const GROUND_H = 96;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const FONT = "'Lilita One', 'Arial Black', 'Segoe UI', sans-serif";

  function resize() {
    const vw = window.innerWidth || LW, vh = window.innerHeight || 700;
    LH = Math.round(Math.max(640, Math.min(860, (LW * vh) / vw)));
    const scale = Math.min(vw / LW, vh / LH);
    const cssW = Math.floor(LW * scale), cssH = Math.floor(LH * scale);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    let dpr = window.devicePixelRatio || 1;
    const maxPx = 2600000; // tope para equipos modestos
    if (cssW * cssH * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (cssW * cssH));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const k = canvas.width / LW;
    ctx.setTransform(k, 0, 0, k, 0, 0);
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 100));
  resize();
  setTimeout(resize, 300);

  const groundTop = () => LH - GROUND_H;

  // ---------- Guardado (con red de seguridad) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} },
  };
  const SOUND_KEY = "tacoSuitFlapMusic";
  const BEST_KEY = "tacoSuitFlapBest";
  const NAME_KEY = "tacoSuitFlapPlayerName";
  const HOLDER_KEY = "tacoSuitFlapRecordHolder";
  const SKIN_KEY = "tacoSuitFlapSkin";

  let best = Number(store.get(BEST_KEY, 0)) || 0;
  let recordHolder = store.get(HOLDER_KEY, null);

  // ---------- Sonido (todo sintetizado, sin archivos) ----------
  let actx = null, master = null, sfx = null, musicBus = null, noiseBuf = null;
  let soundOn = store.get(SOUND_KEY, "1") !== "0";

  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = soundOn ? 1 : 0;
      master.connect(actx.destination);
      sfx = actx.createGain();
      sfx.gain.value = 0.8;
      sfx.connect(master);
      musicBus = actx.createGain();
      musicBus.gain.value = 0.12;
      musicBus.connect(master);
      noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  function tone(freq, dur, type, vol, glide, delay, dest) {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, filter, freq, freqEnd, delay) {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + (delay || 0);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(sfx);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  const snd = {
    flap() { noise(0.13, 0.35, "bandpass", 700, 1800); },
    eat() {
      noise(0.05, 0.4, "highpass", 2500);
      noise(0.05, 0.3, "highpass", 3000, 0, 0.06);
      tone(784, 0.1, "triangle", 0.18, 0, 0.02);
      tone(1175, 0.14, "triangle", 0.16, 0, 0.09);
    },
    point() { tone(1568, 0.12, "sine", 0.1); tone(2093, 0.16, "sine", 0.07, 0, 0.05); },
    hit() { tone(160, 0.28, "square", 0.12, -100); noise(0.25, 0.5, "lowpass", 900, 200); },
    fall() { tone(880, 0.55, "sine", 0.07, -560, 0.12); },
    click() { tone(660, 0.05, "triangle", 0.12); },
    record() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.16, 0, i * 0.09)); },
    medal() { [1319, 1568, 2093].forEach((f, i) => tone(f, 0.18, "sine", 0.08, 0, i * 0.07)); },
  };

  function setSound(on) {
    soundOn = on;
    store.set(SOUND_KEY, on ? "1" : "0");
    if (master) master.gain.setTargetAtTime(on ? 1 : 0, actx.currentTime, 0.04);
  }

  // Música: aire de joropo (3/4, re mayor) con bajo, cuatro rasgueado y melodía.
  const E = 0.125; // duración de una corchea
  const N = {
    D2: 73.42, G2: 98.0, A2: 110.0,
    D3: 146.83, Fs3: 185.0, G3: 196.0, A3: 220.0, B3: 246.94, Cs4: 277.18, D4: 293.66, E4: 329.63,
    Fs4: 369.99, G4: 392.0, A4: 440.0, B4: 493.88, Cs5: 554.37, D5: 587.33, E5: 659.25, Fs5: 739.99,
  };
  const CHORDS = {
    D: { bass: [N.D2, N.A2], notes: [N.D3, N.Fs3, N.A3, N.D4] },
    G: { bass: [N.G2, N.D3], notes: [N.G3, N.B3, N.D4, N.G4] },
    A: { bass: [N.A2, N.E4 / 2], notes: [N.A3, N.Cs4, N.E4, N.A4] },
  };
  const PROG = ["D", "D", "G", "A", "D", "G", "A", "D"];
  const MELODY = [
    N.A4, 0, N.Fs4, N.A4, N.D5, 0,
    N.Fs5, 0, N.E5, N.D5, N.A4, 0,
    N.B4, 0, N.D5, N.B4, N.G4, 0,
    N.A4, 0, N.Cs5, N.E5, N.Cs5, N.A4,
    N.D5, 0, N.Fs5, N.D5, N.A4, 0,
    N.G4, N.B4, N.D5, 0, N.B4, N.G4,
    N.E5, 0, N.Cs5, N.A4, N.Cs5, N.E5,
    N.D5, 0, 0, N.A4, N.D5, 0,
  ];
  const STRUM = [1, 0, 1, 1, 0, 1];
  let musicStarted = false, nextStep = 0, step = 0;

  function musicNote(t, f, dur, type, vol) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function musicTick() {
    if (!actx) return;
    while (nextStep < actx.currentTime + 0.15) {
      const bar = Math.floor(step / 6) % PROG.length, pos = step % 6;
      const ch = CHORDS[PROG[bar]];
      if (pos === 0) musicNote(nextStep, ch.bass[0], E * 2.6, "triangle", 0.7);
      if (pos === 3) musicNote(nextStep, ch.bass[1], E * 2.2, "triangle", 0.5);
      if (STRUM[pos]) ch.notes.forEach((f, i) => musicNote(nextStep + i * 0.012, f, E * 1.3, "triangle", 0.16));
      const m = MELODY[step % MELODY.length];
      if (m) musicNote(nextStep, m, E * 1.6, "square", 0.08);
      step++;
      nextStep += E;
    }
  }

  function startMusic() {
    if (musicStarted || !audio()) return;
    musicStarted = true;
    nextStep = actx.currentTime + 0.1;
    setInterval(musicTick, 50);
  }

  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  // ---------- Utilidades de color y azar ----------
  function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) {
    const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    return "#" + c(r) + c(g) + c(b);
  }
  function lighten(hex, a) { const [r, g, b] = hexToRgb(hex); return rgbToHex(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a); }
  function darken(hex, a) { const [r, g, b] = hexToRgb(hex); return rgbToHex(r * (1 - a), g * (1 - a), b * (1 - a)); }
  // Mezcla un color con el azul de la noche
  function nightTint(hex, n) {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r + (28 - r) * n * 0.62, g + (34 - g) * n * 0.62, b + (78 - b) * n * 0.55);
  }
  const rgb = (a, alpha) => alpha === undefined ? `rgb(${a[0]},${a[1]},${a[2]})` : `rgba(${a[0]},${a[1]},${a[2]},${alpha})`;
  const lerp = (a, b, f) => a + (b - a) * f;
  const lerpArr = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  function seeded(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(t, x, y, size, fill, stroke, sw, align) {
    ctx.font = size + "px " + FONT;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 4; ctx.strokeText(t, x, y); }
    ctx.fillStyle = fill;
    ctx.fillText(t, x, y);
  }

  // ---------- Trajes (mismo personaje, distinta ropa) ----------
  const SKINS = [
    { name: "Traje azul", type: "suit", suit: "#27407a", tie: "#d63a32", unlock: 0 },
    { name: "Golf", type: "golf", suit: "#f4f4f2", tie: "#d63a32", cap: "#d63a32", unlock: 10 },
    { name: "Esmoquin", type: "tuxedo", suit: "#1b1d24", tie: "#1b1d24", unlock: 25 },
    { name: "Traje blanco", type: "suit", suit: "#f1eee2", tie: "#d63a32", unlock: 50 },
  ];
  let skinIndex = Number(store.get(SKIN_KEY, 0)) || 0;
  const skinUnlocked = (i) => best >= SKINS[i].unlock;
  const currentSkin = () => (skinUnlocked(skinIndex) ? SKINS[skinIndex] : SKINS[0]);

  // ---------- Personajes desbloqueables (31/10/2026, sacados de su foto) ----------
  // El presidente es el de siempre (con sus trajes); los demás se dibujan con el
  // mismo estilo y se desbloquean por la mejor puntuación.
  const CHARACTERS = [
    { id: "presi", name: "EL PRESIDENTE", unlock: 0 },
    { id: "blanco", name: "MARÍA", unlock: 5, kind: "human", fem: true,
      skin: "#f2c8a8", skinD: "#d9a482", hair: "#3a2a22", hairD: "#22170f", hairStyle: "longStraight", part: -2,
      face: { rx: 11, ry: 14, chin: 0.42 }, eye: "#5e3d24", lips: "#c9776d", smile: "soft", nose: 5,
      brow: { color: "#2b1d16", w: 1.5, y: 4.4, arch: 1.6 },
      top: "longsleeve", topColor: "#f8f8f6", legs: "#8e9198", socks: "#f2f2f2", shoes: "#f5f5f5", shoeSole: "#d9d9d9" },
    { id: "deportista", name: "IVANNA", unlock: 15, kind: "human", fem: true,
      skin: "#ebb994", skinD: "#d09a70", hair: "#6a4329", hairD: "#3f2617", hairStyle: "longWavy", part: -4,
      face: { rx: 11.5, ry: 13.5, chin: 0.5 }, eye: "#4a2c18", lips: "#c4655c", smile: "teeth", nose: 4.8,
      brow: { color: "#2e1c12", w: 2.1, y: 4.6, arch: 1.1 },
      top: "tank", topColor: "#fbfbfb", legs: "#1d1e23", shoes: "#3b3f47", shoeSole: "#22252b", watch: "#e8e8e8" },
    { id: "nuria", name: "NÚRIA", unlock: 20, kind: "human", fem: true,
      skin: "#f4cdb0", skinD: "#dfa98a", hair: "#e8c67c", hairD: "#c99d55", roots: "#8a6a45", hairStyle: "longStraight", part: 0,
      face: { rx: 11.8, ry: 13.8, chin: 0.48 }, eye: "#6f8fa0", lips: "#c9776d", smile: "teeth", nose: 5, freckles: true,
      brow: { color: "#9c7a52", w: 1.5, y: 4.6, arch: 1.4 },
      top: "tee", topColor: "#3f6b55", legs: "#3a4a66", shoes: "#f2f2f2", shoeSole: "#d0d0d0" },
    { id: "polo", name: "JORDI", unlock: 30, kind: "human",
      skin: "#e8b48e", skinD: "#cc936a", hair: "#3b2a20", hairD: "#21160f", hairStyle: "swept", part: -4,
      face: { rx: 11.3, ry: 15, chin: 0.55 }, eye: "#563822", nose: 5.6, smile: "closed",
      brow: { color: "#2f2119", w: 2, y: 4.2, arch: 0.7 },
      beard: { color: "#3d2e25", alpha: 0.88, top: 5 },
      top: "polo", topColor: "#1d1d21", legs: "#3a3f4c", shoes: "#202126", shoeSole: "#e5e5e5", watch: "#222" },
    { id: "chaqueta", name: "ISIDRO", unlock: 40, kind: "human",
      skin: "#a8704c", skinD: "#8a5636", hair: "#161311", hairD: "#000000", hairStyle: "buzz", part: 0,
      face: { rx: 11.6, ry: 15.5, chin: 0.58 }, eye: "#2a1a10", nose: 5.8, smile: "neutral",
      brow: { color: "#120e0c", w: 2.6, y: 3.8, arch: 0.6 },
      beard: { color: "#151210", alpha: 0.95, top: 3.5 },
      top: "jacket", topColor: "#202126", legs: "#18191c", shoes: "#5d3d27", shoeSole: "#3a2617" },
    { id: "perro", name: "RIM", unlock: 60, kind: "dog" },
  ];
  const CHAR_KEY = "elsPanetsCharacter";
  let charIndex = Math.max(0, CHARACTERS.findIndex((c) => c.id === store.get(CHAR_KEY, "presi")));
  let viewIndex = charIndex; // el que se está mirando en el inicio
  const charUnlocked = (i) => best >= CHARACTERS[i].unlock;
  const selectedChar = () => (charUnlocked(charIndex) ? CHARACTERS[charIndex] : CHARACTERS[0]);
  function viewChar(i) {
    viewIndex = (i + CHARACTERS.length) % CHARACTERS.length;
    if (charUnlocked(viewIndex)) { charIndex = viewIndex; store.set(CHAR_KEY, CHARACTERS[viewIndex].id); }
  }

  // ---------- Cielo: día, atardecer y noche según los puntos ----------
  const PALETTES = [
    { top: [92, 186, 232], bottom: [196, 236, 244], mount: [84, 150, 132], city: [148, 186, 204], cloud: [255, 255, 255], night: 0 },
    { top: [240, 120, 92], bottom: [255, 206, 140], mount: [142, 94, 112], city: [196, 128, 124], cloud: [255, 226, 206], night: 0.25 },
    { top: [16, 22, 58], bottom: [52, 54, 104], mount: [32, 42, 72], city: [44, 50, 90], cloud: [96, 104, 146], night: 1 },
  ];
  function palette(sc) {
    const t = ((sc % 45) + 45) % 45, i = Math.floor(t / 15), f = easeOut((t % 15) / 15) * 0.999;
    const a = PALETTES[i], b = PALETTES[(i + 1) % 3];
    // el atardecer y la noche llegan despacio, al final de cada tramo
    const g = clamp((f - 0.6) / 0.4, 0, 1);
    return {
      top: lerpArr(a.top, b.top, g), bottom: lerpArr(a.bottom, b.bottom, g),
      mount: lerpArr(a.mount, b.mount, g), city: lerpArr(a.city, b.city, g),
      cloud: lerpArr(a.cloud, b.cloud, g), night: lerp(a.night, b.night, g), phase: i + g,
    };
  }

  // ---------- Escenario (se genera una vez, siempre igual) ----------
  const MOUNT_TILE = 800, CITY_TILE = 640, HOUSE_TILE = 560;
  const rnd = seeded(1811); // año de la independencia de Venezuela

  // El Ávila: sierra suave que se repite sin cortes
  const mountain = [];
  for (let x = 0; x <= MOUNT_TILE; x += 8) {
    const p = (x / MOUNT_TILE) * Math.PI * 2;
    mountain.push(70 + 38 * Math.sin(p) + 22 * Math.sin(2 * p + 1.3) + 9 * Math.sin(5 * p + 0.4) + 4 * Math.sin(11 * p));
  }

  const city = [];
  for (let x = 0; x < CITY_TILE;) {
    const w = 24 + Math.floor(rnd() * 26), h = 40 + Math.floor(rnd() * 90);
    city.push({ x, w, h, lit: Array.from({ length: 40 }, () => rnd() < 0.55) });
    x += w + 3;
  }
  // las dos torres de Parque Central
  city.push({ x: 300, w: 30, h: 178, lit: Array.from({ length: 60 }, () => rnd() < 0.6), tower: true });
  city.push({ x: 338, w: 30, h: 178, lit: Array.from({ length: 60 }, () => rnd() < 0.6), tower: true });

  const HOUSE_COLORS = ["#f6d365", "#f4a259", "#7cc6d6", "#f28f8f", "#8fcf94", "#fbeec1", "#c9a7e8"];
  const houses = [];
  for (let x = 0; x < HOUSE_TILE;) {
    const w = 62 + Math.floor(rnd() * 34), h = 46 + Math.floor(rnd() * 30);
    houses.push({ x, w, h, color: HOUSE_COLORS[Math.floor(rnd() * HOUSE_COLORS.length)], palm: rnd() < 0.45 });
    x += w + (rnd() < 0.4 ? 26 : 2);
  }

  const stars = Array.from({ length: 46 }, () => ({ x: rnd() * LW, y: rnd() * 0.55, r: 0.6 + rnd() * 1.2 }));
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 110 + rnd() * 60, y: 60 + rnd() * 220, s: 0.7 + rnd() * 0.6, v: 6 + rnd() * 10 }));

  // ---------- Estado de la partida ----------
  const STATE = { START: 0, READY: 1, PLAY: 2, DYING: 3, OVER: 4, NAME: 5, PAUSE: 6 };
  let state = STATE.START;
  let stateT = 0; // tiempo en el estado actual

  const GRAVITY = 1500, FLAP_V = -430, COL_W = 66, CAP_H = 22, CAP_OUT = 6, SPACING = 236;
  const PLAYER_SCALE = 1.2;
  const player = { x: LW / 2, y: 300, vy: 0, rot: 0, flap: 0, eatT: 0, hitR: 14 };
  // Para probar: ?puntos=30 empieza con 30 puntos (atardecer y noche)
  const START_SCORE = Number(new URLSearchParams(location.search).get("puntos")) || 0;
  let cols = [], particles = [], floaters = [];
  let score = 0, eaten = 0, speed = 150, gap = 178, distToSpawn = 0, lastGapY = 0;
  let scroll = 0;          // distancia recorrida (para el fondo)
  let worldT = 0;          // reloj general
  let scorePop = 0, flashT = 0, newBest = false, medalPlayed = false;
  let pressLockUntil = 0;

  function setState(s) { state = s; stateT = 0; }

  function resetRun() {
    cols = []; particles = []; floaters = [];
    score = START_SCORE; eaten = 0; speed = 150; gap = 178;
    distToSpawn = 0; lastGapY = groundTop() / 2 - gap / 2;
    newBest = false; medalPlayed = false;
    player.y = LH * 0.42; player.vy = 0; player.rot = 0;
  }

  function goReady() {
    resetRun();
    setState(STATE.READY);
  }

  function beginPlay() {
    setState(STATE.PLAY);
    spawnColumn(LW + 60);
    flap();
  }

  function flap() {
    player.vy = FLAP_V;
    snd.flap();
  }

  function spawnColumn(x) {
    const minY = 70, maxY = groundTop() - 70 - gap;
    let y = minY + Math.random() * (maxY - minY);
    y = clamp(y, lastGapY - 210, lastGapY + 210);
    y = clamp(y, minY, maxY);
    lastGapY = y;
    cols.push({ x, gapY: y, gap, passed: false, food: Math.random() < 0.85, eaten: false, bob: Math.random() * 6 });
  }

  function addScore(n, x, y) {
    score += n;
    scorePop = 1;
    if (n > 1) floaters.push({ x, y, txt: "+" + n, t: 0 });
    // más rápido y algo más estrecho cada 10 puntos, con tope
    const lvl = Math.floor(score / 10);
    speed = 150 + Math.min(60, lvl * 6);
    gap = Math.max(152, 178 - lvl * 3);
  }

  function crash() {
    if (state !== STATE.PLAY) return;
    snd.hit();
    snd.fall();
    vibrate([40, 30, 60]);
    flashT = 1;
    burst(player.x, player.y, ["#ffffff", "#ffd166", "#ef476f"], 16, 160);
    player.vy = Math.min(player.vy, -120);
    if (score > best) {
      best = score;
      newBest = true;
      store.set(BEST_KEY, best);
    }
    setState(STATE.DYING);
  }

  function finishDying() {
    if (newBest) {
      const name = store.get(NAME_KEY, null);
      if (!name) { setState(STATE.NAME); showNameOverlay(); return; }
      publishRecord(name);
    }
    goOver();
  }

  function goOver() {
    setState(STATE.OVER);
    pressLockUntil = worldT + 0.7;
    if (newBest) setTimeout(() => snd.record(), 350);
  }

  function burst(x, y, colors, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.5 + Math.random() * 0.4, max: 0.9,
        color: colors[i % colors.length], r: 1.6 + Math.random() * 2.6 });
    }
  }

  // ---------- Récord y ranking ----------
  const nameOverlay = document.getElementById("nameOverlay");
  const nameInput = document.getElementById("nameInput");
  const nameSubmit = document.getElementById("nameSubmit");

  function showNameOverlay() {
    nameOverlay.classList.remove("hidden");
    nameInput.value = "";
    setTimeout(() => nameInput.focus(), 50);
  }

  function publishRecord(name) {
    recordHolder = name;
    store.set(HOLDER_KEY, name);
    if (window.TacoLeaderboard) window.TacoLeaderboard.submitScore(name, score, eaten);
  }

  function submitName() {
    const name = nameInput.value.trim().slice(0, 12) || "Jugador";
    store.set(NAME_KEY, name);
    publishRecord(name);
    nameOverlay.classList.add("hidden");
    goOver();
  }
  nameSubmit.addEventListener("click", submitName);
  nameInput.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") submitName(); });

  const lbOverlay = document.getElementById("leaderboardOverlay");
  const lbList = document.getElementById("leaderboardList");
  document.getElementById("leaderboardClose").addEventListener("click", () => lbOverlay.classList.add("hidden"));

  function showLeaderboard() {
    lbOverlay.classList.remove("hidden");
    lbList.innerHTML = '<li class="lbEmpty">Cargando…</li>';
    if (!window.TacoLeaderboard) { lbList.innerHTML = '<li class="lbEmpty">Sin conexión al ranking</li>'; return; }
    window.TacoLeaderboard.fetchTop(10).then((rows) => {
      if (!rows || !rows.length) { lbList.innerHTML = '<li class="lbEmpty">Aún no hay puntuaciones</li>'; return; }
      lbList.innerHTML = rows.map((r, i) => {
        const name = String(r.name || "Jugador").replace(/[<>&"']/g, "");
        const cls = i < 3 ? ` class="top${i + 1}"` : "";
        return `<li${cls}><span class="lbRank">${i + 1}</span><span class="lbName">${name}</span><span class="lbScore">${Number(r.score) || 0}</span></li>`;
      }).join("");
    }).catch(() => { lbList.innerHTML = '<li class="lbEmpty">No se pudo cargar el ranking</li>'; });
  }

  // ---------- Botones (posiciones según el alto de la pantalla) ----------
  function ui() {
    const cx = LW / 2;
    const overCardY = LH * 0.27;
    return {
      sound: { x: 36, y: 40, r: 22 },
      rank: { x: LW - 36, y: 40, r: 22 },
      charY: LH * 0.31,
      prev: { x: cx - 118, y: LH * 0.31, r: 22 },
      next: { x: cx + 118, y: LH * 0.31, r: 22 },
      play: { x: cx - 100, y: LH * 0.45, w: 200, h: 64 },
      cardY: LH * 0.45 + 82,
      portraits: CHARACTERS.map((c, i) => { const st = Math.min(46, 266 / CHARACTERS.length); return { i, x: cx - (CHARACTERS.length - 1) * st / 2 + i * st, y: LH * 0.45 + 82 + 56, r: Math.min(19, st / 2 - 3) }; }),
      skins: SKINS.map((s, i) => ({ i, x: cx - 66 + i * 44, y: LH * 0.45 + 82 + 128, r: 16 })),
      overCard: { x: cx - 160, y: overCardY, w: 320, h: 240 },
      again: { x: cx - 150, y: overCardY + 262, w: 160, h: 58 },
      home: { x: cx + 20, y: overCardY + 262, w: 130, h: 58 },
    };
  }
  const inRect = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const inCircle = (p, b) => (p.x - b.x) ** 2 + (p.y - b.y) ** 2 <= (b.r + 6) ** 2;

  function eventPoint(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return null;
    const src = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e;
    return { x: (src.clientX - r.left) * (LW / r.width), y: (src.clientY - r.top) * (LH / r.height) };
  }

  function press(p) {
    startMusic();
    const u = ui();
    if (p && state !== STATE.PLAY && state !== STATE.DYING && inCircle(p, u.sound)) { setSound(!soundOn); snd.click(); return; }
    if (p && (state === STATE.START || state === STATE.OVER) && inCircle(p, u.rank)) { snd.click(); showLeaderboard(); return; }

    switch (state) {
      case STATE.START:
        if (!p) { if (charUnlocked(viewIndex)) { snd.click(); goReady(); } return; }
        if (inCircle(p, u.prev)) { viewChar(viewIndex - 1); snd.click(); return; }
        if (inCircle(p, u.next)) { viewChar(viewIndex + 1); snd.click(); return; }
        for (const c of u.portraits) {
          if (inCircle(p, { x: c.x, y: c.y, r: c.r - 3 })) { viewChar(c.i); snd.click(); return; }
        }
        if (CHARACTERS[viewIndex].id === "presi") {
          for (const s of u.skins) {
            if (inCircle(p, { x: s.x, y: s.y, r: s.r - 3 })) {
              if (skinUnlocked(s.i)) { skinIndex = s.i; store.set(SKIN_KEY, s.i); snd.click(); }
              return;
            }
          }
        }
        if (inRect(p, u.play) && charUnlocked(viewIndex)) { snd.click(); goReady(); }
        return;
      case STATE.READY:
        if (stateT > 0.15) beginPlay();
        return;
      case STATE.PLAY:
        flap();
        return;
      case STATE.PAUSE:
        setState(STATE.PLAY);
        flap();
        return;
      case STATE.OVER:
        if (worldT < pressLockUntil) return;
        if (!p || inRect(p, u.again)) { snd.click(); goReady(); return; }
        if (inRect(p, u.home)) { snd.click(); resetRun(); viewIndex = charIndex; setState(STATE.START); }
        return;
    }
  }

  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); press(eventPoint(e)); });
  window.addEventListener("keydown", (e) => {
    if (state === STATE.NAME) return;
    if (state === STATE.START && (e.code === "ArrowLeft" || e.code === "ArrowRight")) {
      viewChar(viewIndex + (e.code === "ArrowLeft" ? -1 : 1));
      snd.click();
      return;
    }
    if (e.code !== "Space" && e.code !== "ArrowUp" && e.code !== "Enter") return;
    e.preventDefault();
    if (e.repeat) return;
    press(null);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === STATE.PLAY) setState(STATE.PAUSE);
    if (actx) { if (document.hidden) actx.suspend(); else actx.resume(); }
  });

  // ---------- Lógica (paso fijo: igual de rápido en cualquier equipo) ----------
  const STEP = 1 / 120;

  function update(dt) {
    worldT += dt;
    stateT += dt;
    scorePop = Math.max(0, scorePop - dt * 4);
    flashT = Math.max(0, flashT - dt * 3.5);
    player.eatT = Math.max(0, player.eatT - dt);
    for (const c of clouds) { c.x -= c.v * dt; if (c.x < -90) c.x += LW + 180; }

    const moving = state === STATE.START || state === STATE.READY || state === STATE.PLAY || state === STATE.OVER;
    if (moving) scroll += (state === STATE.PLAY ? speed : 110) * dt;

    switch (state) {
      case STATE.START:
        player.x = lerp(player.x, LW / 2, Math.min(1, dt * 6));
        player.y = LH * 0.31 + Math.sin(worldT * 2.4) * 6;
        player.rot = 0;
        player.flap += dt * 9;
        break;
      case STATE.READY:
        player.x = lerp(player.x, 108, Math.min(1, dt * 5));
        player.y = LH * 0.42 + Math.sin(worldT * 3) * 7;
        player.rot = 0;
        player.flap += dt * 10;
        break;
      case STATE.PLAY:
        stepPlay(dt);
        break;
      case STATE.DYING:
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;
        player.rot = Math.min(1.5, player.rot + dt * 5);
        if (player.y > groundTop() - 22) { player.y = groundTop() - 22; if (stateT > 0.45) finishDying(); }
        else if (stateT > 1.6) finishDying();
        break;
    }

    for (const pt of particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 520 * dt; pt.life -= dt; }
    particles = particles.filter((pt) => pt.life > 0);
    for (const f of floaters) f.t += dt;
    floaters = floaters.filter((f) => f.t < 0.9);
  }

  function stepPlay(dt) {
    player.vy = Math.min(player.vy + GRAVITY * dt, 720);
    player.y += player.vy * dt;
    const targetRot = clamp(player.vy / 560, -0.42, 1.25);
    player.rot += (targetRot - player.rot) * Math.min(1, dt * 12);
    player.flap += dt * (player.vy < 0 ? 18 : 7);
    if (player.y < 14) { player.y = 14; player.vy = Math.max(0, player.vy); }

    // centro del cuerpo para los choques (algo más pequeño que el dibujo: justo)
    const hx = player.x + 1, hy = player.y - 5, hr = player.hitR;
    if (hy + hr > groundTop()) { crash(); return; }

    distToSpawn += speed * dt;
    if (distToSpawn >= SPACING) { distToSpawn -= SPACING; spawnColumn(LW + 20); }

    for (const c of cols) {
      c.x -= speed * dt;
      c.bob += dt * 3;
      const top = c.gapY, bot = c.gapY + c.gap;
      if (hitRect(hx, hy, hr, c.x, -50, COL_W, top + 50 - CAP_H) || hitRect(hx, hy, hr, c.x - CAP_OUT, top - CAP_H, COL_W + CAP_OUT * 2, CAP_H) ||
          hitRect(hx, hy, hr, c.x - CAP_OUT, bot, COL_W + CAP_OUT * 2, CAP_H) || hitRect(hx, hy, hr, c.x, bot + CAP_H, COL_W, groundTop() - bot)) {
        crash();
        return;
      }
      if (!c.passed && c.x + COL_W < hx - hr) { c.passed = true; addScore(1); snd.point(); }
      if (c.food && !c.eaten) {
        const fx = c.x + COL_W / 2, fy = c.gapY + c.gap / 2 + Math.sin(c.bob) * 5;
        if ((hx - fx) ** 2 + (hy - fy) ** 2 < (hr + 15) ** 2) {
          c.eaten = true;
          eaten++;
          player.eatT = 0.3;
          addScore(3, fx, fy - 20);
          snd.eat();
          vibrate(12);
          burst(fx, fy, ["#f2a93b", "#c96d16", "#ffe2a0"], 14, 130);
        }
      }
    }
    cols = cols.filter((c) => c.x > -COL_W - 20);
  }

  function hitRect(cx, cy, r, x, y, w, h) {
    const nx = clamp(cx, x, x + w), ny = clamp(cy, y, y + h);
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  // ---------- Dibujo del escenario ----------
  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, groundTop());
    g.addColorStop(0, rgb(pal.top));
    g.addColorStop(1, rgb(pal.bottom));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LW, LH);

    // estrellas quietas (sin parpadeo)
    if (pal.night > 0.05) {
      ctx.fillStyle = `rgba(255,255,240,${pal.night * 0.85})`;
      for (const s of stars) { ctx.beginPath(); ctx.arc(s.x, s.y * groundTop(), s.r, 0, Math.PI * 2); ctx.fill(); }
    }
    // sol que baja al atardecer y luna de noche
    const ph = pal.phase;
    if (ph < 1.9) {
      const k = clamp(ph, 0, 1);
      const sx = 300, sy = lerp(LH * 0.14, groundTop() - 190, k), sr = lerp(26, 38, k);
      const col = lerpArr([255, 236, 140], [255, 150, 80], k);
      const halo = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3);
      halo.addColorStop(0, rgb(col, 0.45 * (1 - pal.night)));
      halo.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
      ctx.fillStyle = rgb(col, 1 - pal.night);
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    if (pal.night > 0.3) {
      const a = clamp((pal.night - 0.3) / 0.5, 0, 1);
      ctx.fillStyle = `rgba(250,246,220,${a})`;
      ctx.beginPath(); ctx.arc(90, LH * 0.13, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgb(pal.top, a);
      ctx.beginPath(); ctx.arc(99, LH * 0.13 - 5, 17, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawClouds(pal) {
    for (const c of clouds) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.s, c.s);
      ctx.fillStyle = rgb(lerpArr(pal.cloud, pal.top, 0.22), 0.9);
      cloudShape(0, 6);
      ctx.fillStyle = rgb(pal.cloud, 0.95);
      cloudShape(0, 0);
      ctx.restore();
    }
  }
  function cloudShape(dx, dy) {
    ctx.beginPath();
    ctx.arc(dx + 0, dy + 0, 20, 0, Math.PI * 2);
    ctx.arc(dx + 24, dy - 12, 26, 0, Math.PI * 2);
    ctx.arc(dx + 52, dy - 4, 22, 0, Math.PI * 2);
    ctx.arc(dx + 72, dy + 4, 15, 0, Math.PI * 2);
    ctx.rect(dx, dy, 72, 18);
    ctx.fill();
  }

  function drawMountains(pal) {
    const base = groundTop() - 70;
    const off = -((scroll * 0.08) % MOUNT_TILE);
    // dos cordilleras: la de detrás más clara
    for (let layer = 0; layer < 2; layer++) {
      const col = layer === 0 ? lerpArr(pal.mount, pal.bottom, 0.45) : pal.mount;
      const h = layer === 0 ? 1.25 : 0.95;
      const o = layer === 0 ? off * 0.6 - 200 : off;
      ctx.fillStyle = rgb(col);
      ctx.beginPath();
      ctx.moveTo(0, LH);
      for (let rep = -1; rep < 2; rep++) {
        for (let i = 0; i < mountain.length; i++) {
          const x = o + rep * MOUNT_TILE + i * 8;
          if (x < -10 || x > LW + 10) continue;
          ctx.lineTo(x, base - 40 - mountain[i] * h);
        }
      }
      ctx.lineTo(LW + 10, LH);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawCity(pal) {
    const base = groundTop() - 34;
    const off = -((scroll * 0.2) % CITY_TILE);
    const col = rgb(pal.city), win = pal.night;
    for (let rep = 0; rep < 2; rep++) {
      for (const b of city) {
        const x = off + rep * CITY_TILE + b.x;
        if (x > LW || x + b.w < 0) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, base - b.h, b.w, b.h + 40);
        if (b.tower) { ctx.fillRect(x + b.w / 2 - 1, base - b.h - 14, 2, 14); }
        // ventanas: de día apenas se ven, de noche encendidas
        ctx.fillStyle = win > 0.3 ? `rgba(255,214,120,${0.25 + win * 0.6})` : "rgba(255,255,255,0.22)";
        let k = 0;
        for (let wy = base - b.h + 8; wy < base - 4; wy += 11) {
          for (let wx = x + 5; wx < x + b.w - 6; wx += 8) {
            if (b.lit[k++ % b.lit.length]) ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }
  }

  function drawHouses(pal) {
    const base = groundTop();
    const off = -((scroll * 0.45) % HOUSE_TILE);
    const n = pal.night;
    for (let rep = 0; rep < 3; rep++) {
      for (const h of houses) {
        const x = off + rep * HOUSE_TILE + h.x;
        if (x > LW + 30 || x + h.w < -40) continue;
        if (h.palm) drawPalm(x - 12, base, n);
        const wall = nightTint(h.color, n);
        // pared
        ctx.fillStyle = wall;
        ctx.fillRect(x, base - h.h, h.w, h.h);
        ctx.fillStyle = nightTint(darken(h.color, 0.18), n);
        ctx.fillRect(x, base - 8, h.w, 8);
        // tejado de teja
        ctx.fillStyle = nightTint("#b8553c", n);
        ctx.beginPath();
        ctx.moveTo(x - 6, base - h.h + 2);
        ctx.lineTo(x + 8, base - h.h - 14);
        ctx.lineTo(x + h.w - 8, base - h.h - 14);
        ctx.lineTo(x + h.w + 6, base - h.h + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = nightTint("#8e3b28", n);
        ctx.lineWidth = 1;
        for (let tx = x + 4; tx < x + h.w; tx += 8) {
          ctx.beginPath(); ctx.moveTo(tx, base - h.h - 12); ctx.lineTo(tx - 2, base - h.h + 1); ctx.stroke();
        }
        // puerta con arco
        const dx = x + h.w * 0.5 - 8;
        ctx.fillStyle = nightTint("#7a4a2a", n);
        ctx.beginPath();
        ctx.moveTo(dx, base - 8);
        ctx.lineTo(dx, base - 30);
        ctx.arc(dx + 8, base - 30, 8, Math.PI, 0);
        ctx.lineTo(dx + 16, base - 8);
        ctx.closePath();
        ctx.fill();
        // ventanas con reja
        const winCol = n > 0.5 ? "#ffd27a" : nightTint("#fff8e8", n);
        for (const wx of [x + 8, x + h.w - 24]) {
          if (wx + 16 > dx && wx < dx + 16) continue;
          ctx.fillStyle = winCol;
          ctx.fillRect(wx, base - h.h + 14, 16, 18);
          ctx.strokeStyle = nightTint("#5b4636", n);
          ctx.lineWidth = 1.2;
          ctx.strokeRect(wx, base - h.h + 14, 16, 18);
          ctx.beginPath();
          for (let i = 1; i < 4; i++) { ctx.moveTo(wx + i * 4, base - h.h + 14); ctx.lineTo(wx + i * 4, base - h.h + 32); }
          ctx.stroke();
        }
      }
    }
  }

  function drawPalm(x, base, n) {
    ctx.strokeStyle = nightTint("#8a6234", n);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + 8, base - 50, x + 2, base - 96);
    ctx.stroke();
    ctx.fillStyle = nightTint("#3f9a52", n);
    const tx = x + 2, ty = base - 98;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.62;
      ctx.beginPath();
      ctx.ellipse(tx + Math.cos(a) * 16, ty + Math.sin(a) * 9 + 6, 20, 5.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = nightTint("#6b4a25", n);
    ctx.beginPath(); ctx.arc(tx, ty + 3, 4, 0, Math.PI * 2); ctx.fill();
  }

  function drawGround(pal) {
    const y = groundTop(), n = pal.night;
    // césped
    ctx.fillStyle = nightTint("#5cb85c", n);
    ctx.fillRect(0, y, LW, 10);
    ctx.fillStyle = nightTint("#3f8f44", n);
    ctx.fillRect(0, y + 8, LW, 3);
    // acera de baldosas (juntas suaves, poco contraste: no marea)
    ctx.fillStyle = nightTint("#e6d6b8", n);
    ctx.fillRect(0, y + 11, LW, 34);
    ctx.strokeStyle = nightTint("#d2c09f", n);
    ctx.lineWidth = 1.5;
    const off = -(scroll % 44);
    ctx.beginPath();
    for (let x = off; x < LW + 44; x += 44) { ctx.moveTo(x, y + 11); ctx.lineTo(x, y + 45); }
    ctx.moveTo(0, y + 28); ctx.lineTo(LW, y + 28);
    ctx.stroke();
    // bordillo y calle
    ctx.fillStyle = nightTint("#bdb3a2", n);
    ctx.fillRect(0, y + 45, LW, 7);
    ctx.fillStyle = nightTint("#4a4f5a", n);
    ctx.fillRect(0, y + 52, LW, LH - y - 52);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, y + 52, LW, 4);
  }

  // Columnas coloniales de estuco con la franja tricolor de Venezuela
  function columnGradient(x) {
    const g = ctx.createLinearGradient(x, 0, x + COL_W, 0);
    g.addColorStop(0, "#d4bb8e");
    g.addColorStop(0.22, "#fff4dc");
    g.addColorStop(0.55, "#efdcb4");
    g.addColorStop(1, "#a88a5c");
    return g;
  }

  function drawColumn(c, n) {
    const x = c.x, top = c.gapY, bot = c.gapY + c.gap, gt = groundTop();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#5e4630";
    // fustes
    ctx.fillStyle = columnGradient(x);
    ctx.fillRect(x, -4, COL_W, top - CAP_H + 4);
    ctx.strokeRect(x, -4, COL_W, top - CAP_H + 4);
    ctx.fillRect(x, bot + CAP_H, COL_W, gt - bot - CAP_H + 2);
    ctx.strokeRect(x, bot + CAP_H, COL_W, gt - bot - CAP_H + 2);
    // estrías
    ctx.strokeStyle = "rgba(120,90,55,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const fx of [14, 26, 40, 52]) {
      ctx.moveTo(x + fx, 0); ctx.lineTo(x + fx, top - CAP_H - 10);
      ctx.moveTo(x + fx, bot + CAP_H + 10); ctx.lineTo(x + fx, gt);
    }
    ctx.stroke();
    // capiteles en la boca del hueco
    drawCapital(x, top - CAP_H, true);
    drawCapital(x, bot, false);
    // de noche se oscurecen con el resto
    if (n > 0.05) {
      ctx.fillStyle = `rgba(20,26,62,${n * 0.5})`;
      ctx.fillRect(x - CAP_OUT - 1, -4, COL_W + CAP_OUT * 2 + 2, top + 2);
      ctx.fillRect(x - CAP_OUT - 1, bot - 1, COL_W + CAP_OUT * 2 + 2, gt - bot + 3);
    }
  }

  function drawCapital(x, y, isTop) {
    const w = COL_W + CAP_OUT * 2, cx = x - CAP_OUT;
    const g = ctx.createLinearGradient(cx, 0, cx + w, 0);
    g.addColorStop(0, "#c9ad7c");
    g.addColorStop(0.25, "#fff7e4");
    g.addColorStop(1, "#9c7f52");
    ctx.fillStyle = g;
    roundRect(cx, y, w, CAP_H, 4);
    ctx.fill();
    ctx.strokeStyle = "#5e4630";
    ctx.lineWidth = 2;
    ctx.stroke();
    // franja tricolor junto al fuste
    const by = isTop ? y - 9 : y + CAP_H;
    const cols3 = isTop ? ["#f7c600", "#1d4fa3", "#d52b1e"] : ["#d52b1e", "#1d4fa3", "#f7c600"];
    cols3.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + 1, by + i * 3, COL_W - 2, 3); });
    // moldura
    ctx.strokeStyle = "rgba(94,70,48,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 3, y + CAP_H / 2); ctx.lineTo(cx + w - 3, y + CAP_H / 2);
    ctx.stroke();
  }

  // Empanadilla venezolana: media luna de masa de maíz frita, dorada, con el
  // borde pellizcado y las burbujitas típicas de la fritura.
  function drawEmpanada(x, y, rot, size, glow) {
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
      const h = ctx.createRadialGradient(0, 2, 6, 0, 2, 34);
      h.addColorStop(0, "rgba(255,240,180,0.55)");
      h.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = h;
      ctx.beginPath(); ctx.arc(0, 2, 34, 0, Math.PI * 2); ctx.fill();
    }
    ctx.rotate(Math.sin(rot * 0.5) * 0.15);
    ctx.scale(size || 1, size || 1);
    const R = 19, cy = 6;
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
    ctx.strokeStyle = "#7a3d08";
    ctx.lineWidth = 2;
    ctx.stroke(body);
    ctx.fillStyle = "rgba(255,230,160,0.35)";
    ctx.beginPath(); ctx.ellipse(-2, cy - 7, 9, 5, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#b8600f";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, cy, R - 4, Math.PI + 0.08, -0.08); ctx.stroke();
    ctx.strokeStyle = "#8a440a";
    ctx.lineWidth = 1.3;
    for (let i = 0; i <= 10; i++) {
      const t = Math.PI + (Math.PI * i) / 10, c = Math.cos(t), sn = Math.sin(t);
      ctx.beginPath(); ctx.moveTo(c * (R - 4), cy + sn * (R - 4)); ctx.lineTo(c * (R - 0.5), cy + sn * (R - 0.5)); ctx.stroke();
    }
    for (const [dx, dy, r] of [[-8, -3, 1.6], [-3, -9, 1.2], [4, -5, 1.5], [9, -1, 1.1], [-11, 3, 1.1], [2, 1, 1.3], [7, -10, 1]]) {
      ctx.fillStyle = "rgba(150,70,10,0.55)";
      ctx.beginPath(); ctx.arc(dx, cy + dy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,240,190,0.7)";
      ctx.beginPath(); ctx.arc(dx - 0.5, cy + dy - 0.6, r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, cy, R - 7, Math.PI + 0.55, Math.PI + 1.15); ctx.stroke();
    ctx.restore();
  }

  // ---------- Personaje: el presidente con traje ----------
  const OL = "#2a1c14", SKIN = "#f0a86a", SKIN_D = "#d98b4e", HAIR = "#f6cf4e", HAIR_D = "#d9a92a";

  function drawPlayer(px, py, rot, flapPh, skin, scale, mood) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const sw = Math.sin(flapPh);
    const suitD = darken(skin.suit, 0.25);
    const trousers = skin.type === "golf" ? "#cbb88f" : darken(skin.suit, 0.15);

    // piernas
    for (const lx of [-5, 3]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 7.5;
      ctx.beginPath(); ctx.moveTo(lx, 12); ctx.lineTo(lx - 3, 22); ctx.stroke();
      ctx.strokeStyle = trousers; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(lx, 12); ctx.lineTo(lx - 3, 22); ctx.stroke();
      ctx.fillStyle = "#1c1c22";
      ctx.beginPath(); ctx.ellipse(lx - 1.5, 23.5, 4.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // brazo de atrás
    arm(-6, -1, -2.3 + sw * 0.9, suitD);
    // cuerpo
    const g = ctx.createLinearGradient(-12, -8, 12, 16);
    g.addColorStop(0, lighten(skin.suit, 0.2));
    g.addColorStop(1, darken(skin.suit, 0.15));
    ctx.fillStyle = g;
    roundRect(-12, -8, 24, 23, 8);
    ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    // camisa y corbata / pajarita / polo
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(0, skin.type === "golf" ? -2 : 4); ctx.closePath(); ctx.fill();
    if (skin.type === "tuxedo") {
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-6, -9); ctx.lineTo(-6, -3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(6, -9); ctx.lineTo(6, -3); ctx.closePath(); ctx.fill();
    } else if (skin.type === "golf") {
      ctx.strokeStyle = skin.tie; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-1, -3); ctx.moveTo(6, -8); ctx.lineTo(1, -3); ctx.stroke();
    } else {
      ctx.fillStyle = skin.tie;
      ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(2, -7); ctx.lineTo(3, 6); ctx.lineTo(0, 9); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = darken(skin.tie, 0.35); ctx.lineWidth = 1; ctx.stroke();
    }
    if (skin.type !== "golf") {
      ctx.strokeStyle = suitD; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-1, 5); ctx.moveTo(5, -8); ctx.lineTo(1, 5); ctx.stroke();
    }
    // brazo de delante
    arm(4, -1, -2.0 - sw * 0.9, skin.suit);

    // cabeza
    const hx = 3, hy = -19;
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(hx, hy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    // oreja
    ctx.fillStyle = SKIN_D;
    ctx.beginPath(); ctx.ellipse(hx - 9, hy + 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
    // mejilla
    ctx.fillStyle = "rgba(235,90,80,0.35)";
    ctx.beginPath(); ctx.ellipse(hx + 6, hy + 5, 3.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    // ojo
    if (mood === "dead") {
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx + 4, hy - 4); ctx.lineTo(hx + 10, hy + 1); ctx.moveTo(hx + 10, hy - 4); ctx.lineTo(hx + 4, hy + 1); ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(hx + 7, hy - 1.5, 3.8, 4.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.fillStyle = "#1d2a44";
      ctx.beginPath(); ctx.arc(hx + 8.3, hy - 1, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(hx + 9, hy - 2, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    // ceja
    ctx.strokeStyle = HAIR_D; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx + 3, hy - 7); ctx.lineTo(hx + 10, hy - 7.5); ctx.stroke();
    // nariz
    ctx.fillStyle = SKIN_D;
    ctx.beginPath(); ctx.ellipse(hx + 12.5, hy + 2, 2.6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    // boca: abierta al comer, sonrisa si no
    ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
    if (player.eatT > 0 && mood !== "dead") {
      ctx.fillStyle = "#7a2020";
      ctx.beginPath(); ctx.ellipse(hx + 8, hy + 7, 3.4, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (mood === "dead") {
      ctx.beginPath(); ctx.arc(hx + 8, hy + 9.5, 3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(hx + 7, hy + 4.5, 3.6, 0.25, Math.PI - 0.6); ctx.stroke();
    }
    // pelo rubio con tupé
    if (skin.type === "golf") {
      ctx.fillStyle = HAIR;
      ctx.beginPath(); ctx.ellipse(hx - 6, hy - 2, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = skin.cap;
      ctx.beginPath(); ctx.arc(hx, hy - 4, 13.5, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = darken(skin.cap, 0.2);
      ctx.beginPath(); ctx.ellipse(hx + 13, hy - 4.5, 9, 2.6, 0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.moveTo(hx - 12, hy + 2);
      ctx.quadraticCurveTo(hx - 15, hy - 12, hx - 2, hy - 15);
      ctx.quadraticCurveTo(hx + 12, hy - 19, hx + 17, hy - 9);
      ctx.quadraticCurveTo(hx + 9, hy - 11, hx + 3, hy - 8);
      ctx.quadraticCurveTo(hx - 4, hy - 6, hx - 7, hy + 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = HAIR_D; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 11); ctx.quadraticCurveTo(hx + 4, hy - 15, hx + 12, hy - 12); ctx.stroke();
    }
    ctx.restore();

    function arm(sx, sy, ang, color) {
      const ex = sx + Math.cos(ang) * 13, ey = sy + Math.sin(ang) * 13;
      ctx.strokeStyle = OL; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = SKIN;
      ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // ---------- Los personajes de la foto, con el mismo estilo ----------
  function drawChar(def, px, py, rot, flapPh, scale, mood) {
    if (def.kind === "human") drawHuman(def, px, py, rot, flapPh, scale, mood);
    else if (def.kind === "dog") drawDog(px, py, rot, flapPh, scale, mood);
    else drawPlayer(px, py, rot, flapPh, currentSkin(), scale, mood);
  }

  // Personas de la foto: cuerpo de dibujo animado y cara de frente (un poco
  // girada hacia donde vuela) con los rasgos de cada uno: forma de la cara,
  // cejas, ojos, labios, barba y peinado.
  function drawHuman(d, px, py, rot, flapPh, scale, mood) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const sw = Math.sin(flapPh);
    const hx = 3, hy = -22;
    const sway = Math.sin(flapPh * 0.5) * 1.2;
    const F = d.face, fx = hx + 1.5;
    const longHair = d.hairStyle === "longStraight" || d.hairStyle === "longWavy";

    // melena por detrás de la cabeza y los hombros
    if (longHair) {
      ctx.fillStyle = d.hairD;
      ctx.beginPath();
      ctx.moveTo(fx - F.rx - 4, hy - 2);
      ctx.quadraticCurveTo(fx - F.rx - 5, hy - F.ry - 4, fx, hy - F.ry - 4);
      ctx.quadraticCurveTo(fx + F.rx + 5, hy - F.ry - 4, fx + F.rx + 4, hy - 2);
      ctx.lineTo(fx + F.rx + 3 + sway, hy + 22);
      ctx.lineTo(fx - F.rx - 3 + sway, hy + 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    }

    // piernas (mallas o pantalón), calcetines y zapatillas
    for (const lx of [-5, 3]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 7.5;
      ctx.beginPath(); ctx.moveTo(lx, 12); ctx.lineTo(lx - 3, 22); ctx.stroke();
      ctx.strokeStyle = d.legs; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(lx, 12); ctx.lineTo(lx - 3, 22); ctx.stroke();
      if (d.socks) {
        ctx.strokeStyle = d.socks; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(lx - 2.6, 20.6); ctx.lineTo(lx - 3, 22); ctx.stroke();
      }
      ctx.fillStyle = d.shoes;
      ctx.beginPath(); ctx.ellipse(lx - 1.5, 23.5, 4.8, 2.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = d.shoeSole;
      ctx.fillRect(lx - 6, 25, 9, 1.4);
    }

    const sleeve = d.top === "tank" ? 0 : d.top === "polo" || d.top === "tee" ? 0.45 : 1;
    const light = d.topColor === "#f8f8f6" || d.topColor === "#fbfbfb";
    const topD = darken(d.topColor, light ? 0.12 : 0.3);
    humanArm(-6, -1, -2.3 + sw * 0.9, topD, sleeve, false);

    // tronco
    const g = ctx.createLinearGradient(-12, -8, 12, 16);
    g.addColorStop(0, lighten(d.topColor, 0.15));
    g.addColorStop(1, darken(d.topColor, 0.12));
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    if (d.top === "tank") {
      ctx.fillStyle = d.skin;
      roundRect(-11, -8, 22, 12, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-8, -8); ctx.lineTo(-5, -8); ctx.quadraticCurveTo(0, -1, 5, -8); ctx.lineTo(8, -8);
      ctx.lineTo(11, 0); ctx.lineTo(11, 12); ctx.quadraticCurveTo(11, 15, 8, 15);
      ctx.lineTo(-8, 15); ctx.quadraticCurveTo(-11, 15, -11, 12); ctx.lineTo(-11, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // el logo de la camiseta
      ctx.strokeStyle = "#8b8f96"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(3.5, 0.5); ctx.quadraticCurveTo(4.5, 2.5, 8, -0.5); ctx.stroke();
    } else {
      ctx.fillStyle = g;
      roundRect(-12, -8, 24, 23, 8); ctx.fill(); ctx.stroke();
    }
    if (d.top === "tee") {
      // camiseta de pico
      ctx.fillStyle = d.skin;
      ctx.beginPath(); ctx.moveTo(-5.5, -8); ctx.lineTo(5.5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = darken(d.topColor, 0.35); ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (d.top === "longsleeve") {
      // cuello alto con media cremallera
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(5, -9); ctx.lineTo(4, -5); ctx.lineTo(-4, -5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#c9c9c4"; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "#b5b5b0"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 2); ctx.stroke();
      ctx.fillStyle = "#9a9a95"; ctx.fillRect(-1, 1, 2, 2.5);
    } else if (d.top === "polo") {
      ctx.fillStyle = "#2c2c31";
      ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(0, -5); ctx.lineTo(-3, -1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(0, -5); ctx.lineTo(3, -1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#45454c"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 4); ctx.stroke();
      ctx.fillStyle = "#55555c";
      for (const by of [-2, 1.5]) { ctx.beginPath(); ctx.arc(0.8, by, 0.8, 0, Math.PI * 2); ctx.fill(); }
    } else if (d.top === "jacket") {
      // chaqueta de cremallera con cuello alto, camiseta negra debajo y bolsillos
      ctx.fillStyle = "#2a2b31";
      roundRect(-7, -11, 14, 6, 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#121215";
      ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(3, -11); ctx.lineTo(0, -7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#55565e"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-4, 4); ctx.moveTo(9, 6); ctx.lineTo(4, 4); ctx.stroke();
      ctx.fillStyle = "#2c2d33"; ctx.fillRect(-11, 11, 22, 3.5);
    }

    humanArm(4, -1, -2.0 - sw * 0.9, d.topColor, sleeve, !!d.watch);

    // cuello
    ctx.fillStyle = d.skinD;
    roundRect(hx - 4, hy + F.ry - 7, 9, 9, 3); ctx.fill();

    // orejas (las melenas las tapan)
    if (!longHair) {
      for (const [ex, s] of [[fx - F.rx - 0.5, 1], [fx + F.rx + 0.3, 0.8]]) {
        ctx.fillStyle = d.skin;
        ctx.beginPath(); ctx.ellipse(ex, hy + 1, 2.8 * s, 4.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = d.skinD;
        ctx.beginPath(); ctx.ellipse(ex, hy + 1, 1.2 * s, 2.3, 0, 0, Math.PI * 2); ctx.fill();
      }
    }

    // cara
    facePath(fx, hy, F.rx, F.ry, F.chin);
    const fg = ctx.createRadialGradient(fx + 3, hy - 3, 2, fx, hy, F.ry * 1.2);
    fg.addColorStop(0, lighten(d.skin, 0.12));
    fg.addColorStop(1, d.skin);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();

    // barba recortada por la forma de la cara
    const cx = fx + 1.5; // centro de los rasgos (la cara mira un poco a la derecha)
    if (d.beard) {
      const B = d.beard;
      ctx.save();
      facePath(fx, hy, F.rx, F.ry, F.chin);
      ctx.clip();
      ctx.globalAlpha = B.alpha;
      ctx.fillStyle = B.color;
      ctx.beginPath();
      ctx.moveTo(fx - F.rx - 2, hy + B.top - 5);
      ctx.lineTo(fx - F.rx + 1.5, hy + B.top - 5);
      ctx.quadraticCurveTo(fx - F.rx + 2, hy + B.top + 3, cx - 5, hy + B.top + 3);
      ctx.quadraticCurveTo(cx, hy + B.top + 1.5, cx + 5, hy + B.top + 3);
      ctx.quadraticCurveTo(fx + F.rx - 2, hy + B.top + 3, fx + F.rx - 1.5, hy + B.top - 5);
      ctx.lineTo(fx + F.rx + 2, hy + B.top - 5);
      ctx.lineTo(fx + F.rx + 2, hy + F.ry + 2);
      ctx.lineTo(fx - F.rx - 2, hy + F.ry + 2);
      ctx.closePath();
      ctx.fill();
      // bigote
      ctx.beginPath(); ctx.ellipse(cx, hy + 7.3, 5.2, 1.9, 0, 0, Math.PI * 2); ctx.fill();
      // textura de pelo
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = darken(B.color, 0.5);
      for (let i = 0; i < 18; i++) {
        const a = (i * 2.399) % (Math.PI * 2), r = 3 + (i * 7) % 9;
        ctx.fillRect(cx + Math.cos(a) * r - 0.4, hy + 11 + Math.sin(a) * r * 0.45, 0.8, 0.8);
      }
      ctx.restore();
      // el labio de abajo asoma por la barba
      ctx.fillStyle = darken(d.skin, 0.1);
      ctx.beginPath(); ctx.ellipse(cx, hy + 10.2, 3, 1.1, 0, 0, Math.PI * 2); ctx.fill();
    }

    // pecas
    if (d.freckles) {
      ctx.fillStyle = "rgba(170,95,60,0.55)";
      for (const [fx2, fy2] of [[-8, 3], [-6, 4.2], [-9, 5], [-5.5, 2.5], [6.5, 3], [8.5, 4.2], [6, 5], [9.5, 2.8], [0.5, 3.5], [2.5, 3]]) {
        ctx.beginPath(); ctx.arc(cx + fx2, hy + fy2, 0.45, 0, Math.PI * 2); ctx.fill();
      }
    }
    // colorete
    if (d.fem) {
      ctx.fillStyle = "rgba(235,110,110,0.25)";
      for (const bx of [cx - 7, cx + 7.5]) { ctx.beginPath(); ctx.ellipse(bx, hy + 4.5, 3, 1.8, 0, 0, Math.PI * 2); ctx.fill(); }
    }

    // ojos (el de la derecha, más cerca, un poco más grande)
    const ey = hy + 0.5;
    if (mood === "dead") {
      ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
      for (const ex of [cx - 5, cx + 5]) {
        ctx.beginPath(); ctx.moveTo(ex - 2.2, ey - 2.2); ctx.lineTo(ex + 2.2, ey + 2.2); ctx.moveTo(ex + 2.2, ey - 2.2); ctx.lineTo(ex - 2.2, ey + 2.2); ctx.stroke();
      }
    } else {
      for (const [ex, s] of [[cx - 5, 0.92], [cx + 5, 1]]) {
        const w = (d.fem ? 3.1 : 2.8) * s, h = (d.fem ? 2.5 : 2.1) * s;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(ex - w, ey);
        ctx.quadraticCurveTo(ex, ey - h * 1.6, ex + w, ey - 0.3);
        ctx.quadraticCurveTo(ex, ey + h * 1.1, ex - w, ey);
        ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = d.eye;
        ctx.beginPath(); ctx.arc(ex + 0.5, ey - 0.2, 2 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#120a06";
        ctx.beginPath(); ctx.arc(ex + 0.5, ey - 0.2, 1 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(ex + 1.2, ey - 1, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // párpado de arriba (y pestañas en ellas)
        ctx.strokeStyle = OL; ctx.lineWidth = d.fem ? 1.5 : 1.2;
        ctx.beginPath(); ctx.moveTo(ex - w, ey); ctx.quadraticCurveTo(ex, ey - h * 1.6, ex + w, ey - 0.3); ctx.stroke();
        if (d.fem) {
          ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(ex + w, ey - 0.3); ctx.lineTo(ex + w + 1.3, ey - 1.6); ctx.stroke();
        }
      }
    }

    // cejas
    const Br = d.brow;
    ctx.strokeStyle = Br.color; ctx.lineWidth = Br.w;
    for (const [bx, s] of [[cx - 5, -1], [cx + 5, 1]]) {
      ctx.beginPath();
      ctx.moveTo(bx - 3.2, ey - Br.y + (s < 0 ? 0.6 : 0.9));
      ctx.quadraticCurveTo(bx, ey - Br.y - Br.arch, bx + 3.4, ey - Br.y + (s < 0 ? 0.9 : 0.6));
      ctx.stroke();
    }

    // nariz vista un poco de lado
    ctx.strokeStyle = darken(d.skin, 0.22); ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, ey + 1);
    ctx.quadraticCurveTo(cx + 2.6, ey + 4.5, cx + 1.8, ey + d.nose);
    ctx.quadraticCurveTo(cx + 0.5, ey + d.nose + 0.8, cx - 1.2, ey + d.nose);
    ctx.stroke();

    // boca
    const my = hy + 9.3;
    if (player.eatT > 0 && mood !== "dead") {
      ctx.fillStyle = "#6e1d1d";
      ctx.beginPath(); ctx.ellipse(cx, my, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.3; ctx.stroke();
    } else if (mood === "dead") {
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, my + 2.5, 2.8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (d.smile === "teeth") {
      // sonrisa abierta enseñando los dientes
      ctx.fillStyle = d.lips;
      ctx.beginPath(); ctx.moveTo(cx - 4.2, my - 0.8); ctx.quadraticCurveTo(cx, my - 2.2, cx + 4.2, my - 0.8);
      ctx.quadraticCurveTo(cx, my + 4.2, cx - 4.2, my - 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.moveTo(cx - 3.3, my - 0.6); ctx.quadraticCurveTo(cx, my - 1.3, cx + 3.3, my - 0.6);
      ctx.quadraticCurveTo(cx, my + 1.6, cx - 3.3, my - 0.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = darken(d.lips, 0.35); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(cx - 4.2, my - 0.8); ctx.quadraticCurveTo(cx, my - 2.2, cx + 4.2, my - 0.8);
      ctx.quadraticCurveTo(cx, my + 4.2, cx - 4.2, my - 0.8); ctx.stroke();
    } else if (d.fem) {
      // labios cerrados con una sonrisa suave
      ctx.fillStyle = d.lips;
      ctx.beginPath(); ctx.moveTo(cx - 3.6, my); ctx.quadraticCurveTo(cx - 1.4, my - 1.8, cx, my - 1); ctx.quadraticCurveTo(cx + 1.4, my - 1.8, cx + 3.6, my);
      ctx.quadraticCurveTo(cx, my + 2.6, cx - 3.6, my); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = darken(d.lips, 0.35); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(cx - 3.8, my - 0.6); ctx.quadraticCurveTo(cx, my + 1.3, cx + 3.8, my - 0.6); ctx.stroke();
    } else {
      // sonrisa cerrada entre el bigote y la barba
      ctx.strokeStyle = "#4a2418"; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(cx - 3.2, my - 0.4); ctx.quadraticCurveTo(cx, my + (d.smile === "neutral" ? 0.6 : 1.4), cx + 3.2, my - 0.6); ctx.stroke();
    }

    // pelo por delante
    drawHairFront();
    ctx.restore();

    function drawHairFront() {
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
      const top = hy - F.ry - 3.5, L = fx - F.rx, R = fx + F.rx;
      const px0 = fx + d.part; // raya del pelo
      if (longHair) {
        const wavy = d.hairStyle === "longWavy";
        const hg = ctx.createLinearGradient(L, top, R, hy + 20);
        hg.addColorStop(0, wavy ? lighten(d.hair, 0.2) : d.hair);
        hg.addColorStop(1, wavy ? darken(d.hair, 0.1) : d.hairD);
        ctx.fillStyle = hg;
        ctx.beginPath();
        // por fuera: de abajo a la izquierda, por encima de la cabeza, a abajo a la derecha
        ctx.moveTo(L - 2 + sway, hy + 20);
        if (wavy) {
          ctx.quadraticCurveTo(L - 6 + sway, hy + 20, L - 3.5, hy + 13);
          ctx.quadraticCurveTo(L - 7, hy + 5, L - 4, hy - 2);
        } else {
          ctx.quadraticCurveTo(L - 4.5 + sway, hy + 12, L - 4, hy - 2);
        }
        ctx.quadraticCurveTo(L - 4, top, px0 - 1, top - 0.5);
        ctx.quadraticCurveTo(R + (wavy ? 6 : 4), top, R + 4, hy - 2);
        if (wavy) {
          ctx.quadraticCurveTo(R + 7.5, hy + 5, R + 4, hy + 13);
          ctx.quadraticCurveTo(R + 6.5 + sway, hy + 20, R + 2 + sway, hy + 20);
        } else {
          ctx.quadraticCurveTo(R + 4.5 + sway, hy + 12, R + 2.5 + sway, hy + 20);
        }
        ctx.lineTo(R - 3 + sway, hy + 20.5);
        // por dentro: sube pegado a la cara hasta la raya y baja por el otro lado
        ctx.quadraticCurveTo(R - 1, hy + 14, R - 0.5, hy + 4);
        ctx.quadraticCurveTo(R - 0.5, top + 6, px0 + 1, top + 3.2);
        ctx.quadraticCurveTo(px0 - 1.5, top + 5, L + 2.5, hy - 3);
        ctx.quadraticCurveTo(L + 0.5, hy + 4, L + 1, hy + 14);
        ctx.quadraticCurveTo(L + 1.5 + sway, hy + 22, L + 3 + sway, hy + 20.5);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // raíces más oscuras junto a la raya
        if (d.roots) {
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = d.roots; ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(px0 - 0.5, top + 0.5); ctx.quadraticCurveTo(L + 1, top + 2, L - 1, hy - 4);
          ctx.moveTo(px0 + 0.5, top + 0.5); ctx.quadraticCurveTo(R - 1, top + 2, R + 1, hy - 4);
          ctx.stroke();
          ctx.restore();
        }
        // mechones
        ctx.strokeStyle = wavy ? lighten(d.hair, 0.38) : lighten(d.hair, 0.18);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0 - 1, top + 1); ctx.quadraticCurveTo(L - 1, top + 3, L - 1.5, hy + 6);
        ctx.moveTo(px0 + 1, top + 1); ctx.quadraticCurveTo(R + 2, top + 3, R + 1.5, hy + 8);
        if (wavy) {
          ctx.moveTo(L - 2, hy + 10); ctx.quadraticCurveTo(L - 4.5, hy + 16, L - 1 + sway, hy + 17);
          ctx.moveTo(R + 2, hy + 10); ctx.quadraticCurveTo(R + 4.5, hy + 16, R + 1 + sway, hy + 17);
        } else {
          ctx.moveTo(L - 2, hy + 8); ctx.lineTo(L - 1 + sway, hy + 17);
          ctx.moveTo(R + 2, hy + 8); ctx.lineTo(R + 1 + sway, hy + 17);
        }
        ctx.stroke();
      } else if (d.hairStyle === "swept") {
        // pelo castaño peinado hacia atrás, raya al lado y un tupé que cae a la derecha
        ctx.fillStyle = d.hair;
        ctx.beginPath();
        ctx.moveTo(L - 0.5, hy + 1);
        ctx.quadraticCurveTo(L - 2.5, top - 1, px0 + 2, top - 2);
        ctx.quadraticCurveTo(R + 3.5, top - 1, R + 0.5, hy - 2);
        ctx.quadraticCurveTo(R - 1, hy - 6, R - 3, hy - 7.5);
        ctx.quadraticCurveTo(cx + 3, hy - 11.5, cx - 1, hy - 9.5);
        ctx.quadraticCurveTo(L + 3, hy - 9, L + 1.5, hy - 3);
        ctx.lineTo(L + 1, hy + 1);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = lighten(d.hair, 0.22); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0 - 2, top + 0.5); ctx.quadraticCurveTo(L - 0.5, top + 3, L + 0.5, hy - 3);
        ctx.moveTo(px0 + 1, top + 1); ctx.quadraticCurveTo(R, top + 2, R - 1, hy - 4);
        ctx.moveTo(px0 + 4, top + 3); ctx.quadraticCurveTo(cx + 6, hy - 10, R - 3, hy - 7);
        ctx.stroke();
        ctx.strokeStyle = d.hairD; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(px0, top); ctx.lineTo(px0 - 1, top + 4.5); ctx.stroke();
      } else {
        // rapado casi al cero con las entradas marcadas
        ctx.fillStyle = d.hair;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.moveTo(L - 0.8, hy + 2);
        ctx.quadraticCurveTo(L - 1.6, top + 2, fx, top + 1.5);
        ctx.quadraticCurveTo(R + 1.6, top + 2, R + 0.8, hy + 1);
        ctx.lineTo(R - 1, hy + 1);
        ctx.lineTo(R - 1.2, hy - 6);
        ctx.quadraticCurveTo(cx + 5, hy - 8.5, cx + 3.5, top + 5.5);
        ctx.quadraticCurveTo(cx, top + 4.2, cx - 3.5, top + 5.5);
        ctx.quadraticCurveTo(cx - 6, hy - 8.5, L + 1.2, hy - 6);
        ctx.lineTo(L + 1, hy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.6; ctx.stroke();
      }
    }

    function humanArm(sx, sy, ang, color, sleeveFrac, watch) {
      const ex = sx + Math.cos(ang) * 13, ey = sy + Math.sin(ang) * 13;
      const mx = sx + (ex - sx) * sleeveFrac, my = sy + (ey - sy) * sleeveFrac;
      ctx.strokeStyle = OL; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = d.skin; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      if (sleeveFrac > 0) {
        ctx.strokeStyle = color; ctx.lineWidth = 5.5;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.stroke();
      }
      if (watch) {
        const wx = sx + (ex - sx) * 0.8, wy = sy + (ey - sy) * 0.8;
        ctx.fillStyle = d.watch;
        ctx.beginPath(); ctx.arc(wx, wy, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.fillStyle = d.skin;
      ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // Óvalo de cara: ancho en la frente y más estrecho en la barbilla
  function facePath(cx, cy, rx, ry, chin) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.bezierCurveTo(cx + rx * 1.08, cy - ry, cx + rx * 1.04, cy + ry * 0.2, cx + rx * 0.8, cy + ry * 0.6);
    ctx.quadraticCurveTo(cx + rx * chin, cy + ry, cx, cy + ry);
    ctx.quadraticCurveTo(cx - rx * chin, cy + ry, cx - rx * 0.8, cy + ry * 0.6);
    ctx.bezierCurveTo(cx - rx * 1.04, cy + ry * 0.2, cx - rx * 1.08, cy - ry, cx, cy - ry);
    ctx.closePath();
  }

  // Pastor alemán: rema con las patas, mueve las orejas y la cola
  function drawDog(px, py, rot, flapPh, scale, mood) {
    const TAN = "#c98f4f", TAN_L = "#e2b277", BLACK = "#2b211b";
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const sw = Math.sin(flapPh);
    const wag = Math.sin(worldT * 14) * 0.35;

    // cola peluda
    ctx.save();
    ctx.translate(-14, 2);
    ctx.rotate(-0.5 + wag);
    ctx.fillStyle = BLACK;
    ctx.beginPath(); ctx.ellipse(-9, 0, 11, 4.5, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = TAN;
    ctx.beginPath(); ctx.ellipse(-17, 1.5, 3.5, 2.6, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // patas de atrás
    dogLeg(-9, 9, 1.9 + sw * 0.5, TAN);
    dogLeg(-4, 10, 1.7 - sw * 0.5, darken(TAN, 0.15));
    // pata delantera de atrás
    dogLeg(6, 8, 1.2 - sw * 0.9, darken(TAN, 0.15));

    // cuerpo con la manta negra en el lomo
    const g = ctx.createLinearGradient(0, -8, 0, 14);
    g.addColorStop(0, TAN_L); g.addColorStop(1, TAN);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-2, 3, 16, 10, -0.05, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.moveTo(-17, 1);
    ctx.quadraticCurveTo(-14, -8, -2, -7.5);
    ctx.quadraticCurveTo(9, -7, 12, -1);
    ctx.quadraticCurveTo(4, 3, -4, 3);
    ctx.quadraticCurveTo(-12, 4, -17, 1);
    ctx.closePath();
    ctx.fill();
    // pecho claro
    ctx.fillStyle = TAN_L;
    ctx.beginPath(); ctx.ellipse(9, 6, 5, 6, 0.3, 0, Math.PI * 2); ctx.fill();

    // pata delantera de delante
    dogLeg(9, 8, 1.0 + sw * 0.9, TAN);

    // cabeza
    const hx = 12, hy = -10;
    const earFlop = sw * 0.12;
    for (const [ex, tilt] of [[-5, -0.25], [3, 0.15]]) {
      ctx.save();
      ctx.translate(hx + ex, hy - 6);
      ctx.rotate(tilt + earFlop);
      ctx.fillStyle = BLACK;
      ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(0, -13); ctx.lineTo(5, 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = "#d9a06a";
      ctx.beginPath(); ctx.moveTo(-2.5, 0); ctx.lineTo(0, -8); ctx.lineTo(2.5, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = TAN;
    ctx.beginPath(); ctx.arc(hx, hy, 10.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    // frente oscura
    ctx.fillStyle = BLACK;
    ctx.beginPath(); ctx.ellipse(hx - 2, hy - 6, 7, 4, -0.2, Math.PI, Math.PI * 2.05); ctx.fill();
    // hocico negro
    ctx.fillStyle = TAN_L;
    ctx.beginPath(); ctx.ellipse(hx + 10, hy + 3, 8, 5.5, 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = BLACK;
    ctx.beginPath(); ctx.ellipse(hx + 12, hy, 6.5, 3.2, 0.05, Math.PI, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 17, hy + 1, 3, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath(); ctx.arc(hx + 16.4, hy, 0.9, 0, Math.PI * 2); ctx.fill();
    // boca abierta y lengua (más fuera al comer)
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 6); ctx.quadraticCurveTo(hx + 10, hy + 9, hx + 15, hy + 5); ctx.stroke();
    if (mood !== "dead") {
      const tl = player.eatT > 0 ? 9 : 6;
      ctx.fillStyle = "#ef6f8a";
      ctx.beginPath();
      ctx.moveTo(hx + 7, hy + 7);
      ctx.lineTo(hx + 7.5, hy + 7 + tl);
      ctx.quadraticCurveTo(hx + 10, hy + 10 + tl, hx + 12.5, hy + 7 + tl);
      ctx.lineTo(hx + 13, hy + 6.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b8455e"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 10, hy + 8); ctx.lineTo(hx + 10, hy + 5 + tl); ctx.stroke();
    }
    // ojo
    if (mood === "dead") {
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx + 1, hy - 4); ctx.lineTo(hx + 6, hy + 0.5); ctx.moveTo(hx + 6, hy - 4); ctx.lineTo(hx + 1, hy + 0.5); ctx.stroke();
    } else {
      ctx.fillStyle = "#3b2414";
      ctx.beginPath(); ctx.ellipse(hx + 4, hy - 2, 2.4, 2.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(hx + 4.8, hy - 3, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = TAN_L;
      ctx.beginPath(); ctx.arc(hx + 3, hy - 6.2, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    function dogLeg(sx, sy, ang, color) {
      const ex = sx + Math.cos(ang) * 11, ey = sy + Math.sin(ang) * 11;
      ctx.strokeStyle = OL; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = TAN_L;
      ctx.beginPath(); ctx.ellipse(ex, ey, 3.8, 3, ang, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }

  // ---------- Interfaz ----------
  function button(b, label, main) {
    const t = main ? ["#ffd23f", "#f59e0b", "#b45309"] : ["#ffffff", "#e7edf5", "#8a98ad"];
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(b.x, b.y + 7, b.w, b.h, 18); ctx.fill();
    ctx.fillStyle = t[2];
    roundRect(b.x, b.y + 5, b.w, b.h, 18); ctx.fill();
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, t[0]); g.addColorStop(1, t[1]);
    ctx.fillStyle = g;
    roundRect(b.x, b.y, b.w, b.h, 18); ctx.fill();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 3;
    roundRect(b.x, b.y, b.w, b.h + 5, 18); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    roundRect(b.x + 8, b.y + 5, b.w - 16, b.h * 0.32, 10); ctx.fill();
    text(label, b.x + b.w / 2, b.y + b.h / 2 + 2, main ? 30 : 24, main ? "#fff" : "#3b4a63", main ? "#7c3a0a" : null, 6);
  }

  function roundIcon(b, draw) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.arc(b.x, b.y + 3, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(b.x, b.y); draw(); ctx.restore();
  }

  function iconSound() {
    ctx.fillStyle = "#3b4a63";
    ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(-4, -4); ctx.lineTo(2, -10); ctx.lineTo(2, 10); ctx.lineTo(-4, 4); ctx.lineTo(-9, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#3b4a63"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
    if (soundOn) {
      ctx.beginPath(); ctx.arc(3, 0, 6, -0.9, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(3, 0, 10.5, -0.9, 0.9); ctx.stroke();
    } else {
      ctx.strokeStyle = "#d63a32";
      ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(14, 5); ctx.moveTo(14, -5); ctx.lineTo(6, 5); ctx.stroke();
    }
  }

  function iconTrophy() {
    ctx.fillStyle = "#f5b301"; ctx.strokeStyle = "#7c4a03"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, -10); ctx.lineTo(7, -1); ctx.quadraticCurveTo(0, 7, -7, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-9, -5, 4, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(9, -5, 4, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    ctx.fillRect(-2, 3, 4, 4);
    ctx.fillRect(-7, 7, 14, 4);
    ctx.strokeRect(-7, 7, 14, 4);
  }

  function card(x, y, w, h) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(x, y + 6, w, h, 22); ctx.fill();
    ctx.fillStyle = "#fff8ec";
    roundRect(x, y, w, h, 22); ctx.fill();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 3; ctx.stroke();
  }

  function title(y) {
    const bob = Math.sin(worldT * 2) * 3;
    ctx.save();
    ctx.translate(LW / 2, y + bob);
    ctx.rotate(-0.04);
    ctx.font = "64px " + FONT;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillText("ELS PANETS", 0, 7);
    ctx.strokeStyle = "#5a2a06"; ctx.lineWidth = 12;
    ctx.strokeText("ELS PANETS", 0, 0);
    const g = ctx.createLinearGradient(0, -28, 0, 28);
    g.addColorStop(0, "#fff3b0"); g.addColorStop(0.45, "#ffc93c"); g.addColorStop(1, "#f08a24");
    ctx.fillStyle = g;
    ctx.fillText("ELS PANETS", 0, 0);
    ctx.restore();
  }

  function drawLock(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, -4, 6, Math.PI, 0); ctx.stroke();
    roundRect(-9, -4, 18, 14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3b2414";
    ctx.beginPath(); ctx.arc(0, 2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawStart() {
    const u = ui();
    const def = CHARACTERS[viewIndex], open = charUnlocked(viewIndex);
    title(LH * 0.12);
    text("¡Vuela y cómete las empanadillas!", LW / 2, LH * 0.12 + 48, 19, "#fff", "#3b2414", 5);

    // personaje que se mira, en grande (bloqueado: apagado y con candado)
    ctx.globalAlpha = open ? 1 : 0.35;
    drawChar(def, player.x, player.y, 0, player.flap, 1.6);
    ctx.globalAlpha = 1;
    if (!open) drawLock(player.x, player.y - 6, 1.6);
    roundIcon(u.prev, () => chevron(-1));
    roundIcon(u.next, () => chevron(1));
    const ny = u.charY + 58;
    ctx.fillStyle = "rgba(40,24,12,0.55)";
    roundRect(LW / 2 - 110, ny - 15, 220, 30, 15); ctx.fill();
    text(open ? def.name : "LLEGA A " + def.unlock + " PUNTOS", LW / 2, ny + 1, 17, open ? "#fff" : "#ffd23f");

    const pulse = open ? 1 + Math.sin(worldT * 4) * 0.025 : 1;
    ctx.save();
    ctx.translate(LW / 2, u.play.y + u.play.h / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-LW / 2, -(u.play.y + u.play.h / 2));
    ctx.globalAlpha = open ? 1 : 0.5;
    button(u.play, open ? "JUGAR" : "BLOQUEADO", open);
    ctx.globalAlpha = 1;
    ctx.restore();

    // tarjeta de personajes (y trajes si es el presidente)
    const isPresi = def.id === "presi";
    card(LW / 2 - 140, u.cardY, 280, isPresi ? 152 : 100);
    text("PERSONAJES", LW / 2, u.cardY + 18, 15, "#8a5a2b");
    for (const c of u.portraits) {
      const cdef = CHARACTERS[c.i], cOpen = charUnlocked(c.i), viewing = c.i === viewIndex;
      ctx.fillStyle = viewing ? "#ffd23f" : "#efe4d0";
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = viewing ? "#b45309" : "#cdbb9c"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 1, 0, Math.PI * 2); ctx.clip();
      ctx.globalAlpha = cOpen ? 1 : 0.3;
      if (cdef.kind === "dog") drawDog(c.x - 10, c.y + 8, 0, 1, 0.85, "");
      else drawChar(cdef, c.x - 3, c.y + 14, 0, 1, 0.9, "");
      ctx.restore();
      if (!cOpen) {
        drawLock(c.x, c.y - 2, 0.75);
        text(String(cdef.unlock), c.x, c.y + c.r + 12, 13, "#9a8566");
      }
    }
    if (isPresi) {
      text("TRAJE", LW / 2, u.skins[0].y - 26, 13, "#8a5a2b");
      for (const s of u.skins) {
        const skin = SKINS[s.i], sOpen = skinUnlocked(s.i), sel = sOpen && s.i === skinIndex;
        ctx.fillStyle = sOpen ? skin.suit : "#e2d6bf";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = sel ? "#f59e0b" : "#cdbb9c"; ctx.lineWidth = sel ? 4 : 2; ctx.stroke();
        if (sOpen && skin.type !== "golf") {
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.moveTo(s.x - 5, s.y - s.r + 3); ctx.lineTo(s.x + 5, s.y - s.r + 3); ctx.lineTo(s.x, s.y + 3); ctx.closePath(); ctx.fill();
          ctx.fillStyle = skin.type === "tuxedo" ? "#111" : skin.tie;
          ctx.fillRect(s.x - 1.5, s.y - s.r + 5, 3, 10);
        } else if (sOpen) {
          ctx.fillStyle = skin.cap;
          ctx.beginPath(); ctx.arc(s.x, s.y, 7, Math.PI, 0); ctx.fill();
        } else {
          drawLock(s.x, s.y - 1, 0.55);
        }
      }
    }

    // mejor puntuación
    const by = u.cardY + (isPresi ? 152 : 100) + 32;
    ctx.fillStyle = "rgba(40,24,12,0.55)";
    roundRect(LW / 2 - 100, by - 18, 200, 36, 18); ctx.fill();
    ctx.save(); ctx.translate(LW / 2 - 76, by + 1); ctx.scale(0.8, 0.8); iconTrophy(); ctx.restore();
    text("MEJOR: " + best, LW / 2 + 8, by + 1, 20, "#fff");
    if (recordHolder && by + 36 < groundTop()) text("Récord de " + recordHolder, LW / 2, by + 32, 15, "#fff", "#3b2414", 4);
  }

  function chevron(dir) {
    ctx.strokeStyle = "#3b4a63"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(-3 * dir, -8); ctx.lineTo(5 * dir, 0); ctx.lineTo(-3 * dir, 8); ctx.stroke();
  }

  function drawReady() {
    drawScoreHud();
    text("¡PREPÁRATE!", LW / 2, LH * 0.22, 46, "#ffd23f", "#5a2a06", 10);
    text("Toca la pantalla para volar", LW / 2, LH * 0.22 + 44, 20, "#fff", "#3b2414", 5);
    // aviso de toque: dedo con ondas suaves
    const x = LW / 2 + 70, y = LH * 0.46, t = (worldT % 1.2) / 1.2;
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - t)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 10 + t * 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5;
    roundRect(x - 6, y - 4, 12, 30, 6); ctx.fill(); ctx.stroke();
    roundRect(x - 13, y + 14, 26, 24, 10); ctx.fill(); ctx.stroke();
    drawEmpanada(LW / 2 + 70, LH * 0.62, worldT * 3, 1, true);
    text("= +3", LW / 2 + 70, LH * 0.62 + 36, 18, "#fff", "#3b2414", 5);
  }

  function drawScoreHud() {
    const s = 1 + scorePop * 0.25;
    ctx.save();
    ctx.translate(LW / 2, 74);
    ctx.scale(s, s);
    text(String(score), 0, 0, 60, "#fff", "#2a1c14", 9);
    ctx.restore();
    // contador de empanadillas
    ctx.fillStyle = "rgba(40,24,12,0.5)";
    roundRect(LW / 2 - 42, 112, 84, 30, 15); ctx.fill();
    drawEmpanada(LW / 2 - 20, 124, 0, 0.62);
    text("x " + eaten, LW / 2 + 14, 128, 19, "#fff");
  }

  const MEDALS = [
    { min: 100, name: "DIAMANTE", c: ["#e0f7ff", "#7fd3f0", "#2a8bb5"] },
    { min: 50, name: "ORO", c: ["#fff3a8", "#f5c400", "#a87700"] },
    { min: 25, name: "PLATA", c: ["#ffffff", "#c9d1db", "#7b8796"] },
    { min: 10, name: "BRONCE", c: ["#ffd9b0", "#d98a46", "#8a4e1c"] },
  ];

  function drawMedal(x, y, m, appear) {
    const s = easeOut(appear);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (!m) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#cdbb9c"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      text("Llega", 0, -7, 14, "#b19c7c");
      text("a 10", 0, 11, 14, "#b19c7c");
      ctx.restore();
      return;
    }
    // cintas
    ctx.fillStyle = "#1d4fa3";
    ctx.beginPath(); ctx.moveTo(-18, 20); ctx.lineTo(-26, 50); ctx.lineTo(-14, 44); ctx.lineTo(-6, 54); ctx.lineTo(0, 26); ctx.fill();
    ctx.fillStyle = "#d52b1e";
    ctx.beginPath(); ctx.moveTo(18, 20); ctx.lineTo(26, 50); ctx.lineTo(14, 44); ctx.lineTo(6, 54); ctx.lineTo(0, 26); ctx.fill();
    const g = ctx.createRadialGradient(-10, -12, 4, 0, 0, 38);
    g.addColorStop(0, m.c[0]); g.addColorStop(0.6, m.c[1]); g.addColorStop(1, m.c[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = m.c[2]; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2; ctx.stroke();
    // estrella
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 7 : 16, a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawOver() {
    const u = ui(), t = stateT;
    const slide = (1 - easeOut(t / 0.45)) * (LH * 0.6);
    ctx.save();
    ctx.translate(0, slide);
    text("¡FIN DE LA PARTIDA!", LW / 2, u.overCard.y - 42, 36, "#ffd23f", "#5a2a06", 9);
    const c = u.overCard;
    card(c.x, c.y, c.w, c.h);
    const m = MEDALS.find((md) => score >= md.min);
    text("MEDALLA", c.x + 70, c.y + 30, 15, "#8a5a2b");
    drawMedal(c.x + 70, c.y + 96, m, clamp((t - 0.5) / 0.35, 0, 1));
    if (m) text(m.name, c.x + 70, c.y + 164, 16, "#8a5a2b");
    if (m && t > 0.5 && !medalPlayed) { medalPlayed = true; snd.medal(); }

    const shown = Math.round(score * clamp((t - 0.3) / 0.6, 0, 1));
    text("PUNTOS", c.x + 228, c.y + 30, 15, "#8a5a2b");
    text(String(shown), c.x + 228, c.y + 66, 44, "#3b2414");
    text("MEJOR", c.x + 228, c.y + 108, 15, "#8a5a2b");
    text(String(best), c.x + 228, c.y + 140, 32, "#3b2414");
    if (newBest && t > 0.9) {
      ctx.save();
      ctx.translate(c.x + 290, c.y + 104);
      ctx.rotate(0.25);
      ctx.fillStyle = "#d63a32";
      roundRect(-30, -12, 60, 24, 8); ctx.fill();
      text("¡NUEVO!", 0, 1, 14, "#fff");
      ctx.restore();
    }
    // empanadillas comidas
    ctx.fillStyle = "#f3e6cf";
    roundRect(c.x + 20, c.y + 186, c.w - 40, 38, 14); ctx.fill();
    drawEmpanada(c.x + 52, c.y + 202, 0, 0.75);
    text("Empanadillas comidas: " + eaten, c.x + 74, c.y + 206, 18, "#3b2414", null, 0, "left");

    const ready = worldT >= pressLockUntil;
    ctx.globalAlpha = ready ? 1 : 0.6;
    button(u.again, "OTRA VEZ", true);
    button(u.home, "INICIO", false);
    ctx.globalAlpha = 1;
    if (recordHolder) text("Récord de " + recordHolder, LW / 2, u.again.y + 92, 15, "#fff", "#3b2414", 4);
    ctx.restore();
  }

  function drawPause() {
    ctx.fillStyle = "rgba(10,14,30,0.55)";
    ctx.fillRect(0, 0, LW, LH);
    text("PAUSA", LW / 2, LH * 0.4, 56, "#fff", "#2a1c14", 10);
    text("Toca para seguir", LW / 2, LH * 0.4 + 50, 22, "#fff", "#2a1c14", 5);
  }

  // ---------- Bucle de dibujo ----------
  function render() {
    const inRun = state === STATE.PLAY || state === STATE.DYING || state === STATE.OVER || state === STATE.NAME || state === STATE.PAUSE;
    const pal = palette(inRun ? score : 0);
    drawSky(pal);
    drawClouds(pal);
    drawMountains(pal);
    drawCity(pal);
    drawHouses(pal);
    for (const c of cols) drawColumn(c, pal.night);
    for (const c of cols) {
      if (c.food && !c.eaten) drawEmpanada(c.x + COL_W / 2, c.gapY + c.gap / 2 + Math.sin(c.bob) * 5, c.bob, 1, true);
    }
    drawGround(pal);

    for (const pt of particles) {
      ctx.globalAlpha = clamp(pt.life / 0.5, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state !== STATE.START) {
      const dead = state === STATE.DYING || state === STATE.OVER || state === STATE.NAME;
      drawChar(selectedChar(), player.x, player.y, player.rot, player.flap, PLAYER_SCALE, dead ? "dead" : "");
    }
    for (const f of floaters) {
      ctx.globalAlpha = 1 - f.t / 0.9;
      text(f.txt, f.x, f.y - f.t * 40, 26, "#ffd23f", "#5a2a06", 6);
    }
    ctx.globalAlpha = 1;

    if (state === STATE.START) drawStart();
    else if (state === STATE.READY) drawReady();
    else if (state === STATE.PLAY || state === STATE.DYING) drawScoreHud();
    else if (state === STATE.OVER) drawOver();
    else if (state === STATE.PAUSE) { drawScoreHud(); drawPause(); }

    if (flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashT * 0.45})`;
      ctx.fillRect(0, 0, LW, LH);
    }
    const u = ui();
    if (state !== STATE.PLAY && state !== STATE.DYING) roundIcon(u.sound, iconSound);
    if (state === STATE.START || state === STATE.OVER) roundIcon(u.rank, iconTrophy);
  }

  // Para revisar los personajes en grande: ?hoja
  const SHEET = new URLSearchParams(location.search).has("hoja");
  function drawSheet() {
    ctx.fillStyle = "#9fd6ea"; ctx.fillRect(0, 0, LW, LH);
    CHARACTERS.forEach((c, i) => {
      const x = 100 + (i % 2) * 200, y = 130 + Math.floor(i / 2) * 230;
      drawChar(c, x, y, 0, player.flap, 3.3, "");
      text(c.name, x, y + 108, 16, "#3b2414");
    });
  }

  let last = 0, acc = 0;
  function loop(t) {
    const now = t / 1000;
    let dt = last ? now - last : 0;
    last = now;
    acc += Math.min(dt, 0.25);
    let n = 0;
    while (acc >= STEP && n < 40) { update(STEP); acc -= STEP; n++; }
    if (n === 40) acc = 0;
    if (SHEET) drawSheet(); else render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  // cuando llegue la letra del juego, se redibuja sola en el siguiente cuadro
  if (document.fonts && document.fonts.load) document.fonts.load("40px 'Lilita One'").catch(() => {});

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
