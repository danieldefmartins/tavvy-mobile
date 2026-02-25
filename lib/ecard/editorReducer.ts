/**
 * eCard Editor Reducer -- centralized state management for the card editor.
 * Replaces 30+ individual useState declarations with a single typed reducer.
 *
 * React Native port: uses URI-based pending uploads instead of File objects.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface FeaturedSocial {
  platform: string;
  url: string;
}

export interface ProCredentials {
  isLicensed: boolean;
  licenseNumber?: string;
  isInsured: boolean;
  isBonded: boolean;
  isTavvyVerified: boolean;
  yearsInBusiness?: number;
  serviceArea?: string;
}

export interface CardData {
  id: string;
  slug: string;
  user_id: string;
  template_id: string;
  color_scheme_id?: string;

  full_name: string;
  title: string;
  company: string;
  bio?: string;

  email?: string;
  phone?: string;
  website?: string;
  website_label?: string;

  city?: string;
  state?: string;
  address?: string;
  zip_code?: string;

  profile_photo_url?: string;
  banner_image_url?: string;
  logo_url?: string;
  profile_photo_size?: string;
  background_image_url?: string;

  gradient_color_1: string;
  gradient_color_2: string;
  font_style: string;
  font_color?: string;
  button_style: string;

  show_contact_info?: boolean;
  show_social_icons?: boolean;

  is_published: boolean;
  is_active: boolean;

  view_count: number;
  tap_count: number;

  card_type?: string;
  country_code?: string;

  gallery_images?: GalleryImage[];
  videos?: any[];
  featured_socials?: FeaturedSocial[];

  pro_credentials?: ProCredentials;
  professional_category?: string;

  form_block?: any;
  industry_icons?: any[];

  // Civic fields
  ballot_number?: string;
  party_name?: string;
  office_running_for?: string;
  election_year?: string;
  campaign_slogan?: string;
  region?: string;

  pronouns?: string;
  theme?: string;
  background_type?: string;

  review_count?: number;
  review_rating?: number;

  [key: string]: any;
}

export interface LinkItem {
  id: string;
  card_id?: string;
  platform: string;
  title?: string;
  url: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  clicks?: number;
}

/** React Native pending upload: URI + optional MIME type (no File objects in RN). */
export interface PendingUpload {
  uri: string;
  type?: string;
}

export interface EditorState {
  card: CardData | null;
  links: LinkItem[];
  pendingUploads: Map<string, PendingUpload>;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  loadError: string | null;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export type EditorAction =
  | { type: 'LOAD_CARD'; card: CardData; links: LinkItem[] }
  | { type: 'SET_FIELD'; field: keyof CardData; value: any }
  | { type: 'SET_FIELDS'; fields: Partial<CardData> }
  | { type: 'SET_LINKS'; links: LinkItem[] }
  | { type: 'ADD_LINK'; link: LinkItem }
  | { type: 'UPDATE_LINK'; id: string; updates: Partial<LinkItem> }
  | { type: 'REMOVE_LINK'; id: string }
  | { type: 'REORDER_LINKS'; fromIndex: number; toIndex: number }
  | { type: 'SET_TEMPLATE'; templateId: string; colorSchemeId?: string }
  | { type: 'ADD_GALLERY_IMAGE'; image: { id: string; url: string; uri?: string; type?: string } }
  | { type: 'REMOVE_GALLERY_IMAGE'; id: string }
  | { type: 'REORDER_GALLERY'; fromIndex: number; toIndex: number }
  | { type: 'ADD_VIDEO'; video: { type: string; url: string } }
  | { type: 'REMOVE_VIDEO'; index: number }
  | { type: 'ADD_FEATURED_SOCIAL'; social: FeaturedSocial }
  | { type: 'UPDATE_FEATURED_SOCIAL'; platform: string; url: string }
  | { type: 'REMOVE_FEATURED_SOCIAL'; platform: string }
  | { type: 'SET_PENDING_UPLOAD'; key: string; upload: PendingUpload }
  | { type: 'CLEAR_PENDING_UPLOAD'; key: string }
  | { type: 'CLEAR_ALL_PENDING_UPLOADS' }
  | { type: 'MARK_SAVING' }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_SAVE_ERROR' }
  | { type: 'MARK_CLEAN' }
  | { type: 'SET_LOAD_ERROR'; error: string }
  | { type: 'RESET_CARD' };

// ── Initial state ────────────────────────────────────────────────────────────

export const initialEditorState: EditorState = {
  card: null,
  links: [],
  pendingUploads: new Map(),
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  loadError: null,
};

// ── Reducer ──────────────────────────────────────────────────────────────────

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_CARD':
      return {
        ...state,
        card: { ...action.card },
        links: action.links,
        isDirty: false,
        isSaving: false,
        loadError: null,
        pendingUploads: new Map(),
      };

    case 'SET_FIELD':
      if (!state.card) return state;
      return {
        ...state,
        card: { ...state.card, [action.field]: action.value },
        isDirty: true,
      };

    case 'SET_FIELDS':
      if (!state.card) return state;
      return {
        ...state,
        card: { ...state.card, ...action.fields },
        isDirty: true,
      };

    case 'SET_LINKS':
      return { ...state, links: action.links, isDirty: true };

    case 'ADD_LINK':
      return { ...state, links: [...state.links, action.link], isDirty: true };

