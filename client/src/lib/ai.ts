import OpenAI from 'openai';
import { Task, Workflow } from '../components/data/context/DataContext'; 
// ^ Make sure this path points to where your Types are defined!

// 1. Setup the Connection
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY, // This reads the key from .env
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true // REQUIRED since we are running in Vite (Client side)
});


type AiContext = {
  existingTasks: any[];    // What tasks exist already?
  existingWorkflows: any[]; // What workflows exist?
  currentDate: Date;       // What time is it?
  chatHistory?: { role: 'user' | 'ai', text: string }[]; // Previous conversation
};

// 2. Define the Tools (The "Agent" capabilities)
const tools = [
  {
    type: "function" as const,
    function: {
      name: "generate_productivity_plan",
      description: "Generate a list of tasks, OR a structured workflow.",
      parameters: {
        type: "object",
        properties: {
          // 1. The Tasks Section (You already have this)
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
          
          // 2. THE NEW WORKFLOW SECTION (Add this!)
          workflows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" }, // Name of workflow .eg: "Morning Routine"
                description: { type: "string" },
                loop: { 
                    type: "number", 
                    description: "Number of times to repeat this workflow (default 1)" 
                },
                tasks: { // Workflow contains list of tasks inside it
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      duration: { type: "number" }
                    },
                    required: ["title", "duration"]
                  }
                }
              },
              required: ["title", "tasks"]
            }
          }
        },
        // We don't require both. The AI can pick one or the other.
        required: [] 
      }
    }
  }
];

export async function generateProductivityPlan(userMessage: string, context?: AiContext) {
  try {
    // Build context-aware system message
    let systemMessage = "You are a helpful productivity assistant. When creating tasks or workflows, ALWAYS provide clear, helpful descriptions that explain what needs to be done and why it's important. Use the generate_productivity_plan tool for planning requests.";
    
    if (context) {
      systemMessage += `\n\nCurrent context:\n- Date: ${context.currentDate.toLocaleDateString()}\n- Existing tasks (${context.existingTasks.length}): ${context.existingTasks.map(t => t.title).join(", ") || "none"}\n- Existing workflows (${context.existingWorkflows.length}): ${context.existingWorkflows.map(w => w.title).join(", ") || "none"}\n\nAvoid creating duplicates unless explicitly requested. Reference previous conversation when relevant.`;
    }

    // Build message history: system + chat history + current user message
    const messages: any[] = [
      { role: 'system', content: systemMessage }
    ];

    // Add previous chat messages (convert 'ai' role to 'assistant')
    if (context?.chatHistory && context.chatHistory.length > 0) {
      const historyMessages = context.chatHistory.slice(-10).map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));
      messages.push(...historyMessages);
    }

    // Add current user message
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
        const args = JSON.parse(toolCall.function.arguments);


      
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

    // If it didn't use a tool (just chatting)
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