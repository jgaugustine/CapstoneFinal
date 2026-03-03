import type { Root, Text, Element } from "hast";
import { visit } from "unist-util-visit";
import { VOCAB_TERMS, buildTermToIdMap } from "./vocab";

const termToId = buildTermToIdMap();

/** Terms to match, longest first, for proper precedence */
const sortedTerms = [...VOCAB_TERMS]
  .flatMap((t) => [t.term, ...(t.aliases || [])])
  .filter((s) => s.length >= 2)
  .sort((a, b) => b.length - a.length);

function buildPattern(): RegExp {
  const escaped = sortedTerms.map((s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

const VOCAB_REGEX = buildPattern();

/** Don't link terms inside these element types */
const SKIP_TAGS = new Set(["a", "code", "pre", "script", "style"]);

type ParentWithChildren = { children: (Text | Element)[] };

/** Remove undefined entries from children arrays to prevent visit errors. */
function sanitizeTree(node: Root | Text | Element): void {
  if (!node || typeof node !== "object") return;
  if ("children" in node && Array.isArray(node.children)) {
    node.children = node.children.filter((c): c is Text | Element => c != null);
    node.children.forEach((c) => sanitizeTree(c));
  }
}

export function rehypeVocabLinks() {
  return (tree: Root) => {
    sanitizeTree(tree);
    const toReplace: { parent: ParentWithChildren; index: number; siblings: (Text | Element)[] }[] = [];

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if ("tagName" in parent && SKIP_TAGS.has((parent as Element).tagName)) return;

      const { value } = node;
      const matches = [...value.matchAll(VOCAB_REGEX)];
      if (matches.length === 0) return;

      const siblings: (Text | Element)[] = [];
      let lastEnd = 0;

      for (const m of matches) {
        const matched = m[0];
        const id = termToId.get(matched.toLowerCase());
        if (!id) continue;

        if (m.index! > lastEnd) {
          siblings.push({
            type: "text",
            value: value.slice(lastEnd, m.index),
          });
        }
        siblings.push({
          type: "element",
          tagName: "a",
          properties: {
            href: `/vocab#${id}`,
            className: ["vocab-link"],
          },
          children: [{ type: "text", value: matched }],
        });
        lastEnd = m.index! + matched.length;
      }

      if (siblings.length === 0) return;

      if (lastEnd < value.length) {
        siblings.push({
          type: "text",
          value: value.slice(lastEnd),
        });
      }

      toReplace.push({
        parent: parent as ParentWithChildren,
        index,
        siblings,
      });
    });

    // Apply replacements from highest index first so earlier indices remain valid
    toReplace.sort((a, b) => (a.parent === b.parent ? b.index - a.index : 0));
    for (const { parent, index, siblings } of toReplace) {
      parent.children.splice(index, 1, ...siblings);
    }
  };
}
