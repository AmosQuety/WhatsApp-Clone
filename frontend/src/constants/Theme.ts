/**
 * Prism Premium UI Design System
 * Glassmorphism & High-Contrast Dark Mode
 */

export const Theme = {
  colors: {
    primary: '#38bdf8', // Prism Blue
    secondary: '#fbbf24', // Ghost Gold
    background: '#0f172a', // Deep Slate
    surface: 'rgba(30, 41, 59, 0.7)', // Glass Surface
    surfaceDeep: 'rgba(15, 23, 42, 0.8)',
    border: 'rgba(51, 65, 85, 0.5)',
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
      accent: '#38bdf8',
    },
    status: {
      online: '#22c55e',
      away: '#eab308',
      busy: '#ef4444',
    },
    bubbles: {
      my: {
        bg: '#0369a1',
        text: '#f8fafc',
      },
      their: {
        bg: 'rgba(30, 41, 59, 0.7)',
        text: '#f8fafc',
      },
      ghost: {
        bg: 'rgba(251, 191, 36, 0.1)',
        border: '#fbbf24',
      }
    }
  },
  glass: {
    blur: 10,
    intensity: 0.1,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 30,
    round: 999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    }
  }
};
