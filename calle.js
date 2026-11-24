// Vida en los mapas de Els Panets (22/11/2026): coches, gente y animales que se mueven de verdad.
// - Las piernas pisan el suelo (la zancada va con lo andado) y las ruedas giran con lo recorrido.
// - Sin temblores ni parpadeos: nada sacude la pantalla, solo se mueve cada figura.
// - Todo cabe en la franja del suelo; en «Calidad baja» no se dibuja.
// game.js llama a ElsPanetsCalle.calle() al pintar el suelo y a .cielo() al pintar el paisaje.
window.ElsPanetsCalle = (function () {
  "use strict";
  const TAU = Math.PI * 2, OUT = "#3b2414";
  let c = null, tintFn = null, memoN = -1, night = 0, now = 0;
  const memo = new Map(), darkMemo = new Map();
  const mod = (a, b) => ((a % b) + b) % b;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const soft = (v) => { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x); };

  // colores con la noche (guardados para no recalcularlos en cada cuadro)
  function setNight(n, f) {
    night = n; tintFn = f;
    const q = Math.round(n * 24) / 24;
    if (q !== memoN) { memoN = q; memo.clear(); }
  }
  function col(h) { let v = memo.get(h); if (!v) { v = tintFn(h, memoN); memo.set(h, v); } return v; }
  function dark(h) {
    let v = darkMemo.get(h);
    if (!v) {
      const n = parseInt(h.slice(1), 16), f = (x) => Math.round(x * 0.76).toString(16).padStart(2, "0");
      v = "#" + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
      darkMemo.set(h, v);
    }
    return v;
  }

  // ---------- formas ----------
  function rr(x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function paint(f, lw) { c.fillStyle = col(f); c.fill(); if (lw !== 0) { c.strokeStyle = col(OUT); c.lineWidth = lw || 0.8; c.stroke(); } }
  function disc(x, y, r, f, lw) { c.beginPath(); c.arc(x, y, r, 0, TAU); paint(f, lw); }
  function ell(x, y, a, b, rot, f, lw) { c.beginPath(); c.ellipse(x, y, a, b, rot, 0, TAU); paint(f, lw); }
  function line(x0, y0, x1, y1, f, w) {
    c.strokeStyle = col(f); c.lineWidth = w; c.lineCap = "round";
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  function poly(pts, f, lw) {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath(); paint(f, lw);
  }
  function shadow(x, w) {
    c.fillStyle = "rgba(20,14,8,0.22)";
    c.beginPath(); c.ellipse(x, 0.6, w, 1.8, 0, 0, TAU); c.fill();
  }
  // brazo o pierna de dos tramos, con su contorno; deja en endX/endY dónde acaba
  let endX = 0, endY = 0;
  function limb(x, y, a1, l1, a2, l2, w, f) {
    const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
    endX = kx + Math.sin(a2) * l2; endY = ky + Math.cos(a2) * l2;
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(x, y); c.lineTo(kx, ky); c.lineTo(endX, endY);
    c.strokeStyle = col(OUT); c.lineWidth = w + 1.3; c.stroke();
    c.strokeStyle = col(f); c.lineWidth = w; c.stroke();
  }
  // pierna que va de la cadera a un punto (para pedalear)
  function reach(hx, hy, fx, fy, l1, l2, w, f) {
    const dx = fx - hx, dy = fy - hy, dist = clamp(Math.hypot(dx, dy), 0.1, l1 + l2 - 0.05);
    const base = Math.atan2(dx, dy), cosA = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
    const a1 = base + Math.acos(cosA), kx = hx + Math.sin(a1) * l1, ky = hy + Math.cos(a1) * l1;
    limb(hx, hy, a1, l1, Math.atan2(fx - kx, fy - ky), l2, w, f);
  }

  // ---------- personas ----------
  function hair(L, hx, hy, p) {
    const r = 5.5, h = L.pelo, st = L.peinado;
    if (st === "gorra") {
      c.beginPath(); c.arc(hx, hy - 0.6, r + 0.3, Math.PI, 0); c.closePath(); paint(L.gorro || "#d63a32");
      rr(hx + 2, hy - 1.7, 6.6, 1.7, 0.8); paint(L.gorro || "#d63a32");
    } else if (st === "sombrero") {
      ell(hx, hy - 2.6, 9.2, 1.7, 0, L.gorro || "#e8cf8e");
      c.beginPath(); c.arc(hx, hy - 2.7, 4.8, Math.PI, 0); c.closePath(); paint(L.gorro || "#e8cf8e");
      line(hx - 4.5, hy - 3.3, hx + 4.5, hy - 3.3, "#b5462f", 1);
    } else if (st === "panuelo") {
      c.beginPath(); c.arc(hx, hy - 0.2, r + 0.5, Math.PI * 0.82, Math.PI * 2.06); c.lineTo(hx - 2, hy + 3.6); c.closePath(); paint(h);
    } else if (st === "calvo") {
      c.beginPath(); c.arc(hx, hy, r, Math.PI * 0.72, Math.PI * 1.12); c.closePath(); paint(h, 0);
    } else if (st === "rizos") {
      for (let i = 0; i < 7; i++) { const a = Math.PI * (0.9 + i * 0.2); disc(hx + Math.cos(a) * 4.7, hy - 0.4 + Math.sin(a) * 4.7, 2.5, h, 0); }
    } else {
      c.beginPath(); c.arc(hx, hy - 0.3, r + 0.4, Math.PI * 0.86, Math.PI * 2.02);
      c.quadraticCurveTo(hx + 1, hy - 3.6, hx - 2.4, hy - 2.2); c.lineTo(hx - 3.6, hy + 2.6); c.closePath(); paint(h);
      if (st === "moño") disc(hx - 2.6, hy - 6.8, 2.5, h);
    }
    void p;
  }
  function headBack(L, hx, hy, p) {
    if (L.peinado === "largo") { rr(hx - 7, hy - 3, 6.6, 12.5, 3); paint(L.pelo); }
    if (L.peinado === "coleta") ell(hx - 7.2, hy + 1 + Math.sin(p * 2) * 0.5, 2.2, 4.8, 0.45 + Math.sin(p) * 0.16, L.pelo);
  }
  function head(L, hx, hy, p) {
    headBack(L, hx, hy, p);
    disc(hx, hy, 5.5, L.piel);
    disc(hx + 5, hy + 0.7, 1.1, L.piel, 0);
    hair(L, hx, hy, p);
    // ojo que parpadea muy de vez en cuando
    const blink = mod(now + (L.f || 0) * 1.7, 4.3) < 0.12;
    if (blink) line(hx + 1.9, hy - 0.2, hx + 3.5, hy - 0.2, OUT, 0.6);
    else disc(hx + 2.8, hy - 0.2, 0.8, "#2a1a10", 0);
    c.strokeStyle = col("#8a3f2c"); c.lineWidth = 0.6; c.lineCap = "round";
    c.beginPath(); c.arc(hx + 2.8, hy + 1.9, 1.2, 0.3, 1.9); c.stroke();
    if (L.gafas) { c.strokeStyle = col("#2a2a2a"); c.lineWidth = 0.7; c.beginPath(); c.arc(hx + 2.8, hy - 0.2, 1.6, 0, TAU); c.moveTo(hx + 1.2, hy - 0.3); c.lineTo(hx - 4, hy - 1); c.stroke(); }
  }
  function foot(f) { ell(endX + 1.2, endY + 0.1, 2.5, 1.25, 0, f, 0.6); }

  function walker(L, d) {
    const old = !!L.viejo, A = old ? 0.27 : 0.42, pace = old ? 16 : 24.5;
    const p = (d / pace) * TAU + (L.f || 0);
    const a1 = A * Math.sin(p), f1 = Math.max(0, Math.cos(p)) * 0.95;
    const a2 = -a1, f2 = Math.max(0, -Math.cos(p)) * 0.95;
    const LT = 7.6, LS = 7.4, zap = L.zap || "#3b2a1e";
    const v1 = LT * Math.cos(a1) + LS * Math.cos(a1 - f1), v2 = LT * Math.cos(a2) + LS * Math.cos(a2 - f2);
    const hip = -Math.max(v1, v2) - 1.2, sh = hip - 10.6, hy = sh - 5.4, hx = old ? 1.6 : 0.8;
    shadow(0, 8);
    // brazo y pierna del lado de allá, más oscuros
    limb(0.2, sh + 1.2, a1 * 0.95, 4.8, a1 * 0.95 + 0.42, 4.6, 2.3, dark(L.top));
    disc(endX, endY, 1.3, dark(L.piel), 0);
    limb(0, hip, a2, LT, a2 - f2, LS, 2.9, dark(L.falda ? L.piel : L.pant));
    foot(dark(zap));
    if (L.acc === "mochila") { rr(-8.2, sh, 5.6, 9.4, 2); paint(L.accCol || "#2f7fbf"); }
    limb(0, hip, a1, LT, a1 - f1, LS, 2.9, L.falda ? L.piel : L.pant);
    foot(zap);
    // cuerpo
    if (L.falda) { poly([-3.6, hip - 3, 3.6, hip - 3, 5.6, hip + 5.4, -5.6, hip + 5.4], L.pant); }
    rr(-3.9, sh - 0.7, 7.8, hip - sh + 1.9, 3); paint(L.top);
    if (L.raya) line(-3.3, sh + 5, 3.3, sh + 5, L.raya, 1.4);
    head(L, hx, hy, p);
    // brazo de este lado, con lo que lleve
    const ac = L.acc;
    let armA = -a1 * 0.95, bend = 0.42;
    if (ac === "baston") { armA = 0.62; bend = 0.25; }
    else if (ac === "camara") { armA = 2.05; bend = 0.8; }
    else if (ac === "movil") { armA = 1.75; bend = 1.1; }
    else if (ac === "correa") { armA = 0.8; bend = 0.3; }
    else if (ac === "empuja") { armA = 1.25; bend = 0.15; }
    else if (ac === "tabla") { armA = 0.55; bend = 1.05; }
    else if (ac === "cesta") { armA = 0.25; bend = 0.95; }
    if (ac === "bolso") { line(2.4, sh + 0.2, -3.2, hip + 0.5, "#6b3f22", 0.8); rr(-6.2 + Math.sin(p) * 0.5, hip - 1, 6, 5, 1.4); paint(L.accCol || "#8a4b2a"); }
    if (ac === "tabla") { c.save(); c.translate(1, sh + 5.6); c.rotate(-0.1); ell(0, 0, 18, 2.8, 0, L.accCol || "#37b5c8"); line(-15, 0, 15, 0, "#fff6d8", 0.7); c.restore(); }
    limb(0.5, sh + 1.2, armA, 4.8, armA + bend, 4.6, 2.4, L.top);
    const hxx = endX, hyy = endY;
    disc(hxx, hyy, 1.4, L.piel, 0.5);
    if (ac === "baston") {
      const tap = Math.sin(p) * 1.6;
      line(hxx, hyy, hxx + 1.8 + tap, -0.4, "#6b4a25", 1.2);
    } else if (ac === "camara") { rr(hxx - 0.6, hyy - 2.4, 5.2, 3.8, 0.8); paint("#2b2d33", 0.5); disc(hxx + 4.8, hyy - 0.6, 1.1, "#7fb7d8", 0.4); }
    else if (ac === "movil") { rr(hxx + 0.2, hyy - 3.6, 1.7, 4.2, 0.4); paint("#22242a", 0); }
    else if (ac === "cubo") { poly([hxx - 2.2, hyy + 1.5, hxx + 2.2, hyy + 1.5, hxx + 1.6, hyy + 5.8, hxx - 1.6, hyy + 5.8], L.accCol || "#e5533d", 0.5); }
    else if (ac === "cesta") { c.beginPath(); c.arc(hxx + 0.8, hyy + 1, 3.6, 0, Math.PI); c.closePath(); paint("#c79a55", 0.6); disc(hxx - 0.5, hyy + 1, 1.2, "#d63a32", 0); disc(hxx + 2, hyy + 1, 1.2, "#7fb84e", 0); }
    else if (ac === "globo") {
      const gx = hxx + 2 + Math.sin(now * 1.1 + (L.f || 0)) * 1.2, gy = hyy - 11;
      line(hxx, hyy, gx, gy + 4, "#6b6b6b", 0.5); ell(gx, gy, 3.6, 4.2, 0, L.accCol || "#e5533d", 0.6);
    }
    return { x: hxx, y: hyy };
  }

  // ---------- animales de cuatro patas ----------
  function pata(x, y, q, len, w, f, amp) {
    const a = (amp || 0.45) * Math.sin(q), fl = Math.max(0, Math.cos(q)) * 0.8;
    limb(x, y, a, len / 2, a - fl, len / 2, w, f);
    ell(endX + 0.5, endY, w * 0.75, w * 0.42, 0, OUT, 0);
  }
  function dog(d, f, coat, belly) {
    const p = (d / 11) * TAU + f, wag = Math.sin(now * 8 + f) * 0.42;
    shadow(0, 9);
    pata(-6, -7, p + Math.PI, 6.4, 2, dark(coat)); pata(6, -7, p, 6.4, 2, dark(coat));
    c.save(); c.translate(-8.6, -9.6); c.rotate(-0.8 + wag);
    c.beginPath(); c.moveTo(0, 1); c.quadraticCurveTo(-4, -2.5, -7, -2); c.quadraticCurveTo(-3.8, 0, -0.4, 2.2); c.closePath(); paint(coat, 0.6); c.restore();
    ell(-0.5, -9.2, 9, 3.9, -0.05, coat);
    ell(0, -7.2, 6, 1.6, 0, belly || coat, 0);
    pata(-6.5, -7, p, 6.4, 2.2, coat); pata(6.5, -7, p + Math.PI, 6.4, 2.2, coat);
    const ny = Math.sin(p * 2) * 0.35;
    ell(9.4, -13 + ny, 4.2, 3.7, 0, coat);
    ell(13, -12 + ny, 2.6, 1.8, 0, belly || coat, 0.6);
    disc(15, -12.4 + ny, 0.8, OUT, 0);
    disc(10.6, -14 + ny, 0.65, OUT, 0);
    c.save(); c.translate(7.6, -15.6 + ny); c.rotate(-0.4 + Math.sin(p) * 0.14); ell(0, 0, 1.7, 3, 0, dark(coat), 0.5); c.restore();
    return { x: 7, y: -10 };
  }
  function cat(d, f, coat) {
    const p = (d / 7.2) * TAU + f;
    shadow(0, 7);
    pata(-4.6, -5, p + Math.PI, 4.8, 1.5, dark(coat), 0.38); pata(4.8, -5, p, 4.8, 1.5, dark(coat), 0.38);
    // la cola, alta y con una curva que ondula despacio
    const w = Math.sin(now * 1.7 + f) * 2.2;
    c.strokeStyle = col(OUT); c.lineWidth = 2.5; c.lineCap = "round";
    c.beginPath(); c.moveTo(-6.4, -7); c.bezierCurveTo(-10, -10, -7 + w, -14, -9.5 + w * 1.4, -18); c.stroke();
    c.strokeStyle = col(coat); c.lineWidth = 1.5; c.stroke();
    ell(-0.2, -7, 7, 2.9, -0.04, coat, 0.7);
    pata(-4.8, -5, p, 4.8, 1.6, coat, 0.38); pata(5, -5, p + Math.PI, 4.8, 1.6, coat, 0.38);
    disc(7.5, -10.4, 3.5, coat, 0.7);
    poly([5.2, -12.6, 5.8, -16, 7.8, -13.6], coat, 0.6); poly([8.4, -13.6, 10.2, -16, 10.5, -12.4], coat, 0.6);
    disc(9, -10.9, 0.6, "#2a3a18", 0);
    disc(10.8, -9.7, 0.4, "#c0506a", 0);
  }
  function cow(e, f, walking) {
    const q = walking ? ((e / 13.4) * TAU + f) : 0;
    const graze = walking ? 0 : soft(Math.sin(now * 0.38 + f) * 1.5 + 0.55);
    const chew = graze > 0.85 ? Math.sin(now * 5 + f) * 0.5 : 0;
    const hx = 21 + graze * 1.5, hy = -22 + graze * 17;
    shadow(0, 19);
    pata(-11, -12, q + Math.PI, 12, 3, dark("#f4efe6"), 0.28); pata(11, -12, q, 12, 3, dark("#f4efe6"), 0.28);
    // cola que espanta las moscas
    const sw = Math.sin(now * 1.7 + f) * 0.36;
    c.save(); c.translate(-17, -21); c.rotate(0.2 + sw);
    c.strokeStyle = col(OUT); c.lineWidth = 1.1; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-2.5, 6, -1, 12); c.stroke();
    ell(-0.8, 13.6, 1.5, 2.6, 0, "#3b2c24", 0); c.restore();
    rr(-17.5, -25, 34, 15.5, 7); paint("#f4efe6");
    ell(-8, -19.5, 5.6, 4.2, 0.3, "#3b2c24", 0); ell(6, -21, 4, 3, -0.4, "#3b2c24", 0); ell(9, -13.6, 2.8, 1.8, 0, "#3b2c24", 0);
    ell(1.5, -9.4, 3.8, 1.9, 0, "#f2a9b4", 0.6);
    pata(-10, -12, q, 12, 3.2, "#f4efe6", 0.28); pata(12, -12, q + Math.PI, 12, 3.2, "#f4efe6", 0.28);
    // cuello y cabeza (baja a pastar)
    c.lineCap = "round"; c.beginPath(); c.moveTo(13, -20); c.lineTo(hx - 2, hy + 1);
    c.strokeStyle = col(OUT); c.lineWidth = 8.2; c.stroke(); c.strokeStyle = col("#f4efe6"); c.lineWidth = 7; c.stroke();
    if (!walking || graze < 0.5) { line(15.5, -13.8 + graze * 2, 15.5, -11 + graze * 2, "#6b4a25", 0.7); disc(15.5, -10 + graze * 2, 1.7, "#e1b23e", 0.5); }
    const rot = graze * 0.8;
    c.save(); c.translate(hx, hy); c.rotate(rot);
    ell(-3.6, -3.8, 2.8, 1.25, -0.5 + Math.sin(now * 0.9 + f) * 0.2, "#3b2c24", 0.3);
    line(-0.4, -4.6, -1.6, -7.6, "#e8dfc9", 1.2);
    rr(-4.4, -4.7, 10, 9, 3.6); paint("#f4efe6");
    rr(1.4, -0.4 + chew * 0.3, 6, 5, 2.2); paint("#f2bcc4", 0.7);
    disc(4.6, 1.2, 0.5, OUT, 0); disc(6.4, 1.2, 0.5, OUT, 0);
    disc(1.1, -2, 0.85, "#20140c", 0);
    c.restore();
  }
  function sheep(d, f, walking) {
    const q = walking ? (d / 6.7) * TAU + f : 0, graze = walking ? 0 : soft(Math.sin(now * 0.5 + f) * 1.4 + 0.5);
    const hx = 10.6, hy = -11.5 + graze * 7;
    shadow(0, 10);
    pata(-5.5, -5, q + Math.PI, 5, 1.5, "#2c2622", 0.34); pata(5.5, -5, q, 5, 1.5, "#2c2622", 0.34);
    pata(-4, -5, q, 5, 1.6, "#3a332e", 0.34); pata(7, -5, q + Math.PI, 5, 1.6, "#3a332e", 0.34);
    for (const [x, y, r] of WOOL) disc(x, y, r, "#fbf6ec", 0.6);
    for (const [x, y, r] of WOOL) { c.beginPath(); c.arc(x, y, r - 0.1, 0, TAU); c.fillStyle = col("#fbf6ec"); c.fill(); }
    c.save(); c.translate(hx, hy); c.rotate(graze * 0.7);
    ell(-2.8, -1.6, 2.3, 1, -0.4 + Math.sin(now + f) * 0.2, "#3a332e", 0);
    ell(0.4, 0.2, 3, 3.6, 0.3, "#3a332e", 0.5);
    disc(1.4, -0.9, 0.6, "#fff", 0);
    c.restore();
  }
  const WOOL = [[-6, -10, 3.8], [-2, -12, 4.4], [3, -12, 4.2], [7, -10, 3.5], [-4, -7.4, 3.6], [1, -7, 3.8], [5.5, -7.4, 3.2]];

  function donkeyCart(d, f) {
    const p = (d / 14) * TAU + f, r = 9;
    // carro con sacos, atrás
    shadow(-29, 17);
    wheelWood(-28, -r, r, -d / r);
    rr(-44, -22, 30, 9, 1.6); paint("#a8743f");
    line(-44, -18, -14, -18, "#7c5228", 0.8);
    ell(-37, -25, 6.2, 4.2, 0, "#d9c79f"); ell(-27, -25.6, 6, 4.6, 0, "#cbb78c");
    line(-14, -17, 1, -13, "#6b4a25", 1.5);
    // burro
    shadow(9, 13);
    pata(1, -11, p + Math.PI, 10.5, 2.2, dark("#8d8378"), 0.34); pata(16, -11, p, 10.5, 2.2, dark("#8d8378"), 0.34);
    const sw = Math.sin(now * 1.5 + f) * 0.28;
    c.save(); c.translate(-2, -18); c.rotate(0.25 + sw);
    c.strokeStyle = col(OUT); c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, 0); c.lineTo(-1, 8); c.stroke(); ell(-1.1, 9.5, 1.2, 2, 0, "#3b332c", 0); c.restore();
    rr(-2, -22, 23, 12, 5.5); paint("#8d8378");
    ell(9, -12.2, 7, 1.7, 0, "#c9c0b2", 0);
    pata(1.5, -11, p, 10.5, 2.4, "#8d8378", 0.34); pata(17, -11, p + Math.PI, 10.5, 2.4, "#8d8378", 0.34);
    const nod = Math.sin(p * 2) * 0.55;
    c.lineCap = "round"; c.beginPath(); c.moveTo(18, -18); c.lineTo(24, -26 + nod);
    c.strokeStyle = col(OUT); c.lineWidth = 6.6; c.stroke(); c.strokeStyle = col("#8d8378"); c.lineWidth = 5.4; c.stroke();
    c.save(); c.translate(26, -27 + nod); c.rotate(0.28);
    ell(-3, -6, 1.5, 4.6, -0.25 + Math.sin(now * 0.8 + f) * 0.12, "#7a7066", 0.5);
    ell(-0.2, -6, 1.5, 4.6, 0.1, "#8d8378", 0.5);
    rr(-4, -3, 11, 7, 3.2); paint("#8d8378");
    rr(2.6, -1, 5.6, 5.2, 2.3); paint("#cfc7ba", 0.6);
    disc(0.8, -1, 0.8, "#1c130c", 0); disc(7, 1, 0.4, OUT, 0);
    c.restore();
  }

  // ---------- aves y bichos pequeños ----------
  function pigeon(x, f, tint1, tint2) {
    const cyc = mod(now * 0.55 + f, 1), peck = cyc < 0.34 ? Math.max(0, Math.sin((cyc / 0.34) * Math.PI * 3)) : 0;
    const shuffle = Math.sin(now * 0.34 + f * 3) * 7, face = Math.cos(now * 0.34 + f * 3) >= 0 ? 1 : -1;
    const step = cyc >= 0.34 ? Math.sin(now * 9 + f) : 0;
    c.save(); c.translate(x + shuffle, 0); c.scale(face, 1);
    shadow(0, 5);
    line(-0.8, -2.6, -0.8 + step * 0.8, -0.2, "#d0604a", 0.8); line(1, -2.6, 1 - step * 0.8, -0.2, "#d0604a", 0.8);
    poly([-3.4, -5.4, -9, -3.2, -3.2, -3], dark(tint1), 0.5);
    ell(0, -5, 4.8, 3, -0.12, tint1, 0.6);
    ell(-0.8, -5.4, 3, 1.8, 0.1, tint2, 0);
    const hx = 4.2 + peck * 1.5, hy = -8.6 + peck * 7;
    line(2.6, -6.2, hx, hy, "#5b7a8e", 2.4);
    disc(hx, hy, 2, tint1, 0.5);
    disc(hx + 0.6, hy - 0.4, 0.45, "#c44", 0);
    poly([hx + 1.7, hy - 0.3, hx + 3.7, hy + 0.4, hx + 1.7, hy + 0.8], "#d8b24a", 0);
    c.restore();
  }
  function hen(d, f) {
    const p = (d / 8) * TAU + f, stop = mod(now * 0.32 + f, 1), peck = stop < 0.3 ? Math.max(0, Math.sin((stop / 0.3) * Math.PI * 4)) : 0;
    shadow(0, 6);
    line(-1, -3.6, -1 + Math.sin(p) * 1.6, -0.2, "#d89a2b", 0.9); line(1.4, -3.6, 1.4 - Math.sin(p) * 1.6, -0.2, "#d89a2b", 0.9);
    poly([-4, -9, -9.5, -13.5, -8, -8, -9.6, -7, -4, -5], "#7c3d1c", 0.6);
    ell(0, -7, 6, 4.2, -0.1, "#c7682c");
    ell(-1, -7, 3.5, 2.5, 0.25, "#a4501f", 0);
    const hx = 5.6 + peck * 1.6, hy = -12 + peck * 9;
    line(3.4, -9, hx, hy, "#c7682c", 3);
    disc(hx, hy, 2.5, "#c7682c", 0.6);
    disc(hx - 0.3, hy - 2.8, 1.1, "#e03b2c", 0); disc(hx + 1, hy - 2.7, 0.95, "#e03b2c", 0);
    disc(hx + 0.8, hy - 0.4, 0.5, OUT, 0);
    poly([hx + 2.2, hy - 0.5, hx + 4.4, hy + 0.5, hx + 2.2, hy + 1], "#e6b02e", 0);
    ell(hx + 1.6, hy + 2, 0.9, 1.3, 0, "#e03b2c", 0);
  }
  function chick(d, f) {
    const hop = Math.abs(Math.sin((d / 7) * Math.PI + f)) * 1.2;
    shadow(0, 2.6);
    c.save(); c.translate(0, -hop);
    disc(0, -3, 2.5, "#ffdf5e", 0.5); disc(2, -5, 1.7, "#ffdf5e", 0.5);
    disc(2.6, -5.3, 0.35, OUT, 0); poly([3.5, -5.2, 4.8, -4.8, 3.5, -4.4], "#e8892a", 0);
    c.restore();
  }
  function crab(d, f) {
    const p = (d / 4) * TAU + f, claw = 0.5 + Math.sin(now * 2.6 + f) * 0.45;
    shadow(0, 7);
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
      const lift = Math.max(0, Math.sin(p + i * 2.1 + (sd > 0 ? Math.PI : 0))) * 1.5;
      c.strokeStyle = col("#a83320"); c.lineWidth = 0.9; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(sd * 4, -3); c.lineTo(sd * (6.4 + i * 0.9), -4.2 - lift); c.lineTo(sd * (7.6 + i * 1.1), -0.2 - lift * 0.6); c.stroke();
    }
    for (const sd of [-1, 1]) {
      line(sd * 3.6, -4.8, sd * 7, -8, "#d8452c", 1.5);
      c.save(); c.translate(sd * 8, -9.4); c.scale(sd, 1);
      c.beginPath(); c.moveTo(-1, 1); c.arc(0, 0, 2.5, 0.2 + claw * 0.75, TAU - 0.2 - claw * 0.75 - 0.9); c.closePath(); paint("#e8583c", 0.5);
      c.restore();
    }
    ell(0, -4, 5.4, 3.4, 0, "#e0492f", 0.7);
    line(-1.8, -7, -2, -8.8, OUT, 0.6); line(1.8, -7, 2, -8.8, OUT, 0.6);
    disc(-2, -9, 0.9, "#fff", 0.4); disc(2, -9, 0.9, "#fff", 0.4);
    disc(-1.9, -9, 0.42, OUT, 0); disc(2.1, -9, 0.42, OUT, 0);
  }
  function gullStand(x, f) {
    const cyc = mod(now * 0.42 + f, 1), peck = cyc < 0.24 ? Math.sin((cyc / 0.24) * Math.PI) : 0, look = Math.sin(now * 0.7 + f) > 0.5 ? 1 : 0;
    c.save(); c.translate(x, 0);
    shadow(0, 6);
    line(-0.8, -4, -0.8, -0.2, "#e6a23a", 1); line(1.4, -4, 1.4, -0.2, "#e6a23a", 1);
    poly([-3, -7.6, -11, -5.4, -3, -4.4], "#59616b", 0.5);
    ell(0, -7, 5.6, 3.4, -0.1, "#fbfbf8", 0.7);
    ell(-1.4, -7.6, 4, 2, 0.1, "#a9b2bc", 0);
    const hx = 5 + peck * 2, hy = -11 + peck * 9;
    line(3, -8.6, hx, hy, "#fbfbf8", 3); disc(hx, hy, 2.5, "#fbfbf8", 0.6);
    disc(hx + 0.8 - look * 0.7, hy - 0.5, 0.5, OUT, 0);
    poly([hx + 2.2, hy - 0.5, hx + 5.2, hy + 0.5, hx + 2.2, hy + 1.1], "#f0b23a", 0.3);
    c.restore();
  }

  // ---------- vehículos ----------
  function wheel(x, y, r, ang) {
    disc(x, y, r, "#26231f", 0);
    disc(x, y, r * 0.56, "#c6ccd4", 0.5);
    c.strokeStyle = col("#767c86"); c.lineWidth = r * 0.14; c.lineCap = "round";
    c.beginPath();
    for (let i = 0; i < 3; i++) { const a = ang + (i * TAU) / 3; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); }
    c.stroke();
  }
  function wheelWood(x, y, r, ang) {
    c.beginPath(); c.arc(x, y, r - 0.6, 0, TAU); c.strokeStyle = col("#5e4026"); c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = col("#7c5a36"); c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < 6; i++) { const a = ang + (i * TAU) / 6; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1)); }
    c.stroke();
    disc(x, y, 1.7, "#4a3320", 0.4);
  }
  // luces de noche: un cono suave delante y el piloto rojo detrás (sin destellos)
  function beam(x, y) {
    if (night < 0.32) return;
    const a = clamp((night - 0.32) * 1.6, 0, 1) * 0.24;
    c.fillStyle = "rgba(255,238,170," + a.toFixed(3) + ")";
    c.beginPath(); c.moveTo(x, y - 1); c.lineTo(x + 46, y - 7); c.lineTo(x + 46, y + 7); c.lineTo(x, y + 1); c.closePath(); c.fill();
  }
  function lights(fx, fy, bx, by) {
    const on = night > 0.32;
    ell(fx, fy, 1.4, 1.8, 0, on ? "#fff3b8" : "#f6efd2", 0.4);
    c.fillStyle = on ? "#ff4a3a" : col("#b52c22");
    c.fillRect(bx - 0.8, by - 1.6, 1.8, 3.4);
  }
  function glass() { return night > 0.45 ? "#ffd98a" : "#bfe2f2"; }
  function driver(x, y, piel, pelo) {
    disc(x, y, 3, piel, 0.4);
    c.beginPath(); c.arc(x, y - 0.4, 3.1, Math.PI * 0.9, Math.PI * 2); c.closePath(); paint(pelo, 0);
    rr(x - 3.2, y + 2.6, 6.4, 5, 1.6); paint("#3f5f8a", 0);
  }
  function sedan(V, d) {
    const r = 5.8, a = d / r;
    beam(31, -11);
    shadow(0, 30);
    c.beginPath(); c.moveTo(-31, -6); c.lineTo(-31, -13); c.quadraticCurveTo(-30.5, -16.4, -26, -16.6); c.lineTo(-19, -17);
    c.lineTo(-12, -25.4); c.quadraticCurveTo(-11, -26.6, -9, -26.6); c.lineTo(6, -26.6); c.quadraticCurveTo(8, -26.6, 9.4, -25.4);
    c.lineTo(17, -17); c.lineTo(26.5, -15.6); c.quadraticCurveTo(31, -14.6, 31, -10); c.lineTo(31, -6); c.closePath(); paint(V.col, 0.9);
    poly([-16.2, -17, -10.6, -24.4, -2, -24.4, -2, -17], glass(), 0.6);
    poly([0, -17, 0, -24.4, 6.6, -24.4, 13.6, -17], glass(), 0.6);
    c.save(); c.beginPath(); c.rect(0, -24.2, 13, 7.2); c.clip(); driver(5.6, -20.6, V.piel || "#e3b184", V.pelo || "#2a1c14"); c.restore();
    line(-1, -17, -1, -7, dark(V.col), 0.7); line(15, -15, 15, -8, dark(V.col), 0.5);
    line(3, -14, 6, -14, "#f2f2ee", 0.9); line(-8, -14, -5, -14, "#f2f2ee", 0.9);
    if (V.franja) { c.fillStyle = col(V.franja); c.fillRect(-30.5, -11.6, 61, 2.6); }
    if (V.puerta) { poly([-16, -17, 13, -17, 13, -6, -16, -6], V.puerta, 0.5); line(-1, -17, -1, -6, dark(V.puerta), 0.6); line(3, -14, 6, -14, "#2a2a2a", 0.9); line(-8, -14, -5, -14, "#2a2a2a", 0.9); }
    if (V.taxi) { rr(-5, -30, 11, 3.6, 1); paint(V.taxi, 0.6); }
    c.fillStyle = col("#3f434a"); c.fillRect(-31.5, -7.4, 63, 2.1);
    lights(30, -11.4, -30.6, -12);
    wheel(-18.5, -r, r, a); wheel(19, -r, r, a);
  }
  function mini(V, d) { // el coche pequeño de pueblo, redondo y antiguo
    const r = 5, a = d / r;
    beam(23, -9);
    shadow(0, 23);
    c.beginPath(); c.moveTo(-23, -5.4); c.quadraticCurveTo(-24, -16, -15, -18); c.quadraticCurveTo(-11, -26, -2, -26); c.quadraticCurveTo(7, -26, 11, -17);
    c.quadraticCurveTo(22, -16, 23, -9); c.lineTo(23, -5.4); c.closePath(); paint(V.col, 0.9);
    c.beginPath(); c.moveTo(-13, -17.4); c.quadraticCurveTo(-9.6, -23.6, -3, -24); c.lineTo(-3, -17.4); c.closePath(); paint(glass(), 0.6);
    c.beginPath(); c.moveTo(-1, -17.4); c.lineTo(-1, -24); c.quadraticCurveTo(5.4, -23.6, 8.6, -17.4); c.closePath(); paint(glass(), 0.6);
    c.save(); c.beginPath(); c.rect(-1, -24, 10, 6.6); c.clip(); driver(3.4, -20.4, "#e3b184", "#9a9a9a"); c.restore();
    line(-2, -17, -2, -7, dark(V.col), 0.6);
    c.fillStyle = col("#c9ced6"); c.fillRect(-23.4, -7, 47, 1.7);
    lights(22, -10, -22.8, -10.6);
    wheel(-13.5, -r, r, a); wheel(14, -r, r, a);
  }
  function bus(V, d) {
    const r = 6.6, a = d / r;
    beam(52, -12);
    shadow(0, 52);
    rr(-52, -39, 104, 33.6, 5); paint(V.col, 1);
    c.fillStyle = col(V.franja || "#ffffff"); c.fillRect(-51.4, -15, 102.8, 3.2);
    for (let i = 0; i < 6; i++) {
      const x = -47 + i * 15;
      rr(x, -34, 13, 11.5, 1.6); paint(glass(), 0.5);
      if (V.pas[i]) { c.save(); rr(x, -34, 13, 11.5, 1.6); c.clip(); disc(x + 6.4, -27, 2.9, V.pas[i], 0.3); rr(x + 2.6, -24.6, 7.6, 6, 2); paint("#4b5d78", 0); c.restore(); }
    }
    rr(43, -34, 7.4, 26, 1.4); paint(glass(), 0.6);
    c.save(); c.beginPath(); c.rect(43, -34, 7.4, 26); c.clip(); driver(46.4, -28.6, "#c98d5c", "#2a1c14"); c.restore();
    rr(29, -33.5, 12, 26.6, 1); paint(dark(glass()), 0.5); line(35, -33, 35, -7.5, OUT, 0.6);
    lights(51.2, -11, -51.6, -13);
    wheel(-30, -r, r, a); wheel(26, -r, r, a);
  }
  function pickup(V, d) {
    const r = 6, a = d / r;
    beam(32, -11);
    shadow(0, 31);
    c.beginPath(); c.moveTo(-32, -6); c.lineTo(-32, -17); c.lineTo(-3, -17); c.lineTo(-3, -28); c.quadraticCurveTo(-3, -29.4, -1, -29.4); c.lineTo(10, -29.4);
    c.quadraticCurveTo(12, -29.4, 13.4, -27.6); c.lineTo(19, -18); c.lineTo(28, -16.4); c.quadraticCurveTo(32, -15.4, 32, -11); c.lineTo(32, -6); c.closePath(); paint(V.col, 0.9);
    poly([0, -18, 0, -27, 10.6, -27, 16, -18], glass(), 0.6);
    c.save(); c.beginPath(); c.rect(0, -27, 16, 9); c.clip(); driver(7, -22.8, "#b77c4e", "#1f1610"); c.restore();
    rr(-29, -24, 10, 7.4, 1); paint("#c99a5b", 0.6); rr(-18, -22.4, 11, 5.8, 1); paint("#7fb84e", 0.6);
    line(-31.5, -12, -3.6, -12, dark(V.col), 0.7);
    c.fillStyle = col("#3f434a"); c.fillRect(-32.5, -7.4, 65, 2.1);
    lights(31, -11.6, -31.6, -13);
    wheel(-20, -r, r, a); wheel(20, -r, r, a);
  }
  function moto(V, d) {
    const r = 6.2, a = d / r;
    beam(19, -14);
    shadow(0, 18);
    wheel(-14, -r, r, a); wheel(14, -r, r, a);
    line(-14, -r, -3, -14, "#4a4d54", 1.8); line(14, -r, 9.5, -19, "#54575e", 1.8);
    rr(-9, -17.6, 17, 6.4, 3); paint(V.col, 0.8);
    rr(-13, -19.4, 12, 3.2, 1.4); paint("#26231f", 0.4);
    line(9.5, -19, 6.4, -21.8, "#26231f", 1.5);
    ell(13, -18.4, 1.8, 2, 0, night > 0.32 ? "#fff3b8" : "#f6efd2", 0.5);
    limb(-5, -20, 1.05, 7, -0.25, 7, 3, "#2d3a55"); ell(endX + 1, endY, 2.4, 1.2, 0, "#2a2018", 0.5);
    c.save(); c.translate(-5, -20); c.rotate(0.28); rr(-3.8, -11, 7.6, 12, 3); paint(V.top || "#a83a30"); c.restore();
    limb(-1.6, -29, 1, 5, 0.75, 5, 2.3, V.top || "#a83a30"); disc(endX, endY, 1.3, "#e3b184", 0.4);
    disc(-0.8, -35.4, 5.1, V.casco || "#f2f2ee");
    c.beginPath(); c.arc(-0.8, -35.2, 4, -0.5, 0.75); c.lineTo(-0.2, -33.8); c.closePath(); paint("#2c3d55", 0.3);
  }
  function bike(V, d) {
    const r = 7.2, a = d / r, crank = (d / 16) * TAU;
    shadow(0, 17);
    for (const wx of [-13, 13]) {
      c.beginPath(); c.arc(wx, -r, r - 0.4, 0, TAU); c.strokeStyle = col("#26231f"); c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = col("#9aa0a8"); c.lineWidth = 0.4; c.beginPath();
      for (let i = 0; i < 5; i++) { const q = a + (i * TAU) / 5; c.moveTo(wx, -r); c.lineTo(wx + Math.cos(q) * (r - 1), -r + Math.sin(q) * (r - 1)); }
      c.stroke();
    }
    const px = 0, py = -r + 0.6, hipX = -5.4, hipY = -21;
    const fx1 = px + Math.cos(crank) * 3.4, fy1 = py + Math.sin(crank) * 3.4, fx2 = px - Math.cos(crank) * 3.4, fy2 = py - Math.sin(crank) * 3.4;
    reach(hipX, hipY, fx2, fy2 - 1, 8, 8, 2.4, dark(V.pant || "#33415c")); ell(endX + 0.8, endY + 0.3, 2.2, 1.1, 0, "#2a2018", 0.4);
    c.strokeStyle = col(V.col); c.lineWidth = 1.6; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(-13, -r); c.lineTo(px, py); c.lineTo(-5, -18); c.lineTo(-13, -r); c.moveTo(-5, -18); c.lineTo(8.6, -19); c.lineTo(px, py); c.moveTo(13, -r); c.lineTo(9, -22); c.stroke();
    line(9, -22, 12, -23, "#26231f", 1.4);
    rr(-9, -21.6, 7, 2, 0.8); paint("#26231f", 0);
    line(px, py, fx1, fy1, "#4a4d54", 0.9);
    reach(hipX, hipY, fx1, fy1 - 1, 8, 8, 2.6, V.pant || "#33415c"); ell(endX + 0.8, endY + 0.3, 2.2, 1.1, 0, "#2a2018", 0.4);
    c.save(); c.translate(hipX, hipY); c.rotate(0.42); rr(-3.6, -11, 7.2, 12, 3); paint(V.top || "#2fa64a"); c.restore();
    limb(-0.4, -29.4, 0.92, 6, 0.55, 5.6, 2.2, V.top || "#2fa64a"); disc(endX, endY, 1.3, V.piel || "#e3b184", 0.4);
    const L = BIKER; L.pelo = V.pelo || "#2a1c14"; L.piel = V.piel || "#e3b184"; L.peinado = V.peinado || "corto"; L.gorro = V.gorro;
    c.save(); c.scale(0.9, 0.9); head(L, 2, -39.4, 0); c.restore();
  }
  const BIKER = { piel: "", pelo: "", peinado: "corto", f: 2 };
  function tractor(V, d) {
    const R = 10.5, r = 5.4;
    shadow(-1, 27);
    // humo suave que sube y se deshace
    for (let i = 0; i < 3; i++) {
      const k = mod(now * 0.5 + i / 3, 1);
      c.fillStyle = "rgba(235,235,230," + (0.3 * (1 - k)).toFixed(3) + ")";
      c.beginPath(); c.arc(12 - k * 6, -33 - k * 12, 1.7 + k * 3, 0, TAU); c.fill();
    }
    rr(-5, -22, 30, 13, 3); paint(V.col, 0.9);
    rr(9, -24, 15, 5, 2); paint(V.col, 0.8);
    line(12, -24, 12, -33, "#3f434a", 1.6);
    for (let i = 0; i < 3; i++) line(13 + i * 3.6, -18.5, 13 + i * 3.6, -11.5, dark(V.col), 0.7);
    rr(-16, -38, 17, 2, 0.8); paint("#2f3338", 0);
    line(-15, -37, -15, -20, "#2f3338", 1.3); line(0, -37, 3, -22, "#2f3338", 1.3);
    disc(-7, -30.4, 3.5, "#d9a066", 0.5);
    c.beginPath(); c.arc(-7, -31, 3.8, Math.PI, 0); c.closePath(); paint("#f2d05e", 0.4);
    rr(-10.6, -27.4, 7.2, 8, 2); paint("#3f6fa8", 0);
    line(-4, -25, 3, -24, "#d9a066", 1.6);
    wheelBig(-12, -R, R, d / R);
    wheelBig(19, -r, r, d / r);
  }
  function wheelBig(x, y, r, ang) {
    disc(x, y, r, "#26231f", 0);
    c.strokeStyle = col("#454038"); c.lineWidth = r * 0.16; c.setLineDash([r * 0.3, r * 0.34]); c.lineDashOffset = -ang * r;
    c.beginPath(); c.arc(x, y, r * 0.9, 0, TAU); c.stroke(); c.setLineDash([]);
    disc(x, y, r * 0.5, "#f2c43a", 0.5);
    c.strokeStyle = col("#b4861f"); c.lineWidth = r * 0.1; c.lineCap = "round"; c.beginPath();
    for (let i = 0; i < 4; i++) { const a = ang + (i * TAU) / 4; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.46, y + Math.sin(a) * r * 0.46); }
    c.stroke();
  }
  function arepas(L, d) { // carrito de arepas empujado por su dueño
    const r = 4.6;
    c.save(); c.translate(19, 0);
    shadow(0, 14);
    wheel(-8, -r, r, d / r); wheel(8, -r, r, d / r);
    rr(-13, -21, 26, 13, 1.6); paint("#f4d35e", 0.9);
    c.fillStyle = col("#d63a32"); c.fillRect(-12.6, -14, 25.2, 2.6);
    ell(-5, -18, 2.5, 1.4, 0, "#e7bd76", 0.4); ell(1, -18, 2.5, 1.4, 0, "#e7bd76", 0.4); ell(7, -18, 2.5, 1.4, 0, "#e7bd76", 0.4);
    line(0, -21, 0, -36, "#7c5a36", 1.2);
    c.beginPath(); c.moveTo(-15, -33); c.quadraticCurveTo(0, -43, 15, -33); c.closePath(); paint("#e5533d", 0.8);
    c.beginPath(); c.moveTo(-5, -36.6); c.quadraticCurveTo(0, -42, 5, -36.6); c.lineTo(5, -33); c.lineTo(-5, -33); c.closePath(); paint("#fff6e0", 0);
    line(-13, -17, -18, -17.5, "#6b4a25", 1.2);
    c.restore();
    walker(L, d);
  }

  // ---------- agua ----------
  function ripples(x, w, f) {
    c.strokeStyle = "rgba(255,255,255,0.42)"; c.lineWidth = 0.9; c.lineCap = "round";
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const k = mod(now * 0.45 + i / 3 + f, 1), half = w * (0.7 + k * 0.6), y = 1 + i * 0.3;
      c.globalAlpha = 1 - k;
      c.beginPath(); c.moveTo(x - half, y); c.quadraticCurveTo(x, y + 1.8, x + half, y); c.stroke();
    }
    c.globalAlpha = 1;
  }
  function rowboat(V, d) {
    const q = (d / 34) * TAU, pull = Math.sin(q), up = Math.cos(q);
    ripples(0, 25, 0.1);
    // quien rema se inclina adelante y atrás
    c.save(); c.translate(-2, -7);
    c.rotate(-pull * 0.26);
    rr(-3.6, -11, 7.2, 11.5, 3); paint("#f2734a");
    const L = ROWER; c.save(); c.scale(0.92, 0.92); head(L, 0.6, -16.4, 0); c.restore();
    c.restore();
    const hx = 4 - pull * 3, hy = -11.5;
    line(0, -14 - pull * 0.5, hx, hy, "#f2734a", 2.4); disc(hx, hy, 1.4, "#e3b184", 0.4);
    const blade = hx - 9 + pull * 11, by = 2 - Math.max(0, up) * 5.6;
    line(hx, hy, blade, by, "#a8743f", 1.2);
    ell(blade, by, 2.8, 1.1, 0.5, "#d9b27c", 0.4);
    c.beginPath(); c.moveTo(-24, -7); c.quadraticCurveTo(-19, 2, -10, 2); c.lineTo(13, 2); c.quadraticCurveTo(23, 1, 27, -8); c.closePath(); paint(V.col, 0.9);
    line(-22, -5.4, 25, -6, "#fff6e0", 1.1);
  }
  const ROWER = { piel: "#e3b184", pelo: "#f0d060", peinado: "sombrero", gorro: "#fff6e0", f: 3 };
  function duck(d, f, s) {
    const bob = Math.sin(now * 1.5 + f) * 0.35;
    c.save(); c.scale(s, s); c.translate(0, bob);
    ripples(0, 8, f);
    ell(0, -2.6, 6, 3.4, 0, "#fbf3dc", 0.6);
    poly([-5, -4, -9, -6.6, -4.2, -1.6], "#fbf3dc", 0.5);
    disc(4.8, -7.2, 2.7, "#2f8f55", 0.6);
    c.fillStyle = col("#fff"); c.fillRect(3, -5, 3.4, 0.8);
    disc(5.6, -7.8, 0.5, OUT, 0);
    poly([7, -7.5, 9.8, -6.6, 7, -5.9], "#e8a32a", 0.3);
    c.restore();
  }
  function dolphin(x, wy, f) {
    // salta cada unos segundos: arco, salpicadura al salir y al entrar
    const period = 7.5, cyc = mod(now + f, period), dur = 1.45;
    if (cyc > dur + 0.5) return;
    const u = clamp(cyc / dur, 0, 1), arcH = 30, dx = (u - 0.5) * 58;
    if (cyc <= dur) {
      const y = wy + 8 - Math.sin(u * Math.PI) * arcH, rot = -Math.cos(u * Math.PI) * 0.95;
      c.save(); c.beginPath(); c.rect(x - 60, wy - 44, 120, 44); c.clip();
      c.translate(x + dx, y); c.rotate(rot);
      poly([-12, 0, -19, -5, -17, 0, -19, 4.6], "#4d7f9e", 0.6);
      poly([-1, -4.4, -6, -10.6, 3, -4.6], "#4d7f9e", 0.6);
      c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-6, -6.6, 6, -5); c.quadraticCurveTo(12, -3.4, 14, -1); c.lineTo(19, 0.4); c.lineTo(13, 1.8); c.quadraticCurveTo(0, 6.4, -14, 0); c.closePath(); paint("#6da6c6", 0.8);
      c.beginPath(); c.moveTo(-8, 1.2); c.quadraticCurveTo(2, 5.4, 13, 1.8); c.quadraticCurveTo(2, 2.4, -8, 1.2); c.closePath(); paint("#e6f3f8", 0);
      disc(9.6, -1.4, 0.7, OUT, 0);
      poly([2, 3, -2, 8, 5.8, 3.4], "#4d7f9e", 0.5);
      c.restore();
    }
    for (const sx of [-29, 29]) {
      const age = sx < 0 ? cyc - 0.06 : cyc - dur + 0.1;
      if (age < 0 || age > 0.6) continue;
      const k = age / 0.6;
      c.fillStyle = "rgba(255,255,255," + (0.7 * (1 - k)).toFixed(3) + ")";
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(x + sx + i * (2 + k * 5), wy - Math.sin(k * Math.PI) * (7 - Math.abs(i) * 1.6), 1.3 - k * 0.5, 0, TAU); c.fill(); }
    }
  }

  // ---------- quién anda por cada sitio ----------
  const P = (piel, pelo, peinado, top, pant, extra) => Object.assign({ piel, pelo, peinado, top, pant }, extra);
  const W = (L) => (d) => walker(L, d);
  const walkDog = (L, coat, belly) => (d) => {
    const h = walker(L, d);
    c.save(); c.translate(22, 0);
    const col2 = dog(d, L.f || 0, coat, belly);
    c.restore();
    c.strokeStyle = col("#4a3322"); c.lineWidth = 0.6; c.beginPath(); c.moveTo(h.x, h.y); c.quadraticCurveTo(14, -3 + Math.sin(now * 2) * 0.8, 22 + col2.x, col2.y); c.stroke();
  };
  const parent = (A, B) => (d) => { c.save(); c.translate(-15, 0); c.scale(0.72, 0.72); walker(B, d / 0.72); c.restore(); walker(A, d); };
  const couple = (A, B) => (d) => { c.save(); c.translate(-14, 0); walker(B, d); c.restore(); walker(A, d); };
  const birds = (a, b) => () => { pigeon(-16, 0.2, a, b); pigeon(2, 2.6, a, b); pigeon(19, 4.4, a, b); };
  const hens = () => (d) => { c.save(); c.translate(-13, 0); chick(d, 0.3); c.translate(-8, 0); chick(d, 1.3); c.translate(-8, 0); chick(d, 2.2); c.restore(); hen(d, 0.4); };

  // listas: b = dónde empieza, v = velocidad (px/s; negativa, hacia la izquierda), w = medio ancho
  const SCENES = [
    { // Caracas
      a0: [
        { b: 120, v: 23, w: 12, f: W(P("#d9a066", "#2a1c14", "largo", "#e84a7a", "#39415e", { acc: "bolso", f: 0.5 })) },
        { b: 590, v: -21, w: 12, f: W(P("#a8703f", "#1f1610", "sombrero", "#f4f1e6", "#6b5a43", { gorro: "#e8cf8e", f: 2.1 })) },
        { b: 930, v: -18, w: 40, f: walkDog(P("#f2c9a0", "#6b3f22", "coleta", "#3fa7c4", "#31364f", { acc: "correa", f: 1.2 }), "#c98d4f", "#efd6ad") },
      ],
      a1: [
        { b: 260, v: 13, w: 42, f: (d) => arepas(P("#7a4a28", "#17110c", "gorra", "#fdfdf7", "#4c5a78", { gorro: "#ffd23f", acc: "empuja", f: 0.2 }), d) },
        { b: 520, v: 0, w: 28, f: birds("#8c9aa8", "#6f7e8d") },
        { b: 760, v: 26, w: 12, f: W(P("#a8703f", "#17110c", "rizos", "#ffd23f", "#2c3f66", { acc: "movil", f: 3 })) },
        { b: 1040, v: 19, w: 24, f: parent(P("#d9a066", "#40281a", "moño", "#7fbf5a", "#c95f8a", { falda: true, acc: "bolso", accCol: "#e2b04a", f: 1.7 }), P("#d9a066", "#40281a", "corto", "#e5533d", "#33507c", { acc: "globo", accCol: "#3fa7f0", f: 1.7 })) },
      ],
      c0: [
        { b: 150, v: -38, w: 34, s: 1, f: (d) => sedan({ col: "#ffd23f", taxi: "#fff", franja: "#2a2a2a" }, d) },
        { b: 640, v: -38, w: 54, s: 1, f: (d) => bus({ col: "#f4f1e6", franja: "#2f8fd0", pas: ["#d9a066", 0, "#7a4a28", "#f2c9a0", 0, "#a8703f"] }, d) },
        { b: 1160, v: -38, w: 22, f: (d) => moto({ col: "#2f6fd0", top: "#3b4a63", casco: "#e5533d" }, d) },
      ],
      c1: [
        { b: 80, v: 72, w: 34, f: (d) => sedan({ col: "#c9423a", piel: "#a8703f" }, d) },
        { b: 560, v: 72, w: 34, f: (d) => pickup({ col: "#3f7fb5" }, d) },
        { b: 1010, v: 72, w: 34, f: (d) => sedan({ col: "#eaeaea", piel: "#d9a066", pelo: "#40281a" }, d) },
      ],
    },
    { // La playa
      a0: [
        { b: 140, v: 22, w: 20, f: W(P("#e8b78c", "#d9b24f", "corto", "#2fb5a8", "#2a6fb0", { acc: "tabla", f: 0.8 })) },
        { b: 620, v: 0, w: 12, f: () => gullStand(0, 0.7) },
        { b: 900, v: -19, w: 24, f: parent(P("#c98d5c", "#3a2518", "largo", "#ff7f6a", "#ff7f6a", { falda: true, f: 2.4 }), P("#c98d5c", "#3a2518", "coleta", "#ffd23f", "#3fa7c4", { acc: "cubo", accCol: "#e5533d", f: 2.4 })) },
      ],
      a1: [
        { b: 300, v: 7, w: 14, f: (d) => crab(d, 0.4) },
        { b: 540, v: 24, w: 12, f: W(P("#7a4a28", "#17110c", "sombrero", "#f4f1e6", "#d9783a", { gorro: "#f0d58a", gafas: true, f: 1.6 })) },
        { b: 820, v: -6, w: 14, f: (d) => crab(d, 2.2) },
        { b: 1010, v: -24, w: 12, f: W(P("#f2c9a0", "#a65a2a", "coleta", "#ef476f", "#ef476f", { falda: true, gafas: true, f: 3.4 })) },
      ],
      c0: [
        { b: 210, v: 0, w: 60, f: null, delfin: 0.6 },
        { b: 720, v: -12, w: 14, f: (d) => { duck(d, 0.3, 1); c.save(); c.translate(-15, 1); duck(d, 1.1, 0.62); c.translate(-11, 0); duck(d, 2.2, 0.62); c.restore(); } },
      ],
      c1: [
        { b: 130, v: 20, w: 30, f: (d) => rowboat({ col: "#d9483b" }, d) },
        { b: 640, v: 20, w: 30, f: (d) => rowboat({ col: "#2f7fbf" }, d) },
      ],
    },
    { // La montaña
      a0: [
        { b: 120, v: 18, w: 12, f: W(P("#f2c9a0", "#6b3f22", "gorra", "#d94f3a", "#46503e", { gorro: "#2f6fa8", acc: "mochila", accCol: "#e8a52e", f: 0.3 })) },
        { b: 160, v: 18, w: 12, f: W(P("#d9a066", "#2a1c14", "coleta", "#3f8fbf", "#3f3b36", { acc: "mochila", accCol: "#7a4f8f", f: 1.5 })) },
        { b: 760, v: -16, w: 40, f: walkDog(P("#e8b78c", "#9a9a9a", "sombrero", "#6f8a48", "#5a4a38", { gorro: "#6b5a43", acc: "correa", viejo: true, f: 2.6 }), "#3a2c22", "#c98d4f") },
      ],
      a1: [
        { b: 480, v: -12, w: 18, f: (d) => dog(d, 0.9, "#e8e0d0", "#fff") },
      ],
      c0: [
        { b: 90, v: 0, w: 26, s: 0.86, f: () => cow(0, 0.2, false) },
        { b: 175, v: 0, w: 14, s: 0.9, f: () => sheep(0, 1.3, false) },
        { b: 700, v: 0, w: 14, s: 0.9, f: () => sheep(0, 2.4, false) },
        { b: 745, v: 0, w: 14, s: 0.8, f: () => sheep(0, 4.1, false) },
        { b: 1040, v: 0, w: 26, s: 0.86, f: () => cow(0, 3.2, false) },
      ],
      c1: [
        { b: 340, v: 16, w: 30, f: (d) => tractor({ col: "#3f9a52" }, d) },
        { b: 860, v: 10, w: 28, f: (d) => cow(d, 1.1, true) },
        { b: 1240, v: 10, w: 14, f: (d) => sheep(d, 3.3, true) },
      ],
    },
    { // El pueblo blanco
      a0: [
        { b: 180, v: -11, w: 13, f: W(P("#e8b78c", "#22201f", "panuelo", "#2b2830", "#2b2830", { falda: true, viejo: true, acc: "baston", f: 0.4 })) },
        { b: 560, v: 17, w: 14, f: W(P("#c98d5c", "#6f6a62", "sombrero", "#f4f1e6", "#5b6b5a", { gorro: "#d8bd78", acc: "cesta", f: 1.1 })) },
        { b: 930, v: 11, w: 13, f: (d) => cat(d, 0.8, "#2e2a2a") },
      ],
      a1: [
        { b: 340, v: 6, w: 34, f: hens() },
        { b: 720, v: 20, w: 12, f: W(P("#e3b184", "#2a1c14", "largo", "#d6463a", "#3b3f55", { falda: true, acc: "bolso", accCol: "#e2b04a", f: 2.9 })) },
        { b: 1060, v: -10, w: 13, f: (d) => cat(d, 2.3, "#e8903a") },
      ],
      c0: [
        { b: 160, v: -30, w: 26, f: (d) => mini({ col: "#f4f1e6" }, d) },
        { b: 720, v: -30, w: 20, f: (d) => bike({ col: "#3b6fb0", top: "#fff6e0", pant: "#4d5a3f", peinado: "sombrero", gorro: "#d8bd78", piel: "#c98d5c" }, d) },
      ],
      c1: [
        { b: 120, v: 24, w: 46, f: (d) => donkeyCart(d, 0.2) },
        { b: 660, v: 24, w: 28, f: (d) => mini({ col: "#5fa8c8" }, d) },
      ],
    },
    { // Barcelona
      a0: [
        { b: 130, v: 20, w: 18, f: couple(P("#f2c9a0", "#d9b24f", "corto", "#e8e4d6", "#c47f3f", { gorro: "#fff", acc: "camara", gafas: true, f: 0.1 }), P("#f2c9a0", "#a65a2a", "largo", "#3fa7c4", "#f4f1e6", { acc: "mochila", accCol: "#e5533d", f: 2.5 })) },
        { b: 540, v: 0, w: 28, f: birds("#8c9aa8", "#6f7e8d") },
        { b: 820, v: -23, w: 12, f: W(P("#d9a066", "#17110c", "corto", "#2d3a55", "#7c6a58", { acc: "movil", f: 1.3 })) },
      ],
      a1: [
        { b: 360, v: -20, w: 40, f: walkDog(P("#f2c9a0", "#2a1c14", "moño", "#d94f6a", "#2b2f45", { acc: "correa", f: 0.7 }), "#f4efe6", "#fff") },
        { b: 720, v: 25, w: 12, f: W(P("#7a4a28", "#17110c", "rizos", "#f2a33a", "#39415e", { acc: "mochila", accCol: "#3f9a52", f: 2 })) },
        { b: 1040, v: 16, w: 12, f: W(P("#e8b78c", "#c9c9c9", "calvo", "#7a8f6a", "#57504a", { viejo: true, acc: "baston", f: 3.1 })) },
      ],
      c0: [
        { b: 190, v: -40, w: 54, f: (d) => bus({ col: "#d6322c", franja: "#fff", pas: ["#f2c9a0", "#d9a066", 0, "#7a4a28", "#f2c9a0", 0] }, d) },
        { b: 760, v: -40, w: 34, f: (d) => sedan({ col: "#1f2024", puerta: "#f6c82e", taxi: "#7fe08a", piel: "#c98d5c" }, d) },
        { b: 1200, v: -40, w: 20, f: (d) => bike({ col: "#d6322c", top: "#ffd23f", pant: "#33415c", peinado: "coleta", pelo: "#6b3f22" }, d) },
      ],
      c1: [
        { b: 100, v: 74, w: 34, f: (d) => sedan({ col: "#1f2024", puerta: "#f6c82e", taxi: "#7fe08a" }, d) },
        { b: 560, v: 74, w: 22, f: (d) => moto({ col: "#3fbfae", top: "#f4f1e6", casco: "#2a2c33" }, d) },
        { b: 980, v: 74, w: 34, f: (d) => sedan({ col: "#5c7ea8", piel: "#f2c9a0", pelo: "#a65a2a" }, d) },
      ],
    },
  ];

  const SPAN_A = 1180, SPAN_C = 1500;
  function row(list, span, y, s, scroll, t, W_) {
    for (let i = 0; i < list.length; i++) {
      const e = list[i], k = (e.s || 1) * s;
      const x = mod(e.b + e.v * t - scroll, span) - 150;
      if (x < -(e.w * k) - 6 || x > W_ + e.w * k + 6) continue;
      if (e.delfin != null) { dolphin(x, y - 5, e.delfin); continue; }
      c.save();
      c.translate(x, y);
      c.scale(e.v < 0 ? -k : k, k);
      e.f((Math.abs(e.v) * t) / k);
      c.restore();
    }
  }

  // la franja del suelo: acera (dos filas) y calle (dos carriles)
  function calle(ctx, i, info) {
    const S = SCENES[i];
    if (!S) return;
    c = ctx; now = info.t;
    setNight(info.night, info.tint);
    const gt = info.gt, sc = info.scroll, t = info.t, Wd = info.W;
    ctx.save();
    row(S.a0, SPAN_A, gt + 31, 0.8, sc, t, Wd);
    row(S.a1, SPAN_A, gt + 44, 0.96, sc, t, Wd);
    row(S.c0, SPAN_C, gt + 75, 0.78, sc, t, Wd);
    row(S.c1, SPAN_C, gt + 93, 1, sc, t, Wd);
    ctx.restore();
  }

  // ---------- pájaros del cielo: cada sitio los suyos ----------
  // 25/11/2026: ciudad de cualquier sitio (como Caracas, sin el carrito de arepas) para la vuelta al mundo
  SCENES.push({ a0: SCENES[0].a0, a1: SCENES[0].a1.filter((e) => !/arepas/.test(String(e.f))), c0: SCENES[0].c0, c1: SCENES[0].c1 });
  const FLY = [
    [ // guacamayas de Caracas, siempre en pareja
      { b: 0, v: 40, y: 104, s: 1, body: "#d9352c", wing: "#2f6fd0", tip: "#ffd23f", tail: 15, fl: 6.5, glide: 0.25 },
      { b: 34, v: 40, y: 122, s: 0.92, body: "#2f7fe0", wing: "#2358a8", tip: "#ffd23f", belly: "#ffd23f", tail: 15, fl: 6.1, glide: 0.25 },
    ],
    [ // gaviotas de la playa
      { b: 0, v: 30, y: 118, s: 1, body: "#fbfbf8", wing: "#aeb7c1", tip: "#3b3f46", beak: "#f0b23a", tail: 5, fl: 4.2, glide: 0.62 },
      { b: 300, v: 30, y: 158, s: 0.8, body: "#fbfbf8", wing: "#aeb7c1", tip: "#3b3f46", beak: "#f0b23a", tail: 5, fl: 4.6, glide: 0.62 },
      { b: 340, v: 30, y: 140, s: 0.72, body: "#fbfbf8", wing: "#aeb7c1", tip: "#3b3f46", beak: "#f0b23a", tail: 5, fl: 4.4, glide: 0.62 },
    ],
    [ // águila de la montaña, planea casi sin aletear
      { b: 0, v: 19, y: 132, s: 1.25, body: "#6b4526", wing: "#54351c", tip: "#2a1c12", head: "#f0e6cf", beak: "#e8b52e", tail: 7, fl: 2.4, glide: 0.86 },
    ],
    [ // golondrinas del pueblo
      { b: 0, v: 62, y: 128, s: 0.82, body: "#22305a", wing: "#1a2444", tip: "#121a33", belly: "#fff6e6", beak: "#333", tail: 10, fork: true, fl: 10, glide: 0.42 },
      { b: 46, v: 62, y: 112, s: 0.74, body: "#22305a", wing: "#1a2444", tip: "#121a33", belly: "#fff6e6", beak: "#333", tail: 10, fork: true, fl: 10.6, glide: 0.42 },
      { b: 104, v: 62, y: 142, s: 0.7, body: "#22305a", wing: "#1a2444", tip: "#121a33", belly: "#fff6e6", beak: "#333", tail: 10, fork: true, fl: 9.6, glide: 0.42 },
    ],
    [ // cotorras verdes de Barcelona
      { b: 0, v: 52, y: 112, s: 0.82, body: "#62c04a", wing: "#3f9a3a", tip: "#2f6fd0", belly: "#d9ecc0", beak: "#f0a53a", tail: 13, fl: 9, glide: 0.14 },
      { b: 30, v: 52, y: 126, s: 0.8, body: "#62c04a", wing: "#3f9a3a", tip: "#2f6fd0", belly: "#d9ecc0", beak: "#f0a53a", tail: 13, fl: 9.5, glide: 0.14 },
      { b: 62, v: 52, y: 106, s: 0.76, body: "#62c04a", wing: "#3f9a3a", tip: "#2f6fd0", belly: "#d9ecc0", beak: "#f0a53a", tail: 13, fl: 8.6, glide: 0.14 },
    ],
  ];
  FLY.push(FLY[3]); // golondrinas para las ciudades de la vuelta al mundo
  // ala: se abre arriba y abajo; a ratos planea con el ala quieta
  function wing(L, up, f, t) {
    const tipY = -L * up;
    c.beginPath(); c.moveTo(3.6, -1); c.quadraticCurveTo(1.6, tipY * 0.72, -4.4, tipY); c.quadraticCurveTo(-6.2, tipY * 0.42, -4.4, -0.4); c.closePath(); paint(f, 0.5);
    c.beginPath(); c.moveTo(-1.6, tipY * 0.66); c.quadraticCurveTo(-3, tipY * 0.9, -4.4, tipY); c.quadraticCurveTo(-5.6, tipY * 0.72, -4.9, tipY * 0.56); c.closePath(); paint(t, 0);
  }
  function flyer(B, tm) {
    const beat = Math.sin(tm * 0.42 + B.b) * 0.5 + 0.5;
    const flap = beat > B.glide ? Math.sin(tm * B.fl + B.b) : 0.22 + Math.sin(tm * 0.8 + B.b) * 0.06;
    const up = 0.3 + flap * 0.85, L = 11;
    wing(L, up * 0.88, dark(B.wing), dark(B.tip), tm);
    if (B.fork) { poly([-5, -0.5, -7 - B.tail, -2.4, -9, 0, -7 - B.tail, 2, -5, 1], B.body, 0.4); }
    else poly([-5, -1.3, -6 - B.tail, 0.4, -5, 1.5], B.tip === "#ffd23f" ? B.wing : B.body, 0.45);
    ell(0, 0, 6.4, 2.9, -0.04, B.body, 0.6);
    if (B.belly) ell(0.6, 1.2, 4.4, 1.3, 0, B.belly, 0);
    disc(5.6, -0.9, 2.5, B.head || B.body, 0.5);
    disc(6.4, -1.4, 0.48, OUT, 0);
    poly([7.8, -1.5, 10.2, -0.4, 7.8, 0.3], B.beak || "#2d2a26", 0.3);
    wing(L, up, B.wing, B.tip, tm);
  }
  function cielo(ctx, i, info) {
    const list = FLY[i];
    if (!list) return;
    c = ctx; now = info.t;
    setNight(info.night, info.tint);
    const span = info.W + 620;
    ctx.save();
    ctx.globalAlpha = info.day;
    for (let k = 0; k < list.length; k++) {
      const B = list[k], base = list[0].v * info.t;
      // cruzan de derecha a izquierda y vuelven a pasar pasado un rato
      const x = info.W + 70 + B.b * 0.8 - mod(base, span);
      if (x < -40 || x > info.W + 40) continue;
      const y = B.y + Math.sin(info.t * 0.42 + i) * 11 + Math.sin(info.t * 1.1 + B.b) * 2.2;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-B.s, B.s);
      flyer(B, info.t);
      ctx.restore();
    }
    ctx.restore();
  }

  return { calle, cielo };
})();
