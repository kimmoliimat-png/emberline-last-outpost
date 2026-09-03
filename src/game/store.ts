import { create } from "zustand";
import { audio } from "./audio";
import {
  BUILDINGS,
  STAGES,
  WARDENS,
  buildingUpgradeCost,
  lootMultiplier,
  storageCap,
  wardenUpgradeCost,
  type Resource,
} from "./data/catalog";

export type Screen = "title" | "map" | "hub" | "roster" | "run" | "results";

export interface BuildingSave {
  level: number;
}

export interface WardenSave {
  level: number;
  xp: number;
}

export interface StageSave {
  stars: number;
  cleared: boolean;
  attempts: number;
}

export interface SaveState {
  version: 1;
  scrap: number;
  ember: number;
  rations: number;
  buildings: Record<string, BuildingSave>;
  wardens: Record<string, WardenSave>;
  stages: Record<string, StageSave>;
  lastIdle: number;
  tutorialDone: boolean;
  muted: boolean;
  seenBrief: boolean;
}

export interface RunResult {
  stageId: string;
  won: boolean;
  stars: 0 | 1 | 2 | 3;
  hp: number;
  maxHp: number;
  salvage: number;
  scrap: number;
  ember: number;
  rations: number;
  xp: number;
  overheated: boolean;
  distance: number;
  length: number;
}

export interface RunHud {
  hp: number;
  maxHp: number;
  heat: number;
  overheated: boolean;
  scrap: number;
  progress: number;
  buff: string | null;
  tip: string | null;
  towers: number;
  towerCost: number;
  canBuild: boolean;
}

const SAVE_KEY = "emberline-save-v1";

function defaultSave(): SaveState {
  const buildings: Record<string, BuildingSave> = {};
  for (const b of BUILDINGS) buildings[b.id] = { level: 1 };
  const wardens: Record<string, WardenSave> = {};
  for (const w of WARDENS) wardens[w.id] = { level: 1, xp: 0 };
  const stages: Record<string, StageSave> = {};
  for (const s of STAGES) stages[s.id] = { stars: 0, cleared: false, attempts: 0 };
  return {
    version: 1,
    scrap: 28,
    ember: 8,
    rations: 14,
    buildings,
    wardens,
    stages,
    lastIdle: Date.now(),
    tutorialDone: false,
    muted: false,
    seenBrief: false,
  };
}

function migrate(raw: unknown): SaveState {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<SaveState>;
  return {
    ...base,
    ...s,
    version: 1,
    buildings: { ...base.buildings, ...s.buildings },
    wardens: { ...base.wardens, ...s.wardens },
    stages: { ...base.stages, ...s.stages },
  };
}

function loadSave(): SaveState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return migrate(JSON.parse(raw) as unknown);
  } catch {
    return defaultSave();
  }
}

function persist(save: SaveState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode */
  }
}

function idleRates(save: SaveState): Record<Resource, number> {
  const rates: Record<Resource, number> = { scrap: 0, ember: 0, rations: 0 };
  for (const b of BUILDINGS) {
    const level = save.buildings[b.id]?.level ?? 0;
    if (!b.produces || level <= 0) continue;
    for (const [k, v] of Object.entries(b.produces) as Array<[Resource, number]>) {
      rates[k] += v * level;
    }
  }
  return rates;
}

function grantIdle(save: SaveState): SaveState {
  const now = Date.now();
  const dtMin = Math.min(480, Math.max(0, (now - save.lastIdle) / 60000));
  if (dtMin < 0.02) return { ...save, lastIdle: now };
  const rates = idleRates(save);
  const cap = storageCap(save.buildings.vault?.level ?? 1);
  const next = { ...save, lastIdle: now };
  (["scrap", "ember", "rations"] as Resource[]).forEach((k) => {
    next[k] = Math.min(cap, Math.floor(next[k] + rates[k] * dtMin));
  });
  return next;
}

export function canAfford(save: SaveState, cost: Record<Resource, number>): boolean {
  return save.scrap >= cost.scrap && save.ember >= cost.ember && save.rations >= cost.rations;
}

export function pay(save: SaveState, cost: Record<Resource, number>): SaveState {
  return {
    ...save,
    scrap: save.scrap - cost.scrap,
    ember: save.ember - cost.ember,
    rations: save.rations - cost.rations,
  };
}

export interface GameStore {
  screen: Screen;
  save: SaveState;
  runStageId: string | null;
  result: RunResult | null;
  hud: RunHud | null;
  paused: boolean;
  hydrated: boolean;
  go: (screen: Screen) => void;
  startRun: (stageId: string) => void;
  setHud: (hud: RunHud) => void;
  setPaused: (paused: boolean) => void;
  finishRun: (result: RunResult) => void;
  upgradeBuilding: (id: string) => boolean;
  upgradeWarden: (id: string) => boolean;
  applyIdle: () => void;
  hydrate: () => void;
  toggleMute: () => void;
  markBrief: () => void;
  resetSave: () => void;
}

