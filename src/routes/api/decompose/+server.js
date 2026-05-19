import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function POST({ request }) {
  const { text } = await request.json();

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a writing assistant. Decompose the following text into structured cards.
Return ONLY a JSON array with exactly this format, no other text:
[
  {"type": "priority", "content": "..."},
  {"type": "summary", "content": "..."},
  {"type": "reflection", "content": "..."}
]

Text to decompose:
${text}`
      }
    ]
  });

  const raw = message.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(raw);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}