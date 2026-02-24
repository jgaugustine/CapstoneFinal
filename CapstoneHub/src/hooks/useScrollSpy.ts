import { useState, useEffect } from "react";
import type { StageId } from "@/config/stages";

const STAGE_IDS: StageId[] = ["light", "sensor", "readout-digitization", "post"];

export function useScrollSpy(): StageId | null {
  const [activeStage, setActiveStage] = useState<StageId | null>(null);

  useEffect(() => {
    const sections = STAGE_IDS.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as StageId;
            if (STAGE_IDS.includes(id)) setActiveStage(id);
            break;
          }
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return activeStage;
}
