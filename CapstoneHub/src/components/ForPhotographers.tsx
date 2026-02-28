import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_ACCENT_CLASSES, STAGE_BORDER_CLASSES } from "@/config/stages";
import type { StageConfig } from "@/config/stages";

interface ForPhotographersProps {
  stage: StageConfig;
  className?: string;
}

export function ForPhotographers({ stage, className }: ForPhotographersProps) {
  return (
    <div
      className={cn(
        "pl-4 border-l-2",
        STAGE_BORDER_CLASSES[stage.id],
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Camera className={cn("h-5 w-5", STAGE_ACCENT_CLASSES[stage.id])} aria-hidden />
        <h3 className="font-mono text-base font-semibold text-foreground">
          For Photographers
        </h3>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {stage.takeaways.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={cn("shrink-0", STAGE_ACCENT_CLASSES[stage.id])}>→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
