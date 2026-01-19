import { useTasks, useDeleteTask } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/TaskForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@shared/schema";
import { Clock, MoreVertical, Trash2, Edit } from "lucide-react";
import TasksCards from "../components/TaskCard";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";





export default function TasksPage() {
  const isLoading = false;
  const tasks = [
       { id: 1, title: "Study React", description: "Get fuked", duration: 25, color: "#3b82f6" },
    { id: 2, title: "Fix Database", description: "Holy hell", duration: 45, color: "#ef4444" },
  { id: 3, title: "Check Emails" ,description: "Check facebook acc", duration: 50, color: "#22c55e" },
  { id: 4, title: "Standing meet up",description: "Explain why it doesnt work", duration: 10, color: "#eab308" },
   { id:5 , title: "Code Feature",description: "Code the agentic ai", duration: 50,color:"#E33BD2" },
   { id: 6, title: "Rest",description: "reflect on ur life", duration: 10, color:"#6E4AD9" }

  ];



  const deleteMutation = useDeleteTask();
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Task deleted", description: "The task has been removed from your library." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Task Library</h1>
          <p className="text-muted-foreground">Manage your reusable tasks and estimates.</p>
        </div>
        <TaskForm />
      </div>

      {tasks?.length === 0 ? ( //No tasks case

        <div className="text-center py-20 border-2 border-dashed border-muted rounded-3xl">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
          <p className="text-muted-foreground mb-6">Create your first task to get started.</p>

          <TaskForm />
        </div>
      ) : (


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">


      {tasks?.map((task) => (
       <TasksCards 
         key={task.id} 
         task={task} 
         onEdit={setEditingTask} 
         onDelete={handleDelete} 
       />
        ))}


      </div>
      )}

      {/* Edit Dialog - controlled by state */}
      {editingTask && (
        <TaskForm 
          existingTask={editingTask} 
          open={!!editingTask} 
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
}
