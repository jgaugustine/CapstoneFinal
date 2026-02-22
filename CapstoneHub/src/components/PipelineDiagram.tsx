import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { STAGES } from "@/config/stages";

interface PipelineDiagramProps {
  className?: string;
}

export function PipelineDiagram({ className }: PipelineDiagramProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-6",
        className
      )}
    >
      <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        Camera signal chain
      </h3>
      <div className="flex flex-col gap-1">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <Link
              key={stage.id}
              to={stage.path}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-4 py-3",
                "border border-transparent hover:border-border hover:bg-muted/40",
                "transition-colors"
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-sm font-medium text-foreground">
                {stage.label}
              </span>
              {i < STAGES.length - 1 && (
                <span
                  className="ml-auto text-muted-foreground opacity-50"
                  aria-hidden
                >
                  ↓
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
