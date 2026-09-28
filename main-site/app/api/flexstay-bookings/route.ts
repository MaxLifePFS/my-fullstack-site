// Shared FlexStay room-booking store backed by Cloudflare D1 (flexstay-bookings).
// GET  /api/flexstay-bookings                -> { bookings: [...] }
// POST /api/flexstay-bookings {action, ...}  -> { bookings: [...] } after the change
//   action "upsert": { booking: {id?, property, guest, room, checkIn, checkOut} }
//                    409 + {conflict} if that property's room is taken for those dates
//   action "delete": { id }
//   action "seed":   { bookings: [...] } only fills an EMPTY table (one-time
//                    migration of the old per-browser localStorage data)
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getDb(): Promise<any> {
  const { env } = getCloudflareContext();
  const db = (env as any).FLEXSTAY_DB;
  if (db) {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, property TEXT NOT NULL, guest TEXT NOT NULL, " +
          "room TEXT NOT NULL, checkIn TEXT NOT NULL, checkOut TEXT NOT NULL, updatedAt TEXT DEFAULT (datetime('now')))"
      )
      .run();
  }
  return db;
}

async function allBookings(db: any) {
  const { results } = await db
    .prepare("SELECT id, property, guest, room, checkIn, checkOut FROM bookings ORDER BY property, checkIn, room")
    .all();
  return results;
}

function validBooking(b: any): boolean {
  return (
    b &&
    typeof b.property === "string" && b.property.length > 0 && b.property.length <= 60 &&
    typeof b.guest === "string" && b.guest.trim().length > 0 && b.guest.length <= 80 &&
    typeof b.room === "string" && b.room.length > 0 && b.room.length <= 40 &&
    DATE_RE.test(b.checkIn || "") && DATE_RE.test(b.checkOut || "") && b.checkOut > b.checkIn
  );
}

export async function GET() {
  const db = await getDb();
  if (!db) return json({ error: "Database binding missing" }, 500);
  return json({ bookings: await allBookings(db) });
}

export async function POST(request: Request) {
  const db = await getDb();
  if (!db) return json({ error: "Database binding missing" }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "upsert") {
    const b = body.booking || {};
    if (!validBooking(b)) return json({ error: "Invalid booking data" }, 400);
    const id = typeof b.id === "string" && b.id.length > 0 && b.id.length <= 64 ? b.id : crypto.randomUUID();

    const clash = await db
      .prepare(
        "SELECT id, property, guest, room, checkIn, checkOut FROM bookings " +
          "WHERE property = ?1 AND room = ?2 AND id != ?3 AND checkIn < ?4 AND checkOut > ?5 LIMIT 1"
      )
      .bind(b.property, b.room, id, b.checkOut, b.checkIn)
      .first();
    if (clash) return json({ error: "conflict", conflict: clash }, 409);

    await db
      .prepare(
        "INSERT INTO bookings (id, property, guest, room, checkIn, checkOut, updatedAt) " +
          "VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now')) " +
          "ON CONFLICT(id) DO UPDATE SET property = ?2, guest = ?3, room = ?4, checkIn = ?5, checkOut = ?6, updatedAt = datetime('now')"
      )
      .bind(id, b.property, b.guest.trim(), b.room, b.checkIn, b.checkOut)
      .run();
    return json({ bookings: await allBookings(db) });
  }

  if (body.action === "delete") {
    if (typeof body.id !== "string" || !body.id) return json({ error: "Missing id" }, 400);
    await db.prepare("DELETE FROM bookings WHERE id = ?1").bind(body.id).run();
    return json({ bookings: await allBookings(db) });
  }

  if (body.action === "seed") {
    const rows = Array.isArray(body.bookings) ? body.bookings.filter(validBooking).slice(0, 500) : [];
    const row = await db.prepare("SELECT COUNT(*) AS c FROM bookings").first();
    if (row && row.c > 0) return json({ bookings: await allBookings(db) }); // already seeded — ignore
    if (rows.length) {
      const stmt = db.prepare("INSERT INTO bookings (id, property, guest, room, checkIn, checkOut) VALUES (?1, ?2, ?3, ?4, ?5, ?6)");
      await db.batch(
        rows.map((b: any) =>
          stmt.bind(
            typeof b.id === "string" && b.id && b.id.length <= 64 ? b.id : crypto.randomUUID(),
            b.property, b.guest.trim(), b.room, b.checkIn, b.checkOut
          )
        )
      );
    }
    return json({ bookings: await allBookings(db) });
  }

  return json({ error: "Unknown action" }, 400);
}
