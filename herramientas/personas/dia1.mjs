// Día 1: cada persona con su móvil, su forma de jugar y lo que haría de verdad.
import fs from "fs";
import { launch, close, Persona, sleep, rnd, OUT, db, saveDb, devices } from "./lib.mjs";

const SK = {
  bueno: { react: 160, cool: 120, bias: 0.12, noise: 26, miss: 0.012, double: 0.03 },
  medio: { react: 230, cool: 140, bias: 0.12, noise: 45, miss: 0.05, double: 0.03 },
  flojo: { react: 360, cool: 170, bias: 0.1, noise: 80, miss: 0.12, double: 0.1 },
};
const RES = {};
const step = async (p, name, fn) => { try { return await fn(); } catch (e) { p.note(`falló «${name}»: ${String(e.message).split("\n")[0].slice(0, 160)}`); return null; } };

async function diario(p) {
  if (await p.visible("#dailyTake")) {
    await sleep(rnd(1200, 3000) * p.slow);
    const sub = (await p.text("#dailySub")).trim();
    await p.tap(p.page.locator("#dailyTake"));
    p.say(`cobra el premio diario (${sub.slice(0, 60)})`);
    await sleep(rnd(1200, 2500) * p.slow);
    p.say("ve: " + (await p.text("#dailyMsg")).trim() + " y toca «" + (await p.text("#dailyTake")).trim() + "»");
    await p.tap(p.page.locator("#dailyTake"));
    if (await p.visible("#dailyOverlay")) p.note("la ventana del premio diario no se cierra");
  }
}
async function jugar(p, n, sk, nombre, seguir) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = await p.playRun(sk);
    const after = await p.afterRun(nombre, seguir);
    if (after === "sigue") { const r2 = await p.playRun(sk); r.score = r2.score; r.comidas = r2.comidas; r.siguio = 1; await p.afterRun(nombre, false); }
    const o = await p.overInfo();
    out.push(r.score);
    p.say(`partida ${i + 1}: ${r.score} puntos, ${r.comidas} empanadillas, ${Math.round(r.secs)} s${r.fps ? `, ${r.fps} imágenes/s (peor ${r.peor} ms)` : ""}${o && o.msgs ? " · «" + o.msgs.map((m) => m.txt).join(" / ") + "»" : ""}`);
    await sleep(rnd(1200, 2600) * p.slow);
    if (i < n - 1) { if ((await p.state()) === 4) await p.tapUI("again"); else await p.closeAny(); }
  }
  await p.goHome();
  return out;
}
async function crearCuenta(p, user, pass, intentos = []) {
  await p.closeAny();
  if ((await p.state()) !== 0) await p.goHome();
  await p.tapUI("cuenta");
  await p.tap("Crear una cuenta");
  for (const [u, pw, pw2] of [...intentos, [user, pass, pass]]) {
    await p.type("#cuU", u); await p.type("#cuP", pw); await p.type("#cuP2", pw2 ?? pw);
    const t0 = Date.now();
    await p.tap(p.page.locator('#cuBody [data-do="register"]'));
    let code = "";
    for (let i = 0; i < 120 && !code; i++) { await sleep(250); code = (await p.page.locator(".cuCode").count()) ? await p.text(".cuCode") : ""; if (!code && (await p.text("#cuMsg")).trim() && !/Creando|Un momento|…/.test(await p.text("#cuMsg"))) break; }
    const msg = (await p.text("#cuMsg")).trim();
    if (code) { p.say(`crea la cuenta «${u}» (${((Date.now() - t0) / 1000).toFixed(1)} s) y le dan el código ${code}`); p.code = code; break; }
    p.say(`intenta «${u}» / «${pw.replace(/./g, "•")}» → «${msg}»`);
  }
  if (!p.code) { p.note("no consiguió crear la cuenta"); return false; }
  await sleep(rnd(1500, 4000) * p.slow);
  await p.tap("Ya lo he guardado");
  p.say("pantalla de su cuenta: " + (await p.text("#cuTitle")).trim() + " · " + (await p.text("#cuBody")).replace(/\s+/g, " ").trim().slice(0, 140));
  await p.closeAny();
  return true;
}
async function ajuste(p, label, clickText) {
  await p.closeAny();
  await p.tapUI("gear");
  const row = p.page.locator("#setMain .setRow, #setMain > div, #setMain label").filter({ hasText: label }).first();
  const btn = row.locator("button").first();
  if (!(await btn.count())) { p.note(`no encuentra el ajuste «${label}»`); await p.closeAny(); return; }
  await btn.scrollIntoViewIfNeeded();
  if (p.touch) await btn.tap(); else await btn.click();
  await sleep(400);
  p.say(`en Ajustes pone «${label}» en ${(await btn.textContent()).trim()}`);
  await p.tap(p.page.locator("#setClose"));
}
async function volumen(p, cual, v) {
  await p.closeAny();
  await p.tapUI("gear");
  const r = p.page.locator(`#setMain input[data-vol="${cual}"]`);
  const box = await r.boundingBox();
  // arrastra la barra con el dedo hasta el valor
  const x = box.x + box.width * (v / 100), y = box.y + box.height / 2;
  await p.page.mouse.move(box.x + box.width * 0.7, y); await p.page.mouse.down(); await p.page.mouse.move(Math.max(box.x + 1, x), y, { steps: 8 }); await p.page.mouse.up();
  await sleep(300);
  p.say(`baja el volumen de ${cual} a ${(await p.text(`[data-volv="${cual}"]`)).trim()}`);
  await p.tap(p.page.locator("#setClose"));
}

