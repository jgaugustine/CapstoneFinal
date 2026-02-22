import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { ForPhotographers } from "./ForPhotographers";
import { ArticleViewer } from "./ArticleViewer";
import { Button } from "./ui/button";
import { loadArticle } from "@/lib/articles";
import type { StageConfig } from "@/config/stages";

interface StagePageProps {
  stage: StageConfig;
  articleContent: string;
}

export function StagePage({ stage, articleContent: initialContent }: StagePageProps) {
  const [articleContent, setArticleContent] = useState(initialContent);

  useEffect(() => {
    loadArticle(stage.articleSlug).then(setArticleContent);
  }, [stage.articleSlug]);
  return (
    <div className="mx-auto max-w-[720px] px-8 py-12">
      <h1 className="font-mono text-2xl font-bold text-foreground mb-8">
        {stage.label}
      </h1>

      <ForPhotographers stage={stage} className="mb-10" />

      <div className="mb-10">
        <ArticleViewer content={articleContent} />
      </div>

      <div className="border-t border-border pt-8">
        <h3 className="font-mono text-sm font-semibold text-foreground mb-4">
          Explore in lab
        </h3>
        <div className="flex flex-wrap gap-3">
          {stage.labs.map((lab) => (
            <Button key={lab.path} variant="outline" asChild>
              <Link
                to={lab.path}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                {lab.label}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
