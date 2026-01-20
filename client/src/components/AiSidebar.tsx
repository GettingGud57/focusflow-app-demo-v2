import { Send, X,Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils"; // Assuming you have shadcn utils

import { useData } from "@/components/data/context/DataContext"; 
import {MOCK_SCENARIOS } from "@/components/data/Mockdata";
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
const { messages, addMessage,addTask,addEvent,addWorkflow ,pendingData, proposeChanges, confirmChanges, discardChanges } = useData();



// Same as Floating button logic
const hiddenRoutes = ["/", "/dashboard"];
const shouldShow = isOpen && !hiddenRoutes.includes(location);



// Scroll logic 
 useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);




const handleSend = () => {
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
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}