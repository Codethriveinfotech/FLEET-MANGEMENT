import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function AdminLogin() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!identity.trim() || !password.trim()) {
      setError('System identity credentials required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/login', {
        identity: identity.trim(),
        password: password.trim(),
      });

      if (res.data && res.data.success) {
        const { user, accessToken, refreshToken } = res.data.data;
        if (user.phone === 'admin') {
          const adminUser = {
            ...user,
            role: 'ADMIN',
          };
          await setAuth(adminUser, accessToken, refreshToken);
        } else {
          setError('Access Denied: Enterprise Role Mismatch');
        }
      } else {
        setError(res.data.message || 'Access Denied: Mismatched Credentials');
      }
    } catch (err: any) {
      console.error('Login error', err);
      const errMsg = err.response?.data?.message || 'Access Denied: Mismatched Credentials';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>FT</Text>
          </View>
          <Text style={styles.brandTitle}>FLEETTRACK CENTRAL</Text>
          <Text style={styles.brandSubtitle}>ENTERPRISE LIGHT CONSOLE</Text>
        </View>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>SYSTEM USERNAME / IDENTITY</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter admin identity (e.g. admin)"
            placeholderTextColor="#8E8E93"
            value={identity}
            onChangeText={setIdentity}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.spacer} />

          <Text style={styles.inputLabel}>SECURE ACCESS KEY / PASSWORD</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter secure password"
            placeholderTextColor="#8E8E93"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>UNLOCK CONSOLE</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          SECURE CONNECTION • CORPORATE SHIELD ACTIVE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4', // BrandLightGrey
  },
  loginCard: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF', // BrandWhite
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1F232B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F4B000', // BrandYellow
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F4B000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F232B', // BrandDark
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F6368', // BrandGrey
    letterSpacing: 1.5,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#5F6368', // BrandGrey
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#1F232B', // BrandDark
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
  errorText: {
    color: '#FF3B30', // DangerCrimson
    fontSize: 12,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 32,
    backgroundColor: '#F4B000', // BrandYellow
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4B000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  footerText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 2,
  },
});
