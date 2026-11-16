// Progreso de Els Panets (17/11/2026): misiones diarias y semanal, 40 logros,
// estadísticas y el álbum de las fotos de MJ. Todo se guarda en el móvil.
// Escucha los avisos que da game.js (ElsPanets.on) y usa las ventanas de extras.js.
(function () {
  "use strict";
  const EP = window.ElsPanets;
  if (!EP || !EP.on) return;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---------- Estadísticas de siempre ----------
  const STATS_KEY = "elsPanetsDatos";
  const stats = Object.assign({ partidas: 0, comidas: 0, puntos: 0, poderes: 0, especiales: 0, filas: 0, doradas: 0, cajas: 0, fotos: 0,
    mejorRacha: 0, segundos: 0, lugaresMax: 0, rachaDiaria: 0, personajes: {} }, ls.get(STATS_KEY, {}));
  const saveStats = () => ls.set(STATS_KEY, stats);

  // ---------- Misiones ----------
  // Cada día salen 3 (iguales en todos los móviles ese día) y cada semana 1 más grande.
  const pad2 = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  function weekKey(d) {
    const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); // lunes
    return "S" + dayKey(m);
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // tipo: suma (se van sumando), max (lo mejor de una partida), una (pasa o no en una partida)
  const DAILY_POOL = [
    { id: "comer", txt: "Come {n} empanadillas", metas: [30, 40, 50], tipo: "suma" },
    { id: "puntos", txt: "Haz {n} puntos en una partida", metas: [25, 40, 60], tipo: "max" },
    { id: "partidas", txt: "Juega {n} partidas", metas: [3, 4, 5], tipo: "suma" },
    { id: "poderes", txt: "Coge {n} poderes", metas: [3, 4, 5], tipo: "suma" },
    { id: "filas", txt: "Completa {n} filas de tres", metas: [2, 3, 3], tipo: "suma" },
    { id: "playaLimpia", txt: "Llega a la playa sin coger ningún poder", metas: [1], tipo: "una" },
    { id: "comerPartida", txt: "Come {n} empanadillas en una partida", metas: [10, 12, 15], tipo: "max" },
    { id: "especiales", txt: "Coge {n} objetos especiales", metas: [1, 2, 2], tipo: "suma" },
    { id: "racha", txt: "Haz una racha de {n} empanadillas seguidas", metas: [5, 7, 9], tipo: "max" },
    { id: "dorada", txt: "Cómete una empanadilla dorada", metas: [1], tipo: "suma" },
    { id: "personajes", txt: "Juega con {n} personajes distintos", metas: [2, 2, 3], tipo: "suma" },
    { id: "caja", txt: "Abre una caja sorpresa", metas: [1], tipo: "suma" },
  ];
  const WEEK_POOL = [
    { id: "comer", txt: "Come {n} empanadillas esta semana", metas: [300], tipo: "suma" },
    { id: "puntosSuma", txt: "Suma {n} puntos esta semana", metas: [600], tipo: "suma" },
    { id: "partidas", txt: "Juega {n} partidas esta semana", metas: [25], tipo: "suma" },
    { id: "montana", txt: "Llega a la montaña {n} veces", metas: [3], tipo: "suma" },
    { id: "filas", txt: "Completa {n} filas de tres", metas: [15], tipo: "suma" },
  ];
  const DAILY_REWARD = [30, 40, 50], WEEK_REWARD = 150;
  const MIS_KEY = "elsPanetsMisiones";
  let mis = ls.get(MIS_KEY, null);
  function freshMissions() {
    const now = new Date(), dk = dayKey(now), wk = weekKey(now);
    if (!mis) mis = {};
    if (mis.dia !== dk) {
      const h = hash("dia" + dk), ids = [];
      for (let k = 0; ids.length < 3 && k < 40; k++) { const p = DAILY_POOL[(h + k * 7) % DAILY_POOL.length]; if (!ids.includes(p)) ids.push(p); }
      mis.dia = dk;
      mis.lista = ids.map((p, i) => ({ id: p.id, meta: p.metas[(h >> (i * 3)) % p.metas.length], prog: 0, cobrada: false, premio: DAILY_REWARD[i], vistos: [] }));
    }
    if (mis.semana !== wk) {
      const p = WEEK_POOL[hash("semana" + wk) % WEEK_POOL.length];
      mis.semana = wk;
      mis.semanal = { id: p.id, meta: p.metas[0], prog: 0, cobrada: false, premio: WEEK_REWARD };
    }
    ls.set(MIS_KEY, mis);
  }
  freshMissions();
  const defOf = (m, weekly) => (weekly ? WEEK_POOL : DAILY_POOL).find((p) => p.id === m.id);
  const missionText = (m, weekly) => { const d = defOf(m, weekly); return d ? d.txt.replace("{n}", m.meta) : m.id; };
  const done = (m) => m.prog >= m.meta;
  function allMissions() { freshMissions(); return mis.lista.map((m) => [m, false]).concat([[mis.semanal, true]]); }
  // cuántas se pueden cobrar ya (el inicio pinta un aviso)
  function pending() { return allMissions().filter(([m]) => done(m) && !m.cobrada).length; }
  function bump(m, v, mode) {
    if (m.cobrada || done(m)) return false;
    if (mode === "max") m.prog = Math.max(m.prog, Math.min(m.meta, v));
    else m.prog = Math.min(m.meta, m.prog + v);
    return done(m);
  }
  // un aviso del juego se reparte entre las misiones que le tocan
  function feed(ev, data) {
    let newly = [];
    for (const [m, weekly] of allMissions()) {
      let hit = false;
      const id = m.id;
      if (ev === "come" && id === "comer") hit = bump(m, 1);
      else if (ev === "poder" && id === "poderes") hit = bump(m, 1);
      else if (ev === "fila" && id === "filas") hit = bump(m, 1);
      else if (ev === "especial" && id === "especiales") hit = bump(m, 1);
      else if (ev === "dorada" && id === "dorada") hit = bump(m, 1);
      else if (ev === "caja" && id === "caja") hit = bump(m, 1);
      else if (ev === "partida" && id === "partidas") hit = bump(m, 1);
      else if (ev === "partida" && id === "personajes") {
        m.vistos = m.vistos || [];
        if (!m.vistos.includes(data.char)) { m.vistos.push(data.char); hit = bump(m, 1); }
      } else if (ev === "fin") {
        if (id === "puntos") hit = bump(m, data.score, "max");
        else if (id === "comerPartida") hit = bump(m, data.comidas, "max");
        else if (id === "racha") hit = bump(m, data.racha, "max");
        else if (id === "playaLimpia" && data.lugares >= 1 && data.poderes === 0) hit = bump(m, 1);
        else if (id === "puntosSuma") hit = bump(m, data.score);
        else if (id === "montana" && data.lugares >= 2) hit = bump(m, 1);
      }
      if (hit) newly.push(missionText(m, weekly));
    }
    ls.set(MIS_KEY, mis);
    for (const t of newly) toast("¡Misión cumplida!", t + " · cóbrala en Misiones");
  }
  function claim(i) {
    const list = allMissions(), it = list[i];
    if (!it) return;
    const [m] = it;
    if (!done(m) || m.cobrada) return;
    m.cobrada = true;
    ls.set(MIS_KEY, mis);
    EP.addHucha(m.premio);
    EP.sfx("record");
    render();
  }

  // ---------- Logros ----------
  // [id, nombre, cómo se consigue, premio, color (0 bronce, 1 plata, 2 oro), insignia, comprobación]
  const PL = ["la playa", "la montaña", "el pueblo", "Barcelona"];
  const ACH = [
    ["p1", "Primer vuelo", "Juega tu primera partida", 20, 0, "1", () => stats.partidas >= 1],
    ["p10", "Le vas cogiendo el gusto", "Juega 10 partidas", 30, 0, "10", () => stats.partidas >= 10],
    ["p50", "Enganchado", "Juega 50 partidas", 60, 1, "50", () => stats.partidas >= 50],
    ["p100", "Sin parar", "Juega 100 partidas", 100, 2, "100", () => stats.partidas >= 100],
    ["c50", "Hambre", "Come 50 empanadillas en total", 20, 0, "50", () => stats.comidas >= 50],
    ["c250", "Buen saque", "Come 250 empanadillas en total", 50, 1, "250", () => stats.comidas >= 250],
    ["c1000", "Mil panets", "Come 1000 empanadillas en total", 100, 2, "1000", () => stats.comidas >= 1000],
    ["r10", "Despegue", "Haz un récord de 10", 20, 0, "10", () => EP.best() >= 10],
    ["r25", "Ya vuela", "Haz un récord de 25", 30, 0, "25", () => EP.best() >= 25],
    ["r50", "Piloto", "Haz un récord de 50", 50, 1, "50", () => EP.best() >= 50],
    ["r100", "Cien", "Haz un récord de 100", 80, 1, "100", () => EP.best() >= 100],
    ["r200", "Leyenda", "Haz un récord de 200", 120, 2, "200", () => EP.best() >= 200],
    ["r400", "Imparable", "Haz un récord de 400", 200, 2, "400", () => EP.best() >= 400],
    ["l1", "A la playa", "Llega a " + PL[0] + " en una partida", 20, 0, "1", () => stats.lugaresMax >= 1],
    ["l2", "A la montaña", "Llega a " + PL[1] + " en una partida", 40, 1, "2", () => stats.lugaresMax >= 2],
    ["l3", "Al pueblo", "Llega a " + PL[2] + " en una partida", 60, 1, "3", () => stats.lugaresMax >= 3],
    ["l4", "Hasta Barcelona", "Llega a " + PL[3] + " en una partida", 80, 2, "4", () => stats.lugaresMax >= 4],
    ["l5", "La vuelta entera", "Vuelve a la ciudad en la misma partida", 120, 2, "★", () => stats.lugaresMax >= 5],
    ["po10", "Con poderes", "Coge 10 poderes", 20, 0, "10", () => stats.poderes >= 10],
    ["po50", "Superpoderes", "Coge 50 poderes", 50, 1, "50", () => stats.poderes >= 50],
    ["po200", "Todopoderoso", "Coge 200 poderes", 100, 2, "200", () => stats.poderes >= 200],
    ["e5", "Lo tuyo", "Coge 5 objetos especiales", 20, 0, "5", () => stats.especiales >= 5],
    ["e25", "Coleccionista", "Coge 25 objetos especiales", 50, 1, "25", () => stats.especiales >= 25],
    ["f10", "En fila", "Completa 10 filas de tres", 30, 0, "10", () => stats.filas >= 10],
    ["f50", "Ordenado", "Completa 50 filas de tres", 70, 1, "50", () => stats.filas >= 50],
    ["d1", "Oro puro", "Cómete una empanadilla dorada", 20, 0, "1", () => stats.doradas >= 1],
    ["d10", "Rico", "Cómete 10 empanadillas doradas", 70, 1, "10", () => stats.doradas >= 10],
    ["ra10", "Racha", "Come 10 seguidas sin dejarte ninguna", 30, 0, "10", () => stats.mejorRacha >= 10],
    ["ra25", "Racha de fuego", "Come 25 seguidas sin dejarte ninguna", 60, 1, "25", () => stats.mejorRacha >= 25],
    ["ra50", "Glotón perfecto", "Come 50 seguidas sin dejarte ninguna", 120, 2, "50", () => stats.mejorRacha >= 50],
    ["b1", "Sorpresa", "Abre una caja sorpresa", 10, 0, "1", () => stats.cajas >= 1],
    ["b10", "Cajas y más cajas", "Abre 10 cajas sorpresa", 50, 1, "10", () => stats.cajas >= 10],
    ["bAll", "Colección completa", "Consigue todos los premios de la caja", 150, 2, "★", () => EP.boxComplete()],
    ["dd3", "Constante", "Coge el premio diario 3 días seguidos", 30, 0, "3", () => stats.rachaDiaria >= 3],
    ["dd7", "Fiel", "Coge el premio diario 7 días seguidos", 80, 2, "7", () => stats.rachaDiaria >= 7],
    ["ft1", "¡Patata!", "Saca una foto con MJ", 20, 0, "1", () => stats.fotos >= 1],
    ["chAll", "Todos los amigos", "Desbloquea todos los personajes", 100, 2, "★", () => EP.unlockedChars() >= EP.totalChars()],
    ["cr", "A tu manera", "Crea tu propio personaje", 30, 0, "★", () => EP.hasCustom()],
    ["m1", "Mejorando", "Compra una mejora en la tienda", 20, 0, "1", () => Object.values(EP.upgrades()).some((v) => v > 0)],
    ["mMax", "A tope", "Sube un poder al nivel máximo", 100, 2, "★", () => Object.values(EP.upgrades()).some((v) => v >= EP.UPGRADE_COSTS.length)],
  ];
  const ACH_KEY = "elsPanetsLogros";
  const got = ls.get(ACH_KEY, {});
  // mira qué logros se han conseguido; el premio se suma solo
  function checkAch(quiet) {
    const nuevos = [];
    for (const a of ACH) {
      if (got[a[0]]) continue;
      let ok = false;
      try { ok = a[6](); } catch (e) {}
      if (ok) { got[a[0]] = Date.now(); EP.addHucha(a[3]); nuevos.push(a); }
    }
    if (!nuevos.length) return;
    ls.set(ACH_KEY, got);
    if (quiet || nuevos.length > 2) {
      const tot = nuevos.reduce((s, a) => s + a[3], 0);
      toast("¡" + nuevos.length + " logros nuevos!", "+" + tot + " panets en tu hucha");
    } else for (const a of nuevos) toast("¡Logro: " + a[1] + "!", a[2] + " · +" + a[3] + " panets");
  }

  // ---------- Álbum de las fotos de MJ ----------
  const ALBUM_KEY = "elsPanetsAlbum", ALBUM_MAX = 12;
  let album = ls.get(ALBUM_KEY, []);
  if (!Array.isArray(album)) album = [];
  function saveAlbum() {
    // si no cabe en el móvil, se quitan las más antiguas
    while (album.length) {
      try { localStorage.setItem(ALBUM_KEY, JSON.stringify(album)); return; } catch (e) { album.shift(); }
    }
    try { localStorage.removeItem(ALBUM_KEY); } catch (e) {}
  }

  // ---------- Lo que avisa el juego ----------
  EP.on("partida", (d) => { stats.partidas++; stats.personajes[d.char] = (stats.personajes[d.char] || 0) + 1; saveStats(); feed("partida", d); });
  EP.on("come", () => { stats.comidas++; feed("come"); });
  EP.on("poder", (k) => { stats.poderes++; feed("poder", k); });
  EP.on("especial", (k) => { stats.especiales++; feed("especial", k); });
  EP.on("fila", () => { stats.filas++; feed("fila"); });
  EP.on("dorada", () => { stats.doradas++; feed("dorada"); });
  EP.on("lugar", (d) => { /* se apunta al acabar */ });
  EP.on("caja", () => { stats.cajas++; saveStats(); feed("caja"); setTimeout(() => checkAch(false), 4600); });
  EP.on("diario", (n) => { stats.rachaDiaria = Math.max(stats.rachaDiaria, n); saveStats(); setTimeout(() => checkAch(false), 600); });
  EP.on("mejora", () => { setTimeout(() => checkAch(false), 300); });
  EP.on("foto", (f) => {
    stats.fotos++; saveStats();
    album.push({ img: f.img, hora: f.hora, lugar: f.lugar, fecha: dayKey(new Date()) });
    while (album.length > ALBUM_MAX) album.shift();
    saveAlbum();
  });
  EP.on("fin", (d) => {
    stats.puntos += d.score; stats.segundos += d.segundos;
    stats.mejorRacha = Math.max(stats.mejorRacha, d.racha);
    stats.lugaresMax = Math.max(stats.lugaresMax, d.lugares);
    saveStats();
    feed("fin", d);
    setTimeout(() => checkAch(false), 900);
  });
  // al abrir el juego: los logros que ya se tenían de antes se dan de golpe
  setTimeout(() => checkAch(true), 2500);

  // ---------- Avisos pequeños arriba ----------
  const toastEl = document.createElement("div");
  toastEl.id = "progToast";
  toastEl.className = "progToast";
  document.getElementById("stage").appendChild(toastEl);
  const queue = [];
  let showing = false;
  function toast(title, sub) { queue.push([title, sub]); if (!showing) nextToast(); }
  function nextToast() {
    const t = queue.shift();
    if (!t) { showing = false; return; }
    showing = true;
    toastEl.innerHTML = "<b>" + esc(t[0]) + "</b><span>" + esc(t[1]) + "</span>";
    toastEl.classList.add("on");
    setTimeout(() => { toastEl.classList.remove("on"); setTimeout(nextToast, 450); }, 2600);
  }

  // ---------- Ventana: Misiones, Logros, Álbum y Datos ----------
  const body = $("progBody"), tabs = $("progTabs");
  let tab = "misiones";
  const fmtTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? h + " h " + m + " min" : m + " min"; };
  function render() {
    for (const b of tabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.tab === tab);
    if (tab === "misiones") {
      const list = allMissions();
      const row = ([m, weekly], i) => {
        const pct = Math.round((m.prog / m.meta) * 100), ok = done(m);
        const btn = m.cobrada ? '<span class="mDone">Cobrada ✓</span>'
          : ok ? `<button type="button" class="mClaim" data-claim="${i}">Cobrar +${m.premio}</button>` : `<span class="mPrize">+${m.premio}</span>`;
        return `<div class="mRow${ok && !m.cobrada ? " ready" : ""}${weekly ? " weekly" : ""}"><div class="mTxt">${esc(missionText(m, weekly))}
          <div class="mBar"><i style="width:${pct}%"></i></div><small>${m.prog} / ${m.meta}</small></div>${btn}</div>`;
      };
      const ms = 864e5 - (Date.now() - new Date().setHours(0, 0, 0, 0));
      body.innerHTML = `<div class="mHead">Hoy <small>· cambian en ${Math.floor(ms / 3600000)} h ${Math.floor((ms % 3600000) / 60000)} min</small></div>` +
        list.slice(0, 3).map(row).join("") +
        `<div class="mHead">Esta semana</div>` + row(list[3], 3);
    } else if (tab === "logros") {
      const n = ACH.filter((a) => got[a[0]]).length;
      body.innerHTML = `<div class="mHead">${n} de ${ACH.length} logros</div><div class="achGrid">` + ACH.map((a) => {
        const has = !!got[a[0]];
        return `<div class="ach${has ? " has t" + a[4] : ""}"><div class="achBadge">${esc(a[5])}</div><b>${esc(a[1])}</b><small>${esc(a[2])}</small><span>+${a[3]}</span></div>`;
      }).join("") + "</div>";
    } else if (tab === "album") {
      if (!album.length) { body.innerHTML = '<div class="aEmpty">Aún no hay fotos. Juega con MJ: cada 15 empanadillas sale su cámara y saca una foto.</div>'; return; }
      body.innerHTML = `<div class="mHead">${album.length} de ${ALBUM_MAX} fotos <small>· se guardan las últimas</small></div><div class="albumGrid">` +
        album.map((p, i) => `<button type="button" class="albumPic" data-pic="${i}"><img alt="" src="${p.img}"><small>${esc(p.lugar || "")} · ${esc(p.hora || "")}</small></button>`).reverse().join("") + "</div>";
    } else {
      const fav = Object.entries(stats.personajes).sort((a, b) => b[1] - a[1])[0];
      const rows = [
        ["Partidas", stats.partidas], ["Empanadillas comidas", stats.comidas], ["Puntos sumados", stats.puntos],
        ["Mejor récord", EP.best()], ["Mejor racha seguida", stats.mejorRacha], ["Tiempo jugando", fmtTime(stats.segundos)],
        ["Poderes cogidos", stats.poderes], ["Objetos especiales", stats.especiales], ["Filas de tres", stats.filas],
        ["Empanadillas doradas", stats.doradas], ["Cajas abiertas", stats.cajas], ["Fotos de MJ", stats.fotos],
        ["Racha de días", stats.rachaDiaria], ["Logros", ACH.filter((a) => got[a[0]]).length + " / " + ACH.length],
      ];
      if (fav) rows.splice(3, 0, ["Personaje que más usas", EP.charName ? EP.charName(fav[0]) : fav[0]]);
      body.innerHTML = '<div class="statList">' + rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("") + "</div>";
    }
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) { tab = b.dataset.tab; render(); } });
  body.addEventListener("click", (e) => {
    const c = e.target.closest("button[data-claim]");
    if (c) { claim(Number(c.dataset.claim)); return; }
    const p = e.target.closest("button[data-pic]");
    if (p) openPic(Number(p.dataset.pic));
  });
  // foto en grande, con botón para borrarla
  const view = $("picView");
  let viewIdx = -1;
  function openPic(i) {
    const p = album[i]; if (!p) return;
    viewIdx = i;
    $("picImg").src = p.img;
    $("picInfo").textContent = (p.lugar || "") + " · " + (p.hora || "") + " · " + (p.fecha || "");
    view.classList.remove("hidden");
  }
  $("picClose").addEventListener("click", () => view.classList.add("hidden"));
  $("picDel").addEventListener("click", () => {
    if (viewIdx < 0 || !confirm("¿Borrar esta foto?")) return;
    album.splice(viewIdx, 1); saveAlbum(); view.classList.add("hidden"); render();
  });
  function open(which) {
    freshMissions();
    tab = which || (pending() ? "misiones" : tab);
    view.classList.add("hidden");
    render();
    $("progOverlay").classList.remove("hidden");
  }
  $("progClose").addEventListener("click", () => $("progOverlay").classList.add("hidden"));

  window.ElsPanetsProgreso = { open, pending, stats: () => stats };
})();
