import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export default function Avatar({ name, size = 40, backgroundColor, style }: AvatarProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  // Get first letter of name and make it uppercase
  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U';
  
  // Calculate font size based on avatar size
  const fontSize = size * 0.4;
  
  return (
    <View 
      style={[
        styles.avatar, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: backgroundColor || colors.primary 
        },
        style
      ]}
    >
      <Text style={[styles.initial, { fontSize, color: '#FFFFFF' }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
}); 