import { describe, it, expect } from 'vitest';
import { deriveCityArea, type MapTilerFeature } from './LocationAutocomplete';

// Fixtures mirror REAL MapTiler geocoding responses captured from the API.
// Regression guard: rural picks have no `city`/`municipality` context entry,
// which previously made deriveCityArea return null and left City/Area empty.
function feature(overrides: Partial<MapTilerFeature>): MapTilerFeature {
  return {
    place_name: '',
    text: '',
    place_type: ['place'],
    context: [],
    ...overrides,
  };
}

describe('deriveCityArea (MapTiler)', () => {
  it('fills rural picks that have no city context (county/mandal fallback)', () => {
    // "adibhatla" -> context is only county/subregion/region/country.
    const adibhatla = feature({
      place_name: 'Adibhatla, Ibrahimpatnam mandal, Telangana, India',
      text: 'Adibhatla',
      place_type: ['place'],
      context: [
        { id: 'county.12076', text: 'Ibrahimpatnam mandal' },
        { id: 'subregion.630', text: 'Ranga Reddy' },
        { id: 'region.1541', text: 'Telangana' },
        { id: 'country.201', text: 'India' },
      ],
    });
    expect(deriveCityArea(adibhatla)).toEqual({ city: 'Ibrahimpatnam mandal', area: 'Adibhatla' });
  });

  it('uses the containing municipality as the city for neighborhoods', () => {
    const madhapur = feature({
      place_name: 'Madhapur, Hyderabad, Telangana, India',
      text: 'Madhapur',
      place_type: ['place'],
      context: [
        { id: 'municipal_district.69026', text: 'Ward 104 Kondapur' },
        { id: 'municipality.150196', text: 'Hyderabad' },
        { id: 'county.12929', text: 'Serilingampalle mandal' },
        { id: 'subregion.630', text: 'Ranga Reddy' },
        { id: 'region.1541', text: 'Telangana' },
        { id: 'country.201', text: 'India' },
      ],
    });
    expect(deriveCityArea(madhapur)).toEqual({ city: 'Hyderabad', area: 'Madhapur' });
  });

  it('treats a city-level pick as both city and area', () => {
    const hyderabad = feature({
      place_name: 'Hyderabad, Telangana, India',
      text: 'Hyderabad',
      place_type: ['municipality'],
      context: [
        { id: 'county.12093', text: 'Hyderabad mandal' },
        { id: 'subregion.1304', text: 'Hyderabad' },
        { id: 'region.1541', text: 'Telangana' },
        { id: 'country.201', text: 'India' },
      ],
    });
    expect(deriveCityArea(hyderabad)).toEqual({ city: 'Hyderabad', area: 'Hyderabad' });
  });

  it('never treats a `place.` neighborhood context record as the city', () => {
    // "gachibowli rd" address: place.1008267 is "Officers Colony", the city is
    // municipality.150196 = Hyderabad.
    const address = feature({
      place_name: 'gachibowli rd, 500 024 Hyderabad, Telangana, India',
      text: 'gachibowli rd',
      place_type: ['address'],
      context: [
        { id: 'postal_code.618025', text: '500 024' },
        { id: 'place.1008267', text: 'Officers Colony' },
        { id: 'municipal_district.70496', text: 'Ward 28 Azampura' },
        { id: 'municipality.150196', text: 'Hyderabad' },
        { id: 'county.12079', text: 'Amberpet mandal' },
        { id: 'subregion.1304', text: 'Hyderabad' },
      ],
    });
    expect(deriveCityArea(address)).toEqual({ city: 'Hyderabad', area: 'gachibowli rd' });
  });

  it('returns null only when there is genuinely nothing to derive from', () => {
    expect(deriveCityArea(feature({ text: 'Nowhere', context: [] }))).toBeNull();
  });

  it('passes the GeoJSON pin through as latitude/longitude for distance scoring', () => {
    const pinned = feature({
      place_name: 'Madhapur, Hyderabad, Telangana, India',
      text: 'Madhapur',
      place_type: ['place'],
      // MapTiler GeoJSON order is [longitude, latitude].
      geometry: { coordinates: [78.3779, 17.4439] },
      context: [{ id: 'municipality.150196', text: 'Hyderabad' }],
    });
    expect(deriveCityArea(pinned)).toEqual({
      city: 'Hyderabad',
      area: 'Madhapur',
      latitude: 17.4439,
      longitude: 78.3779,
    });
  });

  it('does not forward malformed coordinates as a pin', () => {
    const broken = feature({
      place_name: 'Madhapur, Hyderabad, Telangana, India',
      text: 'Madhapur',
      place_type: ['place'],
      geometry: { coordinates: ['not', 'numbers'] as unknown as number[] },
      context: [{ id: 'municipality.150196', text: 'Hyderabad' }],
    });
    expect(deriveCityArea(broken)).toEqual({ city: 'Hyderabad', area: 'Madhapur', latitude: undefined, longitude: undefined });
  });
});