import { TaskForm } from "@/components/TaskForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@/components/data/context/DataContext";
import { Clock } from "lucide-react";
import TasksCards from "../components/TaskCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/components/data/context/DataContext";





export default function TasksPage() {
  const isLoading = false;
  const { tasks,pendingData,deleteTask  } = useData();


  const allTasks = [...tasks.map(task => ({...task, isPending: false})),
                    ...(pendingData?.tasks || []).map(task => ({...task, isPending: true}))];




  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);


  const handleDelete = (id: string) => {
    deleteTask(id);
    toast({ title: "Task deleted", description: "The task has been removed from your library." });
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


      {allTasks.map((task) => (
       <TasksCards 
         key={task.id} 
         task={task}
         isPending={task.isPending}
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
