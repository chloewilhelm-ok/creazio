// Sert le site construit (.vercel/output, preset Vercel de Nitro) comme Vercel : fichiers statiques d'abord,
// sinon la fonction serveur. Utilisé par les tests Playwright (npm run test:e2e), sans compte ni base.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sortie = path.resolve(process.argv[2] ?? ".vercel/output");
const port = Number(process.argv[3] ?? 4173);
const statique = path.join(sortie, "static");
const { default: serveur } = await import(pathToFileURL(path.join(sortie, "functions/__server.func/index.mjs")).href);
const types = { ".js": "text/javascript", ".css": "text/css", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".txt": "text/plain", ".woff2": "font/woff2" };

http.createServer(async (req, res) => {
  const fichier = path.join(statique, decodeURIComponent((req.url ?? "/").split("?")[0]));
  if (fichier.startsWith(statique) && fs.existsSync(fichier) && fs.statSync(fichier).isFile()) {
    res.writeHead(200, { "content-type": types[path.extname(fichier)] ?? "application/octet-stream" });
    fs.createReadStream(fichier).pipe(res);
    return;
  }
  const r = await serveur.fetch(new Request(`http://127.0.0.1:${port}${req.url}`, { method: req.method, headers: req.headers }));
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, "127.0.0.1", () => console.log(`Site construit servi sur http://127.0.0.1:${port}`));
