# Islamic App - Developer Guide & Post-Mortem

Dokumen ini berisi catatan lengkap proses pengembangan aplikasi Al-Quran & Jadwal Sholat berbasis React + Capacitor. Panduan ini dibuat agar di masa depan, pembuatan aplikasi serupa bisa lebih cepat dengan menghindari masalah yang sama.

---

## 1. Tech Stack
-   **Frontend**: React.js (Vite)
-   **Styling**: Vanilla CSS (dengan CSS Variables untuk Theming)
-   **Mobile Framework**: Capacitor (untuk convert Web ke Android APK)
-   **State Management**: React `useState`, `useEffect`, `localStorage`
-   **Icons**: FontAwesome

---

## 2. Fitur Utama & Implementasi

### A. Al-Quran (API & Caching)
-   **Sumber Data**: API dari `api.quran.com`.
-   **Masalah**: Fetching data setiap kali buka surat bikin lambat dan boros kuota.
-   **Solusi**: Gunakan `localStorage` untuk caching sederhana. Cek dulu di storage, kalau kosong baru fetch API.
-   **Bookmark**:
    -   Simpan ID Surat & Ayat di `localStorage` (`quran_bookmarks`, `verse_bookmarks`).
    -   *Penting*: Pastikan ID disimpan/dibaca sebagai **Integer** (`parseInt`) agar tidak error saat filtering.

### B. Jadwal Sholat (Adhan.js & Lokasi)
-   **Library**: `adhan` (JavaScript library untuk perhitungan waktu sholat).
-   **Lokasi (GPS)**:
    -   **Web**: Pakai `navigator.geolocation`.
    -   **Android**: Pakai `@capacitor/geolocation`.
    -   **Masalah**: Di Android kadang GPS lama lock-nya, bikin aplikasi stuck "Loading...".
    -   **Solusi**: Tambahkan **Timeout (10 detik)**. Jika dalam 10 detik lokasi tidak dapat, otomatis fallback ke default (Jakarta) supaya UI tetap muncul.
-   **Permission**:
    -   Android butuh izin `ACCESS_FINE_LOCATION`.
    -   Buat UI tombol "Aktifkan Lokasi" yang menghandle request permission baik untuk Browser maupun Native.

### C. Adzan Audio (CORS Issue)
-   **Masalah**: Awalnya ambil file MP3 dari URL eksternal (internet). Sering kena error **CORS** (Cross-Origin Resource Sharing) atau gagal load jika internet lambat.
-   **Solusi**: Download file MP3 (`adzan-fajr.mp3`, `adzan-normal.mp3`) dan simpan di folder `public/audio/`. Load secara lokal.

### D. Notifikasi (Background)
-   **Library**: `@capacitor/local-notifications`.
-   **Fungsi**: Menjadwalkan notifikasi adzan meskipun aplikasi ditutup.
-   **Logic**: Setiap kali jadwal sholat dihitung, hapus jadwal lama (`cancel`), lalu buat jadwal baru (`schedule`).

### E. Tasbih Digital (Haptics)
-   **Library**: `@capacitor/haptics`.
-   **Fitur**: Getar setiap kali tap. Getar panjang saat mencapai target (33/99).
-   **UI**: Menggunakan CSS Variables (`var(--bg-card)`, `var(--text-main)`) agar warna otomatis menyesuaikan dengan Dark/Light mode.

---

## 3. Integrasi Android (Capacitor)

Jika ingin membuat aplikasi Android dari React, **WAJIB** pakai Capacitor. Berikut langkah-langkahnya:

