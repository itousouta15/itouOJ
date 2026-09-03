import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

// 預設載入正式站；開發時用 CAP_SERVER_URL 指到本機（例如
// CAP_SERVER_URL=http://localhost:3000 npx cap sync android && adb reverse tcp:3000 tcp:3000）
const devUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "me.itousouta.oj",
  appName: "itouOJ",
  // 遠端 URL 模式下 WebView 直接載入 server.url，這裡的 webDir 只是讓
  // `cap sync` 有東西可以複製（正式上線不會用到這些靜態檔）。
  webDir: "public",
  server: devUrl
    ? { url: devUrl, cleartext: true }
    : { url: "https://oj.itousouta.me", cleartext: false },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#1b1e23",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#1b1e23",
    },
    Keyboard: {
      // body resize：鍵盤彈出時 WebView 高度跟著縮，編輯器不會被蓋住
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;