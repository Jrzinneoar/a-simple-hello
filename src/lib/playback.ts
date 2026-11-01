import type { PlaybackSourceDef } from "./catalog";

export interface PlaybackCapabilities {
  qualityLevels: { index: number; label: string }[];
  playbackRate: boolean;
}

export interface PlaybackInstance {
  capabilities: PlaybackCapabilities;
  setQuality?: (index: number) => void; // -1 = auto
  destroy: () => void;
}

export interface PlaybackProvider {
  format: PlaybackSourceDef["format"];
  isSupported: () => boolean;
  attach: (video: HTMLVideoElement, src: PlaybackSourceDef, onError: (msg: string) => void) => Promise<PlaybackInstance>;
}

const mp4Provider: PlaybackProvider = {
  format: "mp4",
  isSupported: () => typeof document !== "undefined" && !!document.createElement("video").canPlayType("video/mp4"),
  async attach(video, src) {
    video.src = src.url;
    video.load();
    return {
      capabilities: { qualityLevels: [], playbackRate: true },
      destroy: () => {
        video.removeAttribute("src");
        video.load();
      },
    };
  },
};

const hlsProvider: PlaybackProvider = {
  format: "hls",
  isSupported: () => typeof window !== "undefined",
  async attach(video, src, onError) {
    const { default: Hls } = await import("hls.js");
    if (!Hls.isSupported()) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src.url;
        return {
          capabilities: { qualityLevels: [], playbackRate: true },
          destroy: () => {
            video.removeAttribute("src");
            video.load();
          },
        };
      }
      throw new Error("Este navegador não suporta HLS.");
    }
    const hls = new Hls({ enableWorker: true });
    const capabilities: PlaybackCapabilities = { qualityLevels: [], playbackRate: true };
    await new Promise<void>((resolve, reject) => {
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        capabilities.qualityLevels = data.levels
          .map((l, index) => ({ index, label: l.height ? `${l.height}p` : `Nível ${index + 1}` }))
          .reverse();
        resolve();
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          reject(new Error(`Falha HLS: ${data.details}`));
          onError(`Falha HLS: ${data.details}`);
        }
      });
      hls.loadSource(src.url);
      hls.attachMedia(video);
    });
    return {
      capabilities,
      setQuality: (i) => {
        hls.currentLevel = i;
      },
      destroy: () => hls.destroy(),
    };
  },
};

const providers: PlaybackProvider[] = [hlsProvider, mp4Provider];

/** Disabled providers can be listed here without touching catalog components. */
export const disabledFormats = new Set<string>();

export function providerFor(src: PlaybackSourceDef) {
  if (disabledFormats.has(src.format)) return undefined;
  return providers.find((p) => p.format === src.format && p.isSupported());
}
