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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const completed =
      window.localStorage.getItem("exposurelab_tutorial_completed") === "1";
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
      window.localStorage.setItem("exposurelab_tutorial_completed", "1");
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
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Capstone
            </a>
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
