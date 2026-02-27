import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { STAGES } from "@/config/stages";
import type { StageId } from "@/config/stages";
import { Header } from "@/components/Header";
import { HeroPipelineDiagram } from "@/components/HeroPipelineDiagram";
import { StageSection } from "@/components/StageSection";
import { PipelineSteps } from "@/components/PipelineSteps";
import { ForPhotographers } from "@/components/ForPhotographers";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTION_BG: Record<StageId, string> = {
  light: "bg-section-light",
  sensor: "bg-section-sensor",
  "readout-demosaic": "bg-section-readout-demosaic",
  post: "bg-section-post",
};

export default function Index() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeStage = useScrollSpy();

  useEffect(() => {
    const key = "capstonehub:index-scroll";
    const container = scrollContainerRef.current;
    if (!container) return;

    const saved = sessionStorage.getItem(key);
    if (saved !== null) {
      const y = Number(saved);
      if (!Number.isNaN(y)) {
        container.scrollTo({ top: y, behavior: "auto" });
      }
    }

    const handleScroll = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      sessionStorage.setItem(key, String(el.scrollTop));
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      const el = scrollContainerRef.current;
      if (!el) return;
      sessionStorage.setItem(key, String(el.scrollTop));
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
          {/* Hero: full-width section */}
          <section className="snap-start min-h-[60vh] flex flex-col justify-center lg:flex-row lg:gap-10">
          <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row">
            <div className="flex-1 min-w-0 max-w-[68ch] mx-auto px-6 md:px-12 py-12 md:py-16 lg:pl-12 lg:pr-0">
              <header className="mb-8 md:mb-12">
                <h1 className="font-mono text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                  Capstone
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Explore the camera signal chain: light, sensor, digitization & demosaicing, and post-processing.
                  Scroll for what happens at each stage, key concepts, and in-depth articles; try the labs in each section.
                </p>
              </header>
              <HeroPipelineDiagram />
            </div>
            <aside className="hidden lg:block w-[260px] xl:w-[300px] shrink-0" aria-hidden />
          </div>
        </section>

          {/* Each stage: full-width section with distinct background color */}
          {STAGES.map((stage) => (
            <section
              key={stage.id}
              id={stage.id}
              data-stage={stage.id}
              className={cn(SECTION_BG[stage.id], "snap-start min-h-[80vh] py-12 scroll-mt-24")}
            >
              <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,68ch)_minmax(260px,300px)] gap-x-0 lg:items-start">
                {/* Left: stage name + lab buttons */}
                <AnimatedSection delayMs={0} className="hidden lg:flex flex-col pt-6 pr-6 self-start sticky top-6 items-end gap-4">
                  <h2 className="font-mono text-2xl xl:text-3xl font-bold text-foreground text-right">
                    {stage.label}
                  </h2>
                  {stage.labs.length > 0 && (
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      {stage.labs.map((lab) => (
                        <Link
                          key={lab.path}
                          to={lab.path}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
                        >
                          {lab.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </AnimatedSection>
                {/* Middle: content */}
                <AnimatedSection delayMs={150} className="px-6 md:px-12 lg:px-8">
                  <StageSection stage={stage} />
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
  );
}
