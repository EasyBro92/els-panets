// La vuelta al mundo de Els Panets (25/11/2026).
// Cada partida empieza en Caracas y cada 50 puntos se cruza al país siguiente, siguiendo el mapa:
// Venezuela → Colombia → Panamá → Honduras → México → Estados Unidos → (Pacífico) → Japón → China →
// India → Egipto → (Mediterráneo) → Grecia → (Jónico) → Italia → Francia → España → (Atlántico) →
// República Dominicana → (Caribe) → Venezuela.
// El fondo ya no es un trozo que se repite: cada cosa tiene su sitio en el camino y se dibuja
// entera. Al cruzar una frontera, el país nuevo entra por la derecha y avanza con el paisaje:
// lo cercano cambia antes y las montañas lejanas, despacio. Entre continentes hay un tramo de mar.
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  let K = null, N = 0, HZ = [200, 210, 220], HA = 0, LW = 400, LH = 700, GT = 500;
  const memo = new Map();
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // color con la neblina de la distancia (HA) y la noche (N)
  function col(h) {
    const key = h + "|" + HA + "|" + N;
    let v = memo.get(key);
    if (v) return v;
    const c = hexRgb(h);
    let r = c[0] + (HZ[0] - c[0]) * HA, g = c[1] + (HZ[1] - c[1]) * HA, b = c[2] + (HZ[2] - c[2]) * HA;
    r += (28 - r) * N * 0.62; g += (34 - g) * N * 0.62; b += (78 - b) * N * 0.55;
    v = "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
    memo.set(key, v);
    return v;
  }
  const lit = () => N > 0.5;
  const LIGHT = "rgba(255,214,122,0.92)";
  const hsh = (a, b) => { const s = Math.sin(a * 12.9898 + (b || 0) * 78.233) * 43758.5453; return s - Math.floor(s); };
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

  // ---------- dibujo ----------
  function R(x, y, w, h, c) { K.fillStyle = col(c); K.fillRect(x, y, w, h); }
  function P(c, ...p) { K.fillStyle = col(c); K.beginPath(); K.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) K.lineTo(p[i], p[i + 1]); K.closePath(); K.fill(); }
  function E(x, y, rx, ry, c, a0, a1, rot) { K.fillStyle = col(c); K.beginPath(); K.ellipse(x, y, rx, ry, rot || 0, a0 || 0, a1 == null ? TAU : a1); K.fill(); }
  const O = (x, y, r, c) => E(x, y, r, r, c);
  function L(c, w, ...p) { K.strokeStyle = col(c); K.lineWidth = w; K.beginPath(); K.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) K.lineTo(p[i], p[i + 1]); K.stroke(); }
  const dome = (x, b, rx, ry, c) => E(x, b, rx, ry, c, Math.PI, TAU);
  function arch(x, b, w, h, c) {
    K.fillStyle = col(c); K.beginPath(); K.moveTo(x, b); K.lineTo(x, b - h + w / 2);
    K.arc(x + w / 2, b - h + w / 2, w / 2, Math.PI, 0); K.lineTo(x + w, b); K.closePath(); K.fill();
  }
  // ventanas en cuadrícula: de noche se encienden algunas (siempre las mismas, sin parpadeo)
  function wins(x, y, w, h, cw, ch, gx, gy, c, seed) {
    let i = 0;
    for (let yy = y; yy + ch <= y + h + 0.1; yy += ch + gy) for (let xx = x; xx + cw <= x + w + 0.1; xx += cw + gx) {
      if (lit() && hsh(seed + i, 3) < 0.55) { K.fillStyle = LIGHT; K.fillRect(xx, yy, cw, ch); } else R(xx, yy, cw, ch, c);
      i++;
    }
  }
  function win(x, y, w, h, c, seed) { if (lit() && hsh(seed, 5) < 0.6) { K.fillStyle = LIGHT; K.fillRect(x, y, w, h); } else R(x, y, w, h, c); }
  function onion(x, b, w, h, c) {
    K.fillStyle = col(c); K.beginPath(); K.moveTo(x - w / 2, b);
    K.bezierCurveTo(x - w * 0.78, b - h * 0.45, x - w * 0.3, b - h * 0.78, x, b - h);
    K.bezierCurveTo(x + w * 0.3, b - h * 0.78, x + w * 0.78, b - h * 0.45, x + w / 2, b); K.closePath(); K.fill();
  }
  // tejado oriental con las puntas hacia arriba
  function eave(x, y, w, d, c) {
    K.fillStyle = col(c); K.beginPath();
    K.moveTo(x - w / 2 - 6, y - d - 3); K.quadraticCurveTo(x - w / 2 + 2, y - 1, x - w / 2 + 8, y);
    K.lineTo(x + w / 2 - 8, y); K.quadraticCurveTo(x + w / 2 - 2, y - 1, x + w / 2 + 6, y - d - 3);
    K.lineTo(x + w / 2 - 6, y - d); K.lineTo(x - w / 2 + 6, y - d); K.closePath(); K.fill();
  }
  function star5(x, y, r, c) { K.fillStyle = col(c); K.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; K.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } K.closePath(); K.fill(); }

  // ---------- monumentos (capa media) ----------
  const MON = {
    // VENEZUELA
    parque(x, b) {
      R(x - 118, b - 52, 64, 52, "#c9c2b4"); R(x + 44, b - 64, 74, 64, "#bdb5a6");
      wins(x - 112, b - 46, 52, 40, 5, 4, 4, 5, "#8996a2", 11); wins(x + 50, b - 58, 62, 52, 5, 4, 4, 5, "#8996a2", 12);
      for (const [dx, h, s] of [[-40, 214, 1], [8, 204, 2]]) {
        R(x + dx, b - h, 34, h, "#ddd5c4"); R(x + dx + 25, b - h, 9, h, "#b9b09e");
        let i = 0;
        for (let y = b - h + 8; y < b - 6; y += 7) { R(x + dx + 3, y, 28, 3, "#69757f"); if (lit() && hsh(s * 50 + i, 1) < 0.45) { K.fillStyle = LIGHT; K.fillRect(x + dx + 3 + hsh(i, s) * 18, y, 8, 3); } i++; }
        R(x + dx + 15, b - h - 18, 3, 18, "#8f8f8f");
      }
    },
    capitolio(x, b) {
      R(x - 98, b - 46, 196, 46, "#efe3b8"); R(x - 102, b - 52, 204, 7, "#f7f1db");
      for (let i = 0; i < 13; i++) R(x - 90 + i * 14.5, b - 44, 5, 38, "#fffaf0");
      R(x - 98, b - 8, 196, 8, "#ddd0a2");
      P("#f7f1db", x - 44, b - 52, x, b - 70, x + 44, b - 52);
      R(x - 28, b - 92, 56, 24, "#f3ead0"); for (let i = 0; i < 5; i++) R(x - 22 + i * 10, b - 88, 4, 16, "#d9cfa8");
      dome(x, b - 92, 31, 36, "#e3b02f"); dome(x - 9, b - 96, 11, 26, "#f5d66b");
      R(x - 3, b - 138, 6, 12, "#d9a62a"); O(x, b - 141, 4, "#e3b02f");
    },
    panteon(x, b) {
      R(x - 64, b - 70, 128, 70, "#f4f1ea"); R(x + 40, b - 70, 24, 70, "#dcd8cf");
      R(x - 15, b - 150, 30, 82, "#f8f6f0"); P("#f8f6f0", x - 15, b - 150, x, b - 190, x + 15, b - 150); R(x - 1, b - 200, 2, 12, "#9a9a9a");
      for (const dx of [-64, 46]) { R(x + dx, b - 104, 18, 36, "#f8f6f0"); P("#f8f6f0", x + dx, b - 104, x + dx + 9, b - 124, x + dx + 18, b - 104); }
      O(x, b - 118, 7, "#b9c3cc"); arch(x - 10, b, 20, 34, "#6f6658");
      for (const dx of [-46, 28]) arch(x + dx, b - 22, 12, 22, "#8a8172");
    },
    // COLOMBIA
    reloj(x, b) {
      R(x - 118, b - 46, 236, 46, "#c9b28a"); for (let i = 0; i < 24; i++) if (i % 2 === 0) R(x - 118 + i * 10, b - 54, 8, 8, "#c9b28a");
      for (let i = 0; i < 6; i++) L("#b39b72", 1, x - 118, b - 40 + i * 7, x + 118, b - 40 + i * 7);
      for (const dx of [-38, -10, 18]) arch(x + dx, b, 20, 32, "#4f4234");
      R(x - 22, b - 122, 44, 76, "#f2c94c"); R(x + 13, b - 122, 9, 76, "#d6a937");
      R(x - 26, b - 88, 52, 5, "#fff3cf"); R(x - 26, b - 125, 52, 5, "#fff3cf");
      O(x, b - 104, 10, "#fdfaf0"); L("#3b2a1c", 1.4, x, b - 104, x, b - 111); L("#3b2a1c", 1.4, x, b - 104, x + 6, b - 103);
      R(x - 14, b - 144, 28, 20, "#f2c94c"); arch(x - 6, b - 126, 12, 16, "#7a5a32");
      dome(x, b - 144, 16, 13, "#e9b23c"); R(x - 1, b - 166, 2, 10, "#6f5a3a");
    },
    murallas(x, b) {
      P("#bba57e", x - 126, b, x - 120, b - 50, x + 120, b - 50, x + 126, b);
      for (let i = 0; i < 7; i++) L("#a8916a", 1, x - 122 + i * 0.8, b - 44 + i * 6.5, x + 122 - i * 0.8, b - 44 + i * 6.5);
      R(x - 122, b - 56, 244, 7, "#c9b48e");
      for (const dx of [-108, 0, 106]) { R(x + dx - 8, b - 76, 16, 22, "#d8c49a"); dome(x + dx, b - 76, 10, 11, "#d8c49a"); R(x + dx - 1.5, b - 70, 3, 8, "#5a4a3a"); }
      for (const dx of [-60, 56]) { E(x + dx, b - 60, 22, 12, "#3f8f4a"); for (let i = 0; i < 6; i++) O(x + dx - 16 + i * 6.4, b - 64 + (i % 2) * 5, 3, "#e0569a"); }
    },
    claver(x, b) {
      R(x - 76, b - 72, 116, 72, "#dcbc82"); P("#e4c890", x - 76, b - 72, x - 18, b - 98, x + 40, b - 72);
      arch(x - 30, b, 24, 40, "#5f4a32"); O(x - 18, b - 82, 7, "#9a7a52");
      R(x - 40, b - 104, 40, 26, "#e4c890"); dome(x - 20, b - 104, 26, 26, "#c98d55"); R(x - 22, b - 140, 4, 12, "#8a6a3a");
      R(x + 34, b - 138, 36, 138, "#e7c98e"); R(x + 60, b - 138, 10, 138, "#cdae74");
      for (let i = 0; i < 3; i++) arch(x + 42, b - 96 + i * 30, 12, 18, "#6f5538");
      dome(x + 52, b - 138, 18, 16, "#c98d55"); R(x + 51, b - 166, 2, 12, "#6f5a3a");
    },
    // PANAMÁ
    puente(x, b) {
      R(x - 134, b - 50, 268, 7, "#5d6f66"); for (const dx of [-96, -50, 50, 96]) R(x + dx - 4, b - 44, 8, 44, "#7c8a84");
      K.strokeStyle = col("#4f8a6a"); K.lineWidth = 6; K.beginPath(); K.ellipse(x, b - 44, 112, 74, 0, Math.PI, TAU); K.stroke();
      K.lineWidth = 2.5; K.beginPath(); K.ellipse(x, b - 44, 112, 62, 0, Math.PI, TAU); K.stroke();
      for (let i = -9; i <= 9; i++) { const xx = x + i * 11.5, k = 1 - (i * 11.5 / 112) ** 2, y = b - 44 - 74 * Math.sqrt(Math.max(0, k)); L("#4f8a6a", 1.4, xx, y, xx, b - 50); if (i < 9) L("#5f9a7a", 0.9, xx, y + 6, xx + 11.5, b - 50); }
    },
    tornillo(x, b) {
      for (const [dx, w, h, c] of [[-108, 30, 150, "#7fa9c4"], [-70, 36, 118, "#9cc0d6"], [60, 34, 172, "#6f98b8"], [100, 28, 128, "#8fb5cc"]]) {
        R(x + dx, b - h, w, h, c); R(x + dx + w - 7, b - h, 7, h, "#5f84a0"); wins(x + dx + 4, b - h + 6, w - 12, h - 12, 3, 4, 3, 4, "#d6e8f2", dx * 7);
      }
      for (let i = 0; i < 24; i++) {
        const y = b - i * 9, o0 = Math.sin(i * 0.42) * 7, o1 = Math.sin((i + 1) * 0.42) * 7;
        P(i % 2 ? "#4f86b5" : "#6aa0c9", x - 15 + o0, y, x + 15 + o0, y, x + 15 + o1, y - 9, x - 15 + o1, y - 9);
        if (lit() && hsh(i, 9) < 0.5) { K.fillStyle = LIGHT; K.fillRect(x - 8 + o0, y - 6, 16, 2); }
      }
      R(x - 1, b - 230, 2, 14, "#8f9aa5");
    },
    canal(x, b) {
      R(x - 132, b - 22, 264, 22, "#8a9096"); R(x - 124, b - 28, 248, 7, "#4f8fb0");
      for (const dx of [-128, 118]) R(x + dx, b - 40, 10, 40, "#6f777e");
      P("#2f3e55", x - 112, b - 30, x + 104, b - 30, x + 94, b - 10, x - 104, b - 10); R(x - 108, b - 22, 204, 4, "#c0392b");
      const cs = ["#c0392b", "#2f6fb8", "#f2b134", "#3f9a52", "#e5733d", "#8e5fb0"];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) if (hsh(i, r) < 0.85 - r * 0.2) { R(x - 96 + i * 18, b - 42 - r * 12, 16, 11, cs[(i * 3 + r) % 6]); L("#3a3a3a", 0.5, x - 92 + i * 18, b - 40 - r * 12, x - 92 + i * 18, b - 33 - r * 12); }
      R(x + 66, b - 76, 24, 46, "#f2f2f2"); wins(x + 69, b - 72, 18, 20, 4, 3, 3, 4, "#4a5a6a", 77); R(x + 74, b - 90, 7, 14, "#c0392b");
    },
    // HONDURAS
    copan(x, b) {
      for (let i = 0; i < 6; i++) { const w = 168 - i * 24; R(x - w / 2, b - (i + 1) * 18, w, 18, i % 2 ? "#8f9a86" : "#9ca692"); R(x + w / 2 - 10, b - (i + 1) * 18, 10, 18, "#7d876f"); }
      P("#b4bca6", x - 16, b, x + 16, b, x + 9, b - 108, x - 9, b - 108);
      for (let y = b - 6; y > b - 106; y -= 5) L("#8f9a86", 0.7, x - 15, y, x + 15, y);
      R(x - 22, b - 132, 44, 24, "#9ca692"); R(x - 7, b - 126, 14, 18, "#3d4438"); R(x - 16, b - 144, 32, 12, "#8f9a86");
      R(x + 96, b - 58, 15, 58, "#8f9886"); for (let i = 0; i < 6; i++) L("#6f786a", 1, x + 98, b - 52 + i * 8, x + 109, b - 50 + i * 8); O(x + 103.5, b - 62, 7, "#8f9886");
      for (const [dx, r] of [[-112, 22], [-96, 16], [120, 18]]) { R(x + dx - 2, b - r - 10, 4, r + 10, "#6b4a2b"); O(x + dx, b - r - 14, r, "#3f7a4a"); O(x + dx - r * 0.4, b - r - 20, r * 0.6, "#4f8f55"); }
    },
    tegus(x, b) {
      R(x - 58, b - 64, 116, 64, "#f6f4ee"); R(x + 30, b - 64, 28, 64, "#e2dfd6");
      for (const dx of [-58, 30]) { R(x + dx, b - 112, 28, 50, "#f8f6f0"); R(x + dx, b - 70, 28, 5, "#d9b45a"); arch(x + dx + 8, b - 78, 12, 20, "#8a7a5a"); dome(x + dx + 14, b - 112, 15, 14, "#f8f6f0"); R(x + dx + 13, b - 134, 2, 10, "#8a7a5a"); }
      K.fillStyle = col("#f8f6f0"); K.beginPath(); K.moveTo(x - 30, b - 64); K.quadraticCurveTo(x, b - 104, x + 30, b - 64); K.fill();
      R(x - 30, b - 66, 60, 4, "#d9b45a"); arch(x - 11, b, 22, 38, "#6f6052"); O(x, b - 78, 6, "#d9b45a");
    },
    picacho(x, b) {
      E(x, b, 124, 74, "#4f8a55", Math.PI, TAU); E(x - 30, b, 70, 52, "#5c9a60", Math.PI, TAU);
      for (let i = 0; i < 7; i++) O(x - 90 + i * 30, b - 30 - Math.sin(i) * 12, 8, "#3f7a4a");
      R(x - 7, b - 88, 14, 14, "#e8e6e0"); P("#f6f5f0", x - 6, b - 88, x + 6, b - 88, x + 3.5, b - 118, x - 3.5, b - 118);
      R(x - 17, b - 115, 34, 3.5, "#f6f5f0"); O(x, b - 123, 4.2, "#f6f5f0");
    },
    // MÉXICO
    chichen(x, b) {
      for (let i = 0; i < 9; i++) { const w = 176 - i * 16; R(x - w / 2, b - (i + 1) * 12, w, 12, i % 2 ? "#bfb49a" : "#cbc1a6"); R(x + w / 2 - 9, b - (i + 1) * 12, 9, 12, "#a89d84"); L("#9a8f76", 0.8, x - w / 2, b - (i + 1) * 12, x + w / 2, b - (i + 1) * 12); }
      P("#ddd3b8", x - 15, b, x + 15, b, x + 9, b - 108, x - 9, b - 108);
      for (let y = b - 4; y > b - 106; y -= 4.5) L("#b8ad94", 0.6, x - 14, y, x + 14, y);
      R(x - 28, b - 134, 56, 26, "#cbc1a6"); for (const dx of [-20, -5, 10]) R(x + dx, b - 126, 9, 18, "#4a4436");
      R(x - 30, b - 138, 60, 5, "#bfb49a"); P("#a89d84", x - 22, b - 6, x - 14, b - 6, x - 16, b);
    },
    angel(x, b) {
      R(x - 36, b - 30, 72, 30, "#d8d4c8"); R(x - 25, b - 46, 50, 16, "#e2ded3"); for (const dx of [-33, 25]) R(x + dx, b - 44, 8, 14, "#4a4f55");
      R(x - 6, b - 180, 12, 134, "#ebe7dc"); R(x + 2, b - 180, 4, 134, "#cfcabd");
      for (const y of [b - 70, b - 110, b - 150]) R(x - 8, y, 16, 4, "#d9b23c");
      R(x - 11, b - 186, 22, 7, "#d9b23c");
      P("#e6b632", x - 4, b - 186, x + 4, b - 186, x + 3, b - 210, x - 3, b - 210); O(x, b - 214, 3.6, "#e6b632");
      P("#f0c84a", x - 2, b - 206, x - 22, b - 222, x - 4, b - 200); P("#f0c84a", x + 2, b - 206, x + 22, b - 222, x + 4, b - 200);
      L("#e6b632", 2, x + 3, b - 208, x + 10, b - 222); E(x + 11, b - 225, 4, 2.5, "#3f8a3f");
    },
    bellas(x, b) {
      R(x - 92, b - 64, 184, 64, "#f3efe6"); R(x + 70, b - 64, 22, 64, "#dedad0");
      for (let i = 0; i < 7; i++) arch(x - 82 + i * 24, b - 6, 14, 30, "#9aa3ab");
      R(x - 96, b - 68, 192, 5, "#e4dccd");
      R(x - 30, b - 88, 60, 24, "#f3efe6");
      dome(x, b - 88, 34, 42, "#e98a2e"); for (let i = -2; i <= 2; i++) L("#f6c04a", 1.4, x + i * 7, b - 88, x + i * 3, b - 126);
      R(x - 4, b - 136, 8, 10, "#f3efe6"); O(x, b - 140, 4, "#e6b632");
      for (const dx of [-70, 70]) { dome(x + dx, b - 64, 15, 14, "#e98a2e"); O(x + dx, b - 80, 2.5, "#e6b632"); }
    },
    // ESTADOS UNIDOS
    libertad(x, b) {
      R(x - 52, b - 22, 104, 22, "#b9ae96"); R(x - 24, b - 82, 48, 60, "#cfc3a8"); R(x - 28, b - 86, 56, 6, "#ddd2b8"); R(x + 10, b - 82, 14, 60, "#b5a98c");
      for (let i = 0; i < 3; i++) arch(x - 18 + i * 12, b - 30, 7, 18, "#9a8e74");
      const g = "#6fb39a", d = "#4f9480";
      P(g, x - 15, b - 86, x + 15, b - 86, x + 9, b - 152, x - 9, b - 152); P(d, x + 2, b - 86, x + 15, b - 86, x + 9, b - 152, x + 3, b - 150);
      for (let i = 0; i < 4; i++) L(d, 0.8, x - 10 + i * 5, b - 90, x - 6 + i * 3, b - 146);
      O(x, b - 158, 6.5, g); for (let i = -2; i <= 2; i++) P(g, x + i * 3 - 1.5, b - 163, x + i * 3 + 1.5, b - 163, x + i * 5, b - 172);
      P(g, x + 5, b - 146, x + 10, b - 146, x + 14, b - 180, x + 9, b - 181);
      R(x + 9, b - 188, 6, 8, "#c9a23a"); P("#f2c94c", x + 8, b - 188, x + 16, b - 188, x + 12, b - 199);
      P(g, x - 13, b - 130, x - 4, b - 132, x - 5, b - 118, x - 14, b - 116);
    },
    empire(x, b) {
      for (const [dx, w, h, c] of [[-112, 38, 104, "#b8b2a6"], [-70, 30, 132, "#c2bcb0"], [52, 36, 126, "#a9a397"], [92, 32, 92, "#bdb7aa"]]) {
        R(x + dx, b - h, w, h, c); wins(x + dx + 4, b - h + 6, w - 8, h - 10, 3, 4, 3, 4, "#7f8a96", dx * 3);
      }
      P("#c9c3b8", x + 52, b - 126, x + 70, b - 150, x + 88, b - 126); for (let i = 0; i < 3; i++) dome(x + 70, b - 128 - i * 6, 14 - i * 4, 6, "#d8d4ca");
      R(x - 28, b - 142, 56, 142, "#cdc7bc"); R(x + 18, b - 142, 10, 142, "#b1ab9f");
      R(x - 20, b - 174, 40, 32, "#cdc7bc"); R(x - 12, b - 192, 24, 18, "#d3cdc2"); R(x - 6, b - 206, 12, 14, "#d9d3c8");
      R(x - 1.5, b - 236, 3, 30, "#b9b4aa");
      for (let i = 0; i < 6; i++) L("#9aa3ae", 1.2, x - 22 + i * 8, b - 138, x - 22 + i * 8, b - 4);
      if (lit()) { K.fillStyle = "rgba(255,226,150,0.9)"; K.fillRect(x - 6, b - 204, 12, 10); }
    },
    golden(x, b) {
      const red = "#d0502f";
      R(x - 136, b - 56, 272, 7, red);
      K.strokeStyle = col(red); K.lineWidth = 2;
      K.beginPath(); K.moveTo(x - 136, b - 104); K.quadraticCurveTo(x - 104, b - 120, x - 72, b - 168);
      K.quadraticCurveTo(x, b - 32, x + 72, b - 168); K.quadraticCurveTo(x + 104, b - 120, x + 136, b - 104); K.stroke();
      for (let xx = -64; xx <= 64; xx += 8) { const t = (xx + 72) / 144, y = (1 - t) * (1 - t) * (b - 168) + 2 * (1 - t) * t * (b - 32) + t * t * (b - 168); L(red, 0.8, x + xx, y, x + xx, b - 56); }
      for (const dx of [-72, 72]) { R(x + dx - 6, b - 172, 5, 172, red); R(x + dx + 1, b - 172, 5, 172, red); for (const y of [b - 160, b - 128, b - 92]) R(x + dx - 8, y, 16, 5, red); R(x + dx + 3, b - 172, 3, 172, "#b5401f"); }
    },
    // JAPÓN
    pagoda(x, b) {
      R(x - 44, b - 8, 88, 8, "#b8b0a0");
      for (let i = 0; i < 5; i++) { const w = 74 - i * 10, y = b - 8 - i * 30; R(x - w / 2 + 8, y - 22, w - 16, 22, "#c8553d"); R(x + w / 2 - 16, y - 22, 8, 22, "#a9442f"); win(x - 5, y - 18, 10, 10, "#f2e6c8", i + 40); eave(x, y - 22, w + 10, 7, "#3a3f47"); }
      R(x - 2, b - 200, 4, 40, "#c9a23a"); for (let i = 0; i < 6; i++) R(x - 5, b - 166 - i * 6, 10, 2, "#c9a23a"); O(x, b - 202, 3, "#c9a23a");
    },
    torii(x, b) {
      const red = "#d9452f";
      R(x - 52, b - 112, 11, 112, red); R(x + 41, b - 112, 11, 112, red); R(x - 54, b - 12, 15, 12, "#2b2b2b"); R(x + 39, b - 12, 15, 12, "#2b2b2b");
      R(x - 64, b - 92, 128, 8, red); R(x - 5, b - 112, 10, 20, red);
      R(x - 70, b - 112, 140, 8, red);
      K.fillStyle = col("#2b2b2b"); K.beginPath(); K.moveTo(x - 84, b - 128); K.quadraticCurveTo(x - 60, b - 118, x, b - 120); K.quadraticCurveTo(x + 60, b - 118, x + 84, b - 128);
      K.lineTo(x + 78, b - 114); K.quadraticCurveTo(x, b - 110, x - 78, b - 114); K.closePath(); K.fill();
    },
    tokyo(x, b) {
      const red = "#e5532d", w = "#f2f0ea";
      for (const s of [-1, 1]) { P(red, x + s * 44, b, x + s * 30, b, x + s * 7, b - 122, x + s * 13, b - 122); P(red, x + s * 12, b - 130, x + s * 7, b - 130, x + s * 3, b - 176, x + s * 5, b - 176); }
      for (const [y, ww] of [[b - 30, 64], [b - 64, 44], [b - 96, 26]]) R(x - ww / 2, y, ww, 5, w);
      R(x - 18, b - 132, 36, 12, w); R(x - 15, b - 128, 30, 4, "#8fb5cc"); R(x - 9, b - 182, 18, 8, w);
      R(x - 1.5, b - 232, 3, 50, red); R(x - 1.5, b - 214, 3, 8, w);
      for (let y = b - 8; y > b - 120; y -= 14) { L("#c8452a", 0.7, x - 34 + (b - y) * 0.22, y, x + 30 - (b - y) * 0.22, y - 12); L("#c8452a", 0.7, x + 34 - (b - y) * 0.22, y, x - 30 + (b - y) * 0.22, y - 12); }
    },
    // CHINA
    cielo(x, b) {
      R(x - 84, b - 12, 168, 12, "#f2efe6"); R(x - 68, b - 22, 136, 10, "#f6f3ec"); R(x - 52, b - 30, 104, 8, "#faf8f2");
      for (const [w, y, h] of [[78, b - 30, 26], [60, b - 70, 22], [42, b - 106, 18]]) {
        R(x - w / 2, y - h, w, h, "#b8322a"); for (let i = 0; i < 5; i++) R(x - w / 2 + 4 + i * (w - 10) / 4, y - h, 3, h, "#8e2219");
        P("#2f5ca8", x - w / 2 - 14, y - h, x + w / 2 + 14, y - h, x + w / 2 - 4, y - h - 14, x - w / 2 + 4, y - h - 14); R(x - w / 2 - 14, y - h - 2, w + 28, 3, "#e5b53a");
      }
      P("#2f5ca8", x - 20, b - 138, x + 20, b - 138, x, b - 158); O(x, b - 162, 4.5, "#e5b53a");
    },
    pagodachina(x, b) {
      R(x - 38, b - 10, 76, 10, "#a89a86");
      for (let i = 0; i < 7; i++) { const w = 60 - i * 6, y = b - 10 - i * 25; R(x - w / 2, y - 20, w, 20, "#c4b096"); R(x + w / 2 - 8, y - 20, 8, 20, "#a8957a"); arch(x - 4, y - 4, 8, 12, "#5a4a3a"); eave(x, y - 20, w + 6, 5, "#6b6157"); }
      R(x - 1.5, b - 210, 3, 26, "#8a7a5a"); O(x, b - 212, 3, "#c9a23a");
    },
    tiananmen(x, b) {
      R(x - 122, b - 60, 244, 60, "#b8322a"); R(x + 96, b - 60, 26, 60, "#9a2a22");
      for (const dx of [-62, -18, 26]) arch(x + dx, b, 30, 40, "#3a1a16");
      R(x - 112, b - 66, 224, 6, "#d8d0c0");
      R(x - 82, b - 100, 164, 34, "#c03a2e"); for (let i = 0; i < 10; i++) R(x - 78 + i * 17, b - 98, 4, 32, "#8e2219");
      eave(x, b - 100, 196, 12, "#e5b53a"); R(x - 70, b - 120, 140, 10, "#c03a2e"); eave(x, b - 120, 160, 16, "#e5b53a");
      for (const dx of [-52, -18, 18, 52]) { L("#8e2219", 0.8, x + dx, b - 66, x + dx, b - 74); E(x + dx, b - 78, 5, 6, "#e0362a"); R(x + dx - 2, b - 85, 4, 2, "#e5b53a"); }
    },
    // INDIA
    taj(x, b) {
      R(x - 116, b - 10, 232, 10, "#efe9de");
      for (const dx of [-108, 100]) { R(x + dx, b - 124, 8, 114, "#f7f4ee"); for (const y of [b - 50, b - 90]) R(x + dx - 2, y, 12, 3, "#ddd6c8"); dome(x + dx + 4, b - 124, 7, 8, "#f7f4ee"); R(x + dx + 3, b - 138, 2, 7, "#c9a23a"); }
      R(x - 60, b - 78, 120, 68, "#f7f4ee"); R(x + 36, b - 78, 24, 68, "#e4ded3");
      arch(x - 16, b - 14, 32, 54, "#d9d0c0"); arch(x - 11, b - 18, 22, 44, "#c8beac");
      for (const dx of [-52, -36, 22, 38]) { arch(x + dx, b - 46, 12, 22, "#ddd5c6"); arch(x + dx, b - 16, 12, 22, "#ddd5c6"); }
      for (const dx of [-50, 50]) { R(x + dx - 7, b - 92, 14, 14, "#f7f4ee"); dome(x + dx, b - 92, 9, 10, "#f7f4ee"); }
      R(x - 28, b - 96, 56, 18, "#f7f4ee"); onion(x, b - 96, 66, 62, "#fbf9f4"); onion(x + 10, b - 98, 26, 46, "#e9e3d8");
      R(x - 1.5, b - 172, 3, 16, "#c9a23a");
    },
    gateway(x, b) {
      const s = "#d9b77e", d = "#bc9a62";
      R(x - 62, b - 92, 124, 92, s); R(x + 40, b - 92, 22, 92, d);
      arch(x - 20, b, 40, 72, "#6f5a40"); for (const dx of [-52, 30]) arch(x + dx, b - 30, 22, 36, "#8a7250");
      for (const dx of [-62, -24, 12, 50]) { R(x + dx, b - 118, 12, 26, s); dome(x + dx + 6, b - 118, 8, 10, s); R(x + dx + 5, b - 132, 2, 6, d); }
      R(x - 64, b - 96, 128, 5, "#e8cc96"); R(x - 30, b - 112, 60, 18, s); dome(x, b - 112, 22, 16, s);
    },
    hawa(x, b) {
      const p = "#e48a7a", l = "#f2b3a3", d = "#c8705e";
      for (let r = 0; r < 5; r++) {
        const w = 156 - r * 26, y = b - r * 28;
        R(x - w / 2, y - 28, w, 28, p); R(x + w / 2 - 8, y - 28, 8, 28, d);
        for (let i = 0; i < Math.floor(w / 13); i++) { const xx = x - w / 2 + 4 + i * 13; R(xx, y - 22, 9, 14, l); win(xx + 2, y - 19, 5, 8, "#9a5a4a", r * 20 + i); dome(xx + 4.5, y - 22, 5, 5, l); }
      }
      for (let i = 0; i < 3; i++) dome(x - 18 + i * 18, b - 140, 7, 9, p);
    },
    // EGIPTO
    piramides(x, b) {
      for (const [dx, s] of [[100, 0.55], [42, 0.82], [-52, 1]]) {
        const h = 156 * s, w = 184 * s, cx = x + dx;
        P("#e0bd84", cx - w / 2, b, cx, b - h, cx + w / 2, b); P("#b98f58", cx, b - h, cx + w / 2, b, cx + w * 0.12, b);
        for (let i = 1; i < 9; i++) { const y = b - (h * i) / 9, k = i / 9; L("#c9a46c", 0.6, cx - (w / 2) * (1 - k), y, cx + (w / 2) * (1 - k), y); }
      }
    },
    esfinge(x, b) {
      const s = "#d4ad72", d = "#b38c54";
      P(s, x - 90, b, x - 90, b - 28, x - 40, b - 40, x + 20, b - 40, x + 44, b - 30, x + 52, b - 12, x + 96, b - 12, x + 96, b);
      R(x + 44, b - 12, 52, 12, d); P(d, x - 90, b - 28, x - 100, b - 12, x - 90, b - 6);
      P(s, x + 20, b - 40, x + 28, b - 86, x + 62, b - 86, x + 62, b - 30);
      P("#c9a46a", x + 22, b - 74, x + 28, b - 92, x + 62, b - 92, x + 70, b - 64, x + 62, b - 50, x + 58, b - 74);
      for (let i = 0; i < 5; i++) L("#b38c54", 0.8, x + 26 + i * 8, b - 90, x + 24 + i * 9, b - 74);
      R(x + 40, b - 80, 16, 24, s); R(x + 48, b - 74, 5, 2.5, "#5a4630"); R(x + 50, b - 66, 3, 6, d); R(x + 46, b - 60, 8, 2, "#8a6a40");
    },
    mezquita(x, b) {
      R(x - 72, b - 60, 144, 60, "#e9e2d2"); R(x + 50, b - 60, 22, 60, "#d4ccba");
      for (let i = 0; i < 6; i++) arch(x - 62 + i * 22, b - 8, 12, 24, "#9a907c");
      for (const dx of [-46, 46]) dome(x + dx, b - 60, 18, 16, "#cfc6b4");
      R(x - 30, b - 74, 60, 14, "#e9e2d2"); dome(x, b - 74, 40, 46, "#cfc6b4"); dome(x - 10, b - 80, 14, 34, "#ddd6c6"); R(x - 1.5, b - 132, 3, 12, "#b9a46a");
      for (const dx of [-84, 75]) { R(x + dx, b - 176, 9, 176, "#efe9dc"); R(x + dx - 2, b - 120, 13, 3, "#d4ccba"); R(x + dx - 2, b - 150, 13, 3, "#d4ccba"); P("#a8a294", x + dx - 1, b - 176, x + dx + 4.5, b - 196, x + dx + 10, b - 176); }
    },
    // GRECIA
    partenon(x, b) {
      P("#b7a98e", x - 132, b, x - 112, b - 42, x - 62, b - 62, x + 72, b - 64, x + 122, b - 42, x + 132, b);
      P("#a39579", x + 30, b - 64, x + 72, b - 64, x + 122, b - 42, x + 132, b, x + 80, b);
      R(x - 72, b - 72, 144, 8, "#ece4d2"); R(x - 76, b - 66, 152, 4, "#ddd4c0");
      for (let i = 0; i < 9; i++) { R(x - 66 + i * 16.5, b - 112, 8, 40, "#f3ecdc"); R(x - 61 + i * 16.5, b - 112, 3, 40, "#d6ccb6"); }
      R(x - 74, b - 120, 148, 8, "#ece4d2"); P("#f3ecdc", x - 76, b - 120, x, b - 138, x + 76, b - 120); P("#ddd3be", x - 60, b - 122, x, b - 134, x + 60, b - 122);
    },
    molinos(x, b) {
      for (const dx of [-62, 54]) {
        R(x + dx - 15, b - 72, 30, 72, "#f8f6f0"); R(x + dx + 6, b - 72, 9, 72, "#e2ded4"); P("#a07a4c", x + dx - 17, b - 72, x + dx, b - 94, x + dx + 17, b - 72);
        R(x + dx - 5, b - 22, 10, 22, "#2f6fb8"); R(x + dx - 4, b - 54, 7, 8, "#2f6fb8");
        for (let i = 0; i < 8; i++) { const a = i * (TAU / 8) + dx; L("#7a5a3a", 1, x + dx, b - 80, x + dx + Math.cos(a) * 34, b - 80 + Math.sin(a) * 34); P("#fbf8f0", x + dx + Math.cos(a) * 8, b - 80 + Math.sin(a) * 8, x + dx + Math.cos(a) * 33, b - 80 + Math.sin(a) * 33, x + dx + Math.cos(a + 0.28) * 30, b - 80 + Math.sin(a + 0.28) * 30); }
        O(x + dx, b - 80, 3, "#5a3a22");
      }
    },
    santorini(x, b) {
      for (const [dx, w, h] of [[-110, 40, 40], [-74, 34, 56], [60, 38, 46], [94, 34, 34]]) { R(x + dx, b - h, w, h, "#fbfaf6"); R(x + dx + w / 2 - 4, b - 14, 8, 14, "#2f6fb8"); win(x + dx + 6, b - h + 10, 7, 8, "#2f6fb8", dx); }
      R(x - 40, b - 64, 80, 64, "#fbfaf6"); R(x + 24, b - 64, 16, 64, "#e8e6e0"); arch(x - 9, b, 18, 30, "#2f6fb8");
      R(x - 24, b - 72, 48, 8, "#fbfaf6"); dome(x, b - 72, 28, 32, "#2f6fb8"); dome(x - 8, b - 76, 9, 22, "#4f8fd0"); R(x - 1, b - 114, 2, 12, "#e8e6e0"); R(x - 5, b - 110, 10, 2, "#e8e6e0");
      R(x + 44, b - 100, 22, 100, "#fbfaf6"); arch(x + 49, b - 64, 12, 20, "#8fb0d8"); dome(x + 55, b - 100, 11, 12, "#2f6fb8");
    },
    // ITALIA
    coliseo(x, b) {
      const t = "#d8c29a", d = "#a8915f";
      P(t, x - 116, b, x - 116, b - 122, x + 52, b - 122, x + 74, b - 102, x + 98, b - 70, x + 116, b - 38, x + 116, b);
      R(x - 116, b - 122, 168, 12, "#cdb68c");
      const top = (xx) => (xx < x + 52 ? b - 110 : xx < x + 74 ? b - 102 + (x + 74 - xx) * -0.9 + 0 : xx < x + 98 ? b - 70 - (x + 98 - xx) * 1.33 : b - 38 - (x + 116 - xx) * 1.8);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) {
        const xx = x - 108 + i * 19, yb = b - 4 - r * 34;
        if (yb - 26 < top(xx + 12)) continue;
        arch(xx, yb, 12, 26, d); R(xx + 13, yb - 28, 4, 28, "#e4d0aa");
      }
      for (let i = 0; i < 9; i++) R(x - 106 + i * 18, b - 118, 6, 5, "#a8915f");
    },
    pisa(x, b) {
      R(x - 118, b - 52, 84, 52, "#efe8d8"); P("#efe8d8", x - 118, b - 52, x - 76, b - 72, x - 34, b - 52); for (let i = 0; i < 6; i++) arch(x - 112 + i * 13, b - 6, 8, 18, "#c9bfa8");
      K.save(); K.translate(x + 20, b); K.rotate(0.09);
      R(-17, -150, 34, 150, "#f4efe2"); R(9, -150, 8, 150, "#ddd6c6");
      for (let i = 0; i < 7; i++) { const y = -10 - i * 20; R(-19, y - 2, 38, 3, "#e4dccb"); for (let j = 0; j < 5; j++) arch(-14 + j * 6.4, y - 4, 4, 12, "#c9bfa8"); }
      R(-11, -170, 22, 20, "#f4efe2"); for (let j = 0; j < 3; j++) arch(-8 + j * 6, -154, 4, 12, "#b9af98");
      K.restore();
    },
    vaticano(x, b) {
      R(x - 94, b - 62, 188, 62, "#e8e0cc"); for (let i = 0; i < 10; i++) R(x - 88 + i * 19, b - 58, 6, 52, "#f3ecdc");
      P("#ece4d2", x - 34, b - 62, x, b - 80, x + 34, b - 62); R(x - 96, b - 66, 192, 5, "#ddd3bc");
      R(x - 36, b - 100, 72, 34, "#e8e0cc"); for (let i = 0; i < 8; i++) R(x - 32 + i * 9, b - 96, 3, 28, "#d6ccb4");
      dome(x, b - 100, 42, 50, "#8fa6b2"); for (let i = -3; i <= 3; i++) L("#a9bec9", 1, x + i * 11, b - 100, x + i * 4, b - 146);
      R(x - 5, b - 160, 10, 12, "#e8e0cc"); O(x, b - 163, 4, "#c9a23a"); R(x - 0.8, b - 176, 1.6, 10, "#c9a23a"); R(x - 3.5, b - 172, 7, 1.6, "#c9a23a");
    },
    // FRANCIA
    eiffel(x, b) {
      const c = "#8a6a4e", l = "#a8886a";
      for (const s of [-1, 1]) {
        P(c, x + s * 58, b, x + s * 40, b, x + s * 14, b - 82, x + s * 24, b - 82);
        P(c, x + s * 25, b - 88, x + s * 13, b - 88, x + s * 4, b - 150, x + s * 10, b - 150);
        for (let i = 0; i < 4; i++) L(l, 0.7, x + s * (54 - i * 8), b - i * 20, x + s * (38 - i * 6.5), b - (i + 1) * 20);
      }
      K.strokeStyle = col(c); K.lineWidth = 4; K.beginPath(); K.ellipse(x, b - 30, 34, 44, 0, Math.PI * 1.05, Math.PI * 1.95); K.stroke();
      R(x - 36, b - 90, 72, 8, c); R(x - 16, b - 156, 32, 6, c);
      P(c, x - 9, b - 156, x + 9, b - 156, x + 3, b - 218, x - 3, b - 218); for (let y = b - 160; y > b - 214; y -= 9) L(l, 0.6, x - 7 + (b - 160 - y) * 0.1, y, x + 7 - (b - 160 - y) * 0.1, y - 6);
      R(x - 4, b - 222, 8, 5, c); R(x - 1, b - 236, 2, 14, c);
      if (lit()) for (let i = 0; i < 9; i++) { K.fillStyle = "rgba(255,206,110,0.8)"; K.fillRect(x - 30 + i * 7.5, b - 88, 3, 3); }
    },
    arco(x, b) {
      const s = "#e6dcc4", d = "#cfc3a5";
      R(x - 62, b - 124, 124, 124, s); R(x + 44, b - 124, 18, 124, "#d3c8ad");
      arch(x - 21, b, 42, 86, "#5e5446"); for (const dx of [-60, 46]) arch(x + dx, b - 30, 14, 34, "#6e6454");
      R(x - 66, b - 106, 132, 6, "#f0e8d4"); R(x - 62, b - 124, 124, 18, "#ded3b8"); for (let i = 0; i < 12; i++) R(x - 58 + i * 10, b - 120, 5, 8, d);
      R(x - 56, b - 84, 26, 30, d); R(x + 30, b - 84, 26, 30, d);
    },
    sacre(x, b) {
      E(x, b, 134, 44, "#6f9a5e", Math.PI, TAU); for (let i = 0; i < 6; i++) O(x - 100 + i * 40, b - 22 - Math.sin(i * 1.3) * 6, 10, "#5f8a50");
      const w = "#f8f6ee";
      R(x - 52, b - 84, 104, 44, w); for (let i = 0; i < 4; i++) arch(x - 42 + i * 24, b - 44, 12, 22, "#cfcac0");
      for (const dx of [-40, 40]) { R(x + dx - 9, b - 100, 18, 16, w); dome(x + dx, b - 100, 10, 14, w); }
      R(x - 18, b - 106, 36, 22, w); dome(x, b - 106, 22, 34, w); dome(x - 7, b - 110, 7, 26, "#e8e5dc"); R(x - 3, b - 148, 6, 10, w); O(x, b - 150, 3, w);
      R(x + 50, b - 136, 16, 52, w); dome(x + 58, b - 136, 9, 12, w);
    },
    // ESPAÑA
    sagrada(x, b) {
      const s = "#cdb48a", d = "#b49a70";
      R(x - 84, b - 72, 168, 72, s); R(x + 60, b - 72, 24, 72, d);
      for (let i = 0; i < 9; i++) arch(x - 76 + i * 17, b - 12, 9, 26, "#8a7656");
      for (const [dx, h, w, k] of [[-64, 150, 16, "#e8b84a"], [-42, 178, 18, "#d9583a"], [40, 178, 18, "#3f8fbf"], [62, 150, 16, "#e8b84a"], [-8, 218, 26, "#f2efe6"], [14, 198, 20, "#e8b84a"]]) {
        P(s, x + dx - w / 2, b - 62, x + dx + w / 2, b - 62, x + dx + w * 0.22, b - h, x + dx - w * 0.22, b - h);
        P(d, x + dx + w * 0.15, b - 62, x + dx + w / 2, b - 62, x + dx + w * 0.22, b - h);
        for (let y = b - 74; y > b - h + 12; y -= 10) E(x + dx, y, 1.4, 2.5, "#8a7656");
        O(x + dx, b - h - 4, w * 0.3, k);
      }
      L("#e0a12e", 2.5, x + 100, b, x + 100, b - 196); L("#e0a12e", 2, x + 64, b - 196, x + 150, b - 196); L("#9a9a9a", 0.8, x + 140, b - 196, x + 140, b - 160);
    },
    mancha(x, b) {
      E(x, b, 140, 36, "#b59c72", Math.PI, TAU);
      for (const dx of [-72, 0, 72]) {
        const y0 = b - 26 - (dx === 0 ? 8 : 0);
        P("#f8f6f0", x + dx - 13, y0, x + dx + 13, y0, x + dx + 10, y0 - 52, x + dx - 10, y0 - 52); P("#e2ded4", x + dx + 4, y0, x + dx + 13, y0, x + dx + 10, y0 - 52, x + dx + 3, y0 - 52);
        P("#4a4a50", x + dx - 12, y0 - 52, x + dx, y0 - 70, x + dx + 12, y0 - 52); R(x + dx - 4, y0 - 14, 8, 14, "#6b4a2b");
        K.save(); K.translate(x + dx, y0 - 58);
        for (let i = 0; i < 4; i++) { K.save(); K.rotate(0.5 + dx * 0.01 + i * Math.PI / 2); R(0, -1, 36, 2, "#5a3a22"); K.strokeStyle = col("#5a3a22"); K.lineWidth = 0.8; K.strokeRect(10, -5, 26, 8); for (let j = 1; j < 4; j++) L("#5a3a22", 0.6, 10 + j * 6.5, -5, 10 + j * 6.5, 3); K.restore(); }
        K.restore(); O(x + dx, y0 - 58, 2.5, "#3a2a1a");
      }
    },
    alhambra(x, b) {
      P("#7f9a5a", x - 132, b, x - 120, b - 40, x + 120, b - 46, x + 132, b);
      for (let i = 0; i < 8; i++) { R(x - 116 + i * 30, b - 54, 3, 18, "#5a4a2a"); O(x - 115 + i * 30, b - 60, 6, "#2f5a3a"); }
      const r = "#c87a52", d = "#a9603d";
      R(x - 116, b - 76, 232, 34, r); for (let i = 0; i < 23; i++) if (i % 2 === 0) R(x - 116 + i * 10, b - 82, 8, 6, r);
      for (const [dx, w, h] of [[-112, 30, 56], [-30, 46, 82], [52, 28, 60], [92, 26, 48]]) { R(x + dx, b - 42 - h, w, h, r); R(x + dx + w - 7, b - 42 - h, 7, h, d); for (let i = 0; i < Math.floor(w / 9); i++) R(x + dx + i * 9 + 1, b - 48 - h, 6, 6, r); win(x + dx + w / 2 - 3, b - 30 - h, 6, 10, "#5a3020", dx); }
    },
    // REPÚBLICA DOMINICANA
    faro(x, b) {
      const s = "#a9a39a", d = "#8f897f";
      if (lit()) {
        K.fillStyle = "rgba(255,246,206," + (0.22 * N).toFixed(3) + ")";
        K.beginPath(); K.moveTo(x - 7, b - 84); K.lineTo(x + 7, b - 84); K.lineTo(x + 14, 40); K.lineTo(x - 14, 40); K.closePath(); K.fill();
        K.fillRect(x - 96, 116, 192, 14);
      }
      R(x - 128, b - 30, 256, 30, s); R(x - 108, b - 50, 216, 20, "#b3ada4"); R(x - 82, b - 66, 164, 16, s); R(x - 28, b - 84, 56, 18, "#b9b3aa");
      for (const [w, y, h] of [[256, b - 30, 30], [216, b - 50, 20], [164, b - 66, 16]]) R(x + w / 2 - 14, y, 14, h, d);
      for (let i = 0; i < 10; i++) R(x - 120 + i * 25, b - 22, 12, 14, "#7a756c");
    },
    primada(x, b) {
      const s = "#d8b68a", d = "#bb9868";
      R(x - 72, b - 82, 144, 82, s); R(x + 52, b - 82, 20, 82, d);
      for (const dx of [-78, -30, 22, 70]) R(x + dx, b - 74, 9, 74, "#c9a67a");
      for (let i = 0; i < 14; i++) if (i % 2 === 0) R(x - 72 + i * 11, b - 88, 9, 6, s);
      arch(x - 22, b, 44, 58, "#e4c9a0"); arch(x - 16, b, 32, 48, "#c9a67a"); arch(x - 10, b, 20, 38, "#5f4a34");
      O(x, b - 70, 7, "#8a6a4a");
      R(x + 58, b - 108, 26, 26, s); arch(x + 64, b - 90, 14, 18, "#6a5238"); P(s, x + 58, b - 108, x + 71, b - 118, x + 84, b - 108);
    },
    alcazar(x, b) {
      const s = "#d9bd92", d = "#bfa274";
      R(x - 94, b - 78, 188, 78, s); R(x + 70, b - 78, 24, 78, d);
      for (let i = 0; i < 5; i++) { arch(x - 80 + i * 32, b, 22, 32, "#6a5438"); arch(x - 80 + i * 32, b - 42, 22, 30, "#6a5438"); }
      R(x - 96, b - 42, 192, 4, "#e6cda4"); for (let i = 0; i < 17; i++) if (i % 2 === 0) R(x - 94 + i * 11.5, b - 84, 9, 6, s);
      for (const dx of [-112, 94]) { R(x + dx, b - 96, 18, 96, s); for (let i = 0; i < 3; i++) R(x + dx + i * 6.5, b - 102, 5, 6, s); win(x + dx + 6, b - 80, 6, 10, "#5a4630", dx); }
    },
    // barco para los tramos de mar
    barco(x, b, k) {
      if (hsh(k, 21) < 0.5) {
        P("#ffffff", x - 90, b - 30, x + 92, b - 30, x + 80, b - 6, x - 82, b - 6); R(x - 84, b - 16, 164, 4, "#2f6fb8");
        R(x - 62, b - 46, 128, 16, "#fbfbfb"); R(x - 44, b - 58, 92, 12, "#f4f4f4"); R(x - 22, b - 68, 50, 10, "#f0f0f0");
        wins(x - 58, b - 42, 120, 8, 4, 4, 4, 4, "#3f5a78", k * 31); wins(x - 40, b - 55, 84, 6, 4, 3, 4, 3, "#3f5a78", k * 37);
        R(x + 20, b - 84, 12, 16, "#d0402f"); R(x + 20, b - 84, 12, 4, "#2a2a2a");
      } else {
        P("#7a4a2b", x - 50, b - 24, x + 54, b - 24, x + 42, b - 6, x - 40, b - 6); R(x - 1.5, b - 110, 3, 88, "#5a3a22");
        P("#fbf8ee", x + 2, b - 106, x + 46, b - 34, x + 2, b - 32); P("#f2ede0", x - 2, b - 98, x - 40, b - 34, x - 2, b - 32);
        P("#d63a32", x + 1, b - 120, x + 16, b - 115, x + 1, b - 110);
      }
    },
  };

  // ---------- grupos de edificios entre monumento y monumento ----------
  const SKY = {
    moderno(x, b, k, C) {
      for (let i = 0; i < 5; i++) {
        const w = 26 + hsh(k, i) * 18, h = 70 + hsh(k, i + 9) * 110, xx = x - 120 + i * 50 + hsh(k, i + 4) * 8, c = C.bc[(k + i) % C.bc.length];
        R(xx, b - h, w, h, c); R(xx + w - 6, b - h, 6, h, "#6f7e8c");
        wins(xx + 4, b - h + 6, w - 12, h - 10, 3, 4, 3, 5, "#d6e2ea", k * 50 + i * 7);
        if (hsh(k, i + 20) < 0.3) R(xx + w / 2 - 1, b - h - 14, 2, 14, "#8f8f8f");
      }
    },
    colonial(x, b, k, C) {
      for (let i = 0; i < 6; i++) {
        const w = 32 + hsh(k, i) * 14, h = 28 + hsh(k, i + 9) * 34, xx = x - 120 + i * 40, c = C.bc[(k + i) % C.bc.length];
        R(xx, b - h, w, h, c); P("#b8553c", xx - 3, b - h, xx + w / 2, b - h - 10, xx + w + 3, b - h);
        win(xx + 6, b - h + 10, 6, 9, "#6f5a46", k * 9 + i); win(xx + w - 12, b - h + 10, 6, 9, "#6f5a46", k * 9 + i + 50);
      }
      const tx = x - 10 + hsh(k, 30) * 40;
      R(tx, b - 104, 26, 104, "#ece3cf"); arch(tx + 7, b - 74, 12, 18, "#7a6650"); dome(tx + 13, b - 104, 14, 14, "#e0c28a"); R(tx + 12, b - 126, 2, 10, "#7a6650"); R(tx + 9, b - 122, 8, 2, "#7a6650");
    },
    europeo(x, b, k, C) {
      for (let i = 0; i < 5; i++) {
        const w = 38 + hsh(k, i) * 14, h = 54 + hsh(k, i + 9) * 40, xx = x - 120 + i * 50, c = C.bc[(k + i) % C.bc.length];
        R(xx, b - h, w, h, c);
        if (C.mansard) P("#6f7a86", xx - 2, b - h, xx + 4, b - h - 14, xx + w - 4, b - h - 14, xx + w + 2, b - h); else P("#b8553c", xx - 3, b - h, xx + w / 2, b - h - 12, xx + w + 3, b - h);
        wins(xx + 5, b - h + 8, w - 10, h - 14, 5, 8, 5, 8, "#5f6a78", k * 40 + i * 13);
      }
      const tx = x + 20 + hsh(k, 30) * 40;
      if (hsh(k, 31) < 0.5) { R(tx, b - 120, 22, 120, "#d9d0bc"); P("#7f8a96", tx - 2, b - 120, tx + 11, b - 160, tx + 24, b - 120); }
      else { R(tx - 10, b - 96, 40, 34, "#d9d0bc"); dome(tx + 10, b - 96, 22, 26, "#8fa6b2"); R(tx + 8, b - 130, 4, 10, "#d9d0bc"); }
    },
    oriental(x, b, k, C) {
      for (let i = 0; i < 4; i++) {
        const w = 46 + hsh(k, i) * 16, h = 36 + hsh(k, i + 9) * 30, xx = x - 118 + i * 60, c = C.bc[(k + i) % C.bc.length];
        R(xx, b - h, w, h, c); eave(xx + w / 2, b - h, w + 8, 8, C.roof || "#3a3f47");
        if (hsh(k, i + 40) < 0.5) { R(xx + 8, b - h - 22, w - 16, 14, c); eave(xx + w / 2, b - h - 22, w - 6, 7, C.roof || "#3a3f47"); }
        win(xx + 8, b - h + 10, 9, 8, "#f2e6c8", k * 7 + i);
      }
      if (C.modern) for (let i = 0; i < 2; i++) { const xx = x + 40 + i * 44, h = 120 + hsh(k, i + 70) * 60; R(xx, b - h, 30, h, "#9aa8b4"); wins(xx + 4, b - h + 6, 22, h - 10, 3, 4, 3, 5, "#dfe8ee", k * 20 + i); }
    },
    arabe(x, b, k, C) {
      for (let i = 0; i < 6; i++) {
        const w = 32 + hsh(k, i) * 14, h = 30 + hsh(k, i + 9) * 34, xx = x - 120 + i * 40, c = C.bc[(k + i) % C.bc.length];
        R(xx, b - h, w, h, c); R(xx - 1, b - h - 3, w + 2, 3, c);
        arch(xx + 6, b - h + 22, 7, 12, "#7a6650"); if (hsh(k, i + 50) < 0.4) dome(xx + w / 2, b - h - 2, w / 3, w / 3, c);
      }
      const tx = x + 30 + hsh(k, 30) * 50;
      R(tx, b - 140, 9, 140, "#ebe3d2"); R(tx - 2, b - 100, 13, 3, "#d2c8b2"); P("#c9bfa8", tx - 1, b - 140, tx + 4.5, b - 158, tx + 10, b - 140);
      R(tx - 40, b - 60, 40, 30, "#e2d8c4"); dome(tx - 20, b - 60, 22, 26, "#d8cdb6");
    },
    griego(x, b, k) {
      for (let i = 0; i < 7; i++) {
        const w = 28 + hsh(k, i) * 12, h = 26 + hsh(k, i + 9) * 34, xx = x - 120 + i * 35;
        R(xx, b - h, w, h, "#fbfaf6"); R(xx + w - 5, b - h, 5, h, "#e6e4de"); win(xx + 6, b - h + 8, 6, 7, "#2f6fb8", k * 11 + i);
        if (hsh(k, i + 30) < 0.25) dome(xx + w / 2, b - h, w / 3, w / 3, "#2f6fb8");
      }
    },
  };

  // ---------- casas (capa cercana) ----------
  function roofTile(x, b, w, h, c) {
    P(c || "#b8553c", x - 6, b - h + 2, x + 8, b - h - 14, x + w - 8, b - h - 14, x + w + 6, b - h + 2);
    for (let tx = x + 4; tx < x + w; tx += 8) L("#8e3b28", 1, tx, b - h - 12, tx - 2, b - h + 1);
  }
  function door(x, b, w, h, c) { arch(x, b, w, h, c); }
  const HOUSE = {
    colonial(x, b, w, k, C) {
      const h = 48 + hsh(k, 1) * 26, c = C.hc[k % C.hc.length];
      R(x, b - h, w, h, c); R(x, b - 8, w, 8, "#8a6a4a"); R(x + w - 8, b - h, 8, h - 8, mixHex(c, "#000000", 0.12));
      roofTile(x, b, w, h);
      door(x + w / 2 - 8, b - 8, 16, 26, "#7a4a2a");
      for (const [j, wx] of [[0, x + 7], [1, x + w - 22]]) { win(wx, b - h + 14, 15, 18, "#fff8e8", k * 5 + j); for (let i = 1; i < 4; i++) L("#5b4636", 1.1, wx + i * 3.8, b - h + 14, wx + i * 3.8, b - h + 32); }
    },
    balcon(x, b, w, k, C) {
      const h = 76 + hsh(k, 1) * 18, c = C.hc[k % C.hc.length];
      R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, mixHex(c, "#000000", 0.12)); R(x, b - 8, w, 8, "#8a6a4a");
      roofTile(x, b, w, h);
      door(x + 8, b - 8, 14, 28, "#6b4a2b"); win(x + w - 26, b - 34, 14, 18, "#fff8e8", k * 3);
      R(x + 4, b - h + 14, w - 8, 22, "#7a5232"); R(x + 2, b - h + 34, w - 4, 4, "#6b4a2b");
      for (let i = 0; i < Math.floor((w - 8) / 6); i++) R(x + 6 + i * 6, b - h + 26, 2, 8, "#5a3a22");
      win(x + 10, b - h + 16, 12, 10, "#fff2d4", k * 3 + 1); win(x + w - 24, b - h + 16, 12, 10, "#fff2d4", k * 3 + 2);
      if (hsh(k, 4) < 0.6) { E(x + w - 6, b - h + 8, 12, 7, "#3f8f4a"); for (let i = 0; i < 6; i++) O(x + w - 14 + i * 3.5, b - h + 6 + (i % 2) * 3, 2.4, "#e0569a"); }
    },
    tropical(x, b, w, k, C) {
      const h = 46 + hsh(k, 1) * 20, c = C.hc[k % C.hc.length];
      R(x, b - 6, w, 6, "#6b5a46"); R(x + 4, b - h, w - 8, h - 6, c); R(x + w - 12, b - h, 8, h - 6, mixHex(c, "#000000", 0.12));
      P("#9aa2a8", x - 6, b - h + 2, x + w / 2, b - h - 18, x + w + 6, b - h + 2);
      for (let i = 0; i < 7; i++) L("#7f878d", 0.8, x - 2 + i * (w + 4) / 7, b - h + 1, x + w / 2, b - h - 16);
      R(x + w / 2 - 7, b - 30, 14, 24, "#7a5232");
      for (const [j, wx] of [[0, x + 8], [1, x + w - 24]]) { win(wx, b - h + 12, 16, 14, "#e8f2f0", k * 7 + j); for (let i = 1; i < 4; i++) L("#6b5a46", 0.8, wx, b - h + 12 + i * 3.5, wx + 16, b - h + 12 + i * 3.5); }
    },
    mexicana(x, b, w, k, C) {
      const h = 44 + hsh(k, 1) * 26, c = C.hc[k % C.hc.length];
      R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, mixHex(c, "#000000", 0.12)); R(x - 2, b - h - 4, w + 4, 6, mixHex(c, "#ffffff", 0.3));
      const dc = C.hc[(k + 2) % C.hc.length];
      R(x + w / 2 - 10, b - 32, 20, 32, mixHex(dc, "#ffffff", 0.25)); R(x + w / 2 - 7, b - 29, 14, 29, "#7a4a2a");
      win(x + 7, b - h + 12, 13, 14, "#fff2d4", k * 4); R(x + 5, b - h + 10, 17, 3, mixHex(dc, "#ffffff", 0.25));
      // papel picado
      L("#5a4a3a", 0.6, x, b - h - 8, x + w, b - h - 4);
      const pc = ["#e5533d", "#ffd23f", "#3f9a52", "#2f6fd0", "#e0569a"];
      for (let i = 0; i < Math.floor(w / 9); i++) { const xx = x + 3 + i * 9, y = b - h - 8 + (i * 9 / w) * 4; P(pc[(i + k) % 5], xx, y, xx + 7, y, xx + 7, y + 7, xx + 3.5, y + 9, xx, y + 7); }
    },
    brownstone(x, b, w, k) {
      const h = 78 + hsh(k, 1) * 10, c = ["#8a4a3a", "#7a3f30", "#9a5a44", "#6f4a3a"][k % 4];
      R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, mixHex(c, "#000000", 0.15)); R(x - 3, b - h - 6, w + 6, 6, "#d8cfc0");
      for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) { const wx = x + 6 + i * ((w - 12) / 3), y = b - h + 10 + f * 24; R(wx - 1, y - 1, (w - 12) / 3 - 4, 18, "#e8e0d0"); win(wx + 1, y + 1, (w - 12) / 3 - 8, 14, "#3f4a56", k * 9 + f * 3 + i); }
      P("#c9bfae", x + w / 2 - 12, b, x + w / 2 + 12, b, x + w / 2 + 8, b - 16, x + w / 2 - 8, b - 16); R(x + w / 2 - 6, b - 34, 12, 18, "#3a2a22");
      if (hsh(k, 6) < 0.5) for (let f = 0; f < 1; f++) { L("#2a2a2e", 1.2, x + 4, b - h + 34 + f * 26, x + w - 4, b - h + 34 + f * 26); L("#2a2a2e", 0.8, x + 8, b - h + 34 + f * 26, x + w - 8, b - h + 60 + f * 26); }
    },
    japonesa(x, b, w, k) {
      const h = 52 + hsh(k, 1) * 14;
      R(x, b - h, w, h, "#f2ede2"); R(x, b - 22, w, 22, "#7a5a3c");
      for (let i = 0; i <= 4; i++) R(x + i * (w - 3) / 4, b - h, 3, h, "#5a4030"); R(x, b - h + 16, w, 3, "#5a4030");
      win(x + 8, b - h + 4, w - 16, 10, "#f6ecd4", k);
      eave(x + w / 2, b - h, w + 16, 12, "#3a3f47"); eave(x + w / 2, b - 22, w + 8, 6, "#454a52");
      R(x + w / 2 - 10, b - 20, 20, 12, "#c0392b"); for (let i = 1; i < 3; i++) L("#ffffff", 0.6, x + w / 2 - 10 + i * 6.6, b - 20, x + w / 2 - 10 + i * 6.6, b - 10);
      if (lit()) { K.fillStyle = "rgba(255,190,110,0.85)"; K.beginPath(); K.ellipse(x + 8, b - 30, 4, 6, 0, 0, TAU); K.fill(); }
      else E(x + 8, b - 30, 4, 6, "#f4e8d0");
    },
    china(x, b, w, k) {
      const h = 50 + hsh(k, 1) * 12;
      R(x, b - h, w, h, "#9a9a96"); for (let y = b - h + 6; y < b; y += 6) L("#8a8a86", 0.5, x, y, x + w, y);
      R(x + 4, b - h, 5, h, "#b8322a"); R(x + w - 9, b - h, 5, h, "#b8322a");
      R(x + w / 2 - 9, b - 30, 18, 30, "#b8322a"); O(x + w / 2 - 3, b - 16, 1.2, "#e5b53a"); O(x + w / 2 + 3, b - 16, 1.2, "#e5b53a");
      win(x + 12, b - h + 12, 12, 12, "#f2d8a8", k * 3);
      eave(x + w / 2, b - h, w + 18, 12, "#5a5f66"); R(x - 6, b - h - 13, w + 12, 3, "#4a4f55");
      for (const dx of [8, w - 8]) { L("#5a3a22", 0.7, x + dx, b - h, x + dx, b - h + 8); if (lit()) { K.fillStyle = "rgba(255,110,80,0.95)"; K.beginPath(); K.ellipse(x + dx, b - h + 13, 5, 6, 0, 0, TAU); K.fill(); } else E(x + dx, b - h + 13, 5, 6, "#e0362a"); R(x + dx - 2, b - h + 5, 4, 2, "#e5b53a"); }
    },
    india(x, b, w, k, C) {
      const h = 52 + hsh(k, 1) * 30, c = C.hc[k % C.hc.length];
      R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, mixHex(c, "#000000", 0.12)); R(x - 2, b - h - 4, w + 4, 5, mixHex(c, "#ffffff", 0.3));
      for (let i = 0; i < Math.floor(w / 10); i++) R(x + i * 10, b - h - 9, 6, 5, mixHex(c, "#ffffff", 0.3));
      arch(x + w / 2 - 8, b, 16, 26, "#6a4a2a");
      R(x + 6, b - h + 12, 22, 16, mixHex(c, "#ffffff", 0.35)); win(x + 9, b - h + 15, 16, 10, "#7a5a3a", k); dome(x + 17, b - h + 12, 11, 7, mixHex(c, "#ffffff", 0.35));
      if (hsh(k, 7) < 0.5) { R(x + w - 26, b - h - 18, 16, 14, mixHex(c, "#ffffff", 0.35)); dome(x + w - 18, b - h - 18, 9, 9, mixHex(c, "#ffffff", 0.2)); }
    },
    adobe(x, b, w, k) {
      const h = 40 + hsh(k, 1) * 26, c = ["#d9bf92", "#cfb283", "#e2cba0"][k % 3];
      R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, mixHex(c, "#000000", 0.12)); R(x - 2, b - h - 3, w + 4, 4, mixHex(c, "#ffffff", 0.2));
      arch(x + w / 2 - 7, b, 14, 24, "#6a4a2a");
      arch(x + 8, b - h + 26, 9, 14, lit() && hsh(k, 2) < 0.6 ? "#e8b860" : "#5a4630");
      if (hsh(k, 5) < 0.5) { R(x + w - 26, b - h + 10, 16, 16, "#8a5a32"); for (let i = 1; i < 4; i++) { L("#5a3a1e", 0.6, x + w - 26 + i * 4, b - h + 10, x + w - 26 + i * 4, b - h + 26); L("#5a3a1e", 0.6, x + w - 26, b - h + 10 + i * 4, x + w - 10, b - h + 10 + i * 4); } }
      if (hsh(k, 8) < 0.35) dome(x + w / 2, b - h - 2, w / 4, w / 5, c);
    },
    griega(x, b, w, k) {
      const h = 40 + hsh(k, 1) * 24;
      R(x, b - h, w, h, "#fbfaf6"); R(x + w - 7, b - h, 7, h, "#e8e6e0");
      R(x + w / 2 - 8, b - 28, 16, 28, "#2f6fb8"); win(x + 7, b - h + 10, 12, 12, "#2f6fb8", k);
      if (hsh(k, 3) < 0.4) { dome(x + w / 2, b - h, w * 0.3, w * 0.3, "#2f6fb8"); R(x + w / 2 - 1, b - h - w * 0.3 - 8, 2, 8, "#e8e6e0"); }
      else R(x - 2, b - h - 3, w + 4, 4, "#f2f0ea");
      if (hsh(k, 4) < 0.5) { E(x + 4, b - h + 4, 10, 8, "#3f8f4a"); for (let i = 0; i < 5; i++) O(x - 2 + i * 3.6, b - h + 2 + (i % 2) * 3, 2.3, "#d6438a"); }
    },
    italiana(x, b, w, k) {
      const h = 70 + hsh(k, 1) * 10, c = ["#d9a05a", "#e3b779", "#c9724a", "#e8c99a"][k % 4];
      R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, mixHex(c, "#000000", 0.12)); P("#b8553c", x - 5, b - h + 2, x + 4, b - h - 8, x + w - 4, b - h - 8, x + w + 5, b - h + 2);
      for (let f = 0; f < 2; f++) for (let i = 0; i < 2; i++) { const wx = x + 8 + i * (w - 30), y = b - h + 12 + f * 24; win(wx + 4, y, 8, 14, "#4a3a2a", k * 6 + f * 2 + i); R(wx, y, 4, 14, "#3f7a4a"); R(wx + 12, y, 4, 14, "#3f7a4a"); if (f === 1) { R(wx, y + 14, 16, 3, "#8a5a3a"); for (let j = 0; j < 4; j++) O(wx + 2 + j * 4, y + 13, 1.8, "#d9383a"); } }
      arch(x + w / 2 - 8, b, 16, 26, "#5a3a22");
    },
    parisina(x, b, w, k) {
      const h = 82 + hsh(k, 1) * 8, c = ["#ece2c8", "#e4d9bd", "#efe6cf"][k % 3];
      R(x, b - h, w, h, c); R(x + w - 7, b - h, 7, h, mixHex(c, "#000000", 0.1));
      P("#6f7a86", x - 2, b - h, x + 6, b - h - 20, x + w - 6, b - h - 20, x + w + 2, b - h);
      for (let i = 0; i < 2; i++) { R(x + 10 + i * (w - 32), b - h - 16, 12, 12, "#e8e0cc"); win(x + 12 + i * (w - 32), b - h - 14, 8, 9, "#4a5260", k * 4 + i); }
      R(x + w - 14, b - h - 30, 8, 12, "#b8553c");
      for (let f = 0; f < 3; f++) { const y = b - h + 8 + f * 21; for (let i = 0; i < 3; i++) win(x + 6 + i * ((w - 12) / 3), y, (w - 12) / 3 - 6, 13, "#4a5260", k * 12 + f * 3 + i); if (f === 0 || f === 2) { R(x + 2, y + 14, w - 4, 2, "#2a2a2e"); for (let j = 0; j < Math.floor(w / 4); j++) R(x + 3 + j * 4, y + 9, 1, 5, "#2a2a2e"); } }
      R(x, b - 26, w, 26, mixHex(c, "#000000", 0.06)); arch(x + w / 2 - 8, b, 16, 22, "#3a3a44");
    },
    andaluza(x, b, w, k) {
      if (k % 3 === 0) {
        const h = 82 + hsh(k, 1) * 8, c = "#e0cfae";
        R(x, b - h, w, h, c); R(x + w - 8, b - h, 8, h, "#c9b892"); R(x - 2, b - h - 5, w + 4, 6, "#d6c49e");
        for (let f = 0; f < 3; f++) { const y = b - h + 10 + f * 20; for (let i = 0; i < 3; i++) win(x + 6 + i * ((w - 12) / 3), y, (w - 12) / 3 - 6, 13, "#4a3f36", k * 13 + f * 3 + i); R(x + 3, y + 14, w - 6, 2, "#2a2a2e"); }
        arch(x + w / 2 - 8, b, 16, 24, "#5a3a22");
        return;
      }
      const h = 46 + hsh(k, 1) * 16;
      R(x, b - h, w, h, "#fbf9f2"); R(x + w - 7, b - h, 7, h, "#e8e4d8"); R(x, b - 8, w, 8, "#e6c070");
      roofTile(x, b, w, h, "#c4683f");
      arch(x + w / 2 - 8, b - 8, 16, 26, "#6b4a2b");
      for (const [j, wx] of [[0, x + 7], [1, x + w - 21]]) { win(wx, b - h + 14, 14, 16, "#3a3a3a", k * 3 + j); for (let i = 1; i < 4; i++) L("#1e1e22", 1, wx + i * 3.5, b - h + 14, wx + i * 3.5, b - h + 30); }
      for (let i = 0; i < 3; i++) { const px = x + 10 + i * ((w - 20) / 2); R(px - 3, b - h + 2, 6, 5, "#2f6fb8"); O(px, b - h + 1, 3, "#d9383a"); }
    },
  };
  function mixHex(a, b, f) { const A = hexRgb(a), B = hexRgb(b); return "#" + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * f).toString(16).padStart(2, "0")).join(""); }

  // ---------- árboles ----------
  const TREE = {
    palma(x, b) {
      K.strokeStyle = col("#8a6234"); K.lineWidth = 5; K.lineCap = "round"; K.beginPath(); K.moveTo(x, b); K.quadraticCurveTo(x + 8, b - 50, x + 2, b - 96); K.stroke();
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.62; E(x + 2 + Math.cos(a) * 16, b - 92 + Math.sin(a) * 9, 20, 5.5, i % 2 ? "#3f9a52" : "#4aa85c", 0, TAU, a); }
      O(x + 2, b - 95, 4, "#6b4a25");
    },
    araguaney(x, b) { R(x - 3, b - 54, 6, 54, "#6b4a2b"); for (const [dx, dy, r] of [[0, -70, 24], [-18, -60, 16], [18, -60, 17], [-8, -84, 14], [10, -82, 14]]) O(x + dx, b + dy, r, dy < -75 ? "#ffd84a" : "#f2c71e"); },
    flamboyan(x, b) { R(x - 3, b - 46, 6, 46, "#6b4a2b"); E(x, b - 56, 40, 16, "#3f7a3a"); for (let i = 0; i < 9; i++) O(x - 34 + i * 8.5, b - 62 - Math.sin(i * 1.3) * 5, 7, i % 2 ? "#e4472f" : "#f05a2a"); },
    pino(x, b) { R(x - 2.5, b - 80, 5, 80, "#5a3a22"); for (let i = 0; i < 4; i++) E(x + (i % 2 ? 6 : -6), b - 92 + i * 16, 16 - i, 8, i % 2 ? "#2f5f3a" : "#3a6f44"); E(x, b - 104, 9, 8, "#3a6f44"); },
    cactus(x, b) { R(x - 5, b - 58, 10, 58, "#4f8f4a"); R(x - 18, b - 40, 8, 22, "#4f8f4a"); R(x - 18, b - 24, 16, 6, "#4f8f4a"); R(x + 10, b - 48, 8, 18, "#4f8f4a"); R(x + 4, b - 34, 14, 6, "#4f8f4a"); for (let y = b - 54; y < b - 4; y += 8) L("#3f7a3a", 0.6, x, y, x, y + 4); },
    roble(x, b) { R(x - 3, b - 44, 6, 44, "#6b4a2b"); O(x, b - 64, 26, "#4f8f45"); O(x - 14, b - 54, 16, "#5c9a50"); O(x + 14, b - 56, 17, "#447f3c"); },
    sakura(x, b) { R(x - 3, b - 40, 6, 40, "#4a3028"); L("#4a3028", 2, x, b - 34, x - 14, b - 52); L("#4a3028", 2, x, b - 38, x + 14, b - 54); for (const [dx, dy, r] of [[0, -62, 20], [-18, -54, 15], [18, -56, 16], [-6, -74, 13], [10, -72, 13]]) O(x + dx, b + dy, r, dy < -66 ? "#fbd0dc" : "#f6b5c8"); },
    sauce(x, b) { R(x - 3, b - 54, 6, 54, "#5a4a32"); O(x, b - 66, 20, "#7fae5a"); for (let i = 0; i < 9; i++) L("#6f9f4a", 1.6, x - 20 + i * 5, b - 62, x - 22 + i * 5.4, b - 22 - (i % 3) * 6); },
    cipres(x, b) { R(x - 2, b - 10, 4, 10, "#4a3a2a"); K.fillStyle = col("#2f5a3a"); K.beginPath(); K.moveTo(x, b - 104); K.quadraticCurveTo(x + 13, b - 50, x + 7, b - 8); K.lineTo(x - 7, b - 8); K.quadraticCurveTo(x - 13, b - 50, x, b - 104); K.fill(); L("#3f6f48", 0.8, x + 2, b - 90, x + 4, b - 20); },
    olivo(x, b) { L("#6f6250", 5, x, b, x - 3, b - 22, x + 2, b - 34); O(x, b - 46, 20, "#8fa070"); O(x - 16, b - 40, 13, "#9aab7a"); O(x + 16, b - 42, 14, "#7f9262"); },
    pinonero(x, b) { L("#7a5a3a", 4, x, b, x + 4, b - 60, x + 2, b - 92); E(x + 2, b - 98, 38, 12, "#2f5f3a"); E(x - 6, b - 104, 26, 8, "#3f7044"); },
    platano(x, b) { R(x - 3.5, b - 50, 7, 50, "#b5a88a"); for (let y = b - 46; y < b; y += 9) R(x - 3, y, 4, 4, "#8f8670"); O(x, b - 70, 26, "#5f9a48"); O(x - 18, b - 60, 16, "#6aa652"); O(x + 18, b - 62, 17, "#538c40"); },
    datilera(x, b) { R(x - 3, b - 92, 6, 92, "#8a6a42"); for (let y = b - 88; y < b; y += 6) L("#6b4a2b", 0.8, x - 3, y, x + 3, y + 2); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5; L("#4f8f45", 3, x, b - 92, x + Math.cos(a) * 26, b - 92 + Math.sin(a) * 18 + 10); } O(x, b - 88, 4, "#c9862a"); },
    banyan(x, b) { R(x - 5, b - 46, 10, 46, "#6b5a46"); for (const dx of [-22, -12, 14, 24]) L("#7a6a56", 1, x + dx, b - 52, x + dx, b); E(x, b - 62, 44, 22, "#3f7a3a"); O(x - 18, b - 72, 16, "#4f8a45"); O(x + 16, b - 74, 17, "#4a8440"); },
    naranjo(x, b) { R(x - 3, b - 30, 6, 30, "#6b4a2b"); O(x, b - 46, 20, "#3f8a3a"); for (const [dx, dy] of [[-8, -50], [7, -54], [-2, -40], [10, -42], [-12, -40]]) O(x + dx, b + dy, 2.6, "#f29a2a"); },
  };

  // ---------- la ruta ----------
  const G_CITY = { grass: "#5cb85c", grass2: "#3f8f44", tile: "#e6d6b8", line: "#d2c09f", curb: "#bdb3a2", road: "#4a4f5a" };
  const G_BEACH = { grass: "#e9cf8f", grass2: "#d7b874", tile: "#f3e3b6", line: "#e4cf98", curb: "#d9c391", road: "#3f7fa6" };
  const G_VILLAGE = { grass: "#8fc46a", grass2: "#6aa04d", tile: "#d8cfbf", line: "#bfb4a1", curb: "#c4a483", road: "#8a6f55" };
  const g = (base, o) => Object.assign({}, base, o || {});
  const ROUTE = [
    { id: "ve", name: "VENEZUELA", city: "Caracas", t: 0, life: 0, col: 0, mus: 0, sea: "el mar Caribe",
      far: { k: "montes", c: "#4f8d5f", a: 1.2 }, mids: ["parque", "capitolio", "panteon"], sky: "moderno", bc: ["#c9c2b4", "#b8c4cc", "#d6cdb8", "#a9b8c4"],
      hs: "colonial", hc: ["#f2c14e", "#e87d5a", "#7fb7d9", "#f4a6b8", "#9ad08a"], trees: ["palma", "araguaney", "palma"], tp: 0.4, g: g(G_CITY) },
    { id: "co", name: "COLOMBIA", city: "Cartagena de Indias", t: 0, life: 0, col: 0, mus: 1,
      far: { k: "andes", c: "#5a8f62", a: 1.05, snow: 150 }, mids: ["reloj", "murallas", "claver"], sky: "colonial", bc: ["#f2c14e", "#e8946a", "#7fc4c9", "#f4a6b8", "#e8d8b0"],
      hs: "balcon", hc: ["#f2b43a", "#e85a6a", "#4fb8c9", "#f08a3a", "#8ac46a", "#e8a8c8"], trees: ["palma", "flamboyan"], tp: 0.3, g: g(G_CITY, { tile: "#e8d2a8", line: "#d4bb8c" }) },
    { id: "pa", name: "PANAMÁ", city: "Ciudad de Panamá", t: 5, life: 0, col: 0, mus: 1,
      far: { k: "montes", c: "#3d7d4d", a: 0.8 }, mids: ["puente", "tornillo", "canal"], sky: "moderno", bc: ["#7fa9c4", "#9cc0d6", "#b8c8d2", "#6f98b8"],
      hs: "tropical", hc: ["#f2e3b6", "#bfe0d0", "#f4c8a8", "#d0e0f0", "#f2d0e0"], trees: ["palma", "banyan", "palma"], tp: 0.45, g: g(G_CITY) },
    { id: "hn", name: "HONDURAS", city: "Copán y Tegucigalpa", t: 3, life: 3, col: 3, mus: 3,
      far: { k: "montes", c: "#47785a", a: 1.15 }, mids: ["copan", "tegus", "picacho"], sky: "colonial", bc: ["#f6f4ee", "#e8d8b0", "#f2c14e", "#d8e8d0"],
      hs: "colonial", hc: ["#f6f1e2", "#f2d38a", "#e8b28a", "#bfd8e8", "#f4c8b8"], trees: ["pino", "pino", "roble"], tp: 0.45, g: g(G_VILLAGE) },
    { id: "mx", name: "MÉXICO", city: "Chichén Itzá y la capital", t: 3, life: 0, col: 3, mus: 3,
      far: { k: "volcanes", c: "#6f7f8f", a: 1, snow: 135 }, mids: ["chichen", "angel", "bellas"], sky: "colonial", bc: ["#e8946a", "#f2c14e", "#e86a9a", "#7fc4c9", "#f3efe6"],
      hs: "mexicana", hc: ["#e8457a", "#2f8fd0", "#ffc83a", "#3fb58a", "#f07a3a", "#9a5ac8"], trees: ["cactus", "cactus", "palma"], tp: 0.4, g: g(G_VILLAGE, { tile: "#e0c9a6", line: "#cbb085", road: "#7a6a58" }) },
    { id: "us", name: "ESTADOS UNIDOS", city: "Nueva York y San Francisco", t: 5, life: 0, col: 0, mus: 2,
      far: { k: "colinas", c: "#6f8fa6", a: 1 }, mids: ["libertad", "empire", "golden"], sky: "moderno", bc: ["#b8b2a6", "#9aa8b4", "#c2bcb0", "#8a96a2"],
      hs: "brownstone", hc: ["#8a4a3a"], trees: ["roble", "platano"], tp: 0.3, g: g(G_CITY, { tile: "#cfcac2", line: "#b9b4ac", curb: "#a9a49c", road: "#3f4248" }) },
    { id: "jp", name: "JAPÓN", city: "Tokio y el monte Fuji", t: 5, life: 3, col: 0, mus: 2, sea: "el océano Pacífico",
      far: { k: "fuji", c: "#6a7fa0", a: 1, snow: 120 }, mids: ["pagoda", "torii", "tokyo"], sky: "oriental", modern: true, bc: ["#f2ede2", "#d8cfc0", "#e8e2d4"],
      hs: "japonesa", hc: ["#f2ede2"], trees: ["sakura", "sakura", "pino"], tp: 0.45, g: g(G_CITY, { grass: "#6fb05a", tile: "#d4d0c8", line: "#bdb8ae", curb: "#a8a49c", road: "#4f5258" }) },
    { id: "cn", name: "CHINA", city: "Pekín y Guilin", t: 5, life: 0, col: 0, mus: 2,
      far: { k: "karst", c: "#5f8f7a", a: 1, wall: true }, mids: ["cielo", "pagodachina", "tiananmen"], sky: "oriental", roof: "#5a5f66", modern: true, bc: ["#9a9a96", "#b8322a", "#c4b096"],
      hs: "china", hc: ["#9a9a96"], trees: ["sauce", "pino", "sauce"], tp: 0.35, g: g(G_CITY, { tile: "#cfc7b8", line: "#b8ae9c", road: "#55565c" }) },
    { id: "in", name: "INDIA", city: "Agra, Jaipur y Bombay", t: 3, life: 3, col: 3, mus: 3,
      far: { k: "colinas", c: "#a8957a", a: 0.9 }, mids: ["taj", "gateway", "hawa"], sky: "arabe", bc: ["#f0e2c8", "#e8b89a", "#f2d0a0", "#e4c8d8"],
      hs: "india", hc: ["#f0a030", "#e87a9a", "#3fb5b0", "#5a8fd0", "#f2d04a", "#e85a4a"], trees: ["banyan", "palma", "datilera"], tp: 0.35, g: g(G_VILLAGE, { tile: "#e3cfa8", line: "#cdb689", grass: "#7fb04f", road: "#6a6158" }) },
    { id: "eg", name: "EGIPTO", city: "El Cairo y Guiza", t: 3, life: 0, col: 3, mus: 3,
      far: { k: "dunas", c: "#d9b27a", a: 1 }, mids: ["piramides", "esfinge", "mezquita"], sky: "arabe", bc: ["#e2d0a8", "#d8c49a", "#e8dcc0"],
      hs: "adobe", hc: ["#d9bf92"], trees: ["datilera", "datilera", "palma"], tp: 0.35, g: g(G_VILLAGE, { grass: "#d9c08a", grass2: "#c4a86e", tile: "#e8d7ae", line: "#d2bf92", curb: "#c9b084", road: "#6a6155" }) },
    { id: "gr", name: "GRECIA", city: "Atenas y las islas", t: 3, life: 1, col: 3, mus: 2, sea: "el mar Mediterráneo",
      far: { k: "colinas", c: "#9aa08a", a: 1.1 }, mids: ["partenon", "molinos", "santorini"], sky: "griego", bc: ["#fbfaf6"],
      hs: "griega", hc: ["#fbfaf6"], trees: ["olivo", "cipres", "olivo"], tp: 0.35, g: g(G_VILLAGE, { tile: "#f2efe6", line: "#d9d4c8", curb: "#cfc9bb", road: "#5a5a60" }) },
    { id: "it", name: "ITALIA", city: "Roma y Pisa", t: 4, life: 3, col: 4, mus: 2, sea: "el mar Jónico",
      far: { k: "colinas", c: "#7f9a6a", a: 1 }, mids: ["coliseo", "pisa", "vaticano"], sky: "europeo", bc: ["#d9a05a", "#e3b779", "#c9724a", "#e8c99a"],
      hs: "italiana", hc: ["#d9a05a"], trees: ["cipres", "pinonero", "cipres"], tp: 0.4, g: g(G_VILLAGE, { tile: "#d9c3a0", line: "#c4ab82", road: "#5f5a55" }) },
    { id: "fr", name: "FRANCIA", city: "París", t: 4, life: 0, col: 4, mus: 2,
      far: { k: "colinas", c: "#7f9f7a", a: 0.85 }, mids: ["eiffel", "arco", "sacre"], sky: "europeo", mansard: true, bc: ["#ece2c8", "#e4d9bd", "#efe6cf"],
      hs: "parisina", hc: ["#ece2c8"], trees: ["platano", "platano"], tp: 0.3, g: g(G_CITY, { tile: "#d6d0c4", line: "#bfb8aa", curb: "#aaa396", road: "#4f5056" }) },
    { id: "es", name: "ESPAÑA", city: "Barcelona y Andalucía", t: 4, life: 4, col: 4, mus: 4,
      far: { k: "montes", c: "#8f9a6a", a: 0.9 }, mids: ["sagrada", "mancha", "alhambra"], sky: "europeo", bc: ["#e0cfae", "#f4f0e6", "#d8c4a0"],
      hs: "andaluza", hc: ["#fbf9f2"], trees: ["olivo", "naranjo", "palma"], tp: 0.35, g: { grass: "#7fb85e", grass2: "#5c9a46", tile: "#cdc8bf", line: "#b3ada2", curb: "#a8a196", road: "#56575d", panot: true } },
    { id: "do", name: "REPÚBLICA DOMINICANA", city: "Santo Domingo", t: 1, life: 1, col: 1, mus: 1, sea: "el océano Atlántico",
      far: { k: "montes", c: "#4f8f5a", a: 0.9 }, mids: ["faro", "primada", "alcazar"], sky: "colonial", bc: ["#f2c14e", "#7fc4c9", "#f4a6b8", "#e8d8b0"],
      hs: "colonial", hc: ["#f2a8c8", "#7fd0c9", "#f2d04a", "#a8d08a", "#f4b08a"], trees: ["palma", "flamboyan", "palma"], tp: 0.45, g: g(G_BEACH) },
  ];
  ROUTE.forEach((r, i) => { r.g.t = r.t; r.g.i = i; });

  // ---------- el relieve lejano ----------
  const SEA_COL = "#5aa2c8";
  function relief(kind, p, s, a) {
    switch (kind) {
      case "andes": return (70 + 62 * Math.abs(Math.sin(p / 150 + s)) + 34 * Math.abs(Math.sin(p / 61 + s * 2)) + 9 * Math.sin(p / 19)) * a;
      case "volcanes": { const q = ((p + s * 300) % 640 + 640) % 640, cone = Math.max(0, 1 - Math.abs(q - 320) / 170); return (36 + 16 * Math.sin(p / 90 + s) + 130 * Math.pow(cone, 1.25)) * a; }
      case "fuji": { const q = ((p + s * 200) % 900 + 900) % 900, cone = Math.max(0, 1 - Math.abs(q - 450) / 260); return (28 + 12 * Math.sin(p / 80 + s) + 160 * Math.pow(cone, 1.1)) * a; }
      case "karst": { const q = ((p + s * 100) % 58 + 58) % 58, k = Math.floor((p + s * 100) / 58), hh = 70 + 60 * Math.abs(Math.sin(k * 2.3 + s)); const bump = Math.max(0, 1 - Math.pow((q - 29) / 26, 2)); return (26 + hh * Math.pow(bump, 0.45)) * a; }
      case "dunas": return (24 + 18 * Math.sin(p / 130 + s) + 9 * Math.sin(p / 47 + s * 3)) * a;
      case "colinas": return (42 + 26 * Math.sin(p / 150 + s) + 13 * Math.sin(p / 61 + s * 2) + 5 * Math.sin(p / 23)) * a;
      case "mar": return 0;
      default: return (70 + 46 * Math.sin(p / 170 + s) + 24 * Math.sin(p / 63 + s * 2) + 10 * Math.sin(p / 27 + s)) * a;
    }
  }
  const BAND = 150;
  function farH(segs, p, back) {
    const idx = segAt(segs, p), here = (i) => { const c = segs[i].c; if (c < 0) return 0; const F = ROUTE[c].far; return relief(F.k, p, c * 1.7 + (back ? 3 : 0), F.a * (back ? 1.18 : 1)); };
    let h = here(idx);
    const d0 = p - segs[idx].x, d1 = idx + 1 < segs.length ? segs[idx + 1].x - p : Infinity;
    if (idx > 0 && d0 < BAND / 2) h = here(idx - 1) + (h - here(idx - 1)) * smooth(0.5 + d0 / BAND);
    if (d1 < BAND / 2) h = here(idx + 1) + (h - here(idx + 1)) * smooth(0.5 + d1 / BAND);
    return h;
  }
  function segAt(segs, p) { let i = 0; while (i + 1 < segs.length && segs[i + 1].x <= p) i++; return i; }
  const farCol = (c) => (c < 0 ? SEA_COL : ROUTE[c].far.c);
  function drawFar(f, base, back, pal) {
    const p0 = S.scroll * f, segs = segsFor(f);
    const path = new Path2D();
    path.moveTo(-6, LH);
    for (let x = -6; x <= LW + 6; x += 6) path.lineTo(x, base - farH(segs, p0 + x, back));
    path.lineTo(LW + 6, LH); path.closePath();
    HZ = back ? pal.bottom : pal.mount; HA = back ? 0.62 : 0.5;
    const n0 = N; N = n0 * 0.55;
    const vis = segs.filter((s, i) => i > 0 && s.x - p0 > -BAND && s.x - p0 < LW + BAND);
    if (!vis.length) K.fillStyle = col(farCol(segs[segAt(segs, p0 + LW / 2)].c));
    else {
      const gr = K.createLinearGradient(0, 0, LW, 0);
      let last = -1;
      const add = (x, c) => { const t = Math.max(0, Math.min(1, x / LW)); if (t >= last) { gr.addColorStop(t, col(farCol(c))); last = t; } };
      add(0, segs[segAt(segs, p0)].c);
      for (const s of vis) { const i = segs.indexOf(s), sx = s.x - p0; add(sx - BAND / 2, segs[i - 1].c); add(sx + BAND / 2, s.c); }
      add(LW, segs[segAt(segs, p0 + LW)].c);
      K.fillStyle = gr;
    }
    K.fill(path);
    // la nieve de las cumbres y la muralla china, solo en su país
    K.save(); K.clip(path);
    for (let i = 0; i < segs.length; i++) {
      const c = segs[i].c, F = c >= 0 ? ROUTE[c].far : null;
      if (!F) continue;
      const x0 = Math.max(-6, segs[i].x - p0), x1 = Math.min(LW + 6, i + 1 < segs.length ? segs[i + 1].x - p0 : LW + 6);
      if (x1 <= x0) continue;
      if (F.snow) { const sy = base - F.snow * F.a * (back ? 1.18 : 1) - (back ? 22 : 0); K.fillStyle = col("#f4f6f8"); K.fillRect(x0, sy - 200, x1 - x0, 200); }
    }
    K.restore();
    if (!back) for (let i = 0; i < segs.length; i++) {
      const c = segs[i].c;
      if (c < 0 || !ROUTE[c].far.wall) continue;
      const x0 = Math.max(0, segs[i].x - p0 + BAND / 2), x1 = Math.min(LW, i + 1 < segs.length ? segs[i + 1].x - p0 - BAND / 2 : LW);
      if (x1 <= x0) continue;
      K.strokeStyle = col("#b8a88a"); K.lineWidth = 3; K.beginPath();
      for (let x = x0; x <= x1; x += 4) { const y = base - farH(segs, p0 + x, false) * 0.82 + 6; if (x === x0) K.moveTo(x, y); else K.lineTo(x, y); }
      K.stroke();
      K.fillStyle = col("#a89878");
      for (let x = Math.ceil(x0 / 9) * 9; x <= x1; x += 9) { const y = base - farH(segs, p0 + x, false) * 0.82 + 6; K.fillRect(x - 1.5, y - 4, 3, 3); }
    }
    N = n0;
  }

  // ---------- fronteras ----------
  // Cada frontera se crea justo fuera de la pantalla por la derecha, en cada capa a su distancia.
  const M = 60, SEA = 1700;
  let base = 0, borders = [];
  const S = { scroll: 0 };
  function segsFor(f) {
    const out = [{ x: -Infinity, c: base }];
    for (const b of borders) {
      const x = b.s * f + LW + M;
      if (b.sea) { out.push({ x, c: -1 }); out.push({ x: x + SEA * f, c: b.c }); } else out.push({ x, c: b.c });
    }
    return out;
  }
  function reset(c) { base = ((c % ROUTE.length) + ROUTE.length) % ROUTE.length; borders = []; }
  function cross(c, scroll) {
    c = ((c % ROUTE.length) + ROUTE.length) % ROUTE.length;
    borders.push({ s: scroll, c, sea: !!ROUTE[c].sea });
  }
  // las fronteras que ya han pasado del todo se olvidan
  function tidy(scroll) {
    while (borders.length) {
      const b = borders[0], f = 0.07, end = b.s * f + LW + M + (b.sea ? SEA * f : 0);
      if (scroll * f - end > LW + 200) { base = b.c; borders.shift(); } else break;
    }
  }
  // dónde está en la pantalla la última frontera del suelo (null si no hay)
  function groundEdge(scroll) { if (!borders.length) return null; const b = borders[borders.length - 1]; return b.s + LW + M - scroll; }

  // ---------- capas ----------
  function seaStrip(x0, x1, top, bot, color, k) {
    const a = Math.max(-20, x0), z = Math.min(LW + 20, x1);
    if (z <= a) return;
    P(color, x0 + 26, top, x1 - 26, top, x1, bot, x0, bot);
    P("#e9d6a6", x0 - 2, bot, x0 + 28, top - 1, x0 + 34, top - 1, x0 + 8, bot);
    P("#e9d6a6", x1 + 2, bot, x1 - 28, top - 1, x1 - 34, top - 1, x1 - 8, bot);
    for (let i = 0; i < 6; i++) { const y = top + 6 + i * ((bot - top - 8) / 6), o = ((S.scroll * 0.02 + i * 37 + k * 13) % 60); for (let x = x0 + 40 + o; x < x1 - 40; x += 60) L("#ffffff", 1, x, y, x + 14, y); }
  }
  function drawMid(pal) {
    const f = 0.25, W = 260, p0 = S.scroll * f, segs = segsFor(f), b = GT - 24;
    HZ = pal.city; HA = 0.28;
    // el agua de los tramos de mar
    for (let i = 1; i < segs.length; i++) if (segs[i].c < 0) seaStrip(segs[i].x - p0, segs[i + 1].x - p0, b - 30, GT + 4, "#4f98c4", i);
    const k0 = Math.floor((p0 - 140) / W), k1 = Math.floor((p0 + LW + 140) / W);
    for (let k = k0; k <= k1; k++) {
      const cx = k * W + W / 2 - p0, c = segs[segAt(segs, k * W + W / 2)].c;
      const kk = ((k % 9973) + 9973) % 9973; // las ranuras de antes de empezar tienen número negativo
      if (c < 0) { if (hsh(k, 2) < 0.7) MON.barco(cx, b - 6, kk); continue; }
      const C = ROUTE[c];
      if (((k % 2) + 2) % 2 === 0) { const m = C.mids[(((k >> 1) % 3) + 3 + c) % C.mids.length]; MON[m](cx, b); }
      else SKY[C.sky](cx, b, kk, C);
    }
  }
  function drawNear(pal) {
    const f = 0.5, W = 120, p0 = S.scroll * f, segs = segsFor(f), b = GT;
    HA = 0;
    for (let i = 1; i < segs.length; i++) if (segs[i].c < 0) seaStrip(segs[i].x - p0, segs[i + 1].x - p0, b - 46, b + 2, "#3f8ab8", i + 9);
    const k0 = Math.floor((p0 - 60) / W), k1 = Math.floor((p0 + LW + 60) / W);
    // primero los árboles, que asoman por detrás de las casas
    for (let pass = 0; pass < 2; pass++) for (let k = k0; k <= k1; k++) {
      const x = k * W - p0, c = segs[segAt(segs, k * W + W / 2)].c;
      if (c < 0) continue;
      const C = ROUTE[c], r = hsh(k, 11);
      if (pass === 0) { if (r < C.tp + 0.35) TREE[C.trees[Math.floor(hsh(k, 12) * C.trees.length)]](x + 8 + hsh(k, 13) * 10, b); }
      else if (r >= C.tp) { const w = W - 22 - hsh(k, 14) * 16; HOUSE[C.hs](x + 18, b, w, ((k % 997) + 997) % 997, C); }
    }
  }

  // Dibuja todo el paisaje de la vuelta al mundo (debajo van el suelo y las columnas del juego).
  function draw(ctx, info) {
    K = ctx; LW = info.W; LH = info.H; GT = info.gt; S.scroll = info.scroll; N = info.night;
    memo.clear();
    tidy(info.scroll);
    const pal = info.pal;
    drawFar(0.07, GT - 92, true, pal);
    drawFar(0.1, GT - 64, false, pal);
    drawMid(pal);
    drawNear(pal);
    HA = 0;
  }
  window.ElsPanetsMundo = { ROUTE, reset, cross, draw, groundEdge, base: () => base };
})();
