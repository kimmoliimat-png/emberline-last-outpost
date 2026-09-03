import { Lock } from "lucide-react";
import { MAP_NODES, STAGES, stageById } from "../data/catalog";
import { isStageUnlocked, useGame } from "../store";
import { audio } from "../audio";
import { BottomNav, ResourceBar } from "./chrome";

export function MapScreen() {
  const save = useGame((s) => s.save);
  const startRun = useGame((s) => s.startRun);
  const seenBrief = save.seenBrief;
  const markBrief = useGame((s) => s.markBrief);

  return (
    <div className="flex h-full flex-col bg-bg">
      <ResourceBar />
      <div className="relative min-h-0 flex-1">
        <img src="/game/map.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0 bg-bg-deep/25" />
        <div className="absolute left-4 top-4">
          <h2 className="font-display text-4xl text-fg">The Emberline</h2>
          <p className="text-xs uppercase tracking-[0.16em] text-amber">Highway nodes</p>
        </div>
        {MAP_NODES.map((n) => {
          const stage = stageById(n.id);
          const unlocked = isStageUnlocked(save, n.id);
          const rec = save.stages[n.id];
          return (
            <button
              key={n.id}
              type="button"
              disabled={!unlocked}
              onClick={() => {
                audio.unlock();
                startRun(n.id);
              }}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              className="absolute w-[5.6rem] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-bg/90 px-1.5 py-1.5 text-left shadow-sm backdrop-blur-sm disabled:opacity-55"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-display text-lg leading-none text-amber">{stage.name}</span>
                {!unlocked ? <Lock className="size-3.5 text-faint" /> : null}
              </div>
              <Stars count={rec?.stars ?? 0} />
            </button>
          );
        })}
      </div>
      <p className="px-4 py-2 text-center text-xs text-muted">
        {STAGES.filter((s) => save.stages[s.id]?.cleared).length}/{STAGES.length} holds cleared
      </p>
      <BottomNav active="map" />
      {!seenBrief ? (
        <div className="absolute inset-0 z-20 flex items-center bg-bg-deep/55 p-5 pb-28">
          <div className="w-full rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-3xl text-amber">Warden brief</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Primer Cut teaches the hold. Strafe and shoot the marching ranks. Bank salvage to raise gun towers. After the run, raise Beacon Tower twice and spend salvage on a Warden.
            </p>
            <button
              type="button"
              onClick={() => {
                markBrief();
                audio.unlock();
                startRun("primer");
              }}
              className="mt-4 h-12 w-full rounded-md bg-amber font-display text-xl text-bg"
            >
              Hold Primer Cut
            </button>
            <button
              type="button"
              onClick={markBrief}
              className="mt-2 h-11 w-full rounded-md border border-border font-display text-lg text-fg"
            >
              Look at the map
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="mt-1 flex gap-1" aria-label={`${count} stars`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`block size-1.5 rotate-45 ${i <= count ? "bg-amber" : "bg-border"}`}
        />
      ))}
    </div>
  );
}
