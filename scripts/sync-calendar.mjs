/**
 * Reads a Google Calendar private iCal feed and writes availability.json.
 *
 * PRIVACY: only start/end instants are ever read from the calendar. Event
 * titles, descriptions, locations and guests are never touched, so nothing
 * identifying can leak into the published file. The output is a list of free
 * slots - it does not even say when you are busy, only when you are not.
 *
 * A slot is offered only if the WHOLE slot is free, which is what gives the
 * "must have at least half an hour" rule: a 20-minute gap between two events
 * never produces a slot.
 *
 * Usage:  GOOGLE_ICS_URL="https://..." node scripts/sync-calendar.mjs
 * A local .ics path also works in place of the URL, which is how the tests run.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ical from 'node-ical';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(readFileSync(resolve(HERE, 'calendar-config.json'), 'utf8'));
const OUT = resolve(HERE, '..', 'availability.json');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MINUTE = 60 * 1000;

/* ---------- timezone helpers -------------------------------------------- */

/** Milliseconds that `timeZone` is ahead of UTC at the given instant. */
function tzOffset(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const asUTC = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    parts.hour === '24' ? 0 : +parts.hour, +parts.minute, +parts.second,
  );
  return asUTC - date.getTime();
}

/** The UTC instant of a wall-clock time in `timeZone`. */
function zonedToUtc(y, m, d, hh, mm, timeZone) {
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let ts = naive;
  // Two passes settle the offset even across a DST boundary.
  for (let i = 0; i < 2; i++) ts = naive - tzOffset(new Date(ts), timeZone);
  return ts;
}

/** Calendar date parts for an instant, as seen in `timeZone`. */
function zonedParts(date, timeZone) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(date).reduce((acc, x) => (acc[x.type] = x.value, acc), {});
  return { year: +p.year, month: +p.month, day: +p.day };
}

/* ---------- busy intervals ---------------------------------------------- */

/**
 * Every busy interval overlapping [rangeStart, rangeEnd), including expanded
 * recurring events. Events marked free/transparent or cancelled don't block.
 */
function busyIntervals(events, rangeStart, rangeEnd) {
  const busy = [];

  const add = (start, end) => {
    const s = start.getTime(), e = end.getTime();
    if (e > rangeStart && s < rangeEnd) busy.push([s, e]);
  };

  for (const ev of Object.values(events)) {
    if (!ev || ev.type !== 'VEVENT') continue;
    if (ev.status === 'CANCELLED') continue;
    // "Free" events (Google's Show as: Free) are not a conflict.
    if (String(ev.transparency).toUpperCase() === 'TRANSPARENT') continue;
    if (!ev.start) continue;

    const durationMs = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;

    if (ev.rrule) {
      // Expand a little either side so an occurrence that starts before the
      // window but runs into it is still counted.
      const from = new Date(rangeStart - 24 * 60 * MINUTE);
      const to = new Date(rangeEnd + 24 * 60 * MINUTE);
      const skipped = new Set(
        Object.values(ev.exdate || {}).map((d) => new Date(d).toDateString() + new Date(d).getTime()),
      );
      for (const occurrence of ev.rrule.between(from, to, true)) {
        if (skipped.has(occurrence.toDateString() + occurrence.getTime())) continue;
        add(occurrence, new Date(occurrence.getTime() + durationMs));
      }
      // A moved occurrence keeps its own times.
      for (const override of Object.values(ev.recurrences || {})) {
        if (override.status === 'CANCELLED') continue;
        add(override.start, override.end || override.start);
      }
    } else {
      add(ev.start, ev.end || ev.start);
    }
  }

  return busy;
}

const overlaps = (busy, start, end) => busy.some(([s, e]) => s < end && e > start);

/* ---------- slot building ------------------------------------------------ */

