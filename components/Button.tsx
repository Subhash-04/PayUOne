import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { Platform } from '@/utils/platform';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const getButtonStyle = () => {
    let baseStyle: ViewStyle = {
      ...styles.button,
      ...sizeStyles[size],
    };
    
    if (fullWidth) {
      baseStyle = {
        ...baseStyle,
        width: '100%',
      };
    }

    if (disabled) {
      return {
        ...baseStyle,
        ...variantStyles[variant].disabled,
      };
    }

    return {
      ...baseStyle,
      ...variantStyles[variant].enabled,
    };
  };

  const getTextStyle = () => {
    if (disabled) {
      return {
        ...styles.text,
        ...variantStyles[variant].textDisabled,
        ...textSizeStyles[size],
      };
    }

    return {
      ...styles.text,
      ...variantStyles[variant].text,
      ...textSizeStyles[size],
    };
  };

  const variantStyles = {
    primary: {
      enabled: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      disabled: {
        backgroundColor: Platform.OS === 'web' ? `${colors.primary}80` : colors.primary + '80',
        borderWidth: 0,
      },
      text: {
        color: '#FFFFFF',
      },
      textDisabled: {
        color: '#FFFFFF',
      },
    },
    secondary: {
      enabled: {
        backgroundColor: colors.secondary,
        borderWidth: 0,
      },
      disabled: {
        backgroundColor: Platform.OS === 'web' ? `${colors.secondary}80` : colors.secondary + '80',
        borderWidth: 0,
      },
      text: {
        color: '#FFFFFF',
      },
      textDisabled: {
        color: '#FFFFFF',
      },
    },
    outline: {
      enabled: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      },
      disabled: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Platform.OS === 'web' ? `${colors.primary}80` : colors.primary + '80',
      },
      text: {
        color: colors.primary,
      },
      textDisabled: {
        color: Platform.OS === 'web' ? `${colors.primary}80` : colors.primary + '80',
      },
    },
    text: {
      enabled: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingHorizontal: 8,
      },
      disabled: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingHorizontal: 8,
      },
      text: {
        color: colors.primary,
      },
      textDisabled: {
        color: Platform.OS === 'web' ? `${colors.primary}80` : colors.primary + '80',
      },
    },
  };

  const sizeStyles = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
    },
  };

  const textSizeStyles = {
    small: {
      fontSize: 14,
    },
    medium: {
      fontSize: 16,
    },
    large: {
      fontSize: 18,
    },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'text' ? colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
});