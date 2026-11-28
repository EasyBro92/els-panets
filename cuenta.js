// Cuentas de Els Panets (23/11/2026): usuario y contraseña, sin correo.
// Firebase Auth no está disponible en este proyecto (pide facturación), así que va con Firestore:
// - La contraseña nunca sale del móvil: de ella se saca una «clave» larga (PBKDF2).
// - elsPanetsCuentas/{usuario}: huella de la clave y del código de recuperación. Nadie la puede leer.
// - elsPanetsSellos/{usuario}: cada escritura manda aquí la clave y las reglas la comprueban.
// - elsPanetsAcceso/{huella}: de la clave (o del código) se llega a la partida guardada.
// - elsPanetsPartidas/{id}: el progreso. elsPanetsUsuarios/{usuario}: el perfil público.
// Las reglas están en apk/llave/firestore.rules (fuera de git).
const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const DB_URL = "https://mr-taco-president-default-rtdb.europe-west1.firebasedatabase.app";
const EP = window.ElsPanets, UI = window.ElsPanetsUI;
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
const ov = $("cuentaOverlay"), bodyEl = $("cuBody"), titleEl = $("cuTitle");
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const withT = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("sin-red")), ms || 12000))]);
const T = { U: "elsPanetsUsuarios", C: "elsPanetsCuentas", S: "elsPanetsSellos", A: "elsPanetsAcceso", P: "elsPanetsPartidas" };
const SES_KEY = "elsPanetsCuenta", BASE_KEY = "elsPanetsCuentaBase", FRIENDS_KEY = "elsPanetsAmigos", DUEL_KEY = "elsPanetsDuelos", DUEL_DAY_KEY = "elsPanetsDuelosHoy";

// ---------- qué se guarda en la cuenta y cómo se junta entre móviles ----------
const SPEND_KEY = "elsPanetsHucha", RANK_KEY = "elsPanetsLlave";
const MAX_KEYS = ["elsPanetsBest", "elsPanetsBestComidas"];
const DEEP_KEYS = ["elsPanetsCosas", "elsPanetsFamosos", "elsPanetsMejoras", "elsPanetsLogros", "elsPanetsHistoria", "elsPanetsDatos", DUEL_KEY];
const LAST_KEYS = ["elsPanetsPlayerName", "elsPanetsCharacter", "elsPanetsPuesto", "elsPanetsPropio", "elsPanetsDiario", FRIENDS_KEY, RANK_KEY];
const isSynced = (k) => k === SPEND_KEY || MAX_KEYS.includes(k) || DEEP_KEYS.includes(k) || LAST_KEYS.includes(k) || k.startsWith("elsPanetsRopa_");
function readAll() {
  const o = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && isSynced(k)) o[k] = localStorage.getItem(k); } } catch (e) {}
  return o;
}
function deepMax(a, b) {
  if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
  if (Array.isArray(a) && Array.isArray(b)) return a.length >= b.length ? a : b;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const o = Object.assign({}, a);
    for (const k of Object.keys(b)) o[k] = k in a ? deepMax(a[k], b[k]) : b[k];
    return o;
  }
  return a === undefined || a === null ? b : a;
}
// L: este móvil, C: la nube, B: cómo estaba la última vez que se juntaron (null: es la primera vez)
function mergeAll(L, C, B) {
  const out = {};
  for (const k of new Set([...Object.keys(L), ...Object.keys(C)])) {
    const l = L[k], c = C[k], b = B ? B[k] : undefined;
    if (l === undefined) { out[k] = c; continue; }
    if (c === undefined) { out[k] = l; continue; }
    if (k === SPEND_KEY) {
      // lo ganado o gastado en este móvil desde la última vez se aplica sobre la nube
      out[k] = String(B ? Math.max(0, (Number(c) || 0) + (Number(l) || 0) - (Number(b) || 0)) : Math.max(Number(l) || 0, Number(c) || 0));
    } else if (MAX_KEYS.includes(k)) out[k] = String(Math.max(Number(l) || 0, Number(c) || 0));
    else if (DEEP_KEYS.includes(k)) {
      try { out[k] = JSON.stringify(deepMax(JSON.parse(l), JSON.parse(c))); } catch (e) { out[k] = l; }
    } else out[k] = !B || l === b ? c : l; // si aquí no ha cambiado, manda la nube
  }
  return out;
}
const canon = (o) => JSON.stringify(Object.keys(o).sort().reduce((r, k) => { r[k] = o[k]; return r; }, {}));

