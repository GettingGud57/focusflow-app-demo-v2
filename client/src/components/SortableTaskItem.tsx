import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Trash2, Layers } from "lucide-react";
import { Task, Workflow } from "@/components/data/context/DataContext";

type SortableItemProps = {
  id: string;
  item: { stepType: 'task' | 'workflow'; task?: Task; workflow?: Workflow };
  onRemove: () => void;
};

function SortableTaskItem({ id, item, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isTask = item.stepType === 'task';
  const title = isTask ? item.task?.title : item.workflow?.title;
  const subtitle = isTask 
    ? `${item.task?.duration} mins` 
    : `${item.workflow?.steps.length || 0} steps`;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl shadow-sm cursor-grab active:cursor-grabbing"
    >
      {isTask ? (
        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: item.task?.color || '#ccc' }} />
      ) : (
        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
          <Layers className="w-3 h-3" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
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