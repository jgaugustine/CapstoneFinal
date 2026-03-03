import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getLabLabel } from "@/config/labs";

export default function Lab() {
  const { labSlug } = useParams<{ labSlug: string }>();
  const { search } = useLocation();
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
    <div className="fixed inset-0 w-full h-full">
      <iframe
        src={`/labs/${labSlug}/${search ? search : ""}`}
        title={label}
        className="w-full h-full border-0 block"
      />
    </div>
  );
}