### A. Instalasi Awal
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init [NamaApp] [com.example.app]
npx cap add android
```

### B. Plugin Penting
Jangan lupa install plugin ini untuk fitur native:
```bash
npm install @capacitor/geolocation      # Untuk GPS
npm install @capacitor/local-notifications # Untuk Notifikasi
npm install @capacitor/haptics          # Untuk Getar
```

### C. Build & Sync
Setiap kali ada perubahan kode React (JS/CSS), lakukan ini:
```bash
npm run build       # Build React ke folder dist
npx cap sync        # Copy folder dist ke project Android
npx cap open android # Buka Android Studio (opsional)
```

---

## 4. Automasi Build (GitHub Actions)

Agar tidak perlu install Android Studio di laptop (berat), gunakan GitHub Actions untuk build APK otomatis di cloud.

**File Workflow**: `.github/workflows/build-android.yml`
**Penting**:
1.  Gunakan **Java 21** (Syarat Capacitor 7).
2.  Gunakan **Node.js 20**.
3.  Handle **Line Endings**: Tambahkan step untuk convert file gradlew ke format Unix (`dos2unix` atau `sed`).
4.  **Artifact**: Setting agar file `.apk` bisa didownload setelah build selesai.

---

## 5. Masalah Umum & Solusi (Troubleshooting)

| Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| **Audio Error (Network)** | URL eksternal diblokir/lambat | Pakai file lokal di `public/` |
| **Stuck Loading Prayer** | GPS tidak dapat sinyal / Izin ditolak | Pastikan izin **Lokasi Akurat** (Fine Location) diberikan & GPS aktif |
| **Bookmark Kosong** | ID disimpan sebagai String ("1") tapi dicek sebagai Int (1) | Selalu `parseInt()` ID sebelum simpan/cek |
| **Build Android Gagal** | Versi Java tidak cocok | Pastikan pakai Java 21 di GitHub Actions |
| **Tombol Tidak Terbaca** | Warna hardcoded (misal: black) di Dark Mode | Ganti warna pakai `var(--text-main)` |

---

## 6. Tips Pengembangan Selanjutnya

1.  **Selalu Cek Platform**: Gunakan `Capacitor.getPlatform()` atau `navigator.userAgent` jika butuh logika beda antara Web dan Android.
2.  **Test di HP Asli**: Emulator kadang tidak akurat untuk GPS dan Sensor. Build APK debug dan install di HP.
3.  **Simpan State**: Gunakan `localStorage` untuk simpan setting user (seperti target Tasbih, setting Adzan) agar tidak reset saat aplikasi ditutup.

---

## 7. Deployment (Play Store)

Berikut adalah langkah-langkah untuk membuat file release (AAB) yang siap diupload ke Google Play Store.

### A. Persiapan Environment
Pastikan sudah terinstall:
1.  **Java JDK 21** (Wajib untuk Capacitor 7 / Gradle 8+).
2.  **Android SDK** (Command Line Tools & SDK Platform).

### B. Build Command
Jalankan perintah berikut di terminal (root project):

```bash
# 1. Build React App
npm run build

# 2. Sync ke Android
npx cap sync

# 3. Build Release Bundle (AAB)
cd android
./gradlew bundleRelease
```

### C. File Penting (JANGAN HILANG!)
Saat build release, sistem menggunakan Keystore yang sudah digenerate.

-   **Keystore File**: `android/app/upload-keystore.jks`
-   **Password**: `android`
-   **Key Alias**: `upload`
-   **Key Password**: `android`

> **PERINGATAN KERAS**: Simpan file `upload-keystore.jks` di tempat aman (Google Drive, dll). Jika file ini hilang, **Anda tidak akan pernah bisa update aplikasi ini lagi** di Play Store.

### D. Upload ke Play Console
1.  File hasil build ada di: `android/app/build/outputs/bundle/release/app-release.aab`
2.  Upload file `.aab` tersebut ke **Google Play Console** > **Production** > **Create Release**.

---

## 8. Distribusi Manual (APK)

Jika tidak ingin upload ke Play Store, Anda bisa membuat file APK untuk dibagikan manual (WhatsApp, GitHub, dll).

### Build Command
```bash
cd android
./gradlew assembleRelease
```

### Lokasi File
File APK akan muncul di:
`android/app/build/outputs/apk/release/app-release.apk`

### Cara Install
1.  Kirim file `.apk` ke HP Android.
2.  Buka file tersebut.
3.  Izinkan "Install from unknown sources" jika diminta.

---

*Dibuat oleh Assistant - 2025*
