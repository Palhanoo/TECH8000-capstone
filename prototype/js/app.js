/* =========================================================================
   Signal Club: views and routing. Hash routes, e.g. #/feed, #/post/<id>.
   ========================================================================= */

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const view = $("#view");
const hasLeaflet = () => typeof L !== "undefined";
const AV_COLOURS = ["#2f9e6e", "#3f6fd8", "#c8553d", "#8a5cc4", "#c99312", "#1f8a9e", "#b04a7a", "#5a7a2e"];
const colourFor = (s) => AV_COLOURS[hashStr(s || "?") % AV_COLOURS.length];
const CC_BY_NAME = Object.fromEntries(Object.entries(COUNTRIES).map(([cc, c]) => [c.name, cc]));
const QCOLOUR = { good: "#2f9e6e", fair: "#d9a21b", poor: "#d9644a" };
const PENDING_EMAIL = "gdds-pending-email";

const ICON = {
  heart: '<svg class="i" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>',
  chat: '<svg class="i" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  dots: '<svg class="i" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
  walk: '<svg class="i" viewBox="0 0 24 24" style="width:15px;height:15px"><path d="M4 19c4-1 5-6 8-8s6-1 8-5"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="6" r="1.5"/></svg>',
};

/* ---------- small helpers ---------- */
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2000);
}
function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4);
  return m < 1 ? "just now" : m < 60 ? m + "m" : m < 1440 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d";
}
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const groupBy = (xs, f) => xs.reduce((m, x) => ((m[f(x)] ||= []).push(x), m), {});
// Signal on one comparable scale (RSRP / SS-RSRP). 3G RSSI is a different measure, so it's left out of aggregates.
const sig = (m) => (m.tech === "3G" ? null : headline(m).value);
function qualityOfValue(v) { return v > -80 ? "good" : v >= -100 ? "fair" : "poor"; }
function km(a, b) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const walkKm = (rs) => rs.slice(1).reduce((d, r, i) => d + km(rs[i], r), 0);
const distance = (rs) => { const k = walkKm(rs); return k < 1 ? Math.round(k * 1000) + " m" : k.toFixed(1) + " km"; };
function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function busy(btn, label, fn) {
  const old = btn.innerHTML; btn.disabled = true; btn.textContent = label;
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; }
}
function avatar(author, cls = "") {
  return `<div class="avatar ${cls}" style="background:${colourFor(author.display)}">${esc(author.initial)}</div>`;
}
function spark(values, w = 80, h = 28) {
  const vs = values.filter((v) => v != null);
  if (vs.length < 2) return "";
  const lo = Math.min(...vs) - 2, hi = Math.max(...vs) + 2;
  const pts = vs.map((v, i) => `${((i / (vs.length - 1)) * w).toFixed(1)},${(h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#224a40" stroke-width="1.8"/></svg>`;
}
function placeOptions(selected) {
  const byCc = groupBy(PLACES, (p) => p.cc);
  return Object.entries(byCc).map(([cc, ps]) => `<optgroup label="${esc(COUNTRIES[cc].name)}">${ps.map((p) =>
    `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${esc(p.city)}${p.campus ? " · " + esc(p.campus) : ""}</option>`).join("")}</optgroup>`).join("");
}
function deviceOptions(selected) {
  return DEVICES.map((d) => `<option value="${esc(d.model)}" ${d.model === selected ? "selected" : ""}>${esc(d.model)}${d.ios ? " (browse only)" : ` · ${esc(d.os)}`}</option>`).join("");
}
function addTiles(map) {
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
  }).addTo(map);
}

/* ---------- formatting one field value ---------- */
const SHOW_UNIT = new Set(["dBm", "dB", "m", "m/s", "Mbps", "ms", "%", "degrees"]);
function formatValue(f, m, mine) {
  const v = m[f.key];
  if (f.privacy === "restricted" && !mine) return { text: MISSING.withheld, na: true };
  if (v == null || v === "") return { text: MISSING[m.na?.[f.key]] || "Not recorded", na: true };
  if (typeof v === "boolean") return { text: v ? "Yes" : "No" };
  if (f.key === "takenAt") return { text: new Date(v).toLocaleString(undefined, { timeZone: m.tz, dateStyle: "medium", timeStyle: "short" }) + " local" };
  if (f.key === "environment") return { text: v[0].toUpperCase() + v.slice(1) };
  if (f.key === "contributor") return { text: api.contributor(v).display };
  if (f.key === "neighbours") return { text: v.split("|").map((x) => x.replace(":", " @ ") + " dBm").join(", ") };
  return { text: String(v) + (f.unit && SHOW_UNIT.has(f.unit) ? " " + f.unit : "") };
}
function fieldTables(m, mine) {
  return FIELD_GROUPS.map((g) => `<div class="card"><h3>${esc(g)}</h3><table class="fields">${FIELDS.filter((f) => f.group === g).map((f) => {
    const { text, na } = formatValue(f, m, mine);
    return `<tr><th>${esc(f.label)}</th><td class="${na ? "na" : ""}">${esc(text)}</td></tr>`;
  }).join("")}</table></div>`).join("");
}
function coverageCounts(m) {
  const reasons = Object.values(m.na || {});
  const count = (r) => reasons.filter((x) => x === r).length;
  return { captured: FIELDS.length - reasons.length, unsupported: count("unsupported"), notApplicable: count("not_applicable"), notRun: count("not_run") };
}
function coverageLine(m) {
  const c = coverageCounts(m);
  return `<div class="coverage-line"><span class="ok">${c.captured} of ${FIELDS.length} fields captured</span>
    ${c.unsupported ? `<span class="no">${c.unsupported} not reported by this phone</span>` : ""}
    ${c.notApplicable ? `<span class="nil">${c.notApplicable} not applicable</span>` : ""}
    ${c.notRun ? `<span class="nil">${c.notRun} need a speed test</span>` : ""}</div>`;
}

/* =========================================================================
   Router
   ========================================================================= */
const PUBLIC_ROUTES = ["login", "register", "verify", "data"];
const AUTH_ROUTES = ["login", "register", "verify"];
const TITLES = { login: "Sign in", register: "Create account", verify: "Verify your email", feed: "Signal Club", map: "Coverage map",
  record: "Record", insights: "Insights", me: "Your account", post: "Post", data: "Data dictionary" };
let teardown = [];
// Each navigation bumps this. A slow response for a page we've already left is dropped.
let routeSeq = 0;
const isStale = (seq) => seq !== routeSeq;
const onLeave = (fn) => teardown.push(fn);
const go = (path) => { location.hash = "#/" + path; };

