import { Platform as RNPlatform } from 'react-native';

export const Platform = {
  OS: RNPlatform?.OS || 'web',
  select: RNPlatform?.select || ((spec: any) => spec.web || spec.default),
  
  // Correctly determine if we're on web platform
  isWeb: RNPlatform?.OS === 'web' || typeof window !== 'undefined',
  isIOS: RNPlatform?.OS === 'ios',
  isAndroid: RNPlatform?.OS === 'android',
};

export default Platform;