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
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Episódios</h2>
            <select value={season} onChange={(e) => setSeason(Number(e.target.value))} aria-label="Temporada" className="glass rounded-full bg-transparent px-3 py-1.5 text-sm">
              {t.seasons.map((s) => <option key={s.number} value={s.number}>Temporada {s.number}</option>)}
            </select>
          </div>
          <ul className="mt-6 space-y-3">
            {eps.map((e) => {
              const p = progressPct(progress[`${t.slug}:s${season}e${e.number}`]);
              return (
                <li key={e.number}>
                  <Link to="/assistir/$slug" params={{ slug: t.slug }} search={{ s: season, ep: e.number }} className="group glass flex gap-4 rounded-xl p-3 transition-colors hover:bg-foreground/5">
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg sm:w-56">
                      <img src={e.image ?? t.image} alt="" loading="lazy" width={1536} height={864} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background"><Play className="h-4 w-4 fill-current" /></span>
                      </div>
                      {p > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-border"><div className="h-full bg-primary" style={{ width: `${p}%` }} /></div>}
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="font-medium">
                        {e.number}. <Pt text={e.title} />
                        {p >= 95 && <Check className="ml-2 inline h-4 w-4 text-accent" aria-label="Assistido" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{e.released ? new Date(e.released).toLocaleDateString("pt-BR") : "Data indisponível"}</p>
                      <p className={cn("mt-2 line-clamp-2 text-sm text-muted-foreground")}>{e.overview ? <Pt text={e.overview} /> : "Sinopse indisponível."}</p>
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
