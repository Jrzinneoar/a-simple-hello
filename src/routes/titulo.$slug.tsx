import { Pt } from "@/lib/translate";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Play , ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Row, WatchlistButton } from "@/components/TitleCard";
import { catalogQuery, genreKey, titleQuery } from "@/lib/catalog";
import { progressPct, useLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/titulo/$slug")({
  loader: async ({ params, context }) => {
    const t = await context.queryClient.ensureQueryData(titleQuery(params.slug));
    if (!t) throw notFound();
    return { slug: t.slug, title: t.title, year: t.year, overview: t.overview, image: t.image };
  },
  head: ({ loaderData }) => {
    const t = loaderData;
    if (!t) return { meta: [{ title: "Título não encontrado — NOIR PLAY" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${t.title} (${t.year}) — NOIR PLAY` },
        { name: "description", content: t.overview },
        { property: "og:title", content: `${t.title} — NOIR PLAY` },
        { property: "og:description", content: t.overview },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:image", content: t.image },
        { name: "twitter:image", content: t.image },
      ],
    };
  },
  component: Detail,
});

function Detail() {
  const { slug } = Route.useLoaderData();
  const t = useSuspenseQuery(titleQuery(slug)).data;
  const { progress, lastEpisodes } = useLibrary();
  const savedEpisode = lastEpisodes[slug];
  const [season, setSeason] = useState(savedEpisode?.season ?? t?.seasons?.[0]?.number ?? 1);
  const g = t?.genres.map(genreKey).find(Boolean);
  const { data: sim = [] } = useQuery(catalogQuery(t?.kind ?? "movie", g ? { genre: g } : {}));
  if (!t) return null;
  const similar = sim.filter((x) => x.slug !== t.slug).slice(0, 20);
  const eps = t.seasons?.find((s) => s.number === season)?.episodes ?? [];
  const firstUnwatched = eps.find((e) => progressPct(progress[`${t.slug}:s${season}e${e.number}`]) < 95) ?? eps[0];

  return (
    <main className="pb-28">
      <section className="relative min-h-[80vh] overflow-hidden">
        <Link to="/" aria-label="Voltar ao início" className="glass absolute left-5 top-5 z-20 inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium hover:bg-foreground/10 md:left-10"><ArrowLeft className="h-4 w-4" /> Início</Link>
        <img src={t.image} alt="" width={1536} height={864} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 fade-l" />
        <div className="absolute inset-0 fade-b" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-[1500px] flex-col justify-end px-5 pb-16 pt-28 md:px-10">
          <span className="rise text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t.kind === "movie" ? "Filme" : "Série"}</span>
          <h1 className="rise mt-3 max-w-3xl text-5xl font-bold md:text-6xl">{t.title}</h1>
          {t.originalTitle !== t.title && <p className="text-sm text-muted-foreground">Título original: {t.originalTitle}</p>}
          <p className="rise mt-4 text-sm text-muted-foreground">
            {t.year}{t.minutes ? ` · ${t.minutes} min` : ""} · {t.genres.join(" · ")}
          </p>
          <p className="rise mt-5 max-w-2xl leading-relaxed text-foreground/85"><Pt text={t.overview} /></p>
          <div className="rise mt-8 flex flex-wrap gap-3">
            {t.kind === "movie" ? (
              <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{}} className="inline-flex h-11 items-center gap-2 rounded-full btn-primary px-7 text-sm font-semibold">
                <Play className="h-4 w-4 fill-current" /> {progress[t.slug] ? "Continuar" : "Assistir"}
              </Link>
            ) : (
              <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: savedEpisode?.season ?? season, ep: savedEpisode?.episode ?? firstUnwatched?.number ?? 1 }} className="inline-flex h-11 items-center gap-2 rounded-full btn-primary px-7 text-sm font-semibold">
                <Play className="h-4 w-4 fill-current" /> {savedEpisode ? `Continuar T${savedEpisode.season}:E${savedEpisode.episode}` : `Assistir T${season}:E${firstUnwatched?.number ?? 1}`}
              </Link>
            )}
            <WatchlistButton slug={t.slug} label />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-5 md:grid-cols-4 md:px-10">
        {([["Direção", t.director], ["País", t.country], ["Nota IMDb", t.rating ? `${t.rating} / 10` : ""], ["Elenco", t.cast.slice(0, 3).join(", ")]] as const).filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{k}</p>
            <p className="mt-1 font-medium">{v}</p>
          </div>
        ))}
        {t.imdbId && (
          <a href={`https://www.imdb.com/title/${t.imdbId}/`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground md:col-span-4">
            Ver no IMDb ({t.imdbId})
          </a>
        )}
      </section>

      {t.seasons && (
        <section className="mx-auto mt-14 max-w-[1500px] px-5 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Temporada {season}</p>
              <h2 className="mt-1 text-3xl font-bold">Episódios</h2>
            </div>
            <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto">
              {t.seasons.map((s) => (
                <button key={s.number} type="button" onClick={() => setSeason(s.number)} aria-pressed={s.number === season}
                  className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-medium", s.number === season ? "btn-primary" : "btn-glass text-muted-foreground")}>
                  T{s.number}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {eps.map((e) => {
              const p = progressPct(progress[`${t.slug}:s${season}e${e.number}`]);
              return (
                <li key={e.number}>
                  <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: season, ep: e.number }} className="group ep-card block h-full overflow-hidden rounded-2xl ring-1 ring-border">
                    <div className="relative aspect-video overflow-hidden">
                      <img src={e.image ?? t.image} alt="" loading="lazy" width={1536} height={864} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 fade-b opacity-70" />
                      <span className="absolute left-3 top-3 rounded-md btn-primary px-2 py-0.5 font-display text-xs font-bold">E{e.number}</span>
                      {p >= 95 && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" aria-label="Assistido" /></span>}
                      <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="grid h-14 w-14 place-items-center rounded-full btn-primary"><Play className="h-6 w-6 fill-current" /></span>
                      </div>
                      {p > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-border"><div className="h-full bg-primary" style={{ width: `${p}%` }} /></div>}
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-1 font-display font-semibold"><Pt text={e.title} /></p>
                      <p className="text-xs text-muted-foreground">{e.released ? new Date(e.released).toLocaleDateString("pt-BR") : ""}</p>
                      {e.overview && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground"><Pt text={e.overview} /></p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-14">
        <Row title="Semelhantes" items={similar} />
      </div>
    </main>
  );
}
