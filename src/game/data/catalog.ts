export type Resource = "scrap" | "ember" | "rations";

export type SpawnKind =
  | "ash"
  | "spike"
  | "drum"
  | "pool"
  | "barrel"
  | "plate"
  | "pylons";

export interface SpawnEvent {
  at: number;
  kind: SpawnKind;
  lanes: number[];
  hits?: number;
  /** How many to pack. Ashwalkers fan across the road in ranks. */
  count?: number;
}

export interface StageDef {
  id: string;
  name: string;
  blurb: string;
  length: number;
  scroll: number;
  /** Ashwalker march speed in px/s. */
  march: number;
  ashHp: number;
  tutorial: boolean;
  scrap: number;
  ember: number;
  rations: number;
  xp: number;
  spawns: SpawnEvent[];
}

export interface WardenDef {
  id: string;
  name: string;
  role: string;
  blurb: string;
  portrait: string;
  hpPerLevel: number;
  dmgPerLevel: number;
  ratePerLevel: number;
  scrapPerLevel: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  blurb: string;
  maxLevel: number;
  produces?: Partial<Record<Resource, number>>;
  effect: string;
}

export const LANE_X = [330, 540, 750] as const;
export const ROAD_LEFT = 250;
export const ROAD_RIGHT = 830;
export const DESIGN_W = 1080;
export const DESIGN_H = 1920;
export const MAX_TOWERS = 3;
export const TOWER_SLOTS = [
  { x: 300, y: 1260 },
  { x: 780, y: 1260 },
  { x: 540, y: 1088 },
] as const;

export function towerCost(built: number): number {
  return 22 + built * 18;
}

function wave(
  start: number,
  gap: number,
  rows: Array<[SpawnKind, number[], number?, number?]>,
): SpawnEvent[] {
  return rows.map((row, i) => {
    const [kind, lanes, hits, count] = row;
    const ev: SpawnEvent = { at: start + i * gap, kind, lanes };
    if (hits) ev.hits = hits;
    if (count) ev.count = count;
    return ev;
  });
}

function horde(at: number, count: number, lanes: number[] = [0, 1, 2]): SpawnEvent {
  return { at, kind: "ash", lanes, count };
}

