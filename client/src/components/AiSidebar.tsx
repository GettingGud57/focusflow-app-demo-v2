import { Send, X, Check, Plus, Paperclip, Clock, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils"; 
import getRandomColor from "@/lib/randomColor";
import { processFile } from "@/lib/readFile"; 
import { useData } from "@/components/data/context/DataContext"; 
import { useApiKey } from "@/hooks/use-api-key";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Lazy-load `generateProductivityPlan` at call time to avoid bundling server-only
// dependencies (like the OpenAI SDK) during HMR.
import { useEffect, useRef, useState } from "react";
import { newId } from "@/lib/newId";
import { format, isToday, isThisYear } from "date-fns";

// "14:05" today, "27 Sep 14:05" earlier, full date in another year. Messages
// restored from localStorage can carry the timestamp as an ISO string.
function formatMessageTime(timestamp: Date | string) {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "HH:mm");
  if (isThisYear(d)) return format(d, "d MMM HH:mm");
  return format(d, "d MMM yyyy HH:mm");
}




interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {

 const [location] = useLocation();
const [input, setInput] = useState("");
const [isTyping, setIsTyping] = useState(false);

const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for file
const [showHistory, setShowHistory] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden input


const scrollRef = useRef<HTMLDivElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
const {tasks, workflows, messages, addMessage,clearMessages,pendingData, proposeChanges, confirmChanges, discardChanges,
       conversations, conversationId, loadConversation, deleteConversation } = useData();
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
    if (!input.trim()&& !selectedFile) return;

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

      let extractedText = "";
      

      if (selectedFile) {
        try {
          // Process the file to extract text
          extractedText = await processFile(selectedFile);
        } catch (fileError) {
          console.error("Failed to read file:", fileError);
          addMessage("ai", "Sorry, I had trouble reading the attached file. Please make sure it's a supported format.");
          setIsTyping(false);
          setSelectedFile(null);
          return; // Stop execution if file reading fails
        }
        
        // Clear the selected file state after successful extraction
        setSelectedFile(null); 
      }




      // Prepare Context to give AI full awareness
      const context = {
        existingTasks:tasks , 
        existingWorkflows: workflows,
        currentDate: new Date(),
        chatHistory: messages , // Pass convo history
        fileContent: extractedText 
      };

      console.log("Clicked Send with input:", input, "and file:", context );

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
          const newTaskId = newId();
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
          const realId = newId();
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
                      id: newId(),
                      stepType: 'task' as const,
                      taskId: existingTask.id,
                      order: index,
                    });
                  } else {
                    // 🆕 Genuinely new inline task, create it
                    const newTaskId = newId();
                    const realTask = {
                      ...step.task,
                      id: newTaskId,
                      status: 'todo',
                      color: step.task.color || getRandomColor(),
                    };
                    allNewTasks.push(realTask);
                    workflowSteps.push({
                      id: newId(),
                      stepType: 'task' as const,
                      taskId: newTaskId,
                      order: index,
                    });
                  }
                } else if (step.taskId) {
                  // Case 2: Reference to a task — check taskIdMap first (top-level tasks)
                  const resolvedTaskId = taskIdMap[step.taskId] || step.taskId;
                  workflowSteps.push({
                    id: newId(),
                    stepType: 'task' as const,
                    taskId: resolvedTaskId,
                    order: index,
                  });
                }
              }else if (step.stepType === 'workflow' && step.workflowId) {
                // Case 3: Reference workflow — REMAP the ID if it was created in this batch
                const resolvedId = idMap[step.workflowId] || step.workflowId;
                workflowSteps.push({
                  id: newId(),
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
          events: (response.data.newEvents || []).map((event: any) => ({ ...event, id: newId() }))
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
        // z-[60] beats the bottom nav's z-50. At z-40 the nav's blurred background
        // covered the input row and paperclip on mobile, which is why they were
        // invisible. On mobile this panel is full-screen, so covering the nav is
        // correct anyway - the X closes it.
        "border-l bg-background flex flex-col transition-all duration-300 ease-in-out h-dvh pt-[env(safe-area-inset-top)] md:pt-0 fixed md:sticky right-0 top-0 z-[60] md:z-40",
        shouldShow ? "w-full md:w-[400px] opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"
      )}
    >
      {/* HEADER
          justify-between with three loose children spread the Plus into the
          middle. Grouping the actions in one flex box keeps them together on the
          right, and h-8 w-8 is a usable touch target where h-6 was 24px. */}
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm truncate">
          {showHistory ? "Chat history" : "AI Assistant"}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant={showHistory ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            title="Chat history"
            aria-label="Chat history"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            <Clock className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="New chat"
            aria-label="New chat"
            onClick={() => { clearMessages(); setShowHistory(false); }}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Close" aria-label="Close" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
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

      {/* HISTORY PANEL - replaces the chat area instead of floating above it. A
          popover would need positioning work and be cramped on a phone; this is
          full-height and scrolls naturally. */}
      {showHistory ? (
        <div className="flex-1 bg-muted/10 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No saved chats yet. A thread is saved as soon as you send a message.
            </p>
          ) : (
            conversations.map((conv) => {
              const isCurrent = conv.id === conversationId;
              const count = Array.isArray(conv.messages) ? conv.messages.length : 0;
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-start gap-2 rounded-lg border p-2 transition-colors",
                    isCurrent ? "border-primary/40 bg-primary/5" : "border-transparent bg-card hover:bg-muted/60"
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={async () => {
                      await loadConversation(conv.id);
                      setShowHistory(false);
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium line-clamp-2">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      {conv.title}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {count} message{count === 1 ? "" : "s"}
                      {conv.updatedAt ? ` · ${new Date(conv.updatedAt).toLocaleDateString()}` : ""}
                      {isCurrent ? " · current" : ""}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    title="Delete chat"
                    aria-label={`Delete ${conv.title}`}
                    onClick={() => void deleteConversation(conv.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      ) : (
      <>
      {/* CHAT AREA */}
      <div className="flex-1 bg-muted/10 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "rounded-lg p-3 max-w-[95%] text-sm overflow-x-auto",
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "self-stretch bg-muted text-foreground prose prose-sm dark:prose-invert max-w-none break-words"
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
            <time className="mt-1 px-1 text-[11px] text-muted-foreground">
              {formatMessageTime(msg.timestamp)}
            </time>
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
      {/* pb accounts for the home indicator, since this panel now sits above the
          bottom nav that used to provide that clearance. */}
      <div className="p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] md:pb-4 border-t bg-background">
        {selectedFile && (
          <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
            <span 
              className="cursor-pointer hover:underline hover:text-primary transition-colors flex items-center gap-1"
              onClick={() => {
                try {
                  const fileUrl = URL.createObjectURL(selectedFile);
                  const link = document.createElement('a');
                  link.href = fileUrl;
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  
                  // Some file types like docx will trigger a download instead of a preview
                  // Add it to document to ensure click works in all browsers
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  // Clean up memory after opening
                  setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
                } catch (e) {
                  console.error("Failed to open preview:", e);
                }
              }}
              title="Click to preview file"
            >
              📎 {selectedFile.name}
            </span>
            <X className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => setSelectedFile(null)} />
          </div>
        )}

        <div className="flex gap-2 items-end">
            <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.txt,.csv,.html,.htm,.md"
              onChange={(e) => {
              const file = e.target.files?.[0] || null;
              console.log("Selected file:", file); // DEBUG: Check if PDF reads here
              setSelectedFile(file);
              // Reset the input value so selecting the same file twice triggers onChange
              if (e.target) e.target.value = ''; 
            }} 
            
            
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 shrink-0" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
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
      </>
      )}
    </div>
  );
}