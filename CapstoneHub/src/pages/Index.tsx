import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { STAGES, STAGE_ACCENT_CLASSES, STAGE_BORDER_CLASSES } from "@/config/stages";
import type { StageId } from "@/config/stages";
import { Header } from "@/components/Header";
import { StageSection } from "@/components/StageSection";
import { PipelineSteps } from "@/components/PipelineSteps";
import { ForPhotographers } from "@/components/ForPhotographers";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/utils";

const SECTION_BG: Record<StageId, string> = {
  light: "bg-section-light",
  sensor: "bg-section-sensor",
  "readout-demosaic": "bg-section-readout-demosaic",
  post: "bg-section-post",
};

const STAGE_GRID_CLASS =
  "w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,68ch)_minmax(260px,300px)] gap-x-0 lg:items-stretch";

// Persist across navigations within the same tab
let savedScrollY = 0;
let savedScrollRatio = 0; // scrollTop / maxScroll, survives layout shifts (e.g. hero image loading)
let savedSectionId: StageId | null = null;

export default function Index() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeStage = useScrollSpy();

  const saveScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    savedScrollY = el.scrollTop;
    savedScrollRatio = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
    const sectionIds: StageId[] = ["light", "sensor", "readout-demosaic", "post"];
    const mid = el.scrollTop + el.clientHeight / 2;
    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section) {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (mid >= top && mid <= bottom) {
          savedSectionId = id;
          return;
        }
        if (top <= mid) savedSectionId = id;
      }
    }
  };

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const sectionId = savedSectionId;

    const restore = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      // Use ratio when content may have shifted (e.g. hero image loaded); fallback to pixel
      const targetY =
        savedScrollRatio > 0
          ? Math.round(savedScrollRatio * maxScroll)
          : savedScrollY;
      if (targetY > 0 && Math.abs(container.scrollTop - targetY) > 20) {
        container.style.scrollSnapType = "none";
        container.scrollTo({ top: targetY, behavior: "auto" });
        requestAnimationFrame(() => {
          container.style.scrollSnapType = "";
        });
        return;
      }
      // Fallback: scroll to saved section (use center to avoid "too high")
      if (sectionId && container.scrollTop < 100) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "center" });
        }
      }
    };

    restore();
    // Retry after content loads (images, etc.) - ratio helps when layout changes
    const t1 = setTimeout(restore, 100);
    const t2 = setTimeout(restore, 400);

    const handleScroll = () => saveScroll();
    container.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      container.removeEventListener("scroll", handleScroll);
      saveScroll();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Mobile: horizontal steps */}
        <aside className="lg:hidden px-4 py-3 overflow-x-auto shrink-0 border-b border-border/50">
          <PipelineSteps activeStage={activeStage} orientation="horizontal" />
        </aside>

        {/* Scroll area with scroll-snap */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-proximity bg-background"
        >
          <div className="flex min-h-full flex-col min-w-0">
          {/* Hero: pipeline diagram image */}
          <section className="snap-start min-h-[60vh] w-full relative overflow-hidden flex items-center justify-center">
            <img
              src="/hero-pipeline.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              aria-hidden
            />
            <div className="absolute inset-0 bg-black/50" aria-hidden />
            <h1 className="relative z-10 font-mono text-4xl md:text-6xl font-bold text-white tracking-tight text-center drop-shadow-lg px-4">
              Math & Photography
            </h1>
          </section>

          {/* Each stage: full-width section with distinct background color */}
          {STAGES.map((stage) => (
            <section
              key={stage.id}
              id={stage.id}
              data-stage={stage.id}
              className={cn(SECTION_BG[stage.id], "snap-start min-h-[80vh] py-12 scroll-mt-24")}
            >
              <div className={STAGE_GRID_CLASS}>
                {/* Stage icon + name + lab buttons */}
                <AnimatedSection delayMs={0} className="hidden lg:flex flex-col pt-6 pr-6 self-start sticky top-6 items-end gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border mb-1",
                      STAGE_BORDER_CLASSES[stage.id]
                    )}
                  >
                    <stage.icon
                      className={cn("h-6 w-6", STAGE_ACCENT_CLASSES[stage.id])}
                      aria-hidden
                    />
                  </div>
                  <h2 className="font-mono text-2xl xl:text-3xl font-bold text-foreground text-right">
                    {stage.label}
                  </h2>
                  {stage.labs.length > 0 && (
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      {stage.labs.map((lab) => (
                        <Link
                          key={lab.path}
                          to={lab.path}
                          onClick={saveScroll}
                          className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 border w-full transition-colors hover:opacity-90",
                            STAGE_BORDER_CLASSES[stage.id],
                            STAGE_ACCENT_CLASSES[stage.id],
                            "hover:bg-white/5"
                          )}
                        >
                          {lab.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </AnimatedSection>
                {/* Middle: content */}
                <AnimatedSection delayMs={150} className="px-6 md:px-12 lg:px-8">
                  <StageSection stage={stage} onBeforeNavigate={saveScroll} />
                </AnimatedSection>
                {/* Right: For Photographers, staggered reveal */}
                <AnimatedSection delayMs={300} className="hidden lg:block pt-6 pl-6 pr-8 self-start sticky top-6">
                  <ForPhotographers stage={stage} />
                </AnimatedSection>
              </div>
            </section>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
