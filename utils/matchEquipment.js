// utils/matchEquipment.js
import stringSimilarity from 'string-similarity'

export function matchEquipment(aiNames, dbEquipments) {
  return aiNames.map((aiName) => {
    const bestMatch = stringSimilarity.findBestMatch(
      aiName.toLowerCase(),
      dbEquipments.map((eq) => eq.name.toLowerCase())
    )

    const matchedName = bestMatch.bestMatch.target
    const dbMatch = dbEquipments.find(
      (eq) => eq.name.toLowerCase() === matchedName
    )

    return {
      aiName,
      matched: dbMatch ? {
        name: dbMatch.name,
        clinicId: dbMatch.clinicId
      } : null
    }
  })
}