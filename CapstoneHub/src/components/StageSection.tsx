import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ForPhotographers } from "./ForPhotographers";
import type { StageConfig } from "@/config/stages";
import { cn } from "@/lib/utils";

interface StageSectionProps {
  stage: StageConfig;
}

export function StageSection({ stage }: StageSectionProps) {
  return (
    <div className="scroll-mt-24 py-12 md:py-16">
      <h2 className="font-mono text-2xl font-bold text-foreground mb-6 lg:hidden">
        {stage.label}
      </h2>

      {/* Mobile: For Photographers + lab links */}
      <div className="lg:hidden mb-6 space-y-6">
        <ForPhotographers stage={stage} />
        {stage.labs.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {stage.labs.map((lab) => (
            <Link
              key={lab.path}
              to={lab.path}
              className="text-sm font-medium text-primary hover:underline"
            >
              {lab.label}
            </Link>
          ))}
        </div>
        )}
      </div>

      {/* Key takeaways */}
      <ul className="mb-8 space-y-2">
        {stage.takeaways.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-primary shrink-0">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Article cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stage.articles.map((article) => (
          <Link
            key={article.slug}
            to={`/articles/${article.fullSlug ?? article.slug}`}
            className={cn(
              "group block rounded-lg border border-border/60 bg-card/50 p-4",
              "transition-colors hover:border-primary/40 hover:bg-card"
            )}
          >
            <h3 className="font-mono text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
              {article.abstract}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              Read
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