// ---------- Firebase y claves ----------
let fsdb = null;
async function fire() {
  if (fsdb) return fsdb;
  // en las pruebas del ordenador se puede usar una base de datos de mentira
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (window.__cuentaFake || sessionStorage.getItem("cuentaFake"))) {
    while (!window.__cuentaFake) await new Promise((r) => setTimeout(r, 50));
    return (fsdb = window.__cuentaFake);
  }
  const [a, m] = await withT(Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-firestore.js")]), 15000);
  const app = a.getApps()[0];
  if (!app) throw new Error("sin-red");
  fsdb = { db: m.getFirestore(app), m };
  return fsdb;
}
const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
async function sha(t) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))); }
async function derive(u, pass) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode("elsPanets|cuenta|" + u), iterations: 150000 }, key, 256));
}
const randHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(r, (b) => A[b % A.length]).join("");
}
const showCode = (c) => c.replace(/(.{4})(?=.)/g, "$1-");
const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const normUser = (n) => String(n || "").trim().toLowerCase();
const userProblem = (n) => {
  const t = String(n || "").trim();
  if (!/^[A-Za-z0-9_]{3,12}$/.test(t)) return "De 3 a 12 letras o números, sin tildes ni espacios.";
  return EP.nameProblem(t) || "";
};

// ---------- la sesión ----------
function ses() {
  try { const s = JSON.parse(ls.get(SES_KEY) || "null"); return s && s.u && s.clave && s.sid ? s : null; } catch (e) { return null; }
}
const setSes = (s) => ls.set(SES_KEY, JSON.stringify(s));
const readJ = (k, d) => { try { return JSON.parse(ls.get(k) || "null") || d; } catch (e) { return d; } };
const duels = () => { const d = readJ(DUEL_KEY, {}); return { w: Number(d.w) || 0, l: Number(d.l) || 0, e: Number(d.e) || 0 }; };
const friends = () => { const f = readJ(FRIENDS_KEY, []); return Array.isArray(f) ? f : []; };
function perfil(m, s) {
  const p = EP.playerInfo(), d = duels();
  const o = { n: s.n, c: String(ls.get("elsPanetsCharacter") || p.char || "gris").slice(0, 24), best: Math.max(0, Math.min(9999, Math.floor(Number(ls.get("elsPanetsBest")) || 0))), w: d.w, l: d.l, ts: m.serverTimestamp() };
  if (p.flag) o.f = String(p.flag).slice(0, 8);
  return o;
}

