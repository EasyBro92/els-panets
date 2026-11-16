// Partida en directo de Els Panets (17/11/2026): dos jugadores a la vez, cada uno en su móvil.
// Va por la Realtime Database de mr-taco-president (europe-west1). Solo se conecta mientras
// estás en una sala, y al salir se desconecta (el plan gratis admite 100 conexiones a la vez).
// Sala = código de 5 letras; sitio «a» para quien la crea y «b» para quien entra.
// Las reglas están en apk/llave/directo.rules.json (se publican con node apk/llave/directo.mjs).
const DB_URL = "https://mr-taco-president-default-rtdb.europe-west1.firebasedatabase.app";
const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const PUBLIC = "https://easybro92.github.io/els-panets/";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EP = window.ElsPanets, UI = window.ElsPanetsUI;
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
const ov = $("liveOverlay"), titleEl = $("liveTitle"), bodyEl = $("liveBody");

let fb = null, offset = 0, connected = false;
let room = null; // { code, slot, other, data, round, sentN, mine, wins, counted, themSeen, starting, view }
let sender = 0;
const serverNow = () => Date.now() + offset;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("sin-red")), ms || 10000))]);

// id de este móvil para la sala (no es el de ranking)
function myKey() {
  let k = null;
  try { k = localStorage.getItem("elsPanetsDirectoId"); } catch (e) {}
  if (!k || !/^[a-z0-9]{8}$/.test(k)) {
    k = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
    try { localStorage.setItem("elsPanetsDirectoId", k); } catch (e) {}
  }
  return k;
}
const shareBase = () => (location.hostname === "els.panets" ? PUBLIC : location.origin + location.pathname.replace(/index\.html$/, ""));
const linkFor = (code) => shareBase() + "?sala=" + code;
function meNode() {
  const p = EP.playerInfo();
  const n = { k: myKey(), n: String(p.name || "Jugador").slice(0, 16), c: String(p.char || "gris").slice(0, 24) };
  if (p.flag) n.f = String(p.flag).slice(0, 8);
  return n;
}
const seedFor = (code, r) => { let h = 2166136261; for (const ch of "directo" + code + r) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const charIdx = (id) => { const i = EP.charIndexOf(id); const c = EP.charList().find((x) => x.id === id); return i >= 0 && c && !c.custom ? i : 0; };

// ---------- conexión ----------
async function net() {
  if (fb) { fb.m.goOnline(fb.db); return fb; }
  const [a, m] = await withTimeout(Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-database.js")]), 15000);
  const db = m.getDatabase(a.getApp(), DB_URL);
  fb = { db, m };
  m.onValue(m.ref(db, ".info/serverTimeOffset"), (s) => { offset = Number(s.val()) || 0; });
  m.onValue(m.ref(db, ".info/connected"), (s) => {
    connected = !!s.val();
    if (connected && room) presence();
    if (room) render();
  });
  return fb;
}
async function waitConnected(ms) {
  const t0 = Date.now();
  while (!connected && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 100));
  return connected;
}
// estar en la sala: si se corta la conexión, el servidor quita tu sitio solo
function presence() {
  if (!room || !fb) return;
  const { db, m } = fb, r = m.ref(db, "salas/" + room.code + "/j/" + room.slot);
  m.onDisconnect(r).remove().catch(() => {});
  m.update(r, meNode()).catch(() => { if (room) { toast("Te has quedado fuera de la sala."); leave(); } });
}

// ---------- crear, entrar y salir ----------
async function createRoom() {
  const { db, m } = await net();
  if (!(await waitConnected(10000))) throw new Error("sin-red");
  cleanOld();
  for (let tries = 0; tries < 4; tries++) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
    try {
      await withTimeout(m.update(m.ref(db), {
        ["salas/" + code]: { creada: m.serverTimestamp(), ronda: 0, semilla: 0, inicio: 0, j: { a: meNode() } },
        ["limpiar/" + Math.round(serverNow()) + "_" + code]: code,
      }), 12000);
      enterRoom(code, "a");
      return code;
    } catch (e) { if (!/permission/i.test(String(e && (e.code || e.message)))) throw e; }
  }
  throw new Error("sin-codigo");
}
async function joinRoom(code) {
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) return "Escribe las 5 letras del código.";
  if (room && room.code === code) { show(); return ""; }
  if (room) await leave(true);
  const { db, m } = await net();
  if (!(await waitConnected(10000))) return "No hay conexión.";
  const snap = await withTimeout(m.get(m.ref(db, "salas/" + code)));
  if (!snap.exists()) return "No existe esa sala (o ya se cerró).";
  const j = snap.val().j || {}, k = myKey();
  const slot = ["a", "b"].find((s) => j[s] && j[s].k === k) || (!j.a ? "a" : !j.b ? "b" : null);
  if (!slot) return "La sala está llena: ya hay dos jugando.";
  try { await withTimeout(m.set(m.ref(db, "salas/" + code + "/j/" + slot), meNode())); }
  catch (e) { return "No se pudo entrar. Prueba otra vez."; }
  enterRoom(code, slot);
  return "";
}
function enterRoom(code, slot) {
  const { db, m } = fb;
  room = { code, slot, other: slot === "a" ? "b" : "a", data: null, round: 0, sentN: 0, mine: null, wins: { me: 0, them: 0 }, counted: {}, themSeen: null, starting: 0, view: "sala" };
  presence();
  room.unsub = m.onValue(m.ref(db, "salas/" + code), (s) => onRoom(s.val()));
  clearInterval(sender);
  sender = setInterval(sendTick, 150);
  if ($("retosOverlay")) $("retosOverlay").classList.add("hidden");
  show();
}
async function leave(quiet) {
  if (!room) return;
  const r = room;
  room = null;
  clearInterval(sender);
  try { r.unsub(); } catch (e) {}
  if (fb) {
    const { db, m } = fb, mine = m.ref(db, "salas/" + r.code + "/j/" + r.slot);
    try { await m.onDisconnect(mine).cancel(); } catch (e) {}
    const alone = !(r.data && r.data.j && r.data.j[r.other]);
    try { if (alone) await withTimeout(m.remove(m.ref(db, "salas/" + r.code)), 6000); else throw 0; }
    catch (e) { try { await withTimeout(m.remove(mine), 6000); } catch (e2) {} }
    m.goOffline(db);
  }
  ov.classList.add("hidden");
  if (!quiet && EP.liveLeave) EP.liveLeave();
}
// las salas de hace más de un día se borran solas al crear una nueva
async function cleanOld() {
  try {
    const { db, m } = fb;
    const q = m.query(m.ref(db, "limpiar"), m.orderByKey(), m.endAt(String(Math.round(serverNow() - 86400000 - 600000))), m.limitToFirst(10));
    const s = await withTimeout(m.get(q));
    const jobs = [];
    s.forEach((c) => { jobs.push(m.remove(m.ref(db, "salas/" + c.val())).catch(() => {}).then(() => m.remove(m.ref(db, "limpiar/" + c.key))).catch(() => {})); });
    await Promise.all(jobs);
  } catch (e) {}
}

