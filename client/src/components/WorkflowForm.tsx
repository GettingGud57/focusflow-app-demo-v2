
import { useState ,useEffect} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus } from "lucide-react";
import { toast, useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskItem from '@/components/SortableTaskItem';
import { Task, useData, Workflow } from "@/components/data/context/DataContext";
import { dagValidation } from "@/lib/dagValidation";
import { DependencyTree } from "@/components/DependencyTree";
import { useForm, useFieldArray } from "react-hook-form"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {  WorkflowFormSchema } from '@/lib/schemas';









type WorkflowFormValues = z.infer<typeof WorkflowFormSchema>;



function WorkflowForm({ open, onOpenChange, existingData }: { open?: boolean, onOpenChange?: (open: boolean) => void, existingData?: Workflow }) {
  
  
  const { tasks, workflows, addWorkflow, updateWorkflow, getTaskById } = useData();

  /*
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loops, setLoops] = useState(1);
  */
  




  const [selectionMode, setSelectionMode] = useState<'task' | 'workflow'>('task');
  const [cyclePath, setCyclePath] = useState<string[] | null>(null);



  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(WorkflowFormSchema), // <--- Connects Zod rules
    defaultValues: {
      id: "",
      title: "",
      description: "",
      loop: 1,      // Matches schema default
      steps: [],    // Start with empty array
    },
  });


const { fields, append, remove, move } = useFieldArray({
  control: form.control, 
  name: "steps", 
  keyName: "_id" 
});




  const { toast } = useToast();



useEffect(() => {
    if (existingData) {

      
      // Transform the saved steps back into the draggable format
      // Look up the actual task/workflow by taskId/workflowId (pure reference)
      const restoredSteps = existingData.steps.map((step: any) => {
         const isTask = step.stepType === 'task';
         return{
           id: crypto.randomUUID(),
           stepType: step.stepType,
          taskId: step.taskId,
          workflowId: step.workflowId,
          task: isTask ? tasks.find(t => t.id === step.taskId) : { id: step.taskId, title: "Task not found", duration: 0, color: "#999" },
          workflow: !isTask ? workflows.find(w => w.id === step.workflowId) : { id: step.workflowId, title: "Workflow not found", steps: [] },

         }
      })
      form.reset({
        title: existingData.title,
        description: existingData.description || "",
        loop: existingData.loop || 1,
        steps: restoredSteps,
      });
    } else {
  // Sets title="", loop=1, steps=[] automatically based on your schema defaults
  form.reset({ id: "",title: "",description: "",loop: 1,steps: []});
  }
},[existingData, open, form, tasks, workflows]);






  const handleAddTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 'append' automatically updates the form state AND the UI array
    append({
      id: crypto.randomUUID(),
      stepType: "task",
      taskId: task.id,
      task: task 
    });
  };



   
  const handleAddWorkflow = (workflowId: string) => {
     const workflow = workflows.find(w => w.id === workflowId);
     if (!workflow) return;

    if (existingData && workflow.id === existingData.id) {
      toast({ title: "Cannot add workflow to itself", variant: "destructive" });
      return;
    }


    const currentSteps = form.getValues("steps"); 

    const tempWorkflow: Workflow = {
       id: existingData?.id || 'temp',
      title: form.getValues("title") || 'temp',
      steps: [
        ...currentSteps.map((s, i) => ({ ...s, order: i + 1 })),
        { id: "temp", stepType: "workflow", workflowId: workflow.id, order: currentSteps.length + 1 }
      ]
    }



    const allWorkflows = existingData 
      ? workflows.map(w => w.id === existingData.id ? tempWorkflow : w)
      : [...workflows, tempWorkflow];

    const validation = dagValidation(tempWorkflow, allWorkflows);
    if (!validation.isValid) {
      setCyclePath(validation.cyclePath || null);
      toast({ title: validation.errors[0], variant: "destructive" });
      return;
    }

    append({
      id: crypto.randomUUID(),
      stepType: "workflow",
      workflowId: workflow.id,
      workflow: workflow
    });

  }


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Find the indexes in the 'fields' array
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      
      // The Magic Method: Swaps them in the form data instantly
      move(oldIndex, newIndex); 
    }
  };



  const onSubmit = (data: WorkflowFormValues) => {
    
    // Transform Zod data to your Backend structure
  const payload = {
      title: data.title,
      description: data.description,
      loop: data.loop,
      steps: data.steps.map((step, index) => ({
        id: step.id, // Keep the sortable ID
        stepType: step.stepType,
        taskId: step.taskId,
        workflowId: step.workflowId,
        order: index + 1
      }))
    };

    if (existingData) {
      updateWorkflow(existingData.id, payload);
      toast({ title: "Workflow updated" });
    } else {
      addWorkflow(payload);
      toast({ title: "Workflow created" });
    }
    onOpenChange?.(false);
  };




