// Ventana de la historia de Els Panets (17/11/2026): «El viaje de los Panets».
// 5 mundos de 8 niveles, con sus estrellas, su cuento y el amigo que se rescata en cada uno.
(function () {
  "use strict";
  const EP = window.ElsPanets, UI = window.ElsPanetsUI;
  if (!EP || !EP.WORLDS || !UI) return;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, "");
  const ov = $("storyOverlay"), tabs = $("storyTabs"), body = $("storyBody");
  const W = EP.WORLDS, N = EP.LEVELS_PER_WORLD;
  let world = 0, pick = -1;
  const SEEN_KEY = "elsPanetsHistoriaVista";
  const seen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch (e) { return {}; } };
  const markSeen = (k) => { const s = seen(); s[k] = 1; try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {} };
  const stars = (n) => "★".repeat(n) + "☆".repeat(3 - n);
  const worldOpen = (w) => w === 0 || EP.worldDone(w - 1);

  function render() {
    tabs.innerHTML = W.map((x, w) => `<button type="button" data-w="${w}" class="${w === world ? "on" : ""}${worldOpen(w) ? "" : " off"}">${worldOpen(w) ? w + 1 : "🔒"}</button>`).join("");
    const Wd = W[world], open = worldOpen(world);
    let h = `<div class="stWorld"><canvas id="stFriend" width="160" height="166"></canvas><div><b>${world + 1}. ${esc(Wd.name)}</b>
      <p>${esc(open ? (EP.worldDone(world) ? Wd.end : Wd.intro) : "Acaba el mundo " + world + " para abrir este.")}</p></div></div>`;
    if (open) {
      h += '<div class="stLevels">';
      for (let n = 0; n < N; n++) {
        const lo = EP.levelOpen(world, n), st = EP.levelStars(world, n), boss = n === N - 1;
        h += `<button type="button" class="stLv${lo ? "" : " off"}${pick === n ? " on" : ""}${boss ? " boss" : ""}" data-n="${n}" ${lo ? "" : "disabled"}>
          <b>${boss ? "🐦" : n + 1}</b><small>${lo ? stars(st) : "🔒"}</small></button>`;
      }
      h += "</div>";
      if (pick >= 0) {
        const I = EP.levelInfo(world, pick), st = EP.levelStars(world, pick);
        h += `<div class="stPick"><b>Nivel ${pick + 1}${I.boss ? " · ¡la gaviota!" : ""}</b><ul>${I.goals.map((g, i) => `<li class="${i < st ? "ok" : ""}">${i < st ? "★" : "☆"} ${esc(g)}</li>`).join("")}</ul>
          <button type="button" id="stPlay" class="bigBtn">¡Jugar!</button></div>`;
      } else h += '<p class="stHint">Elige un nivel. Cada uno tiene 3 estrellas: llegar, comer y un reto.</p>';
    }
    body.innerHTML = h;
    $("stTotal").textContent = "★ " + EP.totalStars() + " / " + W.length * N * 3;
    const cv = $("stFriend"), fi = EP.charIndexOf(Wd.friend);
    if (cv && fi >= 0) EP.drawCharTo(cv, fi, 0);
  }
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-w]");
    if (!b || !worldOpen(Number(b.dataset.w))) return;
    world = Number(b.dataset.w); pick = -1; EP.sfx("click"); render(); showIntro();
  });
  body.addEventListener("click", (e) => {
    if (e.target.closest("#stPlay")) {
      if (EP.startLevel(world, pick)) { ov.classList.add("hidden"); EP.sfx("click"); }
      return;
    }
    const b = e.target.closest("button[data-n]");
    if (b && !b.disabled) { pick = Number(b.dataset.n); EP.sfx("click"); render(); }
  });
  $("storyClose").addEventListener("click", () => ov.classList.add("hidden"));

  // viñetas del cuento: al empezar (una vez) y al entrar en cada mundo nuevo (una vez)
  const tale = $("taleBox");
  function showTale(title, txt, friendId) {
    $("taleTitle").textContent = title;
    $("taleText").textContent = txt;
    const cv = $("taleFriend"), fi = friendId ? EP.charIndexOf(friendId) : -1;
    cv.style.display = fi >= 0 ? "" : "none";
    if (fi >= 0) EP.drawCharTo(cv, fi, 0);
    tale.classList.remove("hidden");
  }
  $("taleOk").addEventListener("click", () => tale.classList.add("hidden"));
  function showIntro() {
    const s = seen();
    if (!s.intro) { markSeen("intro"); showTale("El viaje de los Panets", EP.STORY_INTRO, null); return; }
    if (worldOpen(world) && !s["w" + world]) { markSeen("w" + world); showTale(W[world].name, W[world].intro, W[world].friend); }
  }

  function open(w) {
    if (w != null) world = w;
    else { world = 0; for (let i = 0; i < W.length; i++) if (worldOpen(i)) world = i; }
    pick = -1;
    for (let n = 0; n < N; n++) if (EP.levelOpen(world, n)) pick = n;
    render();
    ov.classList.remove("hidden");
    showIntro();
  }
  // al recuperar una bandeja: el final del mundo y el amigo que se une a la fiesta
  EP.on("nivel", (d) => {
    if (!d.newWorld) return;
    setTimeout(() => {
      const Wd = W[d.w];
      showTale("¡" + Wd.dish.charAt(0).toUpperCase() + Wd.dish.slice(1) + " a salvo!", Wd.end + (d.w < W.length - 1 ? " ¡Nuevo mundo abierto!" : ""), Wd.friend);
      tale.classList.add("tale-over");
    }, 1400);
  });
  UI.openStory = open;
})();
