import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { ForPhotographers } from "./ForPhotographers";
import { STAGE_ACCENT_CLASSES, STAGE_BORDER_CLASSES, STAGE_BORDER_L_CLASSES } from "@/config/stages";
import { cn } from "@/lib/utils";
import type { StageConfig } from "@/config/stages";

interface StageSectionProps {
  stage: StageConfig;
  onBeforeNavigate?: () => void;
}

export function StageSection({ stage, onBeforeNavigate }: StageSectionProps) {
  return (
    <div className="scroll-mt-24 py-16 md:py-20">
      <h2 className="font-mono text-2xl font-bold text-foreground mb-8 lg:hidden flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            STAGE_BORDER_CLASSES[stage.id]
          )}
        >
          <stage.icon className={cn("h-5 w-5", STAGE_ACCENT_CLASSES[stage.id])} aria-hidden />
        </span>
        {stage.label}
      </h2>

      <div className="lg:hidden mb-10">
        <ForPhotographers stage={stage} />
      </div>

      <div
        className={cn(
          "mb-10 rounded-lg border-l-4 bg-muted/20 py-3 px-4 pl-4",
          STAGE_BORDER_CLASSES[stage.id]
        )}
      >
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Key question
        </p>
        <p className={cn("text-sm font-medium", STAGE_ACCENT_CLASSES[stage.id])}>
          {stage.guidingQuestion}
        </p>
      </div>

      {(stage.whatHappens.length > 0 || stage.keyConcepts.length > 0) && (
        <div className="mb-10 rounded-lg border border-border/60 bg-muted/20 p-5 md:p-6 space-y-5">
          {stage.whatHappens.length > 0 && (
            <div>
              <h3 className="font-mono text-sm font-semibold text-foreground mb-2">
                What happens at this stage
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {stage.whatHappens.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stage.keyConcepts.length > 0 && (
            <div>
              <h3 className="font-mono text-sm font-semibold text-foreground mb-2">
                Key concepts
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {stage.keyConcepts.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {stage.articles.length > 0 && (
        <div className="space-y-4 mb-10">
          <h3 className="font-mono text-sm font-semibold text-foreground">
            Articles
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {stage.articles.map((article) => {
              const href = `/articles/${article.fullSlug ?? article.slug}`;
              return (
                <article
                  key={article.slug}
                  className={cn(
                    "rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-border",
                    STAGE_BORDER_L_CLASSES[stage.id]
                  )}
                >
                  <h4 className="font-mono text-sm font-semibold text-foreground mb-2">
                    {article.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {article.summary}
                  </p>
                  <Link
                    to={href}
                    onClick={onBeforeNavigate}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-medium hover:underline",
                      STAGE_ACCENT_CLASSES[stage.id]
                    )}
                  >
                    Read article
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