const watchedLoop = form.watch("loop");
const watchedSteps = form.watch("steps");

//console.log("Form errors:", form.formState.errors);
//console.log("Form values:", form.getValues());


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!existingData && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg">
            <Plus className="w-4 h-4" /> New Workflow
          </Button>
        </DialogTrigger>
      )}


      <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {existingData ? "Edit Workflow" : "New Workflow"}
          </DialogTitle>
        </DialogHeader>

        
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8 mt-4">



          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Workflow Title</Label>
              <Input 
                {...form.register("title")} // 👈 NEW: Connects to form
                placeholder="Morning Routine"
                className="bg-muted/30" 
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>
              )}
            </div>


            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                {...form.register("description")} // 👈 NEW: Connects to form
                placeholder="What is this for?"
                className="bg-muted/30"
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-xs">{form.formState.errors.description.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Add to Sequence</Label>
              <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as 'task' | 'workflow')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="task">Tasks</TabsTrigger>
                  <TabsTrigger value="workflow">Workflows</TabsTrigger>
                </TabsList>


                <TabsContent value="task" className="mt-4">
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {tasks?.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                          <span className="text-sm truncate font-medium">{task.title}</span>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleAddTask(task.id)}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>




                <TabsContent value="workflow" className="mt-4">
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {workflows?.filter(w => !existingData || w.id !== existingData.id).map(workflow => (
                      <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate font-medium">{workflow.title}</span>
                          <p className="text-xs text-muted-foreground">{workflow.steps.length} steps</p>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleAddWorkflow(workflow.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <Label className="text-primary font-bold">Workflow Sequence</Label>
              <span className="text-xs text-muted-foreground">{fields.length} steps</span>
            </div>



            {cyclePath && cyclePath.length > 0 && (                          //Display cycle path if exists
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <DependencyTree 
                  cyclePath={cyclePath}
                  allWorkflows={workflows}
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  className="mt-2 text-xs text-red-600"
                  onClick={() => setCyclePath(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}







          {fields.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic border-2 border-dashed border-muted-foreground/20 rounded-xl min-h-[150px]">
                Drag & Drop tasks here
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <SortableTaskItem 
                        key={field.id}     
                        id={field.id}       
                        item={field as any} 
                        onRemove={() => remove(index)} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}



            







    

            <div className="pt-4 border-t border-border/50 space-y-4">
               <div className="flex items-center justify-between">
                 <Label className="text-sm font-medium text-muted-foreground">Repeat Cycles</Label>
                 <div className="flex items-center gap-1 bg-secondary/30 backdrop-blur-sm px-2 py-1 rounded-full border border-black/5 dark:border-white/5">
                   <Button 
                     type="button"
                     variant="ghost" 
                     size="icon"
                     className="h-6 w-6 text-muted-foreground hover:bg-foreground/10"
                    onClick={() => form.setValue("loop", Math.max(1, (watchedLoop || 1) - 1))}
                     disabled={(watchedLoop || 1) <= 1}

                   >
                     <Minus className="w-3 h-3" />
                   </Button>
                   <span className="text-xs font-medium text-muted-foreground tabular-nums px-2 select-none min-w-[60px] text-center">
                      {watchedLoop} {watchedLoop === 1 ? 'Cycle' : 'Cycles'}
                   </span>
                   <Button 
                     type="button" 
                     variant="ghost" 
                     size="icon"
                     className="h-6 w-6 text-muted-foreground hover:bg-foreground/10"
                     onClick={() => form.setValue("loop", Math.min(99, (watchedLoop || 1) + 1))}
                   >
                     <Plus className="w-3 h-3" />
                   </Button>
                 </div>
               </div>



              <div className="flex justify-between text-sm font-medium">
                 <span>Total Duration:</span>
                 <span>
                  {(watchedSteps || []).reduce((acc, curr) => {
                   if (curr.stepType === 'task' && curr.task) {
                     return acc + (curr.task.duration || 0);
                   } else if (curr.stepType === 'workflow' && curr.workflow) {
                     // Calculate workflow duration by summing all its task durations
                     const wfDuration = curr.workflow.steps.reduce((sum:number, step:any) => {
                       const task = getTaskById(step.taskId || '');
                       return sum + (task?.duration || 0);
                     }, 0);
                     return acc + wfDuration * (curr.workflow.loop || 1);
                   }
                   return acc;
                 }, 0) * (watchedLoop || 1)} mins
               </span>
             </div>


               <Button type="submit" className="w-full font-bold">
                 {existingData ? "Save Changes" : "Create Workflow"}
               </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default WorkflowForm;