const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*?)\s*$/);
    if (match) values[match[1].trim()] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

const env = { ...loadEnv(path.join(__dirname, ".env")), ...process.env };
const apiKey = env.OPENROUTER_API_KEY;
const model = env.OPENROUTER_MODEL || "openrouter/free";
const port = Number(env.PORT || 4173);

if (!apiKey || apiKey.startsWith("sk-or-v1-ISI_API_KEY")) {
  console.warn("OPENROUTER_API_KEY belum dikonfigurasi. Tambahkan key pada file .env.");
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error("Payload terlalu besar."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("JSON tidak valid.")); }
    });
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/config" && request.method === "GET") {
    sendJson(response, 200, { model });
    return;
  }

  if (url.pathname === "/api/chat" && request.method === "POST") {
    if (!apiKey || apiKey.startsWith("sk-or-v1-ISI_API_KEY")) {
      sendJson(response, 503, { error: "API key belum dikonfigurasi pada server." });
      return;
    }

    try {
      const body = await readJson(request);
      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        sendJson(response, 400, { error: "Pesan harus berupa array yang tidak kosong." });
        return;
      }

      const messages = body.messages
        .filter(message => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
        .slice(-20)
        .map(message => ({ role: message.role, content: message.content.slice(0, 10000) }));

      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": `http://localhost:${port}`,
          "X-Title": "Solvex AI"
        },
        body: JSON.stringify({ model, messages, temperature: 0.7 })
      });

      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        sendJson(response, upstream.status, { error: data.error?.message || "Permintaan API gagal." });
        return;
      }

      sendJson(response, 200, data);
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method tidak didukung." });
    return;
  }

  const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = path.resolve(__dirname, relativePath);
  if (filePath !== __dirname && !filePath.startsWith(__dirname + path.sep)) {
    sendJson(response, 403, { error: "Akses ditolak." });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, error.code === "ENOENT" ? 404 : 500, { error: "File tidak ditemukan." });
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Solvex AI berjalan di http://127.0.0.1:${port}`);
});
