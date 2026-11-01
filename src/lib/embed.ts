import type { Title } from "./catalog";

/** Builds the WarezCDN embed URL: /filme/{id} or /serie/{id}/{season}/{episode}. */
export function embedFor(t: Pick<Title, "kind" | "imdbId">, season = 1, episode = 1): string | undefined {
  if (!t.imdbId) return undefined;
  return t.kind === "movie"
    ? `https://warezcdn.sbs/filme/${t.imdbId}`
    : `https://warezcdn.sbs/serie/${t.imdbId}/${season}/${episode}`;
}
