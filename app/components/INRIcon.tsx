import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface INRIconProps {
  size?: number;
  color?: string;
}

const INRIcon = ({ size = 24, color = '#000' }: INRIconProps) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 3h12M6 8h12M6 13h3c2.25 0 4.5-1.5 4.5-6 0 0 0 6 4.5 6H19M9 21l3-8M15 13l-6 8"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default INRIcon; 