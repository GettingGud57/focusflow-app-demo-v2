import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import TasksPage from "@/pages/TasksPage";
import WorkflowsPage from "@/pages/WorkflowsPage";
import CalendarPage from "@/pages/CalendarPage";
import NotFound from "@/pages/not-found";
import { DataProvider } from "@/components/data/context/DataContext";
import { FloatingButton } from "./components/FloatingButton";
import { AiSidebar } from "./components/AiSidebar";
import { useState } from "react";
function Router() {
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto overflow-x-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/workflows" component={WorkflowsPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      {!isAiOpen && <FloatingButton onClick={() => setIsAiOpen(true)} />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataProvider>
        <Toaster />
        <Router />
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;


