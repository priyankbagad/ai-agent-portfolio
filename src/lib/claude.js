import { searchKnowledge } from './embeddings';

export async function askClaude(messages) {
  const latestMessage =
    [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  let context = '';
  try {
    if (latestMessage) context = await searchKnowledge(latestMessage);
  } catch (e) {
    context = '';
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: `You are an AI agent representing Priyank Bagad.
Answer all questions in first person on his behalf.

Here is the most relevant information about Priyank 
for this question:
${context}

Use this information to give accurate, specific answers.
Keep responses warm, conversational, 3-4 sentences max.`,
      messages: messages,
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}
