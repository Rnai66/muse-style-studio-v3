import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Capacitor ต้องการ relative paths
    assetsDir: 'assets',
    sourcemap: false,
    // Needed for ONNX runtime bundles (BigInt literals)
    target: ['es2020', 'safari15'],
    // Warn ถ้า chunk ใหญ่กว่า 600kb
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Firebase split ออกเพราะหนักมาก
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Capacitor plugins
          capacitor: [
            '@capacitor/core',
            '@capacitor/camera',
            '@capacitor/filesystem',
            '@capacitor/haptics',
            '@capacitor/share',
            '@capacitor/status-bar',
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true, // เปิดให้ device บนเครือข่ายเดียวกัน access ได้
    proxy: {
      '/rnai-api': {
        target: 'https://rnai-io.vercel.app/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rnai-api/, ''),
      },
    },
  },
});
