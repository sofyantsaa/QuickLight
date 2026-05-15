import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sofyantsa.quickflash',
  appName: 'QuickFlash',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;