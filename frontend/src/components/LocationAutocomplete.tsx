import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

type AddressComponent = {
  longText: string;
  types: string[];
};

type Place = {
  addressComponents?: AddressComponent[];
  formattedAddress?: string;
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};

type PlacePrediction = {
  text: { toString: () => string };
  toPlace: () => Place;
};

type PlaceSuggestion = { placePrediction?: PlacePrediction };

type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedPrimaryTypes: string[];
    }) => Promise<{ suggestions: PlaceSuggestion[] }>;
  };
};

type LocationSelection = {
  city: string;
  area: string;
};

type GoogleMapsApi = {
  maps: {
    importLibrary: (name: string) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let googleMapsScript: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (googleMapsScript) return googleMapsScript;

  googleMapsScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleMapsScript = null;
      reject(new Error('Google location search could not load.'));
    };
    document.head.appendChild(script);
  });

  return googleMapsScript;
}

function findAddressComponent(components: AddressComponent[], ...types: string[]) {
  return components.find((component) => types.some((type) => component.types.includes(type)))?.longText;
}

export default function LocationAutocomplete({ onSelect }: { onSelect: (location: LocationSelection) => void }) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<PlacesLibrary | null>(null);
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const selectedPlaceQuery = useRef<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus('Add a Google Maps API key to enable suggestions; City and Area can still be entered manually.');
      return;
    }

    let active = true;
    void loadGoogleMaps(apiKey)
      .then(() => window.google?.maps.importLibrary('places'))
      .then((library) => {
        if (active && library) setPlaces(library as PlacesLibrary);
      })
      .catch((error: unknown) => {
        if (active) setStatus(error instanceof Error ? error.message : 'Location suggestions are unavailable.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (selectedPlaceQuery.current === query) {
      selectedPlaceQuery.current = null;
      setSuggestions([]);
      setLoading(false);
      return;
    }
    if (!places || trimmedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    let active = true;
    setLoading(true);
    const timeout = window.setTimeout(() => {
      void places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmedQuery,
        includedPrimaryTypes: ['geocode'],
      })
        .then(({ suggestions: results }) => {
          if (active) {
            setSuggestions(results.flatMap((result) => result.placePrediction ? [result.placePrediction] : []));
            setStatus('');
          }
        })
        .catch(() => {
          if (active) setStatus('Could not load location suggestions. You can still enter City and Area manually.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [places, query]);

  const selectPrediction = async (prediction: PlacePrediction) => {
    setLoading(true);
    setStatus('');
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
      const components = place.addressComponents ?? [];
      const city = findAddressComponent(components, 'locality', 'postal_town', 'administrative_area_level_3', 'administrative_area_level_2');
      const area = findAddressComponent(components, 'sublocality_level_1', 'neighborhood', 'sublocality', 'administrative_area_level_4', 'administrative_area_level_3') ?? city;

      if (!city || !area) {
        setStatus('Could not map that place to a City and Area. Please fill them in manually.');
        return;
      }

      onSelect({ city, area });
      const placeQuery = place.formattedAddress ?? prediction.text.toString();
      selectedPlaceQuery.current = placeQuery;
      setQuery(placeQuery);
      setSuggestions([]);
    } catch {
      setStatus('Could not read that place. Please enter City and Area manually.');
    } finally {
      setLoading(false);
    }
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
              void selectPrediction(suggestions[0]);
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
          {suggestions.map((prediction, index) => (
            <li key={`${prediction.text.toString()}-${index}`} role="option" aria-selected="false">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectPrediction(prediction)}
                className="flex min-h-11 w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-indigo-600" />
                <span>{prediction.text.toString()}</span>
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