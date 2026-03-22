import OpenAI from 'openai';

import { AiToolCallSchema } from './schemas';
import { dagValidation } from "@/lib/dagValidation";

const createClient = (apiKeyOverride?: string) =>
  new OpenAI({
    apiKey: apiKeyOverride || import.meta.env.VITE_GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true
  });


type AiContext = {
  existingTasks: any[];    // existing takss
  existingWorkflows: any[]; // existing workflows 
  currentDate: Date;       // current date
  chatHistory?: { role: 'user' | 'ai', text: string }[]; // conversation history, check line 130
  fileContent?: string;
};

// OpenAi agent tools (What can the Ai do)
const tools = [
  {
    type: "function" as const,
    function: {
      name: "generate_productivity_plan",
      description: "Generate a list of tasks, OR a structured workflow.",
      parameters: {
        type: "object",
        properties: {
          // 1. Tasks Section
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                duration: { type: "number" },
                color: { type: "string" }
              },
              required: ["title", "duration"]
            }
          },
          
          // 2. Workflow Section
          workflows: {
            type: "array",
            description: "A sequence of tasks. ONLY include tasks that are logically part of this specific workflow.",
            items: {
              type: "object",
              properties: {
                title: { type: "string" }, 
                description: { type: "string" },
                loop: { 
                    type: "number", 
                    description: "Number of times to repeat this workflow (default 1)" 
                },
                // 3.Workflow Step section
                steps: {
                  type: "array",
                  description: "Individual steps of the workflow. Each step MUST be relevant to the workflow's title.",
                  items: {
                    type: "object",
                    properties: {
                      stepType: {
                        type: "string", 
                        enum: ["task", "workflow"],
                        description: "Type of step"
                      },
                      // 3.1 New tasks inline
                      task: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          duration: { type: "number" }
                        },
                        required: ["title", "duration"]
                      },
                      // 3.2 Referencing existing task or workflow by ID
                      taskId: { 
                        type: "string", 
                        description: "ID of an existing task to reuse. ONLY use this if the task is relevant to the workflow."
                      },
                      workflowId: { 
                        type: "string", 
                        description: "ID of an existing workflow to reuse. ONLY use this if the nested workflow makes sense here."
                      }
                    },
                    required: ["stepType"]  
                  }
                }
              },
              required: ["title", "steps"]
            }
          }
        },
        // The AI can pick one or the other.
        required: [] 
      }
    }
  }
];









