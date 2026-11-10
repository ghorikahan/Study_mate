import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GraduationCap } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments as string[])[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not logged in and not on an auth screen -> redirect to login
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on login/register -> redirect to main tabs
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Show premium dark splash screen while checking session
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashLogo}>
          <GraduationCap size={48} color={Colors.primary} />
        </View>
        <Text style={styles.splashTitle}>StudyMate</Text>
        <Text style={styles.splashTagline}>Plan Smart. Study Better. Achieve More.</Text>
        <ActivityIndicator
          size="large"
          color={Colors.secondary}
          style={styles.splashSpinner}
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  splashLogo: {
    width: 88,
    height: 88,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  splashTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  splashTagline: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  splashSpinner: {
    marginTop: Spacing.xxl,
  },
});
