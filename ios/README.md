# iOS App Icon

`AppIcon.appiconset/` is a ready-to-use Xcode asset catalog entry — drag the whole
`AppIcon.appiconset` folder into your Xcode project's `Assets.xcassets` (or wherever your iOS
wrapper project keeps its asset catalog) and Xcode will recognize it immediately via its
`Contents.json`.

There's no Xcode project in this repo yet (only the Android Trusted Web Activity in `../android`
has been built so far) — this folder is just the icon asset, ready to drop into an iOS wrapper
project (e.g. a WKWebView shell, or a tool like Capacitor) whenever one exists.

All icons are opaque (no transparency — required by Apple) with the same cream background
(`#F7F5F0`) and centered logo mark used across the Android app icon and web favicon/splash, for
consistent branding across every platform.
