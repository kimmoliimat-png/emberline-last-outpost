import { useEffect, useMemo, useRef } from "react";
import { Lock } from "lucide-react";
import { STAGES, THEMES } from "../data/catalog";
import { isStageUnlocked, useGame } from "../store";
import { audio } from "../audio";
import { BottomNav, ResourceBar } from "./chrome";

const GAP = 118;
const PAD_BOTTOM = 170;
const PAD_TOP = 96;

function roadX(i: number) {
  return 50 + Math.sin(i * 0.51 + 0.35) * 10;
}

function landmark(name: string): { kind: string; hint: string } {
  const n = name.toLowerCase();
  if (n.includes("culvert")) return { kind: "culvert", hint: "underpass" };
  if (n.includes("overpass") || n.includes("stack")) return { kind: "overpass", hint: "interchange" };
  if (n.includes("well")) return { kind: "well", hint: "wellhead" };
  if (n.includes("ridge")) return { kind: "ridge", hint: "ridge" };
  if (n.includes("dune")) return { kind: "dune", hint: "dune notch" };
  if (n.includes("wash")) return { kind: "wash", hint: "wash" };
  if (n.includes("mile") || n.includes("marker")) return { kind: "mile", hint: "mile marker" };
  if (n.includes("shoulder")) return { kind: "shoulder", hint: "shoulder" };
  if (n.includes("shimmer")) return { kind: "heat", hint: "heat haze" };
  if (n.includes("lantern") || n.includes("sodium") || n.includes("neon") || n.includes("blackout") || n.includes("midnight") || n.includes("signal") || n.includes("grid"))
    return { kind: "lamp", hint: "lamp" };
  if (n.includes("ice") || n.includes("frost") || n.includes("gale") || n.includes("winter") || n.includes("white grade"))
    return { kind: "ice", hint: "ice" };
  if (n.includes("kiln") || n.includes("slag") || n.includes("crucible") || n.includes("ashfall") || n.includes("red mouth") || n.includes("ember vein"))
    return { kind: "kiln", hint: "kiln" };
  if (n.includes("heart") || n.includes("spore") || n.includes("mycel") || n.includes("bloom") || n.includes("pylon") || n.includes("the hold") || n.includes("heartlight"))
    return { kind: "heart", hint: "heart" };
  if (n.includes("rot") || n.includes("canopy") || n.includes("mosquito") || n.includes("vine") || n.includes("wet") || n.includes("root") || n.includes("trench"))
    return { kind: "jungle", hint: "trench" };
  if (n.includes("plate") || n.includes("alkali") || n.includes("flats") || n.includes("bone") || n.includes("mirage") || n.includes("crystal"))
    return { kind: "salt", hint: "flats" };
  if (n.includes("scorpion") || n.includes("sunkill") || n.includes("ochre")) return { kind: "dune", hint: "wash" };
  if (n.includes("primer") || n.includes("cut") || n.includes("grade")) return { kind: "cut", hint: "cut" };
  return { kind: "cut", hint: "hold" };
}

function Mark({ kind, accent }: { kind: string; accent: string }) {
  const c = accent;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="shrink-0">
      {kind === "culvert" ? <path d="M3 11h12v3H3zM4 11c0-4 10-4 10 0" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "overpass" ? <path d="M2 12h14M4 12V7h10v5" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "well" ? <circle cx="9" cy="9" r="5" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "ridge" ? <path d="M2 13l5-8 4 5 5-6v9H2z" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "dune" ? <path d="M2 13c3-6 6-6 8 0 2-5 4-5 6 0" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "wash" ? <path d="M2 10c3 3 5-3 8 0s5-3 6 0" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "mile" ? (
        <>
          <rect x="7" y="3" width="4" height="12" fill="none" stroke={c} strokeWidth="1.5" />
          <path d="M7 7h4" stroke={c} strokeWidth="1.5" />
        </>
      ) : null}
      {kind === "shoulder" ? <path d="M3 14V4h3l7 5H9l7 5H3z" fill="none" stroke={c} strokeWidth="1.5" /> : null}
      {kind === "heat" ? <path d="M6 14c0-4 6-4 6-8 0 4 6 4 0 8" fill="none" stroke={c} strokeWidth="1.5" /> : null}
      {kind === "lamp" ? (
        <>
          <path d="M9 15V8" stroke={c} strokeWidth="1.5" />
          <circle cx="9" cy="6" r="3" fill="none" stroke={c} strokeWidth="1.5" />
        </>
      ) : null}
      {kind === "ice" ? <path d="M9 3v12M4 7l10 6M14 7L4 13" stroke={c} strokeWidth="1.4" /> : null}
      {kind === "kiln" ? <path d="M4 14V8l5-5 5 5v6H4z" fill="none" stroke={c} strokeWidth="1.5" /> : null}
      {kind === "heart" ? <circle cx="9" cy="9" r="5" fill="none" stroke={c} strokeWidth="1.6" /> : null}
      {kind === "jungle" ? <path d="M9 15V7M5 12c2-5 6-5 8 0M6 6c2 3 4 3 6 0" fill="none" stroke={c} strokeWidth="1.5" /> : null}
      {kind === "salt" ? <path d="M9 3l5 8H4l5-8zM4 14h10" fill="none" stroke={c} strokeWidth="1.5" /> : null}
      {kind === "cut" ? <path d="M3 12h12M6 12l3-7 3 7" fill="none" stroke={c} strokeWidth="1.6" /> : null}
    </svg>
  );
}