function buildSlots(busy, now, timezone) {
  const { slotMinutes, minBlockMinutes, daysAhead, minNoticeHours, workingHours } = CONFIG;
  const slotMs = slotMinutes * MINUTE;
  // A slot is only offered if the unbroken free run around it is at least this
  // long, so a lone half-hour gap between two lessons is never bookable.
  const minRun = Math.max(minBlockMinutes || slotMinutes, slotMinutes);
  const minRunSlots = Math.ceil(minRun / slotMinutes);
  const earliest = now + (minNoticeHours || 0) * 60 * MINUTE;
  const all = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const dayStart = new Date(now + offset * 24 * 60 * MINUTE);
    const { year, month, day } = zonedParts(dayStart, timezone);
    // Weekday as it falls in the target timezone, not the runner's.
    const weekday = DAY_NAMES[new Date(zonedToUtc(year, month, day, 12, 0, timezone)).getUTCDay()];
    const windows = workingHours[weekday] || [];
    const slots = [];

    for (const [from, to] of windows) {
      const [fh, fm] = from.split(':').map(Number);
      const [th, tm] = to.split(':').map(Number);
      const windowStart = zonedToUtc(year, month, day, fh, fm, timezone);
      const windowEnd = zonedToUtc(year, month, day, th, tm, timezone);

      // Walk the window in whole slots, collecting unbroken runs of free ones.
      // Anything before the notice cutoff counts as unavailable, so a run can
      // never be padded out by time that is too soon to book anyway.
      let run = [];
      const flush = () => {
        if (run.length >= minRunSlots) slots.push(...run);
        run = [];
      };

      for (let s = windowStart; s + slotMs <= windowEnd; s += slotMs) {
        if (s < earliest || overlaps(busy, s, s + slotMs)) flush();
        else run.push(s);
      }
      flush();
    }

    all.push(...slots);
  }

  // Days are built in Julia's timezone but a visitor's day boundaries differ,
  // so the page regroups these; sorting keeps that grouping straightforward.
  return all.sort((a, b) => a - b);
}

/* ---------- main --------------------------------------------------------- */

async function loadCalendar(source) {
  const text = /^https?:\/\//i.test(source)
    ? await (async () => {
        const res = await fetch(source);
        if (!res.ok) throw new Error(`Calendar feed returned HTTP ${res.status}`);
        return res.text();
      })()
    : readFileSync(source, 'utf8');
  return { events: await ical.async.parseICS(text), text };
}

/**
 * The calendar's own timezone, which Google publishes as X-WR-TIMEZONE. Using
 * it means the bookable hours in the config are read in the same zone Julia
 * sees in Google, so moving country changes nothing here.
 */
function calendarTimezone(text, fallback) {
  const match = text.match(/^X-WR-TIMEZONE:(.+)$/mi);
  const zone = match && match[1].trim();
  if (!zone) return fallback;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });  // reject anything unusable
    return zone;
  } catch {
    console.warn(`Calendar reports timezone "${zone}", which this system does not know. Using ${fallback}.`);
    return fallback;
  }
}

/**
 * Two ways to point at a calendar:
 *
 *  1. GOOGLE_ICS_URL secret - the "Secret address in iCal format". The calendar
 *     stays private; only this Action can read it. Preferred, and it wins if set.
 *  2. calendarId in calendar-config.json - builds the public .ics URL. Simpler,
 *     but it only works if that calendar is shared publicly, and public means
 *     anyone can read the events in it. Only use it for a calendar that holds
 *     nothing but availability blocks.
 */
const source = process.env.GOOGLE_ICS_URL || (CONFIG.calendarId
  ? `https://calendar.google.com/calendar/ical/${encodeURIComponent(CONFIG.calendarId)}/public/basic.ics`
  : null);

if (!source) {
  console.error('No calendar configured: set the GOOGLE_ICS_URL secret, or calendarId in scripts/calendar-config.json.');
  process.exit(1);
}
console.log(process.env.GOOGLE_ICS_URL
  ? 'Reading the private calendar feed from the GOOGLE_ICS_URL secret.'
  : 'Reading the public feed for calendarId in calendar-config.json.');

const now = Date.now();
const rangeStart = now;
const rangeEnd = now + CONFIG.daysAhead * 24 * 60 * MINUTE;

const { events, text } = await loadCalendar(source);
const timezone = calendarTimezone(text, CONFIG.timezone);
const busy = busyIntervals(events, rangeStart, rangeEnd);
const slots = buildSlots(busy, now, timezone);

// Slots are published as UTC instants, not local clock times, so the page can
// show them in whatever timezone the visitor is in. The calendar's own zone
// travels along only so the page can say which one the hours were set in.
const output = {
  generated: new Date(now).toISOString(),
  timezone,
  slotMinutes: CONFIG.slotMinutes,
  slots: slots.map((t) => new Date(t).toISOString()),
};

writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n');
console.log(`Calendar timezone: ${timezone}`);
console.log(`Wrote ${slots.length} free slot(s) from ${busy.length} busy interval(s).`);
