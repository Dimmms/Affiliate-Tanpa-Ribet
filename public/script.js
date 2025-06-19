const form = document.getElementById('payment-form');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidWhatsApp(number) {
  return /^\+62[0-9]{8,14}$/.test(number);
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nama = document.getElementById('nama').value.trim();
  const email = document.getElementById('email').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();

  console.log("Form submitted:", { nama, email, whatsapp });

  if (!nama || !email || !whatsapp) {
    console.warn("Validasi gagal: Kolom kosong.");
    alert('❗ Semua kolom wajib diisi.');
    return;
  }

  if (!isValidEmail(email)) {
    console.warn("Validasi gagal: Email tidak valid.");
    alert('❗ Alamat email tidak valid.');
    return;
  }

  if (!isValidWhatsApp(whatsapp)) {
    console.warn("Validasi gagal: Nomor WhatsApp tidak valid.");
    alert('❗ Nomor WhatsApp tidak valid. Gunakan format +62xxxxxxxxxxx.');
    return;
  }

  try {
    console.log("Mengirim data ke backend...");

    const response = await fetch("https://affiliatetanparibet.com/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nama,
        email: email,
        whatsapp: whatsapp
      })
    });

    console.log("Status response:", response.status);

    const data = await response.json();
    console.log("Response dari backend:", data);

    const token = data.token;
    console.log("Token Midtrans Snap:", token);

    if (!token) {
      console.error("❌ Gagal mendapatkan token transaksi dari backend.");
      alert("❌ Gagal mendapatkan token transaksi.");
      return;
    }

    console.log("Memanggil snap.pay dengan token:", token);
    snap.pay(token, {
      onSuccess: function (result) {
        console.log("✅ Pembayaran sukses:", result);
        alert("✅ Pembayaran berhasil!");
        window.location.href = "thanks.html";
      },
      onPending: function (result) {
        console.log("⏳ Pembayaran pending:", result);
        result.customer_name = nama;
        localStorage.setItem('pending_data', JSON.stringify(result));
        window.location.href = "pending.html";
      },
      onError: function (error) {
        console.error("❌ Terjadi error saat pembayaran:", error);
        alert("❌ Terjadi kesalahan saat proses pembayaran.");
        window.location.href = "error.html";
      },
      onClose: function () {
        console.warn("⚠️ Pengguna menutup popup pembayaran.");
        alert("⚠️ Pembayaran dibatalkan.");
      }
    });

  } catch (err) {
    console.error("❌ Gagal menghubungi server:", err);
    alert("Terjadi kesalahan teknis. Silakan coba lagi.");
  }
});
