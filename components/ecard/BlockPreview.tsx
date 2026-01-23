/**
 * BlockPreview.tsx
 * Preview components for each block type
 * Used in card preview and web rendering
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CardBlock, BlockType } from '../../config/eCardBlocks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlockPreviewProps {
  block: CardBlock;
  colorScheme?: { primary: string; secondary: string };
  isPreview?: boolean; // If true, links won't be clickable
}

// Profile Block
export const ProfileBlockPreview: React.FC<BlockPreviewProps> = ({ block, colorScheme }) => {
  const { fullName, title, company, location, profilePhotoUri } = block.data;
  
  return (
    <View style={styles.profileBlock}>
      {/* Photo */}
      <View style={styles.profilePhotoContainer}>
        {profilePhotoUri ? (
          <Image source={{ uri: profilePhotoUri }} style={styles.profilePhoto} />
        ) : (
          <View style={[styles.profilePhotoPlaceholder, { backgroundColor: colorScheme?.primary || '#333' }]}>
            <Text style={styles.profileInitials}>
              {fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Info */}
      <Text style={styles.profileName}>{fullName || 'Your Name'}</Text>
      {title && <Text style={styles.profileTitle}>{title}</Text>}
      {company && <Text style={styles.profileCompany}>{company}</Text>}
      {location && (
        <View style={styles.profileLocation}>
          <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.profileLocationText}>{location}</Text>
        </View>
      )}
    </View>
  );
};