// ---------- lo que pasa en la sala ----------
function onRoom(d) {
  if (!room) return;
  if (!d) { toast("La sala se ha cerrado."); if (!EP.liveState().playing) leave(); else { room.closed = true; EP.liveFeed({ gone: true }); } return; }
  const first = !room.data, j = d.j || {}, them = j[room.other];
  room.data = d;
  if (them && them.n) room.lastName = them.n;
  if (them && them.fin) room.lastFin = them.fin;
  // al entrar, las rondas que ya se jugaron no cuentan
  if (first) { room.round = d.ronda || 0; room.themSeen = them ? them.n : null; }
  // llega o se va el otro
  if (them && them.n && !room.themSeen) { room.themSeen = them.n; if (room.round || room.view === "sala") EP.sfx && EP.sfx("click"); toast(them.n + " ha entrado en la sala"); }
  if (!them && room.themSeen) { toast(room.themSeen + " se ha ido de la sala"); room.themSeen = null; EP.liveFeed({ gone: true }); }
  // su partida
  if (them && room.round && EP.runMode() === "directo") {
    if (them.p && them.p.r === room.round && them.p.i + "," + them.p.s !== room.themP) { room.themP = them.p.i + "," + them.p.s; room.themAt = Date.now(); }
    if (them.p && them.p.r === room.round) EP.liveFeed({ i: them.p.i, y: String(them.p.y || "").split(",").map(Number).filter((v) => !isNaN(v)), s: them.p.s });
    if (them.fin && them.fin.r === room.round) EP.liveFeed({ s: them.fin.s, dead: true });
  }
  // empieza una ronda nueva
  if (d.ronda > room.round && d.inicio > 0 && them) { startRound(d); return; }
  // quien manda (el de la «a», o el que quede) arranca cuando los dos están listos
  const me = j[room.slot], boss = room.slot === "a" || !j.a;
  if (boss && me && them && me.listo === d.ronda + 1 && them.listo === d.ronda + 1 && room.starting !== d.ronda + 1) {
    room.starting = d.ronda + 1;
    const { db, m } = fb;
    m.update(m.ref(db, "salas/" + room.code), { ronda: d.ronda + 1, semilla: seedFor(room.code, d.ronda + 1), inicio: Math.round(serverNow() + 3600) }).catch(() => { room && (room.starting = 0); });
  }
  if (!ov.classList.contains("hidden")) render();
}
function startRound(d) {
  const them = d.j[room.other];
  room.round = d.ronda; room.sentN = 0; room.mine = null; room.view = "juego"; room.themAt = Date.now(); room.themP = "";
  const at = Math.max(Date.now() + 1200, d.inicio - offset);
  if (!EP.startLive(d.semilla, { name: them.n, ci: charIdx(them.c) }, at)) { toast("Termina antes la partida que estás jugando."); return; }
  // fuera todas las ventanas (el premio diario, la tienda…): se juega ya
  for (const el of document.querySelectorAll(".overlay")) el.classList.add("hidden");
}
// cada 150 ms: tus alturas nuevas (las últimas 12, por si se pierde alguna tanda) y tus puntos
function sendTick() {
  if (!room || !fb || !room.round || room.mine != null) return;
  const st = EP.liveState();
  if (st.mode !== "directo" || !st.playing || st.n <= room.sentN) return;
  room.sentN = st.n;
  const { db, m } = fb;
  m.set(m.ref(db, "salas/" + room.code + "/j/" + room.slot + "/p"), { r: room.round, i: st.n - st.y.length, y: st.y.join(","), s: st.s }).catch(() => {});
}
EP.on("partidaFin", (d) => {
  if (d.mode !== "directo" || !room || !fb || !room.round) return;
  const st = EP.liveState(), { db, m } = fb, base = "salas/" + room.code + "/j/" + room.slot;
  room.mine = d.score;
  m.update(m.ref(db, base), { p: { r: room.round, i: st.n - st.y.length, y: st.y.join(","), s: d.score }, fin: { r: room.round, s: d.score } }).catch(() => {});
  setTimeout(() => { if (room) { room.view = "fin"; show(); } }, 1500);
});

