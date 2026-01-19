import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Tasks
  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get(api.tasks.get.path, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // Workflows
  app.get(api.workflows.list.path, async (req, res) => {
    const workflows = await storage.getWorkflows();
    res.json(workflows);
  });

  app.get(api.workflows.get.path, async (req, res) => {
    const workflow = await storage.getWorkflow(Number(req.params.id));
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    res.json(workflow);
  });

  app.post(api.workflows.create.path, async (req, res) => {
    try {
      const input = api.workflows.create.input.parse(req.body);
      const workflow = await storage.createWorkflow(input);
      res.status(201).json(workflow);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.workflows.update.path, async (req, res) => {
    try {
      const input = api.workflows.update.input.parse(req.body);
      const workflow = await storage.updateWorkflow(Number(req.params.id), input);
      if (!workflow) return res.status(404).json({ message: "Workflow not found" });
      res.json(workflow);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.workflows.delete.path, async (req, res) => {
    await storage.deleteWorkflow(Number(req.params.id));
    res.status(204).send();
  });

  // Calendar
  app.get(api.calendar.list.path, async (req, res) => {
    const events = await storage.getCalendarEvents();
    res.json(events);
  });

  app.post(api.calendar.create.path, async (req, res) => {
    try {
      const input = api.calendar.create.input.parse(req.body);
      const event = await storage.createCalendarEvent(input);
      res.status(201).json(event);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.calendar.update.path, async (req, res) => {
    try {
      const input = api.calendar.update.input.parse(req.body);
      const event = await storage.updateCalendarEvent(Number(req.params.id), input);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.calendar.delete.path, async (req, res) => {
    await storage.deleteCalendarEvent(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingTasks = await storage.getTasks();
  if (existingTasks.length === 0) {
    const t1 = await storage.createTask({
      title: "Write documentation",
      description: "Update the README and API docs",
      duration: 25,
      color: "#3b82f6"
    });
    const t2 = await storage.createTask({
      title: "Review PRs",
      description: "Check pending pull requests",
      duration: 15,
      color: "#10b981"
    });
    const t3 = await storage.createTask({
      title: "Team Meeting",
      description: "Daily standup",
      duration: 30,
      color: "#8b5cf6"
    });
    
    // Create a workflow
    await storage.createWorkflow({
      title: "Morning Routine",
      description: "Start the day right",
      steps: [
        { taskId: t2.id, order: 1 },
        { taskId: t3.id, order: 2 },
        { taskId: t1.id, order: 3 }
      ]
    });

    // Create a calendar event
    await storage.createCalendarEvent({
      title: "Morning Focus",
      startTime: new Date(),
      duration: 60,
      type: "workflow",
      referenceId: 1
    });
  }
}
