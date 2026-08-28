import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AdminLogin from './screens/admin/AdminLogin';
import AdminDashboard from './screens/admin/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'fleetmanager://'],
  config: {
    screens: {
      Login: 'login',
      Dashboard: {
        path: 'dashboard',
        screens: {
          overview: 'overview',
          vehicles: 'vehicles',
          drivers: 'drivers',
          trips: 'trips',
          maintenance: 'maintenance',
          fuel: 'fuel',
          'fuel-monitor': 'fuel-monitor',
          reports: 'reports',
          profile: 'profile',
        },
      },
    },
  },
};

export default function App() {
  const { initializeAuth, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer linking={linking}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated && user?.phone === 'admin' ? (
              <Stack.Screen name="Dashboard" component={AdminDashboard} />
            ) : (
              <Stack.Screen name="Login" component={AdminLogin} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090D1A',
  },
});
