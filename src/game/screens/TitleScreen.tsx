import { audio } from "../audio";
import { isStageUnlocked, useGame } from "../store";
import { STAGES } from "../data/catalog";

function resumeStage() {
  const save = useGame.getState().save;
  const id = save.lastStageId ?? "primer";
  if (isStageUnlocked(save, id)) return id;
  let last = "primer";
  for (const s of STAGES) if (isStageUnlocked(save, s.id)) last = s.id;
  return last;
}

function enterHold() {
  try {
    audio.unlock();
    audio.setMuted(useGame.getState().save.muted);
  } catch {
    /* gesture / autoplay policies */
  }
  useGame.getState().startRun(resumeStage());
}

function openMap() {
  try {
    audio.unlock();
  } catch {
    /* autoplay */
  }
  useGame.getState().go("map");
}

export function TitleScreen() {
  const save = useGame((s) => s.save);
  const hasLine = STAGES.some((s) => save.stages[s.id]?.attempts);
  return (
    <div className="relative flex h-full w-full select-none flex-col">
      <img
        src="/game/title.jpg"
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-deep/25 via-bg-deep/20 to-bg-deep/90" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-stretch justify-center gap-5 px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-amber">Solar-fungal blight year 7</p>
        <h1 className="font-display text-7xl leading-[0.85] text-fg">
          Emberline
          <span className="mt-1 block text-4xl text-amber">Last Outpost</span>
        </h1>
        <p className="max-w-[34ch] text-sm leading-relaxed text-muted">
          A Warden holds the Emberline. Slide the grade, burn the Ashwalker horde, and raise towers and walls when the salvage is enough.
        </p>
        <button
          id="enter-emberline"
          type="button"
          data-enter="1"
          onClick={enterHold}
          className="relative z-20 flex h-16 w-full items-center justify-center rounded-md bg-amber font-display text-3xl tracking-wide text-bg"
        >
          {hasLine ? "Continue the hold" : "Enter the Emberline"}
        </button>
        <button
          type="button"
          data-open-map="1"
          onClick={openMap}
          className="relative z-20 flex h-14 w-full items-center justify-center rounded-md border border-amber bg-bg/70 font-display text-2xl tracking-wide text-amber"
        >
          Highway map
        </button>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-faint">Slide to strafe · rifle fires itself</p>
      </div>
    </div>
  );
}
