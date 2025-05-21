import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router, Link } from 'expo-router';
import { validateEmail, validatePassword } from '@/utils/validation';
import { auth } from '@/lib/auth';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export default function Login() {
  const isMounted = useRef(true);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!isMounted.current) return;
    
    setError('');
    setEmailError('');
    setPasswordError('');
    
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    let hasError = false;
    
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
    
    if (!hasError) {
      if (isMounted.current) {
        setIsLoading(true);
      }
      
      try {
        const { data, error: authError } = await auth.signIn({
          email,
          password
        });
        
        if (authError && isMounted.current) {
          setError(authError);
          return;
        }
        
        if (data && isMounted.current) {
          try {
            await router.replace('/(tabs)');
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
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Sign in to continue to your account
        </Text>

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

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
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          secureTextEntry
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.button}
          fullWidth
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.secondaryText }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: colors.primary }]}>Sign Up</Text>
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