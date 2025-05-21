import React from 'react';
import { View, ViewProps } from 'react-native';
import { Platform } from '@/utils/platform';

interface GestureWrapperProps extends ViewProps {
  children: React.ReactNode;
}

export default function GestureWrapper({ children, ...props }: GestureWrapperProps) {
  if (Platform.OS === 'web') {
    // On web, strip out gesture handler props and any other RN-specific props
    const safeProps = { ...props };
    const gestureProps = [
      'onStartShouldSetResponder',
      'onMoveShouldSetResponder',
      'onResponderGrant',
      'onResponderReject',
      'onResponderMove',
      'onResponderRelease',
      'onResponderTerminate',
      'onResponderTerminationRequest',
      'onShouldBlockNativeResponder',
      'onLayout',
      'collapsable'
    ];
    
    gestureProps.forEach(prop => {
      if (prop in safeProps) {
        delete safeProps[prop];
      }
    });
    
    return <div {...safeProps}>{children}</div>;
  }

  return <View {...props}>{children}</View>;
}