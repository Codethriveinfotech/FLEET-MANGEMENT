import { create } from 'zustand';
import * as SecureStore from '../utils/storage';
import { User, UserRole } from '@fleettrack/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const SECURE_STORE_ACCESS_KEY = 'ft_access_token';
const SECURE_STORE_REFRESH_KEY = 'ft_refresh_token';
const SECURE_STORE_USER_KEY = 'ft_user_profile';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(SECURE_STORE_ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, refreshToken);
    await SecureStore.setItemAsync(SECURE_STORE_USER_KEY, JSON.stringify(user));

    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_ACCESS_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_REFRESH_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_USER_KEY);

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_ACCESS_KEY);
      const userProfileRaw = await SecureStore.getItemAsync(SECURE_STORE_USER_KEY);

      if (accessToken && userProfileRaw) {
        set({
          user: JSON.parse(userProfileRaw),
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
