

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, Layers, Edit, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useData,Workflow } from "@/components/data/context/DataContext";
import {cn} from "@/lib/utils";


// Define what this card needs to receive
interface WorkflowCardProps {
  wf: Workflow;
  isPending?: boolean;
  onEdit: (workflow: Workflow) => void;
}

export function WorkflowCard({ wf, onEdit, isPending }: WorkflowCardProps) {
  // 1. BRING THE HOOKS INSIDE
  const { toast } = useToast();
  const { deleteWorkflow, getTaskById, workflows } = useData();

  return (
    // no need  'key={wf.id}' (it belongs in workflowpage)
    <Card className={cn(
      "group p-3 sm:p-6 rounded-2xl border transition-all hover:shadow-lg bg-card",
      isPending && "bg-red-50 border-red-300 ring-2 ring-red-200"
    )}>
      {/* Same layout as TaskCard: meta pill + menu on one row, then the title
          gets the full card width so it stays legible at 2-col phone width. */}
      <div className="flex justify-between items-start mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium min-w-0">
          <Layers className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {wf.steps.length} steps
            {wf.loop && wf.loop > 1 && (
              <>
                <span className="hidden sm:inline"> · {wf.loop} cycles</span>
                <span className="sm:hidden"> ×{wf.loop}</span>
              </>
            )}
          </span>
        </div>

        {!isPending && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 shrink-0 text-muted-foreground hover:text-foreground">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-lg">
            <DropdownMenuItem onClick={() => onEdit(wf)} className="gap-2 cursor-pointer">
              <Edit className="w-4 h-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                deleteWorkflow(wf.id);
                toast({ title: "Workflow deleted" });
              }}
              className="gap-2 text-destructive cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>

      <h3 className="font-display font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-1" title={wf.title}>
        {wf.title}
      </h3>

      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-6 line-clamp-2 min-h-[2.5em]">
        {wf.description || "No description provided."}
      </p>

      {/* The Preview Sequence Logic */}
      <div className="hidden sm:block space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview Sequence</div>
        <div className="flex items-center gap-2 overflow-hidden">
          {wf.steps.slice(0, 3).map((step: any, i: number) => {
            let displayTitle = "";
            let displayIcon = null;
            
            if (step.stepType === 'workflow' && step.workflowId) {
              const nestedWorkflow = workflows?.find(w => w.id === step.workflowId);
              displayTitle = nestedWorkflow?.title || "Workflow not found";
              displayIcon = <Layers className="w-3 h-3 inline mr-1" />;
            } else if (step.taskId) {
              const task = getTaskById(step.taskId);
              displayTitle = task?.title || "Task not found";
            }
            
            return (
            <div key={step.id} className="flex items-center gap-2 min-w-0">
              <div 
                className="px-2 py-1 rounded-md bg-muted text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] flex items-center"
                title={displayTitle}
              >
                {displayIcon}
                {displayTitle}
              </div>
              {i < Math.min(wf.steps.length, 3) - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
            </div>
          )})}
          {wf.steps.length > 3 && (
            <div className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
              +{wf.steps.length - 3}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
        
