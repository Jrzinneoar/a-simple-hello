import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bookmark, Clapperboard, Film, Home, Search, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Início", icon: Home },
  { to: "/filmes", label: "Filmes", icon: Film },
  { to: "/series", label: "Séries", icon: Tv },
  { to: "/minha-lista", label: "Minha Lista", icon: Bookmark },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const navigate = useNavigate();
  const playback = useRouterState({ select: (s) => /^\/(assistir|titulo)\//.test(s.location.pathname) });
  // Navbar hides while scrolling down and returns on scroll up; fully hidden during playback.
  const visible = playback ? false : !hiddenByScroll;

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last) > 8) { setHiddenByScroll(y > last && y > 120); last = y; }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        navigate({ to: "/buscar" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [navigate]);

  return (
    <>
      <header
        aria-hidden={!visible}
        inert={!visible}
        className={cn(
          "fixed left-1/2 top-4 z-50 w-[min(calc(100%-1.5rem),1100px)] -translate-x-1/2 rounded-full border border-border transition-all duration-500",
          scrolled ? "bg-glass-strong shadow-[var(--shadow-deep)] backdrop-blur-xl" : "glass",
          !visible && "pointer-events-none -translate-y-28 opacity-0",
        )}
      >
        <nav className="flex h-14 items-center gap-4 pl-5 pr-2">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold">
            <Clapperboard className="h-5 w-5 text-primary" />
            NOIR<span className="text-muted-foreground">PLAY</span>
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  activeOptions={{ exact: l.to === "/" }}
                  className="relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-primary data-[status=active]:font-semibold data-[status=active]:text-primary-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/buscar"
            className="glass ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Pesquisar"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Pesquisar</span>
            <kbd className="hidden rounded border border-border px-1.5 text-xs sm:inline">/</kbd>
          </Link>
        </nav>
      </header>
      <nav aria-hidden={!visible} inert={!visible} className={cn("fixed inset-x-3 bottom-3 z-50 transition-all duration-500 md:hidden", !visible && "pointer-events-none translate-y-24 opacity-0")}>
        <ul className="glass flex justify-around rounded-full bg-glass-strong py-1">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="flex min-w-16 flex-col items-center gap-0.5 px-2 py-2 text-[11px] text-muted-foreground data-[status=active]:text-foreground"
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
