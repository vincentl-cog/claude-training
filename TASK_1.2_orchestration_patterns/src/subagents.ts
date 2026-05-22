// src/subagents.ts

export interface SubagentDefinition {
  name: string;
  description: string;
  outputFormat: string;
}

export interface SubagentResult {
  subtopic: string;
  agentName: string;
  findings: string;
  sources?: string[];
  keyPoints?: string[];
}

export const webSearchAgent: SubagentDefinition = {
  name: 'Web Search Agent',
  description:
    'Searches for current information, news, and recent developments on a given subtopic.',
  outputFormat: 'JSON with fields: subtopic (string), findings (string), sources (string[])',
};

export const docAnalysisAgent: SubagentDefinition = {
  name: 'Document Analysis Agent',
  description: 'Analyses technical documents and research papers on a given subtopic.',
  outputFormat: 'JSON with fields: subtopic (string), findings (string), keyPoints (string[])',
};
