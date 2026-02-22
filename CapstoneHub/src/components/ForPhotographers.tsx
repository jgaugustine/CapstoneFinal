import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageConfig } from "@/config/stages";

interface ForPhotographersProps {
  stage: StageConfig;
  className?: string;
}

export function ForPhotographers({ stage, className }: ForPhotographersProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        "border-l-4 border-l-primary",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="font-mono text-base font-semibold text-foreground">
          For Photographers
        </h3>
      </div>
      <p className="text-sm font-medium text-foreground mb-3">
        {stage.guidingQuestion}
      </p>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {stage.takeaways.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary shrink-0">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