// ---------- guardar en la nube ----------
let syncing = false, again = false, softT = 0, reloadWait = 0;
function reloadWhenIdle() {
  clearInterval(reloadWait);
  reloadWait = setInterval(() => {
    const live = window.ElsPanetsLive && window.ElsPanetsLive.inRoom();
    if (!document.body.classList.contains("enJuego") && !UI.isOpen() && !live) { clearInterval(reloadWait); location.reload(); }
  }, 1500);
}
async function sync(first) {
  const s = ses();
  if (!s) return false;
  if (syncing) { again = true; return false; }
  syncing = true;
  try {
    const { db, m } = await fire();
    const snap = await withT(m.getDoc(m.doc(db, T.P, s.sid)));
    if (!snap.exists()) { ls.del(SES_KEY); ls.del(BASE_KEY); return false; } // se borró desde otro móvil: lo de aquí se queda
    const row = snap.data();
    let cloud = {};
    try { cloud = JSON.parse(row.d || "{}"); } catch (e) {}
    const L = readAll(), B = first ? null : readJ(BASE_KEY, null), M = mergeAll(L, cloud, B);
    // si la cuenta ya tenía su llave de ranking, se quita la ficha que este móvil tenía por su cuenta
    if (L[RANK_KEY] && M[RANK_KEY] && L[RANK_KEY] !== M[RANK_KEY] && window.TacoLeaderboard) { try { await window.TacoLeaderboard.deleteMyData(); } catch (e) {} }
    const changed = Object.keys(M).some((k) => M[k] !== L[k]);
    for (const k of Object.keys(M)) if (M[k] !== L[k]) ls.set(k, M[k]);
    const out = canon(M);
    let pushed = true;
    if (out !== canon(cloud)) {
      try {
        const b = m.writeBatch(db);
        b.set(m.doc(db, T.S, s.u), { clave: s.clave, ts: m.serverTimestamp() });
        b.set(m.doc(db, T.P, s.sid), { u: s.u, a: row.a, r: row.r, d: out, ts: m.serverTimestamp() });
        b.set(m.doc(db, T.U, s.u), perfil(m, s));
        await withT(b.commit());
      } catch (e) { pushed = false; }
    }
    ls.set(BASE_KEY, JSON.stringify(pushed ? M : cloud));
    if (changed && !first) reloadWhenIdle();
    return pushed;
  } catch (e) { return false; }
  finally {
    syncing = false;
    if (again) { again = false; soon(); }
  }
}
function soon(ms) { if (!ses()) return; clearTimeout(softT); softT = setTimeout(() => sync(false), ms == null ? 15000 : ms); }
function endLocal() {
  const keys = Object.keys(readAll());
  for (const k of keys) ls.del(k);
  ls.del(SES_KEY); ls.del(BASE_KEY); ls.del(DUEL_DAY_KEY);
  location.reload();
}

