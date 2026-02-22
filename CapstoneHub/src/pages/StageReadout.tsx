import { StagePage } from "@/components/StagePage";
import { getStageById } from "@/config/stages";
import { getArticleContent } from "@/lib/articles";

export default function StageReadout() {
  const stage = getStageById("readout");
  if (!stage) return null;
  const content = getArticleContent(stage.articleSlug);
  return <StagePage stage={stage} articleContent={content} />;
}
