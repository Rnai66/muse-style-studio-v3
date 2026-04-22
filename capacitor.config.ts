import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muse.stylestudio',
  appName: 'MUSE Style Studio',
  webDir: 'dist',
  server: {
    // uncomment ระหว่าง dev เพื่อ hot-reload บนมือถือ
    // url: 'http://192.168.1.x:5173',
    // cleartext: true,
    // ปิด error logging ที่ไม่จำเป็นใน production
    errorPath: 'index.html',
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0e0d0c',
    },
  },
  ios: {
    scheme: 'App',
    backgroundColor: '#0e0d0c',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    limitsNavigationsToAppBoundDomains: true,
    // ใช้ mobile rendering mode (ไม่ให้ WKWebView คิดว่าเป็น desktop)
    preferredContentMode: 'mobile',
    // ปิด swipe-back gesture เพื่อลด gesture recognizer overhead
    handleApplicationNotifications: false,
    // WKWebView scrollView: ให้แอปจัดการเอง (ลด bounce lag)
    scrollEnabled: false,
  },
  android: {
    backgroundColor: '#0e0d0c',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
