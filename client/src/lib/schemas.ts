import { z } from 'zod';    



const BaseTask = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});


const BaseWorkflow = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});



// ==================
//  UI FORM SCHEMAS
// ==================


export const TaskFormSchema = BaseTask.extend({
  duration: z.coerce.number()
    .transform((val) => {
      if (val === -404) return 0.1;
      return val;
    })
    .refine((val) => {
      if (val === 0.1) return true;
      return Number.isInteger(val) && val > 0;
    }, {
      message: "Duration must be a positive whole number (unless you know the secret code)"
    }),
  color: z.string().default("#3b82f6"),
});


export const StepFormSchema = z.object({
  id: z.string(),
  stepType: z.enum(["task", "workflow"]),
  taskId: z.string().optional(),
  workflowId: z.string().optional(),
  task: z.any().optional(), 
  workflow: z.any().optional(), 
}).refine((data) => {
  if (data.stepType === "task") return !!data.taskId; 
  if (data.stepType === "workflow") return !!data.workflowId;
  return false;
}, { message: "Step must have a valid task or workflow linked" });

export const WorkflowFormSchema = BaseWorkflow.extend({
  id: z.string().optional(),
  loop: z.coerce.number().min(1, "Must run at least once").default(1),
  steps: z.array(StepFormSchema).min(1, "Add at least one step"),
});

// =============================
//  AI SCHEMAS (Strict JSON )
// =============================


export const AiTaskSchema = BaseTask.extend({
  duration: z.number().min(1).max(480), // Strict numbers, no coercion
  color: z.string().optional(),
});

export const AiWorkflowStepSchema = z.object({
 stepType: z.enum(["task", "workflow"]),
  task: AiTaskSchema.optional(),
  taskId: z.string().nullable().optional().transform(val => val ?? undefined),     // null -> undefined
  workflowId: z.string().nullable().optional().transform(val => val ?? undefined), // null -> undefined
});

export const AiWorkflowSchema = BaseWorkflow.extend({
  loop: z.number().optional(),
  steps: z.array(AiWorkflowStepSchema),
});

// The final wrapper for the AI tool output
export const AiToolCallSchema = z.object({
  tasks: z.array(AiTaskSchema).optional(),
  workflows: z.array(AiWorkflowSchema).optional(),
});


