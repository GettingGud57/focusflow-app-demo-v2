import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/components/data/context/DataContext";
import confetti from "canvas-confetti";

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
  const { activeTimer, stopTimer, getTaskById, flattenWorkflow } = useData();
  
  
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



  // FLATTEN workflow into sequential tasks (handles nested workflows!)
  const flattenedTasks = useMemo(() => {
    if (mode === "workflow" && activeItem) {
      return flattenWorkflow(activeItem.id);
    }
    return [];
  }, [mode, activeItem, flattenWorkflow]);


  const currentTask = useMemo(() => {
    if (!activeItem) return null;
    if (mode === "single") return activeItem;
    // For workflow: look up task by taskId (pure reference)
    return flattenedTasks[currentStepIndex] || null;
  }, [mode, activeItem, currentStepIndex, flattenedTasks]);


  const totalSteps = useMemo(() => {
    if (mode === "workflow" && activeItem) {
      // Get flattened tasks but only for 1 loop (we handle loops ourselves)
      return flattenedTasks.length;
    }
    return 0;
  }, [mode, activeItem, flattenedTasks]);



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
        const flattened = flattenWorkflow(workflow.id);
        const stepIndex = flattened.findIndex((t: any) => t.id === runningTaskId);
        if (stepIndex !== -1) {
          setMode("workflow");
          setSelectedId(workflow.id);
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
  //
  // Seeded from the restored session, NOT null. Starting at null meant a fresh
  // mount treated every selection as "restoring", so the reset below was skipped
  // and stale loop state from localStorage leaked into the new workflow (pick a
  // workflow after visiting /workflows and it would show "cycle 2/2"). It also
  // meant a workflow's own `loop` value was ignored on the first selection after
  // any reload. Seeding it keeps the original intent - don't clobber progress on
  // a reload - while still detecting a genuinely different workflow.
  const prevSelectedIdRef = useRef<string | null>(savedSession?.selectedId ?? null);

  useEffect(() => {
    if (mode === "workflow" && activeItem) {
      const isNewSelection = prevSelectedIdRef.current !== activeItem.id;

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
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      return;
    } 


    if (currentStepIndex < flattenedTasks.length - 1) {
      stopTimer();
      setCurrentStepIndex(prev => prev + 1); 
    } else {
        // Check against our LOCAL target
        if (currentLoopIndex < targetLoops - 1) {
            stopTimer();
            setCurrentLoopIndex(prev => prev + 1);
            setCurrentStepIndex(0);
            toast({ title: "Cycle Complete", description: `Starting cycle ${currentLoopIndex + 2} of ${targetLoops}` });
        } else {
            toast({ title: "Workflow Finished!", description: "You are a machine." });
            stopTimer();
            // A finished workflow must leave no progress behind, or re-selecting it
            // resumes on the last step at the last cycle. The sync effect can't do
            // this for us: prevSelectedIdRef still points at THIS workflow, so
            // picking it again is correctly not a "new selection".
            setCurrentStepIndex(0);
            setCurrentLoopIndex(0);
            setTargetLoops(activeItem.loop || 1); // discard any temporary extra cycles
            setSelectedId("");
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.6 }
            });
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
  // WRAPPED setSelectedId: Confirm before throwing away progress
  // ============================================================
  // WHY: Switching used to silently kill a running timer and reset the
  //      workflow. Anything you'd be annoyed to lose gets a confirmation first.
  // NOTE: This does NOT affect page navigation - that restores from localStorage.

  // The pending id waits here while the user answers the dialog.
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);

  // Which list does the CURRENT selection actually live in? `mode` cannot answer
  // this: switching tabs fires setMode before the new item is picked, so by the
  // time we ask, mode already describes the destination rather than what's at
  // risk. Looking selectedId up in both lists is stable across a tab change.
  const selectedWorkflow = useMemo(
    () => workflows?.find((w: any) => w.id === selectedId),
    [workflows, selectedId]
  );
  const selectedTask = useMemo(
    () => tasks?.find((t: any) => t.id === selectedId),
    [tasks, selectedId]
  );
  // Step count of the selection itself, not of whatever the current mode shows.
  const selectedWorkflowSteps = useMemo(
    () => (selectedWorkflow ? flattenWorkflow(selectedWorkflow.id).length : 0),
    [selectedWorkflow, flattenWorkflow]
  );

  // Is there actually something to lose? A running timer, obviously - but also
  // a workflow parked partway through, since step and loop position survive
  // without a timer. Deliberately false when idle at the start: a dialog that
  // fires with nothing at stake just teaches you to click through it.
  const hasProgressAtRisk =
    !!activeTimer ||
    (!!selectedWorkflow && (currentStepIndex > 0 || currentLoopIndex > 0));

  // Structured so the Dashboard can word the warning; the hook stays out of copy.
  const switchRisk = {
    kind: selectedWorkflow ? ("workflow" as const) : ("task" as const),
    title: selectedWorkflow?.title ?? selectedTask?.title,
    stepIndex: currentStepIndex,
    totalSteps: selectedWorkflowSteps,
    loopIndex: currentLoopIndex,
    targetLoops,
    timerRunning: !!activeTimer,
  };

  const commitSelection = (newId: string) => {
    if (activeTimer) {
      stopTimer();
    }
    setSelectedId(newId);
    setPendingSelectId(null);
    // Step and loop reset happen in the sync effect above, which already owns
    // that logic for a genuinely new selection.
  };

  const handleSetSelectedId = (newId: string) => {
    if (newId === selectedId) return; // re-picking the current item is a no-op
    if (hasProgressAtRisk) {
      setPendingSelectId(newId);
      return;
    }
    commitSelection(newId);
  };

  const confirmSwitch = () => {
    if (pendingSelectId !== null) commitSelection(pendingSelectId);
  };

  const cancelSwitch = () => setPendingSelectId(null);

  return {
    state: {
      mode,
      selectedId,
      currentStepIndex,
      activeItem,
      currentTask,
      currentLoopIndex,
      targetLoops,
      flattenedTasks,  // Expose for SessionSidebar
      totalSteps,      // Expose total flattened steps count
      pendingSelectId, // Non-null while the "are you sure?" dialog is open
      switchRisk,      // What that dialog is warning you about

    },
    actions: {
      setMode,
      setSelectedId: handleSetSelectedId, // Use wrapped version
      advance,
      // 👇 We add this so Dashboard can change them
      adjustLoops,
      confirmSwitch,
      cancelSwitch
    },
  };
}