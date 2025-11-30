# Islamic App - Developer Guide & Post-Mortem

Dokumen ini berisi catatan lengkap proses pengembangan aplikasi Al-Quran & Jadwal Sholat berbasis React + Capacitor. Panduan ini dibuat agar di masa depan, pembuatan aplikasi serupa bisa lebih cepat dengan menghindari masalah yang sama.

---
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

### F. Asmaul Husna (Audio Streaming)
-   **Fitur**: Menampilkan 99 nama Allah dengan arti dan audio.
-   **Audio**: Menggunakan teknik **Streaming** dari Archive.org untuk menjaga ukuran aplikasi tetap kecil.
-   **Komponen**: `src/pages/AsmaulHusna.jsx`.

### G. Doa Harian (Custom Audio Hosting)
-   **Fitur**: Kumpulan doa sehari-hari dengan audio.
-   **Audio Strategy**:
    -   File MP3 di-hosting di **GitHub Public Repository** (`quran-assets`).
    -   Aplikasi memuat audio via URL `raw.githubusercontent.com`.
    -   **Alasan**: Menghindari kuota bandwidth server berbayar dan menjaga aplikasi ringan (~5MB) dibanding memasukkan semua file MP3 ke dalam APK.
-   **Komponen**: `src/pages/DailyPrayers.jsx`.

### H. Kalender Hijriyah
-   **Library**: `Intl.DateTimeFormat` dengan opsi `calendar: 'islamic-umalqura'`.
-   **Fungsi**: Konversi otomatis tanggal Masehi ke Hijriyah di Header dan Jadwal Sholat.
-   **Komponen**: `src/lib/hijri.js`.

### I. Kompas Kiblat (Sensor Fusion)
-   **Library**: `@capacitor/motion` (DeviceOrientation) & `@capacitor/geolocation`.
-   **Logic**:
    1.  Ambil lokasi user (Latitude/Longitude).
    2.  Hitung arah Kiblat (Mekkah) dari lokasi user (Rumus Haversine/Bearing).
    3.  Ambil data Kompas HP (`alpha` / `webkitCompassHeading`).
    4.  Putar jarum kompas UI sesuai selisih arah Utara HP dan arah Kiblat.
-   **Komponen**: `src/pages/QiblaCompass.jsx`.

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

---

## 9. Catatan Teknis (Update Terakhir)

Berikut adalah solusi untuk masalah teknis yang ditemukan selama pengembangan, sangat berguna untuk proyek masa depan:

### A. Audio Synchronization (Asmaul Husna)
-   **Logic**: Setiap item di JSON memiliki properti `startTime` (detik).
-   **Event**: Gunakan event `onTimeUpdate` pada `<audio>` tag untuk cek waktu saat ini (`currentTime`).
-   **Highlight**: Bandingkan `currentTime` dengan `startTime`. Jika `currentTime >= startTime`, set item tersebut sebagai aktif.
-   **Auto-Scroll**: Gunakan `ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.
    -   *Tips*: Gunakan `block: 'nearest'` agar scrolling tidak melompat terlalu agresif (lebih nyaman di mata dibanding `center`).

### B. Mobile Layout & Scrolling (CSS Fixes)
Masalah umum: Halaman tidak bisa di-scroll atau terpotong di browser HP (Chrome/Safari Android).

**Solusi "Bulletproof" untuk Layout Full-Screen:**
1.  **Gunakan `dvh`**: Jangan pakai `vh` biasa. Gunakan `100dvh` (Dynamic Viewport Height) untuk `body` dan container utama. Ini mengatasi masalah address bar browser yang naik-turun.
    ```css
    body, .app-container {
        height: 100dvh; /* Fallback: 100vh */
        overflow: hidden; /* Prevent body scroll */
    }
    ```
2.  **Flexbox untuk Main Content**:
    -   Parent (`.app-container`): `display: flex; flex-direction: column;`
    -   Header/Footer: Tinggi tetap (fixed height).
    -   Content (`#main-content`): `flex: 1; overflow-y: auto;`
3.  **Hindari Absolute Positioning untuk Scroll**:
    -   Jangan gunakan `position: absolute` pada konten yang perlu di-scroll jika bisa dihindari. Gunakan flow normal dengan `overflow-y: auto` pada parent container.

### C. Sticky Header & Glassmorphism (UI/UX)
-   **Masalah**: Header audio player ikut ter-scroll ke atas (hilang) saat user scroll daftar Asmaul Husna. Desain awal terlihat "kotak" dan kaku.
-   **Solusi Sticky**:
    -   Gunakan `position: sticky; top: 0; z-index: 100;` pada container player.
    -   *Penting*: Pastikan parent container tidak memiliki `overflow: hidden` yang salah, atau sticky tidak akan jalan.
-   **Solusi Desain (Glassmorphism)**:
    -   Gunakan efek "kaca buram" agar terlihat premium dan modern.
    -   CSS Class `.glass-panel`:
        ```css
        background: rgba(255, 255, 255, 0.85); /* Semi-transparent */
        backdrop-filter: blur(12px); /* Efek blur konten di belakangnya */
        border-bottom: 1px solid rgba(0,0,0,0.05);
        ```
    -   Untuk **Dark Mode**, sesuaikan background menjadi `rgba(31, 41, 55, 0.85)`.

