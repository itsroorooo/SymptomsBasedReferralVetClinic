import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  const { clinicId } = req.query;

  if (!clinicId) {
    return res.status(400).json({ error: "Missing clinicId parameter" });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("veterinary_schedules")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("day_of_week", { ascending: true });

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    } 
    else if (req.method === "POST") {
      const { schedule } = req.body;

      if (!schedule || !Array.isArray(schedule)) {
        return res.status(400).json({ error: "Invalid schedule data" });
      }

      // Prepare the data for upsert
      const scheduleData = schedule.map(item => ({
        clinic_id: clinicId,
        day_of_week: item.day_of_week,
        opening_time: item.is_closed ? null : item.opening_time,
        closing_time: item.is_closed ? null : item.closing_time,
        is_closed: item.is_closed
      }));

      const { data, error } = await supabase
        .from("veterinary_schedules")
        .upsert(scheduleData, { onConflict: "clinic_id,day_of_week" })
        .select();

      if (error) {
        throw error;
      }

      return res.status(200).json(data || { message: "Schedule updated successfully" });
    } 
    else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Schedule API error:", error);
    return res.status(500).json({ 
      error: error.message || "Internal server error",
      details: error.details || null
    });
  }
}