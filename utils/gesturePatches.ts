import { Platform } from 'react-native';
import React from 'react';

if (Platform.OS === 'web') {
  const originalCreateElement = React.createElement;
  
  React.createElement = function(type, props, ...children) {
    if (props && typeof props === 'object') {
      const newProps = { ...props };
      
      const gestureProps = [
        'onResponderTerminate',
        'onResponderTerminationRequest',
        'onStartShouldSetResponder',
        'onMoveShouldSetResponder',
        'onResponderGrant',
        'onResponderReject',
        'onResponderMove',
        'onResponderRelease',
        'onShouldBlockNativeResponder'
      ];
      
      gestureProps.forEach(prop => {
        if (prop in newProps) {
          delete newProps[prop];
        }
      });
      
      return originalCreateElement(type, newProps, ...children);
    }
    
    return originalCreateElement(type, props, ...children);
  };
}

export {};