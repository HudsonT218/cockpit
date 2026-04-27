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

// ---- writes ----

export interface EventInput {
  summary: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
}

function localDateTime(date: string, time: string): string {
  // Combined "YYYY-MM-DDTHH:MM:00" — Google interprets in the timeZone field.
  return `${date}T${time}:00`;
}

function userTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function eventBody(input: EventInput) {
  const tz = userTimeZone();
  return {
    summary: input.summary,
    start: { dateTime: localDateTime(input.date, input.start), timeZone: tz },
    end: { dateTime: localDateTime(input.date, input.end), timeZone: tz },
  };
}

export async function createEvent(
  token: string,
  input: EventInput
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody(input)),
  });
  if (res.status === 401 || res.status === 403) {
    throw new GoogleCalendarAuthError();
  }
  if (!res.ok) throw new Error(`createEvent failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

export async function updateEvent(
  token: string,
  eventId: string,
  input: EventInput
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody(input)),
    }
  );
  if (res.status === 401 || res.status === 403) {
    throw new GoogleCalendarAuthError();
  }
  // 404 means event was deleted from Google directly — treat as soft success.
  if (res.status === 404) return;
  if (!res.ok) throw new Error(`updateEvent failed: ${res.status}`);
}

export async function deleteEvent(
  token: string,
  eventId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 401 || res.status === 403) {
    throw new GoogleCalendarAuthError();
  }
  if (res.status === 404 || res.status === 410) return;
  if (!res.ok) throw new Error(`deleteEvent failed: ${res.status}`);
}
