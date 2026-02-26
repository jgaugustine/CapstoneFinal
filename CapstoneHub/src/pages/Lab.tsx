import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getLabLabel } from "@/config/labs";

export default function Lab() {
  const { labSlug } = useParams<{ labSlug: string }>();
  const label = labSlug ? getLabLabel(labSlug) : null;

  if (!labSlug || !label) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Lab not found.</p>
        <Link
          to="/"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Capstone
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Capstone
          </Link>
          <span className="font-mono text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="w-24" aria-hidden />
        </div>
      </header>
      <div className="flex-1 min-h-0 w-full">
        <iframe
          src={`/labs/${labSlug}/`}
          title={label}
          className="w-full h-full border-0 block min-h-[calc(100vh-3rem)]"
        />
      </div>
    </div>
  );
}
