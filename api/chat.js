// Serverless function (Vercel). API key disimpan di Environment Variable, BUKAN di frontend.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, system } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages wajib diisi" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.MODEL || "claude-sonnet-5-5",
        max_tokens: 1500,
        system: system || "Kamu DRX.AI, asisten AI yang ramah dan ringkas. Jawab dalam bahasa pengguna.",
        messages: messages.slice(-20),
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Gagal memanggil AI" });
    const reply = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
