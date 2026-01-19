import { Link, useLocation } from "wouter";
import { LayoutGrid, CheckSquare, Calendar as CalendarIcon, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Focus", icon: Clock },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/workflows", label: "Workflows", icon: LayoutGrid },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:relative md:w-64 md:flex-shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t md:border-t-0 md:border-r border-border/50">
      <div className="flex md:flex-col h-full items-center md:items-start p-2 md:p-6 gap-2 md:gap-4 justify-around md:justify-start">
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Flowmodoro</span>
        </div>

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
    </nav>
  );
}
