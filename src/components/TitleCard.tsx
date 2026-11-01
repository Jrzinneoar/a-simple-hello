import { Pt } from "@/lib/translate";
import { Link } from "@tanstack/react-router";
import { Check, Info, Play, Plus } from "lucide-react";
import type { Title } from "@/lib/catalog";
import { library, useLibrary } from "@/lib/library";

export function WatchlistButton({ slug, label = false }: { slug: string; label?: boolean }) {
  const { watchlist } = useLibrary();
  const has = watchlist.includes(slug);
  const Icon = has ? Check : Plus;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        library.toggleWatchlist(slug);
      }}
      aria-pressed={has}
      aria-label={has ? "Remover da Minha Lista" : "Adicionar à Minha Lista"}
      className="btn-glass inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium"
    >
      <Icon className="h-4 w-4" />
      {label && (has ? "Na lista" : "Minha Lista")}
    </button>
  );
}

export function TitleCard({ t, progress }: { t: Title; progress?: number | undefined }) {
  return (
    <Link
      to="/titulo/$slug"
      params={{ slug: t.slug }}
      className="group relative block w-[260px] shrink-0 snap-start sm:w-[320px]"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-[var(--shadow-deep)] ring-1 ring-border transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-primary/40">
        <img
          src={t.image}
          alt={t.title}
          loading="lazy"
          width={1536}
          height={864}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 fade-b opacity-90" />
        <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
          {t.kind === "movie" ? "Filme" : "Série"}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-lg font-semibold leading-tight">{t.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.year} · {t.genres.slice(0, 2).join(" · ")}
            {t.minutes ? ` · ${t.minutes} min` : ""}
          </p>
          <p className="mt-2 line-clamp-2 max-h-0 text-xs text-muted-foreground opacity-0 transition-all duration-500 group-hover:max-h-10 group-hover:opacity-100 group-focus-visible:max-h-10 group-focus-visible:opacity-100">
            <Pt text={t.overview} />
          </p>
        </div>
        <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <span className="grid h-9 w-9 place-items-center rounded-full btn-primary">
            {t.kind === "movie" ? <Play className="h-4 w-4 fill-current" /> : <Info className="h-4 w-4" />}
          </span>
        </div>
        {progress !== undefined && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-border">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export function Row({ title, items, progress }: { title: string; items: Title[]; progress?: Record<string, number> }) {
  if (!items.length) return null;
  return (
    <section className="rise">
      <h2 className="mb-4 px-5 text-xl font-semibold md:px-10">{title}</h2>
      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-6 pt-2 md:px-10">
        {items.map((t) => (
          <TitleCard key={t.slug} t={t} progress={progress?.[t.slug]} />
        ))}
      </div>
    </section>
  );
}

export function Grid({ items }: { items: Title[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((t) => (
        <div key={t.slug} className="[&>a]:w-full">
          <TitleCard t={t} />
        </div>
      ))}
    </div>
  );
}

/** Top 10 row: giant outlined ranking numbers beside portrait-cropped cards. */
export function Top10Row({ title, items }: { title: string; items: Title[] }) {
  if (!items.length) return null;
  return (
    <section className="rise">
      <h2 className="mb-4 flex items-center gap-3 px-5 text-xl font-semibold md:px-10">
        <span className="rounded-md bg-primary px-2 py-0.5 font-display text-sm font-bold text-primary-foreground">TOP 10</span>{title}
      </h2>
      <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-5 pb-6 pt-2 md:px-10">
        {items.slice(0, 10).map((t, i) => (
          <Link key={t.slug} to="/titulo/$slug" params={{ slug: t.slug }} className="group flex shrink-0 snap-start items-end">
            <span className="rank-num font-display text-[150px] font-black leading-[0.8] md:text-[190px]">{i + 1}</span>
            <div className="relative -ml-6 h-[210px] w-[140px] overflow-hidden rounded-xl ring-1 ring-border transition-all duration-500 group-hover:-translate-y-2 group-hover:ring-primary md:h-[250px] md:w-[170px]">
              <img src={t.image} alt={t.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 fade-b opacity-80" />
              <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-xs font-semibold">{t.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
