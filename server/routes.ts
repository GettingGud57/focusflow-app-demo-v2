
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
    const task = await storage.getTask(req.params.id); // string, not Number()
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
      const task = await storage.updateTask(req.params.id, input); // string, not Number()
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
    await storage.deleteTask(req.params.id); // string, not Number()
    res.status(204).send();
  });
 
  // Workflows
  app.get(api.workflows.list.path, async (req, res) => {
    const workflows = await storage.getWorkflows();
    res.json(workflows);
  });
 
  app.get(api.workflows.get.path, async (req, res) => {
    const workflow = await storage.getWorkflow(req.params.id); // string, not Number()
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
      const workflow = await storage.updateWorkflow(req.params.id, input); // string, not Number()
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
    await storage.deleteWorkflow(req.params.id); // string, not Number()
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
      const event = await storage.updateCalendarEvent(req.params.id, input); // string, not Number()
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
    await storage.deleteCalendarEvent(req.params.id); // string, not Number()
    res.status(204).send();
  });

 
  // --- AI Proxy Route ---
  app.post("/api/ai/generate", async (req, res) => {
    try {
      // Use dynamic import for OpenAI to avoid issues if not installed globally
      const { OpenAI } = await import("openai");
      const { apiKeyOverride, provider = "groq", tools, messages } = req.body;



       let baseURL = 'https://api.openai.com/v1';
      if (provider === 'groq') baseURL = 'https://api.groq.com/openai/v1';
      if (provider === 'gemini') baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

      let defaultKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (provider === 'groq') {
        defaultKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
      } else if (provider === 'gemini') {
        defaultKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      }

      const openai = new OpenAI({
        apiKey: apiKeyOverride || defaultKey,
        baseURL: baseURL,
      });



      let modelName = 'gpt-4o-mini';
      if (provider === 'groq') modelName = 'gpt-oss-120b';
      if (provider === 'gemini') modelName = 'gemini-1.5-flash';

      // Minimal tools example, you should pass your actual tools here or from the shared folder
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: messages, // We use the complete messages array sent from the frontend!
        ...(tools && tools.length > 0 && { tools: tools }),
        ...(tools && tools.length > 0 && { tool_choice: "auto" }),
  
      });

      res.json(response);
    } catch (err: any) {
      console.error("AI Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI response" });
    }
  });







 
  // Seed Data
  await seedDatabase();
 
  return httpServer;
}
 
async function seedDatabase() {
  const existingTasks = await storage.getTasks();
  if (existingTasks.length === 0) {
    const defaultUserId = "system_seed"; // we need a dummy user id for the seed
    const t1 = await storage.createTask({
      userId: defaultUserId,
      title: "Write documentation",
      description: "Update the README and API docs",
      duration: 25,
      color: "#3b82f6",
    });
    const t2 = await storage.createTask({
      userId: defaultUserId,
      title: "Review PRs",
      description: "Check pending pull requests",
      duration: 15,
      color: "#10b981",
    });
    const t3 = await storage.createTask({
      userId: defaultUserId,
      title: "Team Meeting",
      description: "Daily standup",
      duration: 30,
      color: "#8b5cf6",
    });

    // Create a workflow
    const wf = await storage.createWorkflow({
      userId: defaultUserId,
      title: "Morning Routine",
      description: "Start the day right",
      steps: [
        { taskId: t2.id, stepType: "task", order: 1 },
        { taskId: t3.id, stepType: "task", order: 2 },
        { taskId: t1.id, stepType: "task", order: 3 },
      ],
    });

    // Create a calendar event
    await storage.createCalendarEvent({
      userId: defaultUserId,
      title: "Morning Focus",
      startTime: new Date(),
      duration: 60,
      type: "workflow",
      referenceId: wf.id, // string ID, not hardcoded 1
    });
  }
}