// Contact Block
export const ContactBlockPreview: React.FC<BlockPreviewProps> = ({ block, isPreview }) => {
  const { phone, email, website } = block.data;
  
  const handlePress = (type: string, value: string) => {
    if (isPreview) return;
    
    switch (type) {
      case 'call':
        Linking.openURL(`tel:${value}`);
        break;
      case 'text':
        Linking.openURL(`sms:${value}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'website':
        const url = value.startsWith('http') ? value : `https://${value}`;
        Linking.openURL(url);
        break;
    }
  };
  
  const buttons = [
    { type: 'call', icon: 'call-outline', label: 'Call', value: phone },
    { type: 'text', icon: 'chatbubble-outline', label: 'Text', value: phone },
    { type: 'email', icon: 'mail-outline', label: 'Email', value: email },
    { type: 'website', icon: 'globe-outline', label: 'Website', value: website },
  ].filter(b => b.value);
  
  if (buttons.length === 0) return null;
  
  return (
    <View style={styles.contactBlock}>
      {buttons.map((btn, index) => (
        <TouchableOpacity
          key={btn.type}
          style={styles.contactButton}
          onPress={() => handlePress(btn.type, btn.value)}
          activeOpacity={isPreview ? 1 : 0.7}
        >
          <View style={styles.contactButtonIcon}>
            <Ionicons name={btn.icon as any} size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.contactButtonText}>{btn.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Social Block
export const SocialBlockPreview: React.FC<BlockPreviewProps> = ({ block, isPreview }) => {
  const socialIcons: { [key: string]: { icon: string; color: string; urlPrefix: string } } = {
    instagram: { icon: 'logo-instagram', color: '#E4405F', urlPrefix: 'https://instagram.com/' },
    tiktok: { icon: 'logo-tiktok', color: '#000000', urlPrefix: 'https://tiktok.com/@' },
    twitter: { icon: 'logo-twitter', color: '#1DA1F2', urlPrefix: 'https://twitter.com/' },
    linkedin: { icon: 'logo-linkedin', color: '#0A66C2', urlPrefix: '' },
    facebook: { icon: 'logo-facebook', color: '#1877F2', urlPrefix: 'https://facebook.com/' },
    youtube: { icon: 'logo-youtube', color: '#FF0000', urlPrefix: '' },
    snapchat: { icon: 'logo-snapchat', color: '#FFFC00', urlPrefix: 'https://snapchat.com/add/' },
    pinterest: { icon: 'logo-pinterest', color: '#E60023', urlPrefix: 'https://pinterest.com/' },
    threads: { icon: 'at-outline', color: '#000000', urlPrefix: 'https://threads.net/@' },
  };
  
  const activeSocials = Object.entries(block.data)
    .filter(([key, value]) => value && socialIcons[key])
    .map(([key, value]) => ({ key, value: value as string, ...socialIcons[key] }));
  
  if (activeSocials.length === 0) return null;
  
  const handlePress = (social: typeof activeSocials[0]) => {
    if (isPreview) return;
    
    let url = social.value;
    if (!url.startsWith('http')) {
      url = social.urlPrefix + url.replace('@', '');
    }
    Linking.openURL(url);
  };
  
  return (
    <View style={styles.socialBlock}>
      {activeSocials.map(social => (
        <TouchableOpacity
          key={social.key}
          style={styles.socialButton}
          onPress={() => handlePress(social)}
          activeOpacity={isPreview ? 1 : 0.7}
        >
          <Ionicons name={social.icon as any} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Links Block
export const LinksBlockPreview: React.FC<BlockPreviewProps> = ({ block, isPreview }) => {
  const { links = [] } = block.data;
  
  if (links.length === 0) return null;
  
  const iconMap: { [key: string]: string } = {
    globe: 'globe-outline',
    cart: 'cart-outline',
    calendar: 'calendar-outline',
    document: 'document-outline',
    play: 'play-outline',
    music: 'musical-notes-outline',
    gift: 'gift-outline',
    link: 'link-outline',
  };
  
  const handlePress = (url: string) => {
    if (isPreview) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl);
  };
  
  return (
    <View style={styles.linksBlock}>
      {links.map((link: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.linkButton}
          onPress={() => handlePress(link.url)}
          activeOpacity={isPreview ? 1 : 0.7}
        >
          <View style={styles.linkButtonIcon}>
            <Ionicons name={(iconMap[link.icon] || 'link-outline') as any} size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.linkButtonText}>{link.title}</Text>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// About Block
export const AboutBlockPreview: React.FC<BlockPreviewProps> = ({ block }) => {
  const { title, content } = block.data;
  
  if (!content) return null;
  
  return (
    <View style={styles.aboutBlock}>
      {title && <Text style={styles.aboutTitle}>{title}</Text>}
      <Text style={styles.aboutContent}>{content}</Text>
    </View>
  );
};

// Products Block
export const ProductsBlockPreview: React.FC<BlockPreviewProps> = ({ block, isPreview }) => {
  const { title, products = [] } = block.data;
  
  if (products.length === 0) return null;
  
  const handlePress = (url: string) => {
    if (isPreview || !url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl);
  };
  
  return (
    <View style={styles.productsBlock}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.productsGrid}>
        {products.map((product: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.productCard}
            onPress={() => handlePress(product.url)}
            activeOpacity={isPreview || !product.url ? 1 : 0.7}
          >
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.3)" />
              </View>
            )}
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            {product.price && <Text style={styles.productPrice}>{product.price}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Gallery Block
export const GalleryBlockPreview: React.FC<BlockPreviewProps> = ({ block }) => {
  const { title, images = [], layout = 'grid' } = block.data;
  
  if (images.length === 0) return null;
  
  return (
    <View style={styles.galleryBlock}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.galleryGrid}>
        {images.slice(0, 6).map((image: string, index: number) => (
          <View key={index} style={styles.galleryImageContainer}>
            <Image source={{ uri: image }} style={styles.galleryImage} />
          </View>
        ))}
      </View>
    </View>
  );
};

// Video Block
export const VideoBlockPreview: React.FC<BlockPreviewProps> = ({ block, isPreview }) => {
  const { title, videoUrl, platform } = block.data;
  
  if (!videoUrl) return null;
  
  const handlePress = () => {
    if (isPreview) return;
    Linking.openURL(videoUrl);
  };
  
  // Extract video ID for thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };
  
  const thumbnail = platform === 'youtube' ? getYouTubeThumbnail(videoUrl) : null;
  
  return (
    <View style={styles.videoBlock}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handlePress}
        activeOpacity={isPreview ? 1 : 0.7}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.videoThumbnail} />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle-outline" size={48} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View style={styles.videoPlayButton}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Form Block
export const FormBlockPreview: React.FC<BlockPreviewProps> = ({ block, isPreview }) => {
  const { formType = 'native', title, description, buttonText = 'Submit', fields = [] } = block.data;
  
  // For external forms, show a button to open the form
  if (formType !== 'native') {
    const formTypeLabels: Record<string, string> = {
      gohighlevel: 'Go High Level',
      typeform: 'Typeform',
      jotform: 'JotForm',
      googleforms: 'Google Forms',
      calendly: 'Calendly',
      webhook: 'Custom Form',
    };
    
    return (
      <View style={styles.formBlock}>
        {title && <Text style={styles.formTitle}>{title}</Text>}
        {description && <Text style={styles.formDescription}>{description}</Text>}
        <TouchableOpacity style={styles.formExternalButton} activeOpacity={isPreview ? 1 : 0.7}>
          <Ionicons name="open-outline" size={20} color="#FFFFFF" />
          <Text style={styles.formButtonText}>
            Open {formTypeLabels[formType] || 'Form'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Native form preview
  return (
    <View style={styles.formBlock}>
      {title && <Text style={styles.formTitle}>{title}</Text>}
      {description && <Text style={styles.formDescription}>{description}</Text>}
      
      {/* Form fields preview */}
      {fields.map((field: any, index: number) => (
        <View key={field.id || index} style={styles.formFieldPreview}>
          <Text style={styles.formFieldLabel}>
            {field.label}
            {field.required && <Text style={styles.formRequired}> *</Text>}
          </Text>
          <View style={[
            styles.formFieldInput,
            field.type === 'textarea' && styles.formFieldTextarea,
          ]}>
            <Text style={styles.formFieldPlaceholder}>{field.placeholder}</Text>
          </View>
        </View>
      ))}
      
      {/* Submit button */}
      <TouchableOpacity style={styles.formSubmitButton} activeOpacity={isPreview ? 1 : 0.7}>
        <Ionicons name="send-outline" size={18} color="#FFFFFF" />
        <Text style={styles.formButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Testimonials Block
export const TestimonialsBlockPreview: React.FC<BlockPreviewProps> = ({ block }) => {
  const { title, testimonials = [] } = block.data;
  
  if (testimonials.length === 0) return null;
  
  return (
    <View style={styles.testimonialsBlock}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {testimonials.map((testimonial: any, index: number) => (
        <View key={index} style={styles.testimonialCard}>
          <Text style={styles.testimonialQuote}>"{testimonial.quote}"</Text>
          <View style={styles.testimonialAuthor}>
            {testimonial.avatar ? (
              <Image source={{ uri: testimonial.avatar }} style={styles.testimonialAvatar} />
            ) : (
              <View style={styles.testimonialAvatarPlaceholder}>
                <Ionicons name="person" size={16} color="rgba(255,255,255,0.5)" />
              </View>
            )}
            <View>
              <Text style={styles.testimonialName}>{testimonial.author}</Text>
              {testimonial.role && <Text style={styles.testimonialRole}>{testimonial.role}</Text>}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// Divider Block
export const DividerBlockPreview: React.FC<BlockPreviewProps> = ({ block }) => {
  const { style = 'line' } = block.data;
  
  if (style === 'dots') {
    return (
      <View style={styles.dividerDots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    );
  }
  
  if (style === 'gradient') {
    return (
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerGradient}
      />
    );
  }
  
  return <View style={styles.dividerLine} />;
};

// Spacer Block
export const SpacerBlockPreview: React.FC<BlockPreviewProps> = ({ block }) => {
  const { size = 'medium' } = block.data;
  const heights = { small: 16, medium: 32, large: 48 };
  
  return <View style={{ height: heights[size as keyof typeof heights] || 32 }} />;
};

// Main Block Preview Component
export const BlockPreview: React.FC<BlockPreviewProps> = (props) => {
  const { block } = props;
  
  switch (block.type) {
    case 'profile':
      return <ProfileBlockPreview {...props} />;
    case 'contact':
      return <ContactBlockPreview {...props} />;
    case 'social':
      return <SocialBlockPreview {...props} />;
    case 'links':
      return <LinksBlockPreview {...props} />;
    case 'about':
      return <AboutBlockPreview {...props} />;
    case 'products':
      return <ProductsBlockPreview {...props} />;
    case 'gallery':
      return <GalleryBlockPreview {...props} />;
    case 'video':
      return <VideoBlockPreview {...props} />;
    case 'testimonials':
      return <TestimonialsBlockPreview {...props} />;
    case 'form':
      return <FormBlockPreview {...props} />;
    case 'divider':
      return <DividerBlockPreview {...props} />;
    case 'spacer':
      return <SpacerBlockPreview {...props} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  // Profile Block
  profileBlock: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profilePhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  profileTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  profileCompany: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    textAlign: 'center',
  },
  profileLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  profileLocationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  
  // Contact Block
  contactBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  contactButton: {
    alignItems: 'center',
    gap: 6,
  },
  contactButtonIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Social Block
  socialBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Links Block
  linksBlock: {
    paddingVertical: 8,
    gap: 10,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    gap: 12,
  },
  linkButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // About Block
  aboutBlock: {
    paddingVertical: 16,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  aboutContent: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Products Block
  productsBlock: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (SCREEN_WIDTH - 80) / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
  },
  productImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 10,
    paddingBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ADE80',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  
  // Gallery Block
  galleryBlock: {
    paddingVertical: 16,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  galleryImageContainer: {
    width: (SCREEN_WIDTH - 56) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  
  // Video Block
  videoBlock: {
    paddingVertical: 16,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Testimonials Block
  testimonialsBlock: {
    paddingVertical: 16,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  testimonialQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 12,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testimonialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  testimonialAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testimonialRole: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  
  // Form Block
  formBlock: {
    paddingVertical: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  formFieldPreview: {
    marginBottom: 12,
  },
  formFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  formRequired: {
    color: '#ef4444',
  },
  formFieldInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  formFieldTextarea: {
    minHeight: 80,
  },
  formFieldPlaceholder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  formSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  formExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  formButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Divider
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
  },
  dividerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerGradient: {
    height: 2,
    marginVertical: 16,
  },
});

export default BlockPreview;
