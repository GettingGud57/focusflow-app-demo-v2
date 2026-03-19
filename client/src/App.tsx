import { useState } from "react";
import { StrictMode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import TasksPage from "@/pages/TasksPage";
import WorkflowsPage from "@/pages/WorkflowsPage";
import CalendarPage from "@/pages/CalendarPage";
import AppearancePage from "@/pages/AppearancePage";
import ApiKeyPage from "@/pages/ApiKeyPage";
import NotFound from "@/pages/not-found";
import { DataProvider } from "@/components/data/context/DataContext";
import { FloatingButton } from "./components/FloatingButton";
import { AiSidebar } from "./components/AiSidebar";
import { useTheme } from "@/hooks/use-theme";
import { SettingsDialog } from "./components/SettingsDialog";
function Router() {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Navigation onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto overflow-x-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/workflows" component={WorkflowsPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/appearance" component={AppearancePage} />
          <Route path="/api-key" component={ApiKeyPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      {!isAiOpen && <FloatingButton onClick={() => setIsAiOpen(true)} />}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSelectAppearance={() => {
          setIsSettingsOpen(false);
          setLocation("/appearance");
        }}
        onSelectApi={() => {
          setIsSettingsOpen(false);
          setLocation("/api-key");
        }}
      />
    </div>
  );
}

function App() {
  useTheme(); // initialize theme on app load
  return (
    <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataProvider>
        <Toaster />
        <Router />
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </StrictMode>
  );
}

export default App;


