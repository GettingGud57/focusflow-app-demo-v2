import { CalendarEvent } from  "@/components/data/context/DataContext";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  event: CalendarEvent;
  isPending?: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export function CalendarEventCard({ event, isPending, onEdit, onDelete }: Props) {
    
  return (
    <div 
      className={cn(
        // Base styles: White background, border, shadow, and specific left-border width
        "group relative p-2 rounded-r-lg rounded-l-sm text-xs border border-gray-200 border-l-[4px] bg-white shadow-sm hover:shadow-md transition-all cursor-default",
        
        // Dynamic Left Border Color based on type
        isPending
        ?  "bg-red-50 border-red-300 ring-2 ring-red-200" // Pending style
        :event.type === "workflow" 
          ? "border-l-indigo-500" 
          : "border-l-orange-500"
      )}
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-gray-700">{format(event.startTime, "HH:mm")}</span>
        
        {/* Actions Container .No actions allowed is isPending */}
        {!isPending && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 -mr-1 -mt-1 transition-opacity bg-white/80 backdrop-blur-sm rounded-md">
           
           {/* Edit Button */}
           <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 hover:bg-gray-100 text-gray-500 hover:text-indigo-600"
            onClick={() => onEdit(event)}
          >
            <Edit className="w-3 h-3" />
          </Button>

           {/* Delete Button */}
           <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 hover:bg-red-50 text-gray-500 hover:text-red-600"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        )}
      </div>
      
      <div className="font-medium truncate text-gray-900 mt-1">{event.title}</div>
      <div className="opacity-70 text-gray-500">{event.duration}m</div>
    </div>
  );
}