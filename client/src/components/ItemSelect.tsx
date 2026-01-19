import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 1. Define what an "Item" looks like so we can handle both Tasks and Workflows
export interface SelectOption {
  id: string;
  label: string;
  subLabel?: string; // For things like "(25m)" or "(5 steps)"
  color?: string;    // For the little dot
}

interface ItemSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: SelectOption[] | undefined; // Allow undefined to prevent crashes
  emptyText?: string;
}

export function ItemSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  items = [], // Default to empty array if undefined
  emptyText = "No items found" 
}: ItemSelectProps) {
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full h-12 rounded-xl bg-white border-muted shadow-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      
      <SelectContent>
        {items.length === 0 ? (
          <div className="p-2 text-sm text-center text-muted-foreground">{emptyText}</div>
        ) : (
          items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              <div className="flex items-center gap-2">
                {/* Only render the color dot if a color exists */}
                {item.color && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                )}
                
                <span className="font-medium">{item.label}</span>
                
                {/* Only render subLabel if it exists */}
                {item.subLabel && (
                  <span className="text-muted-foreground text-xs ml-auto">{item.subLabel}</span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}