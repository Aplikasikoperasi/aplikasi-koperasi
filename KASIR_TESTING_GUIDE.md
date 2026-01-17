# 📋 PANDUAN UJI COBA SISTEM KASIR

## ✅ Status Perbaikan Awal

### Masalah yang Telah Diperbaiki:
1. **Role Kasir Hilang di Database** - FIXED ✓
   - Member kasir yang existing tidak memiliki role di tabel `user_roles`
   - Solusi: Role kasir sudah ditambahkan ke database

## 🧪 SKENARIO UJI COBA

### TEST 1: Pendaftaran Anggota Kasir Baru

**Langkah-langkah:**
1. Login sebagai Owner/Admin
2. Navigasi ke halaman **Members** (Anggota)
3. Klik tombol **"Tambah Anggota"**
4. Isi form dengan data berikut:
   ```
   Nama Lengkap: Test Kasir Baru
   Tanggal Lahir: 15/01/1995
   NIK: 1234567890123456
   No. Telepon: 081234567890
   Posisi: Kasir
   Pekerjaan: Kasir
   Alamat: Jl. Test No. 123
   PIN Kasir: 123456
   ```
5. Upload foto (opsional)
6. Klik **"Simpan"**

**Verifikasi:**
- ✅ Toast muncul: "Data anggota dan akun login berhasil dibuat"
- ✅ Member baru muncul di daftar dengan badge "Kasir"
- ✅ Cek database:
  ```sql
  SELECT m.full_name, m.position, m.pin, m.user_id, ur.role 
  FROM members m 
  LEFT JOIN user_roles ur ON m.user_id = ur.user_id 
  WHERE m.full_name = 'Test Kasir Baru';
  ```
  Harus menunjukkan:
  - `pin` = '123456'
  - `user_id` tidak NULL
  - `role` = 'kasir'

**Status:** 🔄 PERLU DIUJI

---

### TEST 2: Ubah PIN Kasir

**Langkah-langkah:**
1. Login sebagai Owner/Admin
2. Navigasi ke halaman **Members**
3. Klik pada member kasir (Test Kasir Baru atau Kasir)
4. Dialog detail akan terbuka
5. Klik tombol **"Ubah PIN Kasir"** (tombol oranye dengan ikon kunci)
6. Dialog ubah PIN akan muncul
7. Masukkan PIN baru: `999999`
8. Konfirmasi PIN: `999999`
9. Klik **"Simpan"**
10. Dialog Supercode akan muncul
11. Masukkan Supercode yang benar
12. Klik **"Verifikasi"**

**Verifikasi:**
- ✅ Toast muncul: "PIN Berhasil Diubah"
- ✅ Dialog tertutup otomatis
- ✅ Cek database (realtime):
  ```sql
  SELECT full_name, pin, updated_at 
  FROM members 
  WHERE full_name = 'Test Kasir Baru';
  ```
  Harus menunjukkan:
  - `pin` = '999999'
  - `updated_at` berubah ke waktu terbaru

**Status:** 🔄 PERLU DIUJI

---

### TEST 3: Login Kasir dengan PIN

**Langkah-langkah:**
1. Logout dari akun Owner/Admin
2. Buka halaman **/auth**
3. Login dengan kredensial kasir:
   ```
   Username: Test Kasir Baru
   Password: 15011995  (DDMMYYYY dari tanggal lahir)
   ```
4. Klik **"Masuk"**
5. Dialog PIN akan muncul
6. Masukkan PIN: `999999` (atau `123456` jika belum diubah)
7. Klik **"Verifikasi"**

**Verifikasi:**
- ✅ Toast muncul: "Login Berhasil - Selamat datang, Test Kasir Baru!"
- ✅ Redirect otomatis ke **/cashier-dashboard**
- ✅ Dashboard kasir tampil dengan menu:
  - Anggota & Nasabah
  - Kredit & Pembayaran
  - Portal Verifikasi
  - WhatsApp
  - Saldo

**Status:** 🔄 PERLU DIUJI

---

## 📊 DATA KASIR EXISTING UNTUK TESTING

### Member Kasir yang Sudah Ada:
```
Nama: Kasir
Password: 27031990 (dari DOB: 27/03/1990)
PIN: 888888
Status: Aktif
Role: kasir ✓ (sudah diperbaiki)
```

**Test Login Quick:**
1. Username: `Kasir`
2. Password: `27031990`
3. PIN: `888888`
4. Expected: Redirect ke `/cashier-dashboard`

---

## 🔍 CHECKLIST VALIDASI

### Pendaftaran Kasir:
- [ ] Form validasi PIN (harus 6 digit angka)
- [ ] PIN tersimpan di kolom `members.pin`
- [ ] Auth account dibuat (`user_id` tidak NULL)
- [ ] Role 'kasir' ada di tabel `user_roles`
- [ ] Toast konfirmasi muncul

### Ubah PIN:
- [ ] Tombol "Ubah PIN Kasir" hanya muncul untuk kasir
- [ ] Dialog PIN edit menampilkan validasi
- [ ] Supercode diminta sebelum update
- [ ] PIN terupdate di database
- [ ] Toast konfirmasi muncul
- [ ] Dialog tertutup otomatis

### Login Kasir:
- [ ] Username = nama lengkap kasir
- [ ] Password = DDMMYYYY (tanggal lahir)
- [ ] Dialog PIN muncul setelah auth berhasil
- [ ] PIN diverifikasi via database
- [ ] Redirect ke /cashier-dashboard
- [ ] Menu kasir tampil dengan benar

---

## 🐛 LOG ERRORS (Jika Ada)

### Error yang Perlu Dicatat:
1. **Console Errors**: (check browser console)
2. **Network Errors**: (check network tab)
3. **Edge Function Errors**: (check edge function logs)
4. **Database Errors**: (check supabase logs)

### Format Laporan Error:
```
Error Location: [Login/Register/PIN Edit]
Error Message: [pesan error lengkap]
Steps to Reproduce: [langkah-langkah yang dilakukan]
Expected: [yang seharusnya terjadi]
Actual: [yang benar-benar terjadi]
```

---

## ✨ HASIL AKHIR YANG DIHARAPKAN

Setelah semua test berhasil:
1. ✅ Member kasir baru dapat didaftarkan dengan PIN
2. ✅ PIN kasir dapat diubah dengan Supercode
3. ✅ Kasir dapat login dengan nama + DOB + PIN
4. ✅ Kasir diarahkan ke dashboard khusus
5. ✅ Semua perubahan tercatat realtime di database
