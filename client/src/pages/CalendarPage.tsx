import { useState } from "react";
import { useData, CalendarEvent} from  "@/components/data/context/DataContext";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";


import { CalendarEventCard } from "@/components/CalendarEventCard";
import { EventForm } from "@/components/EventForm";





export default function CalendarPage() {
  const { events, deleteEvent,pendingData } = useData();

  const [currentDate, setCurrentDate] = useState(new Date());

  // STATE FOR POPUP
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());


  const allEvents = [
    ...events.map(e => ({ ...e, isPending: false })),
    ...(pendingData?.events || []).map(e => ({ ...e, isPending: true }))
  ];




  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // HANDLERS
  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event); // Set data
    setIsFormOpen(true);    // Open modal
  };

  const handleCreate = (day: Date) => {
    setEditingEvent(null);  // Clear data
    setSelectedDay(day);    // Remember which column we clicked
    setIsFormOpen(true);    // Open modal
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.20))] flex flex-col">
      {/* Header Controls */}
      <div className="flex justify-between mb-8">
         <h1 className="text-3xl font-bold">Schedule</h1>
         <div className="flex gap-2">
            <Button onClick={() => setCurrentDate(d => addDays(d, -7))}><ChevronLeft/></Button>
            <Button onClick={() => setCurrentDate(d => addDays(d, 7))}><ChevronRight/></Button>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-muted/20 border rounded-2xl overflow-hidden">
        {days.map((day) => {
          const dayEvents = allEvents.filter(e => isSameDay(e.startTime, day))
                                  .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
          
          return (
            <div key={day.toISOString()} className="bg-background flex flex-col min-h-[200px]">

              <div className="p-3 border-b text-sm font-medium">
                {format(day, "EEE d")}
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">

                {dayEvents.map(event => (

                  <CalendarEventCard 
                    key={event.id} 
                    event={event} 
                    isPending={event.isPending}
                    onEdit={handleEdit}     //  Pass handler
                    onDelete={deleteEvent}  // Pass handler
                  />
                ))}
                

                <Button 
                  variant="ghost" 
                  className="w-full h-8 text-xs dashed-border"
                  onClick={() => handleCreate(day)} //  Pass form which day
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. THE FORM (Sits outside the loop!) */}
      <EventForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        existingEvent={editingEvent}
        defaultDate={selectedDay}
        events={events}
      />
    </div>
  );
}