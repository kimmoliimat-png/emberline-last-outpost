import { BUILDINGS, buildingUpgradeCost } from "../data/catalog";
import { canAfford, idleRates, useGame } from "../store";
import { BottomNav, CostLine, ResourceBar } from "./chrome";
import { audio } from "../audio";

export function HubScreen() {
  const save = useGame((s) => s.save);
  const upgrade = useGame((s) => s.upgradeBuilding);
  const rates = idleRates(save);

  return (
    <div className="flex h-full flex-col bg-bg">
      <ResourceBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative">
          <img src="/game/hub.jpg" alt="The Stack, fortress on a collapsed interchange" className="h-56 w-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent px-4 pb-3 pt-10">
            <h2 className="font-display text-4xl text-fg">The Stack</h2>
            <p className="text-xs uppercase tracking-[0.16em] text-amber">Collapsed interchange · idle yards</p>
          </div>
        </div>
        <p className="px-4 pt-3 text-sm text-muted">
          Idle take {rates.scrap} scrap / {rates.ember} ember / {rates.rations} rations each minute. Banked when you return.
        </p>
        <ul className="flex flex-col gap-2 px-3 py-3 pb-6">
          {BUILDINGS.map((b) => {
            const level = save.buildings[b.id]?.level ?? 0;
            const maxed = level >= b.maxLevel;
            const cost = maxed ? { scrap: 0, ember: 0, rations: 0 } : buildingUpgradeCost(b.id, level + 1);
            const ok = !maxed && canAfford(save, cost);
            return (
              <li key={b.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl leading-none text-fg">{b.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-amber">
                      Rank {level}/{b.maxLevel} · {b.effect}
                    </p>
                    <p className="mt-1 text-sm text-muted">{b.blurb}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!ok}
                    onClick={() => {
                      if (upgrade(b.id)) audio.pickup();
                    }}
                    className="shrink-0 rounded-md bg-amber px-3 py-2 font-display text-lg text-bg disabled:bg-surface-2 disabled:text-faint"
                  >
                    {maxed ? "Max" : "Raise"}
                  </button>
                </div>
                {!maxed ? (
                  <div className="mt-2">
                    <CostLine cost={cost} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      <BottomNav active="hub" />
    </div>
  );
}
