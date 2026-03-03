import { Button } from "@/components/ui/button";
import { Checkpoint } from "@/types/transformations";
import { Camera, RotateCcw, GitCompare, Trash2 } from "lucide-react";

interface CheckpointPanelProps {
  checkpoints: Checkpoint[];
  onSaveCheckpoint: () => void;
  onRevert: (id: string) => void;
  onCompare: (id: string) => void;
  onDelete: (id: string) => void;
  compareCheckpointId: string | null;
  hasImage: boolean;
  onCheckpointSaved?: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function CheckpointPanel({
  checkpoints,
  onSaveCheckpoint,
  onRevert,
  onCompare,
  onDelete,
  compareCheckpointId,
  hasImage,
  onCheckpointSaved,
}: CheckpointPanelProps) {
  const handleSave = () => {
    onSaveCheckpoint();
    onCheckpointSaved?.();
  };

  return (
    <div className="space-y-3" data-tour-id="checkpoint-panel">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Checkpoints</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={!hasImage}
          data-tour-id="save-checkpoint-btn"
        >
          <Camera className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Save the current edit state to revert or compare later.
      </p>
      {checkpoints.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No checkpoints yet.</p>
      ) : (
        <ul className="space-y-2">
          {checkpoints.map((cp) => (
            <li
              key={cp.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate text-foreground">
                {cp.name ?? `Checkpoint ${formatTimestamp(cp.createdAt)}`}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1.5"
                  onClick={() => onRevert(cp.id)}
                  title="Revert to this checkpoint"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={compareCheckpointId === cp.id ? "default" : "ghost"}
                  className="h-7 px-1.5"
                  onClick={() => onCompare(cp.id)}
                  title="Compare with current"
                  data-tour-id={compareCheckpointId === cp.id ? "compare-checkpoint-btn" : undefined}
                >
                  <GitCompare className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1.5 text-destructive hover:text-destructive"
                  onClick={() => onDelete(cp.id)}
                  title="Delete checkpoint"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
