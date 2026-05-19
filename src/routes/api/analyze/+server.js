import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function POST({ request }) {
  const { text } = await request.json();

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Analyze this text and return ONLY a valid JSON object, no markdown, no explanation:
{
  "style": {
    "academic": <0-100>,
    "formal": <0-100>,
    "casual": <0-100>,
    "humorous": <0-100>,
    "poetic": <0-100>,
    "persuasive": <0-100>,
    "narrative": <0-100>
  },
  "mood": {
    "happy": <0-100>,
    "anxious": <0-100>,
    "sad": <0-100>,
    "angry": <0-100>,
    "excited": <0-100>,
    "bored": <0-100>,
    "calm": <0-100>,
    "nostalgic": <0-100>
  }
}
Each value is a relative score 0-100 reflecting how strongly that quality appears.

Text:
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