import { EventForm } from '@/components/events/EventForm';

export default function NewEventPage() {
  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-bold">Create Event</h1>
      <EventForm />
    </div>
  );
}
