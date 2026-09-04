"use client";

import { useEffect } from "react";
import { audio } from "./audio";
import { isStageUnlocked, useGame } from "./store";
import { STAGES } from "./data/catalog";
import { HubScreen } from "./screens/HubScreen";
import { MapScreen } from "./screens/MapScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { RosterScreen } from "./screens/RosterScreen";
import { RunScreen } from "./screens/RunScreen";
import { TitleScreen } from "./screens/TitleScreen";

function resumeStage() {
  const save = useGame.getState().save;
  const id = save.lastStageId ?? "primer";
  if (isStageUnlocked(save, id)) return id;
  let last = "primer";
  for (const s of STAGES) if (isStageUnlocked(save, s.id)) last = s.id;
  return last;
}

function bootHold() {
  try {
    audio.unlock();
  } catch {
    /* autoplay */
  }
  const screen = useGame.getState().screen;
  if (screen === "run") return;
  useGame.getState().startRun(resumeStage());
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

  useEffect(() => {
    hydrate();
    const save = useGame.getState().save;
    if (save.lastScreen === "map" || save.lastScreen === "hub" || save.lastScreen === "roster") {
      useGame.getState().go(save.lastScreen);
    } else {
      bootHold();
    }
    const retries = [80, 240, 700, 1400].map((ms) =>
      window.setTimeout(() => {
        if (useGame.getState().screen === "title") bootHold();
      }, ms),
    );
    const kick = (e: Event) => {
      if (useGame.getState().screen !== "title") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-open-map]")) return;
      bootHold();
    };
    document.addEventListener("pointerdown", kick, true);
    document.addEventListener("click", kick, true);
    document.addEventListener("touchstart", kick, { capture: true, passive: true });
    const onVis = () => {
      applyIdle();
      if (document.visibilityState === "visible") {
        audio.unlock();
        if (useGame.getState().screen === "title") bootHold();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      retries.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("pointerdown", kick, true);
      document.removeEventListener("click", kick, true);
      document.removeEventListener("touchstart", kick, true);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydrate, applyIdle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__emberline = {
      ...(window.__emberline ?? { hp: 0, heat: 0 }),
      screen,
      enter: bootHold,
    };
  }, [screen]);

  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-bg-deep" style={{ containerType: "size" }}>
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