export const STAGES: StageDef[] = [
  {
    id: "primer",
    name: "Primer Cut",
    blurb: "Strafe, shoot, and raise a gun tower. Burn the first ranks before they reach you.",
    length: 7800,
    scroll: 230,
    march: 138,
    ashHp: 2,
    tutorial: true,
    scrap: 70,
    ember: 16,
    rations: 10,
    xp: 40,
    spawns: [
      horde(80, 5),
      { at: 1500, kind: "barrel", lanes: [1] },
      horde(2100, 8),
      { at: 2900, kind: "pool", lanes: [0] },
      horde(3400, 10),
      { at: 4300, kind: "plate", lanes: [1], hits: 3 },
      { at: 4900, kind: "spike", lanes: [2], count: 2 },
      { at: 5400, kind: "barrel", lanes: [0] },
      { at: 5900, kind: "pylons", lanes: [0, 2] },
      { at: 6500, kind: "drum", lanes: [1, 2], count: 2 },
      horde(7200, 16),
    ],
  },
  {
    id: "cinder",
    name: "Cinder Approach",
    blurb: "Ashwalkers gather on the cracked asphalt and march the grade in ranks.",
    length: 9200,
    scroll: 245,
    march: 146,
    ashHp: 2,
    tutorial: false,
    scrap: 55,
    ember: 12,
    rations: 8,
    xp: 50,
    spawns: [
      horde(480, 8),
      { at: 1100, kind: "barrel", lanes: [2] },
      horde(1600, 10),
      { at: 2300, kind: "spike", lanes: [0], count: 2 },
      horde(2800, 12),
      { at: 3500, kind: "plate", lanes: [1], hits: 3 },
      horde(4000, 10),
      { at: 4600, kind: "pool", lanes: [1] },
      { at: 5000, kind: "barrel", lanes: [0] },
      horde(5400, 14),
      { at: 6100, kind: "drum", lanes: [1], count: 2 },
      { at: 6600, kind: "pylons", lanes: [0, 2] },
      horde(7100, 12),
      { at: 7800, kind: "barrel", lanes: [2] },
      horde(8400, 18),
    ],
  },
  {
    id: "drums",
    name: "Drum Gauntlet",
    blurb: "Burning drums roll the grade ahead of the horde. Prioritize the fast ones.",
    length: 9600,
    scroll: 250,
    march: 150,
    ashHp: 2,
    tutorial: false,
    scrap: 60,
    ember: 14,
    rations: 8,
    xp: 55,
    spawns: wave(500, 520, [
      ["drum", [0], undefined, 2],
      ["ash", [0, 1, 2], undefined, 8],
      ["drum", [2], undefined, 2],
      ["barrel", [1]],
      ["ash", [0, 1, 2], undefined, 10],
      ["spike", [0], undefined, 2],
      ["drum", [1], undefined, 2],
      ["ash", [0, 1, 2], undefined, 12],
      ["plate", [1], 4],
      ["drum", [0, 2], undefined, 3],
      ["pool", [0]],
      ["ash", [0, 1, 2], undefined, 10],
      ["pylons", [0, 2]],
      ["drum", [1], undefined, 2],
      ["ash", [0, 1, 2], undefined, 14],
      ["barrel", [1]],
      ["drum", [0, 2], undefined, 3],
      ["ash", [0, 1, 2], undefined, 16],
    ]),
  },
  {
    id: "trench",
    name: "Heat Trench",
    blurb: "Creeping fire marches with the dead. Snuff pools or the guns seize mid-horde.",
    length: 10000,
    scroll: 255,
    march: 148,
    ashHp: 2,
    tutorial: false,
    scrap: 65,
    ember: 20,
    rations: 6,
    xp: 60,
    spawns: wave(480, 500, [
      ["pool", [0]],
      ["ash", [0, 1, 2], undefined, 8],
      ["pool", [2]],
      ["ash", [0, 1, 2], undefined, 10],
      ["barrel", [0]],
      ["spike", [2], undefined, 2],
      ["pool", [0, 2]],
      ["ash", [0, 1, 2], undefined, 12],
      ["plate", [1], 4],
      ["pool", [1]],
      ["drum", [2], undefined, 2],
      ["ash", [0, 1, 2], undefined, 14],
      ["pylons", [0, 2]],
      ["pool", [2]],
      ["barrel", [1]],
      ["ash", [0, 1, 2], undefined, 12],
      ["pool", [0, 1]],
      ["ash", [0, 1, 2], undefined, 16],
    ]),
  },
  {
    id: "lanterns",
    name: "Twin Lanterns",
    blurb: "Choice Pylons sit on the shoulders. Shoot left for Overclock, right for Plating.",
    length: 10200,
    scroll: 260,
    march: 154,
    ashHp: 3,
    tutorial: false,
    scrap: 70,
    ember: 16,
    rations: 10,
    xp: 65,
    spawns: [
      { at: 500, kind: "pylons", lanes: [0, 2] },
      horde(900, 10),
      { at: 1600, kind: "plate", lanes: [0], hits: 4 },
      { at: 1600, kind: "plate", lanes: [2], hits: 3 },
      { at: 2100, kind: "barrel", lanes: [1] },
      { at: 2500, kind: "pylons", lanes: [0, 2] },
      horde(2900, 12),
      { at: 3600, kind: "spike", lanes: [1], count: 3 },
      horde(4100, 10),
      { at: 4700, kind: "drum", lanes: [2], count: 2 },
      { at: 5200, kind: "pylons", lanes: [0, 2] },
      { at: 5600, kind: "pool", lanes: [1] },
      horde(6000, 14),
      { at: 6800, kind: "plate", lanes: [1], hits: 5 },
      { at: 7300, kind: "pylons", lanes: [0, 2] },
      { at: 7800, kind: "barrel", lanes: [0] },
      horde(8400, 18),
    ],
  },
  {
    id: "approach",
    name: "Stack Approach",
    blurb: "The interchange rises behind you. Hold the prow until the last rank falls.",
    length: 11000,
    scroll: 270,
    march: 160,
    ashHp: 3,
    tutorial: false,
    scrap: 90,
    ember: 22,
    rations: 12,
    xp: 80,
    spawns: [
      horde(420, 10),
      { at: 1000, kind: "drum", lanes: [2], count: 2 },
      { at: 1400, kind: "pool", lanes: [1] },
      horde(1800, 12),
      { at: 2500, kind: "spike", lanes: [0], count: 3 },
      { at: 2900, kind: "barrel", lanes: [1] },
      { at: 3300, kind: "pylons", lanes: [0, 2] },
      horde(3700, 16),
      { at: 4500, kind: "plate", lanes: [1], hits: 5 },
      { at: 5000, kind: "drum", lanes: [0], count: 2 },
      { at: 5400, kind: "pool", lanes: [2] },
      horde(5800, 14),
      { at: 6500, kind: "spike", lanes: [2], count: 2 },
      { at: 6900, kind: "barrel", lanes: [0] },
      { at: 7300, kind: "pylons", lanes: [0, 2] },
      { at: 7700, kind: "drum", lanes: [1], count: 3 },
      horde(8200, 16),
      { at: 9000, kind: "pool", lanes: [2] },
      { at: 9400, kind: "plate", lanes: [1], hits: 4 },
      horde(9800, 20),
      { at: 10600, kind: "drum", lanes: [1], count: 2 },
    ],
  },
];

