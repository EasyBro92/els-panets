// Conexión con Firestore de Els Panets. Módulo independiente: si falla o no hay
// red, el juego sigue funcionando con el récord del móvil.
// 16/11/2026 (v29): ranking propio (elsPanetsRanking) con llave secreta por móvil,
// ranking guardado 10 minutos, tiempo de pantalla cada 3 minutos y «Borrar mis datos».
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  deleteField,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  increment,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2XzA7Txyki7N7JjOFRWWDWcd5nqA0ePc",
  authDomain: "mr-taco-president.firebaseapp.com",
  projectId: "mr-taco-president",
  storageBucket: "mr-taco-president.firebasestorage.app",
  messagingSenderId: "519280686207",
  appId: "1:519280686207:web:ec38986746affc39607b4a",
  measurementId: "G-702FRW788W",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const randomHex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
const online = () => navigator.onLine !== false;
// si la red no contesta, no se espera para siempre
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("sin-red")), ms || 10000))]);

// SHA-256 sin esperas (el del navegador no funciona fuera de https)
const sha256hex = (() => {
  const K = [], H0 = [], ror = (x, n) => (x >>> n) | (x << (32 - n));
  const frac = (x) => ((x - Math.floor(x)) * 4294967296) | 0;
  for (let n = 2, c = 0; c < 64; n++) {
    let prime = true;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) { prime = false; break; }
    if (!prime) continue;
    if (c < 8) H0[c] = frac(Math.sqrt(n));
    K[c++] = frac(Math.cbrt(n));
  }
  return (text) => {
    const m = new TextEncoder().encode(text), total = ((m.length + 9 + 63) >> 6) << 6;
    const bytes = new Uint8Array(total), dv = new DataView(bytes.buffer), h = H0.slice(), w = new Int32Array(64);
    bytes.set(m); bytes[m.length] = 0x80; dv.setUint32(total - 4, m.length * 8);
    for (let o = 0; o < total; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getInt32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const x = w[i - 15], y = w[i - 2];
        w[i] = (w[i - 16] + (ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)) + w[i - 7] + (ror(y, 17) ^ ror(y, 19) ^ (y >>> 10))) | 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
      for (let i = 0; i < 64; i++) {
        const t1 = (k + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + k) | 0;
    }
    return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  };
})();

// ---------- Ranking de Els Panets ----------
// Cada móvil tiene una llave secreta que no sale de él. Su ficha del ranking se
// llama como la huella de esa llave, y para escribirla hay que mandar la llave en
// el mismo lote, a un documento que nadie puede leer. Sin la llave no se puede
// pisar el récord ni el nombre de otro (lo comprueban las reglas de Firestore).
const RANKING = "elsPanetsRanking", LLAVES = "elsPanetsLlaves";
const KEY_KEY = "elsPanetsLlave";
function secretKey() {
  let k = ls.get(KEY_KEY);
  if (!k || k.length < 32) { k = randomHex(24); ls.set(KEY_KEY, k); }
  return k;
}
let idCache = null;
function myId() {
  const k = secretKey();
  if (!idCache || idCache[0] !== k) idCache = [k, sha256hex(k)];
  return idCache[1];
}

// Número privado de este móvil (no sale en el ranking): con él se guarda su tiempo de pantalla.
const PRIVATE_KEY = "elsPanetsIdPrivado";
function privateId() {
  let id = ls.get(PRIVATE_KEY);
  if (!id) { id = "ep" + randomHex(16); ls.set(PRIVATE_KEY, id); }
  return id;
}

