// Día 2: Leo reta a Sergio en directo (los dos con su móvil), reacciones, revancha y «Buscar rival».
import fs from "fs";
import { launch, close, Persona, sleep, rnd, OUT, db, saveDb } from "./lib.mjs";
const SK = { react: 165, cool: 120, bias: 0.12, noise: 28, miss: 0.015, double: 0.03, waitSecs: 25 };
const RES = {};
const step = async (p, name, fn) => { try { return await fn(); } catch (e) { p.note(`falló «${name}»: ${String(e.message).split("\n")[0].slice(0, 160)}`); return null; } };
const body = async (p) => (await p.text("#liveBody")).replace(/\s+/g, " ").trim().slice(0, 160);
const local = (p) => p.page.evaluate(() => ({ hucha: +localStorage.elsPanetsHucha, duelos: localStorage.elsPanetsDuelos || "" }));

await launch();
const leo = new Persona({ nombre: "Leo", dispositivo: "iPhone SE", device: "iPhone SE", locale: "es-ES", tz: "Europe/Madrid", touch: true, slow: 0.7 });
const ser = new Persona({ nombre: "Sergio", dispositivo: "Pixel 7", device: "Pixel 7", locale: "es-ES", tz: "Europe/Madrid", touch: true, slow: 0.9 });
await leo.open({ storageState: OUT + "leo.json" });
await ser.open({ storageState: OUT + "sergio-movil.json" });
for (const p of [leo, ser]) await p.closeAny();
const antes = { leo: await local(leo), ser: await local(ser) };

async function ronda(n) {
  for (const p of [leo, ser]) { await p.tap(p.page.locator("#lvReady")); p.say("pulsa «" + (n ? "¡Revancha!" : "¡Estoy listo!") + "»"); }
  const [a, b] = await Promise.all([leo.playRun(SK), ser.playRun(SK)]);
  leo.say(`ronda ${n + 1}: Leo ${a.score} (${a.fps} img/s) · Sergio ${b.score} (${b.fps} img/s)`);
  for (let i = 0; i < 30; i++) { await sleep(500); if ((await leo.visible("#liveOverlay")) && (await ser.visible("#liveOverlay")) && /gan|empat|perd/i.test((await body(leo)) + (await body(ser)))) break; }
  await sleep(1500);
  leo.say("Leo ve: " + (await body(leo)));
  ser.say("Sergio ve: " + (await body(ser)));
  return [a.score, b.score];
}

await step(leo, "retar", async () => {
  await leo.tapUI("cuenta");
  await leo.tap("Amigos");
  await leo.tap(leo.page.locator('[data-reta="sergionav"]'));
  await sleep(3000);
  leo.say("reta a Sergio; ve: " + (await body(leo)));
});
// Sergio está en el inicio de su móvil, sin hacer nada
let banner = false;
for (let i = 0; i < 50 && !banner; i++) { await sleep(1000); banner = await ser.visible(".cuInvite.on"); }
if (!banner) {
  ser.note("en 50 s no le llega el reto de Leo (Sergio no tiene a Leo en sus amigos)");
  await step(ser, "añadir a Leo", async () => {
    await ser.tapUI("cuenta"); await ser.tap("Amigos"); await ser.type("#cuAdd", "leocrack13"); await ser.tap("Añadir"); await sleep(2000);
    ser.say("añade a Leo de amigo: " + (await ser.text("#cuMsg")).trim()); await ser.closeAny();
  });
  const t0 = Date.now();
  for (let i = 0; i < 50 && !banner; i++) { await sleep(1000); banner = await ser.visible(".cuInvite.on"); }
  ser.say(banner ? `ahora sí le llega el aviso (a los ${Math.round((Date.now() - t0) / 1000)} s)` : "sigue sin llegarle");
}
if (banner) {
  ser.say("aviso: " + (await ser.text(".cuInvite")).replace(/\s+/g, " ").trim());
  await ser.tap(ser.page.locator('.cuInvite button[data-a="1"]'));
  await sleep(4000);
  ser.say("entra en la sala: " + (await body(ser)));
  RES.r1 = await step(leo, "ronda 1", () => ronda(0));
  await step(leo, "reacción", async () => {
    const em = leo.page.locator("#lvEmo button").filter({ visible: true });
    leo.say(`tiene ${await em.count()} reacciones a mano`);
    await em.nth(2).tap();
    let seen = false; for (let i = 0; i < 20 && !seen; i++) { await sleep(200); seen = await ser.page.locator(".lvFloat").count() > 0; }
    ser.say(seen ? "le sale la reacción de Leo: " + (await ser.text(".lvFloat")) : "no ve la reacción");
    if (!seen) ser.note("la reacción de Leo no le llega a Sergio");
  });
  RES.r2 = await step(leo, "revancha", () => ronda(1));
  for (const p of [leo, ser]) { await step(p, "salir", async () => { await p.tap(p.page.locator("#liveLeave")); await sleep(1500); await p.closeAny(); }); }
}
RES.despues = { leo: await local(leo), ser: await local(ser) };
leo.say(`panets por los duelos: Leo ${RES.despues.leo.hucha - antes.leo.hucha}, Sergio ${RES.despues.ser.hucha - antes.ser.hucha} · duelos Leo ${RES.despues.leo.duelos}, Sergio ${RES.despues.ser.duelos}`);

// «Buscar rival ahora» los dos a la vez
await step(leo, "buscar rival", async () => {
  for (const p of [leo, ser]) { await p.closeAny(); await p.tapUI("mRetos"); await sleep(800); }
  await Promise.all([leo.tap("Buscar rival ahora"), sleep(rnd(200, 900)).then(() => ser.tap("Buscar rival ahora"))]);
  let ok = false; for (let i = 0; i < 30 && !ok; i++) { await sleep(500); ok = /lísto|listo/i.test((await body(leo)) + (await body(ser))) && (await leo.visible("#lvReady")) && (await ser.visible("#lvReady")); }
  leo.say("Buscar rival: " + (ok ? "se encuentran" : "no se encuentran") + " · Leo ve «" + (await body(leo)).slice(0, 90) + "» · Sergio ve «" + (await body(ser)).slice(0, 90) + "»");
  if (!ok) leo.note("«Buscar rival ahora» no juntó a los dos que buscaban a la vez");
  for (const p of [leo, ser]) { await p.tap(p.page.locator("#liveLeave")).catch(() => {}); await sleep(1200); await p.closeAny(); }
});
await step(ser, "ranking de duelos", async () => { await ser.tapUI("cuenta"); await ser.tap("Ranking de duelos"); await sleep(2500); ser.say("ranking de duelos: " + (await ser.text("#cuBody")).replace(/\s+/g, " ").trim().slice(0, 160)); await ser.closeAny(); });
RES.leo = leo.report(); RES.ser = ser.report();
fs.writeFileSync(OUT + "dia2.json", JSON.stringify(RES, null, 1));
await leo.ctx.storageState({ path: OUT + "leo.json" }); await ser.ctx.storageState({ path: OUT + "sergio-movil.json" });
await close();
console.log("FIN");
