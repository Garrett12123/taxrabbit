export type ColorTheme = {
  id: string;
  name: string;
  description: string;
  /** Preview colors for the theme switcher [primary, secondary, accent, muted] */
  previewColors: {
    light: [string, string, string, string];
    dark: [string, string, string, string];
  };
};

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'default',
    name: 'Modern Minimalist',
    description: 'Clean grayscale with charcoal accents',
    previewColors: {
      light: ['#3d4654', '#eeeef0', '#e8e8ea', '#7a7f8a'],
      dark: ['#dcdcde', '#2a2c32', '#33353b', '#8e9099'],
    },
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Professional maritime with teal accents',
    previewColors: {
      light: ['#2d8b8b', '#dff0f0', '#c9e6e6', '#6a8e99'],
      dark: ['#5bc5c5', '#1f2f3d', '#263848', '#5a8a99'],
    },
  },
  {
    id: 'sunset-boulevard',
    name: 'Sunset Boulevard',
    description: 'Warm and vibrant sunset tones',
    previewColors: {
      light: ['#e76f51', '#fce8d5', '#f8d5c0', '#a08070'],
      dark: ['#f09070', '#2a2235', '#33293f', '#c08060'],
    },
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    description: 'Natural earth tones with green accents',
    previewColors: {
      light: ['#2d6a2b', '#e0ece0', '#c8dcc8', '#6a886a'],
      dark: ['#5aab58', '#1f2f1f', '#263426', '#508a50'],
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Rich autumnal warmth',
    previewColors: {
      light: ['#d4a020', '#f5ead0', '#ecd8a8', '#9a8860'],
      dark: ['#e8b830', '#2a2418', '#332c1e', '#c0a040'],
    },
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Cool and crisp winter blue',
    previewColors: {
      light: ['#4a6fa5', '#dde6f0', '#c8d6e8', '#7088a0'],
      dark: ['#7aa0d0', '#1a2230', '#222c3a', '#5580aa'],
    },
  },
  {
    id: 'desert-rose',
    name: 'Desert Rose',
    description: 'Soft sophisticated dusty tones',
    previewColors: {
      light: ['#a05070', '#f0dce0', '#e4c8d0', '#907080'],
      dark: ['#d08098', '#2a1e24', '#33252c', '#b06080'],
    },
  },
  {
    id: 'tech-innovation',
    name: 'Tech Innovation',
    description: 'Bold electric blue and modern dark',
    previewColors: {
      light: ['#0066ff', '#dde8ff', '#c4d8ff', '#6688cc'],
      dark: ['#4499ff', '#181c24', '#1e2430', '#3377dd'],
    },
  },
  {
    id: 'botanical-garden',
    name: 'Botanical Garden',
    description: 'Fresh organic greens with marigold',
    previewColors: {
      light: ['#4a7c59', '#dce8d0', '#c4dcb8', '#6a9878'],
      dark: ['#68b078', '#1e2a1e', '#243024', '#509060'],
    },
  },
  {
    id: 'midnight-galaxy',
    name: 'Midnight Galaxy',
    description: 'Dramatic cosmic purple tones',
    previewColors: {
      light: ['#6a4a9a', '#e4daf0', '#d0c2e4', '#7a6a90'],
      dark: ['#a080d0', '#1c1430', '#241c38', '#8060b0'],
    },
  },
];

export const STORAGE_KEY = 'taxrabbit-color-theme';

export function getStoredColorTheme(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(STORAGE_KEY) || 'default';
}

export function setStoredColorTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, themeId);
}

export function applyColorTheme(themeId: string): void {
  const html = document.documentElement;
  if (themeId === 'default') {
    html.removeAttribute('data-color-theme');
  } else {
    html.setAttribute('data-color-theme', themeId);
  }
}
