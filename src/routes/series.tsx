import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "./filmes";

export const Route = createFileRoute("/series")({
  head: () => ({
    meta: [
      { title: "Séries — NOIR PLAY" },
      { name: "description", content: "Séries e coleções abertas com temporadas e episódios." },
      { property: "og:title", content: "Séries — NOIR PLAY" },
      { property: "og:description", content: "Séries e coleções abertas com temporadas e episódios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Catalog kind="series" heading="Séries" />,
});
