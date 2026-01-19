

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import WorkflowForm from "@/components/WorkflowForm";
import { WorkflowCard } from "@/components/WorkflowCard";
import { useState } from "react";
import { Workflow } from "@/components/data/context/DataContext";
import {useData} from "@/components/data/context/DataContext";

// --- Sortable Item Component ---


// --- Workflow Form ---


export default function WorkflowsPage() {

  // const { data: workflows, isLoading } = useWorkflows();
  const isLoading = false;


const workflows = useData().workflows;
 
const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);








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






