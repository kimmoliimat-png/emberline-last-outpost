export type Resource = "scrap" | "ember" | "rations";

export type SpawnKind =
  | "ash"
  | "spike"
  | "drum"
  | "pool"
  | "barrel"
  | "plate"
  | "pylons"
  | "brute";

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
  theme: ThemeId;
  region: string;
  index: number;
  look: HoldLook;
}

export type ThemeId = "asphalt" | "desert" | "jungle" | "salt" | "night" | "tundra" | "magma" | "core";

export interface HoldLook {
  road: string;
  flip: boolean;
  overlay: number;
  overlayAlpha: number;
  haze: number;
}

export interface ThemeVisual {
  id: ThemeId;
  region: string;
  road: string;
  overlay: number;
  overlayAlpha: number;
  shoulder: number;
  mote: number;
  ashTint: number | null;
  spark: number;
  mapFrom: string;
  mapTo: string;
  accent: string;
}

export const THEMES: Record<ThemeId, ThemeVisual> = {
  asphalt: {
    id: "asphalt",
    region: "The Grade",
    road: "/game/road.jpg?v=det1",
    overlay: 0x1a1008,
    overlayAlpha: 0.12,
    shoulder: 0x1a120c,
    mote: 0xc48a22,
    ashTint: null,
    spark: 0xffb347,
    mapFrom: "#24180e",
    mapTo: "#3a2a18",
    accent: "#c48a22",
  },
  desert: {
    id: "desert",
    region: "Cinder Wash",
    road: "/game/road-desert.jpg?v=det1",
    overlay: 0xc45c12,
    overlayAlpha: 0.1,
    shoulder: 0x3a2814,
    mote: 0xe8c070,
    ashTint: 0xffd9a0,
    spark: 0xffcc66,
    mapFrom: "#4a3014",
    mapTo: "#8a4a18",
    accent: "#e8a040",
  },
  jungle: {
    id: "jungle",
    region: "Green Rot",
    road: "/game/road-jungle.jpg?v=det1",
    overlay: 0x143018,
    overlayAlpha: 0.16,
    shoulder: 0x0e2212,
    mote: 0x7fa86a,
    ashTint: 0xb8d4a0,
    spark: 0x9ad47a,
    mapFrom: "#102414",
    mapTo: "#1c3a22",
    accent: "#7fa86a",
  },
  salt: {
    id: "salt",
    region: "Glass Flats",
    road: "/game/road-salt.jpg?v=det1",
    overlay: 0xd8d0c0,
    overlayAlpha: 0.08,
    shoulder: 0x3a3830,
    mote: 0xf3ead8,
    ashTint: 0xe8e0d0,
    spark: 0xffffff,
    mapFrom: "#3a3832",
    mapTo: "#5a564c",
    accent: "#d8d0c0",
  },
  night: {
    id: "night",
    region: "Blackout Mile",
    road: "/game/road-night.jpg?v=det1",
    overlay: 0x0a1028,
    overlayAlpha: 0.22,
    shoulder: 0x080c18,
    mote: 0xf4b942,
    ashTint: 0xc8b0e0,
    spark: 0x88aaff,
    mapFrom: "#0a1020",
    mapTo: "#182040",
    accent: "#88aaff",
  },
  tundra: {
    id: "tundra",
    region: "White Grade",
    road: "/game/road-tundra.jpg?v=det1",
    overlay: 0x88b8d8,
    overlayAlpha: 0.1,
    shoulder: 0x1c2830,
    mote: 0xe8f4ff,
    ashTint: 0xd0e8ff,
    spark: 0xc0e8ff,
    mapFrom: "#1c2830",
    mapTo: "#2a4048",
    accent: "#88b8d8",
  },
  magma: {
    id: "magma",
    region: "Kiln Road",
    road: "/game/road-magma.jpg?v=det1",
    overlay: 0x9b2f02,
    overlayAlpha: 0.14,
    shoulder: 0x1a0806,
    mote: 0xe85d04,
    ashTint: 0xff8860,
    spark: 0xff6a2a,
    mapFrom: "#2a0c08",
    mapTo: "#5a180c",
    accent: "#e85d04",
  },
  core: {
    id: "core",
    region: "Ember Heart",
    road: "/game/road-core.jpg?v=det1",
    overlay: 0xe85d04,
    overlayAlpha: 0.12,
    shoulder: 0x180c08,
    mote: 0xf4b942,
    ashTint: 0xffb060,
    spark: 0xffc14a,
    mapFrom: "#2a1408",
    mapTo: "#6a2a0c",
    accent: "#f4b942",
  },
};

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

