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
  const [adBlock, setAdBlock] = useState(true);
  useEffect(() => { setAdBlock(localStorage.getItem("noir:adblock") !== "off"); }, []);
  const toggleAdBlock = () => setAdBlock((v) => { localStorage.setItem("noir:adblock", v ? "off" : "on"); return !v; });
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

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <Link to="/titulo/$slug" params={{ slug: t.slug }} aria-label="Voltar" className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-semibold md:text-2xl">{t.title}</h1>
          <p className="text-sm text-muted-foreground">
            {isSeries ? `Temporada ${season} · Episódio ${episode}${current || fallback ? ` — ${current?.name ?? fallback?.title}` : ""}` : `${t.year}`}
          </p>
        </div>
        {isSeries && (
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            {prev && (
              <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: prev.season, ep: prev.number }} aria-label="Episódio anterior" className="glass grid h-11 w-11 place-items-center rounded-full hover:bg-foreground/10">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}
      </div>

      <div className={cn("grid gap-6", isSeries && "lg:grid-cols-[1fr_340px]")}>
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-deep shadow-2xl ring-1 ring-border">
            {src && (
              <iframe
                key={src + adBlock}
                // Blocker: without allow-popups the player can't open pop-up/new-tab ads or redirect this page.
                {...(adBlock ? { sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation" } : {})}
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
                <p className="mt-1 font-display font-semibold">T{next.season}:E{next.number} — {next.name}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={goNext}><SkipForward /> Assistir agora</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCountdown(null)}><X /> Cancelar</Button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <button type="button" onClick={toggleAdBlock} aria-pressed={adBlock} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold", adBlock ? "border-primary text-primary" : "border-border")}>
              <span className={cn("h-2 w-2 rounded-full", adBlock ? "bg-primary" : "bg-muted-foreground")} />
              Bloqueador de anúncios {adBlock ? "ligado" : "desligado"}
            </button>
            <span>Bloqueia pop-ups e redirecionamentos. Se o vídeo não carregar, desligue.</span>
          </div>
          <section className="mt-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">{isSeries ? `${episode}. ${current?.name ?? fallback?.title ?? `Episódio ${episode}`}` : t.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground"><Pt text={description} /></p>
            {isSeries && <Button variant={completed ? "secondary" : "outline"} aria-pressed={completed} onClick={() => library.saveProgress({ key: progressKey, slug: t.slug, position: completed ? 0 : 1, duration: 1 })}>
              <Check /> {completed ? "Assistido" : "Marcar como assistido"}
            </Button>}
            {isSeries && next && <Button className="ml-2" onClick={() => setCountdown(5)}>
              <SkipForward /> Terminei — pular para o próximo
            </Button>}
          </section>
        </div>

        {isSeries && (
          <aside className="glass flex max-h-[75vh] flex-col rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              {(seasons.length ? seasons : [season]).map((s) => (
                <Link
                  key={s}
                  to="/assistir/$slug"
                  params={{ slug: t.slug }}
                  search={{ s, ep: 1 }}
                  className={cn("rounded-full px-3 py-1 text-sm", s === season ? "bg-foreground text-background" : "border border-border hover:bg-foreground/10")}
                >
                  T{s}
                </Link>
              ))}
            </div>
            <ul className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
              {eps === null && <li className="text-sm text-muted-foreground">Carregando episódios…</li>}
              {eps?.length === 0 && <li className="text-sm text-muted-foreground">Lista de episódios indisponível.</li>}
              {inSeason.map((e) => (
                <li key={e.number}>
                  <Link
                    to="/assistir/$slug"
                    params={{ slug: t.slug }}
                    search={{ s: e.season, ep: e.number }}
                    className={cn("flex gap-3 rounded-lg px-3 py-2 text-sm", e.number === episode ? "bg-foreground/15 font-semibold" : "hover:bg-foreground/10")}
                  >
                    <span className="w-6 shrink-0 text-muted-foreground">{e.number}</span>
                    <span className="min-w-0 flex-1"><span className="block"><Pt text={e.name} /></span><span className="mt-1 line-clamp-2 block text-xs font-normal text-muted-foreground">{plainText(e.summary) ? <Pt text={plainText(e.summary)} /> : "Sinopse indisponível."}</span></span>
                    {progressPct(progress[`${t.slug}:s${e.season}e${e.number}`]) >= 95 && <Check aria-label="Assistido" className="h-4 w-4 shrink-0 text-primary" />}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}
