



import { useSession } from "@/hooks/use-session";
import { SessionSidebar } from "@/components/SessionSidebar";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import{useData} from "@/components/data/context/DataContext";


export default function Dashboard() {
  // 1. Data Loading (Simulated)
  const tasksLoading = false;
  const { tasks } = useData();
  const { workflows } = useData();






  // 2. The Brain 🧠
  const session = useSession(tasks, workflows);

  const { mode, selectedId, currentStepIndex, activeItem, currentTask, currentLoopIndex, targetLoops } = session.state;


  const loopControls = (
  // 1. THE CONTAINER: A very light, transparent pill shape
  <div className="flex items-center gap-1 bg-secondary/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5">
    
    {/* MINUS BUTTON */}
    <Button 
      variant="ghost" 
      size="icon"
      // h-6 w-6 = smaller touch target to fit in the pill
      // text-muted-foreground = The Grey Icon Color
      // hover:bg-foreground/10 = The "Slightly Darker" hover effect
      className="h-6 w-6 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
      onClick={() => session.actions.adjustLoops(-1)}
      disabled={session.state.currentLoopIndex + 1 >= session.state.targetLoops}
    >
      <Minus className="w-3 h-3" />
    </Button>

    {/* TEXT DISPLAY */}
    <span className="text-xs font-medium text-muted-foreground tabular-nums px-2 select-none">
       Cycle {session.state.currentLoopIndex + 1} / {session.state.targetLoops}
    </span>
    
    {/* PLUS BUTTON */}
    <Button 
      variant="ghost" 
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
      onClick={() => session.actions.adjustLoops(1)}
    >
      <Plus className="w-3 h-3" />
    </Button>
  </div>
);




  if (tasksLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Focus Mode</h1>
          {!currentTask && <p className="text-muted-foreground">Select a task or workflow to begin.</p>}
        </div>
        <Tabs value={mode} onValueChange={(v: any) => session.actions.setMode(v)}>
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="single">Single Task</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        
        {/* Main Player Area */}
        <Card className="glass-panel border-none p-8 flex flex-col items-center justify-center min-h-[500px] rounded-3xl relative overflow-hidden">
          {currentTask ? (
            <TimerDisplay 
              taskId={currentTask.id}
              durationMinutes={currentTask.duration} 
              taskTitle={currentTask.title}
              taskDescription={currentTask.description}
              color={currentTask.color}
              onComplete={session.actions.advance}
              onSkip={session.actions.advance}
              footer={mode === "workflow" ? loopControls : undefined}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <h3 className="text-xl font-semibold">Ready to Focus?</h3>
              <p>Select an item from the sidebar.</p>
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <SessionSidebar 
          mode={mode}
          tasks={tasks}
          workflows={workflows}
          selectedId={selectedId}
          onSelect={session.actions.setSelectedId}
          activeWorkflow={mode === "workflow" ? activeItem : null}
          currentStepIndex={currentStepIndex}
        />
      </div>
    </div>
  );
}