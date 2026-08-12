# HarvestNearU Mobile

Native Expo/React Native client for HarvestNearU. This is a separate mobile application, not a WebView or Capacitor wrapper. It shares the production Next.js API, Neon database, Vercel Blob assets, Paystack flow, roles, and HarvestNearU visual identity.

## Included native flows

- Role-aware bottom navigation
- Consumer and farmer sign-up and sign-in
- Nearby produce with device-location ranking
- Search and dynamic category filtering
- Full, uncropped produce-image previews
- Persistent basket, stock limits, fulfilment choice, and Paystack handoff
- Database-backed order history
- Farmer workspace summary
- Notifications with read acknowledgement
- Account profile, dark mode, and sign-out

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
