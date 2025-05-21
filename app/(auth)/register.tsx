import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router, Link } from 'expo-router';
import { validateName, validatePhoneNumber, validateEmail, validatePassword } from '@/utils/validation';
import { auth } from '@/lib/auth';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export default function Register() {
  const isMounted = useRef(true);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleRegister = async () => {
    if (!isMounted.current) return;
    
    setError('');
    setNameError('');
    setPhoneNumberError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    const nameValidation = validateName(name);
    const phoneNumberValidation = validatePhoneNumber(phoneNumber);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    let hasError = false;
    
    if (!nameValidation.isValid) {
      if (isMounted.current) {
        setNameError(nameValidation.errorMessage || 'Invalid name');
        hasError = true;
      }
    }
    
    if (!phoneNumberValidation.isValid) {
      if (isMounted.current) {
        setPhoneNumberError(phoneNumberValidation.errorMessage || 'Invalid phone number');
        hasError = true;
      }
    }
    
    if (!emailValidation.isValid) {
      if (isMounted.current) {
        setEmailError(emailValidation.errorMessage || 'Invalid email');
        hasError = true;
      }
    }
    
    if (!passwordValidation.isValid) {
      if (isMounted.current) {
        setPasswordError(passwordValidation.errorMessage || 'Invalid password');
        hasError = true;
      }
    }
    
    if (password !== confirmPassword) {
      if (isMounted.current) {
        setConfirmPasswordError('Passwords do not match');
        hasError = true;
      }
    }
    
    if (!hasError) {
      if (isMounted.current) {
        setIsLoading(true);
      }
      
      try {
        const { data, error: authError } = await auth.signUp({
          email,
          password,
          fullName: name,
          mobileNumber: phoneNumber.replace(/\D/g, '')
        });
        
        if (authError && isMounted.current) {
          setError(authError);
          return;
        }
        
        if (data && isMounted.current) {
          try {
            await router.replace('/');
          } catch (navError) {
            console.error('Navigation error:', navError);
          }
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Sign up to get started
        </Text>

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          error={nameError}
          autoCapitalize="words"
        />

        <Input
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          error={phoneNumberError}
          keyboardType="phone-pad"
        />

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          secureTextEntry
        />

        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={confirmPasswordError}
          secureTextEntry
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={isLoading}
          style={styles.button}
          fullWidth
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.secondaryText }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    fontFamily: 'Inter-Regular',
  },
  error: {
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  button: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});