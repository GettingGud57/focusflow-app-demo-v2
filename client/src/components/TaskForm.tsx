import { useState ,useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {Task,useData} from "@/components/data/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type Props = {
  existingTask?: Task;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// Form schema for validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  color: z.string().default("#3b82f6"),
});

type TaskFormValues = z.infer<typeof formSchema>;

export function TaskForm({ existingTask, trigger, open: controlledOpen, onOpenChange }: Props) {


    const {toast} = useToast();
    const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const { addTask, updateTask } = useData();



  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:  {
      title: "",
      description: "",
      duration: 25,
      color: "#f97316", // Orange-500 default
    },
  });


  useEffect(() => {
    if (isOpen) {
      form.reset(existingTask ?? {
        title: "",
        description: "",
        duration: 25,
        color: "#f97316",
      });
    }
  }, [existingTask, isOpen, form]);

  
  const onSubmit = (data: TaskFormValues) => {
    if (existingTask) {
      // Edit Mode
      updateTask(existingTask.id, data);
      toast({ title: "Task updated successfully" });
    } else {
      // Create Mode
      addTask(data);
      toast({ title: "New task created" });
    }
    
    // Close modal
    setIsOpen(false);
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        !existingTask && (
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </DialogTrigger>
        )
      )}
      <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold">
            {existingTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground font-medium">Title</Label>
            <Input 
              {...form.register("title")} 
              id="title" 
              placeholder="e.g. Draft Project Proposal"
              className="bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/10 rounded-xl"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-muted-foreground font-medium">Duration (min)</Label>
              <Input 
                {...form.register("duration")} 
                id="duration" 
                type="number"
                className="bg-muted/30 border-muted-foreground/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color" className="text-muted-foreground font-medium">Color</Label>
              <div className="flex items-center gap-2">
                <Input 
                  {...form.register("color")} 
                  id="color" 
                  type="color"
                  className="w-full h-10 p-1 bg-muted/30 border-muted-foreground/20 rounded-xl cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground font-medium">Description</Label>
            <Textarea 
              {...form.register("description")} 
              id="description" 
              placeholder="What needs to be done?"
              className="bg-muted/30 border-muted-foreground/20 rounded-xl min-h-[100px] resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
          <Button type="submit" className="w-full">
            {existingTask ? "Save Changes" : "Create Task"}
          </Button>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
