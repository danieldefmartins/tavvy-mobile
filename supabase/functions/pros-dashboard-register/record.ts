/** Build a caller-owned, unpaid profile; never trust client entitlement fields. */
export function buildRegistrationRecord(form: Record<string, unknown>, userId: string, email?: string) {
  const businessName = String(form.businessName || form.business_name || '').trim();
  if (!businessName) throw new Error('Business name is required.');
  const slugBase = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'pro';
  const record: Record<string, unknown> = {
    user_id: userId,
    slug: `${slugBase}-${userId}`,
    business_name: businessName,
    description: form.description,
    phone: form.phone,
    email: form.email || email,
    website: form.website,
    address: form.address,
    city: form.city,
    state: form.state,
    zip_code: form.zipCode || form.zip_code,
    service_radius: form.serviceRadius || form.service_radius || 25,
    years_in_business: form.yearsInBusiness || form.years_in_business || null,
    license_number: form.licenseNumber || form.license_number || null,
    is_insured: form.isInsured || form.is_insured || false,
    trade_category: form.tradeCategory || form.trade_category || null,
    is_active: false,
    subscription_status: 'none',
    subscription_plan: null,
  };
  // PostGIS location is a point, not a human-readable city/state string.
  // Keep the supplied city/state separately and use only validated coordinates.
  const latitude = form.latitude;
  const longitude = form.longitude;
  if (typeof latitude === 'number' && typeof longitude === 'number' &&
      Number.isFinite(latitude) && Number.isFinite(longitude) &&
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
    record.location = `SRID=4326;POINT(${longitude} ${latitude})`;
  }
  for (const key of Object.keys(record)) if (record[key] === undefined) delete record[key];
  return record;
}
