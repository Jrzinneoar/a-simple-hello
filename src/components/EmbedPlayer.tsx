import { Pt } from "@/lib/translate";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, SkipForward, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Title } from "@/lib/catalog";
import { embedFor } from "@/lib/embed";
import { cn } from "@/lib/utils";
import { library, progressPct, useLibrary } from "@/lib/library";
import { Button } from "@/components/ui/button";

interface TvEpisode { season: number; number: number; name: string; summary?: string; image?: { medium: string }; airdate?: string }
const plainText = (html?: string) => (html ?? "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/** Loads the real episode list of a series from TVmaze using its IMDb id. */
function useEpisodes(imdbId?: string, enabled = true) {
  const [eps, setEps] = useState<TvEpisode[] | null>(null);
  useEffect(() => {
    if (!imdbId || !enabled) return;
    setEps(null);
    let off = false;
    fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((show: { id: number }) => fetch(`https://api.tvmaze.com/shows/${show.id}/episodes`))
      .then((r) => r.json())
      .then((list: TvEpisode[]) => !off && setEps(list.filter((e) => e.number)))
      .catch(() => !off && setEps([]));
    return () => { off = true; };
  }, [imdbId, enabled]);
  return eps;
}

export function EmbedPlayer({ t, season, episode }: { t: Title; season: number; episode: number }) {
  const isSeries = t.kind === "series";
  const eps = useEpisodes(t.imdbId, isSeries);
  const { progress } = useLibrary();
  const progressKey = `${t.slug}:s${season}e${episode}`;
  const completed = progressPct(progress[progressKey]) >= 95;
  useEffect(() => {
    if (isSeries) library.rememberEpisode(t.slug, season, episode);
  }, [t.slug, isSeries, season, episode]);
  const src = embedFor(t, season, episode);
  const seasons = [...new Set((eps ?? []).map((e) => e.season))];
  const inSeason = (eps ?? []).filter((e) => e.season === season);
  const idx = (eps ?? []).findIndex((e) => e.season === season && e.number === episode);
  const prev = eps && idx > 0 ? eps[idx - 1] : undefined;
  const next = eps && idx >= 0 ? eps[idx + 1] : undefined;
  const current = eps && idx >= 0 ? eps[idx] : undefined;
  const fallback = t.seasons?.find((s) => s.number === season)?.episodes.find((e) => e.number === episode);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);
  const goNext = () => {
    library.saveProgress({ key: progressKey, slug: t.slug, position: 1, duration: 1 });
    if (next) navigate({ to: "/assistir/$slug", params: { slug: t.slug }, search: { s: next.season, ep: next.number } });
  };
  // Reset countdown when episode changes.
  useEffect(() => setCountdown(null), [season, episode]);
  // Best-effort: some players announce the end of the video via postMessage.
  useEffect(() => {
    if (!isSeries) return;
    const onMsg = (ev: MessageEvent) => {
      if (!String(ev.origin).includes("warezcdn")) return;
      const raw = typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data ?? "");
      if (/\b(ended|complete|completed|finish|finished)\b/i.test(raw)) setCountdown((c) => c ?? 10);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [isSeries]);
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { goNext(); return; }
    const id = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);
  const description = plainText(current?.summary) || fallback?.overview || (isSeries ? "Sinopse deste episódio indisponível." : t.overview);
  const epName = (n: number, name?: string) => (!name || /^episode\s*\d+$/i.test(name) ? `Episódio ${n}` : name);
  const currentName = epName(episode, current?.name ?? fallback?.title);

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 md:px-8">
      <header className="mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <Link to="/titulo/$slug" params={{ slug: t.slug }} aria-label="Voltar" className="btn-glass grid h-11 w-11 place-items-center rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold md:text-2xl">{t.title}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {isSeries ? <>T{season} · E{episode} — <Pt text={currentName} /></> : `${t.year}`}
          </p>
        </div>
        {isSeries && (
          <div className="flex gap-2">
            {prev && (
              <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: prev.season, ep: prev.number }} aria-label="Episódio anterior" className="btn-glass grid h-11 w-11 place-items-center rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
            {next && (
              <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: next.season, ep: next.number }} aria-label="Próximo episódio" className="btn-primary grid h-11 w-11 place-items-center rounded-full">
                <ChevronRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}
      </header>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-deep shadow-2xl ring-1 ring-border">
        {src && (
          <iframe
            key={src}
            // No sandbox: providers detect it and replace the video with a warning screen.
            referrerPolicy="no-referrer"
            src={src}
            title={`Player ${t.title}`}
            className="absolute inset-0 h-full w-full"
            aria-label={`Reproduzir ${t.title}`}
            scrolling="no"
            frameBorder={0}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        )}
        {countdown !== null && next && (
          <div className="absolute bottom-6 right-6 z-10 w-72 rounded-2xl glass p-4 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-accent">Próximo episódio em {countdown}s</p>
            <p className="mt-1 font-display font-semibold">T{next.season}:E{next.number} — <Pt text={epName(next.number, next.name)} /></p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={goNext}><SkipForward /> Assistir agora</Button>
              <Button size="sm" variant="ghost" onClick={() => setCountdown(null)}><X /> Cancelar</Button>
            </div>
          </div>
        )}
      </div>

      <section className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">{isSeries ? <><span className="text-primary">{episode}.</span> <Pt text={currentName} /></> : t.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground"><Pt text={description} /></p>
        </div>
        {isSeries && (
          <div className="flex flex-wrap gap-3">
            <Button variant={completed ? "secondary" : "outline"} aria-pressed={completed} onClick={() => library.saveProgress({ key: progressKey, slug: t.slug, position: completed ? 0 : 1, duration: 1 })}>
              <Check /> {completed ? "Assistido" : "Marcar como assistido"}
            </Button>
            {next && <Button onClick={() => setCountdown(5)}><SkipForward /> Próximo episódio</Button>}
          </div>
        )}
      </section>

      {isSeries && (
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Episódios</h2>
            <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto p-1">
              {(seasons.length ? seasons : [season]).map((s) => (
                <Link key={s} to="/assistir/$slug" params={{ slug: t.slug }} search={{ s, ep: 1 }}
                  className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", s === season ? "btn-primary" : "btn-glass text-muted-foreground")}>
                  Temporada {s}
                </Link>
              ))}
            </div>
          </div>
          {eps === null && <p className="mt-6 text-sm text-muted-foreground">Carregando episódios…</p>}
          {eps?.length === 0 && <p className="mt-6 text-sm text-muted-foreground">Lista de episódios indisponível.</p>}
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {inSeason.map((e) => {
              const active = e.number === episode;
              const done = progressPct(progress[`${t.slug}:s${e.season}e${e.number}`]) >= 95;
              return (
                <li key={e.number}>
                  <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: e.season, ep: e.number }}
                    className={cn("group ep-card block h-full overflow-hidden rounded-2xl ring-1", active ? "ring-2 ring-primary" : "ring-border")}>
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img src={e.image?.medium ?? t.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 fade-b opacity-70" />
                      <span className="absolute left-3 top-3 rounded-md btn-primary px-2 py-0.5 font-display text-xs font-bold">E{e.number}</span>
                      {active && <span className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Assistindo</span>}
                      {done && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" aria-label="Assistido" /></span>}
                    </div>
                    <div className="p-4">
                      <p className={cn("line-clamp-1 font-display font-semibold", active && "text-primary")}><Pt text={epName(e.number, e.name)} /></p>
                      {plainText(e.summary) && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground"><Pt text={plainText(e.summary)} /></p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
