// Pantalla de personajes de Els Panets (17/11/2026): todos en cuadrícula, grandes y fáciles
// de tocar. Al tocar uno se ve en grande con su historia, su objeto y su ropa.
// Usa lo que deja game.js en window.ElsPanets y las ventanas de extras.js.
(function () {
  "use strict";
  const EP = window.ElsPanets, UI = window.ElsPanetsUI;
  if (!EP || !EP.charList || !UI) return;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
  const ov = $("charsOverlay"), grid = $("charsGrid"), det = $("charDetail");
  let sel = 0, anim = 0;
  const nice = (n) => { n = String(n || ""); return n.length <= 2 ? n : n.charAt(0) + n.slice(1).toLowerCase(); };

  function renderGrid() {
    const list = EP.charList(), cur = EP.current();
    grid.innerHTML = list.map((c) => `<button type="button" class="chTile${c.i === sel ? " on" : ""}${c.i === cur ? " cur" : ""}${c.open ? "" : " locked"}" data-i="${c.i}">
        <canvas width="128" height="128" data-ch="${c.i}"></canvas><b>${esc(nice(c.name))}</b>${c.open ? "" : `<small>🔒 ${c.unlock}</small>`}</button>`).join("") +
      (EP.customFree() ? `<button type="button" class="chTile chNew" data-new="1"><div class="chPlus">+</div><b>Crea el tuyo</b></button>` : "");
    grid.querySelectorAll("canvas[data-ch]").forEach((cv) => EP.drawCharTo(cv, Number(cv.dataset.ch)));
  }
  function renderDetail() {
    const c = EP.charList()[sel];
    if (!c) { det.innerHTML = ""; return; }
    const cur = EP.current() === c.i;
    let html = `<div class="chTop"><canvas id="chBig" width="240" height="250"></canvas><div class="chInfo"><b>${esc(nice(c.name))}</b>
      <p>${esc(c.story)}</p>${c.power ? `<p class="chPow">${c.special ? '<canvas width="80" height="80" id="chSp"></canvas>' : ""}${esc(c.power)}</p>` : ""}
      ${c.ability ? `<p class="chAb">★ ${esc(c.ability)}</p>` : ""}<small>Bandera: ${esc(c.flag)}</small></div></div>`;
    if (!c.open) html += `<p class="chLock">🔒 Llega a <b>${c.unlock}</b> puntos para desbloquearlo</p>`;
    else if (c.outfits.length) {
      html += `<div class="chOutHead">Ropa · ${esc(c.outfits[c.outfit].name)}</div><div class="chOuts">` + c.outfits.map((o, k) => `<button type="button" class="chOut${k === c.outfit ? " on" : ""}${o.open ? "" : " locked"}" data-out="${k}">
        <canvas width="96" height="100" data-o="${k}"></canvas><small>${o.open ? esc(o.name) : "🔒 " + o.pts}</small></button>`).join("") + "</div>";
    }
    if (c.custom) html += `<button type="button" class="ghostBtn chEdit" id="chEdit">Cambiar mi personaje</button>`;
    html += c.open ? `<p class="chNote">${cur ? "✓ Es el que juega" : "Tócalo otra vez o pulsa «¡A jugar!»"}</p>` : "";
    det.innerHTML = html;
    det.querySelectorAll("canvas[data-o]").forEach((cv) => EP.drawCharTo(cv, c.i, Number(cv.dataset.o)));
    const sp = $("chSp"); if (sp) EP.drawFoodTo(sp, c.special);
    drawBig();
  }
  function drawBig() { const cv = $("chBig"); if (cv) EP.drawCharTo(cv, sel); }

  grid.addEventListener("click", (e) => {
    if (e.target.closest("[data-new]")) { close(); UI.openCreator(null); return; }
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    const i = Number(b.dataset.i);
    const again = i === sel;
    sel = i;
    if (EP.pickChar(i)) EP.sfx("click");
    if (again && EP.charList()[i].open) { close(); return; }
    renderGrid(); renderDetail();
  });
  det.addEventListener("click", (e) => {
    if (e.target.closest("#chEdit")) { close(); UI.openCreator(EP.customData()); return; }
    const o = e.target.closest("button[data-out]");
    if (o && EP.pickOutfit(sel, Number(o.dataset.out))) { EP.sfx("click"); renderGrid(); renderDetail(); }
  });
  function open() {
    sel = EP.current();
    renderGrid(); renderDetail();
    ov.classList.remove("hidden");
    clearInterval(anim);
    anim = setInterval(drawBig, 80);
    const on = grid.querySelector(".chTile.on");
    if (on) grid.scrollTop = Math.max(0, on.offsetTop - grid.offsetTop - 40);
  }
  function close() { ov.classList.add("hidden"); clearInterval(anim); }
  $("charsClose").addEventListener("click", close);
  UI.openChars = open;
})();
