// Día 3: Josep recupera la contraseña; Marta vuelve a jugar (mensajes del final); Valentina añade a Marta.
import fs from "fs";
import { launch, close, Persona, sleep, OUT } from "./lib.mjs";
const step = async (p, name, fn) => { try { return await fn(); } catch (e) { p.note(`falló «${name}»: ${String(e.message).split("\n")[0].slice(0, 160)}`); return null; } };
const diario = async (p) => { await sleep(2500); if (await p.visible("#dailyTake")) { await p.tap(p.page.locator("#dailyTake")); await sleep(1200); await p.tap(p.page.locator("#dailyTake")); p.say("cobra el premio diario"); } };
await launch();

const jo = new Persona({ nombre: "Josep", dispositivo: "tablet Galaxy Tab S4", device: "Galaxy Tab S4", locale: "es-ES", tz: "Europe/Madrid", touch: true, slow: 2.2 });
await jo.open({ storageState: OUT + "josep.json" });
await diario(jo);
await step(jo, "olvido", async () => {
  jo.say(`abre el juego: récord ${await jo.q("best")}, sesión ${await jo.page.evaluate(() => window.ElsPanetsCuenta.user() || "ninguna")}`);
  await jo.tapUI("cuenta");
  await jo.type("#cuU", "josepferrer"); await jo.type("#cuP", "reus1958");
  await jo.tap(jo.page.locator('#cuBody [data-do="login"]')); await sleep(4000);
  jo.say("se equivoca de contraseña: «" + (await jo.text("#cuMsg")).trim() + "»");
  await jo.tap("He olvidado la contraseña");
  await jo.type("#cuU", "josepferrer"); await jo.type("#cuC", JSON.parse(fs.readFileSync(OUT + "dia1.json", "utf8")).josep.codigo.toLowerCase().replace(/-/g, " ")); await jo.type("#cuP", "Reus2026"); await jo.type("#cuP2", "Reus2026");
  await jo.tap(jo.page.locator('#cuBody [data-do="recover"]'));
  await sleep(3000);
  await jo.page.waitForFunction(() => window.elsPanetsPrueba && window.ElsPanetsCuenta, null, { timeout: 30000 });
  await sleep(2500);
  jo.say(`recupera con el código escrito en minúsculas y con espacios → sesión ${await jo.page.evaluate(() => window.ElsPanetsCuenta.user())}, récord ${await jo.q("best")}`);
});

const ma = new Persona({ nombre: "Marta", dispositivo: "Xiaomi Redmi Note 13", device: { viewport: { width: 393, height: 873 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true }, locale: "ca-ES", tz: "Europe/Madrid", touch: true, slow: 1 });
await ma.open({ storageState: OUT + "marta.json" });
await diario(ma);
await step(ma, "jugar", async () => {
  for (let i = 0; i < 4; i++) {
    const r = await ma.playRun({ react: 230, cool: 140, bias: 0.12, noise: 45, miss: 0.05, double: 0.03 });
    await ma.afterRun("Marta", false);
    const o = await ma.overInfo();
    ma.say(`partida: ${r.score} (récord ${o.best}) · «${o.msgs.map((m) => m.txt).join(" / ")}»`);
    await sleep(1500); await ma.tapUI("again");
  }
});

const va = new Persona({ nombre: "Valentina", dispositivo: "Android barato", device: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, locale: "es-VE", tz: "America/Caracas", touch: true, slow: 1 });
await va.open({ storageState: OUT + "valentina.json" });
await diario(va);
await step(va, "amiga", async () => {
  await va.tapUI("cuenta"); await va.tap("Amigos"); await va.type("#cuAdd", "MartaPuig"); await va.tap("Añadir"); await sleep(2500);
  va.say("añade a Marta: «" + (await va.text("#cuMsg")).trim() + "»");
  await va.tap(va.page.locator('[data-reta="martapuig"]')); await sleep(1500);
  va.say("la reta: «" + (await va.text("#lvToast")).trim() + "»");
});
for (const p of [jo, ma, va]) console.log(p.nombre, "errores:", JSON.stringify(p.report().errores));
await close();
console.log("FIN");
