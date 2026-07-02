# Sunrise School React Native App

This is a true React Native / Expo version of the school management system. It is separate from the existing web app and the mobile-first web app.

## Run

```bash
npm install
npm start
```

## Android APK

For a local debug APK:

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

Or use EAS Build for a cloud APK:

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

