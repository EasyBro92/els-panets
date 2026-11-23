// Zona Premium de la tienda (23/11/2026): los famosos de dominio público de famosos.js.
// Hoy se consiguen con los panets que se ganan jugando; más adelante podrán ser de pago.
// No dan ventajas al jugar: solo cambian el personaje.
(function () {
  "use strict";
  const EP = window.ElsPanets, UI = window.ElsPanetsUI;
  if (!EP || !EP.famosos) return;
  const API = (window.ElsPanetsPremium = window.ElsPanetsPremium || {});
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
  const nice = (n) => String(n || "").toLowerCase().replace(/(^|[\s])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/ De /g, " de ");
  let box = null, anim = 0;

  function stop() { clearInterval(anim); anim = 0; }

  function renderList() {
    stop();
    const all = EP.famosos(), R = EP.FAM_RARITY, have = all.filter((f) => f.own).length;
    let html = `<div class="prTop"><b>${have} de ${all.length}</b> famosos conseguidos<small>Consíguelos con los panets que ganas jugando. Solo cambian tu personaje: no dan ventaja.</small></div>`;
    for (let r = R.length - 1; r >= 0; r--) {
      html += `<div class="prGroup" style="--r:${R[r].color}">${"★".repeat(r + 1)} ${esc(R[r].name)}s</div><div class="prGrid">` +
        all.filter((f) => f.rar === r).map((f) => `<button type="button" class="prTile${f.own ? " own" : ""}" style="--r:${R[r].color}" data-f="${f.id}">
          <canvas width="150" height="150" data-i="${f.i}"></canvas><b>${esc(nice(f.name))}</b><small>${f.own ? "✓ Tuyo" : f.price}</small></button>`).join("") + "</div>";
    }
    box.innerHTML = html;
    box.scrollTop = 0;
    box.querySelectorAll("canvas[data-i]").forEach((cv) => EP.drawCharTo(cv, Number(cv.dataset.i)));
  }

  function renderDetail(id, msg) {
    stop();
    const f = EP.famosos().find((x) => x.id === id);
    if (!f) { renderList(); return; }
    const R = EP.FAM_RARITY[f.rar], left = f.price - EP.hucha(), cur = EP.current() === f.i;
    const action = f.own
      ? `<button type="button" class="bigBtn" id="prPick">${cur ? "✓ Es el que juega" : "Jugar con este"}</button>`
      : left > 0
        ? `<button type="button" class="bigBtn" disabled>Te faltan ${left} panets</button>`
        : `<button type="button" class="bigBtn prBuy" id="prBuy">Conseguir por ${f.price} panets</button>`;
    box.innerHTML = `<div class="prDetail" style="--r:${R.color}">
        <canvas id="prBig" width="300" height="320"></canvas>
        <b class="prName">${esc(nice(f.name))}</b>
        <span class="prRar">${"★".repeat(f.rar + 1)} ${esc(R.name)}</span>
        <p>${esc(f.story)}</p>
        ${msg ? `<p class="prOk">${esc(msg)}</p>` : ""}
        ${action}
        <button type="button" class="ghostBtn" id="prBack">Ver todos</button>
      </div>`;
    box.scrollTop = 0;
    const paint = () => { const cv = $("prBig"); if (cv) EP.drawCharTo(cv, f.i); else stop(); };
    paint();
    anim = setInterval(paint, 90);
    box.dataset.sel = id;
  }

  document.addEventListener("click", (e) => {
    if (!box || !box.contains(e.target)) return;
    const t = e.target.closest("button[data-f]");
    if (t) { EP.sfx("click"); renderDetail(t.dataset.f); return; }
    if (e.target.closest("#prBack")) { EP.sfx("click"); renderList(); return; }
    if (e.target.closest("#prBuy")) {
      const id = box.dataset.sel;
      if (EP.buyFamoso(id)) {
        EP.sfx("power");
        const f = EP.famosos().find((x) => x.id === id);
        EP.pickChar(f.i);
        $("boxCount").textContent = EP.hucha();
        renderDetail(id, "¡Ya es tuyo! Lo tienes elegido para jugar.");
      }
      return;
    }
    if (e.target.closest("#prPick")) {
      const f = EP.famosos().find((x) => x.id === box.dataset.sel);
      if (f) { EP.pickChar(f.i); EP.sfx("click"); stop(); $("boxOverlay").classList.add("hidden"); }
    }
  });
  $("boxClose").addEventListener("click", stop);

  API.render = (el) => { box = el; renderList(); };
  API.stop = stop;
  // desde la ficha de un personaje: abre la tienda justo en ese famoso
  API.openOne = (id) => { UI.openBox("premium"); renderDetail(id); };
})();
