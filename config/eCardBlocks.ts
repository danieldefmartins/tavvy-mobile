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
  | 'youtube'
  | 'about'
  | 'testimonials'
  | 'form'
  | 'credentials'
  | 'tavvy_reviews'
  | 'save_to_wallet'
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
      { key: 'content', label: 'Bio', type: 'textarea', placeholder: 'Tell your story...', maxLength: 300 },
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
  {
    id: 'youtube',
    name: 'YouTube Video',
    description: 'Embed a YouTube video with thumbnail',
    icon: 'logo-youtube',
    isPremium: true,
    isRequired: false,
    maxInstances: 5,
    defaultData: {
      title: '',
      videoId: '',
      showTitle: true,
    },
    fields: [
      { key: 'title', label: 'Video Title', type: 'text', placeholder: 'My Latest Video', maxLength: 100 },
      { key: 'videoId', label: 'YouTube Video ID or URL', type: 'text', placeholder: 'dQw4w9WgXcQ or full URL', required: true },
      { key: 'showTitle', label: 'Show Title', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]},
    ],
  },
  {
    id: 'form',
    name: 'Contact Form',
    description: 'Lead capture with GHL, Typeform, Calendly & more',
    icon: 'mail-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      formType: 'native', // 'native', 'gohighlevel', 'typeform', 'jotform', 'googleforms', 'calendly', 'webhook'
      title: 'Get in Touch',
      description: '',
      buttonText: 'Send Message',
      fields: [
        { id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
        { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
        { id: '3', type: 'phone', label: 'Phone', placeholder: '(555) 123-4567', required: false },
        { id: '4', type: 'textarea', label: 'Message', placeholder: 'How can I help you?', required: false },
      ],
      successMessage: "Thanks! I'll get back to you soon.",
      // Go High Level
      ghlFormId: '',
      ghlLocationId: '',
      ghlWebhookUrl: '',
      ghlEmbedCode: '',
      // External embeds
      embedUrl: '',
      embedCode: '',
      // Webhook
      webhookUrl: '',
      webhookMethod: 'POST',
    },
    fields: [
      { key: 'formType', label: 'Form Type', type: 'select', options: [
        { value: 'native', label: 'Tavvy Form' },
        { value: 'gohighlevel', label: 'Go High Level' },
        { value: 'typeform', label: 'Typeform' },
        { value: 'jotform', label: 'JotForm' },
        { value: 'googleforms', label: 'Google Forms' },
        { value: 'calendly', label: 'Calendly' },
        { value: 'webhook', label: 'Custom Webhook' },
      ]},
      { key: 'title', label: 'Form Title', type: 'text', placeholder: 'Get in Touch', maxLength: 50 },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Fill out the form and I\'ll get back to you.', maxLength: 200 },
      { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Send Message', maxLength: 30 },
      { key: 'successMessage', label: 'Success Message', type: 'textarea', placeholder: 'Thanks for reaching out!', maxLength: 200 },
    ],
  },
  {
    id: 'credentials',
    name: 'Credentials',
    description: 'Licenses, certifications & service area',
    icon: 'ribbon-outline',
    isPremium: true,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      title: 'Credentials',
      yearsInBusiness: '',
      licenses: [],
      certifications: [],
      serviceArea: '',
      hasInsurance: false,
      insuranceDetails: '',
      bookingUrl: '',
    },
    fields: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Credentials', maxLength: 30 },
      { key: 'yearsInBusiness', label: 'Years in Business', type: 'text', placeholder: '10+ years', maxLength: 20 },
      { key: 'serviceArea', label: 'Service Area', type: 'text', placeholder: 'Miami-Dade, Broward County', maxLength: 100 },
      { key: 'bookingUrl', label: 'Book/Schedule URL', type: 'url', placeholder: 'https://calendly.com/...' },
      {
        key: 'licenses',
        label: 'Licenses',
        type: 'array',
        arrayItemFields: [
          { key: 'name', label: 'License Name', type: 'text', placeholder: 'General Contractor License', required: true, maxLength: 50 },
          { key: 'number', label: 'License Number', type: 'text', placeholder: 'CGC123456', maxLength: 30 },
          { key: 'state', label: 'State', type: 'text', placeholder: 'FL', maxLength: 20 },
        ],
      },
      {
        key: 'certifications',
        label: 'Certifications',
        type: 'array',
        arrayItemFields: [
          { key: 'name', label: 'Certification', type: 'text', placeholder: 'OSHA Certified', required: true, maxLength: 50 },
          { key: 'year', label: 'Year', type: 'text', placeholder: '2024', maxLength: 10 },
        ],
      },
    ],
  },

  // ============ TAVVY-EXCLUSIVE BLOCKS (FREE - Moat Builders) ============
  {
    id: 'tavvy_reviews',
    name: 'Tavvy Reviews',
    description: 'Show your Tavvy reviews with crown badge',
    icon: 'star-outline',
    isPremium: false,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      showCrown: true,
      showReviewCount: true,
      showLatestReviews: true,
      maxReviews: 3,
    },
    fields: [
      { key: 'showCrown', label: 'Show Crown Badge', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]},
      { key: 'maxReviews', label: 'Reviews to Show', type: 'select', options: [
        { value: '1', label: '1 Review' },
        { value: '3', label: '3 Reviews' },
        { value: '5', label: '5 Reviews' },
      ]},
    ],
  },
  {
    id: 'save_to_wallet',
    name: 'Save to Wallet',
    description: 'Let visitors save you to their Tavvy Wallet',
    icon: 'wallet-outline',
    isPremium: false,
    isRequired: false,
    maxInstances: 1,
    defaultData: {
      buttonText: 'Save to Wallet',
      showRequestReview: true,
      category: 'general',
    },
    fields: [
      { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Save to Wallet', maxLength: 30 },
      { key: 'showRequestReview', label: 'Show "Leave a Review" Button', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]},
      { key: 'category', label: 'Category', type: 'select', options: [
        { value: 'general', label: 'General' },
        { value: 'contractor', label: 'Contractor' },
        { value: 'realtor', label: 'Realtor' },
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'service', label: 'Service Provider' },
        { value: 'creator', label: 'Creator' },
        { value: 'business', label: 'Business' },
      ]},
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
