import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthStorage } from '../utils/storage';
import axios from 'axios';
import { AUTH_HUB_CONFIG } from '../config/auth';
import { getFirebaseAuth } from '../config/firebase'; // ✅ Use getter for lazy initialization
import { signInWithCustomToken } from 'firebase/auth'; // ✅ correct import (not /react-native)

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { },
  register: async () => { },
  logout: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFirebase = async (authToken: string) => {
    try {
      const response = await axios.get(
        `${AUTH_HUB_CONFIG.WHATSAPP_BACKEND_URL}/auth/firebase-token`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const { customToken } = response.data;
      await signInWithCustomToken(getFirebaseAuth(), customToken); // ✅ Use lazy initialized auth
      console.log('Firebase synced successfully');
    } catch (error) {
      console.error('Failed to sync Firebase:', error);
    }
  };

  const loadUser = async () => {
    try {
      const token = await AuthStorage.getItem('accessToken');
      if (token) {
        // ✅ Fix: attach token to axios BEFORE making the /me request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const response = await axios.get(AUTH_HUB_CONFIG.ME_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);

        // Sync Firebase after user is loaded
        await syncFirebase(token);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear stale token if unauthorized
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 401) {
        await AuthStorage.deleteItem('accessToken');
        await AuthStorage.deleteItem('refreshToken');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log(`Login attempt: ${AUTH_HUB_CONFIG.LOGIN_URL}`, { email });
      const response = await axios.post(AUTH_HUB_CONFIG.LOGIN_URL, { email, password });
      console.log('Login successful response:', JSON.stringify(response.data));
      const data = response.data;

      // Handle both camelCase and snake_case field names from AuthHub
      const accessToken = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token || '';
      const userData = data.user || data.userData || { id: data.id, email, name: data.name };

      if (!accessToken) throw new Error('No access token in login response');

      // ✅ Fix: store token and attach to axios BEFORE syncing Firebase
      await AuthStorage.setItem('accessToken', String(accessToken));
      if (refreshToken) await AuthStorage.setItem('refreshToken', String(refreshToken));
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setUser(userData);

      // Sync Firebase last, after token is ready
      await syncFirebase(accessToken);
    } catch (error: any) {
      console.error('Login failed details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const url = `${AUTH_HUB_CONFIG.BASE_URL}${AUTH_HUB_CONFIG.API_PREFIX}/auth/register`;
      console.log(`Registration attempt: ${url}`, { name, email });
      const response = await axios.post(url, { name, email, password });
      console.log('Register successful response:', JSON.stringify(response.data));

      // Register only returns { message, userId } — auto-login to get the token
      await login(email, password);
    } catch (error: any) {
      console.error('Registration failed details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  };

  const logout = async () => {
    await AuthStorage.deleteItem('accessToken');
    await AuthStorage.deleteItem('refreshToken');
    // ✅ Clear the axios default header on logout
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);