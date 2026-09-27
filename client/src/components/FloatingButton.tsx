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

  // Lifted clear of the bottom nav on mobile: the nav is ~5rem tall plus the
  // home-indicator inset, and at bottom-8 this button sat on top of it - which
  // is also what was crowding the Settings icon at the right end of the nav.
  return (
    <div className="fixed bottom-[calc(6rem_+_env(safe-area-inset-bottom))] right-4 sm:bottom-8 sm:right-8 z-50">
      <Button 
        size="icon"
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-xl bg-primary hover:bg-primary hover:scale-105 transition-all" //bg indigo-700
        onClick={onClick}
      >
        <Sparkles className="!w-6 !h-6 text-white" />
      </Button>
    </div>
  );
}