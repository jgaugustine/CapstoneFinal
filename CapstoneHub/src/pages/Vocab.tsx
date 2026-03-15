import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { VOCAB_TERMS } from "@/lib/vocab";

const CATEGORY_ORDER = [
  "Light & Photophysics",
  "Exposure & Metering",
  "Auto Exposure",
  "Sensor & Readout",
  "ISO & Noise",
  "Bit Depth & Dynamic Range",
  "Color Filter Arrays",
  "Demosaicing",
  "General",
];

export default function Vocab() {
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const byCategory = CATEGORY_ORDER.reduce<Record<string, typeof VOCAB_TERMS>>(
    (acc, cat) => {
      acc[cat] = VOCAB_TERMS.filter((t) => t.category === cat);
      return acc;
    },
    {}
  );

  useEffect(() => {
    const hash = location.hash.slice(1); // remove leading #
    if (!hash) {
      setHighlightedId(null);
      return;
    }
    setHighlightedId(hash);
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const timer = setTimeout(() => setHighlightedId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

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

        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/50 bg-primary/5">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold text-foreground">
              Vocabulary
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Key terms from the camera signal chain articles
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {CATEGORY_ORDER.map((category) => {
            const terms = byCategory[category];
            if (!terms || terms.length === 0) return null;
            return (
              <section key={category}>
                <h2
                  id={category.toLowerCase().replace(/\s+/g, "-")}
                  className="font-mono text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border"
                >
                  {category}
                </h2>
                <dl className="space-y-6">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      id={term.id}
                      className={`scroll-mt-24 rounded-lg px-3 py-2 -mx-3 transition-colors duration-500 ${
                        highlightedId === term.id
                          ? "bg-primary/15 ring-2 ring-primary/50"
                          : ""
                      }`}
                    >
                      <dt className="font-medium text-foreground">
                        {term.term}
                        {term.aliases?.length ? (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({term.aliases.join(", ")})
                          </span>
                        ) : null}
                      </dt>
                      <dd className="mt-1 text-muted-foreground text-sm leading-relaxed pl-0">
                        {term.definition}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
