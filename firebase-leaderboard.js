// Ranking global (Firestore). Módulo independiente: si falla o no hay red,
// el juego sigue funcionando normalmente con el récord local únicamente.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
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

const PLAYER_ID_KEY = "tacoSuitFlapPlayerId";

function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : "p-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

// Cada jugador (por dispositivo) tiene un único documento que se actualiza
// cuando bate su récord personal, para no disparar miles de escrituras.
async function submitScore(name, score, tacos) {
  try {
    await setDoc(doc(db, "leaderboard", getPlayerId()), {
      name: String(name).slice(0, 12),
      score: Math.max(0, Math.round(score)),
      tacos: Math.max(0, Math.round(tacos || 0)),
      ts: serverTimestamp(),
    });
  } catch (e) {
    console.warn("No se pudo enviar la puntuación al ranking global:", e);
  }
}

async function fetchTop(n) {
  const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(n || 10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

window.TacoLeaderboard = { submitScore, fetchTop };
window.dispatchEvent(new Event("tacoLeaderboardReady"));