// ---------- entrar, crear, recuperar ----------
async function register(name, pass, pass2) {
  const prob = userProblem(name);
  if (prob) return prob;
  if (String(pass).length < 6) return "La contraseña necesita al menos 6 letras o números.";
  if (pass !== pass2) return "Las dos contraseñas no coinciden.";
  if (!crypto.subtle) return "Este navegador no permite crear cuentas.";
  const n = String(name).trim(), u = normUser(n), { db, m } = await fire();
  if ((await withT(m.getDoc(m.doc(db, T.U, u)))).exists()) return "Ese nombre ya está cogido. Prueba con otro.";
  EP.setPlayerName(n);
  const clave = await derive(u, pass), rec = newCode(), sid = randHex(16);
  const [h, rh, aid, rid] = await Promise.all([sha(clave), sha(rec), sha("a|" + clave), sha("r|" + rec)]);
  const s = { u, n, clave, sid }, data = readAll(), ts = m.serverTimestamp(), b = m.writeBatch(db);
  b.set(m.doc(db, T.C, u), { h, r: rh, ts });
  b.set(m.doc(db, T.U, u), perfil(m, s));
  b.set(m.doc(db, T.S, u), { clave, ts });
  b.set(m.doc(db, T.A, aid), { s: sid, u });
  b.set(m.doc(db, T.A, rid), { s: sid, u });
  b.set(m.doc(db, T.P, sid), { u, a: aid, r: rid, d: canon(data), ts });
  try { await withT(b.commit()); } catch (e) { return /permission/i.test(String(e && (e.code || e.message))) ? "Ese nombre ya está cogido. Prueba con otro." : "No se pudo crear la cuenta. Revisa la conexión."; }
  setSes(s);
  ls.set(BASE_KEY, JSON.stringify(data));
  view = "codigo"; newRec = rec;
  render();
  return "";
}
async function login(name, pass) {
  const u = normUser(name);
  if (!u || !pass) return "Escribe tu usuario y tu contraseña.";
  const bad = "Usuario o contraseña incorrectos.";
  if (!/^[a-z0-9_]{3,12}$/.test(u)) return bad;
  if (!crypto.subtle) return "Este navegador no permite entrar.";
  const { db, m } = await fire(), clave = await derive(u, pass), aid = await sha("a|" + clave);
  const a = await withT(m.getDoc(m.doc(db, T.A, aid)));
  if (!a.exists() || a.data().u !== u) return bad;
  const pu = await withT(m.getDoc(m.doc(db, T.U, u)));
  setSes({ u, n: pu.exists() ? pu.data().n : u, clave, sid: a.data().s });
  ls.del(BASE_KEY);
  const ok = await sync(true);
  if (!ok) { ls.del(SES_KEY); return "No se pudo cargar tu partida. Revisa la conexión."; }
  location.reload();
  return "";
}
async function setPass(u, proof, sid, oldAid, rid, d, pass) {
  const { db, m } = await fire(), clave = await derive(u, pass);
  const [h, aid] = await Promise.all([sha(clave), sha("a|" + clave)]);
  const ts = m.serverTimestamp(), b = m.writeBatch(db);
  b.update(m.doc(db, T.C, u), { h, p: proof, ts });
  b.set(m.doc(db, T.S, u), { clave, ts });
  if (aid !== oldAid) { b.set(m.doc(db, T.A, aid), { s: sid, u }); b.delete(m.doc(db, T.A, oldAid)); }
  b.set(m.doc(db, T.P, sid), { u, a: aid, r: rid, d, ts });
  await withT(b.commit());
  return clave;
}
async function recover(name, code, pass, pass2) {
  const u = normUser(name), rec = normCode(code);
  const bad = "Usuario o código incorrectos.";
  if (!/^[a-z0-9_]{3,12}$/.test(u) || rec.length !== 16) return bad;
  if (String(pass).length < 6) return "La contraseña nueva necesita al menos 6 letras o números.";
  if (pass !== pass2) return "Las dos contraseñas no coinciden.";
  const { db, m } = await fire(), rid = await sha("r|" + rec);
  const a = await withT(m.getDoc(m.doc(db, T.A, rid)));
  if (!a.exists() || a.data().u !== u) return bad;
  const sid = a.data().s, row = await withT(m.getDoc(m.doc(db, T.P, sid)));
  if (!row.exists()) return bad;
  const clave = await setPass(u, rec, sid, row.data().a, rid, row.data().d, pass);
  const pu = await withT(m.getDoc(m.doc(db, T.U, u)));
  setSes({ u, n: pu.exists() ? pu.data().n : u, clave, sid });
  ls.del(BASE_KEY);
  await sync(true);
  location.reload();
  return "";
}
async function changePass(oldPass, pass, pass2) {
  const s = ses();
  if (String(pass).length < 6) return "La contraseña nueva necesita al menos 6 letras o números.";
  if (pass !== pass2) return "Las dos contraseñas no coinciden.";
  const old = await derive(s.u, oldPass);
  if (old !== s.clave) return "La contraseña actual no es esa.";
  const { db, m } = await fire(), row = await withT(m.getDoc(m.doc(db, T.P, s.sid)));
  if (!row.exists()) return "No se encuentra tu cuenta.";
  s.clave = await setPass(s.u, old, s.sid, row.data().a, row.data().r, row.data().d, pass);
  setSes(s);
  return "";
}
async function logout() {
  while (syncing) await new Promise((r) => setTimeout(r, 100));
  if (!(await sync(false))) return "No hay conexión: si sales ahora perderías lo último. Prueba cuando tengas internet.";
  endLocal();
  return "";
}
// borra la cuenta de internet (lo llama también «Borrar mis datos»)
async function deleteAccount() {
  const s = ses();
  if (!s) return;
  const { db, m } = await fire(), row = await withT(m.getDoc(m.doc(db, T.P, s.sid)));
  const b = m.writeBatch(db);
  b.set(m.doc(db, T.S, s.u), { clave: s.clave, ts: m.serverTimestamp() });
  b.delete(m.doc(db, T.U, s.u));
  if (row.exists()) {
    if (row.data().a) b.delete(m.doc(db, T.A, row.data().a));
    if (row.data().r) b.delete(m.doc(db, T.A, row.data().r));
    b.delete(m.doc(db, T.P, s.sid));
  }
  await withT(b.commit());
  await withT(m.deleteDoc(m.doc(db, T.C, s.u)));
  await withT(m.deleteDoc(m.doc(db, T.S, s.u))).catch(() => {});
  ls.del(SES_KEY); ls.del(BASE_KEY);
}

