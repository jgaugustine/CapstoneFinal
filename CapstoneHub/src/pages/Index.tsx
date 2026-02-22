import { Link } from "react-router-dom";
import { PipelineDiagram } from "@/components/PipelineDiagram";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-8 py-16">
        <h1 className="font-mono text-3xl font-bold text-foreground tracking-tight mb-4">
          Capstone
        </h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Explore the camera signal chain: light, sensor, readout, demosaicing, and post-processing.
          Each stage links to articles and interactive labs.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Choose a stage to explore.
        </p>
        <PipelineDiagram className="mb-12" />
        <Link to="/light">
          <Button size="lg">Start with Light</Button>
        </Link>
      </div>
    </div>
  );
}
