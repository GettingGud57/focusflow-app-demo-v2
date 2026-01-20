
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MoreVertical, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from "@/components/data/context/DataContext";
import { cn } from "@/lib/utils";


interface TaskCardProps {
  // MUST give 'task' object
  task: Task; 

  isPending?: boolean;
    // MUST give 'edit' function
  onEdit: (task: Task) => void; 
      // MUST give 'delete' function
  onDelete: (id: string) => void;
}


export default function TasksCards({ task, isPending, onEdit, onDelete }: TaskCardProps) {
    return (
        <Card 
              key={task.id} 
              className={cn(
                "group relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 bg-white overflow-hidden",
                isPending && "bg-red-50 border-red-300 ring-2 ring-red-200"
              )}
            >
              <div 
                className="absolute top-0 left-0 w-1.5 h-full transition-all"
                style={{ backgroundColor: task.color || "var(--primary)" }}
              />
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium text-foreground">
                  <Clock className="w-3 h-3" />
                  {task.duration} mins
                </div>
                {!isPending && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl shadow-lg">
                    <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 cursor-pointer">
                      <Edit className="w-4 h-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(task.id)} className="gap-2 text-destructive cursor-pointer">
                      <Trash2 className="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
              </div>

              <div className="pl-2">
                <h3 className="font-display font-bold text-lg mb-2 line-clamp-1" title={task.title}>
                  {task.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
                  {task.description || "No description provided."}
                </p>
              </div>
            </Card>
    )

}