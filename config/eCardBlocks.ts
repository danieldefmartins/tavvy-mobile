/**
 * Tavvy eCard Block System Configuration
 * 
 * Block-based card builder with freemium model:
 * - Free: Profile, Contact, Social blocks
 * - Premium ($4.99/mo): Links, Products, Gallery, Video, About, Testimonials
 * 
 * Flow:
 * 1. User selects template
 * 2. User adds blocks to build their card
 * 3. When adding 2+ premium blocks, show price info
 * 4. On save with premium blocks, require subscription
 */

export type BlockType = 
  | 'profile'
  | 'contact'
  | 'social'
  | 'links'
  | 'products'
  | 'gallery'
  | 'video'
  | 'about'
  | 'testimonials'
  | 'divider'
  | 'spacer';

export interface BlockConfig {
  id: BlockType;
  name: string;
  description: string;
  icon: string; // Ionicons name
  isPremium: boolean;
  isRequired: boolean; // Profile block is always required
  maxInstances: number; // How many of this block can be added (1 = only one)
  defaultData: any;
  fields: BlockField[];
}

export interface BlockField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'phone' | 'email' | 'image' | 'images' | 'array' | 'select';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  options?: { value: string; label: string }[];
  arrayItemFields?: BlockField[]; // For array type fields
}

export interface CardBlock {
  id: string; // Unique instance ID (uuid)
  type: BlockType;
  sortOrder: number;
  isVisible: boolean;
  data: any;
}

// Block Configurations
export const BLOCK_CONFIGS: BlockConfig[] = [
  // ============ FREE BLOCKS ============
  {
    id: 'profile',
    name: 'Profile',
    description: 'Your name, photo, title & company',
    icon: 'person-circle-outline',
    isPremium: false,
    isRequired: true,
    maxInstances: 1,
    defaultData: {
      fullName: '',
      title: '',
      company: '',
      location: '',
      profilePhotoUri: null,
    },
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true, maxLength: 50 },
      { key: 'title', label: 'Job Title', type: 'text', placeholder: 'CEO & Founder', maxLength: 50 },
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Acme Inc.', maxLength: 50 },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Miami, FL', maxLength: 50 },
      { key: 'profilePhotoUri', label: 'Profile Photo', type: 'image' },
    ],
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Call, text, email & website buttons',
    icon: 'call-outline',
    isPremium: false,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      phone: '',
      email: '',
      website: '',
      showCall: true,
      showText: true,
      showEmail: true,
      showWebsite: true,
    },
    fields: [
      { key: 'phone', label: 'Phone Number', type: 'phone', placeholder: '+1 (555) 123-4567' },
      { key: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
    ],
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Instagram, TikTok, LinkedIn & more',
    icon: 'share-social-outline',
    isPremium: false,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      instagram: '',
      tiktok: '',
      twitter: '',
      linkedin: '',
      facebook: '',
      youtube: '',
      snapchat: '',
      pinterest: '',
      threads: '',
    },
    fields: [
      { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@username' },
      { key: 'tiktok', label: 'TikTok', type: 'text', placeholder: '@username' },
      { key: 'twitter', label: 'X (Twitter)', type: 'text', placeholder: '@username' },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'linkedin.com/in/username' },
      { key: 'facebook', label: 'Facebook', type: 'text', placeholder: 'username or page' },
      { key: 'youtube', label: 'YouTube', type: 'url', placeholder: 'youtube.com/@channel' },
      { key: 'snapchat', label: 'Snapchat', type: 'text', placeholder: '@username' },
      { key: 'pinterest', label: 'Pinterest', type: 'text', placeholder: '@username' },
      { key: 'threads', label: 'Threads', type: 'text', placeholder: '@username' },
    ],
  },
  {
    id: 'divider',
    name: 'Divider',
    description: 'Visual separator between sections',
    icon: 'remove-outline',
    isPremium: false,
    isRequired: false,
    maxInstances: 10,
    defaultData: {
      style: 'line', // 'line', 'dots', 'gradient'
    },
    fields: [
      { 
        key: 'style', 
        label: 'Style', 
        type: 'select', 
        options: [
          { value: 'line', label: 'Simple Line' },
          { value: 'dots', label: 'Dots' },
          { value: 'gradient', label: 'Gradient Fade' },
        ]
      },
    ],
  },
  {
    id: 'spacer',
    name: 'Spacer',
    description: 'Add extra space between blocks',
    icon: 'resize-outline',
    isPremium: false,
    isRequired: false,
    maxInstances: 10,
    defaultData: {
      size: 'medium', // 'small', 'medium', 'large'
    },
    fields: [
      { 
        key: 'size', 
        label: 'Size', 
        type: 'select', 
        options: [
          { value: 'small', label: 'Small (16px)' },
          { value: 'medium', label: 'Medium (32px)' },
          { value: 'large', label: 'Large (48px)' },
        ]
      },
    ],
  },

  // ============ PREMIUM BLOCKS ($4.99/mo) ============
  {
    id: 'links',
    name: 'Links',
    description: 'Custom buttons linking anywhere',
    icon: 'link-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      links: [],
    },
    fields: [
      {
        key: 'links',
        label: 'Links',
        type: 'array',
        arrayItemFields: [
          { key: 'title', label: 'Button Text', type: 'text', placeholder: 'My Website', required: true, maxLength: 40 },
          { key: 'url', label: 'URL', type: 'url', placeholder: 'https://...', required: true },
          { key: 'icon', label: 'Icon', type: 'select', options: [
            { value: 'globe', label: '🌐 Website' },
            { value: 'cart', label: '🛒 Shop' },
            { value: 'calendar', label: '📅 Booking' },
            { value: 'document', label: '📄 Portfolio' },
            { value: 'play', label: '▶️ Video' },
            { value: 'music', label: '🎵 Music' },
            { value: 'gift', label: '🎁 Merch' },
            { value: 'link', label: '🔗 Link' },
          ]},
        ],
      },
    ],
  },
  {
    id: 'about',
    name: 'About Me',
    description: 'Tell your story with a longer bio',
    icon: 'document-text-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      title: 'About Me',
      content: '',
    },
    fields: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'About Me', maxLength: 30 },
      { key: 'content', label: 'Bio', type: 'textarea', placeholder: 'Tell your story...', maxLength: 500 },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    description: 'Showcase items with images & prices',
    icon: 'pricetag-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      title: 'Products',
      products: [],
    },
    fields: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'My Products', maxLength: 30 },
      {
        key: 'products',
        label: 'Products',
        type: 'array',
        arrayItemFields: [
          { key: 'name', label: 'Product Name', type: 'text', placeholder: 'Product Name', required: true, maxLength: 50 },
          { key: 'price', label: 'Price', type: 'text', placeholder: '$99.00', maxLength: 20 },
          { key: 'description', label: 'Description', type: 'text', placeholder: 'Short description', maxLength: 100 },
          { key: 'image', label: 'Product Image', type: 'image' },
          { key: 'url', label: 'Buy Link', type: 'url', placeholder: 'https://...' },
        ],
      },
    ],
  },
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Photo grid to showcase your work',
    icon: 'images-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      title: 'Gallery',
      images: [],
      layout: 'grid', // 'grid', 'carousel', 'masonry'
    },
    fields: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'My Work', maxLength: 30 },
      { key: 'images', label: 'Images', type: 'images' },
      { 
        key: 'layout', 
        label: 'Layout', 
        type: 'select', 
        options: [
          { value: 'grid', label: 'Grid (2x2)' },
          { value: 'carousel', label: 'Carousel' },
          { value: 'masonry', label: 'Masonry' },
        ]
      },
    ],
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Embed YouTube or TikTok video',
    icon: 'videocam-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 3,
    defaultData: {
      title: '',
      videoUrl: '',
      platform: 'youtube', // 'youtube', 'tiktok', 'vimeo'
    },
    fields: [
      { key: 'title', label: 'Title (optional)', type: 'text', placeholder: 'My Latest Video', maxLength: 50 },
      { key: 'videoUrl', label: 'Video URL', type: 'url', placeholder: 'https://youtube.com/watch?v=...', required: true },
      { 
        key: 'platform', 
        label: 'Platform', 
        type: 'select', 
        options: [
          { value: 'youtube', label: 'YouTube' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'vimeo', label: 'Vimeo' },
        ]
      },
    ],
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Show off customer reviews',
    icon: 'chatbubble-ellipses-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      title: 'What People Say',
      testimonials: [],
    },
    fields: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Testimonials', maxLength: 30 },
      {
        key: 'testimonials',
        label: 'Testimonials',
        type: 'array',
        arrayItemFields: [
          { key: 'quote', label: 'Quote', type: 'textarea', placeholder: '"Amazing service!"', required: true, maxLength: 200 },
          { key: 'author', label: 'Author Name', type: 'text', placeholder: 'Jane Smith', required: true, maxLength: 50 },
          { key: 'role', label: 'Role/Company', type: 'text', placeholder: 'CEO at Company', maxLength: 50 },
          { key: 'avatar', label: 'Photo (optional)', type: 'image' },
        ],
      },
    ],
  },
];