// ---------- ventana ----------
function show() { render(); ov.classList.remove("hidden"); }
function render() {
  if (!room) return;
  const d = room.data || { j: {} }, j = d.j || {}, me = j[room.slot], them = j[room.other];
  titleEl.textContent = "Sala " + room.code;
  if (room.view === "fin" && room.round) { renderEnd(d, me, them); return; }
  const next = (d.ronda || 0) + 1, meReady = me && me.listo === next, themReady = them && them.listo === next;
  let h = `<div class="lvPlayers">${playerRow(me, true, meReady)}${them ? playerRow(them, false, themReady) : '<div class="lvRow lvWait"><span class="lvDot"></span>Esperando a tu amigo…</div>'}</div>`;
  if (!connected) h += '<p class="formMsg">Sin conexión… reconectando.</p>';
  if (!them) h += inviteBlock();
  else if (!meReady) h += `<button type="button" id="lvReady" class="bigBtn">${room.round ? "¡Revancha!" : "¡Estoy listo!"}</button><p class="rtInfo lvHint">${themReady ? esc(them.n) + " ya está listo." : "Cuando los dos pulséis «listo», empieza la cuenta 3, 2, 1."}</p>`;
  else h += `<p class="rtInfo lvHint">Esperando a que ${esc(them.n)} pulse «listo»…</p>`;
  bodyEl.innerHTML = h;
  paintChars();
  if (!them) paintQR();
}
function playerRow(p, isMe, ready) {
  const ci = isMe ? EP.current() : charIdx(p && p.c);
  return `<div class="lvRow${isMe ? " me" : ""}"><canvas class="lvChar" width="96" height="96" data-ci="${ci}"></canvas><b>${esc(p ? p.n : EP.playerInfo().name)}${isMe ? " (tú)" : ""}</b>${ready ? '<i class="lvOk">✓ listo</i>' : ""}</div>`;
}
function inviteBlock() {
  const url = linkFor(room.code);
  const msg = "¡Juega conmigo en directo a Els Panets! Entra con este enlace: " + url + " (código " + room.code + ")";
  return `<p class="rtInfo">Invita a tu amigo. Cuando entre, saldrá aquí.</p>
    <div class="rtShareCode lvCode">${room.code}</div>
    <a class="bigBtn rtWa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Invitar por WhatsApp</a>
    <div class="lvShare">${navigator.share ? '<button type="button" id="lvShareNative" class="ghostBtn">Compartir…</button>' : ""}<button type="button" id="lvCopy" class="ghostBtn">Copiar enlace</button></div>
    <p id="lvCopyMsg" class="formMsg"></p>
    <div class="lvQRBox"><canvas id="lvQR" width="200" height="200"></canvas><span>Si está a tu lado, que lo escanee con la cámara</span></div>`;
}
function renderEnd(d, me, them) {
  const mine = room.mine != null ? room.mine : me && me.fin && me.fin.r === room.round ? me.fin.s : 0;
  // su marca final se recuerda aunque luego se vaya de la sala
  const lf = (them && them.fin) || room.lastFin, theirFin = lf && lf.r === room.round ? lf.s : null;
  const theirLive = them && them.p && them.p.r === room.round ? them.p.s : 0;
  const name = (them && them.n) || room.lastName || "Tu amigo";
  let h;
  if (!them && theirFin == null) {
    room.view = "sala";
    bodyEl.innerHTML = `<div class="lvBig">${esc(name)} se ha ido</div><p class="rtInfo lvHint">Has hecho <b>${mine}</b> puntos. Puedes invitar a otra persona a esta sala.</p><button type="button" id="lvInvite" class="bigBtn">Invitar a otro</button>`;
    return;
  }
  if (theirFin == null) {
    // si su móvil deja de mandar (ha salido del juego, sin cobertura…), se avisa
    const quiet = Date.now() - (room.themAt || 0) > 8000;
    h = `<div class="lvBig">Has hecho ${mine}</div><p class="rtInfo lvHint">${esc(name)} sigue volando: <b>${theirLive}</b> puntos…</p>`
      + (quiet ? `<p class="rtInfo lvHint">No llegan datos de ${esc(name)}: puede que haya salido del juego o se haya quedado sin cobertura.</p>` : "");
    clearTimeout(room.quietT);
    if (!quiet) room.quietT = setTimeout(() => { if (room && room.view === "fin" && !ov.classList.contains("hidden")) render(); }, 8100 - (Date.now() - (room.themAt || 0)));
  } else {
    if (!room.counted[room.round]) { room.counted[room.round] = 1; if (mine > theirFin) room.wins.me++; else if (theirFin > mine) room.wins.them++; }
    const title = mine > theirFin ? "¡Has ganado!" : mine < theirFin ? "Gana " + esc(name) : "¡Empate!";
    h = `<div class="lvBig${mine > theirFin ? " win" : ""}">${title}</div>
      <ol class="rtTurnList lvScores"><li><b>Tú</b><i>${mine}</i></li><li><b>${esc(name)}</b><i>${theirFin}</i></li></ol>
      <p class="rtInfo lvHint">Partidas ganadas: tú ${room.wins.me} · ${esc(name)} ${room.wins.them}</p>`;
    if (!them) { room.view = "sala"; h += `<p class="rtInfo lvHint">${esc(name)} ya se ha ido de la sala.</p><button type="button" id="lvInvite" class="bigBtn">Invitar a otro</button>`; }
    else {
      const next = (d.ronda || 0) + 1, meReady = me && me.listo === next, themReady = them.listo === next;
      h += meReady ? `<p class="rtInfo lvHint">Esperando a que ${esc(name)} quiera la revancha…</p>`
        : `<button type="button" id="lvReady" class="bigBtn">¡Revancha!</button>${themReady ? `<p class="rtInfo lvHint">${esc(name)} quiere la revancha.</p>` : ""}`;
    }
  }
  bodyEl.innerHTML = h;
}
function paintChars() {
  for (const cv of bodyEl.querySelectorAll("canvas.lvChar")) { try { EP.drawCharTo(cv, Number(cv.dataset.ci) || 0); } catch (e) {} }
}
// código QR del enlace (qrcode.js, de Kazuhiko Arase, licencia MIT)
function paintQR() {
  const cv = $("lvQR");
  if (!cv || typeof window.qrcode !== "function") { if (cv) cv.parentNode.classList.add("hidden"); return; }
  const q = window.qrcode(0, "M"); q.addData(linkFor(room.code)); q.make();
  const n = q.getModuleCount(), quiet = 3, cell = Math.floor(cv.width / (n + quiet * 2)), off = Math.floor((cv.width - cell * n) / 2);
  const c = cv.getContext("2d");
  c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = "#1d130b";
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect(off + k * cell, off + r * cell, cell, cell);
}
let toastT = 0;
function toast(t) {
  let el = $("lvToast");
  if (!el) { el = document.createElement("div"); el.id = "lvToast"; el.className = "lvToast"; document.body.appendChild(el); }
  el.textContent = t; el.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2600);
}

