import { WARDENS, wardenUpgradeCost } from "../data/catalog";
import { canAfford, useGame } from "../store";
import { BottomNav, CostLine, ResourceBar } from "./chrome";
import { audio } from "../audio";

export function RosterScreen() {
  const save = useGame((s) => s.save);
  const upgrade = useGame((s) => s.upgradeWarden);

  return (
    <div className="flex h-full flex-col bg-bg">
      <ResourceBar />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-3">
        <h2 className="px-1 font-display text-4xl text-fg">Wardens</h2>
        <p className="mb-3 px-1 text-xs uppercase tracking-[0.16em] text-amber">Prow roster</p>
        <ul className="flex flex-col gap-3">
          {WARDENS.map((w) => {
            const rec = save.wardens[w.id];
            const level = rec?.level ?? 1;
            const maxed = level >= 5;
            const cost = wardenUpgradeCost(level);
            const ok = !maxed && canAfford(save, cost);
            return (
              <li key={w.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex">
                  <img
                    src={w.portrait}
                    alt={w.name}
                    className="h-40 w-28 shrink-0 object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="flex min-w-0 flex-1 flex-col p-3">
                    <h3 className="font-display text-2xl leading-none text-fg">{w.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-amber">
                      {w.role} · Rank {level}
                    </p>
                    <p className="mt-2 text-sm text-muted">{w.blurb}</p>
                    <p className="mt-2 text-xs text-faint">XP {rec?.xp ?? 0}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      {maxed ? <span className="text-sm text-muted">Peak rank</span> : <CostLine cost={cost} />}
                      <button
                        type="button"
                        disabled={!ok}
                        onClick={() => {
                          if (upgrade(w.id)) audio.buff();
                        }}
                        className="rounded-md bg-amber px-3 py-1.5 font-display text-lg text-bg disabled:bg-surface-2 disabled:text-faint"
                      >
                        Drill
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <BottomNav active="roster" />
    </div>
  );
}
