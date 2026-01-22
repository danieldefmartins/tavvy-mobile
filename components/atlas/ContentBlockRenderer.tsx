// ============================================================================
// CONTENT BLOCK RENDERER - Atlas v2.0
// ============================================================================
// Renders block-based content for Atlas articles
// Supports: heading, paragraph, image, bullet_list, numbered_list,
// place_card, itinerary, callout, checklist, quote, divider
// Now supports reading settings: textColor, fontSize, lineHeight
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabaseClient';
import { getCoverImageUrl } from '../../lib/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';
const TEAL_BG = '#F0FDFA';
const AMBER_WARNING = '#F59E0B';
const AMBER_BG = '#FFFBEB';
const BLUE_INFO = '#3B82F6';
const BLUE_BG = '#EFF6FF';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentBlock {
  type: string;
  [key: string]: any;
}

export interface HeadingBlock extends ContentBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock extends ContentBlock {
  type: 'paragraph';
  text: string;
}

export interface ImageBlock extends ContentBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
}

export interface BulletListBlock extends ContentBlock {
  type: 'bullet_list';
  items: string[];
}

export interface NumberedListBlock extends ContentBlock {
  type: 'numbered_list';
  items: string[];
}

export interface PlaceCardBlock extends ContentBlock {
  type: 'place_card';
  place_id: string;
}

export interface ItineraryBlock extends ContentBlock {
  type: 'itinerary';
  title?: string;
  days: ItineraryDay[];
}

export interface ItineraryDay {
  day_number: number;
  title: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  time?: string;
  title: string;
  description?: string;
  place_id?: string;
}

// Single itinerary day block (from CSV format)
export interface ItineraryDayBlock extends ContentBlock {
  type: 'itinerary_day';
  title: string;
  items: ItineraryDayItem[];
}

export interface ItineraryDayItem {
  time: string;
  activity: string;
}

export interface CalloutBlock extends ContentBlock {
  type: 'callout';
  style: 'tip' | 'warning' | 'tavvy_note' | 'info';
  title?: string;
  text: string;
}

export interface ChecklistBlock extends ContentBlock {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
}

export interface QuoteBlock extends ContentBlock {
  type: 'quote';
  text: string;
  author?: string;
}

export interface DividerBlock extends ContentBlock {
  type: 'divider';
}

// Place data type
interface PlaceData {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  photos?: any; // jsonb
  street?: string;
  city?: string;
  region?: string;
  cover_image_url?: string;
}

// Reading settings props for text styling
interface ReadingSettings {
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Star Rating Component
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.starContainer}>
      {[...Array(fullStars)].map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={size} color="#F59E0B" />
      ))}
      {hasHalfStar && <Ionicons name="star-half" size={size} color="#F59E0B" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color="#F59E0B" />
      ))}
    </View>
  );
};

// ============================================================================
// BLOCK COMPONENTS
// ============================================================================

// Heading Block - Now accepts reading settings
const HeadingBlockComponent: React.FC<{ block: HeadingBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 26 } = settings;
  
  // Calculate heading sizes based on body font size
  const headingSizes = {
    1: { fontSize: fontSize + 12, lineHeight: lineHeight + 10 },
    2: { fontSize: fontSize + 6, lineHeight: lineHeight + 4 },
    3: { fontSize: fontSize + 2, lineHeight: lineHeight },
  };

  // Support both 'text' and 'content' field names for compatibility
  const textContent = block.text || (block as any).content || '';

  return (
    <Text style={[
      styles.headingBase,
      { 
        fontSize: headingSizes[block.level].fontSize,
        lineHeight: headingSizes[block.level].lineHeight,
        color: textColor || '#111827',
      }
    ]}>
      {textContent}
    </Text>
  );
};

