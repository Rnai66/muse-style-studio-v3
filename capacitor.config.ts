import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muse.stylestudio',
  appName: 'MUSE Style Studio',
  webDir: 'dist',
  server: {
    // uncomment ระหว่าง dev เพื่อ hot-reload บนมือถือ
    // url: 'http://192.168.1.x:5173',
    // cleartext: true,
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
  },
  android: {
    backgroundColor: '#0e0d0c',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
