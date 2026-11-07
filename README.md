# DRX.AI

Web AI dengan Chat AI dan banyak tools (ringkas, terjemah, bantuan kode, penulis email, generator password, penghitung kata, format JSON, Base64).

## Struktur
- `index.html`, `style.css`, `app.js` : tampilan dan logika (frontend)
- `api/chat.js` : server kecil yang memanggil Anthropic API (API key aman di sini)

## Cara jalan
1. Dapatkan API key di https://console.anthropic.com
2. Upload repo ini ke GitHub
3. Deploy di https://vercel.com (Import dari GitHub)
4. Di Vercel: Settings > Environment Variables > tambah `ANTHROPIC_API_KEY` = key kamu
5. Redeploy. Selesai.

## Tambah tool baru
Buka `app.js`, tambahkan satu objek di array `TOOLS`.
