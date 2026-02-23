import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

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
      theme: "dark",
      themeVariables: {
        primaryColor: "#3b82f6",
        primaryTextColor: "#e5e7eb",
        primaryBorderColor: "#6b7280",
        lineColor: "#9ca3af",
        secondaryColor: "#1f2937",
        tertiaryColor: "#111827",
      },
    });
    mermaid
      .render(id, chart)
      .then(({ svg }) => setSvg(svg))
      .catch((e) => setError(String(e)));
  }, [chart]);

  if (error) return <pre className="text-red-400 text-sm overflow-auto">{error}</pre>;
  if (!svg) return <div ref={containerRef} className="min-h-[100px] animate-pulse bg-muted rounded my-4" />;
  return <div dangerouslySetInnerHTML={{ __html: svg }} className="my-4 [&>svg]:max-w-full [&>svg]:mx-auto" />;
}
