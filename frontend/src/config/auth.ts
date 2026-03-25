export const AUTH_HUB_CONFIG = {
  BASE_URL: 'http://10.197.2.213:3000',
  API_PREFIX: '/api/v1',

  // ── Tenant isolation ────────────────────────────────────────────────────────
  // This is the slug generated when you registered "WhatsApp Copy" in AuthHub's
  // Developer Portal. Passing it on every login/register ensures all users are
  // scoped to WhatsApp Copy's isolated tenant space (not mixed with other apps).
  // Replace the value below with the AUTHHUB_CLIENT_ID you received:
  CLIENT_ID: 'whatsapp-copy_RFKanw6n',   
  // ────────────────────────────────────────────────────────────────────────────

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
