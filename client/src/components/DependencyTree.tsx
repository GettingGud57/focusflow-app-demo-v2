

import { Workflow } from "@/components/data/context/DataContext";
import { AlertCircle, ArrowRight } from "lucide-react";

export function DependencyTree({ 
  cyclePath, 
  allWorkflows 
}: { 
  cyclePath: string[];
  allWorkflows: Workflow[];
}) {
  // Map IDs to workflow names
  const cycleNames = cyclePath.map(id => {
    const wf = allWorkflows.find(w => w.id === id);
    return wf?.title || id;
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        Circular Dependency Detected
      </div>
      <div className="flex items-center gap-1 flex-wrap text-xs">
        {cycleNames.map((name, i) => (                              // Display the cycle path with arrows
          <span key={i} className="flex items-center gap-1">
            <span className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded font-medium">
              {name}
            </span>
            {i < cycleNames.length - 1 && <ArrowRight className="w-3 h-3 text-red-400" />}
          </span>
        ))}
        <ArrowRight className="w-3 h-3 text-red-400" />
        <span className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded font-medium">
          {cycleNames[0]} ⟲
        </span>
      </div>
    </div>
  );
}