export function MapScreen() {
  const save = useGame((s) => s.save);
  const startRun = useGame((s) => s.startRun);
  const seenBrief = save.seenBrief;
  const markBrief = useGame((s) => s.markBrief);
  const scroller = useRef<HTMLDivElement>(null);
  const mapH = PAD_TOP + PAD_BOTTOM + STAGES.length * GAP;

  const regions = useMemo(() => {
    const out: Array<{ theme: (typeof STAGES)[number]["theme"]; region: string; start: number; count: number }> = [];
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      const last = out[out.length - 1];
      if (!last || last.theme !== s.theme) out.push({ theme: s.theme, region: s.region, start: i, count: 1 });
      else last.count += 1;
    }
    return out;
  }, []);

  const path = STAGES.map((_, i) => {
    const x = roadX(i);
    const y = mapH - PAD_BOTTOM - i * GAP;
    return `${x.toFixed(1)},${y}`;
  }).join(" ");

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let idx = 0;
    const last = save.lastStageId;
    for (let i = 0; i < STAGES.length; i++) {
      if (isStageUnlocked(save, STAGES[i].id)) idx = i;
    }
    const lastI = STAGES.findIndex((s) => s.id === last);
    if (lastI >= 0 && isStageUnlocked(save, last)) idx = lastI;
    const go = () => {
      const node = el.querySelector(`[data-hold="${idx}"]`);
      if (node) node.scrollIntoView({ block: "center", behavior: "instant" });
    };
    go();
    const t = window.setTimeout(go, 40);
    return () => window.clearTimeout(t);
  }, [save]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <ResourceBar />
      <div className="px-4 pb-2 pt-1">
        <h2 className="font-display text-4xl leading-none text-fg">The Emberline</h2>
        <p className="text-xs uppercase tracking-[0.16em] text-amber">North up the grade · {STAGES.length} holds</p>
      </div>
      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="relative w-full" style={{ height: mapH }}>
          <img
            src="/game/map.jpg?v=line3"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            crossOrigin="anonymous"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg-deep/40 via-transparent to-bg-deep/40" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${mapH}`} preserveAspectRatio="none">
            <polyline fill="none" stroke="#1a120c" strokeOpacity="0.55" strokeWidth="7.5" strokeLinejoin="round" strokeLinecap="round" points={path} />
            <polyline fill="none" stroke="#3a3228" strokeOpacity="0.9" strokeWidth="5.2" strokeLinejoin="round" strokeLinecap="round" points={path} />
            <polyline
              fill="none"
              stroke="#f4b942"
              strokeOpacity="0.75"
              strokeWidth="0.7"
              strokeDasharray="2.4 1.8"
              strokeLinejoin="round"
              points={path}
            />
          </svg>
          {regions.map((band) => {
            const theme = THEMES[band.theme];
            const top = mapH - PAD_BOTTOM - (band.start + band.count - 1) * GAP - GAP / 2;
            return (
              <p
                key={band.theme}
                className="pointer-events-none absolute left-2 z-10 rounded-sm bg-bg/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] backdrop-blur-sm"
                style={{ top: top + 8, color: theme.accent }}
              >
                {theme.region}
              </p>
            );
          })}
          <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 font-display text-3xl tracking-[0.35em] text-amber">
            N
          </div>
          {STAGES.map((stage, i) => {
            const unlocked = isStageUnlocked(save, stage.id);
            const rec = save.stages[stage.id];
            const current = unlocked && !rec?.cleared;
            const x = roadX(i);
            const y = mapH - PAD_BOTTOM - i * GAP;
            const theme = THEMES[stage.theme];
            const mark = landmark(stage.name);
            const labelLeft = x >= 50;
            return (
              <div key={stage.id} className="absolute z-10" style={{ left: `${x}%`, top: y }}>
                <span
                  className={`absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${
                    current ? "border-amber bg-amber" : unlocked ? "border-amber bg-bg" : "border-faint bg-bg/80"
                  }`}
                />
                <button
                  data-hold={i}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    audio.unlock();
                    startRun(stage.id);
                  }}
                  className={`absolute top-1/2 flex w-44 -translate-y-1/2 items-center gap-1.5 rounded-sm border px-2 py-1 text-left shadow-md backdrop-blur-sm disabled:opacity-50 ${
                    labelLeft ? "right-3" : "left-3"
                  } ${current ? "border-amber bg-bg/92" : "border-border/70 bg-bg/72"}`}
                >
                  <Mark kind={mark.kind} accent={theme.accent} />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg leading-none text-fg">
                      {String(i + 1).padStart(2, "0")} {stage.name}
                    </span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-muted">
                      {mark.hint}
                      {rec?.stars ? ` · ${rec.stars}★` : ""}
                    </span>
                  </span>
                  {!unlocked ? <Lock className="ml-auto size-3 shrink-0 text-faint" /> : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <p className="px-4 py-2 text-center text-xs text-muted">
        {STAGES.filter((s) => save.stages[s.id]?.cleared).length}/{STAGES.length} holds on the line · swipe north
      </p>
      <BottomNav active="map" />
      {!seenBrief ? (
        <div className="absolute inset-0 z-20 flex items-center bg-bg-deep/55 p-5 pb-28">
          <div className="w-full rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-3xl text-amber">Warden brief</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Fifty holds up the Emberline. Each pin is a place on the highway — culverts, washes, overpasses, the Heart. Clear a hold to open the next stop north.
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
