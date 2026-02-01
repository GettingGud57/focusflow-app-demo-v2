import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";




interface FloatingButtonProps {
  onClick: () => void;
}


export function FloatingButton( { onClick }: FloatingButtonProps) {
  const [location] = useLocation();

  // LIST OF PAGES WHERE THE BUTTON SHOULD HIDE
  // Add "/dashboard" or "/" or whatever your dashboard route is named
  const hiddenRoutes = ["/", "/dashboard"];

  if (hiddenRoutes.includes(location)) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button 
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary hover:scale-105 transition-all" //bg indigo-700
        onClick={onClick}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </Button>
    </div>
  );
}