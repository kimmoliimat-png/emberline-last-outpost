import { useEffect, useMemo, useRef } from "react";
import { Lock } from "lucide-react";
import { STAGES, THEMES, type ThemeId } from "../data/catalog";
import { isStageUnlocked, useGame } from "../store";
import { audio } from "../audio";
import { BottomNav, ResourceBar } from "./chrome";

const GAP = 112;
const PAD_BOTTOM = 150;
const PAD_TOP = 80;

export function MapScreen() {
  const save = useGame((s) => s.save);
  const startRun = useGame((s) => s.startRun);
  const seenBrief = save.seenBrief;
  const markBrief = useGame((s) => s.markBrief);
  const scroller = useRef<HTMLDivElement>(null);
  const mapH = PAD_TOP + PAD_BOTTOM + STAGES.length * GAP;

  const regions = useMemo(() => {
    const out: Array<{ theme: ThemeId; region: string; start: number; count: number }> = [];
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      const last = out[out.length - 1];
      if (!last || last.theme !== s.theme) out.push({ theme: s.theme, region: s.region, start: i, count: 1 });
      else last.count += 1;
    }
    return out;
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) {
      if (isStageUnlocked(save, STAGES[i].id)) idx = i;
    }
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
          {regions.map((band) => {
            const theme = THEMES[band.theme];
            const top = mapH - PAD_BOTTOM - (band.start + band.count - 1) * GAP - GAP / 2;
            const height = band.count * GAP;
            return (
              <div
                key={band.theme}
                className="absolute inset-x-0"
                style={{
                  top,
                  height,
                  background: `linear-gradient(180deg, ${theme.mapTo} 0%, ${theme.mapFrom} 100%)`,
                }}
              >
                <p
                  className="pointer-events-none absolute left-3 top-3 text-[10px] font-medium uppercase tracking-[0.22em]"
                  style={{ color: theme.accent }}
                >
                  {theme.region}
                </p>
              </div>
            );
          })}
          <div className="pointer-events-none absolute left-1/2 top-8 bottom-8 w-1 -translate-x-1/2 rounded-full bg-amber/35" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${mapH}`} preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#f4b942"
              strokeOpacity="0.7"
              strokeWidth="1.4"
              strokeDasharray="2 1.4"
              points={STAGES.map((_, i) => {
                const x = i % 2 === 0 ? 32 : 68;
                const y = mapH - PAD_BOTTOM - i * GAP;
                return `${x},${y}`;
              }).join(" ")}
            />
          </svg>
          {STAGES.map((stage, i) => {
            const unlocked = isStageUnlocked(save, stage.id);
            const rec = save.stages[stage.id];
            const current = unlocked && !rec?.cleared;
            const x = i % 2 === 0 ? 32 : 68;
            const y = mapH - PAD_BOTTOM - i * GAP;
            const theme = THEMES[stage.theme];
            return (
              <button
                key={stage.id}
                data-hold={i}
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  audio.unlock();
                  startRun(stage.id);
                }}
                style={{ left: `${x}%`, top: y, borderColor: current ? theme.accent : undefined }}
                className={`absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-md border px-2.5 py-2 text-left shadow-sm backdrop-blur-sm disabled:opacity-45 ${
                  current ? "border-amber bg-bg/95" : "border-border bg-bg/88"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                  {theme.region}
                </p>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display text-xl leading-none text-fg">
                    {String(i + 1).padStart(2, "0")} {stage.name}
                  </span>
                  {!unlocked ? <Lock className="size-3.5 shrink-0 text-faint" /> : null}
                </div>
                <Stars count={rec?.stars ?? 0} />
              </button>
            );
          })}
        </div>
      </div>
      <p className="px-4 py-2 text-center text-xs text-muted">
        {STAGES.filter((s) => save.stages[s.id]?.cleared).length}/{STAGES.length} holds cleared · swipe north
      </p>
      <BottomNav active="map" />
      {!seenBrief ? (
        <div className="absolute inset-0 z-20 flex items-center bg-bg-deep/55 p-5 pb-28">
          <div className="w-full rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-3xl text-amber">Warden brief</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Fifty holds up the Emberline. Primer Cut teaches the guns. Clear a hold to open the next node north. The grade climbs through street, wash, jungle, salt, night, ice, kiln, and the Ember Heart.
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
