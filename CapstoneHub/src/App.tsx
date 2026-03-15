import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Article from "./pages/Article";
import Lab from "./pages/Lab";
import Vocab from "./pages/Vocab";
import NotFound from "./pages/NotFound";
import { VocabPopup } from "./components/VocabPopup";

export default function App() {
  const [vocabPopupId, setVocabPopupId] = useState<string | null>(null);

  useEffect(() => {
    const handleVocabClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.("a.vocab-link");
      if (!target || !(target instanceof HTMLAnchorElement)) return;
      const href = target.getAttribute("href") ?? "";
      const id = href.includes("#") ? href.split("#")[1] : null;
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        setVocabPopupId(id);
      }
    };
    document.addEventListener("click", handleVocabClick, true);
    return () => document.removeEventListener("click", handleVocabClick, true);
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/vocab" element={<Vocab />} />
        <Route path="/articles/:slug" element={<Article />} />
        <Route path="/labs/:labSlug" element={<Lab />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <VocabPopup termId={vocabPopupId} onClose={() => setVocabPopupId(null)} />
    </BrowserRouter>
  );
}