await launch();
const save = () => fs.writeFileSync(OUT + "dia1.json", JSON.stringify(RES, null, 1));

// ===== 1. Sergio Navarro, 28, Valencia: en el portátil, con ratón y la barra espaciadora =====
{
  const p = new Persona({ nombre: "Sergio", dispositivo: "portátil con Edge 1366×768", device: { viewport: { width: 1366, height: 768 } }, locale: "es-ES", tz: "Europe/Madrid", touch: false, slow: 0.8 });
  await p.open();
  await step(p, "diario", () => diario(p));
  RES.sergio = { partidas: await step(p, "jugar", () => jugar(p, 4, { ...SK.bueno, mouse: true }, "SergioNav", true)) };
  await step(p, "ranking", async () => { await p.tapUI("rank"); await sleep(2500); const items = await p.page.locator("#leaderboardList li").count(); p.say(`mira el ranking: ${items} filas · ${(await p.text("#leaderboardList li")).replace(/\s+/g, " ").slice(0, 50)}`); await p.closeAny(); });
  await step(p, "cuenta", () => crearCuenta(p, "sergionav", "valencia28"));
  RES.sergio.best = await p.q("best");
  RES.sergio.ls = await p.page.evaluate(() => ({ best: localStorage.elsPanetsBest, hucha: localStorage.elsPanetsHucha }));
  // el mismo Sergio en su móvil (Pixel 7): entra con su cuenta
  const m = new Persona({ nombre: "Sergio (móvil)", dispositivo: "Pixel 7", device: "Pixel 7", locale: "es-ES", tz: "Europe/Madrid", touch: true, slow: 0.9 });
  await m.open();
  await step(m, "diario", () => diario(m));
  await step(m, "entrar", async () => {
    await m.tapUI("cuenta");
    await m.type("#cuU", "SergioNav"); await m.type("#cuP", "valencia28");
    const t0 = Date.now();
    await m.tap(m.page.locator('#cuBody [data-do="login"]'));
    for (let i = 0; i < 80; i++) { await sleep(250); if (/perfil|Tu cuenta|Hola/i.test(await m.text("#cuTitle")) || (await m.page.locator('[data-do="logout"]').count())) break; }
    m.say(`entra con su cuenta en el móvil (${((Date.now() - t0) / 1000).toFixed(1)} s): ${(await m.text("#cuBody")).replace(/\s+/g, " ").trim().slice(0, 120)}`);
    await m.closeAny();
    await sleep(1500);
    const l = await m.page.evaluate(() => ({ best: localStorage.elsPanetsBest, hucha: localStorage.elsPanetsHucha }));
    m.say(`en el móvil ve récord ${l.best} y hucha ${l.hucha} (en el portátil: ${RES.sergio.ls.best} y ${RES.sergio.ls.hucha})`);
    if (l.best !== RES.sergio.ls.best || l.hucha !== RES.sergio.ls.hucha) m.note("la partida del portátil no llegó igual al móvil");
  });
  RES.sergioMovil = { partidas: await step(m, "jugar", () => jugar(m, 3, SK.bueno, "SergioNav", false)) };
  await step(m, "sync", async () => { await m.page.evaluate(() => window.ElsPanetsCuenta.sync && window.ElsPanetsCuenta.sync()); await sleep(2000); });
  const lm = await m.page.evaluate(() => ({ best: localStorage.elsPanetsBest, hucha: localStorage.elsPanetsHucha }));
  // vuelve al portátil al día siguiente: recarga
  await step(p, "volver al portátil", async () => {
    await p.page.reload(); await p.page.waitForFunction(() => window.elsPanetsPrueba); await sleep(4000);
    const l = await p.page.evaluate(() => ({ best: localStorage.elsPanetsBest, hucha: localStorage.elsPanetsHucha }));
    p.say(`vuelve al portátil: récord ${l.best}, hucha ${l.hucha} (en el móvil tenía ${lm.best} y ${lm.hucha})`);
    if (l.best !== lm.best || l.hucha !== lm.hucha) p.note("lo jugado en el móvil no llegó al portátil al abrirlo");
  });
  RES.sergio.report = p.report(); RES.sergioMovil.report = m.report();
  await p.ctx.storageState({ path: OUT + "sergio-pc.json" }); await m.ctx.storageState({ path: OUT + "sergio-movil.json" });
  await p.ctx.close(); await m.ctx.close(); saveDb(); save();
}

