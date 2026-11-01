import { useEffect, useState } from "react";

export function usePlaybackNavigation(playback: boolean) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!playback) { setVisible(true); return; }
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 4000);
    };
    const events = ["pointermove", "pointerdown", "keydown", "focusin"];
    events.forEach((event) => window.addEventListener(event, show));
    show();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, show));
    };
  }, [playback]);
  return visible;
}