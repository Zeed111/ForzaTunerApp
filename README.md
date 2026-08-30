Markdown
# 🏎️ Forza Tuner App

A cross-platform tuning calculator and vehicle database application for Forza motorsport & racing enthusiasts. Built with **React Native**, **Expo (SDK 54)**, and **TypeScript**.

---

## ✨ Features

- ⚙️ **Automated Tuning Calculator**: Calculates optimal baseline tuning settings (tire pressure, gearing, camber, anti-roll bars, springs, and damping) based on vehicle weight, weight distribution, and drivetrain.
- 🚗 **Vehicle Database & Garage**: Browse vehicle specs, track custom tune profiles, and save builds for quick access.
- 📊 **Dataset Conversion Tooling**: Automated utilities to ingest, clean, and convert spreadsheet data into optimized JSON models for the mobile client.
- 📱 **Cross-Platform**: Designed for Android and iOS using Expo prebuild and modern React Native architecture.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) / JavaScript
- **Build System**: Expo Prebuild / Gradle (Android Local Standalone Builds)
- **Code Quality**: ESLint 9

---

## 📁 Project Structure

```text
ForzaTunerApp/
├── assets/             # App icons, splash screens, and image assets
├── src/ / components/  # React Native UI components & screens
├── convertExcel.js     # Tooling script to convert vehicle specs to app data
├── app.json            # Expo configuration & app metadata
├── eas.json            # EAS build profiles (Local standalone APK/AAB)
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and build scripts
```
🚀 Getting Started
Prerequisites
Node.js (v20 LTS recommended)

npm or yarn

Expo Go on your mobile device (for rapid development)

Installation
Clone the repository:

Bash
git clone [https://github.com/Zeed111/ForzaTunerApp.git](https://github.com/Zeed111/ForzaTunerApp.git)
cd ForzaTunerApp
Install dependencies:

Bash
npm install
Start the development server:

Bash
npx expo start
Run on your device:

Scan the QR code displayed in the terminal with the Expo Go app (Android) or Camera app (iOS).

Or press a to open in an Android emulator.

🔨 Local Standalone Build (Android APK)
To compile a standalone .apk locally using Gradle without cloud queues:

Prebuild the native Android project:

Bash
npx expo prebuild --platform android --clean
Compile the release APK:

Bash
cd android
./gradlew assembleRelease --no-daemon
Output APK will be located at:

Plaintext
android/app/build/outputs/apk/release/app-release.apk

📄 License
This project is licensed under the MIT License.




