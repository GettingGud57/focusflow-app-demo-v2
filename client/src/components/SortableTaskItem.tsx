import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";



function SortableTaskItem({ id, task, onRemove }: { id: string, task: any, onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl shadow-sm cursor-grab active:cursor-grabbing"
    >
      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: task.color || '#ccc' }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.duration} mins</p>
      </div>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="text-muted-foreground hover:text-destructive"
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}



export default SortableTaskItem;