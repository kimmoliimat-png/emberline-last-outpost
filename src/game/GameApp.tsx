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

function bootHold() {
  try {
    audio.unlock();
  } catch {
    /* autoplay */
  }
  useGame.getState().startRun("primer");
}

if (typeof window !== "undefined") {
  window.__emberline = {
    ...(window.__emberline ?? { hp: 0, heat: 0, screen: "title" }),
    enter: bootHold,
  };
}

export function GameApp() {
  const screen = useGame((s) => s.screen);
  const hydrate = useGame((s) => s.hydrate);
  const applyIdle = useGame((s) => s.applyIdle);
  const startRun = useGame((s) => s.startRun);

  useEffect(() => {
    hydrate();
    bootHold();
    const retries = [50, 200, 600, 1200].map((ms) =>
      window.setTimeout(() => {
        if (useGame.getState().screen === "title") bootHold();
      }, ms),
    );

    const kick = () => {
      if (useGame.getState().screen === "title") bootHold();
    };
    document.addEventListener("pointerdown", kick, true);
    document.addEventListener("pointerup", kick, true);
    document.addEventListener("click", kick, true);
    document.addEventListener("touchstart", kick, { capture: true, passive: true });
    document.addEventListener("keydown", kick, true);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        applyIdle();
        audio.unlock();
        kick();
      } else {
        applyIdle();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      retries.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("pointerdown", kick, true);
      document.removeEventListener("pointerup", kick, true);
      document.removeEventListener("click", kick, true);
      document.removeEventListener("touchstart", kick, true);
      document.removeEventListener("keydown", kick, true);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydrate, applyIdle, startRun]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__emberline = {
      ...(window.__emberline ?? { hp: 0, heat: 0 }),
      screen,
      enter: bootHold,
    };
  }, [screen]);

  return (
    <main
      className="flex h-dvh w-full items-center justify-center overflow-hidden bg-bg-deep"
      style={{ containerType: "size" }}
      onPointerDown={screen === "title" ? () => bootHold() : undefined}
      onClick={screen === "title" ? () => bootHold() : undefined}
    >
      <div
        className="relative overflow-hidden bg-bg shadow-[0_0_80px_rgba(0,0,0,0.55)]"
        style={{
          width: "min(100cqw, 100vw, calc(100cqh * 1080 / 1920), calc(100dvh * 1080 / 1920))",
          height: "min(100cqh, 100dvh, calc(100cqw * 1920 / 1080), calc(100vw * 1920 / 1080))",
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
