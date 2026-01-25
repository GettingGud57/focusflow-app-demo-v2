import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';


export type Task = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  color: string;
};

export type CreateTask = Omit<Task, 'id'>;


export type WorkflowSteps = {
  id: string; // unique id for list item
  stepType: 'task' | 'workflow';
  taskId?: string; // reference to the task (when stepType is 'task')
  workflowId?: string; // reference to nested workflow (when stepType is 'workflow')
  order: number;
};

export type Workflow = {
  id: string;
  title: string;
  description?: string;
  steps: WorkflowSteps[];
  loop?: number;
};


export type CalendarEvent = {
  id: string;
  title: string;
  startTime: Date; // storing as Date object makes math easier than strings
  duration: number; // in minutes
  type: "task" | "workflow";
  referenceId: string;  // ID of task or workflow
  isCompleted: boolean;
};




export type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
};



export type PendingDataPayload = {
  tasks: Task[];
  workflows: Workflow[];
  events: CalendarEvent[];
};



export type ActiveTimer = {
  taskId: string;
  startTime: number; // Date.now()
  totalDuration: number; // in minutes
} | null;



interface DataContextType {
  tasks: Task[];
  workflows: Workflow[];
  events: CalendarEvent[];
  messages: ChatMessage[]; 
  activeTimer: ActiveTimer;
  pendingData: PendingDataPayload | null;



  getWorkflowById: (workflowId: string) => Workflow | undefined; // ADD THIS
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  flattenWorkflow: (workflowId: string) => Task[]; // ADD THIS
  // add addTask/updateTask later if needed // added
  getTaskById: (taskId: string) => Task | undefined; // Helper to look up tasks
  addTask: (task: CreateTask) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // calendar actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleEventCompletion: (id: string) => void;
  addMessage: (role: 'user' | 'ai', text: string) => void;
  startTimer: (taskId: string, duration: number) => void;
  stopTimer: () => void;
  // [CLEANER] And here
  proposeChanges: (data: Partial<PendingDataPayload>) => void; // Partial lets you pass just tasks if you want
  confirmChanges: () => void;
  discardChanges: () => void;


}







const INITIAL_TASKS: Task[] =  [
       { id: "1", title: "Study React", description: "Get fuked", duration: 25, color: "#3b82f6" },
    { id: "2", title: "Fix Database", description: "Holy hell", duration: 45, color: "#ef4444" },
  { id: "3", title: "Check Emails" ,description: "Check facebook acc", duration: 15, color: "#22c55e" },
  { id: "4", title: "Standing meet up",description: "Explain why it doesnt work", duration: 20, color: "#eab308" },
   { id: "5" , title: "Code Feature",description: "Code the agentic ai", duration: 50,color:"#E33BD2" },
   { id: "6", title: "Rest",description: "Reflect on your life", duration: 10, color:"#6E4AD9" }
];



const INITIAL_WORKFLOWS: Workflow[] = [
    {
      id: "1",
      title: "Morning Routine",
      description: "Start the day with high energy.",
      steps: [
        { id: "s1", stepType: "task", taskId: "3", order: 1 },
        { id: "s2",stepType:"task" ,taskId: "4", order: 2 }
      ],
      loop: 1
    },
   
    {
      id: "2",
      title: "Deep Work Block",
      description: "Focus session for coding.",
      steps: [
        { id: "s3",stepType:"task", taskId: "5", order: 1 },
        { id: "s4", stepType:"task",taskId: "6", order: 2 }
      ],
      loop: 4
    }]


const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "Study React",
    startTime: new Date(), // Defaults to 'today' for testing
    duration: 25,
    type: "task",
    referenceId: "1",
    isCompleted: false
  }
];



const INITIAL_MESSAGES: ChatMessage[] = [
    { 
      id: "welcome", 
      role: "ai", 
      text: "Hello! I'm your productivity architect. Try asking for a 'morning routine' or 'biology study'.", 
      timestamp: new Date() 
    }
  ];