async function router() {
  teardown.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  teardown = [];
  const seq = ++routeSeq;
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const name = ROUTES[parts[0]] ? parts[0] : "feed";
  const user = api.session();
  if (!user && !PUBLIC_ROUTES.includes(name)) return go("login");
  if (user && AUTH_ROUTES.includes(name)) return go("feed");

  $("#title").textContent = TITLES[name];
  $("#back").hidden = !["post", "data"].includes(name);
  $("#tabs").hidden = !user;
  $("#me-badge").hidden = !user;
  if (user) {
    const me = api.publicUser(user);
    $("#me-badge").textContent = me.initial;
    $("#me-badge").style.background = colourFor(me.display);
    $("#me-badge").style.color = "#fff";
  }
  document.querySelectorAll("#tabs a").forEach((a) => (a.dataset.tab === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));

  view.scrollTop = 0;
  view.innerHTML = `<div class="spinner">Loading...</div>`;
  try {
    await ROUTES[name](parts[1], user);
  } catch (e) {
    if (isStale(seq)) return;
    if (e.code === "unauthenticated") return go("login");
    view.innerHTML = `<div class="empty">${esc(e.message)}<br><br><a href="#/feed">Back to the feed</a></div>`;
  }
}
$("#back").addEventListener("click", () => (history.length > 1 ? history.back() : go(api.session() ? "feed" : "login")));

/* =========================================================================
   Auth
   ========================================================================= */
function viewLogin() {
  view.innerHTML = `<div class="auth">
    <div class="hero"><h2>Signal Club</h2>
      <p>Monash data science students around the world, measuring mobile networks together and investigating the shared data.</p></div>
    <button class="btn" id="sso">Continue with Monash</button>
    <div class="or">or sign in with email</div>
    <form id="f" novalidate>
      <div class="error" id="err" role="alert"></div>
      <label class="field">Monash email<input name="email" type="email" autocomplete="email" required /></label>
      <label class="field">Password<input name="password" type="password" autocomplete="current-password" required /></label>
      <button class="btn">Sign in</button>
    </form>
    <p class="small" style="margin-top:1rem;text-align:center">New here? <a href="#/register">Create an account</a></p>
    <div class="demo-box">Prototype demo account<br><b>demo@student.monash.edu</b> / <b>monash123</b>
      <button class="btn ghost" id="fill" style="margin-top:.6rem;padding:.5rem">Fill it in</button></div>
    <p class="note">Prototype only: "Continue with Monash" signs in as the demo account, and all data stays in this browser. <a href="#/data">See what we collect</a>.</p>
  </div>`;
  const f = $("#f");
  $("#fill").onclick = () => { f.email.value = "demo@student.monash.edu"; f.password.value = "monash123"; };
  $("#sso").onclick = (e) => busy(e.currentTarget, "Redirecting to Monash...", async () => { await api.monashSso(); go("feed"); });
  f.onsubmit = (e) => {
    e.preventDefault();
    busy(f.querySelector("button"), "Signing in...", async () => {
      try { await api.login(f.email.value, f.password.value); go("feed"); }
      catch (err) {
        if (err.code === "unverified") { sessionStorage.setItem(PENDING_EMAIL, f.email.value.trim().toLowerCase()); return go("verify"); }
        $("#err").textContent = err.message;
      }
    });
  };
}

function viewRegister() {
  view.innerHTML = `<div class="auth">
    <h2>Join Signal Club</h2>
    <p class="lead">For Monash students and staff. Takes a minute.</p>
    <form id="f" novalidate>
      <div class="error" id="err" role="alert"></div>
      <label class="field">Full name<input name="name" autocomplete="name" maxlength="40" required /></label>
      <label class="field">Monash email<input name="email" type="email" autocomplete="email" required />
        <span class="hint">@student.monash.edu or @monash.edu</span></label>
      <label class="field">Password<input name="password" type="password" autocomplete="new-password" required />
        <span class="hint">At least 8 characters, with letters and numbers.</span></label>
      <label class="field">Where do you usually study from?<select name="place">${placeOptions("clayton")}</select>
        <span class="hint">Online students anywhere in the world are welcome. Pick the closest city.</span></label>
      <label class="field">Your phone<select name="device">${deviceOptions("Google Pixel 8")}</select>
        <span class="hint">Recording needs Android. iPhones don't expose signal data, but you can still browse and analyse.</span></label>
      <div class="card" style="margin-top:.4rem">
        <h3>Privacy</h3>
        <label class="check"><input type="checkbox" name="coarse" checked /> Round my location to about 1 km (recommended)</label>
        <label class="check"><input type="checkbox" name="showName" checked /> Show my name on posts. Untick to appear as a pseudonym.</label>
        <label class="check"><input type="checkbox" name="consent" /><span>I agree to share anonymised readings with the Monash GDDS cohort for teaching and research.
          We never collect phone numbers, IMEI or IMSI. <a href="#/data">What's collected</a></span></label>
      </div>
      <button class="btn">Create account</button>
    </form>
    <p class="small" style="margin-top:1rem;text-align:center">Already have an account? <a href="#/login">Sign in</a></p>
  </div>`;
  const f = $("#f");
  f.onsubmit = (e) => {
    e.preventDefault();
    busy(f.querySelector("button:last-of-type"), "Creating account...", async () => {
      try {
        const { email } = await api.register({ name: f.name.value, email: f.email.value, password: f.password.value, placeId: f.place.value,
          device: f.device.value, coarse: f.coarse.checked, showName: f.showName.checked, consent: f.consent.checked });
        sessionStorage.setItem(PENDING_EMAIL, email);
        go("verify");
      } catch (err) { $("#err").textContent = err.message; view.scrollTop = 0; }
    });
  };
}

function viewVerify() {
  const email = sessionStorage.getItem(PENDING_EMAIL);
  if (!email) return go("register");
  const inbox = () => `Demo inbox for ${esc(email)}: your code is <b>${esc(api.demoInbox(email) || "------")}</b>`;
  view.innerHTML = `<div class="auth">
    <h2>Check your email</h2>
    <p class="lead">We sent a 6-digit code to <b>${esc(email)}</b>. Enter it to finish creating your account.</p>
    <form id="f" novalidate>
      <div class="error" id="err" role="alert"></div>
      <label class="field">Verification code<input name="code" class="code-input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required /></label>
      <button class="btn">Verify and continue</button>
    </form>
    <button class="btn ghost" id="resend" style="margin-top:.55rem">Send a new code</button>
    <div class="demo-box" id="inbox">${inbox()}</div>
    <p class="note">The prototype has no mail server, so the code is shown here.</p>
  </div>`;
  const f = $("#f");
  f.onsubmit = (e) => {
    e.preventDefault();
    busy(f.querySelector("button"), "Verifying...", async () => {
      try { await api.verify(email, f.code.value); sessionStorage.removeItem(PENDING_EMAIL); toast("Welcome to Signal Club"); go("record"); }
      catch (err) { $("#err").textContent = err.message; }
    });
  };
  $("#resend").onclick = (e) => busy(e.currentTarget, "Sending...", async () => { await api.resendCode(email); $("#inbox").innerHTML = inbox(); toast("New code sent"); });
}

