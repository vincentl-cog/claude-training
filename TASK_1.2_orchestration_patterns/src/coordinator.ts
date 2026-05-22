import { webSearchAgent, docAnalysisAgent, SubagentDefinition, SubagentResult } from './subagents';
import { mockApiCall } from './mockClient';

export interface CoverageReport {
  covered: string[];
  gaps: string[];
  completeness: number;
}

const coordinator = {
  systemPrompt:
    'You are a research coordinator. Decompose topics into comprehensive subtopics, delegate to specialist subagents, aggregate results, and identify coverage gaps.',
  subagents: [webSearchAgent, docAnalysisAgent],

  async decompose(topic: string): Promise<string[]> {
    const prompt = `List all major subtopics for: "${topic}". Return as a JSON array of strings.`;
    const response = await mockApiCall(prompt);

    const validationPrompt = `Keeping in mind the original topic : ${topic} . Perform a comprehensive analysis and ensure that 
    there are no missing subtopics from this list: ${response} . Return as a JSON
    array with no missing or invalid topics.`;
    const validatedResponse = await mockApiCall(validationPrompt);

    return JSON.parse(validatedResponse) as string[];
  },
  async delegate(
    subagent: SubagentDefinition,
    subtopic: string,
    broaderGoal: string,
    priorFindings: string[] = [],
  ): Promise<SubagentResult> {
    const priorContext =
      priorFindings.length > 0
        ? `Prior findings from other subtopics:\n${priorFindings.join('\n')}`
        : 'No prior findings yet.';

    // Every piece of context the subagent needs is passed explicitly here.
    // The subagent has no memory of previous calls — this prompt is its entire world.
    const prompt = `
You are a ${subagent.name}.
${subagent.description}

Broader research goal: ${broaderGoal}
Your assigned subtopic: ${subtopic}
${priorContext}

Research this subtopic thoroughly in the context of the broader goal.
Return your findings in this exact format:
${subagent.outputFormat}
  `.trim();

    const response = await mockApiCall(prompt);
    const parsed = JSON.parse(response);

    return {
      subtopic,
      agentName: subagent.name,
      findings: parsed.findings,
      sources: parsed.sources,
      keyPoints: parsed.keyPoints,
    };
  },

  async evaluateCoverage(subtopics: string[], results: SubagentResult[]): Promise<CoverageReport> {
    const covered = subtopics.filter((subtopic) =>
      results.some((r) => r.subtopic === subtopic && r.findings.trim().length > 0),
    );

    const gaps = subtopics.filter((subtopic) => !covered.includes(subtopic));

    return {
      covered,
      gaps,
      completeness: covered.length / subtopics.length,
    };
  },

  async refine(
    subtopics: string[],
    allResults: SubagentResult[],
    broaderGoal: string,
    threshold = 0.9,
    maxIterations = 3,
  ): Promise<SubagentResult[]> {
    let coverage = await this.evaluateCoverage(subtopics, allResults);
    let iterations = 0;

    while (coverage.completeness < threshold && iterations < maxIterations) {
      console.log(`\n[Coordinator] Refinement iteration ${iterations + 1}`);
      console.log(
        `[Coordinator] Coverage at ${(coverage.completeness * 100).toFixed(0)}% — gaps: ${coverage.gaps.join(', ')}`,
      );

      for (const gap of coverage.gaps) {
        const priorFindings = allResults.map((r) => `${r.subtopic}: ${r.findings}`);
        const result = await this.delegate(webSearchAgent, gap, broaderGoal, priorFindings);
        allResults.push(result);
      }

      coverage = await this.evaluateCoverage(subtopics, allResults);
      iterations++;
    }

    console.log(`\n[Coordinator] Refinement complete after ${iterations} iteration(s)`);
    console.log(`[Coordinator] Final coverage: ${(coverage.completeness * 100).toFixed(0)}%`);

    return allResults;
  },

  async research(topic: string): Promise<void> {
    console.log(`\n[Coordinator] Starting research: "${topic}"`);

    const subtopics = await this.decompose(topic);
    console.log(`[Coordinator] Subtopics identified:`, subtopics);

    const initialResults: SubagentResult[] = [];
    for (let i = 0; i < subtopics.length; i++) {
      const subagent = i % 2 === 0 ? webSearchAgent : docAnalysisAgent;
      const priorFindings = initialResults.map((r) => `${r.subtopic}: ${r.findings}`);
      const result = await this.delegate(subagent, subtopics[i], topic, priorFindings);
      initialResults.push(result);
      console.log(`[Coordinator] Received findings for: "${result.subtopic}"`);
    }

    const finalResults = await this.refine(subtopics, initialResults, topic);

    const coverage = await this.evaluateCoverage(subtopics, finalResults);
    console.log(`\n[Coordinator] Coverage: ${(coverage.completeness * 100).toFixed(0)}%`);
    console.log(`[Coordinator] Gaps remaining:`, coverage.gaps);
  },
};

export default coordinator;
