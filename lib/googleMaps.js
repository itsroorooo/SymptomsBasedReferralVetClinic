export const loadGoogleMaps = () => {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }
  
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      document.head.appendChild(script);
    });
  };