/* =========================================================================
   Feed
   ========================================================================= */
const feedState = { region: "", campusOnly: false };

function readingSummary(p) {
  const r = p.readings, first = r[0];
  if (p.kind === "walk") {
    const vals = r.map(sig).filter((v) => v != null), avg = vals.length ? Math.round(vals.reduce((a, b) => a + b) / vals.length) : null;
    return `<a class="reading" href="#/post/${p.id}">
      <div class="db">${avg ?? "--"}<small>avg dBm</small></div>
      ${avg != null ? `<span class="pill ${qualityOfValue(avg)}">${qualityOfValue(avg)}</span>` : ""}
      ${spark(r.map(sig))}
      <div class="tags">${ICON.walk} Walk · ${r.length} readings<br>${distance(r)} · ${esc(first.carrier)}</div></a>`;
  }
  const h = headline(first), q = quality(first);
  return `<a class="reading" href="#/post/${p.id}">
    <div class="db">${h.value}<small>${h.label} dBm</small></div>
    <span class="pill ${q}">${q}</span>
    <div class="tags">${esc(first.carrier)} · ${esc(first.tech)}<br>${first.down != null ? `${first.down} Mbps down` : esc(first.environment)}</div></a>`;
}

function postCard(p) {
  const r = p.readings[0];
  return `<article class="post" data-id="${p.id}">
    <div class="post-head">${avatar(p.author)}
      <div class="who"><div class="name">${esc(p.author.display)}</div>
        <div class="where">${r.spot ? esc(r.spot) + ", " : ""}${esc(r.city)} · ${ago(p.createdAt)}${r.campus ? `<span class="campus-tag">Monash</span>` : ""}</div></div>
    </div>
    ${p.text ? `<p class="post-body">${esc(p.text)}</p>` : `<div style="height:.65rem"></div>`}
    ${readingSummary(p)}
    <div class="actions">
      <button data-act="like" class="${p.liked ? "liked" : ""}" aria-pressed="${p.liked}" aria-label="Like">${ICON.heart}<span>${p.likeCount}</span></button>
      <a href="#/post/${p.id}" aria-label="Comments">${ICON.chat}${p.comments.length}</a>
      <button data-act="menu" class="more" aria-label="More options">${ICON.dots}</button>
    </div>
    <div class="menu" hidden>
      ${p.mine ? `<button data-act="delete" class="danger">Delete post</button>`
        : `<button data-act="report" data-reason="inaccurate">Report: looks like bad data</button>
           <button data-act="report" data-reason="inappropriate">Report: inappropriate</button>`}
    </div>
  </article>`;
}

// Like, menu, report and delete work the same in the feed and on a post page.
function bindPostActions(container, onRemoved) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]"); if (!btn) return;
    const card = btn.closest("article"), id = card.dataset.id;
    const act = btn.dataset.act;
    if (act === "like") {
      const res = await api.toggleLike(id);
      btn.classList.toggle("liked", res.liked); btn.setAttribute("aria-pressed", res.liked); btn.querySelector("span").textContent = res.likeCount;
    } else if (act === "menu") {
      const m = card.querySelector(".menu"); m.hidden = !m.hidden;
    } else if (act === "report") {
      await api.report(id, btn.dataset.reason); toast("Thanks. A moderator will review it."); onRemoved(card);
    } else if (act === "delete") {
      if (!confirm("Delete this post and its readings?")) return;
      await api.deletePost(id); toast("Post deleted"); onRemoved(card);
    }
  });
}

async function viewFeed() {
  view.innerHTML = `<div class="chips" id="chips" role="toolbar" aria-label="Filter posts"></div>
    <div class="challenge" id="challenge"></div><div id="list"></div>
    <button class="btn ghost load-more" id="more" hidden>Load more</button>`;
  let offset = 0;
  const seq = routeSeq;
  const chips = [["", "Everywhere"], ["campus", "Monash campuses"], ...REGIONS.map((r) => [r, r])];
  const renderChips = () => {
    $("#chips").innerHTML = chips.map(([v, l]) => {
      const on = v === "campus" ? feedState.campusOnly : !feedState.campusOnly && feedState.region === v;
      return `<button data-v="${v}" aria-pressed="${on}">${l}</button>`;
    }).join("");
  };
  const load = async (reset) => {
    if (reset) { offset = 0; $("#list").innerHTML = `<div class="spinner">Loading posts...</div>`; }
    const { items, total } = await api.feed({ region: feedState.region, campusOnly: feedState.campusOnly, offset, limit: 15 });
    if (isStale(seq)) return;
    const html = items.map(postCard).join("");
    if (reset) $("#list").innerHTML = html || `<div class="empty">No posts here yet. <a href="#/record">Be the first.</a></div>`;
    else $("#list").insertAdjacentHTML("beforeend", html);
    offset += items.length;
    $("#more").hidden = offset >= total;
  };
  $("#chips").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    feedState.campusOnly = b.dataset.v === "campus"; feedState.region = feedState.campusOnly ? "" : b.dataset.v;
    renderChips(); load(true);
  };
  $("#more").onclick = (e) => busy(e.currentTarget, "Loading...", () => load(false));
  bindPostActions($("#list"), (card) => card.remove());

  const weekAgo = Date.now() - 7 * 864e5, recent = api.readings().filter((r) => new Date(r.takenAt) > weekAgo), goal = 250;
  $("#challenge").innerHTML = `<small>This week's challenge</small><b>Network Week: map your commute, wherever you are</b>
    <div class="progress"><div style="width:${Math.min(100, (recent.length / goal) * 100)}%"></div></div>
    <div class="meta">${recent.length} of ${goal} readings · ${new Set(recent.map((r) => r.country)).size} countries this week</div>`;
  renderChips();
  await load(true);
}

/* =========================================================================
   Post detail
   ========================================================================= */
