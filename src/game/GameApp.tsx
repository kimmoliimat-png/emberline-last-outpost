"use client";

import { useEffect } from "react";
import { audio } from "./audio";
import { useGame } from "./store";
import { HubScreen } from "./screens/HubScreen";
import { MapScreen } from "./screens/MapScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { RosterScreen } from "./screens/RosterScreen";
import { RunScreen } from "./screens/RunScreen";
import { TitleScreen } from "./screens/TitleScreen";

export function GameApp() {
  const screen = useGame((s) => s.screen);
  const hydrate = useGame((s) => s.hydrate);
  const applyIdle = useGame((s) => s.applyIdle);
  const startRun = useGame((s) => s.startRun);

  useEffect(() => {
    hydrate();
    let hold = false;
    try {
      hold = new URLSearchParams(window.location.search).has("hold");
    } catch {
      hold = false;
    }
    const framed = window.parent !== window;
    if (hold || framed) {
      if (useGame.getState().screen === "title") startRun("primer");
    }

    const onVis = () => {
      if (document.visibilityState === "visible") {
        applyIdle();
        audio.unlock();
      } else {
        applyIdle();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hydrate, applyIdle, startRun]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__emberline = {
      ...(window.__emberline ?? { hp: 0, heat: 0 }),
      screen,
      enter: () => {
        if (useGame.getState().screen === "title") startRun("primer");
      },
    };
  }, [screen, startRun]);

  return (
    <main
      className="flex h-full w-full items-center justify-center overflow-hidden bg-bg-deep"
      style={{ containerType: "size" }}
      onPointerDown={
        screen === "title"
          ? (e) => {
              e.preventDefault();
              try {
                audio.unlock();
              } catch {
                /* ignore */
              }
              startRun("primer");
            }
          : undefined
      }
    >
      <div
        className="relative overflow-hidden bg-bg shadow-[0_0_80px_rgba(0,0,0,0.55)]"
        style={{
          width: "min(100cqw, calc(100cqh * 1080 / 1920))",
          height: "min(100cqh, calc(100cqw * 1920 / 1080))",
        }}
      >
        {screen === "title" ? <TitleScreen /> : null}
        {screen === "map" ? <MapScreen /> : null}
        {screen === "hub" ? <HubScreen /> : null}
        {screen === "roster" ? <RosterScreen /> : null}
        {screen === "run" ? <RunScreen /> : null}
        {screen === "results" ? <ResultsScreen /> : null}
      </div>
    </main>
  );
}
