import { Outlet, useLocation } from "react-router-dom";
import { PipelineNav } from "./PipelineNav";
import { cn } from "@/lib/utils";
import type { StageId } from "@/config/stages";

const STAGE_PATHS: Record<string, StageId> = {
  "/light": "light",
  "/sensor": "sensor",
  "/readout": "readout",
  "/demosaic": "demosaic",
  "/post": "post",
};

export function Layout() {
  const location = useLocation();
  const activeStage = STAGE_PATHS[location.pathname] ?? null;

  return (
    <div className="flex min-h-screen">
      <PipelineNav activeStage={activeStage} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
