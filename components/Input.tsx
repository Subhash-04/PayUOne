import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { Eye, EyeOff } from 'lucide-react-native';
import { Platform } from '@/utils/platform';
import GestureWrapper from './GestureWrapper';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
  containerStyle?: any;
}

export default function Input({
  label,
  error,
  secureTextEntry,
  containerStyle,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: error
                ? colors.error
                : focused
                ? colors.primary
                : colors.border,
              color: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          placeholderTextColor={colors.secondaryText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry ? !showPassword : false}
          {...props}
        />
        
        {secureTextEntry && (
          <GestureWrapper style={styles.iconContainer}>
            {showPassword ? (
              <Eye 
                size={20} 
                color={colors.secondaryText} 
                onPress={toggleShowPassword}
              />
            ) : (
              <EyeOff 
                size={20} 
                color={colors.secondaryText} 
                onPress={toggleShowPassword}
              />
            )}
          </GestureWrapper>
        )}
      </View>
      
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
});