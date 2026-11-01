import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Clapperboard } from "lucide-react";

export function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/assistir/")) return null;
  return (
    <footer className="border-t border-border bg-surface-deep px-5 pb-28 pt-12 md:px-10 md:pb-10">
      <div className="mx-auto max-w-[1420px]">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <Link to="/" className="flex items-center gap-3 self-start font-display text-2xl font-bold">
            <Clapperboard className="h-7 w-7 text-primary" /> NOIR<span className="text-muted-foreground">PLAY</span>
          </Link>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <Link to="/filmes" className="transition-colors hover:text-foreground">Filmes</Link>
            <Link to="/series" className="transition-colors hover:text-foreground">Séries</Link>
            <Link to="/minha-lista" className="transition-colors hover:text-foreground">Minha Lista</Link>
            <a href="https://plenoflu.com/doc/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-colors hover:text-foreground">SuperCDN <ArrowUpRight className="h-3.5 w-3.5" /></a>
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>NOIR PLAY</p>
          <p>Os direitos de cada obra pertencem aos respectivos titulares.</p>
        </div>
      </div>
    </footer>
  );
}