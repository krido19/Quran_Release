# Panduan Lengkap Build APK (PDF Reader App)

Panduan ini dibuat khusus untuk membantu Anda mengubah source code React/Capacitor ini menjadi file APK yang bisa diinstal di HP Android.

Dokumen ini mencakup  metode:
1.  **Cara Ringan (Terminal)**: Paling cepat, hemat RAM, tidak perlu buka Android Studio.

---

## 1. Persiapan Wajib (Prerequisites)

Before starting, ensure your PC is ready:
1.  **Node.js**: Installed.
2.  **Android Studio (Setup Wajib)**:
    Install Android Studio, then open **Settings > Languages & Frameworks > Android SDK**.
    *   **SDK Platforms**: Check **Android 15 (UpsideDownCake) / API 35**.
    *   **SDK Tools**: Check **"Show Package Details"** (Bottom Right), then check:
        *   **Android SDK Build-Tools 34.0.0** (Must be exact version!).
        *   **Android SDK Command-line Tools (latest)**.
    *   Click **Apply** and **Accept All Licenses**.

---

## 2. Cara Build APK 

### Metode A: Build Cepat via Terminal (Hemat RAM) 🚀
**Rekomendasi Utama.** Gunakan cara ini agar tidak perlu membuka aplikasi Android Studio yang berat. Masalah "Java Version Error" diatasi dengan memaksa terminal menggunakan Java bawaan Android Studio (`jbr`).

**Langkah-langkah:**

1.  **Build React**:
    ```powershell
    npm run build
    ```
2.  **Sync Capacitor**:
    ```powershell
    npx cap sync
    ```
3.  **Build APK (Copy-Paste perintah ini ke Terminal VS Code):**
    ```powershell
    # Perintah ini set Java ke versi 'jbr' (Java 17/21) milik Android Studio hanya untuk sesi ini
    $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; cd android; .\gradlew assembleDebug; cd ..
    ```

**Hasil:**
File APK akan muncul di: `android\app\build\outputs\apk\debug\app-debug.apk`

---


Gunakan ini hanya jika cara A gagal atau butuh setting visual (misal: buat tanda tangan/sign APK release).

1.  Jalankan `npx cap open android`.
2.  Tunggu loading "Gradle Sync" selesai.
3.  Menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 3. Masalah Umum & Cara Mengatasinya (Troubleshooting)

### Masalah: "Unsupported Java Version" / "Gradle requires Java X"
**Penyebab:** Terminal VS Code secara default memakai Java sistem (seringkali versi lama/1.8), padahal Gradle terbaru butuh Java 17+.
**Solusi:** Gunakan **Metode A** di atas. Perintah `$env:JAVA_HOME=...` adalah kuncinya. Jangan lupa path-nya harus mengarah ke folder `jbr` di dalam instalasi Android Studio.

### Masalah: "Gradle Sync Failed" (Merah Semua)
**Solusi:**
1.  Pastikan internet lancar (Maven butuh download).
2.  Di Android Studio: **File > Invalidate Caches / Restart**.

### Masalah: APK Tidak Bisa Diinstal
**Penyebab:** Biasanya karena ada APK lama dengan "Signature" berbeda (misal versi Play Store vs versi Debug).
**Solusi:** Uninstall dulu aplikasi lama di HP, baru instal yang baru.

---

## 4. Log Masalah & Solusi Detail (Update: 14 Des 2025)

Berikut adalah catatan detail mengenai masalah yang sering terjadi saat build dan cara mengatasinya secara tuntas.

### A. Masalah Environment Variables & Path (CRITICAL) ⚠️
**Gejala:** Error `JAVA_HOME is set to an invalid directory` atau `Value ... given for org.gradle.java.home Gradle property is invalid`.
**Penyebab:**
1.  **Hardcoded Paths:** File `android/gradlew.bat` atau `android/gradle.properties` seringkali memiliki setting path Java yang "dikunci" (hardcoded) ke direktori komputer orang lain (misal: `C:\Program Files\Microsoft\...`).
2.  **Spasi di Path:** Path seperti `C:\Program Files\...` bisa menyebabkan error di beberapa terminal.

