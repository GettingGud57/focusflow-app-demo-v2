import { useState, useEffect } from "react";
import { CalendarEvent, useData } from  "@/components/data/context/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { addMinutes, areIntervalsOverlapping, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEvent?: CalendarEvent | null; // If null = Create Mode
  defaultDate?: Date; // For Create Mode (which day did they click?)
  events: CalendarEvent[];
}

export function EventForm({ open, onOpenChange, existingEvent, defaultDate, events  }: Props) {
  const { tasks, workflows, addEvent, updateEvent } = useData();
  const { toast } = useToast();

  const [type, setType] = useState<"task" | "workflow">("task");
  const [refId, setRefId] = useState<string>("");
  const [hour, setHour] = useState("09:00");

  // Load data when opening
  useEffect(() => {
    if (open) {
      if (existingEvent) {
        // EDIT MODE
        setType(existingEvent.type);
        setRefId(existingEvent.referenceId);
        setHour(format(existingEvent.startTime, "HH:mm"));
      } else {
        // CREATE MODE
        setType("task");
        setRefId("");
        setHour("09:00");
      }
    }
  }, [open, existingEvent]);

  const handleSubmit = () => {
    if (!refId) return;

    // 1. Find the Source Item (Task or Workflow)
    const selectedItem = type === "task" 
      ? tasks.find(t => t.id === refId)
      : workflows.find(w => w.id === refId);
    
    if (!selectedItem) return;

    // 2. Calculate details
    const duration = type === "task" 
      ? (selectedItem as any).duration 
      : (selectedItem as any).steps.reduce((acc: number, s: any) => acc + s.task.duration, 0);

    const [h, m] = hour.split(":").map(Number);
    // If editing, keep original date, else use defaultDate
    const baseDate = existingEvent ? existingEvent.startTime : (defaultDate || new Date());
    const startTime = new Date(baseDate);

    startTime.setHours(h, m, 0, 0);

    const payload = {
      title: selectedItem.title,
      startTime,
      duration,
      type,
      referenceId: refId,
      isCompleted: existingEvent ? existingEvent.isCompleted : false
    };


    const hasConflict = (events?? []).some((ev) => {
    // Skip if comparing against itself (not needed for creation, but good practice)
        if (existingEvent && ev.id === existingEvent.id) {
        return false; 
      }

    const existingEnd = addMinutes(ev.startTime, ev.duration);
   
    return areIntervalsOverlapping(
      { start: startTime, end: addMinutes(startTime, duration) },
      { start: ev.startTime, end: existingEnd }
    );
  });





    // 3. Save Logic
    if (hasConflict) {
    toast({ 
      title: "Schedule Conflict!", 
      description: "You already have something planned for this time.",
      variant: "destructive" // Make it red
    });
    return; // STOP HERE
  }

    if (existingEvent) {
      updateEvent(existingEvent.id, payload);
      toast({ title: "Event updated" });
    } else {
      addEvent(payload);
      toast({ title: "Event scheduled" });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingEvent ? "Edit Event" : "Schedule Event"}
          </DialogTitle>
        </DialogHeader>
        
        {/* ... Same Form Inputs as before ... */}
        <div className="space-y-4 py-4">
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Time</Label>
               <Select value={hour} onValueChange={setHour}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   {Array.from({ length: 14 }).map((_, i) => {
                     const h = i + 6; // 6am to 8pm
                     const time = `${h.toString().padStart(2, '0')}:00`;
                     return <SelectItem key={time} value={time}>{time}</SelectItem>
                   })}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Single Task</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



        <div className="space-y-2">
            <Label>Item</Label>
            <Select value={refId} onValueChange={setRefId}>
              <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
              <SelectContent>
                {type === "task" ? (
                  tasks?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.title} ({t.duration}m)</SelectItem>)
                ) : (
                  workflows?.map((w: any) => <SelectItem key={w.id} value={w.id.toString()}>{w.title}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>

          
            
             
             <Button className="w-full" onClick={handleSubmit}>
                {existingEvent ? "Save Changes" : "Schedule"}
             </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}