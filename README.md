# MUSE Style Studio 💛

แอปออกแบบสไตล์การแต่งตัวด้วย AI · React + Vite + Capacitor (iOS & Android)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Mobile | Capacitor 6 |
| AI | RNAI + HuggingFace + Replicate |
| Routing | React Router v6 |
| Camera | @capacitor/camera |
| Haptics | @capacitor/haptics |
| Share | @capacitor/share |

---

## การตั้งค่าและรัน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env.local
```

แก้ไข `.env.local` โดยเพิ่ม API keys:
```
REPLICATE_API_TOKEN=your_token_here
VITE_RNAI_API_KEY=your_token_here
HUGGINGFACE_API_TOKEN=your_token_here
```

### 3. รันบน Web (dev mode)

```bash
npm run dev
```

เปิด http://localhost:5173

---

## การ Deploy บน iOS (Xcode)

```bash
# 1. Build + sync ไปยัง Capacitor
npm run cap:sync

# 2. เพิ่ม iOS platform (ครั้งแรกเท่านั้น)
npx cap add ios

# 3. Sync อีกครั้ง
npx cap sync ios

# 4. เปิด Xcode
npx cap open ios
```

ใน Xcode:
- เลือก Team ใน Signing & Capabilities
- เลือก Device หรือ Simulator
- กด ▶ Run

---

## การ Deploy บน Android (Android Studio)

```bash
# 1. เพิ่ม Android platform (ครั้งแรกเท่านั้น)
npx cap add android

# 2. Build + sync
npm run cap:sync

# 3. เปิด Android Studio
npx cap open android
```

ใน Android Studio:
- รอ Gradle sync เสร็จ
- เลือก Device หรือ Emulator
- กด ▶ Run

---

## Hot Reload บนมือถือจริง (Dev)

1. หา IP ของ Mac: `ipconfig getifaddr en0`
2. แก้ `capacitor.config.ts`:
```ts
server: {
  url: 'http://192.168.x.x:5173',
  cleartext: true,
}
```
3. รัน `npm run dev` แล้ว sync:
```bash
npx cap sync
npx cap run ios   # หรือ android
```

---

## โครงสร้างโปรเจกต์

```
muse-style-studio/
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx      # Navigation bar
│   │   └── LoadingScreen.tsx  # Splash/loading
│   ├── hooks/
│   │   ├── useAIStylist.ts    # AI Stylist API + chat history
│   │   └── useCamera.ts       # Capacitor Camera plugin
│   ├── pages/
│   │   ├── HomeScreen.tsx     # หน้าหลัก
│   │   ├── StudioScreen.tsx   # AI Try-on + Chat
│   │   ├── OccasionScreen.tsx # แต่งตัวตามโอกาส
│   │   ├── CoursesScreen.tsx  # คอร์สเรียน
│   │   └── ProfileScreen.tsx  # โปรไฟล์
│   ├── styles/
│   │   └── globals.css        # Design system / tokens
│   ├── App.tsx                # Router
│   └── main.tsx               # Entry point
├── capacitor.config.ts        # Capacitor config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Permissions ที่ต้องเพิ่ม

### iOS — `ios/App/App/Info.plist`
```xml
<key>NSCameraUsageDescription</key>
<string>MUSE ต้องการกล้องเพื่อถ่ายรูปลองชุด</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>MUSE ต้องการเข้าถึงคลังรูปเพื่อลองชุด</string>
```

### Android — `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## การต่อยอด (Roadmap)

- [ ] Auth (Sign in with Apple / Google)
- [ ] Lookbook — บันทึกลุคลง SQLite / Supabase
- [ ] AI Virtual Try-On จริง (Stable Diffusion / Replicate API)
- [ ] Shop Integration (เชื่อม product catalog)
- [ ] Payment (Stripe / PromptPay)
- [ ] Push Notifications (Style tips รายวัน)
- [ ] Social — แชร์ลุคและ follow Stylist

---

## License

MIT · MUSE Style Studio © 2025
