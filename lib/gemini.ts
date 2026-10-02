const MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash"];

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

/** Calls Gemini, trying fallback models when one is overloaded or unavailable. Returns null on failure. */
export async function gemini(parts: Part[], opts: { system?: string; json?: boolean } = {}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(opts.system && { system_instruction: { parts: [{ text: opts.system }] } }),
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.2, ...(opts.json && { responseMimeType: "application/json" }) },
          }),
          signal: AbortSignal.timeout(30_000),
        });
        if (res.ok) {
          const data = await res.json();
          const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
          if (text) return text;
          break;
        }
        if (res.status === 503 || res.status === 429) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      } catch {
        break;
      }
    }
  }
  return null;
}
