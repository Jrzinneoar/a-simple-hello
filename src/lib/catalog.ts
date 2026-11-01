import { queryOptions } from "@tanstack/react-query";

/**
 * Catalog comes live from Cinemeta (free, no key, CORS open), which indexes IMDb.
 * Every title's slug is its IMDb id, which is exactly what the PlenoFlu embed needs.
 */
const API = "https://v3-cinemeta.strem.io";

export type SourceFormat = "mp4" | "hls";
export interface PlaybackSourceDef {
  id: string;
  provider: string;
  format: SourceFormat;
  url: string;
  quality?: string;
  license: string;
}

export type Kind = "movie" | "series";

export interface Episode { season: number; number: number; title: string; overview: string; image?: string; released?: string }
export interface Season { number: number; episodes: Episode[] }

export interface Title {
  slug: string; // IMDb id
  imdbId: string;
  kind: Kind;
  title: string;
  originalTitle: string;
  year: number;
  minutes?: number;
  genres: string[];
  country: string;
  language: string;
  director: string;
  cast: string[];
  rating?: string;
  overview: string;
  image: string;
  poster: string;
  sources: PlaybackSourceDef[];
  seasons?: Season[];
}

const GENRES: Record<string, string> = {
  Action: "Ação", Adventure: "Aventura", Animation: "Animação", Biography: "Biografia", Comedy: "Comédia",
  Crime: "Crime", Documentary: "Documentário", Drama: "Drama", Family: "Família", Fantasy: "Fantasia",
  History: "História", Horror: "Terror", Music: "Música", Musical: "Musical", Mystery: "Mistério",
  Romance: "Romance", "Sci-Fi": "Ficção científica", Sport: "Esporte", Thriller: "Suspense", War: "Guerra",
  Western: "Faroeste", "Reality-TV": "Reality", "Talk-Show": "Talk show", "Game-Show": "Game show", News: "Notícias",
};
/** Genres accepted by the Cinemeta catalog filter (English key → Portuguese label). */
export const genreList = Object.entries(GENRES).filter(([k]) => !["Musical", "Talk-Show", "Game-Show", "News", "Reality-TV"].includes(k));
export const genreLabel = (g: string) => GENRES[g] ?? g;

interface Meta {
  id?: string; imdb_id?: string; type: string; name: string; poster?: string; background?: string;
  releaseInfo?: string; year?: string; runtime?: string; genre?: string[]; genres?: string[];
  description?: string; country?: string; director?: string[] | null; cast?: string[]; imdbRating?: string;
  videos?: { season?: number; episode?: number; number?: number; name?: string; title?: string; overview?: string; description?: string; thumbnail?: string; released?: string }[];
}

export function toTitle(m: Meta): Title | null {
  const id = m.imdb_id ?? m.id;
  if (!id || !/^tt\d+$/.test(id)) return null;
  const poster = m.poster ?? `https://images.metahub.space/poster/medium/${id}/img`;
  const kind: Kind = m.type === "series" ? "series" : "movie";
  const t: Title = {
    slug: id, imdbId: id, kind, title: m.name, originalTitle: m.name,
    year: parseInt(m.releaseInfo ?? m.year ?? "", 10) || 0,
    genres: (m.genres ?? m.genre ?? []).map(genreLabel),
    country: m.country ?? "", language: "", director: (m.director ?? []).join(", "),
    cast: m.cast ?? [], overview: m.description ?? "",
    image: m.background ?? `https://images.metahub.space/background/medium/${id}/img`,
    poster, sources: [],
  };
  const min = parseInt(m.runtime ?? "", 10);
  if (min) t.minutes = min;
  if (m.imdbRating) t.rating = m.imdbRating;
  if (kind === "series" && m.videos?.length) {
    const map = new Map<number, Episode[]>();
    for (const v of m.videos) {
      const s = v.season ?? 0, n = v.episode ?? v.number ?? 0;
      if (!s || !n) continue; // skip specials
      const ep: Episode = { season: s, number: n, title: v.name ?? v.title ?? `Episódio ${n}`, overview: v.overview ?? v.description ?? "" };
      if (v.thumbnail) ep.image = v.thumbnail;
      if (v.released) ep.released = v.released;
      const episodes = map.get(s) ?? [];
      episodes.push(ep);
      map.set(s, episodes);
    }
    t.seasons = [...map.entries()].sort((a, b) => a[0] - b[0])
      .map(([number, eps]) => ({ number, episodes: eps.sort((a, b) => a.number - b.number) }));
  }
  return t;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`Falha ao carregar catálogo (${r.status})`);
  return r.json() as Promise<T>;
}

export type Sort = "top" | "year" | "imdbRating";

export async function fetchCatalog(kind: Kind, o: { sort?: Sort; genre?: string; skip?: number; search?: string } = {}) {
  const extra = [
    o.search ? `search=${encodeURIComponent(o.search)}` : "",
    o.genre ? `genre=${encodeURIComponent(o.genre)}` : "",
    o.skip ? `skip=${o.skip}` : "",
  ].filter(Boolean).join("&");
  const id = o.search ? "top" : o.sort ?? "top";
  const res = await getJson<{ metas?: Meta[] }>(`/catalog/${kind}/${id}${extra ? `/${extra}` : ""}.json`);
  const seen = new Set<string>();
  return (res.metas ?? []).map(toTitle).filter((t): t is Title => !!t && !seen.has(t.slug) && !!seen.add(t.slug));
}

export async function fetchTitle(id: string): Promise<Title | null> {
  if (!/^tt\d+$/.test(id)) return null;
  for (const kind of ["series", "movie"] as const) {
    const res = await getJson<{ meta?: Meta }>(`/meta/${kind}/${id}.json`).catch(() => ({ meta: undefined }));
    if (res.meta?.name && (res.meta.type ?? kind) === kind) return toTitle({ ...res.meta, type: kind });
  }
  return null;
}

export const titleQuery = (id: string) =>
  queryOptions({ queryKey: ["title", id], queryFn: () => fetchTitle(id), staleTime: 1000 * 60 * 60 });

export const catalogQuery = (kind: Kind, o: { sort?: Sort; genre?: string; search?: string } = {}) =>
  queryOptions({ queryKey: ["catalog", kind, o], queryFn: () => fetchCatalog(kind, o), staleTime: 1000 * 60 * 30 });

export function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Portuguese genre label → Cinemeta English key. */
export const genreKey = (label: string) => Object.entries(GENRES).find(([, v]) => v === label)?.[0];

export const searchQuery = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    enabled: q.trim().length > 1,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const [m, s] = await Promise.all([
        fetchCatalog("movie", { search: q }).catch(() => [] as Title[]),
        fetchCatalog("series", { search: q }).catch(() => [] as Title[]),
      ]);
      return [...m, ...s];
    },
  });
