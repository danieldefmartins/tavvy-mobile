// ============================================================================
// CONTENT BLOCK RENDERER - Atlas v2.0
// ============================================================================
// Renders block-based content for Atlas articles
// Supports: heading, paragraph, image, bullet_list, numbered_list,
// place_card, itinerary, callout, checklist, quote, divider
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
  category: string;
  rating?: number;
  review_count?: number;
  photos?: string[];
  address?: string;
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

// Heading Block
const HeadingBlockComponent: React.FC<{ block: HeadingBlock }> = ({ block }) => {
  const headingStyles = {
    1: styles.heading1,
    2: styles.heading2,
    3: styles.heading3,
  };

  return (
    <Text style={[styles.headingBase, headingStyles[block.level]]}>
      {block.text}
    </Text>
  );
};

// Paragraph Block
const ParagraphBlockComponent: React.FC<{ block: ParagraphBlock }> = ({ block }) => {
  // Simple markdown-like parsing for bold and italic
  const renderText = (text: string) => {
    // Replace **bold** with bold text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <Text style={styles.paragraph}>
      {renderText(block.text)}
    </Text>
  );
};

// Image Block
const ImageBlockComponent: React.FC<{ block: ImageBlock }> = ({ block }) => {
  return (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: block.url }}
        style={styles.blockImage}
        resizeMode="cover"
      />
      {block.caption && (
        <Text style={styles.imageCaption}>{block.caption}</Text>
      )}
    </View>
  );
};

