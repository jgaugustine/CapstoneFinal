import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function AnimatedSection({ children, className, delayMs = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useInView({ threshold: 0.1, rootMargin: "0px 0px -5% 0px" });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      style={{ transitionDelay: isInView ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
