import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const formatPrompts = {
  report: 'Write a professional report based on these structured notes. Use formal tone.',
  journal: 'Write a reflective personal journal entry based on these notes. Use first person, thoughtful tone.',
  update: 'Write a concise team update (3-4 sentences max) based on these notes. Be direct and clear.'
};

export async function POST({ request }) {
  const { cards, format } = await request.json();

  const cardText = cards.map(c => `[${c.type.toUpperCase()}] ${c.content}`).join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${formatPrompts[format] ?? formatPrompts.report}

Here are the structured notes:
${cardText}

Return only the final text, no explanation.`
      }
    ]
  });

  return new Response(JSON.stringify({ text: message.content[0].text }), {
    headers: { 'Content-Type': 'application/json' }
  });
}