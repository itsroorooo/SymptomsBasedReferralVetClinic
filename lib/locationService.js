const API_BASE = 'https://ph-locations-api.buonzz.com/v1';

export const getRegions = async () => {
    try {
      console.log("Fetching regions from:", `${API_BASE}/regions`);
      const response = await fetch(`${API_BASE}/regions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch regions: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Regions fetched successfully:", data);
      return data.data.map(region => ({
        id: region.id,
        name: region.name,
        region_name: region.name,
      }));
    } catch (error) {
      console.error("Error fetching regions:", error);
      throw error;
    }
  };

export async function getProvinces(regionId) {
  const response = await fetch(`${API_BASE}/provinces?region_id=${regionId}`);
  const data = await response.json();
  return data.data.map(province => ({
    id: province.id,
    name: province.name,
    province_name: province.name
  }));
}

export async function getCities(provinceId) {
  const response = await fetch(`${API_BASE}/cities?province_id=${provinceId}`);
  const data = await response.json();
  return data.data.map(city => ({
    id: city.id,
    name: city.name,
    city_name: city.name,
    zip_code: city.zip_code || '' 
  }));
}