// Paragraph Block - Now accepts reading settings
const ParagraphBlockComponent: React.FC<{ block: ParagraphBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 26 } = settings;
  
  // Simple markdown-like parsing for bold and italic
  const renderText = (text: string) => {
    // Handle undefined/null text
    if (!text) return null;
    
    // Replace **bold** with bold text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={[styles.boldText, { color: textColor }]}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  // Support both 'text' and 'content' field names for compatibility
  const textContent = block.text || (block as any).content || '';

  return (
    <Text style={[
      styles.paragraph,
      { 
        color: textColor || '#374151',
        fontSize: fontSize,
        lineHeight: lineHeight,
      }
    ]}>
      {renderText(textContent)}
    </Text>
  );
};

// Image Block
const ImageBlockComponent: React.FC<{ block: ImageBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor } = settings;
  // Use optimized image URL for faster loading
  const optimizedUrl = getCoverImageUrl(block.url);
  
  return (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: optimizedUrl }}
        style={styles.blockImage}
        resizeMode="cover"
      />
      {block.caption && (
        <Text style={[styles.imageCaption, textColor && { color: textColor, opacity: 0.7 }]}>
          {block.caption}
        </Text>
      )}
    </View>
  );
};

// Bullet List Block - Now accepts reading settings
const BulletListBlockComponent: React.FC<{ block: BulletListBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 24 } = settings;
  
  return (
    <View style={styles.listContainer}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <View style={styles.bulletPoint} />
          <Text style={[
            styles.listItemText,
            { 
              color: textColor || '#374151',
              fontSize: fontSize,
              lineHeight: lineHeight,
            }
          ]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Numbered List Block - Now accepts reading settings
const NumberedListBlockComponent: React.FC<{ block: NumberedListBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 24 } = settings;
  
  return (
    <View style={styles.listContainer}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={[styles.listNumber, { fontSize: fontSize }]}>{index + 1}.</Text>
          <Text style={[
            styles.listItemText,
            { 
              color: textColor || '#374151',
              fontSize: fontSize,
              lineHeight: lineHeight,
            }
          ]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Place Card Block - Critical component
const PlaceCardBlockComponent: React.FC<{ block: PlaceCardBlock }> = ({ block }) => {
  const navigation = useNavigation();
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaceData();
  }, [block.place_id]);

  const fetchPlaceData = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, photos, street, city, region, cover_image_url')
        .eq('id', block.place_id)
        .single();

      if (error) throw error;
      setPlace(data);
    } catch (error) {
      console.error('Error fetching place:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnTavvy = () => {
    if (place) {
      navigation.navigate('PlaceDetails', { placeId: place.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.placeCardLoading}>
        <Text style={styles.placeCardLoadingText}>Loading place...</Text>
      </View>
    );
  }

  if (!place) {
    return null;
  }

  // Get image from cover_image_url or first photo in photos array
  const placeImage = place.cover_image_url || 
    (Array.isArray(place.photos) ? place.photos[0]?.url || place.photos[0] : null) || 
    'https://via.placeholder.com/100';

  return (
    <View style={styles.placeCard}>
      <View style={styles.placeCardInner}>
        <Image
          source={{ uri: placeImage }}
          style={styles.placeCardImage}
        />
        <View style={styles.placeCardContent}>
          <Text style={styles.placeCardName} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.placeCardCategory}>
            {place.tavvy_category || place.tavvy_subcategory || 'Local Business'}
          </Text>
          {place.city && (
            <Text style={styles.placeCardLocation}>
              {place.city}{place.region ? `, ${place.region}` : ''}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.viewOnTavvyButton}
        onPress={handleViewOnTavvy}
        activeOpacity={0.8}
      >
        <Text style={styles.viewOnTavvyText}>View on Tavvy</Text>
      </TouchableOpacity>
    </View>
  );
};

// Itinerary Block - Now accepts reading settings
const ItineraryBlockComponent: React.FC<{ block: ItineraryBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const navigation = useNavigation();
  const { textColor, fontSize = 16, lineHeight = 24 } = settings;

  return (
    <View style={styles.itineraryContainer}>
      {block.title && (
        <Text style={[styles.itineraryTitle, textColor && { color: textColor }]}>
          {block.title}
        </Text>
      )}
      {block.days.map((day, dayIndex) => (
        <View key={dayIndex} style={styles.itineraryDay}>
          <View style={styles.itineraryDayHeader}>
            <View style={styles.itineraryDayBadge}>
              <Text style={styles.itineraryDayNumber}>Day {day.day_number}</Text>
            </View>
            <Text style={[styles.itineraryDayTitle, textColor && { color: textColor }]}>
              {day.title}
            </Text>
          </View>
          {day.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.itineraryItem}>
              {item.time && (
                <Text style={[styles.itineraryItemTime, { fontSize: fontSize - 2 }]}>
                  {item.time}
                </Text>
              )}
              <View style={styles.itineraryItemContent}>
                <Text style={[
                  styles.itineraryItemTitle,
                  { 
                    color: textColor || '#374151',
                    fontSize: fontSize,
                  }
                ]}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={[
                    styles.itineraryItemDesc,
                    { 
                      color: textColor || '#6B7280',
                      fontSize: fontSize - 2,
                      lineHeight: lineHeight - 4,
                      opacity: 0.8,
                    }
                  ]}>
                    {item.description}
                  </Text>
                )}
                {item.place_id && (
                  <TouchableOpacity
                    style={styles.itineraryPlaceLink}
                    onPress={() => navigation.navigate('PlaceDetails', { placeId: item.place_id })}
                  >
                    <Ionicons name="location" size={14} color={TEAL_PRIMARY} />
                    <Text style={styles.itineraryPlaceLinkText}>View on Tavvy</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Itinerary Day Block (single day) - Now accepts reading settings
const ItineraryDayBlockComponent: React.FC<{ block: ItineraryDayBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 24 } = settings;
  
  return (
    <View style={styles.itineraryDayContainer}>
      <View style={styles.itineraryDayHeader}>
        <View style={styles.itineraryDayBadge}>
          <Text style={styles.itineraryDayNumber}>Itinerary</Text>
        </View>
        <Text style={[styles.itineraryDayTitle, textColor && { color: textColor }]}>
          {block.title}
        </Text>
      </View>
      {block.items.map((item, itemIndex) => (
        <View key={itemIndex} style={styles.itineraryItem}>
          <Text style={[styles.itineraryItemTime, { fontSize: fontSize - 2 }]}>
            {item.time}
          </Text>
          <View style={styles.itineraryItemContent}>
            <Text style={[
              styles.itineraryItemTitle,
              { 
                color: textColor || '#374151',
                fontSize: fontSize,
              }
            ]}>
              {item.activity}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Callout Block - Now accepts reading settings
const CalloutBlockComponent: React.FC<{ block: CalloutBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 22 } = settings;
  
  const getCalloutStyle = () => {
    switch (block.style) {
      case 'tip':
        return {
          backgroundColor: TEAL_BG,
          borderColor: TEAL_PRIMARY,
          iconColor: TEAL_PRIMARY,
          icon: 'bulb' as const,
        };
      case 'warning':
        return {
          backgroundColor: AMBER_BG,
          borderColor: AMBER_WARNING,
          iconColor: AMBER_WARNING,
          icon: 'warning' as const,
        };
      case 'tavvy_note':
        return {
          backgroundColor: TEAL_BG,
          borderColor: TEAL_PRIMARY,
          iconColor: TEAL_PRIMARY,
          icon: 'paw' as const,
        };
      case 'info':
      default:
        return {
          backgroundColor: BLUE_BG,
          borderColor: BLUE_INFO,
          iconColor: BLUE_INFO,
          icon: 'information-circle' as const,
        };
    }
  };

  const calloutStyle = getCalloutStyle();

  // Support both 'text' and 'content' field names for compatibility
  const textContent = block.text || (block as any).content || '';

  return (
    <View
      style={[
        styles.calloutContainer,
        {
          backgroundColor: calloutStyle.backgroundColor,
          borderLeftColor: calloutStyle.borderColor,
        },
      ]}
    >
      <View style={styles.calloutHeader}>
        <Ionicons name={calloutStyle.icon} size={20} color={calloutStyle.iconColor} />
        {block.title && (
          <Text style={[styles.calloutTitle, { color: calloutStyle.iconColor }]}>
            {block.title}
          </Text>
        )}
      </View>
      <Text style={[
        styles.calloutText,
        { 
          fontSize: fontSize - 1,
          lineHeight: lineHeight,
        }
      ]}>
        {textContent}
      </Text>
    </View>
  );
};

// Checklist Block - Now accepts reading settings
const ChecklistBlockComponent: React.FC<{ block: ChecklistBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16 } = settings;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  // Normalize items to ensure they have id and text properties
  const normalizedItems = (block.items || []).map((item, index) => {
    if (typeof item === 'string') {
      return { id: `item-${index}`, text: item };
    }
    return {
      id: item.id || `item-${index}`,
      text: item.text || item.content || String(item),
    };
  });

  return (
    <View style={styles.checklistContainer}>
      {block.title && (
        <Text style={[styles.checklistTitle, textColor && { color: textColor }]}>
          {block.title}
        </Text>
      )}
      {normalizedItems.map((item) => {
        const isChecked = checkedItems.has(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistItem}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={[
              styles.checklistItemText,
              { 
                color: textColor || '#374151',
                fontSize: fontSize,
              },
              isChecked && styles.checklistItemTextChecked
            ]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Quote Block - Now accepts reading settings
const QuoteBlockComponent: React.FC<{ block: QuoteBlock; settings: ReadingSettings }> = ({ block, settings }) => {
  const { textColor, fontSize = 16, lineHeight = 26 } = settings;
  
  // Support both 'text' and 'content' field names for compatibility
  const textContent = block.text || (block as any).content || '';
  
  return (
    <View style={styles.quoteContainer}>
      <Ionicons name="chatbox-ellipses" size={24} color={TEAL_PRIMARY} style={styles.quoteIcon} />
      <Text style={[
        styles.quoteText,
        { 
          color: textColor || '#374151',
          fontSize: fontSize + 1,
          lineHeight: lineHeight,
        }
      ]}>
        "{textContent}"
      </Text>
      {block.author && (
        <Text style={styles.quoteAuthor}>— {block.author}</Text>
      )}
    </View>
  );
};

// Divider Block
const DividerBlockComponent: React.FC = () => {
  return <View style={styles.divider} />;
};

// ============================================================================
// MAIN RENDERER
// ============================================================================

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ 
  blocks,
  textColor,
  fontSize,
  lineHeight,
}) => {
  console.log('=== ContentBlockRenderer ===');
  console.log('Received blocks:', blocks?.length || 0);
  console.log('Reading settings - textColor:', textColor, 'fontSize:', fontSize, 'lineHeight:', lineHeight);
  
  if (!blocks || blocks.length === 0) {
    console.log('No blocks to render!');
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', padding: 20 }}>Debug: No content blocks received</Text>
      </View>
    );
  }

  // Create reading settings object to pass to all block components
  const readingSettings: ReadingSettings = {
    textColor,
    fontSize,
    lineHeight,
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    const key = `block-${index}`;

    switch (block.type) {
      case 'heading':
        return <HeadingBlockComponent key={key} block={block as HeadingBlock} settings={readingSettings} />;
      case 'paragraph':
        return <ParagraphBlockComponent key={key} block={block as ParagraphBlock} settings={readingSettings} />;
      case 'image':
        return <ImageBlockComponent key={key} block={block as ImageBlock} settings={readingSettings} />;
      case 'bullet_list':
        return <BulletListBlockComponent key={key} block={block as BulletListBlock} settings={readingSettings} />;
      case 'numbered_list':
        return <NumberedListBlockComponent key={key} block={block as NumberedListBlock} settings={readingSettings} />;
      case 'place_card':
        return <PlaceCardBlockComponent key={key} block={block as PlaceCardBlock} />;
      case 'itinerary':
        return <ItineraryBlockComponent key={key} block={block as ItineraryBlock} settings={readingSettings} />;
      case 'itinerary_day':
        return <ItineraryDayBlockComponent key={key} block={block as ItineraryDayBlock} settings={readingSettings} />;
      case 'callout':
        return <CalloutBlockComponent key={key} block={block as CalloutBlock} settings={readingSettings} />;
      case 'checklist':
        return <ChecklistBlockComponent key={key} block={block as ChecklistBlock} settings={readingSettings} />;
      case 'quote':
        return <QuoteBlockComponent key={key} block={block as QuoteBlock} settings={readingSettings} />;
      case 'divider':
        return <DividerBlockComponent key={key} />;
      // Support for additional block types from article imports
      case 'list':
        // Handle generic 'list' type - map to bullet_list or numbered_list based on style
        const listBlock = block as any;
        if (listBlock.style === 'ordered') {
          return <NumberedListBlockComponent key={key} block={{ type: 'numbered_list', items: listBlock.items || [] } as NumberedListBlock} settings={readingSettings} />;
        }
        return <BulletListBlockComponent key={key} block={{ type: 'bullet_list', items: listBlock.items || [] } as BulletListBlock} settings={readingSettings} />;
      case 'tip_box':
        // Handle tip_box as a callout with 'tip' style
        const tipBlock = block as any;
        return <CalloutBlockComponent key={key} block={{ type: 'callout', style: 'tip', title: tipBlock.title, text: tipBlock.content || tipBlock.text || '' } as CalloutBlock} settings={readingSettings} />;
      default:
        console.warn(`Unknown block type: ${block.type}`);
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },

  // Headings
  headingBase: {
    color: '#111827',
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },

  // Paragraph
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '700',
  },

  // Image
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  blockImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  imageCaption: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Lists
  listContainer: {
    marginVertical: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 16,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TEAL_PRIMARY,
    marginTop: 8,
    marginRight: 12,
  },
  listNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: TEAL_PRIMARY,
    marginRight: 8,
    minWidth: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },

  // Place Card
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeCardInner: {
    flexDirection: 'row',
    padding: 12,
  },
  placeCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  placeCardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  placeCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeCardRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 6,
  },
  starContainer: {
    flexDirection: 'row',
  },
  placeCardCategory: {
    fontSize: 13,
    color: '#6B7280',
  },
  placeCardLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  placeCardLoading: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  placeCardLoadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  viewOnTavvyButton: {
    backgroundColor: TEAL_PRIMARY,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewOnTavvyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Itinerary
  itineraryContainer: {
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  itineraryDay: {
    marginBottom: 20,
  },
  itineraryDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itineraryDayBadge: {
    backgroundColor: TEAL_PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  itineraryDayNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itineraryDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itineraryItem: {
    flexDirection: 'row',
    marginLeft: 8,
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  itineraryItemTime: {
    fontSize: 13,
    fontWeight: '600',
    color: TEAL_PRIMARY,
    minWidth: 100,
    marginRight: 8,
  },
  itineraryItemContent: {
    flex: 1,
  },
  itineraryItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  itineraryItemDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  itineraryPlaceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  itineraryPlaceLinkText: {
    fontSize: 13,
    color: TEAL_PRIMARY,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Itinerary Day (single day block)
  itineraryDayContainer: {
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },

  // Callout
  calloutContainer: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  calloutText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },

  // Checklist
  checklistContainer: {
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: TEAL_PRIMARY,
    borderColor: TEAL_PRIMARY,
  },
  checklistItemText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  checklistItemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },

  // Quote
  quoteContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: TEAL_BG,
    borderRadius: 12,
  },
  quoteIcon: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 17,
    fontStyle: 'italic',
    lineHeight: 26,
    color: '#374151',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: TEAL_PRIMARY,
    textAlign: 'right',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
});

export default ContentBlockRenderer;
