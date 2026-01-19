
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow } from "@/hooks/use-workflows";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import WorkflowForm from "@/components/WorkflowForm";
import { WorkflowCard } from "@/components/WorkflowCard";
import { useState } from "react";

// --- Sortable Item Component ---


// --- Workflow Form ---


export default function WorkflowsPage() {

  // const { data: workflows, isLoading } = useWorkflows();
  const isLoading = false;


const workflows = [
    {
      id: "1",
      title: "Morning Routine",
      description: "Start the day with high energy.",
      steps: [
        { id: 1, order: 1, task: { title: "Check Emails", duration: 15 , color: "#22c55e" } },
        { id: 2, order: 2, task: { title: "Standup Meeting", duration: 10, color: "#eab308" } }
      ],
      loop: 1 // Temporary field
    },
    // Added a second one just so the grid looks nice
    {
      id: "2",
      title: "Deep Work Block",
      description: "Focus session for coding.",
      steps: [
        { id: 3, order: 1, task: { title: "Code Feature", duration: 50, color:"#E33BD2" } },
        { id: 4, order: 2, task: { title: "Rest", duration: 10, color:"#6E4AD9" } }
      ],
      loop: 4
    }
  ];
 
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);








  if (isLoading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Workflows</h1>
          <p className="text-muted-foreground">Chain tasks together for deep work sessions.</p>
        </div>
        <WorkflowForm />
      </div>




    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workflows.map((item) => (

          <WorkflowCard 
             wf={item} 
             onEdit={setEditingWorkflow} 
          />
       ))}

       {editingWorkflow && (
  <WorkflowForm 
    existingData={editingWorkflow} 

    open={!!editingWorkflow} 
    onOpenChange={(open) => {
      if (!open) setEditingWorkflow(null); 
    }}
  />
)}


      </div>







    </div>
  );
}