    case 'UPDATE_LINK':
      return {
        ...state,
        links: state.links.map(l =>
          l.id === action.id ? { ...l, ...action.updates } : l
        ),
        isDirty: true,
      };

    case 'REMOVE_LINK':
      return {
        ...state,
        links: state.links.filter(l => l.id !== action.id),
        isDirty: true,
      };

    case 'REORDER_LINKS': {
      const newLinks = [...state.links];
      const [moved] = newLinks.splice(action.fromIndex, 1);
      newLinks.splice(action.toIndex, 0, moved);
      return { ...state, links: newLinks, isDirty: true };
    }

    case 'SET_TEMPLATE':
      if (!state.card) return state;
      return {
        ...state,
        card: {
          ...state.card,
          template_id: action.templateId,
          ...(action.colorSchemeId ? { color_scheme_id: action.colorSchemeId } : {}),
        },
        isDirty: true,
      };

    case 'ADD_GALLERY_IMAGE': {
      if (!state.card) return state;
      const gallery = [
        ...(state.card.gallery_images || []),
        { id: action.image.id, url: action.image.url },
      ];
      const uploads = new Map(state.pendingUploads);
      if (action.image.uri) {
        uploads.set(`gallery_${action.image.id}`, {
          uri: action.image.uri,
          type: action.image.type,
        });
      }
      return {
        ...state,
        card: { ...state.card, gallery_images: gallery },
        pendingUploads: uploads,
        isDirty: true,
      };
    }

    case 'REMOVE_GALLERY_IMAGE': {
      if (!state.card) return state;
      const newUploads = new Map(state.pendingUploads);
      newUploads.delete(`gallery_${action.id}`);
      return {
        ...state,
        card: {
          ...state.card,
          gallery_images: (state.card.gallery_images || []).filter(
            g => g.id !== action.id
          ),
        },
        pendingUploads: newUploads,
        isDirty: true,
      };
    }

    case 'REORDER_GALLERY': {
      if (!state.card) return state;
      const newGallery = [...(state.card.gallery_images || [])];
      const [movedImg] = newGallery.splice(action.fromIndex, 1);
      newGallery.splice(action.toIndex, 0, movedImg);
      return {
        ...state,
        card: { ...state.card, gallery_images: newGallery },
        isDirty: true,
      };
    }

    case 'ADD_VIDEO':
      if (!state.card) return state;
      return {
        ...state,
        card: {
          ...state.card,
          videos: [...(state.card.videos || []), action.video],
        },
        isDirty: true,
      };

    case 'REMOVE_VIDEO': {
      if (!state.card) return state;
      const newVideos = [...(state.card.videos || [])];
      newVideos.splice(action.index, 1);
      return {
        ...state,
        card: { ...state.card, videos: newVideos },
        isDirty: true,
      };
    }

    case 'ADD_FEATURED_SOCIAL': {
      if (!state.card) return state;
      const existing = state.card.featured_socials || [];
      if (existing.length >= 4) return state;
      if (existing.some(s => s.platform === action.social.platform)) return state;
      return {
        ...state,
        card: {
          ...state.card,
          featured_socials: [...existing, action.social],
        },
        isDirty: true,
      };
    }

    case 'UPDATE_FEATURED_SOCIAL':
      if (!state.card) return state;
      return {
        ...state,
        card: {
          ...state.card,
          featured_socials: (state.card.featured_socials || []).map(s =>
            s.platform === action.platform ? { ...s, url: action.url } : s
          ),
        },
        isDirty: true,
      };

    case 'REMOVE_FEATURED_SOCIAL':
      if (!state.card) return state;
      return {
        ...state,
        card: {
          ...state.card,
          featured_socials: (state.card.featured_socials || []).filter(
            s => s.platform !== action.platform
          ),
        },
        isDirty: true,
      };

    case 'SET_PENDING_UPLOAD': {
      const uploads = new Map(state.pendingUploads);
      uploads.set(action.key, action.upload);
      return { ...state, pendingUploads: uploads, isDirty: true };
    }

    case 'CLEAR_PENDING_UPLOAD': {
      const uploads = new Map(state.pendingUploads);
      uploads.delete(action.key);
      return { ...state, pendingUploads: uploads };
    }

    case 'CLEAR_ALL_PENDING_UPLOADS':
      return { ...state, pendingUploads: new Map() };

    case 'MARK_SAVING':
      return { ...state, isSaving: true };

    case 'MARK_SAVED':
      return { ...state, isSaving: false, isDirty: false, lastSaved: new Date() };

    case 'MARK_SAVE_ERROR':
      return { ...state, isSaving: false };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    case 'SET_LOAD_ERROR':
      return { ...state, loadError: action.error };

    case 'RESET_CARD': {
      if (!state.card) return state;
      return {
        ...state,
        card: {
          ...state.card,
          full_name: '',
          title: '',
          company: '',
          bio: '',
          email: '',
          phone: '',
          website: '',
          website_label: '',
          city: '',
          state: '',
          address: '',
          zip_code: '',
          profile_photo_url: undefined,
          profile_photo_size: 'medium',
          banner_image_url: undefined,
          logo_url: undefined,
          gallery_images: [],
          videos: [],
          featured_socials: [],
          show_contact_info: true,
          show_social_icons: true,
        },
        links: [],
        pendingUploads: new Map(),
        isDirty: true,
      };
    }

    default:
      return state;
  }
}
