// Cinco personas probando Els Panets (28/11/2026): herramientas comunes.
// Uso: con el servidor de prueba en marcha (puerto 8096), node dia1.mjs, luego dia2.mjs y dia3.mjs.
// Necesita Microsoft Edge y la librería Playwright que ya hay en roadtrip-euskadi-2026/node_modules.
// Cada persona es un contexto de navegador aparte (su propio «móvil»: almacenamiento,
// pantalla, idioma, zona horaria). Las cuentas van a una base de datos de mentira
// compartida (aquí, en Node), así se puede entrar desde otro móvil sin tocar la de verdad.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import fs from "fs";
const require = createRequire("C:/Users/Isidro/Documents/apps isidro/Apps de claude/roadtrip-euskadi-2026/package.json");
const { chromium, devices } = require("playwright");
export { devices };
export const URL0 = "http://localhost:8096/?prueba";
// lo que va guardando cada persona (su «móvil», la base de mentira, los registros) queda en salida/, fuera de git
export const OUT = fileURLToPath(new URL("./salida/", import.meta.url)).replace(/\\/g, "/");
fs.mkdirSync(OUT, { recursive: true });
const DBFILE = OUT + "fakedb.json";
export const db = fs.existsSync(DBFILE) ? JSON.parse(fs.readFileSync(DBFILE, "utf8")) : {};
export const saveDb = () => fs.writeFileSync(DBFILE, JSON.stringify(db));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rnd = (a, b) => a + Math.random() * (b - a);

let browser;
export async function launch() { browser = await chromium.launch({ channel: "msedge", headless: true }); return browser; }
export async function close() { saveDb(); if (browser) await browser.close(); }

// la base de mentira, con la misma forma que usa cuenta.js (fsdb = { db, m })
const FAKE = `(() => {
  const call = (op, a, b) => window.__fdb(op, a, b);
  const m = {
    doc: (d, c, id) => ({ p: c + "/" + id, id }),
    serverTimestamp: () => Date.now(),
    getDoc: async (r) => { const d = await call("get", r.p); return { exists: () => d != null, data: () => d, id: r.id }; },
    deleteDoc: async (r) => { await call("del", r.p); },
    writeBatch: () => { const ops = []; return { set: (r, v) => ops.push(["s", r.p, v]), update: (r, v) => ops.push(["u", r.p, v]), delete: (r) => ops.push(["d", r.p]), commit: async () => { await call("batch", ops); } }; },
    collection: (d, c) => ({ c }), query: (c) => c, orderBy: () => 0, limit: () => 0,
    getDocs: async (q) => { const a = await call("list", q.c); return { forEach: (f) => a.forEach(([id, v]) => f({ id, data: () => v })) }; },
  };
  window.__cuentaFake = { db: {}, m };
})();`;

