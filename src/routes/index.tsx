import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oi" },
      { name: "description", content: "Apenas oi." },
      { property: "og:title", content: "Oi" },
      { property: "og:description", content: "Apenas oi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <p>oi</p>;
}
