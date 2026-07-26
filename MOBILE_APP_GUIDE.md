# 📱 Funland CRM — Android App Build Guide

## What's included

Your existing web app is now wrapped as a native Android app via **Capacitor**.
The app is a lightweight shell (~5 MB APK) that loads your live web app so **any web change auto-reflects in the mobile app** without a rebuild.

- App ID: `in.funland.crm`
- App Name: `Funland CRM`
- Points to: `https://game-package-tracker.preview.emergentagent.com`
- Android project: `/app/frontend/android/`

---

## 🚀 Option A — Install PWA in 30 seconds (No Play Store needed)

**Sabse simple aur fast option**. Yahi 95% users ke liye best hai:

1. Phone me Chrome browser kholo
2. `https://game-package-tracker.preview.emergentagent.com` open karo
3. Login karo (`admin@funland.in` / `Funland@123`)
4. Chrome menu (⋮ 3 dots) → **"Install app"** / **"Add to Home Screen"**
5. Bas! Home screen par Funland icon aa jayega — click karke native app jaisa chalta hai
6. Offline bhi partially work karta hai, full-screen mode, no browser bars

**iOS pe**: Safari kholo → Share button → "Add to Home Screen"

---

## 📦 Option B — Build actual APK for Play Store

Aapko chahiye:
- Android Studio installed on your laptop (Windows/Mac/Linux)
- Java JDK 21+
- (Optional) Google Play Console developer account ($25 one-time) for Play Store submission

### Steps

1. **Download the android project** to your laptop:
   ```bash
   # Copy /app/frontend/android/ folder aur /app/frontend/capacitor.config.json to your local machine
   # Aap Emergent dashboard se code download kar sakte ho
   ```

2. **Open in Android Studio**:
   - Android Studio → Open → select `frontend/android/` folder
   - First open par Gradle sync automatic ho jayegi (5-10 min lag sakti hai)

3. **Build the APK**:
   - Menu: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - Wait for build to finish (2-3 min)
   - Click "locate" to find `app-debug.apk`

4. **Install on your phone**:
   - Copy the APK to your phone (WhatsApp/USB/Drive)
   - Allow "Install from unknown sources" in phone settings
   - Tap the APK to install

5. **For Play Store release**:
   - Menu: `Build → Generate Signed Bundle / APK...`
   - Create a keystore (save this file safely — you'll need it for every update)
   - Fill in details, choose "release" variant
   - Upload the generated `.aab` file to [Play Console](https://play.google.com/console)

---

## 🔄 When you update the web app

**Do nothing!** Since Capacitor loads your live web URL, every web deploy auto-updates the mobile app content. No re-build needed unless you change native settings (icons, splash screen, permissions).

## 🖼️ Custom app icon (optional)

Replace the following files with your Funland logo (1024×1024 PNG):
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (multiple sizes)
- Easy way: Android Studio → right-click `res` → New → Image Asset → drop logo

## 🐛 Troubleshooting

- **White screen on launch**: Check internet connection; the app loads from remote URL
- **Gradle sync fails**: Update Android Studio + Java JDK to latest
- **Login not working**: Verify the backend URL in `capacitor.config.json` matches your live domain

---

## 🍎 iOS App (future)

Same setup works for iOS — requires a Mac with Xcode.
Run: `cd /app/frontend && npx cap add ios` (after copying to a Mac).

---

## 📝 Summary

| Feature | PWA | Capacitor APK |
|---|---|---|
| Install time | 30 sec | Need Android Studio |
| Play Store | ❌ (browser only) | ✅ |
| Auto-updates | ✅ | ✅ (loads live URL) |
| Push notifications | Limited | Full support (needs config) |
| Native APIs (camera, GPS) | Limited | Full access |
| **Recommended for you** | ✅ **Start here** | ✅ Play Store launch |
