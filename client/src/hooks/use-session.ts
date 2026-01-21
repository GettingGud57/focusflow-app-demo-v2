import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/components/data/context/DataContext";

type Mode = "single" | "workflow";

// ============================================================
// SESSION PERSISTENCE: Save/Load from localStorage
// ============================================================
type SessionState = {
  mode: Mode;
  selectedId: string;
  currentStepIndex: number;
  currentLoopIndex: number;
  targetLoops: number;
};

const STORAGE_KEY = "myApp_session";

const loadSession = (): SessionState | null => {
  if (typeof window === "undefined") return null;
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const saveSession = (state: SessionState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export function useSession(tasks: any[], workflows: any[]) {
  const { toast } = useToast();
  const { activeTimer, stopTimer, getTaskById } = useData();
  
  // ============================================================
  // RESTORE SESSION: Load from localStorage on mount
  // ============================================================
  const savedSession = loadSession();
  
  // 1. Core State (with restoration)
  const [mode, setMode] = useState<Mode>(savedSession?.mode || "single");
  const [selectedId, setSelectedId] = useState<string>(savedSession?.selectedId || "");
  const [currentStepIndex, setCurrentStepIndex] = useState(savedSession?.currentStepIndex || 0);
  
  // LOOP STATE: We need two. Where we are, and where we are going.
  const [currentLoopIndex, setCurrentLoopIndex] = useState(savedSession?.currentLoopIndex || 0);
  const [targetLoops, setTargetLoops] = useState(savedSession?.targetLoops || 1);

  // 2. Derived Data
  const activeItem = useMemo(() => {
    if (mode === "single") return tasks?.find(t => t.id === selectedId);
    return workflows?.find(w => w.id === selectedId);
  }, [mode, selectedId, tasks, workflows]);

  const currentTask = useMemo(() => {
    if (!activeItem) return null;
    if (mode === "single") return activeItem;
    // For workflow: look up task by taskId (pure reference)
    const step = activeItem.steps[currentStepIndex];
    return step ? getTaskById(step.taskId) : null;
  }, [mode, activeItem, currentStepIndex, getTaskById]);

  // ============================================================
  // PERSIST SESSION: Save to localStorage whenever state changes
  // ============================================================
  useEffect(() => {
    saveSession({
      mode,
      selectedId,
      currentStepIndex,
      currentLoopIndex,
      targetLoops,
    });
  }, [mode, selectedId, currentStepIndex, currentLoopIndex, targetLoops]);

  // ============================================================
  // AUTO-RESTORE: If there's an active timer but no selected task,
  // find which task/workflow it belongs to and restore the session
  // ============================================================
  useEffect(() => {
    if (activeTimer && !selectedId) {
      const runningTaskId = activeTimer.taskId;
      
      // Check if it's a single task
      const task = tasks?.find(t => t.id === runningTaskId);
      if (task) {
        setMode("single");
        setSelectedId(task.id);
        return;
      }
      
      // Check if it's part of a workflow
      for (const workflow of workflows || []) {
        const stepIndex = workflow.steps?.findIndex((s: any) => s.task?.id === runningTaskId);
        if (stepIndex !== -1) {
          setMode("workflow");
          setSelectedId(workflow.id);
          // Note: currentStepIndex and loopIndex should already be restored from localStorage
          // Only set stepIndex if it wasn't restored
          if (currentStepIndex === 0 && savedSession?.currentStepIndex !== stepIndex) {
            setCurrentStepIndex(stepIndex);
          }
          return;
        }
      }
    }
  }, [activeTimer, selectedId, tasks, workflows]);

  // 3. THE SYNC EFFECT (The "Photocopier")
  // When a user picks a NEW workflow (not restoring), load its default loop count.
  // Track the previous selectedId to detect actual changes.
  const prevSelectedIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (mode === "workflow" && activeItem) {
      const isNewSelection = prevSelectedIdRef.current !== null && 
                             prevSelectedIdRef.current !== activeItem.id;
      
      if (isNewSelection) {
        // User switched to a DIFFERENT workflow - reset to its defaults
        setTargetLoops(activeItem.loop || 1);
        setCurrentLoopIndex(0);
        setCurrentStepIndex(0);
      }
      
      // Update the ref to current ID
      prevSelectedIdRef.current = activeItem.id;
    }
  }, [activeItem?.id, mode]);


  // 4. The Logic (The "DJ")
  const advance = () => {
    if (mode === "single") {
      toast({ title: "Task Complete", description: "Great job!" });
      stopTimer(); // Stop the timer when task completes
      setSelectedId(""); 
      return;
    } 

    const workflow = activeItem;
    // CRITICAL FIX: Use our editable 'targetLoops', not the read-only 'workflow.loop'
    if (workflow && currentStepIndex < workflow.steps.length - 1) {
      stopTimer(); // Stop timer before moving to next step
      setCurrentStepIndex(prev => prev + 1); 
    } else {
        // Check against our LOCAL target
        if (currentLoopIndex < targetLoops - 1) {
            stopTimer(); // Stop timer before starting new loop
            setCurrentLoopIndex(prev => prev + 1);
            setCurrentStepIndex(0);
            toast({ title: "Cycle Complete", description: `Starting cycle ${currentLoopIndex + 2} of ${targetLoops}` });
        } else {
            toast({ title: "Workflow Finished!", description: "You are a machine." });
            stopTimer(); // Stop timer when workflow completes
            setSelectedId("");
        }
    }
  };

  // 5. The Adjustment Logic (For your +/- buttons)
  const adjustLoops = (delta: number) => {
    setTargetLoops(prev => {
      const newValue = prev + delta;
      // Guardrail: Don't let them lower the target below their current progress
      return Math.max(newValue, currentLoopIndex + 1);
    });
  };

  // 6. PUBLIC INTERFACE
  // EXPOSE EVERYTHING THE DASHBOARD NEEDS HERE
  
  // ============================================================
  // WRAPPED setSelectedId: Stop timer when switching tasks/workflows
  // ============================================================
  // WHY: When user actively switches to a different task, they're saying
  //      "I'm done with the previous one". Fresh state is more intuitive.
  // NOTE: This does NOT affect page navigation - that restores from localStorage.
  const handleSetSelectedId = (newId: string) => {
    // If switching to a DIFFERENT task/workflow, stop any running timer
    if (newId !== selectedId && activeTimer) {
      stopTimer();
    }
    setSelectedId(newId);
  };

  return {
    state: { 
      mode, 
      selectedId, 
      currentStepIndex, 
      activeItem, 
      currentTask,
      // 👇 We add these so Dashboard can read them
      currentLoopIndex,
      targetLoops 
    },
    actions: { 
      setMode, 
      setSelectedId: handleSetSelectedId, // Use wrapped version
      advance,
      // 👇 We add this so Dashboard can change them
      adjustLoops 
    },
  };
}