// El ranking se guarda 10 minutos en el móvil para no gastar lecturas.
const RANK_CACHE = "elsPanetsRankingCache", RANK_TTL = 10 * 60 * 1000, TOP = 50;
let rankMem = null, rankBusy = null;
function readRankCache() {
  if (rankMem) return rankMem;
  try { const c = JSON.parse(ls.get(RANK_CACHE) || "null"); if (c && Array.isArray(c.rows)) rankMem = c; } catch (e) {}
  return rankMem;
}
function saveRankCache(rows, at) { rankMem = { at, rows }; ls.set(RANK_CACHE, JSON.stringify(rankMem)); }
// Devuelve los 50 mejores. Sin conexión, lo último guardado.
function ranking(force) {
  const c = readRankCache();
  if (c && !force && Date.now() - c.at < RANK_TTL && Date.now() >= c.at) return Promise.resolve(c.rows);
  if (rankBusy) return rankBusy;
  rankBusy = (async () => {
    try {
      const snap = await withTimeout(getDocs(query(collection(db, RANKING), orderBy("score", "desc"), limit(TOP))));
      const rows = snap.docs.map((d) => { const x = d.data(); return { id: d.id, name: String(x.name || ""), score: Number(x.score) || 0, flag: x.flag ? String(x.flag) : "" }; });
      saveRankCache(rows, Date.now());
      return rows;
    } catch (e) {
      if (c) return c.rows;
      throw e;
    } finally { rankBusy = null; }
  })();
  return rankBusy;
}
const cachedRanking = () => { const c = readRankCache(); return c ? c.rows : null; };
// tras enviar el récord propio, se apunta en lo guardado sin volver a leer
function patchRankCache(row) {
  const c = readRankCache();
  if (!c) return;
  const rows = c.rows.filter((r) => r.id !== row.id);
  rows.push(row);
  rows.sort((a, b) => b.score - a.score);
  saveRankCache(rows.slice(0, TOP), c.at);
}

// Envía el récord (o el nombre nuevo). Devuelve "ok", "rechazado" (no volver a intentarlo) o "sin-red".
async function submitScore(name, score, tacos, flag) {
  if (!online()) return "sin-red";
  try {
    const id = myId(), b = writeBatch(db);
    const data = {
      name: String(name).slice(0, 12),
      score: Math.max(0, Math.min(9999, Math.round(score))),
      tacos: Math.max(0, Math.min(99999, Math.round(tacos || 0))),
      ts: serverTimestamp(),
    };
    if (flag) data.flag = String(flag).slice(0, 6);
    b.set(doc(db, LLAVES, id), { clave: secretKey(), ts: serverTimestamp() });
    b.set(doc(db, RANKING, id), data);
    await withTimeout(b.commit());
    patchRankCache({ id, name: data.name, score: data.score, flag: data.flag || "" });
    return "ok";
  } catch (e) {
    if (e && e.code === "permission-denied") return "rechazado";
    return "sin-red";
  }
}

// ---------- Ajustes que activa el admin ----------
// Se leen como mucho una vez cada 10 minutos.
const CONFIG_KEY = "elsPanetsAjustes", CONFIG_AT = "elsPanetsAjustesHora";
let config = {};
try { config = JSON.parse(ls.get(CONFIG_KEY) || "{}"); } catch (e) {}
async function loadConfig(force) {
  const at = Number(ls.get(CONFIG_AT)) || 0;
  if (!force && Date.now() - at < RANK_TTL && Date.now() >= at) return config;
  try {
    const s = await withTimeout(getDoc(doc(db, "elsPanetsConfig", "ajustes")));
    config = s.exists() ? s.data() : {};
    delete config.firma;
    ls.set(CONFIG_KEY, JSON.stringify(config));
    ls.set(CONFIG_AT, String(Date.now()));
  } catch (e) {}
  return config;
}

