// Cloudflare Pages Function: GET /api/airbnb-bookings
//
// Fetches the Airbnb iCal export feed for every room and returns the
// reserved/blocked date ranges as JSON for calendar.html.
//
// The feed URLs contain private tokens, so they are NOT in this file (the
// repo is public). They live in the AIRBNB_FEEDS environment secret on the
// trinity-ranch-inn Pages project, as a JSON object of { "Room 1": "https://
// www.airbnb.com/calendar/ical/...ics?t=...", ... }. For local wrangler dev,
// put the same value in trinity-inn/.dev.vars (gitignored).
//
// Responses are cached at the edge for 30 minutes so Airbnb is not hit on
// every page view; browsers re-check after 5 minutes.

const EDGE_TTL = 1800;   // seconds the Cloudflare edge keeps a copy
const BROWSER_TTL = 300; // seconds the visitor's browser keeps a copy

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL(context.request.url).origin + '/api/airbnb-bookings');
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let feeds = {};
  try { feeds = JSON.parse(context.env.AIRBNB_FEEDS || '{}'); } catch (e) { /* leave empty */ }

  const bookings = [];
  const errors = [];

  await Promise.all(Object.entries(feeds).map(async ([room, url]) => {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'trinity-ranch-inn-calendar/1.0' } });
      if (!r.ok) { errors.push(room + ': HTTP ' + r.status); return; }
      for (const ev of parseICS(await r.text())) {
        bookings.push({
          room,
          checkIn: ev.start,
          checkOut: ev.end, // iCal DTEND is exclusive = departure day, same as the calendar
          kind: /^reserved/i.test(ev.summary || '') ? 'reserved' : 'blocked',
          url: ev.url || null
        });
      }
    } catch (e) {
      errors.push(room + ': ' + (e && e.message ? e.message : 'fetch failed'));
    }
  }));

  const body = JSON.stringify({
    updated: new Date().toISOString(),
    rooms: Object.keys(feeds).length,
    bookings,
    errors
  });
  const res = new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=' + BROWSER_TTL + ', s-maxage=' + EDGE_TTL
    }
  });
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

// Minimal iCal parser for Airbnb feeds: all-day VEVENTs with
// DTSTART;VALUE=DATE / DTEND;VALUE=DATE and a SUMMARY of "Reserved" or
// "Airbnb (Not available)". Long lines are folded with a leading space.
function parseICS(text) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') { if (cur && cur.start && cur.end) events.push(cur); cur = null; continue; }
    if (!cur) continue;
    if (line.startsWith('DTSTART')) cur.start = icsDate(line);
    else if (line.startsWith('DTEND')) cur.end = icsDate(line);
    else if (line.startsWith('SUMMARY:')) cur.summary = line.slice(8).trim();
    else if (line.startsWith('DESCRIPTION:')) {
      const m = line.match(/Reservation URL:\s*(https?:\/\/\S+?)(\\n|$)/);
      if (m) cur.url = m[1];
    }
  }
  return events;
}

function icsDate(line) {
  const m = line.match(/:(\d{4})(\d{2})(\d{2})/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
}