// ---------- duelos en directo: victorias y premio ----------
const DUEL_PAY = { w: 15, l: 5, e: 8 }, DUEL_MAX_DAY = 10;
function duelo(r) {
  const d = duels();
  d[r] = (d[r] || 0) + 1;
  ls.set(DUEL_KEY, JSON.stringify(d));
  const day = new Date().toISOString().slice(0, 10), st = readJ(DUEL_DAY_KEY, {});
  const n = st.day === day ? st.n || 0 : 0;
  let pay = 0;
  if (n < DUEL_MAX_DAY) { pay = DUEL_PAY[r] || 0; EP.addHucha(pay); ls.set(DUEL_DAY_KEY, JSON.stringify({ day, n: n + 1 })); }
  soon(2000);
  return pay;
}

// ---------- la ventana ----------
let view = "entrar", newRec = "";
const rowInput = (id, ph, type) => `<input id="${id}" class="cuIn" type="${type || "text"}" maxlength="${type === "password" ? 40 : 19}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${ph}" />`;
function render() {
  const s = ses();
  if (s && ["entrar", "crear", "olvido"].includes(view)) view = "perfil";
  if (!s && !["entrar", "crear", "olvido"].includes(view)) view = "entrar";
  if (view === "entrar") {
    titleEl.textContent = "Iniciar sesión";
    bodyEl.innerHTML = `<p class="rtInfo">Guarda tu partida y juega en cualquier móvil sin perder nada.</p>
      ${rowInput("cuU", "Usuario")}${rowInput("cuP", "Contraseña", "password")}
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="bigBtn" data-do="login">Entrar</button>
      <button type="button" class="ghostBtn" data-go="crear">Crear una cuenta</button>
      <button type="button" class="cuLink" data-go="olvido">He olvidado la contraseña</button>`;
  } else if (view === "crear") {
    titleEl.textContent = "Crear cuenta";
    bodyEl.innerHTML = `<p class="rtInfo">Solo un nombre y una contraseña, sin correo. Lo que ya llevas jugado se guarda en tu cuenta.</p>
      ${rowInput("cuU", "Nombre de usuario (3 a 12)")}${rowInput("cuP", "Contraseña (mínimo 6)", "password")}${rowInput("cuP2", "Repite la contraseña", "password")}
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="bigBtn" data-do="register">Crear cuenta</button>
      <button type="button" class="ghostBtn" data-go="entrar">Ya tengo cuenta</button>`;
  } else if (view === "olvido") {
    titleEl.textContent = "Recuperar cuenta";
    bodyEl.innerHTML = `<p class="rtInfo">Escribe el <b>código de recuperación</b> que te dimos al crear la cuenta.</p>
      ${rowInput("cuU", "Usuario")}${rowInput("cuC", "XXXX-XXXX-XXXX-XXXX")}${rowInput("cuP", "Contraseña nueva", "password")}${rowInput("cuP2", "Repite la contraseña", "password")}
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="bigBtn" data-do="recover">Cambiar contraseña</button>
      <button type="button" class="ghostBtn" data-go="entrar">Volver</button>`;
  } else if (view === "codigo") {
    titleEl.textContent = "¡Cuenta creada!";
    bodyEl.innerHTML = `<p class="rtInfo"><b>Guarda este código.</b> Es la única forma de recuperar tu cuenta si olvidas la contraseña. No se volverá a enseñar.</p>
      <div class="cuCode">${esc(showCode(newRec))}</div>
      <button type="button" class="ghostBtn" data-do="copy">Copiar código</button>
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="bigBtn" data-go="perfil">Ya lo he guardado</button>`;
  } else if (view === "perfil") {
    const d = duels(), i = Math.max(0, EP.current());
    titleEl.textContent = "Tu cuenta";
    bodyEl.innerHTML = `<div class="cuProfile"><canvas width="150" height="150" id="cuAvatar"></canvas><div><b>${esc(s.n)}</b>
        <span>Récord: <i>${EP.best()}</i></span><span>Duelos: <i>${d.w}</i> ganados · <i>${d.l}</i> perdidos</span></div></div>
      <p class="cuSaved">✓ Tu partida se guarda sola en tu cuenta</p>
      <button type="button" class="bigBtn" data-go="amigos">Amigos</button>
      <button type="button" class="ghostBtn" data-go="duelos">Ranking de duelos</button>
      <div class="cuRow"><button type="button" class="ghostBtn" data-go="clave">Contraseña</button><button type="button" class="ghostBtn" data-do="logout">Cerrar sesión</button></div>
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="cuLink" data-go="borrar">Borrar mi cuenta</button>`;
    EP.drawCharTo($("cuAvatar"), i);
  } else if (view === "clave") {
    titleEl.textContent = "Cambiar contraseña";
    bodyEl.innerHTML = `${rowInput("cuO", "Contraseña actual", "password")}${rowInput("cuP", "Contraseña nueva", "password")}${rowInput("cuP2", "Repite la nueva", "password")}
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="bigBtn" data-do="change">Cambiar</button><button type="button" class="ghostBtn" data-go="perfil">Volver</button>`;
  } else if (view === "borrar") {
    titleEl.textContent = "Borrar cuenta";
    bodyEl.innerHTML = `<p class="rtInfo">Se borrarán tu cuenta y tu partida guardada, también en este móvil, incluidos los famosos conseguidos.</p><p class="rtInfo"><b>No se puede deshacer.</b></p>
      <p id="cuMsg" class="formMsg"></p>
      <button type="button" class="bigBtn dangerBtn" data-do="delete">Sí, borrar mi cuenta</button><button type="button" class="ghostBtn" data-go="perfil">No, volver</button>`;
  } else if (view === "amigos") renderFriends();
  else if (view === "duelos") renderDuels();
}
const avatarIdx = (id) => { const i = EP.charIndexOf(id), c = EP.charList().find((x) => x.id === id); return i >= 0 && c && !c.custom ? i : 0; };
function paintAvatars() { for (const cv of bodyEl.querySelectorAll("canvas[data-ci]")) { try { EP.drawCharTo(cv, Number(cv.dataset.ci) || 0); } catch (e) {} } }
async function renderFriends() {
  titleEl.textContent = "Amigos";
  const list = friends();
  bodyEl.innerHTML = `<div class="rtCode"><input id="cuAdd" type="text" maxlength="12" autocomplete="off" autocapitalize="off" placeholder="Su usuario" /><button type="button" class="bigBtn" data-do="addFriend">Añadir</button></div>
    <p id="cuMsg" class="formMsg"></p><div id="cuFriends" class="cuList">${list.length ? '<div class="aEmpty">Cargando…</div>' : '<div class="aEmpty">Añade a tus amigos por su usuario. Para que te lleguen sus retos, añadíos los dos.</div>'}</div>
    <button type="button" class="ghostBtn" data-go="perfil">Volver</button>`;
  if (!list.length) return;
  try {
    const { db, m } = await fire();
    const rows = await withT(Promise.all(list.map((u) => m.getDoc(m.doc(db, T.U, u)).then((d) => [u, d.exists() ? d.data() : null]).catch(() => [u, null]))));
    if (view !== "amigos") return;
    $("cuFriends").innerHTML = rows.map(([u, p]) => `<div class="cuFr"><canvas width="84" height="84" data-ci="${avatarIdx(p && p.c)}"></canvas><div><b>${esc(p ? p.n : u)}</b><small>${p ? `Récord ${p.best} · ${p.w} victorias` : "Ya no existe"}</small></div>
      ${p ? `<button type="button" class="cuGo" data-reta="${esc(u)}">Retar</button>` : ""}<button type="button" class="cuX" data-quita="${esc(u)}" aria-label="Quitar">✕</button></div>`).join("");
    paintAvatars();
  } catch (e) { if ($("cuFriends")) $("cuFriends").innerHTML = '<div class="aEmpty">No se pudo cargar. Revisa la conexión.</div>'; }
}
async function renderDuels() {
  titleEl.textContent = "Ranking de duelos";
  bodyEl.innerHTML = `<p class="rtInfo">Quién ha ganado más partidas en directo.</p><div id="cuTop" class="rtTop"><div class="aEmpty">Cargando…</div></div><button type="button" class="ghostBtn" data-go="perfil">Volver</button>`;
  try {
    const { db, m } = await fire(), me = ses().u;
    const q = await withT(m.getDocs(m.query(m.collection(db, T.U), m.orderBy("w", "desc"), m.limit(20))));
    if (view !== "duelos") return;
    const rows = []; q.forEach((d) => rows.push([d.id, d.data()]));
    $("cuTop").innerHTML = rows.some((r) => r[1].w > 0) ? "<ol>" + rows.filter((r) => r[1].w > 0).map(([id, p], i) => `<li class="${id === me ? "me" : ""}"><span>${i + 1}</span>${p.f && EP.flagImg ? EP.flagImg(p.f) : ""}<b>${esc(p.n)}</b><i>${p.w}</i></li>`).join("") + "</ol>"
      : '<div class="aEmpty">Aún nadie ha ganado un duelo. ¡Sé el primero!</div>';
  } catch (e) { if ($("cuTop")) $("cuTop").innerHTML = '<div class="aEmpty">No se pudo cargar. Revisa la conexión.</div>'; }
}
async function addFriend() {
  const msg = $("cuMsg"), u = normUser($("cuAdd").value), s = ses(), list = friends();
  msg.classList.remove("ok");
  if (!/^[a-z0-9_]{3,12}$/.test(u)) { msg.textContent = "Escribe su usuario."; return; }
  if (u === s.u) { msg.textContent = "Ese eres tú."; return; }
  if (list.includes(u)) { msg.textContent = "Ya lo tienes en tus amigos."; return; }
  if (list.length >= 30) { msg.textContent = "Ya tienes 30 amigos, el máximo."; return; }
  msg.textContent = "Buscando…";
  try {
    const { db, m } = await fire();
    if (!(await withT(m.getDoc(m.doc(db, T.U, u)))).exists()) { msg.textContent = "No hay nadie con ese usuario."; return; }
    ls.set(FRIENDS_KEY, JSON.stringify(list.concat(u)));
    soon(1000);
    renderFriends();
    // 28/11/2026: los retos solo llegan entre amigos de los dos lados; que se sepa en el momento
    const ok = $("cuMsg"); if (ok) { ok.classList.add("ok"); ok.textContent = "¡Añadido! Para que le lleguen tus retos, " + u + " también tiene que añadirte: tu usuario es " + s.u + "."; }
  } catch (e) { msg.textContent = "No se pudo buscar. Revisa la conexión."; }
}

