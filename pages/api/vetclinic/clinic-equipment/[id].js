import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("clinic_equipment")
        .delete()
        .eq("id", id);

      if (error) throw error;

      res.status(200).json({ message: "Equipment deleted successfully" });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PATCH") {
    try {
      const { equipment_name, equipment_description, is_available } = req.body;

      // Validate required fields
      if (!equipment_name) {
        return res.status(400).json({ error: "Equipment name is required" });
      }

      const { data, error } = await supabase
        .from("clinic_equipment")
        .update({
          equipment_name,
          equipment_description: equipment_description || null,
          is_available
        })
        .eq("id", id)
        .select();

      if (error) throw error;

      res.status(200).json(data[0]);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["DELETE", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}