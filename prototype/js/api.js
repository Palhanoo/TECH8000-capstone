// Mock backend. Every call is async with a small delay so the UI is written the way it
// would be against a real API. Data lives in localStorage; swap this file for fetch()
// calls to a real server and the views don't need to change.

const DB_KEY = "gdds-signal-db-v2";
const SESSION_KEY = "gdds-signal-session-v2";
const MONASH_EMAIL = /^[^\s@]+@(student\.)?monash\.edu$/i;

class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

let db = loadDb();
function loadDb() {
  try {
    const d = JSON.parse(localStorage.getItem(DB_KEY));
    if (d && d.version === 2) return d;
  } catch { /* fall through to a fresh seed */ }
  const fresh = seedDb();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}
const persist = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
const wait = (ms = 120 + Math.random() * 220) => new Promise((r) => setTimeout(r, ms));

// Demo-grade password hashing. A real server would use bcrypt/argon2 and Monash SSO.
async function hashPassword(email, password) {
  const input = email.toLowerCase() + ":" + password;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "weak:" + hashStr(input);
}
async function passwordMatches(user, password) {
  if (user.passHash?.startsWith("demo:")) return user.passHash === "demo:" + password;
  return user.passHash === (await hashPassword(user.email, password));
}

const pseudonym = (id) => "Contributor " + (hashStr(id) % 65536).toString(16).toUpperCase().padStart(4, "0");
const userById = (id) => db.users.find((u) => u.id === id);
function publicUser(u) {
  if (!u) return { id: null, display: "Deleted account", initial: "?", place: null };
  const display = u.settings.showName ? u.name : pseudonym(u.id);
  return { id: u.id, display, initial: u.settings.showName ? u.name[0] : "#", place: PLACE_BY_ID[u.placeId] };
}
function currentUser() { return userById(localStorage.getItem(SESSION_KEY)) || null; }
function requireUser() {
  const u = currentUser();
  if (!u) throw new ApiError("Please sign in again.", "unauthenticated");
  return u;
}
function decoratePost(p, me) {
  return {
    ...p, author: publicUser(userById(p.userId)), mine: !!me && p.userId === me.id,
    liked: !!me && p.likes.includes(me.id), likeCount: p.likes.length,
    comments: p.comments.map((c) => ({ ...c, author: publicUser(userById(c.userId)) })),
  };
}
function postRegion(p) { return COUNTRIES[PLACES.find((x) => x.city === p.readings[0].city)?.cc]?.region; }

