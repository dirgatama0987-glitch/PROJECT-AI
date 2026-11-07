export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, system } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages wajib diisi" });
  }

  const model = process.env.MODEL || "gemini-2.5-flash";
  const contents = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system || "Kamu DRX.AI, asisten AI yang ramah dan ringkas. Jawab dalam bahasa pengguna." }],
          },
          contents,
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Gagal memanggil AI" });
    const reply = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("\n");
    res.status(200).json({ reply: reply || "(tidak ada jawaban)" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