async function viewPost(id) {
  const seq = routeSeq;
  const p = await api.post(id);
  if (isStale(seq)) return;
  const r0 = p.readings[0];
  view.innerHTML = `${postCard(p).replace(`<a class="reading"`, `<a class="reading" style="pointer-events:none"`)}
    <div class="pad" style="padding-top:.9rem">
      <div class="mini-map" id="mm"></div>
      ${p.kind === "walk" ? `<div class="stepper"><span>Reading</span><input type="range" id="step" min="0" max="${p.readings.length - 1}" value="0" aria-label="Choose a reading in this walk" /><b id="stepn">1 / ${p.readings.length}</b></div>` : ""}
      <div id="coverage"></div>
      <div id="fields"></div>
      <div class="card"><h3>Comments (${p.comments.length})</h3>
        <div class="comments">${p.comments.map((c) => `<div class="comment">${avatar(c.author, "sm")}<div><b>${esc(c.author.display)}</b>${esc(c.text)}<div class="small">${ago(c.at)}</div></div></div>`).join("") || `<p class="small">No comments yet.</p>`}</div>
        <form class="comment-form" id="cf"><input name="text" maxlength="300" placeholder="Add a comment" aria-label="Comment" /><button>Send</button></form>
      </div>
    </div>`;
  bindPostActions(view, () => go("feed"));

  let markers = [], map = null;
  if (hasLeaflet()) {
    map = L.map("mm", { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
    addTiles(map);
    const pts = p.readings.map((r) => [r.lat, r.lon]);
    if (p.kind === "walk") L.polyline(pts, { color: "#224a40", weight: 3, opacity: 0.6 }).addTo(map);
    markers = p.readings.map((r) => L.circleMarker([r.lat, r.lon], { radius: 6, color: "#fff", weight: 1.5, fillColor: QCOLOUR[quality(r)], fillOpacity: 0.95 }).addTo(map));
    if (r0.coarse) L.circle([r0.lat, r0.lon], { radius: 600, color: "#224a40", weight: 1, fillOpacity: 0.05 }).addTo(map);
    pts.length > 1 ? map.fitBounds(pts, { padding: [24, 24] }) : map.setView(pts[0], r0.coarse ? 13 : 15);
    setTimeout(() => map.invalidateSize(), 50);
    onLeave(() => map.remove());
  } else {
    $("#mm").innerHTML = `<div class="empty">Map unavailable offline.</div>`;
  }

  const show = (i) => {
    const r = p.readings[i];
    $("#coverage").innerHTML = coverageLine(r);
    $("#fields").innerHTML = fieldTables(r, p.mine);
    markers.forEach((mk, k) => mk.setRadius(k === i ? 10 : 6));
    if ($("#stepn")) $("#stepn").textContent = `${i + 1} / ${p.readings.length}`;
  };
  $("#step")?.addEventListener("input", (e) => show(+e.target.value));
  show(0);

  $("#cf").onsubmit = (e) => {
    e.preventDefault();
    busy(e.target.querySelector("button"), "...", async () => {
      try { await api.addComment(p.id, e.target.text.value); router(); } catch (err) { toast(err.message); }
    });
  };
}

/* =========================================================================
   Map
   ========================================================================= */
const mapState = { region: "", tech: "" };
const REGION_VIEW = { "": [[15, 20], 1], Oceania: [[-30, 140], 3], Asia: [[15, 105], 3], Europe: [[48, 8], 4], Americas: [[0, -75], 2], Africa: [[-8, 25], 3] };

function viewMap() {
  view.innerHTML = `<div class="chips" id="chips"></div><div class="pad">
    <div class="filters" style="grid-template-columns:1fr"><select id="tech" aria-label="Technology">
      <option value="">All technologies</option><option>LTE</option><option value="NR-NSA">5G (NR-NSA)</option><option value="NR-SA">5G standalone (NR-SA)</option><option>3G</option></select></div>
    <div class="world-map" id="wm"></div>
    <div class="legend"><span><i style="background:${QCOLOUR.good}"></i>Good</span><span><i style="background:${QCOLOUR.fair}"></i>Fair</span><span><i style="background:${QCOLOUR.poor}"></i>Poor</span><span>Lines are walk sessions</span></div>
    <div class="card"><h3>Weakest areas</h3><ul class="list" id="weak"></ul></div>
    <div class="card"><h3>Strongest areas</h3><ul class="list" id="strong"></ul></div>
  </div>`;
  $("#tech").value = mapState.tech;
  let map = null, layer = null;
  if (hasLeaflet()) {
    map = L.map("wm", { worldCopyJump: true, minZoom: 1 });
    addTiles(map);
    layer = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 50);
    onLeave(() => map.remove());
  } else {
    $("#wm").innerHTML = `<div class="empty">The map needs an internet connection.</div>`;
  }

  const render = () => {
    $("#chips").innerHTML = [["", "World"], ...REGIONS.map((r) => [r, r])].map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === mapState.region}">${l}</button>`).join("");
    const rs = api.readings(mapState);
    if (map) {
      layer.clearLayers();
      for (const [, walk] of Object.entries(groupBy(rs.filter((r) => r.sessionId), (r) => r.sessionId)))
        L.polyline(walk.map((r) => [r.lat, r.lon]), { color: "#224a40", weight: 2, opacity: 0.5 }).addTo(layer);
      for (const r of rs) {
        const h = headline(r), q = quality(r);
        L.circleMarker([r.lat, r.lon], { radius: 5, color: "#fff", weight: 1, fillColor: QCOLOUR[q], fillOpacity: 0.9 })
          .bindPopup(`<b>${esc(r.spot || r.city)}</b>, ${esc(r.city)}<br>${esc(r.carrier)} · ${esc(r.tech)}<br>${h.label} ${h.value} dBm (${q})<br><a href="#/post/${r.postId}">Open post</a>`)
          .addTo(layer);
      }
      const [c, z] = REGION_VIEW[mapState.region]; map.setView(c, z);
    }
    const byCity = Object.entries(groupBy(rs.filter((r) => sig(r) != null), (r) => r.city))
      .filter(([, v]) => v.length >= 2).map(([city, v]) => ({ city, country: v[0].country, n: v.length, med: Math.round(median(v.map(sig))) }))
      .sort((a, b) => a.med - b.med);
    const li = (x) => `<li><span class="grow">${esc(x.city)}<div class="sub">${esc(x.country)} · ${x.n} readings</div></span><span class="pill ${qualityOfValue(x.med)}">${x.med} dBm</span></li>`;
    $("#weak").innerHTML = byCity.slice(0, 5).map(li).join("") || `<li class="sub">Not enough readings yet.</li>`;
    $("#strong").innerHTML = byCity.slice(-5).reverse().map(li).join("") || `<li class="sub">Not enough readings yet.</li>`;
  };
  $("#chips").onclick = (e) => { const b = e.target.closest("button"); if (b) { mapState.region = b.dataset.v; render(); } };
  $("#tech").onchange = (e) => { mapState.tech = e.target.value; render(); };
  render();
}