// ---------- Tiempo de pantalla ----------
// Se cuentan los segundos con el juego a la vista y se envían cada 3 minutos
// (y al ocultar la app). Los días de hace más de 30 se borran de la ficha.
const dayOf = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dayOf(new Date());
const DAYS_KEY = "elsPanetsDias", KEEP_DAYS = 30;
function knownDays() {
  try { const a = JSON.parse(ls.get(DAYS_KEY) || "null"); if (Array.isArray(a)) return a; } catch (e) {}
  // primera vez: no se sabe qué días hay ya en la ficha; se dan por escritos los 60 últimos
  const a = [];
  for (let i = 60; i >= 1; i--) a.push(dayOf(new Date(Date.now() - i * 864e5)));
  return a;
}
let pendingSecs = 0, sending = false, timeOff = false;
setInterval(() => { if (!timeOff && document.visibilityState === "visible") pendingSecs++; }, 1000);
async function flushTime() {
  if (sending || timeOff || pendingSecs < 1 || !online()) return;
  const secs = pendingSecs; pendingSecs = 0; sending = true;
  const info = (window.ElsPanets && window.ElsPanets.playerInfo && window.ElsPanets.playerInfo()) || {};
  const hoy = today(), limite = dayOf(new Date(Date.now() - KEEP_DAYS * 864e5));
  const dias = { [hoy]: increment(secs) }, known = knownDays(), keep = [];
  for (const d of known) { if (d < limite) dias[d] = deleteField(); else if (d !== hoy) keep.push(d); }
  keep.push(hoy);
  try {
    await withTimeout(setDoc(doc(db, "elsPanetsJugadores", privateId()), {
      name: String(info.name || "Sin nombre").slice(0, 12),
      char: String(info.char || ""),
      flag: String(info.flag || ""),
      total: increment(secs),
      dias,
      ultima: serverTimestamp(),
    }, { merge: true }));
    ls.set(DAYS_KEY, JSON.stringify(keep));
  } catch (e) { pendingSecs += secs; }
  sending = false;
}
setInterval(flushTime, 180000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushTime(); });
window.addEventListener("pagehide", flushTime);

// ---------- Borrar mis datos ----------
// Borra de internet la ficha del ranking (con la llave), el tiempo de pantalla y,
// si lo hubo, el personaje antiguo. Lanza un error si no se pudo (sin conexión).
async function deleteMyData() {
  if (!online()) throw new Error("sin-red");
  timeOff = true; pendingSecs = 0;
  try {
    const hasKey = !!ls.get(KEY_KEY), priv = ls.get(PRIVATE_KEY);
    if (!hasKey && !priv) return;
    const b = writeBatch(db), id = hasKey ? myId() : null;
    if (id) {
      b.set(doc(db, LLAVES, id), { clave: secretKey(), ts: serverTimestamp(), borrar: true });
      b.delete(doc(db, RANKING, id));
      // y la marca y el fantasma del reto del día, si se jugó
      const mineDay = (JSON.parse(ls.get("elsPanetsRetoMio") || "{}") || {}).day;
      if (mineDay) { b.delete(doc(db, "elsPanetsReto", mineDay, "fichas", id)); b.delete(doc(db, "elsPanetsReto", mineDay, "fantasmas", id)); }
    }
    if (priv) {
      b.delete(doc(db, "elsPanetsJugadores", priv));
      b.delete(doc(db, "elsPanetsPersonajes", priv));
    }
    await withTimeout(b.commit());
    if (id) await withTimeout(deleteDoc(doc(db, LLAVES, id))).catch(() => {});
    rankMem = null;
  } catch (e) { timeOff = false; throw e; }
}

// ---------- Admin ----------
// El código no se guarda en ningún sitio que se pueda leer: Firebase solo
// comprueba su huella. Para leer listas hace falta un número que sale del código.
const ADMIN_KEY = "elsPanetsAdmin";
async function sha(text) { return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))); }
async function readLimit(pin) {
  const h = await sha("leer:" + pin);
  const n = ((h[0] << 24) >>> 0) + (h[1] << 16) + (h[2] << 8) + h[3];
  return 100000000 + (n % 800000000);
}
const adminPin = () => ls.get(ADMIN_KEY);
const isAdmin = () => !!adminPin();
async function adminLogin(pin) {
  pin = String(pin || "").trim();
  if (!/^\d{8}$/.test(pin)) return false;
  try {
    await getDocs(query(collection(db, "elsPanetsJugadores"), limit(await readLimit(pin))));
    ls.set(ADMIN_KEY, pin);
    return true;
  } catch (e) { return false; }
}
function adminLogout() { ls.del(ADMIN_KEY); }
async function adminList(coll) {
  const pin = adminPin(); if (!pin) throw new Error("no admin");
  const snap = await getDocs(query(collection(db, coll), limit(await readLimit(pin))));
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
}
// cada escritura del admin va con una firma nueva que solo se crea sabiendo el código
async function adminWrite(coll, id, data, opts) {
  const pin = adminPin(); if (!pin) throw new Error("no admin");
  const f = "f" + randomHex(12);
  const b = writeBatch(db);
  b.set(doc(db, "elsPanetsFirmas", f), { clave: "elsPanets:" + pin });
  b.set(doc(db, coll, id), Object.assign({}, data, { firma: f }), opts || {});
  await b.commit();
}
async function adminSetConfig(patch) {
  await adminWrite("elsPanetsConfig", "ajustes", patch, { merge: true });
  return loadConfig(true);
}

