# HarvestNearU Mobile

Native Expo/React Native client for HarvestNearU. This is a separate mobile application, not a WebView or Capacitor wrapper. It shares the production Next.js API, Neon database, Vercel Blob assets, Paystack flow, roles, and HarvestNearU visual identity.

## Included native flows

- Role-aware bottom navigation
- Consumer and farmer sign-up, sign-in, password visibility, and password recovery
- Nearby produce with device or saved-location ranking
- Search and dynamic category filtering
- Full, uncropped, scrollable produce-image previews and linked farm storefronts
- Free OpenStreetMap farm maps and routed directions
- Shared active pickup-centre directory with addresses and opening hours
- Persistent basket, stock limits, and three fulfilment choices: doorstep, farm pickup, or arrange with farmer
- Paystack handoff, database-backed open/completed orders, item tracking, receipt acknowledgement, farm ratings, and printable receipts
- Farmer multi-farm workspace, farm creation, produce publishing, fulfilment, payout accounts, payout requests, and printable statements
- Profile pictures, saved delivery location, account credit, email preferences, support tickets, and feedback
- Real-time notification counts plus actionable Expo push notifications with sound
- Dark mode, role-aware navigation, and sign-out
- Dedicated administrator/support console access with a shorter staff re-authentication window

## Run locally

```powershell
npm install
npm start
```

The app reads its backend address from `EXPO_PUBLIC_API_URL`. The `app.json`
value (`https://www.harvestnearu.com`) is the production fallback, while
`.env.local` points Expo Web to the Next.js backend on `http://localhost:3000`.
Start the backend from `C:\code\farmers-market` before starting Expo.

- Expo Web or iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Physical device: `http://<your-computer-LAN-IP>:3000`
- Production: `https://www.harvestnearu.com`

This project uses Expo SDK 57, so test it with an Expo development build rather than the SDK 54 Expo Go client during Expo's current SDK transition.

```powershell
npx eas-cli build --profile development --platform android
npm start
```

To use a Next.js server running on another device-accessible address:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.20:3000"
npm start
```

Do not use `localhost` from a physical phone; it points to the phone itself.

## Native builds

```powershell
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

Configure an Expo account and EAS project before store builds. Keep the API HTTPS in release builds.

For a local Android release build, use Java 17 and the generated native project:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```

The release configuration targets `arm64-v8a`, minifies code, and shrinks resources to keep the APK smaller. Production API fallback is configured in `app.json`; `EXPO_PUBLIC_API_URL` overrides it for local development.

## Shared backend services

The app does not connect directly to Neon, Vercel Blob, Resend, Paystack, OpenStreetMap routing, or Expo notification dispatch. It uses the authenticated HarvestNearU Next.js API so validation, role checks, stock enforcement, payment verification, image processing, email preferences, and audit logging remain consistent with the web application.
