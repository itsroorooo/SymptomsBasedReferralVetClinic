import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  const { clinicId } = req.query;

  if (!clinicId) {
    return res.status(400).json({ error: "Missing clinicId parameter" });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("veterinary_holidays")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("holiday_date", { ascending: true });

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    } 
    else if (req.method === "POST") {
        const { holidays } = req.body;
        const clinicIdFromBody = req.body.clinicId || clinicId; // Use body or query param
      
        if (!clinicIdFromBody) {
          return res.status(400).json({ error: "Missing clinicId" });
        }

      // First delete all existing holidays for this clinic
      const { error: deleteError } = await supabase
        .from("veterinary_holidays")
        .delete()
        .eq("clinic_id", clinicId);

      if (deleteError) {
        throw deleteError;
      }

      // Only insert if there are holidays to add
      if (holidays.length > 0) {
        // Prepare the data for insert
        const holidaysData = holidays.map(item => ({
          clinic_id: clinicId,
          holiday_date: item.holiday_date,
          reason: item.reason
        }));

        const { data, error: insertError } = await supabase
          .from("veterinary_holidays")
          .insert(holidaysData)
          .select();

        if (insertError) {
          throw insertError;
        }

        return res.status(200).json(data);
      }

      return res.status(200).json({ message: "Holidays updated successfully" });
    } 
    else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Holidays API error:", error);
    return res.status(500).json({ 
      error: error.message || "Internal server error",
      details: error.details || null
    });
  }
}