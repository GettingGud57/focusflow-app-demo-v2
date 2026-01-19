import { Card } from "@/components/ui/card";
import { ItemSelect } from "@/components/ItemSelect";
import { ListTodo, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionSidebar({ mode, tasks, workflows, selectedId, onSelect, activeWorkflow, currentStepIndex }: any) {
  
  // Helper to keep the JSX clean
  const items = mode === "single" 
    ? tasks.map((t: any) => ({ id: t.id, label: t.title, subLabel: `${t.duration}m`, color: t.color }))
    : workflows.map((w: any) => ({ id: w.id, label: w.title, subLabel: `${w.steps.length} steps` }));

  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm">
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
        {mode === "workflow" && activeWorkflow && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Up Next</p>
            <div className="space-y-2 relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-muted -z-10" />
              {activeWorkflow.steps.sort((a:any, b:any) => a.order - b.order).map((step:any, idx:number) => (
                <div key={step.id} className={cn(
                    "relative flex items-center gap-3 p-3 rounded-lg border transition-all",
                    idx === currentStepIndex ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-white border-transparent opacity-50"
                  )}>
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 bg-background z-10",
                      idx === currentStepIndex ? "border-primary text-primary" : "border-muted"
                  )}>{idx + 1}</div>
                  <span className="text-sm font-medium truncate">{step.task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}