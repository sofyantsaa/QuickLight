import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'QuickLight',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // Logo muncul cuma 1 detik (biar gak kelamaan)
      backgroundColor: "#121212", // Ganti background birunya jadi item biar senada sama app kamu
      showSpinner: false, // Ngilangin loading muter-muter yang biru itu
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;  