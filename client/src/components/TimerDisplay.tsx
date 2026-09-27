import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useData } from "@/components/data/context/DataContext";


// "overtime" = past the planned duration, counting up, waiting for the user to
// decide. It runs indefinitely on purpose: the app signals the boundary, it
// never decides on your behalf.
type TimerState = "idle" | "running" | "paused" | "overtime" | "completed";

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
  const { activeTimer, startTimer, stopTimer, autoAdvance } = useData();

  // Check if THIS task is the one running globally
  const isGloballyRunning = activeTimer?.taskId === taskId;



  const getRemainingSeconds = () =>{
    if (activeTimer?.taskId === taskId) {
        const now = Date.now();
        const secondsPassed = Math.floor((now - activeTimer.startTime) / 1000);
        const totalSeconds = activeTimer.totalDuration * 60; // Convert minutes to seconds
        // NOT clamped at 0 - a negative value is overtime, and that's real data
        return totalSeconds - secondsPassed;
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
      // Restore straight into "overtime" if the deadline already passed while
      // the app was closed. Starting as "running" would make the interval see a
      // running -> overtime transition and fire a cue for an event that happened
      // hours ago.
      return remainingSeconds > 0 ? "running" : "overtime";
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

  // Reset the completion latch per RUN, not per task.
  //
  // Keying this on [taskId] alone was a stall: if two consecutive steps use the
  // same task - the same 25m block twice to make 50 minutes, or two rest steps
  // back to back - then taskId never changes, this effect never fires, and the
  // latch stays closed from the previous step. The display looked completely
  // healthy (activeTimer changed, so the countdown reset and ran normally) but
  // onComplete() could never fire again: in flow mode the chain silently
  // stalled, and in manual mode the Done button became a no-op.
  //
  // activeTimer.startTime is the run's identity - startTimer() stamps a fresh one
  // every time, including the flow-mode hand-off - so this now resets whenever a
  // new run begins, whether or not it's a different task.
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [taskId, activeTimer?.startTime]);




  useEffect(() => {
    // One interval covers both running and overtime - the logic is identical,
    // it just reads the clock. The only extra job is catching the crossing.
    if ((state === "running" || state === "overtime") && isGloballyRunning && activeTimer) {
      // Use global timer for accurate time tracking
      intervalRef.current = setInterval(() => {

        const remaining = getRemainingSeconds();

        if(remaining !== null){
          setTimeLeft(remaining);

          // The state transition is its own latch: once we leave "running" this
          // branch can't run again, so the crossing fires exactly once.
          if (remaining <= 0 && state === "running") {
            if (autoAdvance) {
              // Flow mode: hand off without waiting to be asked. Overtime and
              // flow mode are mutually exclusive - auto-advance fires AT zero,
              // so an overtime state never exists here.
              if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onComplete();
              }
            
            } else {
              setState("overtime");
            }
          }
        }


      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, isGloballyRunning, activeTimer, autoAdvance, onComplete]);






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

  // Overtime: the user decided they're finished. This is the only thing that
  // advances the workflow now - nothing happens on a timeout.
  const handleDone = () => {
    if (hasCompletedRef.current) return; // guard against a double tap
    hasCompletedRef.current = true;
    setState("completed");
    stopTimer();
    onComplete();
  };

  const isOvertime = state === "overtime";

  const formatTime = (seconds: number) => {
    // Math.abs because overtime is negative, and -142 % 60 is -22
    const abs = Math.abs(seconds);
    const hrs = Math.floor(abs / 3600);
    const mins = Math.floor((abs % 3600) / 60);
    const secs = abs % 60;
    // An hours branch, or 8 hours of overtime renders as "483:12"
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Clamped at 0 - negative progress would push strokeDashoffset past the
  // circumference and the ring would render wrong.
  const progress = Math.max(0, (timeLeft / (durationMinutes * 60)) * 100);

  // Tighter padding and min-height on mobile below: with p-8 and 600px the ring,
  // title and controls don't fit above the bottom nav on a short phone, so the
  // whole timer scrolled.

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-xl mx-auto min-h-[480px] md:min-h-[600px]">
      <div className="mb-8 text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{taskTitle}</h2>
        {taskDescription && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto line-clamp-2">
            {taskDescription}
          </p>
        )}
      </div>

      <div className="relative w-full max-w-[18rem] md:max-w-[24rem] aspect-square flex items-center justify-center">
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

        // viewBox matters here. Without one, SVG user units are CSS pixels - so
        // with radius 150 the ring spans 300px plus 8px of stroke, inside a w-72
        // (288px) container on mobile. It was clipped on every phone, and only fit
        // at md: where the container becomes 384px. With a viewBox the coordinates
        // are relative and the whole ring scales to whatever the container is.
        return (
          <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Grey Background Track */}
            <circle
              cx="50%" cy="50%" r={radius}
              className="stroke-muted fill-none stroke-[8px]"
            />

            {/* Colored Timer Ring */}
            <circle
              cx="50%" cy="50%" r={radius}
              // Color logic: Yellow past the line, Green if done, Orange/Custom if running
              stroke={isOvertime ? "#eab308" : state === "completed" ? "#22c55e" : color}
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
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {(() => {
            // "+" not "-": you're accumulating extra time, not running a deficit
            const display = isOvertime
              ? `+${formatTime(timeLeft)}`
              : formatTime(timeLeft);

            // Step the size down once the string grows past "MM:SS". An hour of
            // overtime reads "+1:00:00" - eight glyphs, which at text-7xl is
            // wider than the ring on a phone.
            const isLong = display.length > 6;

            return (
              <motion.div
                key={state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "font-display font-bold tabular-nums tracking-tighter",
                  isLong ? "text-5xl md:text-7xl" : "text-7xl md:text-8xl",
                  isOvertime && "text-yellow-500"
                )}
              >
                {display}
              </motion.div>
            );
          })()}

          <p className="mt-2 text-muted-foreground font-medium uppercase tracking-widest text-sm">
            {isOvertime ? "Overtime" : state === "completed" ? "Done!" : "Remaining"}
          </p>
        </div>
      </div>

      <div className="mt-12 w-full flex flex-col items-center gap-6">
        {/* Keys matter: mode="wait" tracks children by key, and without them
            React reconciles the two branches as the same element and the exit
            animation never plays. */}
        <AnimatePresence mode="wait">
          {isOvertime ? (
            /* Overtime: Done and Reset only.
               No Pause - there's no countdown left to preserve.
               No Skip  - you overshot the duration, so "I didn't do it" is
                          dishonest. Reset is the abandon path. */
            <motion.div
              key="overtime"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-yellow-600 font-semibold">Time's up — finish when you're ready.</p>
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
                  onClick={handleDone}
                  style={{ backgroundColor: "#22c55e" }}
                  className="w-20 h-20 rounded-full shadow-xl shadow-black/10 transition-transform hover:scale-105 active:scale-95"
                >
                  <Check className="w-8 h-8 text-white" />
                </Button>

                <div className="w-14 h-14" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center gap-6"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outside AnimatePresence so it isn't duplicated in both branches */}
        {footer && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