// Bullet List Block
const BulletListBlockComponent: React.FC<{ block: BulletListBlock }> = ({ block }) => {
  return (
    <View style={styles.listContainer}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <View style={styles.bulletPoint} />
          <Text style={styles.listItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

// Numbered List Block
const NumberedListBlockComponent: React.FC<{ block: NumberedListBlock }> = ({ block }) => {
  return (
    <View style={styles.listContainer}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listNumber}>{index + 1}.</Text>
          <Text style={styles.listItemText}>{item}</Text>
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
        .select('id, name, category, rating, review_count, photos, address, city, state')
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

  const placeImage = place.photos?.[0] || 'https://via.placeholder.com/100';

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
          <View style={styles.placeCardRating}>
            <Text style={styles.placeCardRatingText}>
              {place.rating?.toFixed(1) || '4.5'}
            </Text>
            <StarRating rating={place.rating || 4.5} size={12} />
          </View>
          <Text style={styles.placeCardCategory}>
            {place.category}
          </Text>
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

// Itinerary Block
const ItineraryBlockComponent: React.FC<{ block: ItineraryBlock }> = ({ block }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.itineraryContainer}>
      {block.title && (
        <Text style={styles.itineraryTitle}>{block.title}</Text>
      )}
      {block.days.map((day, dayIndex) => (
        <View key={dayIndex} style={styles.itineraryDay}>
          <View style={styles.itineraryDayHeader}>
            <View style={styles.itineraryDayBadge}>
              <Text style={styles.itineraryDayNumber}>Day {day.day_number}</Text>
            </View>
            <Text style={styles.itineraryDayTitle}>{day.title}</Text>
          </View>
          
          {day.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.itineraryItem}>
              {item.time && (
                <Text style={styles.itineraryItemTime}>{item.time}</Text>
              )}
              <View style={styles.itineraryItemContent}>
                <Text style={styles.itineraryItemTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.itineraryItemDesc}>{item.description}</Text>
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

// Itinerary Day Block (single day from CSV format)
const ItineraryDayBlockComponent: React.FC<{ block: ItineraryDayBlock }> = ({ block }) => {
  return (
    <View style={styles.itineraryDayContainer}>
      <View style={styles.itineraryDayHeader}>
        <View style={styles.itineraryDayBadge}>
          <Ionicons name="calendar-outline" size={14} color="#fff" />
        </View>
        <Text style={styles.itineraryDayTitle}>{block.title}</Text>
      </View>
      
      {block.items.map((item, itemIndex) => (
        <View key={itemIndex} style={styles.itineraryItem}>
          <Text style={styles.itineraryItemTime}>{item.time}</Text>
          <View style={styles.itineraryItemContent}>
            <Text style={styles.itineraryItemTitle}>{item.activity}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Callout Block
const CalloutBlockComponent: React.FC<{ block: CalloutBlock }> = ({ block }) => {
  const getCalloutStyle = () => {
    switch (block.style) {
      case 'tip':
        return {
          bg: TEAL_BG,
          border: TEAL_PRIMARY,
          icon: 'bulb-outline' as const,
          iconColor: TEAL_PRIMARY,
        };
      case 'warning':
        return {
          bg: AMBER_BG,
          border: AMBER_WARNING,
          icon: 'warning-outline' as const,
          iconColor: AMBER_WARNING,
        };
      case 'tavvy_note':
        return {
          bg: TEAL_BG,
          border: TEAL_PRIMARY,
          icon: 'information-circle-outline' as const,
          iconColor: TEAL_PRIMARY,
        };
      case 'info':
      default:
        return {
          bg: BLUE_BG,
          border: BLUE_INFO,
          icon: 'information-circle-outline' as const,
          iconColor: BLUE_INFO,
        };
    }
  };

  const style = getCalloutStyle();

  return (
    <View style={[styles.calloutContainer, { backgroundColor: style.bg, borderLeftColor: style.border }]}>
      <View style={styles.calloutHeader}>
        <Ionicons name={style.icon} size={20} color={style.iconColor} />
        {block.title && (
          <Text style={[styles.calloutTitle, { color: style.border }]}>
            {block.title}
          </Text>
        )}
      </View>
      <Text style={styles.calloutText}>{block.text}</Text>
    </View>
  );
};

// Checklist Block - handles both string[] and ChecklistItem[] formats
const ChecklistBlockComponent: React.FC<{ block: ChecklistBlock }> = ({ block }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Normalize items to handle both string[] and ChecklistItem[] formats
  const normalizedItems = block.items.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `item-${index}`, text: item, checked: false };
    }
    return item;
  });

  return (
    <View style={styles.checklistContainer}>
      {block.title && (
        <Text style={styles.checklistTitle}>{block.title}</Text>
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
            <Text style={[styles.checklistItemText, isChecked && styles.checklistItemTextChecked]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Quote Block
const QuoteBlockComponent: React.FC<{ block: QuoteBlock }> = ({ block }) => {
  return (
    <View style={styles.quoteContainer}>
      <Ionicons name="chatbox-ellipses" size={24} color={TEAL_PRIMARY} style={styles.quoteIcon} />
      <Text style={styles.quoteText}>"{block.text}"</Text>
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
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ blocks }) => {
  console.log('=== ContentBlockRenderer ===');
  console.log('Received blocks:', blocks?.length || 0);
  console.log('Blocks array:', blocks ? 'exists' : 'null/undefined');
  
  if (!blocks || blocks.length === 0) {
    console.log('No blocks to render!');
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', padding: 20 }}>Debug: No content blocks received</Text>
      </View>
    );
  }

  const renderBlock = (block: ContentBlock, index: number) => {
    const key = `block-${index}`;

    switch (block.type) {
      case 'heading':
        return <HeadingBlockComponent key={key} block={block as HeadingBlock} />;
      case 'paragraph':
        return <ParagraphBlockComponent key={key} block={block as ParagraphBlock} />;
      case 'image':
        return <ImageBlockComponent key={key} block={block as ImageBlock} />;
      case 'bullet_list':
        return <BulletListBlockComponent key={key} block={block as BulletListBlock} />;
      case 'numbered_list':
        return <NumberedListBlockComponent key={key} block={block as NumberedListBlock} />;
      case 'place_card':
        return <PlaceCardBlockComponent key={key} block={block as PlaceCardBlock} />;
      case 'itinerary':
        return <ItineraryBlockComponent key={key} block={block as ItineraryBlock} />;
      case 'itinerary_day':
        return <ItineraryDayBlockComponent key={key} block={block as ItineraryDayBlock} />;
      case 'callout':
        return <CalloutBlockComponent key={key} block={block as CalloutBlock} />;
      case 'checklist':
        return <ChecklistBlockComponent key={key} block={block as ChecklistBlock} />;
      case 'quote':
        return <QuoteBlockComponent key={key} block={block as QuoteBlock} />;
      case 'divider':
        return <DividerBlockComponent key={key} />;
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
  heading1: {
    fontSize: 28,
    lineHeight: 36,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 30,
  },
  heading3: {
    fontSize: 18,
    lineHeight: 26,
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
