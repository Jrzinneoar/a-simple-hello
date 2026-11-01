import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { History, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchQuery } from "@/lib/catalog";
import { library, useLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Pesquisar — NOIR PLAY" },
      { name: "description", content: "Pesquise qualquer filme ou série do catálogo pelo nome." },
      { property: "og:title", content: "Pesquisar — NOIR PLAY" },
      { property: "og:description", content: "Pesquise filmes e séries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const { searches } = useLibrary();
  const navigate = useNavigate();

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const id = setTimeout(() => setDq(q), 250);
    return () => clearTimeout(id);
  }, [q]);

  const sq = useQuery(searchQuery(dq));
  const results = dq.trim().length > 1 ? sq.data ?? [] : [];
  const groups = [
    { label: "Filmes", items: results.filter((r) => r.kind === "movie") },
    { label: "Séries", items: results.filter((r) => r.kind === "series") },
  ];
  const flat = groups.flatMap((g) => g.items);

  const open = (slug: string) => {
    library.addSearch(q);
    navigate({ to: "/titulo/$slug", params: { slug } });
  };

  return (
    <main className="mx-auto max-w-3xl px-5 pb-28 pt-28">
      <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(flat.length - 1, s + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            if (e.key === "Enter" && flat[sel]) open(flat[sel].slug);
            if (e.key === "Escape") setQ("");
          }}
          placeholder="Nome do filme ou série"
          aria-label="Pesquisar"
          className="w-full bg-transparent text-lg outline-none placeholder:text-muted-foreground"
        />
        {q && <button onClick={() => setQ("")} aria-label="Limpar"><X className="h-5 w-5 text-muted-foreground" /></button>}
      </div>

      {!dq && searches.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Pesquisas recentes</h2>
            <button onClick={() => library.clearSearches()} className="text-xs text-muted-foreground hover:text-foreground">Limpar</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {searches.map((s) => (
              <button key={s} onClick={() => setQ(s)} className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
                <History className="h-3.5 w-3.5" /> {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {dq.trim().length > 1 && sq.isFetching && !flat.length && <p className="mt-10 text-center text-muted-foreground">Pesquisando…</p>}
      {dq.trim().length > 1 && !sq.isFetching && !flat.length && <p className="mt-10 text-center text-muted-foreground">Nada encontrado para “{dq}”.</p>}

      {groups.map((g) => g.items.length > 0 && (
        <section key={g.label} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{g.label}</h2>
          <ul className="space-y-2">
            {g.items.map((t) => {
              const idx = flat.indexOf(t);
              return (
                <li key={t.slug}>
                  <Link
                    to="/titulo/$slug"
                    params={{ slug: t.slug }}
                    onClick={() => library.addSearch(q)}
                    onMouseEnter={() => setSel(idx)}
                    className={cn("flex items-center gap-4 rounded-xl p-2 transition-colors", idx === sel ? "bg-foreground/10" : "hover:bg-foreground/5")}
                  >
                    <img src={t.poster} alt="" loading="lazy" width={300} height={450} className="h-16 w-11 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{[t.year || null, t.rating ? `★ ${t.rating}` : null, t.genres.slice(0, 3).join(", ")].filter(Boolean).join(" · ")}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
