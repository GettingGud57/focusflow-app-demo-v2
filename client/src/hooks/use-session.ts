import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Mode = "single" | "workflow";

export function useSession(tasks: any[], workflows: any[]) {
  const { toast } = useToast();
  
  // 1. Core State
  const [mode, setMode] = useState<Mode>("single");
  const [selectedId, setSelectedId] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // LOOP STATE: We need two. Where we are, and where we are going.
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0); // 0, 1, 2...
  const [targetLoops, setTargetLoops] = useState(1);           // 1, 4, 10...

  // 2. Derived Data
  const activeItem = useMemo(() => {
    if (mode === "single") return tasks?.find(t => t.id === selectedId);
    return workflows?.find(w => w.id === selectedId);
  }, [mode, selectedId, tasks, workflows]);

  const currentTask = useMemo(() => {
    if (!activeItem) return null;
    if (mode === "single") return activeItem;
    return activeItem.steps[currentStepIndex]?.task;
  }, [mode, activeItem, currentStepIndex]);

  // 3. THE SYNC EFFECT (The "Photocopier")
  // When a user picks a new workflow, load its default loop count into our editable state.
  useEffect(() => {
    if (mode === "workflow" && activeItem) {
      setTargetLoops(activeItem.loop || 1); // Load default from DB
      setCurrentLoopIndex(0);               // Reset progress
      setCurrentStepIndex(0);               // Reset steps
    }
  }, [activeItem?.id, mode]);


  // 4. The Logic (The "DJ")
  const advance = () => {
    if (mode === "single") {
      toast({ title: "Task Complete", description: "Great job!" });
      setSelectedId(""); 
      return;
    } 

    const workflow = activeItem;
    // CRITICAL FIX: Use our editable 'targetLoops', not the read-only 'workflow.loop'
    if (workflow && currentStepIndex < workflow.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1); 
    } else {
        // Check against our LOCAL target
        if (currentLoopIndex < targetLoops - 1) {
            setCurrentLoopIndex(prev => prev + 1);
            setCurrentStepIndex(0);
            toast({ title: "Cycle Complete", description: `Starting cycle ${currentLoopIndex + 2} of ${targetLoops}` });
        } else {
            toast({ title: "Workflow Finished!", description: "You are a machine." });
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
      setSelectedId, 
      advance,
      // 👇 We add this so Dashboard can change them
      adjustLoops 
    },
  };
}