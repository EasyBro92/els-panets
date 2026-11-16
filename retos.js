// Retos de Els Panets (17/11/2026): reto del día, retar a un amigo y por turnos.
// Usa game.js (ElsPanets: startMode, dailySeed…) y Firebase (TacoLeaderboard).
(function () {
  "use strict";
  const EP = window.ElsPanets, UI = window.ElsPanetsUI;
  if (!EP || !EP.startMode || !UI) return;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
  const lb = () => window.TacoLeaderboard;
  const ov = $("retosOverlay"), tabs = $("retosTabs"), body = $("retosBody");
  const myName = () => (EP.settings ? EP.settings().nombre : "") || "";
  let tab = "diario";

  // ---------- ventana ----------
  function render() {
    for (const b of tabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.tab === tab);
    if (tab === "diario") renderDaily();
    else if (tab === "amigo") renderFriend();
    else renderTurns();
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) { tab = b.dataset.tab; render(); } });
  $("retosClose").addEventListener("click", () => ov.classList.add("hidden"));
  function open(t) { if (t) tab = t; render(); ov.classList.remove("hidden"); }

  // ---------- reto del día ----------
  function renderDaily() {
    const day = EP.todayKey();
    body.innerHTML = `<p class="rtInfo">Hoy todos vuelan por <b>las mismas columnas</b>. Haz tu mejor marca y vuela junto al fantasma del primero.</p>
      <div id="rtTop" class="rtTop"><div class="aEmpty">Cargando…</div></div>
      <button type="button" id="rtPlayDaily" class="bigBtn">Jugar el reto de hoy</button>`;
    if (!lb() || !lb().dailyTop) { $("rtTop").innerHTML = '<div class="aEmpty">Sin conexión</div>'; return; }
    lb().dailyTop(day).then((rows) => {
      if (tab !== "diario") return;
      const me = lb().myId();
      $("rtTop").innerHTML = rows.length ? "<ol>" + rows.slice(0, 10).map((r, i) => `<li class="${r.id === me ? "me" : ""}"><span>${i + 1}</span>${EP.flagImg(r.flag)}<b>${esc(r.name)}</b><i>${r.score}</i></li>`).join("") + "</ol>"
        : '<div class="aEmpty">Nadie ha jugado todavía hoy. ¡Sé el primero!</div>';
    }).catch(() => { $("rtTop").innerHTML = '<div class="aEmpty">No se pudo cargar. Revisa la conexión.</div>'; });
  }
  async function playDaily() {
    const day = EP.todayKey();
    let rv = null;
    try {
      const rows = lb() && lb().dailyTop ? await lb().dailyTop(day) : [];
      const me = lb().myId(), top = rows.find((r) => r.id !== me);
      if (top) { const y = await lb().dailyGhost(day, top.id); if (y && y.length) rv = { name: top.name, score: top.score, y }; }
    } catch (e) {}
    ov.classList.add("hidden");
    EP.startMode("diario", EP.dailySeed(), rv);
  }

  // ---------- retar a un amigo ----------
  function renderFriend() {
    body.innerHTML = `<p class="rtInfo">Juega una partida normal y, al acabar, pulsa <b>«Retar a un amigo»</b>. Tu amigo volará por tus mismas columnas contra tu fantasma.</p>
      <p class="rtInfo">¿Te han mandado un código?</p>
      <div class="rtCode"><input id="rtCodeIn" type="text" maxlength="5" autocomplete="off" placeholder="ABCDE" /><button type="button" id="rtCodeGo" class="bigBtn">Aceptar</button></div>
      <p id="rtCodeMsg" class="formMsg"></p>`;
  }
  async function acceptCode(code) {
    const msg = $("rtCodeMsg");
    if (msg) msg.textContent = "Buscando el reto…";
    let r = null;
    try { r = lb() && lb().getChallenge ? await lb().getChallenge(code) : null; } catch (e) {}
    if (!r) { if (msg) msg.textContent = "No existe ese código (o no hay conexión)."; return false; }
    showAccept(r);
    return true;
  }
  // ventana: «Fulano te reta»
  function showAccept(r) {
    $("rtAcceptTxt").textContent = r.name + " te reta: ha hecho " + r.score + " puntos en este recorrido. ¿Le ganas?";
    $("rtAccept").classList.remove("hidden");
    $("rtAcceptGo").onclick = () => {
      $("rtAccept").classList.add("hidden"); ov.classList.add("hidden");
      if (!EP.startMode("reto", r.seed, { name: r.name, score: r.score, y: r.y || [] })) alert("Termina antes la partida que estás jugando.");
    };
  }
  $("rtAcceptNo").addEventListener("click", () => $("rtAccept").classList.add("hidden"));
  // crea el código y lo comparte (WhatsApp o lo que tenga el móvil)
  async function shareChallenge(info) {
    const box = $("rtShare"), txt = $("rtShareTxt");
    box.classList.remove("hidden");
    txt.textContent = "Creando tu reto…";
    $("rtShareCode").textContent = "";
    $("rtShareWa").classList.add("hidden");
    let code;
    try { code = await lb().createChallenge(myName() || "Alguien", info.score, info.seed, info.y, info.char); }
    catch (e) { txt.textContent = "No se pudo crear el reto. Revisa la conexión."; return; }
    const url = location.origin + location.pathname.replace(/index\.html$/, "") + "?reto=" + code;
    const msg = "¡Te reto en Els Panets! He hecho " + info.score + " puntos. ¿Me ganas? Código: " + code + " · " + url;
    $("rtShareCode").textContent = code;
    txt.textContent = "Pásale este código a tu amigo. En Retos → Retar a un amigo lo escribe y vuela contra tu fantasma.";
    const wa = $("rtShareWa");
    wa.href = "https://wa.me/?text=" + encodeURIComponent(msg);
    wa.classList.remove("hidden");
    if (navigator.share) $("rtShareNative").onclick = () => navigator.share({ title: "Els Panets", text: msg }).catch(() => {});
    $("rtShareNative").classList.toggle("hidden", !navigator.share);
  }
  $("rtShareClose").addEventListener("click", () => $("rtShare").classList.add("hidden"));

  // ---------- por turnos en el mismo móvil ----------
  let turns = null; // { players: [{ name, score }], i, seed }
  function renderTurns() {
    const names = (turns && turns.players.map((p) => p.name)) || [myName() || "Jugador 1", "Jugador 2"];
    body.innerHTML = `<p class="rtInfo">De 2 a 4 jugadores en este móvil. Todos vuelan por las mismas columnas, uno detrás de otro. Gana quien más puntos haga.</p>
      <div id="rtNames" class="rtNames">${[0, 1, 2, 3].map((i) => `<input type="text" maxlength="12" autocomplete="off" placeholder="Jugador ${i + 1}${i > 1 ? " (si queréis)" : ""}" value="${esc(names[i] || "")}" />`).join("")}</div>
      <button type="button" id="rtTurnsGo" class="bigBtn">Empezar</button>`;
  }
  function startTurns() {
    const players = [...$("rtNames").querySelectorAll("input")].map((x) => x.value.trim().slice(0, 12)).filter(Boolean).map((name) => ({ name, score: null }));
    if (players.length < 2) { alert("Hacen falta al menos 2 jugadores."); return; }
    turns = { players, i: 0, seed: Math.floor(Math.random() * 2147483647) };
    ov.classList.add("hidden");
    nextTurn();
  }
  function nextTurn() {
    const p = turns.players[turns.i];
    $("rtTurnTitle").textContent = "Turno de " + p.name;
    $("rtTurnTxt").textContent = "Pásale el móvil a " + p.name + ". Cuando esté listo, que pulse el botón.";
    $("rtTurnList").innerHTML = scoreList();
    $("rtTurnGo").textContent = "¡Vamos, " + p.name + "!";
    $("rtTurnGo").onclick = () => { $("rtTurn").classList.add("hidden"); EP.startMode("turnos", turns.seed, null); };
    $("rtTurnEnd").classList.add("hidden");
    $("rtTurn").classList.remove("hidden");
  }
  function scoreList() {
    return turns.players.map((p) => `<li><b>${esc(p.name)}</b><i>${p.score == null ? "—" : p.score}</i></li>`).join("");
  }
  EP.on("turnoFin", (d) => {
    if (!turns || EP.runMode() !== "turnos") return;
    turns.players[turns.i].score = d.score;
    turns.i++;
    if (turns.i < turns.players.length) { nextTurn(); return; }
    // final: clasificación
    const order = turns.players.slice().sort((a, b) => b.score - a.score);
    $("rtTurnTitle").textContent = "¡Gana " + order[0].name + "!";
    $("rtTurnTxt").textContent = order.length > 1 && order[0].score === order[1].score ? "¡Empate en cabeza!" : "Con " + order[0].score + " puntos.";
    $("rtTurnList").innerHTML = order.map((p, i) => `<li><span>${i + 1}</span><b>${esc(p.name)}</b><i>${p.score}</i></li>`).join("");
    $("rtTurnGo").textContent = "Otra ronda";
    $("rtTurnGo").onclick = () => { turns.players.forEach((p) => (p.score = null)); turns.i = 0; turns.seed = Math.floor(Math.random() * 2147483647); nextTurn(); };
    $("rtTurnEnd").classList.remove("hidden");
    $("rtTurn").classList.remove("hidden");
  });
  $("rtTurnEnd").addEventListener("click", () => { $("rtTurn").classList.add("hidden"); turns = null; if (EP.goHome) EP.goHome(); });

  body.addEventListener("click", (e) => {
    if (e.target.closest("#rtPlayDaily")) { playDaily(); return; }
    if (e.target.closest("#rtCodeGo")) { acceptCode($("rtCodeIn").value); return; }
    if (e.target.closest("#rtTurnsGo")) { startTurns(); return; }
  });

  // reto del día: al acabar la partida se sube la marca y el fantasma (si es la mejor del día)
  EP.on("partidaFin", (d) => {
    if (d.mode !== "diario" || !lb() || !lb().submitDaily) return;
    if (!d.name) return; // sin nombre no sale en la lista (se pide al batir un récord)
    lb().submitDaily(EP.todayKey(), d.name, d.score, d.flag, d.y);
  });

  // ¿se ha abierto el juego con un enlace de reto? (?reto=ABCDE)
  const code = new URLSearchParams(location.search).get("reto");
  if (code) setTimeout(() => acceptCode(code), 2200);

  UI.openRetos = open;
  UI.shareChallenge = shareChallenge;
})();
