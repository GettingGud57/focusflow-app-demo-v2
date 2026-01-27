
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
  
  if (visited[workflowId]) return false;

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
