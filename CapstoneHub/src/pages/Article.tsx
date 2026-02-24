import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { ArticleViewer } from "@/components/ArticleViewer";
import { loadArticle } from "@/lib/articles";

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (slug) {
      loadArticle(slug).then(setContent);
    }
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[720px] mx-auto px-6 md:px-12 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hub
        </Link>
        <ArticleViewer content={content} />
      </main>
    </div>
  );
}
