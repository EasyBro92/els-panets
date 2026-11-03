// Ventanas de Els Panets (03/11/2026): crear tu personaje y el panel del admin.
// Usa lo que deja game.js en window.ElsPanets y la conexión de window.TacoLeaderboard.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const EP = window.ElsPanets;
  const lb = () => window.TacoLeaderboard;
  const overlays = ["creatorOverlay", "adminLoginOverlay", "adminOverlay"].map($);
  const show = (el) => el.classList.remove("hidden");
  const hide = (el) => el.classList.add("hidden");
  const esc = (s) => String(s == null ? "" : s).replace(/[<>&"']/g, "");
  // que tocar o escribir en las ventanas no mueva el juego de detrás
  for (const el of overlays) {
    el.addEventListener("pointerdown", (e) => e.stopPropagation());
    el.addEventListener("keydown", (e) => e.stopPropagation());
  }

  // ---------- Crear tu personaje ----------
  const C = EP.CREATOR;
  const rowsEl = $("creatorRows"), nameEl = $("creatorName"), msgEl = $("creatorMsg"), sendBtn = $("creatorSend"), preview = $("creatorPreview");
  let sel = null, anim = 0;
  const swatch = (c) => `<span class="swatch" style="background:${c}"></span>`;
  // cada fila: etiqueta, cuántas opciones hay y cómo se enseña la elegida
  const ROWS = [
    ["sexo", "Es", () => C.sexo.length, (i) => C.sexo[i][1]],
    ["piel", "Piel", () => C.piel.length, (i) => swatch(C.piel[i][0])],
    ["peinado", "Peinado", () => (sel.sexo === 1 ? C.peinadoChica : C.peinadoChico).length, (i) => (sel.sexo === 1 ? C.peinadoChica : C.peinadoChico)[i][1]],
    ["pelo", "Pelo", () => C.pelo.length, (i) => swatch(C.pelo[i][0])],
    ["ojos", "Ojos", () => C.ojos.length, (i) => swatch(C.ojos[i][0]) + C.ojos[i][1]],
    ["barba", "Barba", () => C.barba.length, (i) => C.barba[i][1], () => sel.sexo !== 1],
    ["ropa", "Ropa", () => C.ropa.length, (i) => C.ropa[i][1]],
    ["color", "Color", () => C.color.length, (i) => swatch(C.color[i])],
    ["pantalon", "Pantalón", () => C.pantalon.length, (i) => swatch(C.pantalon[i])],
    ["extra", "Extra", () => C.extra.length, (i) => C.extra[i][1]],
    ["bandera", "Bandera", () => C.bandera.length, (i) => EP.flagImg(C.bandera[i][0]) + C.bandera[i][1]],
  ];
  function renderRows() {
    rowsEl.innerHTML = ROWS.filter((r) => !r[4] || r[4]()).map((r) => {
      const n = r[2](); sel[r[0]] = ((sel[r[0]] % n) + n) % n;
      return `<div class="cRow"><span class="cLabel">${r[1]}</span><button type="button" data-k="${r[0]}" data-d="-1">‹</button><span class="cVal">${r[3](sel[r[0]])}</span><button type="button" data-k="${r[0]}" data-d="1">›</button></div>`;
    }).join("");
  }
  rowsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    sel[b.dataset.k] += Number(b.dataset.d);
    if (b.dataset.k === "sexo") sel.peinado = 0;
    renderRows();
  });
  const drawPreview = () => { if (sel) EP.drawLookTo(preview, EP.buildLook(sel), 2.1); };
  function openCreator(current) {
    sel = (current && current.look && current.look._sel) ? Object.assign({}, current.look._sel)
      : { sexo: 0, piel: 1, peinado: 0, pelo: 0, ojos: 1, barba: 0, ropa: 0, color: 0, pantalon: 0, extra: 0, bandera: 0 };
    nameEl.value = current && current.name ? current.name : "";
    msgEl.textContent = "";
    sendBtn.disabled = false;
    renderRows();
    show($("creatorOverlay"));
    clearInterval(anim);
    anim = setInterval(drawPreview, 50);
    drawPreview();
  }
  function closeCreator() { hide($("creatorOverlay")); clearInterval(anim); }
  $("creatorCancel").addEventListener("click", closeCreator);
  sendBtn.addEventListener("click", async () => {
    const name = nameEl.value.trim().slice(0, 12);
    if (!name) { msgEl.textContent = "Ponle un nombre"; return; }
    if (!lb() || !lb().submitCharacter) { msgEl.textContent = "Sin conexión, prueba otra vez"; return; }
    const look = Object.assign(EP.buildLook(sel), { _sel: Object.assign({}, sel) });
    sendBtn.disabled = true; msgEl.textContent = "Enviando…";
    try {
      await lb().submitCharacter(name, look);
      EP.setCustom({ estado: "pendiente", name, look, decidido: 0 });
      closeCreator();
    } catch (e) {
      msgEl.textContent = "No se pudo enviar. Revisa la conexión.";
      sendBtn.disabled = false;
    }
  });

  // ---------- Entrada del admin ----------
  const pinEl = $("adminPin"), loginMsg = $("adminLoginMsg");
  function openAdmin() {
    if (lb() && lb().isAdmin()) { openPanel(); return; }
    pinEl.value = ""; loginMsg.textContent = "";
    show($("adminLoginOverlay"));
    setTimeout(() => pinEl.focus(), 50);
  }
  async function tryLogin() {
    if (!lb()) { loginMsg.textContent = "Sin conexión"; return; }
    loginMsg.textContent = "Comprobando…";
    const ok = await lb().adminLogin(pinEl.value);
    if (!ok) { loginMsg.textContent = "Código incorrecto"; return; }
    hide($("adminLoginOverlay"));
    openPanel();
  }
  $("adminLoginBtn").addEventListener("click", tryLogin);
  pinEl.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  $("adminLoginClose").addEventListener("click", () => hide($("adminLoginOverlay")));

  // ---------- Panel del admin ----------
  const body = $("adminBody"), tabs = $("adminTabs");
  let tab = "tiempo", charTimer = 0;
  const fmt = (s) => {
    s = Math.round(s || 0);
    if (s < 60) return s + " s";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? h + " h " + String(m).padStart(2, "0") + " min" : m + " min";
  };
  const ago = (ts) => {
    if (!ts) return "—";
    const ms = Date.now() - (ts.toMillis ? ts.toMillis() : ts);
    const m = Math.floor(ms / 60000);
    if (m < 2) return "ahora mismo";
    if (m < 60) return "hace " + m + " min";
    const h = Math.floor(m / 60);
    if (h < 24) return "hace " + h + " h";
    return "hace " + Math.floor(h / 24) + " días";
  };
  const dayKey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  function openPanel() {
    show($("adminOverlay"));
    setTab(tab);
  }
  function setTab(t) {
    tab = t;
    for (const b of tabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.tab === t);
    clearInterval(charTimer);
    if (t === "tiempo") loadTime();
    else if (t === "personajes") loadChars();
    else loadSettings();
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) setTab(b.dataset.tab); });
  $("adminClose").addEventListener("click", () => { hide($("adminOverlay")); clearInterval(charTimer); });
  $("adminLogout").addEventListener("click", () => { if (lb()) lb().adminLogout(); hide($("adminOverlay")); clearInterval(charTimer); });
  const loading = () => { body.innerHTML = '<div class="aEmpty">Cargando…</div>'; };
  const failed = () => { body.innerHTML = '<div class="aEmpty">No se pudo cargar. Revisa la conexión.</div>'; };

  // tiempo de pantalla de cada jugador
  async function loadTime() {
    loading();
    let rows;
    try { rows = await lb().adminList("elsPanetsJugadores"); } catch (e) { failed(); return; }
    if (tab !== "tiempo") return;
    if (!rows.length) { body.innerHTML = '<div class="aEmpty">Aún no hay datos. Se cuentan desde esta versión.</div>'; return; }
    const now = new Date(), hoy = dayKey(now), week = [];
    for (let i = 0; i < 7; i++) week.push(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
    rows.sort((a, b) => ((b.ultima && b.ultima.toMillis()) || 0) - ((a.ultima && a.ultima.toMillis()) || 0));
    body.innerHTML = rows.map((r) => {
      const d = r.dias || {};
      const w = week.reduce((s, k) => s + (d[k] || 0), 0);
      return `<div class="aRow"><div class="aTop">${EP.flagImg(r.flag)}<span class="aName">${esc(r.name || "Sin nombre")}</span></div>
        <div class="aSub">Última vez: ${ago(r.ultima)}</div>
        <div class="aNums"><div><b>${fmt(d[hoy])}</b><span>hoy</span></div><div><b>${fmt(w)}</b><span>7 días</span></div><div><b>${fmt(r.total)}</b><span>total</span></div></div></div>`;
    }).join("") + '<div class="aEmpty">Cuenta el tiempo con el juego abierto y a la vista.</div>';
  }

  // personajes que esperan aprobación (y los ya decididos)
  async function loadChars() {
    loading();
    let rows;
    try { rows = await lb().adminList("elsPanetsPersonajes"); } catch (e) { failed(); return; }
    if (tab !== "personajes") return;
    const order = { pendiente: 0, aprobado: 1, denegado: 2 };
    rows = rows.filter((r) => r.estado !== "denegado" || (r.decidido && Date.now() - r.decidido.toMillis() < 24 * 3600 * 1000));
    rows.sort((a, b) => (order[a.estado] || 0) - (order[b.estado] || 0));
    if (!rows.length) { body.innerHTML = '<div class="aEmpty">Nadie ha creado personaje todavía.</div>'; return; }
    const label = { pendiente: "Esperando tu decisión", aprobado: "Aprobado", denegado: "Denegado" };
    body.innerHTML = rows.map((r, i) => `<div class="aRow aChar">${r.look ? `<canvas width="144" height="150" data-i="${i}"></canvas>` : ""}
      <div style="flex:1"><div class="aTop"><span class="aName">${esc(r.name || "(borrado)")}</span>${r.look ? EP.flagImg(r.look.flag) : ""}</div>
      <div class="aSub">${label[r.estado] || r.estado}</div>
      <div class="aBtns">${r.estado !== "aprobado" && r.look ? `<button class="aYes" data-id="${esc(r.id)}" data-ok="1">Aprobar</button>` : ""}${r.estado !== "denegado" ? `<button class="aNo" data-id="${esc(r.id)}" data-ok="0">Denegar</button>` : ""}</div></div></div>`).join("");
    const cvs = body.querySelectorAll("canvas[data-i]");
    const paint = () => cvs.forEach((cv) => EP.drawLookTo(cv, rows[Number(cv.dataset.i)].look, 2.1));
    paint();
    charTimer = setInterval(paint, 80);
  }
  body.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-id]");
    if (b) {
      const ok = b.dataset.ok === "1";
      if (!ok && !confirm("¿Denegar este personaje? Se borrará y podrá crear otro en 24 h.")) return;
      b.disabled = true; b.textContent = "…";
      try { await lb().adminDecide(b.dataset.id, ok); } catch (err) { alert("No se pudo guardar. Revisa la conexión."); }
      clearInterval(charTimer);
      loadChars();
      return;
    }
    const t = e.target.closest("button[data-set]");
    if (t) {
      const k = t.dataset.set, cfg = lb().getConfig() || {};
      t.disabled = true;
      try { await lb().adminSetConfig({ [k]: !cfg[k] }); } catch (err) { alert("No se pudo guardar. Revisa la conexión."); }
      loadSettings();
    }
  });

  // ajustes: lo que está apagado hasta que el admin lo enciende
  const SETTINGS = [
    ["banderaRanking", "Bandera junto al nombre en el ranking"],
    ["rankingPaises", "Ranking por países"],
    ["sombra", "Sombra de tu mejor partida"],
  ];
  async function loadSettings() {
    loading();
    const cfg = await lb().loadConfig();
    if (tab !== "ajustes") return;
    body.innerHTML = SETTINGS.map(([k, txt]) => `<div class="aRow aToggle"><span>${txt}</span><button type="button" data-set="${k}" class="${cfg[k] ? "on" : ""}">${cfg[k] ? "Activado" : "Apagado"}</button></div>`).join("") +
      '<div class="aEmpty">Se aplica a todos los jugadores la próxima vez que abran el juego o vuelvan al inicio.</div>';
  }

  // botón ADMIN arriba en el inicio, solo en el móvil del admin
  setInterval(() => { $("adminBtn").classList.toggle("hidden", !(lb() && lb().isAdmin())); }, 1000);
  $("adminBtn").addEventListener("pointerdown", (e) => e.stopPropagation());
  $("adminBtn").addEventListener("click", (e) => { e.stopPropagation(); openPanel(); });

  window.ElsPanetsUI = {
    openCreator, openAdmin,
    isOpen: () => overlays.some((el) => !el.classList.contains("hidden")),
  };
})();
