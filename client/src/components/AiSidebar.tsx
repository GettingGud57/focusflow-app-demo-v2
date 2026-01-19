import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils"; // Assuming you have shadcn utils

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {

 const [location] = useLocation();
// Same as Floating button logic
const hiddenRoutes = ["/", "/dashboard"];
const shouldShow = isOpen && !hiddenRoutes.includes(location);


 
 
  return (
    <div 
      className={cn(
        "border-l bg-background flex flex-col transition-all duration-300 ease-in-out h-screen fixed md:sticky right-0 top-0 z-40",
         shouldShow ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"
      )}
    >
      {/* HEADER */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">AI Assistant</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* CHAT AREA (Empty for now) */}
      <div className="flex-1 bg-muted/10">
        {/* Messages would go here */}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input placeholder="Ask anything..." className="h-9 text-sm" />
          <Button size="icon" className="h-9 w-9 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}