export const useGame = create<GameStore>((set, get) => ({
  screen: "title",
  save: defaultSave(),
  runStageId: null,
  result: null,
  hud: null,
  paused: false,
  hydrated: false,
  hydrate: () => {
    const save = grantIdle(loadSave());
    persist(save);
    set({ save, hydrated: true });
  },
  go: (screen) => {
    get().applyIdle();
    set({ screen, paused: false });
  },
  startRun: (stageId) => {
    const cur = get();
    if (cur.screen === "run" && cur.runStageId === stageId) return;
    cur.applyIdle();
    set({ screen: "run", runStageId: stageId, hud: null, paused: false, result: null });
  },
  setHud: (hud) => set({ hud }),
  setPaused: (paused) => set({ paused }),
  finishRun: (result) => {
    const save = grantIdle(get().save);
    const prev = save.stages[result.stageId] ?? { stars: 0, cleared: false, attempts: 0 };
    const stars = result.won ? Math.max(prev.stars, result.stars) : prev.stars;
    const barracks = save.buildings.barracks?.level ?? 1;
    const xpGain = result.won
      ? Math.floor(result.xp * (1 + (barracks - 1) * 0.15))
      : Math.floor(result.xp * 0.25);
    const wardens: Record<string, WardenSave> = {};
    for (const [id, w] of Object.entries(save.wardens)) {
      wardens[id] = { ...w, xp: w.xp + xpGain };
    }
    const next: SaveState = {
      ...save,
      scrap: save.scrap + result.scrap,
      ember: save.ember + result.ember,
      rations: save.rations + result.rations,
      tutorialDone: save.tutorialDone || result.stageId === "primer",
      stages: {
        ...save.stages,
        [result.stageId]: {
          stars,
          cleared: prev.cleared || result.won,
          attempts: prev.attempts + 1,
        },
      },
      wardens,
    };
    persist(next);
    set({
      save: next,
      result: { ...result, xp: xpGain },
      screen: "results",
      runStageId: null,
      paused: false,
    });
  },
  upgradeBuilding: (id) => {
    const { save } = get();
    const def = BUILDINGS.find((b) => b.id === id);
    if (!def) return false;
    const cur = save.buildings[id]?.level ?? 0;
    if (cur >= def.maxLevel) return false;
    const cost = buildingUpgradeCost(id, cur + 1);
    if (!canAfford(save, cost)) return false;
    const next = pay(save, cost);
    next.buildings = { ...next.buildings, [id]: { level: cur + 1 } };
    persist(next);
    set({ save: next });
    return true;
  },
  upgradeWarden: (id) => {
    const { save } = get();
    const w = save.wardens[id];
    if (!w || w.level >= 5) return false;
    const cost = wardenUpgradeCost(w.level);
    if (!canAfford(save, cost)) return false;
    const next = pay(save, cost);
    next.wardens = {
      ...next.wardens,
      [id]: { level: w.level + 1, xp: 0 },
    };
    persist(next);
    set({ save: next });
    return true;
  },
  applyIdle: () => {
    const next = grantIdle(get().save);
    persist(next);
    set({ save: next });
  },
  toggleMute: () => {
    const save = { ...get().save, muted: !get().save.muted };
    persist(save);
    set({ save });
    audio.setMuted(save.muted);
  },
  markBrief: () => {
    const save = { ...get().save, seenBrief: true };
    persist(save);
    set({ save });
  },
  resetSave: () => {
    const save = defaultSave();
    persist(save);
    set({ save, screen: "title", result: null, hud: null });
  },
}));

export function convoyStats(save: SaveState) {
  let hp = 100;
  let dmg = 1;
  let rate = 1;
  let scrapFind = 1;
  for (const def of WARDENS) {
    const lv = save.wardens[def.id]?.level ?? 1;
    hp += def.hpPerLevel * lv;
    dmg += def.dmgPerLevel * lv;
    rate += def.ratePerLevel * lv;
    scrapFind += def.scrapPerLevel * lv;
  }
  const foundry = save.buildings.foundry?.level ?? 1;
  dmg += (foundry - 1) * 0.1;
  const beacon = save.buildings.beacon?.level ?? 1;
  return {
    maxHp: Math.round(hp),
    damage: dmg,
    fireRate: rate,
    scrapFind,
    lootMult: lootMultiplier(beacon),
  };
}

export function isStageUnlocked(save: SaveState, stageId: string): boolean {
  const idx = STAGES.findIndex((s) => s.id === stageId);
  if (idx <= 0) return true;
  const prev = STAGES[idx - 1];
  return Boolean(save.stages[prev.id]?.cleared);
}

export { idleRates };
