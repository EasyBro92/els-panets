// Servidor estático simple, sin dependencias, para probar el juego en el móvil.
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.argv[2]) || 8080;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = path.normalize(path.join(ROOT, reqPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

function localIPs() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

server.listen(PORT, () => {
  console.log("Els Panets corriendo en:");
  console.log("  http://localhost:" + PORT);
  for (const ip of localIPs()) {
    console.log("  http://" + ip + ":" + PORT + "  <-- abre esta URL en tu movil (misma WiFi)");
  }
});