// ---------- Reto del día (17/11/2026) ----------
// Una ficha por jugador y día con su mejor marca, y aparte su fantasma (alturas, 30 por
// segundo). Se escribe con la misma llave secreta que el ranking.
const DAILY = "elsPanetsReto";
const isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
async function submitDaily(day, name, score, flag, ys) {
  if (!online() || !isDay(day) || !name) return "sin-red";
  const key = "elsPanetsRetoMio", mine = JSON.parse(ls.get(key) || "{}");
  if (mine.day === day && mine.score >= score) return "igual";
  try {
    const id = myId(), b = writeBatch(db);
    b.set(doc(db, LLAVES, id), { clave: secretKey(), ts: serverTimestamp() });
    const data = { name: String(name).slice(0, 12), score: Math.max(0, Math.min(9999, Math.round(score))), ts: serverTimestamp() };
    if (flag) data.flag = String(flag).slice(0, 6);
    b.set(doc(db, DAILY, day, "fichas", id), data);
    b.set(doc(db, DAILY, day, "fantasmas", id), { y: (ys || []).slice(0, 9000).map((v) => Math.round(v) | 0), ts: serverTimestamp() });
    await withTimeout(b.commit(), 15000);
    ls.set(key, JSON.stringify({ day, score: data.score }));
    dailyMem = null;
    return "ok";
  } catch (e) { return e && e.code === "permission-denied" ? "rechazado" : "sin-red"; }
}
let dailyMem = null;
async function dailyTop(day) {
  if (!isDay(day)) return [];
  if (dailyMem && dailyMem.day === day && Date.now() - dailyMem.at < 120000) return dailyMem.rows;
  const snap = await withTimeout(getDocs(query(collection(db, DAILY, day, "fichas"), orderBy("score", "desc"), limit(20))));
  const rows = snap.docs.map((d) => { const x = d.data(); return { id: d.id, name: String(x.name || ""), score: Number(x.score) || 0, flag: x.flag ? String(x.flag) : "" }; });
  dailyMem = { day, at: Date.now(), rows };
  return rows;
}
async function dailyGhost(day, id) {
  const s = await withTimeout(getDoc(doc(db, DAILY, day, "fantasmas", id)));
  return s.exists() ? s.data().y || [] : [];
}
// ---------- Retar a un amigo ----------
// Un código de 5 letras guarda el recorrido (semilla), la marca y el fantasma.
const RETOS = "elsPanetsRetos", CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
async function createChallenge(name, score, seed, ys, ch) {
  if (!online()) throw new Error("sin-red");
  for (let tries = 0; tries < 4; tries++) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
    try {
      await withTimeout(setDoc(doc(db, RETOS, code), {
        name: String(name || "Alguien").slice(0, 12), score: Math.max(0, Math.min(9999, Math.round(score))), seed: seed >>> 0,
        y: (ys || []).slice(0, 9000).map((v) => Math.round(v) | 0), char: String(ch || "").slice(0, 20), ts: serverTimestamp(),
      }), 15000);
      return code;
    } catch (e) { if (!(e && e.code === "permission-denied")) throw e; }
  }
  throw new Error("sin-codigo");
}
async function getChallenge(code) {
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) return null;
  const s = await withTimeout(getDoc(doc(db, RETOS, code)));
  return s.exists() ? Object.assign({ code }, s.data()) : null;
}

window.TacoLeaderboard = {
  submitScore, ranking, cachedRanking, myId,
  submitDaily, dailyTop, dailyGhost, createChallenge, getChallenge,
  getConfig: () => config, loadConfig,
  deleteMyData,
  isAdmin, adminLogin, adminLogout, adminList, adminSetConfig,
};
loadConfig().then(() => window.dispatchEvent(new Event("elsPanetsConfig")));
window.dispatchEvent(new Event("tacoLeaderboardReady"));