// Helper functions
export const getBlockConfig = (type: BlockType): BlockConfig | undefined => {
  return BLOCK_CONFIGS.find(b => b.id === type);
};

export const getFreeBlocks = (): BlockConfig[] => {
  return BLOCK_CONFIGS.filter(b => !b.isPremium);
};

export const getPremiumBlocks = (): BlockConfig[] => {
  return BLOCK_CONFIGS.filter(b => b.isPremium);
};

export const getRequiredBlocks = (): BlockConfig[] => {
  return BLOCK_CONFIGS.filter(b => b.isRequired);
};

export const countPremiumBlocks = (blocks: CardBlock[]): number => {
  return blocks.filter(block => {
    const config = getBlockConfig(block.type);
    return config?.isPremium;
  }).length;
};

export const hasPremiumBlocks = (blocks: CardBlock[]): boolean => {
  return countPremiumBlocks(blocks) > 0;
};

// Create a new block instance with default data
export const createBlockInstance = (type: BlockType): CardBlock => {
  const config = getBlockConfig(type);
  return {
    id: generateUUID(),
    type,
    sortOrder: 0,
    isVisible: true,
    data: config?.defaultData ? { ...config.defaultData } : {},
  };
};

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Default blocks for a new card
export const getDefaultBlocks = (): CardBlock[] => {
  return [
    createBlockInstance('profile'),
    createBlockInstance('contact'),
    createBlockInstance('social'),
  ];
};

// Subscription pricing
export const PREMIUM_PRICE = 4.99;
export const PREMIUM_PRICE_ID = 'price_XXXXXX'; // Replace with actual Stripe price ID

export default BLOCK_CONFIGS;
