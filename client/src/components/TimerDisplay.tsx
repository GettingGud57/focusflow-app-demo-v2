import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useData } from "@/components/data/context/DataContext";


type TimerState = "idle" | "running" | "paused" | "completed";

interface TimerDisplayProps {
  taskId: string; // Requires taskId to connect with global state
  durationMinutes: number;
  taskTitle: string;
  taskDescription?: string;
  onComplete: () => void;
  onSkip?: () => void;
  color?: string;
  footer?: React.ReactNode;
}




export function TimerDisplay({ taskId, durationMinutes, taskTitle, taskDescription, onComplete, onSkip, color = "#f97316", footer }: TimerDisplayProps) {
  const { activeTimer, startTimer, stopTimer } = useData();

  // Check if THIS task is the one running globally
  const isGloballyRunning = activeTimer?.taskId === taskId;



  const getRemainingSeconds = () =>{
    if (activeTimer?.taskId === taskId) {
        const now = Date.now();
        const secondsPassed = Math.floor((now - activeTimer.startTime) / 1000);
        const totalSeconds = activeTimer.totalDuration * 60; // Convert minutes to seconds
        return Math.max(0, totalSeconds - secondsPassed);
    }
    return null;

  }

  const getInitialTimeLeft = () => {
    const remainingSeconds = getRemainingSeconds();
    if (remainingSeconds !== null) {
      return remainingSeconds;
    }
    return durationMinutes * 60;
  }


  const getInitialState = (): TimerState => {
     const remainingSeconds = getRemainingSeconds();
    if (remainingSeconds !== null) {
      return "running";
    }
    return "idle";
  };


  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);
  const [state, setState] = useState<TimerState>(getInitialState);

  // Use a ref for the interval to clear it easily
  const intervalRef = useRef<NodeJS.Timeout | null>(null);



  useEffect(() => {
  // Reset when task changes, BUT check if this task is already running globally
  if (intervalRef.current) clearInterval(intervalRef.current);


   const remaining = getRemainingSeconds();

   if(remaining  != null){
     setTimeLeft(remaining);
     setState(getInitialState());
   }else if(state !== "paused"){
    setTimeLeft(durationMinutes * 60);
    setState("idle");
  }
  // If state === "paused", do nothing - preserve timeLeft
}, [durationMinutes, taskTitle, taskId, activeTimer]);



  const hasCompletedRef = useRef(false);

  //A FSM , we have 4 states : idle, running, paused, completed
  // Use useEffect to manage the timer based on the current state and global timer status

  // Reset completion flag only when TASK changes (not on every effect run)
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [taskId]);




  useEffect(() => {
    if (state === "running" && isGloballyRunning && activeTimer) {
      // Use global timer for accurate time tracking
      intervalRef.current = setInterval(() => {

        const remaining = getRemainingSeconds();

        if(remaining !== null){
          setTimeLeft(remaining);
        }


      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, isGloballyRunning, activeTimer]);






  const toggleTimer = () => {
    if (state === "idle") {
      // Starting fresh : full duration
      setState("running");
      startTimer(taskId, durationMinutes);
    } else if (state === "paused") {
      // Resuming from pause : use REMAINING time, not full duration
      const remainingMinutes = timeLeft / 60;
      setState("running");
      startTimer(taskId, remainingMinutes);
    } else if (state === "running") {
      // Pausing : just pause, don't reset
      setState("paused");
      stopTimer();
    }
  };

  const resetTimer = () => {
    setState("idle");
    setTimeLeft(durationMinutes * 60);
    stopTimer();
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (timeLeft / (durationMinutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-xl mx-auto min-h-[600px]">
      <div className="mb-8 text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{taskTitle}</h2>
        {taskDescription && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto line-clamp-2">
            {taskDescription}
          </p>
        )}
      </div>

      <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
        {/* Background Ring */}


        {/* 1. Define the math variables right inside the render */}
        {(() => {
  // Fixed pixel radius makes the math stable (unlike percentages)
        const radius = 150;
        const circumference = 2 * Math.PI * radius;

  // Calculate how much "rope" to hide based on progress (0 to 100)
  // When progress is 100% (Full time), offset is 0 (Show all)
  // When progress is 0% (Empty), offset is circumference (Hide all)
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Grey Background Track */}
            <circle
              cx="50%" cy="50%" r={radius}
              className="stroke-muted fill-none stroke-[8px]"
            />

            {/* Colored Timer Ring */}
            <circle
              cx="50%" cy="50%" r={radius}
              // Color logic: Green if done, Orange/Custom if running
              stroke={state === "completed" ? "#22c55e" : color}
              className="fill-none stroke-[8px] transition-all duration-1000 ease-linear"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                strokeLinecap: "butt"
              }}
            />
          </svg>
        );
      })()}





        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-bold tabular-nums text-7xl md:text-8xl tracking-tighter"
          >
            {formatTime(timeLeft)}
          </motion.div>

          <p className="mt-2 text-muted-foreground font-medium uppercase tracking-widest text-sm">
            {state === "completed" ? "Done!" : "Remaining"}
          </p>
        </div>
      </div>

      <div className="mt-12 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key="controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                onClick={resetTimer}
                className="w-14 h-14 rounded-full border-2 hover:bg-muted"
              >
                <RotateCcw className="w-6 h-6 text-muted-foreground" />
              </Button>

              <Button
                size="icon"
                onClick={toggleTimer}
                style={{ backgroundColor: color }}
                className={cn(
                  "w-20 h-20 rounded-full shadow-xl shadow-black/10 transition-transform hover:scale-105 active:scale-95",
                  state === "running" && "animate-pulse"
                )}
              >
                {state === "running" ? (
                  <Pause className="w-8 h-8 text-white fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                )}
              </Button>

              {onSkip ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onSkip}
                  className="w-14 h-14 rounded-full border-2 hover:bg-muted"
                >
                  <SkipForward className="w-6 h-6 text-muted-foreground" />
                </Button>
              ) : (
                <div className="w-14 h-14" />
              )}
            </div>
            {footer && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
              {footer}
            </div>
            )}


          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
