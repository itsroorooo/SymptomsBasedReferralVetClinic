export const googleMapsConfig = {
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'], // Always include all needed libraries
    version: 'weekly',
  };