bodyEl.addEventListener("click", async (e) => {
  const go = e.target.closest("[data-go]");
  if (go) { view = go.dataset.go; EP.sfx("click"); render(); return; }
  const qt = e.target.closest("[data-quita]");
  if (qt) { ls.set(FRIENDS_KEY, JSON.stringify(friends().filter((u) => u !== qt.dataset.quita))); soon(1000); renderFriends(); return; }
  const rt = e.target.closest("[data-reta]");
  if (rt) {
    rt.disabled = true;
    const msg = $("cuMsg");
    try { ov.classList.add("hidden"); await window.ElsPanetsLive.inviteFriend(rt.dataset.reta, ses().u); }
    catch (err) { ov.classList.remove("hidden"); if (msg) msg.textContent = "No se pudo conectar. Revisa la conexión."; rt.disabled = false; }
    return;
  }
  const b = e.target.closest("[data-do]");
  if (!b) return;
  const act = b.dataset.do, msg = $("cuMsg"), v = (id) => ($(id) ? $(id).value : "");
  if (act === "copy") { try { await navigator.clipboard.writeText(showCode(newRec)); msg.textContent = "Código copiado."; msg.classList.add("ok"); } catch (err) { msg.textContent = "Cópialo a mano."; } return; }
  if (act === "addFriend") { addFriend(); return; }
  b.disabled = true;
  msg.classList.remove("ok");
  msg.textContent = "Un momento…";
  let err = "";
  try {
    if (act === "login") err = await login(v("cuU"), v("cuP"));
    else if (act === "register") err = await register(v("cuU"), v("cuP"), v("cuP2"));
    else if (act === "recover") err = await recover(v("cuU"), v("cuC"), v("cuP"), v("cuP2"));
    else if (act === "change") { err = await changePass(v("cuO"), v("cuP"), v("cuP2")); if (!err) { view = "perfil"; render(); return; } }
    else if (act === "logout") err = await logout();
    else if (act === "delete") { await deleteAccount(); endLocal(); return; }
  } catch (x) { err = "No se pudo conectar. Revisa la conexión."; }
  if ($("cuMsg")) $("cuMsg").textContent = err;
  if (b.isConnected) b.disabled = false;
});
$("cuClose").addEventListener("click", () => ov.classList.add("hidden"));
function open(v) { view = v || (ses() ? "perfil" : "entrar"); render(); ov.classList.remove("hidden"); }

