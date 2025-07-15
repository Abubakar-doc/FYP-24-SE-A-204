declare module 'react-google-autocomplete' {
  import { ComponentType } from 'react';

  interface AutocompleteProps {
    apiKey: string;
    onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
    options: google.maps.places.AutocompletionRequest;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    placeholder?: string;
  }

  const Autocomplete: ComponentType<AutocompleteProps>;

  export default Autocomplete;
}
