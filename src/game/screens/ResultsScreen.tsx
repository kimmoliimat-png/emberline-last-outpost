import { nextStageId, stageById } from "../data/catalog";
import { isStageUnlocked, useGame } from "../store";
import { GhostButton, PrimaryButton } from "./chrome";

export function ResultsScreen() {
  const result = useGame((s) => s.result);
  const go = useGame((s) => s.go);
  const startRun = useGame((s) => s.startRun);
  const save = useGame((s) => s.save);
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <GhostButton onClick={() => go("map")}>Return to map</GhostButton>
      </div>
    );
  }
  const stage = stageById(result.stageId);
  const nxt = nextStageId(result.stageId);
  const nxtOpen = nxt ? isStageUnlocked(save, nxt) : false;
  const nxtStage = nxt ? stageById(nxt) : null;
  return (
    <div className="flex h-full flex-col bg-bg px-5 pb-28 pt-10">
      <p className="text-xs uppercase tracking-[0.2em] text-amber">{result.won ? "Hold held" : "Prow overrun"}</p>
      <h2 className="font-display text-5xl text-fg">{stage.name}</h2>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
        {stage.region} · {stage.index + 1} / 50
      </p>
      <div className="mt-6 flex justify-center gap-3" aria-label={`${result.stars} stars`}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`block size-8 rotate-45 ${i <= result.stars ? "bg-amber" : "border border-border bg-surface"}`}
          />
        ))}
      </div>
      <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-surface">
        <Row k="Hull" v={`${Math.round(result.hp)} / ${result.maxHp}`} />
        <Row k="Salvage crates" v={String(result.salvage)} />
        <Row k="Scrap" v={`+${result.scrap}`} />
        <Row k="Ember" v={`+${result.ember}`} />
        <Row k="Rations" v={`+${result.rations}`} />
        <Row k="Warden XP" v={`+${result.xp}`} />
        <Row k="Heat lock" v={result.overheated ? "Guns seized" : "Clean"} />
      </ul>
      <div className="mt-auto flex flex-col gap-2">
        {nxtOpen && nxtStage ? (
          <PrimaryButton onClick={() => startRun(nxt!)}>North — {nxtStage.name}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => go("hub")}>Return to The Stack</PrimaryButton>
        )}
        <GhostButton onClick={() => startRun(result.stageId)}>Run it again</GhostButton>
        <GhostButton onClick={() => go("map")}>Highway map</GhostButton>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted">{k}</span>
      <span className="tabular-nums text-fg">{v}</span>
    </li>
  );
}