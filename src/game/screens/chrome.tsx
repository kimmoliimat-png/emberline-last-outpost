import type { ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useGame } from "../store";

export function ResourceBar() {
  const save = useGame((s) => s.save);
  const toggleMute = useGame((s) => s.toggleMute);
  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      <Chip label="Scrap" value={save.scrap} />
      <Chip label="Ember" value={save.ember} accent />
      <Chip label="Rations" value={save.rations} />
      <button
        type="button"
        className="ml-auto flex size-11 items-center justify-center rounded-md border border-border bg-surface text-amber"
        onClick={toggleMute}
        aria-label={save.muted ? "Unmute" : "Mute"}
      >
        {save.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
    </div>
  );
}

function Chip({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">{label}</div>
      <div className={`font-display text-xl leading-none tabular-nums ${accent ? "text-amber" : "text-fg"}`}>
        {value}
      </div>
    </div>
  );
}

export function BottomNav({ active }: { active: "map" | "hub" | "roster" }) {
  const go = useGame((s) => s.go);
  const items = [
    { id: "map" as const, label: "Emberline" },
    { id: "hub" as const, label: "The Stack" },
    { id: "roster" as const, label: "Wardens" },
  ];
  return (
    <nav className="grid grid-cols-3 gap-1 border-t border-border bg-bg/90 px-2 pb-6 pt-2">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => go(it.id)}
          className={`rounded-md px-2 py-2.5 font-display text-lg tracking-wide ${
            active === it.id ? "bg-surface-2 text-amber" : "text-muted"
          }`}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-12 rounded-md bg-amber px-5 font-display text-2xl tracking-wide text-bg disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-md border border-border bg-surface px-5 font-display text-2xl tracking-wide text-fg ${className}`}
    >
      {children}
    </button>
  );
}

export function CostLine({ cost }: { cost: { scrap: number; ember: number; rations: number } }) {
  const parts = [
    cost.scrap ? `${cost.scrap} scrap` : null,
    cost.ember ? `${cost.ember} ember` : null,
    cost.rations ? `${cost.rations} rations` : null,
  ].filter(Boolean);
  return <span className="text-sm text-muted">{parts.join(" · ") || "Maxed"}</span>;
}
