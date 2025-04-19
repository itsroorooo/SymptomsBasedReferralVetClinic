export default async function handler(req, res) {
    const { address } = req.query;
  
    if (!address) {
      return res.status(400).json({ error: "Address parameter is required" });
    }
  
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Google API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== "OK") {
        return res.status(400).json({ 
          error: data.error_message || "Geocoding failed",
          status: data.status
        });
      }
      
      return res.status(200).json(data);
      
    } catch (error) {
      console.error("Geocoding error:", error);
      return res.status(500).json({ 
        error: "Geocoding failed",
        details: error.message 
      });
    }
  }