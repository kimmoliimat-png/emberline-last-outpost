import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { convoyStats, useGame } from "../store";
import { audio } from "../audio";
import { GhostButton, PrimaryButton } from "./chrome";

export function RunScreen() {
  const host = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const stageId = useGame((s) => s.runStageId);
  const save = useGame((s) => s.save);
  const setHud = useGame((s) => s.setHud);
  const finishRun = useGame((s) => s.finishRun);
  const paused = useGame((s) => s.paused);
  const setPaused = useGame((s) => s.setPaused);
  const toggleMute = useGame((s) => s.toggleMute);
  const go = useGame((s) => s.go);
  const hud = useGame((s) => s.hud);
  const startRun = useGame((s) => s.startRun);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!host.current || !stageId) return;
    let destroyed = false;
    let game: Phaser.Game | undefined;
    const bonuses = convoyStats(save);
    try {
      audio.unlock();
      audio.setMuted(save.muted);
    } catch {
      /* ignore */
    }
    setBootError(null);

    void import("../phaser/createGame")
      .then(({ createRunGame }) => {
        if (destroyed || !host.current) return;
        game = createRunGame(host.current, {
          stageId,
          bonuses,
          muted: save.muted,
          onHud: setHud,
          onFinish: finishRun,
        });
        gameRef.current = game;
        const refresh = () => {
          try {
            game?.scale.refresh();
          } catch {
            /* ignore */
          }
        };
        refresh();
        requestAnimationFrame(refresh);
        window.setTimeout(refresh, 80);
      })
      .catch((err: unknown) => {
        setBootError(err instanceof Error ? err.message : "Hold failed to boot");
      });

    return () => {
      destroyed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // stageId is the run identity; save bonuses are captured at start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene("run");
    if (!scene) return;
    if (paused) scene.scene.pause();
    else scene.scene.resume();
  }, [paused]);

  return (
    <div className="relative h-full bg-bg-deep">
      <div ref={host} className="absolute inset-0 touch-none" />
      {bootError ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-deep p-6">
          <div className="w-full rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-4xl text-fg">Hold stalled</h3>
            <p className="mt-2 text-sm text-muted">{bootError}</p>
            <PrimaryButton
              className="mt-5 w-full"
              onClick={() => {
                setBootError(null);
                startRun(stageId ?? "primer");
              }}
            >
              Retry the hold
            </PrimaryButton>
          </div>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-border bg-bg/95 px-3 py-2">
        <button
          type="button"
          className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-amber"
          onClick={toggleMute}
          aria-label={save.muted ? "Unmute" : "Mute"}
        >
          {save.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        <button
          type="button"
          className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-amber"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Resume" : "Pause"}
        >
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </button>
        <button
          type="button"
          disabled={!hud?.canBuild}
          onClick={() => window.__emberline?.tryBuild?.()}
          className="h-12 min-w-0 flex-1 rounded-md bg-amber font-display text-xl tracking-wide text-bg disabled:bg-surface-2 disabled:text-faint"
        >
          {!hud ? "Tower" : hud.towers >= 3 ? "Towers max" : `Tower · ${hud.towerCost}`}
        </button>
        <button
          type="button"
          disabled={!hud?.canBuildWall}
          onClick={() => window.__emberline?.tryBuildWall?.()}
          className="h-12 min-w-0 flex-1 rounded-md border border-amber bg-surface font-display text-xl tracking-wide text-amber disabled:border-border disabled:text-faint"
        >
          {!hud ? "Wall" : hud.hasWall ? "Wall up" : `Wall · ${hud.wallCost}`}
        </button>
      </div>
      {paused ? (
        <div className="absolute inset-0 z-30 flex items-center bg-bg-deep/70 p-6 pb-24">
          <div className="w-full rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-4xl text-fg">Hold</h3>
            <p className="mt-2 text-sm text-muted">The Warden holds the grade. The horde does not rest.</p>
            <div className="mt-5 flex flex-col gap-2">
              <PrimaryButton onClick={() => setPaused(false)}>Resume</PrimaryButton>
              <GhostButton onClick={() => go("map")}>Abandon cut</GhostButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
