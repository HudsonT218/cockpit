import type { CalendarEvent } from "./types";

const API_BASE = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarAuthError extends Error {
  constructor() {
    super("Google Calendar auth expired");
    this.name = "GoogleCalendarAuthError";
  }
}

interface GoogleEvent {
  id: string;
  summary?: string;
  location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  status?: string;
}

interface ListResponse {
  items?: GoogleEvent[];
  nextPageToken?: string;
}

export async function fetchEvents(
  token: string,
  from: Date,
  to: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await fetch(
    `${API_BASE}/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 401 || res.status === 403) {
    throw new GoogleCalendarAuthError();
  }
  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status}`);
  }

  const data = (await res.json()) as ListResponse;
  return (data.items ?? [])
    .map(toCalendarEvent)
    .filter((e): e is CalendarEvent => e !== null);
}

function toCalendarEvent(g: GoogleEvent): CalendarEvent | null {
  if (g.status === "cancelled") return null;
  if (!g.start || !g.end) return null;

  if (g.start.date) {
    return {
      id: g.id,
      title: g.summary ?? "(no title)",
      date: g.start.date,
      start: "00:00",
      end: "23:59",
      location: g.location,
    };
  }

  if (!g.start.dateTime || !g.end.dateTime) return null;

  const startDt = new Date(g.start.dateTime);
  const endDt = new Date(g.end.dateTime);

  return {
    id: g.id,
    title: g.summary ?? "(no title)",
    date: formatLocalDate(startDt),
    start: formatLocalTime(startDt),
    end: formatLocalTime(endDt),
    location: g.location,
  };
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLocalTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