const DataContext = createContext<DataContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage`, error);
    return fallback;
  }
};

// Migration: Add stepType to old workflow steps that don't have it
const migrateWorkflows = (workflows: Workflow[]): Workflow[] => {
  return workflows.map(wf => ({
    ...wf,
    steps: wf.steps.map(step => ({
      ...step,
      stepType: step.stepType || 'task' // Default to 'task' if missing
    }))
  }));
};
 

export function DataProvider({ children }: { children: ReactNode }) {
  // The "Database" lives here in State
  const [tasks, setTasks] = useState<Task[]>(() => 
    loadFromStorage("myApp_tasks", INITIAL_TASKS)
  );
  
  const [workflows, setWorkflows] = useState<Workflow[]>(() => 
    migrateWorkflows(loadFromStorage("myApp_workflows", INITIAL_WORKFLOWS))
  );


  const [events, setEvents] = useState<CalendarEvent[]>(() => 
    loadFromStorage("myApp_events", INITIAL_EVENTS)
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => 
    loadFromStorage("myApp_chat", INITIAL_MESSAGES) // Ensure you have INITIAL_MESSAGES defined
  );
  const [activeTimer, setActiveTimer] = useState<ActiveTimer>(() => 
    loadFromStorage("myApp_timer", null)
  );
  const [pendingData, setPendingData] = useState<PendingDataPayload | null>(null);

  // --- HELPERS ---

  // Look up a task by ID - used by components to get task data from workflow steps
  const getTaskById = (taskId: string): Task | undefined => {
    return tasks.find(t => t.id === taskId);
  };

  const getWorkflowById = (workflowId: string): Workflow | undefined => {
    return workflows.find(wf => wf.id === workflowId);
  };

  // --- ACTIONS ---

  const addWorkflow = (newWorkflow: Omit<Workflow, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9); // Fake ID
    setWorkflows(prev => [...prev, { ...newWorkflow, id }]);
  };

  const updateWorkflow = (id: string, updatedFields: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === id ? { ...wf, ...updatedFields } : wf
    ));
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(wf => wf.id !== id));
  };
  const addTask = (newTask: CreateTask) => {
    const id = Math.random().toString(36).substr(2, 9);
    setTasks(prev => [...prev, { ...newTask, id }]);
  };

  const updateTask = (id: string, updatedFields: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updatedFields } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };



  // Calendar Events
  const addEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setEvents(prev => [...prev, { ...newEvent, id }]);
  };

  const updateEvent = (id: string, updatedFields: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, ...updatedFields } : e
    ));
  }


  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const toggleEventCompletion = (id: string) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, isCompleted: !e.isCompleted } : e
    ));
  };




  const addMessage = (role: 'user' | 'ai', text: string) => {
    // 1. Generate ID
    const id = Math.random().toString(36).substr(2, 9);
    
    // 2. Add to list (For BOTH user and AI)
    setMessages(prev => [...prev, { id, role, text, timestamp: new Date() }]);
  };

  const proposeChanges = (data: { tasks?: Task[], workflows?: Workflow[], events?: CalendarEvent[] }) => {
    setPendingData({
      tasks: data.tasks || [],
      workflows: data.workflows || [],
      events: data.events || []
    });
  };

  const confirmChanges = () => {
    if (!pendingData) return;
    
    // Commit to real database - tasks MUST be added first before workflows
    // to ensure workflow steps can find their task references
    if (pendingData.tasks.length > 0) {
      setTasks(prev => [...prev, ...pendingData.tasks]);
    }
    
    // Use setTimeout to ensure tasks are committed before workflows
    setTimeout(() => {
      if (pendingData.workflows.length > 0) {
        setWorkflows(prev => [...prev, ...pendingData.workflows]);
      }
      if (pendingData.events.length > 0) {
        setEvents(prev => [...prev, ...pendingData.events]);
      }
      
      // Clear ghost data after all updates
      setPendingData(null);
    }, 0);
  };

  const discardChanges = () => {
    setPendingData(null);
  };

  const startTimer = (taskId: string, duration: number) => {
    setActiveTimer({
      taskId,
      startTime: Date.now(),
      totalDuration: duration
    });
  };

  const stopTimer = () => {
    setActiveTimer(null);
  };

  const flattenWorkflow = (workflowId: string, applyLoops: boolean = false): Task[] => {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) return [];

  const flatTasks: Task[] = [];
  const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

  for (const step of sortedSteps) {
    // Default to 'task' if stepType is missing (backwards compatibility)
    const stepType = step.stepType || 'task';
    
    if (stepType === 'task' && step.taskId) {
      const task = getTaskById(step.taskId);
      if (task) flatTasks.push(task);
    } else if (stepType === 'workflow' && step.workflowId) {
      // Nested workflows DO apply their loops
      const nestedTasks = flattenWorkflow(step.workflowId, true);
      flatTasks.push(...nestedTasks);
    }
  }

  // Only apply loops if requested (for nested workflows)
  if (applyLoops && workflow.loop && workflow.loop > 1) {
    const originalTasks = [...flatTasks];
    for (let i = 1; i < workflow.loop; i++) {
      flatTasks.push(...originalTasks);
    }
  }

  return flatTasks;
};





  useEffect(() => {
    localStorage.setItem("myApp_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("myApp_workflows", JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem("myApp_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("myApp_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("myApp_timer", JSON.stringify(activeTimer));
  }, [activeTimer]);


  return (
    <DataContext.Provider value={{ 
      tasks, 
      workflows, 
      events,
      messages,
      pendingData,
      activeTimer,
      getTaskById,
      getWorkflowById,
      addWorkflow, 
      updateWorkflow, 
      deleteWorkflow ,
      addTask,
      updateTask,
      deleteTask,
      addEvent, 
      updateEvent,
      deleteEvent, 
      toggleEventCompletion,
      addMessage,
      proposeChanges,
      confirmChanges,
      discardChanges,
      startTimer,
      stopTimer,
      flattenWorkflow


    }}>
      {children}
    </DataContext.Provider>
  );
}



export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}