/* =========================================================================
   Record
   ========================================================================= */
let cachedPosition; // undefined = not asked yet, null = unavailable

function getPosition() {
  if (cachedPosition !== undefined) return Promise.resolve(cachedPosition);
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve((cachedPosition = null));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve((cachedPosition = { lat: p.coords.latitude, lon: p.coords.longitude })),
      () => resolve((cachedPosition = null)), { timeout: 5000, maximumAge: 60000 });
  });
}

function viewRecord(_, user) {
  const s = { placeId: user.placeId, device: user.device, mode: "single", env: "outdoor", floor: 0, speedTest: false, readings: [], walking: false };
  const place = () => PLACE_BY_ID[s.placeId];
  const carriers = () => COUNTRIES[place().cc].carriers;
  let carrierIdx = 0, timer = null, origin = null, walkHeading = 0;
  onLeave(() => clearInterval(timer));

  view.innerHTML = `<div class="pad">
    <div id="ios"></div>
    <div class="card"><h3>Your phone</h3>
      <label class="field">Phone (simulated in this prototype)<select id="dev">${deviceOptions(s.device)}</select></label>
      <label class="field">Recording in<select id="place">${placeOptions(s.placeId)}</select></label>
      <div class="carrier-line"><span>SIM detected: <b id="cname"></b><br><span class="small" id="ccode"></span></span>
        <select id="carrier" class="input" style="width:auto;margin:0" aria-label="Carrier"></select></div>
    </div>
    <div class="card"><h3>Reading</h3>
      <div class="seg" id="mode"><button data-v="single">Single reading</button><button data-v="walk">Walk</button></div>
      <div class="seg" id="env"><button data-v="outdoor">Outdoor</button><button data-v="indoor">Indoor</button></div>
      <label class="field" id="floorf" hidden>Floor (0 is ground, -1 is basement)<input id="floor" type="number" min="-5" max="80" value="0" /></label>
      <label class="field">Spot<input id="spot" list="spots" maxlength="40" placeholder="Building, station or street" /><datalist id="spots"></datalist></label>
      <label class="check" id="speedf"><input type="checkbox" id="speed" /> Run a speed test too (uses about 15 MB of data)</label>
      <p class="note" id="locnote"></p>
    </div>
    <div id="result"></div>
    <button class="btn" id="go">Take reading</button>
    <div id="compose" hidden style="margin-top:1rem">
      <label class="field">Caption<textarea id="text" maxlength="280" placeholder="What's it like here? Anything odd?"></textarea></label>
      <button class="btn" id="share">Share to the feed</button>
      <button class="btn ghost" id="discard">Discard</button>
    </div>
  </div>`;

  const seg = (id, val) => document.querySelectorAll(`#${id} button`).forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === val));
  const setup = () => {
    const d = DEVICE_BY_MODEL[s.device], p = place();
    $("#ios").innerHTML = d.ios ? `<div class="notice">iPhones don't let apps read signal strength, cell IDs or radio metrics, so recording is Android-only. You can still browse, comment and analyse. Pick an Android phone above to try recording in the prototype.</div>` : "";
    $("#carrier").innerHTML = carriers().map((c, i) => `<option value="${i}" ${i === carrierIdx ? "selected" : ""}>${esc(c[0])}</option>`).join("");
    const c = carriers()[carrierIdx];
    $("#cname").textContent = c[0]; $("#ccode").textContent = `MCC ${c[1]} · MNC ${c[2]} · ${COUNTRIES[p.cc].name}`;
    $("#spots").innerHTML = p.spots.map((x) => `<option value="${esc(x)}">`).join("");
    seg("mode", s.mode); seg("env", s.env);
    $("#floorf").hidden = s.env !== "indoor";
    $("#speedf").hidden = s.mode === "walk";
    $("#locnote").textContent = s.mode === "walk"
      ? "Walks record precise points every few seconds so the route makes sense. The first and last points are trimmed before sharing so your start and end stay private."
      : user.settings.coarse ? "Location will be rounded to about 1 km. Change this under Me." : "Precise location is on. You can switch to coarse under Me.";
    const locked = s.walking || s.readings.length > 0;
    $("#go").disabled = !!d.ios;
    $("#go").textContent = s.walking ? "Stop walk" : s.mode === "walk" ? (locked ? "Record another walk" : "Start walk") : locked ? "Measure again" : "Take reading";
    for (const id of ["dev", "place", "carrier"]) $("#" + id).disabled = s.walking;
  };

  const ctxFor = async (extra = {}) => {
    const p = place(), pos = await getPosition();
    // Use GPS only when it is near the chosen city; otherwise simulate a point there.
    const near = pos && Math.abs(pos.lat - p.lat) < 0.5 && Math.abs(pos.lon - p.lon) < 0.5;
    return {
      place: p, carrier: carriers()[carrierIdx], device: DEVICE_BY_MODEL[s.device], contributor: user.id,
      lat: near ? pos.lat : p.lat + (Math.random() - 0.5) * 0.03, lon: near ? pos.lon : p.lon + (Math.random() - 0.5) * 0.03,
      coarse: user.settings.coarse, environment: s.env, floor: s.env === "indoor" ? +$("#floor").value || 0 : null,
      spot: $("#spot").value.trim(), runSpeed: s.speedTest, ...extra,
    };
  };

  const renderResult = () => {
    const rs = s.readings;
    if (!rs.length) { $("#result").innerHTML = ""; $("#compose").hidden = true; return; }
    const last = rs[rs.length - 1], h = headline(last), q = quality(last);
    if (s.mode === "walk") {
      const vals = rs.map(sig).filter((v) => v != null);
      $("#result").innerHTML = `<div class="card">${s.walking ? `<div class="live">Recording walk</div>` : `<h3>Walk recorded</h3>`}
        <div class="result-head"><div class="db">${rs.length}<small>readings</small></div>${spark(rs.map(sig), 160, 40)}</div>
        <table class="fields"><tr><th>Distance</th><td>${distance(rs)}</td></tr>
          <tr><th>Latest</th><td>${h.label} ${h.value} dBm · ${esc(last.tech)}</td></tr>
          <tr><th>Best / worst</th><td>${vals.length ? `${Math.max(...vals)} / ${Math.min(...vals)} dBm` : "--"}</td></tr></table></div>`;
    } else {
      $("#result").innerHTML = `<div class="card">
        <div class="result-head"><div class="db">${h.value}<small>${h.label} dBm</small></div><div><span class="pill ${q}">${q}</span>
          <div class="small" style="margin-top:.3rem">${esc(last.carrier)} · ${esc(last.tech)} · ${esc(last.band)}</div></div></div>
        ${coverageLine(last)}
        <details><summary class="small" style="cursor:pointer">Show every field</summary><div style="margin-top:.7rem">${fieldTables(last, true)}</div></details>
        <p class="note">Simulated: browsers can't read the radio. The Android app reads these from the phone's telephony APIs.</p></div>`;
    }
    $("#compose").hidden = s.walking;
  };

  $("#dev").onchange = (e) => { s.device = e.target.value; setup(); };
  $("#place").onchange = (e) => { s.placeId = e.target.value; carrierIdx = 0; setup(); };
  $("#carrier").onchange = (e) => { carrierIdx = +e.target.value; setup(); };
  $("#mode").onclick = (e) => { const b = e.target.closest("button"); if (b && !s.walking) { s.mode = b.dataset.v; s.readings = []; renderResult(); setup(); } };
  $("#env").onclick = (e) => { const b = e.target.closest("button"); if (b) { s.env = b.dataset.v; setup(); } };
  $("#speed").onchange = (e) => { s.speedTest = e.target.checked; };

  $("#go").onclick = async (e) => {
    const btn = e.currentTarget;
    if (s.mode === "single") {
      await busy(btn, s.speedTest ? "Reading radio, then speed test..." : "Reading radio...", async () => {
        await new Promise((r) => setTimeout(r, s.speedTest ? 1800 : 900));
        s.readings = [simulateReading(Math.random, await ctxFor())];
      });
      renderResult(); setup(); return;
    }
    if (s.walking) { // stop
      clearInterval(timer); s.walking = false; renderResult(); setup(); return;
    }
    // start a walk: a new point every 1.5 s in the demo (every 5 s or 10 m in the app)
    s.readings = []; s.walking = true; walkHeading = Math.random() * 360;
    const base = await ctxFor({ coarse: false, runSpeed: false, environment: "outdoor", floor: null });
    origin = { lat: base.lat, lon: base.lon };
    const sessionId = uid("ws");
    const step = () => {
      walkHeading += (Math.random() - 0.5) * 50;
      origin.lat += Math.cos((walkHeading * Math.PI) / 180) * 0.0002; origin.lon += Math.sin((walkHeading * Math.PI) / 180) * 0.00025;
      s.readings.push(simulateReading(Math.random, { ...base, ...origin, sessionId, speed: 1.3 + Math.random() * 0.4, heading: walkHeading }));
      if (s.readings.length >= 60) { clearInterval(timer); s.walking = false; setup(); }
      renderResult();
    };
    step(); timer = setInterval(step, 1500);
    setup();
  };

  $("#discard").onclick = () => { s.readings = []; renderResult(); setup(); };
  $("#share").onclick = (e) => busy(e.currentTarget, "Sharing...", async () => {
    let readings = s.readings;
    if (s.mode === "walk" && readings.length > 4) readings = readings.slice(1, -1); // trim start and end
    const p = await api.createPost({ text: $("#text").value, kind: s.mode, readings });
    toast("Shared with the cohort");
    go("post/" + p.id);
  });

  setup();
}

