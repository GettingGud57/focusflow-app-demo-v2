import { CalendarEvent, Task, Workflow } from "@/components/data/context/DataContext";

// --- HELPERS ---
const todayAt = (hours: number, minutes: number = 0) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const tomorrowAt = (hours: number, minutes: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export type MockScenario = {
  id: string;
  triggerKeyword: string; // If user types this, trigger this scenario
  userMessage: string;    // The full mock message to display in chat
  aiResponse: string;     // The AIs string response
  data: {
    newTasks?: Task[];
    newWorkflows?: Workflow[];
    newEvents?: CalendarEvent[];
  };
};

// --- SCENARIOS ---

/* 
  CASE 1: BIOLOGY STUDY (Specific Topic & Time)
  User wants to study specific material with a specific structure tomorrow night.
*/
export const SCENARIO_BIOLOGY: MockScenario = {
  id: "bio-study",
  triggerKeyword: "biology",
  userMessage: "Plan a biology study session for tomorrow from 9pm to 11pm with breaks.",
  aiResponse: "I've organized a 'Biology Intensity' workflow for you. It alternates between 25m of reading and 5m of active recall testing. I've scheduled it for tomorrow at 9 PM.",
  data: {
    newTasks: [
      { id: "bio-1", title: "Read Bio Chapter", description: "Focus on cell structures", duration: 25, color: "#10b981" },
      { id: "bio-2", title: "Active Recall Quiz", description: "Test memory without notes", duration: 5, color: "#f59e0b" },
    ],
    newWorkflows: [
      {
        id: "wf-bio",
        title: "Biology Intensity",
        description: "High-focus study session with testing intervals.",
        loop: 4, // (25+5) * 4 = 120 mins = 2 hours
        steps: [
          { id: "s-b-1", stepType: "task", taskId: "bio-1", order: 1 },
          { id: "s-b-2", stepType: "task", taskId: "bio-2", order: 2 }
        ]
      }
    ],
    newEvents: [
      {
        id: "evt-bio",
        title: "Biology Intensity",
        startTime: tomorrowAt(21, 0), // 9 PM Tomorrow
        duration: 120,
        type: "workflow",
        referenceId: "wf-bio",
        isCompleted: false
      }
    ]
  }
};

/* 
  CASE 2: MORNING RESET (Routine Building)
  User feels unorganized and acts for a generic "high energy" morning routine.
*/
export const SCENARIO_MORNING: MockScenario = {
  id: "morning-routine",
  triggerKeyword: "morning",
  userMessage: "I need a high-energy morning routine starting at 7 AM tomorrow.",
  aiResponse: "Good morning! I've built a 'Morning Charge' routine to wake up your body and mind: Hydration, Stretching, and Goal Setting. It's on your calendar for 7 AM.",
  data: {
    newTasks: [
      { id: "m-1", title: "Hydrate & Vitamins", duration: 5, color: "#3b82f6" },
      { id: "m-2", title: "Morning Yoga", duration: 15, color: "#ec4899" },
      { id: "m-3", title: "Day Planning", duration: 10, color: "#8b5cf6" },
    ],
    newWorkflows: [
      {
        id: "wf-morning",
        title: "Morning Charge",
        description: "Wake up body and mind.",
        loop: 1,
        steps: [
          { id: "st-m-1", stepType: "task", taskId: "m-1", order: 1 },
          { id: "st-m-2", stepType: "task", taskId: "m-2", order: 2 },
          { id: "st-m-3", stepType: "task", taskId: "m-3", order: 3 },
        ]
      }
    ],
    newEvents: [
      {
        id: "evt-morning",
        title: "Morning Charge",
        startTime: tomorrowAt(7, 0),
        duration: 30,
        type: "workflow",
        referenceId: "wf-morning",
        isCompleted: false
      }
    ]
  }
};

/* 
  CASE 3: DEADLINE CRUNCH (Scheduling Existing Content)
  User wants to block out time immediately using existing "Deep Work" concepts.
*/
export const SCENARIO_DEADLINE: MockScenario = {
  id: "deadline",
  triggerKeyword: "deadline",
  userMessage: "I have a deadline. Schedule a 3-hour deep work block for this afternoon.",
  aiResponse: "I've cleared your afternoon. A 3-hour 'Deep Work Block' is set for 2 PM today. Good luck!",
  data: {
    newEvents: [
      {
        id: "evt-deep",
        title: "Deep Work Block",
        startTime: todayAt(14, 0), // 2 PM Today
        duration: 180, // 3 hours
        type: "workflow",
        referenceId: "2", // References the existing "Deep Work Block" in your DataContext INITIAL_WORKFLOWS
        isCompleted: false
      }
    ]
  }
};

export const MOCK_SCENARIOS = [SCENARIO_BIOLOGY, SCENARIO_MORNING, SCENARIO_DEADLINE];