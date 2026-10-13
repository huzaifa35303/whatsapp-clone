# WhatsApp Clone for Desktop & Android Mobile 🟢📱💻

An authentic, production-grade WhatsApp Clone architected for **Windows Desktop** (via Electron) and **Android Mobile** (via Capacitor), powered by a unified **React + TypeScript + Tailwind CSS** frontend and a high-performance **Node.js + Express + Socket.IO + SQLite** backend.

---

## 🌟 Key Features

### 📱 1. True Cross-Platform (Desktop + Android)
- **Desktop (Windows/Mac/Linux)**: Authentic WhatsApp Web & Desktop dual-pane interface with responsive sidebar, active chat area, and expandable contact details drawer.
- **Android Mobile**: Authentic native WhatsApp Android look and feel with Top App Bar, Tabs (**Chats**, **Updates / Status**, **Calls**, **Communities**), Floating Action Button (FAB), full-screen chat screen with Android back navigation, and mobile-optimized input.
- **Instant Device View Switcher**: Switch between Desktop and Android Mobile views with a single click in the top toolbar to preview and test both layouts on any display.

### 🆔 2. Unique Identity & Pakistani Phone Number System
- **1 Account Per Original Phone Number**: Strict rule enforcing exactly 1 WhatsApp account per real/original phone number (supports Pakistani numbers e.g. `03446789261` Telenor, `03001234567` Jazz, `03123456789` Zong, `03339876543` Ufone, or international format `+92...`). Duplicate account creation on the same original number is blocked.
- **Permanent F0UNDR Number**: Every account gets a unique F0UNDR ID (e.g. `F0UNDR-344678`, `F0UNDR-778899`) for adding contacts without revealing private numbers.
- **Custom Display Number**: Users can configure their own virtual or display phone number.
- **Add Contacts Seamlessly**: Add new contacts using either their **Original Phone Number** or their **F0UNDR ID**.

### 🔒 3. Locked Chats (Passcode Protected)
- Sensitive conversations can be locked and moved into a hidden **"Locked chats 🔒"** drawer.
- Unlocking requires entering a 4-digit security PIN (default: `1234`).
- Unlock individual chats anytime back to the main inbox.

### 📁 4. Archived Chats
- Move chats into an **"Archived"** folder to declutter the inbox.
- One-click unarchive restores conversations back to the main chat list.

### 🚫 5. Block & Unblock Person
- Block contacts directly from the chat header or contact details drawer.
- Prevents blocked users from sending messages or placing audio/video calls.
- In-chat warning banner with one-click unblock toggle.

### 🗑️ 6. Clear Chat History
- Permanently purge all messages from a conversation with confirmation dialog.

### 📻 7. Real-Time Talk & Voice Notes
- **Live Talk Walkie-Talkie**: Real-time push-to-talk voice channel.
- **Microphone Voice Notes**: Real recording with timer and waveform visualizer.
- **Waveform Audio Player**: Scrubbable timeline with `1x`, `1.5x`, `2x` speed options.

### 📞 8. WebRTC Audio & Video Calling
- Incoming call banner with authentic WhatsApp ringtone synthesizer (Web Audio API).
- 1-on-1 Audio and Video calling with live camera preview, mic mute, and camera toggle.

### ⚡ 9. Status Receipts & Real-Time Sync
- `✓` (Grey): Sent to server
- `✓✓` (Grey): Delivered to recipient device
- `✓✓` (Blue): Read by recipient
- Live typing indicators (*"typing..."*) and online/last seen status.

### 📷 10. WhatsApp Web QR Code Device Pairing
- Live QR code pairing token generation on Desktop.
- Mobile scan simulation or phone linking to authenticate secondary devices seamlessly.

---

## 🏗️ Project Architecture

