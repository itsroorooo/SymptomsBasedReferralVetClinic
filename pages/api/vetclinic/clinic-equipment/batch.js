import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { clinic_id, equipment_ids } = req.body;

    // Validate required fields
    if (!clinic_id || !Array.isArray(equipment_ids) || equipment_ids.length === 0) {
      return res.status(400).json({ error: "Clinic ID and equipment IDs are required" });
    }

    try {
      const { data, error } = await supabase
        .from("clinic_equipment")
        .insert(
          equipment_ids.map((id) => ({
            clinic_id,
            equipment_id: id,
          }))
        )
        .select();

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error("Error saving equipment selection:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}