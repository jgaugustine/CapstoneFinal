import { STAGES, STAGE_ACCENT_CLASSES, STAGE_BORDER_CLASSES } from "@/config/stages";
import { cn } from "@/lib/utils";

function scrollToStage(id: string) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function HeroPipelineDiagram() {
  return (
    <figure
      className="mx-auto mt-8 md:mt-12 max-w-3xl"
      aria-label="Camera signal chain: Light to Post-processing"
    >
      <p className="text-center text-sm text-muted-foreground/90 mb-6 font-mono">
        Light + Sensor + Readout → Demosaicing → Post-processing
      </p>

      <div className="flex items-center justify-center gap-4 md:gap-8">
        {/* Lens */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="rounded-full border-2 border-muted-foreground/30 bg-muted/20 p-4 md:p-6">
            <svg
              viewBox="0 0 48 48"
              className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="24" cy="24" r="8" />
              <circle cx="24" cy="24" r="4" opacity="0.6" />
              <path d="M24 8v4M24 36v4M8 24h4M36 24h4" />
              <path d="M14 14l2.8 2.8M31.2 31.2l2.8 2.8M14 34l2.8-2.8M31.2 16.8l2.8-2.8" />
            </svg>
          </div>
        </div>

        {/* Arrow to sensor */}
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-muted-foreground/40" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>

        {/* Sensor panel with gradient */}
        <div
          className="relative h-32 w-24 md:h-40 md:w-32 shrink-0 rounded-lg border border-border/60 overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg, 
                hsl(var(--stage-light) / 0.4) 0%, 
                hsl(var(--stage-sensor) / 0.3) 35%, 
                hsl(var(--stage-readout-demosaic) / 0.3) 65%, 
                hsl(var(--stage-post) / 0.4) 100%
              )
            `,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: "8px 8px",
            }}
          />
        </div>

        {/* Arrow to icons */}
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-muted-foreground/40" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>

        {/* Vertical icon column */}
        <div className="flex flex-col gap-2">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => scrollToStage(stage.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border bg-card/80 p-2 transition-all hover:bg-card focus:outline-none",
                  STAGE_BORDER_CLASSES[stage.id]
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    STAGE_ACCENT_CLASSES[stage.id]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono font-medium uppercase tracking-wider text-foreground hidden sm:block">
                  {stage.id === "readout-demosaic" ? "Digitization" : stage.label.split(" & ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <figcaption className="mt-6 text-center text-xs text-muted-foreground/70 font-mono">
        Light → Image
      </figcaption>
    </figure>
  );
}
