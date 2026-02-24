import { Sun, Cpu, Gauge, Palette } from "lucide-react";

const STAGES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "sensor", label: "Sensor", Icon: Cpu },
  { id: "readout-digitization", label: "Readout & Digitization", Icon: Gauge },
  { id: "post", label: "Post", Icon: Palette },
] as const;

export function HeroPipelineDiagram() {
  return (
    <figure
      className="mx-auto mt-12 md:mt-16 max-w-2xl px-6"
      aria-label="Camera signal chain: Light to Post-processing"
    >
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="flex flex-1 items-center">
            <div className="group flex flex-1 flex-col items-center gap-2">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 transition-colors group-hover:border-primary/50 group-hover:bg-primary/10 md:h-14 md:w-14"
                aria-hidden
              >
                <stage.Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary md:h-6 md:w-6" />
              </div>
              <span className="text-center font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-xs">
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="hidden shrink-0 flex-1 md:block"
                aria-hidden
              >
                <svg
                  viewBox="0 0 40 12"
                  className="h-3 w-full max-w-[48px] text-muted-foreground/40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M0 6h24" />
                  <path d="M28 2l8 4-8 4" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted-foreground/70">
        Light → Image
      </figcaption>
    </figure>
  );
}
