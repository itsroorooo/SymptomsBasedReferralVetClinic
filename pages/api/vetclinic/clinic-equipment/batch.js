import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { clinic_id, equipment_ids } = req.body;

    if (!clinic_id || !Array.isArray(equipment_ids)) {
      return res.status(400).json({ error: "Clinic ID and equipment IDs are required" });
    }

    try {
      // First, delete any existing equipment for this clinic that's not in the new list
      const { error: deleteError } = await supabase
        .from("clinic_equipment")
        .delete()
        .eq("clinic_id", clinic_id)
        .not("equipment_id", "is", null)
        .not("equipment_id", "in", `(${equipment_ids.join(",")})`);

      if (deleteError) throw deleteError;

      // Get existing equipment_ids for this clinic to avoid duplicates
      const { data: existing } = await supabase
        .from("clinic_equipment")
        .select("equipment_id")
        .eq("clinic_id", clinic_id)
        .not("equipment_id", "is", null);

      const existingIds = existing?.map(item => item.equipment_id) || [];

      // Only insert new equipment that doesn't already exist
      const newEquipment = equipment_ids
        .filter(id => !existingIds.includes(id))
        .map(id => ({
          clinic_id,
          equipment_id: id,
          is_available: true
        }));

      if (newEquipment.length > 0) {
        const { data, error } = await supabase
          .from("clinic_equipment")
          .insert(newEquipment)
          .select();

        if (error) throw error;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving equipment selection:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}