/* =========================================================================
   Insights
   ========================================================================= */
const insightState = { region: "", tech: "" };

function bars(rows, { min, max, fmt, colour }) {
  return `<div class="bars">${rows.map(([label, v, sub]) => `<div class="r"><span title="${esc(label)}">${esc(label)}</span>
    <div class="track"><div class="fill" style="width:${Math.max(3, Math.min(100, ((v - min) / (max - min)) * 100))}%;${colour ? `background:${colour(v)}` : ""}"></div></div>
    <span class="num">${fmt(v)}${sub ? `<span class="sr"> ${esc(sub)}</span>` : ""}</span></div>`).join("")}</div>`;
}

function histogram(vals) {
  const lo = -130, hi = -50, w = 5, bins = Array.from({ length: (hi - lo) / w }, () => 0);
  for (const v of vals) bins[Math.max(0, Math.min(bins.length - 1, Math.floor((v - lo) / w)))]++;
  const top = Math.max(1, ...bins), W = 320, H = 120, bw = W / bins.length;
  const rects = bins.map((n, i) => {
    const h = (n / top) * (H - 18), x = i * bw, centre = lo + i * w + w / 2;
    return `<rect x="${(x + 1).toFixed(1)}" y="${(H - 16 - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${QCOLOUR[qualityOfValue(centre)]}"><title>${lo + i * w} to ${lo + (i + 1) * w} dBm: ${n}</title></rect>`;
  }).join("");
  const ticks = [-130, -110, -90, -70, -50].map((t) => `<text x="${((t - lo) / (hi - lo)) * W}" y="${H - 3}" font-size="9" fill="#5d6d68" text-anchor="middle">${t}</text>`).join("");
  return `<div class="chart"><svg viewBox="-6 0 ${W + 12} ${H}" role="img" aria-label="Histogram of signal strength">${rects}${ticks}</svg></div>`;
}

