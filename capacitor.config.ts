import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'QuickLight',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // Set ke 0 biar langsung masuk aplikasi
    },
  },
};