// Els Panets: los amigos vuelan por Caracas comiendo empanadillas venezolanas
// (nació como variante de MR Taco President). Rehecho entero el 31/10/2026:
// dibujo a la resolución real de la pantalla, escenario por capas, columnas
// coloniales, personaje nuevo, menús nuevos, «prepárate», medallas, música.
(function () {
  "use strict";

  // Listas fijas de números que usan los dibujos: se crean una vez, no en cada cuadro (16/11/2026).
  const NUMS_1 = [-1, 1];
  const NUMS_2 = [14, 26, 40, 52];
  const NUMS_3 = [12, 25, 41, 54];
  const NUMS_4 = [0, 1];
  const NUMS_5 = [[-6, -1], [-6, 1], [0, 0], [6, -1], [6, 1]];
  const NUMS_6 = [[-8, -3, 1.6], [-3, -9, 1.2], [4, -5, 1.5], [9, -1, 1.1], [-11, 3, 1.1], [2, 1, 1.3], [7, -10, 1]];
  const NUMS_7 = [[-1.6, 5], [1.6, 5], [0, 7.6], [-1.6, 3], [1.6, 3], [0, 9.8]];
  const NUMS_8 = [-0.7, -0.35, 0, 0.35, 0.7];
  const NUMS_9 = [[-7, -1, 2.4], [3, -3, 2], [6, 4, 2.6], [-3, 5, 1.8], [10, 0, 1.6]];
  const NUMS_10 = [[-5, 2], [1, 0], [5, -1], [-1, 6]];
  const NUMS_11 = [[-8, -4], [5, -2], [9, -5], [-2, -1]];
  const NUMS_12 = [[-5, -4], [2, -6], [6, -1], [-2, 1]];
  const NUMS_13 = [[-8, 7, 2.5], [3, 3, 3], [10, 8, 2], [-1, 9.5, 1.6], [9, -1, 1.5]];
  const NUMS_14 = [-3, 3];
  const NUMS_15 = [[-4, -5], [5, -4], [0, 4]];
  const NUMS_16 = [-5, 3];
  const NUMS_17 = [-2, 1.5];
  const NUMS_18 = [0, 4.5];
  const NUMS_19 = [[-8, 3], [-6, 4.2], [-9, 5], [-5.5, 2.5], [6.5, 3], [8.5, 4.2], [6, 5], [9.5, 2.8], [0.5, 3.5], [2.5, 3]];
  const NUMS_20 = [-1.5, 4.5];
  const NUMS_21 = [[-5, -0.25], [3, 0.15]];
  const NUMS_22 = [[6, 1], [11, 1.5], [9, 5], [13, -0.5]];
  const NUMS_23 = [-13, -7, -1];
  const NUMS_24 = [0.35, 0.6, 0.8];
  const NUMS_25 = [-7, -1, 5];

  // ---------- Pantalla ----------
  // Ancho lógico fijo (400) y alto según la forma de la pantalla, para llenar
  // el móvil sin bandas. Se dibuja a los píxeles reales: nada borroso.
  const LW = 400;
  let LH = 700;
  const GROUND_H = 96;
  const canvas = document.getElementById("game");
  const mainCtx = canvas.getContext("2d");
  let ctx = mainCtx; // se cambia un momento para pintar la zona nueva aparte
  const FONT = "'Lilita One', 'Arial Black', 'Segoe UI', sans-serif";

  // Las ayudas de prueba (?puntos, ?comidas, ?hora, ?hoja, ?prueba) solo valen en el ordenador.
  const LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const QS = new URLSearchParams(LOCAL ? location.search : "");

  // ---------- Guardado (con red de seguridad) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { if (sim) return; try { localStorage.setItem(k, String(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  let sim = false; // medición de la dificultad: sin sonido ni guardado
  // Avisos de lo que pasa en la partida (17/11/2026): los escucha progreso.js
  // (misiones, logros, estadísticas y álbum). En la medición no se avisa de nada.
  const listeners = {};
  function emit(ev, data) {
    if (sim) return;
    const l = listeners[ev];
    if (l) for (const f of l) { try { f(data); } catch (e) {} }
  }
  // 16/11/2026: las claves antiguas (tacoSuitFlap…, compartidas con MR Taco President)
  // se copian una vez a las propias (elsPanets…). Las antiguas se dejan como estaban.
  if (store.get("elsPanetsMigrado", null) === null) {
    for (const k of ["Music", "Best", "PlayerName", "RecordHolder", "Skin", "PlayerId"]) {
      const old = store.get("tacoSuitFlap" + k, null);
      if (old !== null && store.get("elsPanets" + k, null) === null) store.set("elsPanets" + k, old);
    }
    store.set("elsPanetsMigrado", "1");
  }
  const BEST_KEY = "elsPanetsBest";
  const NAME_KEY = "elsPanetsPlayerName";
  const HOLDER_KEY = "elsPanetsRecordHolder";
  const SKIN_KEY = "elsPanetsSkin";
  // Ajustes (16/11/2026)
  const MUSIC_KEY = "elsPanetsMusica", SFX_KEY = "elsPanetsEfectos", VIBRA_KEY = "elsPanetsVibracion";
  const FLASH_KEY = "elsPanetsDestellos", QUALITY_KEY = "elsPanetsCalidad", TUTORIAL_KEY = "elsPanetsTutorial";
  let lowQ = store.get(QUALITY_KEY, "alta") === "baja";       // calidad baja: menos resolución y sin adornos
  let softFlash = store.get(FLASH_KEY, "1") !== "0";          // «Reducir destellos», activado de serie

  function resize() {
    const vw = window.innerWidth || LW, vh = window.innerHeight || 700;
    // hasta 1000 de alto: los móviles 20:9 y más largos se llenan sin bandas a los lados
    LH = Math.round(Math.max(640, Math.min(1000, (LW * vh) / vw)));
    const scale = Math.min(vw / LW, vh / LH);
    const cssW = Math.floor(LW * scale), cssH = Math.floor(LH * scale);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    let dpr = window.devicePixelRatio || 1;
    if (lowQ) dpr = Math.min(dpr, 1.5);
    const maxPx = lowQ ? 700000 : 2600000; // tope de puntos del lienzo
    if (cssW * cssH * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (cssW * cssH));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const k = canvas.width / LW;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    offCv.width = canvas.width; offCv.height = canvas.height;
    offCtx.setTransform(k, 0, 0, k, 0, 0);
  }
  const offCv = document.createElement("canvas"), offCtx = offCv.getContext("2d");
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 100));
  resize();
  setTimeout(resize, 300);

  const groundTop = () => LH - GROUND_H;

  let best = Number(store.get(BEST_KEY, 0)) || 0;
  let recordHolder = store.get(HOLDER_KEY, null);
  // quien ya había jugado no necesita el tutorial
  if (best > 0 && store.get(TUTORIAL_KEY, null) === null) store.set(TUTORIAL_KEY, "1");

  // ---------- Sonido (todo sintetizado, sin archivos) ----------
  let actx = null, master = null, sfx = null, musicBus = null, noiseBuf = null;
  // música y efectos por separado (antes iban juntos: se respeta lo que hubiera)
  const oldSound = store.get("elsPanetsMusic", "1");
  let musicOn = store.get(MUSIC_KEY, oldSound) !== "0", sfxOn = store.get(SFX_KEY, oldSound) !== "0";
  let vibraOn = store.get(VIBRA_KEY, "1") !== "0";
  // 24/11/2026: volumen de 0 a 100 para música y efectos, ahorro de batería y fondo tranquilo
  const VOLM_KEY = "elsPanetsVolMusica", VOLS_KEY = "elsPanetsVolEfectos", SAVE_KEY = "elsPanetsAhorro", CALM_KEY = "elsPanetsCalma";
  const volOf = (k) => { const v = Number(store.get(k, 100)); return isNaN(v) ? 1 : Math.max(0, Math.min(1, v / 100)); };
  let musicVol = volOf(VOLM_KEY), sfxVol = volOf(VOLS_KEY);
  let saveOn = store.get(SAVE_KEY, "0") === "1";  // unas 30 imágenes por segundo
  let calmOn = store.get(CALM_KEY, "0") === "1";  // sin gente, coches ni pájaros por el fondo
  // el oído nota el volumen al cuadrado: así la barra se siente pareja
  const musicGain = () => (musicOn ? 0.12 * musicVol * musicVol : 0), sfxGain = () => (sfxOn ? 0.8 * sfxVol * sfxVol : 0);

  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 1;
      master.connect(actx.destination);
      sfx = actx.createGain();
      sfx.gain.value = sfxGain();
      sfx.connect(master);
      musicBus = actx.createGain();
      musicBus.gain.value = musicGain();
      musicBus.connect(master);
      noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  function tone(freq, dur, type, vol, glide, delay, dest) {
    if (!sfxOn || sim) return;
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
    if (!sfxOn || sim) return;
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
    point(k) { const f = Math.pow(2, Math.min(k || 0, 12) / 24); tone(1568 * f, 0.12, "sine", 0.1); tone(2093 * f, 0.16, "sine", 0.07, 0, 0.05); },
    hit() { tone(160, 0.28, "square", 0.12, -100); noise(0.25, 0.5, "lowpass", 900, 200); },
    fall() { tone(880, 0.55, "sine", 0.07, -560, 0.12); },
    click() { tone(660, 0.05, "triangle", 0.12); },
    record() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.16, 0, i * 0.09)); },
    medal() { [1319, 1568, 2093].forEach((f, i) => tone(f, 0.18, "sine", 0.08, 0, i * 0.07)); },
    // cámara: clic del obturador y el chasquido del espejo
    shutter() {
      noise(0.03, 0.7, "highpass", 3500);
      tone(2600, 0.03, "square", 0.05, 0, 0.01);
      noise(0.05, 0.5, "bandpass", 1600, 0, 0.08);
    },
    // vino: el corcho y unos glu-glu
    cork() {
      tone(520, 0.07, "sine", 0.25, -320);
      noise(0.04, 0.4, "bandpass", 1400);
      [0.13, 0.22, 0.31].forEach((d, i) => tone(300 - i * 40, 0.08, "sine", 0.18, -90, d));
    },
    // tequila: tapón y un ¡olé! de tres notas
    tequila() {
      tone(520, 0.07, "sine", 0.25, -320);
      [659, 880, 1175].forEach((f, i) => tone(f, 0.12, "triangle", 0.15, 0, 0.09 + i * 0.07));
    },
    // poder cogido: subida rápida de notas
    power() { [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.12, "sine", 0.12, 0, i * 0.05)); },
    // el escudo se rompe y te salva
    shieldPop() { noise(0.18, 0.45, "bandpass", 2200, 600); tone(988, 0.25, "triangle", 0.14, 400, 0.02); },
    // lugar nuevo
    place() { [784, 988, 1175].forEach((f, i) => tone(f, 0.3, "triangle", 0.1, 0, i * 0.12)); },
  };

  function setMusic(on) {
    musicOn = on;
    store.set(MUSIC_KEY, on ? "1" : "0");
    if (musicBus) musicBus.gain.setTargetAtTime(musicGain(), actx.currentTime, 0.04);
  }
  function setMusicVol(v) {
    musicVol = Math.max(0, Math.min(1, v));
    store.set(VOLM_KEY, Math.round(musicVol * 100));
    if (musicVol <= 0) { if (musicOn) setMusic(false); return; }
    if (!musicOn) { setMusic(true); startMusic(); }
    else if (musicBus) musicBus.gain.setTargetAtTime(musicGain(), actx.currentTime, 0.04);
  }
  function setSfxVol(v) {
    sfxVol = Math.max(0, Math.min(1, v));
    store.set(VOLS_KEY, Math.round(sfxVol * 100));
    if (sfxVol <= 0) { if (sfxOn) setSfx(false); return; }
    if (!sfxOn) setSfx(true);
    else if (sfx) sfx.gain.setTargetAtTime(sfxGain(), actx.currentTime, 0.04);
  }
  function setSfx(on) {
    sfxOn = on;
    store.set(SFX_KEY, on ? "1" : "0");
    if (sfx) sfx.gain.setTargetAtTime(sfxGain(), actx.currentTime, 0.04);
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

  // 17/11/2026: una música por lugar. La ciudad sigue con el joropo; la playa, merengue
  // suave; la montaña, vals; el pueblo, rumba; Barcelona, rumba catalana. Se cambia al
  // acabar el compás, sin cortes. En el fin de partida suena más baja.
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const STYLES = [null,
    { e: 0.12, bar: 8, prog: ["C", "C", "F", "G", "C", "F", "G", "C"], ch: { C: [[36, 43], [60, 64, 67]], G: [[43, 38], [59, 62, 65, 67]], F: [[41, 36], [57, 60, 65]] },
      bass: { 0: 0, 3: 1, 4: 0, 6: 1 }, strum: [0.13, 0, 0.09, 0.11, 0, 0.09, 0.11, 0.05], wave: "triangle", mvol: 0.09,
      mel: [72, 0, 76, 0, 79, 77, 76, 0, 74, 0, 72, 0, 76, 0, 0, 0, 77, 0, 81, 0, 79, 77, 76, 0, 74, 0, 79, 0, 77, 76, 74, 0,
        76, 0, 79, 0, 84, 0, 81, 79, 77, 0, 76, 0, 74, 72, 0, 0, 74, 76, 77, 79, 77, 0, 74, 0, 72, 0, 0, 67, 72, 0, 0, 0] },
    { e: 0.2, bar: 6, prog: ["G", "G", "D", "D", "C", "G", "D", "G"], ch: { G: [[43], [59, 62, 67]], D: [[38], [57, 62, 66]], C: [[36], [60, 64, 67]] },
      bass: { 0: 0 }, strum: [0, 0, 0.08, 0, 0.08, 0], wave: "sine", mvol: 0.12,
      mel: [74, 0, 0, 0, 71, 0, 79, 0, 0, 0, 78, 76, 74, 0, 0, 0, 69, 0, 72, 0, 74, 0, 72, 0, 72, 0, 0, 0, 76, 0, 74, 0, 71, 0, 67, 0,
        69, 0, 72, 0, 71, 69, 67, 0, 0, 0, 0, 0] },
    { e: 0.115, bar: 8, prog: ["Am", "G", "F", "E", "Am", "G", "F", "E"], ch: { Am: [[45, 40], [57, 60, 64]], G: [[43, 38], [55, 59, 62]], F: [[41, 36], [53, 57, 60]], E: [[40, 35], [52, 56, 59, 64]] },
      bass: { 0: 0, 3: 1, 6: 0 }, strum: [0.13, 0, 0.07, 0.11, 0, 0.11, 0.07, 0], wave: "triangle", mvol: 0.09,
      mel: [76, 0, 77, 76, 74, 0, 72, 0, 74, 0, 72, 71, 72, 0, 0, 0, 72, 0, 74, 72, 71, 0, 69, 0, 71, 0, 68, 0, 64, 0, 0, 0,
        69, 72, 76, 0, 77, 76, 74, 0, 74, 0, 79, 77, 76, 74, 72, 0, 72, 74, 72, 71, 69, 0, 0, 0, 68, 0, 71, 0, 76, 0, 0, 0] },
    { e: 0.11, bar: 8, prog: ["D", "Bm", "G", "A", "D", "Bm", "G", "A"], ch: { D: [[38, 45], [62, 66, 69]], Bm: [[47, 42], [59, 62, 66]], G: [[43, 38], [59, 62, 67]], A: [[45, 40], [61, 64, 69]] },
      bass: { 0: 0, 3: 1, 4: 0, 7: 1 }, strum: [0.12, 0, 0.09, 0.11, 0.05, 0.11, 0.09, 0], wave: "square", mvol: 0.055,
      mel: [74, 0, 78, 0, 81, 0, 78, 76, 74, 0, 71, 0, 74, 0, 0, 0, 71, 0, 74, 0, 79, 78, 76, 0, 76, 0, 78, 76, 73, 0, 0, 0,
        78, 0, 81, 0, 86, 0, 83, 81, 78, 0, 76, 0, 74, 0, 71, 0, 74, 76, 78, 79, 78, 0, 76, 0, 73, 0, 76, 0, 74, 0, 0, 0] },
  ];
  let musicStyle = 0;
  const styleBar = (st) => (st ? st.bar : 6);
  function musicTick() {
    if (!actx) return;
    const want = state === STATE.START || state === STATE.READY ? 0 : worldOn() ? MUNDO.ROUTE[placeTo].mus : placeTo;
    const mv = state === STATE.OVER || state === STATE.NAME ? 0.55 : 1;
    while (nextStep < actx.currentTime + 0.15) {
      // el estilo cambia solo al empezar un compás
      if (want !== musicStyle && step % styleBar(STYLES[musicStyle]) === 0) { musicStyle = want; step = 0; }
      const st = STYLES[musicStyle];
      if (!st) {
        const bar = Math.floor(step / 6) % PROG.length, pos = step % 6;
        const ch = CHORDS[PROG[bar]];
        if (musicOn) {
          if (pos === 0) musicNote(nextStep, ch.bass[0], E * 2.6, "triangle", 0.7 * mv);
          if (pos === 3) musicNote(nextStep, ch.bass[1], E * 2.2, "triangle", 0.5 * mv);
          if (STRUM[pos]) for (let i = 0; i < ch.notes.length; i++) musicNote(nextStep + i * 0.012, ch.notes[i], E * 1.3, "triangle", 0.16 * mv);
          const m = MELODY[step % MELODY.length];
          if (m) musicNote(nextStep, m, E * 1.6, "square", 0.08 * mv);
        }
        step++;
        nextStep += E;
      } else {
        const bar = Math.floor(step / st.bar) % st.prog.length, pos = step % st.bar, ch = st.ch[st.prog[bar]];
        if (musicOn) {
          const b = st.bass[pos];
          if (b != null && ch[0][b] != null) musicNote(nextStep, mtof(ch[0][b]), st.e * 2.2, "triangle", 0.62 * mv);
          const sv = st.strum[pos];
          if (sv) for (let i = 0; i < ch[1].length; i++) musicNote(nextStep + i * 0.012, mtof(ch[1][i]), st.e * 1.2, "triangle", sv * 1.15 * mv);
          const m = st.mel[step % st.mel.length];
          if (m) musicNote(nextStep, mtof(m), st.e * 1.7, st.wave, st.mvol * mv);
        }
        step++;
        nextStep += st.e;
      }
    }
  }

  function startMusic() {
    if (musicStarted || !audio()) return;
    musicStarted = true;
    nextStep = actx.currentTime + 0.1;
    setInterval(musicTick, 50);
  }

  function vibrate(p) { if (!vibraOn || sim) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

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

  const fontMemo = {};
  const fontOf = (size) => fontMemo[size] || (fontMemo[size] = size + "px " + FONT);
  function text(t, x, y, size, fill, stroke, sw, align) {
    ctx.font = fontOf(size);
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
  // El de salida es un tipo gris y sin nombre (31/10: sustituye al presidente); los demás se dibujan con el
  // mismo estilo y se desbloquean por la mejor puntuación.
  const CHARACTERS = [
    { id: "gris", name: "", unlock: 0, kind: "human",
      skin: "#c4c4c4", skinD: "#a6a6a6", hair: "#6f6f6f", hairD: "#555555", hairStyle: "swept", part: 0,
      face: { rx: 11.5, ry: 14.5, chin: 0.55 }, eye: "#7c7c7c", nose: 5.2, smile: "neutral",
      brow: { color: "#5e5e5e", w: 1.8, y: 4.2, arch: 0.3 },
      top: "plain", topColor: "#8e8e8e", legs: "#707070", shoes: "#5c5c5c", shoeSole: "#4a4a4a" },
    { id: "blanco", name: "MJ", unlock: 5, kind: "human", fem: true,
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
    { id: "maria", name: "MARÍA", unlock: 25, kind: "human", fem: true,
      skin: "#f1c6a4", skinD: "#d9a281", hair: "#c4a06a", hairD: "#6e5236", roots: "#6e5236", hairStyle: "longWavy", part: -1,
      face: { rx: 11.8, ry: 13.8, chin: 0.5 }, eye: "#6b6a3e", lips: "#c47a6e", smile: "soft", nose: 5, freckles: true,
      brow: { color: "#6e5236", w: 1.6, y: 4.6, arch: 1.5 },
      top: "tank", topColor: "#1e1b1f", noLogo: true, necklace: "#d9b45a", band: "#2a1c14",
      legs: "#e9e3d6", shoes: "#c9a27a", shoeSole: "#8a6a4a" },
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
    // 02/11/2026: Maykel (moreno, rizos arriba y lados cortos) y Pamela, que va detrás de su bebé
    { id: "maykel", name: "MAYKEL", unlock: 70, kind: "human",
      skin: "#a86f48", skinD: "#8a5534", hair: "#1c140f", hairD: "#0a0705", hairStyle: "goldCurls", part: 0,
      face: { rx: 10.8, ry: 14.6, chin: 0.5 }, eye: "#2a1a10", lips: "#9a5a48", nose: 5.2, smile: "teeth",
      brow: { color: "#120c08", w: 2.5, y: 4.0, arch: 0.6 },
      top: "thriller", topColor: "#c8102e", legs: "#b50f29", socks: "#ffffff", shoes: "#141414", shoeSole: "#000000" },
    { id: "pamela", name: "PAMELA", unlock: 80, kind: "human", fem: true, baby: true,
      skin: "#eec09c", skinD: "#d39d77", hair: "#4a2e1e", hairD: "#2b1810", hairStyle: "longWavy", part: -2,
      face: { rx: 11.4, ry: 13.8, chin: 0.46 }, eye: "#3f9a5a", lips: "#cf6f72", smile: "teeth", nose: 4.8,
      brow: { color: "#3a2416", w: 1.6, y: 4.5, arch: 1.5 },
      top: "tee", topColor: "#f29bb8", legs: "#3d4f73", shoes: "#ffffff", shoeSole: "#d8d8d8" },
  ];

  // ---------- Historia, objeto especial y ropa de cada uno (01/11/2026) ----------
  // special: cada 15 empanadillas sale ese objeto, que vale +5.
  // outfits: 4 conjuntos; se desbloquean con la mejor puntuación (OUTFIT_PTS).
  const HAT = (type, color) => ({ type, color });
  const EXTRA = {
    // el gris no tiene historia; Núria, María, Isidro y Pamela la tienen desde el 03/11/2026
    // 03/11/2026: el gris ya no tiene ropa; en su sitio va el botón de crear tu personaje
    gris: { outfits: [{ name: "Gris", look: {} }] },
    blanco: { story: "Fotógrafa: no se le escapa ni una foto.", power: "Cada 15 empanadillas: cámara, +5 y ¡foto!", special: "camara", outfits: [
      { name: "De blanco", look: {} },
      { name: "Fotógrafa", look: { top: "tee", topColor: "#2b2b30", hat: HAT("beret", "#b3262e") } },
      { name: "Vaquera", look: { top: "jacket", topColor: "#4a74a8", legs: "#2f3b52" } },
      { name: "De fiesta", look: { top: "tank", topColor: "#d6336c", noLogo: true, glasses: true, necklace: "#e8c45a" } },
    ] },
    deportista: { story: "Deportista de día, fiestera de noche.", power: "Cada 15 empanadillas: tequila, +5", special: "tequila", outfits: [
      { name: "Deportista", look: {} },
      { name: "Running", look: { topColor: "#ff6fa5", legs: "#2b2d42", hat: HAT("cap", "#ff6fa5") } },
      { name: "Mexicana", look: { top: "tee", topColor: "#2e8b57", hat: HAT("sombrero", "#e9c46a") } },
      { name: "De noche", look: { topColor: "#151518", noLogo: true, glasses: true, necklace: "#d9b45a", legs: "#3a1c2e" } },
    ] },
    nuria: { story: "Catalana de pura cepa: pa amb tomàquet para todo.", power: "Cada 15 empanadillas: pa amb tomàquet, +5", special: "patomaquet", outfits: [
      { name: "Camiseta verde", look: {} },
      { name: "Coleta y verano", look: { hairStyle: "ponytail", scrunchie: "#ff6fa5", top: "tank", topColor: "#ffd166", noLogo: true, glasses: true } },
      { name: "Moño e invierno", look: { hairStyle: "bun", top: "longsleeve", topColor: "#b23a48", legs: "#2b2d42" } },
      { name: "Pelirroja", look: { hair: "#c8642e", hairD: "#8a3d18", roots: null, top: "jacket", topColor: "#2f5d8a" } },
    ] },
    maria: { story: "Golosa: no perdona un postre.", power: "Cada 15 empanadillas: crema catalana, +5", special: "crema", outfits: [
      { name: "De negro", look: {} },
      { name: "Playa", look: { topColor: "#ffffff", glasses: true, hat: HAT("sunhat", "#e8d3a2") } },
      { name: "Coleta vaquera", look: { hairStyle: "ponytail", scrunchie: "#2a1c14", top: "jacket", topColor: "#5b7fae" } },
      { name: "Morena y moño", look: { hairStyle: "bun", hair: "#3a2a22", hairD: "#22170f", roots: null, top: "tee", topColor: "#f28cb1", necklace: null } },
    ] },
    polo: { story: "Le pierden el buen vino y las sobremesas.", power: "Cada 15 empanadillas: vino, +5", special: "vino", outfits: [
      { name: "Polo negro", look: {} },
      { name: "Polo blanco", look: { topColor: "#f4f4f2" } },
      { name: "Bodeguero", look: { topColor: "#7b1e3a", hat: HAT("beret", "#2a2a2e") } },
      { name: "Con gafas", look: { top: "jacket", topColor: "#3d4a5c", glasses: true } },
    ] },
    chaqueta: { story: "Dominicano: el mangú no falta en su mesa.", power: "Cada 15 empanadillas: mangú, +5", special: "mangu", outfits: [
      { name: "Chaqueta negra", look: {} },
      { name: "Con gorra", look: { top: "tee", topColor: "#f4f4f2", hat: HAT("cap", "#c0392b") } },
      { name: "Rizos y polo", look: { hairStyle: "curly", top: "polo", topColor: "#b8322f" } },
      { name: "Afeitado y gafas", look: { hairStyle: "swept", beard: null, topColor: "#2c4a3a", glasses: true } },
    ] },
    maykel: { story: "Ligón: cada dos por tres, novia nueva.", power: "Cada 5 empanadillas: novia nueva, +5", special: "novia", specialEvery: 5, outfits: [
      { name: "Thriller", look: {} },
      { name: "Rojo y azul", look: { top: "polo", topColor: "#a3123a", legs: "#14161c", socks: null, shoes: "#f4f4f4", shoeSole: "#d63a32" } },
      { name: "Chándal", look: { top: "jacket", topColor: "#ececec", legs: "#ececec", socks: null, shoes: "#f4f4f4", shoeSole: "#d63a32" } },
      { name: "Gorra y gafas", look: { top: "tee", topColor: "#111114", legs: "#14161c", socks: null, shoes: "#f4f4f4", shoeSole: "#d63a32", glasses: true, hat: HAT("cap", "#f2f2f2") } },
    ] },
    pamela: { story: "Mamá a la carrera: su hijo no para quieto.", power: "Cada 15 empanadillas: biberón, +5", special: "biberon", outfits: [
      { name: "Rosa", look: {} },
      { name: "Coleta", look: { hairStyle: "ponytail", scrunchie: "#3f9a5a", top: "tank", topColor: "#ffffff", noLogo: true } },
      { name: "Vaquera", look: { top: "jacket", topColor: "#5b7fae" } },
      { name: "Moño y gafas", look: { hairStyle: "bun", topColor: "#7ec8b0", glasses: true } },
    ] },
    perro: { story: "Pastor alemán: se come todo lo que vuela.", power: "Come de todo: jamón, queso, huevos…", outfits: [
      { name: "Al natural", look: {} },
      { name: "Pañuelo", look: { bandana: "#d63a32" } },
      { name: "Collar", look: { collar: "#2f6fd6" } },
      { name: "Gorra y gafas", look: { glasses: true, hat: HAT("cap", "#f2b134") } },
    ] },
  };
  for (const c of CHARACTERS) Object.assign(c, EXTRA[c.id]);

  // ---------- Los famosos de la zona Premium (23/11/2026, famosos.js) ----------
  // Van después de los amigos y antes de «tu personaje», que siempre es el último.
  // No dan ninguna ventaja al jugar: así el ranking sigue siendo justo cuando sean de pago.
  const FAMOSOS = (window.ElsPanetsFamosos && window.ElsPanetsFamosos.list) || [];
  for (const f of FAMOSOS) CHARACTERS.push(f);

  // ---------- Tu propio personaje (03/11/2026) ----------
  // Lo crea cada jugador y se guarda en su móvil al momento. No sale del móvil.
  const CUSTOM_BASE = { id: "propio", name: "", unlock: 0, kind: "human", custom: true,
    skin: "#c4c4c4", skinD: "#a6a6a6", hair: "#6f6f6f", hairD: "#555555", hairStyle: "swept", part: 0,
    face: { rx: 11.4, ry: 14.6, chin: 0.52 }, eye: "#7c7c7c", nose: 5.2, smile: "neutral",
    brow: { color: "#5e5e5e", w: 1.8, y: 4.3, arch: 0.6 },
    top: "tee", topColor: "#9a9a9a", legs: "#707070", shoes: "#5c5c5c", shoeSole: "#4a4a4a",
    outfits: [{ name: "El tuyo", look: {} }] };
  const CUSTOM_KEY = "elsPanetsPropio";
  const customDef = Object.assign({}, CUSTOM_BASE);
  CHARACTERS.push(customDef);
  let customChar = null; // { estado, name, look }
  try { customChar = JSON.parse(store.get(CUSTOM_KEY, "null")); } catch (e) { customChar = null; }
  // libre (aún no lo ha hecho) o aprobado (ya lo tiene guardado)
  function customState() {
    if (!customChar || !customChar.look || customChar.estado === "denegado") return "libre";
    return "aprobado";
  }
  const lookCache = new Map(); // personajes ya vestidos, para no crearlos en cada cuadro
  function applyCustom(data) {
    customChar = data || null;
    lookCache.clear();
    store.set(CUSTOM_KEY, JSON.stringify(customChar));
    for (const k of Object.keys(customDef)) delete customDef[k];
    Object.assign(customDef, CUSTOM_BASE);
    const ok = customState() === "aprobado";
    if (ok) Object.assign(customDef, customChar.look);
    customDef.name = ok ? String(customChar.name || "").toUpperCase() : "";
  }
  applyCustom(customChar);

  const OUTFIT_PTS = [0, 150, 300, 450]; // el triple que antes (03/11/2026)
  const outfitKey = (id) => "elsPanetsRopa_" + id;
  const outfitUnlocked = (i) => best >= OUTFIT_PTS[i];
  const outfitMem = {}; // la ropa elegida de cada uno, leída una sola vez
  function outfitIndex(def) {
    if (!(def.id in outfitMem)) outfitMem[def.id] = Number(store.get(outfitKey(def.id), 0)) || 0;
    const i = outfitMem[def.id];
    return def.outfits && def.outfits[i] && outfitUnlocked(i) ? i : 0;
  }
  function setOutfit(def, i) { outfitMem[def.id] = i; store.set(outfitKey(def.id), i); }
  // el personaje con su ropa puesta (la elegida, o la que se diga). No modificar lo que devuelve.
  function dressed(def, i) {
    const idx = i == null ? outfitIndex(def) : i, o = def.outfits && def.outfits[idx];
    if (!o) return def;
    const k = def.id + ":" + idx;
    let d = lookCache.get(k);
    if (!d) { d = Object.assign({}, def, o.look); lookCache.set(k, d); }
    return d;
  }
  // ---------- Hucha, premio diario, caja sorpresa y lo que llevas puesto (12/11/2026) ----------
  // Las empanadillas que comes van a la hucha aunque pierdas. Con la hucha se abren cajas
  // (estelas y gorros para todos los personajes). Cada día hay premio y la racha lo sube.
  const HUCHA_KEY = "elsPanetsHucha", OWN_KEY = "elsPanetsCosas", WEAR_KEY = "elsPanetsPuesto", DAILY_KEY = "elsPanetsDiario", PITY_KEY = "elsPanetsCajas";
  const BOX_COST = 50, PITY_EVERY = 10, DAILY = [10, 15, 20, 25, 30, 40, 50];
  const readJSON = (k) => { try { return JSON.parse(store.get(k, "{}")) || {}; } catch (e) { return {}; } };
  let hucha = Number(store.get(HUCHA_KEY, 0)) || 0;
  let owned = readJSON(OWN_KEY), wear = readJSON(WEAR_KEY);
  function addHucha(n) { hucha = Math.max(0, hucha + Math.round(n)); store.set(HUCHA_KEY, hucha); }
  const saveOwned = () => store.set(OWN_KEY, JSON.stringify(owned));
  // los famosos que ya tienes; hoy se consiguen con panets y más adelante podrán ser de pago
  const FAM_KEY = "elsPanetsFamosos";
  let famOwned = readJSON(FAM_KEY);
  function buyFamoso(id) {
    const f = FAMOSOS.find((x) => x.id === id);
    if (!f || famOwned[id] || hucha < f.price) return false;
    addHucha(-f.price);
    famOwned[id] = 1;
    store.set(FAM_KEY, JSON.stringify(famOwned));
    lookCache.clear();
    emit("famoso", { id });
    return true;
  }
  function setWear(kind, id) { if (id && !owned[id]) return; wear[kind] = id || null; store.set(WEAR_KEY, JSON.stringify(wear)); }
  const PRIZES = [
    ["e_burbujas", "estela", "Burbujas", 0], ["e_hojas", "estela", "Hojas", 0], ["e_corazones", "estela", "Corazones", 0],
    ["e_notas", "estela", "Notas musicales", 1], ["e_estrellas", "estela", "Estrellas", 1], ["e_copos", "estela", "Copos de nieve", 1], ["e_fuego", "estela", "Fuego", 1],
    ["e_arcoiris", "estela", "Arcoíris", 2], ["e_panets", "estela", "Panets", 2],
    ["g_fiesta", "gorro", "Gorro de fiesta", 0], ["g_flor", "gorro", "Flor", 0], ["g_cocinero", "gorro", "Gorro de cocinero", 0],
    ["g_cascos", "gorro", "Cascos", 1], ["g_orejas", "gorro", "Orejas de gato", 1], ["g_pirata", "gorro", "Sombrero pirata", 1], ["g_chistera", "gorro", "Chistera", 1], ["g_papanoel", "gorro", "Gorro de Papá Noel", 1],
    ["g_vikingo", "gorro", "Casco vikingo", 2], ["g_cuernos", "gorro", "Cuernos", 2], ["g_aureola", "gorro", "Aureola", 2],
    ["g_corona", "gorro", "Corona de la racha", 3],
  ].map(([id, kind, name, rar]) => ({ id, kind, name, rar }));
  const RARITY = [{ name: "Común", color: "#8a9bb0", w: 62 }, { name: "Rara", color: "#3b82f6", w: 30 }, { name: "Épica", color: "#a855f7", w: 8 }, { name: "Exclusiva", color: "#f5a300", w: 0 }];
  const HAT_COLORS = { fiesta: "#9b5de5", flor: "#ff6fa5", cocinero: "#ffffff", cascos: "#e63946", orejas: "#2a2a2e", pirata: "#1e1b1f", chistera: "#1e1b1f",
    papanoel: "#d62828", vikingo: "#9aa0a8", cuernos: "#d62828", aureola: "#ffd23f", corona: "#f5c400" };
  function pickRarity() {
    let r = Math.random() * 100;
    for (let i = 0; i < 3; i++) { if (r < RARITY[i].w) return i; r -= RARITY[i].w; }
    return 0;
  }
  // un premio cualquiera, solo para lo que pasa de largo en la ruleta
  function randomPrize() { const rar = pickRarity(), pool = PRIZES.filter((p) => p.rar === rar); return pool[Math.floor(Math.random() * pool.length)]; }
  // 16/11/2026: la caja no da repetidos hasta completar la colección, y cada 10 cajas
  // sin premio raro o épico, el siguiente lo es seguro. La exclusiva no sale en la caja.
  let pity = Number(store.get(PITY_KEY, 0)) || 0; // cajas abiertas desde el último raro o épico
  const leftOf = (rar) => PRIZES.filter((p) => p.rar === rar && !owned[p.id]);
  const boxComplete = () => !PRIZES.some((p) => p.rar < 3 && !owned[p.id]);
  // cuántas cajas faltan para el premio seguro (0: ya no quedan raros ni épicos)
  const boxSureIn = () => (leftOf(1).length || leftOf(2).length ? Math.max(1, PITY_EVERY - pity) : 0);
  // las probabilidades de verdad de la próxima caja: solo cuenta lo que falta por conseguir
  function boxOdds() {
    const sure = boxSureIn() === 1;
    const rows = [0, 1, 2].map((rar) => { const left = leftOf(rar).length; return { rar, left, w: left && !(sure && rar === 0) ? RARITY[rar].w : 0, pct: 0 }; });
    const tot = rows.reduce((s, r) => s + r.w, 0);
    for (const r of rows) r.pct = tot ? (r.w * 100) / tot : 0;
    return rows;
  }
  function rollBox() {
    if (hucha < BOX_COST || boxComplete()) return null;
    const odds = boxOdds().filter((o) => o.pct > 0);
    let r = Math.random() * 100, rar = odds[0].rar;
    for (const o of odds) { rar = o.rar; if (r < o.pct) break; r -= o.pct; }
    const pool = leftOf(rar), p = pool[Math.floor(Math.random() * pool.length)];
    addHucha(-BOX_COST);
    owned[p.id] = 1; saveOwned(); setWear(p.kind, p.id);
    pity = rar >= 1 ? 0 : pity + 1;
    store.set(PITY_KEY, pity);
    emit("caja", { id: p.id, rar });
    return { id: p.id };
  }
  const dayStr = (d) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  function dailyState() {
    const s = readJSON(DAILY_KEY), today = dayStr(new Date()), yest = dayStr(new Date(Date.now() - 864e5)), before = dayStr(new Date(Date.now() - 2 * 864e5));
    if (s.last === today) return { claimed: true, streak: s.streak || 1, idx: ((s.streak || 1) - 1) % 7 };
    // 21/11/2026: protector de racha gratis, una vez cada 7 días, si solo se ha saltado un día
    const saved = s.last === before && (s.streak || 0) > 1 && (!s.prot || Date.now() - s.prot >= 7 * 864e5);
    const streak = s.last === yest || saved ? (s.streak || 0) + 1 : 1;
    return { claimed: false, streak, idx: (streak - 1) % 7, saved, lost: !saved && s.last && s.last !== yest && (s.streak || 0) > 1 ? s.streak : 0 };
  }
  function claimDaily() {
    const st = dailyState();
    if (st.claimed) return null;
    let n = DAILY[st.idx], item = null;
    if (st.idx === 6) { if (!owned.g_corona) { owned.g_corona = 1; saveOwned(); setWear("gorro", "g_corona"); item = "g_corona"; } else n += 30; }
    addHucha(n);
    const old = readJSON(DAILY_KEY);
    store.set(DAILY_KEY, JSON.stringify({ last: dayStr(new Date()), streak: st.streak, prot: st.saved ? Date.now() : old.prot || 0 }));
    emit("diario", st.streak);
    return { n, item, streak: st.streak, idx: st.idx };
  }
  // el personaje con su ropa y, encima, el gorro de la caja si lleva uno
  function worn(def) {
    if (def.premium) return dressed(def); // los famosos van siempre con su ropa de verdad
    const d = dressed(def), g = wear.gorro && owned[wear.gorro] ? wear.gorro.slice(2) : null;
    if (!g) return d;
    const k = def.id + ":" + outfitIndex(def) + ":" + g;
    let w = lookCache.get(k);
    if (!w) { w = Object.assign({}, d, { hat: HAT(g, HAT_COLORS[g] || "#e63946") }); lookCache.set(k, w); }
    return w;
  }

  const CHAR_KEY = "elsPanetsCharacter";
  let charIndex = Math.max(0, CHARACTERS.findIndex((c) => c.id === store.get(CHAR_KEY, "gris")));
  let viewIndex = charIndex; // el que se está mirando en el inicio
  const charUnlocked = (i) => (CHARACTERS[i].premium ? !!famOwned[CHARACTERS[i].id] : CHARACTERS[i].custom ? customState() === "aprobado" : best >= CHARACTERS[i].unlock || friendFree(CHARACTERS[i].id));
  const selectedChar = () => (charUnlocked(charIndex) ? CHARACTERS[charIndex] : CHARACTERS[0]);
  // tu personaje solo sale en la fila cuando ya lo has creado; para crearlo está el botón del gris
  const customShown = () => customState() === "aprobado";
  const shownCount = () => CHARACTERS.length - (customShown() ? 0 : 1);
  function viewChar(i) {
    const n = shownCount();
    viewIndex = (i + n) % n;
    if (charUnlocked(viewIndex)) { charIndex = viewIndex; store.set(CHAR_KEY, CHARACTERS[viewIndex].id); }
  }

  // las flechas del inicio se saltan los famosos que aún no tienes
  function stepChar(dir) {
    const n = shownCount();
    let k = viewIndex;
    for (let t = 0; t < n; t++) { k = (k + dir + n) % n; if (!CHARACTERS[k].premium || famOwned[CHARACTERS[k].id]) break; }
    viewChar(k);
  }

  // ---------- Cielo: las horas del día ----------
  // La partida empieza a las 8 de la mañana y cada empanadilla adelanta el reloj
  // 6 minutos (10 empanadillas = 1 hora). El cielo pasa por las horas poco a poco.
  const START_HOUR = 8, MIN_PER_EMPANADA = 6;
  const SKY_HOURS = [
    { h: 0, top: [10, 14, 40], bottom: [34, 36, 78], mount: [24, 32, 58], city: [34, 40, 76], cloud: [70, 78, 120], night: 1 },
    { h: 5, top: [16, 22, 58], bottom: [52, 54, 104], mount: [32, 42, 72], city: [44, 50, 90], cloud: [96, 104, 146], night: 1 },
    { h: 6.5, top: [96, 104, 170], bottom: [250, 178, 150], mount: [100, 100, 128], city: [150, 130, 150], cloud: [255, 210, 200], night: 0.35 },
    { h: 8, top: [110, 180, 228], bottom: [220, 232, 230], mount: [84, 144, 132], city: [150, 180, 200], cloud: [255, 250, 245], night: 0 },
    { h: 12, top: [70, 170, 236], bottom: [190, 234, 246], mount: [80, 152, 128], city: [146, 188, 206], cloud: [255, 255, 255], night: 0 },
    { h: 16.5, top: [92, 176, 226], bottom: [230, 230, 200], mount: [96, 146, 120], city: [166, 180, 190], cloud: [255, 248, 232], night: 0 },
    { h: 19, top: [240, 120, 92], bottom: [255, 206, 140], mount: [142, 94, 112], city: [196, 128, 124], cloud: [255, 226, 206], night: 0.2 },
    { h: 20.5, top: [70, 50, 110], bottom: [200, 110, 120], mount: [62, 52, 86], city: [90, 70, 110], cloud: [160, 120, 160], night: 0.65 },
    { h: 22, top: [16, 22, 58], bottom: [52, 54, 104], mount: [32, 42, 72], city: [44, 50, 90], cloud: [96, 104, 146], night: 1 },
  ];
  const START_SKY = Number(QS.get("hora")) || START_HOUR;
  const hourFor = (n) => START_SKY + (n * MIN_PER_EMPANADA) / 60;
  let skyHour = START_SKY; // la hora que se ve, que va alcanzando a la del reloj sin saltos
  let palMemo = null, palHour = -99;
  function palette(hour) {
    const h = ((hour % 24) + 24) % 24;
    // la misma paleta vale mientras la hora casi no cambie (no se crea una en cada cuadro)
    if (palMemo && Math.abs(h - palHour) < 0.004) return palMemo;
    palHour = h;
    let i = SKY_HOURS.length - 1;
    while (i > 0 && SKY_HOURS[i].h > h) i--;
    const a = SKY_HOURS[i], b = SKY_HOURS[(i + 1) % SKY_HOURS.length];
    const span = ((b.h - a.h) + 24) % 24 || 24;
    const g = smooth(clamp((((h - a.h) + 24) % 24) / span, 0, 1));
    return palMemo = {
      top: lerpArr(a.top, b.top, g), bottom: lerpArr(a.bottom, b.bottom, g),
      mount: lerpArr(a.mount, b.mount, g), city: lerpArr(a.city, b.city, g),
      cloud: lerpArr(a.cloud, b.cloud, g), night: lerp(a.night, b.night, g), hour: h,
    };
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function clockText(hour) {
    const m = Math.floor((((hour % 24) + 24) % 24) * 60 + 0.001);
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
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
  // COUNT: la cuenta «3, 2, 1» al volver de la pausa
  const STATE = { START: 0, READY: 1, PLAY: 2, DYING: 3, OVER: 4, NAME: 5, PAUSE: 6, COUNT: 7, SEGUIR: 8 };
  // 21/11/2026: al chocar, una vez por partida, se puede seguir pagando con lo comido en ella
  // (como en MAGA Taco: no se toca la hucha). Solo en partidas normales.
  const SEGUIR_COST = 10, SEGUIR_SECS = 5;
  let continued = false;
  // aviso de descanso a la media hora de juego (Ajustes; de serie activado)
  const REST_KEY = "elsPanetsDescanso";
  let restOn = store.get(REST_KEY, "1") !== "0", playSecs = 0;
  const COUNT_STEP = 0.8;
  let state = STATE.START;
  let stateT = 0; // tiempo en el estado actual

  const GRAVITY = 1500, FLAP_V = -430, COL_W = 66, CAP_H = 22, CAP_OUT = 6, SPACING = 236;
  const PLAYER_SCALE = 1.2;
  const player = { x: LW / 2, y: 300, vy: 0, rot: 0, flap: 0, eatT: 0, hitR: 14 };
  // Para probar (solo en el ordenador): ?puntos=30 empieza con 30 puntos; ?hora=19 empieza el día a las 19:00
  const START_SCORE = Number(QS.get("puntos")) || 0;
  let cols = [], particles = [], floaters = [];
  let bites = [];          // empanadillas pequeñas de las filas de tres
  let nextGapY = null;     // la altura del hueco siguiente, decidida con una columna de adelanto
  let sinceLastRow = 0, tutStep = -1;
  let score = 0, eaten = 0, speed = 150, gap = 178, distToSpawn = 0, lastGapY = 0;
  let scroll = 0;          // distancia recorrida (para el fondo)
  let worldT = 0;          // reloj general
  let scorePop = 0, flashT = 0, newBest = false, medalPlayed = false;
  let pressLockUntil = 0;
  // Para probar (solo en el ordenador): ?comidas=24 empieza con 24 empanadillas (a una del objeto especial)
  const START_EATEN = Number(QS.get("comidas")) || 0;
  const SPECIAL_EVERY = 15;
  const SPECIALS = {
    vino: { label: "¡VINO!", colors: ["#7b1e3a", "#c2185b", "#ffd166"] },
    tequila: { label: "¡TEQUILA!", colors: ["#e8a93a", "#7cc243", "#ffffff"] },
    camara: { label: "¡FOTO!", colors: ["#ffffff", "#c7ccd4", "#ffd23f"] },
    novia: { label: "¡NOVIA NUEVA!", colors: ["#ff6fa5", "#ffd1e0", "#ffffff"] },
    // 03/11/2026: los que no tenían objeto
    patomaquet: { label: "¡PA AMB TOMÀQUET!", colors: ["#e85a4a", "#f3dcaa", "#f0d25a"] },
    crema: { label: "¡CREMA CATALANA!", colors: ["#f2c66a", "#d98f2e", "#ffffff"] },
    mangu: { label: "¡MANGÚ!", colors: ["#e9d27a", "#b0397a", "#ffffff"] },
    biberon: { label: "¡BIBERÓN!", colors: ["#5fb0e8", "#ffffff", "#ff8fb1"] },
  };
  const specialEvery = (ch) => ch.specialEvery || SPECIAL_EVERY;

  // ---------- Las novias de Maykel (02/11/2026) ----------
  // Cada una sale con piel, pelo, cara y ropa al azar; al cogerla vuela con él
  // hasta que llega la siguiente.
  const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
  const GIRL_SKINS = [["#f6d2b6", "#dfae8e"], ["#eec09c", "#d39d77"], ["#d9a07a", "#bd8058"], ["#b47a52", "#955c38"], ["#8a5a3c", "#6e4228"], ["#f2c8a8", "#d9a482"]];
  const GIRL_HAIRS = [["#2a1c14", "#140c08"], ["#5a3a22", "#3a2414"], ["#a8642e", "#7a4218"], ["#e8c67c", "#c99d55"], ["#c8642e", "#8a3d18"], ["#111111", "#000000"], ["#8a2c4c", "#5a1830"]];
  const GIRL_STYLES = ["longStraight", "longWavy", "ponytail", "bun", "curly"];
  const GIRL_TOPS = ["tee", "tank", "longsleeve", "jacket", "polo"];
  const GIRL_COLORS = ["#ff6fa5", "#e63946", "#ffd166", "#7ec8b0", "#5b7fae", "#9b5de5", "#ffffff", "#1e1b1f", "#f28c28", "#2e8b57"];
  const GIRL_EYES = ["#3f9a5a", "#4a2c18", "#2f6fa8", "#6b6a3e", "#2a1a10"];
  const GIRL_LIPS = ["#cf6f72", "#c9776d", "#b8324a", "#d98a8a", "#a8484e"];
  function randomGirl() {
    const [skin, skinD] = pickOf(GIRL_SKINS), [hair, hairD] = pickOf(GIRL_HAIRS);
    const g = { kind: "human", fem: true, skin, skinD, hair, hairD, hairStyle: pickOf(GIRL_STYLES), part: pickOf([-3, -1, 0, 2]),
      scrunchie: pickOf(GIRL_COLORS),
      face: { rx: 10.8 + Math.random() * 1.2, ry: 13.2 + Math.random() * 1.2, chin: 0.4 + Math.random() * 0.12 },
      eye: pickOf(GIRL_EYES), lips: pickOf(GIRL_LIPS), smile: pickOf(["soft", "teeth"]), nose: 4.6 + Math.random() * 0.6,
      freckles: Math.random() < 0.2,
      brow: { color: darken(hair, 0.3), w: 1.4 + Math.random() * 0.6, y: 4.5, arch: 1.2 + Math.random() * 0.5 },
      top: pickOf(GIRL_TOPS), topColor: pickOf(GIRL_COLORS), noLogo: true,
      legs: pickOf(["#3a4a66", "#1d1e23", "#e9e3d6", "#8e9198", "#5b7fae", "#3a1c2e"]),
      shoes: pickOf(["#ffffff", "#1d1e23", "#c9a27a", "#e63946"]), shoeSole: "#d0d0d0",
      glasses: Math.random() < 0.2, necklace: Math.random() < 0.35 ? "#d9b45a" : null };
    if (Math.random() < 0.25) g.hat = HAT(pickOf(["cap", "beret", "sunhat"]), pickOf(GIRL_COLORS));
    return g;
  }
  let girlfriend = null;           // la novia que vuela con Maykel ahora
  const previewGirl = randomGirl(); // la que se ve en la pantalla de Prepárate
  const DOG_FOODS = ["empanada", "jamon", "queso", "huevo", "salchicha", "pollo", "pizza", "hueso"];
  let pendingSpecial = false;
  // la foto de MJ: se copia la pantalla, sale un flash y la foto se va a la esquina
  let photoPending = false, photoT = -1, camFlash = 0, photoStamp = "";
  const photoCv = document.createElement("canvas");
  photoCv.width = photoCv.height = 300;

  // ---------- Poderes (01/11/2026) ----------
  // Salen de vez en cuando en el hueco de una columna, en lugar de la comida.
  const POWERS = {
    iman: { label: "¡IMÁN!", time: 6, colors: ["#e63946", "#d9dde3", "#ffd166"], halo: "255,120,120" },
    escudo: { label: "¡ESCUDO!", time: 0, colors: ["#7fd3f0", "#ffffff", "#2a8bb5"], halo: "120,210,255" },
    doble: { label: "¡PUNTOS x2!", time: 8, colors: ["#ffd23f", "#f59e0b", "#ffffff"], halo: "255,220,110" },
    mini: { label: "¡MINI!", time: 6, colors: ["#7ee08a", "#2fa64a", "#ffffff"], halo: "130,230,140" },
    // 17/11/2026: cuatro nuevos
    paraguas: { label: "¡PARAGUAS!", time: 6, colors: ["#b07cff", "#ffffff", "#ffd23f"], halo: "190,150,255" },
    lenta: { label: "¡CÁMARA LENTA!", time: 5, colors: ["#6ab7ff", "#ffffff", "#2a6fb5"], halo: "150,200,255" },
    corazon: { label: "¡VIDA EXTRA!", time: 0, colors: ["#ff4d6d", "#ffffff", "#ffb3c1"], halo: "255,120,150" },
    lluvia: { label: "¡LLUVIA DE PANETS!", time: 6, colors: ["#f2a93b", "#ffe2a0", "#c96d16"], halo: "255,200,120" },
  };
  // Mejoras de la tienda: cada nivel suma 1 segundo al poder (hasta 5 niveles)
  const UPG_KEY = "elsPanetsMejoras", UPGRADABLE = ["iman", "doble", "mini", "paraguas", "lenta", "lluvia"];
  const UPGRADE_COSTS = [40, 80, 150, 250, 400];
  let upgrades = readJSON(UPG_KEY);
  // Habilidad suave de cada personaje (17/11/2026)
  const ABILITIES = {
    gris: "Suerte de principiante: empieza cada partida con una vida extra",
    blanco: "Sus fotos valen 2 puntos más",
    deportista: "Deportista: aletea un poco más fuerte",
    nuria: "El imán le dura 1 segundo más",
    maria: "Encuentra más empanadillas doradas",
    polo: "Los puntos x2 le duran 2 segundos más",
    chaqueta: "Su racha da puntos desde la 4.ª empanadilla",
    perro: "Olfato: la comida cercana va hacia él",
    maykel: "El mini le dura 2 segundos más",
    pamela: "El paraguas le dura 2 segundos más",
    propio: "Ahorrador: 10 % más de panets en la hucha",
  };
  const abil = () => selectedChar().id;
  const ABIL_TIME = { nuria: ["iman", 1], polo: ["doble", 2], maykel: ["mini", 2], pamela: ["paraguas", 2] };
  const powerTime = (k) => { const a = ABIL_TIME[abil()]; return POWERS[k].time + (upgrades[k] || 0) + (a && a[0] === k ? a[1] : 0); };
  function buyUpgrade(k) {
    const lv = upgrades[k] || 0;
    if (!UPGRADABLE.includes(k) || lv >= UPGRADE_COSTS.length || hucha < UPGRADE_COSTS[lv]) return false;
    addHucha(-UPGRADE_COSTS[lv]);
    upgrades[k] = lv + 1;
    store.set(UPG_KEY, JSON.stringify(upgrades));
    emit("mejora", k);
    return true;
  }
  // Poder de salida: se compra para la próxima partida y se gasta al empezarla
  const START_KEY = "elsPanetsSalida", START_COSTS = { escudo: 20, iman: 20, doble: 30, corazon: 40 };
  function buyStartPower(k) {
    if (!START_COSTS[k] || store.get(START_KEY, "") || hucha < START_COSTS[k]) return false;
    addHucha(-START_COSTS[k]);
    store.set(START_KEY, k);
    return true;
  }
  let lives = 0; // vidas extra (corazones), como mucho 2
  // racha: comer seguidas sin dejarse ninguna; desde 5, cada empanadilla da 1 punto más
  let combo = 0, runMaxCombo = 0, runPowers = 0, runPlaces = 0;
  function gainCombo() {
    combo++;
    if (combo > runMaxCombo) runMaxCombo = combo;
    if (combo >= 5 && combo % 5 === 0) floaters.push({ x: Math.max(player.x + 30, 90), y: player.y - 62, txt: "¡RACHA x" + combo + "!", t: 0, size: 20, color: "#ffe066" });
    return combo >= (abil() === "chaqueta" ? 4 : 5) ? 1 : 0;
  }
  const POWER_MIN_SCORE = 5, POWER_GAP_COLS = 6, POWER_CHANCE = 0.22;
  let powerT = {}, shield = false, shieldSafe = 0, sinceLastPower = 0, miniK = 1;
  const powerOn = (k) => (powerT[k] || 0) > 0;
  const isPower = (kind) => kind && kind.startsWith("p_");

  // ---------- Lugares: cambian cada 40 puntos (01/11/2026) ----------
  const PLACES = [
    { name: "LA CIUDAD", grass: "#5cb85c", grass2: "#3f8f44", tile: "#e6d6b8", line: "#d2c09f", curb: "#bdb3a2", road: "#4a4f5a" },
    { name: "LA PLAYA", grass: "#e9cf8f", grass2: "#d7b874", tile: "#f3e3b6", line: "#e4cf98", curb: "#d9c391", road: "#3f7fa6" },
    { name: "LA MONTAÑA", grass: "#6cbf5a", grass2: "#4a9a3f", tile: "#b8946a", line: "#a2805a", curb: "#8a7457", road: "#55703f" },
    { name: "EL PUEBLO", grass: "#8fc46a", grass2: "#6aa04d", tile: "#d8cfbf", line: "#bfb4a1", curb: "#c4a483", road: "#8a6f55" },
    // 17/11/2026: quinto lugar, con su acera de panot
    { name: "BARCELONA", grass: "#7fb85e", grass2: "#5c9a46", tile: "#cdc8bf", line: "#b3ada2", curb: "#a8a196", road: "#56575d", panot: true },
  ];
  // 25/11/2026: cada 50 puntos, y en las partidas normales es la vuelta al mundo (mundo.js);
  // la historia sigue con sus cinco lugares de siempre.
  const PLACE_EVERY = 50;
  const MUNDO = window.ElsPanetsMundo || null;
  const worldOn = () => !!MUNDO && !level;
  const nPlaces = () => (worldOn() ? MUNDO.ROUTE.length : PLACES.length);
  const placeDef = (i) => (worldOn() ? MUNDO.ROUTE[i] : PLACES[i]);
  const groundOf = (i) => (worldOn() ? MUNDO.ROUTE[i].g : PLACES[i]);
  let placeFrom = 0, placeTo = 0, placeT = 1, placeBanner = 0;

  // ---------- La sombra de tu mejor partida (03/11/2026, la activa el admin) ----------
  // Se guarda por dónde ibas (la altura, 30 veces por segundo) en tu récord y
  // en la siguiente partida vuela a tu lado, en transparente.
  const GHOST_KEY = "elsPanetsSombra", GHOST_MAX = 30 * 300;
  let ghost = null, ghostRec = [], runT = 0;
  try { ghost = JSON.parse(store.get(GHOST_KEY, "null")); } catch (e) { ghost = null; }
  const adminConfig = () => (window.TacoLeaderboard && window.TacoLeaderboard.getConfig && window.TacoLeaderboard.getConfig()) || {};
  // ---------- Partida en directo (17/11/2026) ----------
  // El rival juega a la vez en su móvil: llegan sus alturas (30 por segundo, en tandas)
  // y se dibuja un poco por detrás (LIVE_DELAY) para que se mueva suave aunque la red tiemble.
  const LIVE_DELAY = 8;
  let liveAt = 0; // hora (Date.now) en que arranca la partida en directo
  function liveFeed(d) {
    if (!rival || !rival.live || !d) return;
    if (d.y && d.y.length) {
      const ys = rival.y, i = Math.max(0, d.i | 0);
      // si se perdió alguna tanda, se rellena en línea recta
      if (i > ys.length && ys.length) { const a = ys[ys.length - 1], from = ys.length; for (let k = from; k < i; k++) ys[k] = a + (d.y[0] - a) * (k - from + 1) / (i - from + 1); }
      for (let k = 0; k < d.y.length; k++) if (i + k <= ys.length) ys[i + k] = d.y[k];
      if (ys.length > rival.n) { rival.n = ys.length; rival.recvAt = Date.now(); }
    }
    if (d.s != null) rival.score = d.s;
    if (d.dead) rival.dead = true;
    if (d.gone) { rival.gone = true; rival.dead = true; }
  }
  function stepLiveRival(dt) {
    if (!rival || !rival.live || rival.n < 2) return;
    const last = rival.n - 1, tgt = Math.min(last, last - LIVE_DELAY + (Date.now() - rival.recvAt) * 0.03);
    if (rival.di == null || Math.abs(tgt - rival.di) > 45) rival.di = Math.max(0, tgt);
    else rival.di = Math.min(last, rival.di + dt * 30 + (tgt - rival.di) * Math.min(1, dt * 3));
    if (rival.dead && rival.di >= last - 0.01) rival.fade = Math.max(0, rival.fade - dt * 1.2);
  }
  function liveRivalY() {
    if (!rival || !rival.live || rival.n < 2 || rival.di == null) return null;
    const i0 = Math.floor(rival.di), fr = rival.di - i0, ys = rival.y;
    return ys[i0] + ((ys[Math.min(i0 + 1, rival.n - 1)] - ys[i0]) || 0) * fr;
  }
  function drawLiveRival() {
    if (state !== STATE.PLAY && state !== STATE.DYING) return;
    if (rival.fade <= 0) return;
    const y = liveRivalY();
    if (y == null) return;
    const def = CHARACTERS[rival.ci] && !CHARACTERS[rival.ci].custom ? CHARACTERS[rival.ci] : CHARACTERS[0];
    ctx.save(); ctx.globalAlpha = 0.5 * rival.fade;
    drawChar(dressed(def), player.x, y, 0, worldT * 8, PLAYER_SCALE, "");
    ctx.globalAlpha = 0.9 * rival.fade;
    text(rival.name || "Rival", player.x, y - 48, 14, "#fff", "#3b2414", 4);
    ctx.restore();
  }
  // marcador del rival, debajo del contador de empanadillas
  function drawLiveHud() {
    const ahead = rival.score > score, t = (rival.gone ? rival.name + " se ha ido" : rival.name + ": " + rival.score + (rival.dead ? " (ha caído)" : ""));
    ctx.font = "16px " + FONT;
    const w = Math.min(LW - 40, ctx.measureText(t).width + 30);
    ctx.fillStyle = "rgba(40,24,12,0.5)";
    roundRect(LW / 2 - w / 2, 158, w, 26, 13); ctx.fill();
    text(t, LW / 2, 172, 16, ahead && !rival.dead ? "#ffd23f" : "#fff");
  }
  function drawLiveReady() {
    drawScoreHud();
    text("¡EN DIRECTO!", LW / 2, LH * 0.22, 44, "#ffd23f", "#5a2a06", 10);
    text("contra " + ((rival && rival.name) || "tu amigo"), LW / 2, LH * 0.22 + 42, 22, "#fff", "#3b2414", 5);
    const left = (liveAt - Date.now()) / 1000;
    if (left > 0) {
      const n = Math.ceil(left), f = 1 - (left - (n - 1));
      ctx.save();
      ctx.globalAlpha = Math.min(clamp(f / 0.2, 0, 1), clamp((1 - f) / 0.3, 0, 1));
      ctx.translate(LW / 2, LH * 0.46);
      const sc = 1.08 - 0.08 * easeOut(f); ctx.scale(sc, sc);
      text(String(Math.min(9, n)), 0, 0, 96, "#fff", "#2a1c14", 12);
      ctx.restore();
    }
    text("Salís los dos a la vez", LW / 2, LH * 0.46 + 78, 20, "#fff", "#2a1c14", 5);
  }
  function startLive(seed, rv, at) {
    if (state !== STATE.START && state !== STATE.OVER && state !== STATE.READY) return false;
    level = null; levelResult = null;
    runMode = "directo"; nextSeed = seed >>> 0; liveAt = at;
    rival = Object.assign({ live: true, name: "Rival", ci: 0, y: [], n: 0, recvAt: 0, di: null, score: 0, dead: false, gone: false, fade: 1 }, rv || {});
    resetRun();
    loadRanking();
    tutStep = -1;
    setState(STATE.READY);
    return true;
  }

  function drawGhost() {
    if (rival && rival.live) { drawLiveRival(); return; }
    // el fantasma del rival (reto del día o de un amigo), con su nombre encima
    if (rival && rival.y && rival.y.length && (state === STATE.PLAY || state === STATE.DYING || state === STATE.PAUSE || state === STATE.COUNT)) {
      const i = Math.floor(runT * 30), fade = i < rival.y.length ? 1 : Math.max(0, 1 - (i - rival.y.length) / 20);
      if (fade > 0) {
        const y = rival.y[Math.min(i, rival.y.length - 1)];
        ctx.save(); ctx.globalAlpha = 0.35 * fade;
        drawChar(dressed(CHARACTERS[0]), player.x, y, 0, worldT * 8, PLAYER_SCALE, "");
        ctx.globalAlpha = 0.8 * fade;
        text(rival.name || "Rival", player.x, y - 48, 14, "#fff", "#3b2414", 4);
        ctx.restore();
      }
    }
    if (!ghost || !ghost.length || !adminConfig().sombra || rival) return;
    if (state !== STATE.PLAY && state !== STATE.DYING && state !== STATE.PAUSE && state !== STATE.COUNT) return;
    const i = Math.floor(runT * 30);
    const fade = i < ghost.length ? 1 : Math.max(0, 1 - (i - ghost.length) / 20);
    if (fade <= 0) return;
    const y = ghost[Math.min(i, ghost.length - 1)];
    ctx.save();
    ctx.globalAlpha = 0.3 * fade;
    drawChar(worn(selectedChar()), player.x, y, 0, worldT * 8, PLAYER_SCALE, "");
    ctx.restore();
  }

  function setState(s) { state = s; stateT = 0; document.body.classList.toggle("enJuego", s !== STATE.START); syncGuard(); }

  // ---------- Dificultad (16/11/2026) ----------
  // Sube poco a poco hasta los 400 puntos (antes se paraba en 100). Al llegar a cada
  // lugar nuevo (cada 40 puntos, desde los 80) hay un tramo de respiro: el hueco se
  // abre y se va algo más despacio durante unos puntos.
  function restAt(s) {
    if (s < 80) return 0;
    const p = s % PLACE_EVERY;
    return p < 8 ? 1 : p < 14 ? 1 - (p - 8) / 6 : 0;
  }
  let oldRules = false; // solo para medir: las reglas de antes (v28), para comparar
  const speedAt = (s) => oldRules ? 150 + Math.min(60, Math.floor(s / 10) * 6)
    : 150 + 60 * clamp(s / 130, 0, 1) + 35 * clamp((s - 130) / 270, 0, 1) - 14 * restAt(s);
  const gapAt = (s) => oldRules ? Math.max(152, 178 - Math.floor(s / 10) * 3)
    : 178 - 26 * clamp(s / 130, 0, 1) - 8 * clamp((s - 130) / 270, 0, 1) + 14 * restAt(s);

  // ---------- Historia: «El viaje de los Panets» (17/11/2026) ----------
  // Una gaviota glotona ha robado las bandejas de la gran fiesta. En cada mundo (un lugar)
  // hay 8 niveles con recorrido fijo, una meta y 3 estrellas; en el último se recupera la
  // bandeja de un amigo, que queda desbloqueado aunque no se tenga su récord.
  const STORY_KEY = "elsPanetsHistoria";
  let story = readJSON(STORY_KEY);
  const saveStory = () => store.set(STORY_KEY, JSON.stringify(story));
  const STORY_INTRO = "Se acerca la gran fiesta de los Panets, pero una gaviota glotona ha robado las bandejas de comida. ¡Hay que recuperarlas antes de que empiece!";
  const WORLDS = [
    { place: 0, name: "Caracas", friend: "blanco", dish: "las empanadillas",
      intro: "La gaviota ha pasado por Caracas y se ha llevado las empanadillas de MJ. ¡A por ella por encima de los tejados!",
      end: "¡Bandeja recuperada! MJ ya tiene sus empanadillas para la fiesta. La gaviota ha volado hacia el mar…" },
    { place: 1, name: "La playa", friend: "chaqueta", dish: "el mangú",
      intro: "En la playa, la gaviota le ha quitado a Isidro su mangú. ¡Que no se lo coma antes de llegar al agua!",
      end: "¡El mangú está a salvo! Isidro se apunta a la fiesta. La gaviota sube hacia la montaña…" },
    { place: 2, name: "La montaña", friend: "pamela", dish: "el biberón del bebé",
      intro: "Entre la nieve, la gaviota se ha llevado el biberón del bebé de Pamela. ¡Hay que devolvérselo ya!",
      end: "¡Biberón recuperado! El bebé ya está contento y Pamela viene a la fiesta. La gaviota baja al pueblo…" },
    { place: 3, name: "El pueblo", friend: "maria", dish: "la crema catalana",
      intro: "En el pueblo blanco, la gaviota ha robado la crema catalana de María. ¡Tras ella por los tejados!",
      end: "¡Crema catalana a salvo! María se suma a la fiesta. La gaviota vuela hacia Barcelona…" },
    { place: 4, name: "Barcelona", friend: "nuria", dish: "el pa amb tomàquet",
      intro: "Última parada: Barcelona. La gaviota tiene el pa amb tomàquet de Núria. ¡Es la bandeja que falta!",
      end: "¡Todas las bandejas de vuelta! Núria trae el pa amb tomàquet y empieza la gran fiesta de los Panets. ¡Enhorabuena!" },
  ];
  const LEVELS_PER_WORLD = 8;
  const SPECIAL_GOALS = ["dorada", "sinPoderes", "racha", "filas"];
  function makeLevel(w, n) {
    const boss = n === LEVELS_PER_WORLD - 1;
    const len = 12 + n * 2 + w * 2 + (boss ? 6 : 0);
    return { w, n, boss, len, seed: 7000 + w * 100 + n * 7, place: WORLDS[w].place, base: w * 40 + n * 6,
      foodGoal: Math.max(4, Math.round(len * 0.45)), special: boss ? "sinPoderes" : SPECIAL_GOALS[n % 4], k: 4 + w + Math.floor(n / 2),
      passed: 0, spawned: 0, rows: 0, gold: false };
  }
  function goalTexts(L) {
    const sp = { dorada: "Cómete la empanadilla dorada", sinPoderes: "No cojas ningún poder", racha: "Haz una racha de " + L.k + " seguidas", filas: "Completa una fila de tres" }[L.special];
    return [(L.boss ? "Alcanza a la gaviota" : "Llega a la meta") + " (" + L.len + " columnas)", "Come " + L.foodGoal + " empanadillas", sp];
  }
  const levelStars = (w, n) => story[w + "-" + n] || 0;
  const worldDone = (w) => levelStars(w, LEVELS_PER_WORLD - 1) > 0;
  const levelOpen = (w, n) => (n === 0 ? w === 0 || worldDone(w - 1) : levelStars(w, n - 1) > 0);
  const friendFree = (id) => WORLDS.some((W, w) => W.friend === id && worldDone(w));
  const totalStars = () => Object.values(story).reduce((a, b) => a + (Number(b) || 0), 0);
  let level = null, levelResult = null;
  // dificultad dentro de un nivel: según el mundo y el nivel, y sube un poco al avanzar
  const effScore = () => (level ? Math.min(400, level.base + level.passed * 0.8) : score);
  function startLevel(w, n) {
    if (!levelOpen(w, n)) return false;
    level = makeLevel(w, n); levelResult = null; nextSeed = level.seed;
    goReady();
    return true;
  }
  function specialDone(L) {
    return L.special === "dorada" ? L.gold : L.special === "sinPoderes" ? runPowers === 0 : L.special === "racha" ? runMaxCombo >= L.k : L.rows >= 1;
  }
  // se acaba el nivel (ganado o no): hucha, estrellas, premio y avisos
  function finishLevel(win) {
    const L = level;
    runEarned = Math.max(0, eaten - START_EATEN);
    if (runEarned) addHucha(abil() === "propio" ? Math.round(runEarned * 1.1) : runEarned);
    const foodOk = runEarned >= L.foodGoal, specOk = specialDone(L);
    const stars = win ? 1 + (foodOk ? 1 : 0) + (specOk ? 1 : 0) : 0;
    const key = L.w + "-" + L.n, prev = story[key] || 0;
    let reward = 0;
    if (stars > prev) { reward = (stars - prev) * 10; story[key] = stars; saveStory(); }
    const newWorld = win && L.boss && !prev;
    if (newWorld) reward += 50 + (L.w === WORLDS.length - 1 ? 200 : 0);
    if (reward) addHucha(reward);
    levelResult = { L, win, stars, prev, reward, foodOk, specOk, newWorld, goals: goalTexts(L) };
    emit("fin", { score, comidas: runEarned, poderes: runPowers, lugares: 0, racha: runMaxCombo, segundos: Math.round(runT), char: selectedChar().id, record: false, prev: best });
    emit("nivel", { w: L.w, n: L.n, win, stars, newWorld });
  }
  function winLevel() {
    snd.record(); vibrate([20, 40, 20]);
    burst(player.x, player.y - 10, ["#ffd23f", "#ffffff", "#f59e0b"], 30, 200);
    finishLevel(true);
    setState(STATE.OVER);
    pressLockUntil = worldT + 0.9;
  }
  function nextLevelOf(L) {
    if (L.n < LEVELS_PER_WORLD - 1) return [L.w, L.n + 1];
    if (L.w < WORLDS.length - 1) return [L.w + 1, 0];
    return null;
  }

  // ---------- Retos (17/11/2026): del día, de un amigo y por turnos ----------
  // runMode: null (partida normal), "diario" (todos el mismo recorrido hoy), "reto" (el
  // recorrido de un amigo contra su fantasma) o "turnos" (varios en el mismo móvil).
  let runMode = null, rival = null; // rival: { name, score, y: [alturas] }
  const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const dailySeed = () => { let h = 2166136261; for (const ch of "diario" + todayKey()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function startMode(mode, seed, rv) {
    if (state !== STATE.START && state !== STATE.OVER) return false;
    level = null; levelResult = null;
    runMode = mode; rival = rv || null; nextSeed = seed;
    goReady();
    return true;
  }

  // ---------- Recorridos con semilla (17/11/2026) ----------
  // Cada partida tiene su número (semilla). La altura de los huecos sale de un azar propio,
  // así que con el mismo número se vuela por los mismos huecos (reto del día, retos entre
  // amigos, niveles de la historia). La comida y los poderes tienen otro azar aparte.
  function seededRng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  let runSeed = 0, nextSeed = null, gapRng = Math.random, itemRng = Math.random;

  function resetRun() {
    runSeed = nextSeed != null ? nextSeed >>> 0 : Math.floor(Math.random() * 2147483647); nextSeed = null;
    gapRng = seededRng(runSeed); itemRng = seededRng(runSeed ^ 0x5bd1e995);
    cols.length = 0; particles.length = 0; floaters.length = 0; bites.length = 0; trail.length = 0; trailAcc = 0; overMsgs = [];
    nextGapY = null; sinceLastRow = 0;
    score = START_SCORE; eaten = START_EATEN;
    if (level) { level.passed = 0; level.spawned = 0; level.rows = 0; level.gold = false; }
    speed = speedAt(effScore()); gap = gapAt(effScore());
    pendingSpecial = false; photoPending = false; photoT = -1; camFlash = 0; girlfriend = null;
    powerT = {}; shield = false; shieldSafe = 0; sinceLastPower = 0; miniK = 1;
    lives = 0; combo = 0; runMaxCombo = 0; runPowers = 0; runPlaces = 0;
    placeFrom = placeTo = level ? level.place : Math.floor(START_SCORE / PLACE_EVERY) % nPlaces(); placeT = 1; placeBanner = 0;
    if (worldOn()) MUNDO.reset(placeTo);
    distToSpawn = 0; lastGapY = groundTop() / 2 - gap / 2;
    newBest = false; medalPlayed = false;
    player.y = LH * 0.42; player.vy = 0; player.rot = 0;
    skyHour = START_SKY;
    runT = 0; ghostRec = [];
    continued = false;
  }

  function goReady() {
    resetRun();
    loadRanking();
    // la primera vez, el tutorial de 3 pasos
    tutStep = store.get(TUTORIAL_KEY, null) === null ? 0 : -1;
    setState(STATE.READY);
  }

  // vuelve al inicio (botón INICIO y botón «atrás»)
  function goHome() {
    level = null; levelResult = null; runMode = null; rival = null; liveAt = 0;
    resetRun();
    viewIndex = charIndex;
    setState(STATE.START);
  }
  // deja la partida a medias: lo comido va a la hucha y, si era récord, se guarda
  function leaveRun() {
    if (level) { finishLevel(false); level = null; levelResult = null; goHome(); return; }
    settleRun();
    if (newBest) { const name = store.get(NAME_KEY, null); if (name) publishRecord(name); }
    goHome();
  }
  function pauseGame() {
    if (runMode === "directo") return;
    if (state === STATE.PLAY || state === STATE.COUNT) setState(STATE.PAUSE);
  }

  function beginPlay() {
    setState(STATE.PLAY);
    spawnColumn(LW + 60);
    flap();
    // poder de salida comprado en la tienda
    const sp = store.get(START_KEY, "");
    if (sp && POWERS[sp]) { store.del(START_KEY); collectPower(sp, player.x + 30, player.y); }
    // el gris: suerte de principiante
    if (abil() === "gris") lives = Math.max(lives, 1);
    emit("partida", { char: selectedChar().id });
  }

  function flap() {
    player.vy = FLAP_V * (abil() === "deportista" ? 1.06 : 1);
    snd.flap();
    // soplo de aire suave debajo (05/11/2026)
    if (!lowQ && !sim) for (let i = 0; i < 4; i++) particles.push({ x: player.x - 6 + Math.random() * 10, y: player.y + 18, vx: -60 - Math.random() * 50, vy: 40 + Math.random() * 50,
      life: 0.35 + Math.random() * 0.2, max: 0.55, color: "rgba(255,255,255,0.75)", r: 2.5 + Math.random() * 2.5 });
  }

  // altura de un hueco: al azar, pero sin alejarse del anterior más de lo que da tiempo a volar
  function pickGapY(prevY, g) {
    const minY = 70, maxY = groundTop() - 70 - g;
    const reach = oldRules ? 210 : lerp(210, 170, clamp((speed - 210) / 35, 0, 1));
    // hacia abajo solo se puede caer: a más velocidad, menos tiempo para bajar al hueco siguiente,
    // así que el escalón hacia abajo se acorta para que siempre dé tiempo (aunque se aletee al salir)
    const T = (SPACING - COL_W - 2 * CAP_OUT - 28) / speed + 0.12;
    const down = oldRules ? reach : clamp(FLAP_V * T + 0.5 * GRAVITY * T * T + g - 38, 90, reach);
    const y = clamp(minY + gapRng() * (maxY - minY), prevY - reach, prevY + down);
    return clamp(y, minY, maxY);
  }

  function spawnColumn(x) {
    gap = gapAt(effScore());
    if (level) level.spawned++;
    const y = nextGapY == null ? pickGapY(lastGapY, gap) : clamp(nextGapY, 70, groundTop() - 70 - gap);
    lastGapY = y;
    nextGapY = pickGapY(y, gap);
    const ch = selectedChar();
    let food = itemRng() < 0.85, kind = "empanada";
    if (pendingSpecial && ch.special) { kind = ch.special; food = true; pendingSpecial = false; }
    else if (ch.kind === "dog") kind = DOG_FOODS[Math.floor(itemRng() * DOG_FOODS.length)];
    sinceLastPower++;
    if (!SPECIALS[kind] && score >= POWER_MIN_SCORE && sinceLastPower >= POWER_GAP_COLS && itemRng() < POWER_CHANCE) {
      let pick = Object.keys(POWERS).filter((k) => !(k === "escudo" && shield) && !(k === "corazon" && lives >= 2) && !powerOn(k));
      // la vida extra sale menos que los demás
      if (pick.length > 1 && itemRng() < 0.6) pick = pick.filter((k) => k !== "corazon");
      if (pick.length) { kind = "p_" + pick[Math.floor(itemRng() * pick.length)]; food = true; sinceLastPower = 0; }
    }
    // 16/11/2026: la comida normal a veces va arriba o abajo del hueco (cuesta más cogerla,
    // pero siempre se llega: queda a 34 del borde y se coge desde 29)
    // lluvia de panets: todas las columnas llevan comida
    if (powerOn("lluvia") && !SPECIALS[kind] && !isPower(kind)) food = true;
    // empanadilla dorada: de vez en cuando, vale 10
    if (!oldRules && kind === "empanada" && food && score >= 15 && itemRng() < (abil() === "maria" ? 0.08 : 0.05)) kind = "dorada";
    if (level && level.special === "dorada" && level.spawned === Math.floor(level.len / 2) && !SPECIALS[kind] && !isPower(kind)) { kind = "dorada"; food = true; }
    let fdy = 0;
    const normal = !SPECIALS[kind] && !isPower(kind);
    if (!oldRules && normal && food && score >= 10 && itemRng() < 0.35) fdy = (itemRng() < 0.5 ? -1 : 1) * (gap / 2 - 34);
    cols.push({ x, gapY: y, gap, passed: false, food, kind, eaten: false, bob: itemRng() * 6, pull: 0, fdy, place: worldOn() ? MUNDO.ROUTE[placeTo].col : placeTo, girl: kind === "novia" ? randomGirl() : null });
    // fila de tres empanadillas pequeñas entre esta columna y la siguiente, un poco apartada
    // del camino recto: riesgo a cambio de premio. Solo si los dos huecos están a una altura
    // parecida, para que dé tiempo a ir y volver.
    sinceLastRow++;
    const cyA = y + gap / 2, cyB = nextGapY + gap / 2;
    const rain = powerOn("lluvia");
    const wantRows = level && level.special === "filas" && sinceLastRow >= 2 && Math.abs(cyB - cyA) <= 80;
    if (!oldRules && (rain || wantRows || (score >= 20 && sinceLastRow >= 3 && Math.abs(cyB - cyA) <= 80 && itemRng() < 0.45))) {
      sinceLastRow = 0;
      const mx = x + COL_W + (SPACING - COL_W) / 2, mid = (cyA + cyB) / 2;
      let side = itemRng() < 0.5 ? -1 : 1;
      if (mid + side * 40 < 70 || mid + side * 40 > groundTop() - 70) side = -side;
      const row = { n: 0 };
      for (let i = -1; i <= 1; i++) {
        bites.push({ x: mx + i * 36, y: mid + side * (i === 0 ? 40 : 28), row, eaten: false, pull: 0, ph: i * 0.9,
          kind: ch.kind === "dog" ? DOG_FOODS[Math.floor(itemRng() * DOG_FOODS.length)] : "empanada" });
      }
    }
  }

  // dónde está la comida de una columna (con el imán, va hacia el personaje).
  // Devuelve siempre el mismo objeto: hay que usarlo antes de volver a llamar.
  const FP = { x: 0, y: 0 };
  function foodPos(c) {
    const bx = c.x + COL_W / 2, by = c.gapY + c.gap / 2 + c.fdy + Math.sin(c.bob) * 5;
    if (!c.pull) { FP.x = bx; FP.y = by; return FP; }
    const p = smooth(Math.min(1, c.pull));
    FP.x = lerp(bx, player.x + 1, p); FP.y = lerp(by, player.y - 5, p);
    return FP;
  }
  function bitePos(b) {
    if (!b.pull) { FP.x = b.x; FP.y = b.y; return FP; }
    const p = smooth(Math.min(1, b.pull));
    FP.x = lerp(b.x, player.x + 1, p); FP.y = lerp(b.y, player.y - 5, p);
    return FP;
  }
  // una empanadilla pequeña vale 1 punto; la fila entera, 2 más
  function eatBite(b, x, y) {
    b.eaten = true;
    player.eatT = 0.3;
    eaten++;
    emit("come", 1);
    addScore(1);
    snd.eat();
    vibrate(8);
    burst(x, y, BITE_COLORS, 7, 110);
    if (++b.row.n === 3) {
      if (level) level.rows++;
      addScore(2, x, y - 18);
      floaters.push({ x: Math.max(x, 90), y: y - 46, txt: "¡FILA ENTERA!", t: 0, size: 20, color: "#fff" });
      emit("fila");
    }
    if (selectedChar().special && eaten % specialEvery(selectedChar()) === 0) pendingSpecial = true;
  }
  const BITE_COLORS = ["#f2a93b", "#c96d16", "#ffe2a0"];

  function collectPower(k, x, y) {
    const p = POWERS[k];
    if (k === "escudo") shield = true;
    else if (k === "corazon") lives = Math.min(2, lives + 1);
    else powerT[k] = powerTime(k);
    runPowers++;
    emit("poder", k);
    floaters.push({ x: Math.max(x, 90), y: y - 44, txt: p.label, t: 0, size: 22, color: "#fff" });
    burst(x, y, p.colors, 18, 150);
    vibrate(15);
    snd.power();
  }

  // el escudo se rompe: te salva y durante un momento atraviesas las columnas
  function breakShield() {
    shield = false;
    shieldSafe = 1.3;
    burst(player.x, player.y - 5, POWERS.escudo.colors, 20, 170);
    floaters.push({ x: Math.max(player.x + 20, 90), y: player.y - 50, txt: "¡SALVADO!", t: 0, size: 22, color: "#fff" });
    vibrate(30);
    snd.shieldPop();
  }

  function collectSpecial(kind, x, y) {
    const sp = SPECIALS[kind];
    emit("especial", kind);
    addScore(kind === "camara" && abil() === "blanco" ? 7 : 5, x, y - 20);
    floaters.push({ x, y: y - 52, txt: sp.label, t: 0, size: 22, color: "#fff" });
    burst(x, y, sp.colors, 22, 170);
    vibrate(kind === "camara" ? [10, 40, 10] : 20);
    if (kind === "camara") { photoPending = true; snd.shutter(); }
    else if (kind === "novia" || kind === "patomaquet" || kind === "crema" || kind === "mangu" || kind === "biberon") snd.power();
    else if (kind === "vino") snd.cork();
    else snd.tequila();
  }

  function addScore(n, x, y) {
    if (powerOn("doble")) n *= 2;
    score += n;
    scorePop = 1;
    if (n > 1 && x != null) floaters.push({ x, y, txt: "+" + n, t: 0 });
    // lugar nuevo cada 40 puntos
    const pi = Math.floor(score / PLACE_EVERY) % nPlaces();
    if (pi !== placeTo && state === STATE.PLAY && !level) {
      placeFrom = placeT < 1 ? placeFrom : placeTo;
      placeTo = pi; placeT = 0; placeBanner = 3.2;
      if (worldOn()) MUNDO.cross(pi, scroll);
      snd.place();
      runPlaces++;
      emit("lugar", { i: pi, score });
    }
    // la velocidad y el hueco los marca la curva de dificultad (speedAt y gapAt)
  }

  // cierra la cuenta de la partida: lo comido va a la hucha y, si es récord, se guarda
  function settleRun() {
    prevBest = best;
    if (runMode === "turnos") {
      runEarned = Math.max(0, eaten - START_EATEN);
      if (runEarned) addHucha(runEarned);
      emit("fin", { score, comidas: runEarned, poderes: runPowers, lugares: runPlaces, racha: runMaxCombo, segundos: Math.round(runT), char: selectedChar().id, record: false, prev: best });
      return;
    }
    runEarned = Math.max(0, eaten - START_EATEN);
    if (runEarned) addHucha(abil() === "propio" ? Math.round(runEarned * 1.1) : runEarned);
    emit("fin", { score, comidas: runEarned, poderes: runPowers, lugares: runPlaces, racha: runMaxCombo,
      segundos: Math.round(runT), char: selectedChar().id, record: score > best, prev: best });
    if (score > best) {
      best = score;
      newBest = true;
      store.set(BEST_KEY, best);
      store.set(BEST_FOOD_KEY, eaten);
      ghost = ghostRec.slice();
      store.set(GHOST_KEY, JSON.stringify(ghost));
    }
  }

  const CRASH_COLORS = ["#ffffff", "#ffd166", "#ef476f"];
  function crash() {
    if (state !== STATE.PLAY) return;
    if (sim) { simDead = true; return; }
    if (LOCAL && window.elsPanetsPrueba && window.elsPanetsPrueba.inmortal) return;
    // vida extra: se salva, sube un poco y atraviesa las columnas un momento
    if (lives > 0) {
      lives--;
      shieldSafe = 1.6;
      player.y = Math.min(player.y, groundTop() - 70); player.vy = FLAP_V;
      burst(player.x, player.y - 5, POWERS.corazon.colors, 20, 170);
      floaters.push({ x: Math.max(player.x + 20, 90), y: player.y - 50, txt: "¡TE SALVA EL CORAZÓN!", t: 0, size: 20, color: "#fff" });
      vibrate(30); snd.shieldPop();
      return;
    }
    snd.hit();
    vibrate([40, 30, 60]);
    flashT = 1;
    burst(player.x, player.y, CRASH_COLORS, 16, 160);
    if (canContinue()) { setState(STATE.SEGUIR); return; }
    snd.fall();
    player.vy = Math.min(player.vy, -120);
    finishCrash();
  }
  const canContinue = () => !continued && !level && runMode === null && !sim && eaten - START_EATEN >= SEGUIR_COST;
  // sí: se paga, vuelve al hueco de la columna que tiene delante y no choca durante un rato
  function acceptSeguir() {
    continued = true;
    eaten -= SEGUIR_COST;
    const c = cols.find((q) => q.x + COL_W + CAP_OUT > player.x - 20);
    player.y = c ? c.gapY + c.gap / 2 + 5 : LH * 0.42; player.vy = 0; player.rot = 0;
    shieldSafe = 2.4;
    floaters.push({ x: Math.max(player.x + 20, 90), y: player.y - 50, txt: "¡SEGUIMOS!", t: 0, size: 22, color: "#fff" });
    snd.shieldPop();
    emit("seguir", { score });
    setState(STATE.COUNT);
  }
  function declineSeguir() {
    snd.fall();
    player.vy = Math.min(player.vy, -120);
    finishCrash();
  }
  function finishCrash() {
    if (level) { finishLevel(false); overMsgs = []; setState(STATE.DYING); return; }
    settleRun();
    overMsgs = runMode === "turnos" || runMode === "directo" ? [] : buildOverMessages();
    // reto de un amigo: ¿le has ganado?
    if (runMode === "reto" && rival) overMsgs.unshift(score > rival.score ? { txt: "¡Le has ganado a " + rival.name + "! (" + rival.score + ")", color: "#7dff9a" }
      : score === rival.score ? { txt: "¡Empate con " + rival.name + "!", color: "#ffd23f" } : { txt: rival.name + " te gana: " + rival.score + " puntos", color: "#fff" });
    if (runMode === "diario") overMsgs.unshift({ txt: "Reto del día: " + score + " puntos", color: "#ffd23f" });
    // media hora jugando: un aviso amable (solo al acabar, nunca en mitad de la partida)
    if (restOn && playSecs >= 1800 && runMode !== "directo") { playSecs = 0; overMsgs.push({ txt: "Llevas media hora jugando. ¿Un descanso?", color: "#bfe8ff" }); }
    emit("partidaFin", { mode: runMode, score, seed: runSeed, y: ghostRec.slice(0, GHOST_MAX), char: selectedChar().id, flag: flagOf(selectedChar()), name: store.get(NAME_KEY, "") || "" });
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
    if (runMode === "turnos") setTimeout(() => emit("turnoFin", { score }), 600);
    pressLockUntil = worldT + 0.7;
    if (newBest) setTimeout(() => snd.record(), 350);
  }

  // ---------- «¡Casi!» y a quién adelantas del ranking (12/11/2026) ----------
  let rankCache = null, prevBest = 0, runEarned = 0, overMsgs = [], simDead = false;
  // los 50 mejores; el módulo de Firebase los guarda 10 minutos, así que casi nunca lee
  function loadRanking() {
    const lb = window.TacoLeaderboard;
    if (!lb || !lb.ranking) return;
    lb.ranking().then((r) => { rankCache = r; }).catch(() => {});
  }
  const niceName = (n) => { n = String(n || "").trim(); return n.length <= 2 ? n : n.charAt(0).toUpperCase() + n.slice(1).toLowerCase(); };
  function nextGoal() {
    // lo siguiente que se desbloquea con un récord más alto que el que tienes
    const goals = [];
    for (const c of CHARACTERS) if (!c.custom && c.name && c.unlock > best) goals.push([c.unlock, "a " + niceName(c.name)]);
    for (const p of OUTFIT_PTS) if (p > best) goals.push([p, "ropa nueva"]);
    for (const k of SPECIES_KEYS) if (SPECIES[k].pts > best) goals.push([SPECIES[k].pts, SPECIES[k].art + " en «Crea tu personaje»"]);
    goals.sort((a, b) => a[0] - b[0]);
    return goals[0] || null;
  }
  // «Te faltó 1» / «Te faltaron 3»
  const faltan = (n, pasado) => (pasado ? (n === 1 ? "Te faltó " : "Te faltaron ") : n === 1 ? "Te falta " : "Te faltan ") + n;
  function buildOverMessages() {
    const out = [];
    if (!newBest && best > 0 && score > 0 && best - score <= Math.max(3, Math.round(best * 0.2))) {
      out.push({ txt: score === best ? "¡Igualas tu récord! Uno más y lo superas" : "¡Casi! " + faltan(best - score + 1, true) + " para tu récord", color: "#ffd23f", bar: clamp(score / (best + 1), 0, 1) });
    } else {
      const g = nextGoal();
      if (g) {
        const n = g[0] - score, casi = n <= Math.min(25, Math.max(3, Math.round(g[0] * 0.25)));
        out.push({ txt: casi ? "¡Casi! " + faltan(n, true) + " para desbloquear " + g[1] : "Llega a " + g[0] + " para desbloquear " + g[1], color: casi ? "#ffd23f" : "#fff", bar: clamp(best / g[0], 0, 1) });
      }
    }
    const lb = window.TacoLeaderboard, me = lb && lb.myId ? lb.myId() : null;
    const others = (rankCache || []).filter((r) => r.id !== me && typeof r.score === "number" && r.name);
    if (others.length && score > 0) {
      const passed = newBest ? others.filter((r) => r.score >= prevBest && r.score < score).sort((a, b) => b.score - a.score) : [];
      if (passed.length) out.push({ txt: "¡Has adelantado a " + cleanName(passed[0].name) + (passed.length > 1 ? " y " + (passed.length - 1) + " más" : "") + "!", color: "#7dff9a" });
      else {
        const above = others.filter((r) => r.score >= score).sort((a, b) => a.score - b.score)[0];
        if (above) out.push({ txt: faltan(above.score - score + 1) + " para pasar a " + cleanName(above.name), color: "#fff" });
        else if (newBest) out.push({ txt: "¡Eres el número 1 del ranking!", color: "#7dff9a" });
      }
    }
    return out;
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

  const nameMsg = document.getElementById("nameMsg");

  // ---------- Nombres: filtro sencillo de palabrotas (castellano y catalán) ----------
  // Se quitan tildes, números que hacen de letra y letras repetidas antes de mirar.
  // trozos que no pueden salir en ninguna parte del nombre
  const BAD_PARTS = ["puta", "puto", "mierd", "merda", "cabron", "gilipoll", "joder", "jodid", "follar", "follad", "coño",
    "hijoput", "maricon", "polla", "zorra", "pendej", "capull", "subnorm", "imbecil", "culo", "sexo", "porno",
    "cagon", "cagad", "mecago", "cagoen", "malparit", "bagassa", "collons", "cojon", "huevon", "guevon", "gonorrea", "mamaguev",
    "violad", "violar", "retras", "mongol", "hitler", "fuck", "shit", "bitch", "nigg", "pajer", "chocho",
    "carallot", "bastard", "idiota", "estupid"];
  // palabras que solo se quitan si van sueltas (dentro de otras son normales: Penélope, Vergara…)
  const BAD_WORDS = ["pene", "teta", "tetas", "caca", "nazi", "paja", "pito", "pedo", "ano", "guarra", "guarro", "perra", "figa",
    "cony", "cabro", "pixa", "verga", "marica", "marico", "facha", "fatxa"];
  const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "€": "e" };
  function nameBad(name) {
    let s = String(name || "").toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ");
    s = s.replace(/[013457@$€]/g, (ch) => LEET[ch]);
    const words = s.split(/[^a-zñ]+/).filter(Boolean), all = words.join("");
    // «puuuta» y «pollllla»: las letras repetidas tres veces o más se dejan en una y en dos
    const forms = [all, all.replace(/(.)\1{2,}/g, "$1"), all.replace(/(.)\1{2,}/g, "$1$1")];
    for (const f of forms) for (const b of BAD_PARTS) if (f.includes(b)) return true;
    for (const w of words.concat(all)) if (BAD_WORDS.includes(w)) return true;
    return false;
  }
  // "" si vale; si no, lo que hay que decirle al jugador
  function nameProblem(name) {
    const n = String(name || "").trim();
    if (!n) return "Escribe un nombre";
    if (n.length > 12) return "Como mucho, 12 letras";
    if (nameBad(n)) return "Ese nombre no vale. Elige otro, por favor";
    return "";
  }
  // los nombres del ranking que no pasan el filtro se enseñan como «Jugador»
  const cleanName = (n) => { n = String(n || "").trim().slice(0, 12); return !n || nameBad(n) ? "Jugador" : n; };

  function showNameOverlay() {
    nameOverlay.classList.remove("hidden");
    nameInput.value = "";
    nameMsg.textContent = "";
    setTimeout(() => nameInput.focus(), 50);
  }

  // ---------- Envío del récord (16/11/2026) ----------
  // El récord se apunta como pendiente y se envía cuando se puede: al momento, al
  // volver la conexión o en el siguiente arranque. En el ordenador no se envía nada
  // al ranking de verdad (salvo con ?enviar), y las partidas de prueba nunca se envían.
  const PENDING_KEY = "elsPanetsPendiente", BEST_FOOD_KEY = "elsPanetsBestComidas", RANK_NEW_KEY = "elsPanetsRankingNuevo";
  const CAN_SEND = !LOCAL || QS.has("enviar");
  const TEST_RUN = START_SCORE > 0 || START_EATEN > 0 || QS.has("prueba");
  let syncing = false;
  function syncRecord() {
    const lb = window.TacoLeaderboard, name = store.get(NAME_KEY, null);
    if (syncing || !CAN_SEND || !lb || !lb.submitScore || !name || best <= 0 || store.get(PENDING_KEY, null) !== "1") return;
    syncing = true;
    const sent = best, sentName = name;
    lb.submitScore(name, best, Number(store.get(BEST_FOOD_KEY, 0)) || 0, flagOf(selectedChar())).then((r) => {
      syncing = false;
      if (r === "sin-red") return;                 // se queda pendiente
      if (best > sent || store.get(NAME_KEY, null) !== sentName) { syncRecord(); return; } // cambió mientras se enviaba
      store.del(PENDING_KEY);
    }, () => { syncing = false; });
  }
  function queueRecord() {
    if (TEST_RUN || best <= 0 || !store.get(NAME_KEY, null)) return;
    store.set(PENDING_KEY, "1");
    syncRecord();
  }
  // al estrenar esta versión, el récord que ya había en el móvil sube al ranking nuevo
  if (store.get(RANK_NEW_KEY, null) === null) {
    store.set(RANK_NEW_KEY, "1");
    if (best > 0 && store.get(NAME_KEY, null)) store.set(PENDING_KEY, "1");
  }
  window.addEventListener("online", syncRecord);
  window.addEventListener("tacoLeaderboardReady", syncRecord);
  setTimeout(syncRecord, 2500);

  function publishRecord(name) {
    recordHolder = name;
    store.set(HOLDER_KEY, name);
    queueRecord();
  }
  // cambiar de nombre (Ajustes): también cambia en el ranking
  function setPlayerName(name) {
    name = String(name || "").trim().slice(0, 12);
    if (nameProblem(name)) return false;
    store.set(NAME_KEY, name);
    if (best > 0) publishRecord(name);
    return true;
  }

  function submitName() {
    const name = nameInput.value.trim().slice(0, 12);
    const bad = nameProblem(name);
    if (bad) { nameMsg.textContent = bad; return; }
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

  // bandera pequeña como imagen, para el ranking y el panel del admin
  const FLAG_NAMES = { ve: "Venezuela", ec: "Ecuador", cat: "Cataluña", do: "R. Dominicana", hn: "Honduras" };
  // ---------- Banderas de todo el mundo (12/11/2026) ----------
  // Las cinco de los personajes están dibujadas a mano; el resto sale de los emojis
  // de bandera con la letra «Twemoji Country Flags» (style.css), igual en todos los móviles.
  const WORLD_CODES = ("ad ae af ag ai al am ao aq ar as at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bw by bz " +
    "ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz de dj dk dm dz ee eg eh er es et fi fj fk fm fo fr ga gb gd ge gf gg gh gi " +
    "gl gm gn gp gq gr gs gt gu gw gy hk hr ht hu id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li " +
    "lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa " +
    "pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw sa sb sc sd se sg sh si sk sl sm sn so sr ss st sv sx sy sz tc td tf tg th " +
    "tj tk tl tm tn to tr tt tv tw tz ua ug us uy uz va vc vg vi vn vu wf ws xk ye yt za zm zw").split(" ");
  const SUB_FLAGS = { eng: ["gbeng", "Inglaterra"], sct: ["gbsct", "Escocia"], wls: ["gbwls", "Gales"] };
  const WORLD_SET = new Set(WORLD_CODES.concat(Object.keys(SUB_FLAGS)));
  const regionNames = (() => { try { return new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { return null; } })();
  function flagName(f) {
    if (FLAG_NAMES[f]) return FLAG_NAMES[f];
    if (!WORLD_SET.has(f)) return "";
    if (SUB_FLAGS[f]) return SUB_FLAGS[f][1];
    let n = "";
    try { n = regionNames ? regionNames.of(f.toUpperCase()) : ""; } catch (e) {}
    return n || f.toUpperCase();
  }
  function flagEmoji(f) {
    if (SUB_FLAGS[f]) return "\u{1F3F4}" + [...SUB_FLAGS[f][0]].map((ch) => String.fromCodePoint(0xe0000 + ch.charCodeAt(0))).join("") + "\u{E007F}";
    return String.fromCodePoint(...[...f.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
  }
  const FLAG_FONT = '"Twemoji Country Flags", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  // la bandera dibujada una vez en un lienzo, recortada a su tamaño
  const emojiFlags = {};
  let flagsReady = false; // ya llegó la letra de las banderas (o se dejó de esperar)
  function emojiFlagCanvas(f) {
    if (!flagsReady) return null; // mientras llega, no se guarda nada a medias
    if (emojiFlags[f] !== undefined) return emojiFlags[f];
    const S = 80, cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const c = cv.getContext("2d");
    c.font = "60px " + FLAG_FONT; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(flagEmoji(f), S / 2, S / 2 + 4);
    let box = null;
    try {
      const d = c.getImageData(0, 0, S, S).data;
      let x0 = S, y0 = S, x1 = -1, y1 = -1;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 > x0 && y1 > y0) box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    } catch (e) {}
    emojiFlags[f] = box ? { cv, box } : null;
    return emojiFlags[f];
  }
  // cuando llega la letra de las banderas, se vuelven a dibujar
  if (document.fonts && document.fonts.load) {
    const ready = () => {
      if (flagsReady) return;
      flagsReady = true;
      for (const k of Object.keys(emojiFlags)) delete emojiFlags[k];
      for (const k of Object.keys(flagImgs)) if (!FLAG_NAMES[k]) delete flagImgs[k];
    };
    document.fonts.load("60px \"Twemoji Country Flags\"", "\u{1F1EA}\u{1F1F8}").then(ready, ready);
    setTimeout(ready, 5000); // sin conexión: se usan los emojis del móvil
  } else flagsReady = true;
  // la bandera estirada a lo largo de toda la cinta, igual que las cinco dibujadas a mano
  function drawWorldBand(x, y, w, h, f) {
    const e = emojiFlagCanvas(f);
    if (e) {
      const b = e.box, k = Math.max(1, Math.round(b.h * 0.05)); // sin el borde redondeado
      ctx.drawImage(e.cv, b.x + k, b.y + k, b.w - 2 * k, b.h - 2 * k, x, y, w, h);
    } else { ctx.fillStyle = "#f4ead6"; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = "rgba(60,40,20,0.35)"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  const flagImgs = {};
  function flagImg(f) {
    if (!FLAG_NAMES[f] && !WORLD_SET.has(f)) return "";
    if (!FLAG_NAMES[f] && !flagsReady) return `<span class="lbFlag flagEmoji" title="${flagName(f)}">${flagEmoji(f)}</span>`;
    if (!flagImgs[f]) {
      const cv = document.createElement("canvas");
      cv.width = (COL_W - 2) * 2; cv.height = FLAG_H * 2;
      const keep = ctx; ctx = cv.getContext("2d"); ctx.scale(2, 2);
      drawFlagBand(0, 0, COL_W - 2, FLAG_H, f);
      ctx = keep;
      flagImgs[f] = cv.toDataURL();
    }
    return `<img class="lbFlag" src="${flagImgs[f]}" alt="${flagName(f)}">`;
  }

  const lbTabs = document.getElementById("lbTabs");
  let lbMode = "jugadores";
  lbTabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    lbMode = b.dataset.tab; snd.click(); showLeaderboard();
  });

  function showLeaderboard() {
    lbOverlay.classList.remove("hidden");
    lbList.innerHTML = '<li class="lbEmpty">Cargando…</li>';
    if (!window.TacoLeaderboard) { lbList.innerHTML = '<li class="lbEmpty">Sin conexión al ranking</li>'; return; }
    const cfg = adminConfig();
    // el ranking por países y la bandera junto al nombre los enciende el admin
    if (!cfg.rankingPaises) lbMode = "jugadores";
    lbTabs.classList.toggle("hidden", !cfg.rankingPaises);
    for (const b of lbTabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.tab === lbMode);
    const me = window.TacoLeaderboard.myId ? window.TacoLeaderboard.myId() : null;
    const note = '<li class="lbEmpty lbNote">Los 50 mejores. Se actualiza cada 10 minutos.</li>';
    if (lbMode === "paises") {
      window.TacoLeaderboard.ranking().then((rows) => {
        const by = {};
        for (const r of rows || []) {
          if (!flagName(r.flag)) continue;
          const c = by[r.flag] || (by[r.flag] = { f: r.flag, pts: 0, n: 0 });
          c.pts += Number(r.score) || 0; c.n++;
        }
        const list = Object.values(by).sort((a, b) => b.pts - a.pts);
        if (!list.length) { lbList.innerHTML = '<li class="lbEmpty">Aún no hay récords con bandera</li>'; return; }
        lbList.innerHTML = list.map((c, i) => {
          const cls = i < 3 ? ` class="top${i + 1}"` : "";
          return `<li${cls}><span class="lbRank">${i + 1}</span>${flagImg(c.f)}<span class="lbName">${flagName(c.f)} <small>(${c.n})</small></span><span class="lbScore">${c.pts}</span></li>`;
        }).join("") + '<li class="lbEmpty lbNote">Suma de los récords de cada país entre los 50 mejores.</li>';
      }).catch(() => { lbList.innerHTML = '<li class="lbEmpty">No se pudo cargar el ranking</li>'; });
      return;
    }
    window.TacoLeaderboard.ranking().then((rows) => {
      rankCache = rows;
      if (!rows || !rows.length) { lbList.innerHTML = '<li class="lbEmpty">Aún no hay puntuaciones. ¡Sé el primero!</li>'; return; }
      lbList.innerHTML = rows.map((r, i) => {
        const name = cleanName(r.name).replace(/[<>&"']/g, "");
        const cls = [i < 3 ? "top" + (i + 1) : "", r.id === me ? "lbMe" : ""].join(" ").trim();
        const fl = cfg.banderaRanking ? flagImg(r.flag) : "";
        return `<li${cls ? ` class="${cls}"` : ""}><span class="lbRank">${i + 1}</span>${fl}<span class="lbName">${name}${r.id === me ? " <small>(tú)</small>" : ""}</span><span class="lbScore">${Number(r.score) || 0}</span></li>`;
      }).join("") + note;
    }).catch(() => { lbList.innerHTML = '<li class="lbEmpty">No se pudo cargar el ranking</li>'; });
  }

  // ---------- Botones (posiciones según el alto de la pantalla) ----------
  // Se calculan una vez y se guardan: solo cambian con el alto de la pantalla o el número de personajes.
  let uiMemo = null, uiLH = 0, uiCount = 0;
  function ui() {
    if (uiMemo && uiLH === LH && uiCount === shownCount()) return uiMemo;
    uiLH = LH; uiCount = shownCount();
    const cx = LW / 2;
    const overCardY = LH * 0.27;
    return uiMemo = {
      gear: { x: 36, y: 40, r: 22 },
      cuenta: { x: 92, y: 40, r: 22 },
      pause: { x: 30, y: 34, r: 16 },
      resume: { x: cx - 110, y: LH * 0.4 + 44, w: 220, h: 60 },
      pauseHome: { x: cx - 80, y: LH * 0.4 + 126, w: 160, h: 48 },
      rank: { x: LW - 36, y: 40, r: 22 },
      misiones: { x: LW - 92, y: 40, r: 22 },
      charY: LH * 0.31,
      prev: { x: cx - 118, y: LH * 0.31, r: 22 },
      next: { x: cx + 118, y: LH * 0.31, r: 22 },
      play: { x: cx - 100, y: LH * 0.45, w: 200, h: 64 },
      cardY: LH * 0.45 + 82,
      portraits: CHARACTERS.slice(0, shownCount()).map((c, i, a) => { const st = Math.min(46, 350 / a.length); return { i, x: cx - (a.length - 1) * st / 2 + i * st, y: LH * 0.45 + 82 + 50, r: Math.min(19, st / 2 - 2.5) }; }), // 04/11: tarjeta más ancha
      create: { x: cx - 95, y: LH * 0.45 + 82 + 97, w: 190, h: 42 },
      outfits: OUTFIT_PTS.map((p, i) => ({ i, x: cx - 75 + i * 50, y: LH * 0.45 + 82 + 118, r: 18 })),
      edit: { x: cx - 75, y: LH * 0.45 + 82 + 103, w: 150, h: 33 },
      caja: { x: cx + 6, y: LH * 0.45 + 82 + 172 + 30 - 18, w: 170, h: 36 },
      // 17/11/2026: inicio nuevo
      hist: { x: cx - 110, y: LH * 0.45 + 74, w: 220, h: 46 },
      mPers: { x: cx - 184, y: LH * 0.45 + 134, w: 88, h: 76 },
      mShop: { x: cx - 90, y: LH * 0.45 + 134, w: 88, h: 76 },
      mMis: { x: cx + 4, y: LH * 0.45 + 134, w: 88, h: 76 },
      mRetos: { x: cx + 98, y: LH * 0.45 + 134, w: 88, h: 76 },
      charBox: { x: cx - 70, y: LH * 0.31 - 80, w: 140, h: 120 },
      titleBox: { x: cx - 150, y: LH * 0.12 - 40, w: 300, h: 80 },
      overCard: { x: cx - 160, y: overCardY, w: 320, h: 240 },
      again: { x: cx - 150, y: overCardY + 262, w: 160, h: 58 },
      home: { x: cx + 20, y: overCardY + 262, w: 130, h: 58 },
      share: { x: cx - 120, y: overCardY + 332, w: 240, h: 42 },
      segYes: { x: cx - 120, y: LH * 0.4, w: 240, h: 64 },
      segNo: { x: cx - 95, y: LH * 0.4 + 106, w: 190, h: 46 },
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

  let titleTaps = 0, titleTapT = -9;
  function press(p) {
    if (window.ElsPanetsUI && window.ElsPanetsUI.isOpen()) return;
    startMusic();
    const u = ui();
    // la rueda de ajustes: en el inicio y en la pausa
    if (p && (state === STATE.START || state === STATE.PAUSE) && inCircle(p, u.gear)) { snd.click(); if (window.ElsPanetsUI) window.ElsPanetsUI.openSettings(); return; }
    if (p && state === STATE.START && inCircle(p, u.cuenta)) { snd.click(); if (window.ElsPanetsCuenta) window.ElsPanetsCuenta.open(); return; }
    if (p && (state === STATE.START || state === STATE.OVER) && inCircle(p, u.rank)) { snd.click(); showLeaderboard(); return; }
    if (p && state === STATE.OVER && inCircle(p, u.misiones) && window.ElsPanetsProgreso) { snd.click(); window.ElsPanetsProgreso.open(); return; }

    switch (state) {
      case STATE.START:
        if (!p) { if (charUnlocked(viewIndex)) { snd.click(); level = null; levelResult = null; runMode = null; rival = null; goReady(); } return; }
        if (inRect(p, u.hist)) { snd.click(); if (window.ElsPanetsUI && window.ElsPanetsUI.openStory) window.ElsPanetsUI.openStory(); return; }
        // los tres botones grandes del inicio y el personaje (abre la pantalla de personajes)
        if (inRect(p, u.mPers) || inRect(p, u.charBox)) { snd.click(); if (window.ElsPanetsUI && window.ElsPanetsUI.openChars) window.ElsPanetsUI.openChars(); return; }
        if (inRect(p, u.mShop)) { snd.click(); if (window.ElsPanetsUI) window.ElsPanetsUI.openBox(); return; }
        if (inRect(p, u.mMis)) { snd.click(); if (window.ElsPanetsProgreso) window.ElsPanetsProgreso.open(); return; }
        if (inRect(p, u.mRetos)) { snd.click(); if (window.ElsPanetsUI && window.ElsPanetsUI.openRetos) window.ElsPanetsUI.openRetos(); return; }
        // 5 toques seguidos en el título: entrada del admin
        if (inRect(p, u.titleBox)) {
          titleTaps = worldT - titleTapT < 1.2 ? titleTaps + 1 : 1; titleTapT = worldT;
          if (titleTaps >= 5) { titleTaps = 0; if (window.ElsPanetsUI) window.ElsPanetsUI.openAdmin(); }
          return;
        }
        if (CHARACTERS[viewIndex].custom && inRect(p, u.play) && customState() === "libre") { snd.click(); if (window.ElsPanetsUI) window.ElsPanetsUI.openCreator(null); return; }
        if (CHARACTERS[viewIndex].premium && !charUnlocked(viewIndex) && inRect(p, u.play)) { snd.click(); if (window.ElsPanetsUI) window.ElsPanetsUI.openBox("premium"); return; }
        if (inCircle(p, u.prev)) { stepChar(-1); snd.click(); return; }
        if (inCircle(p, u.next)) { stepChar(1); snd.click(); return; }
        {
        }
        if (inRect(p, u.play) && charUnlocked(viewIndex)) { snd.click(); level = null; levelResult = null; runMode = null; rival = null; goReady(); }
        return;
      case STATE.READY:
        // tutorial: cada toque pasa al paso siguiente; al acabar ya no vuelve a salir
        if (tutStep >= 0) {
          if (stateT < 0.5) return;
          snd.click();
          stateT = 0;
          if (++tutStep > 2) { tutStep = -1; store.set(TUTORIAL_KEY, "1"); }
          return;
        }
        if (runMode === "directo") return;
        if (stateT > 0.15) beginPlay();
        return;
      case STATE.PLAY:
        if (p && runMode !== "directo" && inCircle(p, u.pause)) { snd.click(); pauseGame(); return; }
        flap();
        return;
      case STATE.SEGUIR:
        // los toques de aletear justo al chocar no cuentan
        if (!p || stateT < 0.6) return;
        if (inRect(p, u.segYes)) { snd.click(); acceptSeguir(); return; }
        if (inRect(p, u.segNo)) { snd.click(); declineSeguir(); }
        return;
      case STATE.PAUSE:
        if (stateT < 0.25) return;
        snd.click();
        if (p && inRect(p, u.pauseHome)) { leaveRun(); return; }
        // al seguir no se vuela de golpe: primero la cuenta «3, 2, 1»
        setState(STATE.COUNT);
        return;
      case STATE.OVER:
        if (worldT < pressLockUntil) return;
        if (levelResult) {
          const R = levelResult, nx = R.win ? nextLevelOf(R.L) : null;
          if (!p || inRect(p, u.again)) { snd.click(); if (nx) startLevel(nx[0], nx[1]); else startLevel(R.L.w, R.L.n); return; }
          if (inRect(p, u.home)) { snd.click(); goHome(); if (window.ElsPanetsUI && window.ElsPanetsUI.openStory) window.ElsPanetsUI.openStory(R.L.w); }
          return;
        }
        if (runMode === "directo") { if (window.ElsPanetsUI && window.ElsPanetsUI.openLive) window.ElsPanetsUI.openLive(); return; }
        if (p && runMode !== "turnos" && inRect(p, u.share)) {
          snd.click();
          if (window.ElsPanetsUI && window.ElsPanetsUI.shareChallenge) window.ElsPanetsUI.shareChallenge({ score, seed: runSeed, y: ghostRec.slice(0, GHOST_MAX), char: selectedChar().id });
          return;
        }
        if (!p || inRect(p, u.again)) {
          snd.click();
          if (runMode === "turnos") return; // en turnos manda la ventana de turnos
          if (runMode === "diario" || runMode === "reto") nextSeed = runSeed; // el mismo recorrido
          goReady(); return;
        }
        if (inRect(p, u.home)) { snd.click(); goHome(); }
        return;
    }
  }

  // ---------- Botón «atrás» de Android (16/11/2026) ----------
  // La app hace «atrás» en el historial si puede, y si no, se cierra. Mientras hay
  // partida o una ventana abierta se guarda una entrada de más en el historial: al
  // pulsar «atrás» se gasta esa entrada y aquí se decide qué toca (cerrar la ventana,
  // pausar o volver al inicio). En el inicio no hay entrada de más: «atrás» sale.
  let guard = false, dropGuard = false;
  const overlayEls = document.querySelectorAll("#nameOverlay, #leaderboardOverlay, #installOverlay, .overlay");
  function overlayOpen() {
    for (let i = 0; i < overlayEls.length; i++) if (!overlayEls[i].classList.contains("hidden")) return true;
    return false;
  }
  function syncGuard() {
    if (dropGuard || sim) return;
    const need = state !== STATE.START || overlayOpen();
    try {
      if (need && !guard) { history.pushState({ elsPanets: 1 }, ""); guard = true; }
      else if (!need && guard) {
        dropGuard = true; history.back();
        setTimeout(() => { if (dropGuard) { dropGuard = false; guard = false; } }, 1500);
      }
    } catch (e) {}
  }
  function closeOverlays() {
    if (!nameOverlay.classList.contains("hidden")) { nameOverlay.classList.add("hidden"); if (state === STATE.NAME) goOver(); return; }
    document.getElementById("leaderboardOverlay").classList.add("hidden");
    document.getElementById("installOverlay").classList.add("hidden");
    if (window.ElsPanetsUI && window.ElsPanetsUI.closeAll) window.ElsPanetsUI.closeAll();
  }
  function backPressed() {
    if (overlayOpen()) { closeOverlays(); return; }
    if (state === STATE.SEGUIR) { declineSeguir(); return; }
    if (state === STATE.PLAY || state === STATE.COUNT) pauseGame();
    else if (state === STATE.PAUSE) leaveRun();
    else if (state === STATE.READY || state === STATE.OVER) goHome();
  }
  window.addEventListener("popstate", () => {
    guard = false;
    if (dropGuard) { dropGuard = false; return; }
    backPressed();
    syncGuard();
  });
  setInterval(syncGuard, 300);

  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); press(eventPoint(e)); });
  window.addEventListener("keydown", (e) => {
    if (state === STATE.NAME || (window.ElsPanetsUI && window.ElsPanetsUI.isOpen())) return;
    if (state === STATE.START && (e.code === "ArrowLeft" || e.code === "ArrowRight")) {
      viewChar(viewIndex + (e.code === "ArrowLeft" ? -1 : 1));
      snd.click();
      return;
    }
    // Escape o P: pausa (en el ordenador)
    if (e.code === "Escape" || e.code === "KeyP") {
      if (e.repeat) return;
      if (state === STATE.PLAY) pauseGame();
      else if (state === STATE.PAUSE) setState(STATE.COUNT);
      return;
    }
    if (e.code !== "Space" && e.code !== "ArrowUp" && e.code !== "Enter") return;
    e.preventDefault();
    if (e.repeat) return;
    press(null);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
    if (actx) { if (document.hidden) actx.suspend(); else actx.resume(); }
  });

  // ---------- Lógica (paso fijo: igual de rápido en cualquier equipo) ----------
  const STEP = 1 / 120;

  let streetT = 0;
  const STREET_INFO = { gt: 0, W: 0, scroll: 0, t: 0, night: 0, day: 1, tint: null };
  function update(dt) {
    worldT += dt;
    if (state !== STATE.PAUSE && state !== STATE.COUNT && state !== STATE.SEGUIR) streetT += dt;
    stateT += dt;
    scorePop = Math.max(0, scorePop - dt * 4);
    flashT = Math.max(0, flashT - dt * (softFlash ? 2.2 : 3.5));
    player.eatT = Math.max(0, player.eatT - dt);
    placeT = Math.min(1, placeT + dt / PLACE_SECS);
    // en la vuelta al mundo el suelo nuevo llega con la frontera
    if (worldOn() && placeFrom !== placeTo) { const e = MUNDO.groundEdge(scroll); if (e == null || e < -PLACE_BAND) placeFrom = placeTo; }
    placeBanner = Math.max(0, placeBanner - dt);
    for (const c of clouds) { c.x -= c.v * dt; if (c.x < -90) c.x += LW + 180; }

    const moving = state === STATE.START || state === STATE.READY || state === STATE.PLAY || state === STATE.OVER;
    if (moving) scroll += (state === STATE.PLAY ? worldSpeed() : 110) * dt;

    switch (state) {
      case STATE.START:
        player.x = lerp(player.x, LW / 2, Math.min(1, dt * 6));
        player.y = LH * 0.31 + Math.sin(worldT * 2.4) * 6;
        player.rot = 0;
        player.flap += dt * 9;
        break;
      case STATE.READY:
        if (runMode === "directo" && liveAt && Date.now() >= liveAt) { beginPlay(); break; }
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
      case STATE.SEGUIR:
        if (stateT >= SEGUIR_SECS) declineSeguir();
        break;
      case STATE.COUNT:
        // acabada la cuenta se sigue; si iba cayendo, la caída empieza de cero
        if (stateT >= COUNT_STEP * 3) { setState(STATE.PLAY); player.vy = Math.min(player.vy, 0); }
        break;
    }

    stepLiveRival(dt);
    // (las listas se limpian en su sitio, sin crear otras nuevas en cada paso)
    let k = 0;
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 520 * dt; pt.life -= dt;
      if (pt.life > 0) particles[k++] = pt;
    }
    particles.length = k;
    // estela: un punto cada poco, que se va con el escenario
    if (state === STATE.PLAY) {
      for (let i = 0; i < trail.length; i++) trail[i].x -= worldSpeed() * dt;
      trailAcc += dt;
      if (trailAcc >= 0.055) { trailAcc = 0; trail.push({ x: player.x - 12, y: player.y - 2, t: worldT }); }
      while (trail.length && worldT - trail[0].t > TRAIL_LIFE) trail.shift();
    }
    k = 0;
    for (let i = 0; i < floaters.length; i++) { const f = floaters[i]; f.t += dt; if (f.t < 0.9) floaters[k++] = f; }
    floaters.length = k;
  }

  function stepPlay(dt) {
    // paraguas: cae despacio
    const umb = powerOn("paraguas");
    player.vy = Math.min(player.vy + GRAVITY * (umb ? 0.5 : 1) * dt, umb ? 260 : 720);
    player.y += player.vy * dt;
    // la sombra: se apunta la altura 30 veces por segundo
    runT += dt;
    playSecs += dt;
    while (ghostRec.length < Math.min(runMode === "directo" ? 20000 : GHOST_MAX, runT * 30)) ghostRec.push(Math.round(player.y));
    const targetRot = clamp(player.vy / 560, -0.42, 1.25);
    player.rot += (targetRot - player.rot) * Math.min(1, dt * 12);
    player.flap += dt * (player.vy < 0 ? 18 : 7);
    if (player.y < 14) { player.y = 14; player.vy = Math.max(0, player.vy); }

    // poderes: se gastan con el tiempo; el mini encoge y crece sin saltos
    for (const k in powerT) powerT[k] = Math.max(0, powerT[k] - dt);
    shieldSafe = Math.max(0, shieldSafe - dt);
    miniK += ((powerOn("mini") ? 0.62 : 1) - miniK) * Math.min(1, dt * 5);

    // centro del cuerpo para los choques (algo más pequeño que el dibujo: justo)
    const hx = player.x + 1, hy = player.y - 5, hr = player.hitR * miniK;
    if (hy + hr > groundTop()) {
      if (shield || shieldSafe > 0) {
        if (shield) breakShield();
        player.y = groundTop() - hr + 4; player.vy = FLAP_V;
      } else { crash(); return; }
    }

    // la velocidad va hacia la que toca por puntos, sin saltos
    speed += (speedAt(effScore()) - speed) * Math.min(1, dt * 1.5);
    // cámara lenta: el mundo va más despacio (el personaje no)
    const wsp = worldSpeed();
    distToSpawn += wsp * dt;
    if (distToSpawn >= SPACING) { distToSpawn -= SPACING; if (!level || level.spawned < level.len) spawnColumn(LW + 20); }

    // filas de tres: se cogen de cerca (o vienen solas con el imán)
    let nb = 0;
    for (let i = 0; i < bites.length; i++) {
      const b = bites[i];
      b.x -= wsp * dt;
      if (powerOn("iman") && (b.pull > 0 || (b.x > hx - 20 && Math.hypot(b.x - hx, b.y - hy) < 200))) b.pull = Math.min(1, b.pull + dt * 2.4);
      const bp = bitePos(b), bx = bp.x, by = bp.y;
      if ((hx - bx) ** 2 + (hy - by) ** 2 < (hr + 12) ** 2) eatBite(b, bx, by);
      if (!b.eaten && b.x > -30) bites[nb++] = b;
    }
    bites.length = nb;

    for (let ci = 0; ci < cols.length; ci++) {
      const c = cols[ci];
      c.x -= wsp * dt;
      c.bob += dt * 3;
      const top = c.gapY, bot = c.gapY + c.gap;
      if (shieldSafe <= 0 && (hitRect(hx, hy, hr, c.x, -50, COL_W, top + 50 - CAP_H) || hitRect(hx, hy, hr, c.x - CAP_OUT, top - CAP_H, COL_W + CAP_OUT * 2, CAP_H) ||
          hitRect(hx, hy, hr, c.x - CAP_OUT, bot, COL_W + CAP_OUT * 2, CAP_H) || hitRect(hx, hy, hr, c.x, bot + CAP_H, COL_W, groundTop() - bot))) {
        if (shield) breakShield();
        else { crash(); return; }
      }
      if (!c.passed && c.x + COL_W < hx - hr) {
        c.passed = true; addScore(1); snd.point(combo);
        // en la historia: ¿última columna? ¡meta!
        if (level && ++level.passed >= level.len) { winLevel(); return; }
        // se ha dejado la empanadilla: la racha vuelve a empezar
        if (c.food && !c.eaten && !isPower(c.kind) && !SPECIALS[c.kind]) combo = 0;
      }
      if (c.food && !c.eaten) {
        // imán: la comida cercana (no los poderes) viene sola
        // (Rim, con su olfato, atrae la comida que tiene muy cerca aunque no lleve imán)
        if ((powerOn("iman") || abil() === "perro") && !isPower(c.kind)) {
          const mx = c.x + COL_W / 2, my = c.gapY + c.gap / 2 + c.fdy;
          if (c.pull > 0 || (mx > hx - 20 && Math.hypot(mx - hx, my - hy) < (powerOn("iman") ? 200 : 80))) c.pull = Math.min(1, c.pull + dt * 2.4);
        }
        const fp = foodPos(c), fx = fp.x, fy = fp.y;
        if ((hx - fx) ** 2 + (hy - fy) ** 2 < (hr + 15) ** 2) {
          c.eaten = true;
          player.eatT = 0.3;
          if (isPower(c.kind)) { collectPower(c.kind.slice(2), fx, fy); continue; }
          if (c.kind === "novia") girlfriend = c.girl;
          if (SPECIALS[c.kind]) { collectSpecial(c.kind, fx, fy); continue; }
          eaten++;
          const gold = c.kind === "dorada", extra = gainCombo();
          addScore((gold ? 10 : 3) + extra, fx, fy - 20);
          if (gold && level) level.gold = true;
          if (gold) { floaters.push({ x: Math.max(fx, 90), y: fy - 52, txt: "¡DORADA!", t: 0, size: 22, color: "#ffe066" }); snd.power(); emit("dorada"); }
          else snd.eat();
          emit("come", 1);
          vibrate(12);
          burst(fx, fy, BITE_COLORS, 14, 130);
          if (selectedChar().special && eaten % specialEvery(selectedChar()) === 0) pendingSpecial = true;
        }
      }
    }
    let nc = 0;
    for (let i = 0; i < cols.length; i++) if (cols[i].x > -COL_W - 20) cols[nc++] = cols[i];
    cols.length = nc;
  }

  function worldSpeed() { return speed * (powerOn("lenta") ? 0.62 : 1); }

  function hitRect(cx, cy, r, x, y, w, h) {
    const nx = clamp(cx, x, x + w), ny = clamp(cy, y, y + h);
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  // ---------- Dibujo del escenario ----------
  let skyGrad = null, skyPal = null, skyGT = 0;
  function drawSky(pal) {
    // el degradado del cielo se guarda mientras no cambien la hora ni la pantalla
    if (skyPal !== pal || skyGT !== groundTop()) {
      skyPal = pal; skyGT = groundTop();
      skyGrad = mainCtx.createLinearGradient(0, 0, 0, skyGT);
      skyGrad.addColorStop(0, rgb(pal.top));
      skyGrad.addColorStop(1, rgb(pal.bottom));
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, LW, LH);

    // estrellas quietas (sin parpadeo)
    if (pal.night > 0.05 && !lowQ) {
      ctx.fillStyle = `rgba(255,255,240,${pal.night * 0.85})`;
      for (const s of stars) { ctx.beginPath(); ctx.arc(s.x, s.y * groundTop(), s.r, 0, Math.PI * 2); ctx.fill(); }
    }
    // el sol cruza el cielo de 6:30 a 20:00 y la luna por la noche
    const h = pal.hour, gt = groundTop();
    const arc = (k) => ({ x: lerp(30, LW - 30, k), y: gt - 150 - Math.sin(k * Math.PI) * (gt - 150 - LH * 0.1) });
    if (h > 6 && h < 20.5) {
      const k = (h - 6) / 14.5, p = arc(k);
      const low = 1 - Math.sin(k * Math.PI);
      const sr = lerp(26, 36, low);
      const col = lerpArr([255, 238, 150], [255, 140, 70], clamp(low * 1.3, 0, 1));
      if (!lowQ) {
        const halo = ctx.createRadialGradient(p.x, p.y, sr * 0.5, p.x, p.y, sr * 3);
        halo.addColorStop(0, rgb(col, 0.45 * (1 - pal.night)));
        halo.addColorStop(1, rgb(col, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(p.x - sr * 3, p.y - sr * 3, sr * 6, sr * 6);
      }
      ctx.fillStyle = rgb(col, clamp(1 - pal.night * 1.2, 0, 1));
      ctx.beginPath(); ctx.arc(p.x, p.y, sr, 0, Math.PI * 2); ctx.fill();
    }
    const mh = h < 12 ? h + 24 : h;
    if (mh > 19.5 && mh < 30.5 && pal.night > 0.2) {
      const k = (mh - 19.5) / 11, p = arc(k);
      const a = clamp((pal.night - 0.2) / 0.5, 0, 1);
      ctx.fillStyle = `rgba(250,246,220,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgb(pal.top, a);
      ctx.beginPath(); ctx.arc(p.x + 9, p.y - 5, 17, 0, Math.PI * 2); ctx.fill();
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

  function drawHouses(pal, white) {
    const base = groundTop();
    const off = -((scroll * 0.45) % HOUSE_TILE);
    const n = pal.night;
    for (let rep = 0; rep < 3; rep++) {
      for (const h of houses) {
        const x = off + rep * HOUSE_TILE + h.x;
        if (x > LW + 30 || x + h.w < -40) continue;
        if (h.palm && !white) drawPalm(x - 12, base, n);
        const wall = nightTint(white ? "#f8f4ea" : h.color, n);
        // pared
        ctx.fillStyle = wall;
        ctx.fillRect(x, base - h.h, h.w, h.h);
        ctx.fillStyle = nightTint(white ? h.color : darken(h.color, 0.18), n);
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
        ctx.fillStyle = nightTint(white ? darken(h.color, 0.3) : "#7a4a2a", n);
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

  // ---------- Lugares: ciudad, playa, montaña y pueblo (01/11/2026) ----------
  const prnd = seeded(2026);
  const BEACH_TILE = 600, FOREST_TILE = 520, CABIN_TILE = 640, VILLAGE_TILE = 700;
  const BEACH_COLORS = ["#e63946", "#2a8bb5", "#f4a259", "#2fa64a"];
  const beachItems = [];
  for (let x = 20; x < BEACH_TILE - 60;) {
    const r = prnd();
    beachItems.push({ x, type: r < 0.4 ? "palm" : r < 0.8 ? "umbrella" : "hut", c: BEACH_COLORS[Math.floor(prnd() * 4)] });
    x += 90 + Math.floor(prnd() * 70);
  }
  // cordillera de picos (se repite sin cortes)
  const alps = [];
  for (let x = 0; x <= MOUNT_TILE; x += 8) {
    const p = (x / MOUNT_TILE) * Math.PI * 2;
    alps.push(100 + 60 * Math.abs(Math.sin(p * 1.5 + 0.3)) + 40 * Math.abs(Math.sin(p * 3.5 + 1.1)) + 10 * Math.sin(9 * p));
  }
  const forest = [];
  for (let x = 0; x < FOREST_TILE; x += 14 + Math.floor(prnd() * 12)) forest.push({ x, h: 36 + prnd() * 36 });
  const cabins = [];
  for (let x = 10; x < CABIN_TILE - 60;) {
    const cabin = prnd() < 0.3;
    cabins.push({ x, type: cabin ? "cabin" : "pine", h: 70 + prnd() * 50, w: 70 + prnd() * 20 });
    x += cabin ? 120 : 45 + prnd() * 40;
  }

  function mixHex(a, b, f) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(lerp(A[0], B[0], f), lerp(A[1], B[1], f), lerp(A[2], B[2], f));
  }
  // Cambio de zona: la nueva entra por la derecha y avanza despacio hacia la
  // izquierda, con un borde suave, como si fueras volando hacia ella.
  const PLACE_SECS = 10, PLACE_BAND = 160;
  function changingPlace() {
    if (worldOn()) {
      if (state === STATE.START || placeFrom === placeTo) return false;
      const e = MUNDO.groundEdge(scroll);
      return e != null && e < LW + PLACE_BAND && e > -PLACE_BAND;
    }
    return state !== STATE.START && placeT < 1 && placeFrom !== placeTo;
  }
  // 16/11/2026: el cambio se hace en una sola pasada. La zona nueva (paisaje y suelo) se
  // pinta una vez aparte y solo en el trozo que ya se ve; después se copia en dos partes:
  // el paisaje antes de las columnas y el suelo después. Lo viejo solo se pinta donde aún
  // se ve. Antes se pintaba todo dos veces, y aparte otras dos.
  let wipeOn = false, wipeX0 = 0, wipeX1 = 0;
  function prepareWipe(pal) {
    wipeOn = changingPlace();
    if (!wipeOn) return;
    const e = worldOn() ? MUNDO.groundEdge(scroll) : LW + PLACE_BAND / 2 - smooth(placeT) * (LW + PLACE_BAND); // centro del borde suave
    wipeX0 = Math.max(0, Math.floor(e - PLACE_BAND / 2));  // desde aquí hacia la derecha hay zona nueva
    wipeX1 = Math.min(LW, Math.ceil(e + PLACE_BAND / 2));  // hasta aquí queda algo de la vieja
    if (wipeX0 >= LW) { wipeOn = false; wipeX1 = LW; return; }
    offCtx.save();
    offCtx.beginPath(); offCtx.rect(wipeX0, 0, LW - wipeX0, LH); offCtx.clip();
    offCtx.clearRect(wipeX0, 0, LW - wipeX0, LH);
    ctx = offCtx;
    try { if (!worldOn()) drawPlace(placeTo, pal); drawGroundOf(pal, groundOf(placeTo)); } finally { ctx = mainCtx; }
    offCtx.restore();
    // el borde suave: solo se difumina la franja; a su derecha la zona nueva queda entera
    offCtx.save();
    offCtx.beginPath(); offCtx.rect(wipeX0, 0, wipeX1 - wipeX0, LH); offCtx.clip();
    offCtx.globalCompositeOperation = "destination-in";
    const g = offCtx.createLinearGradient(e - PLACE_BAND / 2, 0, e + PLACE_BAND / 2, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    offCtx.fillStyle = g;
    offCtx.fillRect(wipeX0, 0, wipeX1 - wipeX0, LH);
    offCtx.restore();
  }
  // copia la zona nueva: el paisaje (top) o el suelo, punto por punto, sin estirar
  function copyWipe(top) {
    const k = canvas.width / LW, sx = Math.floor(wipeX0 * k), sy = Math.round(groundTop() * k);
    const y = top ? 0 : sy, h = top ? sy : canvas.height - sy, w = canvas.width - sx;
    if (w > 0 && h > 0) ctx.drawImage(offCv, sx, y, w, h, sx / k, y / k, w / k, h / k);
  }
  // lo viejo, solo en la parte de la pantalla donde todavía se ve
  function clipOld() { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, wipeX1, LH); ctx.clip(); }
  function drawPlace(i, pal) {
    if (i === 1) { drawSea(pal); drawBeach(pal); }
    else if (i === 2) { drawAlps(pal); drawForest(pal); drawCabins(pal); }
    else if (i === 3) { drawMountains(pal); drawVillageFar(pal); drawHouses(pal, true); }
    else if (i === 4) { drawMountains(pal); drawBcnFar(pal); drawBcnNear(pal); }
    else { drawMountains(pal); drawCity(pal); drawHouses(pal); }
  }
  function drawScenery(pal) {
    if (worldOn()) {
      const I = WORLD_INFO; I.W = LW; I.H = LH; I.gt = groundTop(); I.scroll = scroll; I.night = pal.night; I.pal = pal;
      MUNDO.draw(ctx, I);
      if (!lowQ && !calmOn) drawLife(MUNDO.ROUTE[placeTo].life, pal);
      return;
    }
    if (state === STATE.START) { drawPlace(0, pal); if (!lowQ && !calmOn) drawLife(0, pal); return; }
    if (!wipeOn) drawPlace(placeTo, pal);
    else {
      clipOld(); drawPlace(placeFrom, pal); ctx.restore();
      copyWipe(true);
    }
    // en calidad baja no hay adornos (pájaros, globo, nieve, mariposas)
    if (!lowQ && !calmOn) drawLife(placeTo, pal);
  }

  const WORLD_INFO = { W: 0, H: 0, gt: 0, scroll: 0, night: 0, pal: null };
  // ---------- Vida en los mapas (05/11/2026) ----------
  // Todo se mueve despacio y sin parpadear: pájaros, y cada sitio lo suyo.
  const SNOW = Array.from({ length: 36 }, () => ({ x: Math.random() * LW, y: Math.random(), r: 1.2 + Math.random() * 1.8, v: 18 + Math.random() * 16, p: Math.random() * 6 }));
  const BUTTERFLIES = [{ c: "#ffd23f", p: 0 }, { c: "#ff8fb8", p: 2.1 }, { c: "#8fd3ff", p: 4.3 }];
  const FLOCK = [[0, 0, 1], [18, 9, 0.85], [30, -6, 0.8], [44, 12, 0.7]];
  function drawBird(x, y, s, ph) {
    const w = Math.sin(ph) * 4;
    ctx.beginPath(); ctx.moveTo(x - 7 * s, y - w * s); ctx.quadraticCurveTo(x - 3 * s, y - 3 * s, x, y); ctx.quadraticCurveTo(x + 3 * s, y - 3 * s, x + 7 * s, y - w * s); ctx.stroke();
  }
  function drawLife(i, pal) {
    const gt = groundTop(), day = clamp(1 - pal.night * 1.4, 0, 1), t = worldT;
    // bandada de pájaros que cruza de vez en cuando (de día)
    if (day > 0.05 && window.ElsPanetsCalle) {
      const I = STREET_INFO; I.W = LW; I.t = worldT; I.night = pal.night; I.day = day * 0.95; I.tint = nightTint;
      window.ElsPanetsCalle.cielo(ctx, i, I);
    } else if (day > 0.05) {
      ctx.globalAlpha = day * 0.8;
      ctx.strokeStyle = i === 1 || i === 4 ? "#ffffff" : "#3a3a48"; ctx.lineWidth = 1.8; ctx.lineCap = "round";
      const span = LW + 700, bx = LW + 60 - ((t * 34) % span), by = 110 + Math.sin(t * 0.4) * 14;
      for (const b of FLOCK) drawBird(bx + b[0], by + b[1], b[2], t * 7 + b[0]);
      ctx.lineCap = "butt"; ctx.globalAlpha = 1;
    }
    if (i === 0 && day > 0.05) {
      // ciudad: un globo que pasa muy despacio
      const span = LW + 240, gx = ((t * 9) % span) - 80, gy = 150 + Math.sin(t * 0.5) * 8;
      ctx.globalAlpha = day * 0.9;
      ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx - 8, gy + 14); ctx.lineTo(gx - 5, gy + 26); ctx.moveTo(gx + 8, gy + 14); ctx.lineTo(gx + 5, gy + 26); ctx.stroke();
      ctx.fillStyle = "#e5533d"; ctx.beginPath(); ctx.ellipse(gx, gy, 15, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.ellipse(gx, gy, 6, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8a5a2b"; ctx.fillRect(gx - 6, gy + 25, 12, 8);
      ctx.globalAlpha = 1;
    } else if (i === 1) {
      // playa: un velero en el horizonte
      const hz = gt - 170, span = LW + 160, sx = ((t * 7) % span) - 60, sy = hz + 6;
      ctx.fillStyle = "#5a3a20"; ctx.beginPath(); ctx.moveTo(sx - 14, sy); ctx.lineTo(sx + 14, sy); ctx.lineTo(sx + 9, sy + 6); ctx.lineTo(sx - 9, sy + 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fffaf0"; ctx.beginPath(); ctx.moveTo(sx, sy - 26); ctx.lineTo(sx, sy - 2); ctx.lineTo(sx + 13, sy - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e5533d"; ctx.beginPath(); ctx.moveTo(sx - 2, sy - 20); ctx.lineTo(sx - 2, sy - 2); ctx.lineTo(sx - 11, sy - 2); ctx.closePath(); ctx.fill();
    } else if (i === 2) {
      // montaña: nieve que cae despacio
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const f of SNOW) {
        const y = (f.y * gt + t * f.v) % gt, x = (((f.x + Math.sin(t * 0.8 + f.p) * 10) % LW) + LW) % LW;
        ctx.beginPath(); ctx.arc(x, y, f.r, 0, Math.PI * 2); ctx.fill();
      }
    } else if (i === 4) {
      // Barcelona: el teleférico de Montjuïc cruza muy despacio
      const y0 = gt - 300, y1 = gt - 230, cxp = ((t * 6) % (LW + 120)) - 60, k = clamp(cxp / LW, 0, 1), cy = lerp(y0, y1, k);
      ctx.strokeStyle = "rgba(40,40,50,0.55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y0 - 6); ctx.lineTo(LW, y1 - 6); ctx.stroke();
      ctx.fillStyle = nightTint("#d63a32", pal.night); ctx.strokeStyle = "#3b2414";
      ctx.beginPath(); ctx.moveTo(cxp, cy - 6); ctx.lineTo(cxp, cy); ctx.stroke();
      roundRect(cxp - 8, cy, 16, 12, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pal.night > 0.4 ? "#ffd27a" : "#cfe8f5"; ctx.fillRect(cxp - 5, cy + 3, 10, 4);
    } else if (i === 3 && day > 0.05) {
      // pueblo blanco: mariposas por encima de los tejados
      for (const b of BUTTERFLIES) {
        const x = LW * 0.5 + Math.sin(t * 0.35 + b.p) * LW * 0.42, y = gt - 110 + Math.sin(t * 0.9 + b.p * 2) * 18;
        const w = 0.35 + Math.abs(Math.sin(t * 9 + b.p)) * 0.65;
        ctx.fillStyle = b.c; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 0.8;
        for (const sd of NUMS_1) { ctx.beginPath(); ctx.ellipse(x + sd * 3.5 * w, y, 4 * w, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = "#3b2414"; ctx.fillRect(x - 0.6, y - 3, 1.2, 6);
      }
    }
  }

  // --- Playa ---
  function drawSea(pal) {
    const gt = groundTop(), hz = gt - 170, n = pal.night;
    // isla a lo lejos
    const io = -((scroll * 0.04) % 900);
    ctx.fillStyle = rgb(lerpArr(pal.mount, pal.bottom, 0.5));
    for (let rep = 0; rep < 2; rep++) {
      const ix = io + rep * 900 + 260;
      ctx.beginPath(); ctx.ellipse(ix, hz, 90, 26, 0, Math.PI, 0); ctx.fill();
    }
    const g = ctx.createLinearGradient(0, hz, 0, gt);
    g.addColorStop(0, nightTint("#5fb3d9", n));
    g.addColorStop(1, nightTint("#1f6f9e", n));
    ctx.fillStyle = g;
    ctx.fillRect(0, hz, LW, gt - hz);
    // rayitas de olas que se desplazan despacio (sin brillos que parpadeen)
    ctx.strokeStyle = `rgba(255,255,255,${0.28 * (1 - n * 0.6)})`;
    ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath();
    for (let row = 0; row < 6; row++) {
      const y = hz + 12 + row * 24, sp = 0.06 + row * 0.04, len = 10 + row * 5, step = 70 + row * 10;
      const o = -((scroll * sp + row * 37) % step);
      for (let x = o; x < LW + step; x += step) { ctx.moveTo(x, y); ctx.lineTo(x + len, y); }
    }
    ctx.stroke();
    // velero
    const bx = LW - ((scroll * 0.07 + 120) % (LW + 120)), by = hz + 18;
    ctx.fillStyle = nightTint("#ffffff", n);
    ctx.beginPath(); ctx.moveTo(bx, by - 2); ctx.lineTo(bx, by - 28); ctx.lineTo(bx + 15, by - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = nightTint("#7a4a2a", n);
    ctx.beginPath(); ctx.moveTo(bx - 10, by); ctx.lineTo(bx + 19, by); ctx.lineTo(bx + 15, by + 5); ctx.lineTo(bx - 6, by + 5); ctx.closePath(); ctx.fill();
  }

  function drawBeach(pal) {
    const gt = groundTop(), n = pal.night, so = scroll * 0.45;
    // arena con dunas suaves
    ctx.fillStyle = nightTint("#efd9a0", n);
    ctx.beginPath(); ctx.moveTo(0, gt);
    for (let x = 0; x <= LW; x += 10) ctx.lineTo(x, gt - 24 - 6 * Math.sin((x + so) / 60));
    ctx.lineTo(LW, gt); ctx.closePath(); ctx.fill();
    const off = -(so % BEACH_TILE);
    for (let rep = 0; rep < 3; rep++) {
      for (const it of beachItems) {
        const x = off + rep * BEACH_TILE + it.x;
        if (x < -80 || x > LW + 80) continue;
        if (it.type === "palm") drawPalm(x, gt - 12, n);
        else if (it.type === "umbrella") drawUmbrella(x, gt - 16, it.c, n);
        else drawHut(x, gt - 14, n);
      }
    }
  }
  function drawUmbrella(x, base, c, n) {
    ctx.strokeStyle = nightTint("#8a6234", n); ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x - 3, base - 46); ctx.stroke();
    const tx = x - 3, ty = base - 40;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = nightTint(i % 2 ? "#ffffff" : c, n);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.arc(tx, ty, 28, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = nightTint(c, n);
    ctx.fillRect(x + 6, base - 3, 30, 5); // toalla
  }
  function drawHut(x, base, n) {
    ctx.fillStyle = nightTint("#b07a45", n);
    ctx.fillRect(x - 26, base - 34, 52, 34);
    ctx.fillStyle = n > 0.5 ? "#ffd27a" : nightTint("#5a3a20", n);
    ctx.fillRect(x - 18, base - 30, 36, 11);
    ctx.fillStyle = nightTint("#e0b86a", n); // tejado de paja
    ctx.beginPath(); ctx.moveTo(x - 36, base - 30); ctx.lineTo(x, base - 58); ctx.lineTo(x + 36, base - 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = nightTint("#7a4a2a", n);
    ctx.fillRect(x - 30, base - 18, 60, 5); // barra
  }

  // --- Montaña ---
  function drawAlps(pal) {
    const base = groundTop() - 60, off = -((scroll * 0.08) % MOUNT_TILE);
    for (let layer = 0; layer < 2; layer++) {
      const col = layer === 0 ? lerpArr(pal.mount, pal.bottom, 0.5) : lerpArr(pal.mount, [96, 104, 124], 0.4);
      const h = layer === 0 ? 1.3 : 1.0, o = layer === 0 ? off * 0.6 - 300 : off;
      ctx.beginPath(); ctx.moveTo(-10, LH);
      for (let rep = -1; rep < 2; rep++) {
        for (let i = 0; i < alps.length; i++) {
          const x = o + rep * MOUNT_TILE + i * 8;
          if (x < -10 || x > LW + 10) continue;
          ctx.lineTo(x, base - 30 - alps[i] * h);
        }
      }
      ctx.lineTo(LW + 10, LH); ctx.closePath();
      ctx.fillStyle = rgb(col); ctx.fill();
      // nieve en las cumbres, con el borde ondulado
      ctx.save(); ctx.clip();
      ctx.fillStyle = nightTint(layer === 0 ? "#eef4f8" : "#ffffff", pal.night);
      const snowY = base - 30 - (layer === 0 ? 168 : 150) * h;
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let x = 0; x <= LW; x += 8) ctx.lineTo(x, snowY + 6 * Math.sin((x - o) / 19));
      ctx.lineTo(LW, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function drawForest(pal) {
    const base = groundTop() - 30, off = -((scroll * 0.2) % FOREST_TILE);
    ctx.fillStyle = rgb(lerpArr(pal.mount, [24, 70, 46], 0.5));
    ctx.fillRect(0, base - 6, LW, 60);
    for (let rep = 0; rep < 2; rep++) {
      for (const t of forest) {
        const x = off + rep * FOREST_TILE + t.x;
        if (x < -20 || x > LW + 20) continue;
        ctx.beginPath(); ctx.moveTo(x - 10, base); ctx.lineTo(x, base - t.h); ctx.lineTo(x + 10, base); ctx.closePath(); ctx.fill();
      }
    }
  }
  function drawCabins(pal) {
    const base = groundTop(), n = pal.night, off = -((scroll * 0.45) % CABIN_TILE);
    for (let rep = 0; rep < 3; rep++) {
      for (const it of cabins) {
        const x = off + rep * CABIN_TILE + it.x;
        if (x < -100 || x > LW + 100) continue;
        if (it.type === "pine") drawPine(x, base, it.h, n);
        else drawCabin(x, base, it.w, n);
      }
    }
  }
  function drawPine(x, base, h, n) {
    ctx.fillStyle = nightTint("#6b4a25", n);
    ctx.fillRect(x - 3, base - 14, 6, 14);
    ctx.fillStyle = nightTint("#2f7a45", n);
    for (let k = 0; k < 3; k++) {
      const w = 22 - k * 5, y0 = base - 10 - k * h * 0.24;
      ctx.beginPath(); ctx.moveTo(x - w, y0); ctx.lineTo(x, y0 - h * 0.45); ctx.lineTo(x + w, y0); ctx.closePath(); ctx.fill();
    }
    const ty = base - 10 - 2 * h * 0.24 - h * 0.45; // nieve en la punta
    ctx.fillStyle = nightTint("#ffffff", n);
    ctx.beginPath(); ctx.moveTo(x - 5, ty + 9); ctx.lineTo(x, ty); ctx.lineTo(x + 5, ty + 9); ctx.closePath(); ctx.fill();
  }
  function drawCabin(x, base, w, n) {
    const h = 44;
    ctx.fillStyle = nightTint("#9a6638", n);
    ctx.fillRect(x, base - h, w, h);
    ctx.strokeStyle = nightTint("#7a4c26", n); ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = base - h + 7; y < base; y += 7) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); }
    ctx.stroke();
    ctx.fillStyle = nightTint("#5a3a22", n);
    ctx.beginPath(); ctx.moveTo(x - 8, base - h + 2); ctx.lineTo(x + w / 2, base - h - 26); ctx.lineTo(x + w + 8, base - h + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = nightTint("#ffffff", n); // nieve en el tejado
    ctx.beginPath(); ctx.moveTo(x - 6, base - h); ctx.lineTo(x + w / 2, base - h - 26); ctx.lineTo(x + w + 6, base - h);
    ctx.lineTo(x + w / 2, base - h - 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = nightTint("#5a3a22", n);
    ctx.fillRect(x + w / 2 - 7, base - 24, 14, 24);
    ctx.fillStyle = n > 0.5 ? "#ffd27a" : nightTint("#fff3d6", n);
    ctx.fillRect(x + 8, base - h + 12, 13, 12);
    ctx.fillRect(x + w - 21, base - h + 12, 13, 12);
  }

  // --- Pueblo ---
  // --- Barcelona (17/11/2026): Collserola detrás, la Sagrada Família, la Torre Glòries
  // y casas del Eixample con sus balcones de hierro ---
  const BCN_TILE = 760, BCN_NEAR_TILE = 640;
  const bcnFar = (() => { const a = []; for (let x = 0; x < BCN_TILE; ) { const w = 26 + Math.floor(rnd() * 26); if ((x < 150 || x > 260) && (x < 500 || x > 580)) a.push({ x, w, h: 40 + Math.floor(rnd() * 50) }); x += w + 4; } return a; })();
  const SAGRADA = [[-32, 112, 8], [-20, 128, 8], [20, 128, 8], [32, 112, 8], [-8, 146, 9], [8, 146, 9], [0, 176, 11]];
  const BCN_COLORS = ["#ead7b6", "#d9b98e", "#f0e2cc", "#e2c1a2", "#d8c6a6", "#e9d0b8"];
  const bcnNear = (() => { const a = []; let x = 0; const ws = [104, 96, 112, 100, 108, 96]; for (let i = 0; i < ws.length; i++) { a.push({ x, w: ws[i], h: 112 + ((i * 37) % 34), color: BCN_COLORS[i], tree: i % 2 === 0 }); x += ws[i] + 6; } return a; })();
  function drawBcnFar(pal) {
    const base = groundTop() - 34, off = -((scroll * 0.2) % BCN_TILE), col = rgb(pal.city);
    for (let rep = 0; rep < 2; rep++) {
      const x0 = off + rep * BCN_TILE;
      if (x0 > LW || x0 + BCN_TILE < 0) continue;
      ctx.fillStyle = col;
      for (const b of bcnFar) if (x0 + b.x < LW && x0 + b.x + b.w > 0) ctx.fillRect(x0 + b.x, base - b.h, b.w, b.h + 40);
      // Sagrada Família: el templo y sus torres con la punta redonda
      const sx = x0 + 205;
      if (sx > -60 && sx < LW + 60) {
        ctx.fillRect(sx - 42, base - 66, 84, 106);
        for (const [dx, h, w] of SAGRADA) {
          ctx.fillRect(sx + dx - w / 2, base - h, w, h);
          ctx.beginPath(); ctx.ellipse(sx + dx, base - h, w / 2, w * 1.2, 0, Math.PI, Math.PI * 2); ctx.fill();
          ctx.fillRect(sx + dx - 1, base - h - w * 1.2 - 6, 2, 7);
        }
      }
      // Torre Glòries: la bala con lucecitas de noche
      const gx = x0 + 540, gh = 150;
      if (gx > -30 && gx < LW + 30) {
        ctx.beginPath(); ctx.moveTo(gx - 17, base + 40); ctx.lineTo(gx - 17, base - gh + 34);
        ctx.quadraticCurveTo(gx - 17, base - gh, gx, base - gh); ctx.quadraticCurveTo(gx + 17, base - gh, gx + 17, base - gh + 34);
        ctx.lineTo(gx + 17, base + 40); ctx.closePath(); ctx.fill();
        if (pal.night > 0.3) {
          for (let yy = base - gh + 20; yy < base; yy += 8) for (let xx = gx - 12; xx <= gx + 12; xx += 6) {
            ctx.fillStyle = ((xx + yy) % 3) ? "rgba(255,90,90," + pal.night * 0.55 + ")" : "rgba(90,170,255," + pal.night * 0.6 + ")";
            ctx.fillRect(xx, yy, 3, 3);
          }
        }
      }
    }
  }
  function drawBcnNear(pal) {
    const base = groundTop(), off = -((scroll * 0.45) % BCN_NEAR_TILE), n = pal.night;
    const iron = nightTint("#2a2a2e", n), win = n > 0.5 ? "#ffd27a" : nightTint("#5d4a3a", n);
    for (let rep = 0; rep < 3; rep++) {
      for (const b of bcnNear) {
        const x = off + rep * BCN_NEAR_TILE + b.x;
        if (x > LW + 30 || x + b.w < -40) continue;
        ctx.fillStyle = nightTint(b.color, n);
        ctx.fillRect(x, base - b.h, b.w, b.h);
        ctx.fillStyle = nightTint(darken(b.color, 0.2), n);
        ctx.fillRect(x - 3, base - b.h - 6, b.w + 6, 7);
        // planta baja con arcos de tienda
        ctx.fillStyle = nightTint("#7a5a3a", n);
        for (let ax = x + 8; ax < x + b.w - 20; ax += 30) { ctx.beginPath(); ctx.moveTo(ax, base); ctx.lineTo(ax, base - 18); ctx.arc(ax + 9, base - 18, 9, Math.PI, 0); ctx.lineTo(ax + 18, base); ctx.closePath(); ctx.fill(); }
        // pisos: puertas de balcón con su barandilla de hierro
        ctx.strokeStyle = iron; ctx.lineWidth = 1.2;
        for (let fy = base - b.h + 12; fy < base - 40; fy += 24) {
          for (let wx = x + 9; wx < x + b.w - 14; wx += 18) {
            ctx.fillStyle = win; ctx.fillRect(wx, fy, 8, 14);
            ctx.beginPath(); ctx.moveTo(wx - 3, fy + 14); ctx.lineTo(wx + 11, fy + 14); ctx.moveTo(wx - 3, fy + 9); ctx.lineTo(wx + 11, fy + 9);
            ctx.moveTo(wx - 3, fy + 9); ctx.lineTo(wx - 3, fy + 14); ctx.moveTo(wx + 11, fy + 9); ctx.lineTo(wx + 11, fy + 14); ctx.stroke();
          }
        }
        // plátano de sombra en la acera
        if (b.tree) {
          const tx = x - 6;
          ctx.fillStyle = nightTint("#6b4a2e", n); ctx.fillRect(tx - 2, base - 40, 4, 40);
          ctx.fillStyle = nightTint("#5c9a46", n);
          ctx.beginPath(); ctx.arc(tx, base - 48, 16, 0, Math.PI * 2); ctx.arc(tx - 11, base - 40, 11, 0, Math.PI * 2); ctx.arc(tx + 11, base - 41, 12, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  function drawVillageFar(pal) {
    const base = groundTop() - 34, off = -((scroll * 0.2) % VILLAGE_TILE);
    ctx.fillStyle = rgb(pal.city);
    for (let rep = 0; rep < 2; rep++) {
      const x0 = off + rep * VILLAGE_TILE;
      if (x0 > LW || x0 + VILLAGE_TILE < 0) continue;
      for (let i = 0; i < 10; i++) ctx.fillRect(x0 + i * 70 + (i % 3) * 8, base - 26 - (i % 2) * 12, 54, 70);
      // campanario con su cruz
      const cx = x0 + 180;
      ctx.fillRect(cx, base - 120, 34, 130);
      ctx.beginPath(); ctx.moveTo(cx - 4, base - 120); ctx.lineTo(cx + 17, base - 150); ctx.lineTo(cx + 38, base - 120); ctx.closePath(); ctx.fill();
      ctx.fillRect(cx + 16, base - 164, 2, 16); ctx.fillRect(cx + 11, base - 159, 12, 2);
      // molino que gira despacio
      const mx = x0 + 470;
      ctx.beginPath(); ctx.moveTo(mx - 16, base); ctx.lineTo(mx - 10, base - 80); ctx.lineTo(mx + 10, base - 80); ctx.lineTo(mx + 16, base); ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.translate(mx, base - 82);
      ctx.rotate(worldT * 0.3);
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-3, 0, 6, 46); }
      ctx.restore();
    }
  }

  function drawGround(pal) {
    if (state === STATE.START) { drawGroundOf(pal, groundOf(worldOn() ? placeTo : 0)); return; }
    if (!wipeOn) { drawGroundOf(pal, groundOf(placeTo)); return; }
    clipOld(); drawGroundOf(pal, groundOf(placeFrom)); ctx.restore();
    copyWipe(false);
  }
  function drawGroundOf(pal, G) {
    const y = groundTop(), n = pal.night;
    // césped
    ctx.fillStyle = nightTint(G.grass, n);
    ctx.fillRect(0, y, LW, 10);
    ctx.fillStyle = nightTint(G.grass2, n);
    ctx.fillRect(0, y + 8, LW, 3);
    // acera de baldosas (juntas suaves, poco contraste: no marea)
    ctx.fillStyle = nightTint(G.tile, n);
    ctx.fillRect(0, y + 11, LW, 34);
    ctx.strokeStyle = nightTint(G.line, n);
    ctx.lineWidth = 1.5;
    const off = -(scroll % 44);
    ctx.beginPath();
    for (let x = off; x < LW + 44; x += 44) { ctx.moveTo(x, y + 11); ctx.lineTo(x, y + 45); }
    ctx.moveTo(0, y + 28); ctx.lineTo(LW, y + 28);
    ctx.stroke();
    // panot de Barcelona: la flor de cuatro pétalos en cada baldosa (suave, sin contraste)
    if (G.panot) {
      ctx.fillStyle = nightTint(G.line, n);
      for (let x = off + 22; x < LW + 22; x += 44) for (const yy of [y + 19.5, y + 36.5]) {
        for (const [dx, dy] of [[-4, 0], [4, 0], [0, -3.5], [0, 3.5]]) { ctx.beginPath(); ctx.arc(x + dx, yy + dy, 2.6, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    // bordillo y calle
    ctx.fillStyle = nightTint(G.curb, n);
    ctx.fillRect(0, y + 45, LW, 7);
    ctx.fillStyle = nightTint(G.road, n);
    ctx.fillRect(0, y + 52, LW, LH - y - 52);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, y + 52, LW, 4);
    // 22/11/2026: coches, gente y animales (calle.js)
    if (!lowQ && !calmOn && window.ElsPanetsCalle) {
      const I = STREET_INFO; I.gt = y; I.W = LW; I.scroll = scroll; I.t = streetT; I.night = n; I.tint = nightTint;
      window.ElsPanetsCalle.calle(ctx, G.t != null ? G.t : PLACES.indexOf(G), I);
    }
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
    // arriba, un tronco con pinchos que cuelga (05/11/2026); abajo, la columna de siempre
    drawSpikyBranch(c, x, top);
    drawBottomColumn(c.place || 0, x, bot, gt);
    // de noche se oscurecen con el resto
    if (n > 0.05) {
      ctx.fillStyle = `rgba(20,26,62,${n * 0.5})`;
      ctx.fillRect(x - CAP_OUT - 1, -4, COL_W + CAP_OUT * 2 + 2, top + 2);
      ctx.fillRect(x - CAP_OUT - 1, bot - 1, COL_W + CAP_OUT * 2 + 2, gt - bot + 3);
    }
  }

  // La columna de abajo cambia con el lugar (17/11/2026). Ocupa siempre lo mismo
  // (fuste + capitel), así que se choca igual: ciudad colonial, palmera en la playa,
  // tronco nevado en la montaña, chimenea encalada en el pueblo y trencadís en Barcelona.
  let trencadis = null;
  function trencadisCanvas() {
    if (trencadis) return trencadis;
    const W = COL_W * 2, H = 1900, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), cols = ["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#3d6fb6", "#ffffff", "#8ab17d", "#e76f51", "#6d597a", "#f1faee"];
    c.fillStyle = "#e9e1cf"; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 18) for (let x = (y / 18) % 2 ? -9 : 0; x < W; x += 18) {
      c.fillStyle = cols[Math.floor(rnd() * cols.length)];
      c.beginPath();
      const p = 3;
      c.moveTo(x + p + rnd() * 3, y + p + rnd() * 3); c.lineTo(x + 18 - p - rnd() * 3, y + p + rnd() * 4);
      c.lineTo(x + 18 - p - rnd() * 2, y + 18 - p - rnd() * 3); c.lineTo(x + p + rnd() * 4, y + 18 - p - rnd() * 2);
      c.closePath(); c.fill();
    }
    return (trencadis = cv);
  }
  function drawBottomColumn(place, x, bot, gt) {
    const y0 = bot + CAP_H, h = gt - y0 + 2, w = COL_W + CAP_OUT * 2, cx = x - CAP_OUT;
    const flag = () => drawFlagBand(x + 1, y0, COL_W - 2, FLAG_H, flagOf(selectedChar()));
    if (place === 1) {
      // playa: tronco de palmera con sus anillos y las hojas arriba con dos cocos
      const g = ctx.createLinearGradient(x, 0, x + COL_W, 0);
      g.addColorStop(0, "#8a5a32"); g.addColorStop(0.3, "#c48a52"); g.addColorStop(1, "#6e4424");
      ctx.fillStyle = g; ctx.fillRect(x, y0, COL_W, h); ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2; ctx.strokeRect(x, y0, COL_W, h);
      ctx.strokeStyle = "rgba(60,35,15,0.45)"; ctx.beginPath();
      for (let yy = y0 + 22; yy < gt; yy += 16) { ctx.moveTo(x + 2, yy); ctx.quadraticCurveTo(x + COL_W / 2, yy + 5, x + COL_W - 2, yy); }
      ctx.stroke();
      ctx.fillStyle = "#4f9a3a"; roundRect(cx, bot, w, CAP_H, 9); ctx.fill(); ctx.strokeStyle = "#2f5e1c"; ctx.stroke();
      ctx.strokeStyle = "#7cc25a"; ctx.lineWidth = 2; ctx.beginPath();
      for (let lx = cx + 8; lx < cx + w - 4; lx += 12) { ctx.moveTo(lx, bot + 4); ctx.lineTo(lx - 6, bot + CAP_H - 4); }
      ctx.stroke();
      ctx.fillStyle = "#6b4321"; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 1.5;
      for (const dx of [-7, 7]) { ctx.beginPath(); ctx.arc(x + COL_W / 2 + dx, bot + CAP_H / 2, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      flag(); return;
    }
    if (place === 2) {
      // montaña: tronco oscuro con su corteza y un gorro de nieve
      const g = ctx.createLinearGradient(x, 0, x + COL_W, 0);
      g.addColorStop(0, "#4a3220"); g.addColorStop(0.35, "#8a6038"); g.addColorStop(1, "#3e2a18");
      ctx.fillStyle = g; ctx.fillRect(x, y0, COL_W, h); ctx.strokeStyle = "#2a1c10"; ctx.lineWidth = 2; ctx.strokeRect(x, y0, COL_W, h);
      ctx.strokeStyle = "rgba(30,18,8,0.5)"; ctx.lineWidth = 1.6; ctx.beginPath();
      for (const fx of [14, 30, 47]) { ctx.moveTo(x + fx, y0 + 14); for (let yy = y0 + 14; yy < gt; yy += 14) ctx.lineTo(x + fx + ((yy / 14) % 2 ? 2 : -2), yy + 14); }
      ctx.stroke();
      ctx.fillStyle = "#f7fbff"; roundRect(cx, bot, w, CAP_H, 11); ctx.fill(); ctx.strokeStyle = "#9fb6c8"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#dbe9f3"; roundRect(cx + 4, bot + CAP_H - 8, w - 8, 5, 2.5); ctx.fill();
      flag(); return;
    }
    if (place === 3) {
      // pueblo blanco: chimenea encalada con una cenefa de azulejo y su tejadillo
      const g = ctx.createLinearGradient(x, 0, x + COL_W, 0);
      g.addColorStop(0, "#ddd6c6"); g.addColorStop(0.3, "#ffffff"); g.addColorStop(1, "#cdc5b3");
      ctx.fillStyle = g; ctx.fillRect(x, y0, COL_W, h); ctx.strokeStyle = "#a89f8c"; ctx.lineWidth = 2; ctx.strokeRect(x, y0, COL_W, h);
      ctx.fillStyle = "#2f6fb5"; ctx.fillRect(x + 1, y0 + FLAG_H + 10, COL_W - 2, 10);
      ctx.fillStyle = "#ffffff"; for (let dx = 6; dx < COL_W; dx += 10) { ctx.beginPath(); ctx.arc(x + dx, y0 + FLAG_H + 15, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "#c0603d"; roundRect(cx, bot, w, CAP_H, 6); ctx.fill(); ctx.strokeStyle = "#7e3a22"; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = "#8e4428"; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let tx = cx + 6; tx < cx + w; tx += 10) { ctx.moveTo(tx - 5, bot + CAP_H - 3); ctx.arc(tx, bot + CAP_H - 3, 5, Math.PI, 0); }
      ctx.stroke();
      flag(); return;
    }
    if (place === 4) {
      // Barcelona: trencadís de Gaudí (el dibujo se hace una vez y se reutiliza)
      const tc = trencadisCanvas();
      ctx.drawImage(tc, 0, 0, tc.width, Math.min(tc.height, h * 2), x, y0, COL_W, Math.min(h, tc.height / 2));
      ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2; ctx.strokeRect(x, y0, COL_W, h);
      ctx.save(); roundRect(cx, bot, w, CAP_H, 9); ctx.clip();
      ctx.fillStyle = "#1f5f9e"; ctx.fillRect(cx, bot, w, CAP_H);
      ctx.globalAlpha = 0.55; ctx.drawImage(tc, 0, 600, tc.width, CAP_H * 2, cx, bot, w, CAP_H); ctx.globalAlpha = 1;
      ctx.restore();
      ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2; roundRect(cx, bot, w, CAP_H, 9); ctx.stroke();
      flag(); return;
    }
    // ciudad: la columna colonial de estuco de siempre
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#5e4630";
    ctx.fillStyle = columnGradient(x);
    ctx.fillRect(x, y0, COL_W, h);
    ctx.strokeRect(x, y0, COL_W, h);
    ctx.strokeStyle = "rgba(120,90,55,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const fx of NUMS_2) { ctx.moveTo(x + fx, y0 + 10); ctx.lineTo(x + fx, gt); }
    ctx.stroke();
    drawCapital(x, bot, false);
  }

  // Tronco que cuelga, con pinchos a los lados y una corona de pinchos en la punta.
  // Ocupa justo lo mismo que la columna de antes (fuste + capitel), así que se choca igual.
  function drawSpikyBranch(c, x, top) {
    const end = top - CAP_H, seed = c.seed || (c.seed = 1 + Math.random() * 9);
    // tronco
    const g = ctx.createLinearGradient(x, 0, x + COL_W, 0);
    g.addColorStop(0, "#5a3519"); g.addColorStop(0.3, "#a8743f"); g.addColorStop(0.55, "#8a5a2e"); g.addColorStop(1, "#4a2a12");
    ctx.fillStyle = g; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2;
    ctx.fillRect(x, -4, COL_W, end + 4); ctx.strokeRect(x, -4, COL_W, end + 4);
    // corteza: vetas onduladas y algún nudo
    ctx.strokeStyle = "rgba(50,28,10,0.45)"; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const fx of NUMS_3) {
      ctx.moveTo(x + fx, 0);
      for (let y = 0; y < end - 6; y += 12) ctx.lineTo(x + fx + Math.sin(y * 0.09 + fx + seed) * 2.2, y + 12);
    }
    ctx.stroke();
    for (let y = 40 + (seed * 13) % 50; y < end - 30; y += 95) {
      const kx = x + 18 + ((y * 7 + seed * 11) % 30);
      ctx.fillStyle = "#5a3519"; ctx.beginPath(); ctx.ellipse(kx, y, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = "#3b2414"; ctx.beginPath(); ctx.ellipse(kx, y, 1.8, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    // pinchos pequeños a los lados (no salen más que el capitel de antes)
    ctx.fillStyle = "#efe2c4"; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 1.3;
    for (let y = 18 + (seed * 7) % 20; y < end - 10; y += 30) {
      for (const side of NUMS_4) {
        const yy = y + side * 15, bx = side ? x + COL_W : x, d = side ? CAP_OUT : -CAP_OUT;
        ctx.beginPath(); ctx.moveTo(bx, yy - 5); ctx.lineTo(bx + d, yy + 2); ctx.lineTo(bx, yy + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    // hojitas que se mecen muy despacio
    for (let i = 0; i < 2; i++) {
      const ly = 30 + ((seed * 37 + i * 61) % Math.max(20, end - 70)), side = (i + Math.floor(seed)) % 2;
      if (ly > end - 30) continue;
      ctx.save();
      ctx.translate(side ? x + COL_W - 2 : x + 2, ly);
      ctx.rotate((side ? 0.5 : Math.PI - 0.5) + Math.sin(worldT * 1.3 + seed + i) * 0.12);
      ctx.fillStyle = "#5fa83a"; ctx.strokeStyle = "#2f5e1c"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(9, -7, 20, 0); ctx.quadraticCurveTo(9, 7, 0, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(17, 0); ctx.stroke();
      ctx.restore();
    }
    // bandera del personaje atada al tronco
    drawFlagBand(x + 1, end - FLAG_H - 4, COL_W - 2, FLAG_H, flagOf(selectedChar()));
    // anillo de madera y corona de pinchos hacia abajo, en el sitio del capitel
    const w = COL_W + CAP_OUT * 2, cx = x - CAP_OUT;
    ctx.fillStyle = "#6b4321"; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2;
    roundRect(cx, end, w, 8, 3); ctx.fill(); ctx.stroke();
    const n = 6, sw = w / n;
    for (let i = 0; i < n; i++) {
      const px = cx + i * sw;
      const sg = ctx.createLinearGradient(px, 0, px + sw, 0);
      sg.addColorStop(0, "#d9c9a6"); sg.addColorStop(0.4, "#fff8e8"); sg.addColorStop(1, "#b9a57e");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(px + 1, end + 7); ctx.lineTo(px + sw / 2, top); ctx.lineTo(px + sw - 1, end + 7); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  // Cada personaje lleva la bandera de su tierra en las columnas
  const FLAG_H = 12;
  const FLAGS = { blanco: "ve", maykel: "ve", gris: "ve", deportista: "ec", maria: "cat", polo: "cat", nuria: "cat", perro: "cat", chaqueta: "do", pamela: "hn" };
  const flagOf = (def) => FLAGS[def.id] || def.flag || "ve";
  function drawFlagBand(x, y, w, h, f) {
    if (!FLAG_NAMES[f] && WORLD_SET.has(f)) { drawWorldBand(x, y, w, h, f); return; }
    const band = (c, y0, hh) => { ctx.fillStyle = c; ctx.fillRect(x, y + y0, w, hh); };
    const dot = (cx, cy, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
    const mx = x + w / 2, my = y + h / 2;
    if (f === "ec") { // Ecuador: amarillo el doble de ancho, azul y rojo, y el escudo
      band("#ffd100", 0, h / 2); band("#034ea2", h / 2, h / 4); band("#ed1c24", (h * 3) / 4, h / 4);
      dot(mx, my, 2.6, "#7a5a1e"); dot(mx, my - 0.6, 1.5, "#5fb0e8");
    } else if (f === "cat") { // senyera: cuatro barras rojas sobre amarillo
      band("#fcdd09", 0, h);
      for (let i = 0; i < 4; i++) band("#da121a", (h / 9) * (1 + i * 2), h / 9);
    } else if (f === "do") { // República Dominicana: cuarteles azul y rojo con cruz blanca
      const cw = 2.4, hw = (w - cw) / 2, hh = (h - cw) / 2;
      band("#ffffff", 0, h);
      ctx.fillStyle = "#002d62"; ctx.fillRect(x, y, hw, hh); ctx.fillRect(x + hw + cw, y + hh + cw, hw, hh);
      ctx.fillStyle = "#ce1126"; ctx.fillRect(x + hw + cw, y, hw, hh); ctx.fillRect(x, y + hh + cw, hw, hh);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(mx - 3, my - 3, 6, 6);
      dot(mx, my, 1.8, "#2f8a3a");
    } else if (f === "hn") { // Honduras: azul, blanco y azul con cinco estrellas
      band("#00bce4", 0, h / 3); band("#ffffff", h / 3, h / 3); band("#00bce4", (h * 2) / 3, h / 3);
      for (const [dx, dy] of NUMS_5) dot(mx + dx, my + dy, 0.9, "#00bce4");
    } else { // Venezuela: amarillo, azul con el arco de estrellas, rojo
      band("#f7c600", 0, h / 3); band("#1d4fa3", h / 3, h / 3); band("#d52b1e", (h * 2) / 3, h / 3);
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * (0.15 + (0.7 * i) / 7);
        dot(mx - Math.cos(a) * 7, my + 1.6 - Math.sin(a) * 2.6, 0.6, "#ffffff");
      }
    }
    ctx.strokeStyle = "rgba(60,40,20,0.35)"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
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
    // bandera del personaje junto al fuste (03/11/2026)
    drawFlagBand(x + 1, isTop ? y - FLAG_H : y + CAP_H, COL_W - 2, FLAG_H, flagOf(selectedChar()));
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
    for (const [dx, dy, r] of NUMS_6) {
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

  // la chica que sale en el hueco: halo rosa, corazones y el cartel
  function drawGirlPickup(g, x, y, size, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size || 1, size || 1);
    if (glow) {
      const h = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
      h.addColorStop(0, "rgba(255,160,200,0.7)"); h.addColorStop(1, "rgba(255,160,200,0)");
      ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = worldT * 0.9 + i * 2.1;
        drawHeart(Math.cos(a) * 30, Math.sin(a) * 26, 4.5, "#ff5c93");
      }
    }
    drawHuman(g, 0, 8, 0, worldT * 5, 0.78, "");
    if (glow) {
      ctx.fillStyle = "#ff4f8b"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      roundRect(-44, -48, 88, 18, 9); ctx.fill(); ctx.stroke();
      text("NOVIA NUEVA", 0, -38.5, 12, "#fff");
    }
    ctx.restore();
  }
  function drawHeart(x, y, r, color) {
    ctx.fillStyle = color; ctx.strokeStyle = OL; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 2, y - r * 0.3, x - r * 0.9, y - r * 1.8, x, y - r * 0.6);
    ctx.bezierCurveTo(x + r * 0.9, y - r * 1.8, x + r * 2, y - r * 0.3, x, y + r);
    ctx.fill(); ctx.stroke();
  }

  // ---------- Objetos especiales y comidas de Rim ----------
  function drawFood(kind, x, y, rot, size, glow, girl) {
    if (kind === "empanada" || !kind) { drawEmpanada(x, y, rot, size, glow); return; }
    if (kind === "dorada") { drawGolden(x, y, rot, size || 1); return; }
    if (kind === "novia") { drawGirlPickup(girl || previewGirl, x, y, size, glow); return; }
    const special = !!SPECIALS[kind];
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
      const r = special ? 40 : 32;
      const h = ctx.createRadialGradient(0, 2, 6, 0, 2, r);
      h.addColorStop(0, special ? "rgba(255,226,120,0.75)" : "rgba(255,240,180,0.55)");
      h.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = h;
      ctx.beginPath(); ctx.arc(0, 2, r, 0, Math.PI * 2); ctx.fill();
      if (special) {
        // rayos de luz que giran despacio
        ctx.save();
        ctx.rotate(worldT * 0.8);
        ctx.fillStyle = "rgba(255,236,150,0.35)";
        for (let i = 0; i < 8; i++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(0, 38); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }
    ctx.rotate(Math.sin(rot * 0.5) * 0.15);
    ctx.scale(size || 1, size || 1);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    const shine = (x1, y1, x2, y2) => {
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
    };
    switch (kind) {
      case "vino": {
        ctx.rotate(0.25);
        const g = ctx.createLinearGradient(-8, 0, 8, 0);
        g.addColorStop(0, "#143a22"); g.addColorStop(0.45, "#2f7a48"); g.addColorStop(1, "#102e1b");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-3, -22); ctx.lineTo(3, -22); ctx.lineTo(3, -12);
        ctx.quadraticCurveTo(8, -10, 8, -4); ctx.lineTo(8, 18); ctx.quadraticCurveTo(8, 21, 5, 21);
        ctx.lineTo(-5, 21); ctx.quadraticCurveTo(-8, 21, -8, 18); ctx.lineTo(-8, -4);
        ctx.quadraticCurveTo(-8, -10, -3, -12); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#7b1e3a";
        roundRect(-3.8, -24, 7.6, 8, 1.5); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = "#f3e6c8";
        roundRect(-6.5, 1, 13, 12, 2); ctx.fill();
        ctx.strokeStyle = "#7b1e3a"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#6a1b4d";
        for (const [gx, gy] of NUMS_7) {
          ctx.beginPath(); ctx.arc(gx, gy + 0.5, 1.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = OL;
        shine(-5, -3, -5, 16);
        break;
      }
      case "tequila": {
        // botella de cristal con tequila dorado, tapón de corcho y limón
        ctx.fillStyle = "rgba(215,240,235,0.9)";
        roundRect(-3.8, -14, 7.6, 10, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#b07a45";
        roundRect(-4.8, -21, 9.6, 8, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(215,240,235,0.9)";
        roundRect(-10, -6, 20, 27, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#e8a93a";
        roundRect(-8, 1, 16, 18, 4); ctx.fill();
        ctx.fillStyle = "#fff8ec";
        roundRect(-8, 5, 16, 10, 1.5); ctx.fill();
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 1; ctx.stroke();
        // agave
        ctx.fillStyle = "#3f8f4a";
        for (const a of NUMS_8) {
          ctx.save(); ctx.translate(0, 13.5); ctx.rotate(a);
          ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(0, -7); ctx.lineTo(1, 0); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        roundRect(-10, -6, 20, 27, 5); ctx.stroke();
        shine(-7, -2, -7, 17);
        // rodaja de limón
        ctx.fillStyle = "#7cc243";
        ctx.beginPath(); ctx.arc(12, 16, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d8f0a0";
        ctx.beginPath(); ctx.arc(12, 16, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#7cc243"; ctx.lineWidth = 0.9;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(12 + Math.cos(a) * 4, 16 + Math.sin(a) * 4); ctx.stroke();
        }
        break;
      }
      case "camara": {
        ctx.fillStyle = "#2b2d33";
        roundRect(-8, -15, 13, 7, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#2b2d33";
        roundRect(-18, -10, 36, 24, 5); ctx.fill();
        ctx.fillStyle = "#c7ccd4";
        ctx.fillRect(-17, -9, 34, 6);
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        roundRect(-18, -10, 36, 24, 5); ctx.stroke();
        ctx.fillStyle = "#fffbe0";
        roundRect(9, -8, 6, 4, 1); ctx.fill();
        ctx.fillStyle = "#d63a32";
        ctx.beginPath(); ctx.arc(-13, -12, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = "#9aa3ad";
        ctx.beginPath(); ctx.arc(0, 3, 9, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
        const lg = ctx.createRadialGradient(-2, 1, 1, 0, 3, 6.5);
        lg.addColorStop(0, "#5a7bb0"); lg.addColorStop(1, "#101a2c");
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(0, 3, 6.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath(); ctx.arc(-2.2, 0.8, 1.6, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case "patomaquet": {
        // rebanada de pan de payés con tomate y un chorrito de aceite
        ctx.fillStyle = "#c98a3e";
        ctx.beginPath(); ctx.ellipse(0, 2, 19, 14, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f3dcaa";
        ctx.beginPath(); ctx.ellipse(0, 2, 15.5, 10.5, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(214,58,50,0.85)";
        ctx.beginPath(); ctx.ellipse(-1, 1.5, 13, 8.5, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e85a4a";
        for (const [tx, ty, r] of NUMS_9) {
          ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = "rgba(240,210,90,0.9)"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-10, -2); ctx.quadraticCurveTo(-2, 3, 9, -4); ctx.stroke();
        ctx.fillStyle = "#e9e3d6";
        for (const [sx, sy] of NUMS_10) ctx.fillRect(sx, sy, 1.2, 1.2);
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        break;
      }
      case "crema": {
        // crema catalana en su cazuelita de barro, con el azúcar quemado
        ctx.fillStyle = "#b5582c";
        ctx.beginPath(); ctx.moveTo(-20, -3); ctx.lineTo(20, -3); ctx.quadraticCurveTo(18, 14, 0, 15); ctx.quadraticCurveTo(-18, 14, -20, -3); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#c96a36";
        ctx.beginPath(); ctx.ellipse(0, -3, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const cg = ctx.createRadialGradient(-3, -5, 1, 0, -3, 16);
        cg.addColorStop(0, "#f2c66a"); cg.addColorStop(0.6, "#d98f2e"); cg.addColorStop(1, "#8a4a14");
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.ellipse(0, -3, 16.5, 5.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(90,40,10,0.55)";
        for (const [bx, by] of NUMS_11) { ctx.beginPath(); ctx.ellipse(bx, by, 2.2, 0.9, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-1, -6.5); ctx.stroke();
        // cucharita
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        ctx.fillStyle = "#d9dde3";
        ctx.save(); ctx.translate(13, -10); ctx.rotate(0.7);
        roundRect(-1.5, -12, 3, 13, 1.5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 2, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        break;
      }
      case "mangu": {
        // plato de mangú: puré de plátano con cebolla roja por encima, y un plátano al lado
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.ellipse(0, 8, 21, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#e9d27a";
        ctx.beginPath(); ctx.moveTo(-14, 7); ctx.quadraticCurveTo(-12, -9, 0, -10); ctx.quadraticCurveTo(12, -9, 14, 7); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#b0397a"; ctx.lineWidth = 1.6;
        for (const [ox, oy] of NUMS_12) { ctx.beginPath(); ctx.ellipse(ox, oy, 3, 1.6, 0.3, 0, Math.PI * 2); ctx.stroke(); }
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        ctx.save(); ctx.translate(15, -9); ctx.rotate(-0.6);
        ctx.fillStyle = "#f2c94c";
        ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(0, 8, 9, 0); ctx.quadraticCurveTo(0, 4, -9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#4a3a20"; ctx.fillRect(8, -1.5, 2.5, 2.5);
        ctx.restore();
        break;
      }
      case "biberon": {
        // biberón con leche, tetina y tapa azul
        ctx.fillStyle = "#f6c27a";
        ctx.beginPath(); ctx.moveTo(-3, -16); ctx.quadraticCurveTo(0, -24, 3, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#5fb0e8";
        roundRect(-8, -17, 16, 6, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(235,245,252,0.95)";
        roundRect(-8, -11, 16, 31, 5); ctx.fill();
        ctx.fillStyle = "#fffdf6";
        roundRect(-7, -2, 14, 21, 4); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        roundRect(-8, -11, 16, 31, 5); ctx.stroke();
        ctx.strokeStyle = "#5fb0e8"; ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-8, -6 + i * 6); ctx.lineTo(-4, -6 + i * 6); ctx.stroke(); }
        ctx.fillStyle = "#ff8fb1";
        ctx.beginPath(); ctx.arc(2, 9, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        shine(5, -7, 5, 15);
        break;
      }
      case "jamon": {
        ctx.rotate(-0.45);
        const g = ctx.createLinearGradient(0, -12, 0, 12);
        g.addColorStop(0, "#b8673a"); g.addColorStop(1, "#7a3a1c");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-17, 0);
        ctx.bezierCurveTo(-17, -13, -1, -13, 7, -4.5);
        ctx.lineTo(13, -3); ctx.lineTo(13, 3); ctx.lineTo(7, 4.5);
        ctx.bezierCurveTo(-1, 13, -17, 13, -17, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // corte: carne roja con vetas de grasa
        ctx.fillStyle = "#d9505a";
        ctx.beginPath(); ctx.ellipse(-13, 0, 4.5, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fbe3d6"; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(-15, -5); ctx.quadraticCurveTo(-12, -2, -14, 2); ctx.moveTo(-12, 3); ctx.quadraticCurveTo(-11, 6, -13, 7); ctx.stroke();
        ctx.strokeStyle = OL; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(-13, 0, 4.5, 9, 0, 0, Math.PI * 2); ctx.stroke();
        // pezuña
        ctx.fillStyle = "#3b2414";
        roundRect(13, -3.5, 7, 7, 2); ctx.fill(); ctx.stroke();
        shine(-6, -7, 3, -4);
        break;
      }
      case "queso": {
        ctx.fillStyle = "#f6c443";
        ctx.beginPath(); ctx.moveTo(-16, 12); ctx.lineTo(-16, 2); ctx.lineTo(16, -8); ctx.lineTo(16, 12); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffe08a";
        ctx.beginPath(); ctx.moveTo(-16, 2); ctx.lineTo(16, -8); ctx.lineTo(11, -12); ctx.lineTo(-19, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d9a21b";
        for (const [hx2, hy2, r] of NUMS_13) {
          ctx.beginPath(); ctx.ellipse(hx2, hy2, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case "huevo": {
        ctx.fillStyle = "#fffdf6";
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.bezierCurveTo(-17, -10, -5, -14, 2, -12);
        ctx.bezierCurveTo(12, -14, 18, -6, 15, 2);
        ctx.bezierCurveTo(17, 10, 6, 14, -2, 12);
        ctx.bezierCurveTo(-11, 13, -14, 7, -15, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        const yg = ctx.createRadialGradient(0, -2, 1, 1, 0, 7);
        yg.addColorStop(0, "#ffe066"); yg.addColorStop(1, "#f59e0b");
        ctx.fillStyle = yg;
        ctx.beginPath(); ctx.arc(1, 0, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath(); ctx.arc(-1.5, -2.5, 1.8, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case "salchicha": {
        ctx.lineWidth = 12;
        ctx.beginPath(); ctx.arc(0, 14, 16, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
        ctx.strokeStyle = "#c8553d"; ctx.lineWidth = 8.5;
        ctx.beginPath(); ctx.arc(0, 14, 16, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
        ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const a = Math.PI * (1.27 + i * 0.058), r = 16 + (i % 2 ? 1.6 : -1.6);
          ctx.lineTo(Math.cos(a) * r, 14 + Math.sin(a) * r);
        }
        ctx.stroke();
        break;
      }
      case "pollo": {
        ctx.rotate(-0.5);
        ctx.fillStyle = "#f6efe0";
        roundRect(5, -2.2, 10, 4.4, 2); ctx.fill(); ctx.stroke();
        for (const by of NUMS_14) { ctx.beginPath(); ctx.arc(16, by, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        const g = ctx.createRadialGradient(-6, -4, 2, -4, 0, 14);
        g.addColorStop(0, "#e9a050"); g.addColorStop(1, "#a85a1f");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(-5, 0, 13, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        shine(-11, -5, -4, -7);
        break;
      }
      case "pizza": {
        ctx.fillStyle = "#ffd36b";
        ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(-14, -9); ctx.quadraticCurveTo(0, -15, 14, -9); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d9963a";
        ctx.beginPath(); ctx.moveTo(-14, -9); ctx.quadraticCurveTo(0, -15, 14, -9); ctx.lineTo(13, -13); ctx.quadraticCurveTo(0, -19, -13, -13); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#c0392b";
        for (const [px2, py2] of NUMS_15) { ctx.beginPath(); ctx.arc(px2, py2, 3, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case "hueso": {
        ctx.rotate(-0.3);
        ctx.fillStyle = "#f3ead6";
        ctx.beginPath();
        ctx.arc(-12, -4, 5, Math.PI * 0.5, Math.PI * 1.9);
        ctx.arc(12, -4, 5, Math.PI * 1.1, Math.PI * 2.5);
        ctx.arc(12, 4, 5, Math.PI * 1.5, Math.PI * 0.9);
        ctx.arc(-12, 4, 5, Math.PI * 0.1, Math.PI * 1.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }
  // el icono del contador: Rim cuenta comida, los demás empanadillas
  const counterFood = () => (selectedChar().kind === "dog" ? "jamon" : "empanada");

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
    for (const lx of NUMS_16) {
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
    else if (def.kind === "dog") drawDog(px, py, rot, flapPh, scale, mood, def);
    else if (def.kind === "critter") drawCritter(def, px, py, rot, flapPh, scale, mood);
    else if (def.kind === "famoso") {
      ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(scale || 1, scale || 1);
      window.ElsPanetsFamosos.draw(ctx, def, flapPh, mood, worldT, ctx === mainCtx);
      ctx.restore();
    }
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
    // rastas largas por detrás, hasta los hombros (02/11/2026)
    if (d.hairStyle === "dreads") {
      ctx.strokeStyle = OL; ctx.lineWidth = 6.2;
      const locks = [];
      for (let i = 0; i < 9; i++) {
        const t = i / 8, x0 = fx - F.rx - 2 + t * (F.rx * 2 + 4);
        locks.push([x0, hy - F.ry + 2, x0 + (t - 0.5) * 6 + sway, hy + 16 + Math.abs(t - 0.5) * 2]);
      }
      for (const [a, b, c, e] of locks) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo(a + (c - a) * 1.3, (b + e) / 2, c, e); ctx.stroke(); }
      ctx.strokeStyle = d.hairD; ctx.lineWidth = 3.8;
      for (const [a, b, c, e] of locks) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo(a + (c - a) * 1.3, (b + e) / 2, c, e); ctx.stroke(); }
    }
    // coleta o moño, por detrás de la cabeza (01/11/2026)
    if (d.hairStyle === "ponytail" || d.hairStyle === "bun") {
      const top = hy - F.ry - 3.5, L = fx - F.rx;
      ctx.strokeStyle = OL; ctx.lineWidth = 2;
      if (d.hairStyle === "ponytail") {
        const tg = ctx.createLinearGradient(L, top, L - 10, hy + 14);
        tg.addColorStop(0, d.hair); tg.addColorStop(1, d.hairD);
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.moveTo(L + 3, top + 2);
        ctx.quadraticCurveTo(L - 13, top + 1, L - 9 + sway, hy + 15);
        ctx.quadraticCurveTo(L - 4, hy + 5, L + 1, hy - 3);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = d.scrunchie || "#d63a32";
        ctx.beginPath(); ctx.ellipse(L, top + 4.5, 2.6, 3.4, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = d.hair;
        ctx.beginPath(); ctx.arc(fx - 4, top - 2.5, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = lighten(d.hair, 0.25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(fx - 4, top - 2.5, 3.5, 3.6, 5.6); ctx.stroke();
      }
    }

    // piernas (mallas o pantalón), calcetines y zapatillas
    for (const lx of NUMS_16) {
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
    const [tr, tg, tb] = hexToRgb(d.topColor);
    const lum = 0.3 * tr + 0.59 * tg + 0.11 * tb;
    const light = lum > 225;
    const topD = darken(d.topColor, light ? 0.12 : 0.3);
    const trim = lum < 50 ? lighten(d.topColor, 0.1) : darken(d.topColor, 0.2); // cuellos y costuras
    const reach = !!d.baby; // Pamela estira los brazos hacia el bebé
    humanArm(-6, -1, reach ? -0.55 + sw * 0.25 : -2.3 + sw * 0.9, topD, sleeve, false);

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
      if (!d.noLogo) {
        ctx.strokeStyle = "#8b8f96"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(3.5, 0.5); ctx.quadraticCurveTo(4.5, 2.5, 8, -0.5); ctx.stroke();
      }
    } else {
      ctx.fillStyle = g;
      roundRect(-12, -8, 24, 23, 8); ctx.fill(); ctx.stroke();
    }
    if (d.necklace) {
      // cadenita dorada
      ctx.strokeStyle = d.necklace; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-4.5, -8); ctx.quadraticCurveTo(0, -1.5, 4.5, -8); ctx.stroke();
      ctx.fillStyle = d.necklace; ctx.beginPath(); ctx.arc(0, -4.3, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    if (d.top === "tee") {
      // camiseta de pico
      ctx.fillStyle = d.skin;
      ctx.beginPath(); ctx.moveTo(-5.5, -8); ctx.lineTo(5.5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = darken(d.topColor, 0.35); ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (d.top === "longsleeve") {
      // cuello alto con media cremallera
      ctx.fillStyle = light ? "#ffffff" : lighten(d.topColor, 0.12);
      ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(5, -9); ctx.lineTo(4, -5); ctx.lineTo(-4, -5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = light ? "#c9c9c4" : trim; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = light ? "#b5b5b0" : trim; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 2); ctx.stroke();
      ctx.fillStyle = "#9a9a95"; ctx.fillRect(-1, 1, 2, 2.5);
    } else if (d.top === "polo") {
      ctx.fillStyle = lum < 50 ? "#2c2c31" : trim;
      ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(0, -5); ctx.lineTo(-3, -1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(0, -5); ctx.lineTo(3, -1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = lum < 50 ? "#45454c" : darken(d.topColor, 0.3); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 4); ctx.stroke();
      ctx.fillStyle = lum < 50 ? "#55555c" : darken(d.topColor, 0.35);
      for (const by of NUMS_17) { ctx.beginPath(); ctx.arc(0.8, by, 0.8, 0, Math.PI * 2); ctx.fill(); }
    } else if (d.top === "thriller") {
      // chaqueta roja de cuero con las uves negras en el pecho y los hombros, cremallera y cuello alto
      ctx.fillStyle = d.topColor;
      roundRect(-7, -11, 14, 6, 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save();
      roundRect(-12, -8, 24, 23, 8); ctx.clip();
      ctx.strokeStyle = "#141414"; ctx.lineWidth = 2;
      for (const off of NUMS_18) {
        ctx.beginPath(); ctx.moveTo(-12, -6 + off); ctx.lineTo(-1.5, 3 + off); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, -6 + off); ctx.lineTo(1.5, 3 + off); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 15); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath(); ctx.ellipse(-6, -2, 2.5, 5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = darken(d.topColor, 0.25); ctx.fillRect(-11, 11, 22, 3.5);
    } else if (d.top === "jacket") {
      // chaqueta de cremallera con cuello alto, camiseta negra debajo y bolsillos
      ctx.fillStyle = lighten(d.topColor, 0.05);
      roundRect(-7, -11, 14, 6, 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#121215";
      ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(3, -11); ctx.lineTo(0, -7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = lum < 50 ? "#55565e" : darken(d.topColor, 0.3); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-4, 4); ctx.moveTo(9, 6); ctx.lineTo(4, 4); ctx.stroke();
      ctx.fillStyle = lum < 50 ? "#2c2d33" : darken(d.topColor, 0.15); ctx.fillRect(-11, 11, 22, 3.5);
    }

    humanArm(4, -1, reach ? -0.2 - sw * 0.25 : -2.0 - sw * 0.9, d.topColor, sleeve, !!(d.watch || d.band));

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
      for (const [fx2, fy2] of NUMS_19) {
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
    } else if (worldT % 3.8 < 0.12) {
      // parpadeo de vez en cuando (05/11/2026)
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
      for (const [ex, s] of [[cx - 5, 0.92], [cx + 5, 1]]) {
        const w = (d.fem ? 3.1 : 2.8) * s;
        ctx.beginPath(); ctx.moveTo(ex - w, ey); ctx.quadraticCurveTo(ex, ey + 1.6, ex + w, ey - 0.3); ctx.stroke();
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

    // pelo por delante, y encima gafas y sombrero si los lleva
    drawHairFront();
    if (d.glasses && mood !== "dead") drawGlasses();
    if (d.hat) drawHat(d.hat);
    // el bebé va delante, un poco más alto, y ella detrás intentando cogerlo
    if (d.baby) { const ag = d.babyAge || 0; drawBaby(44 + ag * 2.5, -27 - ag * 1.5 + Math.sin(worldT * 2.4) * 2.5, flapPh, ag); }
    ctx.restore();

    function drawGlasses() {
      const L = fx - F.rx;
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx - 8.6, ey - 1.4); ctx.lineTo(L - 0.5, ey - 2.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 1.4, ey - 1.6); ctx.quadraticCurveTo(cx, ey - 2.6, cx + 1.4, ey - 1.6); ctx.stroke();
      for (const ex of [cx - 5, cx + 5]) {
        ctx.fillStyle = "#1b1c22";
        roundRect(ex - 3.9, ey - 2.8, 7.8, 5.4, 2.4); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(ex - 2.2, ey - 1.5); ctx.lineTo(ex - 0.6, ey - 1.5); ctx.stroke();
      }
    }

    function drawHat(h) {
      const top = hy - F.ry - 3.5, L = fx - F.rx, R = fx + F.rx;
      if (!OLD_HATS.includes(h.type)) { drawHeadwear(h, fx, top, F.rx); return; }
      const c = h.color;
      ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
      if (h.type === "cap" || h.type === "beanie") {
        const by = hy - F.ry * 0.48; // donde acaba por delante, sobre las cejas
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(L - 2, by);
        ctx.quadraticCurveTo(L - 2.5, top - (h.type === "beanie" ? 7 : 4), fx, top - (h.type === "beanie" ? 7 : 4));
        ctx.quadraticCurveTo(R + 2.5, top - (h.type === "beanie" ? 7 : 4), R + 2, by);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (h.type === "cap") {
          // visera hacia donde vuela
          ctx.fillStyle = darken(c, 0.18);
          ctx.beginPath();
          ctx.moveTo(R - 5, by - 1.2); ctx.quadraticCurveTo(R + 8, by - 2.5, R + 11, by + 1.5);
          ctx.quadraticCurveTo(R + 3, by + 2.8, R - 5, by + 1.2); ctx.closePath();
          ctx.fill(); ctx.stroke();
          ctx.strokeStyle = darken(c, 0.25); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(fx, top - 4); ctx.quadraticCurveTo(fx + 3, by - 6, fx + 2, by); ctx.stroke();
          ctx.fillStyle = darken(c, 0.2);
          ctx.beginPath(); ctx.arc(fx, top - 4, 1.4, 0, Math.PI * 2); ctx.fill();
        } else {
          // gorro de lana: vuelta doblada y canalé
          ctx.fillStyle = darken(c, 0.08);
          roundRect(L - 2.5, by - 4.5, R - L + 5, 5, 2); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = darken(c, 0.2); ctx.lineWidth = 0.8;
          for (let x = L; x <= R; x += 2.5) { ctx.beginPath(); ctx.moveTo(x, by - 3.8); ctx.lineTo(x, by - 0.6); ctx.stroke(); }
          ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(fx, top - 8.5, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      } else if (h.type === "beret") {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(fx - 1.5, top + 0.5, F.rx + 3.5, 4.8, -0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = darken(c, 0.2);
        ctx.beginPath(); ctx.ellipse(fx - 1, top + 3.2, F.rx + 1, 1.6, -0.18, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(fx - 2.5, top - 4); ctx.lineTo(fx - 2, top - 6.5); ctx.stroke();
      } else if (h.type === "sunhat" || h.type === "sombrero") {
        const big = h.type === "sombrero";
        const brimY = top + (big ? 2 : 3.5), brimR = F.rx + (big ? 18 : 11);
        // ala de atrás, copa y ala de delante
        ctx.fillStyle = darken(c, 0.12);
        ctx.beginPath(); ctx.ellipse(fx, brimY, brimR, big ? 5 : 3.8, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = c;
        const cw = big ? 8 : F.rx - 1, chh = big ? 14 : 8;
        ctx.beginPath();
        ctx.moveTo(fx - cw, brimY);
        ctx.quadraticCurveTo(fx - cw - 1, brimY - chh, fx, brimY - chh);
        ctx.quadraticCurveTo(fx + cw + 1, brimY - chh, fx + cw, brimY);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = big ? "#c0392b" : "#3b2a20";
        ctx.fillRect(fx - cw - 0.2, brimY - (big ? 4.5 : 3), cw * 2 + 0.4, big ? 3.2 : 2.2);
        if (big) {
          ctx.fillStyle = "#2e8b57";
          for (let x = fx - cw + 1.5; x < fx + cw - 1; x += 3.5) { ctx.beginPath(); ctx.arc(x, brimY - 2.9, 0.9, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(fx, brimY, brimR, big ? 5 : 3.8, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
        if (big) {
          ctx.strokeStyle = darken(c, 0.25); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(fx, brimY + 0.5, brimR - 3, 3.2, 0, 0.2, Math.PI - 0.2); ctx.stroke();
        }
      }
    }

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
      } else if (d.hairStyle === "ponytail" || d.hairStyle === "bun") {
        // pelo recogido hacia atrás, pegado a la cabeza
        const hg = ctx.createLinearGradient(L, top, R, hy);
        hg.addColorStop(0, lighten(d.hair, 0.12)); hg.addColorStop(1, d.hair);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(L - 1, hy + 2);
        ctx.quadraticCurveTo(L - 2.5, top - 1, fx, top - 1.5);
        ctx.quadraticCurveTo(R + 2.5, top - 1, R + 0.5, hy - 1);
        ctx.lineTo(R - 1.5, hy - 5);
        ctx.quadraticCurveTo(fx + 2, hy - 11, L + 2.5, hy - 6);
        ctx.lineTo(L + 0.8, hy + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = lighten(d.hair, 0.3); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(R - 2, hy - 6); ctx.quadraticCurveTo(fx + 2, top + 1, L + 1, top + 5);
        ctx.moveTo(R - 1, hy - 3); ctx.quadraticCurveTo(fx + 4, top + 3.5, L, hy - 4);
        ctx.stroke();
      } else if (d.hairStyle === "goldCurls") {
        // rizos apretados con volumen arriba, algunos caen por la frente, puntas doradas
        ctx.fillStyle = d.hair;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(L - 0.8, hy + 3);
        ctx.quadraticCurveTo(L - 1.6, top + 2, fx, top + 1.5);
        ctx.quadraticCurveTo(R + 1.6, top + 2, R + 0.8, hy + 1);
        ctx.lineTo(R - 1, hy + 1); ctx.lineTo(R - 1.2, hy - 6);
        ctx.quadraticCurveTo(fx + 2, hy - 9.5, L + 1.2, hy - 6);
        ctx.lineTo(L + 1, hy + 3); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.5; ctx.stroke();
        // muchos rizos pequeños: poco alto, y abierto hacia los lados por encima de las orejas
        const curls = [];
        const cxh = fx, cyh = hy - 4, rxh = F.rx + 3.2, ryh = F.ry + 0.6;
        for (let row = 0; row < 5; row++) {
          const ry2 = ryh - row * 2.3;           // de fuera hacia dentro
          const n = 13 - row * 2;
          for (let i = 0; i < n; i++) {
            const ang = Math.PI * (1.04 + (0.92 * (i + (row % 2) * 0.5)) / (n - 0.5));
            const rx2 = rxh - row * 2.2;
            const x = cxh + Math.cos(ang) * rx2, y = cyh + Math.sin(ang) * ry2 * 0.82;
            if (y > hy - 1) continue;
            curls.push([x, y, 2.05 - row * 0.08, (i * 7 + row * 3) % 5]);
          }
        }
        // flequillo corto: unos pocos rizos sobre la frente
        for (let i = 0; i < 5; i++) curls.push([fx - 6 + i * 3.2, hy - 8.3 + (i % 2) * 0.8, 1.8, i]);
        ctx.fillStyle = d.hair; ctx.strokeStyle = OL; ctx.lineWidth = 1.1;
        for (const [x, y, r] of curls) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = d.hair;
        for (const [x, y, r] of curls) { ctx.beginPath(); ctx.arc(x, y, r - 0.4, 0, Math.PI * 2); ctx.fill(); }
        // detalle: cada rizo con su vuelta de brillo y una sombra debajo
        curls.forEach(([x, y, r, v]) => {
          const a0 = 3.4 + v * 0.35;
          ctx.strokeStyle = lighten(d.hair, 0.3); ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.arc(x - 0.2, y - 0.2, r * 0.55, a0, a0 + 1.9); ctx.stroke();
          ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.arc(x, y + 0.2, r * 0.8, 0.3, 2.6); ctx.stroke();
        });
      } else if (d.hairStyle === "shortWavy") {
        // corto y ondulado: poco volumen arriba, lados rebajados
        ctx.fillStyle = d.hair;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(L - 0.8, hy + 2);
        ctx.quadraticCurveTo(L - 1.6, top + 2, fx, top + 1.5);
        ctx.quadraticCurveTo(R + 1.6, top + 2, R + 0.8, hy + 1);
        ctx.lineTo(R - 1, hy + 1); ctx.lineTo(R - 1.2, hy - 6);
        ctx.quadraticCurveTo(fx + 2, hy - 9.5, L + 1.2, hy - 6);
        ctx.lineTo(L + 1, hy + 2); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.5; ctx.stroke();
        // arriba: ondas pequeñas siguiendo la forma de la cabeza
        ctx.lineWidth = 1.6;
        const ring = [];
        for (let k = 0; k <= 9; k++) {
          const ang = Math.PI * (1.1 + k * 0.0889);
          ring.push([fx + Math.cos(ang) * (F.rx - 0.5), hy - 3 + Math.sin(ang) * (F.ry + 0.3)]);
        }
        ctx.beginPath();
        ctx.moveTo(L + 1, hy - 4);
        for (const [x, y] of ring) ctx.lineTo(x, y);
        ctx.quadraticCurveTo(fx + 3, hy - 10, L + 1, hy - 4);
        ctx.fill();
        for (const [x, y] of ring) { ctx.beginPath(); ctx.arc(x, y, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(L + 1.5, hy - 4.5); ctx.quadraticCurveTo(fx + 3, hy - 10.5, R - 1.5, hy - 5); ctx.stroke();
        ctx.strokeStyle = lighten(d.hair, 0.32); ctx.lineWidth = 0.9;
        for (const [x, y] of ring) { ctx.beginPath(); ctx.arc(x - 0.4, y - 0.4, 1.2, 3.4, 5.2); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(fx - 6, top + 4);
        for (let x = fx - 6; x < fx + 6; x += 4) ctx.quadraticCurveTo(x + 2, top + 2.4, x + 4, top + 4);
        ctx.stroke();
      } else if (d.hairStyle === "dreads") {
        ctx.fillStyle = d.hair;
        ctx.beginPath();
        ctx.moveTo(L - 1.5, hy + 1);
        ctx.quadraticCurveTo(L - 3, top - 1.5, fx, top - 2);
        ctx.quadraticCurveTo(R + 3, top - 1.5, R + 1.5, hy);
        ctx.lineTo(R - 1.5, hy - 5);
        ctx.quadraticCurveTo(fx + 2, hy - 10.5, L + 1.5, hy - 5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // las rastas, saliendo de la coronilla y cayendo a los lados de la cara
        const strands = [[L + 1, -1, -3.5], [L + 4.5, 0.5, -2], [R - 4.5, 0.5, 2], [R - 1, -1, 3.5], [fx - 3, -0.5, -1], [fx + 3, -0.5, 1]];
        for (const [x0, dy, dx] of strands) {
          const side = Math.abs(dx) > 2.5, endY = side ? hy + 15 : hy - 6;
          for (const [w, c] of [[5.6, OL], [3.4, d.hair]]) {
            ctx.strokeStyle = c; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x0, top + 2 + dy);
            ctx.quadraticCurveTo(x0 + dx * 1.6, (top + endY) / 2, x0 + dx + (side ? sway : 0), endY); ctx.stroke();
          }
        }
        // anillitos de las rastas
        ctx.strokeStyle = lighten(d.hair, 0.28); ctx.lineWidth = 0.9;
        for (const [x0, dy, dx] of strands) {
          if (Math.abs(dx) <= 2.5) continue;
          for (let k = 1; k <= 3; k++) {
            const t = k / 4, yy = top + 2 + (hy + 15 - top - 2) * t, xx = x0 + dx * (2 * t * (1 - t) * 1.6 + t * t);
            ctx.beginPath(); ctx.moveTo(xx - 1.4, yy); ctx.lineTo(xx + 1.4, yy + 0.6); ctx.stroke();
          }
        }
      } else if (d.hairStyle === "curlyTop") {
        // lados cortos (degradado) y un montón de rizos arriba
        ctx.fillStyle = d.hair;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(L - 0.8, hy + 2);
        ctx.quadraticCurveTo(L - 1.6, top + 2, fx, top + 1.5);
        ctx.quadraticCurveTo(R + 1.6, top + 2, R + 0.8, hy + 1);
        ctx.lineTo(R - 1, hy + 1); ctx.lineTo(R - 1.2, hy - 6);
        ctx.quadraticCurveTo(fx + 2, hy - 9.5, L + 1.2, hy - 6);
        ctx.lineTo(L + 1, hy + 2); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.6; ctx.stroke();
        ctx.lineWidth = 1.8;
        const curls = [[-8, -1], [-4, -3.5], [0.5, -4.5], [5, -3.5], [9, -1], [-6, 2], [-1.5, 0.5], [3, 0.5], [7.5, 2.5]];
        for (const [ox, oy] of curls) {
          ctx.beginPath(); ctx.arc(fx + ox, top + oy + 1, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = lighten(d.hair, 0.35); ctx.lineWidth = 1;
        for (const [ox, oy] of curls) { ctx.beginPath(); ctx.arc(fx + ox - 0.5, top + oy + 0.5, 1.5, 3.4, 5.2); ctx.stroke(); }
      } else if (d.hairStyle === "curly") {
        // rizos: bolitas por todo el borde de la cabeza
        ctx.fillStyle = d.hair;
        ctx.beginPath();
        ctx.moveTo(L - 1, hy + 1);
        ctx.quadraticCurveTo(L - 2, top, fx, top);
        ctx.quadraticCurveTo(R + 2, top, R + 1, hy - 1);
        ctx.lineTo(R - 1.5, hy - 6);
        ctx.quadraticCurveTo(fx + 2, hy - 10, L + 2, hy - 5);
        ctx.closePath(); ctx.fill();
        for (let k = 0; k <= 8; k++) {
          const a = Math.PI * (0.92 + k * 0.145);
          const bx = fx + Math.cos(a) * (F.rx + 1.5), by = hy - 3 + Math.sin(a) * (F.ry + 0.5);
          ctx.beginPath(); ctx.arc(bx, by, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = lighten(d.hair, 0.3); ctx.lineWidth = 1;
        for (let k = 1; k <= 7; k += 2) {
          const a = Math.PI * (0.92 + k * 0.145);
          const bx = fx + Math.cos(a) * (F.rx + 1.5), by = hy - 3 + Math.sin(a) * (F.ry + 0.5);
          ctx.beginPath(); ctx.arc(bx - 0.5, by - 0.5, 1.6, 3.4, 5.2); ctx.stroke();
        }
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
        ctx.fillStyle = d.watch || d.band;
        ctx.beginPath(); ctx.arc(wx, wy, d.watch ? 2.4 : 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.fillStyle = d.skin;
      ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // El hijo de Pamela: crece un año con cada conjunto de ella (0, 1, 2 y 3 años).
  // De bebé: pelele y pañal; desde los 2: camiseta, pantalón corto y zapatillas.
  function drawBaby(x, y, ph, age) {
    age = age || 0;
    const k = Math.sin(ph), big = age >= 2;
    const grow = 1 + age * 0.13;               // más alto cada año
    const legL = 7 + age * 1.6, bodyH = 7.5 + age * 0.9, headR = 9 - age * 0.35;
    const cloth = big ? ["#8cc8f0", "#3fa66b", "#d63a32"][age - 1] || "#d63a32" : "#8cc8f0";
    const pants = big ? "#3a4a66" : cloth;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.15);
    ctx.scale(grow, grow);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const SK = "#f3c9a6", HAIR = "#6a4329";
    // piernas que patalean (de mayor, con zapatillas)
    for (const [lx, a] of [[-4, 0.5 + k * 0.35], [2, 0.2 - k * 0.35]]) {
      const ex = lx - 3 + Math.cos(a + 1.6) * legL, ey = 8 + Math.sin(a + 1.6) * legL;
      ctx.strokeStyle = OL; ctx.lineWidth = 6.5;
      ctx.beginPath(); ctx.moveTo(lx, 8); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = big ? SK : pants; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(lx, 8); ctx.lineTo(ex, ey); ctx.stroke();
      if (big) {
        // pantalón corto hasta media pierna
        const mx = lx + (ex - lx) * 0.45, my = 8 + (ey - 8) * 0.45;
        ctx.strokeStyle = pants; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(lx, 8); ctx.lineTo(mx, my); ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(ex + 1, ey + 0.5, 3.4, 2.2, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = SK; ctx.beginPath(); ctx.arc(ex, ey, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      }
    }
    // cuerpo
    ctx.fillStyle = cloth; ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(0, 4, 8 - age * 0.3, bodyH, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!big) {
      // pañal con su imperdible
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(-0.5, 4 + bodyH - 2.5, 7, 3.5, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(-6, 4 + bodyH - 3, 1.1, 0, Math.PI * 2); ctx.fill();
    } else {
      // camiseta con una estrella y el pantalón asomando
      ctx.fillStyle = pants;
      ctx.beginPath(); ctx.ellipse(0, 4 + bodyH - 2, 7, 3, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.2 : 2.8, an = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(1 + Math.cos(an) * r, 3 + Math.sin(an) * r); }
      ctx.closePath(); ctx.fill();
    }
    // bracitos arriba
    for (const [sx, a] of [[-5, -2.4 + k * 0.3], [5, -0.8 - k * 0.3]]) {
      const L = 7 + age * 0.8, ex = sx + Math.cos(a) * L, ey = 1 + Math.sin(a) * L;
      ctx.strokeStyle = OL; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(sx, 1); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = big ? SK : cloth; ctx.lineWidth = 3.6;
      ctx.beginPath(); ctx.moveTo(sx, 1); ctx.lineTo(ex, ey); ctx.stroke();
      if (big) { ctx.strokeStyle = cloth; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(sx, 1); ctx.lineTo(sx + (ex - sx) * 0.4, 1 + (ey - 1) * 0.4); ctx.stroke(); }
      ctx.fillStyle = SK; ctx.beginPath(); ctx.arc(ex, ey, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
    }
    // cabeza (algo menos grande cuanto mayor)
    const hy = -9 + age * 0.4;
    const g = ctx.createRadialGradient(2, hy - 2, 1, 0, hy, headR + 1);
    g.addColorStop(0, lighten(SK, 0.12)); g.addColorStop(1, SK);
    ctx.fillStyle = g; ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(0, hy, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SK; ctx.beginPath(); ctx.ellipse(-headR + 0.4, hy + 1, 2, 2.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // pelo: un mechón de bebé; luego cada año un poco más
    ctx.strokeStyle = HAIR; ctx.fillStyle = HAIR;
    if (age === 0) {
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, hy - 9); ctx.quadraticCurveTo(4, hy - 13, 5, hy - 8.5); ctx.stroke();
    } else {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, hy, headR, 0, Math.PI * 2); ctx.clip();
      // corte de niño: corto, pegado arriba, con las puntas de punta y la frente despejada
      const line = hy - headR + 3 + age * 0.6;
      ctx.beginPath();
      ctx.moveTo(-headR - 1, hy - 1);
      ctx.lineTo(-headR - 1, hy - headR - 1); ctx.lineTo(headR + 1, hy - headR - 1);
      ctx.lineTo(headR + 1, line - 2);
      ctx.quadraticCurveTo(2, line + 0.8, -headR + 2, line + 1.5);
      ctx.lineTo(-headR + 1, hy - 1);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, hy, headR, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      // pelillos de punta
      ctx.fillStyle = HAIR; ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
      for (const [px, h] of [[-3, 2.2], [0.5, 2.8 + age * 0.3], [4, 2.2]]) {
        ctx.beginPath(); ctx.moveTo(px - 2, hy - headR + 0.8); ctx.lineTo(px + 0.8, hy - headR - h); ctx.lineTo(px + 2.4, hy - headR + 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    // carita: de bebé ojos cerrados de risa; de mayor, ojos abiertos
    ctx.strokeStyle = "#2a1c14"; ctx.fillStyle = "#2a1c14"; ctx.lineWidth = 1.4;
    const ey = hy - 0.5;
    if (age === 0) {
      ctx.beginPath(); ctx.arc(-1.5, ey, 1.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(4.5, ey, 1.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else {
      for (const ex of NUMS_20) {
        ctx.beginPath(); ctx.arc(ex, ey, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex + 0.5, ey - 0.5, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2a1c14";
      }
    }
    ctx.fillStyle = age === 0 ? "rgba(240,120,120,0.45)" : "rgba(230,130,110,0.28)";
    ctx.beginPath(); ctx.arc(-3.5, ey + 3.5, 1.8, 0, Math.PI * 2); ctx.arc(7, ey + 3.5, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8a2c2c";
    ctx.beginPath(); ctx.moveTo(-0.5, ey + 4); ctx.quadraticCurveTo(1.8, ey + 8, 4, ey + 4); ctx.closePath(); ctx.fill();
    if (age >= 1) {
      // dientecitos
      ctx.fillStyle = "#fff";
      ctx.fillRect(0.6, ey + 4, 1.1, age >= 2 ? 1.2 : 1); ctx.fillRect(1.9, ey + 4, 1.1, age >= 2 ? 1.2 : 1);
    }
    ctx.restore();
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
  function drawDog(px, py, rot, flapPh, scale, mood, d) {
    d = d || {};
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
    for (const [ex, tilt] of NUMS_21) {
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
    // complementos
    if (d.bandana) {
      ctx.fillStyle = d.bandana;
      ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(9, 1, 17, -1); ctx.lineTo(9, 10); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const [bx, by] of NUMS_22) { ctx.beginPath(); ctx.arc(bx, by, 0.9, 0, Math.PI * 2); ctx.fill(); }
    }
    if (d.collar) {
      ctx.strokeStyle = OL; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(9, 2, 16, -1); ctx.stroke();
      ctx.strokeStyle = d.collar; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(9, 2, 16, -1); ctx.stroke();
      ctx.fillStyle = "#f2c94c";
      ctx.beginPath(); ctx.arc(9.5, 4, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.stroke();
    }
    if (d.glasses && mood !== "dead") {
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 2.5); ctx.lineTo(hx - 6, hy - 3.5); ctx.stroke();
      ctx.fillStyle = "#1b1c22";
      roundRect(hx + 0.6, hy - 5.2, 7.6, 5.6, 2.4); ctx.fill();
      ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(hx + 2, hy - 3.8); ctx.lineTo(hx + 3.8, hy - 3.8); ctx.stroke();
    }
    if (d.hat && d.hat.type !== "cap") drawHeadwear(d.hat, hx, hy - 10.5, 9.5);
    else if (d.hat) {
      const c = d.hat.color;
      ctx.fillStyle = c; ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 6);
      ctx.quadraticCurveTo(hx - 8, hy - 16, hx, hy - 16);
      ctx.quadraticCurveTo(hx + 8, hy - 16, hx + 8, hy - 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = darken(c, 0.18);
      ctx.beginPath(); ctx.moveTo(hx + 4, hy - 7); ctx.quadraticCurveTo(hx + 13, hy - 8, hx + 16, hy - 4.5);
      ctx.quadraticCurveTo(hx + 9, hy - 3.5, hx + 4, hy - 5); ctx.closePath(); ctx.fill(); ctx.stroke();
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

  // ---------- Animales para «Crea tu personaje» (12/11/2026) ----------
  // Todos con el mismo cuerpo redondo que el pastor alemán: cabeza grande mirando a
  // la derecha y patitas que reman. Cada uno se desbloquea con un récord distinto.
  const SPECIES = {
    gato: { name: "Gato", art: "el gato", pts: 40, ear: "pointy", snout: "cat", tail: "thin",
      colors: [["#f0a04b", "#ffe2bf", "Naranja"], ["#9aa0a8", "#eceef1", "Gris"], ["#3a3a44", "#70707c", "Negro"], ["#f3efe6", "#ffffff", "Blanco"]] },
    conejo: { name: "Conejo", art: "el conejo", pts: 60, ear: "long", snout: "bunny", tail: "pom",
      colors: [["#f3efe9", "#ffffff", "Blanco"], ["#b58a63", "#efd9c0", "Marrón"], ["#9c9ca6", "#e3e3ea", "Gris"]] },
    oso: { name: "Oso", art: "el oso", pts: 75, ear: "round", snout: "bear", tail: "stub",
      colors: [["#8a5a34", "#d9b48c", "Pardo"], ["#f2f0ea", "#ffffff", "Polar"], ["#3b3030", "#8a6a5a", "Negro"]] },
    zorro: { name: "Zorro", art: "el zorro", pts: 90, ear: "pointy", earTip: "#3a2418", snout: "fox", tail: "fluffy",
      colors: [["#e8742c", "#fff3e6", "Rojo"], ["#e9eef2", "#ffffff", "Ártico"]] },
    cerdito: { name: "Cerdito", art: "el cerdito", pts: 110, ear: "pig", snout: "pig", tail: "curl",
      colors: [["#f7a8b8", "#ffd3dc", "Rosa"], ["#c9906c", "#e8c2a5", "Ibérico"]] },
    panda: { name: "Panda", art: "el panda", pts: 130, ear: "round", earColor: "#26262c", snout: "bear", tail: "stub", pattern: "panda", limbs: "#26262c",
      colors: [["#f5f5f2", "#ffffff", "Blanco y negro"]] },
    pinguino: { name: "Pingüino", art: "el pingüino", pts: 150, ear: "none", snout: "beak", tail: "none", flippers: true,
      colors: [["#2b2f3a", "#ffffff", "Clásico"], ["#4a6a8a", "#f0f4f8", "Azulado"]] },
    rana: { name: "Rana", art: "la rana", pts: 170, ear: "none", snout: "frog", tail: "none", eyesTop: true,
      colors: [["#6cbf4a", "#d8f0b0", "Verde"], ["#e0b030", "#fff0b0", "Dorada"], ["#4aa3d8", "#cdeaff", "Azul"]] },
    mono: { name: "Mono", art: "el mono", pts: 190, ear: "side", snout: "monkey", tail: "long",
      colors: [["#8a5a34", "#f0d0a8", "Marrón"], ["#4a4a50", "#e8d0b8", "Gris"]] },
    koala: { name: "Koala", art: "el koala", pts: 215, ear: "fluffy", snout: "koala", tail: "stub",
      colors: [["#9aa0a8", "#e8e8ec", "Gris"]] },
    leon: { name: "León", art: "el león", pts: 240, ear: "round", snout: "cat", tail: "tuft", mane: "lion",
      colors: [["#e0a848", "#fbe3b0", "Dorado"], ["#f2ead8", "#ffffff", "Blanco"]] },
    tigre: { name: "Tigre", art: "el tigre", pts: 270, ear: "round", snout: "cat", tail: "thin", stripes: true,
      colors: [["#f08a2c", "#fff4e6", "Naranja"], ["#f2f2f0", "#ffffff", "Blanco"]] },
    unicornio: { name: "Unicornio", art: "el unicornio", pts: 320, ear: "pointy", snout: "horse", tail: "rainbow", horn: true, wings: "feather", mane: "rainbow",
      colors: [["#ffffff", "#fdf2ff", "Blanco"], ["#ffd6ec", "#fff0f8", "Rosa"]] },
    dragon: { name: "Dragón", art: "el dragón", pts: 400, ear: "none", snout: "dragon", tail: "spiky", horns: true, wings: "bat", spikes: true,
      colors: [["#4caf50", "#d8f0a8", "Verde"], ["#d84a3a", "#ffd0a0", "Rojo"], ["#7a5ac8", "#e0d0ff", "Morado"]] },
  };
  const SPECIES_KEYS = Object.keys(SPECIES);
  const RAINBOW = ["#ff6b9a", "#ffb347", "#ffe066", "#7ad67a", "#6ab7ff", "#b07cff"];

  function drawCritter(d, px, py, rot, flapPh, scale, mood) {
    const S = SPECIES[d.species] || SPECIES.gato;
    const C1 = d.body || S.colors[0][0], C2 = d.belly || S.colors[0][1];
    const LIMB = S.limbs || C1, PAW = S.limbs ? "#3a3a42" : C2, PINK = "#f6b3c3";
    ctx.save();
    ctx.translate(px, py); ctx.rotate(rot || 0); ctx.scale(scale || 1, scale || 1);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const sw = Math.sin(flapPh), wag = Math.sin(worldT * 3 + 1) * 0.18;
    const hx = 12, hy = -9, HR = 11;
    const ink = (w) => { ctx.strokeStyle = OL; ctx.lineWidth = w || 2; ctx.stroke(); };
    const tri = (a, b, c, e, g, h) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, e); ctx.lineTo(g, h); ctx.closePath(); };
    const bodyTop = (x) => 3 - 10.5 * Math.sqrt(Math.max(0, 1 - ((x + 2) / 15) ** 2));

    // cola
    ctx.save(); ctx.translate(-15, 2); ctx.rotate(wag); tail(S.tail); ctx.restore();
    // ala de atrás
    if (S.wings) wing(-3, -4, -0.25 + sw * 0.5, true);
    // patas de atrás
    if (S.flippers) { pfoot(-7, 12); pfoot(-1, 13); }
    else { leg(-9, 9, 1.9 + sw * 0.5, darken(LIMB, 0.12)); leg(-3, 10, 1.7 - sw * 0.5, darken(LIMB, 0.15)); leg(6, 9, 1.2 - sw * 0.9, darken(LIMB, 0.15)); }
    // púas del dragón, asomando por el lomo
    if (S.spikes) {
      ctx.fillStyle = C2;
      for (let i = 0; i < 4; i++) { const sx = -13 + i * 5.5, by = bodyTop(sx); tri(sx - 3, by + 2.5, sx - 0.5, by - 6, sx + 3, by + 2.5); ctx.fill(); ink(1.3); }
    }
    // cuerpo y barriga
    ctx.fillStyle = C1;
    ctx.beginPath(); ctx.ellipse(-2, 3, 15, 10.5, -0.05, 0, Math.PI * 2); ctx.fill(); ink();
    ctx.fillStyle = C2;
    ctx.beginPath(); ctx.ellipse(3, 6.5, 9, 5.8, 0.15, 0, Math.PI * 2); ctx.fill();
    if (S.pattern === "panda") { ctx.fillStyle = "#26262c"; ctx.beginPath(); ctx.ellipse(5, -2.5, 7, 5.5, 0.3, 0, Math.PI * 2); ctx.fill(); }
    if (S.stripes) {
      ctx.strokeStyle = "#2a1c14"; ctx.lineWidth = 2;
      for (const sx of NUMS_23) { const by = bodyTop(sx); ctx.beginPath(); ctx.moveTo(sx, by + 0.5); ctx.quadraticCurveTo(sx + 2.5, by + 4, sx, by + 8); ctx.stroke(); }
    }
    // pata y aleta de delante, y ala de delante
    if (S.flippers) flipper(5, 1, 0.5 + sw * 0.7); else leg(9, 8, 1.0 + sw * 0.9, LIMB);
    if (S.wings) wing(0, -5, -0.45 + sw * 0.6, false);

    // melena o crin, por detrás de la cabeza
    if (S.mane === "lion") {
      ctx.fillStyle = darken(C1, 0.35);
      ctx.beginPath();
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = i % 2 ? 13.5 : 16.5; ctx.lineTo(hx - 1.5 + Math.cos(a) * r, hy + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ink(1.6);
    }
    if (S.mane === "rainbow") {
      RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(hx - 10 + i * 0.6, hy - 7 + i * 3.2, 6, 2.8, -0.5, 0, Math.PI * 2); ctx.fill(); });
    }
    ears(S.ear);
    // cabeza
    ctx.fillStyle = C1;
    ctx.beginPath(); ctx.arc(hx, hy, HR, 0, Math.PI * 2); ctx.fill(); ink();
    if (S.stripes) {
      ctx.strokeStyle = "#2a1c14"; ctx.lineWidth = 1.8;
      for (const [x0, y0, x1, y1] of [[hx - 3, hy - 10.5, hx - 2, hy - 6], [hx + 1, hy - 11, hx + 1.5, hy - 7], [hx - 10, hy - 2, hx - 6, hy - 1]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    }
    if (S.pattern === "panda") {
      ctx.fillStyle = "#26262c";
      ctx.beginPath(); ctx.ellipse(hx + 1.2, hy - 1.5, 3.6, 4.6, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + 7.4, hy - 2, 3.2, 4.2, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    snout(S.snout);
    eyes();
    // cuerno y cuernos
    if (S.horn) {
      const g = ctx.createLinearGradient(hx, hy - 24, hx + 5, hy - 9);
      g.addColorStop(0, "#fff4b0"); g.addColorStop(1, "#e8b830");
      ctx.fillStyle = g; tri(hx - 1, hy - 9, hx + 5, hy - 25, hx + 5, hy - 9.5); ctx.fill(); ink(1.4);
      ctx.strokeStyle = "rgba(160,110,20,0.7)"; ctx.lineWidth = 0.9;
      for (const k of NUMS_24) { ctx.beginPath(); ctx.moveTo(hx - 1 + 6 * k * 0.9, hy - 9 - 16 * k); ctx.lineTo(hx + 5, hy - 9.5 - 15.5 * k + 1.2); ctx.stroke(); }
    }
    if (S.horns) {
      ctx.fillStyle = "#f3ead2";
      tri(hx - 6, hy - 8, hx - 9, hy - 17, hx - 2, hy - 9.5); ctx.fill(); ink(1.3);
      tri(hx + 1, hy - 10.5, hx, hy - 19, hx + 5.5, hy - 10); ctx.fill(); ink(1.3);
    }
    // complementos
    if (d.necklace || d.collar) {
      ctx.strokeStyle = OL; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(9, 3, 15, 1); ctx.stroke();
      ctx.strokeStyle = d.collar || d.necklace; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(9, 3, 15, 1); ctx.stroke();
      ctx.fillStyle = "#f2c94c"; ctx.beginPath(); ctx.arc(9.5, 4.5, 2.2, 0, Math.PI * 2); ctx.fill(); ink(1);
    }
    const ey = S.eyesTop ? hy - 10 : hy - 2;
    if (d.glasses && mood !== "dead") {
      ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 2, ey - 0.5); ctx.lineTo(hx - 9, ey - 1.5); ctx.stroke();
      for (const ex of [hx + 1.5, hx + 7.4]) { ctx.fillStyle = "#1b1c22"; roundRect(ex - 3.4, ey - 2.6, 6.8, 5, 2.2); ctx.fill(); ink(1); }
      ctx.beginPath(); ctx.moveTo(hx + 4.9, ey - 0.6); ctx.lineTo(hx + 4, ey - 0.6); ctx.stroke();
    }
    if (d.hat) drawHeadwear(d.hat, hx, hy - HR - (S.eyesTop ? 4 : 0), HR * 0.9);
    ctx.restore();

    function leg(sx, sy, ang, color) {
      const ex = sx + Math.cos(ang) * 10, ey2 = sy + Math.sin(ang) * 10;
      ctx.strokeStyle = OL; ctx.lineWidth = 7.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey2); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey2); ctx.stroke();
      ctx.fillStyle = PAW; ctx.beginPath(); ctx.ellipse(ex, ey2, 3.6, 2.8, ang, 0, Math.PI * 2); ctx.fill(); ink(1.3);
    }
    function pfoot(x, y) { ctx.fillStyle = "#f5a623"; ctx.beginPath(); ctx.ellipse(x, y, 4, 2.2, 0.2, 0, Math.PI * 2); ctx.fill(); ink(1.2); }
    function flipper(x, y, ang) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = darken(C1, 0.1); ctx.beginPath(); ctx.ellipse(-2, 7, 3.6, 8, 0.2, 0, Math.PI * 2); ctx.fill(); ink(1.5);
      ctx.restore();
    }
    function wing(x, y, ang, back) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      if (S.wings === "feather") {
        ctx.fillStyle = back ? "#ece6ff" : "#ffffff";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -15, -18, -18); ctx.quadraticCurveTo(-15, -13, -19, -10);
        ctx.quadraticCurveTo(-14, -7, -17, -3); ctx.quadraticCurveTo(-9, -2, 0, 0); ctx.fill(); ink(1.5);
        ctx.strokeStyle = "rgba(140,120,200,0.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-14, -12); ctx.moveTo(-4, -2); ctx.lineTo(-13, -5); ctx.stroke();
      } else {
        ctx.fillStyle = back ? darken(C1, 0.28) : darken(C1, 0.12);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -17); ctx.lineTo(-20, -15); ctx.quadraticCurveTo(-16, -11, -19, -7);
        ctx.quadraticCurveTo(-13, -6, -14, -2); ctx.quadraticCurveTo(-7, -3, 0, 0); ctx.fill(); ink(1.5);
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-6, -17); ctx.lineTo(-12, -4); ctx.moveTo(-6, -17); ctx.lineTo(-17, -9); ctx.stroke();
      }
      ctx.restore();
    }
    function tail(t) {
      const rope = (draw, w, color) => { ctx.strokeStyle = OL; ctx.lineWidth = w + 2.4; draw(); ctx.stroke(); ctx.strokeStyle = color; ctx.lineWidth = w; draw(); ctx.stroke(); };
      if (t === "thin" || t === "tuft") {
        rope(() => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-11, 2, -12, -10); }, 3.2, C1);
        if (S.stripes) { ctx.strokeStyle = "#2a1c14"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(-7, 2); ctx.moveTo(-10.5, -5); ctx.lineTo(-13, -4); ctx.stroke(); }
        if (t === "tuft") { ctx.fillStyle = darken(C1, 0.35); ctx.beginPath(); ctx.ellipse(-12, -12, 2.6, 3.6, 0.3, 0, Math.PI * 2); ctx.fill(); ink(1.2); }
      } else if (t === "fluffy") {
        ctx.fillStyle = C1; ctx.beginPath(); ctx.ellipse(-9, -2, 11, 5, -0.4, 0, Math.PI * 2); ctx.fill(); ink(1.6);
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(-17, -5.5, 3.6, 2.8, -0.4, 0, Math.PI * 2); ctx.fill();
      } else if (t === "pom") {
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-1, -1, 5, 0, Math.PI * 2); ctx.fill(); ink(1.5);
      } else if (t === "stub") {
        ctx.fillStyle = LIMB; ctx.beginPath(); ctx.arc(0, -1, 3.6, 0, Math.PI * 2); ctx.fill(); ink(1.4);
      } else if (t === "curl") {
        rope(() => { ctx.beginPath(); ctx.moveTo(1, 0); ctx.bezierCurveTo(-6, -1, -7, -8, -3, -8); ctx.quadraticCurveTo(0, -7, -2, -4.5); }, 2, C1);
      } else if (t === "long") {
        rope(() => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, 4, -20, -8, -12, -14); ctx.quadraticCurveTo(-8, -17, -10, -11); }, 3, C1);
      } else if (t === "rainbow") {
        RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, -2 + i * 0.8); ctx.quadraticCurveTo(-10, -6 + i * 1.6, -17, 2 + i * 1.8); ctx.stroke(); });
      } else if (t === "spiky") {
        ctx.fillStyle = C1;
        ctx.beginPath(); ctx.moveTo(1, -4); ctx.quadraticCurveTo(-12, -5, -21, 2); ctx.quadraticCurveTo(-12, 3, 1, 4); ctx.closePath(); ctx.fill(); ink(1.6);
        ctx.fillStyle = C2; tri(-21, 2, -27, -2, -25, 5); ctx.fill(); ink(1.3);
      }
    }
    function ears(t) {
      const at = (x, y, a, fn) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); fn(); ctx.restore(); };
      if (t === "pointy") {
        for (const [x, y, a] of [[hx - 6, hy - 6, -0.35], [hx + 3, hy - 8.5, 0.1]]) at(x, y, a, () => {
          ctx.fillStyle = C1; tri(-4.5, 2, 0, -11, 4.5, 2); ctx.fill(); ink(1.8);
          ctx.fillStyle = PINK; tri(-2, 0, 0, -6.5, 2, 0); ctx.fill();
          if (S.earTip) { ctx.fillStyle = S.earTip; tri(-2.3, -6.4, 0, -11, 2.3, -6.4); ctx.fill(); }
        });
      } else if (t === "long") {
        for (const [x, y, a] of [[hx - 5, hy - 8, -0.3 + sw * 0.06], [hx + 2, hy - 9, 0.1 - sw * 0.06]]) at(x, y, a, () => {
          ctx.fillStyle = C1; ctx.beginPath(); ctx.ellipse(0, -9, 3.6, 9.5, 0, 0, Math.PI * 2); ctx.fill(); ink(1.8);
          ctx.fillStyle = PINK; ctx.beginPath(); ctx.ellipse(0, -9, 1.7, 6.8, 0, 0, Math.PI * 2); ctx.fill();
        });
      } else if (t === "round" || t === "fluffy") {
        const big = t === "fluffy", r = big ? 7.2 : 4.6;
        for (const [x, y] of big ? [[hx - 9, hy - 6], [hx + 5, hy - 9.5]] : [[hx - 7, hy - 7.5], [hx + 4, hy - 9.5]]) {
          ctx.fillStyle = S.earColor || C1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ink(1.8);
          ctx.fillStyle = S.earColor ? "#4a4a52" : C2; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      } else if (t === "side") {
        ctx.fillStyle = C1; ctx.beginPath(); ctx.arc(hx - 10, hy + 0.5, 4.8, 0, Math.PI * 2); ctx.fill(); ink(1.8);
        ctx.fillStyle = C2; ctx.beginPath(); ctx.arc(hx - 10, hy + 0.5, 2.6, 0, Math.PI * 2); ctx.fill();
      } else if (t === "pig") {
        for (const [x, y, a] of [[hx - 6, hy - 6.5, -0.7], [hx + 3, hy - 8.5, 0.45]]) at(x, y, a, () => {
          ctx.fillStyle = C1; tri(-4, 2, 0, -8.5, 4, 2); ctx.fill(); ink(1.6);
          ctx.fillStyle = darken(C1, 0.12); tri(-2, 0.5, 0, -4.5, 2, 0.5); ctx.fill();
        });
      }
    }
    function snout(t) {
      ctx.lineWidth = 1.2;
      if (t === "cat" || t === "bunny") {
        ctx.fillStyle = C2; ctx.beginPath(); ctx.ellipse(hx + 8, hy + 4, 5.5, 3.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f28aa0"; tri(hx + 9, hy + 1.4, hx + 12.6, hy + 1.4, hx + 10.8, hy + 3.6); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(hx + 10.8, hy + 3.6); ctx.quadraticCurveTo(hx + 9.6, hy + 6.2, hx + 7.9, hy + 5);
        ctx.moveTo(hx + 10.8, hy + 3.6); ctx.quadraticCurveTo(hx + 12, hy + 6.2, hx + 13.5, hy + 5); ctx.stroke();
        if (t === "bunny") { ctx.fillStyle = "#fff"; ctx.fillRect(hx + 9.5, hy + 5.4, 2.6, 2.8); ctx.strokeRect(hx + 9.5, hy + 5.4, 2.6, 2.8); }
        else {
          ctx.strokeStyle = "rgba(42,28,20,0.55)"; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(hx + 13, hy + 3.2); ctx.lineTo(hx + 19.5, hy + 1.6); ctx.moveTo(hx + 13, hy + 4.2); ctx.lineTo(hx + 19.5, hy + 5); ctx.stroke();
        }
      } else if (t === "bear") {
        ctx.fillStyle = S.pattern === "panda" ? "#ffffff" : C2; ctx.beginPath(); ctx.ellipse(hx + 8.5, hy + 3.6, 6, 4.6, 0, 0, Math.PI * 2); ctx.fill(); ink(1.3);
        ctx.fillStyle = "#2a1c14"; ctx.beginPath(); ctx.ellipse(hx + 12, hy + 1.8, 2.6, 1.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 12, hy + 3.6); ctx.quadraticCurveTo(hx + 10.5, hy + 6.4, hx + 8.5, hy + 5.6); ctx.stroke();
      } else if (t === "fox") {
        ctx.fillStyle = C1; ctx.beginPath(); ctx.moveTo(hx + 4, hy - 1.5); ctx.quadraticCurveTo(hx + 12, hy - 1, hx + 18.5, hy + 3);
        ctx.quadraticCurveTo(hx + 12, hy + 8, hx + 4, hy + 7.5); ctx.closePath(); ctx.fill(); ink(1.5);
        ctx.fillStyle = C2; ctx.beginPath(); ctx.moveTo(hx + 5, hy + 3.4); ctx.lineTo(hx + 17.5, hy + 3.6); ctx.quadraticCurveTo(hx + 12, hy + 7.4, hx + 5, hy + 7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#2a1c14"; ctx.beginPath(); ctx.arc(hx + 18.2, hy + 3, 1.9, 0, Math.PI * 2); ctx.fill();
      } else if (t === "pig") {
        ctx.fillStyle = darken(C1, 0.06); ctx.beginPath(); ctx.ellipse(hx + 11.5, hy + 3, 3.4, 4.4, 0, 0, Math.PI * 2); ctx.fill(); ink(1.4);
        ctx.fillStyle = darken(C1, 0.45);
        for (const ny of [hy + 1.5, hy + 4.5]) { ctx.beginPath(); ctx.ellipse(hx + 12, ny, 0.9, 1.2, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 6, hy + 7); ctx.quadraticCurveTo(hx + 8, hy + 8.4, hx + 9.6, hy + 7); ctx.stroke();
      } else if (t === "beak") {
        ctx.fillStyle = C2; ctx.beginPath(); ctx.ellipse(hx + 5, hy + 2, 6.5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f5a623"; tri(hx + 8.5, hy - 0.5, hx + 18, hy + 2.2, hx + 8.5, hy + 4.6); ctx.fill(); ink(1.3);
      } else if (t === "frog") {
        ctx.strokeStyle = OL; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(hx + 1, hy + 3); ctx.quadraticCurveTo(hx + 8, hy + 9.5, hx + 12.5, hy + 2.5); ctx.stroke();
        ctx.fillStyle = "rgba(240,110,130,0.45)"; ctx.beginPath(); ctx.ellipse(hx + 3, hy + 2, 2.2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
      } else if (t === "monkey") {
        ctx.fillStyle = C2;
        ctx.beginPath(); ctx.ellipse(hx + 4, hy - 2.5, 4.4, 4, 0, 0, Math.PI * 2); ctx.ellipse(hx + 8.6, hy - 2.8, 4, 3.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx + 7, hy + 3.5, 6.6, 4.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2a1c14";
        for (const nx of [hx + 9.6, hx + 11.4]) { ctx.beginPath(); ctx.arc(nx, hy + 2, 0.75, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 5, hy + 5); ctx.quadraticCurveTo(hx + 8.5, hy + 7.6, hx + 12, hy + 4.8); ctx.stroke();
      } else if (t === "koala") {
        ctx.fillStyle = "#2a2a30"; ctx.beginPath(); ctx.ellipse(hx + 9.6, hy + 2.4, 3.2, 4.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 6, hy + 7.4); ctx.quadraticCurveTo(hx + 8, hy + 8.6, hx + 10, hy + 7.4); ctx.stroke();
      } else if (t === "horse" || t === "dragon") {
        ctx.fillStyle = t === "horse" ? C2 : C1; ctx.beginPath(); ctx.ellipse(hx + 11, hy + 3.8, 7.4, 5, 0.05, 0, Math.PI * 2); ctx.fill(); ink(1.4);
        ctx.fillStyle = darken(t === "horse" ? C2 : C1, 0.45);
        ctx.beginPath(); ctx.ellipse(hx + 15.5, hy + 2.6, 1.1, 0.8, 0, 0, Math.PI * 2); ctx.fill();
        if (t === "dragon") { ctx.beginPath(); ctx.ellipse(hx + 13, hy + 2.2, 1, 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; tri(hx + 9, hy + 7.6, hx + 10.2, hy + 9.6, hx + 11.4, hy + 7.6); ctx.fill(); }
        ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 7, hy + 6.6); ctx.quadraticCurveTo(hx + 11, hy + 8.4, hx + 15, hy + 6); ctx.stroke();
      }
    }
    function eyes() {
      const pos = S.eyesTop ? [[hx - 0.5, hy - 10, 2.4], [hx + 6.5, hy - 10.8, 2.6]] : [[hx + 1.5, hy - 2, 2.3], [hx + 7.4, hy - 2.4, 2.6]];
      if (S.eyesTop) for (const [x, y] of pos) { ctx.fillStyle = C1; ctx.beginPath(); ctx.arc(x, y, 4.4, 0, Math.PI * 2); ctx.fill(); ink(1.6); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
      const dark = S.pattern === "panda" ? "#ffffff" : "#2a1c14";
      if (mood === "dead") {
        ctx.strokeStyle = S.pattern === "panda" ? "#fff" : OL; ctx.lineWidth = 1.6;
        for (const [x, y] of pos) { ctx.beginPath(); ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 2, y + 2); ctx.moveTo(x + 2, y - 2); ctx.lineTo(x - 2, y + 2); ctx.stroke(); }
      } else if (worldT % 3.8 < 0.12) {
        ctx.strokeStyle = S.pattern === "panda" ? "#fff" : OL; ctx.lineWidth = 1.4;
        for (const [x, y, r] of pos) { ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + 1.4, x + r, y); ctx.stroke(); }
      } else {
        for (const [x, y, r] of pos) {
          ctx.fillStyle = S.pattern === "panda" ? "#1b1b20" : dark;
          if (S.pattern === "panda") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#1b1b20"; }
          ctx.beginPath(); ctx.ellipse(x + 0.3, y, r * (S.pattern === "panda" ? 0.6 : 1), r * (S.pattern === "panda" ? 0.7 : 1.15), 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 1, y - 1, 0.85, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  // ---------- Gorros: los nuevos sirven para personas, el perro y los animales (12/11/2026) ----------
  const OLD_HATS = ["cap", "beanie", "beret", "sunhat", "sombrero"];
  // fx: centro de la cabeza; top: lo alto de la cabeza; rx: medio ancho de la cabeza
  function drawHeadwear(h, fx, top, rx) {
    const c = h.color || "#e63946", t = h.type, L = fx - rx, R = fx + rx;
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
    const ink = (w) => { ctx.strokeStyle = OL; ctx.lineWidth = w || 1.6; ctx.stroke(); };
    if (t === "cap" || t === "beanie") {
      const by = top + rx * 0.8, up = t === "beanie" ? 6 : 3;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(L - 1.5, by); ctx.quadraticCurveTo(L - 2, top - up, fx, top - up); ctx.quadraticCurveTo(R + 2, top - up, R + 1.5, by); ctx.closePath(); ctx.fill(); ink();
      if (t === "cap") { ctx.fillStyle = darken(c, 0.18); ctx.beginPath(); ctx.moveTo(R - 5, by - 1.2); ctx.quadraticCurveTo(R + 7, by - 2.5, R + 10, by + 1.4); ctx.quadraticCurveTo(R + 3, by + 2.6, R - 5, by + 1.2); ctx.closePath(); ctx.fill(); ink(); }
      else { ctx.fillStyle = darken(c, 0.08); roundRect(L - 2, by - 4, R - L + 4, 4.6, 2); ctx.fill(); ink(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx, top - 7.5, 2.8, 0, Math.PI * 2); ctx.fill(); ink(1.3); }
    } else if (t === "beret") {
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(fx - 1, top + 1.5, rx + 3, 4.4, -0.18, 0, Math.PI * 2); ctx.fill(); ink();
      ctx.beginPath(); ctx.moveTo(fx - 2, top - 2.5); ctx.lineTo(fx - 1.5, top - 5); ink(1.5);
    } else if (t === "sunhat" || t === "sombrero") {
      const big = t === "sombrero", brimY = top + (big ? 2.5 : 3.5), brimR = rx + (big ? 15 : 9), cw = big ? 7 : rx - 1, chh = big ? 12 : 7;
      ctx.fillStyle = darken(c, 0.12); ctx.beginPath(); ctx.ellipse(fx, brimY, brimR, big ? 4.5 : 3.4, 0, Math.PI, Math.PI * 2); ctx.fill(); ink();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx - cw, brimY); ctx.quadraticCurveTo(fx - cw - 1, brimY - chh, fx, brimY - chh); ctx.quadraticCurveTo(fx + cw + 1, brimY - chh, fx + cw, brimY); ctx.closePath(); ctx.fill(); ink();
      ctx.fillStyle = big ? "#c0392b" : "#3b2a20"; ctx.fillRect(fx - cw, brimY - (big ? 4 : 2.8), cw * 2, big ? 3 : 2);
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(fx, brimY, brimR, big ? 4.5 : 3.4, 0, 0, Math.PI); ctx.fill(); ink();
    } else if (t === "corona") {
      const y = top + 3, w = rx * 0.95;
      const g = ctx.createLinearGradient(0, y - 11, 0, y); g.addColorStop(0, "#fff1a0"); g.addColorStop(1, "#e0a800");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - w, y); ctx.lineTo(fx - w, y - 8); ctx.lineTo(fx - w * 0.5, y - 4); ctx.lineTo(fx, y - 11.5);
      ctx.lineTo(fx + w * 0.5, y - 4); ctx.lineTo(fx + w, y - 8); ctx.lineTo(fx + w, y); ctx.closePath(); ctx.fill(); ink(1.5);
      for (const [gx, gc] of [[fx, "#e63946"], [fx - w * 0.62, "#3b82f6"], [fx + w * 0.62, "#2fa64a"]]) { ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(gx, y - 2.6, 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "#fff6c8"; for (const gx of [fx - w, fx, fx + w]) { ctx.beginPath(); ctx.arc(gx, gx === fx ? y - 11.5 : y - 8, 1.3, 0, Math.PI * 2); ctx.fill(); }
    } else if (t === "fiesta") {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx - rx * 0.62, top + 3); ctx.lineTo(fx + 2, top - 15); ctx.lineTo(fx + rx * 0.62, top + 3); ctx.closePath(); ctx.fill(); ink();
      ctx.save(); ctx.clip(); ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2.2;
      for (const k of NUMS_25) { ctx.beginPath(); ctx.moveTo(fx - rx, top + k + 2); ctx.lineTo(fx + rx, top + k - 4); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(fx + 2, top - 15.5, 2.6, 0, Math.PI * 2); ctx.fill(); ink(1.2);
    } else if (t === "chistera") {
      const w = rx * 0.72;
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(fx, top + 2.5, rx + 4.5, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ink();
      ctx.fillRect(fx - w, top - 14, w * 2, 16.5); ctx.strokeRect(fx - w, top - 14, w * 2, 16.5);
      ctx.fillStyle = "#c0392b"; ctx.fillRect(fx - w + 0.8, top - 2.5, w * 2 - 1.6, 3);
      ctx.fillStyle = lighten(c, 0.15); ctx.beginPath(); ctx.ellipse(fx, top - 14, w, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ink(1.2);
    } else if (t === "vikingo") {
      for (const sd of NUMS_1) {
        ctx.fillStyle = "#f3ead2"; ctx.beginPath(); ctx.moveTo(fx + sd * rx * 0.75, top + 2); ctx.quadraticCurveTo(fx + sd * (rx + 7), top - 1, fx + sd * (rx + 6), top - 13);
        ctx.quadraticCurveTo(fx + sd * (rx + 2), top - 4, fx + sd * rx * 0.45, top - 1); ctx.closePath(); ctx.fill(); ink(1.4);
      }
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx, top + 5, rx + 1, Math.PI, 0); ctx.closePath(); ctx.fill(); ink();
      ctx.fillStyle = "#c9a227"; ctx.fillRect(L - 1, top + 2.5, R - L + 2, 3); ctx.strokeRect(L - 1, top + 2.5, R - L + 2, 3);
      ctx.fillRect(fx - 1.2, top - 5.5, 2.4, 8);
    } else if (t === "aureola") {
      ctx.strokeStyle = "rgba(120,80,0,0.6)"; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.ellipse(fx, top - 6, rx * 0.85, 3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 2.6; ctx.stroke();
    } else if (t === "cuernos") {
      for (const sd of NUMS_1) {
        const bx = fx + sd * rx * 0.5;
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx - 2.8, top + 3.5); ctx.quadraticCurveTo(bx + sd * 1.5, top - 2, bx + sd * 4, top - 7.5); ctx.quadraticCurveTo(bx + sd * 3.5, top, bx + 2.8, top + 3.5); ctx.closePath(); ctx.fill(); ink(1.3);
      }
    } else if (t === "cocinero") {
      ctx.fillStyle = "#ffffff";
      for (const [ox, oy, r] of [[-rx * 0.5, -6, 5], [rx * 0.5, -6, 5], [0, -9.5, 6]]) { ctx.beginPath(); ctx.arc(fx + ox, top + oy, r, 0, Math.PI * 2); ctx.fill(); ink(1.4); }
      roundRect(fx - rx * 0.78, top - 3, rx * 1.56, 6.5, 1.5); ctx.fill(); ink(1.4);
    } else if (t === "cascos") {
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(fx, top + rx * 0.95, rx + 2, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.fillStyle = c;
      for (const x of [L - 3.5, R - 1.5]) { roundRect(x, top + rx * 0.62, 5, 8.5, 2); ctx.fill(); ink(1.3); }
    } else if (t === "orejas") {
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(fx, top + rx * 0.9, rx + 0.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      for (const [x, a] of [[fx - rx * 0.55, -0.3], [fx + rx * 0.45, 0.2]]) {
        ctx.save(); ctx.translate(x, top + 1.5); ctx.rotate(a);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-4, 1); ctx.lineTo(0, -8.5); ctx.lineTo(4, 1); ctx.closePath(); ctx.fill(); ink(1.4);
        ctx.fillStyle = "#ff9fb8"; ctx.beginPath(); ctx.moveTo(-1.8, 0); ctx.lineTo(0, -4.8); ctx.lineTo(1.8, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    } else if (t === "flor") {
      const x = fx - rx * 0.45, y = top + 2;
      ctx.fillStyle = c;
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.5, 0, Math.PI * 2); ctx.fill(); ink(1); }
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); ink(1);
    } else if (t === "pirata") {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(L - 5, top + 4); ctx.quadraticCurveTo(L - 1, top - 11, fx, top - 9); ctx.quadraticCurveTo(R + 1, top - 11, R + 5, top + 4);
      ctx.quadraticCurveTo(fx, top - 1, L - 5, top + 4); ctx.closePath(); ctx.fill(); ink();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(fx, top - 4, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx - 3, top - 0.5); ctx.lineTo(fx + 3, top - 2.5); ctx.moveTo(fx + 3, top - 0.5); ctx.lineTo(fx - 3, top - 2.5); ctx.stroke();
    } else if (t === "papanoel") {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(L - 1, top + 3); ctx.quadraticCurveTo(fx - 1, top - 16, R + 6, top - 5); ctx.lineTo(R + 1, top + 3); ctx.closePath(); ctx.fill(); ink();
      ctx.fillStyle = "#ffffff"; roundRect(L - 2, top + 0.5, R - L + 4, 5, 2.5); ctx.fill(); ink(1.3);
      ctx.beginPath(); ctx.arc(R + 6, top - 5, 2.8, 0, Math.PI * 2); ctx.fill(); ink(1.3);
    }
    ctx.restore();
  }

  // ---------- Estela que deja el personaje al volar (12/11/2026) ----------
  // Las formas se apagan poco a poco; nada parpadea.
  const TRAIL_LIFE = 0.7;
  let trail = [], trailAcc = 0;
  function drawTrail() {
    const id = wear.estela && owned[wear.estela] ? wear.estela.slice(2) : null;
    if (!id || state === STATE.START || trail.length < 2) return;
    ctx.save();
    if (id === "arcoiris") {
      ctx.lineCap = "round";
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i], age = clamp((worldT - b.t) / TRAIL_LIFE, 0, 1);
        ctx.globalAlpha = (1 - age) * 0.85;
        RAINBOW.forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(a.x, a.y - 6 + k * 2.4); ctx.lineTo(b.x, b.y - 6 + k * 2.4); ctx.stroke(); });
      }
    } else {
      for (let i = 0; i < trail.length - 1; i++) {
        const p = trail[i], age = clamp((worldT - p.t) / TRAIL_LIFE, 0, 1);
        ctx.globalAlpha = (1 - age) * 0.9;
        trailShape(id, p.x, p.y + Math.sin(p.t * 7) * 2.5, 1 - age * 0.45, p.t);
      }
    }
    ctx.restore();
  }
  function trailShape(id, x, y, s, seed) {
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (id === "burbujas") {
      ctx.fillStyle = "rgba(190,230,255,0.35)"; ctx.strokeStyle = "#7cc4f0"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 4 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.arc(x - 1.4 * s, y - 1.4 * s, 1 * s, 0, Math.PI * 2); ctx.fill();
    } else if (id === "hojas") {
      ctx.save(); ctx.translate(x, y); ctx.rotate(seed * 3); ctx.fillStyle = "#6cbf4a"; ctx.strokeStyle = "#2f6e22"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, 5 * s, 2.4 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    } else if (id === "corazones") {
      drawHeart(x, y, 3.6 * s, "#ff5c8a");
    } else if (id === "notas") {
      ctx.fillStyle = "#5a3fc0"; ctx.strokeStyle = "#5a3fc0"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(x, y + 3 * s, 2.6 * s, 2 * s, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 2.3 * s, y + 2.5 * s); ctx.lineTo(x + 2.3 * s, y - 6 * s); ctx.lineTo(x + 5.5 * s, y - 4 * s); ctx.stroke();
    } else if (id === "estrellas") {
      ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#b45309"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = (i % 2 ? 2.2 : 5) * s, a = -Math.PI / 2 + (i * Math.PI) / 5; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (id === "copos") {
      for (const [col, lw] of [["#7cc4f0", 2.6], ["#ffffff", 1.3]]) for (let i = 0; i < 3; i++) { ctx.strokeStyle = col; ctx.lineWidth = lw; const a = (i * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 4.5 * s, y - Math.sin(a) * 4.5 * s); ctx.lineTo(x + Math.cos(a) * 4.5 * s, y + Math.sin(a) * 4.5 * s); ctx.stroke(); }
    } else if (id === "fuego") {
      ctx.fillStyle = "rgba(255,120,30,0.75)"; ctx.beginPath(); ctx.arc(x, y, 5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,220,90,0.9)"; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.5, 2.6 * s, 0, Math.PI * 2); ctx.fill();
    } else if (id === "panets") {
      drawEmpanada(x, y, seed * 2, 0.32 * s, false);
    }
  }

  // regalo pequeño para el botón de la caja
  function drawGift(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.lineJoin = "round";
    ctx.fillStyle = "#e63946"; roundRect(-9, -4, 18, 13, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff5a67"; roundRect(-10.5, -8, 21, 5, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffd23f"; ctx.fillRect(-2, -8, 4, 17); ctx.strokeRect(-2, -8, 4, 17);
    for (const sd of NUMS_1) { ctx.beginPath(); ctx.ellipse(sd * 4, -10.5, 4, 2.4, sd * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  // dibujo pequeño de un premio de la caja (para la ruleta y «tus cosas»)
  function drawPrizeTo(cv, id) {
    const keep = ctx;
    ctx = cv.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const k = cv.width / 64;
    ctx.scale(k, k);
    try {
      const kind = id.slice(0, 2), t = id.slice(2);
      if (kind === "g_") {
        drawHuman(Object.assign({}, CHARACTERS[0], { hat: HAT(t, HAT_COLORS[t] || "#e63946") }), 29, 66, 0, 1, 1.05, "");
      } else if (t === "arcoiris") {
        RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.arc(32, 50, 28 - i * 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
      } else {
        const keepT = worldT;
        for (let i = 0; i < 4; i++) { ctx.globalAlpha = 1 - i * 0.2; trailShape(t, 48 - i * 12, 26 + i * 5, 1.6 - i * 0.18, i * 1.3); }
        ctx.globalAlpha = 1;
        worldT = keepT;
      }
    } finally { ctx = keep; }
  }
  // empanadilla pequeña como imagen (para las ventanas)
  let foodImgUrl = null;
  function foodImg() {
    if (foodImgUrl) return foodImgUrl;
    const cv = document.createElement("canvas"); cv.width = cv.height = 48;
    const keep = ctx; ctx = cv.getContext("2d");
    try { ctx.scale(2, 2); drawEmpanada(12, 12, 0, 0.62, false); } finally { ctx = keep; }
    foodImgUrl = cv.toDataURL();
    return foodImgUrl;
  }

  // ---------- Interfaz ----------
  function button(b, label, main, size) {
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
    text(label, b.x + b.w / 2, b.y + b.h / 2 + 2, size || (main ? (label.length > 9 ? 25 : 30) : 24), main ? "#fff" : "#3b4a63", main ? "#7c3a0a" : null, 6);
  }

  function roundIcon(b, draw) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.arc(b.x, b.y + 3, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.translate(b.x, b.y); draw(); ctx.restore();
  }

  // la cuenta: una persona, con un punto verde si has iniciado sesión
  function iconCuenta() {
    ctx.fillStyle = "#3b2414";
    ctx.beginPath(); ctx.arc(0, -5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-11, 12); ctx.quadraticCurveTo(-10, 2, 0, 2); ctx.quadraticCurveTo(10, 2, 11, 12); ctx.quadraticCurveTo(0, 15, -11, 12); ctx.fill();
    if (window.ElsPanetsCuenta && window.ElsPanetsCuenta.user()) {
      ctx.fillStyle = "#2fa64a"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(14, -14, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  // rueda dentada de Ajustes
  function iconGear() {
    ctx.fillStyle = "#3b4a63";
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate((i * Math.PI) / 4); roundRect(-3, -13, 6, 8, 1.5); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  }
  // botón de pausa: pequeño y medio transparente, arriba a la izquierda (no tapa el marcador)
  function drawPauseButton(b) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(59,36,20,0.7)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#3b4a63";
    roundRect(b.x - 6, b.y - 7, 4.5, 14, 1.5); ctx.fill();
    roundRect(b.x + 1.5, b.y - 7, 4.5, 14, 1.5); ctx.fill();
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

  // La letra del juego va dentro del juego (fonts/). El inicio espera a que esté lista
  // para no pintar el título con otra letra y cambiarlo después.
  let fontReady = !(document.fonts && document.fonts.load), fontAt = 0;
  if (!fontReady) {
    const ok = () => { if (!fontReady) { fontReady = true; fontAt = worldT; } };
    document.fonts.load("64px 'Lilita One'", "ELS PANETS").then(ok, ok);
    setTimeout(ok, 3000);
  }
  function title(y) {
    const bob = Math.sin(worldT * 2) * 3;
    ctx.save();
    ctx.globalAlpha = clamp((worldT - fontAt) / 0.3, 0, 1); // entra con un fundido suave
    ctx.translate(LW / 2, y + bob);
    ctx.rotate(-0.04);
    ctx.font = fontOf(64);
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

  let dailyShown = false;
  function drawStart() {
    if (viewIndex >= shownCount()) viewChar(0); // lo denegaron mientras lo mirabas
    const u = ui();
    const def = CHARACTERS[viewIndex], open = charUnlocked(viewIndex);
    const cst = def.custom ? customState() : null; // tu personaje: libre (sin hacer) o aprobado (hecho)
    if (!fontReady) return;
    title(LH * 0.12);
    // la historia del personaje que se mira
    const story = def.custom ? (cst === "aprobado" ? "Tu personaje, hecho por ti." : "Hazte tu propio personaje.") : def.story;
    // personaje que se mira, en grande y con su ropa (bloqueado: apagado y con candado).
    // Con un gorro alto baja un poco y la frase de arriba se pinta encima (16/11/2026).
    const look = open ? worn(def) : dressed(def), tall = look.hat && !OLD_HATS.includes(look.hat.type) ? 8 : 0;
    ctx.globalAlpha = open ? 1 : def.custom ? (cst === "libre" ? 0.25 : 0.6) : 0.35;
    if (def.premium) drawChar(look, player.x, player.y + 14, 0, player.flap, 1.32);
    else drawChar(look, player.x, player.y + tall, 0, player.flap, 1.6);
    ctx.globalAlpha = 1;
    text(story || "¡Vuela y cómete las empanadillas!", LW / 2, LH * 0.12 + 48, story ? 17 : 19, "#fff", "#3b2414", 5);
    if (cst === "libre") text("+", player.x, player.y - 4, 54, "#ffd23f", "#5a2a06", 8);
    else if (!open && !def.custom) drawLock(player.x, player.y - 6, 1.6);
    roundIcon(u.prev, chevLeft);
    roundIcon(u.next, chevRight);
    const ny = u.charY + 58;
    let label = def.name, labelColor = "#fff";
    if (def.custom) {
      if (cst === "libre") { label = "CREA TU PERSONAJE"; labelColor = "#ffd23f"; }
    } else if (!open && def.premium) { label = "★ PREMIUM · " + def.price; labelColor = "#ffd23f"; }
    else if (!open) { label = "LLEGA A " + def.unlock + " PUNTOS"; labelColor = "#ffd23f"; }
    if (label) {
      ctx.fillStyle = "rgba(40,24,12,0.55)";
      roundRect(LW / 2 - 110, ny - 15, 220, 30, 15); ctx.fill();
      text(label, LW / 2, ny + 1, 17, labelColor);
    }

    const playOk = open || cst === "libre" || def.premium;
    const pulse = playOk && !calmOn ? 1 + Math.sin(worldT * 4) * 0.025 : 1;
    ctx.save();
    ctx.translate(LW / 2, u.play.y + u.play.h / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-LW / 2, -(u.play.y + u.play.h / 2));
    ctx.globalAlpha = playOk ? 1 : 0.5;
    const playTxt = open ? "JUGAR" : cst === "libre" ? "CREAR" : def.premium ? "CONSEGUIR" : "BLOQUEADO";
    button(u.play, playTxt, playOk);
    ctx.globalAlpha = 1;
    ctx.restore();

    // la historia, debajo de jugar (17/11/2026)
    button(u.hist, "HISTORIA  ★ " + totalStars() + "/" + WORLDS.length * LEVELS_PER_WORLD * 3, false, 18);
    // tres botones grandes: personajes, tienda y misiones (17/11/2026)
    menuButton(u.mPers, "PERSONAJES", () => drawCharIcon(selectedChar()), 0);
    menuButton(u.mShop, "TIENDA", () => drawGift(0, 0, 1.25), hucha >= BOX_COST && !boxComplete() ? "!" : 0, hucha);
    const pend = window.ElsPanetsProgreso ? window.ElsPanetsProgreso.pending() : 0;
    menuButton(u.mMis, "MISIONES", () => { ctx.scale(1.15, 1.15); iconMissions(); }, pend ? String(pend) : 0);
    menuButton(u.mRetos, "RETOS", iconVersus, 0);
    // mejor puntuación
    const by = u.mPers.y + u.mPers.h + 36;
    ctx.fillStyle = "rgba(40,24,12,0.55)";
    roundRect(LW / 2 - 100, by - 18, 200, 36, 18); ctx.fill();
    ctx.save(); ctx.translate(LW / 2 - 76, by + 1); ctx.scale(0.8, 0.8); iconTrophy(); ctx.restore();
    text("MEJOR: " + best, LW / 2 + 8, by + 1, 20, "#fff");
    // el premio diario sale solo, una vez, al entrar
    if (!dailyShown && worldT > 1.2) {
      dailyShown = true;
      if (!dailyState().claimed && window.ElsPanetsUI && window.ElsPanetsUI.openDaily && !window.ElsPanetsUI.isOpen()) window.ElsPanetsUI.openDaily();
    }
    if (recordHolder && by + 36 < groundTop()) text("Récord de " + recordHolder, LW / 2, by + 32, 15, "#fff", "#3b2414", 4);
  }

  // botón grande del inicio: tarjeta clara con su dibujo, su nombre y, si hace falta, un aviso
  function menuButton(b, label, icon, badge, coins) {
    ctx.fillStyle = "rgba(0,0,0,0.22)"; roundRect(b.x, b.y + 5, b.w, b.h, 18); ctx.fill();
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, "#fffaf0"); g.addColorStop(1, "#f3e3c3");
    ctx.fillStyle = g; roundRect(b.x, b.y, b.w, b.h, 18); ctx.fill();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + 32); icon(); ctx.restore();
    text(label, b.x + b.w / 2, b.y + b.h - 13, b.w < 100 ? 12.5 : 15, "#3b2414");
    if (coins != null) {
      ctx.fillStyle = "rgba(40,24,12,0.7)"; roundRect(b.x + b.w - 50, b.y + 6, 44, 18, 9); ctx.fill();
      text(String(coins), b.x + b.w - 28, b.y + 16, 12, "#ffe7a3");
    }
    if (badge) {
      ctx.fillStyle = "#d63a32"; ctx.beginPath(); ctx.arc(b.x + b.w - 6, b.y + 4, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      text(badge, b.x + b.w - 6, b.y + 5, 13, "#fff");
    }
  }
  // icono de retos: dos espadas cruzadas con «VS»
  function iconVersus() {
    ctx.save();
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.rotate(sd * 0.75);
      ctx.fillStyle = "#d9dde3"; ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-3, -20); ctx.lineTo(0, -25); ctx.lineTo(3, -20); ctx.lineTo(3, 6); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#b45309"; ctx.fillRect(-8, 6, 16, 4); ctx.strokeRect(-8, 6, 16, 4); ctx.fillRect(-2, 10, 4, 9);
      ctx.restore();
    }
    ctx.restore();
    text("VS", 0, 3, 17, "#ffd23f", "#5a2a06", 5);
  }
  // el personaje elegido en pequeño, para el botón de personajes
  function drawCharIcon(def) {
    const look = dressed(def);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#cfe9f6"; ctx.fillRect(-26, -26, 52, 52);
    if (def.kind === "dog") drawDog(-8, 8, 0, 1, 1, "", look);
    else if (look.kind === "critter") drawCritter(look, -7, 6, 0, 1, 1, "");
    else drawChar(look, -3, 22, 0, 1, 1.1, "");
    ctx.restore();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
  }

  function chevron(dir) {
    ctx.strokeStyle = "#3b4a63"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(-3 * dir, -8); ctx.lineTo(5 * dir, 0); ctx.lineTo(-3 * dir, 8); ctx.stroke();
  }
  const chevLeft = () => chevron(-1), chevRight = () => chevron(1);

  // ---------- Tutorial de 3 pasos, la primera vez (16/11/2026) ----------
  const TUT = [
    ["TOCA PARA VOLAR", "Cada toque es un aleteo.", "Si no tocas, caes."],
    ["COME EMPANADILLAS", "Cada una vale 3 puntos", "y va a tu hucha."],
    ["ESQUIVA LOS TRONCOS", "Pasa por el hueco.", "Si chocas, se acaba la partida."],
  ];
  const TUT_COL = { x: 0, gapY: 0, gap: 150, bob: 0, seed: 3 };
  const TUT_BTN = { x: 0, y: 0, w: 200, h: 46 };
  function drawTutorial() {
    const cx = LW / 2, w = 330, h = 356, x = cx - w / 2, y = Math.max(92, LH * 0.47 - h / 2);
    const T = TUT[tutStep], t = worldT, who = worn(selectedChar());
    ctx.fillStyle = "rgba(10,14,30,0.45)";
    ctx.fillRect(0, 0, LW, LH);
    card(x, y, w, h);
    text("CÓMO SE JUEGA · " + (tutStep + 1) + " DE 3", cx, y + 22, 15, "#8a5a2b");
    // el dibujo de cada paso, en un recuadro de cielo
    const ix = x + 20, iy = y + 40, iw = w - 40, ih = 156;
    ctx.save();
    roundRect(ix, iy, iw, ih, 16); ctx.clip();
    const sky = ctx.createLinearGradient(0, iy, 0, iy + ih);
    sky.addColorStop(0, "#7cc4ec"); sky.addColorStop(1, "#d9f0f5");
    ctx.fillStyle = sky; ctx.fillRect(ix, iy, iw, ih);
    if (tutStep === 0) {
      // sube con cada toque y baja despacio
      const ph = (t % 1.5) / 1.5, up = Math.sin(Math.min(1, ph * 1.5) * Math.PI) * 24;
      drawChar(who, ix + iw * 0.34, iy + ih * 0.66 - up, 0, t * 9, 1.15, "");
      const fx = ix + iw * 0.72, fy = iy + ih * 0.4, ring = Math.min(1, ph * 2.5);
      ctx.strokeStyle = `rgba(255,255,255,${0.85 * (1 - ring)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(fx, fy, 10 + ring * 20, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5;
      roundRect(fx - 6, fy - 4, 12, 30, 6); ctx.fill(); ctx.stroke();
      roundRect(fx - 13, fy + 14, 26, 24, 10); ctx.fill(); ctx.stroke();
    } else if (tutStep === 1) {
      drawChar(who, ix + iw * 0.22, iy + ih * 0.66 + Math.sin(t * 2) * 4, 0, t * 9, 1.1, "");
      for (let i = 0; i < 3; i++) drawFood(counterFood(), ix + iw * (0.5 + i * 0.17), iy + ih * 0.52 + Math.sin(t * 2 + i) * 3, 0, 0.85, true);
      text("+3", ix + iw * 0.5, iy + ih * 0.24, 24, "#fff", "#5a2a06", 5);
    } else {
      // un tronco y una columna en pequeño, y el camino por el hueco
      const k = 0.42, gt = groundTop();
      ctx.save();
      ctx.translate(ix + iw * 0.62, iy + ih); ctx.scale(k, k); ctx.translate(0, -gt);
      TUT_COL.gapY = gt - (ih / k) / 2 - TUT_COL.gap / 2;
      drawColumn(TUT_COL, 0);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.setLineDash([2, 9]);
      ctx.beginPath(); ctx.moveTo(ix + iw * 0.36, iy + ih * 0.5); ctx.lineTo(ix + iw * 0.95, iy + ih * 0.5); ctx.stroke();
      ctx.setLineDash([]); ctx.lineCap = "butt";
      drawChar(who, ix + iw * 0.22, iy + ih * 0.58 + Math.sin(t * 2) * 4, 0, t * 9, 1.0, "");
    }
    ctx.restore();
    ctx.strokeStyle = "#3b2414"; ctx.lineWidth = 2.5;
    roundRect(ix, iy, iw, ih, 16); ctx.stroke();
    text(T[0], cx, y + 222, 25, "#f08a24", "#5a2a06", 5);
    text(T[1], cx, y + 252, 17, "#3b2414");
    text(T[2], cx, y + 274, 17, "#3b2414");
    TUT_BTN.x = cx - 100; TUT_BTN.y = y + h - 62;
    button(TUT_BTN, tutStep < 2 ? "SIGUIENTE" : "¡A JUGAR!", true, 22);
  }

  function drawReady() {
    if (tutStep >= 0) { drawTutorial(); return; }
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
    drawFood(counterFood(), LW / 2 + 70, LH * 0.62, worldT * 3, 1, true);
    text("= +3", LW / 2 + 70, LH * 0.62 + 36, 18, "#fff", "#3b2414", 5);
    const sp = selectedChar().special;
    if (sp) {
      drawFood(sp, LW / 2 - 70, LH * 0.62, worldT * 3, 0.9, true);
      text("= +5", LW / 2 - 70, LH * 0.62 + 36, 18, "#fff", "#3b2414", 5);
      text("cada " + specialEvery(selectedChar()), LW / 2 - 70, LH * 0.62 + 56, 14, "#ffe7a3", "#3b2414", 4);
    }
  }

  function drawScoreHud() {
    const s = 1 + scorePop * 0.25;
    ctx.save();
    ctx.translate(LW / 2, 74);
    ctx.scale(s, s);
    text(String(score), 0, 0, 60, "#fff", "#2a1c14", 9);
    ctx.restore();
    // contador de empanadillas y reloj del día en el mismo cartel
    ctx.fillStyle = "rgba(40,24,12,0.5)";
    roundRect(LW / 2 - 74, 112, 148, 30, 15); ctx.fill();
    drawFood(counterFood(), LW / 2 - 52, 124, 0, 0.62);
    text("x " + eaten, LW / 2 - 18, 128, 19, "#fff");
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(LW / 2 + 9, 118, 1.5, 18);
    text(clockText(hourFor(eaten)), LW / 2 + 42, 128, 19, "#ffe7a3");
    // racha de empanadillas seguidas, a la derecha del cartel
    if (combo >= 5) text("RACHA " + combo, LW / 2 + 116, 128, 16, "#ffe066", "#3b2414", 4);
    // 21/11/2026: cuánto falta para el siguiente lugar (cada 40 puntos)
    if (!level && state !== STATE.READY) {
      const k = (score % PLACE_EVERY) / PLACE_EVERY;
      ctx.fillStyle = "rgba(40,24,12,0.4)"; roundRect(LW / 2 - 60, 146, 120, 5, 2.5); ctx.fill();
      ctx.fillStyle = "rgba(255,231,163,0.9)"; roundRect(LW / 2 - 60, 146, Math.max(5, 120 * k), 5, 2.5); ctx.fill();
    }
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

  // barra del nivel arriba: cuánto falta para la meta
  function drawLevelHud() {
    const L = level, x0 = LW / 2 - 90, y0 = 16, w = 180, f = clamp(L.passed / L.len, 0, 1);
    ctx.fillStyle = "rgba(40,24,12,0.55)"; roundRect(x0 - 6, y0 - 8, w + 12, 26, 13); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)"; roundRect(x0, y0, w, 10, 5); ctx.fill();
    ctx.fillStyle = "#ffd23f"; if (f > 0) { roundRect(x0, y0, Math.max(10, w * f), 10, 5); ctx.fill(); }
    text((L.w + 1) + "-" + (L.n + 1), x0 - 22, y0 + 6, 14, "#fff", "#3b2414", 3);
    text("META", x0 + w + 26, y0 + 6, 13, "#fff", "#3b2414", 3);
    if (L.boss && state === STATE.PLAY) drawGull(LW - 62, lerp(LH * 0.3, LH * 0.42, 0.5 + Math.sin(worldT * 0.9) * 0.5), worldT);
  }
  // la gaviota glotona con la bandeja (solo en el último nivel de cada mundo)
  function drawGull(x, y, t) {
    ctx.save(); ctx.translate(x, y);
    const fl = Math.sin(t * 9) * 0.5;
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.fillStyle = "#cfd6de";
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.quadraticCurveTo(-14, -18 - fl * 14, -26, -12 - fl * 16); ctx.quadraticCurveTo(-16, -6, -4, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(10, -7, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f5a623"; ctx.beginPath(); ctx.moveTo(15, -8); ctx.lineTo(24, -5); ctx.lineTo(15, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(12, -9, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#cfd6de";
    ctx.beginPath(); ctx.moveTo(-2, -4); ctx.quadraticCurveTo(4, -20 + fl * 12, -8, -24 + fl * 14); ctx.quadraticCurveTo(-6, -10, -2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    // la bandeja con comida colgando del pico
    ctx.strokeStyle = "#8a6038"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(16, 12); ctx.stroke();
    ctx.fillStyle = "#c9ced6"; ctx.strokeStyle = OL; ctx.lineWidth = 1.5; roundRect(4, 12, 26, 5, 2); ctx.fill(); ctx.stroke();
    drawEmpanada(12, 9, 0, 0.3, false); drawEmpanada(22, 9, 0, 0.3, false);
    ctx.restore();
  }
  // fin de un nivel de la historia: estrellas, objetivos y premio
  function drawLevelOver() {
    const u = ui(), t = stateT, R = levelResult, L = R.L;
    const slide = (1 - easeOut(t / 0.45)) * (LH * 0.6);
    ctx.save(); ctx.translate(0, slide);
    text(R.win ? (L.boss ? "¡BANDEJA RECUPERADA!" : "¡NIVEL SUPERADO!") : "¡CASI LO TIENES!", LW / 2, u.overCard.y - 42, R.win && L.boss ? 28 : 34, "#ffd23f", "#5a2a06", 9);
    const c = u.overCard;
    card(c.x, c.y, c.w, c.h);
    text(WORLDS[L.w].name.toUpperCase() + " · NIVEL " + (L.n + 1), LW / 2, c.y + 26, 16, "#8a5a2b");
    for (let i = 0; i < 3; i++) {
      const on = i < R.stars, a = clamp((t - 0.4 - i * 0.25) / 0.25, 0, 1);
      ctx.save(); ctx.translate(LW / 2 + (i - 1) * 62, c.y + 70 - (i === 1 ? 8 : 0)); ctx.scale(0.6 + 0.4 * easeOut(on ? a : 1), 0.6 + 0.4 * easeOut(on ? a : 1));
      drawStar(0, 0, 24, on && a > 0 ? "#ffd23f" : "#d9cdb4");
      ctx.restore();
    }
    const ok = [R.win, R.win && R.foodOk, R.win && R.specOk];
    R.goals.forEach((g, i) => {
      const y = c.y + 124 + i * 28;
      text(ok[i] ? "✓" : "✗", c.x + 26, y, 18, ok[i] ? "#2fa64a" : "#c0392b");
      text(g, c.x + 44, y, 15, "#3b2414", null, 0, "left");
    });
    if (R.reward) text("+" + R.reward + " panets en tu hucha", LW / 2, c.y + c.h - 16, 16, "#b45309");
    const nx = R.win ? nextLevelOf(L) : null;
    const ready = worldT >= pressLockUntil;
    ctx.globalAlpha = ready ? 1 : 0.6;
    button(u.again, nx ? "SIGUIENTE" : "REPETIR", true);
    button(u.home, "MAPA", false);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function drawStar(x, y, r, color) {
    ctx.fillStyle = color; ctx.strokeStyle = "#7a5600"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  function drawOver() {
    if (levelResult) { drawLevelOver(); return; }
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
    drawFood(counterFood(), c.x + 52, c.y + 202, 0, 0.75);
    text((counterFood() === "jamon" ? "Comida: " : "Empanadillas: ") + eaten + "   ·   hucha " + hucha, c.x + 74, c.y + 206, 18, "#3b2414", null, 0, "left");

    const ready = worldT >= pressLockUntil;
    ctx.globalAlpha = ready ? 1 : 0.6;
    button(u.again, "OTRA VEZ", true);
    button(u.home, "INICIO", false);
    if (runMode !== "turnos" && runMode !== "directo") button(u.share, "RETAR A UN AMIGO", false, 18);
    ctx.globalAlpha = 1;
    // «¡casi!» y el ranking de los amigos
    let my = u.again.y + (runMode !== "turnos" ? 146 : 90);
    ctx.globalAlpha = clamp((t - 1) / 0.4, 0, 1);
    for (const m of overMsgs) {
      ctx.font = "16px " + FONT;
      const w = Math.min(LW - 16, ctx.measureText(m.txt).width + 30), hh = m.bar != null ? 42 : 28;
      ctx.fillStyle = "rgba(40,24,12,0.6)";
      roundRect(LW / 2 - w / 2, my - 14, w, hh, 14); ctx.fill();
      text(m.txt, LW / 2, my + 1, 16, m.color || "#fff");
      // 21/11/2026: cuánto falta, en una barra (tu récord hacia la meta)
      if (m.bar != null) {
        const bw = Math.min(w - 40, 240), bx = LW / 2 - bw / 2;
        ctx.fillStyle = "rgba(255,255,255,0.25)"; roundRect(bx, my + 13, bw, 7, 3.5); ctx.fill();
        ctx.fillStyle = "#ffd23f"; roundRect(bx, my + 13, Math.max(7, bw * m.bar), 7, 3.5); ctx.fill();
      }
      my += hh + 6;
    }
    ctx.globalAlpha = 1;
    if (recordHolder) text("Récord de " + recordHolder, LW / 2, my + 2, 15, "#fff", "#3b2414", 4);
    ctx.restore();
  }

  function drawPause() {
    const u = ui();
    ctx.fillStyle = "rgba(10,14,30,0.55)";
    ctx.fillRect(0, 0, LW, LH);
    text("PAUSA", LW / 2, LH * 0.4 - 10, 56, "#fff", "#2a1c14", 10);
    button(u.resume, "SEGUIR", true);
    button(u.pauseHome, "INICIO", false, 20);
    roundIcon(u.gear, iconGear);
  }
  // 21/11/2026: sombra en el suelo, más pequeña y clara cuanto más alto vuela
  function drawPlayerShadow() {
    const gt = groundTop(), h = clamp((gt - player.y) / (gt * 0.8), 0, 1);
    ctx.fillStyle = "rgba(30,20,10," + (0.2 * (1 - h * 0.7)).toFixed(3) + ")";
    ctx.beginPath();
    ctx.ellipse(player.x, gt + 6, 20 * (1 - h * 0.45) * miniK, 4.5 * (1 - h * 0.3), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawSeguir() {
    const u = ui(), left = clamp(1 - stateT / SEGUIR_SECS, 0, 1);
    ctx.fillStyle = "rgba(10,14,30,0.5)";
    ctx.fillRect(0, 0, LW, LH);
    text("¿SEGUIR?", LW / 2, LH * 0.27, 54, "#ffd23f", "#5a2a06", 10);
    text("Una vez por partida", LW / 2, LH * 0.27 + 46, 19, "#fff", "#2a1c14", 5);
    ctx.globalAlpha = stateT > 0.6 ? 1 : 0.55;
    button(u.segYes, "", true);
    // «SEGUIR» a la izquierda y el precio a la derecha, sin pisarse
    const b = u.segYes;
    text("SEGUIR", b.x + b.w / 2 - 30, b.y + b.h / 2 + 2, 30, "#fff", "#7c3a0a", 6);
    drawFood(counterFood(), b.x + b.w - 62, b.y + b.h / 2, 0, 0.62);
    text(String(SEGUIR_COST), b.x + b.w - 30, b.y + b.h / 2 + 2, 22, "#3b2414");
    // tiempo que queda: una barra que se vacía despacio
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    roundRect(b.x + 10, b.y + b.h + 10, b.w - 20, 8, 4); ctx.fill();
    ctx.fillStyle = "#ffd23f";
    roundRect(b.x + 10, b.y + b.h + 10, Math.max(8, (b.w - 20) * left), 8, 4); ctx.fill();
    button(u.segNo, "NO, GRACIAS", false, 18);
    ctx.globalAlpha = 1;
    text("Te quedan " + (eaten - START_EATEN) + " de esta partida", LW / 2, u.segNo.y + u.segNo.h + 30, 16, "#fff", "#2a1c14", 4);
  }
  // cuenta «3, 2, 1» al volver de la pausa: cada número entra y se va con un fundido
  function drawCount() {
    const i = Math.min(2, Math.floor(stateT / COUNT_STEP)), f = (stateT - i * COUNT_STEP) / COUNT_STEP;
    ctx.fillStyle = "rgba(10,14,30,0.3)";
    ctx.fillRect(0, 0, LW, LH);
    ctx.save();
    ctx.globalAlpha = Math.min(clamp(f / 0.2, 0, 1), clamp((1 - f) / 0.3, 0, 1));
    ctx.translate(LW / 2, LH * 0.4);
    const s = 1.08 - 0.08 * easeOut(f);
    ctx.scale(s, s);
    text(String(3 - i), 0, 0, 96, "#fff", "#2a1c14", 12);
    ctx.restore();
    text("Prepárate…", LW / 2, LH * 0.4 + 74, 22, "#fff", "#2a1c14", 5);
  }

  // ---------- Bucle de dibujo ----------
  function render() {
    const inRun = state === STATE.PLAY || state === STATE.DYING || state === STATE.OVER || state === STATE.NAME || state === STATE.PAUSE || state === STATE.COUNT || state === STATE.SEGUIR;
    const pal = palette(inRun ? skyHour : START_SKY);
    prepareWipe(pal);
    drawSky(pal);
    if (!lowQ) drawClouds(pal);
    drawScenery(pal);
    for (let i = 0; i < cols.length; i++) drawColumn(cols[i], pal.night);
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (!c.food || c.eaten) continue;
      const fp = foodPos(c);
      if (isPower(c.kind)) drawPower(c.kind.slice(2), fp.x, fp.y, 1, true);
      else drawFood(c.kind, fp.x, fp.y, c.bob, 1, true, c.girl);
    }
    for (let i = 0; i < bites.length; i++) {
      const b = bites[i], bp = bitePos(b);
      drawFood(b.kind, bp.x, bp.y + Math.sin(worldT * 3 + b.ph) * 3, 0, 0.62, true);
    }
    drawGround(pal);
    if (state !== STATE.START) drawPlayerShadow();

    for (const pt of particles) {
      ctx.globalAlpha = clamp(pt.life / 0.5, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawTrail();
    drawGhost();
    if (state !== STATE.START) {
      const dead = state === STATE.DYING || state === STATE.OVER || state === STATE.NAME || state === STATE.SEGUIR;
      // con el mini se encoge alrededor del centro del cuerpo
      const k = miniK, cy = player.y - 5;
      if (girlfriend && selectedChar().id === "maykel") {
        drawHuman(girlfriend, player.x - 33 * k, cy + (7 + Math.sin(worldT * 2.2) * 1.5) * k, player.rot, player.flap + 0.6, PLAYER_SCALE * 0.92 * k, dead ? "dead" : "");
      }
      drawChar(worn(selectedChar()), player.x, cy + 5 * k, player.rot, player.flap, PLAYER_SCALE * k, dead ? "dead" : "");
      if (!dead && (shield || shieldSafe > 0)) drawShieldBubble(player.x + 1, cy, 30 * k, shield ? 1 : shieldSafe / 1.3);
    }
    if (photoPending) takePhoto();
    for (const f of floaters) {
      ctx.globalAlpha = 1 - f.t / 0.9;
      text(f.txt, f.x, f.y - f.t * 40, f.size || 26, f.color || "#ffd23f", "#5a2a06", 6);
    }
    ctx.globalAlpha = 1;

    if (state === STATE.START) drawStart();
    else if (state === STATE.READY) { if (runMode === "directo") drawLiveReady(); else drawReady(); }
    else if (state === STATE.PLAY || state === STATE.DYING) { drawScoreHud(); drawPowerHud(); drawPlaceBanner(); if (level) drawLevelHud(); if (rival && rival.live) drawLiveHud(); }
    else if (state === STATE.OVER) drawOver();
    else if (state === STATE.PAUSE) { drawScoreHud(); drawPause(); }
    else if (state === STATE.COUNT) { drawScoreHud(); drawPowerHud(); drawCount(); }
    else if (state === STATE.SEGUIR) { drawScoreHud(); drawSeguir(); }

    drawPhoto();
    // «Reducir destellos» (de serie): un velo claro y suave en lugar del destello blanco
    if (flashT > 0) {
      ctx.fillStyle = softFlash ? `rgba(255,255,255,${(flashT * flashT * 0.14).toFixed(3)})` : `rgba(255,255,255,${flashT * 0.45})`;
      ctx.fillRect(0, 0, LW, LH);
    }
    if (camFlash > 0) {
      const a = Math.min(1, camFlash);
      ctx.fillStyle = softFlash ? `rgba(255,255,255,${(a * a * 0.2).toFixed(3)})` : `rgba(255,255,255,${a})`;
      ctx.fillRect(0, 0, LW, LH);
    }
    const u = ui();
    if (state === STATE.PLAY && runMode !== "directo") drawPauseButton(u.pause);
    if (state === STATE.START && fontReady) { roundIcon(u.gear, iconGear); roundIcon(u.cuenta, iconCuenta); }
    if ((state === STATE.START && fontReady) || state === STATE.OVER) {
      roundIcon(u.rank, iconTrophy);
      // misiones y logros, con un aviso rojo si hay algo que cobrar
      const pend = state === STATE.OVER && window.ElsPanetsProgreso ? window.ElsPanetsProgreso.pending() : 0;
      if (state === STATE.OVER) roundIcon(u.misiones, iconMissions);
      if (pend) {
        ctx.fillStyle = "#d63a32"; ctx.beginPath(); ctx.arc(u.misiones.x + 16, u.misiones.y - 15, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        text(String(pend), u.misiones.x + 16, u.misiones.y - 14, 13, "#fff");
      }
    }
  }
  // icono de misiones: hoja con dos casillas marcadas
  function iconMissions() {
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = OL; ctx.lineWidth = 2;
    roundRect(-9, -11, 18, 22, 3); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2; ctx.lineCap = "round";
    for (const y of [-5, 1, 7]) {
      ctx.strokeStyle = "#cdbb9c"; ctx.beginPath(); ctx.moveTo(-1, y); ctx.lineTo(6, y); ctx.stroke();
    }
    ctx.strokeStyle = "#2fa64a"; ctx.lineWidth = 2.2;
    for (const y of [-5, 1]) { ctx.beginPath(); ctx.moveTo(-7, y); ctx.lineTo(-5.2, y + 1.8); ctx.lineTo(-2.6, y - 2); ctx.stroke(); }
    ctx.strokeStyle = "#cdbb9c"; ctx.lineWidth = 1.5; ctx.strokeRect(-7, 5, 4, 4);
  }

  // ---------- Dibujo de los poderes ----------
  // empanadilla dorada: la normal teñida de oro (se pinta una vez y se guarda) y un halo quieto
  let goldCv = null;
  function drawGolden(x, y, rot, size) {
    if (!goldCv) {
      goldCv = document.createElement("canvas"); goldCv.width = goldCv.height = 96;
      const keep = ctx; ctx = goldCv.getContext("2d");
      try {
        ctx.scale(2, 2); drawEmpanada(24, 24, 0, 1, false);
        ctx.globalCompositeOperation = "source-atop";
        const g = ctx.createLinearGradient(0, 4, 0, 44);
        g.addColorStop(0, "rgba(255,240,150,0.75)"); g.addColorStop(0.5, "rgba(245,196,0,0.6)"); g.addColorStop(1, "rgba(184,120,0,0.65)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 48, 48);
      } finally { ctx = keep; }
    }
    ctx.save();
    ctx.translate(x, y);
    const h = ctx.createRadialGradient(0, 0, 6, 0, 0, 30 * size);
    h.addColorStop(0, "rgba(255,225,90,0.55)"); h.addColorStop(1, "rgba(255,225,90,0)");
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, 30 * size, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(rot || 0);
    ctx.drawImage(goldCv, -26 * size, -26 * size, 52 * size, 52 * size);
    ctx.restore();
  }

  function drawPower(k, x, y, s, glow) {
    const P = POWERS[k];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (glow) {
      const h = ctx.createRadialGradient(0, 0, 8, 0, 0, 30);
      h.addColorStop(0, `rgba(${P.halo},0.6)`); h.addColorStop(1, `rgba(${P.halo},0)`);
      ctx.fillStyle = h;
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
    }
    const base = { iman: "#fff3e6", escudo: "#e3f6ff", doble: "#ffd23f", mini: "#d6f5da", paraguas: "#efe3ff", lenta: "#e3f0ff", corazon: "#ffe3ea", lluvia: "#fff1d6" }[k];
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 17);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, base); g.addColorStop(1, darken(base, 0.18));
    ctx.fillStyle = g; ctx.strokeStyle = OL; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineCap = "butt";
    if (k === "iman") {
      // imán en U rojo con las puntas plateadas
      ctx.strokeStyle = OL; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-6, 0); ctx.arc(0, 0, 6, Math.PI, 0, true); ctx.lineTo(6, -9); ctx.stroke();
      ctx.strokeStyle = "#e63946"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-6, 0); ctx.arc(0, 0, 6, Math.PI, 0, true); ctx.lineTo(6, -4); ctx.stroke();
      ctx.strokeStyle = "#e3e7ec";
      ctx.beginPath(); ctx.moveTo(-6, -8.5); ctx.lineTo(-6, -4); ctx.moveTo(6, -8.5); ctx.lineTo(6, -4); ctx.stroke();
    } else if (k === "escudo") {
      ctx.fillStyle = "#2a8bb5"; ctx.strokeStyle = OL; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(8.5, -7); ctx.quadraticCurveTo(9, 5, 0, 11); ctx.quadraticCurveTo(-9, 5, -8.5, -7);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5.5, -5); ctx.quadraticCurveTo(5.5, 3, 0, 7); ctx.closePath(); ctx.fill();
    } else if (k === "doble") {
      text("x2", 0, 1, 15, "#fff", "#8a5a06", 4);
    } else if (k === "paraguas") {
      ctx.fillStyle = "#9b5de5"; ctx.strokeStyle = OL; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-10, -11, 0, -11); ctx.quadraticCurveTo(10, -11, 10, 0);
      ctx.quadraticCurveTo(7, -3, 3.3, 0); ctx.quadraticCurveTo(0, -3, -3.3, 0); ctx.quadraticCurveTo(-7, -3, -10, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineCap = "round"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 8); ctx.quadraticCurveTo(0, 11, -3, 10); ctx.stroke();
    } else if (k === "lenta") {
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#2a6fb5"; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 1, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, -5); ctx.moveTo(0, 1); ctx.lineTo(4, 3); ctx.stroke();
      ctx.fillStyle = "#2a6fb5"; ctx.fillRect(-2.5, -11, 5, 3);
    } else if (k === "corazon") {
      drawHeart(0, 1, 7.5, "#ff4d6d");
    } else if (k === "lluvia") {
      for (const [ex, ey] of [[-6, -4], [6, -4], [0, 5]]) drawEmpanada(ex, ey, 0, 0.3, false);
    } else {
      // mini: cuatro flechas hacia el centro
      ctx.fillStyle = "#2fa64a"; ctx.strokeStyle = OL; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(Math.PI / 4 + i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(4, -9); ctx.lineTo(-4, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "#2fa64a";
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // burbuja del escudo: quieta y suave (sin parpadeo); al romperse se desvanece
  function drawShieldBubble(x, y, r, a) {
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.35 * a})`);
    g.addColorStop(0.7, `rgba(130,210,255,${0.12 * a})`);
    g.addColorStop(1, `rgba(90,190,250,${0.4 * a})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(200,240,255,${0.85 * a})`; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // poderes activos debajo del contador, con un anillo que se vacía
  const HUD_POWERS = ["escudo", "corazon", "iman", "doble", "mini", "paraguas", "lenta", "lluvia"];
  const hudOn = (k) => (k === "escudo" ? shield : k === "corazon" ? lives > 0 : powerOn(k));
  function drawPowerHud() {
    let n = 0, i = 0;
    for (const k of HUD_POWERS) if (hudOn(k)) n++;
    if (!n) return;
    for (const k of HUD_POWERS) {
      if (!hudOn(k)) continue;
      const f = k === "escudo" || k === "corazon" ? 1 : powerT[k] / powerTime(k);
      const x = LW / 2 + (i++ - (n - 1) / 2) * 40, y = 164;
      ctx.fillStyle = "rgba(40,24,12,0.45)";
      ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(x, y, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.stroke();
      drawPower(k, x, y, 0.8, false);
      if (k === "corazon" && lives > 1) text("x" + lives, x + 15, y + 14, 13, "#fff", "#3b2414", 3);
    }
  }

  // cartel del lugar nuevo: aparece y se va despacio
  function drawPlaceBanner() {
    if (placeBanner <= 0) return;
    const t = 3.2 - placeBanner;
    const a = Math.min(clamp(t / 0.4, 0, 1), clamp(placeBanner / 0.6, 0, 1));
    ctx.save();
    ctx.globalAlpha = a;
    const y = LH * 0.34 + (1 - easeOut(t / 0.4)) * 14;
    const P = placeDef(placeTo), sea = worldOn() && P.sea && placeFrom !== placeTo ? P.sea : "";
    ctx.font = "28px " + FONT;
    const fs = Math.min(28, (28 * 270) / Math.max(1, ctx.measureText(P.name).width));
    ctx.fillStyle = "rgba(40,24,12,0.55)";
    roundRect(LW / 2 - 150, y - 34, 300, P.city ? 84 : 66, 20); ctx.fill();
    text(sea ? "Cruzando " + sea + ", rumbo a" : "Bienvenidos a", LW / 2, y - 15, 15, "#ffe7a3");
    text(P.name, LW / 2, y + 12, fs, "#fff", "#3b2414", 6);
    if (P.city) text(P.city, LW / 2, y + 37, 15, "#fff");
    ctx.restore();
  }

  // Copia un cuadrado de la pantalla alrededor del personaje (lo que tiene delante)
  function takePhoto() {
    photoPending = false;
    const k = canvas.width / LW, side = 260;
    const sx = clamp(player.x - 70, 0, LW - side), sy = clamp(player.y - side / 2, 0, LH - side);
    const pc = photoCv.getContext("2d");
    pc.drawImage(canvas, sx * k, sy * k, side * k, side * k, 0, 0, photoCv.width, photoCv.height);
    photoStamp = clockText(skyHour);
    photoT = 0;
    try { emit("foto", { img: photoCv.toDataURL("image/jpeg", 0.78), hora: photoStamp, lugar: placeDef(placeTo).name }); } catch (e) {}
    camFlash = 1.15; // un poco más de 1: el blanco total dura un instante
  }

  // La foto: sale grande en el centro, se queda un momento y vuela a la esquina
  function drawPhoto() {
    if (photoT < 0) return;
    const t = photoT;
    const fly = smooth(clamp((t - 0.55) / 0.45, 0, 1));
    const pop = t < 0.14 ? lerp(0.82, 0.62, easeOut(t / 0.14)) : 0.62;
    const s = lerp(pop, 0.16, fly);
    const x = lerp(LW / 2, LW - 44, fly), y = lerp(LH * 0.4, 172, fly);
    const rot = lerp(-0.06, 0.18, fly);
    const W = LW * s, pad = W * 0.06, foot = W * 0.2, H = W + foot;
    ctx.save();
    ctx.globalAlpha = 1 - clamp((t - 1.15) / 0.35, 0, 1);
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    roundRect(-W / 2 + 4, -H / 2 + 6, W, H, 4); ctx.fill();
    ctx.fillStyle = "#fffdf7";
    roundRect(-W / 2, -H / 2, W, H, 4); ctx.fill();
    ctx.strokeStyle = "#d9cdb4"; ctx.lineWidth = 1; ctx.stroke();
    const iw = W - pad * 2;
    ctx.drawImage(photoCv, -iw / 2, -H / 2 + pad, iw, iw);
    // al principio la foto se «revela»: sale de un blanco que se aclara
    const dev = 1 - clamp(t / 0.5, 0, 1);
    if (dev > 0) { ctx.fillStyle = `rgba(255,253,247,${dev * 0.85})`; ctx.fillRect(-iw / 2, -H / 2 + pad, iw, iw); }
    if (W > 90) text("MJ · " + photoStamp, 0, H / 2 - foot / 2 - pad * 0.2, W * 0.075, "#7a5a3a");
    ctx.restore();
  }

  // Para revisar los personajes en grande: ?hoja
  const SHEET = QS.has("hoja");
  function drawSheet() {
    ctx.fillStyle = "#9fd6ea"; ctx.fillRect(0, 0, LW, LH);
    // ?hoja=banderas: las cinco banderas de las columnas, en grande
    if (QS.get("hoja") === "banderas") {
      ["ve", "ec", "cat", "do", "hn"].forEach((f, i) => {
        ctx.save(); ctx.translate(40, 40 + i * 90); ctx.scale(4.5, 4.5);
        drawFlagBand(0, 0, COL_W - 2, FLAG_H, f); ctx.restore();
      });
      return;
    }
    // ?hoja=ropa: los 4 conjuntos de cada uno y, abajo, los objetos y comidas
    if (QS.get("hoja") === "ropa") {
      CHARACTERS.forEach((c, r) => {
        for (let i = 0; i < 4; i++) drawChar(dressed(c, i), 60 + i * 92, 50 + r * 72, 0, 1, 1.25, "");
      });
      ["vino", "tequila", "camara", "jamon", "queso", "huevo", "salchicha", "pollo", "pizza", "hueso"].forEach((k, i) => {
        drawFood(k, 30 + (i % 5) * 80, LH - 110 + Math.floor(i / 5) * 60, 0, 1, false);
      });
      return;
    }
    // ?hoja=edades: Pamela con su hijo de 0, 1, 2 y 3 años (uno por conjunto)
    if (QS.get("hoja") === "edades") {
      const p = CHARACTERS.find((c) => c.id === "pamela");
      for (let i = 0; i < 4; i++) {
        const x = 55 + (i % 2) * 190, y = 190 + Math.floor(i / 2) * 300;
        drawChar(Object.assign({}, dressed(p, i), { babyAge: i }), x, y, 0, player.flap, 2.0, "");
        text(i === 0 ? "BEBÉ" : i + (i === 1 ? " AÑO" : " AÑOS"), x + 60, y + 80, 20, "#3b2414");
      }
      return;
    }
    // ?hoja=maykel,pamela: solo esos, en grande
    const only = (QS.get("hoja") || "").split(",").filter(Boolean);
    if (only.length) {
      only.map((id) => CHARACTERS.find((c) => c.id === id)).filter(Boolean).forEach((c, i) => {
        const y = 200 + i * 290;
        drawChar(c, c.baby ? 150 : 190, y, 0, player.flap, 3.6, "");
        text(c.name, LW / 2, y + 120, 22, "#3b2414");
      });
      return;
    }
    CHARACTERS.forEach((c, i) => {
      const x = 100 + (i % 2) * 200, y = 130 + Math.floor(i / 2) * 230;
      drawChar(c, x, y, 0, player.flap, 3.3, "");
      text(c.name, x, y + 108, 16, "#3b2414");
    });
  }

  // ---------- Medición de la dificultad (solo en el ordenador, con ?prueba) ----------
  // Juega partidas enteras con las reglas de verdad y un jugador automático, sin dibujar,
  // sin sonido y sin guardar nada. modo "seguro": pasa por el hueco sin arriesgar;
  // "goloso": va a por toda la comida y las filas. ruido: torpeza del jugador, en puntos
  // de pantalla (0 = perfecto). viejas: con las reglas de la versión anterior, para comparar.
  function simulate(runs, opts) {
    opts = opts || {};
    const max = opts.max || 600, greedy = opts.modo === "goloso", noise = opts.ruido || 0;
    const keep = { state, hucha, best, placeFrom, placeTo, placeT };
    const res = { partidas: runs, llegan: 0, puntos: [], segundos: [], comida: [0, 0], apartada: [0, 0], filas: [0, 0], sueltas: [0, 0], muertes: [] };
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.15;
    sim = true; oldRules = !!opts.viejas;
    try {
      for (let r = 0; r < runs; r++) {
        resetRun(); state = STATE.PLAY; simDead = false;
        spawnColumn(LW + 60); player.vy = FLAP_V;
        const seenC = new Set(), seenB = new Set();
        let t = 0, lastFlap = 0, slip = 0;
        while (!simDead && score < max && t < 900) {
          const hx = player.x + 1, hy = player.y - 5, hr = player.hitR * miniK;
          // la columna que toca pasar y la siguiente
          let a = null, b = null;
          for (let i = 0; i < cols.length; i++) {
            const c = cols[i]; seenC.add(c);
            if (c.x + COL_W + CAP_OUT > hx - hr) { if (!a) a = c; else if (!b) b = c; }
          }
          for (let i = 0; i < bites.length; i++) seenB.add(bites[i]);
          let ty = groundTop() * 0.5;
          if (a) {
            const top = a.gapY, bot = a.gapY + a.gap;
            ty = bot - 30;                                            // por la parte baja del hueco
            if (b && b.gapY < a.gapY - 40) ty = top + 82;             // la siguiente está más arriba: por la parte alta
            if (greedy) {
              if (a.food && !a.eaten) ty = clamp(a.gapY + a.gap / 2 + a.fdy + 26, top + 80, bot - 26);
              // una fila antes de la columna: se va a por ella
              let bite = null;
              for (let i = 0; i < bites.length; i++) { const q = bites[i]; if (!q.eaten && q.x > hx - 12 && q.x < a.x - CAP_OUT - 8 && (!bite || q.x < bite.x)) bite = q; }
              if (bite && bite.x - hx < 170) ty = bite.y + 22;
            }
            // nunca apuntar a chocar con el suelo
            ty = Math.min(ty, groundTop() - hr - 16);
          }
          let want = hy > ty + 4 + slip;
          // si la siguiente está más abajo, no aletea de más al salir: se deja caer (como haría una persona)
          if (a && b && b.gapY > a.gapY + 40 && a.x - CAP_OUT < hx + hr) {
            const te = Math.max(0, (a.x + COL_W + CAP_OUT + hr - hx) / speed), yExit = hy + player.vy * te + 0.5 * GRAVITY * te * te;
            if (yExit < a.gapY + a.gap - hr - 4) want = false;
            // y si va a hacer falta un aleteo, mejor pronto que justo al salir
            else if (te > 0.27 && te <= 0.36 && hy - 62 - hr > a.gapY + 2) want = true;
          }
          const fast = hy > ty + 40 ? -300 : -80;
          if (want && player.vy > fast && t - lastFlap > 0.09) {
            player.vy = FLAP_V; lastFlap = t;
            slip = noise ? gauss() * noise : 0;                       // el siguiente toque llega antes o después de lo ideal
          }
          stepPlay(STEP); t += STEP;
          particles.length = 0; floaters.length = 0;
        }
        if (!simDead) res.llegan++;
        else if (res.muertes.length < 10) { const c = cols.find((q) => q.x + COL_W + CAP_OUT > player.x - 14) || {}; res.muertes.push({ puntos: score, y: Math.round(player.y - 5), vy: Math.round(player.vy), dx: Math.round(c.x - player.x), arriba: Math.round(c.gapY), abajo: Math.round(c.gapY + c.gap), suelo: Math.round(groundTop()) }); }
        res.puntos.push(score); res.segundos.push(Math.round(t));
        const hxEnd = player.x;
        for (const c of seenC) {
          if (!c.food || isPower(c.kind) || SPECIALS[c.kind] || c.x + COL_W > hxEnd) continue;
          const k = c.fdy ? res.apartada : res.comida; k[1]++; if (c.eaten) k[0]++;
        }
        const rows = new Map();
        for (const q of seenB) { if (!q.eaten && q.x > hxEnd - 40) continue; res.sueltas[1]++; if (q.eaten) res.sueltas[0]++; rows.set(q.row, q.row.n); }
        for (const n of rows.values()) { res.filas[1]++; if (n === 3) res.filas[0]++; }
      }
    } finally {
      sim = false; oldRules = false; simDead = false;
      resetRun();
      state = keep.state; hucha = keep.hucha; best = keep.best; placeFrom = keep.placeFrom; placeTo = keep.placeTo; placeT = keep.placeT;
    }
    const sorted = res.puntos.slice().sort((x, y) => x - y), pct = (a) => (a[1] ? Math.round((a[0] * 100) / a[1]) : 0);
    return {
      partidas: runs, llegan: res.llegan, tope: max, muertes: res.muertes,
      media: Math.round(res.puntos.reduce((s, v) => s + v, 0) / runs), mediana: sorted[Math.floor(runs / 2)], peor: sorted[0],
      segundosMedia: Math.round(res.segundos.reduce((s, v) => s + v, 0) / runs),
      comidaCentro: pct(res.comida) + " %", comidaApartada: pct(res.apartada) + " % de " + res.apartada[1],
      filasEnteras: pct(res.filas) + " % de " + res.filas[1], empanadillasDeFila: pct(res.sueltas) + " %",
    };
  }

  // Para probar sin jugar (solo en el ordenador): ?prueba deja tocar la partida desde la consola
  if (LOCAL && QS.has("prueba")) {
    window.elsPanetsPrueba = {
      simular: simulate,
      // las cinco columnas de abajo, una por lugar, en una imagen
      columnas: () => {
        const cv = document.createElement("canvas"); cv.width = 5 * 90 * 2; cv.height = 300 * 2;
        const keep = ctx; ctx = cv.getContext("2d");
        try { ctx.scale(2, 2); ctx.fillStyle = "#9fd3ee"; ctx.fillRect(0, 0, 450, 300); for (let i = 0; i < 5; i++) drawBottomColumn(i, 12 + i * 90, 80, 300); }
        finally { ctx = keep; }
        return cv.toDataURL();
      },
      // salta a un lugar sin la transición (para mirarlo)
      verLugar: (i) => { placeFrom = placeTo = i; placeT = 1; if (worldOn()) MUNDO.reset(i); },
      // la próxima empanadilla que venga, dorada
      dorada: () => { const c = cols.find((c) => c.food && !c.eaten && !isPower(c.kind) && c.x > player.x); if (c) c.kind = "dorada"; return !!c; },
      // dibuja una comida o un poder aparte y devuelve la imagen (para mirarla)
      pintar: (kind, power) => {
        const cv = document.createElement("canvas"); cv.width = cv.height = 160;
        const keep = ctx; ctx = cv.getContext("2d");
        try { ctx.scale(2, 2); if (power) drawPower(kind, 40, 40, 1.6, true); else drawFood(kind, 40, 40, 0, 1.6, true); } finally { ctx = keep; }
        return cv.toDataURL();
      },
      curva: (s) => ({ velocidad: Math.round(speedAt(s)), hueco: Math.round(gapAt(s)), respiro: restAt(s) }),
      cuadro: (ms) => frame(ms / 1000),            // un cuadro entero, para medir tiempos
      interno: (code) => eval(code),               // acceso a lo de dentro, para las mediciones
      nombre: (n) => nameProblem(n),
      caja: () => ({ pity, odds: boxOdds(), completa: boxComplete(), seguroEn: boxSureIn() }),
      pendiente: () => ({ pendiente: store.get(PENDING_KEY, null), enviar: CAN_SEND, prueba: TEST_RUN }),
      especial: (k) => collectSpecial(k, player.x + 40, player.y),
      sumarComida: (n) => { eaten += n; },          // para probar «¿Seguir?»
      comer: () => { const c = cols.find((c) => c.food && !c.eaten && c.x > player.x); if (c) { player.y = LH * 0.4; player.vy = -200; c.x = player.x - COL_W / 2; c.gapY = player.y - 5 - c.gap / 2; } },
      estado: () => ({ state, score, eaten, pendingSpecial, photoT, kinds: cols.map((c) => c.kind) }),
      volar: () => { player.y = LH * 0.4; player.vy = -200; },
      sombra: () => ({ n: ghost && ghost.length, runT, rec: ghostRec.length, on: !!adminConfig().sombra }),
      poder: (k) => collectPower(k, player.x + 30, player.y),
      lugar: (i) => { placeFrom = placeTo; placeTo = i; placeT = 0; placeBanner = 3.2; if (worldOn()) MUNDO.cross(i, scroll); },
      poderes: () => ({ powerT, shield, shieldSafe, miniK, placeTo, placeT }),
      hucha: (n) => addHucha(n),
      diarioOtraVez: (ayer) => store.set(DAILY_KEY, ayer ? JSON.stringify({ last: dayStr(new Date(Date.now() - 864e5)), streak: ayer }) : "{}"),
      ranking: () => ({ rankCache, overMsgs }),
    };
  }

  let last = 0, acc = 0;
  let lastDraw = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    // ahorro de batería: se pinta una imagen de cada dos (unas 30 por segundo)
    if (saveOn && t - lastDraw < 30) return;
    lastDraw = t;
    frame(t / 1000);
  }
  function frame(now) {
    let dt = last ? Math.max(0, now - last) : 0;
    last = now;
    // mientras sale la foto, el juego va casi parado (como un instante congelado)
    const slow = photoT >= 0 && photoT < 0.55 ? 0.12 : 1;
    if (photoT >= 0) { photoT += Math.min(dt, 0.1); if (photoT > 1.5) photoT = -1; }
    camFlash = Math.max(0, camFlash - Math.min(dt, 0.1) * (softFlash ? 1.8 : 3.2));
    acc += Math.min(dt, 0.25) * slow;
    let n = 0;
    while (acc >= STEP && n < 40) { update(STEP); acc -= STEP; n++; }
    skyHour += (hourFor(eaten) - skyHour) * Math.min(1, dt * 1.2);
    if (n === 40) acc = 0;
    if (SHEET) drawSheet(); else render();
  }
  requestAnimationFrame(loop);

  // ---------- Lo que usan las ventanas de crear personaje y del admin (extras.js) ----------
  const CREATOR = {
    sexo: [["chico", "Chico"], ["chica", "Chica"]],
    piel: GIRL_SKINS.concat([["#6e4428", "#55321c"]]),
    peinadoChico: [["swept", "De lado"], ["buzz", "Rapado"], ["goldCurls", "Rizos cortos"], ["shortWavy", "Ondulado"], ["curlyTop", "Rizos arriba"], ["curly", "Rizos"], ["dreads", "Rastas"]],
    peinadoChica: [["longStraight", "Largo liso"], ["longWavy", "Largo ondulado"], ["ponytail", "Coleta"], ["bun", "Moño"], ["curly", "Rizos"]],
    pelo: GIRL_HAIRS.concat([["#9a9a9a", "#6f6f6f"]]),
    ojos: [["#2a1a10", "Oscuros"], ["#4a2c18", "Marrones"], ["#6b6a3e", "Miel"], ["#3f9a5a", "Verdes"], ["#2f6fa8", "Azules"]],
    barba: [["no", "Sin barba"], ["corta", "Barba corta"], ["larga", "Barba poblada"]],
    ropa: [["tee", "Camiseta"], ["tank", "Tirantes"], ["longsleeve", "Manga larga"], ["jacket", "Chaqueta"], ["polo", "Polo"], ["thriller", "Thriller"]],
    color: GIRL_COLORS,
    pantalon: ["#3a4a66", "#1d1e23", "#e9e3d6", "#8e9198", "#5b7fae", "#3a1c2e", "#b50f29"],
    extra: [["no", "Nada"], ["gafas", "Gafas"], ["cap", "Gorra"], ["beret", "Boina"], ["sunhat", "Pamela"], ["sombrero", "Sombrero mexicano"], ["collar", "Collar"]],
    // las cinco de siempre primero (para no cambiar los ya enviados) y después todo el mundo por orden
    bandera: Object.keys(FLAG_NAMES).map((f) => [f, FLAG_NAMES[f]]).concat(
      WORLD_CODES.concat(Object.keys(SUB_FLAGS)).filter((f) => !FLAG_NAMES[f]).map((f) => [f, flagName(f)]).sort((a, b) => a[1].localeCompare(b[1], "es"))),
  };
  // 12/11/2026: animales, más gorros y colores de pelo; algunos se desbloquean con tu récord.
  // (Lo nuevo va al final de cada lista para no cambiar los personajes ya enviados.)
  CREATOR.tipo = [["persona", "Persona"]].concat(SPECIES_KEYS.map((k) => [k, SPECIES[k].name]));
  CREATOR.pelajes = (t) => (t > 0 ? SPECIES[SPECIES_KEYS[Math.min(SPECIES_KEYS.length, t) - 1]].colors : []);
  CREATOR.pelo = CREATOR.pelo.concat([["#ff8fc8", "#d9609c"], ["#5aa9ff", "#2f6fd6"], ["#7ad67a", "#3f9a4a"], ["#b07cff", "#7a4ad8"], ["#ff5a3a", "#c8321a"], ["#f4f4f8", "#c8c8d4"]]);
  CREATOR.ojos = CREATOR.ojos.concat([["#7a8a96", "Grises"], ["#8a5ac8", "Violetas"]]);
  CREATOR.pantalon = CREATOR.pantalon.concat(["#2e8b57", "#9b5de5", "#f28c28"]);
  CREATOR.extra = CREATOR.extra.concat([["beanie", "Gorro de lana"], ["flor", "Flor"], ["fiesta", "Gorro de fiesta"], ["cascos", "Cascos"], ["orejas", "Orejas de gato"],
    ["cocinero", "Gorro de cocinero"], ["chistera", "Chistera"], ["pirata", "Sombrero pirata"], ["vikingo", "Casco vikingo"], ["cuernos", "Cuernos"], ["aureola", "Aureola"]]);
  CREATOR.locks = {
    tipo: [0].concat(SPECIES_KEYS.map((k) => SPECIES[k].pts)),
    pelo: [0, 0, 0, 0, 0, 0, 0, 0, 20, 35, 50, 65, 80, 100],
    extra: [0, 0, 0, 0, 0, 0, 0, 0, 15, 25, 40, 55, 70, 90, 110, 140, 170, 200],
  };
  CREATOR.lockOf = (k, i) => (CREATOR.locks[k] && CREATOR.locks[k][i]) || 0;
  CREATOR.best = () => best;
  function applyExtra(look, extra, color) {
    if (extra === "gafas") look.glasses = true;
    else if (extra === "collar") look.necklace = "#d9b45a";
    else if (extra !== "no") look.hat = HAT(extra, HAT_COLORS[extra] || (extra === "sombrero" ? "#e9c46a" : extra === "beret" ? "#2a2a2e" : color));
  }
  // de lo elegido (un índice por opción) al dibujo del personaje
  function buildLook(sel) {
    const chica = sel.sexo === 1, at = (a, i) => a[Math.max(0, Math.min(a.length - 1, i | 0))];
    if ((sel.tipo | 0) > 0) {
      const key = SPECIES_KEYS[Math.min(SPECIES_KEYS.length, sel.tipo | 0) - 1], S = SPECIES[key];
      const [body, belly] = at(S.colors, sel.pelaje);
      const look = { kind: "critter", species: key, body, belly, flag: at(CREATOR.bandera, sel.bandera)[0] };
      applyExtra(look, at(CREATOR.extra, sel.extra)[0], "#e63946");
      return look;
    }
    const [skin, skinD] = at(CREATOR.piel, sel.piel), [hair, hairD] = at(CREATOR.pelo, sel.pelo);
    const color = at(CREATOR.color, sel.color), extra = at(CREATOR.extra, sel.extra)[0], barba = at(CREATOR.barba, sel.barba)[0];
    const look = {
      fem: chica, skin, skinD, hair, hairD, part: chica ? -2 : -3,
      hairStyle: at(chica ? CREATOR.peinadoChica : CREATOR.peinadoChico, sel.peinado)[0],
      face: chica ? { rx: 11.2, ry: 13.8, chin: 0.46 } : { rx: 11.4, ry: 15, chin: 0.55 },
      eye: at(CREATOR.ojos, sel.ojos)[0], nose: chica ? 4.9 : 5.5,
      lips: chica ? "#c9776d" : "#b0705c", smile: chica ? "teeth" : "closed",
      brow: { color: darken(hair, 0.3), w: chica ? 1.6 : 2.2, y: 4.4, arch: chica ? 1.4 : 0.7 },
      top: at(CREATOR.ropa, sel.ropa)[0], topColor: color, noLogo: true,
      legs: at(CREATOR.pantalon, sel.pantalon), shoes: "#f4f4f4", shoeSole: "#d0d0d0", scrunchie: color,
      flag: at(CREATOR.bandera, sel.bandera)[0],
    };
    if (!chica && barba !== "no") look.beard = { color: darken(hair, 0.1), alpha: barba === "larga" ? 0.95 : 0.8, top: barba === "larga" ? 3.5 : 5 };
    applyExtra(look, extra, color);
    return look;
  }
  // pinta un personaje (look) en un canvas cualquiera
  function drawLookTo(cv, look, scale) {
    const keep = ctx;
    ctx = cv.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const k = cv.width / 120, h = cv.height / k;
    ctx.scale(k, k);
    // tamaño pensado para que quepan los gorros altos y los pies (12/11/2026)
    const def = Object.assign({}, CUSTOM_BASE, look || {});
    try {
      if (def.kind === "critter") drawCritter(def, 60, h * 0.61, 0, worldT * 6, 1.65, "");
      else drawChar(def, 57, h * 0.66, 0, worldT * 6, 1.3, "");
    }
    finally { ctx = keep; }
  }
  window.ElsPanets = {
    CREATOR, buildLook, drawLookTo, flagImg, FLAG_NAMES, flagName, flagsReady: () => flagsReady,
    playerInfo: () => ({ name: store.get(NAME_KEY, ""), char: selectedChar().id, flag: flagOf(selectedChar()) }),
    // guarda el personaje y, si se pide, lo deja elegido para jugar
    setCustom: (d, pick) => { applyCustom(d); if (pick && customState() === "aprobado") viewChar(CHARACTERS.indexOf(customDef)); },
    // caja, hucha y premio diario (12/11/2026)
    PRIZES, RARITY, BOX_COST, PITY_EVERY, DAILY,
    hucha: () => hucha, owned: () => owned, wear: () => wear, setWear, rollBox, randomPrize,
    boxOdds, boxComplete, boxSureIn,
    dailyState, claimDaily, drawPrizeTo, foodImg,
    // misiones, logros, tienda de mejoras (17/11/2026)
    on: (ev, f) => (listeners[ev] = listeners[ev] || []).push(f),
    addHucha: (n) => { if (n > 0) addHucha(n); },
    best: () => best,
    POWERS, UPGRADABLE, UPGRADE_COSTS, START_COSTS,
    upgrades: () => upgrades, buyUpgrade, buyStartPower, startPower: () => store.get(START_KEY, ""),
    drawPowerTo: (cv, k) => {
      const keep = ctx; ctx = cv.getContext("2d");
      try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); const z = cv.width / 40; ctx.scale(z, z); drawPower(k, 20, 20, 1, false); }
      finally { ctx = keep; }
    },
    unlockedChars: () => CHARACTERS.filter((c, i) => !c.custom && !c.premium && charUnlocked(i)).length,
    totalChars: () => CHARACTERS.filter((c) => !c.custom && !c.premium).length,
    // zona Premium (23/11/2026)
    famosos: () => FAMOSOS.map((f) => ({ id: f.id, name: f.name, rar: f.rar, price: f.price, story: f.story, own: !!famOwned[f.id], i: CHARACTERS.indexOf(f) })),
    FAM_RARITY: (window.ElsPanetsFamosos && window.ElsPanetsFamosos.RARITY) || [],
    buyFamoso,
    hasCustom: () => customState() === "aprobado",
    // retos (17/11/2026)
    todayKey, dailySeed, startMode, runMode: () => runMode,
    // en directo (17/11/2026)
    startLive, liveFeed,
    liveState: () => ({ mode: runMode, playing: state === STATE.PLAY, n: ghostRec.length, y: ghostRec.slice(Math.max(0, ghostRec.length - 12)), s: score, state, rv: liveRivalY() }),
    liveLeave: () => { if (runMode !== "directo") return; if (state === STATE.PLAY || state === STATE.COUNT || state === STATE.PAUSE) leaveRun(); else goHome(); },
    goHome: () => { if (state === STATE.OVER || state === STATE.START) goHome(); },
    // historia (17/11/2026)
    STORY_INTRO, WORLDS, LEVELS_PER_WORLD,
    story: () => story, levelStars, levelOpen, worldDone, totalStars,
    levelInfo: (w, n) => { const L = makeLevel(w, n); return { w, n, boss: L.boss, len: L.len, goals: goalTexts(L) }; },
    startLevel: (w, n) => { if (state !== STATE.START && state !== STATE.OVER) return false; return startLevel(w, n); },
    charIndexOf: (id) => CHARACTERS.findIndex((c) => c.id === id),
    // pantalla de personajes (17/11/2026)
    charList: () => CHARACTERS.slice(0, shownCount()).map((c, i) => ({
      i, id: c.id, custom: !!c.custom, gris: c.id === "gris", open: charUnlocked(i), unlock: c.unlock || 0, premium: !!c.premium, price: c.price || 0, rar: c.rar || 0,
      name: c.custom ? (c.name || "TU PERSONAJE") : (c.name || "EL GRIS"),
      story: c.custom ? "Tu personaje, hecho por ti." : c.story || "El de siempre: gris y sin prisas.",
      power: c.power || "", special: c.special || null, flag: flagName(flagOf(c)), ability: ABILITIES[c.id] || "",
      outfits: c.custom || c.premium || c.id === "gris" ? [] : c.outfits.map((o, k) => ({ name: o.name, open: outfitUnlocked(k), pts: OUTFIT_PTS[k] })),
      outfit: outfitIndex(c),
    })),
    current: () => charIndex,
    pickChar: (i) => { viewChar(i); return charIndex === i; },
    pickOutfit: (i, k) => { const c = CHARACTERS[i]; if (c && charUnlocked(i) && outfitUnlocked(k)) { setOutfit(c, k); return true; } return false; },
    customFree: () => customState() !== "aprobado",
    customData: () => customChar,
    drawCharTo: (cv, i, k) => {
      const def = CHARACTERS[i]; if (!def) return;
      const look = k == null ? (charUnlocked(i) ? worn(def) : dressed(def)) : dressed(def, k);
      const keep = ctx; ctx = cv.getContext("2d");
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        const z = cv.width / 120, h = cv.height / z; ctx.scale(z, z);
        if (def.kind === "dog") drawDog(58, h * 0.6, 0, worldT * 6, 1.55, "", look);
        else if (look.kind === "critter") drawCritter(look, 60, h * 0.61, 0, worldT * 6, 1.65, "");
        else if (def.premium) drawChar(look, 54, h * (def.tall ? 0.75 : 0.71), 0, worldT * 6, def.tall ? 1.02 : 1.26, ""); // caben sus sombreros altos
        else drawChar(look, 57, h * 0.66, 0, worldT * 6, 1.3, "");
      } finally { ctx = keep; }
    },
    drawFoodTo: (cv, kind) => {
      const keep = ctx; ctx = cv.getContext("2d");
      try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); const z = cv.width / 40; ctx.scale(z, z); drawFood(kind, 20, 20, 0, 0.8, false); }
      finally { ctx = keep; }
    },
    charName: (id) => { const c = CHARACTERS.find((x) => x.id === id); return !c ? id : c.custom ? (c.name ? niceName(c.name) : "Tu personaje") : c.name ? niceName(c.name) : "El gris"; },
    sfx: (n) => { try { if (snd[n]) snd[n](); } catch (e) {} },
    // Ajustes (16/11/2026)
    VERSION: 42,
    settings: () => ({ volMusica: musicOn ? Math.round(musicVol * 100) : 0, volEfectos: sfxOn ? Math.round(sfxVol * 100) : 0, ahorro: saveOn, calma: calmOn, musica: musicOn, efectos: sfxOn, vibracion: vibraOn, destellos: softFlash, calidadBaja: lowQ, descanso: restOn, nombre: store.get(NAME_KEY, "") || "", mejor: best }),
    setMusic: (on) => { setMusic(on); if (on) startMusic(); },
    setSfx,
    setVibra: (on) => { vibraOn = on; store.set(VIBRA_KEY, on ? "1" : "0"); if (on) vibrate(20); },
    setFlash: (on) => { softFlash = on; store.set(FLASH_KEY, on ? "1" : "0"); },
    setMusicVol, setSfxVol,
    setSave: (on) => { saveOn = on; store.set(SAVE_KEY, on ? "1" : "0"); },
    setCalm: (on) => { calmOn = on; store.set(CALM_KEY, on ? "1" : "0"); },
    // vuelve a los ajustes de fábrica (la partida, el récord y los premios no se tocan)
    resetSettings: () => {
      setMusicVol(1); setSfxVol(1);
      vibraOn = true; store.set(VIBRA_KEY, "1");
      softFlash = true; store.set(FLASH_KEY, "1");
      restOn = true; store.set(REST_KEY, "1");
      saveOn = false; store.set(SAVE_KEY, "0");
      calmOn = false; store.set(CALM_KEY, "0");
      if (lowQ) { lowQ = false; store.set(QUALITY_KEY, "alta"); resize(); }
    },
    setRest: (on) => { restOn = on; store.set(REST_KEY, on ? "1" : "0"); },
    setQuality: (low) => { lowQ = low; store.set(QUALITY_KEY, low ? "baja" : "alta"); resize(); },
    nameProblem, setPlayerName,
    // vuelve a enseñar el tutorial: ahora mismo si se está en el inicio, o en la próxima partida
    replayTutorial: () => { store.del(TUTORIAL_KEY); if (state === STATE.START) goReady(); },
    // borra todo lo que el juego guarda en este móvil (claves nuevas y antiguas)
    eraseLocal: () => {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith("elsPanets") || k.startsWith("tacoSuitFlap"))) keys.push(k); }
        for (const k of keys) localStorage.removeItem(k);
      } catch (e) {}
    },
  };

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
