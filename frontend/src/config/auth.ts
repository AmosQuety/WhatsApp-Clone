export const AUTH_HUB_CONFIG = {
  BASE_URL: 'http://10.197.2.213:3000',
  API_PREFIX: '/api/v1',
  get LOGIN_URL() {
    return `${this.BASE_URL}${this.API_PREFIX}/auth/login`;
  },
  get REFRESH_URL() {
    return `${this.BASE_URL}${this.API_PREFIX}/auth/refresh`;
  },
  get ME_URL() {
    return `${this.BASE_URL}${this.API_PREFIX}/auth/me`;
  },
  WHATSAPP_BACKEND_URL: 'http://10.197.2.213:5000'
};
