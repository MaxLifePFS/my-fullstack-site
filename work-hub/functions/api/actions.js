// Shared action-list store backed by Cloudflare D1 (database: hub-actions).
// GET  /api/actions                 -> { actions: [...] }
// POST /api/actions {action, ...}   -> { actions: [...] } after the change
//   action "upsert": { item: {id?, title, status, priority, due, notes} }
//   action "delete": { id }

const STATUSES = ['todo', 'doing', 'hold', 'done'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function today() {
  // Calendar date in US Central Time (en-CA locale formats as YYYY-MM-DD)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
}

async function allActions(db) {
  const { results } = await db
    .prepare(
      "SELECT id, title, status, priority, due, notes, added, completedAt FROM actions " +
      "ORDER BY CASE status WHEN 'doing' THEN 0 WHEN 'todo' THEN 1 WHEN 'hold' THEN 2 ELSE 3 END, " +
      "CASE WHEN status = 'done' THEN completedAt ELSE '' END DESC, added, id"
    )
    .all();
  return results;
}

function validItem(it) {
  return it && typeof it.title === 'string' && it.title.trim().length > 0 && it.title.length <= 200 &&
    STATUSES.includes(it.status || 'todo') &&
    (it.priority === undefined || (typeof it.priority === 'string' && it.priority.length <= 20)) &&
    (it.due === undefined || it.due === '' || DATE_RE.test(it.due)) &&
    (it.notes === undefined || (typeof it.notes === 'string' && it.notes.length <= 500));
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ error: 'Database binding missing' }, 500);

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS actions (id TEXT PRIMARY KEY, title TEXT NOT NULL, " +
    "status TEXT NOT NULL DEFAULT 'todo', priority TEXT DEFAULT '', due TEXT DEFAULT '', " +
    "notes TEXT DEFAULT '', added TEXT DEFAULT '', completedAt TEXT DEFAULT '', updatedAt TEXT DEFAULT '')"
  ).run();

  if (request.method === 'GET') {
    return json({ actions: await allActions(db) });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Invalid JSON' }, 400); }

  if (body.action === 'upsert') {
    const it = body.item || {};
    if (!validItem(it)) return json({ error: 'Invalid item data' }, 400);
    const id = (typeof it.id === 'string' && it.id.length > 0 && it.id.length <= 64) ? it.id : crypto.randomUUID();
    const status = it.status || 'todo';

    const existing = await db.prepare('SELECT added, completedAt FROM actions WHERE id = ?1').bind(id).first();
    const added = existing && existing.added ? existing.added : today();
    let completedAt = '';
    if (status === 'done') {
      completedAt = existing && existing.completedAt ? existing.completedAt : today();
    }

    await db.prepare(
      "INSERT INTO actions (id, title, status, priority, due, notes, added, completedAt, updatedAt) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now')) " +
      "ON CONFLICT(id) DO UPDATE SET title = ?2, status = ?3, priority = ?4, due = ?5, notes = ?6, " +
      "completedAt = ?8, updatedAt = datetime('now')"
    ).bind(id, it.title.trim(), status, it.priority || '', it.due || '', it.notes || '', added, completedAt).run();
    return json({ actions: await allActions(db) });
  }

  if (body.action === 'delete') {
    if (typeof body.id !== 'string' || !body.id) return json({ error: 'Missing id' }, 400);
    await db.prepare('DELETE FROM actions WHERE id = ?1').bind(body.id).run();
    return json({ actions: await allActions(db) });
  }

  return json({ error: 'Unknown action' }, 400);
}
