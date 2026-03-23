// screens/utils/theme.ts
export const theme = {
  colors: {
    primary: '#25D366',
    accent: '#075E54',
    background: '#ECE5DD',
    bubbleSent: '#DCF8C6',
    bubbleReceived: '#FFFFFF',
    text: '#333333',
    textLight: '#667781',
    border: '#E0E0E0',
  },
  typography: {
    fontFamily: 'Roboto',
    fontSize: {
      regular: 16,
      large: 18,
      small: 14,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export type Theme = typeof theme;