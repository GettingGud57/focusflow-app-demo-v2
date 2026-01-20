import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Task = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  color: string;
};

export type CreateTask = Omit<Task, 'id'>;


export type WorkflowSteps = {
  id: string; // unique id for the list item
  taskId: string; // reference to the original task
  task: Task; // snapshot of the task data
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



interface DataContextType {
  tasks: Task[];
  workflows: Workflow[];
  events: CalendarEvent[];
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  // add addTask/updateTask later if needed // added
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // calendar actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleEventCompletion: (id: string) => void;
  messages: ChatMessage[]; 
  addMessage: (role: 'user' | 'ai', text: string) => void;
}

interface DataContextType {
  pendingData: PendingDataPayload | null;

  // [CLEANER] And here
  proposeChanges: (data: Partial<PendingDataPayload>) => void; // Partial lets you pass just tasks if you want
  confirmChanges: () => void;
  discardChanges: () => void;



}







const INITIAL_TASKS: Task[] =  [
       { id: "1", title: "Study React", description: "Get fuked", duration: 25, color: "#3b82f6" },
    { id: "2", title: "Fix Database", description: "Holy hell", duration: 45, color: "#ef4444" },
  { id: "3", title: "Check Emails" ,description: "Check facebook acc", duration: 50, color: "#22c55e" },
  { id: "4", title: "Standing meet up",description: "Explain why it doesnt work", duration: 10, color: "#eab308" },
   { id: "5" , title: "Code Feature",description: "Code the agentic ai", duration: 50,color:"#E33BD2" },
   { id: "6", title: "Rest",description: "Reflect on your life", duration: 10, color:"#6E4AD9" }
];



const INITIAL_WORKFLOWS: Workflow[] = [
    {
      id: "1",
      title: "Morning Routine",
      description: "Start the day with high energy.",
      steps: [
        { id: "s1", taskId: "3",order: 1,task: INITIAL_TASKS[2] },
        { id: "s2", taskId: "4", order: 2, task: INITIAL_TASKS[3] }
      ],
      loop: 1 // Temporary field
    },
   
    {
      id: "2",
      title: "Deep Work Block",
      description: "Focus session for coding.",
      steps: [
        { id: "s3", taskId: "5", order: 1, task: INITIAL_TASKS[4] },
        { id: "s4",taskId: "6", order: 2, task: INITIAL_TASKS[5] }
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

export function DataProvider({ children }: { children: ReactNode }) {
  // The "Database" lives here in State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [pendingData, setPendingData] = useState<PendingDataPayload | null>(null);

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
  const addTask = (newTask: Omit<Task, 'id'>) => {
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
    
    // Commit to real database
    if (pendingData.tasks.length > 0) setTasks(prev => [...prev, ...pendingData.tasks]);
    if (pendingData.workflows.length > 0) setWorkflows(prev => [...prev, ...pendingData.workflows]);
    if (pendingData.events.length > 0) setEvents(prev => [...prev, ...pendingData.events]);

    // Clear ghost data
    setPendingData(null);
  };

  const discardChanges = () => {
    setPendingData(null);
  };

  return (
    <DataContext.Provider value={{ 
      tasks, 
      workflows, 
      events,
      messages,
      pendingData,
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
      discardChanges


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