```
whatsapp-clone/
├── backend/
│   ├── src/
│   │   ├── db.ts              # SQLite database (node:sqlite) + seed data + migrations
│   │   ├── socket.ts          # Socket.IO real-time handlers (chat, calls, block checks, QR)
│   │   └── server.ts          # Express REST API (auth, contacts, clear, lock, archive, block)
│   ├── data/
│   │   └── whatsapp.db        # Persistent SQLite database
│   ├── uploads/               # Storage for voice notes, images, documents
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Avatar, StatusTick, AudioPlayer, VoiceRecorder, EmojiPicker,
│   │   │   │                  # AddContactModal, RegisterUserModal, UserSettingsModal,
│   │   │   │                  # LockedChatsModal, ArchivedChatsModal
│   │   │   ├── chat/          # MessageItem, ChatArea, ContactDrawer
│   │   │   ├── desktop/       # Sidebar, DesktopLayout (dual-pane WhatsApp Web)
│   │   │   ├── mobile/        # MobileLayout (native WhatsApp Android tabs & FAB)
│   │   │   ├── call/          # WebRTC Audio & Video CallModal
│   │   │   └── qr/            # WhatsApp Web QRCodeModal
│   │   ├── context/           # WhatsAppContext (State, sockets, contacts, blocked, lock)
│   │   ├── utils/             # Web Audio API synthesizers for chimes & ringtones
│   │   ├── App.tsx            # View switcher & layout container
│   │   └── main.tsx
│   ├── electron/
│   │   ├── main.cjs           # Desktop Windows main process
│   │   └── preload.cjs        # Secure IPC bridge
│   ├── android/               # Native Android Studio Capacitor project
│   │   └── app/build/outputs/apk/debug/app-debug.apk # Compiled Android APK
│   ├── capacitor.config.json  # Android app settings (com.whatsapp.clone)
│   └── package.json
│
└── package.json               # Root orchestration scripts
```

---

## 🚀 How to Run

### 1. Start Backend & Web Client in Development
Run both concurrently:

```bash
cd D:\whatsapp-clone
npm run dev
```

- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 2. Run Windows Desktop App (Electron)
Launch the native desktop window:

```bash
cd D:\whatsapp-clone
npm run electron:dev
```

### 3. Build & Run Android Mobile App (Capacitor)
Sync web assets to the native Android project:

```bash
cd D:\whatsapp-clone
npm run android:sync
```

To open in **Android Studio**:
```bash
npm run android:open
```

Or build a debug APK via command line:
```powershell
cd D:\whatsapp-clone\client\android
.\gradlew.bat assembleDebug
```
The compiled APK is located at:
`client/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📦 Production Releases (Ready to Install & Use)

Pre-built binaries are ready in `D:\whatsapp-clone\releases\`:

- 📱 **Android Native APK**: [`releases/WhatsApp-Android.apk`](file:///D:/whatsapp-clone/releases/WhatsApp-Android.apk) (4.2 MB) - Install directly on any Android device.
- 💻 **Windows Desktop Executable**: [`releases/windows/WhatsApp-win32-x64/WhatsApp.exe`](file:///D:/whatsapp-clone/releases/windows/WhatsApp-win32-x64/WhatsApp.exe) - Standalone, no-install portable Windows app.
- 🗜️ **Windows Portable ZIP**: [`releases/WhatsApp-Windows-x64.zip`](file:///D:/whatsapp-clone/releases/WhatsApp-Windows-x64.zip) (129 MB) - Distributable Windows package.
- 🚀 **Full Publishing Guide**: See [PUBLISHING_GUIDE.md](file:///D:/whatsapp-clone/PUBLISHING_GUIDE.md) for 1-click cloud hosting (Render/Railway) and local Wi-Fi setup.

---

## 🧪 Testing Account Registration & Adding Contacts

1. **Pre-configured Pakistani Accounts**:
   - **You**: Original Phone: `03446789261` (Telenor), F0UNDR ID: `F0UNDR-344678`
   - **Sarah Jenkins**: Original Phone: `03001234567` (Jazz), F0UNDR ID: `F0UNDR-300123`
   - **David Chen**: Original Phone: `03123456789` (Zong), F0UNDR ID: `F0UNDR-312345`
   - **Emma Watson**: Original Phone: `03339876543` (Ufone), F0UNDR ID: `F0UNDR-333987`
   - **Alex Rivera**: Original Phone: `03451122334`, F0UNDR ID: `F0UNDR-345112`

2. **Add Contact**:
   - Click **`+ Contact`** in the header.
   - Enter either a phone number (e.g. `03001234567`) or a F0UNDR number (e.g. `F0UNDR-300123`) to immediately add and chat.

3. **Register New Number**:
   - Click **`+ Account`** in the header.
   - Provide your name, original phone number, and unique F0UNDR ID.
   - If an existing original number is entered, registration is strictly rejected (enforcing 1 account per real phone number).
