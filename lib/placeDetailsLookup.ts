import { normalizePlaceShareId } from './placeShare';
import {loadCruiseVenueContext} from './cruises/venueContext';

export const isCanonicalPlaceId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Read-only lookup: opening a provider result must never create a place or show demo data. */
export async function lookupPlaceDetails(identifier: unknown, client: any, getIndexedPlace?: (id: string) => Promise<any>): Promise<any | null> {
  const id = normalizePlaceShareId(identifier);
  if (!id) return null;
  const provider = id.startsWith('fsq:');
  const raw = provider ? id.slice(4) : id;
  const read = async (query: any) => {
    const { data, error } = await query.limit(2);
    if (error) throw new Error('Place details are temporarily unavailable. Please try again.');
    if ((data?.length || 0) > 1) throw new Error('This place could not be identified. Please choose another search result.');
    return data?.[0] || null;
  };
  let query = client.from('places').select('*').eq(provider ? 'source_id' : isCanonicalPlaceId(raw) ? 'id' : 'slug', raw);
  if (provider) query = query.eq('source_type', 'fsq');
  let row = await read(query);
  if (!row && !provider) row = await read(client.from('places').select('*').eq('source_id', raw));
  if (row) {
    if (row.is_active === false || (row.status && row.status !== 'active')) return null;
    const cruiseVenue = await loadCruiseVenueContext(client, row);
    return { ...row, cruiseVenue,
      name: cruiseVenue?.venue_name || row.name,
      tavvy_category: cruiseVenue?.review_category || row.tavvy_category,
      tavvy_subcategory: cruiseVenue ? null : row.tavvy_subcategory,
      description: cruiseVenue ? cruiseVenue.description : row.description,
      primary_category: cruiseVenue?.review_category || row.tavvy_subcategory || row.tavvy_category || row.primary_category || row.category,
      address_line_1: row.street || row.address_line_1 || row.address_line1 || row.address,
      state: row.region || row.state, zip_code: row.postcode || row.zip_code,
    };
  }
  if (!provider) return null;
  row = await read(client.from('fsq_places_raw').select('*').eq('fsq_place_id', raw));
  if (row?.date_closed) return null;
  if (!row && getIndexedPlace) {
    const indexed = await getIndexedPlace(raw);
    // An upstream response must represent the requested provider ID exactly.
    if (indexed && (indexed.fsq_place_id === raw || indexed.id === raw || indexed.id === `fsq:${raw}`)) row = indexed;
  }
  if (!row) return null;
  const categories = row.fsq_category_labels;
  const category = row.subcategory || row.category || (Array.isArray(categories) ? categories[0] : categories);
  return {
    id: `fsq:${raw}`, name: row.name, latitude: row.latitude, longitude: row.longitude,
    primary_category: typeof category === 'string' ? category.split('>').pop()?.replace(/[\[\]"']/g, '').trim() : 'Place',
    address_line_1: row.address, city: row.locality, state: row.region, country: row.country,
    zip_code: row.postcode, phone: row.tel, website: row.website, email: row.email,
    cover_image_url: null,
  };
}
