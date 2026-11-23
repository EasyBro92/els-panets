// Los famosos de la zona Premium de Els Panets (23/11/2026).
// Personajes históricos y de libros antiguos, todos de dominio público. Se dibujan como sus
// retratos o ilustraciones clásicas, nunca como las versiones de películas o marcas.
// Fuera a propósito (su imagen o su nombre siguen protegidos): Einstein, Chaplin, Frida Kahlo,
// Dalí, Picasso, Marilyn, Zorro, Tarzán y Peter Pan; tampoco el Drácula o el Frankenstein del cine.
// En partida se usan dibujos ya hechos (sprites), así el detalle no gasta más en el móvil.
(function () {
  "use strict";
  const OL = "#2a1c14", TAU = Math.PI * 2, X = 4.5, Y = -22;
  let c = null;

  // ---------- colores ----------
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hx = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hx(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const lt = (h, t) => mix(h, "#ffffff", t == null ? 0.2 : t);
  const dk = (h, t) => mix(h, "#000000", t == null ? 0.22 : t);
  const al = (h, a) => { const v = rgb(h); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")"; };

  // ---------- formas ----------
  function trace(p, smooth) {
    c.beginPath();
    if (!smooth) { p.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); return; }
    const n = p.length;
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[i], d = p[(i + 1) % n], e = p[(i + 2) % n];
      c.bezierCurveTo(b[0] + (d[0] - a[0]) / 6, b[1] + (d[1] - a[1]) / 6, d[0] - (e[0] - b[0]) / 6, d[1] - (e[1] - b[1]) / 6, d[0], d[1]);
    }
    c.closePath();
  }
  function paint(fill, w, col) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (w) { c.strokeStyle = col || OL; c.lineWidth = w; c.stroke(); }
  }
  const S = (p, fill, w, col) => { trace(p, true); paint(fill, w == null ? 1.5 : w, col); };
  const P = (p, fill, w, col) => { trace(p, false); paint(fill, w == null ? 1.5 : w, col); };
  function E(x, y, rx, ry, fill, w, rot, col) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); paint(fill, w || 0, col); }
  function line(p, col, w, straight) {
    c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    if (straight || p.length < 3) for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    else {
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[Math.max(0, i - 1)], b = p[i], d = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
        c.bezierCurveTo(b[0] + (d[0] - a[0]) / 6, b[1] + (d[1] - a[1]) / 6, d[0] - (e[0] - b[0]) / 6, d[1] - (e[1] - b[1]) / 6, d[0], d[1]);
      }
    }
    c.strokeStyle = col; c.lineWidth = w == null ? 1 : w; c.stroke();
  }
  function grad(g, cs) { cs.forEach((k, i) => g.addColorStop(cs.length > 1 ? i / (cs.length - 1) : 0, k)); return g; }
  const lin = (a, b, d, e, ...cs) => grad(c.createLinearGradient(a, b, d, e), cs);
  const rad = (x, y, r, ...cs) => grad(c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.08, x, y, r), cs);
  const gold = (a, b, d, e) => lin(a, b, d, e, "#fff4b8", "#f2c63e", "#a9741a", "#f6d668");
  const steel = (a, b, d, e) => lin(a, b, d, e, "#f4f7fa", "#b9c2cc", "#6c7681", "#d9dfe6");
  function inside(p, smooth, fn) { c.save(); trace(p, smooth); c.clip(); fn(); c.restore(); }
  function bbox(p) { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  // melena o barba: forma con degradado y mechones finos
  function hairS(p, col, n, bend, w) {
    const b = bbox(p), N = n == null ? 12 : n, B = bend == null ? 1.6 : bend;
    S(p, lin(b[0], b[1], b[2], b[3], lt(col, 0.24), col, dk(col, 0.34)), w == null ? 1.5 : w);
    inside(p, true, () => {
      const cx = (b[0] + b[2]) / 2;
      for (let i = 0; i < N; i++) {
        const x = b[0] + ((i + 0.5) / N) * (b[2] - b[0]);
        line([[x, b[1]], [x + B * (i % 2 ? 1 : -1), (b[1] + b[3]) / 2], [x + (x - cx) * 0.12, b[3]]], al(i % 2 ? lt(col, 0.5) : dk(col, 0.55), 0.55), 0.5);
      }
    });
  }
  function curls(list, r, col) {
    for (const q of list) {
      const R = q[2] || r;
      E(q[0], q[1], R, R, rad(q[0], q[1], R * 1.2, lt(col, 0.32), col, dk(col, 0.3)), 1);
      c.beginPath(); c.arc(q[0], q[1], R * 0.52, 2.6, 5.2); c.strokeStyle = al(dk(col, 0.5), 0.7); c.lineWidth = 0.5; c.stroke();
    }
  }
  function star(x, y, r, fill, w) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const R = i % 2 ? r * 0.42 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); }
    c.closePath(); paint(fill, w || 0);
  }
  function dots(list, r, fill) { for (const q of list) E(q[0], q[1], r, r, fill, 0.4); }

  // ---------- la cara ----------
  function facePath(x, y, rx, ry, k) {
    c.beginPath(); c.moveTo(x - rx, y - 2);
    c.bezierCurveTo(x - rx, y - ry * 1.12, x + rx, y - ry * 1.12, x + rx, y - 2);
    c.bezierCurveTo(x + rx, y + ry * 0.48, x + rx * k * 1.05, y + ry * 0.98, x, y + ry);
    c.bezierCurveTo(x - rx * k * 1.05, y + ry * 0.98, x - rx, y + ry * 0.48, x - rx, y - 2);
    c.closePath();
  }
  function neck(o) {
    const sh = o.shade || dk(o.skin, 0.24);
    P([[X - 5.2, Y + 8], [X + 4.8, Y + 8], [X + 5.6, Y + 15.5], [X - 6.4, Y + 15.5]], lin(X - 6, 0, X + 6, 0, o.skin, o.skin, sh), 1.4);
    line([[X - 4.5, Y + 12.4], [X, Y + 13.6], [X + 4.2, Y + 12.2]], al(sh, 0.8), 1.3);
  }
  function eye(ex, ey, s, f, sh) {
    const w = 3.45 * s, h = (f.eyeH || 1) * 2.35 * s;
    E(ex, ey - 0.2, w + 1.25, h + 1.15, al(sh, 0.3));
    const almond = () => { c.beginPath(); c.moveTo(ex - w, ey + 0.3); c.quadraticCurveTo(ex - 0.2, ey - h * 1.4, ex + w, ey - 0.15); c.quadraticCurveTo(ex, ey + h * 0.98, ex - w, ey + 0.3); c.closePath(); };
    almond(); c.fillStyle = f.white || "#fbf7ef"; c.fill();
    c.save(); almond(); c.clip();
    const ix = ex + 0.55 * s, iy = ey - 0.15;
    E(ix, iy, 2.2 * s, 2.2 * s, rad(ix, iy, 2.5 * s, lt(f.eye, 0.42), f.eye, dk(f.eye, 0.45)));
    c.beginPath(); c.arc(ix, iy, 2.2 * s, 0, TAU); c.strokeStyle = dk(f.eye, 0.55); c.lineWidth = 0.45; c.stroke();
    E(ix, iy, 1.05 * s, 1.05 * s, f.pupil || "#0d0906");
    E(ix - 0.75 * s, iy - 0.8 * s, 0.62 * s, 0.62 * s, "rgba(255,255,255,.95)");
    E(ix + 0.8 * s, iy + 0.75 * s, 0.28 * s, 0.28 * s, "rgba(255,255,255,.6)");
    c.fillStyle = "rgba(40,24,14,.22)"; c.fillRect(ex - w, ey - h * 1.2, w * 2, h * 0.62);
    c.restore();
    c.beginPath(); c.moveTo(ex - w, ey + 0.3); c.quadraticCurveTo(ex - 0.2, ey - h * 1.4, ex + w, ey - 0.15);
    c.strokeStyle = f.kohl || OL; c.lineWidth = f.kohl ? 1.5 : 1.15; c.stroke();
    c.beginPath(); c.moveTo(ex - w + 0.5, ey + 0.65); c.quadraticCurveTo(ex, ey + h * 1.02, ex + w - 0.4, ey + 0.2);
    c.strokeStyle = f.kohl ? al(f.kohl, 0.85) : al(OL, 0.42); c.lineWidth = f.kohl ? 0.8 : 0.55; c.stroke();
    if (f.kohl) line([[ex + w, ey - 0.15], [ex + w + 2.7, ey - 0.8]], f.kohl, 1.1, true);
    if (f.lash) for (const t of [-0.8, -0.35, 0.15, 0.6, 1]) line([[ex + t * w, ey - h * (1 - t * t * 0.45) * 0.75], [ex + t * w * 1.2 + 0.25, ey - h * 1.32]], OL, 0.45, true);
    if (f.age) line([[ex - w + 0.6, ey + h + 0.7], [ex, ey + h + 1.3], [ex + w - 0.4, ey + h + 0.5]], al(sh, 0.85), 0.55);
  }
  function brow(ex, y, left, f) {
    const d = left ? 1 : -1, a = f.browA || 0, h = f.arch == null ? 0.9 : f.arch, col = f.brow || "#3a2a20", w = f.browW || 1.8;
    const p = [[ex - d * 4, y + 0.7 - a * 0.5], [ex - d * 0.7, y - h], [ex + d * 3.5, y + 0.45 + a]];
    line(p, col, w);
    for (let i = 0; i < 5; i++) { const t = i / 4, bx = p[0][0] + (p[2][0] - p[0][0]) * t, by = p[0][1] + (p[2][1] - p[0][1]) * t - Math.sin(t * Math.PI) * (h + 0.3); line([[bx, by + w * 0.4], [bx - d * 0.55, by - w * 0.65]], al(lt(col, 0.3), 0.55), 0.34, true); }
  }
  function nose(f, skin, sh) {
    const n = f.nose || "recta", x = X + 1.3, t = Y + 0.6, b = Y + 6.6, col = al(dk(sh, 0.25), 0.95);
    c.fillStyle = al(lt(skin, 0.45), 0.55); c.beginPath(); c.ellipse(x - 0.3, t + 2.6, 0.72, 2.7, 0, 0, TAU); c.fill();
    if (n === "aguilena") {
      S([[x + 1, t], [x + 3.1, t + 2.9], [x + 2.9, b - 0.4], [x + 0.9, b + 1.1], [x - 1.2, b + 0.5], [x + 0.5, t + 3]], al(sh, 0.32), 0);
      line([[x + 0.8, t - 0.5], [x + 3.3, t + 3], [x + 3, b - 0.4], [x + 1, b + 1.1], [x - 1.5, b + 0.4]], col, 1.05);
    } else if (n === "ancha") {
      E(x + 0.1, b - 0.5, 3.5, 2.3, al(sh, 0.3));
      line([[x + 3.4, b - 1.6], [x + 3.7, b + 0.5], [x + 1.3, b + 1.3], [x - 1.5, b + 1.3], [x - 3.6, b + 0.4], [x - 3.3, b - 1.5]], col, 1.05);
    } else if (n === "fina") {
      line([[x + 0.5, t + 0.4], [x + 1.4, b - 1.6], [x + 1.8, b - 0.2], [x + 0.2, b + 0.5], [x - 1.1, b]], col, 0.9);
    } else if (n === "redonda") {
      E(x + 0.2, b - 0.6, 2.7, 2.3, rad(x + 0.2, b - 0.6, 3, lt(skin, 0.3), skin, mix(skin, sh, 0.65)));
      line([[x + 2.6, b - 1.5], [x + 2.8, b + 0.4], [x + 0.6, b + 1.5], [x - 1.8, b + 1.2], [x - 2.5, b + 0.2]], col, 0.85);
    } else {
      S([[x + 0.7, t + 0.3], [x + 2.1, b - 1.6], [x + 2.2, b + 0.2], [x + 0.2, b + 0.9], [x - 0.9, b - 0.2]], al(sh, 0.3), 0);
      line([[x + 0.6, t], [x + 1.6, b - 2.2], [x + 2.3, b - 0.3], [x + 0.4, b + 0.9], [x - 1.5, b + 0.15]], col, 1);
    }
    E(x + 0.95, b + 0.1, 0.62, 0.36, al(OL, 0.7), 0, 0.2); E(x - 0.85, b + 0.15, 0.52, 0.32, al(OL, 0.55), 0, -0.2);
  }
  function mouth(f, skin) {
    const m = f.mouth || "seria", x = X + 0.7, y = Y + 10.3, lip = f.lips || mix(skin, "#a34a3c", 0.55);
    if (m === "labios") {
      S([[x - 4, y], [x - 1.5, y - 1.6], [x, y - 1], [x + 1.6, y - 1.6], [x + 4, y], [x + 1.6, y + 1.9], [x - 1.6, y + 1.9]], lin(x, y - 2, x, y + 2, lt(lip, 0.1), lip, dk(lip, 0.2)), 0.8, dk(lip, 0.45));
      line([[x - 3.8, y], [x, y + 0.25], [x + 3.8, y]], dk(lip, 0.55), 0.6);
      E(x - 0.9, y + 1, 1, 0.4, "rgba(255,255,255,.5)");
    } else if (m === "sonrisa" || m === "dientes") {
      S([[x - 4.6, y - 1], [x, y - 0.3], [x + 4.6, y - 1.1], [x + 2.5, y + 2.9], [x - 2.5, y + 2.9]], "#6e2020", 0.9);
      inside([[x - 4.6, y - 1], [x, y - 0.3], [x + 4.6, y - 1.1], [x + 2.5, y + 2.9], [x - 2.5, y + 2.9]], true, () => { c.fillStyle = "#fffdf6"; c.fillRect(x - 5, y - 1.2, 10, 2.2); E(x, y + 3, 2.4, 1.2, "#d65c5c"); });
      line([[x - 4.9, y - 1.3], [x - 4.4, y - 0.7]], OL, 0.7, true); line([[x + 4.9, y - 1.4], [x + 4.4, y - 0.8]], OL, 0.7, true);
    } else if (m === "colmillos") {
      S([[x - 4.2, y - 0.6], [x, y], [x + 4.2, y - 0.8], [x + 2.3, y + 2.2], [x - 2.3, y + 2.2]], "#5c1016", 0.9);
      for (const d of [-2.5, 2.3]) P([[x + d - 0.9, y - 0.3], [x + d + 0.9, y - 0.35], [x + d, y + 2.5]], "#fff", 0.4);
    } else if (m === "fina") {
      line([[x - 4, y + 0.35], [x - 1, y + 0.05], [x + 1.2, y + 0.05], [x + 4, y + 0.1]], dk(lip, 0.42), 1);
      line([[x - 1.5, y + 1.5], [x, y + 1.8], [x + 1.5, y + 1.5]], al(dk(skin, 0.35), 0.75), 0.6);
    } else if (m === "enfado") {
      line([[x - 3.9, y + 1], [x, y - 0.25], [x + 3.9, y + 0.8]], dk(lip, 0.45), 1.2);
      line([[x - 1.6, y + 1.8], [x, y + 2.1], [x + 1.6, y + 1.8]], al(dk(skin, 0.35), 0.8), 0.6);
    } else {
      S([[x - 3.7, y + 0.2], [x - 1.2, y - 0.8], [x + 0.2, y - 0.5], [x + 1.5, y - 0.8], [x + 3.7, y + 0.1], [x + 1.2, y + 1.3], [x - 1.3, y + 1.3]], lip, 0.6, dk(lip, 0.45));
      line([[x - 3.6, y + 0.2], [x, y + 0.2], [x + 3.6, y + 0.1]], dk(lip, 0.55), 0.6);
    }
  }
  function head(o) {
    const f = o.f, rx = f.rx || 11.4, ry = f.ry || 14.2, k = f.chin == null ? 0.55 : f.chin, skin = o.skin, sh = o.shade || dk(skin, 0.24);
    if (!f.noEar) for (const q of [[X - rx + 0.2, -1], [X + rx - 0.1, 1]]) {
      E(q[0], Y + 1, 2.5, 3.7, lin(q[0] - 2, 0, q[0] + 2, 0, skin, sh), 1.3, q[1] * 0.14);
      line([[q[0] - 0.6 * q[1], Y - 1.2], [q[0] + 0.7 * q[1], Y + 0.8], [q[0] - 0.2 * q[1], Y + 2.8]], al(dk(sh, 0.3), 0.8), 0.55);
    }
    facePath(X, Y, rx, ry, k);
    c.fillStyle = rad(X - 2, Y - 3, rx * 1.65, lt(skin, 0.2), skin, skin, sh); c.fill();
    c.save(); facePath(X, Y, rx, ry, k); c.clip();
    c.fillStyle = al(sh, 0.5); c.beginPath(); c.rect(X - rx - 3, Y - ry - 3, rx * 2 + 6, ry * 2 + 6); c.ellipse(X - 2.8, Y - 2.9, rx * 1.04, ry * 1.03, 0, 0, TAU); c.fill("evenodd");
    E(X - 6.2, Y + 4.6, 3.6, 2.5, f.blush || "rgba(226,106,96,.22)"); E(X + 7, Y + 4.6, 3.3, 2.4, f.blush || "rgba(226,106,96,.2)");
    if (f.spots) f.spots();
    c.restore();
    facePath(X, Y, rx, ry, k); c.strokeStyle = OL; c.lineWidth = 1.55; c.stroke();
    const ey = Y - 0.9, ex1 = X - 4.8, ex2 = X + 5.2;
    if (f.age) {
      for (let i = 0; i < f.age + 1; i++) line([[X - 6.5, Y - 7.6 - i * 1.5], [X, Y - 8.2 - i * 1.5], [X + 6.8, Y - 7.6 - i * 1.5]], al(dk(sh, 0.3), 0.72), 0.5);
      line([[X - 0.5, Y + 4.5], [X - 3.2, Y + 7.8], [X - 4.2, Y + 10.4]], al(dk(sh, 0.3), 0.7), 0.58);
      line([[X + 3.7, Y + 4.3], [X + 5.6, Y + 7.6], [X + 6, Y + 10.2]], al(dk(sh, 0.3), 0.7), 0.58);
      for (const d of [-1, 1]) line([[X + d * 8.8 + 0.3, Y - 2.2], [X + d * 10.2 + 0.3, Y - 1.5]], al(dk(sh, 0.3), 0.7), 0.42, true);
    }
    eye(ex1, ey, 0.94, f, sh); eye(ex2, ey, 1, f, sh);
    brow(ex1, ey - 4, true, f); brow(ex2, ey - 4, false, f);
    if (f.nose !== "ninguna") nose(f, skin, sh);
    mouth(f, skin);
    if (f.extra) f.extra();
  }

  // ---------- ropa que se repite ----------
  const TORSO = [[-10, -9], [-5, -10.7], [6, -10.7], [11, -9], [13, -2.5], [12.3, 8], [11.6, 15.5], [-11.6, 15.5], [-12.3, 8], [-13, -2.5]];
  function torso(col, o) {
    o = o || {};
    S(TORSO, lin(-13, -10, 13, 16, lt(col, 0.2), col, dk(col, 0.3)), 1.8);
    inside(TORSO, true, () => {
      line([[-9, -3], [-6, 5], [-7.5, 15]], al(dk(col, 0.42), 0.55), 0.8);
      line([[9.5, -2], [7, 6], [8, 15]], al(dk(col, 0.42), 0.55), 0.8);
      line([[-3, 9], [1, 11], [6, 9.4]], al(dk(col, 0.42), 0.4), 0.6);
      E(-6, -2.6, 2.6, 5.2, al(lt(col, 0.7), 0.17), 0, -0.3);
      if (o.fn) o.fn();
    });
    S(TORSO, null, 1.8);
  }
  function legs(col, shoe, o) {
    o = o || {};
    for (const lx of [-5, 3.6]) {
      line([[lx, 12], [lx - 3, 22]], OL, 8.2, true); line([[lx, 12], [lx - 3, 22]], col, 5.5, true);
      line([[lx + 1.4, 12.5], [lx - 1.6, 21.5]], al(lt(col, 0.6), 0.55), 0.8, true);
      line([[lx - 1.6, 12.5], [lx - 4.5, 21.5]], al(dk(col, 0.5), 0.65), 1, true);
      if (o.stock) { line([[lx - 1.7, 18], [lx - 3, 22]], OL, 7, true); line([[lx - 1.7, 18], [lx - 3, 22]], o.stock, 4.7, true); if (o.stripe) for (const yy of [18.7, 20.3, 21.9]) line([[lx - 5, yy], [lx - 0.5, yy - 0.4]], o.stripe, 1, true); }
      if (o.sandal) {
        line([[lx - 4.7, 19], [lx - 0.8, 18.6]], "#7a4a22", 1.2, true); line([[lx - 5, 21.6], [lx - 0.9, 21.2]], "#7a4a22", 1.2, true);
        S([[lx - 8, 24.4], [lx - 3, 23], [lx + 2, 24.2], [lx + 2, 26], [lx - 8, 26]], "#9a6532", 1.1);
      } else if (o.boot) {
        line([[lx - 1.1, 15.5], [lx - 3, 22]], OL, 8.4, true); line([[lx - 1.1, 15.5], [lx - 3, 22]], o.boot, 5.8, true);
        line([[lx - 0.2, 16.5], [lx - 2, 21.8]], al(lt(o.boot, 0.65), 0.6), 0.8, true);
        P([[lx - 4.8, 14.4], [lx + 2.6, 14.9], [lx + 2.1, 17.4], [lx - 5.2, 16.9]], o.cuff || lt(o.boot, 0.25), 1);
      }
      if (!o.sandal) {
        S([[lx - 8.2, 24.6], [lx - 6, 22.2], [lx - 1, 21.7], [lx + 2, 23.2], [lx + 2.2, 26], [lx - 8, 26.2]], lin(0, 22, 0, 26.2, lt(shoe, 0.35), shoe, dk(shoe, 0.3)), 1.25);
        E(lx - 4.6, 23.5, 1.8, 0.65, "rgba(255,255,255,.34)", 0, -0.15);
        c.fillStyle = o.sole || dk(shoe, 0.42); c.fillRect(lx - 8, 25.6, 10.2, 1.1);
        if (o.buckle) { c.strokeStyle = "#f2c63e"; c.lineWidth = 0.9; c.strokeRect(lx - 4.7, 22.4, 2.8, 2.1); }
      }
    }
  }
  function skirt(col, o) {
    o = o || {};
    const p = [[-10.5, 6], [10.8, 6], [14.2, 16], [16, 25], [-16.5, 25], [-14.4, 16]];
    for (const lx of [-5, 3.8]) S([[lx - 5.2, 24], [lx, 23.2], [lx + 2.8, 25], [lx + 2.6, 27.2], [lx - 5.4, 27.2]], o.shoe || "#2b2020", 1.15);
    P(p, lin(-15, 6, 15, 25, lt(col, 0.2), col, dk(col, 0.3)), 1.7);
    inside(p, false, () => {
      for (let i = -3; i <= 3; i++) { line([[i * 2.2, 7], [i * 3.2, 15], [i * 4.6, 25]], al(dk(col, 0.45), 0.55), 0.7); line([[i * 2.2 + 0.8, 7], [i * 3.2 + 1, 15], [i * 4.6 + 1.3, 25]], al(lt(col, 0.6), 0.4), 0.5); }
      if (o.hem) { c.fillStyle = o.hem; c.fillRect(-17, 22, 34, 3.2); c.fillStyle = al(lt(o.hem, 0.6), 0.55); c.fillRect(-17, 22, 34, 0.5); }
      if (o.fn) o.fn();
    });
    P(p, null, 1.7);
  }
  function capeBack(col, lining, w, h) {
    const W = w || 19, H = h || 28;
    const p = [[-8, -10], [8, -10], [W, 2], [W + 2, H], [W - 7, H - 2], [W - 14, H + 1], [1, H - 2], [-W + 14, H + 1], [-W + 7, H - 2], [-W - 2, H], [-W, 2]];
    P(p, lin(-W, 0, W, H, lt(lining, 0.15), lining, dk(lining, 0.42)), 1.7);
    inside(p, false, () => { for (let i = -3; i <= 3; i++) line([[i * 2, -8], [i * 4.2, 10], [i * 6, H + 2]], al(dk(lining, 0.55), 0.55), 0.8); });
    if (col !== lining) { line([[-W, 2], [-W - 2, H]], col, 2.6, true); line([[W, 2], [W + 2, H]], col, 2.6, true); }
  }
  function ruff(y, W, col) {
    const k = col || "#fbf8ee", n = 13;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = Math.PI * (1 - t), x = X + Math.cos(a) * W, yy = y + Math.sin(a) * W * 0.42;
      E(x, yy, W * 0.24, W * 0.21, lin(x, yy - 3, x, yy + 3, "#ffffff", k, mix(k, "#8d86a0", 0.4)), 0.75, t * 2);
      line([[x, yy - W * 0.13], [x + (x - X) * 0.05, yy + W * 0.13]], "rgba(90,84,110,.55)", 0.4, true);
    }
  }
  function epaulet(x, y, d) {
    for (let i = 0; i < 7; i++) line([[x - 4 + i * 1.3, y + 1], [x - 4.4 + i * 1.45 + d * 0.3, y + 5]], i % 2 ? "#ffe07a" : "#c58f22", 0.8, true);
    E(x, y, 5, 2.8, gold(x - 5, y - 3, x + 5, y + 3), 1, d * 0.14);
    E(x - 1, y - 0.8, 1.7, 0.6, "rgba(255,255,255,.65)");
  }
  function usekh(y, W) {
    const w = W || 12.5, rows = ["#f2c63e", "#1f4fa8", "#e34b2c", "#f2c63e", "#16a08a", "#f2c63e"];
    rows.forEach((col, r) => {
      const R = w - (rows.length - 1 - r) * 1.55;
      c.beginPath(); c.ellipse(X - 3, y - 2.5, R, R * 0.74, 0, 0.02 * Math.PI, 0.98 * Math.PI); c.strokeStyle = OL; c.lineWidth = 2.1; c.stroke();
      c.strokeStyle = col; c.lineWidth = 1.45; c.stroke();
      if (r % 2 === 0) { c.save(); c.setLineDash([0.45, 1.05]); c.strokeStyle = "rgba(255,255,255,.72)"; c.lineWidth = 0.7; c.stroke(); c.restore(); }
    });
  }
  function belt(y, col, buckle) {
    c.fillStyle = col; c.fillRect(-13, y, 26, 3.3); c.strokeStyle = OL; c.lineWidth = 0.9; c.strokeRect(-13, y, 26, 3.3);
    c.fillStyle = al(lt(col, 0.6), 0.5); c.fillRect(-13, y + 0.3, 26, 0.6);
    if (buckle) { P([[-2.8, y - 0.6], [2.8, y - 0.6], [2.8, y + 3.9], [-2.8, y + 3.9]], gold(-3, y, 3, y + 4), 0.8); c.strokeStyle = "#8a5f12"; c.lineWidth = 0.6; c.strokeRect(-1.5, y + 0.6, 3, 2); }
  }
  function btns(x, ys, col) { for (const y of ys) { E(x, y, 1.1, 1.1, col || gold(x - 1, y - 1, x + 1, y + 1), 0.55); E(x - 0.3, y - 0.35, 0.32, 0.32, "rgba(255,255,255,.85)"); } }
  function earring(x, y, col) { line([[x, y - 1.5], [x, y + 0.5]], col || "#f2c63e", 0.5, true); E(x, y + 1.6, 1.25, 1.7, gold(x - 1, y, x + 1, y + 3), 0.55); }
  function laurel(y, col1, col2) {
    for (const d of [-1, 1]) for (let i = 0; i < 7; i++) {
      const a = 0.12 + i * 0.3, x = X + d * Math.sin(a) * 13, yy = y + (1 - Math.cos(a)) * 12;
      E(x, yy, 3.4, 1.55, lin(x - 3, yy, x + 3, yy, col1, col2), 0.6, d * (a + 0.75));
    }
  }

  // ---------- objetos en la mano ----------
  const up = (a) => c.rotate(-a - 0.15);
  const props = {
    pluma() { up(this.a); S([[0, 3], [1.2, -6], [5, -17], [2.8, -9], [1.6, 3]], lin(0, 3, 5, -17, "#fffdf4", "#c9d3df"), 0.9); line([[0.6, 4], [3.6, -13]], "#7c8797", 0.4); },
    rayo() { up(this.a); P([[1, -24], [-5, -9], [-0.6, -9], [-3.8, 4], [6, -12], [1.4, -12], [6, -24]], lin(-5, -24, 6, 4, "#fffbe0", "#ffd93d", "#f59f0b"), 1.2); P([[2, -21], [-2, -11], [1, -11], [-1, -3], [3, -11], [0, -12]], "rgba(255,255,255,.75)", 0); },
    baston() { up(this.a); line([[0, 8], [0, -26]], OL, 3.4, true); line([[0, 8], [0, -26]], "#7b4f26", 2, true); line([[-0.4, 5], [-0.4, -24]], "rgba(255,226,180,.45)", 0.5, true); S([[0, -24], [-3.2, -29], [0, -34], [3.2, -29]], lin(-3, -34, 3, -24, "#e8fbff", "#5ed2ee", "#2076c2"), 1.1); E(-0.9, -30.5, 0.9, 1.6, "rgba(255,255,255,.9)"); },
    pergamino() { up(this.a); P([[-5, -5], [7, -5], [7, 3], [-5, 3]], "#f2e3bc", 1); E(-5, -1, 1.6, 4.4, "#dcc690", 0.9); E(7, -1, 1.6, 4.4, "#dcc690", 0.9); for (const y of [-3, -1, 1]) line([[-2.5, y], [5, y]], "rgba(90,60,30,.55)", 0.4, true); },
    lupa() { up(this.a); line([[1.5, 2.5], [5, -2.5]], OL, 3, true); line([[1.5, 2.5], [5, -2.5]], "#8a5a2b", 1.8, true); E(8, -7, 5.2, 5.2, "rgba(190,230,245,.62)", 1.8, 0, "#c9a44a"); E(6.2, -9, 1.4, 1, "rgba(255,255,255,.9)", 0, -0.6); },
    lanza() { up(this.a); c.rotate(0.65); line([[0, 12], [0, -48]], OL, 2.6, true); line([[0, 12], [0, -48]], "#a4743e", 1.5, true); P([[0, -56], [2.3, -48], [0, -46], [-2.3, -48]], steel(-2, -56, 2, -46), 0.9); P([[1, -46], [10, -43], [1, -40]], "#d63a32", 0.7); },
    bandera() { up(this.a); line([[0, 9], [0, -36]], OL, 2.4, true); line([[0, 9], [0, -36]], "#c8a35c", 1.3, true); P([[0, -35], [19, -32], [14, -27], [19, -21], [0, -22]], lin(0, -35, 19, -22, "#ffffff", "#ece6d6"), 1.1); star(7, -28.4, 3.4, "#f2c63e", 0.5); },
    batuta() { up(this.a); c.rotate(0.5); line([[0, 2], [0, -19]], OL, 1.6, true); line([[0, 2], [0, -19]], "#fffdf2", 0.8, true); },
    partitura() { up(this.a); P([[-5, -10], [8, -11], [9, 4], [-4, 5]], "#f6edd3", 1); for (const y of [-7, -3, 1]) for (let i = 0; i < 4; i++) line([[-3 + 0.05 * y, y + i * 0.7], [7.2, y - 0.4 + i * 0.7]], "rgba(40,30,20,.6)", 0.22, true); for (const q of [[-1, -6.4], [3, -6.8], [1, -2.2], [5.4, -2.8], [-0.4, 1.6], [4, 1.2]]) { E(q[0], q[1], 0.7, 0.5, "#1a120b", 0, -0.3); line([[q[0] + 0.6, q[1]], [q[0] + 0.6, q[1] - 2.3]], "#1a120b", 0.28, true); } },
    espada() { up(this.a); c.rotate(0.35); P([[-1.3, -3], [1.3, -3], [1, -27], [0, -30], [-1, -27]], steel(-1, -30, 1, -3), 0.9); line([[0, -4], [0, -27]], "rgba(90,100,112,.7)", 0.4, true); P([[-5.2, -4], [5.2, -4], [5.2, -2], [-5.2, -2]], gold(-5, -4, 5, -2), 0.8); line([[0, -2], [0, 4]], OL, 3, true); line([[0, -2], [0, 4]], "#5e3a1c", 1.8, true); E(0, 4.6, 1.5, 1.5, gold(-1, 3, 1, 6), 0.6); },
    cesta() { up(this.a); c.beginPath(); c.arc(1, 3, 7, Math.PI, 0); c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = "#a9743b"; c.lineWidth = 1.3; c.stroke(); const b = [[-7, 3], [9, 3], [7, 13], [-5, 13]]; S([[-4, 3], [1, 0.4], [6, 3]], "#f6e3b4", 0.8); P(b, lin(0, 3, 0, 13, "#d19a58", "#8b5a2a"), 1.2); inside(b, false, () => { for (let i = -8; i < 10; i += 2.5) line([[i, 3], [i + 3, 13]], "rgba(70,40,18,.6)", 0.5, true); for (let y = 5; y < 13; y += 2.5) line([[-8, y], [10, y]], "rgba(255,226,170,.42)", 0.5, true); }); P([[-7, 3], [9, 3], [9, 5], [-7, 5]], "#c8332e", 0.8); },
    botella() { up(this.a); S([[-3, 3], [-3.2, -5], [-1.1, -8], [-1.1, -12], [2.1, -12], [2.1, -8], [4.2, -5], [4, 3]], lin(-3, 0, 4, 0, "rgba(160,220,235,.9)", "rgba(90,170,200,.85)"), 1); P([[-1.5, -14.4], [2.5, -14.4], [2.1, -12], [-1.1, -12]], "#b98a55", 0.8); P([[-3, -3], [4, -3], [4, 1.5], [-3, 1.5]], "#f4ead0", 0.6); for (const y of [-1.9, -0.6, 0.6]) line([[-2, y], [3, y]], "rgba(50,35,20,.7)", 0.3, true); },
    arco() { up(this.a); c.beginPath(); c.arc(-10, -2, 20, -0.95, 0.95); c.strokeStyle = OL; c.lineWidth = 2.8; c.stroke(); c.strokeStyle = "#8f5c2c"; c.lineWidth = 1.5; c.stroke(); const a = [-10 + Math.cos(-0.95) * 20, -2 + Math.sin(-0.95) * 20], b = [-10 + Math.cos(0.95) * 20, -2 + Math.sin(0.95) * 20]; line([a, b], "#efe6d0", 0.5, true); },
    paleta() { up(this.a); S([[-8, 1], [-4, -7], [5, -8], [10, -2], [6, 5], [-3, 6]], lin(-8, -8, 10, 6, "#d8a868", "#a97536"), 1.2); E(-3.8, 2.4, 1.3, 1.1, "#e8d9b8", 0.7); [["#f2c21c", -2, -4], ["#e03b24", 2.6, -4.8], ["#2257c8", 6.3, -2], ["#2e9c48", 4.4, 2]].forEach((q) => E(q[1], q[2], 1.5, 1.2, q[0], 0.45)); },
    matraz() { up(this.a); E(1, -5, 7.5, 7.5, "rgba(115,255,190,.2)"); S([[-1, -13], [3, -13], [3, -8], [7, 1], [-5, 1], [-1, -8]], "rgba(225,245,240,.75)", 1.1); inside([[-1, -13], [3, -13], [3, -8], [7, 1], [-5, 1], [-1, -8]], true, () => { c.fillStyle = lin(0, -5, 0, 1, "#8dffc8", "#2fd08a"); c.fillRect(-7, -4.5, 16, 7); E(0, -3, 0.7, 0.7, "rgba(255,255,255,.9)"); E(3, -1, 0.5, 0.5, "rgba(255,255,255,.8)"); }); P([[-1.6, -14.5], [3.6, -14.5], [3.6, -13], [-1.6, -13]], "#d9dfe6", 0.7); },
    manzana() { up(this.a); S([[0, -7], [4.5, -8], [6.5, -3], [3.5, 3], [0, 2], [-3.5, 3], [-6.5, -3], [-4.5, -8]], rad(0, -3, 7, "#ff7a6a", "#d92d2d", "#8f1616"), 1.1); line([[0, -7], [1, -10]], "#5a3a1c", 0.9); },
  };

  // ---------- los 24 ----------
  const L = [];
  const add = (o) => L.push(Object.assign({ kind: "famoso", premium: true, unlock: 0, outfits: [{ name: "Clásico", look: {} }] }, o));

  // ★★★★ LEGENDARIOS
  add({ id: "f_tut", name: "TUTANKAMÓN", rar: 3, flag: "eg", story: "El faraón niño, con su máscara de oro de 3.300 años.",
    skin: "#efbd42", shade: "#9f6c17",
    f: { rx: 10.8, ry: 13.8, chin: 0.6, eye: "#1a2a5c", white: "#f7f1df", brow: "#1c3d8f", browW: 2.6, arch: 0.7, kohl: "#1c3d8f", nose: "recta", mouth: "labios", lips: "#b57d1b", noEar: true, blush: "rgba(255,230,140,.25)" },
    arm: { col: "#d9a437", hand: "#efbd42", band: "#1f4fa8" },
    legs() { legs("#d9a437", "#c48f2f", { sandal: true }); },
    body() {
      torso("#dfae3f");
      const k = [[-12, 6], [12, 6], [14, 22], [-14, 22]];
      P(k, lin(0, 6, 0, 22, "#fffdf3", "#e5dcc2"), 1.5);
      inside(k, false, () => { for (let i = -6; i <= 6; i++) line([[i * 1.8, 6], [i * 2.3, 22]], "rgba(120,100,60,.5)", 0.4, true); });
      P([[-3.5, 8], [3.5, 8], [5, 23], [-5, 23]], lin(0, 8, 0, 23, "#1f4fa8", "#163a80"), 1);
      inside([[-3.5, 8], [3.5, 8], [5, 23], [-5, 23]], false, () => { for (let y = 10; y < 24; y += 2.6) { c.fillStyle = "#f2c63e"; c.fillRect(-6, y, 12, 1); } });
      belt(4.6, "#e9b93a", true);
    },
    collar() { usekh(-5, 16.5); S([[X - 7.5, 3], [X - 3, 1], [X - 3, 8], [X - 3.2, 8.4], [X - 7.5, 6]], "#1f4fa8", 0.7); E(X - 3, 4.5, 3.4, 3.8, gold(X - 6, 1, X, 8), 0.9); E(X - 3, 4.5, 2, 2.4, "#16a08a", 0.5); },
    beard() {
      const p = [[X - 2, Y + 13.5], [X + 2.6, Y + 13.5], [X + 2.2, Y + 22.5], [X + 0.3, Y + 24], [X - 1.7, Y + 22.5]];
      P(p, gold(X - 2, 0, X + 3, 0), 1.1);
      inside(p, false, () => { for (let i = 0; i < 8; i++) { const y = Y + 13 + i * 1.5; line([[X - 2.5, y], [X + 0.3, y + 1.1], [X + 3, y]], "#1f3f94", 0.65, true); } });
    },
    hat() {
      const p = [[X - 11.7, Y - 5], [X - 12.2, Y - 14], [X - 6, Y - 20], [X + 6, Y - 20], [X + 12.2, Y - 14], [X + 11.7, Y - 5], [X + 18, Y + 14], [X + 10.5, Y + 16.5], [X + 9.9, Y + 3], [X + 10.2, Y - 8.5], [X, Y - 12], [X - 10.2, Y - 8.5], [X - 9.9, Y + 3], [X - 10.5, Y + 16.5], [X - 18, Y + 14]];
      P(p, "#efc449", 1.7);
      inside(p, false, () => {
        for (let i = 0; i < 16; i++) { const yy = Y - 25 + i * 3.25; line([[X - 20, yy + 5], [X, yy - 4], [X + 20, yy + 5]], "#1f3f94", 1.7); line([[X - 20, yy + 6], [X, yy - 3], [X + 20, yy + 6]], "rgba(255,244,190,.55)", 0.32); }
        c.fillStyle = "rgba(90,50,10,.2)"; c.fillRect(X + 4, Y - 24, 20, 44);
      });
      P(p, null, 1.7);
      S([[X - 10.8, Y - 7.5], [X, Y - 12.5], [X + 10.8, Y - 7.5], [X + 10.2, Y - 9.8], [X, Y - 15], [X - 10.2, Y - 9.8]], gold(X - 10, Y - 14, X + 10, Y - 7), 1);
      // la cobra y el buitre de la frente
      S([[X + 2, Y - 11.5], [X - 0.2, Y - 16], [X + 1, Y - 20], [X + 4, Y - 21], [X + 6, Y - 18.4], [X + 4.6, Y - 15], [X + 5, Y - 11.5]], gold(X, Y - 21, X + 6, Y - 11), 1);
      E(X + 3.2, Y - 18.6, 1, 1.05, "#1f4fa8", 0.4); E(X + 3.5, Y - 18.9, 0.3, 0.3, "#fff");
      line([[X + 3.2, Y - 16.8], [X + 3.2, Y - 12.5]], "#1f4fa8", 1);
      S([[X - 5.6, Y - 11.5], [X - 6.8, Y - 15.2], [X - 4.5, Y - 18.2], [X - 2, Y - 16.4], [X - 2.4, Y - 13], [X - 2.8, Y - 11.5]], gold(X - 7, Y - 18, X - 2, Y - 11), 1);
      P([[X - 2.4, Y - 16.3], [X - 0.2, Y - 15], [X - 2.3, Y - 14.7]], "#3a2410", 0.4); E(X - 4.2, Y - 15.8, 0.55, 0.55, "#111");
    } });

  add({ id: "f_cleo", name: "CLEOPATRA", rar: 3, flag: "eg", story: "La última reina de Egipto, lista y temida por Roma.",
    skin: "#d9a06e", shade: "#a26b42",
    f: { rx: 10.9, ry: 13.7, chin: 0.45, eye: "#4b2d14", brow: "#120c0a", browW: 1.55, arch: 1.6, kohl: "#0d1230", lash: true, nose: "fina", mouth: "labios", lips: "#c8272f", noEar: true, blush: "rgba(226,90,70,.26)",
      extra() { for (const x of [X - 4.8, X + 5.2]) { c.fillStyle = "rgba(24,120,190,.42)"; c.beginPath(); c.ellipse(x, Y - 4, 3.7, 1.25, 0, 0, TAU); c.fill(); } } },
    arm: { col: "#d9a06e", hand: "#d9a06e", band: "#f2c63e" },
    back() {
      const p = [[X - 13.5, Y - 8], [X - 10, Y - 17], [X, Y - 20], [X + 10, Y - 17], [X + 13.5, Y - 8], [X + 15, Y + 17], [X - 15, Y + 17]];
      P(p, lin(X - 15, 0, X + 15, 0, "#29252e", "#100e13", "#050406"), 1.7);
      inside(p, false, () => { for (let i = -7; i <= 7; i++) { line([[X + i * 2, Y - 18], [X + i * 2.08, Y + 17]], "rgba(120,130,170,.42)", 0.5, true); } for (let y = Y - 2; y < Y + 18; y += 3.7) { c.fillStyle = "rgba(242,198,62,.82)"; for (let i = -7; i <= 7; i++) if ((i + Math.round(y)) % 3 === 0) c.fillRect(X + i * 2 - 0.3, y, 0.8, 0.8); } });
    },
    legs() { skirt("#fbf7ea", { shoe: "#d6a53d", hem: "#e9b93a", fn() { P([[-2.4, 6], [2.6, 6], [4, 24], [-4, 24]], "#c8272f", 0); for (let y = 8; y < 24; y += 2.6) { c.fillStyle = "#f2c63e"; c.fillRect(-4, y, 8, 0.8); } } }); },
    body() { torso("#fbf7ea"); belt(4.6, "#e9b93a", true); },
    collar() { usekh(-5.5, 15.5); },
    hair() {
      const p = [[X - 11.8, Y - 5], [X - 10, Y - 15], [X, Y - 17.3], [X + 10, Y - 15], [X + 11.8, Y - 5], [X + 10.8, Y - 5], [X + 9.5, Y - 7.3], [X - 9.5, Y - 7.3], [X - 10.8, Y - 5]];
      P(p, lin(X, Y - 17, X, Y - 6, "#37323c", "#121015"), 1.4);
      inside(p, false, () => { for (let i = -9; i <= 9; i++) line([[X + i * 0.75, Y - 18], [X + i * 1.25, Y - 7]], "rgba(150,150,190,.42)", 0.4, true); });
      for (const d of [-1, 1]) { const x = X + d * 11.6; for (let i = 0; i < 3; i++) { P([[x - 1.8, Y - 7 + i * 7.5], [x + 1.8, Y - 7 + i * 7.5], [x + 1.6, Y - 1 + i * 7.5], [x - 1.6, Y - 1 + i * 7.5]], "#17141a", 0.6); c.fillStyle = "#f2c63e"; c.fillRect(x - 1.9, Y - 1.6 + i * 7.5, 3.8, 1.4); } }
      earring(X - 11.2, Y + 3.2); earring(X + 11.4, Y + 3.2);
    },
    hat() {
      S([[X - 11.6, Y - 10.2], [X, Y - 15.6], [X + 11.6, Y - 10.2], [X + 11, Y - 12.6], [X, Y - 18], [X - 11, Y - 12.6]], gold(X - 11, Y - 17, X + 11, Y - 10), 1);
      for (let i = -3; i <= 3; i++) if (i) E(X + i * 3, Y - 14.3 + Math.abs(i) * 0.65, 0.8, 0.8, i % 2 ? "#1f4fa8" : "#d63a32", 0.35);
      S([[X - 0.8, Y - 14], [X - 2.2, Y - 19], [X - 0.6, Y - 23.4], [X + 2.5, Y - 24], [X + 3.8, Y - 21], [X + 2.5, Y - 18], [X + 2.5, Y - 14]], gold(X - 2, Y - 24, X + 4, Y - 14), 1);
      E(X + 1.4, Y - 21.8, 0.9, 0.9, "#d63a32", 0.35); line([[X + 0.9, Y - 19.5], [X + 0.9, Y - 15]], "#1f4fa8", 0.9);
    } });

  add({ id: "f_leo", name: "LEONARDO", rar: 3, flag: "it", story: "Leonardo da Vinci: pintó la Mona Lisa y soñó con volar.",
    skin: "#e9bd98", shade: "#b38160",
    f: { rx: 11, ry: 14.6, chin: 0.62, eye: "#51625e", brow: "#d9d6cf", browW: 2.4, arch: 0.5, browA: 0.8, nose: "aguilena", mouth: "fina", age: 2 },
    arm: { col: "#7a2b22", cuff: "#b98a4e", prop: "pluma" },
    back() {
      hairS([[X - 13, Y - 11], [X - 9, Y - 19], [X + 9, Y - 19], [X + 13, Y - 11], [X + 15, Y + 8], [X + 12, Y + 20], [X - 12, Y + 20], [X - 15, Y + 8]], "#d8d6d0", 20, 2.4);
    },
    legs() { skirt("#5c2019", { shoe: "#2b1b12", fn() { line([[-9, 15], [0, 17], [9, 15]], "rgba(0,0,0,.25)", 0.7); } }); },
    body() { torso("#7a2b22", { fn() { P([[-4.2, -11], [4.5, -11], [3, 16], [-3, 16]], "#451712", 0); line([[0, -6], [0, 16]], "#c79e62", 0.7, true); btns(0, [-1, 4, 9]); } }); belt(5, "#4b3019", true); },
    collar() { S([[X - 11, Y + 12], [X - 5, Y + 11], [X, Y + 14.5], [X + 5, Y + 11], [X + 11, Y + 12], [X + 8, Y + 18], [X, Y + 16], [X - 8, Y + 18]], lin(0, Y + 11, 0, Y + 18, "#7c5d3e", "#46321f"), 1.2); for (let i = -8; i <= 8; i += 2) line([[X + i, Y + 12.5], [X + i * 1.05, Y + 17]], "rgba(240,220,190,.45)", 0.35, true); },
    beard() {
      hairS([[X - 10.6, Y + 2], [X - 6, Y + 7.8], [X - 2.5, Y + 7], [X + 1, Y + 8], [X + 4, Y + 7], [X + 7, Y + 7.8], [X + 10.8, Y + 2], [X + 11, Y + 13], [X + 6, Y + 26], [X + 1, Y + 32], [X - 4, Y + 26], [X - 10.6, Y + 13]], "#e6e4dd", 18, 2.2);
      S([[X - 4.8, Y + 8.4], [X - 1, Y + 7], [X + 0.7, Y + 7.7], [X + 2.4, Y + 7], [X + 6, Y + 8.4], [X + 2.5, Y + 10], [X + 0.7, Y + 9.4], [X - 1.4, Y + 10]], lin(0, Y + 7, 0, Y + 10, "#f7f6f1", "#c5c3bc"), 0.8);
      line([[X - 2.6, Y + 11.3], [X + 0.8, Y + 11.8], [X + 4, Y + 11.2]], "#a34f42", 0.9);
    },
    hair() {
      for (const d of [-1, 1]) hairS([[X + d * 9.8, Y - 12], [X + d * 12.6, Y - 6], [X + d * 12.8, Y + 4], [X + d * 11.2, Y + 11], [X + d * 9.9, Y + 3], [X + d * 10.4, Y - 5]], "#e0ded7", 6, 0.8, 1.1);
    },
    hat() {
      const p = [[X - 11.8, Y - 9], [X - 11.6, Y - 15], [X - 5, Y - 21], [X + 4, Y - 22], [X + 11, Y - 17], [X + 12, Y - 9], [X, Y - 12.4]];
      S(p, lin(X - 11, Y - 21, X + 12, Y - 8, "#6a2a24", "#3e1612", "#22100c"), 1.5);
      inside(p, true, () => { for (let i = 0; i < 9; i++) line([[X - 4 + i * 1.2, Y - 22], [X - 11 + i * 2.9, Y - 9]], "rgba(180,120,100,.32)", 0.45); });
      S([[X - 12.2, Y - 8], [X, Y - 12], [X + 12.3, Y - 8], [X + 12, Y - 11], [X, Y - 15], [X - 12, Y - 11]], lin(0, Y - 14, 0, Y - 8, "#56241e", "#2c120e"), 1);
    } });

  add({ id: "f_napo", name: "NAPOLEÓN", rar: 3, flag: "fr", story: "Emperador de Francia, con su bicornio y la mano en el chaleco.",
    skin: "#efcfae", shade: "#c0987a",
    f: { rx: 11.3, ry: 13.7, chin: 0.62, eye: "#6f7e88", brow: "#3e2c1f", browW: 2, arch: 0.4, browA: 0.5, nose: "recta", mouth: "fina" },
    arm: { col: "#1f3469", cuff: "#c8222e", trim: "#f2c63e", tuck: true },
    legs() { legs("#f3efe2", "#16120f", { boot: "#1b1612", cuff: "#3a2e24", sole: "#050403" }); },
    body() {
      P([[-13, 8], [-16, 21], [-8, 19], [-4, 13]], lin(-16, 8, -4, 21, "#2a4282", "#16264e"), 1.4);
      torso("#223a75", { fn() {
        P([[-4.8, -11], [4.8, -11], [3.6, 7], [-3.6, 7]], lin(0, -11, 0, 7, "#fffdf5", "#e0d9c4"), 0.8);
        btns(0, [-5, -1.5, 2, 5.4], "#efe6cc");
        for (const d of [-1, 1]) { P([[d * 3, -11], [d * 8.8, -9.4], [d * 8, 2], [d * 3.6, 7]], lin(d * 3, -10, d * 8, 6, "#d63441", "#961822"), 0.9); for (let i = 0; i < 4; i++) line([[d * 4.7, -7 + i * 3.2], [d * 7.4, -7.4 + i * 3.2]], "#f2c63e", 0.65, true); }
        btns(-9, [3, 8, 13]); btns(9.5, [3, 8, 13]);
      } });
      P([[-12, 5.6], [12, 5.6], [12, 9.2], [-12, 9.2]], "#f4efe0", 1);
      epaulet(-9.6, -7.8, -1); epaulet(9.8, -7.8, 1);
      // la mano metida en el chaleco
      S([[-0.6, -1.8], [4, -3], [6.2, 0.4], [3.4, 3], [-0.6, 2]], lin(0, -3, 6, 3, "#efcfae", "#c0987a"), 1.05);
      line([[0.2, -2], [1.4, 1.8]], "rgba(120,80,60,.6)", 0.5);
    },
    collar() { P([[X - 7, Y + 11], [X + 7, Y + 11], [X + 6, Y + 16], [X - 6, Y + 16]], "#fffdf5", 1); P([[X - 7.5, Y + 12.5], [X - 2, Y + 15], [X - 7, Y + 17]], "#c8222e", 0.7); P([[X + 7.6, Y + 12.5], [X + 2, Y + 15], [X + 7, Y + 17]], "#c8222e", 0.7); },
    hair() {
      hairS([[X - 11.6, Y - 5], [X - 11, Y - 13], [X - 3, Y - 15.8], [X + 9, Y - 14], [X + 11.6, Y - 5], [X + 8.8, Y - 9.5], [X + 2.5, Y - 10.2], [X - 0.5, Y - 6.8], [X - 2.2, Y - 10], [X - 8.5, Y - 9.5]], "#402c1f", 11, 1, 1.2);
      line([[X + 0.2, Y - 12], [X - 1.8, Y - 7.5], [X + 0.6, Y - 5.5]], "#2a1b12", 1.5);
    },
    hat() {
      const p = [[X - 22, Y - 13.5], [X - 13, Y - 17], [X - 6.5, Y - 26.5], [X + 4, Y - 29], [X + 12.5, Y - 24.2], [X + 16, Y - 17], [X + 26, Y - 12.2], [X + 11, Y - 11.3], [X, Y - 12.2], [X - 10, Y - 11.2]];
      S(p, lin(X - 22, Y - 28, X + 26, Y - 11, "#39393f", "#17171b", "#050506"), 1.7);
      inside(p, true, () => { for (let i = 0; i < 5; i++) line([[X - 20, Y - 12.6 - i * 1.1], [X, Y - 14 - i * 2.6], [X + 24, Y - 12 - i * 1.1]], "rgba(130,130,150,.3)", 0.45); });
      line([[X - 21, Y - 13.2], [X - 9, Y - 13.7], [X, Y - 14.4], [X + 12, Y - 13.8], [X + 25, Y - 12.4]], "#d6a63b", 0.95);
      E(X + 7.5, Y - 20, 3.9, 3.9, "#fff", 0.8); E(X + 7.5, Y - 20, 2.7, 2.7, "#d6222f", 0.3); E(X + 7.5, Y - 20, 1.45, 1.45, "#1f3fa8", 0.3);
      line([[X + 7.5, Y - 24], [X + 7.5, Y - 14.2]], "#f2c63e", 0.55, true);
    } });

  // ★★★ ÉPICOS
  add({ id: "f_zeus", name: "ZEUS", rar: 2, flag: "gr", story: "Rey de los dioses griegos, señor del rayo.",
    skin: "#e8b990", shade: "#b5835c",
    f: { rx: 11.8, ry: 14.5, chin: 0.68, eye: "#2d78c8", brow: "#f1efe9", browW: 2.9, arch: 0.6, browA: 0.8, nose: "recta", mouth: "fina", age: 1 },
    arm: { col: "#e8b990", hand: "#e8b990", band: "#f2c63e", prop: "rayo" },
    back() { E(X, Y - 4, 22, 22, rad(X, Y - 4, 22, "rgba(255,244,190,.0)", "rgba(255,226,110,.32)", "rgba(255,226,110,0)")); capeBack("#2f6fd0", "#3f86e6", 18, 26); },
    legs() { skirt("#fbf8ee", { shoe: "#b5834c", hem: "#2f6fd0", fn() { for (let x = -16; x < 16; x += 3.2) { line([[x, 24.4], [x + 1.4, 23], [x + 2.6, 23.8]], "#f2c63e", 0.5, true); } } }); },
    body() {
      torso("#e8b990", { fn() { line([[-7, -1], [0, 1.6], [7, -1]], "rgba(120,74,44,.75)", 0.8); line([[0, 2], [0, 12]], "rgba(120,74,44,.6)", 0.7, true); for (const y of [5, 8.6]) line([[-3.8, y], [3.8, y]], "rgba(120,74,44,.4)", 0.6); } });
      const p = [[-12.5, -8], [-6, -10], [13, 7], [12, 13], [2, 13], [-12, -1]];
      P(p, lin(-12, -10, 12, 13, "#ffffff", "#e7e0cf", "#c9bfa7"), 1.3);
      inside(p, false, () => { for (let i = 0; i < 7; i++) line([[-12 + i * 3, -9 + i * 1], [-6 + i * 3.3, 5 + i * 1.3]], "rgba(120,104,76,.5)", 0.5); });
      belt(9.8, "#e9b93a", true);
      E(-8.2, -7.4, 2.7, 2.7, gold(-11, -10, -6, -5), 0.8); star(-8.2, -7.4, 1.5, "#fff7cf");
    },
    beard() {
      hairS([[X - 11.6, Y + 1], [X - 6.6, Y + 7.6], [X - 2.3, Y + 6.8], [X + 1, Y + 7.8], [X + 4, Y + 6.8], [X + 7.6, Y + 7.6], [X + 11.8, Y + 1], [X + 12, Y + 13], [X + 8, Y + 22], [X + 1, Y + 26], [X - 6, Y + 22], [X - 11.7, Y + 13]], "#eeece6", 16, 2.1);
      curls([[X - 8, Y + 15], [X - 3, Y + 19], [X + 3, Y + 21], [X + 8.5, Y + 15], [X + 1, Y + 15], [X - 5.5, Y + 11.5], [X + 6.5, Y + 11.5]], 3, "#f4f2ec");
      S([[X - 5, Y + 8.4], [X - 1, Y + 7], [X + 0.7, Y + 7.7], [X + 2.4, Y + 7], [X + 6.1, Y + 8.4], [X + 2.5, Y + 10], [X + 0.7, Y + 9.4], [X - 1.4, Y + 10]], lin(0, Y + 7, 0, Y + 10, "#ffffff", "#cfccc4"), 0.8);
      line([[X - 2.4, Y + 11.5], [X + 0.8, Y + 12], [X + 3.8, Y + 11.4]], "#a2483c", 0.95);
    },
    hair() {
      curls([[X - 12.6, Y - 3, 4], [X - 12.4, Y + 3.2, 3.5], [X + 12.6, Y - 3, 4], [X + 12.6, Y + 3.2, 3.5], [X - 11, Y - 10, 4.2], [X + 11, Y - 10, 4.2], [X - 7, Y - 15.2, 4.4], [X + 7, Y - 15.2, 4.4], [X, Y - 17.3, 4.6], [X - 3.6, Y - 13, 3.5], [X + 3.8, Y - 13, 3.5]], 4, "#f1efe9");
    },
    hat() { laurel(Y - 15, "#ffe37e", "#c48f22"); } });

  add({ id: "f_medusa", name: "MEDUSA", rar: 2, flag: "gr", story: "La gorgona de pelo de serpientes: quien la mira, se vuelve piedra.",
    skin: "#a8c896", shade: "#6d9266",
    f: { rx: 10.8, ry: 13.7, chin: 0.45, eye: "#e8c41c", pupil: "#0c1208", white: "#f4f6d2", brow: "#2e4a2c", browW: 1.5, arch: 1.5, browA: 0.5, kohl: "#20381f", lash: true, nose: "fina", mouth: "labios", lips: "#7a1f3f", blush: "rgba(90,150,110,.3)",
      spots() { for (const q of [[X - 8, Y - 4], [X - 9, Y - 1], [X - 7.2, Y + 1.5], [X + 8.5, Y - 4], [X + 9.2, Y - 1], [X + 8, Y + 1.4]]) { c.beginPath(); c.arc(q[0], q[1], 0.75, Math.PI, 0); c.strokeStyle = "rgba(40,86,52,.75)"; c.lineWidth = 0.42; c.stroke(); } } },
    arm: { col: "#a8c896", hand: "#a8c896", band: "#f2c63e" },
    back() { snakes(true); },
    legs() { skirt("#20605c", { shoe: "#c49640", hem: "#e0b13b", fn() { for (let x = -16; x < 16; x += 2.6) { P([[x, 21.8], [x + 1.3, 20.3], [x + 2.6, 21.8]], "#e0b13b", 0); } } }); },
    body() { torso("#2a7870", { fn() { P([[-5, -11], [5, -11], [0, 2]], "#a8c896", 0.7); for (let i = 0; i < 6; i++) line([[-11 + i * 4.4, 0], [-10 + i * 4.2, 16]], "rgba(10,50,48,.5)", 0.6); } }); belt(5.4, "#e0b13b", true); },
    collar() { S([[X - 6.8, Y + 13], [X, Y + 16.6], [X + 6.8, Y + 13], [X + 6.5, Y + 15], [X, Y + 18.6], [X - 6.5, Y + 15]], gold(X - 7, Y + 13, X + 7, Y + 18), 0.8); E(X, Y + 18.2, 1.6, 1.8, "#c8222e", 0.6); },
    hair() { snakes(false); S([[X - 10.4, Y - 9.4], [X, Y - 14], [X + 10.4, Y - 9.4], [X + 10, Y - 11.6], [X, Y - 16.4], [X - 10, Y - 11.6]], gold(X - 10, Y - 16, X + 10, Y - 9), 0.9); E(X, Y - 14.2, 1.5, 1.8, "#c8222e", 0.6); } });
  // las serpientes del pelo
  function snake(pts, col, head) {
    line(pts, OL, 4.6); line(pts, col, 3.1);
    line(pts, al(lt(col, 0.5), 0.75), 0.75);
    c.save(); c.setLineDash([0.9, 1.6]); line(pts, al(dk(col, 0.55), 0.85), 1.6); c.restore();
    if (!head) return;
    const a = pts[pts.length - 1], b = pts[pts.length - 2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
    c.save(); c.translate(a[0], a[1]); c.rotate(ang);
    line([[2.7, 0], [5.3, 0], [6.4, -0.8]], "#d4202e", 0.45, true); line([[5.3, 0], [6.4, 0.8]], "#d4202e", 0.45, true);
    S([[-1.5, -1.8], [1.5, -2.5], [3.8, -1], [3.8, 1], [1.5, 2.5], [-1.5, 1.8]], rad(1, 0, 3.8, lt(col, 0.4), col, dk(col, 0.3)), 1);
    E(1.6, -1.25, 0.7, 0.7, "#ffe94d", 0.3); E(1.75, -1.25, 0.22, 0.42, "#0a0a0a"); E(1.6, 1.25, 0.7, 0.7, "#ffe94d", 0.3); E(1.75, 1.25, 0.22, 0.42, "#0a0a0a");
    c.restore();
  }
  function snakes(backRow) {
    const A = "#3f9a4a", B = "#6fb43a", K = "#2f8060";
    if (backRow) {
      snake([[X - 7, Y - 12], [X - 16, Y - 17], [X - 19, Y - 26], [X - 13, Y - 32]], K, true);
      snake([[X + 7, Y - 12], [X + 16, Y - 17], [X + 20, Y - 26], [X + 14, Y - 32]], K, true);
      snake([[X - 1, Y - 13], [X - 5, Y - 24], [X - 2, Y - 32], [X - 6, Y - 38]], A, true);
      snake([[X + 2, Y - 13], [X + 6, Y - 24], [X + 3, Y - 31], [X + 8, Y - 37]], B, true);
      snake([[X - 9, Y - 3], [X - 18, Y + 1], [X - 22, Y - 7], [X - 26, Y - 13]], A, true);
      snake([[X + 9, Y - 3], [X + 18, Y + 1], [X + 23, Y - 6], [X + 27, Y - 12]], B, true);
      snake([[X - 10, Y + 3], [X - 16, Y + 11], [X - 22, Y + 12], [X - 25, Y + 6]], B, true);
      snake([[X + 10, Y + 3], [X + 16, Y + 11], [X + 22, Y + 13], [X + 26, Y + 8]], A, true);
      return;
    }
    S([[X - 11.3, Y - 5], [X - 11, Y - 13], [X, Y - 17], [X + 11, Y - 13], [X + 11.3, Y - 5], [X + 8, Y - 10], [X, Y - 12], [X - 8, Y - 10]], "#2c6840", 1.3);
    snake([[X - 8, Y - 13], [X - 13, Y - 15], [X - 13, Y - 9], [X - 12.8, Y - 2]], B, false);
    snake([[X + 8, Y - 13], [X + 13, Y - 15], [X + 13, Y - 9], [X + 13, Y - 2]], A, false);
    snake([[X - 3, Y - 16], [X - 7, Y - 20], [X - 12, Y - 21], [X - 14, Y - 25]], B, true);
    snake([[X + 3, Y - 16], [X + 7, Y - 21], [X + 12, Y - 21], [X + 15, Y - 25]], A, true);
  }

  add({ id: "f_drac", name: "DRÁCULA", rar: 2, flag: "ro", story: "El conde de la novela de Bram Stoker, de 1897.",
    skin: "#e9e4dc", shade: "#a9a0a6",
    f: { rx: 10.8, ry: 14.8, chin: 0.42, eye: "#a51624", brow: "#121014", browW: 2.2, arch: 1.5, browA: 1, nose: "aguilena", mouth: "colmillos", lips: "#7c1420", blush: "rgba(150,70,90,.12)", age: 1 },
    arm: { col: "#17151b", cuff: "#fbf8ee", prop: null },
    back() {
      capeBack("#7f101d", "#a3142a", 22, 30);
      for (const d of [-1, 1]) P([[X + d * 4, Y + 9], [X + d * 22, Y - 16], [X + d * 19, Y + 10], [X + d * 11, Y + 18]], lin(X + d * 22, Y - 16, X + d * 5, Y + 15, "#c61f33", "#6e0d18"), 1.5);
    },
    legs() { legs("#17151b", "#0b0a0c", { sole: "#000" }); },
    body() {
      torso("#1b1920", { fn() {
        P([[-5, -11], [5.2, -11], [3, 16], [-3, 16]], lin(0, -11, 0, 16, "#ffffff", "#d9d4cc"), 0.7);
        P([[-4.2, -5], [4.2, -5], [4, 8], [0, 12], [-4, 8]], lin(-4, -5, 4, 9, "#b0162c", "#650b18"), 0.8); btns(0, [-2, 2, 6], "#f2c63e");
        for (const d of [-1, 1]) P([[d * 4.5, -11], [d * 10.6, -8], [d * 5.4, 9], [d * 3.5, 6]], lin(d * 4, -10, d * 8, 8, "#34313b", "#0b0a0d"), 0.8);
      } });
    },
    collar() {
      P([[X - 7, Y + 12], [X + 7, Y + 12], [X + 5, Y + 16], [X - 5, Y + 16]], "#fff", 0.9);
      P([[X, Y + 15.2], [X - 5, Y + 12.8], [X - 5, Y + 18], [X, Y + 16.1], [X + 5, Y + 18], [X + 5, Y + 12.8]], "#121015", 0.7);
    },
    hair() {
      const p = [[X - 11.5, Y - 2], [X - 11.8, Y - 11], [X - 5, Y - 17], [X + 5, Y - 17], [X + 11.8, Y - 11], [X + 11.5, Y - 2], [X + 10, Y - 8], [X + 5, Y - 11.6], [X, Y - 7.2], [X - 5, Y - 11.6], [X - 10, Y - 8]];
      P(p, lin(X, Y - 17, X, Y - 3, "#37343d", "#0f0e12"), 1.4);
      inside(p, false, () => { for (let i = -10; i <= 10; i++) line([[X + i * 0.25, Y - 18], [X + i * 0.75, Y - 12], [X + i * 1.18, Y - 2]], "rgba(150,155,190,.5)", 0.36); });
    } });

  add({ id: "f_merlin", name: "MERLÍN", rar: 2, flag: "gb", story: "El mago de las leyendas del rey Arturo.",
    skin: "#ecc6a4", shade: "#b98d6e",
    f: { rx: 11, ry: 14.4, chin: 0.6, eye: "#4f8fb8", brow: "#f1f1ee", browW: 3.1, arch: 1.1, nose: "aguilena", mouth: "fina", age: 2 },
    arm: { col: "#3a2c86", cuff: "#d3a93a", prop: "baston" },
    legs() { skirt("#2f2470", { shoe: "#3a2415", hem: "#d3a93a", fn() { for (const q of [[-10, 12], [6, 11], [-2, 19], [11, 20], [-11, 20]]) star(q[0], q[1], 1.9, "#ffe27a"); c.beginPath(); c.arc(2, 17, 2.2, 0.8, 4.6); c.strokeStyle = "#dfe8ff"; c.lineWidth = 0.9; c.stroke(); } }); },
    body() { torso("#3a2c86", { fn() { for (const q of [[-8, 1], [7, -2], [-3, 10], [9, 9]]) star(q[0], q[1], 1.7, "#ffe27a"); } }); belt(5, "#6e4a24", true); },
    beard() {
      hairS([[X - 10.6, Y + 2], [X - 6, Y + 7.8], [X - 2.5, Y + 7], [X + 1, Y + 8], [X + 4, Y + 7], [X + 7, Y + 7.8], [X + 10.8, Y + 2], [X + 11, Y + 13], [X + 6, Y + 27], [X + 1, Y + 37], [X - 4, Y + 27], [X - 10.6, Y + 13]], "#f0f0ec", 20, 2.2);
      S([[X - 4.8, Y + 8.4], [X - 1, Y + 7], [X + 0.7, Y + 7.7], [X + 2.4, Y + 7], [X + 6, Y + 8.4], [X + 2.5, Y + 10], [X + 0.7, Y + 9.4], [X - 1.4, Y + 10]], lin(0, Y + 7, 0, Y + 10, "#ffffff", "#cfcfca"), 0.8);
      line([[X - 2.6, Y + 11.3], [X + 0.8, Y + 11.8], [X + 4, Y + 11.2]], "#a34f42", 0.9);
    },
    hair() { for (const d of [-1, 1]) hairS([[X + d * 9.8, Y - 10], [X + d * 12.4, Y - 5], [X + d * 13, Y + 5], [X + d * 11.6, Y + 13], [X + d * 10, Y + 4], [X + d * 10.2, Y - 4]], "#ececE8".toLowerCase(), 6, 0.8, 1.1); },
    hat() {
      const p = [[X - 15.5, Y - 8.8], [X - 8, Y - 25], [X - 1, Y - 40], [X + 5, Y - 49], [X + 7, Y - 38], [X + 9.5, Y - 24], [X + 16, Y - 9], [X, Y - 13]];
      P(p, lin(X - 15, Y - 40, X + 15, Y - 9, "#5140ac", "#2e236e", "#1b1548"), 1.6);
      inside(p, false, () => {
        for (const q of [[X - 5, Y - 19, 2.5], [X + 5, Y - 18, 2.1], [X + 2, Y - 29, 2.3], [X + 4.5, Y - 39, 1.5], [X - 9, Y - 13.5, 1.5], [X + 10, Y - 13, 1.6]]) star(q[0], q[1], q[2], "#ffe27a", 0.3);
        c.beginPath(); c.arc(X - 1.5, Y - 25, 2.6, 0.8, 4.6); c.strokeStyle = "#e6edff"; c.lineWidth = 1; c.stroke();
        line([[X - 15, Y - 11], [X + 1, Y - 44]], "rgba(150,140,230,.34)", 0.8);
      });
      S([[X - 16.4, Y - 7.8], [X - 8, Y - 10.9], [X, Y - 12], [X + 8, Y - 10.9], [X + 16.6, Y - 7.8], [X + 8, Y - 8.1], [X, Y - 9], [X - 8, Y - 8.1]], lin(0, Y - 12, 0, Y - 7, "#f2c94f", "#a9741a"), 1.1);
    } });

  add({ id: "f_cesar", name: "JULIO CÉSAR", rar: 2, flag: "it", story: "General y dictador de Roma. Vino, vio y venció.",
    skin: "#e2b389", shade: "#ae7f5a",
    f: { rx: 10.8, ry: 14.6, chin: 0.56, eye: "#4a4136", brow: "#5b4635", browW: 1.8, arch: 0.4, browA: 0.5, nose: "aguilena", mouth: "fina", age: 1 },
    arm: { col: "#c11d2e", hand: "#e2b389", band: "#f2c63e", prop: "pergamino" },
    legs() { legs("#e2b389", "#7a4a22", { sandal: true }); },
    body() {
      P([[-13, 6], [13, 6], [15, 21], [-15, 21]], lin(0, 6, 0, 21, "#d12639", "#8f1421"), 1.4);
      torso("#c11d2e");
      const p = [[-13, -7], [-5, -10.7], [13, 8], [14.5, 22], [3, 22], [-13, 3]];
      P(p, lin(-13, -10, 14, 22, "#ffffff", "#ece6d6", "#c7bda6"), 1.4);
      inside(p, false, () => { for (let i = 0; i < 8; i++) line([[-14 + i * 3.4, -8 + i], [-7 + i * 3.4, 12 + i]], "rgba(120,104,76,.52)", 0.55); line([[-5.5, -11.5], [14, 7.5]], "#6b1f85", 2.2, true); line([[-5, -10.3], [14.5, 8.9]], "#f2c63e", 0.5, true); });
      E(-8.5, -7, 2.7, 2.7, gold(-11, -9, -6, -4), 0.8); E(-8.5, -7, 1.3, 1.3, "#b0162c", 0.3);
    },
    hair() {
      const p = [[X - 11.3, Y - 3], [X - 11, Y - 11], [X - 5, Y - 15.5], [X + 5, Y - 15.5], [X + 11, Y - 11], [X + 11.3, Y - 3], [X + 9.6, Y - 8.6], [X + 5, Y - 9.5], [X + 3, Y - 8.6], [X, Y - 10.3], [X - 3, Y - 8.6], [X - 5, Y - 9.5], [X - 9.6, Y - 8.6]];
      P(p, lin(X, Y - 16, X, Y - 3, "#7b6650", "#4e3d2d"), 1.2);
      inside(p, false, () => { for (let i = -10; i <= 10; i++) line([[X + i * 0.5, Y - 16], [X + i * 1.12, Y - 8.4]], "rgba(30,20,12,.5)", 0.42, true); });
    },
    hat() { laurel(Y - 13.6, "#9ccc58", "#3f7a2c"); } });

  add({ id: "f_isabel", name: "ISABEL I", rar: 2, flag: "gb", story: "La Reina Virgen de Inglaterra, la de los retratos de perlas.",
    skin: "#f9ecdf", shade: "#d3bcae",
    f: { rx: 10.6, ry: 14.3, chin: 0.42, eye: "#5c4530", brow: "#c98a4e", browW: 1, arch: 1.4, nose: "fina", mouth: "labios", lips: "#c23a44", blush: "rgba(235,100,110,.3)" },
    arm: { col: "#7a1524", cuff: "#fffdf4", trim: "#f2c63e" },
    legs() { skirt("#8a1a2c", { shoe: "#f2c63e", hem: "#f2c63e", fn() { P([[-4.4, 6], [4.6, 6], [8, 25], [-8, 25]], lin(0, 6, 0, 25, "#fff8e4", "#ecdcb6"), 0.8); for (let y = 8; y < 25; y += 3.2) for (let x = -8 + (y % 2); x < 9; x += 3.2) { E(x, y, 0.7, 0.7, "#c1912a"); E(x, y, 0.32, 0.32, "#fff"); } for (const d of [-1, 1]) for (let y = 8; y < 25; y += 2.2) E(d * (4.5 + (y - 6) * 0.19), y, 0.65, 0.65, "#fffdf6", 0.25); } }); },
    body() {
      torso("#8a1a2c", { fn() { P([[-4.6, -11], [4.8, -11], [1.6, 16], [-1.4, 16]], lin(0, -11, 0, 16, "#fff8e4", "#e7d4a8"), 0.7); for (let y = -8; y < 15; y += 2.7) { E(0.1, y, 0.85, 0.85, "#fffdf6", 0.3); E(-2.6 + (y + 8) * 0.09, y + 1.3, 0.55, 0.55, "#b0162c"); E(2.8 - (y + 8) * 0.09, y + 1.3, 0.55, 0.55, "#1f4fa8"); } } });
      for (let i = -5; i <= 5; i++) E(i * 2.2, 6 + Math.abs(i) * 0.1, 0.8, 0.8, "#fffdf6", 0.3);
    },
    collar() {
      ruff(Y + 9, 15);
      for (let i = 0; i < 11; i++) { const a = 0.15 + (i / 10) * (Math.PI - 0.3), x = X + Math.cos(a) * 8.2, y = Y + 13 + Math.sin(a) * 6; E(x, y, 0.85, 0.85, "#fffdf6", 0.3); }
      E(X, Y + 20, 2, 2.4, gold(X - 2, Y + 18, X + 2, Y + 22), 0.6); E(X, Y + 20, 1, 1.25, "#b0162c", 0.3); E(X, Y + 23.3, 0.9, 1.3, "#fffdf6", 0.3);
    },
    hair() {
      curls([[X - 11, Y - 5, 3.2], [X - 11.8, Y + 0.5, 2.8], [X + 11, Y - 5, 3.2], [X + 11.8, Y + 0.5, 2.8], [X - 9.5, Y - 10.4, 3.6], [X + 9.5, Y - 10.4, 3.6], [X - 5.8, Y - 14.2, 3.8], [X + 5.8, Y - 14.2, 3.8], [X, Y - 15.8, 4], [X - 2.8, Y - 11.5, 2.7], [X + 2.9, Y - 11.5, 2.7]], 3.4, "#d4632a");
      for (const q of [[X - 8, Y - 8.4], [X + 8, Y - 8.4], [X, Y - 10]]) E(q[0], q[1], 0.9, 0.9, "#fffdf6", 0.35);
    },
    hat() {
      const p = [[X - 9, Y - 16.6], [X - 10.5, Y - 25], [X - 5, Y - 21], [X, Y - 28], [X + 5, Y - 21], [X + 10.5, Y - 25], [X + 9, Y - 16.6], [X, Y - 14.6]];
      P(p, gold(X - 10, Y - 28, X + 10, Y - 15), 1.2);
      for (const q of [[X - 10.5, Y - 25.6], [X, Y - 28.7], [X + 10.5, Y - 25.6]]) E(q[0], q[1], 1.2, 1.2, "#fffdf6", 0.5);
      for (const q of [[X - 5, Y - 18, "#b0162c"], [X, Y - 17.2, "#1f4fa8"], [X + 5, Y - 18, "#b0162c"]]) E(q[0], q[1], 1.2, 1.4, q[2], 0.45);
      S([[X - 9.4, Y - 15.6], [X, Y - 13], [X + 9.4, Y - 15.6], [X + 9.2, Y - 13.8], [X, Y - 11.2], [X - 9.2, Y - 13.8]], "#fbf8ee", 0.7);
    } });

  // ★★ RAROS
  add({ id: "f_holmes", name: "SHERLOCK", rar: 1, flag: "gb", story: "Sherlock Holmes, el detective de Baker Street, 221B.",
    skin: "#efd0b1", shade: "#bd9576",
    f: { rx: 10.3, ry: 14.9, chin: 0.48, eye: "#667684", brow: "#2c2118", browW: 1.8, arch: 0.8, browA: 0.5, nose: "aguilena", mouth: "fina",
      extra() {
        line([[X + 3, Y + 10.8], [X + 10, Y + 13], [X + 14, Y + 13.4]], OL, 2.3); line([[X + 3, Y + 10.8], [X + 10, Y + 13], [X + 14, Y + 13.4]], "#3a2719", 1.3);
        S([[X + 12.6, Y + 9.6], [X + 18, Y + 9.6], [X + 17.6, Y + 14.6], [X + 15.5, Y + 16], [X + 13.4, Y + 14.6]], lin(X + 12, 0, X + 18, 0, "#a56a36", "#5b3417"), 1); E(X + 15.3, Y + 9.7, 2.7, 0.8, "#1c120a", 0.5);
        E(X + 18, Y + 3.5, 1.3, 1.1, "rgba(235,235,235,.5)"); E(X + 16.5, Y + 6.3, 0.9, 0.8, "rgba(235,235,235,.55)");
      } },
    arm: { col: "#8d7557", cuff: "#6e5a42", prop: "lupa" },
    back() { capeBack("#7b654a", "#7b654a", 18, 22); },
    legs() { legs("#54463a", "#1f1712", {}); },
    body() {
      const tartan = (x0, x1, y0, y1) => { for (let x = x0; x < x1; x += 3.2) line([[x, y0], [x, y1]], "rgba(58,40,24,.5)", 0.55, true); for (let y = y0; y < y1; y += 3.2) line([[x0, y], [x1, y]], "rgba(58,40,24,.5)", 0.55, true); for (let x = x0 + 1.6; x < x1; x += 6.4) line([[x, y0], [x, y1]], "rgba(190,60,40,.35)", 0.25, true); };
      torso("#907a5c", { fn() { tartan(-14, 14, -11, 16); line([[0, -8], [0, 16]], "#3a2c1e", 0.9, true); btns(1.8, [-3, 2, 7, 12], "#3a2719"); } });
      const cape = [[-13.6, -8], [-5, -10.8], [6, -10.8], [14, -8], [16, 4], [12, 6], [0, 3.2], [-12, 6], [-16, 4]];
      S(cape, lin(-15, -10, 15, 6, "#a68e6e", "#7e6749"), 1.5);
      inside(cape, true, () => tartan(-17, 17, -11, 7));
      S(cape, null, 1.5);
    },
    collar() { P([[X - 6, Y + 11.5], [X + 6, Y + 11.5], [X + 5, Y + 16], [X - 5, Y + 16]], "#fff", 0.9); P([[X - 2, Y + 14], [X + 2, Y + 14], [X + 1.5, Y + 19], [X - 1.5, Y + 19]], "#26262c", 0.6); },
    hair() { hairS([[X - 11, Y - 3], [X - 10.5, Y - 10], [X - 7, Y - 11], [X - 8, Y - 3]], "#2e241c", 4, 0.3, 0.9); hairS([[X + 11, Y - 3], [X + 10.5, Y - 10], [X + 7, Y - 11], [X + 8, Y - 3]], "#2e241c", 4, 0.3, 0.9); },
    hat() {
      const pat = (x0, x1, y0, y1) => { for (let x = x0; x < x1; x += 2.4) line([[x, y0], [x, y1]], "rgba(55,38,22,.6)", 0.45, true); for (let y = y0; y < y1; y += 2.4) line([[x0, y], [x1, y]], "rgba(55,38,22,.6)", 0.45, true); };
      const fr = [[X + 8, Y - 13], [X + 16.5, Y - 10.8], [X + 16.5, Y - 8.2], [X + 8.5, Y - 8]], bk = [[X - 8, Y - 13], [X - 15, Y - 10], [X - 15, Y - 6.8], [X - 8.5, Y - 7.7]];
      for (const q of [fr, bk]) { P(q, "#a68e6b", 1.3); inside(q, false, () => pat(X - 17, X + 18, Y - 14, Y - 6)); P(q, null, 1.3); }
      const p = [[X - 11.6, Y - 8.3], [X - 11.3, Y - 16], [X - 5.5, Y - 21.8], [X + 5.5, Y - 21.8], [X + 11.3, Y - 16], [X + 11.6, Y - 8.3], [X, Y - 11.5]];
      S(p, lin(X - 11, Y - 22, X + 11, Y - 8, "#b49c79", "#8a7252", "#6c5940"), 1.5);
      inside(p, true, () => { pat(X - 13, X + 13, Y - 23, Y - 7); line([[X, Y - 22], [X, Y - 11]], "rgba(50,34,20,.6)", 0.65, true); });
      S(p, null, 1.5);
      S([[X - 8.8, Y - 11.6], [X - 12, Y - 9.6], [X - 10.4, Y - 2.2], [X - 8.5, Y - 7]], "#9c8564", 1); S([[X + 8.8, Y - 11.6], [X + 12, Y - 9.6], [X + 10.4, Y - 2.2], [X + 8.5, Y - 7]], "#9c8564", 1);
      E(X, Y - 22, 1.4, 1, "#7d6849", 0.8);
      P([[X - 2, Y - 21.8], [X, Y - 24], [X + 2, Y - 21.8]], "#6c5940", 0.5);
    } });

  add({ id: "f_quijote", name: "DON QUIJOTE", rar: 1, flag: "es", story: "El caballero de La Mancha, el de los molinos de Cervantes.",
    skin: "#e2bc94", shade: "#a98260",
    f: { rx: 9.6, ry: 15.8, chin: 0.36, eye: "#4c3e30", brow: "#a9a59d", browW: 2.1, arch: 1.4, nose: "aguilena", mouth: "fina", age: 2 },
    arm: { col: "#a7aeb7", metal: true, hand: "#8d7b63", prop: "lanza" },
    legs() { legs("#7e6b54", "#3a2b1e", { boot: "#9aa2ac", cuff: "#c9d0d8" }); },
    body() {
      torso("#8d6f4e");
      const a = [[-10.5, -9], [-5, -10.6], [6, -10.6], [11, -9], [11.4, 3], [8.4, 9], [0, 11.6], [-8.2, 9], [-11, 3]];
      S(a, steel(-11, -10, 11, 11), 1.5);
      inside(a, true, () => {
        line([[0, -11], [0, 12]], "rgba(70,78,88,.75)", 0.7, true);
        for (const q of [[-8, -6], [-8.5, 0], [-6, 6], [8.6, -6], [9, 0], [6.6, 6]]) { E(q[0], q[1], 0.6, 0.6, "#5a4634"); }
        for (const q of [[-3, -1.5, 1.3], [4, 3, 1.7], [-5.5, 4.4, 1], [5.6, -4.5, 0.9]]) E(q[0], q[1], q[2], q[2] * 0.7, "rgba(136,72,34,.55)");
      });
      for (let i = 0; i < 3; i++) P([[-12 + i, 10 + i * 2.1], [12 - i, 10 + i * 2.1], [11.5 - i, 12.5 + i * 2.1], [-11.5 + i, 12.5 + i * 2.1]], steel(-12, 10, 12, 16), 0.8);
    },
    collar() { ruff(Y + 11.5, 9.5); },
    beard() {
      hairS([[X - 5, Y + 9.5], [X, Y + 9], [X + 5, Y + 9.5], [X + 3, Y + 18], [X + 0.4, Y + 25], [X - 2.5, Y + 18]], "#b5b1a8", 9, 0.7, 1.1);
      for (const d of [-1, 1]) S([[X + 0.6, Y + 8.1], [X + d * 4, Y + 7.6], [X + d * 8.6, Y + 8.6], [X + d * 11.5, Y + 6.2], [X + d * 9, Y + 10.3], [X + d * 4, Y + 10]], lin(X, Y + 7, X + d * 10, Y + 10, "#d6d3cc", "#8f8b83"), 0.8);
    },
    hair() { for (const d of [-1, 1]) hairS([[X + d * 8.6, Y - 9], [X + d * 11, Y - 3], [X + d * 10.8, Y + 6], [X + d * 9, Y + 4], [X + d * 8.6, Y - 2]], "#a9a59d", 4, 0.4, 0.9); },
    hat() {
      // la bacía de barbero que él llama «yelmo de Mambrino»
      const dome = [[X - 10.6, Y - 9], [X - 9.5, Y - 19], [X - 3.8, Y - 24.5], [X + 3.8, Y - 24.5], [X + 9.5, Y - 19], [X + 10.6, Y - 9]];
      S(dome, gold(X - 10, Y - 24, X + 11, Y - 9), 1.5);
      inside(dome, true, () => { E(X - 3.8, Y - 19, 1.8, 3.8, "rgba(255,255,240,.72)", 0, 0.3); line([[X - 10, Y - 12], [X, Y - 14], [X + 10, Y - 12]], "rgba(110,70,20,.6)", 0.6); });
      const r = [[X - 16, Y - 9.5], [X, Y - 11.9], [X + 16, Y - 9.5], [X + 15.5, Y - 6.8], [X + 8, Y - 7.4], [X + 5, Y - 3.5], [X + 1.5, Y - 6.8], [X - 8, Y - 7], [X - 15.5, Y - 6.8]];
      P(r, gold(X - 16, Y - 12, X + 16, Y - 6), 1.25);
      for (let i = -6; i <= 6; i++) E(X + i * 2.3, Y - 9.3 - (1 - Math.abs(i) / 7) * 1.4, 0.38, 0.38, "rgba(112,72,22,.85)");
    } });

  add({ id: "f_juana", name: "JUANA DE ARCO", rar: 1, flag: "fr", story: "La campesina que con 17 años lideró al ejército de Francia.",
    skin: "#f1cfb1", shade: "#c3977a",
    f: { rx: 10.6, ry: 13.6, chin: 0.48, eye: "#3f6e96", brow: "#4f3524", browW: 1.8, arch: 0.8, browA: 0.5, nose: "fina", mouth: "seria", lips: "#bb6a60" },
    arm: { col: "#b5bdc7", metal: true, hand: "#8e97a2", prop: "bandera" },
    legs() { legs("#9aa2ac", "#747d88", { boot: "#b5bdc7", cuff: "#dfe4ea" }); },
    body() {
      torso("#b5bdc7");
      const tb = [[-9, -9], [9.4, -9], [11, 15], [-11, 15]];
      P(tb, lin(-10, -9, 10, 15, "#2f58b6", "#1c3a82"), 1.2);
      inside(tb, false, () => { for (const q of [[-5, -4], [5.5, -4], [-5, 8], [5.5, 8], [0, 2]]) lis(q[0], q[1], 0.95); });
      belt(5.5, "#6b4a28", true);
      P([[-11, 13], [11, 13], [14, 22], [-14, 22]], lin(0, 13, 0, 22, "#2f58b6", "#16306e"), 1.2);
      inside([[-11, 13], [11, 13], [14, 22], [-14, 22]], false, () => { for (let i = -5; i <= 5; i++) line([[i * 2, 13], [i * 2.7, 22]], "rgba(8,16,44,.6)", 0.6, true); });
      for (const d of [-1, 1]) { S([[d * 5, -10.5], [d * 14, -9], [d * 15, -3], [d * 10.5, -1.2], [d * 6, -5]], steel(d * 5, -10, d * 15, -2), 1.2); line([[d * 7, -8], [d * 12.6, -3.2]], "rgba(70,78,88,.7)", 0.6); E(d * 11.6, -7.6, 0.55, 0.55, "#5a636f"); }
    },
    collar() { P([[X - 7.2, Y + 11], [X + 7.2, Y + 11], [X + 8.2, Y + 16.4], [X - 8.2, Y + 16.4]], steel(X - 8, Y + 11, X + 8, Y + 16), 1.2); line([[X - 7.4, Y + 13.5], [X, Y + 14.6], [X + 7.4, Y + 13.5]], "rgba(70,78,88,.7)", 0.6); },
    hair() {
      const p = [[X - 12.4, Y + 6], [X - 12.6, Y - 6], [X - 9.6, Y - 15], [X, Y - 17.2], [X + 9.6, Y - 15], [X + 12.6, Y - 6], [X + 12.4, Y + 6], [X + 9.6, Y + 6.8], [X + 10, Y - 5], [X + 8, Y - 8.2], [X, Y - 7.4], [X - 8, Y - 8.2], [X - 10, Y - 5], [X - 9.6, Y + 6.8]];
      S(p, lin(X, Y - 17, X, Y + 7, "#6a4830", "#2f1d12"), 1.4);
      inside(p, true, () => { for (let i = -13; i <= 13; i++) line([[X + i * 0.4, Y - 17], [X + i * 0.95, Y - 6], [X + i, Y + 8]], i % 2 ? "rgba(180,135,96,.5)" : "rgba(20,10,5,.5)", 0.4); });
      S(p, null, 1.4);
    } });
  function lis(x, y, s) {
    c.fillStyle = "#f2c63e"; c.strokeStyle = "#8a5f12"; c.lineWidth = 0.3;
    c.beginPath(); c.moveTo(x, y - 3.3 * s); c.quadraticCurveTo(x + 1.5 * s, y - 1 * s, x, y + 1.3 * s); c.quadraticCurveTo(x - 1.5 * s, y - 1 * s, x, y - 3.3 * s); c.fill(); c.stroke();
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 0.5 * s, y + 0.8 * s); c.quadraticCurveTo(x + d * 3 * s, y - 2.2 * s, x + d * 2.6 * s, y + 0.8 * s); c.quadraticCurveTo(x + d * 1.5 * s, y + 1.4 * s, x + d * 0.5 * s, y + 0.8 * s); c.fill(); c.stroke(); }
    c.fillRect(x - 1.9 * s, y + 1.1 * s, 3.8 * s, 0.7 * s); c.beginPath(); c.moveTo(x - 0.8 * s, y + 1.8 * s); c.lineTo(x + 0.8 * s, y + 1.8 * s); c.lineTo(x, y + 3 * s); c.closePath(); c.fill();
  }

  add({ id: "f_mozart", name: "MOZART", rar: 1, flag: "at", story: "El niño prodigio de Salzburgo que compuso más de 600 obras.",
    skin: "#f7dcc2", shade: "#cda68a",
    f: { rx: 11.2, ry: 13.6, chin: 0.55, eye: "#6d7f92", brow: "#a79888", browW: 1.3, arch: 1.2, nose: "redonda", mouth: "seria", lips: "#cf7d78", blush: "rgba(240,110,110,.34)" },
    arm: { col: "#b5202e", cuff: "#fffdf4", trim: "#f2c63e", prop: "batuta" },
    back() { line([[X - 9, Y - 1], [X - 16, Y + 4], [X - 15.5, Y + 14]], OL, 5.2); line([[X - 9, Y - 1], [X - 16, Y + 4], [X - 15.5, Y + 14]], "#f1efe9", 3.6); P([[X - 16, Y + 2], [X - 22, Y - 1], [X - 21.5, Y + 6]], "#17151b", 0.8); P([[X - 15, Y + 2], [X - 9, Y - 2.5], [X - 9.5, Y + 6]], "#17151b", 0.8); },
    legs() { legs("#c7273a", "#17141a", { stock: "#fffdf6", buckle: true }); },
    body() {
      P([[-13, 8], [-16, 21], [-8, 19], [-4, 13]], "#a81d2b", 1.3); P([[13, 8], [16, 21], [8, 19], [4, 13]], "#8f1824", 1.3);
      torso("#c0212f", { fn() {
        P([[-4.4, -11], [4.6, -11], [3.8, 16], [-3.8, 16]], lin(0, -11, 0, 16, "#fff8e0", "#ecdab0"), 0.7);
        for (let y = -6; y < 15; y += 3.6) { line([[-3, y], [-1, y + 1], [1, y], [3, y + 1]], "#c79a30", 0.45); }
        for (const d of [-1, 1]) { line([[d * 4.8, -10], [d * 4.6, 16]], "#f2c63e", 1.1, true); for (let y = -8; y < 15; y += 3) E(d * 6.4, y, 0.5, 0.5, "#f2c63e"); }
        btns(-8.5, [-1, 4.5, 10]); btns(9, [-1, 4.5, 10]);
      } });
    },
    collar() {
      for (let i = 0; i < 5; i++) S([[X - 4.8 + i * 0.5, Y + 13 + i * 2], [X, Y + 12 + i * 2], [X + 4.8 - i * 0.5, Y + 13 + i * 2], [X + 3, Y + 16 + i * 2], [X, Y + 15 + i * 2], [X - 3, Y + 16 + i * 2]], lin(0, Y + 12 + i * 2, 0, Y + 16 + i * 2, "#fff", "#d9d3c7"), 0.7);
    },
    hair() {
      const p = [[X - 11.6, Y - 3], [X - 11.2, Y - 12], [X - 5, Y - 16.8], [X + 5, Y - 16.8], [X + 11.2, Y - 12], [X + 11.6, Y - 3], [X + 9.2, Y - 8], [X + 4, Y - 11], [X - 4, Y - 11], [X - 9.2, Y - 8]];
      S(p, lin(X, Y - 17, X, Y - 3, "#ffffff", "#d5d2cc"), 1.4);
      inside(p, true, () => { for (let i = -11; i <= 11; i++) line([[X + i * 0.3, Y - 17], [X + i * 1.1, Y - 4]], "rgba(130,126,120,.5)", 0.4); });
      for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { const x = X + d * (12.1 - i * 0.12), y = Y - 5.2 + i * 4.3; E(x, y, 4.1, 2.25, lin(x, y - 2, x, y + 2, "#ffffff", "#c5c2bc"), 1.1); c.beginPath(); c.ellipse(x, y, 2.2, 1, 0, 0, TAU); c.strokeStyle = "rgba(120,116,110,.75)"; c.lineWidth = 0.45; c.stroke(); }
    } });

  add({ id: "f_beeth", name: "BEETHOVEN", rar: 1, flag: "de", story: "Compuso la Novena Sinfonía cuando ya estaba sordo.",
    skin: "#e3b68f", shade: "#ae7f5d",
    f: { rx: 11.8, ry: 14, chin: 0.68, eye: "#3f4f58", brow: "#2e2a26", browW: 2.9, arch: 0.3, browA: 1.3, nose: "ancha", mouth: "enfado", age: 1 },
    arm: { col: "#23303f", cuff: "#fbf8ee", prop: "partitura" },
    back() {
      const p = [[X - 13, Y + 8], [X - 19, Y - 1], [X - 16, Y - 11], [X - 19, Y - 18], [X - 10, Y - 20], [X - 8, Y - 27], [X, Y - 23], [X + 8, Y - 28], [X + 11, Y - 20], [X + 20, Y - 19], [X + 17, Y - 10], [X + 20, Y], [X + 13, Y + 9]];
      S(p, lin(X - 19, Y - 27, X + 19, Y + 8, "#79746e", "#3d3a37", "#1b1a19"), 1.6);
      inside(p, true, () => { for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; line([[X + Math.cos(a) * 7, Y - 6 + Math.sin(a) * 7], [X + Math.cos(a + 0.3) * 15, Y - 6 + Math.sin(a + 0.3) * 15], [X + Math.cos(a + 0.1) * 25, Y - 6 + Math.sin(a + 0.1) * 25]], i % 2 ? "rgba(214,210,204,.55)" : "rgba(10,10,10,.55)", 0.55); } });
    },
    legs() { legs("#2b2b31", "#14110f", {}); },
    body() {
      torso("#25344a", { fn() {
        P([[-5.4, -11], [5.4, -11], [3.6, 16], [-3.6, 16]], lin(0, -11, 0, 16, "#fff9ee", "#d7cfbe"), 0.8);
        for (const d of [-1, 1]) P([[d * 4.4, -11], [d * 10.8, -9], [d * 6.4, 5], [d * 3.5, 16]], lin(d * 4, -11, d * 9, 12, "#3b4d68", "#141e2d"), 0.85);
        btns(-5.5, [8, 12.6], "#101820"); btns(5.5, [8, 12.6], "#101820");
      } });
    },
    collar() {
      S([[X - 8, Y + 11], [X, Y + 13], [X + 8, Y + 11], [X + 8, Y + 15.6], [X + 2, Y + 18], [X - 2, Y + 18], [X - 8, Y + 15.6]], lin(X - 8, Y + 11, X + 8, Y + 18, "#e24b42", "#bb2221", "#7f1213"), 1.15);
      for (const q of [[X - 5, Y + 12.5, X - 1, Y + 17], [X + 5, Y + 12.5, X + 1, Y + 17], [X, Y + 13.5, X, Y + 17.6]]) line([[q[0], q[1]], [q[2], q[3]]], "rgba(90,8,10,.75)", 0.55, true);
      S([[X - 2.5, Y + 16], [X + 2.5, Y + 16], [X + 3.6, Y + 25], [X, Y + 23.3], [X - 3.6, Y + 25]], lin(0, Y + 16, 0, Y + 25, "#d93c37", "#8f1818"), 1);
    },
    hair() {
      for (const q of [
        [[X - 3, Y - 15], [X - 8, Y - 11], [X - 9, Y - 6], [X - 6, Y - 9], [X - 3, Y - 10]],
        [[X + 3, Y - 15], [X + 8, Y - 11], [X + 10, Y - 6], [X + 6.5, Y - 9], [X + 3, Y - 10]],
        [[X - 2, Y - 16], [X, Y - 11], [X + 3, Y - 8.5], [X + 2, Y - 11.5], [X + 4, Y - 15]],
        [[X - 10.8, Y - 11], [X - 13.2, Y - 3], [X - 12, Y + 5], [X - 10.6, Y], [X - 10.4, Y - 6]],
        [[X + 10.8, Y - 11], [X + 13.4, Y - 3], [X + 12.2, Y + 5], [X + 10.8, Y], [X + 10.5, Y - 6]],
      ]) hairS(q, "#605b55", 5, 0.5, 1);
      hairS([[X - 11, Y - 9], [X - 7, Y - 16], [X, Y - 18], [X + 7, Y - 16], [X + 11, Y - 9], [X + 6, Y - 13], [X, Y - 13.8], [X - 6, Y - 13]], "#58534d", 14, 1, 1.1);
    } });

  add({ id: "f_bolivar", name: "SIMÓN BOLÍVAR", rar: 1, flag: "ve", story: "El Libertador, nacido en Caracas, liberó medio continente.",
    skin: "#deae85", shade: "#a87a55",
    f: { rx: 10.5, ry: 14.9, chin: 0.48, eye: "#2e2015", brow: "#1a1210", browW: 2.2, arch: 0.7, browA: 0.6, nose: "aguilena", mouth: "fina", age: 1 },
    arm: { col: "#1a2c63", cuff: "#c8222e", trim: "#f2c63e", prop: "espada" },
    legs() { legs("#fbf8ee", "#14110f", { boot: "#17130f", cuff: "#3c2f24", sole: "#050403" }); },
    body() {
      P([[-13, 8], [-16.4, 22], [-8, 20], [-4, 13]], lin(-16, 8, -4, 22, "#2a4282", "#132150"), 1.4);
      torso("#1d3170", { fn() {
        P([[-5, -11], [5, -11], [4, 16], [-4, 16]], lin(-5, -11, 5, 16, "#d6303c", "#8e1520"), 0.8);
        for (let y = -7; y < 15; y += 3.2) { line([[-3.6, y], [3.6, y]], "#f2c63e", 0.85, true); E(-3.6, y, 0.6, 0.6, "#ffe07a"); E(3.6, y, 0.6, 0.6, "#ffe07a"); }
        btns(-7.8, [-2, 3, 8, 13]); btns(7.8, [-2, 3, 8, 13]);
      } });
      // la banda con los colores de la Gran Colombia
      const b = [[-12.6, -5.5], [-9, -8.6], [13, 8.6], [11.6, 12.4]];
      inside(TORSO, true, () => { P(b, "#f6cd2b", 0.7); P([[-11.4, -4.6], [-7.8, -7.7], [12.7, 9.4], [12, 11.4]], "#2342ad", 0); P([[-10.6, -3.8], [-7, -7], [12.6, 10.2], [12, 11.8]], "#d6222f", 0); });
      belt(8.2, "#c8a033", true);
      epaulet(-9.6, -7.8, -1); epaulet(9.8, -7.8, 1);
    },
    collar() {
      P([[X - 7.2, Y + 9.6], [X + 7.2, Y + 9.6], [X + 7.6, Y + 16], [X - 7.6, Y + 16]], lin(0, Y + 9, 0, Y + 16, "#d6303c", "#8e1520"), 1.1);
      line([[X - 7, Y + 11], [X + 7, Y + 11]], "#f2c63e", 0.8, true); for (let i = -2; i <= 2; i++) { line([[X + i * 2.8 - 0.8, Y + 15.2], [X + i * 2.8, Y + 12.8], [X + i * 2.8 + 0.8, Y + 15.2]], "#f2c63e", 0.5, true); }
    },
    beard() {
      for (const d of [-1, 1]) hairS([[X + d * 9.8, Y - 2], [X + d * 10.5, Y + 3], [X + d * 9, Y + 9.2], [X + d * 6.8, Y + 8], [X + d * 8, Y + 3]], "#231812", 4, 0.3, 0.75);
    },
    hair() {
      curls([[X - 10.8, Y - 7, 3], [X + 10.8, Y - 7, 3], [X - 8.8, Y - 12, 3.4], [X + 8.8, Y - 12, 3.4], [X - 4, Y - 15, 3.5], [X + 3.6, Y - 15.2, 3.5], [X, Y - 12.3, 2.7], [X - 5, Y - 10.8, 2.3], [X + 5.5, Y - 11, 2.3], [X + 1.5, Y - 9.5, 1.8]], 3, "#2d2018");
    } });

  add({ id: "f_lincoln", name: "ABRAHAM LINCOLN", rar: 1, flag: "us", story: "El presidente de Estados Unidos que abolió la esclavitud.",
    skin: "#deb48c", shade: "#a97e5a",
    f: { rx: 10.2, ry: 15.6, chin: 0.5, eye: "#46505a", brow: "#1b1613", browW: 2.5, arch: 0.8, browA: 0.2, nose: "aguilena", mouth: "fina", age: 2,
      spots() { E(X + 6.7, Y + 7, 0.95, 0.95, "#5c3a26"); line([[X - 5.7, Y + 1], [X - 6.9, Y + 6.5]], "rgba(105,70,44,.55)", 0.7); line([[X + 7.5, Y + 0.6], [X + 8.3, Y + 4.8]], "rgba(105,70,44,.55)", 0.7); } },
    arm: { col: "#1a1a20", cuff: "#fbf8ee" },
    legs() { legs("#24242b", "#0d0c0d", {}); },
    body() {
      P([[-12.8, 8], [-15, 23], [-6, 22], [-3, 13]], lin(-15, 8, -3, 23, "#2c2c33", "#111115"), 1.4); P([[12.8, 8], [15, 23], [6, 22], [3, 13]], lin(15, 8, 3, 23, "#26262c", "#0d0d10"), 1.4);
      torso("#1d1d24", { fn() {
        P([[-5, -11], [5, -11], [3.8, 7], [-3.8, 7]], "#fbf8ee", 0.7); P([[-4, -2], [4, -2], [3.4, 11], [-3.4, 11]], lin(0, -2, 0, 11, "#3c3c45", "#17171c"), 0.75);
        btns(0, [1, 5, 9], "#0d0d10"); line([[-3.4, 4.8], [-1.2, 6.2], [0.5, 5]], "#f2c63e", 0.42);
        for (const d of [-1, 1]) P([[d * 4.5, -11], [d * 11, -8.4], [d * 6.6, 5.4], [d * 3.5, 9]], lin(d * 4, -11, d * 9, 8, "#3e3e48", "#0f0f13"), 0.85);
      } });
    },
    collar() {
      P([[X - 6.4, Y + 11.4], [X + 6.4, Y + 11.4], [X + 5, Y + 16], [X, Y + 14.8], [X - 5, Y + 16]], "#fff", 0.9);
      P([[X, Y + 15.1], [X - 5.6, Y + 12.8], [X - 5.2, Y + 18.3], [X, Y + 16.2], [X + 5.2, Y + 18.3], [X + 5.6, Y + 12.8]], lin(0, Y + 12, 0, Y + 18, "#333339", "#0c0c0f"), 0.75);
      E(X, Y + 15.6, 1.05, 1.15, "#17171b", 0.5);
    },
    beard() {
      const p = [[X - 10.4, Y + 1], [X - 9, Y + 8], [X - 5.6, Y + 12.2], [X - 2.3, Y + 13.2], [X - 1, Y + 11.7], [X + 2.1, Y + 11.7], [X + 3, Y + 13.2], [X + 6, Y + 12.2], [X + 9.2, Y + 8], [X + 10.5, Y + 1], [X + 11, Y + 10], [X + 7, Y + 17.2], [X + 0.5, Y + 20.3], [X - 6, Y + 17.2], [X - 11, Y + 10]];
      S(p, lin(X - 10, Y, X + 11, Y + 20, "#2f2a26", "#14110f"), 1.25);
      inside(p, true, () => { for (let i = -11; i <= 11; i++) line([[X + i * 1, Y + 2], [X + i * 0.72, Y + 21]], i % 2 ? "rgba(150,144,138,.42)" : "rgba(0,0,0,.45)", 0.42, true); });
    },
    hair() { for (const d of [-1, 1]) hairS([[X + d * 8.6, Y - 9], [X + d * 11.4, Y - 5], [X + d * 11.8, Y + 3], [X + d * 10.4, Y + 4], [X + d * 9, Y - 3]], "#241e1a", 4, 0.4, 0.95); },
    hat() {
      const p = [[X - 9.4, Y - 11], [X - 9.8, Y - 36], [X + 10, Y - 36], [X + 9.6, Y - 11]];
      P(p, lin(X - 10, 0, X + 10, 0, "#46464f", "#1f1f25", "#0a0a0c"), 1.6);
      E(X, Y - 36, 9.9, 2.3, lin(X - 9, 0, X + 9, 0, "#3e3e47", "#111114"), 1.4);
      inside(p, false, () => { for (let i = -3; i <= 3; i++) line([[X + i * 2.8, Y - 36], [X + i * 2.75, Y - 11]], "rgba(130,130,145,.2)", 0.5, true); E(X - 4.8, Y - 24, 1.5, 11, "rgba(255,255,255,.1)"); });
      P([[X - 9.7, Y - 15.4], [X + 9.9, Y - 15.4], [X + 9.7, Y - 11.4], [X - 9.5, Y - 11.4]], "#0a0a0c", 0.8);
      S([[X - 15.6, Y - 10.6], [X, Y - 13], [X + 15.6, Y - 10.6], [X + 12, Y - 8.3], [X, Y - 9.6], [X - 12, Y - 8.3]], lin(0, Y - 13, 0, Y - 8, "#44444d", "#0e0e11"), 1.3);
    } });

  // ★ COMUNES
  add({ id: "f_cape", name: "CAPERUCITA", rar: 0, flag: "de", story: "La niña de la capa roja del cuento de Perrault y los Grimm.",
    skin: "#fbdcc4", shade: "#d9a98c",
    f: { rx: 10.8, ry: 13, chin: 0.46, eye: "#3f7fbf", brow: "#c49648", browW: 1.3, arch: 1.3, lash: true, nose: "redonda", mouth: "dientes", lips: "#d0615e", blush: "rgba(240,90,90,.38)", eyeH: 1.08,
      spots() { for (const q of [[X - 7, Y + 3], [X - 5, Y + 4.5], [X - 8, Y + 5], [X + 7, Y + 3], [X + 8.5, Y + 4.8], [X + 6, Y + 5]]) E(q[0], q[1], 0.32, 0.32, "rgba(170,92,52,.75)"); } },
    arm: { col: "#d5202e", hand: "#fbdcc4", prop: "cesta" },
    back() { capeBack("#a81621", "#c81c2a", 18, 24); },
    legs() { skirt("#3e6fb4", { shoe: "#5c3a1e", hem: "#fff", fn() { P([[-7, 6], [7, 6], [8.6, 21], [-8.6, 21]], lin(0, 6, 0, 21, "#ffffff", "#e6e1d6"), 0.7); line([[-8, 18], [0, 19], [8, 18]], "rgba(130,120,110,.6)", 0.5); for (let i = -7; i <= 7; i += 2) E(i, 20.7, 0.75, 0.55, "#fff", 0.28); } }); },
    body() {
      torso("#fbf8ee", { fn() { P([[-8, -3], [8, -3], [9, 16], [-9, 16]], lin(0, -3, 0, 16, "#2f3b6e", "#1e2850"), 0.8); for (let y = 0; y < 8; y += 2.4) { line([[-2.4, y], [2.4, y + 1.6]], "#fff", 0.55, true); line([[2.4, y], [-2.4, y + 1.6]], "#fff", 0.55, true); } } });
      for (const d of [-1, 1]) S([[d * 2, -11], [d * 14, -7.5], [d * 14, 3], [d * 9, 7], [d * 3, 0]], lin(d * 2, -10, d * 14, 6, "#e0313c", "#a71622"), 1.3);
      line([[-2.4, -3], [0, -1.2], [2.4, -3]], "#fff", 0.9); E(0, -1.2, 1.2, 1.2, "#fff", 0.5);
    },
    hair() {
      for (const d of [-1, 1]) {
        for (let i = 0; i < 5; i++) { const x = X + d * (11.4 - i * 0.2), y = Y + 1 + i * 3.2; E(x, y, 2.5, 2.1, lin(x, y - 2, x, y + 2, "#ffdf7c", "#c98f2a"), 0.9, d * (i % 2 ? 0.5 : -0.5)); }
        E(X + d * 10.5, Y + 17.4, 1.9, 1.3, "#d5202e", 0.7);
      }
      hairS([[X - 10.6, Y - 3], [X - 9, Y - 12], [X, Y - 14.6], [X + 9, Y - 12], [X + 10.6, Y - 3], [X + 7.5, Y - 8.8], [X + 3, Y - 9.5], [X, Y - 7.4], [X - 3, Y - 9.5], [X - 7.5, Y - 8.8]], "#ecbd52", 13, 0.6, 1.1);
    },
    hat() {
      const p = [[X - 13.2, Y + 12], [X - 14.4, Y - 7], [X - 9, Y - 19], [X, Y - 24.5], [X + 9, Y - 19], [X + 14.4, Y - 7], [X + 13.2, Y + 12], [X + 9.8, Y + 9.5], [X + 11.4, Y - 5], [X + 8, Y - 13], [X, Y - 15.5], [X - 8, Y - 13], [X - 11.4, Y - 5], [X - 9.8, Y + 9.5]];
      S(p, lin(X - 14, Y - 24, X + 14, Y + 12, "#ee3a43", "#c91b29", "#8e111b"), 1.6);
      inside(p, true, () => { for (let i = -7; i <= 7; i++) line([[X + i * 0.6, Y - 25], [X + i * 2.15, Y - 8], [X + i * 2.05, Y + 13]], "rgba(90,6,12,.42)", 0.5); line([[X - 11, Y - 12], [X - 6, Y - 19]], "rgba(255,190,190,.65)", 1.1); });
      S(p, null, 1.6);
    } });

  add({ id: "f_pino", name: "PINOCHO", rar: 0, flag: "it", story: "El muñeco de madera de Collodi, con su gorro de miga de pan.",
    skin: "#e6b478", shade: "#b47e45",
    f: { rx: 10.4, ry: 12.6, chin: 0.72, eye: "#3b2a1a", brow: "#4a2f18", browW: 2.2, arch: 1.8, nose: "ninguna", mouth: "dientes", blush: "rgba(226,56,46,.55)", eyeH: 1.2,
      spots() { for (let i = 0; i < 8; i++) line([[X - 11 + i * 3.4, Y - 14], [X - 10 + i * 3.1, Y - 3], [X - 12 + i * 3.5, Y + 14]], "rgba(132,84,38,.34)", 0.45); E(X - 6.8, Y + 3.5, 2.8, 2.8, "rgba(226,56,46,.5)"); E(X + 7.6, Y + 3.5, 2.6, 2.6, "rgba(226,56,46,.5)"); E(X - 7.6, Y - 8.4, 1.1, 0.75, "none", 0.4, 0.2, "rgba(112,70,30,.6)"); },
      extra() {
        const n = [[X + 2, Y + 1.2], [X + 12, Y + 2.1], [X + 25, Y + 3.8], [X + 26.6, Y + 5], [X + 25, Y + 6.1], [X + 12, Y + 6.2], [X + 2, Y + 6.5], [X - 0.5, Y + 4]];
        S(n, lin(X, Y + 1, X, Y + 7, lt("#e6b478", 0.3), "#e0aa6a", "#a9723d"), 1.25);
        for (const x of [8, 13, 18, 22]) line([[X + x, Y + 2.9 + x * 0.04], [X + x + 2.2, Y + 3 + x * 0.05]], "rgba(120,74,34,.55)", 0.4, true);
      } },
    arm: { col: "#d9843a", wood: "#e6b478", hand: "#e6b478" },
    legs() {
      legs("#e6b478", "#7a4a26", {});
      for (const lx of [-5, 3.6]) { E(lx - 1.5, 17, 2.8, 2.2, lin(lx - 3, 15, lx, 19, "#f2c98e", "#b47e45"), 0.9); E(lx - 1.8, 16.7, 0.65, 0.65, "#7a4a26"); }
      P([[-11.2, 11], [11, 11], [10, 16.4], [1, 15.2], [-1, 15.2], [-10.5, 16.4]], "#c8452e", 1.2);
      for (let x = -10; x < 10; x += 3.3) E(x, 13.1, 0.75, 0.75, "#ffe7a6", 0.25);
    },
    body() {
      torso("#e88f3f", { fn() {
        for (const q of [[-8, -6], [-3, -2], [4, -6], [9, -1], [-9, 3], [-4, 7], [3, 3], [8, 7], [-1, 11], [-8, 13], [7, 13]]) { for (let i = 0; i < 5; i++) { const a = (i * TAU) / 5; E(q[0] + Math.cos(a) * 1.1, q[1] + Math.sin(a) * 1.1, 0.75, 0.75, i % 2 ? "#fff0c0" : "#ffe2a0"); } E(q[0], q[1], 0.6, 0.6, "#c7372e"); }
      } });
      S([[-7, -11], [0, -7.2], [7, -11], [9, -8], [0, -3.4], [-9, -8]], "#fffaf0", 1.05);
      P([[-1.6, -5.2], [-6.2, -7.6], [-6.2, -2.8]], "#d4322a", 0.7); P([[1.6, -5.2], [6.2, -7.6], [6.2, -2.8]], "#d4322a", 0.7); E(0, -5.2, 1.4, 1.4, "#ad231d", 0.6);
    },
    hair() { hairS([[X - 10.2, Y - 1], [X - 10, Y - 9], [X - 7, Y - 11], [X - 7.6, Y - 4]], "#3a2412", 3, 0.3, 0.9); hairS([[X + 10.2, Y - 1], [X + 10, Y - 9], [X + 7, Y - 11], [X + 7.6, Y - 4]], "#3a2412", 3, 0.3, 0.9); },
    hat() {
      const p = [[X - 11.2, Y - 8], [X - 5, Y - 22], [X + 1.5, Y - 39], [X + 5.2, Y - 22], [X + 11.6, Y - 8], [X, Y - 11.4]];
      P(p, lin(X - 11, Y - 39, X + 11, Y - 8, "#ffffff", "#f1e6cf", "#cdbf9e"), 1.5);
      inside(p, false, () => { for (const q of [[X - 3, Y - 15], [X + 3, Y - 19], [X + 1, Y - 27], [X - 5, Y - 11.5], [X + 6.2, Y - 12.4], [X + 1.5, Y - 13]]) E(q[0], q[1], 0.7, 0.55, "rgba(180,146,92,.7)"); line([[X - 10, Y - 9], [X + 1.5, Y - 37]], "rgba(190,170,130,.55)", 0.5); });
      S([[X - 12, Y - 7.4], [X, Y - 11.2], [X + 12, Y - 7.4], [X + 11.5, Y - 9.8], [X, Y - 13.7], [X - 11.5, Y - 9.8]], lin(0, Y - 14, 0, Y - 7, "#fffdf6", "#d3c5a6"), 1);
    } });

  add({ id: "f_alicia", name: "ALICIA", rar: 0, flag: "gb", story: "La niña que cayó por la madriguera en el libro de Lewis Carroll.",
    skin: "#fce0cc", shade: "#dcae94",
    f: { rx: 10.8, ry: 13.1, chin: 0.46, eye: "#4a7fb0", brow: "#b48a48", browW: 1.25, arch: 1.5, lash: true, nose: "fina", mouth: "seria", lips: "#d9716f", blush: "rgba(240,110,110,.34)", eyeH: 1.1 },
    arm: { col: "#f2c33a", cuff: "#fff", hand: "#fce0cc", prop: "botella" },
    back() { hairS([[X - 12.5, Y - 8], [X - 9, Y - 16], [X + 9, Y - 16], [X + 12.5, Y - 8], [X + 15, Y + 8], [X + 12.5, Y + 21], [X + 4, Y + 23], [X - 4, Y + 23], [X - 12.5, Y + 21], [X - 15, Y + 8]], "#eec05a", 20, 2); },
    legs() { skirt("#f2c33a", { shoe: "#17141a", hem: "#2d5fa8", fn() { P([[-8, 6], [8, 6], [10.5, 20], [-10.5, 20]], lin(0, 6, 0, 20, "#ffffff", "#ece7da"), 0.8); for (let i = -9; i <= 9; i += 2.2) E(i, 20.2, 1.1, 0.8, "#fff", 0.3); line([[-9.4, 15.5], [0, 16.5], [9.4, 15.5]], "rgba(130,120,110,.55)", 0.45); P([[-5.2, 9.5], [-0.8, 9.5], [-0.8, 13.5], [-5.2, 13.5]], "#fbf8ee", 0.45); } }); for (const lx of [-5, 3.8]) { for (let y = 18.4; y < 24; y += 1.8) line([[lx - 3.3, y + 5], [lx + 2.2, y + 5]], "rgba(0,0,0,0)", 0.1); } },
    body() {
      torso("#f2c33a", { fn() { P([[-7.6, -6], [7.6, -6], [8, 16], [-8, 16]], lin(0, -6, 0, 16, "#ffffff", "#ece7da"), 0.8); for (let i = -6; i <= 6; i += 3) line([[i, -5], [i * 1.05, 6]], "rgba(150,140,125,.45)", 0.4, true); } });
      for (const d of [-1, 1]) { S([[d * 3, -6.5], [d * 8.8, -7.4], [d * 11, -3], [d * 7.2, 5], [d * 5, 4.6]], lin(d * 3, -7, d * 10, 4, "#fff", "#e6dfd0"), 0.85); }
      P([[-11, 3.7], [11, 3.7], [11, 6.7], [-11, 6.7]], "#2d5fa8", 0.9);
      for (const d of [-1, 1]) S([[d * 1, 5.2], [d * 6, 2], [d * 7, 8], [d * 2, 6.5]], "#2d5fa8", 0.8);
      E(0, 5.3, 1.3, 1.3, "#234b86", 0.6);
    },
    collar() { S([[X - 6.4, Y + 12.4], [X, Y + 15.2], [X + 6.4, Y + 12.4], [X + 6.3, Y + 16], [X, Y + 17.4], [X - 6.3, Y + 16]], "#fff", 0.9); },
    hair() {
      hairS([[X - 11.6, Y + 2], [X - 11.2, Y - 10], [X - 5, Y - 16], [X + 5, Y - 16], [X + 11.2, Y - 10], [X + 11.6, Y + 2], [X + 9.7, Y - 4], [X + 8.5, Y - 9], [X + 2, Y - 11.6], [X - 3.5, Y - 9.8], [X - 8.5, Y - 9], [X - 9.7, Y - 4]], "#efc666", 18, 1);
      for (const d of [-1, 1]) hairS([[X + d * 10, Y - 6], [X + d * 12.4, Y + 2], [X + d * 12.8, Y + 11], [X + d * 10.8, Y + 16], [X + d * 9.8, Y + 7], [X + d * 10, Y]], "#eabc56", 6, 0.8, 1);
    },
    hat() {
      c.beginPath(); c.ellipse(X, Y - 5.8, 12, 10.6, 0, Math.PI * 1.04, Math.PI * 1.96); c.strokeStyle = OL; c.lineWidth = 3.4; c.stroke();
      c.strokeStyle = "#17141a"; c.lineWidth = 2.1; c.stroke();
      c.beginPath(); c.ellipse(X, Y - 5.8, 12, 10.6, 0, Math.PI * 1.2, Math.PI * 1.55); c.strokeStyle = "rgba(255,255,255,.42)"; c.lineWidth = 0.45; c.stroke();
    } });

  add({ id: "f_robin", name: "ROBIN HOOD", rar: 0, flag: "gb", story: "El arquero del bosque de Sherwood: roba a los ricos para los pobres.",
    skin: "#ecc29c", shade: "#b98c67",
    f: { rx: 10.8, ry: 14, chin: 0.5, eye: "#40743f", brow: "#5c3a1e", browW: 2, arch: 1.1, nose: "recta", mouth: "dientes" },
    arm: { col: "#3f7a34", cuff: "#7a4a22", hand: "#7a4a22", prop: "arco" },
    back() {
      capeBack("#2c5a28", "#35692f", 16, 22);
      c.save(); c.translate(-10, -3); c.rotate(-0.42);
      P([[-3.4, -9], [3.4, -9], [3, 13], [-3, 13]], lin(-3, 0, 3, 0, "#a3703e", "#6b4422"), 1.2);
      for (const y of [-6, 8]) line([[-3.3, y], [3.3, y]], "#3f2813", 0.8, true);
      for (let i = -1; i <= 1; i++) { line([[i * 1.8, -8], [i * 2, -18]], "#d8c8a2", 0.7, true); P([[i * 2 - 1.1, -18], [i * 2 + 1.1, -18], [i * 2 + 1.1, -22], [i * 2, -21], [i * 2 - 1.1, -22]], i ? "#d63a32" : "#fbf8ee", 0.4); }
      c.restore();
    },
    legs() { legs("#3a5a30", "#6b4422", { boot: "#7a4f28", cuff: "#94663a" }); },
    body() {
      torso("#468a3a", { fn() {
        P([[-3.8, -11], [3.8, -11], [1.5, 2], [-1.5, 2]], "#ecc29c", 0.7); for (let i = 0; i < 4; i++) { line([[-3 + i * 0.5, -8 + i * 2.5], [3 - i * 0.5, -6.4 + i * 2.5]], "#7a4a22", 0.55, true); line([[3 - i * 0.5, -8 + i * 2.5], [-3 + i * 0.5, -6.4 + i * 2.5]], "#7a4a22", 0.55, true); }
      } });
      belt(5.4, "#6b4422", true);
      const h = [[-12, 8.7], [12, 8.7], [14, 19], [8, 16.5], [3.5, 20], [-1.5, 16.5], [-7, 20], [-14, 19]];
      P(h, lin(0, 9, 0, 20, "#468a3a", "#2c5a28"), 1.3);
      line([[-13, -8], [13, 7]], "#6b4422", 1.5, true); line([[-13, -8.5], [13, 6.5]], "rgba(255,226,180,.4)", 0.35, true);
    },
    collar() { S([[X - 9, Y + 11], [X, Y + 15.5], [X + 9, Y + 11], [X + 11.5, Y + 16], [X + 5, Y + 20], [X, Y + 17.5], [X - 5, Y + 20], [X - 11.5, Y + 16]], lin(0, Y + 11, 0, Y + 20, "#3a7032", "#274d24"), 1.1); },
    beard() {
      hairS([[X - 3.8, Y + 11.8], [X + 0.6, Y + 13], [X + 4.9, Y + 11.8], [X + 3.2, Y + 15.6], [X + 0.6, Y + 17.5], [X - 2.1, Y + 15.6]], "#6a4324", 6, 0.3, 0.9);
      for (const d of [-1, 1]) S([[X + 0.6, Y + 8.1], [X + d * 3.5, Y + 7.8], [X + d * 6.6, Y + 9.6], [X + d * 3.5, Y + 9.4]], "#6a4324", 0.7);
    },
    hair() { for (const d of [-1, 1]) hairS([[X + d * 9, Y - 10], [X + d * 11.7, Y - 5], [X + d * 11.9, Y + 2], [X + d * 10.3, Y + 5], [X + d * 9.6, Y - 3]], "#7a4c28", 4, 0.3, 0.95); hairS([[X - 9.6, Y - 7], [X - 5, Y - 13], [X + 5, Y - 13], [X + 9.6, Y - 7], [X + 4, Y - 9.5], [X - 2, Y - 8.2]], "#85552e", 10, 0.5, 1); },
    hat() {
      const p = [[X - 12.6, Y - 7.8], [X - 11, Y - 15], [X - 3, Y - 19.5], [X + 9, Y - 20], [X + 23, Y - 19.5], [X + 11, Y - 12.6], [X + 12, Y - 7.8], [X, Y - 11]];
      S(p, lin(X - 12, Y - 20, X + 16, Y - 8, "#5fa64a", "#3f7a34", "#254e22"), 1.5);
      inside(p, true, () => { line([[X - 11, Y - 11], [X, Y - 14], [X + 13, Y - 11]], "rgba(20,50,18,.6)", 0.5); line([[X - 2, Y - 19], [X + 2, Y - 12]], "rgba(20,50,18,.5)", 0.5); });
      const f = [[X - 7, Y - 12.8], [X - 16, Y - 20], [X - 20, Y - 31], [X - 11, Y - 26], [X - 5, Y - 15]];
      S(f, lin(X - 20, Y - 31, X - 5, Y - 13, "#ff6054", "#d4231f", "#8e1412"), 1);
      line([[X - 6.2, Y - 13.5], [X - 13, Y - 22], [X - 19, Y - 30]], "#fff", 0.45);
      for (const q of [[-11, -22], [-14, -25.5], [-16, -28]]) line([[X + q[0], Y + q[1]], [X + q[0] + 2.6, Y + q[1] - 2.1]], "rgba(120,12,12,.75)", 0.35, true);
    } });

  add({ id: "f_criatura", name: "LA CRIATURA", rar: 0, flag: "ch", story: "El ser de Frankenstein, tal como lo cuenta el libro de Mary Shelley.",
    skin: "#c8c47e", shade: "#8e8c50",
    f: { rx: 12.2, ry: 15.3, chin: 0.76, eye: "#7a8a70", white: "#e8e6c0", brow: "#1a1712", browW: 3, arch: 0.3, browA: 1, nose: "ancha", mouth: "fina", lips: "#2f2a26", blush: "rgba(90,110,60,.25)", age: 1,
      spots() {
        const st = (a, b, d, e) => { line([[a, b], [d, e]], "#4a3a30", 0.75, true); const n = 5; for (let i = 0; i <= n; i++) { const t = i / n, x = a + (d - a) * t, y = b + (e - b) * t, h = Math.atan2(e - b, d - a) + Math.PI / 2; line([[x - Math.cos(h) * 1.25, y - Math.sin(h) * 1.25], [x + Math.cos(h) * 1.25, y + Math.sin(h) * 1.25]], "#4a3a30", 0.42, true); } };
        st(X - 10, Y - 6.8, X + 2, Y - 9.8); st(X + 7.2, Y + 2, X + 9.8, Y + 10);
        E(X - 8.8, Y + 7.5, 1.6, 1.2, "rgba(120,140,96,.65)");
      } },
    arm: { col: "#34302b", cuff: "#1f1c19", hand: "#c8c47e" },
    back() {
      hairS([[X - 13.6, Y - 9], [X - 10, Y - 18], [X, Y - 20.5], [X + 10, Y - 18], [X + 13.6, Y - 9], [X + 16.5, Y + 8], [X + 14, Y + 21], [X + 8, Y + 17], [X + 2, Y + 23], [X - 5, Y + 18], [X - 11, Y + 23], [X - 16.5, Y + 8]], "#1d1b1e", 22, 2.6);
    },
    legs() {
      legs("#3c3730", "#1c1815", {});
      for (const q of [[-8.4, 22], [0, 22]]) { P([[q[0], q[1] - 3], [q[0] + 5.5, q[1] - 3.5], [q[0] + 4, q[1] - 1], [q[0] + 2.6, q[1] - 2.4], [q[0] + 1, q[1] - 0.7]], "#3c3730", 0.7); }
    },
    body() {
      P([[-13, 8], [-16, 24], [-11.5, 21], [-9, 25], [-5, 20], [-3, 13]], lin(-16, 8, -3, 25, "#3a3631", "#1e1b18"), 1.3);
      P([[13, 8], [16, 24], [11.5, 21], [9, 25], [5, 20], [3, 13]], lin(16, 8, 3, 25, "#35312c", "#1a1815"), 1.3);
      torso("#37332e", { fn() {
        P([[-5, -11], [5.5, -11], [3, 16], [-3, 16]], lin(0, -11, 0, 16, "#a8a48a", "#6e6b58"), 0.8);
        for (const q of [[-1.5, -5], [1.8, 2], [-0.6, 9]]) line([[q[0] - 2, q[1] - 1], [q[0] + 2, q[1] + 1]], "#3e3a33", 0.6, true);
        for (const d of [-1, 1]) P([[d * 4.5, -11], [d * 11.2, -8.5], [d * 7, 6], [d * 3.5, 15]], lin(d * 4, -11, d * 9, 12, "#4b463e", "#1d1b18"), 0.85);
        for (const q of [[-9, 4, 3.4, 3], [9, 10, 3, 2.7]]) { P([[q[0] - q[2], q[1] - q[3]], [q[0] + q[2], q[1] - q[3]], [q[0] + q[2], q[1] + q[3]], [q[0] - q[2], q[1] + q[3]]], "#5a4e3f", 0.5); for (let i = 0; i < 4; i++) line([[q[0] - q[2] + i * q[2] * 0.66, q[1] - q[3] - 0.5], [q[0] - q[2] + i * q[2] * 0.66, q[1] - q[3] + 0.6]], "#d8d0ba", 0.3, true); }
      } });
    },
    hair() {
      hairS([[X - 12.8, Y + 3], [X - 12.3, Y - 10], [X - 5, Y - 17.2], [X + 5, Y - 17.2], [X + 12.3, Y - 10], [X + 12.8, Y + 3], [X + 10.5, Y - 4], [X + 8.5, Y - 10.8], [X + 4, Y - 8.4], [X + 1, Y - 11.5], [X - 3, Y - 8.2], [X - 7, Y - 11], [X - 10.5, Y - 4]], "#252228", 18, 1.2);
    } });

  add({ id: "f_vangogh", name: "VAN GOGH", rar: 0, flag: "nl", story: "El pintor de Los girasoles y La noche estrellada.",
    skin: "#efc9a2", shade: "#bb8d68",
    f: { rx: 10.7, ry: 14.5, chin: 0.56, eye: "#4b8f88", brow: "#b5521f", browW: 2, arch: 0.6, browA: 0.8, nose: "aguilena", mouth: "fina", age: 1 },
    arm: { col: "#3f6fa8", cuff: "#2d5180", prop: "paleta" },
    legs() { legs("#3c4a5e", "#3a2615", {}); },
    body() {
      const swirl = () => {
        for (let i = 0; i < 18; i++) {
          const x = -13 + ((i * 7.3) % 27), y = -10 + ((i * 11.1) % 27), a = i * 1.7;
          c.beginPath(); c.arc(x, y, 2 + (i % 3), a, a + 3.6); c.strokeStyle = ["#7fb0dc", "#2b5688", "#a9cfe9", "#1f4470", "#5e93c4", "#d8e8c8"][i % 6]; c.lineWidth = 0.8; c.stroke();
        }
      };
      torso("#3f6fa8", { fn() {
        swirl();
        P([[-4.5, -11], [4.5, -11], [2.8, 7], [-2.8, 7]], "#f4efe0", 0.7);
        for (const d of [-1, 1]) P([[d * 4.2, -11], [d * 10.5, -8.4], [d * 6, 4], [d * 2.6, 8]], lin(d * 4, -11, d * 9, 6, "#5e93c4", "#264e80"), 0.8);
        btns(0.6, [9, 13], "#1f3a5e");
      } });
    },
    collar() { P([[X - 2, Y + 13.6], [X + 2, Y + 13.6], [X + 1.5, Y + 19], [X - 1.5, Y + 19]], "#1f3f8c", 0.7); P([[X - 6, Y + 11.6], [X, Y + 14.6], [X - 4, Y + 17.3]], "#f9f4e4", 0.8); P([[X + 6, Y + 11.6], [X, Y + 14.6], [X + 4, Y + 17.3]], "#f9f4e4", 0.8); },
    beard() {
      const p = [[X - 10.4, Y + 1], [X - 8.6, Y + 7.5], [X - 4.5, Y + 8], [X + 0.7, Y + 7.5], [X + 5.8, Y + 8], [X + 9.2, Y + 7.5], [X + 10.6, Y + 1], [X + 10.2, Y + 11], [X + 6, Y + 17], [X + 0.7, Y + 18.5], [X - 5, Y + 17], [X - 10, Y + 11]];
      S(p, lin(X - 10, Y, X + 10, Y + 18, "#e66f1c", "#c14f14", "#7e2e0e"), 1.25);
      inside(p, true, () => { for (let i = 0; i < 34; i++) { const x = X - 11 + ((i * 3.7) % 22), y = Y + ((i * 5.3) % 19); line([[x, y], [x + 0.7, y + 2.6]], ["#ffb04a", "#8e3a10", "#f58a24", "#d9581a", "#ffd173"][i % 5], 0.48, true); } });
      S(p, null, 1.25);
      E(X + 0.7, Y + 11.2, 2.9, 1, "#f0ae98", 0.5);
      line([[X - 2.2, Y + 11.2], [X + 3.6, Y + 11.2]], "#7e3a2c", 0.6, true);
      for (const d of [-1, 1]) S([[X + 0.7, Y + 8], [X + d * 3.5, Y + 7.5], [X + d * 7, Y + 9.5], [X + d * 3.5, Y + 9.8]], "#d95c18", 0.65);
    },
    hair() {
      hairS([[X - 11, Y - 3], [X - 10.8, Y - 10], [X - 7.8, Y - 12], [X - 8.2, Y - 4]], "#d6601c", 4, 0.3, 0.9); hairS([[X + 11, Y - 3], [X + 10.8, Y - 10], [X + 7.8, Y - 12], [X + 8.2, Y - 4]], "#d6601c", 4, 0.3, 0.9);
    },
    hat() {
      const rim = [[X - 20, Y - 8.4], [X - 10, Y - 11.4], [X, Y - 12.4], [X + 10, Y - 11.4], [X + 21, Y - 8.4], [X + 12, Y - 6.2], [X, Y - 7], [X - 12, Y - 6.2]];
      S(rim, lin(X - 20, Y - 12, X + 20, Y - 6, "#fbe48f", "#e8c65a", "#b88f2c"), 1.4);
      inside(rim, true, () => { for (let i = 0; i < 44; i++) { const a = (i / 44) * TAU; line([[X + Math.cos(a) * 8, Y - 9.4 + Math.sin(a) * 2.5], [X + Math.cos(a) * 24, Y - 9.4 + Math.sin(a) * 5]], i % 2 ? "rgba(150,108,28,.62)" : "rgba(255,246,190,.8)", 0.34, true); } });
      const d = [[X - 10.4, Y - 10.4], [X - 9.8, Y - 19], [X - 4, Y - 23.6], [X + 4, Y - 23.6], [X + 9.8, Y - 19], [X + 10.4, Y - 10.4], [X, Y - 12.4]];
      S(d, lin(X - 10, Y - 24, X + 10, Y - 10, "#fdeb9f", "#ecca60", "#b98f2e"), 1.4);
      inside(d, true, () => { for (let y = Y - 24; y < Y - 9; y += 1.45) line([[X - 12, y + 1.6], [X, y - 0.5], [X + 12, y + 1.6]], y % 2.9 < 1.45 ? "rgba(156,114,32,.62)" : "rgba(255,248,200,.7)", 0.35); });
      S([[X - 10.5, Y - 10.2], [X, Y - 12.4], [X + 10.5, Y - 10.2], [X + 10.2, Y - 12.3], [X, Y - 14.6], [X - 10.2, Y - 12.3]], lin(0, Y - 15, 0, Y - 10, "#3f6fa8", "#1f3f70"), 0.9);
    } });

  add({ id: "f_curie", name: "MARIE CURIE", rar: 0, flag: "pl", story: "La primera persona con dos premios Nobel, en física y química.",
    skin: "#f4d9c2", shade: "#c9a68e",
    f: { rx: 10.6, ry: 14.4, chin: 0.48, eye: "#59697a", brow: "#6f675e", browW: 1.4, arch: 1, nose: "fina", mouth: "seria", lips: "#b66e68", age: 1 },
    arm: { col: "#1d1b20", cuff: "#fbf8ee", prop: "matraz" },
    back() { E(X - 1, Y - 17.5, 7.4, 5.8, rad(X - 1, Y - 17.5, 7.6, "#a7998a", "#7b6e62", "#504840"), 1.4); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line([[X - 1, Y - 17.5], [X - 1 + Math.cos(a) * 6.6, Y - 17.5 + Math.sin(a) * 4.9]], "rgba(44,38,32,.5)", 0.4, true); } },
    legs() { skirt("#201e23", { shoe: "#0f0e10", fn() { line([[-13, 20], [0, 21], [13, 20]], "rgba(120,120,130,.4)", 0.5); } }); },
    body() {
      torso("#232126", { fn() {
        for (const d of [-1, 1]) line([[d * 3.2, -11], [d * 2.8, 16]], "rgba(120,120,132,.55)", 0.5, true);
        btns(0, [-5, -1.5, 2, 5.5], "#0c0b0d");
        for (let i = 0; i < 7; i++) line([[-3 + i, -9], [-3 + i, -2]], "rgba(150,150,162,.2)", 0.4, true);
      } });
      P([[-12, 6.6], [12, 6.6], [12, 8.8], [-12, 8.8]], "#111013", 0.8);
    },
    collar() { S([[X - 6, Y + 12], [X, Y + 15.6], [X + 6, Y + 12], [X + 6.4, Y + 15.4], [X, Y + 18], [X - 6.4, Y + 15.4]], "#fbf8ee", 0.85); E(X, Y + 16.8, 1.15, 1.15, "#6a6470", 0.5); },
    hair() {
      const p = [[X - 11.4, Y + 1], [X - 12, Y - 8], [X - 7.8, Y - 16], [X, Y - 17.6], [X + 7.8, Y - 16], [X + 12, Y - 8], [X + 11.4, Y + 1], [X + 9.7, Y - 4], [X + 8, Y - 9.7], [X + 2.4, Y - 12], [X - 3.2, Y - 10.8], [X - 8, Y - 9.7], [X - 9.7, Y - 4]];
      S(p, lin(X, Y - 18, X, Y, "#a79a8c", "#6e6358"), 1.45);
      inside(p, true, () => { for (let i = -12; i <= 12; i++) line([[X + i * 0.3, Y - 18], [X + i * 0.95, Y - 10], [X + i * 1.02, Y + 2]], i % 2 ? "rgba(226,216,204,.55)" : "rgba(52,44,38,.5)", 0.42); });
      S(p, null, 1.45);
    } });

  // ---------- pintar el personaje entero ----------
  function paintBack(d) { if (d.back) d.back(); }
  function paintBody(d) {
    if (d.legs) d.legs();
    if (d.body) d.body();
  }
  function paintHead(d) {
    neck(d);
    if (d.collar) d.collar();
    head(d);
    if (d.beard) d.beard();
    if (d.hair) d.hair();
    if (d.hat) d.hat();
  }
  function arm(d, sx, sy, ang, near) {
    const A = d.arm, skin = A.hand || d.skin;
    c.save(); c.translate(sx, sy); c.rotate(ang); c.lineCap = "round"; c.lineJoin = "round";
    line([[0, 0], [10.5, 0]], OL, 8.3, true);
    const col = near ? A.col : dk(A.col, 0.2);
    if (A.metal) { line([[0, 0], [10.5, 0]], steel(0, -3, 0, 3), 5.7, true); for (const x of [3.6, 7]) line([[x, -2.8], [x, 2.8]], "rgba(70,78,88,.75)", 0.6, true); E(5.3, 0, 2, 3.1, steel(4, -3, 7, 3), 0.7); }
    else {
      line([[0, 0], [10.5, 0]], lin(0, -3, 0, 3, lt(col, 0.28), col, dk(col, 0.28)), 5.7, true);
      line([[2, -1.7], [9.5, -1.7]], al(lt(col, 0.7), 0.4), 0.55, true);
      line([[4.5, -2.6], [5.4, 2.6]], al(dk(col, 0.5), 0.4), 0.45, true);
    }
    if (A.wood) { E(5.3, 0, 2.6, 2.9, lin(4, -3, 7, 3, lt(A.wood, 0.2), A.wood, dk(A.wood, 0.28)), 0.85); E(5.3, 0, 0.6, 0.6, "#7a4a26"); }
    if (A.cuff) { P([[9.2, -3.5], [12, -3.3], [12, 3.3], [9.2, 3.5]], lin(0, -3, 0, 3, lt(A.cuff, 0.3), A.cuff, dk(A.cuff, 0.25)), 0.95); if (A.trim) line([[10.5, -3.2], [10.5, 3.2]], A.trim, 0.7, true); }
    if (A.band) { P([[8.4, -3.2], [10.8, -3.2], [10.8, 3.2], [8.4, 3.2]], gold(8, -3, 11, 3), 0.8); E(9.6, 0, 0.75, 0.9, "#c8222e", 0.3); }
    E(14.1, 0, 3.4, 3.2, rad(14.1, 0, 3.6, lt(skin, 0.24), skin, dk(skin, 0.2)), 1.3);
    for (const y of [-1.5, 0, 1.5]) line([[15.4, y], [17.3, y * 1.14]], OL, 0.42, true);
    if (near && A.prop && props[A.prop]) { c.save(); c.translate(14.4, 0); props.a = ang; props[A.prop](); c.restore(); }
    c.restore();
  }
  // parpadeo y cara de choque, encima del dibujo ya hecho
  function eyeLids(d, mood, t) {
    const f = d.f, ey = Y - 0.9, ex = [X - 4.8, X + 5.2];
    if (mood === "dead") {
      for (const x of ex) {
        E(x, ey, 4.2, 3.1, d.skin);
        c.strokeStyle = OL; c.lineWidth = 1.7; c.lineCap = "round";
        c.beginPath(); c.moveTo(x - 2.3, ey - 2.3); c.lineTo(x + 2.3, ey + 2.3); c.moveTo(x + 2.3, ey - 2.3); c.lineTo(x - 2.3, ey + 2.3); c.stroke();
      }
    } else if (t % 3.8 < 0.12) {
      for (const x of ex) {
        E(x, ey - 0.1, 4, 3, d.skin);
        c.beginPath(); c.moveTo(x - 3.3, ey + 0.2); c.quadraticCurveTo(x, ey + 1.6, x + 3.3, ey); c.strokeStyle = f.kohl || OL; c.lineWidth = 1.2; c.stroke();
      }
    }
  }

  // ---------- dibujos ya hechos para la partida ----------
  const BOX = { x: -58, y: -82, w: 126, h: 124 }, RES = 4, MAX_SPRITES = 4;
  const cache = new Map();
  function sprite(d) {
    let s = cache.get(d.id);
    if (s) { cache.delete(d.id); cache.set(d.id, s); return s; }
    const mk = (fn) => {
      const cv = document.createElement("canvas");
      cv.width = BOX.w * RES; cv.height = BOX.h * RES;
      const keep = c; c = cv.getContext("2d");
      try { c.scale(RES, RES); c.translate(-BOX.x, -BOX.y); c.lineJoin = "round"; c.lineCap = "round"; fn(d); } finally { c = keep; }
      return cv;
    };
    s = { a: d.back ? mk(paintBack) : null, b: mk(paintBody), h: mk(paintHead) };
    cache.set(d.id, s);
    if (cache.size > MAX_SPRITES) cache.delete(cache.keys().next().value);
    return s;
  }

  // Dibuja al famoso con el origen ya puesto en su centro. live: en partida, con dibujos ya hechos.
  function draw(ctx, d, flapPh, mood, t, live) {
    const keep = c;
    c = ctx;
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // el brazo de delante se queda a su lado para que se vea lo que lleva en la mano
    const sw = Math.sin(flapPh || 0), far = -2.3 + sw * 0.9, near = -0.25 - sw * 0.42, tuck = d.arm.tuck;
    try {
      if (live) {
        const s = sprite(d);
        if (s.a) ctx.drawImage(s.a, BOX.x, BOX.y, BOX.w, BOX.h);
        arm(d, -6, -1, far, false);
        ctx.drawImage(s.b, BOX.x, BOX.y, BOX.w, BOX.h);
        if (!tuck) arm(d, 6, -2, near, true);
        ctx.drawImage(s.h, BOX.x, BOX.y, BOX.w, BOX.h);
      } else {
        paintBack(d);
        arm(d, -6, -1, far, false);
        paintBody(d);
        if (!tuck) arm(d, 6, -2, near, true);
        paintHead(d);
      }
      eyeLids(d, mood, live ? t || 0 : 1);
    } finally { ctx.restore(); c = keep; }
  }

  const RARITY = [
    { name: "Común", color: "#5f9e6e", price: 400 },
    { name: "Raro", color: "#3b82f6", price: 800 },
    { name: "Épico", color: "#a855f7", price: 1500 },
    { name: "Legendario", color: "#f5a300", price: 3000 },
  ];
  const TALL = ["f_merlin", "f_lincoln", "f_pino", "f_medusa"];
  for (const d of L) { d.price = RARITY[d.rar].price; d.tall = TALL.includes(d.id); }
  window.ElsPanetsFamosos = { list: L, RARITY, draw };
})();
