// Ranking global (Firestore). Módulo independiente: si falla o no hay red,
// el juego sigue funcionando normalmente con el récord local únicamente.
// 03/11/2026: tiempo de pantalla, personaje propio (lo aprueba el admin), ajustes del admin.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
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

const PLAYER_ID_KEY = "tacoSuitFlapPlayerId";

function getPlayerId() {
  let id = ls.get(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : "p-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    ls.set(PLAYER_ID_KEY, id);
  }
  return id;
}

// Número privado de este móvil (no sale en el ranking): con él se guardan
// su tiempo de pantalla y su personaje.
const PRIVATE_KEY = "elsPanetsIdPrivado";
function privateId() {
  let id = ls.get(PRIVATE_KEY);
  if (!id) { id = "ep" + randomHex(16); ls.set(PRIVATE_KEY, id); }
  return id;
}

// Cada jugador (por dispositivo) tiene un único documento que se actualiza
// cuando bate su récord personal, para no disparar miles de escrituras.
async function submitScore(name, score, tacos, flag) {
  try {
    const data = {
      name: String(name).slice(0, 12),
      score: Math.max(0, Math.round(score)),
      tacos: Math.max(0, Math.round(tacos || 0)),
      ts: serverTimestamp(),
    };
    if (flag) data.flag = String(flag).slice(0, 4);
    await setDoc(doc(db, "leaderboard", getPlayerId()), data);
  } catch (e) {
    console.warn("No se pudo enviar la puntuación al ranking global:", e);
  }
}

async function fetchTop(n) {
  const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(n || 10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

// ---------- Ajustes que activa el admin ----------
let config = {};
try { config = JSON.parse(ls.get("elsPanetsAjustes") || "{}"); } catch (e) {}
async function loadConfig() {
  try {
    const s = await getDoc(doc(db, "elsPanetsConfig", "ajustes"));
    config = s.exists() ? s.data() : {};
    delete config.firma;
    ls.set("elsPanetsAjustes", JSON.stringify(config));
  } catch (e) {}
  return config;
}

// ---------- Tiempo de pantalla ----------
// Se cuentan los segundos con el juego a la vista y se envían cada minuto.
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
let pendingSecs = 0, sending = false;
setInterval(() => { if (document.visibilityState === "visible") pendingSecs++; }, 1000);
async function flushTime() {
  if (sending || pendingSecs < 1) return;
  const secs = pendingSecs; pendingSecs = 0; sending = true;
  const info = (window.ElsPanets && window.ElsPanets.playerInfo && window.ElsPanets.playerInfo()) || {};
  try {
    await setDoc(doc(db, "elsPanetsJugadores", privateId()), {
      name: String(info.name || "Sin nombre").slice(0, 12),
      char: String(info.char || ""),
      flag: String(info.flag || ""),
      total: increment(secs),
      dias: { [today()]: increment(secs) },
      ultima: serverTimestamp(),
    }, { merge: true });
  } catch (e) { pendingSecs += secs; }
  sending = false;
}
setInterval(flushTime, 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushTime(); });
window.addEventListener("pagehide", flushTime);

// ---------- Personaje propio ----------
async function myCharacter() {
  const s = await getDoc(doc(db, "elsPanetsPersonajes", privateId()));
  if (!s.exists()) return null;
  const d = s.data();
  return { estado: d.estado, name: d.name || "", look: d.look || null, decidido: d.decidido ? d.decidido.toMillis() : 0 };
}
async function submitCharacter(name, look) {
  await setDoc(doc(db, "elsPanetsPersonajes", privateId()), {
    name: String(name).slice(0, 12), look, estado: "pendiente", creado: serverTimestamp(),
  });
}
async function cancelCharacter() { await deleteDoc(doc(db, "elsPanetsPersonajes", privateId())); }

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
async function adminDecide(id, approve) {
  // denegado: se borra lo que había hecho; podrá intentarlo de nuevo en 24 h
  const data = approve ? { estado: "aprobado", decidido: serverTimestamp() } : { estado: "denegado", decidido: serverTimestamp(), name: "", look: null };
  await adminWrite("elsPanetsPersonajes", id, data, { merge: true });
}
async function adminSetConfig(patch) {
  await adminWrite("elsPanetsConfig", "ajustes", patch, { merge: true });
  return loadConfig();
}

window.TacoLeaderboard = {
  submitScore, fetchTop,
  getConfig: () => config, loadConfig,
  myCharacter, submitCharacter, cancelCharacter,
  isAdmin, adminLogin, adminLogout, adminList, adminDecide, adminSetConfig,
};
loadConfig().then(() => window.dispatchEvent(new Event("elsPanetsConfig")));
window.dispatchEvent(new Event("tacoLeaderboardReady"));
