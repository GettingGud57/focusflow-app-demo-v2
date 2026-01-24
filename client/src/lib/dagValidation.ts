


// Simple check: would adding workflowToAdd to currentWorkflow create a cycle?
// Just checks if workflowToAdd eventually references currentWorkflowId
export function wouldCreateCycle(currentWorkflowId: string, workflowToAddId: string, workflows: Workflow[]): boolean {
  const graph = buildGraph(workflows);
  
  // Check if workflowToAdd can reach currentWorkflow
  return canReach(workflowToAddId, currentWorkflowId, graph, {});
}

function canReach(from: string, target: string, graph: { [key: string]: string[] }, visited: { [key: string]: boolean }): boolean {
  if (from === target) return true;
  if (visited[from]) return false;
  if (!graph[from]) return false;
  
  visited[from] = true;
  
  for (const child of graph[from]) {
    if (canReach(child, target, graph, visited)) {
      return true;
    }
  }
  
  return false;
}
import { Workflow } from "@/components/data/context/DataContext";

export  function dagValidation(wf: Workflow,wfs:Workflow[]): { isValid: boolean; errors: string[] } {
    
    const graph = buildGraph(wfs);

    if(hasCycle({workflowId: wf.id, graph, visited: {}, recursionStack: {}})) {
      return { isValid: false, errors: ["Workflow has cyclic dependencies."] };
    }


    return { isValid: true, errors: [] };

}





function hasCycle({workflowId, graph, visited, recursionStack}: {workflowId: string; graph: { [key: string]: string[] }; visited: { [key: string]: boolean }; recursionStack: { [key: string]: boolean }}): boolean {


  recursionStack[workflowId] = true; 
  

  for (let childId of graph[workflowId]) {
    if (recursionStack[childId]) {
       return true;

    } else if (!visited[childId]) {
      if (hasCycle({workflowId: childId, graph, visited, recursionStack})) {
        return true; 
      }
     
    }
  }
  

  recursionStack[workflowId] = false;
  visited[workflowId] = true;
  return false;
}



function buildGraph(workflows: Workflow[]): { [key: string]: string[] } {
  const graph: { [key: string]: string[] } = {};
  
  for (const workflow of workflows) {
    graph[workflow.id] = [];
    
    for (const step of workflow.steps) {
      if (step.stepType === 'workflow' && step.workflowId) {
        graph[workflow.id].push(step.workflowId);
      }
    }
  }
  
  return graph;
}
