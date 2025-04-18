import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { clinic_id } = req.query;

    // Validate required fields
    if (!clinic_id) {
      return res.status(400).json({ error: "Clinic ID is required" });
    }

    try {
      // Fetch clinic-specific equipment
      const { data, error } = await supabase
        .from("clinic_equipment")
        .select("id, equipment_name, equipment_description, is_available")
        .eq("clinic_id", clinic_id);

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching clinic equipment:", error);
      res.status(500).json({ error: error.message || "Failed to fetch clinic equipment" });
    }
  } else if (req.method === "POST") {
    const { clinic_id, equipment_name, equipment_description, is_available } = req.body;

    // Validate required fields
    if (!clinic_id || !equipment_name) {
      return res.status(400).json({ error: "Clinic ID and Equipment Name are required" });
    }

    try {
      // Insert new equipment into the clinic_equipment table
      const { data, error } = await supabase
        .from("clinic_equipment")
        .insert({
          clinic_id,
          equipment_name,
          equipment_description: equipment_description || null,
          is_available,
        })
        .select();

      if (error) throw error;

      res.status(200).json(data[0]);
    } catch (error) {
      console.error("Error saving custom equipment:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}