export class Persona {
  constructor(o) { Object.assign(this, o); this.log = []; this.errors = []; this.notes = []; this.writes = []; }
  say(t) { const line = `[${this.nombre}] ${t}`; this.log.push(t); console.log(line); }
  note(t) { this.notes.push(t); this.say("⚠ " + t); }
  async open(extra = {}) {
    const dev = typeof this.device === "string" ? devices[this.device] : this.device;
    this.ctx = await browser.newContext({ ...dev, locale: this.locale, timezoneId: this.tz, colorScheme: this.dark ? "dark" : "light", ...extra });
    await this.ctx.exposeBinding("__fdb", async (src, op, a, b) => {
      if (this.offline) { await sleep(1500); throw new Error("sin-red"); }
      if (op === "get") return db[a] ?? null;
      if (op === "del") { delete db[a]; return null; }
      if (op === "list") return Object.entries(db).filter(([k]) => k.startsWith(a + "/")).map(([k, v]) => [k.slice(a.length + 1), v]).sort((x, y) => (y[1].w || 0) - (x[1].w || 0));
      if (op === "batch") { for (const [o, p, v] of a) { if (o === "s") db[p] = v; else if (o === "u") db[p] = Object.assign({}, db[p], v); else delete db[p]; } return null; }
    });
    await this.ctx.addInitScript(FAKE);
    if (this.seed) await this.ctx.addInitScript(`if (!localStorage.getItem("__seed")) { const s = ${JSON.stringify(this.seed)}; for (const k in s) localStorage.setItem(k, String(s[k])); localStorage.setItem("__seed", "1"); }`);
    // nada de escribir en la base de datos de verdad (Firestore): solo leer
    await this.ctx.route(/firestore\.googleapis\.com/, (r) => {
      const u = r.request().url();
      if (/Write\/channel|:commit|:batchWrite/.test(u)) { this.writes.push(u.split("?")[0]); return r.abort(); }
      return r.continue();
    });
    this.page = await this.ctx.newPage();
    this.page.on("pageerror", (e) => { this.errors.push(String(e.message || e).slice(0, 200)); this.say("💥 " + e.message); });
    this.page.on("console", (m) => { if (m.type() === "error") { const t = m.text(); if (!/favicon|net::ERR_|Failed to load resource/.test(t)) this.errors.push("console: " + t.slice(0, 200)); } });
    if (this.cpu > 1) { this.cdp = await this.ctx.newCDPSession(this.page); await this.cdp.send("Emulation.setCPUThrottlingRate", { rate: this.cpu }); }
    if (this.net) { this.cdp = this.cdp || (await this.ctx.newCDPSession(this.page)); await this.cdp.send("Network.emulateNetworkConditions", this.net); }
    const t0 = Date.now();
    await this.page.goto(URL0, { waitUntil: "load" });
    await this.page.waitForFunction(() => window.elsPanetsPrueba && document.getElementById("game"), null, { timeout: 30000 });
    this.say(`abre el juego en ${this.dispositivo} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    await sleep(1500);
    return this;
  }
  // lo de dentro del juego (solo para saber dónde están las cosas, como los ojos de la persona)
  q(code) { return this.page.evaluate((c) => window.elsPanetsPrueba.interno(c), code); }
  async state() { return this.q("state"); }
  async toClient(x, y) {
    return this.page.evaluate(([x, y]) => { const r = document.getElementById("game").getBoundingClientRect(); const [LW, LH] = window.elsPanetsPrueba.interno("[LW, LH]"); return [r.left + x * r.width / LW, r.top + y * r.height / LH]; }, [x, y]);
  }
  async tapAt(cx, cy) {
    if (this.touch) await this.page.touchscreen.tap(cx, cy); else await this.page.mouse.click(cx, cy);
  }
  // toca un botón dibujado en el juego (los de ui())
  async tapUI(name) {
    const b = await this.q(`ui().${name}`);
    if (!b) throw new Error("no hay botón " + name);
    const [x, y] = b.r != null ? [b.x, b.y] : [b.x + b.w * rnd(0.3, 0.7), b.y + b.h * rnd(0.3, 0.7)];
    const [cx, cy] = await this.toClient(x, y);
    const vp = this.page.viewportSize();
    if (cx < 0 || cy < 0 || cx > vp.width || cy > vp.height) this.note(`el botón «${name}» queda fuera de la pantalla (${Math.round(cx)},${Math.round(cy)} en ${vp.width}×${vp.height})`);
    await this.tapAt(cx, cy);
    await sleep(rnd(250, 600) * this.slow);
  }
  // toca un botón de una ventana por su texto, como lo haría una persona
  async tap(text, opts = {}) {
    const loc = typeof text === "string" ? this.page.getByRole("button", { name: text, exact: !!opts.exact }).filter({ visible: true }).first() : text;
    try { await loc.waitFor({ state: "visible", timeout: opts.timeout || 8000 }); }
    catch (e) { this.note(`no encuentra el botón «${typeof text === "string" ? text : "?"}»`); return false; }
    const box = await loc.boundingBox(), vp = this.page.viewportSize();
    if (box && (box.y + box.height > vp.height + 1 || box.y < -1)) { this.say(`tiene que bajar para ver «${text}»`); await loc.scrollIntoViewIfNeeded(); }
    if (this.touch) await loc.tap(); else await loc.click();
    await sleep(rnd(300, 800) * this.slow);
    return true;
  }
  async type(sel, text) {
    const loc = this.page.locator(sel).filter({ visible: true }).first();
    await loc.waitFor({ state: "visible", timeout: 8000 });
    if (this.touch) await loc.tap(); else await loc.click();
    await loc.fill("");
    await loc.pressSequentially(text, { delay: rnd(60, 160) * this.slow });
    await sleep(rnd(200, 500));
  }
  async text(sel) { try { return (await this.page.locator(sel).first().textContent({ timeout: 3000 })) || ""; } catch (e) { return ""; } }
  async visible(sel) { try { return await this.page.locator(sel).first().isVisible(); } catch (e) { return false; } }
  async openOverlay() { return this.page.evaluate(() => [...document.querySelectorAll(".overlay, #nameOverlay, #leaderboardOverlay, #installOverlay")].filter((e) => !e.classList.contains("hidden")).map((e) => e.id)); }
  // un botón o texto de una ventana que se sale de la pantalla
  async checkFit(id) {
    const r = await this.page.evaluate((id) => {
      const el = document.getElementById(id); if (!el) return null;
      const card = el.querySelector(".card, .overlayCard, div") || el; const b = card.getBoundingClientRect();
      const out = [...el.querySelectorAll("button, input")].filter((x) => x.offsetParent).map((x) => { const r = x.getBoundingClientRect(); return { t: (x.textContent || x.placeholder || x.id).trim().slice(0, 24), r: [r.left, r.right, r.top, r.bottom] }; })
        .filter((x) => x.r[0] < -1 || x.r[1] > innerWidth + 1);
      return { w: innerWidth, h: innerHeight, card: [b.width, b.height], wide: out };
    }, id);
    if (r && r.wide.length) this.note(`en la ventana ${id} se salen de lado: ${r.wide.map((x) => x.t).join(", ")}`);
    return r;
  }
  async shot(name) { await this.page.screenshot({ path: OUT + name + ".png" }); }

  // ---------- jugar: el «cerebro» de la persona va dentro de la página ----------
  // ve el pájaro y la columna siguiente, decide con su tiempo de reacción y toca la pantalla
  async playRun(sk) {
    const st = await this.state();
    if (st === 0) await this.tapUI("play");
    // tutorial y «prepárate»
    for (let i = 0, t0 = Date.now(); Date.now() - t0 < (sk.waitSecs || 8) * 1000; i++) {
      const s = await this.state();
      if (s === 2) break;
      if (sk.waitSecs) { await sleep(150); continue; } // en directo empieza solo
      if (s === 1) { const [cx, cy] = await this.toClient(200, (await this.q("LH")) * 0.62); await sleep(rnd(500, 1200) * this.slow); await this.tapAt(cx, cy); }
      else await sleep(400);
    }
    const res = await this.page.evaluate((sk) => new Promise((done) => {
      const P = window.elsPanetsPrueba, cv = document.getElementById("game");
      const G = 1500, t0 = performance.now();
      let busyUntil = 0, frames = 0, flaps = 0, worst = 0, lastF = performance.now();
      const tap = () => {
        const r = cv.getBoundingClientRect(), [LW, LH] = P.interno("[LW, LH]");
        const x = r.left + r.width * (0.45 + Math.random() * 0.3), y = r.top + r.height * (0.55 + Math.random() * 0.25);
        cv.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: sk.mouse ? "mouse" : "touch", isPrimary: true }));
        flaps++;
      };
      const tick = () => {
        const now = performance.now(); frames++; worst = Math.max(worst, now - lastF); lastF = now;
        const s = P.interno("({ st: state, y: player.y, vy: player.vy, x: player.x, gt: groundTop(), c: cols.map((c) => [c.x, c.gapY, c.gap]), sc: score, e: eaten, LH })");
        if (s.st !== 2) { return done({ st: s.st, score: s.sc, comidas: s.e, secs: (now - t0) / 1000, flaps, fps: Math.round(frames / ((now - t0) / 1000)), peor: Math.round(worst) }); }
        if (now > busyUntil) {
          const c = s.c.filter((c) => c[0] + 66 > s.x - 6).sort((a, b) => a[0] - b[0])[0];
          let target = c ? c[1] + c[2] * (0.5 + sk.bias) : s.LH * 0.45;
          target += (Math.random() - 0.5) * sk.noise;
          const d = sk.react / 1000; // lo que tarda en reaccionar
          const yp = s.y + s.vy * d + 0.5 * G * d * d;
          if (yp > target && s.vy > -150) {
            busyUntil = now + sk.react + sk.cool;
            if (Math.random() > sk.miss) setTimeout(() => { tap(); if (Math.random() < sk.double) setTimeout(tap, 90 + Math.random() * 60); }, sk.react * (0.7 + Math.random() * 0.6));
            else busyUntil = now + sk.react * 2.5; // despiste
          }
        }
        if (now - t0 > (sk.maxSecs || 240) * 1000) return done({ st: s.st, score: s.sc, comidas: s.e, secs: (now - t0) / 1000, cortada: true, flaps });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), sk);
    return res;
  }
  // tras chocar: «¿Seguir?», el nombre la primera vez, y el resultado
  async afterRun(wantName, seguir) {
    for (let i = 0; i < 30; i++) {
      const s = await this.state();
      if (s === 8) { await sleep(rnd(900, 2200) * this.slow); const can = await this.q("eaten >= 10"); await this.tapUI(seguir && can ? "segYes" : "segNo"); this.say(seguir && can ? "le da a «Seguir»" : "no sigue"); if (seguir && can) return "sigue"; continue; }
      if (s === 5 || (await this.visible("#nameInput"))) {
        await sleep(rnd(800, 2000) * this.slow);
        this.say(`le pide un nombre; escribe «${wantName}»`);
        await this.type("#nameInput", wantName);
        await this.tap(this.page.locator("#nameSubmit"));
        const msg = await this.text("#nameMsg");
        if (await this.visible("#nameInput")) { this.say("el nombre no vale: " + msg); return "nombre"; }
        continue;
      }
      if (s === 4) return "fin";
      if (s === 3) { await sleep(300); continue; }
      await sleep(300);
    }
    return "?";
  }
  async overInfo() {
    return this.q("({ score, best, eaten, msgs: (typeof overMsgs !== 'undefined' ? overMsgs : null) })").catch(() => null);
  }
  async goHome() {
    const s = await this.state();
    if (s === 4) { await sleep(rnd(1100, 2000)); await this.tapUI("home"); }
    await sleep(600);
    return this.state();
  }
  async closeAny() {
    const open = await this.openOverlay();
    for (const id of open) {
      if (await this.visible("#taleOk")) { await this.tap(this.page.locator("#taleOk")); }
      let btn = this.page.locator(`#${id} [id$=Close], #${id} #dailyTake`).filter({ visible: true }).first();
      if (!(await btn.count())) btn = this.page.locator(`#${id}`).getByRole("button", { name: "Cerrar", exact: true }).filter({ visible: true }).first();
      if (await btn.count()) { if (this.touch) await btn.tap(); else await btn.click(); await sleep(400); }
    }
  }
  report() { return { nombre: this.nombre, dispositivo: this.dispositivo, log: this.log, avisos: this.notes, errores: [...new Set(this.errors)], escriturasBloqueadas: this.writes.length }; }
}
