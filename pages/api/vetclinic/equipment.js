import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Query the equipment table from Supabase
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, description')
        .order('name', { ascending: true });

      console.log('Supabase query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch equipment' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}