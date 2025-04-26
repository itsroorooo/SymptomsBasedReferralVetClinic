import stringSimilarity from 'string-similarity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!req.body || !req.body.aiEquipmentNames || !req.body.dbEquipments) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const { aiEquipmentNames, dbEquipments } = req.body;

  try {
    // Find ALL possible matches for each AI equipment name
    const allMatches = aiEquipmentNames.map(aiName => {
      // First check for exact matches (case insensitive)
      const exactMatches = dbEquipments.filter(
        eq => eq.name.toLowerCase() === aiName.toLowerCase()
      );

      if (exactMatches.length > 0) {
        return {
          aiName,
          matches: exactMatches.map(match => ({
            name: match.name,
            clinicId: match.clinicId,
            equipmentId: match.equipmentId,
            isExactMatch: true,
            similarity: 1
          }))
        };
      }

      // If no exact matches, find similar ones
      const similarItems = dbEquipments.map(eq => ({
        ...eq,
        similarity: stringSimilarity.compareTwoStrings(
          aiName.toLowerCase(),
          eq.name.toLowerCase()
        )
      }))
      .filter(eq => eq.similarity > 0.6) // Adjust threshold as needed
      .sort((a, b) => b.similarity - a.similarity);

      return {
        aiName,
        matches: similarItems.map(item => ({
          name: item.name,
          clinicId: item.clinicId,
          equipmentId: item.equipmentId,
          isExactMatch: false,
          similarity: item.similarity
        }))
      };
    });

    res.status(200).json(allMatches);
  } catch (error) {
    console.error('Error in match-equipment API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
}