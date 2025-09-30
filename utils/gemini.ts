// utils/gemini.ts
// Utility to call Gemini AI API for personalized toolkit recommendations


// Set your Gemini API key in your environment as GEMINI_API_KEY (e.g., in .env or build config)
// Example .env:
// GEMINI_API_KEY=your-key-here
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBkmarMub5OToRrpfXbaTrHeQwIo3e0mC4';

export async function getPersonalizedToolkit(profile: any, disasterType?: string): Promise<string[]> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not set');

  let prompt = `You are an expert in climate disaster preparedness. Given the following user profile, recommend a personalized emergency toolkit. List only the most relevant items for this user.\n\nUser Profile:\n${JSON.stringify(profile, null, 2)}`;
  if (disasterType) {
    prompt += `\n\nA ${disasterType} is happening or imminent. Recommend a toolkit specifically for this disaster.`;
  }
  prompt += '\n\nReturn the toolkit as a JSON array of item names.';

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
  };

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.error('Gemini API error:', res.status, await res.text());
      throw new Error('Gemini API error');
    }
    const data = await res.json();
    console.log('Gemini API response:', data); // <-- LOG FULL RESPONSE
    // Try to extract JSON array from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      const match = text.match(/\[.*\]/s);
      if (match) return JSON.parse(match[0]);
    } catch (err) {
      console.error('Gemini JSON parse error:', err, text);
    }
    // fallback: return lines
    return text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  } catch (err) {
    console.error('Gemini API call failed:', err);
    return [];
  }
}
