import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

export type MapTilerFeature = {
  place_name: string;
  text: string;
  place_type: string[];
  context?: { id: string; text: string }[];
};

export type LocationSelection = {
  city: string;
  area: string;
};

// MapTiler place_types that ARE the city itself (so the picked place is the city).
const CITY_PLACE_TYPES = new Set(['city', 'town', 'village', 'municipality', 'locality', 'county']);

// MapTiler context ids that represent a containing city. Note `place.` is a
// neighborhood/locality record (e.g. "Officers Colony"), NOT a city, so it is
// deliberately excluded here.
const CITY_CONTEXT_PREFIXES = ['municipality', 'joint_municipality', 'city', 'town', 'village', 'locality'];

// Rural picks (e.g. small villages) have no city parent. MapTiler reports a
// county (mandal/taluk) and subregion (district) instead — the same fallback
// chain the old Google implementation used (administrative_area_level_3/2).
const RURAL_CONTEXT_PREFIXES = ['county', 'subregion'];

function findContextText(feature: MapTilerFeature, ...typePrefixes: string[]) {
  return feature.context?.find((item) => typePrefixes.some((prefix) => item.id.startsWith(`${prefix}.`)))?.text;
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
  const city =
    (isCityFeature ? feature.text : undefined) ??
    findContextText(feature, ...CITY_CONTEXT_PREFIXES) ??
    findContextText(feature, ...RURAL_CONTEXT_PREFIXES);
  if (!city) return null;
  const area = feature.text && feature.text !== city ? feature.text : city;
  return { city, area };
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
      <label htmlFor="location-search" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
        Search a place
      </label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
        />
      </div>
      {suggestions.length > 0 && (
        <ul id="location-suggestions" role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {suggestions.map((feature, index) => (
            <li key={`${feature.place_name}-${index}`} role="option" aria-selected="false">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectFeature(feature)}
                className="flex min-h-11 w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-indigo-600" />
                <span>{feature.place_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && <p className="mt-1 text-xs text-slate-500">Searching locations…</p>}
      {status && <p className="mt-1 text-xs text-slate-500">{status}</p>}
    </div>
  );
}