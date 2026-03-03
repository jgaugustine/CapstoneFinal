import { VOCAB_TERMS, buildTermToIdMap } from "./vocab";

const termToId = buildTermToIdMap();

const sortedTerms = [...VOCAB_TERMS]
  .flatMap((t) => [t.term, ...(t.aliases || [])])
  .filter((s) => s.length >= 2)
  .sort((a, b) => b.length - a.length);

const VOCAB_REGEX = new RegExp(
  `\\b(${sortedTerms.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

const SKIP_TAGS = new Set(["A", "CODE", "PRE", "SCRIPT", "STYLE"]);
const SKIP_CLASSES = ["katex", "math"];

/** Apply vocab links to text nodes within container. Skips links, code, math, etc. */
export function applyVocabLinks(container: HTMLElement): void {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        let el = node.parentElement;
        while (el && el !== container) {
          if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          const cls = el.className?.toString() || "";
          if (SKIP_CLASSES.some((c) => cls.includes(c))) return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const toProcess: { node: Text; matches: RegExpMatchArray[] }[] = [];
  let textNode: Text | null;
  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.textContent || "";
    const matches = [...text.matchAll(VOCAB_REGEX)];
    if (matches.length > 0) toProcess.push({ node: textNode, matches });
  }

  for (const { node, matches } of toProcess) {
    const text = node.textContent || "";
    const frag = document.createDocumentFragment();
    let lastEnd = 0;

    for (const m of matches) {
      const matched = m[0];
      const id = termToId.get(matched.toLowerCase());
      if (!id) continue;

      if (m.index! > lastEnd) {
        frag.appendChild(document.createTextNode(text.slice(lastEnd, m.index)));
      }
      const a = document.createElement("a");
      a.href = `/vocab#${id}`;
      a.className = "vocab-link";
      a.textContent = matched;
      frag.appendChild(a);
      lastEnd = m.index! + matched.length;
    }
    if (lastEnd < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastEnd)));
    }
    if (frag.childNodes.length > 0) {
      node.parentNode?.replaceChild(frag, node);
    }
  }
}
