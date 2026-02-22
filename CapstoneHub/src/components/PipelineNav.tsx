import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { STAGES, type StageId } from "@/config/stages";

interface PipelineNavProps {
  activeStage?: StageId | null;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function PipelineNav({ activeStage, collapsed, className }: PipelineNavProps) {
  return (
    <nav
      className={cn(
        "flex flex-col w-[220px] shrink-0 border-r border-border bg-card/50",
        collapsed && "w-16",
        className
      )}
      aria-label="Camera pipeline"
    >
      <div className="p-4">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pipeline
        </h2>
      </div>
      <div className="relative flex flex-1 flex-col px-3 pb-6">
        {/* Connecting line */}
        <div
          className="absolute left-6 top-0 bottom-6 w-px bg-border"
          aria-hidden
        />
        <div className="relative flex flex-col gap-1">
          {STAGES.map((stage, i) => {
            const isActive = activeStage === stage.id;
            const Icon = stage.icon;
            return (
              <NavLink
                key={stage.id}
                to={stage.path}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-muted/60",
                  isActive
                    ? "bg-muted/80 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Accent bar on active */}
                {isActive && (
                  <div
                    className="absolute inset-y-1 left-0 w-1 rounded-r bg-primary"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    isActive ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!collapsed && (
                  <span className="truncate">{stage.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
