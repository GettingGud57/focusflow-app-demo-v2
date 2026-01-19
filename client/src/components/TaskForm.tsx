import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type CreateTaskRequest } from "@shared/schema";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { z } from "zod";

type Props = {
  existingTask?: { id: number } & CreateTaskRequest;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// Form needs coerced numbers
const formSchema = insertTaskSchema.extend({
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
});

export function TaskForm({ existingTask, trigger, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const create = useCreateTask();
  const update = useUpdateTask();

  const form = useForm<CreateTaskRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: existingTask ?? {
      title: "",
      description: "",
      duration: 25,
      color: "#f97316", // Orange-500 default
    },
  });

  const onSubmit = (data: CreateTaskRequest) => {
    if (existingTask) {
      update.mutate(
        { id: existingTask.id, ...data },
        { onSuccess: () => setIsOpen(false) }
      );
    } else {
      create.mutate(data, {
        onSuccess: () => {
          setIsOpen(false);
          form.reset();
        },
      });
    }
  };

  const isPending = create.isPending || update.isPending;

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
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full md:w-auto rounded-xl font-semibold bg-primary hover:bg-primary/90"
            >
              {isPending ? "Saving..." : existingTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
