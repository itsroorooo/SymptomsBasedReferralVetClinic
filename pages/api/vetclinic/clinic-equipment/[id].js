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
      const { is_available } = req.body;

      // First, get the current equipment to verify it exists
      const { data: existingEquipment, error: fetchError } = await supabase
        .from("clinic_equipment")
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update only the is_available field for standard equipment
      const { data, error } = await supabase
        .from("clinic_equipment")
        .update({ is_available })
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Equipment not found after update");
      }

      // Return the full updated equipment record
      res.status(200).json(data[0]);
    } catch (error) {
      console.error("Error updating equipment availability:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["DELETE", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}