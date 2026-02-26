import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { ArticleViewer } from "@/components/ArticleViewer";
import { loadArticle } from "@/lib/articles";

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setContent(null);
    loadArticle(slug).then(setContent);
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Capstone
        </Link>
        {content === null ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <ArticleViewer content={content} />
        )}
      </main>
    </div>
  );
}
