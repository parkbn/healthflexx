import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

function getCalendarClient(auth: OAuth2Client): calendar_v3.Calendar {
  return google.calendar({ version: "v3", auth });
}

export interface CalendarEvent {
  id: string | null | undefined;
  summary: string | null | undefined;
  description: string | null | undefined;
  start: string | null | undefined;
  end: string | null | undefined;
  location: string | null | undefined;
  status: string | null | undefined;
  htmlLink: string | null | undefined;
  attendees: { email: string; responseStatus?: string }[];
}

function formatEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  return {
    id: event.id,
    summary: event.summary,
    description: event.description,
    start: event.start?.dateTime || event.start?.date || null,
    end: event.end?.dateTime || event.end?.date || null,
    location: event.location,
    status: event.status,
    htmlLink: event.htmlLink,
    attendees:
      event.attendees?.map((a) => ({
        email: a.email || "",
        responseStatus: a.responseStatus || undefined,
      })) || [],
  };
}

/**
 * List all events for today on the primary calendar.
 */
export async function listTodaysEvents(
  auth: OAuth2Client
): Promise<CalendarEvent[]> {
  const cal = getCalendarClient(auth);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items || []).map(formatEvent);
}

/**
 * List events in a date range on the primary calendar.
 */
export async function listEvents(
  auth: OAuth2Client,
  timeMin: string,
  timeMax: string,
  maxResults?: number
): Promise<CalendarEvent[]> {
  const cal = getCalendarClient(auth);

  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: new Date(timeMin).toISOString(),
    timeMax: new Date(timeMax).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: maxResults || 50,
  });

  return (res.data.items || []).map(formatEvent);
}

/**
 * Search events by keyword on the primary calendar.
 */
export async function searchEvents(
  auth: OAuth2Client,
  query: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  const cal = getCalendarClient(auth);

  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId: "primary",
    q: query,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 25,
  };

  if (timeMin) params.timeMin = new Date(timeMin).toISOString();
  if (timeMax) params.timeMax = new Date(timeMax).toISOString();

  // Default to upcoming events if no time range specified
  if (!timeMin && !timeMax) {
    params.timeMin = new Date().toISOString();
  }

  const res = await cal.events.list(params);
  return (res.data.items || []).map(formatEvent);
}

/**
 * Create a new event on the primary calendar.
 */
export async function createEvent(
  auth: OAuth2Client,
  event: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    attendees?: string[];
  }
): Promise<CalendarEvent> {
  const cal = getCalendarClient(auth);

  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: new Date(event.startDateTime).toISOString() },
      end: { dateTime: new Date(event.endDateTime).toISOString() },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  });

  return formatEvent(res.data);
}
