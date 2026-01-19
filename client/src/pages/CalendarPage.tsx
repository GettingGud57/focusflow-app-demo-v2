import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from "@/hooks/use-calendar";
import { useTasks } from "@/hooks/use-tasks";
import { useWorkflows } from "@/hooks/use-workflows";
import { useState } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addDays, startOfDay, addHours } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function AddEventDialog({ date, children }: { date: Date, children: React.ReactNode }) {
  const [type, setType] = useState<"task" | "workflow">("task");
  const [refId, setRefId] = useState<string>("");
  const [hour, setHour] = useState("09:00");
  const [open, setOpen] = useState(false);

  const { data: tasks } = useTasks();
  const { data: workflows } = useWorkflows();
  const create = useCreateCalendarEvent();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!refId) return;
    
    const selectedItem = type === "task" 
      ? tasks?.find(t => t.id.toString() === refId)
      : workflows?.find((w: any) => w.id.toString() === refId);
    
    if (!selectedItem) return;

    // Construct start time
    const [h, m] = hour.split(":").map(Number);
    const startTime = new Date(date);
    startTime.setHours(h, m, 0, 0);

    // Calculate duration
    const duration = type === "task" 
      ? (selectedItem as any).duration 
      : (selectedItem as any).steps.reduce((acc: number, s: any) => acc + s.task.duration, 0);

    create.mutate({
      title: selectedItem.title,
      startTime: startTime.toISOString() as any, // Zod schema handles coercion if set up, but we'll send ISO string
      duration,
      type,
      referenceId: refId,
      isCompleted: false
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Scheduled successfully" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule for {format(date, "MMM d")}</DialogTitle>
        </DialogHeader>
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

          <Button className="w-full" onClick={handleSubmit} disabled={create.isPending}>
            Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: events } = useCalendarEvents();
  const deleteEvent = useDeleteCalendarEvent();

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.20))] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Schedule</h1>
          <p className="text-muted-foreground">{format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-muted/20 border rounded-2xl overflow-hidden shadow-sm">
        {days.map((day) => {
          const dayEvents = events?.filter(e => isSameDay(e.startTime, day)).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className={cn("bg-background flex flex-col min-h-[200px]", isToday && "bg-primary/5")}>
              <div className="p-3 border-b border-muted/50 flex justify-between items-center">
                <span className={cn("text-sm font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                  {format(day, "EEE")}
                </span>
                <span className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                  isToday ? "bg-primary text-white font-bold shadow-sm" : "text-foreground"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {dayEvents?.map(event => (
                  <div 
                    key={event.id} 
                    className={cn(
                      "group relative p-2 rounded-lg text-xs border border-transparent hover:border-border transition-all cursor-default",
                      event.type === "workflow" ? "bg-indigo-50 text-indigo-900" : "bg-orange-50 text-orange-900"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{format(event.startTime, "HH:mm")}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 -mr-1 -mt-1 hover:bg-transparent text-destructive"
                        onClick={() => deleteEvent.mutate(event.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="opacity-70">{event.duration}m</div>
                  </div>
                ))}
                
                <AddEventDialog date={day}>
                  <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 dashed-border">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </AddEventDialog>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