export const WARDENS: WardenDef[] = [
  {
    id: "mara",
    name: "Mara Voss",
    role: "Vanguard",
    blurb: "Holds the prow. Each rank thickens Warden plating.",
    portrait: "/game/mara.jpg",
    hpPerLevel: 16,
    dmgPerLevel: 0.04,
    ratePerLevel: 0.02,
    scrapPerLevel: 0,
  },
  {
    id: "kade",
    name: "Kade Rourke",
    role: "Forge Gunner",
    blurb: "Speaks in caliber. Each rank hits harder — hordes notice.",
    portrait: "/game/kade.jpg",
    hpPerLevel: 6,
    dmgPerLevel: 0.16,
    ratePerLevel: 0.04,
    scrapPerLevel: 0,
  },
  {
    id: "nim",
    name: "Nim Sol",
    role: "Pathfinder",
    blurb: "Reads the march. Each rank quickens the guns and the take.",
    portrait: "/game/nim.jpg",
    hpPerLevel: 4,
    dmgPerLevel: 0.04,
    ratePerLevel: 0.14,
    scrapPerLevel: 0.08,
  },
];

export const BUILDINGS: BuildingDef[] = [
  {
    id: "beacon",
    name: "Beacon Tower",
    blurb: "Amber lamp over the interchange. Higher ranks multiply run loot.",
    maxLevel: 3,
    effect: "Loot multiplier",
  },
  {
    id: "scrapyard",
    name: "Scrapyard",
    blurb: "Cranes pick the underpass clean. Idle scrap.",
    maxLevel: 4,
    produces: { scrap: 10 },
    effect: "Idle scrap",
  },
  {
    id: "distillery",
    name: "Ember Distillery",
    blurb: "Condenses blight-heat into usable ember.",
    maxLevel: 4,
    produces: { ember: 4 },
    effect: "Idle ember",
  },
  {
    id: "pantry",
    name: "Pantry",
    blurb: "Rations for the next hold. Keeps the roster standing.",
    maxLevel: 4,
    produces: { rations: 5 },
    effect: "Idle rations",
  },
  {
    id: "signal",
    name: "Signal Lab",
    blurb: "Listens down the highway. Reveals pylon forecasts on the map.",
    maxLevel: 3,
    effect: "Map intel",
  },
  {
    id: "barracks",
    name: "Barracks Bay",
    blurb: "Bunks in the stacked decks. Extra XP from every hold.",
    maxLevel: 4,
    effect: "Run XP",
  },
  {
    id: "foundry",
    name: "Foundry",
    blurb: "Turret blanks and plate. Extra prow damage against the march.",
    maxLevel: 4,
    effect: "Weapon power",
  },
  {
    id: "vault",
    name: "Warehouse Vault",
    blurb: "Caps how much idle take you can bank.",
    maxLevel: 4,
    effect: "Storage cap",
  },
];

export const MAP_NODES: Array<{
  id: string;
  x: number;
  y: number;
}> = [
  { id: "primer", x: 54, y: 79 },
  { id: "cinder", x: 28, y: 65 },
  { id: "drums", x: 74, y: 54 },
  { id: "trench", x: 26, y: 42 },
  { id: "lanterns", x: 72, y: 31 },
  { id: "approach", x: 50, y: 17 },
];

export function stageById(id: string): StageDef {
  const s = STAGES.find((st) => st.id === id);
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
}

export function buildingById(id: string): BuildingDef {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown building ${id}`);
  return b;
}

export function wardenById(id: string): WardenDef {
  const w = WARDENS.find((x) => x.id === id);
  if (!w) throw new Error(`Unknown warden ${id}`);
  return w;
}

export function buildingUpgradeCost(id: string, nextLevel: number): Record<Resource, number> {
  if (id === "beacon") {
    if (nextLevel === 2) return { scrap: 50, ember: 0, rations: 0 };
    if (nextLevel === 3) return { scrap: 90, ember: 20, rations: 0 };
  }
  const scale = nextLevel;
  return {
    scrap: 40 * scale,
    ember: 8 * scale,
    rations: 0,
  };
}

export function wardenUpgradeCost(level: number): Record<Resource, number> {
  return {
    scrap: 12 * level,
    ember: 4 * level,
    rations: 2 * level,
  };
}

export function lootMultiplier(beaconLevel: number): number {
  return 1 + Math.max(0, beaconLevel - 1) * 0.25;
}

export function storageCap(vaultLevel: number): number {
  return 180 + vaultLevel * 90;
}

export function starsFor(hpRatio: number, salvage: number, overheated: boolean): 0 | 1 | 2 | 3 {
  if (hpRatio <= 0) return 0;
  if (hpRatio >= 0.8 && salvage >= 14 && !overheated) return 3;
  if (hpRatio >= 0.5) return 2;
  return 1;
}
