import { useEffect, useState } from "react";

/**
 * Browser-side PT-BR translation of catalog text (synopses, episode names).
 * Uses Google's public translate endpoint, falls back to MyMemory, caches in localStorage.
 * Returns the original text until (or if never) a translation arrives.
 */
const KEY = "noir:tr:";
const mem = new Map<string, Promise<string>>();

async function google(text: string) {
  const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
  if (!r.ok) throw new Error("google");
  const j = (await r.json()) as [Array<[string]>];
  return j[0].map((p) => p[0]).join("");
}
async function mymemory(text: string) {
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=en|pt-BR&mt=1`);
  const j = (await r.json()) as { responseData?: { translatedText?: string } };
  const out = j.responseData?.translatedText;
  if (!out || /MYMEMORY WARNING/i.test(out)) throw new Error("mymemory");
  return out;
}

export function translatePt(text: string): Promise<string> {
  const k = KEY + text.slice(0, 200);
  const cached = localStorage.getItem(k);
  if (cached) return Promise.resolve(cached);
  let p = mem.get(k);
  if (!p) {
    p = google(text).catch(() => mymemory(text)).then((out) => { try { localStorage.setItem(k, out); } catch { /* full */ } return out; }).catch(() => text);
    mem.set(k, p);
  }
  return p;
}

export function usePt(text: string | undefined): string {
  const [out, setOut] = useState(text ?? "");
  useEffect(() => {
    setOut(text ?? "");
    if (!text || text.length < 3) return;
    let off = false;
    translatePt(text).then((v) => !off && setOut(v));
    return () => { off = true; };
  }, [text]);
  return out;
}

export function Pt({ text }: { text: string | undefined }) {
  return <>{usePt(text)}</>;
}