const api = {
  /* ---------- auth ---------- */
  session: currentUser,
  publicUser,
  contributor: (id) => publicUser(userById(id)),

  async register({ name, email, password, placeId, device, coarse, showName, consent }) {
    await wait();
    email = email.trim().toLowerCase();
    if (!name.trim()) throw new ApiError("Please enter your name.", "name");
    if (!MONASH_EMAIL.test(email)) throw new ApiError("Use your Monash email (@student.monash.edu or @monash.edu).", "email");
    if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) throw new ApiError("Password needs at least 8 characters, with letters and numbers.", "password");
    if (!consent) throw new ApiError("You need to agree to the data sharing terms to contribute.", "consent");
    if (db.users.some((u) => u.email === email)) throw new ApiError("An account with this email already exists. Try signing in.", "email");
    const code = String(100000 + Math.floor(Math.random() * 900000));
    db.users.push({
      id: uid("u"), name: name.trim(), email, passHash: await hashPassword(email, password), placeId, device,
      verified: false, verifyCode: code, settings: { coarse, showName }, consentVersion: CONSENT_VERSION, joinedAt: new Date().toISOString(),
    });
    persist();
    return { email, code };
  },

  // There is no mail server in the prototype, so the "inbox" reads the code back.
  demoInbox(email) { return db.users.find((u) => u.email === email)?.verifyCode || null; },

  async resendCode(email) {
    await wait();
    const u = db.users.find((x) => x.email === email);
    if (!u) throw new ApiError("We couldn't find that account.");
    u.verifyCode = String(100000 + Math.floor(Math.random() * 900000)); persist();
  },

  async verify(email, code) {
    await wait();
    const u = db.users.find((x) => x.email === email);
    if (!u) throw new ApiError("We couldn't find that account.");
    if (u.verifyCode !== code.trim()) throw new ApiError("That code doesn't match. Check the email and try again.");
    u.verified = true; delete u.verifyCode; persist();
    localStorage.setItem(SESSION_KEY, u.id);
    return u;
  },

  async login(email, password) {
    await wait();
    const u = db.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u || !u.passHash || !(await passwordMatches(u, password))) throw new ApiError("Email or password is incorrect.");
    if (!u.verified) throw new ApiError("Please verify your email first.", "unverified");
    localStorage.setItem(SESSION_KEY, u.id);
    return u;
  },

  // Stand-in for Monash single sign-on: signs in as the demo account.
  async monashSso() { await wait(600); localStorage.setItem(SESSION_KEY, "u_demo"); return userById("u_demo"); },

  logout() { localStorage.removeItem(SESSION_KEY); },

  /* ---------- posts ---------- */
  async feed({ region = "", campusOnly = false, offset = 0, limit = 15 } = {}) {
    await wait();
    const me = currentUser();
    const all = db.posts.filter((p) => !p.reports.includes(me?.id))
      .filter((p) => (!region || postRegion(p) === region) && (!campusOnly || p.readings[0].campus));
    return { items: all.slice(offset, offset + limit).map((p) => decoratePost(p, me)), total: all.length };
  },

  async post(id) {
    await wait();
    const p = db.posts.find((x) => x.id === id);
    if (!p) throw new ApiError("This post was removed.", "not_found");
    return decoratePost(p, currentUser());
  },

  async createPost({ text, kind, readings }) {
    await wait(400);
    const me = requireUser();
    if (!readings.length) throw new ApiError("Take a reading first.");
    const p = { id: uid("p"), userId: me.id, createdAt: new Date().toISOString(), kind, readings, likes: [], reports: [], comments: [], text: text.trim().slice(0, 280) };
    db.posts.unshift(p); persist();
    return decoratePost(p, me);
  },

  async deletePost(id) {
    await wait();
    const me = requireUser();
    const i = db.posts.findIndex((p) => p.id === id && p.userId === me.id);
    if (i < 0) throw new ApiError("You can only delete your own posts.");
    db.posts.splice(i, 1); persist();
  },

  async toggleLike(id) {
    const me = requireUser(), p = db.posts.find((x) => x.id === id);
    const i = p.likes.indexOf(me.id);
    i < 0 ? p.likes.push(me.id) : p.likes.splice(i, 1);
    persist(); await wait(60);
    return { liked: i < 0, likeCount: p.likes.length };
  },

  async addComment(id, text) {
    await wait();
    const me = requireUser(), p = db.posts.find((x) => x.id === id);
    text = text.trim();
    if (!text) throw new ApiError("Write something first.");
    p.comments.push({ id: uid("c"), userId: me.id, text: text.slice(0, 300), at: new Date().toISOString() });
    persist();
  },

  async report(id, reason) {
    await wait();
    const me = requireUser(), p = db.posts.find((x) => x.id === id);
    if (!p.reports.includes(me.id)) p.reports.push(me.id);
    p.reportReasons = [...(p.reportReasons || []), reason];
    persist();
  },

  /* ---------- dataset ---------- */
  // Flattened readings with their post and author, for the map and insights.
  readings({ region = "", tech = "" } = {}) {
    const out = [];
    for (const p of db.posts) {
      const reg = postRegion(p);
      if (region && reg !== region) continue;
      for (const r of p.readings) if (!tech || r.tech === tech) out.push({ ...r, postId: p.id, region: reg, kind: p.kind });
    }
    return out;
  },

  /* ---------- account ---------- */
  async updateMe(patch) {
    await wait();
    const me = requireUser();
    if (patch.settings) Object.assign(me.settings, patch.settings);
    for (const k of ["name", "placeId", "device"]) if (patch[k]) me[k] = patch[k];
    persist();
    return me;
  },

  async exportMine() {
    await wait();
    const me = requireUser();
    const { passHash, verifyCode, ...profile } = me;
    return { exportedAt: new Date().toISOString(), profile, posts: db.posts.filter((p) => p.userId === me.id), comments: db.posts.flatMap((p) => p.comments.filter((c) => c.userId === me.id).map((c) => ({ postId: p.id, ...c }))) };
  },

  async deleteMyReadings() {
    await wait();
    const me = requireUser();
    const before = db.posts.length;
    db.posts = db.posts.filter((p) => p.userId !== me.id);
    persist();
    return before - db.posts.length;
  },

  async deleteAccount() {
    await wait();
    const me = requireUser();
    db.posts = db.posts.filter((p) => p.userId !== me.id);
    for (const p of db.posts) { p.comments = p.comments.filter((c) => c.userId !== me.id); p.likes = p.likes.filter((x) => x !== me.id); }
    db.users = db.users.filter((u) => u.id !== me.id);
    persist(); this.logout();
  },

  resetDemo() { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESSION_KEY); db = loadDb(); },
};
