import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 md:px-12">
        {/* Wordmark */}
        <Link
          to="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              const first = document.getElementById("light");
              if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className="font-mono text-sm font-semibold tracking-[0.2em] uppercase text-foreground transition-opacity hover:opacity-80"
        >
          Capstone
        </Link>

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

        {/* Right: vocab button + tagline */}
        <div className="flex items-center gap-4">
          <Link
            to="/vocab"
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-foreground/90 hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors hover:bg-white/5 hover:border-foreground/30"
          >
            Vocab
          </Link>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-foreground/60">
            light → image
          </span>
        </div>
      </div>
    </header>
  );
}
