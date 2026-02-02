
import { Workflow } from "@/components/data/context/DataContext";

export  function dagValidation(wf: Workflow, wfs: Workflow[]): { 
  isValid: boolean; 
  errors: string[];
  cyclePath?: string[]; // NEW: Return the actual cycle
} {
    
    const graph = buildGraph(wfs);
      const result = hasCycle({ workflowId: wf.id, graph, visited: {}, recursionStack: {}, path: [] });

    if (result.hasCycle && result.cyclePath) {
      return { 
        isValid: false, 
        errors: ["Workflow has cyclic dependencies."],
        cyclePath: result.cyclePath 
      };
    }


    return { isValid: true, errors: [] };

}





function hasCycle({workflowId, graph, visited, recursionStack,path}: {
  workflowId: string;
  graph: { [key: string]: string[] };
  visited: { [key: string]: boolean };
  recursionStack: { [key: string]: boolean };
  path: string[];
}): { hasCycle: boolean; cyclePath?: string[] } {


  recursionStack[workflowId] = true; 
  path.push(workflowId);
  
  if (visited[workflowId]) return { hasCycle: false };

  for (let childId of graph[workflowId]) {
    if (recursionStack[childId]) {
      const cycleStart = path.indexOf(childId);
      return { hasCycle: true, cyclePath: path.slice(cycleStart) };

    } else if (!visited[childId]) {
      const result = hasCycle({ workflowId: childId, graph, visited, recursionStack, path: [...path] });
      if (result.hasCycle) return result;
    }
  }
  

  recursionStack[workflowId] = false;
  visited[workflowId] = true;
  return { hasCycle: false };
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
