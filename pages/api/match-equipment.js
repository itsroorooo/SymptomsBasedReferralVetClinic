import stringSimilarity from 'string-similarity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { aiEquipmentNames, dbEquipments } = req.body;

    if (!aiEquipmentNames || !dbEquipments) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('Received matching request:', {
      aiEquipmentCount: aiEquipmentNames.length,
      dbEquipmentCount: dbEquipments.length
    });

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
            similarity: 1,
            isCustom: match.isCustom || false
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
      .filter(eq => eq.similarity > 0.4) // Lowered threshold for better matching
      .sort((a, b) => b.similarity - a.similarity);

      return {
        aiName,
        matches: similarItems.map(item => ({
          name: item.name,
          clinicId: item.clinicId,
          equipmentId: item.equipmentId,
          isExactMatch: false,
          similarity: item.similarity,
          isCustom: item.isCustom || false
        }))
      };
    });

    console.log('Generated matches:', allMatches);
    res.status(200).json(allMatches);
  } catch (error) {
    console.error('Error in match-equipment API:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}