# Oson Savdo - Do'konlarga O'rnatish va Sotish Bo'yicha To'liq Qo'llanma

Ushbu hujjat **"Oson Savdo"** tizimini O'zbekistondagi real chakana savdo nuqtalari (oziq-ovqat, kiyim-kechak, xo'jalik mollari, parfyumeriya, qurilish mollari do'konlari)ga o'rnatish, sozlash va sotish bo'yicha to'liq qo'llanmadir.

---

## 1. Tizim Qanday Kamchiliklardan Tozalangan va Nimalar Qo'shilgan?

Real do'konlarga o'rnatishda to'sqinlik qilgan 8 ta muhim kamchilik to'liq bartaraf etildi:

| # | Ilgari mavjud bo'lmagan kamchilik | Yangi joriy etilgan yechim | Holati |
|---|---|---|---|
| **1** | **Web POS Kassa ekrani yo'qligi** | Zamonaviy tezkor POS kassa interfeysi: shtrix-kod skaneri (avto-fokus va global tinglovchi), tezkor mahsulot qidirish, kategoriyalar bo'yicha filtrlash, savatcha boshqaruvi, tezkor naqd pullar tugmalari (10k, 20k, 50k, 100k, 200k) va avtomatik qaytim (sdacha) hisoblagich. | ✅ Tayyor |
| **2** | **Foydalanuvchilar va Rollar (Auth & Permissions)** | JWT asosidagi autentifikatsiya. **Admin** (Do'kon egasi - barcha hisobotlar, tan narxi, foyda va sozlamalarni ko'radi) va **Kassir** (faqat savdo qiladi va chek chiqaradi, mahsulotlarning **Tan narxi (Cost Price)** va **Sof foyda (Profit)** undan yashirilgan). | ✅ Tayyor |
| **3** | **Termal Chek Chop Etish (58mm / 80mm)** | Har bir savdo yakunlanganda avtomatik chek oynasi ochiladi. O'zbekistondagi barcha Xprinter va standart termal printerlar uchun 58mm va 80mm formatlar qo'llab-quvvatlanadi. Brauzer orqali to'g'ridan-to'g'ri chop etish (`@media print`). | ✅ Tayyor |
| **4** | **Offline Rejim va Tarmoq Uzilishidan Himoya** | Internet yoki ichki tarmoq uzilganda tizim to'xtab qolmaydi: savdolar brauzerning xavfsiz xotirasiga (`localStorage`) saqlanadi. Aloqa tiklanganda bir tugma bilan barcha savdolar serverga xatosiz sinxronizatsiya qilinadi. | ✅ Tayyor |
| **5** | **Excel / CSV Import va Export** | Minglab mahsulotlarni 1 daqiqada bazaga kiritish uchun CSV import, tayyor shablon yuklab olish va do'kondagi barcha qoldiqlarni Excel (.csv) formatida saqlash imkoniyati yaratildi. | ✅ Tayyor |
| **6** | **Kassa Smenasi (Ochish / Yopish, X/Z-hisobot)** | Kassir ish boshlashida ertalabki qoldiq bilan smenani ochadi. Ish oxirida kassadagi naqd pul sanab kiritiladi. Tizim kutilgan summa bilan haqiqiy summani solishtirib **Farq (Kamomad yoki Ortiqcha pul)** hisobini chiqaradi. | ✅ Tayyor |
| **7** | **Vozvrat (Qaytarish) va Skidka (Chegirma)** | POS kassada har bir savdoga yoki umumiy chekka chegirma (so'mda) berish mumkin. Xaridor tovarini qaytarib olib kelsa (Vozvrat), savdolar tarixidan mahsulot qaytarib olinadi va ombor qoldig'iga avtomatik qo'shiladi. | ✅ Tayyor |
| **8** | **Ta'minotchilar va Kirim Hujjati** | Postavshiklar ro'yxati, ulardan tovarlarni kirim qilish (faktura raqami, tan narxi, sotish narxi, to'langan summa va qarz summasi), shuningdek ta'minotchi qarzini bosqichma-bosqich so'ndirish bo'limi. | ✅ Tayyor |
| **9** | **Ma'lumotlar Bazasi Zaxira Nusxasi (Backup)** | Do'kon egasi istalgan vaqtda yagona tugma orqali butun savdo va ombor bazasining zaxira faylini (`.db`) kompyuteriga yuklab olib, fleshkaga saqlab qo'yishi mumkin. | ✅ Tayyor |

---

## 2. Do'kon Egasi Uchun Qanday Qurilmalar (Hardware) Kerak?

Mijoz do'koniga ushbu dasturni o'rnatib berish uchun tavsiya etiladigan apparatlar:

1. **Kompyuter yoki POS Monoblok:**
   - Har qanday Windows 10 yoki 11 o'rnatilgan noutbuk, kompyuter yoki sensorli (Touchscreen) POS monoblok (Intel Core i3 / Celeron J4125, 4GB-8GB RAM, 128GB SSD yetarli).
2. **Shtrix-kod Skaneri:**
   - USB orqali ulanadigan oddiy 1D yoki 2D skaner (masalan, Netum, Zebex, Honeywell). Dastur klaviatura emulyatori (HID) bilan avtomatik integratsiya qilingan, drayver talab qilmaydi.
3. **Termal Chek Printeri:**
   - 58mm (masalan, Xprinter XP-58IIH, POS-58) yoki 80mm (Xprinter XP-N160II, XP-Q800) USB termal printer.
4. **Kassa Qutisi (Denezhniy yashik):**
   - Printer orqali RJ-11/RJ-12 kabeli bilan ulanadi (chek chiqqanda avtomatik ochiladi).

---

## 3. Tezkor Ishga Tushirish (1-Klik Bilan)

Do'konda kompyuter yoqilganda dasturni ishga tushirish uchun papkadagi **`Ishga_tushirish.bat`** fayli bosiladi:
1. Backend API serveri fon rejimida ishga tushadi (`http://localhost:5050`).
2. Web POS Kassa interfeysi ochiladi (`http://localhost:3000`).
3. Standart kirish hisoblari:
   - **Admin (Boshqaruvchi):** Login: `admin` | Parol: `admin123`
   - **Kassir (Kassa xodimi):** Login: `kassir` | Parol: `kassir123`

---

## 4. Narxlash va Do'konlarga Sotish Modeli (Tavsiya)

O'zbekiston bozorida ushbu tizimni quyidagi 2 xil usulda sotishingiz mumkin:

### Variant A: Bir martalik to'liq o'rnatish (Lifetime License)
- **Narxi:** 1,500,000 - 3,000,000 so'm (bitta do'kon uchun).
- **Ichiga kiradi:**
  - Dasturni do'kon kompyuteriga o'rnatish va sozlash.
  - Skaner va chek printerni ulab berish.
  - Do'konning dastlabki tovarlarini Excel orqali bazaga yuklab berish.
  - Do'kon egasi va kassirni 1 soat o'qitish.

### Variant B: Oylik obuna (SaaS / Xizmat ko'rsatish)
- **O'rnatish to'lovi:** 500,000 so'm.
- **Oylik to'lov:** 150,000 - 250,000 so'm / oy.
- **Ichiga kiradi:** Doimiy texnik yordam, haftalik baza zaxira nusxasini olish, dastur yangilanishlari.

---

## 5. Do'konda Kundalik Ish Ketma-ketligi (Instruksiya)

1. **Ertalab:**
   - Kassir tizimga `kassir` paroli bilan kiradi.
   - **"Smena (Kassa)"** tugmasini bosib, kassa g'aladonidagi boshlang'ich pulni (masalan, 200,000 so'm mayda pul) kiritadi va **"Smenani ochish"**ni bosadi.
2. **Kunning davomida:**
   - Shtrix-kod skaner orqali tovarlar savatga olinadi yoki ekrandagi tovar kartalari bosiladi.
   - Xaridor naqd, plastik karta yoki qarzga to'lashi tanlanadi.
   - "Savdoni yakunlash" bosiladi va bir zumda 58mm chek chiqadi.
3. **Kechqurun:**
   - Kassir **"Smena (Kassa)"** tugmasini bosadi va **"Smenani yopish"** bo'limiga o'tadi.
   - Kassadagi mavjud naqd pulni sanab kiritadi.
   - Tizim kunlik tushumni va farqni (kamomad yoki ortiqchalik) hisoblab Z-hisobotni qayd qiladi.
4. **Hafta / Oy oxirida:**
   - Do'kon egasi **Admin** profili bilan kirib, umumiy daromad, sof foyda, qarzlar va eng ko'p sotilgan tovarlar tahlilini ko'radi.
   - Sozlamalardan **"Baza zaxira nusxasini yuklab olish"** tugmasini bosib faylni xavfsiz saqlab qo'yadi.
