import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { AppointmentCard } from "../dashboard/AppointmentCard";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  doctor: string;
  status:
    | "confirmed"
    | "pending"
    | "cancelled"
    | "completed"
    | "concluido"
    | "em_atendimento"
    | "no-show"
    | "risk-high"
    | "risk-medium"
    | "risk-low";
  phone?: string;
  duration: number;
  readOnly?: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  appointment?: Appointment;
}

interface DragScheduleProps {
  appointments: Appointment[];
  onAppointmentMove: (appointmentId: string, newTime: string) => void;
  timeSlots: TimeSlot[];
  viewMode?: "timeline" | "cards";
  onCardReorder?: (appointmentId: string, targetId: string) => void;
  onEdit?: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
  onEmptySlotClick?: (time: string) => void;
  selectedDate?: Date;
}

function SortableAppointmentCard({
  appointment,
  viewMode = "timeline",
  onEdit,
  onDelete,
  onResolveConflict,
}: {
  appointment: any;
  viewMode?: "timeline" | "cards";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResolveConflict?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: appointment.id,
    disabled: appointment.readOnly 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing h-full",
        viewMode === "timeline" ? "w-full" : "w-full",
        isDragging && "opacity-50 z-50",
      )}
    >
      <AppointmentCard
        {...appointment}
        onEdit={onEdit}
        onDelete={onDelete}
        hasConflict={appointment.hasConflict}
        conflictMinutes={appointment.conflictMinutes}
        onResolveConflict={onResolveConflict}
        className={cn(
          "w-full transition-shadow duration-200 shadow-sm hover:shadow-md",
          viewMode === "timeline" && "mb-0",
          viewMode === "cards" && "h-full min-h-[140px]",
        )}
      />
    </div>
  );
}

function DroppableTimeSlot({
  timeSlot,
  appointments = [],
  onEdit,
  onDelete,
  onResolveConflict,
  onEmptySlotClick,
  selectedDate,
}: {
  timeSlot: TimeSlot;
  appointments?: any[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResolveConflict?: (id: string) => void;
  onEmptySlotClick?: (time: string) => void;
  selectedDate?: Date;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: timeSlot.id,
  });

  // Check if slot is in the past
  const isPastSlot = (() => {
    if (!selectedDate) return false;
    const now = new Date();
    const [hours, minutes] = timeSlot.time.split(":").map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    return slotDateTime < now;
  })();

  const handleEmptySlotClick = () => {
    if (appointments.length === 0 && onEmptySlotClick && !isPastSlot) {
      onEmptySlotClick(timeSlot.time);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-3 border border-dashed border-muted/50 rounded-xl transition-all duration-200 w-full group",
        isOver && !isPastSlot && "border-primary bg-primary/5 ring-2 ring-primary/20",
        appointments.length === 0 &&
          !isPastSlot &&
          "border-muted-foreground/30 cursor-pointer hover:border-primary hover:bg-primary/5",
        appointments.length === 0 &&
          isPastSlot &&
          "border-muted/20 bg-muted/5 cursor-not-allowed opacity-50",
      )}
      onClick={handleEmptySlotClick}
    >
      <div
        className={cn(
          "flex items-center justify-between mb-3",
        )}
      >
        <div className={cn(
          "text-sm font-bold bg-muted/30 px-2 py-0.5 rounded border border-muted/50",
          isPastSlot ? "text-muted-foreground/50" : "text-primary/70",
        )}>
          {timeSlot.time}
        </div>
        {appointments.length === 0 && !isPastSlot && (
          <div className="text-[10px] text-primary/0 group-hover:text-primary transition-all font-semibold uppercase tracking-wider">
            + Agendar Horário
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3 w-full",
          appointments.length > 1 && "md:grid-cols-2",
          appointments.length > 2 && "xl:grid-cols-3",
        )}
      >
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <SortableAppointmentCard
              appointment={appointment}
              viewMode="timeline"
              onEdit={onEdit}
              onDelete={onDelete}
              onResolveConflict={onResolveConflict}
            />
          </div>
        ))}
        {appointments.length === 0 && (
          <div
            className={cn(
              "text-xs text-center py-4 w-full flex flex-col items-center justify-center gap-1",
              isPastSlot ? "text-muted-foreground/30" : "text-muted-foreground/50",
            )}
          >
            <span className="font-medium">{isPastSlot ? "Horário encerrado" : "Disponível"}</span>
            {!isPastSlot && <span className="text-[10px] opacity-70">Clique para agendar</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function DragSchedule({
  appointments,
  onAppointmentMove,
  timeSlots,
  viewMode = "timeline",
  onCardReorder,
  onEdit,
  onDelete,
  onResolveConflict,
  onEmptySlotClick,
  selectedDate,
}: DragScheduleProps & { onResolveConflict?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const appointment = appointments.find((app) => app.id === event.active.id);
    setActiveAppointment(appointment || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveAppointment(null);
      return;
    }

    if (viewMode === "cards") {
      // Modo cards: reordenar lista
      if (active.id !== over.id && onCardReorder) {
        onCardReorder(active.id as string, over.id as string);
      }
    } else {
      // Modo timeline: mover para novo horário
      if (active.id !== over.id) {
        const appointmentId = active.id as string;
        const newTimeSlot = timeSlots.find((slot) => slot.id === over.id);

        if (newTimeSlot) {
          onAppointmentMove(appointmentId, newTimeSlot.time);
        }
      }
    }

    setActiveId(null);
    setActiveAppointment(null);
  };

  // Modo Timeline: slots com agendamentos
  if (viewMode === "timeline") {
    const slotsWithAppointments = timeSlots.map((slot, index) => {
      const nextSlot = timeSlots[index + 1];
      const slotAppointments = appointments.filter((app) => {
        const appTime = app.time;
        if (!nextSlot) return appTime >= slot.time;
        return appTime >= slot.time && appTime < nextSlot.time;
      });
      return { ...slot, appointments: slotAppointments };
    });

    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <SortableContext
          items={[
            ...timeSlots.map((slot) => slot.id),
            ...appointments.map((app) => app.id),
          ]}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 w-full pb-20">
            {slotsWithAppointments.map((slot) => (
              <DroppableTimeSlot
                key={slot.id}
                timeSlot={slot}
                appointments={slot.appointments}
                onEdit={onEdit}
                onDelete={onDelete}
                onResolveConflict={onResolveConflict}
                onEmptySlotClick={onEmptySlotClick}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeAppointment && (
            <div className="w-full max-w-[350px]">
              <AppointmentCard
                {...activeAppointment}
                className="rotate-3 shadow-2xl ring-2 ring-primary border-primary/50"
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  // Modo Cards: grid de cards reorganizáveis
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext
        items={appointments.map((app) => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
          {appointments.map((appointment) => (
            <SortableAppointmentCard
              key={appointment.id}
              appointment={appointment}
              viewMode="cards"
              onEdit={onEdit}
              onDelete={onDelete}
              onResolveConflict={onResolveConflict}
            />
          ))}
          {appointments.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-muted rounded-2xl bg-muted/5">
              <p className="text-muted-foreground">Nenhum agendamento para este filtro.</p>
            </div>
          )}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeAppointment && (
          <div className="w-[300px]">
             <AppointmentCard
                {...activeAppointment}
                className="rotate-3 shadow-2xl ring-2 ring-primary border-primary/50"
              />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
