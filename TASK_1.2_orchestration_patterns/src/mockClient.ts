// src/mockClient.ts

export async function mockApiCall(prompt: string): Promise<string> {
  console.log(`[MockClient] Received prompt:\n${prompt}\n`);

  // Phase 1 — initial decomposition
  if (prompt.includes('List all major subtopics')) {
    return JSON.stringify([
      'Solar energy',
      'Wind energy',
      'Geothermal energy',
      'Tidal energy',
      'Biomass energy',
      'Nuclear fusion',
    ]);
  }

  // Phase 2 — validation and gap filling
  if (prompt.includes('ensure that') && prompt.includes('missing subtopics')) {
    return JSON.stringify([
      'Solar energy',
      'Wind energy',
      'Geothermal energy',
      'Tidal energy',
      'Biomass energy',
      'Nuclear fusion',
      'Hydropower',
    ]);
  }

  // Subagent delegation — extract subtopic from prompt and return findings
  const subtopicMatch = prompt.match(/Your assigned subtopic: (.+)/);
  const subtopic = subtopicMatch ? subtopicMatch[1].trim() : 'Unknown';

  const findingsMap: Record<string, object> = {
    'Solar energy': {
      subtopic: 'Solar energy',
      findings:
        'Solar PV capacity exceeded 1 terawatt globally in 2023. Costs have fallen 90% over the last decade, making it the cheapest electricity source in history.',
      sources: ['https://iea.org/solar', 'https://irena.org/solar'],
    },
    'Wind energy': {
      subtopic: 'Wind energy',
      findings:
        'Offshore wind is expanding rapidly, with turbines now exceeding 15MW capacity. Wind supplies over 20% of electricity in the UK and Germany.',
      keyPoints: ['Offshore wind costs falling', 'Capacity factors above 50% offshore'],
    },
    'Geothermal energy': {
      subtopic: 'Geothermal energy',
      findings:
        'Enhanced geothermal systems (EGS) are unlocking geothermal potential beyond volcanic regions. Iceland and Kenya lead in geothermal as a percentage of national supply.',
      sources: ['https://energy.gov/geothermal'],
    },
    'Tidal energy': {
      subtopic: 'Tidal energy',
      findings:
        "Tidal stream technology is pre-commercial but highly predictable. The MeyGen project in Scotland is the world's largest tidal array.",
      keyPoints: ['Predictable generation', 'High capital costs remain a barrier'],
    },
    'Biomass energy': {
      subtopic: 'Biomass energy',
      findings:
        'Biomass provides dispatchable renewable power and heat. Sustainability of feedstocks is a key concern, particularly for dedicated energy crops.',
      sources: ['https://irena.org/biomass'],
    },
    'Nuclear fusion': {
      subtopic: 'Nuclear fusion',
      findings:
        'NIF achieved ignition in 2022. Commercial fusion remains 10–20 years away, but private investment has surged past $6 billion globally.',
      keyPoints: ['NIF ignition milestone', 'Private sector investment accelerating'],
    },
    Hydropower: {
      subtopic: 'Hydropower',
      findings:
        'Hydropower is the largest source of renewable electricity globally, supplying 16% of world electricity. Pumped hydro dominates grid-scale energy storage.',
      sources: ['https://iea.org/hydro'],
    },
  };

  const fallback = {
    subtopic,
    findings: `Detailed findings for ${subtopic} in the context of renewable energy technologies.`,
    sources: ['https://example.com'],
  };

  return JSON.stringify(findingsMap[subtopic] ?? fallback);
}
