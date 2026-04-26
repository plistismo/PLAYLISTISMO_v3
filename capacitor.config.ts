import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.capybook.love',
  appName: 'CapyBook Love',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {

    Keyboard: {
      resize: 'body' as any,
      style: 'dark' as any,
      resizeOnFullScreen: true
    }
  }
};

export default config;