import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: 'mock-key' });

// Step 1: Define your tools here
const tools: Anthropic.Tool[] = [
  {
    name: 'calculator',
    description: 'Evaluates a mathematical expression and returns a numerical result',
    input_schema: {
      type: 'object' as const,
      properties: {
        expression: {
          type: 'string',
          description: 'A mathematical expression. For example: "3 + 3"',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'web_search',
    description: 'Searches the web and returns relevant results to the users query',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'A users query such as "What is the weather right now?"',
        },
      },
      required: ['query'],
    },
  },
];

let callCount = 0;

async function mockCreate(_params: unknown): Promise<Anthropic.Message> {
  callCount++;

  if (callCount === 1) {
    return {
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'web_search',
          input: { query: 'current price of Bitcoin' },
        },
      ],
    } as unknown as Anthropic.Message;
  }

  if (callCount === 2) {
    return {
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          id: 'tool_2',
          name: 'calculator',
          input: { expression: '3.5 * 65000' },
        },
      ],
    } as unknown as Anthropic.Message;
  }

  return {
    stop_reason: 'end_turn',
    content: [
      {
        type: 'text',
        text: 'Based on the current Bitcoin price of $65,000, 3.5 coins would cost $227,500.',
      },
    ],
  } as unknown as Anthropic.Message;
}

async function runAgentLoop(userPrompt: string) {
  const MAX_ITERATIONS = 20;
  let count = 0;
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  while (true) {
    count++;
    if (count >= MAX_ITERATIONS) {
      console.warn('Cap reached - terminating loop');
      break;
    }

    // Call the client.messaged.create()
    const result = await mockCreate({ messages });
    // Tool Use
    if (result.stop_reason === 'tool_use') {
      const toolUseBlock = result.content.find((b) => b.type === 'tool_use');
      if (!toolUseBlock) continue;

      const toolRes = executeTool(toolUseBlock.name, toolUseBlock.input as Record<string, string>);

      console.log('TOOL: ', toolUseBlock.name);
      messages.push({ role: 'assistant', content: result.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUseBlock?.id ?? '', content: toolRes }],
      });
    }
    // Loop will check the stop_reason
    if (result.stop_reason === 'end_turn') {
      const textBlock = result.content.find((b) => b.type === 'text');
      return textBlock?.text ?? '';
    }
  }
  return 'Agent terminated by safety cap';
}

function executeTool(name: string, input: Record<string, string>): string {
  if (name === 'calculator' && input.expression) {
    try {
      return String(eval(input.expression));
    } catch {
      return 'Error: invalid expression';
    }
  }
  if (name === 'web_search') {
    return JSON.stringify({
      results: [{ title: 'Mock result', snippet: 'Bitcoin price: $65,000 USD' }],
    });
  }
  return 'Unknown tool';
}

runAgentLoop('Search for the current price of Bitcoin and calculate what 3.5 coins would cost')
  .then((result) => console.log('Final answer:', result))
  .catch(console.error);