function scatter(points) {
  if (points.length < 3) return `<p class="small">Not enough speed tests yet.</p>`;
  const W = 320, H = 170, pad = 26, xLo = -125, xHi = -55;
  const yHi = Math.max(50, ...points.map((p) => p.y)) * 1.05;
  const x = (v) => pad + ((v - xLo) / (xHi - xLo)) * (W - pad - 6), y = (v) => H - pad - (v / yHi) * (H - pad - 8);
  points = points.filter((p) => p.x >= xLo && p.x <= xHi);
  const dots = points.map((p) => `<circle cx="${x(p.x).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="3" fill="${p.nr ? "#3f6fd8" : "#2f9e6e"}" opacity=".75"/>`).join("");
  const xt = [-120, -100, -80, -60].map((t) => `<text x="${x(t)}" y="${H - 10}" font-size="9" fill="#5d6d68" text-anchor="middle">${t}</text>`).join("");
  const yt = [0, Math.round(yHi / 2), Math.round(yHi)].map((t) => `<text x="${pad - 4}" y="${y(t) + 3}" font-size="9" fill="#5d6d68" text-anchor="end">${t}</text>`).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Download speed against signal strength">
    <line x1="${pad}" y1="${H - pad}" x2="${W - 6}" y2="${H - pad}" stroke="#cfdcd7"/><line x1="${pad}" y1="8" x2="${pad}" y2="${H - pad}" stroke="#cfdcd7"/>
    ${dots}${xt}${yt}<text x="${W / 2}" y="${H}" font-size="9" fill="#5d6d68" text-anchor="middle">signal (dBm)</text></svg></div>
    <div class="legend" style="margin:.4rem 0 0"><span><i style="background:#2f9e6e"></i>4G</span><span><i style="background:#3f6fd8"></i>5G</span><span>Mbps on the vertical axis</span></div>`;
}

function toCsv(readings) {
  const cols = ["postId", ...FIELDS.map((f) => f.key), "missing"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = readings.map((r) => cols.map((c) => {
    if (c === "missing") return cell(Object.entries(r.na || {}).map(([k, why]) => `${k}=${why}`).join(";"));
    if (c === "contributor") return cell(api.contributor(r.contributor).id ? pseudonym(r.contributor) : "deleted");
    if (FIELD_BY_KEY[c]?.privacy === "restricted") return cell("");
    return cell(r[c]);
  }).join(","));
  return [cols.join(","), ...rows].join("\n");
}

function viewInsights() {
  view.innerHTML = `<div class="pad">
    <p class="lead">What the shared dataset says so far. Download it and run your own analysis in Python or R.</p>
    <div class="filters">
      <select id="region" aria-label="Region"><option value="">All regions</option>${REGIONS.map((r) => `<option>${r}</option>`).join("")}</select>
      <select id="tech" aria-label="Technology"><option value="">All technologies</option><option>LTE</option><option value="NR-NSA">5G NSA</option><option value="NR-SA">5G SA</option><option>3G</option></select>
    </div>
    <div id="body"></div>
  </div>`;
  $("#region").value = insightState.region; $("#tech").value = insightState.tech;

  const render = () => {
    const rs = api.readings(insightState), withSig = rs.filter((r) => sig(r) != null);
    const dbm = (v) => Math.round(v), sigScale = { min: -115, max: -65, fmt: dbm, colour: (v) => QCOLOUR[qualityOfValue(v)] };
    const medBy = (f, minN = 1) => Object.entries(groupBy(withSig, f)).filter(([, v]) => v.length >= minN)
      .map(([k, v]) => [k, median(v.map(sig)), v.length + " readings"]).sort((a, b) => b[1] - a[1]);
    const techMix = ["LTE", "NR-NSA", "NR-SA", "3G"].map((t) => [t, (rs.filter((r) => r.tech === t).length / (rs.length || 1)) * 100]);
    const envRows = [["Outdoor", withSig.filter((r) => r.environment === "outdoor")], ["Indoor, above ground", withSig.filter((r) => r.environment === "indoor" && r.floor >= 0)], ["Below ground", withSig.filter((r) => r.floor < 0)]]
      .filter(([, v]) => v.length).map(([k, v]) => [k, median(v.map(sig))]);
    const coverage = FIELDS.filter((f) => ["Signal (4G LTE)", "Signal (5G NR)", "Network", "Performance"].includes(f.group) && f.privacy !== "restricted")
      .map((f) => [f.label, (rs.filter((r) => r[f.key] != null).length / (rs.length || 1)) * 100]);
    const leaders = Object.entries(groupBy(rs, (r) => r.contributor)).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
    const speedPts = rs.filter((r) => r.down != null && sig(r) != null).map((r) => ({ x: sig(r), y: r.down, nr: r.tech !== "LTE" }));
    const devices = Object.entries(groupBy(rs, (r) => r.model)).map(([k, v]) => [k, v.length]).sort((a, b) => b[1] - a[1]);

    $("#body").innerHTML = rs.length ? `
      <div class="stats">
        <div class="stat"><b>${rs.length}</b><span>readings</span></div>
        <div class="stat"><b>${new Set(rs.map((r) => r.contributor)).size}</b><span>contributors</span></div>
        <div class="stat"><b>${new Set(rs.map((r) => r.country)).size}</b><span>countries</span></div>
        <div class="stat"><b>${withSig.length ? Math.round(median(withSig.map(sig))) : "--"}</b><span>median dBm</span></div>
      </div>
      <div class="card"><h3>Median signal by country</h3>${bars(medBy((r) => r.country), sigScale)}</div>
      <div class="card"><h3>Median signal by carrier</h3>${bars(medBy((r) => `${r.carrier} · ${CC_BY_NAME[r.country]}`, 3).slice(0, 12), sigScale)}
        <p class="note">Carriers with at least 3 readings.</p></div>
      <div class="card"><h3>Signal distribution</h3>${histogram(withSig.map(sig))}</div>
      <div class="card"><h3>Indoors vs outdoors</h3>${bars(envRows, sigScale)}</div>
      <div class="card"><h3>Technology mix</h3>${bars(techMix, { min: 0, max: 100, fmt: (v) => Math.round(v) + "%" })}</div>
      <div class="card"><h3>Download speed vs signal</h3>${scatter(speedPts)}</div>
      <div class="card"><h3>Field coverage</h3>${bars(coverage, { min: 0, max: 100, fmt: (v) => Math.round(v) + "%" })}
        <p class="note">How often each field has a value. Gaps come from phones that don't report a field, 4G vs 5G differences and skipped speed tests. The CSV's <code>missing</code> column says which.</p></div>
      <div class="card"><h3>Phones in the dataset</h3>${bars(devices, { min: 0, max: Math.max(...devices.map((d) => d[1])), fmt: (v) => v })}</div>
      <div class="card"><h3>Top contributors</h3><ul class="list">${leaders.map(([id, v], i) => {
        const a = api.contributor(id);
        return `<li><b style="width:1.1rem;color:var(--muted)">${i + 1}</b>${avatar(a, "sm")}<span class="grow">${esc(a.display)}<div class="sub">${esc(a.place?.city || "")}</div></span><b>${v.length}</b></li>`;
      }).join("")}</ul></div>
      <div class="card"><h3>Try investigating</h3>
        <ul class="list"><li><span class="grow">Is 5G actually stronger than 4G in the same city?<div class="sub">Filter by tech, compare medians per city.</div></span></li>
        <li><span class="grow">How much does a building cost you?<div class="sub">Indoor vs outdoor, and per floor.</div></span></li>
        <li><span class="grow">Do some phones read lower than others?<div class="sub">Group by model, control for carrier and city.</div></span></li></ul></div>
      <button class="btn" id="csv">Download CSV (${rs.length} rows)</button>
      <button class="btn ghost" id="json">Download JSON</button>
      <a class="btn ghost" href="#/data" style="margin-top:.55rem">Data dictionary</a>
      <p class="note">Exports use pseudonymous contributor IDs. Cell ID and TAC are withheld from public exports.</p>
    ` : `<div class="empty">No readings match these filters.</div>`;

    $("#csv")?.addEventListener("click", () => download(`signal-club-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rs), "text/csv"));
    $("#json")?.addEventListener("click", () => {
      const clean = rs.map((r) => { const o = { ...r, contributor: pseudonym(r.contributor) }; for (const f of FIELDS) if (f.privacy === "restricted") delete o[f.key]; return o; });
      download(`signal-club-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(clean, null, 2), "application/json");
    });
  };
  $("#region").onchange = (e) => { insightState.region = e.target.value; render(); };
  $("#tech").onchange = (e) => { insightState.tech = e.target.value; render(); };
  render();
}

/* =========================================================================
   Data dictionary
   ========================================================================= */
function viewData() {
  view.innerHTML = `<div class="pad">
    <p class="lead">Every field a reading can contain, where it comes from on Android, and how it is shared. ${FIELDS.length} fields in total.</p>
    <div class="card"><h3>Privacy levels</h3><ul class="list">
      <li><span class="priv public">public</span><span class="grow">In the shared dataset and exports.</span></li>
      <li><span class="priv sensitive">sensitive</span><span class="grow">Shared, but rounded to about 1 km when coarse location is on.</span></li>
      <li><span class="priv restricted">restricted</span><span class="grow">Stored, but only visible to the contributor and approved researchers. Never in public exports.</span></li>
      <li><span class="grow"><b>Never collected:</b> phone number, IMEI, IMSI, contacts, browsing.</span></li></ul></div>
    <div class="card"><h3>Why a value can be missing</h3><ul class="list">${Object.entries(MISSING).map(([k, v]) => `<li><code>${k}</code><span class="grow">${esc(v)}</span></li>`).join("")}</ul></div>
    ${FIELD_GROUPS.map((g) => `<div class="card"><h3>${esc(g)}</h3><table class="dict">${FIELDS.filter((f) => f.group === g).map((f) => `
      <tr><td><span class="k">${esc(f.label)}</span> <span class="priv ${f.privacy}">${f.privacy}</span><br>
        <code>${esc(f.key)}</code>${f.unit ? ` · ${esc(f.unit)}` : ""}${f.range ? ` · ${f.range[0]} to ${f.range[1]}` : ""}<br>
        ${esc(f.desc)}<br><code>${esc(f.source)}</code></td></tr>`).join("")}</table></div>`).join("")}
    <p class="note">Consent version ${CONSENT_VERSION} · App ${APP_VERSION}</p>
  </div>`;
}

/* =========================================================================
   Me
   ========================================================================= */
function viewMe(_, user) {
  const me = api.publicUser(user), p = PLACE_BY_ID[user.placeId];
  const mine = api.readings().filter((r) => r.contributor === user.id);
  const posts = new Set(mine.map((r) => r.postId)).size;
  view.innerHTML = `<div class="pad">
    <div class="profile">${avatar(me)}<div><h2 style="margin:0">${esc(user.name)}</h2>
      <div class="small">${esc(user.email)}</div><div class="small">${esc(p.city)}, ${esc(COUNTRIES[p.cc].name)}${p.campus ? " · " + esc(p.campus) : ""}</div></div></div>
    <div class="stats">
      <div class="stat"><b>${posts}</b><span>posts</span></div><div class="stat"><b>${mine.length}</b><span>readings</span></div>
    </div>
    <form class="card" id="f"><h3>Profile and privacy</h3>
      <label class="field">Name<input name="name" value="${esc(user.name)}" maxlength="40" /></label>
      <label class="field">Usually studying from<select name="place">${placeOptions(user.placeId)}</select></label>
      <label class="field">Phone<select name="device">${deviceOptions(user.device)}</select></label>
      <label class="check"><input type="checkbox" name="coarse" ${user.settings.coarse ? "checked" : ""}/> Round my location to about 1 km</label>
      <label class="check"><input type="checkbox" name="showName" ${user.settings.showName ? "checked" : ""}/> Show my name on posts (otherwise "${esc(pseudonym(user.id))}")</label>
      <button class="btn">Save changes</button>
    </form>
    <div class="card"><h3>Your data</h3>
      <button class="btn ghost" id="export">Download everything about me</button>
      <button class="btn danger" id="wipe">Delete all my readings</button>
      <a class="btn ghost" href="#/data" style="margin-top:.55rem">What we collect</a></div>
    <div class="card"><h3>Account</h3>
      <button class="btn ghost" id="logout">Sign out</button>
      <button class="btn danger" id="delete">Delete my account</button></div>
    <div class="card"><h3>About this prototype</h3>
      <p class="small" style="line-height:1.5">Built for the TECH8000 capstone. Readings are simulated because browsers can't access the radio, and everything is stored in this browser.
        A production version needs an Android app, a server with Monash single sign-on, and ethics approval for the data collection.</p>
      <button class="btn ghost" id="reset" style="margin-top:.7rem">Reset demo data</button></div>
  </div>`;

  const f = $("#f");
  f.onsubmit = (e) => {
    e.preventDefault();
    busy(f.querySelector("button"), "Saving...", async () => {
      await api.updateMe({ name: f.name.value.trim(), placeId: f.place.value, device: f.device.value, settings: { coarse: f.coarse.checked, showName: f.showName.checked } });
      toast("Saved"); router();
    });
  };
  $("#export").onclick = (e) => busy(e.currentTarget, "Preparing...", async () => download("my-signal-club-data.json", JSON.stringify(await api.exportMine(), null, 2), "application/json"));
  $("#wipe").onclick = async () => { if (confirm("Delete all your posts and readings? This can't be undone.")) { const n = await api.deleteMyReadings(); toast(`${n} posts deleted`); router(); } };
  $("#logout").onclick = () => { api.logout(); go("login"); };
  $("#delete").onclick = async () => { if (confirm("Delete your account, posts, comments and likes? This can't be undone.")) { await api.deleteAccount(); toast("Account deleted"); go("login"); } };
  $("#reset").onclick = () => { if (confirm("Reset the prototype to its sample data? You'll be signed out.")) { api.resetDemo(); go("login"); router(); } };
}

/* ---------- boot ---------- */
const ROUTES = { login: viewLogin, register: viewRegister, verify: viewVerify, feed: viewFeed, post: viewPost, map: viewMap,
  record: viewRecord, insights: viewInsights, data: viewData, me: viewMe };
window.addEventListener("hashchange", router);
router();
