# Solvex AI — Chatbot API (HTML, CSS, JavaScript)

Website chatbot sederhana dengan tampilan responsif dan integrasi API kompatibel OpenAI, termasuk OpenRouter.

## Fitur
- Chat dengan model AI melalui API.
- API key dan model dibaca dari file `.env` server, tanpa input pengguna.
- Riwayat percakapan tersimpan di LocalStorage.
- Tombol percakapan baru dan contoh prompt.
- Tampilan responsif untuk desktop dan ponsel.
- Format dasar jawaban: paragraf, bold, inline code, dan code block.

## Menjalankan
1. Ekstrak file ZIP.
2. Buka folder proyek.
3. Salin `.env.example` menjadi `.env`.
4. Isi `OPENROUTER_API_KEY` dan `OPENROUTER_MODEL`.
5. Jalankan `npm start`.
6. Buka `http://127.0.0.1:4173`.

## Deploy ke Vercel
1. Push proyek ke GitHub, GitLab, atau Bitbucket.
2. Impor repository di Vercel sebagai proyek baru.
3. Tambahkan environment variable di **Project Settings > Environment Variables**:
   - `OPENROUTER_API_KEY`: API key OpenRouter.
   - `OPENROUTER_MODEL`: model yang digunakan, contoh `openrouter/free`.
4. Deploy proyek. Fungsi serverless tersedia melalui `/api/chat`.
5. Jangan menaruh API key dalam file frontend atau variabel yang diawali `NEXT_PUBLIC`/`VITE`.

Untuk pengujian lokal memakai Vercel:
```bash
npx vercel dev
```

### Contoh konfigurasi OpenRouter
- API endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `openrouter/free`
- API key: ambil dari dashboard OpenRouter milikmu.

Pastikan model yang dipilih tersedia di akun/provider kamu. Jika provider memberi error CORS, gunakan backend proxy/serverless function.

## Struktur folder
```text
chatbot-api-html-css-js/
├── index.html
├── README.md
└── assets/
    ├── app.js
    └── style.css
```

## Catatan keamanan penting
API key hanya dibaca oleh `server.js` dari environment `.env` dan dikirim dari server ke OpenRouter. API key tidak dikirim ke atau disimpan oleh browser. Jangan commit file `.env` ke repository.

## Teknologi
HTML5, CSS3, JavaScript (Fetch API), LocalStorage.
