import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Grid } from "@/components/TitleCard";
import { fetchCatalog, genreList, type Kind, type Sort } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/filmes")({
  head: () => ({
    meta: [
      { title: "Filmes — NOIR PLAY" },
      { name: "description", content: "Catálogo completo de filmes com filtros por gênero e ordenação." },
      { property: "og:title", content: "Filmes — NOIR PLAY" },
      { property: "og:description", content: "Catálogo completo de filmes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Catalog kind="movie" heading="Filmes" />,
});

export function Catalog({ kind, heading }: { kind: Kind; heading: string }) {
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("top");
  const q = useInfiniteQuery({
    queryKey: ["browse", kind, genre, sort],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchCatalog(kind, { sort, ...(genre ? { genre } : {}), skip: pageParam }),
    getNextPageParam: (last, all) => (last.length ? all.flat().length : undefined),
  });
  const seen = new Set<string>();
  const items = (q.data?.pages.flat() ?? []).filter((t) => !seen.has(t.slug) && !!seen.add(t.slug));
  const chip = (a: boolean) => cn("rounded-full px-3 py-1.5 text-xs transition-colors", a ? "bg-foreground text-background" : "glass text-muted-foreground hover:text-foreground");

  return (
    <main className="mx-auto max-w-[1500px] px-5 pb-28 pt-28 md:px-10">
      <div className="flex flex-wrap items-end gap-4">
        <h1 className="rise text-4xl font-bold md:text-5xl">{heading}</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar" className="glass ml-auto rounded-full bg-transparent px-3 py-1.5 text-xs">
          <option value="top">Em alta</option>
          <option value="year">Mais recentes</option>
          <option value="imdbRating">Melhor avaliados</option>
        </select>
      </div>
      <div className="rise mt-8 flex flex-wrap gap-2">
        <button className={chip(!genre)} onClick={() => setGenre(null)}>Todos</button>
        {genreList.map(([k, label]) => <button key={k} className={chip(genre === k)} onClick={() => setGenre(k)}>{label}</button>)}
      </div>
      <div className="mt-10">
        {q.isPending ? <p className="text-muted-foreground">Carregando…</p> : q.isError ? <p className="text-muted-foreground">Não foi possível carregar o catálogo.</p> : <Grid items={items} />}
      </div>
      {q.hasNextPage && (
        <div className="mt-10 text-center">
          <button onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background">
            {q.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </main>
  );
}
