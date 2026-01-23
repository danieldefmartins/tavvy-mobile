// Tavvy eCard Templates Configuration
// Each template can have multiple color schemes
// Multi-page feature requires $4.99/month subscription

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;      // Main gradient start
  secondary: string;    // Main gradient end
  accent: string;       // Buttons, highlights
  text: string;         // Primary text color
  textSecondary: string; // Secondary text color
  background: string;   // Card background
  cardBg: string;       // Inner card background (for minimal templates)
  border?: string;      // Border color (for luxury templates)
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'luxury' | 'fun';
  previewImage: string; // Local asset or URL
  isPremium: boolean;   // If true, requires any paid subscription
  features: string[];   // List of features this template supports
  colorSchemes: ColorScheme[];
  layout: {
    photoPosition: 'top' | 'left' | 'right' | 'center';
    photoSize: 'small' | 'medium' | 'large';
    photoStyle: 'circle' | 'rounded' | 'square' | 'ornate';
    buttonStyle: 'rounded' | 'pill' | 'square' | 'outline' | 'frosted';
    fontFamily: 'modern' | 'classic' | 'elegant' | 'playful';
    showBorder: boolean;
    borderStyle?: 'solid' | 'ornate' | 'gradient';
  };
}

export const TEMPLATES: Template[] = [
  // ============ FREE TEMPLATES ============
  {
    id: 'classic-blue',
    name: 'Classic',
    description: 'Clean professional look with gradient background',
    category: 'professional',
    previewImage: 'classic-blue',
    isPremium: false,
    features: ['gradient-bg', 'action-buttons', 'social-icons'],
    colorSchemes: [
      {
        id: 'blue',
        name: 'Ocean Blue',
        primary: '#1E90FF',
        secondary: '#00BFFF',
        accent: 'rgba(255,255,255,0.2)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.8)',
        background: 'linear-gradient(180deg, #1E90FF 0%, #00BFFF 100%)',
        cardBg: 'transparent',
      },
      {
        id: 'navy',
        name: 'Navy',
        primary: '#1a2a4a',
        secondary: '#2d4a6f',
        accent: 'rgba(255,255,255,0.15)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.7)',
        background: 'linear-gradient(180deg, #1a2a4a 0%, #2d4a6f 100%)',
        cardBg: 'transparent',
      },
      {
        id: 'emerald',
        name: 'Emerald',
        primary: '#065f46',
        secondary: '#10b981',
        accent: 'rgba(255,255,255,0.2)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.8)',
        background: 'linear-gradient(180deg, #065f46 0%, #10b981 100%)',
        cardBg: 'transparent',
      },
      {
        id: 'purple',
        name: 'Royal Purple',
        primary: '#581c87',
        secondary: '#9333ea',
        accent: 'rgba(255,255,255,0.2)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.8)',
        background: 'linear-gradient(180deg, #581c87 0%, #9333ea 100%)',
        cardBg: 'transparent',
      },
      {
        id: 'sunset',
        name: 'Sunset',
        primary: '#f97316',
        secondary: '#ec4899',
        accent: 'rgba(255,255,255,0.2)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.8)',
        background: 'linear-gradient(180deg, #f97316 0%, #ec4899 100%)',
        cardBg: 'transparent',
      },
    ],
    layout: {
      photoPosition: 'center',
      photoSize: 'large',
      photoStyle: 'circle',
      buttonStyle: 'frosted',
      fontFamily: 'modern',
      showBorder: false,
    },
  },
  {
    id: 'minimal-white',
    name: 'Minimal',
    description: 'Clean white card with subtle accents',
    category: 'minimal',
    previewImage: 'minimal-white',
    isPremium: false,
    features: ['white-card', 'list-layout', 'subtle-icons'],
    colorSchemes: [
      {
        id: 'teal',
        name: 'Teal',
        primary: '#14b8a6',
        secondary: '#0d9488',
        accent: '#14b8a6',
        text: '#1f2937',
        textSecondary: '#6b7280',
        background: '#0f172a',
        cardBg: '#FFFFFF',
      },
      {
        id: 'purple',
        name: 'Purple',
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#8b5cf6',
        text: '#1f2937',
        textSecondary: '#6b7280',
        background: '#1e1b4b',
        cardBg: '#FFFFFF',
      },
      {
        id: 'rose',
        name: 'Rose',
        primary: '#f43f5e',
        secondary: '#e11d48',
        accent: '#f43f5e',
        text: '#1f2937',
        textSecondary: '#6b7280',
        background: '#1c1917',
        cardBg: '#FFFFFF',
      },
      {
        id: 'slate',
        name: 'Slate',
        primary: '#475569',
        secondary: '#334155',
        accent: '#475569',
        text: '#1f2937',
        textSecondary: '#6b7280',
        background: '#0f172a',
        cardBg: '#FFFFFF',
      },
    ],
    layout: {
      photoPosition: 'top',
      photoSize: 'medium',
      photoStyle: 'circle',
      buttonStyle: 'pill',
      fontFamily: 'modern',
      showBorder: false,
    },
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Bold and vibrant for content creators',
    category: 'creative',
    previewImage: 'creator',
    isPremium: false,
    features: ['gradient-bg', 'bold-buttons', 'social-focus'],
    colorSchemes: [
      {
        id: 'pink-purple',
        name: 'Pink Purple',
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: 'rgba(255,255,255,0.25)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.85)',
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        cardBg: 'transparent',
      },
      {
        id: 'orange-red',
        name: 'Fire',
        primary: '#f97316',
        secondary: '#ef4444',
        accent: 'rgba(255,255,255,0.25)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.85)',
        background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
        cardBg: 'transparent',
      },
      {
        id: 'cyan-blue',
        name: 'Electric',
        primary: '#06b6d4',
        secondary: '#3b82f6',
        accent: 'rgba(255,255,255,0.25)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.85)',
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        cardBg: 'transparent',
      },
    ],
    layout: {
      photoPosition: 'center',
      photoSize: 'large',
      photoStyle: 'circle',
      buttonStyle: 'pill',
      fontFamily: 'modern',
      showBorder: false,
    },
  },

  // ============ PREMIUM TEMPLATES ($4.99/mo) ============
  {
    id: 'luxury-gold',
    name: 'Luxury',
    description: 'Elegant black and gold with ornate details',
    category: 'luxury',
    previewImage: 'luxury-gold',
    isPremium: true,
    features: ['ornate-border', 'gold-accents', 'premium-fonts'],
    colorSchemes: [
      {
        id: 'black-gold',
        name: 'Black & Gold',
        primary: '#0a0a0a',
        secondary: '#1a1a1a',
        accent: '#d4af37',
        text: '#d4af37',
        textSecondary: 'rgba(212,175,55,0.8)',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
        cardBg: '#0a0a0a',
        border: '#d4af37',
      },
      {
        id: 'navy-gold',
        name: 'Navy & Gold',
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#d4af37',
        text: '#d4af37',
        textSecondary: 'rgba(212,175,55,0.8)',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        cardBg: '#0f172a',
        border: '#d4af37',
      },
      {
        id: 'black-silver',
        name: 'Black & Silver',
        primary: '#0a0a0a',
        secondary: '#1a1a1a',
        accent: '#c0c0c0',
        text: '#c0c0c0',
        textSecondary: 'rgba(192,192,192,0.8)',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
        cardBg: '#0a0a0a',
        border: '#c0c0c0',
      },
      {
        id: 'burgundy-gold',
        name: 'Burgundy & Gold',
        primary: '#450a0a',
        secondary: '#7f1d1d',
        accent: '#d4af37',
        text: '#d4af37',
        textSecondary: 'rgba(212,175,55,0.8)',
        background: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 100%)',
        cardBg: '#450a0a',
        border: '#d4af37',
      },
    ],
    layout: {
      photoPosition: 'center',
      photoSize: 'medium',
      photoStyle: 'ornate',
      buttonStyle: 'outline',
      fontFamily: 'elegant',
      showBorder: true,
      borderStyle: 'ornate',
    },
  },
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Sleek dark theme with gold accents',
    category: 'professional',
    previewImage: 'dark-pro',
    isPremium: true,
    features: ['dark-theme', 'gold-accents', 'modern-layout'],
    colorSchemes: [
      {
        id: 'dark-gold',
        name: 'Dark Gold',
        primary: '#18181b',
        secondary: '#27272a',
        accent: '#d4af37',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.7)',
        background: '#09090b',
        cardBg: '#18181b',
        border: '#d4af37',
      },
      {
        id: 'dark-teal',
        name: 'Dark Teal',
        primary: '#18181b',
        secondary: '#27272a',
        accent: '#14b8a6',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.7)',
        background: '#09090b',
        cardBg: '#18181b',
        border: '#14b8a6',
      },
      {
        id: 'dark-blue',
        name: 'Dark Blue',
        primary: '#18181b',
        secondary: '#27272a',
        accent: '#3b82f6',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.7)',
        background: '#09090b',
        cardBg: '#18181b',
        border: '#3b82f6',
      },
    ],
    layout: {
      photoPosition: 'center',
      photoSize: 'medium',
      photoStyle: 'circle',
      buttonStyle: 'rounded',
      fontFamily: 'modern',
      showBorder: true,
      borderStyle: 'solid',
    },
  },
  {
    id: 'fun-colorful',
    name: 'Fun',
    description: 'Playful and colorful for casual use',
    category: 'fun',
    previewImage: 'fun-colorful',
    isPremium: true,
    features: ['colorful', 'playful-icons', 'rounded-elements'],
    colorSchemes: [
      {
        id: 'pastel',
        name: 'Pastel',
        primary: '#a5f3fc',
        secondary: '#fbcfe8',
        accent: '#fde047',
        text: '#1f2937',
        textSecondary: '#4b5563',
        background: 'linear-gradient(180deg, #a5f3fc 0%, #fbcfe8 100%)',
        cardBg: 'rgba(255,255,255,0.9)',
      },
      {
        id: 'neon',
        name: 'Neon',
        primary: '#22d3ee',
        secondary: '#f472b6',
        accent: '#a3e635',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.9)',
        background: 'linear-gradient(135deg, #22d3ee 0%, #f472b6 100%)',
        cardBg: 'rgba(0,0,0,0.3)',
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        primary: '#f87171',
        secondary: '#818cf8',
        accent: '#34d399',
        text: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.9)',
        background: 'linear-gradient(135deg, #f87171 0%, #fbbf24 25%, #34d399 50%, #22d3ee 75%, #818cf8 100%)',
        cardBg: 'rgba(255,255,255,0.15)',
      },
    ],
    layout: {
      photoPosition: 'center',
      photoSize: 'large',
      photoStyle: 'circle',
      buttonStyle: 'pill',
      fontFamily: 'playful',
      showBorder: false,
    },
  },
];

// Multi-page subscription price ID (to be set from Stripe)
export const MULTI_PAGE_PRICE_ID = 'price_XXXXXX'; // Replace with actual Stripe price ID

// Helper functions
export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find(t => t.id === id);
};

export const getFreeTemplates = (): Template[] => {
  return TEMPLATES.filter(t => !t.isPremium);
};

export const getPremiumTemplates = (): Template[] => {
  return TEMPLATES.filter(t => t.isPremium);
};

export const getTemplatesByCategory = (category: Template['category']): Template[] => {
  return TEMPLATES.filter(t => t.category === category);
};

export const getColorSchemeById = (templateId: string, colorSchemeId: string): ColorScheme | undefined => {
  const template = getTemplateById(templateId);
  return template?.colorSchemes.find(cs => cs.id === colorSchemeId);
};

export default TEMPLATES;
