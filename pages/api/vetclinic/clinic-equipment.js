import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { clinic_id } = req.query;

    if (!clinic_id) {
      return res.status(400).json({ error: "Clinic ID is required" });
    }

    try {
      // Fetch all clinic equipment (both standard and custom)
      const { data, error } = await supabase
        .from("clinic_equipment")
        .select(`
          id,
          clinic_id,
          equipment_id,
          equipment_name,
          equipment_description,
          is_available,
          created_at,
          updated_at,
          equipment:equipment_id (id, name, description)
        `)
        .eq("clinic_id", clinic_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format the data to combine equipment info
      const formattedData = data.map(item => ({
        ...item,
        equipment_name: item.equipment_name || item.equipment?.name,
        equipment_description: item.equipment_description || item.equipment?.description,
        is_standard: !!item.equipment_id
      }));

      res.status(200).json(formattedData);
    } catch (error) {
      console.error("Error fetching clinic equipment:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    // ... (keep the existing POST handler for custom equipment)
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}