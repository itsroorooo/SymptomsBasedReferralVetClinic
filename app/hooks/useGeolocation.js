// hooks/useGeolocation.js
export default function useGeolocation() {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
  
    useEffect(() => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported');
        return;
      }
  
      setIsLoading(true);
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setIsLoading(false);
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          setIsLoading(false);
          setError(err.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
  
      return () => navigator.geolocation.clearWatch(watchId);
    }, []);
  
    return { position, error, isLoading };
  }