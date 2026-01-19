

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, Layers, Edit } from "lucide-react"; // Added Edit icon
import { useToast } from "@/hooks/use-toast";
import { useDeleteWorkflow } from "@/hooks/use-workflows"; 

// Define what this card needs to receive
interface WorkflowCardProps {
  wf: any; // You can replace 'any' with your Workflow type later
  onEdit: (workflow: any) => void;
}

export function WorkflowCard({ wf, onEdit }: WorkflowCardProps) {
  // 1. BRING THE HOOKS INSIDE
  const { toast } = useToast();
  const deleteMutation = useDeleteWorkflow();

  return (
    // 2. REMOVE 'key={wf.id}' FROM HERE (It belongs in the parent)
    <Card className="group p-6 rounded-2xl border transition-all hover:shadow-lg bg-white">
      <div className="flex justify-between items-start mb-4">
        {/* Left Side: Icon & Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{wf.title}</h3>
            <p className="text-xs text-muted-foreground">{wf.steps.length} steps</p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={() => onEdit(wf)}
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* Delete Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              deleteMutation.mutate(wf.id);
              toast({ title: "Workflow deleted" });
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[2.5em]">
        {wf.description || "No description provided."}
      </p>

      {/* The Preview Sequence Logic */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview Sequence</div>
        <div className="flex items-center gap-2 overflow-hidden">
          {wf.steps.slice(0, 3).map((step: any, i: number) => (
            <div key={step.id} className="flex items-center gap-2 min-w-0">
              <div 
                className="px-2 py-1 rounded-md bg-muted text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]"
                title={step.task.title}
              >
                {step.task.title}
              </div>
              {i < Math.min(wf.steps.length, 3) - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
            </div>
          ))}
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
        
