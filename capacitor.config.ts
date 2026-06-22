import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sofyantsa.quickflash',
  appName: 'QuickFlash',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      // 🚨 Matikan total pluginnya agar tidak merusak tampilan gambar kustommu
      disable: true
    }
  }
};

export default config;