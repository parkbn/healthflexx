import ical, { VEvent } from "node-ical";

export interface CalendarEvent {
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
}

function isVEvent(component: ical.CalendarComponent): component is VEvent {
  return component.type === "VEVENT";
}

function formatEvent(event: VEvent): CalendarEvent {
  return {
    summary: event.summary || "",
    description: event.description || "",
    start: event.start?.toISOString() || "",
    end: event.end?.toISOString() || "",
    location: event.location || "",
  };
}

async function fetchAllEvents(): Promise<VEvent[]> {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!url) {
    throw new Error(
      "Missing GOOGLE_CALENDAR_ICAL_URL environment variable. " +
        "Get it from Google Calendar → Settings → your calendar → Integrate calendar → Secret address in iCal format."
    );
  }

  const data = await ical.async.fromURL(url);
  return Object.values(data).filter(isVEvent);
}

function eventInRange(event: VEvent, start: Date, end: Date): boolean {
  const eventStart = event.start ? new Date(event.start) : null;
  if (!eventStart) return false;
  return eventStart >= start && eventStart < end;
}

/**
 * List all events for today.
 */
export async function listTodaysEvents(): Promise<CalendarEvent[]> {
  const events = await fetchAllEvents();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  return events
    .filter((e) => eventInRange(e, startOfDay, endOfDay))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map(formatEvent);
}

/**
 * List events in a date range.
 */
export async function listEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const events = await fetchAllEvents();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return events
    .filter((e) => eventInRange(e, start, end))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map(formatEvent);
}

/**
 * Search events by keyword in summary, description, or location.
 */
export async function searchEvents(
  query: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  const events = await fetchAllEvents();
  const q = query.toLowerCase();

  let filtered = events.filter((e) => {
    const text = [e.summary, e.description, e.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(q);
  });

  if (startDate) {
    const start = new Date(startDate);
    filtered = filtered.filter(
      (e) => e.start && new Date(e.start) >= start
    );
  }
  if (endDate) {
    const end = new Date(endDate);
    filtered = filtered.filter(
      (e) => e.start && new Date(e.start) < end
    );
  }

  return filtered
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map(formatEvent);
}
