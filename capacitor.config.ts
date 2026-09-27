import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focusflow.app',
  appName: 'FocusFlow',

  // Vite writes the client here (see vite.config.ts build.outDir). Capacitor
  // copies this folder into the Android project on `cap sync`.
  webDir: 'dist/public',

  server: {
    // STAGE 1 ONLY.
    //
    // Pointing the WebView at the LAN dev server proves the native shell works
    // with zero changes to client/ or server/ - the app stays same-origin with
    // the API, so no CORS and no absolute API base URL needed yet.
    //
    // To ship bundled assets instead, delete this whole `server` block. That is
    // when you need the apiUrl() helper and cors() on Express, because the
    // WebView's origin becomes http://localhost rather than your server.
    url: 'http://192.168.0.19:3000',

    // Android blocks plain http:// by default. Required while pointing at a LAN
    // dev server; irrelevant once assets are bundled or the URL is https.
    cleartext: true,
  },
};

export default config;
