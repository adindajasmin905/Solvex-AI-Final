const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method tidak didukung." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";

  if (!apiKey || apiKey.startsWith("sk-or-v1-ISI_API_KEY")) {
    return response.status(503).json({ error: "API key belum dikonfigurasi pada server." });
  }

  if (!Array.isArray(request.body?.messages) || request.body.messages.length === 0) {
    return response.status(400).json({ error: "Pesan harus berupa array yang tidak kosong." });
  }

  const messages = request.body.messages
    .filter((message) =>
      message &&
      ["user", "assistant"].includes(message.role) &&
      typeof message.content === "string"
    )
    .slice(-20)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 10000)
    }));

  if (messages.length === 0) {
    return response.status(400).json({ error: "Pesan yang dikirim tidak valid." });
  }

  try {
    const upstream = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": request.headers.origin || "https://vercel.app",
        "X-Title": "Solvex AI"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7
      })
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: data.error?.message || "Permintaan API gagal."
      });
    }

    return response.status(200).json(data);
  } catch (error) {
    return response.status(502).json({
      error: "Tidak dapat terhubung ke penyedia AI."
    });
  }
}
