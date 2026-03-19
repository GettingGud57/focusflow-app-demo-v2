import { Card } from "@/components/ui/card";
import { ItemSelect } from "@/components/ItemSelect";
import { ListTodo, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/components/data/context/DataContext";
import { useMemo } from "react"

export function SessionSidebar({ mode, tasks, workflows, selectedId, onSelect, activeWorkflow, currentStepIndex }: any) {
  const { getTaskById ,flattenWorkflow } = useData();
  
  // Helper to keep the JSX clean
  const items = mode === "single" 
    ? tasks.map((t: any) => ({ id: t.id, label: t.title, subLabel: `${t.duration}m`, color: t.color }))
    : workflows.map((w: any) => ({ id: w.id, label: w.title, subLabel: `${w.steps.length} steps${w.loop > 1 ? ` · ${w.loop} cycles` : ''}` }));

  // Memoization for flattening workflow
  const flattenedSteps = useMemo(() => {
    if (mode === "workflow" && activeWorkflow) {
      return flattenWorkflow(activeWorkflow.id);
    }
    return [];
  },[mode, activeWorkflow, flattenWorkflow]);




  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-2xl border border-border shadow-sm bg-card/80 backdrop-blur-sm">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          {mode === "single" ? <CheckCircle2 className="w-4 h-4 text-primary"/> : <ListTodo className="w-4 h-4 text-primary"/>}
          {mode === "single" ? "Select Task" : "Select Workflow"}
        </h3>

        <ItemSelect
          value={selectedId}
          onValueChange={onSelect}
          items={items}
          placeholder={`Choose a ${mode}...`}
        />

        {/* The Workflow Step Visualization (Only shows if needed) */}
                {mode === "workflow" && activeWorkflow && flattenedSteps.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Up Next ({flattenedSteps.length} tasks)
            </p>
            <div className="space-y-2 relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-muted -z-10" />
              {flattenedSteps.map((task, idx) => (
                <div key={`${task.id}-${idx}`} className={cn(
                    "relative flex items-center gap-3 p-3 rounded-lg border transition-all",
                    idx === currentStepIndex ? "bg-primary/10 border-primary/20 shadow-sm" : "bg-card border-transparent opacity-60"
                  )}>
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 bg-background z-10",
                      idx === currentStepIndex ? "border-primary text-primary" : "border-muted"
                  )}>{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{task.title}</span>
                    <p className="text-xs text-muted-foreground">{task.duration}m</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}