import { coachPrompt, parseCoach, parseWeek } from '@/lib/coach';

// A small, fast model is plenty for three tips; it answers in about ten seconds.
const MODEL = 'gemini-3.5-flash-lite';
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    headline: { type: 'STRING' },
    tips: {
      type: 'ARRAY',
      minItems: 3,
      maxItems: 3,
      items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, body: { type: 'STRING' } }, required: ['title', 'body'] },
    },
  },
  required: ['headline', 'tips'],
};
// Every call is paid by this server's key, so one address gets a few coachings an hour.
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const calls = new Map<string, number[]>();

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** Turns a week of rounded totals into a headline and three tips. Nothing is stored here. */
export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fail('Coach belum disetel di server ini.', 503);

  const now = Date.now();
  for (const [ip, times] of calls) if (now - times[times.length - 1] > WINDOW_MS) calls.delete(ip);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const recent = (calls.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return fail('Coach udah dipakai beberapa kali barusan. Coba lagi sejam lagi.', 429);

  const raw = await req.text();
  if (raw.length > 4000) return fail('Ringkasannya kepanjangan.', 413);
  let week = null;
  try {
    week = parseWeek(JSON.parse(raw));
  } catch {}
  if (!week) return fail('Ringkasannya nggak kebaca.', 400);
  calls.set(ip, [...recent, now]);

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: coachPrompt(week) }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json', responseSchema: SCHEMA },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = await res.json();
    const coach = res.ok ? parseCoach(body.candidates?.[0]?.content?.parts?.[0]?.text ?? '') : null;
    if (!coach) return fail('Coach lagi nggak bisa jawab. Coba lagi sebentar lagi.', 502);
    return Response.json(coach);
  } catch {
    return fail('Coach lagi nggak bisa dihubungi. Coba lagi sebentar lagi.', 502);
  }
}
