# Sarideo mobil ilovasi

## Maqsad
Dark-mode repozitoriyidagi Sarideo agentli video yaratish oqimini serverga bog‘lanmagan Android APK ko‘rinishida berish.

## Asosiy oqim
1. Foydalanuvchi mavzu va formatni kiritadi.
2. `director` ssenariy va sahnalarni tayyorlaydi.
3. `imagesmith` rasm promptlarini, `choreographer` sahna harakatlarini yozadi.
4. `subtitler` subtitr vaqtlarini, `publisher` metadata’ni yaratadi.
5. Foydalanuvchi studio’da ko‘radi/tahrirlaydi va client-side preview/export holatini oladi.

## Ekranlar
- **Yaratish** — mavzu, format, davomiylik va boshlash.
- **Studio** — agent pipeline, sahnalar, preview va eksport holati.
- **Kutubxona** — telefonda saqlangan loyihalar.
- **Sozlamalar** — Gemini va OpenAI-compatible endpoint/kalitlari.

## Saqlash va xavfsizlik
- Supabase/server ishlatilmaydi.
- Sozlamalar va loyiha metadata’lari localStorage’da.
- Media uchun IndexedDB adapteri tayyorlanadi; API kalitlari hech qachon UI’da ochiq ko‘rsatilmaydi.
- API so‘rovlari WebView’dan bevosita yuboriladi; CORS yoki provider cheklovi bo‘lsa ilova aniq status ko‘rsatadi.

## Fayl xaritasi
- `index.html` — mobil markup va navigatsiya shell’i
- `css/base.css` — umumiy rang, tipografiya, reset
- `css/app.css` — ekranlar va komponentlar
- `js/store.js` — local-only ma’lumotlar
- `js/api.js` — Gemini/OpenAI-compatible adapterlari
- `js/agents.js` — Sarideo agentlari va pipeline
- `js/ui.js` — DOM render va interaction yordamchilari
- `js/app.js` — ilovani ishga tushirish

## Cheklov
WebView ichida ffmpeg/codec mavjudligi qurilmaga bog‘liq. MP4 eksport imkoni bo‘lmasa, Studio’da sabab va preview/download fallback aniq ko‘rsatiladi.
