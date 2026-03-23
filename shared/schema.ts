import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(), // which user owns this task
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  color: text("color").default("#3b82f6"),
});

export const workflows = pgTable("workflows", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(), // which user owns this workflow
  title: text("title").notNull(),
  description: text("description"),
  loop: integer("loop").default(1), // how many times the workflow repeats
});

export const workflowSteps = pgTable("workflow_steps", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }), // delete steps when parent workflow is deleted
  taskId: text("task_id")
    .references(() => tasks.id, { onDelete: "set null" }), // keep step, just unlink task
  nestedWorkflowId: text("nested_workflow_id")
    .references(() => workflows.id, { onDelete: "set null" }), // keep step, just unlink nested workflow
  stepType: text("step_type").notNull().default("task"), // 'task' | 'workflow'
  order: integer("order").notNull(),
  // no userId here — steps are owned by their parent workflow
});

export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(), // which user owns this event
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  type: text("type").notNull(), // 'task' or 'workflow'
  referenceId: text("reference_id"), // plain text — can point to task or workflow id
  isCompleted: boolean("is_completed").default(false),
});

// === RELATIONS ===

export const tasksRelations = relations(tasks, ({ many }) => ({
  workflowSteps: many(workflowSteps),
}));

export const workflowsRelations = relations(workflows, ({ many }) => ({
  steps: many(workflowSteps),
  // needed because workflows is referenced twice (workflowId + nestedWorkflowId)
  nestedInSteps: many(workflowSteps, { relationName: "nestedWorkflow" }),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  // the parent workflow this step belongs to
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  // the task this step runs (if stepType === 'task')
  task: one(tasks, {
    fields: [workflowSteps.taskId],
    references: [tasks.id],
  }),
  // the nested workflow this step runs (if stepType === 'workflow')
  nestedWorkflow: one(workflows, {
    fields: [workflowSteps.nestedWorkflowId],
    references: [workflows.id],
    relationName: "nestedWorkflow",
  }),
}));

// === INSERT SCHEMAS ===

export const insertTaskSchema = createInsertSchema(tasks).extend({ id: z.string().optional() });
export const insertWorkflowSchema = createInsertSchema(workflows).extend({ id: z.string().optional() });
export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).extend({ id: z.string().optional() });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).extend({ id: z.string().optional() });

// === INFERRED TYPES ===

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

// === COMPOSITE TYPES ===

export type WorkflowWithSteps = Workflow & {
  steps: (WorkflowStep & {
    task?: Task;               // populated when stepType === 'task'
    nestedWorkflow?: Workflow; // populated when stepType === 'workflow'
  })[];
};

// === REQUEST TYPES ===

export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;

export type CreateWorkflowRequest = InsertWorkflow & {
  steps: {
    taskId?: string;           // present when stepType === 'task'
    nestedWorkflowId?: string; // present when stepType === 'workflow'
    stepType: string;
    order: number;
  }[];
};

export type UpdateWorkflowRequest = Partial<InsertWorkflow> & {
  steps?: {
    taskId?: string;
    nestedWorkflowId?: string;
    stepType: string;
    order: number;
  }[];
};

export type CreateCalendarEventRequest = InsertCalendarEvent;
export type UpdateCalendarEventRequest = Partial<InsertCalendarEvent>;