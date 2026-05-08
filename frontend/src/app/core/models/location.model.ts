// /api/get-location ka response
export interface Location {
  _id: string;
  location: string;
  city: string;
  state: string;
  stateShort: string;
  type: string;
}

// /api/get-zipcode ka response
export interface ZipcodeResult {
  _id: string;
  zip: string;
  primary_city: string;
  state: string;
  county: string;
}

// Har zipcode ke saath price
export interface ZipcodePricing {
  zipcode: string;
  isChecked: boolean;
  prices: {
    leads: number;
    warm_transfers: number;
    inbounds: number;
  };
}

// POST /api/location-pricing ka payload
export interface LocationPricingPayload {
  category_id: string;
  location: string;
  city: string;
  state: string;
  country: string | null;
  type: string;
  prices: {
    leads: number;
    warm_transfers: number;
    inbounds: number;
  };
  service_area_zipcodes: ZipcodePricing[];
  isChecked?: boolean;
}

export interface MultiLocationPricingPayload {
  category_id: string;
  locations: LocationPricingPayload[];
}
