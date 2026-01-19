
import { useState ,useEffect} from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useCreateWorkflow } from "@/hooks/use-workflows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskItem from '@/components/SortableTaskItem';



function WorkflowForm({ open, onOpenChange, existingData }: { open?: boolean, onOpenChange?: (open: boolean) => void, existingData?: any }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]); // Use random IDs for sortable items
  
  // Map sortable IDs back to actual task IDs for submission
  // Simple approach: Store { id: 'random-uuid', task: Task } in state
  const [workflowItems, setWorkflowItems] = useState<{id: string, task: any}[]>([]);

  const tasks = [
       { id: 1, title: "Study React", description: "Get fuked", duration: 25, color: "#3b82f6" },
    { id: 2, title: "Fix Database", description: "Holy hell", duration: 45, color: "#ef4444" },
  { id: 3, title: "Check Emails" ,description: "Check facebook acc", duration: 50, color: "#22c55e" },
  { id: 4, title: "Standing meet up",description: "Explain why it doesnt work", duration: 10, color: "#eab308" },
   { id:5 , title: "Code Feature",description: "Code the agentic ai", duration: 50,color:"#E33BD2" },
   { id: 6, title: "Rest",description: "reflect on ur life", duration: 10, color:"#6E4AD9" }

  ];

  
  const create = useCreateWorkflow();
  const { toast } = useToast();



useEffect(() => {
    if (existingData) {
      // EDIT MODE: Fill the form with the existing data
      setTitle(existingData.title);
      setDescription(existingData.description || "");
      
      // Transform the saved steps back into the draggable format
      // We give them new random IDs so the Drag-and-Drop system is happy
      const restoredItems = existingData.steps.map((step: any) => ({
        id: crypto.randomUUID(), 
        task: step.task
      }));
      setWorkflowItems(restoredItems);

    } else {
      // CREATE MODE: Clear everything (clean slate)
      setTitle("");
      setDescription("");
      setWorkflowItems([]);
    }
  }, [existingData, open]);



  const handleAddTask = (taskId: string) => {
    const task = tasks?.find(t => t.id.toString() === taskId);
    if (!task) return;
    
    // Create unique ID for this instance in the list (allows duplicates)
    setWorkflowItems(prev => [...prev, { id: crypto.randomUUID(), task }]);
  };

  const handleRemoveTask = (itemId: string) => {
    setWorkflowItems(prev => prev.filter(item => item.id !== itemId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWorkflowItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast({ title: "Title required", variant: "destructive" });
    if (workflowItems.length === 0) return toast({ title: "Add at least one task", variant: "destructive" });

    create.mutate({
      title,
      description,
      steps: workflowItems.map((item, index) => ({
        taskId: item.task.id,
        order: index
      }))
    }, {
      onSuccess: () => {
        toast({ title: "Workflow created" });
        onOpenChange?.(false);
        setTitle("");
        setDescription("");
        setWorkflowItems([]);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!existingData && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg">
            <Plus className="w-4 h-4" /> Create Workflow
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New Workflow</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 mt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Workflow Title</Label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Morning Routine"
                className="bg-muted/30" 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="What is this for?"
                className="bg-muted/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Available Tasks</Label>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                {tasks?.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/20 transition-colors">
                    <span className="text-sm truncate font-medium">{task.title}</span>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleAddTask(task.id.toString())}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <Label className="text-primary font-bold">Workflow Sequence</Label>
              <span className="text-xs text-muted-foreground">{workflowItems.length} steps</span>
            </div>
            
            {workflowItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic border-2 border-dashed border-muted-foreground/20 rounded-xl min-h-[150px]">
                Drag & Drop tasks here
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={workflowItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {workflowItems.map(item => (
                      <SortableTaskItem 
                        key={item.id} 
                        id={item.id} 
                        task={item.task} 
                        onRemove={() => handleRemoveTask(item.id)} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="pt-4 border-t border-border/50">
               <div className="flex justify-between text-sm font-medium mb-4">
                 <span>Total Duration:</span>
                 <span>{workflowItems.reduce((acc, curr) => acc + curr.task.duration, 0)} mins</span>
               </div>
               <Button type="submit" className="w-full font-bold" disabled={create.isPending}>
                 {create.isPending ? "Creating..." : "Save Workflow"}
               </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default WorkflowForm;