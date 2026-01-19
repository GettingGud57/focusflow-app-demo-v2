import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  color: text("color").default("#3b82f6"),
});

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
});

export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  taskId: integer("task_id").notNull(),
  order: integer("order").notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  type: text("type").notNull(), // 'task' or 'workflow'
  referenceId: integer("reference_id"), // id of task or workflow
  isCompleted: boolean("is_completed").default(false),
});

// === RELATIONS ===
export const tasksRelations = relations(tasks, ({ many }) => ({
  workflowSteps: many(workflowSteps),
}));

export const workflowsRelations = relations(workflows, ({ many }) => ({
  steps: many(workflowSteps),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  task: one(tasks, {
    fields: [workflowSteps.taskId],
    references: [tasks.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true });
export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({ id: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type WorkflowWithSteps = Workflow & { steps: (WorkflowStep & { task: Task })[] };

// Request types
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;

export type CreateWorkflowRequest = InsertWorkflow & { steps: { taskId: number; order: number }[] };
export type UpdateWorkflowRequest = Partial<InsertWorkflow> & { steps?: { taskId: number; order: number }[] };

export type CreateCalendarEventRequest = InsertCalendarEvent;
export type UpdateCalendarEventRequest = Partial<InsertCalendarEvent>;
