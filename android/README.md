# FalsafahTot — Android App (Trusted Web Activity)

This folder is a complete, standalone Android Studio project that wraps the FalsafahTot web
app as an installable Android app, using a **Trusted Web Activity (TWA)** — Google's
recommended way to publish a website to the Play Store. It renders the exact same site through
Chrome, full-screen with no browser address bar, with no changes to the web app's functionality.

## Why TWA instead of a WebView

A TWA hands rendering entirely to Chrome — the same Chrome already installed on the device,
running with its own already-granted permissions. That single fact is why this project is so
small: camera, microphone, geolocation, file upload, downloads, and notifications don't need a
single line of native permission-handling code, because Chrome already handles every one of
them exactly as it would for any website. A custom WebView shell would need to hand-implement
all of that (and would face more Play Store scrutiny as a "just a wrapper" app under the
[minimum functionality policy](https://support.google.com/googleplay/android-developer/answer/9899676)).
The tradeoff: TWA requires your site to be served over HTTPS with one small verification file
hosted at your domain (see below) — until that's in place, the app still works, it just shows
Chrome's normal address bar instead of going full-screen.

## What's already done for you

- ✅ Splash screen (brand-green background + logo mark, `LauncherActivity` metadata)
- ✅ App icon (adaptive icon for Android 8.0+, generated from the app's own header logo mark)
- ✅ minSdk 26 (Android 8.0) → targetSdk 36
- ✅ Camera, microphone, location, file upload, downloads, notifications — all via Chrome delegation (see below)
- ✅ Back button — handled automatically by the TWA's own navigation stack
- ✅ Offline screen — a branded `offline.html` page served by a service worker added to the web app (`public/sw.js`, `public/offline.html`); works because Chrome is rendering the real site, service worker and all
- ✅ Release build config: minify + resource shrinking, signing config wired to a keystore you provide
- ✅ ProGuard rules (the library ships its own; nothing extra needed)
- ✅ Notification delegation service (web push notifications show with this app's name/icon, not Chrome's)
- ✅ "Manage space" wired to open the site (Play Store account-deletion/data-management friendliness)

## How permissions actually work

This app's `AndroidManifest.xml` does **not** declare `CAMERA`, `RECORD_AUDIO`,
`ACCESS_FINE_LOCATION`, or `POST_NOTIFICATIONS`. That's intentional, not an oversight: this app
never calls those APIs itself — Chrome does, on the website's behalf, exactly like it would in a
normal browser tab. When a page calls `getUserMedia()`, `navigator.geolocation`, or
`Notification.requestPermission()`, **Chrome** shows its own permission prompt and Chrome's own
already-granted Android permissions are what's used. Declaring those permissions in this app's
manifest would do nothing (Chrome doesn't check the launching app's permissions) and would only
add unnecessary entries to the Play Store's permissions disclosure for your app.

File upload (`<input type="file">`, including camera capture) and downloads work the same way —
Chrome shows its native file picker / camera intent / download notification. The one bit of
native config this app *does* provide is a `FileProvider` (see the manifest and
`res/xml/filepaths.xml`), which is what lets Chrome hand a captured photo back to the page as a
proper `content://` URI under Android's scoped storage rules.

## Customization Checklist

Exactly four things to change before this is *your* app. Nothing else in the project needs
touching.

| # | What | Where |
|---|------|-------|
| 1 | **Package name** (`applicationId`) | `android/app/build.gradle` — two lines near the top marked `QUICK CUSTOMIZATION #1` (`namespace` and `applicationId`, keep them identical). Also rename the (currently empty) `android/app/src/main/java/com/example/falsafahtot/` folder to match if you ever add Kotlin/Java code. |
| 2 | **App name** | `android/app/src/main/res/values/strings.xml` — the `app_name` string. |
| 3 | **Icon** | See "Changing the icon" below. |
| 4 | **Website URL** | `android/app/src/main/res/values/strings.xml` — `host_name` (bare domain) and `launch_url` (full `https://…` URL). Also update `public/manifest.webmanifest`'s `start_url`/`scope` and `public/.well-known/assetlinks.json`'s `package_name` in the **web app** repo (root, not this folder) to match. |

### Changing the icon

The launcher icon is generated from two pieces, both under `android/app/src/main/res/`:

- `drawable/ic_launcher_foreground.xml` — a vector drawable of the logo mark
- `values/colors.xml` — the `ic_launcher_background` color behind it
- `mipmap-*/ic_launcher.png` / `ic_launcher_round.png` — flattened legacy fallbacks for pre-adaptive-icon launchers, at 48/72/96/144/192px
- `../play-store-icon-512.png` — the 512×512 hi-res icon for the Play Console listing (not bundled into the app, just for upload)

Easiest path: open `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` in Android
Studio and right-click `res` → **New → Image Asset** to swap in your own image — Android
Studio regenerates every density and the Play Store icon for you. If you do it by hand instead,
regenerate the PNGs at the sizes listed above and keep the adaptive icon's foreground content
within the inner ~66% of the canvas (the "safe zone" that survives every launcher mask shape).

## Digital Asset Links verification (required for full-screen mode)

Until this is set up, the app runs fine but shows Chrome's normal address bar instead of going
fully full-screen — Android refuses to hide it until it's cryptographically sure this app and
your website are controlled by the same party.

1. **Get your signing certificate's SHA-256 fingerprint.**
   - Debug builds: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - Release builds: `keytool -list -v -keystore /path/to/release-keystore.jks -alias <your-alias>`
   - If you let Google **Play App Signing** re-sign your app (the default, recommended, and what
     you'll be prompted for on first upload): Play Console → your app → *Setup* → *App signing* →
     copy the **SHA-256 certificate fingerprint** shown there instead — that's the certificate
     that actually ships to users, not your local upload key.
2. Paste that fingerprint into **`public/.well-known/assetlinks.json`** in the web app repo
   (root, not this `android/` folder), replacing `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT`,
   and set `package_name` to your real `applicationId`.
3. Deploy the web app so that file is reachable at
   `https://<your-domain>/.well-known/assetlinks.json` (no redirects, served as
   `application/json` or `text/plain`, HTTP 200).
4. Reinstall the app. Verification happens automatically on install; there's no in-app trigger.
   To check it worked: `adb shell dumpsys package com.your.app | grep -A3 "verify"`, or just
   look for the address bar disappearing.

## Create a release keystore

If you don't already have one:

```bash
keytool -genkeypair -v -storetype JKS \
  -keystore release-keystore.jks \
  -alias falsafahtot \
  -keyalg RSA -keysize 2048 -validity 10000
```

Put the resulting `release-keystore.jks` **outside version control** (e.g. one level above this
folder, matching the default `../release-keystore.jks` in `keystore.properties.example`). Then:

```bash
cp keystore.properties.example keystore.properties
# edit keystore.properties with your real storeFile path + passwords
```

`keystore.properties` is gitignored — never commit it or the `.jks` file. Keep a backup of both
somewhere safe: **if you lose this keystore, you can never update your app on the Play Store
again under the same listing.**

## Building a signed APK / AAB

**In Android Studio:** *Build → Generate Signed App Bundle / APK* → follow the wizard (it can
also create the keystore for you if you skipped the step above). Choose **Android App Bundle**
for Play Store upload (required for new apps) or **APK** for sideloading/testing.

**From the command line** (from this `android/` folder):

```bash
./gradlew bundleRelease   # → app/build/outputs/bundle/release/app-release.aab (Play Store)
./gradlew assembleRelease # → app/build/outputs/apk/release/app-release.apk (sideloading)
./gradlew assembleDebug   # → app/build/outputs/apk/debug/app-debug.apk (unsigned, for testing)
```

`bundleRelease`/`assembleRelease` only produce a **signed** artifact once `keystore.properties`
exists (see above) — without it they still build, but the output is unsigned and Play Store will
reject it.

## Testing locally

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

- To confirm Digital Asset Links verification: the address bar should be gone. If it's still
  showing, check `adb logcat | grep -i "OriginVerifier\|TrustedWebActivity"` for the specific
  verification failure reason.
- To debug the web content itself: open `chrome://inspect#devices` on your desktop Chrome with
  the device connected — the TWA's page shows up like any other Chrome tab.
- To test the offline screen: enable airplane mode after the app has loaded once (so the service
  worker has installed), then relaunch.

## Performance notes

- `minifyEnabled true` + `shrinkResources true` on the release build type keep the APK/AAB small
  (the app itself is a thin shell — nearly all the weight is Chrome, which is shared with every
  other app on the device, not bundled into yours).
- The splash screen covers Chrome's own cold-start time, so the app never shows a blank white
  frame on first launch.
- The web app's actual load performance (bundle size, caching, etc.) is unchanged by this
  wrapper — optimize that in the web app itself the same way you would for any visitor arriving
  through Chrome.

## Play Store submission checklist

- [ ] Digital Asset Links verified (see above) — required for the app to feel like a real app rather than a browser bookmark
- [ ] `applicationId`, `app_name`, icon, and URLs all customized (see checklist above)
- [ ] Signed with a release keystore you've backed up safely
- [ ] Privacy policy URL ready (required by Play Console's Data Safety form — link to a real page on your domain)
- [ ] Data Safety form filled out in Play Console, matching what the web app actually collects/sends
- [ ] `versionCode`/`versionName` bumped for each new upload (`android/app/build.gradle`)
- [ ] Store listing assets ready: at minimum the 512×512 hi-res icon (`android/play-store-icon-512.png`), a feature graphic (1024×500), and 2+ phone screenshots
- [ ] Tested on a real Android 8.0 device/emulator if possible, not just your dev device
- [ ] Uploaded as an **Android App Bundle** (`bundleRelease` output) — Play Store requires AAB for new app listings, not APK

## Project structure

```
android/
  app/
    build.gradle              — app module config, dependencies, signing
    proguard-rules.pro
    src/main/
      AndroidManifest.xml      — the whole TWA config lives here
      res/
        values/strings.xml     — app name + website URL
        values/colors.xml      — brand colors + adaptive icon background
        values/themes.xml
        drawable/ic_launcher_foreground.xml
        mipmap-*/               — launcher icons per density
        xml/filepaths.xml       — FileProvider paths for camera capture
  build.gradle                 — root/project-level Gradle config
  settings.gradle
  gradle.properties
  keystore.properties.example  — copy to keystore.properties, fill in, never commit
  play-store-icon-512.png      — for the Play Console listing, not bundled into the app
```
