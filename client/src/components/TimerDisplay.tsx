import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimerState = "idle" | "running" | "paused" | "buffer" | "completed";

interface TimerDisplayProps {
  durationMinutes: number;
  taskTitle: string;
  onComplete: () => void;
  onSkip?: () => void;
  color?: string;
  footer?: React.ReactNode;
}




export function TimerDisplay({ durationMinutes, taskTitle, onComplete, onSkip, color = "#f97316", footer }: TimerDisplayProps) {
  // Convert minutes to seconds for internal logic
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [bufferTime, setBufferTime] = useState(10); // 10 seconds buffer
  const [state, setState] = useState<TimerState>("idle");
  
  // Use a ref for the interval to clear it easily
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset when task changes
    setTimeLeft(durationMinutes * 60);
    setBufferTime(10);
    setState("idle");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [durationMinutes, taskTitle]);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setState("buffer");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (state === "buffer") {
      intervalRef.current = setInterval(() => {
        setBufferTime((prev) => {
          if (prev <= 1) {
            setState("completed");
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, onComplete]);

  const toggleTimer = () => {
    if (state === "idle" || state === "paused") setState("running");
    else if (state === "running") setState("paused");
  };

  const resetTimer = () => {
    setState("idle");
    setTimeLeft(durationMinutes * 60);
    setBufferTime(10);
  };

  const extendTime = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setBufferTime(10);
    setState("running");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = state === "buffer" 
    ? (bufferTime / 10) * 100 
    : (timeLeft / (durationMinutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-xl mx-auto">



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
              // Color logic: Yellow if buffer, Green if done, Orange/Custom if running
              stroke={state === "buffer" ? "#eab308" : state === "completed" ? "#22c55e" : color}
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
            {state === "buffer" ? `00:${bufferTime.toString().padStart(2, '0')}` : formatTime(timeLeft)}
          </motion.div>
          
          <p className="mt-2 text-muted-foreground font-medium uppercase tracking-widest text-sm">
            {state === "buffer" ? "Extend?" : state === "completed" ? "Done!" : "Remaining"}
          </p>
        </div>
      </div>

      <div className="mt-12 w-full">
        <AnimatePresence mode="wait">
          {state === "buffer" ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-yellow-600 font-semibold">Extend session before it completes?</p>
              <div className="flex gap-3">
                <Button onClick={() => extendTime(1)} variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">+1m</Button>
                <Button onClick={() => extendTime(5)} variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">+5m</Button>
                <Button onClick={() => extendTime(10)} variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">+10m</Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Lets move on!
              </Button>
            </motion.div>
          ) : (
            <motion.div 
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
