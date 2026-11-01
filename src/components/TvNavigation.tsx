import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export function TvNavigation() {
  const router = useRouter();
  useEffect(() => {
    const tv = /SmartTV|SMART-TV|Tizen/i.test(navigator.userAgent) || new URLSearchParams(location.search).get("tv") === "1";
    if (!tv) return;
    document.documentElement.classList.add("tv-mode");
    const onKey = (event: KeyboardEvent) => {
      const active = document.activeElement;
      if (event.keyCode === 10009 || event.key === "Escape") {
        event.preventDefault();
        if (location.pathname !== "/") router.history.back();
        return;
      }
      if (active instanceof HTMLInputElement || active instanceof HTMLSelectElement) return;
      if (!event.key.startsWith("Arrow")) return;
      const targets = [...document.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input, select, iframe, [tabindex="0"]')].filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !el.closest('[inert], [aria-hidden="true"]');
      });
      if (active === document.body && targets[0]) {
        event.preventDefault();
        targets[0].focus();
        return;
      }
      const current = active instanceof HTMLElement ? active.getBoundingClientRect() : undefined;
      const x = current ? current.left + current.width / 2 : 0;
      const y = current ? current.top + current.height / 2 : 0;
      const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
      const positive = event.key === "ArrowRight" || event.key === "ArrowDown";
      const next = targets.filter((el) => el !== active).map((el) => {
        const rect = el.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - x, dy = rect.top + rect.height / 2 - y;
        const main = horizontal ? dx : dy, cross = horizontal ? dy : dx;
        return { el, main, score: Math.abs(main) + Math.abs(cross) * 3 };
      }).filter(({ main }) => positive ? main > 2 : main < -2).sort((a, b) => a.score - b.score)[0];
      if (next) { event.preventDefault(); next.el.focus(); next.el.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.classList.remove("tv-mode"); };
  }, [router]);
  return null;
}