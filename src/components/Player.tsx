import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, Loader2, Maximize, Minimize, Pause, PictureInPicture2, Play, RotateCcw, Settings, SkipForward, Volume2, VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackSourceDef } from "@/lib/catalog";
import { library } from "@/lib/library";
import { providerFor, type PlaybackInstance } from "@/lib/playback";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  sources: PlaybackSourceDef[];
  progressKey: string;
  slug: string;
  backSlug: string;
  next?: { label: string; slug: string; ep?: number } | undefined;
  _n?: { label: string; slug: string; ep?: number };
}

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function Player({ title, subtitle, sources, progressKey, slug, backSlug, next }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inst = useRef<PlaybackInstance | null>(null);
  const [srcIdx, setSrcIdx] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(1);
  const [fs, setFs] = useState(false);
  const [ui, setUi] = useState(true);
  const [menu, setMenu] = useState(false);
  const [rate, setRate] = useState(1);
  const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
  const [level, setLevel] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const hideT = useRef<ReturnType<typeof setTimeout>>(undefined);

  const src = sources[srcIdx];

  // attach source
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLevels([]);
    setLevel(-1);
    const fail = (msg: string) => {
      if (cancelled) return;
      setFailed((f) => new Set(f).add(srcIdx));
      setError(msg);
      setLoading(false);
    };
    const provider = providerFor(src);
    if (!provider) {
      fail(`Formato ${src.format.toUpperCase()} não suportado neste navegador.`);
      return;
    }
    provider
      .attach(v, src, fail)
      .then((i) => {
        if (cancelled) return i.destroy();
        inst.current = i;
        setLevels(i.capabilities.qualityLevels);
        const saved = library.getProgress(progressKey);
        if (saved && saved.position > 5 && saved.position < saved.duration - 10) v.currentTime = saved.position;
        v.playbackRate = rate;
      })
      .catch((e: Error) => fail(e.message));
    return () => {
      cancelled = true;
      inst.current?.destroy();
      inst.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcIdx, attempt, src]);

  // persist progress
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const save = () => {
      if (v.duration > 0) library.saveProgress({ key: progressKey, slug, position: v.currentTime, duration: v.duration });
    };
    const id = setInterval(() => !v.paused && save(), 5000);
    v.addEventListener("pause", save);
    return () => {
      clearInterval(id);
      v.removeEventListener("pause", save);
      save();
    };
  }, [progressKey, slug]);

  const poke = useCallback(() => {
    setUi(true);
    clearTimeout(hideT.current);
    hideT.current = setTimeout(() => {
      if (video.current && !video.current.paused) {
        setUi(false);
        setMenu(false);
      }
    }, 3000);
  }, []);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setError("O navegador bloqueou a reprodução. Toque em reproduzir."));
    else v.pause();
  }, []);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      const v = video.current;
      if (!v || (e.target as HTMLElement).tagName === "INPUT") return;
      poke();
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowRight") v.currentTime += 10;
      else if (e.key === "ArrowLeft") v.currentTime -= 10;
      else if (e.key === "ArrowUp") { e.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); }
      else if (e.key === "m") v.muted = !v.muted;
      else if (e.key === "f") toggleFs();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
      clearTimeout(hideT.current);
    };
  }, [poke, toggle, toggleFs]);

  const nextSource = sources.findIndex((_, i) => i !== srcIdx && !failed.has(i));
  const pipOk = typeof document !== "undefined" && "pictureInPictureEnabled" in document && document.pictureInPictureEnabled;

  return (
    <div
      ref={wrap}
      onMouseMove={poke}
      onTouchStart={poke}
      className={cn("relative h-screen w-full bg-surface-deep", !ui && "cursor-none")}
    >
      <video
        ref={video}
        className="h-full w-full object-contain"
        playsInline
        onClick={toggle}
        onPlay={() => { setPlaying(true); poke(); }}
        onPause={() => { setPlaying(false); setUi(true); }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
        onVolumeChange={(e) => { setMuted(e.currentTarget.muted); setVol(e.currentTarget.volume); }}
        onError={() => {
          setFailed((f) => new Set(f).add(srcIdx));
          setError("Não foi possível carregar o vídeo desta fonte.");
          setLoading(false);
        }}
      />

      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="h-12 w-12 animate-spin text-foreground/80" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-surface-deep/80 p-6">
          <div className="glass max-w-md rounded-2xl p-6 text-center">
            <p className="font-display text-lg font-semibold">Falha na reprodução</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => { setFailed(new Set()); setAttempt((a) => a + 1); }} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
                <RotateCcw className="h-4 w-4" /> Tentar de novo
              </button>
              {nextSource >= 0 && (
                <button onClick={() => setSrcIdx(nextSource)} className="inline-flex items-center gap-2 rounded-full btn-primary px-4 py-2 text-sm font-semibold">
                  Usar {sources[nextSource]?.provider}
                </button>
              )}
            </div>
            {nextSource < 0 && sources.length > 1 && <p className="mt-4 text-xs text-muted-foreground">Nenhuma outra fonte disponível.</p>}
          </div>
        </div>
      )}

      <div className={cn("pointer-events-none absolute inset-0 transition-opacity duration-500", ui ? "opacity-100" : "opacity-0")}>
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-4 bg-gradient-to-b from-surface-deep/90 to-transparent p-5">
          <Link to="/titulo/$slug" params={{ slug: backSlug }} aria-label="Voltar aos detalhes" className="glass grid h-10 w-10 place-items-center rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="font-display font-semibold">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-deep/95 to-transparent px-5 pb-5 pt-16">
          <input
            type="range"
            aria-label="Progresso"
            min={0}
            max={dur || 0}
            step={0.1}
            value={time}
            onChange={(e) => { if (video.current) video.current.currentTime = Number(e.target.value); }}
            className="h-1 w-full cursor-pointer accent-primary"
          />
          <div className="mt-3 flex items-center gap-2">
            <button onClick={toggle} aria-label={playing ? "Pausar" : "Reproduzir"} className="grid h-10 w-10 place-items-center rounded-full hover:bg-foreground/10">
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button onClick={() => { if (video.current) video.current.muted = !muted; }} aria-label={muted ? "Ativar som" : "Silenciar"} className="grid h-10 w-10 place-items-center rounded-full hover:bg-foreground/10">
              {muted || vol === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={muted ? 0 : vol}
              onChange={(e) => { const v = video.current; if (v) { v.volume = Number(e.target.value); v.muted = false; } }}
              className="hidden w-24 accent-foreground sm:block" />
            <span className="ml-2 text-xs tabular-nums text-muted-foreground">{fmt(time)} / {fmt(dur)}</span>
            <div className="ml-auto flex items-center gap-1">
              {next && (
                <Link to="/assistir/$slug" params={{ slug: next.slug }} search={next.ep ? { ep: next.ep } : {}} className="glass mr-2 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:inline-flex">
                  <SkipForward className="h-4 w-4" /> {next.label}
                </Link>
              )}
              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} aria-label="Configurações" className="grid h-10 w-10 place-items-center rounded-full hover:bg-foreground/10">
                  <Settings className="h-5 w-5" />
                </button>
                {menu && (
                  <div className="glass absolute bottom-12 right-0 w-64 space-y-4 rounded-xl p-4 text-sm">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Fonte</p>
                      {sources.map((s, i) => (
                        <button key={s.id} onClick={() => { setSrcIdx(i); setMenu(false); }}
                          className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-foreground/10", i === srcIdx && "text-primary")}>
                          <span>{s.provider}</span>
                          <span className="text-[10px] uppercase text-muted-foreground">{s.format}{failed.has(i) ? " · falhou" : ""}</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Qualidade</p>
                      {levels.length ? (
                        <div className="flex flex-wrap gap-1">
                          {[{ index: -1, label: "Auto" }, ...levels].map((l) => (
                            <button key={l.index} onClick={() => { inst.current?.setQuality?.(l.index); setLevel(l.index); }}
                              className={cn("rounded-md px-2 py-1 text-xs", level === l.index ? "btn-primary font-semibold" : "bg-foreground/10")}>{l.label}</button>
                          ))}
                        </div>
                      ) : <p className="text-xs text-muted-foreground">Esta fonte oferece apenas uma qualidade.</p>}
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Velocidade</p>
                      <div className="flex flex-wrap gap-1">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                          <button key={r} onClick={() => { if (video.current) video.current.playbackRate = r; setRate(r); }}
                            className={cn("rounded-md px-2 py-1 text-xs", rate === r ? "btn-primary font-semibold" : "bg-foreground/10")}>{r}x</button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Legendas: esta fonte não fornece faixas de legenda.</p>
                  </div>
                )}
              </div>
              <button disabled={!pipOk} title={pipOk ? "Picture-in-Picture" : "Não suportado neste navegador"}
                onClick={() => { const v = video.current; if (!v) return; if (document.pictureInPictureElement) document.exitPictureInPicture(); else v.requestPictureInPicture().catch(() => {}); }}
                aria-label="Picture-in-Picture" className="grid h-10 w-10 place-items-center rounded-full hover:bg-foreground/10 disabled:opacity-30">
                <PictureInPicture2 className="h-5 w-5" />
              </button>
              <button onClick={toggleFs} aria-label="Tela cheia" className="grid h-10 w-10 place-items-center rounded-full hover:bg-foreground/10">
                {fs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {src && <p className="mt-2 text-[10px] text-muted-foreground">Fonte: {src.provider} · {src.license}</p>}
        </div>
      </div>
    </div>
  );
}
