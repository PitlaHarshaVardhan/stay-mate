import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button, FormLabel, Heading, InlineText, Paragraph, TextInput } from './ui';

export type MapTilerFeature = {
  place_name: string;
  text: string;
  place_type: string[];
  context?: { id: string; text: string }[];
  // GeoJSON point of the picked place, as [longitude, latitude]. Used to pin
  // the location so matches can show real distance between two people.
  geometry?: { coordinates?: number[] };
};

export type LocationSelection = {
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
};

// MapTiler place_types that ARE the city itself (so the picked place is the city).
const CITY_PLACE_TYPES = new Set(['city', 'town', 'village', 'municipality', 'locality', 'county']);

// MapTiler context ids that represent a containing city. Note `place.` is a
// neighborhood/locality record (e.g. "Officers Colony"), NOT a city, so it is
// deliberately excluded here.
const CITY_CONTEXT_PREFIXES = ['city', 'town', 'village', 'locality', 'joint_municipality', 'municipality'];

// Rural picks (e.g. small villages) have no city parent. MapTiler reports a
// county (mandal/taluk) and subregion (district) instead — the same fallback
// chain the old Google implementation used (administrative_area_level_3/2).
const RURAL_CONTEXT_PREFIXES = ['county', 'subregion'];

function findContextText(feature: MapTilerFeature, ...typePrefixes: string[]) {
  for (const prefix of typePrefixes) {
    const item = feature.context?.find((context) => context.id.startsWith(`${prefix}.`));
    if (item) return item.text;
  }
}

function normalizeMunicipalityCity(text: string) {
  return text
    .replace(/^greater\s+/i, '')
    .replace(/\s+(?:municipal\s+corporation|municipal\s+council|corporation)\b.*$/i, '')
    .trim();
}

function deriveArea(text: string, city: string) {
  const cityIndex = text.toLocaleLowerCase().lastIndexOf(city.toLocaleLowerCase());
  if (cityIndex > 0) {
    const area = text.slice(0, cityIndex).replace(/[,\s]+$/, '').trim();
    if (area) return area;
  }

  const area = text.replace(new RegExp(`(?:,\\s*|\\s+)${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '').trim();
  return area || city;
}

// MapTiler geocoding returns the matched place plus its containing admin areas
// in `context`. Derive the same City + Area pair the form needs:
// 1. If the pick itself is a city-level place (city, municipality, mandal…),
//    it IS the city.
// 2. Otherwise use the containing city from context (e.g. Madhapur -> Hyderabad).
// 3. For rural picks with no city parent, fall back to county (mandal) then
//    subregion (district), mirroring the previous Google behavior.
// Area is the picked place, falling back to the city when they are the same.
export function deriveCityArea(feature: MapTilerFeature): LocationSelection | null {
  const isCityFeature = feature.place_type.some((type) => CITY_PLACE_TYPES.has(type));
  const cityContext = findContextText(feature, ...CITY_CONTEXT_PREFIXES);
  const city =
    (isCityFeature ? feature.text : undefined) ??
    (cityContext ? normalizeMunicipalityCity(cityContext) : undefined) ??
    findContextText(feature, ...RURAL_CONTEXT_PREFIXES);
  if (!city) return null;
  const area = feature.text ? deriveArea(feature.text, city) : city;
  // MapTiler GeoJSON coordinates are [longitude, latitude]. Pass the pin
  // through so the backend can compute real distance between two matches.
  const [longitude, latitude] = feature.geometry?.coordinates ?? [];
  const hasPin =
    typeof latitude === 'number' && Number.isFinite(latitude) &&
    typeof longitude === 'number' && Number.isFinite(longitude);
  return { city, area, latitude: hasPin ? latitude : undefined, longitude: hasPin ? longitude : undefined };
}

export default function LocationAutocomplete({ onSelect }: { onSelect: (location: LocationSelection) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapTilerFeature[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const selectedPlaceQuery = useRef<string | null>(null);
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setStatus('Add a MapTiler API key to enable place suggestions. City and Area are filled only from search results.');
    }
  }, [apiKey]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (selectedPlaceQuery.current === query) {
      selectedPlaceQuery.current = null;
      setSuggestions([]);
      setLoading(false);
      return;
    }
    if (!apiKey || trimmedQuery.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(trimmedQuery)}.json?key=${encodeURIComponent(apiKey)}&limit=6&language=en`,
        { signal: controller.signal },
      )
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('MapTiler request failed.'))))
        .then((data: { features?: MapTilerFeature[] }) => {
          if (!active) return;
          setSuggestions(Array.isArray(data.features) ? data.features : []);
          setStatus('');
        })
        .catch((error: unknown) => {
          if (!active || (error instanceof DOMException && error.name === 'AbortError')) return;
          setSuggestions([]);
          setStatus('Location suggestions are unavailable right now.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [apiKey, query]);

  const selectFeature = (feature: MapTilerFeature) => {
    const derived = deriveCityArea(feature);
    if (!derived) {
      setStatus('Could not map that place to a City and Area. Please pick another suggestion.');
      return;
    }
    onSelect(derived);
    selectedPlaceQuery.current = feature.place_name;
    setQuery(feature.place_name);
    setSuggestions([]);
    setStatus('');
  };

  return (
    <div className="relative sm:col-span-2">
      <FormLabel htmlFor="location-search">
        Search a place
      </FormLabel>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <TextInput
          variant="default"
          id="location-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setSuggestions([]);
            if (event.key === 'Enter' && suggestions[0]) {
              event.preventDefault();
              selectFeature(suggestions[0]);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls="location-suggestions"
          placeholder="Search city, neighborhood or address"
          className="bg-slate-50/50 py-2.5 pl-10 pr-3.5 focus:border-indigo-500 focus:ring-0"
        />
      </div>
      {suggestions.length > 0 && (
        <ul id="location-suggestions" role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {suggestions.map((feature, index) => (
            <li key={`${feature.place_name}-${index}`} role="option" aria-selected="false">
              <Button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectFeature(feature)}
                variant="suggestion"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-indigo-600" />
                <InlineText>{feature.place_name}</InlineText>
              </Button>
            </li>
          ))}
        </ul>
      )}
      {loading && <Paragraph className="mt-1 text-xs text-slate-500">Searching locations…</Paragraph>}
      {status && <Paragraph className="mt-1 text-xs text-slate-500">{status}</Paragraph>}
    </div>
  );
}