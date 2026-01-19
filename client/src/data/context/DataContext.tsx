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



interface DataContextType {
  tasks: Task[];
  workflows: Workflow[];
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  // add addTask/updateTask later if needed // added
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
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

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // The "Database" lives here in State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);

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







  return (
    <DataContext.Provider value={{ 
      tasks, 
      workflows, 
      addWorkflow, 
      updateWorkflow, 
      deleteWorkflow ,
        addTask: addTask,
        updateTask: updateTask,
        deleteTask: deleteTask
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