// ---------- aviso de reto de un amigo ----------
let inviteEl = null, invFrom = "";
const delInvite = (u, from) => fetch(DB_URL + "/invita/" + u + "/" + from + ".json", { method: "DELETE" }).catch(() => {});
function showInvite(from, code) {
  const s = ses();
  if (!s || invFrom === from) return;
  invFrom = from;
  if (!inviteEl) { inviteEl = document.createElement("div"); inviteEl.className = "cuInvite"; document.body.appendChild(inviteEl); }
  inviteEl.innerHTML = `<b>${esc(from)}</b> te reta en directo<div><button type="button" data-a="1">Jugar</button><button type="button" data-a="0">Ahora no</button></div>`;
  inviteEl.classList.add("on");
  EP.sfx("power");
  inviteEl.onclick = async (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    inviteEl.classList.remove("on");
    delInvite(s.u, from);
    invFrom = "";
    if (b.dataset.a === "1") window.ElsPanetsLive.join(code);
  };
}
async function pollInvites() {
  const s = ses();
  if (!s || document.hidden || document.body.classList.contains("enJuego") || UI.isOpen() || invFrom) return;
  const fr = friends();
  if (!fr.length || (window.ElsPanetsLive && window.ElsPanetsLive.inRoom())) return;
  try {
    const r = await fetch(DB_URL + "/invita/" + s.u + ".json");
    if (!r.ok) return;
    const data = await r.json();
    if (!data) return;
    for (const from of Object.keys(data)) {
      const v = data[from];
      if (!v || !v.c || !fr.includes(from) || Date.now() - v.t > 120000) { delInvite(s.u, from); continue; }
      showInvite(from, v.c);
      break;
    }
  } catch (e) {}
}

// ---------- al abrir el juego ----------
for (const ev of ["partidaFin", "famoso", "caja", "diario", "mejora"]) EP.on(ev, () => soon());
document.addEventListener("visibilitychange", () => { if (document.hidden && ses()) { clearTimeout(softT); sync(false); } });
if (ses()) setTimeout(() => sync(false), 1800);
setInterval(pollInvites, 20000);

window.ElsPanetsCuenta = { user: () => { const s = ses(); return s ? s.u : null; }, name: () => { const s = ses(); return s ? s.n : null; }, open, sync, duelo, deleteAccount, _merge: mergeAll };