export const WALL_COST = 16;
export const WALL_HP = 10;
export const WALL_Y = 1388;

function horde(at: number, count: number, lanes: number[] = [0, 1, 2]): SpawnEvent {
  return { at, kind: "ash", lanes, count };
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CAMPAIGN: Array<{
  theme: ThemeId;
  region: string;
  holds: Array<{ name: string; blurb: string }>;
}> = [
  {
    theme: "asphalt",
    region: "The Grade",
    holds: [
      { name: "Primer Cut", blurb: "Strafe, shoot, and raise a gun tower. Burn the first ranks before they reach you." },
      { name: "Cinder Shoulder", blurb: "The grade tightens. Keep the prow clear as the second rank finds its feet." },
      { name: "Mile Marker 9", blurb: "Nine miles of cracked asphalt and a horde that does not rest." },
      { name: "Rust Culvert", blurb: "The underpass funnels them. Strafe the mouth of the pipe." },
      { name: "Heat Shimmer", blurb: "Guns run hot. Pace the trigger or the line cooks itself." },
      { name: "Overpass Teeth", blurb: "Concrete fangs overhead. Salvage under the spans, then hold." },
      { name: "Stack Grade", blurb: "The interchange rises behind you. This is still the easy country." },
    ],
  },
  {
    theme: "desert",
    region: "Cinder Wash",
    holds: [
      { name: "Ochre Wash", blurb: "Sand eats the lane markers. The dead come in from the dunes." },
      { name: "Dune Cut", blurb: "A notch through the wash. Fast ranks, little cover." },
      { name: "Dry Well", blurb: "They pour from the wellhead. Bank scrap before the second surge." },
      { name: "Scorpion Grade", blurb: "Heatspikes skitter the shoulders. Prioritize the fast ones." },
      { name: "Glass Ridge", blurb: "Sun-baked plate. Break the shields or drown in the ranks behind." },
      { name: "Sunkill", blurb: "The wash ends in a white-hot mile. Do not let the drums through." },
    ],
  },
  {
    theme: "jungle",
    region: "Green Rot",
    holds: [
      { name: "Green Rot", blurb: "Vines take the grade. Sightlines die. Listen for the march." },
      { name: "Canopy Vein", blurb: "The road is a wet trench. Spores and ashwalkers share it." },
      { name: "Mosquito Cut", blurb: "They come in thin files, then all at once." },
      { name: "Vine Gauntlet", blurb: "Drums crash the undergrowth. Burn a lane and keep it." },
      { name: "Wet Mile", blurb: "Fire pools in the ruts. Strafe off the heat or the guns seize." },
      { name: "Root Trench", blurb: "The jungle exhales a last horde. Hold the trench mouth." },
    ],
  },
  {
    theme: "salt",
    region: "Glass Flats",
    holds: [
      { name: "White Plate", blurb: "Alkali crust. Every shot rings. The dead do not mind the glare." },
      { name: "Alkali Tongue", blurb: "A pale spit of road. Nowhere to hide, plenty to spend." },
      { name: "Blind Flats", blurb: "Mirage ranks. Count the feet, not the shimmer." },
      { name: "Bone Road", blurb: "Salt-eaten plate and drums. Crack the shields first." },
      { name: "Mirage Hold", blurb: "Two pylons in the white. Claim one. Survive the rest." },
      { name: "Crystal Shoulder", blurb: "The flats end in a crystal berm. The horde does not." },
    ],
  },
  {
    theme: "night",
    region: "Blackout Mile",
    holds: [
      { name: "Blackout Mile", blurb: "Sodium lamps and a dead grid. Muzzle flash is your map." },
      { name: "Sodium Vein", blurb: "Amber light, purple ash. Keep the center lane." },
      { name: "Neon Culvert", blurb: "Ruined signs strobe the horde. Do not chase ghosts." },
      { name: "Dead Grid", blurb: "The city hums empty. The march does not." },
      { name: "Signal Ghost", blurb: "Pylons still talk. Shoot to claim, then spend the overclock." },
      { name: "Midnight Prow", blurb: "Last lamp on the mile. Hold until dawn does not come." },
    ],
  },
  {
    theme: "tundra",
    region: "White Grade",
    holds: [
      { name: "White Grade", blurb: "Ice on the asphalt. They slide faster than they should." },
      { name: "Ice Culvert", blurb: "A frozen pipe. Ranks stack, then break." },
      { name: "Frost Lantern", blurb: "Claim the lanterns or freeze under the drums." },
      { name: "Gale Cut", blurb: "Wind shoves the horde. Strafe with it, not against." },
      { name: "Black Ice", blurb: "No traction, no mercy. Towers earn their keep." },
      { name: "Winter Stack", blurb: "The pass summit. The last warm thing is your muzzle." },
    ],
  },
  {
    theme: "magma",
    region: "Kiln Road",
    holds: [
      { name: "Kiln Road", blurb: "The grade cooks. Ember veins underfoot, drums on the boil." },
      { name: "Slag Approach", blurb: "Cinders for shoulders. Do not stand in the pools." },
      { name: "Ember Vein", blurb: "A glowing crack down the lane. The dead like the heat." },
      { name: "Crucible", blurb: "Everything that can burn, does. Pace the guns." },
      { name: "Ashfall", blurb: "The sky is cinder. Ranks hide in the fall, then they don't." },
      { name: "Red Mouth", blurb: "The kiln opens. Empty the magazine into it." },
    ],
  },
  {
    theme: "core",
    region: "Ember Heart",
    holds: [
      { name: "Spore Gate", blurb: "Mycelium cracks the road. The heart is still ahead." },
      { name: "Mycelial Cut", blurb: "Orange veins, living asphalt. They march in the bloom." },
      { name: "Heartlight", blurb: "The glow is a second sun. Do not look away from the ranks." },
      { name: "Last Pylon", blurb: "One more claim. Spend it like it is the last overclock." },
      { name: "Solar Bloom", blurb: "The blight flowers. Hordes come in sheets." },
      { name: "Ember Heart", blurb: "The line ends here. Hold the heart or the line is a rumor." },
      { name: "The Hold", blurb: "No more road. Only the last rank, and you." },
    ],
  },
];

const PRIMER_SPAWNS: SpawnEvent[] = [
  horde(240, 9),
  { at: 1100, kind: "barrel", lanes: [1] },
  horde(1600, 12),
  { at: 2400, kind: "pool", lanes: [0] },
  horde(2900, 14),
  { at: 3700, kind: "plate", lanes: [1], hits: 3 },
  horde(4300, 12),
  { at: 4900, kind: "spike", lanes: [2], count: 2 },
  { at: 5400, kind: "barrel", lanes: [0] },
  { at: 5900, kind: "pylons", lanes: [0, 2] },
  { at: 6500, kind: "drum", lanes: [1, 2], count: 2 },
  horde(7200, 20),
];

function buildSpawns(index: number, t: number): SpawnEvent[] {
  const r = rand(1000 + index * 97);
  const events: SpawnEvent[] = [];
  const gap = Math.round(500 - t * 90);
  let at = 260 + Math.round(r() * 40);
  const target = 6400 + Math.floor(t * 1800);
  let w = 0;
  while (at < target) {
    const roll = r();
    const late = at / target;
    if (w === 0 || roll < 0.52) {
      const n = 8 + Math.floor(t * 9) + Math.floor(late * 8);
      events.push(horde(at, Math.min(26, n)));
    } else if (roll < 0.62) {
      events.push({ at, kind: "barrel", lanes: [Math.floor(r() * 3)] });
    } else if (roll < 0.7) {
      events.push({ at, kind: "pylons", lanes: [0, 2] });
    } else if (roll < 0.78) {
      const hits = 3 + Math.floor(t * 2.4);
      events.push({ at, kind: "plate", lanes: [1], hits });
    } else if (roll < 0.86) {
      const n = 1 + Math.floor(t * 1.8);
      events.push({ at, kind: "spike", lanes: [Math.floor(r() * 3)], count: n });
    } else if (roll < 0.93 && t > 0.08) {
      const n = 1 + Math.floor(t * 2);
      events.push({ at, kind: "drum", lanes: [Math.floor(r() * 3)], count: n });
    } else {
      events.push({ at, kind: "pool", lanes: [Math.floor(r() * 3)] });
    }
    at += gap + Math.round(r() * 50);
    w += 1;
  }
  events.push(horde(at, Math.min(26, 16 + Math.floor(t * 10))));
  events.push({ at: Math.round(at * 0.68), kind: "brute", lanes: [1], count: 1 });
  if (!events.some((e) => e.kind === "pylons")) {
    events.push({ at: Math.round(at * 0.5), kind: "pylons", lanes: [0, 2] });
  }
  events.sort((a, b) => a.at - b.at);
  return events;
}

function holdLook(theme: ThemeId, index: number, name: string): HoldLook {
  const base = THEMES[theme];
  const n = name.toLowerCase();
  const slot = index % 3;
  let road = base.road;
  let flip = slot === 1;
  let overlay = base.overlay;
  let overlayAlpha = Math.min(0.22, base.overlayAlpha + (slot === 2 ? 0.05 : 0));
  let haze = 0.05 + slot * 0.04;
  if (theme === "asphalt") {
    if (n.includes("overpass") || n.includes("stack") || slot === 2) road = "/game/road-overpass.jpg?v=var1";
    if (n.includes("culvert")) {
      overlay = 0x081018;
      overlayAlpha = 0.24;
      haze = 0.2;
      flip = true;
    }
    if (n.includes("shimmer") || n.includes("heat")) {
      overlay = 0xc45c12;
      overlayAlpha = 0.18;
      haze = 0.16;
    }
  } else if (theme === "desert") {
    if (slot !== 0 || n.includes("well") || n.includes("dune") || n.includes("dry")) road = "/game/road-desert2.jpg?v=var1";
    if (n.includes("sunkill") || n.includes("glass")) {
      overlay = 0xffaa44;
      overlayAlpha = 0.16;
      haze = 0.18;
    }
  } else if (theme === "jungle") {
    if (slot !== 0 || n.includes("canopy") || n.includes("wet") || n.includes("root")) road = "/game/road-jungle2.jpg?v=var1";
    if (n.includes("rot") || n.includes("gauntlet")) {
      overlay = 0x0a2010;
      overlayAlpha = 0.22;
      haze = 0.2;
    }
  } else if (theme === "night") {
    if (slot !== 0 || n.includes("neon") || n.includes("sodium") || n.includes("midnight")) road = "/game/road-night2.jpg?v=var1";
    if (n.includes("blackout") || n.includes("grid")) {
      overlay = 0x050814;
      overlayAlpha = 0.3;
      haze = 0.12;
    }
  } else if (theme === "salt" && (n.includes("blind") || n.includes("mirage"))) {
    overlay = 0xf0e8d8;
    overlayAlpha = 0.16;
    haze = 0.22;
    flip = true;
  } else if (theme === "tundra" && (n.includes("gale") || n.includes("ice") || n.includes("winter"))) {
    overlay = 0xa8d0e8;
    overlayAlpha = 0.16;
    haze = 0.18;
    flip = slot !== 0;
  } else if (theme === "magma" && (n.includes("crucible") || n.includes("ashfall") || n.includes("red"))) {
    overlay = 0xff3a00;
    overlayAlpha = 0.2;
    haze = 0.16;
  } else if (theme === "core") {
    overlayAlpha = 0.1 + (index % 3) * 0.05;
    haze = 0.1 + (index % 3) * 0.05;
    flip = slot === 2;
  }
  return { road, flip, overlay, overlayAlpha, haze };
}

function buildCampaign(): StageDef[] {
  const out: StageDef[] = [];
  let index = 0;
  for (const region of CAMPAIGN) {
    for (const hold of region.holds) {
      const t = index / 49;
      const id = index === 0 ? "primer" : `hold-${String(index + 1).padStart(2, "0")}`;
      const spawns = index === 0 ? PRIMER_SPAWNS : buildSpawns(index, t);
      const lastAt = Math.max(...spawns.map((e) => e.at));
      out.push({
        id,
        name: hold.name,
        blurb: hold.blurb,
        length: lastAt + 860,
        scroll: Math.round(226 + t * 28),
        march: Math.round(132 + t * 40),
        ashHp: 2 + Math.floor(t * 2.2),
        tutorial: index === 0,
        scrap: Math.round(70 + t * 48),
        ember: Math.round(16 + t * 16),
        rations: Math.round(10 + t * 8),
        xp: Math.round(40 + t * 64),
        spawns,
        theme: region.theme,
        region: region.region,
        index,
        look: holdLook(region.theme, index, hold.name),
      });
      index += 1;
    }
  }
  return out;
}

export const STAGES: StageDef[] = buildCampaign();

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
}> = STAGES.map((s, i) => ({
  id: s.id,
  x: i % 2 === 0 ? 34 : 66,
  y: i,
}));

export function nextStageId(id: string): string | null {
  const i = STAGES.findIndex((s) => s.id === id);
  if (i < 0 || i >= STAGES.length - 1) return null;
  return STAGES[i + 1].id;
}

export function themeOf(stage: StageDef): ThemeVisual {
  return THEMES[stage.theme];
}

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
