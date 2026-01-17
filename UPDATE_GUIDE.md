# 📱 Panduan Update Aplikasi Koperasi

## 🔄 Cara Kerja Sistem Update

### **Metode 1: Update Otomatis (Background)**
Aplikasi secara otomatis memeriksa update setiap 60 detik di background tanpa user perlu melakukan apapun.

**Proses:**
1. Service Worker cek versi baru setiap 60 detik
2. Jika ada update → Toast notification muncul
3. Aplikasi reload otomatis
4. Versi baru langsung aktif

### **Metode 2: Update Manual (Tombol di Sidebar)**
User bisa klik tombol "Periksa & Update" di bagian bawah sidebar untuk force update.

**Proses:**
1. User klik tombol "Periksa & Update"
2. Toast muncul: "🔍 Memeriksa Update..."
3. Sistem:
   - Hapus SEMUA cache lama (workbox + api cache)
   - Unregister service worker lama
   - Download fresh version dari server
4. Toast muncul: "🔄 Mengunduh Versi Baru..."
5. Aplikasi reload otomatis
6. Install versi terbaru + service worker baru

---

## ✅ Apa yang Dijamin Bekerja

### **Desktop (Chrome, Edge, Firefox)**
- ✅ Auto-update: **SEMPURNA**
- ✅ Manual update: **SEMPURNA**
- ✅ Cache clearing: **SEMPURNA**

### **Android (Chrome, Samsung Browser)**
- ✅ Auto-update: **SANGAT BAIK**
- ✅ Manual update: **SEMPURNA**
- ✅ Cache clearing: **SANGAT BAIK**

### **iPhone/iPad (Safari iOS)**
- ⚠️ Auto-update: **KADANG LAMBAT** (butuh force quit app)
- ✅ Manual update: **BAIK** (tutup app sepenuhnya lalu buka lagi)
- ✅ Cache clearing: **BAIK**
- ⚠️ **PENTING iOS**: Setelah update, **FORCE QUIT** app (swipe up di app switcher), lalu buka lagi

---

## 🚀 Cara Update untuk User

### **Untuk Update Pertama Kali (SEKALI INI SAJA)**

**Di Mobile:**
1. Uninstall aplikasi lama dari home screen
2. Buka browser (Chrome/Safari)
3. Kunjungi URL aplikasi
4. Klik "Add to Home Screen" / "Install"
5. ✅ Selesai!

**Di Desktop:**
1. Uninstall aplikasi lama (klik kanan icon → Uninstall)
2. Buka browser
3. Kunjungi URL aplikasi
4. Klik icon install di address bar
5. ✅ Selesai!

### **Untuk Update Berikutnya (OTOMATIS SELAMANYA)**

**Cara 1: Biarkan Otomatis**
- Tunggu max 60 detik
- Toast muncul: "Update tersedia"
- Aplikasi reload sendiri
- ✅ Done!

**Cara 2: Klik Tombol Manual**
- Buka sidebar
- Scroll ke bawah
- Klik "Periksa & Update"
- Tunggu toast muncul
- Aplikasi reload sendiri
- ✅ Done!

---

## 🔍 Troubleshooting

### **Update Tidak Terdeteksi di iOS**
**Solusi iOS Spesifik:**
1. **FORCE QUIT** aplikasi (bukan hanya tutup):
   - Double tap tombol home (atau swipe up dari bawah)
   - Swipe up pada aplikasi untuk force quit
2. Tunggu 5 detik
3. Buka aplikasi lagi
4. Jika masih belum update: Klik tombol "Periksa & Update" di sidebar
5. Setelah update, **WAJIB FORCE QUIT** lagi dan buka ulang

### **Cache Tidak Terhapus**
**Solusi:**
1. Klik tombol "Periksa & Update" di sidebar
2. Sistem akan force clear SEMUA cache
3. Download fresh version

### **Update Gagal Total**
**Solusi Terakhir:**
1. Uninstall aplikasi
2. Clear browser cache
3. Install ulang aplikasi

---

## 📊 Technical Details

### **File yang Berubah:**
- ✅ `vite.config.ts` - PWA config dengan aggressive update
- ✅ `src/main.tsx` - Service worker registration + auto-check
- ✅ `src/components/layout/AppSidebar.tsx` - Manual update button
- ✅ `src/components/PWAUpdatePrompt.tsx` - Background update listener

### **Fitur yang Ditambahkan:**
- ✅ `skipWaiting: true` - Service worker baru langsung aktif
- ✅ `clientsClaim: true` - Kontrol langsung diambil alih
- ✅ `cleanupOutdatedCaches: true` - Cache lama auto-hapus
- ✅ `updateViaCache: 'none'` - Tidak cache service worker
- ✅ Aggressive cache clearing di manual update
- ✅ Force unregister + re-register service worker

---

## ⚡ Performance

**Update Check:**
- Background check: Setiap 60 detik (minimal network usage)
- Manual check: On-demand (aggressive, clear all)

**Cache Strategy:**
- API calls: NetworkFirst (always fresh data)
- Static assets: CacheFirst (fast loading)
- Update: Force clear all (clean slate)

---

## 📝 Developer Notes

**Untuk Test Update:**
1. Publish di Lovable
2. **WAJIB TUNGGU 2 MENIT** (CDN propagation delay)
3. Klik "Periksa & Update" di sidebar
4. **iOS**: Force quit app, lalu buka lagi
5. Versi baru akan terinstall

**⚠️ PENTING**: Jangan check update dalam 2 menit pertama setelah publish! CDN butuh waktu propagate ke semua server.

**Version Tracking:**
- Setiap build menghasilkan hash unik di service worker
- Browser compare hash untuk detect update
- Jika hash berbeda → update available

**Console Logs:**
- `✅ Service Worker registered successfully`
- `🗑️ Clearing old cache: [cache-name]`
- `🔄 Reloading to fetch fresh version...`

---

## ✅ Kesimpulan

**Sekali Uninstall/Reinstall → Update Otomatis Selamanya!**

User tidak perlu lagi:
- ❌ Uninstall aplikasi lama
- ❌ Download APK baru
- ❌ Install manual

Cukup:
- ✅ Publish di Lovable
- ✅ User tunggu 60 detik ATAU klik tombol
- ✅ Aplikasi update sendiri!
