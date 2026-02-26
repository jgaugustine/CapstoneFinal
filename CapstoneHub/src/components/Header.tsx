import { useScrollSpy } from "@/hooks/useScrollSpy";
import { STAGES } from "@/config/stages";
import type { StageId } from "@/config/stages";
import type { MouseEvent } from "react";

function handleStageClick(event: MouseEvent<HTMLAnchorElement>, id: StageId) {
  event.preventDefault();
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function Header() {
  const activeStage = useScrollSpy();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 md:px-12">
        {/* Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="font-mono text-sm font-semibold tracking-[0.2em] uppercase text-foreground transition-opacity hover:opacity-80"
        >
          Capstone
        </a>

        {/* Pipeline chain: 5 stages as connected beads */}
        <nav
          className="hidden md:flex items-center gap-0.5"
          aria-label="Pipeline stages"
        >
          {STAGES.map((stage, i) => {
            const isActive = activeStage === stage.id;
            return (
              <a
                key={stage.id}
                href={`#${stage.id}`}
                onClick={(event) => handleStageClick(event, stage.id)}
                className={`
                  group flex items-center gap-0.5 transition-all duration-300
                  ${i < STAGES.length - 1 ? "pr-0.5" : ""}
                `}
                title={stage.label}
              >
                <span
                  className={`
                    flex h-2 w-2 shrink-0 rounded-full transition-all duration-300
                    ${isActive ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary))]" : "bg-muted-foreground/40 group-hover:bg-muted-foreground/70"}
                  `}
                />
                {i < STAGES.length - 1 && (
                  <span
                    className={`
                      h-px w-2 transition-colors duration-300
                      ${isActive ? "bg-primary/60" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"}
                    `}
                    aria-hidden
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: subtle tagline or spacer */}
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50">
          light → image
        </span>
      </div>
    </header>
  );
}
