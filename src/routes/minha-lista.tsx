import { createFileRoute, Link } from "@tanstack/react-router";
import { Grid, Row } from "@/components/TitleCard";
import { useTitles } from "@/lib/useTitles";
import { library, progressPct, useLibrary } from "@/lib/library";

export const Route = createFileRoute("/minha-lista")({
  head: () => ({
    meta: [
      { title: "Minha Lista — NOIR PLAY" },
      { name: "description", content: "Seus títulos salvos e histórico de reprodução." },
      { property: "og:title", content: "Minha Lista — NOIR PLAY" },
      { property: "og:description", content: "Seus títulos salvos e histórico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyList,
});

function MyList() {
  const { watchlist, progress, lastEpisodes } = useLibrary();
  const list = useTitles(watchlist);
  const hist = Object.values(progress).sort((a, b) => b.updatedAt - a.updatedAt);
  const histTitles = useTitles([...new Set([...hist.map((h) => h.slug), ...Object.entries(lastEpisodes).sort((a, b) => b[1].updatedAt - a[1].updatedAt).map(([slug]) => slug)])]);
  const pct: Record<string, number> = {};
  hist.forEach((p) => { if (pct[p.slug] === undefined) pct[p.slug] = progressPct(p); });

  return (
    <main className="pb-28 pt-28">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <h1 className="rise text-4xl font-bold md:text-5xl">Minha Lista</h1>
        <p className="mt-2 text-sm text-muted-foreground">Salvo neste dispositivo.</p>
        <div className="mt-10">
          {list.length ? <Grid items={list} /> : (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">Sua lista está vazia.</p>
              <Link to="/filmes" className="mt-4 inline-block rounded-full btn-primary px-5 py-2 text-sm font-semibold">Explorar filmes</Link>
            </div>
          )}
        </div>
      </div>
      {histTitles.length > 0 && (
        <div className="mt-14">
          <div className="mx-auto flex max-w-[1500px] items-center justify-end px-5 md:px-10">
            <button onClick={() => library.clearHistory()} className="text-xs text-muted-foreground underline-offset-4 hover:underline">Apagar histórico</button>
          </div>
          <Row title="Histórico de reprodução" items={histTitles} progress={pct} />
        </div>
      )}
    </main>
  );
}
