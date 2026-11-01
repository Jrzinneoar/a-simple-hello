import { Pt } from "@/lib/translate";
import { Link } from "@tanstack/react-router";
import { Info, Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { Title } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { WatchlistButton } from "./TitleCard";

export function Hero({ items }: { items: Title[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 8000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const t = items[i];
  if (!t) return null;
  return (
    <section
      className="relative h-[85svh] min-h-[600px] max-h-[950px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((it, idx) => (
        <img
          key={it.slug}
          src={it.image}
          alt=""
          width={1536}
          height={864}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-[1400ms]",
            idx === i ? "scale-100 opacity-100" : "scale-105 opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 fade-l" />
      <div className="absolute inset-0 fade-b" />
      <div key={t.slug} className="relative mx-auto flex h-full max-w-[1500px] flex-col justify-end px-5 pb-24 md:px-10">
        <span className="rise mb-4 flex items-center gap-3 text-xs font-semibold uppercase text-accent"><span className="h-px w-8 bg-accent" />Em destaque</span>
        <h1 className="rise max-w-3xl text-5xl font-bold md:text-7xl">{t.title}</h1>
        <p className="rise mt-4 text-sm text-muted-foreground">
          {t.year} · {t.minutes ? `${t.minutes} min · ` : ""}
          {t.genres.join(" · ")}
        </p>
        <p className="rise mt-4 max-w-xl text-base leading-relaxed text-foreground/85"><Pt text={t.overview} /></p>
        <div className="rise mt-8 flex flex-wrap gap-3">
          <Link
            to="/assistir/$slug"
            params={{ slug: t.slug }}
            search={t.kind === "series" ? { ep: 1 } : {}}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:scale-105"
          >
            <Play className="h-4 w-4 fill-current" /> Assistir
          </Link>
          <Link
            to="/titulo/$slug"
            params={{ slug: t.slug }}
            className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-transform hover:scale-105"
          >
            <Info className="h-4 w-4" /> Mais informações
          </Link>
          <WatchlistButton slug={t.slug} />
        </div>
      </div>
      <div className="absolute bottom-24 right-5 hidden w-[300px] flex-col gap-2 lg:flex xl:right-10">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">A seguir no destaque</p>
        {items.map((it, idx) => (
          <button
            type="button"
            key={it.slug}
            aria-label={`Ir para ${it.title}`}
            onClick={() => setI(idx)}
            className={cn("glass group flex items-center gap-3 overflow-hidden rounded-xl p-1.5 text-left transition-all", idx === i ? "ring-2 ring-primary translate-x-[-8px]" : "opacity-70 hover:opacity-100")}
          >
            <img src={it.image} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{it.title}</span>
              <span className="block text-xs text-muted-foreground">{it.year} · {it.genres[0] ?? ""}</span>
              {idx === i && <span key={i} className="mt-1 block h-0.5 origin-left animate-[grow_8s_linear] rounded bg-primary" />}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
