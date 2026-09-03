import { useCallback, useEffect, useRef } from "react";
import { audio } from "../audio";
import { useGame } from "../store";

export function TitleScreen() {
  const startRun = useGame((s) => s.startRun);
  const save = useGame((s) => s.save);
  const started = useRef(false);

  const enter = useCallback(() => {
    if (started.current) return;
    if (useGame.getState().screen === "run") return;
    started.current = true;
    try {
      audio.unlock();
      audio.setMuted(save.muted);
    } catch {
      /* gesture / autoplay policies */
    }
    startRun("primer");
  }, [save.muted, startRun]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__emberline = {
        ...(window.__emberline ?? { hp: 0, heat: 0, screen: "title" }),
        screen: "title",
        enter,
      };
    }

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
        ev.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKey);

    const framed = typeof window !== "undefined" && window.parent !== window;
    const t = window.setTimeout(() => enter(), framed ? 80 : 4000);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [enter]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Enter the Emberline"
      className="relative flex h-full w-full cursor-pointer select-none flex-col"
      style={{ touchAction: "manipulation" }}
      onPointerDown={(e) => {
        e.preventDefault();
        enter();
      }}
    >
      <img
        src="/game/title.jpg"
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-deep/25 via-bg-deep/20 to-bg-deep/90" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-stretch justify-center gap-5 px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-amber">Solar-fungal blight year 7</p>
        <h1 className="font-display text-7xl leading-[0.85] text-fg">
          Emberline
          <span className="mt-1 block text-4xl text-amber">Last Outpost</span>
        </h1>
        <p className="max-w-[34ch] text-sm leading-relaxed text-muted">
          A Warden holds the Emberline. Strafe the grade, burn the Ashwalker horde, and raise gun towers when the salvage is enough.
        </p>
        <button
          id="enter-emberline"
          type="button"
          data-enter="1"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            enter();
          }}
          className="flex h-16 w-full items-center justify-center rounded-md bg-amber font-display text-3xl tracking-wide text-bg"
        >
          Enter the Emberline
        </button>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-faint">Tap anywhere · A / D to move</p>
      </div>
    </div>
  );
}
