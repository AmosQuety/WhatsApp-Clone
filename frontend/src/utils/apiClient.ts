/**
 * Shared Axios instance for all WhatsApp backend requests.
 * A request interceptor automatically reads the stored access token
 * from AsyncStorage and attaches it as a Bearer token, so callers
 * never have to manage Authorization headers themselves.
 */
import axios from 'axios';
import { AuthStorage } from './storage';
import { AUTH_HUB_CONFIG } from '../config/auth';

const apiClient = axios.create({
  baseURL: AUTH_HUB_CONFIG.WHATSAPP_BACKEND_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AuthStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
