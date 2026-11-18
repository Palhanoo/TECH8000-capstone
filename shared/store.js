// Browser storage shared by every Signal Club app on this site. Apps on the same
// origin read and write one record, so a reading added in one app shows up in the others.
import { seedDb, DB_VERSION, PLACE_BY_ID, COUNTRIES, manualReading, uid } from "./dataset.js";

export const DB_KEY = "signal-club-shared-db";

export function loadDb() {
  try {
    const d = JSON.parse(localStorage.getItem(DB_KEY));
    if (d && d.version === DB_VERSION) return d;
  } catch { /* fall through to a fresh seed */ }
  const fresh = seedDb();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

export function resetDb() { localStorage.removeItem(DB_KEY); return loadDb(); }

// Fires when another tab or app on this site changes the shared data.
export function onDbChange(callback) {
  window.addEventListener("storage", (e) => { if (e.key === DB_KEY || e.key === null) callback(loadDb()); });
}

// Students as a flat directory (staff accounts excluded).
export function students(db) {
  return db.users.filter((u) => u.role !== "admin").map((u) => {
    const place = PLACE_BY_ID[u.placeId];
    return { id: u.id, name: u.name, city: place.city, country: COUNTRIES[place.cc].name, code: place.cc, device: u.device, campus: place.campus };
  });
}

// Every reading with its post ID, newest first.
export function readings(db) {
  return db.posts.flatMap((p) => p.readings.map((r) => ({ ...r, postId: p.id })))
    .sort((a, b) => (b.takenAt > a.takenAt ? 1 : -1));
}

// Saves a manual reading as a post so it also appears in the feed.
export function addManualReading(db, studentId, input) {
  const user = db.users.find((u) => u.id === studentId);
  const reading = manualReading(input, user);
  db.posts.unshift({ id: uid("p"), userId: user.id, createdAt: reading.takenAt, kind: "single", readings: [reading],
    likes: [], reports: [], comments: [], text: "" });
  saveDb(db);
  return reading;
}
