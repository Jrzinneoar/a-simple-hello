import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { Row, Top10Row } from "@/components/TitleCard";
import { catalogQuery, type Kind, type Sort } from "@/lib/catalog";
import { progressPct, useLibrary } from "@/lib/library";
import { useTitles } from "@/lib/useTitles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOIR PLAY — Filmes e séries" },
      { name: "description", content: "Milhares de filmes e séries com catálogo atualizado do IMDb, Minha Lista e continue assistindo." },
      { property: "og:title", content: "NOIR PLAY — Filmes e séries" },
      { property: "og:description", content: "Catálogo atualizado de filmes e séries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function CatRow({ title, kind, sort, genre, top }: { title: string; kind: Kind; sort?: Sort; genre?: string; top?: boolean }) {
  const o: { sort?: Sort; genre?: string } = {};
  if (sort) o.sort = sort;
  if (genre) o.genre = genre;
  const { data } = useQuery(catalogQuery(kind, o));
  return top ? <Top10Row title={title} items={data ?? []} /> : <Row title={title} items={data ?? []} />;
}

function Index() {
  const { watchlist, progress, lastEpisodes } = useLibrary();
  const recent = Object.values(progress).sort((a, b) => b.updatedAt - a.updatedAt);
  const cont = useTitles([...new Set([...recent.map((p) => p.slug), ...Object.entries(lastEpisodes).sort((a, b) => b[1].updatedAt - a[1].updatedAt).map(([slug]) => slug)])]);
  const pct: Record<string, number> = {};
  recent.forEach((p) => { if (pct[p.slug] === undefined) pct[p.slug] = progressPct(p); });
  const list = useTitles(watchlist);
  const { data: top } = useQuery(catalogQuery("movie"));

  return (
    <main className="pb-28">
      <Hero items={(top ?? []).slice(0, 6)} />
      <div className="relative -mt-16 space-y-6">
        <Row title="Continue assistindo" items={cont} progress={pct} />
        <Row title="Minha lista" items={list} />
        <Top10Row title="Filmes hoje no Brasil" items={top ?? []} />
        <Row title="Filmes em alta" items={(top ?? []).slice(10)} />
        <CatRow title="Séries hoje" kind="series" top />
        <CatRow title="Séries em alta" kind="series" sort="imdbRating" />
        <CatRow title="Lançamentos" kind="movie" sort="year" genre={String(new Date().getFullYear())} />
        <CatRow title="Mais bem avaliados" kind="movie" sort="imdbRating" />
        <CatRow title="Ação" kind="movie" genre="Action" />
        <CatRow title="Comédia" kind="movie" genre="Comedy" />
        <CatRow title="Terror" kind="movie" genre="Horror" />
        <CatRow title="Animação" kind="movie" genre="Animation" />
        <CatRow title="Séries de drama" kind="series" genre="Drama" />
      </div>
    </main>
  );
}
