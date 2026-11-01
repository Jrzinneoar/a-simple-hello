import { createFileRoute, notFound } from "@tanstack/react-router";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import { Player } from "@/components/Player";
import { useSuspenseQuery } from "@tanstack/react-query";
import { titleQuery } from "@/lib/catalog";

const pos = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const Route = createFileRoute("/assistir/$slug")({
  validateSearch: (s: Record<string, unknown>): { s?: number; ep?: number } => {
    const out: { s?: number; ep?: number } = {};
    const season = pos(s["s"]), ep = pos(s["ep"]);
    if (season) out.s = season;
    if (ep) out.ep = ep;
    return out;
  },
  loader: async ({ params, context }) => {
    const t = await context.queryClient.ensureQueryData(titleQuery(params.slug));
    if (!t) throw notFound();
    return { slug: t.slug, title: t.title, overview: t.overview };
  },
  head: ({ loaderData }) => {
    const t = loaderData;
    return {
      meta: [
        { title: t ? `Assistindo ${t.title} — NOIR PLAY` : "Player — NOIR PLAY" },
        { name: "description", content: t?.overview ?? "Player NOIR PLAY" },
        { property: "og:title", content: t ? `${t.title} — NOIR PLAY` : "NOIR PLAY" },
        { property: "og:description", content: t?.overview ?? "Player NOIR PLAY" },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: Watch,
});

function Watch() {
  const { slug } = Route.useLoaderData();
  const { s, ep } = Route.useSearch();
  const t = useSuspenseQuery(titleQuery(slug)).data;
  if (!t) return null;

  // Direct MP4/HLS sources use the native player; otherwise use the documented embed.
  if (t.kind === "movie" && t.sources.length) {
    return <Player key={slug} title={t.title} subtitle={`${t.year} · ${t.director}`} sources={t.sources} progressKey={slug} slug={slug} backSlug={slug} />;
  }
  return <EmbedPlayer t={t} season={s ?? 1} episode={ep ?? 1} />;
}
