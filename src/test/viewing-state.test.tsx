import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { library, progressPct, useLibrary } from "@/lib/library";
import { usePlaybackNavigation } from "@/hooks/use-playback-navigation";

describe("Viewing preferences", () => {
  it("hides playback navigation after inactivity and restores it on touch", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => usePlaybackNavigation(true));
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event("pointerdown")));
    expect(result.current).toBe(true);
    unmount();
    vi.useRealTimers();
  });
  it("remembers the exact season and episode without inventing a timestamp", () => {
    const { result } = renderHook(() => useLibrary());
    act(() => library.rememberEpisode("tt0944947", 2, 3));
    expect(result.current.lastEpisodes["tt0944947"]).toMatchObject({ season: 2, episode: 3 });
    expect(result.current.progress["tt0944947:s2e3"]).toBeUndefined();
  });
  it("retains real native player playback position", () => {
    act(() => library.saveProgress({ key: "tt0133093", slug: "tt0133093", position: 120, duration: 7200 }));
    expect(library.getProgress("tt0133093")?.position).toBe(120);
    expect(progressPct(library.getProgress("tt0133093"))).toBeCloseTo(1.6667);
  });
});