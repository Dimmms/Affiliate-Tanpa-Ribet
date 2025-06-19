
# 📄 settings.md – Konfigurasi Final Midtrans + Aplikasi Checkout

## ✅ 1. Environment File (.env)

Pastikan file `.env` kamu seperti ini:

```env
MIDTRANS_SERVER_KEY=Mid-server-6HKLoF6--GxYdITeFLBOTGV-
MIDTRANS_CLIENT_KEY=Mid-client-3YZ4P07zEkU_y2Fk
MIDTRANS_MERCHANT_ID=G275012539
PORT=3000
```

✅ Gunakan `isProduction: false` untuk development dan `true` jika sudah live.

---

## ✅ 2. Struktur Folder

```
project-root/
│
├── public/
│   ├── index.html          ← Halaman utama
│   ├── thanks.html         ← Setelah bayar sukses
│   ├── pending.html        ← Status pending
│   ├── error.html          ← Jika gagal
│   ├── cancel.html         ← Jika dibatalkan user
│   ├── style.css
│
├── server.js
├── .env
├── package.json
```

---

## ✅ 3. Midtrans Dashboard – Snap Redirect URLs

[https://dashboard.midtrans.com/settings/snap](https://dashboard.midtrans.com/settings/snap)

| Kolom | URL |
|-------|-----|
| Finish URL | `https://yourdomain.com/thanks.html` |
| Pending URL | `https://yourdomain.com/pending.html` |
| Error Payment URL | `https://yourdomain.com/index.html` ✅ |

---

## ✅ 4. Webhook Notification URL

[https://dashboard.midtrans.com/settings/configuration](https://dashboard.midtrans.com/settings/configuration)

Isi:
```
https://yourdomain.com/midtrans-notification
```

Jika lokal:
```
https://xxxx-xxx-xxx-xxx.ngrok-free.app/midtrans-notification
```

---

## ✅ 5. Google Apps Script

URL Webhook:
```
https://script.google.com/macros/s/AKfycbylcFK0K8Ex1DEpeDKiIi9YWmgafrC9M7b0og04rVwLJBpLDbHvas713WqDdYIDqTkmCQ/exec
```

Script:
```js
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  sheet.appendRow([
    new Date(),
    e.parameter.NAMA || '',
    e.parameter.EMAIL || '',
    e.parameter.WHATSAPP || '',
    e.parameter.STATUS || '',
    e.parameter.PAYMENT_TYPE || '',
    e.parameter.AMOUNT || ''
  ]);
  return ContentService.createTextOutput("OK");
}
```

---

## ✅ 6. Jalankan Server

```bash
npm install
node server.js
```

Online Test:
```bash
ngrok http 3000
```

---

## ✅ 7. Frontend Callback Snap

```js
window.snap.pay(data.token, {
  onSuccess: () => window.location.href = 'thanks.html',
  onPending: () => window.location.href = 'pending.html',
  onError: () => window.location.href = 'error.html',
  onClose: () => window.location.href = 'cancel.html'
});
```

---
