// ===== Helper panggil AI lewat /api/chat =====
async function askAI(messages, system) {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Terjadi kesalahan");
  return d.reply;
}

// ===== Daftar tools. Tambah tool baru = tambah satu objek di sini =====
// type "ai": kirim input ke AI dengan prompt sistem tertentu
// type "local": diproses di browser tanpa AI
const TOOLS = [
  { id: "chat", group: "Chat", name: "Chat AI", desc: "Ngobrol dengan DRX.AI tentang apa saja.", type: "chat" },
  { id: "ringkas", group: "Tools AI", name: "Ringkas Teks", desc: "Tempel teks panjang, dapatkan ringkasannya.", type: "ai",
    system: "Ringkas teks pengguna menjadi poin-poin singkat dalam bahasa yang sama." },
  { id: "terjemah", group: "Tools AI", name: "Penerjemah", desc: "Terjemahkan teks ke bahasa yang kamu pilih.", type: "ai",
    options: ["Indonesia", "Inggris", "Jepang", "Korea", "Arab", "Spanyol"],
    system: (o) => `Terjemahkan teks pengguna ke bahasa ${o}. Balas hanya hasil terjemahan.` },
  { id: "kode", group: "Tools AI", name: "Bantuan Kode", desc: "Jelaskan atau perbaiki kode kamu.", type: "ai",
    system: "Kamu ahli programming. Jelaskan atau perbaiki kode pengguna, tampilkan kode hasil akhir dengan penjelasan singkat." },
  { id: "email", group: "Tools AI", name: "Penulis Email", desc: "Jelaskan isi email, AI yang menuliskannya.", type: "ai",
    system: "Tulis email profesional yang sopan dan jelas berdasarkan permintaan pengguna, lengkap dengan subjek." },
  { id: "password", group: "Tools Lokal", name: "Generator Password", desc: "Buat password acak yang kuat.", type: "local",
    run: () => { const c = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*"; const a = new Uint32Array(16); crypto.getRandomValues(a); return [...a].map(n => c[n % c.length]).join(""); }, noInput: true },
  { id: "hitung", group: "Tools Lokal", name: "Penghitung Kata", desc: "Hitung kata, karakter, dan kalimat.", type: "local",
    run: (t) => `Kata: ${(t.trim().match(/\S+/g) || []).length}\nKarakter: ${t.length}\nKalimat: ${(t.match(/[.!?]+/g) || []).length}` },
  { id: "json", group: "Tools Lokal", name: "Format JSON", desc: "Rapikan JSON agar mudah dibaca.", type: "local",
    run: (t) => { try { return JSON.stringify(JSON.parse(t), null, 2); } catch (e) { return "JSON tidak valid: " + e.message; } } },
  { id: "base64", group: "Tools Lokal", name: "Base64", desc: "Enkode teks ke Base64 (atau kembali).", type: "local",
    options: ["Enkode", "Dekode"],
    run: (t, o) => { try { return o === "Dekode" ? decodeURIComponent(escape(atob(t))) : btoa(unescape(encodeURIComponent(t))); } catch (e) { return "Input tidak valid"; } } },
];

const $ = (s) => document.querySelector(s);
const nav = $("#nav"), view = $("#view");
let history = [];

// ===== Sidebar =====
let lastGroup = "";
TOOLS.forEach((t) => {
  if (t.group !== lastGroup && t.group !== "Chat") { nav.insertAdjacentHTML("beforeend", `<small>${t.group}</small>`); }
  lastGroup = t.group;
  const b = document.createElement("button");
  b.textContent = t.name; b.dataset.id = t.id;
  b.onclick = () => open(t.id);
  nav.appendChild(b);
});

function open(id) {
  const t = TOOLS.find((x) => x.id === id);
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.id === id));
  $("#title").textContent = t.name; $("#desc").textContent = t.desc;
  view.innerHTML = "";
  if (t.type === "chat") return chatView();
  toolView(t);
}

// ===== Tampilan Chat =====
function chatView() {
  view.innerHTML = `<div class="msgs" id="msgs"></div>
    <div class="row"><textarea id="q" placeholder="Tulis pesan..." rows="1"></textarea><button class="go" id="send">Kirim</button></div>`;
  const msgs = $("#msgs");
  const add = (cls, text) => { const d = document.createElement("div"); d.className = "m " + cls; d.textContent = text; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
  history.forEach((m) => add(m.role === "user" ? "u" : "a", m.content));
  if (!history.length) add("a", "Halo, aku DRX.AI. Mau ngobrol apa hari ini?");
  const send = async () => {
    const q = $("#q").value.trim(); if (!q) return;
    $("#q").value = ""; add("u", q); history.push({ role: "user", content: q });
    const wait = add("a", "Sedang berpikir..."); $("#send").disabled = true;
    try { const r = await askAI(history); history.push({ role: "assistant", content: r }); wait.textContent = r; }
    catch (e) { history.pop(); wait.textContent = "Gagal: " + e.message + ". Coba kirim lagi."; }
    $("#send").disabled = false;
  };
  $("#send").onclick = send;
  $("#q").onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
}

// ===== Tampilan Tool =====
function toolView(t) {
  const opt = t.options ? `<select id="opt">${t.options.map((o) => `<option>${o}</option>`).join("")}</select>` : "";
  view.innerHTML = `${opt}${t.noInput ? "" : '<textarea id="in" placeholder="Masukkan teks di sini..."></textarea>'}
    <div><button class="go" id="run">${t.noInput ? "Buat sekarang" : "Jalankan"}</button></div><div class="out" id="out"></div>`;
  $("#run").onclick = async () => {
    const text = t.noInput ? "" : $("#in").value, o = t.options ? $("#opt").value : null, out = $("#out");
    if (!t.noInput && !text.trim()) { out.textContent = "Isi teks dulu."; return; }
    if (t.type === "local") { out.textContent = t.run(text, o); return; }
    out.textContent = "Memproses..."; $("#run").disabled = true;
    try { out.textContent = await askAI([{ role: "user", content: text }], typeof t.system === "function" ? t.system(o) : t.system); }
    catch (e) { out.textContent = "Gagal: " + e.message; }
    $("#run").disabled = false;
  };
}

open("chat");