**Solusi Tuntas:**
1.  **Cek `android/gradlew.bat`:** Cari baris yang dimulai dengan `set JAVA_HOME=...`. **Hapus atau Comment (rem)** baris tersebut agar script mengikuti environment komputer Anda, bukan script bawaan.
2.  **Cek `android/gradle.properties`:** Cari baris `org.gradle.java.home=...`. **Berikan tanda #** di depannya untuk menonaktifkannya.
3.  **Trik `jbr_local`:** Jika path `C:\Program Files\Android\Android Studio\jbr` bermasalah karena spasi:
    *   Copy folder `jbr` dari folder installasi Android Studio.
    *   Paste ke dalam folder project Anda (jadi `project/jbr_local`).
    *   Gunakan perintah ini untuk build:
        ```powershell
        $env:JAVA_HOME = (Resolve-Path ".\jbr_local").Path; cd android; .\gradlew.bat assembleDebug; cd ..
        ```

### B. Error `build.gradle` (Keystore Missing)
**Gejala:** Build gagal total dengan pesan error samar atau `path may not be null` di `build.gradle`.
**Penyebab:** Script mencoba membaca file `keystore.properties` untuk signing, tapi file tersebut belum ada (karena Anda masih di tahap Debug, bukan Release).
**Solusi:**
Pastikan blok kode `signingConfigs` di `android/app/build.gradle` di-wrap dengan pengecekan `exists()`:
```gradle
signingConfigs {
    release {
        def keystorePropertiesFile = rootProject.file("keystore.properties")
        def keystoreProperties = new Properties()
        // PENTING: Cek dulu apakah file ada sebelum load!
        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            storeFile = file(keystoreProperties['storeFile'])
            storePassword = keystoreProperties['storePassword']
            keyAlias = keystoreProperties['keyAlias']
            keyPassword = keystoreProperties['keyPassword']
        }
    }
}
```

### C. Android SDK Tidak Ditemukan
**Gejala:** Error `SDK location not found`.
**Penyebab:** Android Studio sudah diinstall, tapi **Setup Wizard** belum dijalankan sampai selesai, sehingga folder `Sdk` belum terdownload.
**Solusi:**
1.  Buka Android Studio.
2.  Jangan langsung tutup. Ikuti wizard sampai dia mendownload Components (SDK Platform, Build-Tools).
3.  Pastikan file `local.properties` di folder `android/` terisi otomatis dengan path SDK, contoh:
    `sdk.dir=C\:\\Users\\NamaUser\\AppData\\Local\\Android\\Sdk`

### D. Perintah "Sakti" untuk Build Bersih 🧹
Jika terminal VS Code terasa aneh atau errornya tidak masuk akal, gunakan **Command Prompt (CMD)** biasa (bukan PowerShell) dengan perintah absolute ini agar yakin 100% environment-nya benar:

1.  Pastikan Anda punya folder `jbr_local` di project (copy dari Android Studio).
2.  Jalankan di terminal:
    ```cmd
    cmd /c "set JAVA_HOME=%CD%\jbr_local&& cd android && gradlew.bat clean assembleDebug"
    ```
    *(Perintah `clean` penting untuk membuang cache error lama)*

### E. Masalah Lisensi (License Not Accepted) 🛑
**Gejala:** Error panjang `Failed to install ... licences have not been accepted` untuk `build-tools` atau `platforms`.
**Penyebab:** Anda belum menyetujui perjanjian lisensi (EULA) dari komponen SDK yang dibutuhkan project. Lisensi ini **tidak bisa** di-bypass lewat terminal saja jika versinya spesifik.
**Solusi:**
1.  Buka **Android Studio**.
2.  Masuk ke **SDK Manager** > **SDK Tools**.
3.  Centang **"Show Package Details"**.
4.  Cari versi yang diteriaki error (misal: `Build-Tools 34.0.0`).
5.  Centang, Apply, dan klik **Accept License**.

### F. Masalah `local.properties` (Path Error)
**Gejala:** Error `SDK location not found` padahal path sudah benar, atau error syntax.
**Penyebab:**
1.  File `android/local.properties` tidak ada (karena di-ignore git).
2.  Ada **spasi** di akhir path atau format backslash `\` salah.
**Solusi:**
Buat file `android/local.properties` manual isinya baris ini (sesuaikan user name):
```properties
sdk.dir=C\:\\Users\\NamaUser\\AppData\\Local\\Android\\Sdk
```
*(Perhatikan double backslash `\\` dan titik dua `\:` yang di-escape)*
