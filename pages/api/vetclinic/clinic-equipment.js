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
          is_custom,
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
        is_standard: !item.is_custom // This should match your database logic
      }));

      res.status(200).json(formattedData);
    } catch (error) {
      console.error("Error fetching clinic equipment:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    const { clinic_id, equipment_name, equipment_description, is_available } = req.body;

    if (!clinic_id || !equipment_name) {
      return res.status(400).json({ 
        error: "Clinic ID and equipment name are required" 
      });
    }

    try {
      // Insert custom equipment with explicit NULL equipment_id and is_custom=true
      const { data, error } = await supabase
        .from("clinic_equipment")
        .insert([{
          clinic_id,
          equipment_id: null, // Explicitly set to NULL for custom equipment
          equipment_name,
          equipment_description: equipment_description || null,
          is_available: is_available !== false, // default to true
          is_custom: true // Explicitly mark as custom
        }])
        .select(); // Return the inserted record

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Failed to create equipment - no data returned");
      }

      // Return the newly created equipment with is_standard flag
      res.status(201).json({ 
        ...data[0],
        is_standard: false 
      });
    } catch (error) {
      console.error("Error creating custom equipment:", error);
      res.status(500).json({ 
        error: error.message || "Failed to create custom equipment",
        details: error.details || null
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}