export async function generateProductivityPlan(userMessage: string, context?: AiContext, apiKeyOverride?: string) {
  const openai = createClient(apiKeyOverride);
  try {
    // Context-aware system message


    let systemMessage = `
      You are a productivity and study assistant for Focus Flow.
  You can ONLY perform these actions:
  - Create tasks (with title, description, duration, color)
  - Create workflows (structured sequences of tasks)
  - Reference or reuse existing tasks/workflows
  - Answer questions, summarize, or estimate study times for uploaded files.

  RULES:
  - If the user provides a file, use it to answer their questions or break it down into a study workflow.
  - If the user asks something totally unrelated to productivity or the uploaded file, humorously redirect them.
  - Never generate more than 10 tasks at once.
  - Always respect time constraints the user gives.
  - **COHESION RULE**: Workflows must be tightly focused.`;






   
    
    // adding existing tasks and workflow context
    if (context) {
      const tasksList = context.existingTasks.map(t => `"${t.title}" (ID: ${t.id})`).join(", ");
      const workflowsList = context.existingWorkflows.map(w => `"${w.title}" (ID: ${w.id})`).join(", ");
      
      systemMessage += `\n\nCurrent context:
    - Date: ${context.currentDate.toLocaleDateString()}
    - Existing tasks (${context.existingTasks.length}): ${tasksList || "none"}
    - Existing workflows (${context.existingWorkflows.length}): ${workflowsList || "none"}
    -File content: ${context.fileContent ? context.fileContent: "No file uploaded."}


    TECHNICAL RULES FOR TOOL USAGE:
    1. When user asks to "merge" or "combine" workflows, use stepType:'workflow' with workflowId to reference existing workflows.
    2. When reusing existing tasks in a new workflow, use stepType:'task' with taskId to reference them.
    3. Only create NEW tasks (using the 'task' object) when the user explicitly asks for new activities.
    4. Avoid creating duplicates - check existing tasks/workflows first.
    5. **WORKFLOW INTEGRITY**: Do NOT add existing tasks from the context to a NEWLY generated workflow unless they are logically part of that activity. If the user asks for a 'morning routine', don't include an unrelated task like 'Buy groceries' from the existing list.
    6. **NO HALLUCINATIONS**: If the user's request doesn't need to involve an existing task, don't force it in. Keep workflows lean and focused.`;
    }

    // message history , role as system and system Message as in ln 113. Serves as context
    const messages: any[] = [
      { role: 'system', content: systemMessage }
    ];

    //  add previous chat messages to 3nd of message (convert 'ai' role to 'assistant')
    if (context?.chatHistory && context.chatHistory.length > 0) {
      const historyMessages = context.chatHistory.slice(-10).map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));
      messages.push(...historyMessages);
    }
    
   const trimmed = userMessage.trim();

   const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;

  // Msg too short
  if (wordCount  < 2 ) {
        return {
          aiResponse: "Your message was a bit too short for me to understand. Could you please provide more details?" ,
          data: { newTasks: [], newWorkflows: [], newEvents: [] }
        };
  }

  // Msg too long
  if (wordCount  > 500 ) {
    return {
      aiResponse: "Your message is a bit too long for me to process. Could you please keep it under 500 characters?",
      data: { newTasks: [], newWorkflows: [], newEvents: [] }
    };
  }

  // Empty after trim
  if (!trimmed) {
    return {
      aiResponse: "It seems like your message is empty. Could you please provide some details on what you'd like help with?",
      data: { newTasks: [], newWorkflows: [], newEvents: [] }   
    }
  }


    //  add current user message
    messages.push({ role: 'user', content: userMessage });

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    // Check if the AI decided to use the tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.type === 'function') {
        const rawArgs = JSON.parse(toolCall.function.arguments);

        const validation = AiToolCallSchema.safeParse(rawArgs);


      if (!validation.success) {
        console.error("AI returned malformed data:", validation.error);
      return {
          aiResponse: "I tried to build a plan, but the data got a little scrambled. Could we try again?",
          data: { newTasks: [], newWorkflows: [], newEvents: [] }
        };
      }

      
      

     const args = validation.data;

     // Validate workflows for cycles
     
     if (args.workflows && args.workflows.length > 0) {
       const existingWorkflows = context?.existingWorkflows || [];


       const currentAccuWorkflows = [...existingWorkflows];
       
       for (const wf of args.workflows) {
         // Create a temp workflow with ID for validation 
         const tempWf = { ...wf, id: "temp-validation-id" } as any; 
         const cycleCheck = dagValidation(tempWf, currentAccuWorkflows);
         
         if (!cycleCheck.isValid) {
           return {
             aiResponse: "I couldn't create that workflow because it would cause an infinite loop.",
             data: { newTasks: [], newWorkflows: [], newEvents: [] }
           };
         }
         currentAccuWorkflows.push(tempWf);
       }
     }
      
      return {
        aiResponse: "I've drafted a plan for you. Check the boxes above to confirm.",
        data: {
          newTasks: args.tasks || [],
          newWorkflows: args.workflows || [],
          newEvents: []
        }
       }
      };
    }

    // If it didn't use a tool ,just chat
    return {
      aiResponse: message.content || "I couldn't generate a plan.",
      data: { newTasks: [], newWorkflows: [], newEvents: [] }
    };

  } catch (error) {
    console.error("AI Error:", error);
    return {
      aiResponse: "Sorry, I hit a snag connecting to the AI.",
      data: { newTasks: [], newWorkflows: [], newEvents: [] }
    };
  }
}