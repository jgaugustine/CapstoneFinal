import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart?.trim() || !containerRef.current) return;
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    mermaid.initialize({
      startOnLoad: false,
      // Light diagram theme so node labels stay dark (matches pastel classDef fills in articles).
      theme: "default",
      darkMode: false,
      themeVariables: {
        primaryColor: "#e5e7eb",
        primaryTextColor: "#111827",
        secondaryTextColor: "#111827",
        tertiaryTextColor: "#111827",
        primaryBorderColor: "#6b7280",
        // Arrows stay visible on the app’s dark page background while labels stay dark on light nodes.
        lineColor: "#94a3b8",
        secondaryColor: "#f3f4f6",
        tertiaryColor: "#ffffff",
        background: "transparent",
        // Flowcharts use textColor / nodeTextColor for labels (HTML + SVG); set explicitly so theme math
        // does not leave light text on transparent background.
        textColor: "#111827",
        nodeTextColor: "#111827",
        labelTextColor: "#111827",
        edgeLabelBackground: "#f3f4f6",
      },
    });
    mermaid
      .render(id, chart)
      .then(({ svg }) => setSvg(svg))
      .catch((e) => setError(String(e)));
  }, [chart]);

  if (error) return <pre className="text-red-400 text-sm overflow-auto">{error}</pre>;
  if (!svg) return <div ref={containerRef} className="min-h-[100px] animate-pulse bg-muted rounded my-4" />;
  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      className={cn(
        "my-4 [&>svg]:max-w-full [&>svg]:mx-auto",
        // Reset prose-invert / prose body color so Mermaid text is not forced to light foreground.
        "!text-[#111827]",
        "[&_svg_text]:!fill-[#111827] [&_svg_tspan]:!fill-[#111827]",
        "[&_foreignObject]:!text-[#111827] [&_foreignObject_*]:!text-[#111827]",
        "[&_.nodeLabel]:!text-[#111827] [&_.edgeLabel]:!text-[#111827] [&_.label]:!text-[#111827]"
      )}
    />
  );
}
