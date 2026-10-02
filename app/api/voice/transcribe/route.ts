import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gemini } from "@/lib/gemini";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Voice transcription isn't configured (missing GEMINI_API_KEY)." }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "No audio received." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: "Recording is too large." }, { status: 413 });

  const mime = (audio.type || "audio/webm").split(";")[0];
  const data = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const text = await gemini(
    [{ text: "Transcribe this audio exactly. Reply with only the transcript, no commentary." }, { inline_data: { mime_type: mime, data } }],
  );
  if (text === null) return NextResponse.json({ error: "Transcription failed. Try again." }, { status: 502 });
  return NextResponse.json({ text: text.trim() });
}
