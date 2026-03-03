import { useCallback, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Lab from "./pages/Lab";
import {
  TutorialEvent,
  TutorialStep,
  getFirstTutorialStepId,
  getTutorialStepById,
  tutorialSteps,
} from "@/config/tutorialSteps";
import { TutorialTour } from "@/components/TutorialTour";

const queryClient = new QueryClient();

const App = () => {
  const [tutorialStepId, setTutorialStepId] = useState<TutorialStep["id"] | null>(null);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  const TUTORIAL_KEY = "exposurelab:tour-seen";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const forceReset = params.get("resetTour") === "1";
    if (forceReset) {
      try { window.sessionStorage.removeItem(TUTORIAL_KEY); } catch {}
      window.history.replaceState({}, "", window.location.pathname);
    }
    const completed = !forceReset &&
      window.sessionStorage.getItem(TUTORIAL_KEY) === "1";
    setTutorialCompleted(completed);
    if (!completed) {
      const first = getFirstTutorialStepId();
      if (first) {
        setTutorialStepId(first);
        setTutorialActive(true);
      }
    }
  }, []);

  const markTutorialCompleted = useCallback(() => {
    setTutorialCompleted(true);
    setTutorialActive(false);
    setTutorialStepId(null);
    if (typeof window !== "undefined") {
      try { window.sessionStorage.setItem(TUTORIAL_KEY, "1"); } catch {}
    }
  }, []);

  const startTutorial = useCallback(() => {
    const first = getFirstTutorialStepId();
    if (!first) return;
    setTutorialActive(true);
    setTutorialStepId(first);
  }, []);

  const skipTutorial = useCallback(() => {
    markTutorialCompleted();
  }, [markTutorialCompleted]);

  const goToStep = useCallback((id: TutorialStep["id"]) => {
    setTutorialActive(true);
    setTutorialStepId(id);
  }, []);

  const goNext = useCallback(() => {
    if (!tutorialStepId) return;
    const idx = tutorialSteps.findIndex((s) => s.id === tutorialStepId);
    if (idx === -1) return;
    const next = tutorialSteps[idx + 1];
    if (!next) {
      markTutorialCompleted();
      return;
    }
    setTutorialStepId(next.id);
  }, [tutorialStepId, markTutorialCompleted]);

  const goBack = useCallback(() => {
    if (!tutorialStepId) return;
    const idx = tutorialSteps.findIndex((s) => s.id === tutorialStepId);
    if (idx <= 0) return;
    const prev = tutorialSteps[idx - 1];
    if (!prev) return;
    setTutorialStepId(prev.id);
  }, [tutorialStepId]);

  const handleTutorialEvent = useCallback(
    (event: TutorialEvent) => {
      if (!tutorialActive) return;
      const step = getTutorialStepById(tutorialStepId);
      if (!step || !step.advanceOn) return;
      if (step.advanceOn !== event) return;
      goNext();
    },
    [tutorialActive, tutorialStepId, goNext],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <header className="shrink-0 border-b bg-background px-4 py-2">
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_top"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Capstone
            </a>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Lab
              </span>
              <span className="text-sm font-semibold text-foreground">
                ExposureLAB
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={startTutorial}
              >
                Guided tour
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0">
          <Lab
            tutorial={{
              active: tutorialActive,
              completed: tutorialCompleted,
              currentStepId: tutorialStepId,
              onEvent: handleTutorialEvent,
              start: startTutorial,
              skip: skipTutorial,
              next: goNext,
              back: goBack,
              complete: markTutorialCompleted,
              goToStep,
            }}
          />
        </div>
        <TutorialTour
          steps={tutorialSteps}
          currentStepId={tutorialActive ? tutorialStepId : null}
          onNext={goNext}
          onBack={goBack}
          onSkip={skipTutorial}
          onComplete={markTutorialCompleted}
        />
      </div>
    </QueryClientProvider>
  );
};

export default App;
