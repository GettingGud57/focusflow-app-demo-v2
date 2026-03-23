
import {
  tasks, workflows, workflowSteps, calendarEvents,
  type Task, type InsertTask, type UpdateTaskRequest,
  type Workflow, type InsertWorkflow, type UpdateWorkflowRequest, type WorkflowWithSteps,
  type CalendarEvent, type InsertCalendarEvent, type UpdateCalendarEventRequest
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
 
// Temporary default userId until auth is implemented
const DEFAULT_USER_ID = "default-user";
 
export interface IStorage {
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: string): Promise<void>;
 
  // Workflows
  getWorkflows(): Promise<WorkflowWithSteps[]>;
  getWorkflow(id: string): Promise<WorkflowWithSteps | undefined>;
  createWorkflow(workflow: InsertWorkflow & { steps: { taskId?: string; nestedWorkflowId?: string; stepType: string; order: number }[] }): Promise<WorkflowWithSteps>;
  updateWorkflow(id: string, workflow: UpdateWorkflowRequest): Promise<WorkflowWithSteps>;
  deleteWorkflow(id: string): Promise<void>;
 
  // Calendar
  getCalendarEvents(): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: UpdateCalendarEventRequest): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
}
 
export class DatabaseStorage implements IStorage {
  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }
 
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
 
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      id: insertTask.id ?? randomUUID(),
      userId: insertTask.userId ?? DEFAULT_USER_ID,
    }).returning();
    return task;
  }
 
  async updateTask(id: string, updateTask: UpdateTaskRequest): Promise<Task> {
    const [task] = await db.update(tasks).set(updateTask).where(eq(tasks.id, id)).returning();
    return task;
  }
 
  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
 
  // Workflows
  async getWorkflows(): Promise<WorkflowWithSteps[]> {
    const allWorkflows = await db.select().from(workflows);
    const results: WorkflowWithSteps[] = [];
 
    for (const wf of allWorkflows) {
      const steps = await this.getWorkflowSteps(wf.id);
      results.push({ ...wf, steps });
    }
    return results;
  }
 
  async getWorkflow(id: string): Promise<WorkflowWithSteps | undefined> {
    const [wf] = await db.select().from(workflows).where(eq(workflows.id, id));
    if (!wf) return undefined;
 
    const steps = await this.getWorkflowSteps(id);
    return { ...wf, steps };
  }
 
  private async getWorkflowSteps(workflowId: string) {
    const steps = await db.select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .leftJoin(tasks, eq(workflowSteps.taskId, tasks.id))
      .orderBy(workflowSteps.order);
 
    return steps.map(s => ({
      ...s.workflow_steps,
      task: s.tasks ?? undefined,
    }));
  }
 
  async createWorkflow(req: InsertWorkflow & { steps: { taskId?: string; nestedWorkflowId?: string; stepType: string; order: number }[] }): Promise<WorkflowWithSteps> {
    const { steps, ...workflowData } = req;
    const workflowId = workflowData.id ?? randomUUID();
 
    const [wf] = await db.insert(workflows).values({
      ...workflowData,
      id: workflowId,
      userId: workflowData.userId ?? DEFAULT_USER_ID,
    }).returning();
 
    if (steps && steps.length > 0) {
      await db.insert(workflowSteps).values(
        steps.map((s: any) => ({
          id: s.id ?? randomUUID(),
          workflowId: wf.id,
          taskId: s.taskId ?? null,
          nestedWorkflowId: s.nestedWorkflowId ?? null,
          stepType: s.stepType ?? "task",
          order: s.order,
        }))
      );
    }
 
    return this.getWorkflow(wf.id) as Promise<WorkflowWithSteps>;
  }
 
  async updateWorkflow(id: string, req: UpdateWorkflowRequest): Promise<WorkflowWithSteps> {
    const { steps, ...workflowData } = req;
 
    if (Object.keys(workflowData).length > 0) {
      await db.update(workflows).set(workflowData).where(eq(workflows.id, id));
    }
 
    if (steps) {
      await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, id));
      if (steps.length > 0) {
        await db.insert(workflowSteps).values(
          steps.map((s: any) => ({
            id: s.id ?? randomUUID(),
            workflowId: id,
            taskId: s.taskId ?? null,
            nestedWorkflowId: s.nestedWorkflowId ?? null,
            stepType: s.stepType ?? "task",
            order: s.order,
          }))
        );
      }
    }
 
    return this.getWorkflow(id) as Promise<WorkflowWithSteps>;
  }
 
  async deleteWorkflow(id: string): Promise<void> {
    await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, id));
    await db.delete(workflows).where(eq(workflows.id, id));
  }
 
  // Calendar
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents);
  }
 
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [created] = await db.insert(calendarEvents).values({
      ...event,
      id: event.id ?? randomUUID(),
      userId: event.userId ?? DEFAULT_USER_ID,
    }).returning();
    return created;
  }
 
  async updateCalendarEvent(id: string, event: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    const [updated] = await db.update(calendarEvents).set(event).where(eq(calendarEvents.id, id)).returning();
    return updated;
  }
 
  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }
}
 
export const storage = new DatabaseStorage();