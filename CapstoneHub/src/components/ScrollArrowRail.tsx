import { cn } from "@/lib/utils";
import { STAGE_ACCENT_CLASSES } from "@/config/stages";
import type { StageId } from "@/config/stages";

interface ScrollArrowRailProps {
  stage: { id: StageId };
}

/** One big downward arrow per section, colored by stage */
export function ScrollArrowRail({ stage }: ScrollArrowRailProps) {
  return (
    <aside
      className="hidden lg:flex flex-col items-center justify-center shrink-0 w-20 xl:w-24 self-stretch py-8"
      aria-hidden
    >
      <svg
        viewBox="0 0 12 24"
        className={cn("w-10 h-20 xl:w-12 xl:h-24 shrink-0 fill-current", STAGE_ACCENT_CLASSES[stage.id])}
        aria-hidden
      >
        {/* Down arrow: V-notch tail (top), shaft, triangular head (bottom) */}
        <path d="M2 0 L6 4 L10 0 L8 4 L8 14 L6 24 L4 14 L4 4 Z" />
      </svg>
    </aside>
  );
}