// ===== 2. Marta Puig, 34, Sabadell: en el tren con su Xiaomi, juega un rato y baja la música =====
{
  const p = new Persona({ nombre: "Marta", dispositivo: "Xiaomi Redmi Note 13", device: { viewport: { width: 393, height: 873 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; 23129RAA4G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36" }, locale: "ca-ES", tz: "Europe/Madrid", touch: true, slow: 1 });
  await p.open();
  await step(p, "diario", () => diario(p));
  await step(p, "volumen", () => volumen(p, "musica", 0));
  RES.marta = { partidas: await step(p, "jugar", () => jugar(p, 5, SK.medio, "Marta", false)) };
  await step(p, "tienda", async () => {
    await p.tapUI("mShop");
    const pan = (await p.text("#boxPanet")).trim();
    p.say(`abre la Tienda: tiene ${pan}`);
    const ob = p.page.locator("#boxOpen");
    if (await ob.isEnabled()) { await p.tap(ob); await sleep(6500); p.say("abre una caja: " + (await p.text("#boxMsg")).replace(/\s+/g, " ").trim()); }
    else p.say("no le llega para la caja: " + (await ob.textContent()).trim());
    await p.tap(p.page.locator('#shopTabs [data-shop="mejoras"]'));
    p.say("mira Mejoras: " + (await p.text("#shopBody")).replace(/\s+/g, " ").trim().slice(0, 120));
    await p.checkFit("boxOverlay");
    await p.closeAny();
  });
  await step(p, "cuenta", () => crearCuenta(p, "martapuig", "Sabadell1990"));
  RES.marta.report = p.report(); await p.ctx.storageState({ path: OUT + "marta.json" }); await p.ctx.close(); saveDb(); save();
}

// ===== 3. Josep Ferrer, 67, Reus: tablet, toca despacio y a veces dos veces =====
{
  const p = new Persona({ nombre: "Josep", dispositivo: "tablet Galaxy Tab S4", device: "Galaxy Tab S4", locale: "es-ES", tz: "Europe/Madrid", touch: true, slow: 2.2 });
  await p.open();
  await step(p, "diario", () => diario(p));
  RES.josep = { partidas: await step(p, "jugar", () => jugar(p, 3, SK.flojo, "Avi Josep", false)) };
  await step(p, "calma", () => ajuste(p, "Fondo tranquilo"));
  await step(p, "historia", async () => {
    await p.tapUI("hist");
    await sleep(1200); if (await p.visible("#taleOk")) { p.say("lee el cuento del mundo 1: " + (await p.text("#taleText")).replace(/s+/g, " ").trim().slice(0, 90)); await p.tap(p.page.locator("#taleOk")); }
    await p.tap(p.page.locator('#storyBody .stLv[data-n="0"]'));
    await p.tap("¡Jugar!");
    await sleep(1500);
    const r = await p.playRun(SK.flojo);
    await p.afterRun("Avi Josep", false);
    await sleep(2500);
    const lr = await p.q("levelResult && { win: levelResult.win, stars: levelResult.stars }");
    p.say(`juega el nivel 1 de la historia: ${r.score} puntos · ${JSON.stringify(lr)}`);
    await p.goHome(); await p.closeAny();
  });
  await step(p, "cuenta", () => crearCuenta(p, "josepferrer", "Reus1958", [["Josep Ferrer", "Reus1958"], ["josepferrer", "1958"]]));
  await step(p, "olvido", async () => {
    await p.tapUI("cuenta");
    await p.tap("Cerrar sesión"); await sleep(1000);
    p.say("cierra la sesión: " + (await p.text("#cuTitle")).trim());
    await p.type("#cuU", "josepferrer"); await p.type("#cuP", "reus1958");
    await p.tap(p.page.locator('#cuBody [data-do="login"]')); await sleep(4000);
    p.say("se equivoca de contraseña: «" + (await p.text("#cuMsg")).trim() + "»");
    await p.tap("He olvidado la contraseña");
    await p.type("#cuU", "josepferrer"); await p.type("#cuC", p.code.toLowerCase().replace(/-/g, " ")); await p.type("#cuP", "Reus2026"); await p.type("#cuP2", "Reus2026");
    await p.tap(p.page.locator('#cuBody [data-do="recover"]'));
    for (let i = 0; i < 80; i++) { await sleep(250); if (await p.page.locator('[data-do="logout"]').count()) break; }
    p.say("recupera con el código (escrito en minúsculas y con espacios): «" + (await p.text("#cuMsg")).trim() + "» · " + (await p.text("#cuTitle")).trim());
    await p.closeAny();
  });
  RES.josep.codigo = p.code; // lo apunta en un papel; lo usa el día 3
  RES.josep.report = p.report(); await p.ctx.storageState({ path: OUT + "josep.json" }); await p.ctx.close(); saveDb(); save();
}

// ===== 4. Valentina Gómez, 22, Caracas: Android barato, red lenta, juega mucho =====
{
  const p = new Persona({ nombre: "Valentina", dispositivo: "Android barato 360×740, procesador lento y 3G", device: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 12; SM-A035M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" }, locale: "es-VE", tz: "America/Caracas", touch: true, slow: 1, cpu: 4, net: { offline: false, latency: 300, downloadThroughput: 90000, uploadThroughput: 40000 } });
  await p.open();
  await step(p, "diario", () => diario(p));
  RES.valentina = { partidas: await step(p, "jugar", () => jugar(p, 4, SK.bueno, "Vale", true)) };
  await step(p, "ahorro", () => ajuste(p, "Ahorro de batería"));
  RES.valentina.conAhorro = await step(p, "jugar2", () => jugar(p, 2, SK.bueno, "Vale", false));
  await step(p, "sin red", async () => {
    await p.ctx.setOffline(true); p.offline = true;
    await crearCuenta(p, "valegomez", "caracas22").catch(() => {});
    p.say("sin cobertura, el mensaje es: «" + (await p.text("#cuMsg")).trim() + "»");
    await p.ctx.setOffline(false); p.offline = false;
    p.code = null;
    await p.closeAny();
    await crearCuenta(p, "valegomez", "caracas22");
  });
  await step(p, "misiones", async () => { await p.tapUI("mMis"); await sleep(1200); p.say("Misiones: " + (await p.text("#progBody")).replace(/\s+/g, " ").trim().slice(0, 160)); const c = p.page.getByRole("button", { name: /Cobrar/ }).filter({ visible: true }); const n = await c.count(); for (let i = 0; i < n; i++) await p.tap(c.first()); p.say(`cobra ${n} premios`); await p.closeAny(); });
  RES.valentina.report = p.report(); await p.ctx.storageState({ path: OUT + "valentina.json" }); await p.ctx.close(); saveDb(); save();
}

// ===== 5. Leo Rodríguez, 13, l'Hospitalet: iPhone SE, juega desde hace una semana, quiere un famoso =====
{
  const p = new Persona({ nombre: "Leo", dispositivo: "iPhone SE (pantalla pequeña)", device: "iPhone SE", locale: "es-ES", tz: "Europe/Madrid", touch: true, slow: 0.7,
    seed: { elsPanetsHucha: 1650, elsPanetsBest: 52, elsPanetsBestComidas: 9, elsPanetsPlayerName: "Leo", elsPanetsTutorial: "1" } });
  await p.open();
  await step(p, "diario", () => diario(p));
  await step(p, "premium", async () => {
    await p.tapUI("mShop");
    await p.tap(p.page.locator('#shopTabs [data-shop="premium"]'));
    await p.checkFit("boxOverlay");
    await p.tap(p.page.locator('#premBody [data-f="f_holmes"]'));
    p.say("mira a Sherlock: " + (await p.text("#premBody")).replace(/\s+/g, " ").trim().slice(0, 120));
    await p.tap(p.page.locator("#prBuy"));
    await sleep(1200);
    await p.tap(p.page.locator("#prPick"));
    p.say("lo compra y lo elige: " + (await p.page.evaluate(() => localStorage.elsPanetsCharacter)) + ", le quedan " + (await p.page.evaluate(() => localStorage.elsPanetsHucha)) + " panets");
    await p.closeAny();
  });
  RES.leo = { partidas: await step(p, "jugar", () => jugar(p, 4, SK.bueno, "Leo", true)) };
  await step(p, "cuenta", () => crearCuenta(p, "leocrack13", "leoleo123", [["Leo Crack", "leoleo123"], ["leocrack13", "123"], ["leocrack13", "leoleo123", "leoleo12"]]));
  await step(p, "amigo", async () => {
    await p.tapUI("cuenta");
    await p.tap("Amigos");
    await p.type("#cuAdd", "sergionav");
    await p.tap("Añadir"); await sleep(2500);
    p.say("añade a Sergio de amigo: " + (await p.text("#cuFriends")).replace(/\s+/g, " ").trim().slice(0, 100) + " · " + (await p.text("#cuMsg")).trim());
    await p.type("#cuAdd", "pepitoxx"); await p.tap("Añadir"); await sleep(2500);
    p.say("prueba con alguien que no existe: «" + (await p.text("#cuMsg")).trim() + "»");
    await p.closeAny();
  });
  RES.leo.report = p.report(); await p.ctx.storageState({ path: OUT + "leo.json" }); await p.ctx.close(); saveDb(); save();
}
RES.db = Object.keys(db).map((k) => k.split("/")[0].replace("elsPanets", "")).reduce((o, k) => ((o[k] = (o[k] || 0) + 1), o), {});
save();
await close();
console.log("FIN");
