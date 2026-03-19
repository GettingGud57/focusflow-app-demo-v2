import { Send, X,Check,Plus} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils"; 
import getRandomColor from "@/lib/randomColor";

import { useData } from "@/components/data/context/DataContext"; 
import { useApiKey } from "@/hooks/use-api-key";

// Lazy-load `generateProductivityPlan` at call time to avoid bundling server-only
// dependencies (like the OpenAI SDK) during HMR.
import { useEffect, useRef, useState } from "react";




interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {

 const [location] = useLocation();
const [input, setInput] = useState("");
const [isTyping, setIsTyping] = useState(false);
const scrollRef = useRef<HTMLDivElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
const {tasks, workflows, messages, addMessage,clearMessages,pendingData, proposeChanges, confirmChanges, discardChanges } = useData();
const { apiKey } = useApiKey();



// Same as Floating button logic
const hiddenRoutes = ["/", "/dashboard"];
const shouldShow = isOpen && !hiddenRoutes.includes(location);



// Scroll logic 
 useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);







  const handleAiSend = async () => {
    // Basic Validation, if nothing in input, return nothing
    if (!input.trim()) return;

    //  Setup the UI (Show user message, clear input, typing bubble)
    const userText = input;
    addMessage("user", userText);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
    setIsTyping(true); 

    try {
      // Prepare Context to give AI full awareness
      const context = {
        existingTasks:tasks , 
        existingWorkflows: workflows,
        currentDate: new Date(),
        chatHistory: messages // Pass convo history
      };

      // Create the buckets for all new items
      
      let allNewTasks: any[] = [];
      let allNewWorkflows: any[] = [];

      const { generateProductivityPlan } = await import("@/lib/ai");
      const response = await generateProductivityPlan(userText, context, apiKey);

      // Check if AI actually returned any work
      const hasNewData = 
        (response.data.newTasks && response.data.newTasks.length > 0) ||
        (response.data.newWorkflows && response.data.newWorkflows.length > 0) ||
        (response.data.newEvents && response.data.newEvents.length > 0);

      // Build a task ID map from TOP-LEVEL tasks FIRST
      // So workflows can reference them correctly
      const taskIdMap: Record<string, string> = {};

      if (response.data.newTasks && response.data.newTasks.length > 0) {
        response.data.newTasks.forEach((task: any) => {
          const newTaskId = crypto.randomUUID();
          const realTask = {
            ...task,
            id: newTaskId,
            status: 'todo',
            color: task.color || getRandomColor(),
          };
          // Map old AI-assigned ID -> new real UUID
          if (task.id) taskIdMap[task.id] = newTaskId;
          // Also map by title as fallback (AI sometimes references by title)
          taskIdMap[task.title] = newTaskId;
          allNewTasks.push(realTask);
        });
      }

      if (response.data.newWorkflows && response.data.newWorkflows.length > 0) {
        
        // FIRST PASS: Assign real IDs to all workflows and build an ID mapping
        const idMap: Record<string, string> = {};
        
        const workflowsWithRealIds = response.data.newWorkflows.map((wf: any) => {
          const realId = crypto.randomUUID();
          if (wf.id) idMap[wf.id] = realId;
          return { ...wf, realId };
        });

        // SECOND PASS: Process steps, remapping any workflow/task references
        workflowsWithRealIds.forEach((wf: any) => {
          const workflowSteps: any[] = [];

          if (wf.steps && wf.steps.length > 0) {
            wf.steps.forEach((step: any, index: number) => {

              if (step.stepType === 'task') {
                if (step.task) {
                  // Case 1: Inline task — check if already created from top-level tasks
                  const existingTask = allNewTasks.find(t => t.title === step.task.title);

                  if (existingTask) {
                    // ✅ Task already exists from top-level, just reference it
                    workflowSteps.push({
                      id: crypto.randomUUID(),
                      stepType: 'task' as const,
                      taskId: existingTask.id,
                      order: index,
                    });
                  } else {
                    // 🆕 Genuinely new inline task, create it
                    const newTaskId = crypto.randomUUID();
                    const realTask = {
                      ...step.task,
                      id: newTaskId,
                      status: 'todo',
                      color: step.task.color || getRandomColor(),
                    };
                    allNewTasks.push(realTask);
                    workflowSteps.push({
                      id: crypto.randomUUID(),
                      stepType: 'task' as const,
                      taskId: newTaskId,
                      order: index,
                    });
                  }
                } else if (step.taskId) {
                  // Case 2: Reference to a task — check taskIdMap first (top-level tasks)
                  const resolvedTaskId = taskIdMap[step.taskId] || step.taskId;
                  workflowSteps.push({
                    id: crypto.randomUUID(),
                    stepType: 'task' as const,
                    taskId: resolvedTaskId,
                    order: index,
                  });
                }
              }else if (step.stepType === 'workflow' && step.workflowId) {
                // Case 3: Reference workflow — REMAP the ID if it was created in this batch
                const resolvedId = idMap[step.workflowId] || step.workflowId;
                workflowSteps.push({
                  id: crypto.randomUUID(),
                  stepType: 'workflow' as const,
                  workflowId: resolvedId,
                  order: index,
                });
              }
            });
          }

          const realWorkflow = {
            ...wf,
            id: wf.realId,
            loop: wf.loop || 1,
            steps: workflowSteps,
          };
          delete realWorkflow.realId;
          allNewWorkflows.push(realWorkflow);
        });
      }
 



      // If anything new, propose changes to user
      if (hasNewData) {
        proposeChanges({
          tasks: allNewTasks,
          workflows: allNewWorkflows,
          events: (response.data.newEvents || []).map((event: any) => ({ ...event, id: crypto.randomUUID() }))
        });
        console.log("Proposed Changes:", {
          tasks: allNewTasks,
          workflows: allNewWorkflows,
          events: response.data.newEvents || []
        });
      }

      // Display the AI's chat message
      addMessage("ai", response.aiResponse);

    } catch (error) {
      console.error("AI Error:", error);
      addMessage("ai", "I'm having trouble connecting to the server. Please check your internet or API key.");
    } finally {
      //  Always turn off the typing bubble, even if failed
      setIsTyping(false); 
    }
  };


 
 
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
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => clearMessages()}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="px-4 py-2 text-xs text-muted-foreground border-b">
        {apiKey ? "Using your saved API key." : "Using project key; add yours in Settings."}
      </div>



     {/* LE CONFIRMATION UI BLOCK */}
    {pendingData && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 animate-in slide-in-from-top-2">
           <p className="text-xs font-medium text-amber-900 mb-2">
             🤖 Proposed Changes:
             {pendingData.tasks?.length > 0 && <span className="block ml-2">• {pendingData.tasks.length} New Tasks</span>}
              {pendingData.workflows?.length > 0 && <span className="block ml-2">• {pendingData.workflows.length} New Workflows</span>}
             {pendingData.events?.length > 0 && <span className="block ml-2">• {pendingData.events.length} Calendar Events</span>}
           </p>
           <div className="flex gap-2">
             <Button 
               size="sm" 
               className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-xs"
               onClick={() => {
                 confirmChanges();
                 addMessage("ai", "✅ Changes applied!");
               }}
             >
               <Check className="w-3 h-3 mr-1" /> Accept
             </Button>
             <Button 
               size="sm" 
               variant="outline"
               className="flex-1 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
               onClick={() => {
                 discardChanges();
                 addMessage("ai", "❌ Changes discarded.");
               }}
             >
               <X className="w-3 h-3 mr-1" /> Reject
             </Button>
           </div>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 bg-muted/10 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg p-3 max-w-[85%] text-sm",
              msg.role === "user"
                ? "bg-indigo-600 text-white ml-auto"
                : "bg-muted text-foreground"
            )}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="bg-muted text-foreground rounded-lg p-3 max-w-[85%] text-sm">
            <span className="animate-pulse">AI is typing...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>





     




      {/* INPUT AREA */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Ask anything..."
            className="resize-none text-sm min-h-[36px] max-h-40 overflow-y-auto"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize textarea
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
              }
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAiSend();
              }
            }}
            rows={1}
            style={{ height: '36px' }}
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAiSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}