### D. Theme Toggle (Dark Mode)
-   **Masalah**: Tombol toggle hanya berupa icon melayang, terlihat kurang rapi ("jelek").
-   **Solusi**:
    -   Ubah menjadi tombol fisik dengan `width/height: 40px` dan `border-radius: 12px`.
    -   Berikan `background: var(--bg-card)` dan `box-shadow` agar terlihat seperti tombol timbul (neumorphism halus).
    -   Pastikan icon berada di tengah dengan `display: flex; align-items: center; justify-content: center;`.

### E. Redundant Menu Items
-   **Masalah**: Menu "Arah Kiblat" ada di halaman "Lainnya", padahal sudah ada di Navbar bawah. Ini membingungkan user.
-   **Solusi**: Hapus item duplikat dari `Menu.jsx` untuk menjaga UI tetap bersih dan efisien.

### F. Git Branching Strategy
-   **Best Practice**: Jangan push langsung ke `main` jika fitur belum stabil.
-   **Langkah**:
    1.  Buat branch baru: `git checkout -b nama-fitur-baru`
    2.  Commit perubahan: `git commit -m "feat: deskripsi"`
    3.  Push ke remote: `git push -u origin nama-fitur-baru`
    4.  Buat Pull Request (PR) di GitHub untuk merge ke main.

### G. Redesign Kompas Kiblat (Premium UI)
- **Masalah**: Tampilan kompas awal terlalu sederhana dan kurang menarik ("jelek").
- **Solusi**:
  - **Glassmorphism**: Menggunakan panel kaca transparan (`.glass-panel`) untuk wadah kompas.
  - **Metallic Dial**: Menambahkan dial dengan gradien metalik realistis yang berputar sesuai arah mata angin.
  - **3D Gold Needle**: Mengganti panah kartun dengan jarum emas 3D (`.qibla-arrow-premium`) yang lebih elegan dan presisi.
  - **Kaaba Icon**: Menambahkan ikon Ka'bah pada dial kompas sebagai target visual yang ditunjuk oleh jarum.
  - **City Name**: Menambahkan fitur Reverse Geocoding (OpenStreetMap) untuk menampilkan nama kota pengguna (misal: "Jakarta Selatan") secara otomatis.
  - **Kalibrasi**: Menambahkan tombol "Kalibrasi Kompas" yang meminta izin Gyroscope (iOS) dan menampilkan instruksi gerakan angka 8.

### H. Tasbih Digital Enhancements
- **Fitur Baru**:
  - **Target Notification**: Modal popup "Target Tercapai!" muncul saat hitungan mencapai target (33, 99, dll) dengan opsi Reset/Lanjut.
  - **Volume Button Counting**: Memungkinkan pengguna menghitung menggunakan tombol fisik Volume Up/Down (berguna untuk dzikir tanpa melihat layar).
  - **Click Sound**: Efek suara "klik" mekanis yang memuaskan pada setiap tap (bisa di-mute).
  - **Dhikr History**: Riwayat dzikir tersimpan otomatis saat Reset, lengkap dengan tanggal dan jumlah hitungan.
  - **Auto-Save**: Penjelasan visual bahwa data tersimpan otomatis saat reset.

### I. Prayer Times UI Improvements
- **Refresh Location Button**:
  - Menambahkan tombol "Refresh Lokasi" manual di halaman Jadwal Sholat.
  - Berguna jika GPS lambat lock saat awal buka aplikasi.
  - Styling tombol disamakan dengan tombol "Aktifkan Lokasi" (Kuning/Rounded) untuk konsistensi UI.

---

---

## 10. Copyright & Attribution (Hak Cipta)

### A. Kode Sumber (Source Code)
-   **Lisensi**: Proyek ini menggunakan lisensi **MIT**. Anda bebas menggunakan, memodifikasi, dan mendistribusikan ulang kode ini untuk keperluan pribadi maupun komersial.
-   **Library**: Semua library pihak ketiga (React, Vite, Capacitor, dll) menggunakan lisensi open-source yang kompatibel (MIT/Apache/BSD).

### B. Data & API
-   **Al-Quran**: Data teks ayat, terjemahan, dan tafsir diambil dari **Quran.com API** (pi.quran.com).
    -   *Attribution*: 'Quran text and translations provided by Quran.com'.
-   **Jadwal Sholat**: Perhitungan waktu sholat menggunakan library dhan-js.

### C. Aset Audio (PENTING)
-   **Murottal (Ayat)**: Audio per-ayat di-stream langsung dari server **Quran.com** (erses.quran.com). Hak cipta rekaman milik masing-masing Qari/Penerbit yang bekerjasama dengan Quran.com.
-   **Doa Harian & Adzan**:
    -   File audio doa harian (doa-sebelum-makan.mp3, dll) dan Adzan yang ada di folder public/audio atau repository quran-assets adalah aset custom.
    -   **Peringatan**: Jika Anda menggunakan proyek ini, pastikan Anda memiliki hak untuk menggunakan file audio tersebut atau ganti dengan rekaman Anda sendiri/file bebas royalti (No Copyright) untuk menghindari klaim hak cipta (Copyright Strike) di YouTube atau Play Store.

