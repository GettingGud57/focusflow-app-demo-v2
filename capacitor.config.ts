import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focusflow.app',
  appName: 'FocusFlow',

  // Vite writes the client here (see vite.config.ts build.outDir). Capacitor
  // copies this folder into the Android project on `cap sync`. Unused while
  // `server.url` is set, but `cap sync` still requires it to exist.
  webDir: 'dist/public',

  server: {
    // The WebView loads the deployed app instead of bundled assets, so it stays
    // same-origin with the API: no CORS, no absolute API base URL, no apiUrl()
    // helper. Native plugins (local notifications) still work on a remote URL.
    //
    // Trade-off: the app needs a network connection to open. Bundling assets
    // (delete this block) is only worth it if offline use ever matters.
    url: 'https://focusflow-app-demo-v2-production.up.railway.app',
  },
};

export default config;
