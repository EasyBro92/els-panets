// Ventanas de Els Panets: crear tu personaje, panel del admin, caja sorpresa,
// premio diario y ajustes (16/11/2026).
// Usa lo que deja game.js en window.ElsPanets y la conexión de window.TacoLeaderboard.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const EP = window.ElsPanets;
  const lb = () => window.TacoLeaderboard;
  const overlays = ["creatorOverlay", "adminLoginOverlay", "adminOverlay", "boxOverlay", "dailyOverlay", "settingsOverlay", "progOverlay", "charsOverlay", "storyOverlay", "taleBox", "retosOverlay", "rtAccept", "rtShare", "rtTurn", "liveOverlay"].map($);
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
  // 12/11/2026: primero el tipo (persona o un animal); los animales y algunos gorros
  // y colores se desbloquean con el récord
  const human = () => !sel.tipo, animal = () => sel.tipo > 0;
  const ROWS = [
    ["tipo", "Tipo", () => C.tipo.length, (i) => C.tipo[i][1]],
    ["sexo", "Es", () => C.sexo.length, (i) => C.sexo[i][1], human],
    ["piel", "Piel", () => C.piel.length, (i) => swatch(C.piel[i][0]), human],
    ["peinado", "Peinado", () => (sel.sexo === 1 ? C.peinadoChica : C.peinadoChico).length, (i) => (sel.sexo === 1 ? C.peinadoChica : C.peinadoChico)[i][1], human],
    ["pelo", "Pelo", () => C.pelo.length, (i) => swatch(C.pelo[i][0]), human],
    ["ojos", "Ojos", () => C.ojos.length, (i) => swatch(C.ojos[i][0]) + C.ojos[i][1], human],
    ["barba", "Barba", () => C.barba.length, (i) => C.barba[i][1], () => human() && sel.sexo !== 1],
    ["ropa", "Ropa", () => C.ropa.length, (i) => C.ropa[i][1], human],
    ["color", "Color", () => C.color.length, (i) => swatch(C.color[i]), human],
    ["pantalon", "Pantalón", () => C.pantalon.length, (i) => swatch(C.pantalon[i]), human],
    ["pelaje", "Color", () => C.pelajes(sel.tipo).length, (i) => swatch(C.pelajes(sel.tipo)[i][0]) + C.pelajes(sel.tipo)[i][2], animal],
    ["extra", "Extra", () => C.extra.length, (i) => C.extra[i][1]],
    ["bandera", "Bandera", () => C.bandera.length, (i) => EP.flagImg(C.bandera[i][0]) + esc(C.bandera[i][1])],
  ];
  let lockedNow = null;
  function renderRows() {
    lockedNow = null;
    rowsEl.innerHTML = ROWS.filter((r) => !r[4] || r[4]()).map((r) => {
      const n = r[2](); sel[r[0]] = ((sel[r[0]] % n) + n) % n;
      const need = C.lockOf(r[0], sel[r[0]]), locked = need > C.best();
      if (locked && (!lockedNow || need > lockedNow.need)) lockedNow = { need, what: r[0] === "tipo" ? C.tipo[sel.tipo][1] : r[0] === "pelo" ? "ese color de pelo" : C.extra[sel.extra][1] };
      const tag = need ? `<span class="lockTag${locked ? "" : " open"}">${locked ? "🔒 " + need : "✓"}</span>` : "";
      const flag = r[0] === "bandera";
      return `<div class="cRow${locked ? " locked" : ""}${flag ? " wide" : ""}"><span class="cLabel">${r[1]}</span><button type="button" data-k="${r[0]}" data-d="-1">‹</button><span class="cVal"${flag ? ' data-find="1"' : ""}>${r[3](sel[r[0]])}${tag}</span><button type="button" data-k="${r[0]}" data-d="1">›</button>${flag ? '<button type="button" class="cFind" data-find="1">🔍 Buscar</button>' : ""}</div>`;
    }).join("");
    if (lockedNow) { msgEl.textContent = "Para usar «" + lockedNow.what + "» necesitas un récord de " + lockedNow.need + " (tienes " + C.best() + ")."; sendBtn.disabled = true; }
    else if (/récord de/.test(msgEl.textContent)) { msgEl.textContent = ""; sendBtn.disabled = false; }
  }
  rowsEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-find]")) { openFlagPick(); return; }
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    sel[b.dataset.k] += Number(b.dataset.d);
    if (b.dataset.k === "sexo") sel.peinado = 0;
    if (b.dataset.k === "tipo") sel.pelaje = 0;
    renderRows();
  });
  // buscador de banderas: todas las del mundo, se busca sin importar tildes
  const pickEl = $("flagPick"), findEl = $("flagSearch"), flagList = $("flagList");
  const norm = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let flagListBuilt = false;
  function openFlagPick() {
    if (!flagListBuilt || flagListBuilt !== EP.flagsReady()) {
      flagList.innerHTML = C.bandera.map((b, i) => `<button type="button" data-i="${i}" data-n="${esc(norm(b[1] + " " + b[0]))}">${EP.flagImg(b[0])}<span>${esc(b[1])}</span></button>`).join("") +
        '<div id="flagNone" class="aEmpty hidden">No hay ningún país con ese nombre</div>';
      flagListBuilt = EP.flagsReady() || "pronto";
    }
    findEl.value = "";
    filterFlags();
    for (const b of flagList.querySelectorAll("button[data-i]")) b.classList.toggle("on", Number(b.dataset.i) === sel.bandera);
    pickEl.classList.remove("hidden");
    const on = flagList.querySelector("button.on");
    flagList.scrollTop = on ? Math.max(0, on.offsetTop - flagList.offsetTop - 60) : 0;
    setTimeout(() => findEl.focus(), 60);
  }
  function filterFlags() {
    const q = norm(findEl.value.trim());
    let shown = 0;
    for (const b of flagList.querySelectorAll("button[data-i]")) { const ok = !q || b.dataset.n.includes(q); b.style.display = ok ? "" : "none"; if (ok) shown++; }
    const none = $("flagNone"); if (none) none.classList.toggle("hidden", shown > 0);
    if (q) flagList.scrollTop = 0;
  }
  function chooseFlag(i) { sel.bandera = i; pickEl.classList.add("hidden"); renderRows(); }
  findEl.addEventListener("input", filterFlags);
  findEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const first = [...flagList.querySelectorAll("button[data-i]")].find((b) => b.style.display !== "none");
    if (first) chooseFlag(Number(first.dataset.i));
  });
  flagList.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) chooseFlag(Number(b.dataset.i)); });
  $("flagPickClose").addEventListener("click", () => pickEl.classList.add("hidden"));

  const drawPreview = () => { if (sel) EP.drawLookTo(preview, EP.buildLook(sel), 2.1); };
  function openCreator(current) {
    sel = Object.assign({ tipo: 0, sexo: 0, piel: 1, peinado: 0, pelo: 0, ojos: 1, barba: 0, ropa: 0, color: 0, pantalon: 0, pelaje: 0, extra: 0, bandera: 0 },
      current && current.look && current.look._sel ? current.look._sel : {});
    nameEl.value = current && current.name ? current.name : "";
    msgEl.textContent = "";
    sendBtn.disabled = false;
    renderRows();
    show($("creatorOverlay"));
    clearInterval(anim);
    anim = setInterval(drawPreview, 50);
    drawPreview();
  }
  function closeCreator() { hide($("creatorOverlay")); pickEl.classList.add("hidden"); clearInterval(anim); }
  $("creatorCancel").addEventListener("click", closeCreator);
  // se guarda en el móvil al momento y queda elegido para jugar
  sendBtn.addEventListener("click", () => {
    const name = nameEl.value.trim().slice(0, 12);
    if (!name) { msgEl.textContent = "Ponle un nombre"; return; }
    if (EP.nameProblem(name)) { msgEl.textContent = EP.nameProblem(name); return; }
    if (lockedNow) return;
    const look = Object.assign(EP.buildLook(sel), { _sel: Object.assign({}, sel) });
    EP.setCustom({ estado: "aprobado", name, look, decidido: 0 }, true);
    EP.sfx("record");
    closeCreator();
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
  let tab = "tiempo";
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
    if (t === "tiempo") loadTime();
    else loadSettings();
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) setTab(b.dataset.tab); });
  $("adminClose").addEventListener("click", () => hide($("adminOverlay")));
  $("adminLogout").addEventListener("click", () => { if (lb()) lb().adminLogout(); hide($("adminOverlay")); });
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
    }).join("") + '<div class="aEmpty">Cuenta el tiempo con el juego abierto y a la vista. Los días se guardan 30 días.</div>';
  }

  body.addEventListener("click", async (e) => {
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
    const cfg = await lb().loadConfig(true);
    if (tab !== "ajustes") return;
    body.innerHTML = SETTINGS.map(([k, txt]) => `<div class="aRow aToggle"><span>${txt}</span><button type="button" data-set="${k}" class="${cfg[k] ? "on" : ""}">${cfg[k] ? "Activado" : "Apagado"}</button></div>`).join("") +
      '<div class="aEmpty">Se aplica a todos los jugadores la próxima vez que abran el juego (tarda hasta 10 minutos).</div>';
  }

  // botón ADMIN arriba en el inicio, solo en el móvil del admin
  setInterval(() => { $("adminBtn").classList.toggle("hidden", !(lb() && lb().isAdmin())); }, 1000);
  $("adminBtn").addEventListener("pointerdown", (e) => e.stopPropagation());
  $("adminBtn").addEventListener("click", (e) => { e.stopPropagation(); openPanel(); });

  // ---------- Caja sorpresa (12/11/2026) ----------
  // Ruleta que se para poco a poco en el premio. Lo nuevo se pone solo.
  const reel = $("boxReel"), boxMsg = $("boxMsg"), boxOpenBtn = $("boxOpen"), boxItems = $("boxItems"), boxTabs = $("boxTabs");
  const TILE = 70;
  let boxTab = "estela", spinning = false, boxAnim = 0;
  const rarityOf = (id) => EP.RARITY[(EP.PRIZES.find((p) => p.id === id) || {}).rar || 0];
  const prizeName = (id) => (EP.PRIZES.find((p) => p.id === id) || {}).name || "";
  function tileHTML(id, extra) {
    const r = rarityOf(id);
    return `<div class="bTile ${extra || ""}" style="border-color:${r.color}"><canvas width="112" height="112" data-p="${id}"></canvas></div>`;
  }
  function paintPrizes(root) { root.querySelectorAll("canvas[data-p]").forEach((cv) => EP.drawPrizeTo(cv, cv.dataset.p)); }
  // 16/11/2026: probabilidades a la vista, contador del premio seguro y final de la colección
  function refreshOdds() {
    const done = EP.boxComplete();
    $("boxStrip").classList.toggle("hidden", done);
    boxOpenBtn.classList.toggle("hidden", done);
    $("boxOdds").classList.toggle("hidden", done);
    $("boxSure").classList.toggle("hidden", done);
    if (done) {
      boxMsg.innerHTML = "<b>¡Colección completa!</b> Ya tienes todos los premios de la caja. Tus panets se siguen guardando para los premios nuevos que lleguen.";
      return;
    }
    $("boxOdds").innerHTML = "<span>Próxima caja:</span>" + EP.boxOdds().map((o) => {
      const r = EP.RARITY[o.rar];
      return `<span class="odd${o.pct ? "" : " off"}" style="border-color:${r.color}">${r.name} <b>${Math.round(o.pct)} %</b></span>`;
    }).join("");
    const n = EP.boxSureIn();
    $("boxSure").textContent = !n ? "Ya tienes todos los premios raros y épicos."
      : n === 1 ? "¡La próxima caja trae un premio raro o épico seguro!"
      : "Premio raro o épico seguro en " + n + " cajas como mucho.";
  }
  function refreshBox() {
    $("boxCount").textContent = EP.hucha();
    boxOpenBtn.textContent = "Abrir caja · " + EP.BOX_COST;
    boxOpenBtn.disabled = spinning || EP.hucha() < EP.BOX_COST;
    if (!spinning) refreshOdds();
    for (const b of boxTabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.tab === boxTab);
    const own = EP.owned(), wearing = EP.wear()[boxTab] || null;
    const list = EP.PRIZES.filter((p) => p.kind === boxTab);
    boxItems.innerHTML = `<button type="button" class="bItem${!wearing ? " on" : ""}" data-w=""><div class="bNone">Nada</div><span>Sin ${boxTab === "estela" ? "estela" : "gorro"}</span></button>` +
      list.map((p) => {
        const has = !!own[p.id], r = EP.RARITY[p.rar];
        return `<button type="button" class="bItem${has ? "" : " off"}${wearing === p.id ? " on" : ""}" data-w="${has ? p.id : ""}" ${has ? "" : "disabled"} style="border-color:${r.color}">
          <canvas width="112" height="112" data-p="${p.id}"></canvas><span>${has ? esc(p.name) : p.rar === 3 ? "7 días de racha" : "?"}</span></button>`;
      }).join("");
    paintPrizes(boxItems);
  }
  // ---------- Tienda de mejoras (17/11/2026): en la misma ventana que la caja ----------
  const POWER_NAMES = { iman: "Imán", doble: "Puntos x2", mini: "Mini", paraguas: "Paraguas", lenta: "Cámara lenta", lluvia: "Lluvia de panets", escudo: "Escudo", corazon: "Vida extra" };
  const START_TXT = { escudo: "Te salva de un choque", iman: "Atrae la comida", doble: "Puntos dobles al empezar", corazon: "Una vida de más" };
  let shopTab = "caja";
  function setShop(t) {
    shopTab = t;
    for (const b of $("shopTabs").querySelectorAll("button")) b.classList.toggle("on", b.dataset.shop === t);
    for (const id of ["boxStrip", "boxMsg", "boxOpen", "boxOdds", "boxSure", "boxTabs", "boxItems"]) $(id).classList.toggle("shopHide", t !== "caja");
    $("shopBody").classList.toggle("hidden", t !== "mejoras");
    if (t === "mejoras") renderShop(); else refreshBox();
  }
  function renderShop() {
    $("boxCount").textContent = EP.hucha();
    const up = EP.upgrades(), C = EP.UPGRADE_COSTS, P = EP.POWERS, pick = EP.startPower();
    const rows = EP.UPGRADABLE.map((k) => {
      const lv = up[k] || 0, max = lv >= C.length, cost = C[lv];
      const dots = C.map((_, i) => `<i class="${i < lv ? "on" : ""}"></i>`).join("");
      return `<div class="upRow"><canvas width="80" height="80" data-pw="${k}"></canvas><div class="upTxt"><b>${POWER_NAMES[k]}</b>
        <small>Dura ${P[k].time + lv} s${max ? "" : " → " + (P[k].time + lv + 1) + " s"}</small><div class="upDots">${dots}</div></div>
        ${max ? '<span class="upMax">Al máximo</span>' : `<button type="button" class="upBuy" data-up="${k}" ${EP.hucha() < cost ? "disabled" : ""}>Mejorar · ${cost}</button>`}</div>`;
    }).join("");
    const starts = Object.keys(EP.START_COSTS).map((k) => {
      const cost = EP.START_COSTS[k], mine = pick === k;
      return `<button type="button" class="stBuy${mine ? " on" : ""}" data-st="${k}" ${pick || EP.hucha() < cost ? "disabled" : ""}>
        <canvas width="80" height="80" data-pw="${k}"></canvas><b>${POWER_NAMES[k]}</b><small>${mine ? "Preparado" : START_TXT[k]}</small><span>${mine ? "✓" : cost}</span></button>`;
    }).join("");
    $("shopBody").innerHTML = '<div class="mHead">Mejora tus poderes <small>· cada nivel, 1 segundo más</small></div>' + rows +
      '<div class="mHead">Para tu próxima partida <small>· se gasta al empezar</small></div><div class="stGrid">' + starts + "</div>" +
      (pick ? '<p class="boxMsg">Ya tienes un poder preparado para la próxima partida.</p>' : "");
    $("shopBody").querySelectorAll("canvas[data-pw]").forEach((cv) => EP.drawPowerTo(cv, cv.dataset.pw));
  }
  $("shopTabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-shop]"); if (b && !spinning) setShop(b.dataset.shop); });
  $("shopBody").addEventListener("click", (e) => {
    const u = e.target.closest("button[data-up]");
    if (u && EP.buyUpgrade(u.dataset.up)) { EP.sfx("power"); renderShop(); return; }
    const st = e.target.closest("button[data-st]");
    if (st && EP.buyStartPower(st.dataset.st)) { EP.sfx("power"); renderShop(); }
  });

  function openBox(which) {
    spinning = false;
    reel.style.transition = "none"; reel.style.transform = "translateX(0)";
    const ids = []; for (let i = 0; i < 8; i++) ids.push(EP.randomPrize().id);
    reel.innerHTML = ids.map((id) => tileHTML(id)).join("");
    paintPrizes(reel);
    boxMsg.textContent = "Cada caja cuesta " + EP.BOX_COST + " panets y nunca trae un premio repetido. Las empanadillas que comes van a la hucha.";
    $("boxPanet").src = EP.foodImg();
    refreshBox();
    setShop(which === "mejoras" ? "mejoras" : "caja");
    show($("boxOverlay"));
    clearInterval(boxAnim);
  }
  boxOpenBtn.addEventListener("click", () => {
    if (spinning) return;
    const res = EP.rollBox();
    if (!res) { refreshBox(); return; }
    spinning = true;
    const N = 44, WIN = 38, ids = [];
    for (let i = 0; i < N; i++) ids.push(i === WIN ? res.id : EP.randomPrize().id);
    reel.style.transition = "none"; reel.style.transform = "translateX(0)";
    reel.innerHTML = ids.map((id, i) => tileHTML(id, i === WIN ? "win" : "")).join("");
    paintPrizes(reel);
    $("boxCount").textContent = EP.hucha();
    boxOpenBtn.disabled = true;
    boxMsg.textContent = "Girando…";
    const w = reel.parentElement.clientWidth, jitter = (Math.random() - 0.5) * 40;
    void reel.offsetWidth;
    reel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.72, 0.1, 1)";
    reel.style.transform = "translateX(" + (w / 2 - (WIN * TILE + TILE / 2) + jitter) + "px)";
    setTimeout(() => {
      spinning = false;
      const r = rarityOf(res.id);
      reel.children[WIN] && reel.children[WIN].classList.add("got");
      boxMsg.innerHTML = "¡Te ha tocado <b style=\"color:" + r.color + "\">" + esc(prizeName(res.id)) + "</b> (" + r.name + ")! Ya lo llevas puesto.";
      EP.sfx("record");
      const k = EP.PRIZES.find((p) => p.id === res.id);
      if (k) boxTab = k.kind;
      refreshBox();
    }, 4300);
  });
  boxTabs.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) { boxTab = b.dataset.tab; refreshBox(); } });
  boxItems.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-w]");
    if (!b || b.disabled) return;
    EP.setWear(boxTab, b.dataset.w || null);
    EP.sfx("click");
    refreshBox();
  });
  $("boxClose").addEventListener("click", () => { if (!spinning) hide($("boxOverlay")); });

  // ---------- Premio diario ----------
  const dailyBtn = $("dailyTake"), dailyMsg = $("dailyMsg");
  let dailyDone = false;
  function openDaily() {
    const st = EP.dailyState();
    dailyDone = st.claimed;
    $("dailySub").textContent = st.lost ? "Perdiste la racha de " + st.lost + " días. ¡Empiezas de nuevo!" : "Racha: " + st.streak + (st.streak === 1 ? " día" : " días");
    $("dailyDays").innerHTML = EP.DAILY.map((n, i) => {
      const cls = i < st.idx || (st.claimed && i === st.idx) ? "past" : i === st.idx ? "today" : "";
      return `<div class="dDay ${cls}"><small>Día ${i + 1}</small>${i === 6 ? '<canvas width="80" height="80" data-p="g_corona"></canvas>' : '<img alt="" src="' + EP.foodImg() + '">'}<b>+${n}</b></div>`;
    }).join("");
    paintPrizes($("dailyDays"));
    dailyMsg.textContent = st.idx === 6 ? "¡Hoy toca la corona de la racha!" : "Vuelve cada día: el premio crece y el día 7 te llevas la corona.";
    dailyBtn.textContent = st.claimed ? "Cerrar" : "¡Cógelo!";
    show($("dailyOverlay"));
  }
  dailyBtn.addEventListener("click", () => {
    if (dailyDone) { hide($("dailyOverlay")); return; }
    const r = EP.claimDaily();
    dailyDone = true;
    if (r) {
      dailyMsg.textContent = "+" + r.n + " panets a tu hucha" + (r.item ? " y la corona de la racha. ¡Ya la llevas puesta!" : ".");
      EP.sfx("record");
      const d = $("dailyDays").children[r.idx]; if (d) { d.classList.remove("today"); d.classList.add("past"); }
    }
    dailyBtn.textContent = "Cerrar";
  });

  // ---------- Ajustes (16/11/2026) ----------
  const setMain = $("setMain"), setPage = $("setPage"), setBack = $("setBack"), setTitle = $("setTitle");
  const setNameEl = $("setName"), setNameMsg = $("setNameMsg");
  const PAGES = {
    privacidad: ["Privacidad", `
      <p>Els Panets <b>no pide</b> tu correo, tu teléfono ni tu ubicación. No tiene anuncios ni compras.</p>
      <h4>Lo que se guarda en tu móvil</h4>
      <p>Tu récord, tu hucha, tus premios, tu personaje y tus ajustes.</p>
      <h4>Lo que se guarda en internet</h4>
      <p><b>Para el ranking:</b> el nombre que escribes, tu récord, las empanadillas de esa partida y la bandera de tu personaje. Lo puede ver todo el mundo.</p>
      <p><b>Para el reto del día:</b> ese nombre, tu mejor marca del día, su bandera y el recorrido que hiciste (para que otros vuelen junto a tu fantasma).</p>
      <p><b>Si retas a un amigo:</b> tu nombre, tu puntuación y el recorrido de esa partida, para quien tenga el código.</p>
      <p><b>Si juegas en directo:</b> mientras estás en la sala, tu nombre, tu personaje, su bandera, tu altura y tus puntos, para quien tenga el código. Se borra al salir (y si no, al día siguiente).</p>
      <p><b>Para saber cuánto se juega:</b> ese nombre, tu personaje, su bandera y los minutos que el juego está abierto (el total y los de cada día de los últimos 30 días). Solo lo ve el administrador del juego.</p>
      <p><b>Una llave secreta al azar,</b> para que nadie pueda cambiar tu récord ni tu nombre. No dice quién eres.</p>
      <p>Se guarda en Firebase, un servicio de Google.</p>
      <h4>Borrarlo</h4>
      <p>Con «Borrar mis datos», en Ajustes, se borra todo lo de este móvil y lo de internet.</p>`],
    creditos: ["Créditos", `
      <h4>Letra</h4>
      <p>Lilita One, de Juan Montoreano. Licencia SIL Open Font License 1.1 (OFL).</p>
      <h4>Banderas</h4>
      <p>Twemoji, © Twitter, Inc. y otros colaboradores. Licencia CC-BY 4.0: creativecommons.org/licenses/by/4.0</p>
      <h4>Música y sonidos</h4>
      <p>Hechos para este juego.</p>
      <h4>Dibujos y programación</h4>
      <p>Hechos para este juego.</p>`],
    borrar: ["Borrar mis datos", `
      <p>Se borrará <b>todo</b>: tu récord, tu nombre en el ranking, tu hucha, tus premios, tu personaje y tus ajustes, en este móvil y en internet.</p>
      <p><b>No se puede deshacer.</b></p>
      <p id="eraseMsg" class="formMsg"></p>
      <button id="eraseYes" class="bigBtn dangerBtn" type="button">Sí, borrar todo</button>`],
  };
  function paintSettings() {
    const s = EP.settings();
    const vals = { musica: s.musica, efectos: s.efectos, vibracion: s.vibracion, destellos: s.destellos };
    for (const b of setMain.querySelectorAll("button[data-set]")) {
      const k = b.dataset.set;
      if (k === "calidad") { b.textContent = s.calidadBaja ? "Baja" : "Alta"; b.classList.toggle("on", !s.calidadBaja); }
      else { b.textContent = vals[k] ? "Sí" : "No"; b.classList.toggle("on", !!vals[k]); }
    }
    $("setVibraRow").classList.toggle("hidden", !navigator.vibrate);
    $("setVer").textContent = "Els Panets · versión " + EP.VERSION;
  }
  function showSetPage(id) {
    const main = !id;
    setMain.classList.toggle("hidden", !main);
    setPage.classList.toggle("hidden", main);
    setBack.classList.toggle("hidden", main);
    setTitle.textContent = main ? "Ajustes" : PAGES[id][0];
    if (!main) { setPage.innerHTML = PAGES[id][1]; setPage.scrollTop = 0; }
  }
  function openSettings() {
    setNameEl.value = EP.settings().nombre;
    setNameMsg.textContent = "";
    setNameMsg.classList.remove("ok");
    paintSettings();
    showSetPage(null);
    show($("settingsOverlay"));
  }
  setMain.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const s = EP.settings(), k = b.dataset.set;
    if (k === "musica") EP.setMusic(!s.musica);
    else if (k === "efectos") EP.setSfx(!s.efectos);
    else if (k === "vibracion") EP.setVibra(!s.vibracion);
    else if (k === "destellos") EP.setFlash(!s.destellos);
    else if (k === "calidad") EP.setQuality(!s.calidadBaja);
    else if (b.dataset.page) { EP.sfx("click"); showSetPage(b.dataset.page); return; }
    else if (b.id === "setTutorial") { hide($("settingsOverlay")); EP.replayTutorial(); return; }
    else return;
    EP.sfx("click");
    paintSettings();
  });
  function saveName() {
    const name = setNameEl.value.trim();
    const bad = EP.nameProblem(name);
    setNameMsg.classList.toggle("ok", !bad);
    if (bad) { setNameMsg.textContent = bad; return; }
    EP.setPlayerName(name);
    setNameEl.blur();
    setNameMsg.textContent = EP.settings().mejor > 0 ? "Guardado. También cambia en el ranking." : "Guardado.";
  }
  $("setNameSave").addEventListener("click", saveName);
  setNameEl.addEventListener("keydown", (e) => { if (e.key === "Enter") saveName(); });
  setBack.addEventListener("click", () => showSetPage(null));
  $("setClose").addEventListener("click", () => hide($("settingsOverlay")));
  // borrar mis datos: primero lo de internet (con la llave de este móvil) y después lo del móvil
  let erasing = false;
  setPage.addEventListener("click", async (e) => {
    if (!e.target.closest("#eraseYes") || erasing) return;
    const msg = $("eraseMsg"), btn = $("eraseYes");
    let remote = false;
    try { remote = !!(localStorage.getItem("elsPanetsLlave") || localStorage.getItem("elsPanetsIdPrivado")); } catch (err) {}
    erasing = true; btn.disabled = true; msg.textContent = "Borrando…";
    try {
      if (remote) {
        if (!lb() || !lb().deleteMyData) throw new Error("sin-red");
        await lb().deleteMyData();
      }
    } catch (err) {
      erasing = false; btn.disabled = false;
      msg.textContent = "No se ha podido borrar lo de internet. Comprueba la conexión y vuelve a intentarlo. No se ha borrado nada.";
      return;
    }
    EP.eraseLocal();
    msg.textContent = "Borrado.";
    setTimeout(() => location.reload(), 400);
  });

  // botón «atrás»: cierra lo que haya abierto
  function closeAll() {
    if (!$("liveOverlay").classList.contains("hidden") && window.ElsPanetsLive) { window.ElsPanetsLive.back(); return; }
    if (!pickEl.classList.contains("hidden")) { pickEl.classList.add("hidden"); return; }
    if (!$("settingsOverlay").classList.contains("hidden") && setMain.classList.contains("hidden") && !erasing) { showSetPage(null); return; }
    if (spinning || erasing) return;
    closeCreator();
    for (const el of overlays) hide(el);
  }

  window.ElsPanetsUI = {
    openCreator, openAdmin, openBox, openDaily, openSettings, closeAll,
    isOpen: () => overlays.some((el) => !el.classList.contains("hidden")),
  };
})();
