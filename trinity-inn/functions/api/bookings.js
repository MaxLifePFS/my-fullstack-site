// Shared room-booking store backed by Cloudflare D1 (database: trinity-bookings).
// GET  /api/bookings                      -> { bookings: [...] }
// POST /api/bookings {action, ...}        -> { bookings: [...] } after the change
//   action "upsert": { booking: {id?, guest, room, checkIn, checkOut} }
//                    409 + {conflict} if the room is already taken for those dates
//   action "delete": { id }
//   action "seed":   { bookings: [...] }  only fills an EMPTY table (first-run
//                    migration of the old per-browser localStorage data)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

async function allBookings(db) {
  const { results } = await db
    .prepare('SELECT id, guest, room, checkIn, checkOut FROM bookings ORDER BY checkIn, room')
    .all();
  return results;
}

function validBooking(b) {
  return b && typeof b.guest === 'string' && b.guest.trim().length > 0 && b.guest.length <= 80 &&
    typeof b.room === 'string' && b.room.length > 0 && b.room.length <= 40 &&
    DATE_RE.test(b.checkIn || '') && DATE_RE.test(b.checkOut || '') && b.checkOut > b.checkIn;
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ error: 'Database binding missing' }, 500);

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, guest TEXT NOT NULL, room TEXT NOT NULL, " +
    "checkIn TEXT NOT NULL, checkOut TEXT NOT NULL, updatedAt TEXT DEFAULT (datetime('now')))"
  ).run();

  if (request.method === 'GET') {
    return json({ bookings: await allBookings(db) });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Invalid JSON' }, 400); }

  if (body.action === 'upsert') {
    const b = body.booking || {};
    if (!validBooking(b)) return json({ error: 'Invalid booking data' }, 400);
    const id = (typeof b.id === 'string' && b.id.length > 0 && b.id.length <= 64) ? b.id : crypto.randomUUID();

    const clash = await db.prepare(
      'SELECT id, guest, room, checkIn, checkOut FROM bookings WHERE room = ?1 AND id != ?2 AND checkIn < ?3 AND checkOut > ?4 LIMIT 1'
    ).bind(b.room, id, b.checkOut, b.checkIn).first();
    if (clash) return json({ error: 'conflict', conflict: clash }, 409);

    await db.prepare(
      "INSERT INTO bookings (id, guest, room, checkIn, checkOut, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now')) " +
      "ON CONFLICT(id) DO UPDATE SET guest = ?2, room = ?3, checkIn = ?4, checkOut = ?5, updatedAt = datetime('now')"
    ).bind(id, b.guest.trim(), b.room, b.checkIn, b.checkOut).run();
    return json({ bookings: await allBookings(db) });
  }

  if (body.action === 'delete') {
    if (typeof body.id !== 'string' || !body.id) return json({ error: 'Missing id' }, 400);
    await db.prepare('DELETE FROM bookings WHERE id = ?1').bind(body.id).run();
    return json({ bookings: await allBookings(db) });
  }

  if (body.action === 'seed') {
    const rows = Array.isArray(body.bookings) ? body.bookings.filter(validBooking).slice(0, 500) : [];
    const { c } = await db.prepare('SELECT COUNT(*) AS c FROM bookings').first();
    if (c > 0) return json({ bookings: await allBookings(db) }); // already seeded — ignore
    if (rows.length) {
      const stmt = db.prepare('INSERT INTO bookings (id, guest, room, checkIn, checkOut) VALUES (?1, ?2, ?3, ?4, ?5)');
      await db.batch(rows.map(b => stmt.bind(
        (typeof b.id === 'string' && b.id && b.id.length <= 64) ? b.id : crypto.randomUUID(),
        b.guest.trim(), b.room, b.checkIn, b.checkOut
      )));
    }
    return json({ bookings: await allBookings(db) });
  }

  return json({ error: 'Unknown action' }, 400);
}
