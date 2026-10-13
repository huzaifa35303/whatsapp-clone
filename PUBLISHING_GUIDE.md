# WhatsApp Clone - Publishing & Deployment Guide

This guide explains how to publish, deploy, and use the **WhatsApp Clone** across **Android Mobile**, **Windows Desktop**, and **Web**.

---

## 1. Ready-to-Use Artifacts (In Your Project)

All pre-compiled and standalone binaries are available inside `D:\whatsapp-clone\releases\`:

| Platform | File / Path | Size | Description |
|---|---|---|---|
| 📱 **Android Mobile** | `releases/WhatsApp-Android.apk` | ~4.2 MB | Native Android APK. Install directly on any Android phone (enable "Install unknown apps"). |
| 💻 **Windows Desktop** | `releases/windows/WhatsApp-win32-x64/WhatsApp.exe` | Standalone folder | Native Windows Desktop application. Double-click `WhatsApp.exe` to run immediately without installation. |
| 📦 **Windows Portable ZIP** | `releases/WhatsApp-Windows-x64.zip` | ~129 MB | Compressed archive of the Windows Desktop application for sharing or uploading to Google Drive/GitHub Releases. |
| 🌐 **Web Browser** | `http://localhost:5000` (or your deployed URL) | — | Production web app served by Express backend. Works on any browser (Chrome, Edge, Safari, Firefox). |

---

## 2. Connecting Across Devices (How to Use Together)

To allow multiple people on different phones and computers to chat, call, and exchange media with each other, they connect to the same backend server.

### Option A: Free 24/7 Cloud Hosting (Recommended for Global Usage)
Deploy the backend online for free so anyone with the APK or Windows app can use it anywhere in the world.

#### Deploy on Render (Free)
1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Publish WhatsApp clone"
   git push origin main
   ```
2. Go to [render.com](https://render.com) and click **New +** -> **Blueprint**.
3. Select your repository. Render will automatically read the included `render.yaml`.
4. Click **Apply**. In 2-3 minutes, you will receive a public HTTPS URL like:
   `https://whatsapp-clone-server.onrender.com`
5. In your Android app or Windows app:
   - Open **Settings** (Gear icon in Web/Desktop, or 3 dots -> Settings in Android).
   - Under **Backend Server & Network**, enter your Render URL:
     `https://whatsapp-clone-server.onrender.com`
   - Click **Save Changes**. The app will reconnect immediately!

#### Deploy on Railway (Free / Cheap)
1. Install Railway CLI or connect via [railway.app](https://railway.app).
2. Choose **Deploy from GitHub repo**.
3. Set the Root Directory to `.` and let Railway build using the included `Dockerfile`.

---

### Option B: Local Wi-Fi / LAN Network (Zero Cost, Immediate Testing)
If your computer and your Android phones are connected to the same Wi-Fi router:

1. On your Windows PC, open PowerShell and find your local IP:
   ```powershell
   ipconfig
   ```
   Look for **IPv4 Address** (for example: `192.168.1.15`).

2. Start the backend server on your PC:
   ```powershell
   cd D:\whatsapp-clone\backend
   npm run build
   npm start
   ```
   *(Or keep the dev server running with `npx tsx src/server.ts`)*

3. On your Android phone:
   - Open the installed WhatsApp APK.
   - Go to **Settings** -> **Backend Server & Network**.
   - Enter `http://192.168.1.15:5000` (replace with your actual PC IP).
   - Tap **Save Changes**.
   - Your Android phone will instantly connect, receive messages, receive incoming calls, and stream voice notes to your PC!

---

### Option C: Docker Deployment (Self-Hosted VPS)
To host on an Ubuntu/Debian VPS (DigitalOcean, AWS, Hetzner, Linode):

1. Clone your project onto the server:
   ```bash
   git clone <your-repo-url>
   cd whatsapp-clone
   ```
2. Run with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. The server will be running on port `5000` with automated volume persistence for database and uploaded media.

---

## 3. Account & Identity System (Phone or Email Verification)

The application strictly implements the authentic WhatsApp onboarding flow and identity system:

1. **Choice of Verification (Phone Number OR Email Address)**:
   - **Phone Verification**: Select country code (e.g. `+92` Pakistan) and enter real mobile number (e.g. `03446789261`). Verifies via 6-digit SMS code.
   - **Email Verification**: Enter real email address (e.g. `user@gmail.com`). Sends a branded 6-digit verification email using SMTP / Nodemailer.
   - **Simulated OTP Banner**: If SMTP credentials are not yet configured or testing locally, a WhatsApp notification banner displays the code on screen with an **"Auto-Fill Code"** button.

2. **One Account Guarantee**:
   - Exactly **1 account per real phone number** and **1 account per email address**.
   - If an account already exists, entering the 6-digit code immediately logs into that account without duplicate registration.

3. **Fresh Account Initialization (0 Contacts, 0 Chats)**:
   - When a user registers a new account, their inbox starts completely **clean with 0 contacts and 0 chats**, matching authentic WhatsApp Web and Mobile.
   - Both Desktop Sidebar and Android Mobile display the official WhatsApp empty state with an active **"Start a new chat"** button.

4. **Mandatory F0UNDR ID Syntax (`f` + 7 characters)**:
   - Must start with `f` (or `F`) followed by **exactly 7 characters** (letters/digits, total 8 characters, e.g. `f1234567`, `f0000000`).
   - The UI provides a live validation badge and a **"🎲 Generate ID"** button.
   - Contacts can be searched and added by **Phone Number**, **Email Address**, or **F0UNDR ID**.

5. **Configuring Real Email SMTP (Optional)**:
   - In `backend/.env`, set:
     ```env
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your_email@gmail.com
     SMTP_PASS=your_16_char_google_app_password
     ```
   - All verification codes will automatically be sent to users' real email inboxes with WhatsApp branded HTML styling.

---

## 4. Rebuilding Artifacts After Custom Changes

If you make modifications to the codebase in the future, rebuild with these simple commands:

### Rebuild Android APK:
```powershell
cd D:\whatsapp-clone\client
npm run build
npx cap sync
cd android
.\gradlew.bat assembleDebug
```
The new APK will be at `client/android/app/build/outputs/apk/debug/app-debug.apk`.

### Rebuild Windows Desktop `.exe`:
```powershell
cd D:\whatsapp-clone\client
npm run build
npx electron-packager . WhatsApp --platform=win32 --arch=x64 --out=../releases/windows --overwrite --prune=true --ignore="(android|dist-electron|\.git)"
```
The new portable Windows app will be in `releases/windows/WhatsApp-win32-x64/WhatsApp.exe`.

---

## 5. Security & Permissions Checklist

- [x] **Android Camera & Microphone**: Declared in `AndroidManifest.xml` (`RECORD_AUDIO`, `CAMERA`, `MODIFY_AUDIO_SETTINGS`).
- [x] **Android Cleartext Traffic**: `android:usesCleartextTraffic="true"` enabled for local development and LAN IP communication.
- [x] **Desktop Media Access**: Electron WebPreferences configured with full WebRTC and Web Audio support.
- [x] **Chat Lock Protection**: Passcode PIN stored per user (default `1234`), chats filtered securely from main thread until unlocked.
