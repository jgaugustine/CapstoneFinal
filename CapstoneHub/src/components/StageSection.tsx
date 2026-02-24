import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ForPhotographers } from "./ForPhotographers";
import { ArticleViewer } from "./ArticleViewer";
import { Button } from "./ui/button";
import { loadArticle } from "@/lib/articles";
import type { StageConfig } from "@/config/stages";

interface StageSectionProps {
  stage: StageConfig;
  articleContent: string;
}

export function StageSection({ stage, articleContent: initialContent }: StageSectionProps) {
  const [articleContent, setArticleContent] = useState(initialContent);

  useEffect(() => {
    loadArticle(stage.articleSlug).then(setArticleContent);
  }, [stage.articleSlug]);

  return (
    <div className="scroll-mt-24 py-16 md:py-20">
      <h2 className="font-mono text-2xl font-bold text-foreground mb-8 lg:hidden">
        {stage.label}
      </h2>

      {/* Inline on mobile/tablet when right column is hidden */}
      <div className="lg:hidden mb-10">
        <ForPhotographers stage={stage} />
      </div>

      <div className="mb-10">
        <ArticleViewer content={articleContent} />
      </div>

      {stage.labs.length > 0 && (
        <div className="border-t border-border pt-8">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-4">
            Explore in lab
          </h3>
          <div className="flex flex-wrap gap-3">
            {stage.labs.map((lab) => (
              <Button key={lab.path} variant="outline" asChild>
                <a
                  href={lab.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  {lab.label}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
