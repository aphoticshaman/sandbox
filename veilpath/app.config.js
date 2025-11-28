import { APP_BRANDING } from './src/constants/appConstants';

export default {
  expo: {
    name: APP_BRANDING.NAME,
    slug: 'veilpath',
    version: APP_BRANDING.VERSION,
    scheme: 'veilpath',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/icons/ios/icon-1024.png',
    splash: {
      image: './assets/splash/splash-iphone-2532.png',
      resizeMode: 'cover',
      backgroundColor: '#6B46C1',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: APP_BRANDING.BUNDLE_ID_IOS,
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'This app does not use the camera.',
        NSMicrophoneUsageDescription: 'This app does not use the microphone.',
        NSPhotoLibraryUsageDescription: 'This app does not access your photo library.',
      },
      usesAppleSignIn: false,
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: APP_BRANDING.PACKAGE_NAME_ANDROID,
      versionCode: 1,
      permissions: [
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
        'READ_MEDIA_AUDIO',
        'ACCESS_MEDIA_LOCATION',
      ],
      adaptiveIcon: {
        foregroundImage: './assets/icons/android/adaptive/ic_launcher_foreground.png',
        backgroundColor: '#6B46C1',
      },
    },
    web: {
      favicon: './assets/icons/ios/icon-76.png',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
            newArchEnabled: false,
            flipper: false,
          },
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 35,
            minSdkVersion: 24,
          },
        },
      ],
      'expo-secure-store',
    ],
    extra: {
      eas: {
        projectId: '2ac3ed34-db07-4042-b887-70debea26195',
      },
    },
  },
};
