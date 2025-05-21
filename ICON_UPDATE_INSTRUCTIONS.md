# App Icon Update Instructions

## How to Update the App Icon

1. Replace the file at `assets/images/icon.png` with the PayUOne icon shown in the conversation.
2. The icon should be a square image with dimensions of at least 1024x1024 pixels for best results across all platforms.
3. After replacing the icon, rebuild your app using:
   ```
   npx expo prebuild --clean
   ```
4. For iOS and Android specific icons, you may also want to update:
   - iOS: Update icons in `ios/[YourAppName]/Images.xcassets/AppIcon.appiconset/`
   - Android: Update icons in `android/app/src/main/res/mipmap-*/`

## Automatic Icon Generation

Alternatively, you can use the Expo CLI to generate all required icon sizes:

1. Place your high-resolution PayUOne icon as `assets/images/icon.png`
2. The app.json is already configured to use this file as the source for all app icons
3. When you build your app, Expo will automatically resize and create all required icon variants

## File Locations

- Main icon: `assets/images/icon.png`
- Web favicon: `assets/images/favicon.png`

The PayUOne icon should have a blue background with the "P" logo and "PayUOne" text as shown in the shared image. 