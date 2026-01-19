import { 
  users, tasks, workflows, workflowSteps, calendarEvents,
  type Task, type InsertTask, type UpdateTaskRequest,
  type Workflow, type InsertWorkflow, type UpdateWorkflowRequest, type WorkflowWithSteps,
  type CalendarEvent, type InsertCalendarEvent, type UpdateCalendarEventRequest
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Workflows
  getWorkflows(): Promise<WorkflowWithSteps[]>;
  getWorkflow(id: number): Promise<WorkflowWithSteps | undefined>;
  createWorkflow(workflow: InsertWorkflow & { steps: { taskId: number; order: number }[] }): Promise<WorkflowWithSteps>;
  updateWorkflow(id: number, workflow: UpdateWorkflowRequest): Promise<WorkflowWithSteps>;
  deleteWorkflow(id: number): Promise<void>;

  // Calendar
  getCalendarEvents(): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, event: UpdateCalendarEventRequest): Promise<CalendarEvent>;
  deleteCalendarEvent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updateTask: UpdateTaskRequest): Promise<Task> {
    const [task] = await db.update(tasks).set(updateTask).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
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

  async getWorkflow(id: number): Promise<WorkflowWithSteps | undefined> {
    const [wf] = await db.select().from(workflows).where(eq(workflows.id, id));
    if (!wf) return undefined;
    
    const steps = await this.getWorkflowSteps(id);
    return { ...wf, steps };
  }

  private async getWorkflowSteps(workflowId: number) {
    const steps = await db.select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .leftJoin(tasks, eq(workflowSteps.taskId, tasks.id))
      .orderBy(workflowSteps.order);
      
    return steps.map(s => ({
      ...s.workflow_steps,
      task: s.tasks!
    }));
  }

  async createWorkflow(req: InsertWorkflow & { steps: { taskId: number; order: number }[] }): Promise<WorkflowWithSteps> {
    const { steps, ...workflowData } = req;
    const [wf] = await db.insert(workflows).values(workflowData).returning();

    if (steps && steps.length > 0) {
      await db.insert(workflowSteps).values(
        steps.map(s => ({ ...s, workflowId: wf.id }))
      );
    }

    return this.getWorkflow(wf.id) as Promise<WorkflowWithSteps>;
  }

  async updateWorkflow(id: number, req: UpdateWorkflowRequest): Promise<WorkflowWithSteps> {
    const { steps, ...workflowData } = req;
    
    if (Object.keys(workflowData).length > 0) {
      await db.update(workflows).set(workflowData).where(eq(workflows.id, id));
    }

    if (steps) {
      // Replace all steps
      await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, id));
      if (steps.length > 0) {
        await db.insert(workflowSteps).values(
          steps.map(s => ({ ...s, workflowId: id }))
        );
      }
    }

    return this.getWorkflow(id) as Promise<WorkflowWithSteps>;
  }

  async deleteWorkflow(id: number): Promise<void> {
    await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, id));
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  // Calendar
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [created] = await db.insert(calendarEvents).values(event).returning();
    return created;
  }

  async updateCalendarEvent(id: number, event: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    const [updated] = await db.update(calendarEvents).set(event).where(eq(calendarEvents.id, id)).returning();
    return updated;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }
}

export const storage = new DatabaseStorage();
