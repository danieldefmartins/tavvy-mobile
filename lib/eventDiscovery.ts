import type { TavvyEvent } from './eventsService';
export const COMMUNITY_EVENT_COLUMNS = 'id,name,description,latitude,longitude,address_line1,formatted_address,city,region,country,start_datetime,end_datetime,event_category,cover_photo,ticket_url,is_free,price_min,price_max,currency,status';
export function eventDateRange(filter: string = 'all', now = new Date()) {
  const start = new Date(now), end = new Date(now);
  if (filter === 'weekend') {
    const day = now.getDay();
    if (day !== 0 && day !== 6) start.setDate(now.getDate() + (6 - day));
    if (day !== 0 && day !== 6) start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime()); end.setDate(start.getDate() + (start.getDay() === 6 ? 2 : 1)); end.setHours(0, 0, 0, 0);
  } else if (filter === 'tonight') { end.setDate(now.getDate() + 1); end.setHours(0, 0, 0, 0); }
  else { end.setDate(now.getDate() + (filter === 'week' ? 7 : 30)); }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}
export const distanceMiles = (a: number, b: number, c: number, d: number) => {
  const rad = Math.PI / 180;
  const h = Math.sin((c-a)*rad/2)**2 + Math.cos(a*rad)*Math.cos(c*rad)*Math.sin((d-b)*rad/2)**2;
  return 3959 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0,1-h)));
};
export function communityEvent(row: any): TavvyEvent {
  return { id: row.id, source: 'tavvy', source_id: row.id, title: row.name, description: row.description || undefined,
    start_time: row.start_datetime, end_time: row.end_datetime || undefined, lat: row.latitude ?? undefined, lng: row.longitude ?? undefined,
    address: row.formatted_address || row.address_line1 || undefined, city: row.city || undefined, state: row.region || undefined, country: row.country || undefined,
    category: row.event_category, image_url: row.cover_photo || undefined, url: row.ticket_url || undefined,
    price_min: row.is_free === true ? 0 : row.price_min ?? undefined, price_max: row.price_max ?? undefined, currency: row.currency || undefined };
}
export async function loadCommunityEvents(db: any, options: {lat:number;lng:number;radiusMiles:number;startDate?:string;endDate?:string}): Promise<TavvyEvent[]> {
  const {lat,lng,radiusMiles,startDate,endDate}=options;
  if (![lat,lng,radiusMiles].every(Number.isFinite) || Math.abs(lat)>90 || Math.abs(lng)>180 || radiusMiles<=0 || radiusMiles>500) throw new Error('Choose a valid location and radius.');
  const rows: TavvyEvent[]=[];
  const delta=radiusMiles/69;
  for(let offset=0;;offset+=500){
    let query=db.from('tavvy_events').select(COMMUNITY_EVENT_COLUMNS).eq('status','published').gte('latitude',Math.max(-90,lat-delta)).lte('latitude',Math.min(90,lat+delta)).gte('start_datetime',startDate || new Date().toISOString()).order('start_datetime').order('id').range(offset,offset+499);
    if(endDate)query=query.lt('start_datetime',endDate);
    const {data,error}=await query;if(error)throw error;
    for(const row of data||[]) if(row.latitude != null && row.longitude != null && distanceMiles(lat,lng,row.latitude,row.longitude)<=radiusMiles) rows.push(communityEvent(row));
    if(!data || data.length<500)return rows;
  }
}
export function eventPrice(event: Pick<TavvyEvent,'price_min'|'price_max'|'currency'>): string {
  if(event.price_min == null)return 'Price not listed';
  if(event.price_min===0 && !event.price_max)return 'Free';
  const amount=(n:number)=> {try{return new Intl.NumberFormat(undefined,{style:'currency',currency:event.currency || 'USD',maximumFractionDigits:2}).format(n);}catch{return `${n} ${event.currency || ''}`.trim();}};
  return event.price_max != null && event.price_max !== event.price_min ? `${amount(event.price_min)}–${amount(event.price_max)}` : `From ${amount(event.price_min)}`;
}
