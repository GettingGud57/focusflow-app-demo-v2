import { Link, useLocation } from "wouter";
import { LayoutGrid, CheckSquare, Calendar as CalendarIcon, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavigationProps = {
  onOpenSettings?: () => void;
};

export function Navigation({ onOpenSettings }: NavigationProps) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Focus", icon: Clock },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/workflows", label: "Workflows", icon: LayoutGrid },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:sticky md:top-0 md:h-screen md:w-64 md:flex-shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t md:border-t-0 md:border-r border-border/50">
      <div className="flex md:flex-col h-full w-full items-center md:items-start p-2 md:p-6 gap-2 md:gap-4 justify-around md:justify-between">
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
          <img src="/fffavicon.png" alt="FocusFlow" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display font-bold text-xl tracking-tight">FocusFlow</span>
        </div>
        <div className="flex md:flex-col gap-2 md:gap-3 w-full">
          {links.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="hidden md:block">{link.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="w-full pt-2 md:pt-4 md:mt-auto border-t md:border-t-0 border-border/50">
          <Button 
            variant="ghost" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full justify-center md:justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground h-auto font-normal"
            onClick={onOpenSettings}
          >
            <Settings className="w-5 h-5" />
            <span className="hidden md:block">Settings</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
