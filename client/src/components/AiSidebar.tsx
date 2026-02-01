import { Send, X,Check,Plus} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils"; // Assuming you have shadcn utils
import getRandomColor from "@/lib/randomColor";

import { useData } from "@/components/data/context/DataContext"; 
import {MOCK_SCENARIOS } from "@/components/data/Mockdata";
import { generateProductivityPlan } from "../lib/ai";
import { useEffect, useRef, useState } from "react";
import { get } from "http";



interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {

 const [location] = useLocation();
const [input, setInput] = useState("");
const [isTyping, setIsTyping] = useState(false);
const scrollRef = useRef<HTMLDivElement>(null);
const {tasks, workflows, messages, addMessage,clearMessages,pendingData, proposeChanges, confirmChanges, discardChanges } = useData();



// Same as Floating button logic
const hiddenRoutes = ["/", "/dashboard"];
const shouldShow = isOpen && !hiddenRoutes.includes(location);



// Scroll logic 
 useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);



{/* HANDLE SEND (MOCK DATA VERSION) --- IGNORE THIS FUNCTION ---*/}
const handleSd = () => {
    if (!input.trim()) return;

    // 1. Save User's Message immediately
    const userText = input;
    addMessage("user", userText);
    setInput("");      // Clear input box
    setIsTyping(true); // Show "typing..." bubble

    // 2. Simulate AI "Thinking" Delay (1.5 seconds)
    setTimeout(() => {
      const cmd = userText.toLowerCase();
      
      // 3. Search for a matching scenario in your Mock Data
      const scenario = MOCK_SCENARIOS.find(s => cmd.includes(s.triggerKeyword));

      if (scenario) {
        // --- MATCH FOUND! EXECUTE DATA INJECTION ---
        proposeChanges({
        tasks: scenario.data.newTasks || [],
        workflows: scenario.data.newWorkflows || [],
        events: scenario.data.newEvents || []
        });

   

        // D. Reply with the specific script
        addMessage("ai", scenario.aiResponse);
      
      } else {
        // --- NO MATCH FOUND ---
        addMessage("ai", "I'm not sure how to handle that. Try keywords like 'biology', 'morning', or 'deadline'.");
      }

      setIsTyping(false); // Hide "typing..." bubble
    }, 1500); 
  };




  const handleAiSend = async () => {
    // 1. Basic Validation
    if (!input.trim()) return;

    // 2. Setup the UI (Show user message, clear input, show typing bubble)
    const userText = input;
    addMessage("user", userText);
    setInput("");      
    setIsTyping(true); 

    try {
      // 3. Prepare Context - Give AI full awareness
      const context = {
        existingTasks:tasks , 
        existingWorkflows: workflows,
        currentDate: new Date(),
        chatHistory: messages // Pass conversation history
      };

      // 4. Create the buckets for all new items

      let allNewTasks: any[] = [];
      let allNewWorkflows: any[] = [];


      const response = await generateProductivityPlan(userText, context);

      // 5. Check if the AI actually returned any work
      const hasNewData = 
        (response.data.newTasks && response.data.newTasks.length > 0) ||
        (response.data.newWorkflows && response.data.newWorkflows.length > 0) ||
        (response.data.newEvents && response.data.newEvents.length > 0);

      // 6. If has tasks ,create clean versions with IDs and colors

      if (response.data.newTasks && response.data.newTasks.length > 0) {
        const standaloneTasks = response.data.newTasks.map((t: any) => ({
          ...t,
          id: crypto.randomUUID(),
          status: 'todo',
          color: t.color || getRandomColor(),
        }));
        allNewTasks = [...allNewTasks, ...standaloneTasks];
      }
    
     // 7. If has workflows, process them

      if (response.data.newWorkflows && response.data.newWorkflows.length > 0) {
        response.data.newWorkflows.forEach((wf: any) => {
          const workflowId = crypto.randomUUID();
          const workflowSteps: any[] = [];
         // Process each task in the workflow
          wf.tasks.forEach((t: any, index: number) => {

            const newTaskId = crypto.randomUUID();
            const realTask = {
              ...t, // title, duration, etc.
              id: newTaskId,
              status: 'todo',
              color: t.color || getRandomColor(),
            };
            allNewTasks.push(realTask); // Add to overall task list

            const step = {
              id: crypto.randomUUID(),
              stepType: 'task' as const,
              taskId: newTaskId,    // only taskId is needed here
              order: index,
            };

            workflowSteps.push(step);
          });
          const realWorkflow = {
            ...wf,
            id: workflowId,
            loop: wf.loop || 1,
            steps: workflowSteps // Now contains valid step references
          };

        allNewWorkflows.push(realWorkflow);

        })
      }
      // 8. If anything new, propose changes to user
      if (hasNewData) {
        proposeChanges({
          tasks: allNewTasks,
          workflows: allNewWorkflows,
          events: (response.data.newEvents || []).map((event: any) => ({ ...event, id: crypto.randomUUID() }))
        });
      }

      // 7. Display the AI's chat message
      addMessage("ai", response.aiResponse);

    } catch (error) {
      console.error("AI Error:", error);
      addMessage("ai", "I'm having trouble connecting to the server. Please check your internet or API key.");
    } finally {
      // 8. Always turn off the typing bubble, even if it failed
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



     {/* [NEW] CONFIRMATION UI BLOCK */}
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
        <div className="flex gap-2">
          <Input 
            placeholder="Ask anything..." 
            className="h-9 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiSend()}
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAiSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}