import { useSyncExternalStore } from "react";

export interface Progress {
  key: string; // slug or slug:s1e2
  slug: string;
  position: number;
  duration: number;
  updatedAt: number;
}

interface LibraryState {
  watchlist: string[];
  progress: Record<string, Progress>;
  searches: string[];
  lastEpisodes: Record<string, { season: number; episode: number; updatedAt: number }>;
}

const KEY = "noirplay:library:v1";
const empty: LibraryState = { watchlist: [], progress: {}, searches: [], lastEpisodes: {} };
let state: LibraryState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...(JSON.parse(raw) as Partial<LibraryState>) };
  } catch {
    state = empty;
  }
}

function set(next: LibraryState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  l();
  return () => listeners.delete(l);
}

export function useLibrary(): LibraryState {
  return useSyncExternalStore(subscribe, () => state, () => empty);
}

export const library = {
  rememberEpisode(slug: string, season: number, episode: number) {
    load();
    set({ ...state, lastEpisodes: { ...state.lastEpisodes, [slug]: { season, episode, updatedAt: Date.now() } } });
  },
  toggleWatchlist(slug: string) {
    load();
    const has = state.watchlist.includes(slug);
    set({ ...state, watchlist: has ? state.watchlist.filter((s) => s !== slug) : [slug, ...state.watchlist] });
  },
  saveProgress(p: Omit<Progress, "updatedAt">) {
    load();
    set({ ...state, progress: { ...state.progress, [p.key]: { ...p, updatedAt: Date.now() } } });
  },
  getProgress(key: string): Progress | undefined {
    load();
    return state.progress[key];
  },
  clearHistory() {
    load();
    set({ ...state, progress: {}, lastEpisodes: {} });
  },
  addSearch(q: string) {
    load();
    const t = q.trim();
    if (!t) return;
    set({ ...state, searches: [t, ...state.searches.filter((s) => s !== t)].slice(0, 8) });
  },
  clearSearches() {
    load();
    set({ ...state, searches: [] });
  },
};

export const progressPct = (p?: Progress) => (p && p.duration > 0 ? Math.min(100, (p.position / p.duration) * 100) : 0);