bodyEl.addEventListener("click", async (e) => {
  if (!room) return;
  if (e.target.closest("#lvReady")) {
    const d = room.data || {}, { db, m } = fb;
    m.set(m.ref(db, "salas/" + room.code + "/j/" + room.slot + "/listo"), (d.ronda || 0) + 1).catch(() => {});
    return;
  }
  if (e.target.closest("#lvInvite")) { room.view = "sala"; render(); return; }
  if (e.target.closest("#lvShareNative")) {
    navigator.share({ title: "Els Panets en directo", text: "¡Juega conmigo en directo a Els Panets! Código " + room.code, url: linkFor(room.code) }).catch(() => {});
    return;
  }
  if (e.target.closest("#lvCopy")) {
    const url = linkFor(room.code), msg = $("lvCopyMsg");
    try { await navigator.clipboard.writeText(url); msg.textContent = "Enlace copiado. Pégalo donde quieras."; msg.classList.add("ok"); }
    catch (err) { msg.textContent = url; msg.classList.remove("ok"); }
  }
});
$("liveLeave").addEventListener("click", () => leave());

// ---------- pestaña «En directo» de Retos ----------
function renderTab(box, preset) {
  const name = EP.settings().nombre;
  box.innerHTML = `<p class="rtInfo">Jugad <b>a la vez</b>, cada uno en su móvil, por las mismas columnas. Verás a tu amigo volar a tu lado y gana quien llegue más lejos.</p>
    ${name ? "" : '<input id="lvName" class="lvName" type="text" maxlength="12" autocomplete="off" placeholder="Tu nombre (lo verá tu amigo)" />'}
    <button type="button" id="lvCreate" class="bigBtn">Crear sala e invitar</button>
    <p class="rtInfo">¿Te han invitado? Escribe el código:</p>
    <div class="rtCode"><input id="lvCodeIn" type="text" maxlength="5" autocomplete="off" placeholder="ABCDE" value="${esc(preset || "")}" /><button type="button" id="lvJoin" class="bigBtn">Entrar</button></div>
    <p id="lvMsg" class="formMsg"></p>`;
  if (room) $("lvMsg").textContent = "Ya estás en la sala " + room.code + ".";
}
function needName() {
  if (EP.settings().nombre) return true;
  const el = $("lvName"), msg = $("lvMsg"), v = el ? el.value.trim() : "";
  const bad = !v ? "Escribe tu nombre para que tu amigo sepa quién eres." : EP.nameProblem(v);
  if (bad) { msg.textContent = bad; if (el) el.focus(); return false; }
  EP.setPlayerName(v);
  return true;
}
document.addEventListener("click", async (e) => {
  const c = e.target.closest("#lvCreate, #lvJoin");
  if (!c) return;
  const msg = $("lvMsg");
  if (room) { show(); return; }
  if (!needName()) return;
  c.disabled = true;
  try {
    if (c.id === "lvCreate") { msg.textContent = "Creando la sala…"; await createRoom(); msg.textContent = ""; }
    else { msg.textContent = "Buscando la sala…"; const err = await joinRoom($("lvCodeIn").value); msg.textContent = err; }
  } catch (err) { msg.textContent = "No se pudo conectar. Revisa la conexión."; }
  c.disabled = false;
});

// el botón «atrás» con la ventana abierta: salir de la sala
window.ElsPanetsLive = { back: () => leave(), inRoom: () => !!room };
UI.openLive = () => { if (room) show(); };
UI.renderLiveTab = renderTab;

// ¿se ha abierto el juego con un enlace de sala? (?sala=ABCDE)
const linkCode = new URLSearchParams(location.search).get("sala");
if (linkCode) setTimeout(async () => {
  if (EP.settings().nombre) {
    toast("Entrando en la sala " + linkCode.toUpperCase() + "…");
    let err = "";
    try { err = await joinRoom(linkCode); } catch (e) { err = "No se pudo conectar. Revisa la conexión."; }
    if (err) { toast(err); if (UI.openRetos) UI.openRetos("directo", linkCode); }
  } else if (UI.openRetos) UI.openRetos("directo", linkCode);
}, 2200);
