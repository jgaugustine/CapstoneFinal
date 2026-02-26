import { cn } from "@/lib/utils";
import { STAGES } from "@/config/stages";
import type { StageId } from "@/config/stages";
import type { MouseEvent } from "react";

interface PipelineStepsProps {
  activeStage: StageId | null;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

function handleStageClick(event: MouseEvent<HTMLAnchorElement>, id: StageId) {
  event.preventDefault();
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function PipelineSteps({ activeStage, orientation = "vertical", className }: PipelineStepsProps) {
  return (
    <nav
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
      aria-label="Pipeline stages"
    >
      {STAGES.map((stage) => {
        const Icon = stage.icon;
        const isActive = activeStage === stage.id;
        return (
          <a
            key={stage.id}
            href={`#${stage.id}`}
            onClick={(event) => handleStageClick(event, stage.id)}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate">{stage.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
