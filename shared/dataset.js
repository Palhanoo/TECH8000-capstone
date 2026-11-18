import { FIELDS } from "./fields.js";

// Shared prototype data for every Signal Club app on the site: reference data,
// the reading simulator and the seed dataset.
// A browser can't read radio metrics, so readings here are simulated with realistic
// ranges and correlations. The Android app would fill the same fields from the phone.

export const REGIONS = ["Oceania", "Asia", "Europe", "Americas", "Africa"];

// nr = share of readings on 5G for phones that support it; sa = share of those on standalone 5G.
export const COUNTRIES = {
  AU: { name: "Australia", region: "Oceania", nr: 0.45, sa: 0.15, lte: [3, 7, 28, 1, 40], nrBands: ["n78", "n28"], offset: 1,
        carriers: [["Telstra", "505", "01"], ["Optus", "505", "02"], ["Vodafone", "505", "03"]] },
  MY: { name: "Malaysia", region: "Asia", nr: 0.35, sa: 0.3, lte: [3, 1, 7, 8], nrBands: ["n78"], offset: 0,
        carriers: [["Maxis", "502", "12"], ["CelcomDigi", "502", "13"], ["U Mobile", "502", "18"]] },
  ID: { name: "Indonesia", region: "Asia", nr: 0.1, sa: 0, lte: [3, 1, 40, 8], nrBands: ["n40"], offset: -4,
        carriers: [["Telkomsel", "510", "10"], ["Indosat", "510", "01"], ["XL Axiata", "510", "11"]] },
  CN: { name: "China", region: "Asia", nr: 0.6, sa: 0.7, lte: [3, 39, 40, 41], nrBands: ["n41", "n78"], offset: 3,
        carriers: [["China Mobile", "460", "00"], ["China Unicom", "460", "01"], ["China Telecom", "460", "11"]] },
  IN: { name: "India", region: "Asia", nr: 0.45, sa: 0.5, lte: [3, 40, 5], nrBands: ["n78", "n28"], offset: -3,
        carriers: [["Jio", "405", "857"], ["Airtel", "404", "10"], ["Vi", "404", "20"]] },
  PH: { name: "Philippines", region: "Asia", nr: 0.25, sa: 0, lte: [3, 28, 41], nrBands: ["n78"], offset: -3,
        carriers: [["Globe", "515", "02"], ["Smart", "515", "03"], ["DITO", "515", "66"]] },
  HK: { name: "Hong Kong", region: "Asia", nr: 0.55, sa: 0.2, lte: [3, 7, 1, 40], nrBands: ["n78"], offset: 4,
        carriers: [["CSL", "454", "00"], ["SmarTone", "454", "06"], ["3HK", "454", "03"]] },
  IT: { name: "Italy", region: "Europe", nr: 0.3, sa: 0, lte: [3, 7, 20, 1], nrBands: ["n78"], offset: 0,
        carriers: [["TIM", "222", "01"], ["Vodafone", "222", "10"], ["WindTre", "222", "88"], ["Iliad", "222", "50"]] },
  GB: { name: "United Kingdom", region: "Europe", nr: 0.35, sa: 0.1, lte: [3, 7, 20, 1], nrBands: ["n78", "n28"], offset: 0,
        carriers: [["EE", "234", "30"], ["Vodafone", "234", "15"], ["O2", "234", "10"], ["Three", "234", "20"]] },
  BR: { name: "Brazil", region: "Americas", nr: 0.3, sa: 0.6, lte: [3, 7, 28, 1], nrBands: ["n78"], offset: -1,
        carriers: [["Vivo", "724", "11"], ["Claro", "724", "05"], ["TIM", "724", "04"]] },
  CL: { name: "Chile", region: "Americas", nr: 0.25, sa: 0.2, lte: [7, 28, 4], nrBands: ["n78"], offset: -1,
        carriers: [["Entel", "730", "01"], ["Movistar", "730", "02"], ["WOM", "730", "09"], ["Claro", "730", "03"]] },
  US: { name: "United States", region: "Americas", nr: 0.55, sa: 0.4, lte: [2, 4, 12, 66], nrBands: ["n41", "n71", "n77"], offset: 1,
        carriers: [["T-Mobile", "310", "260"], ["AT&T", "310", "410"], ["Verizon", "311", "480"]] },
  ZA: { name: "South Africa", region: "Africa", nr: 0.15, sa: 0, lte: [3, 1, 38], nrBands: ["n78"], offset: -3,
        carriers: [["Vodacom", "655", "01"], ["MTN", "655", "10"], ["Cell C", "655", "07"]] },
  KE: { name: "Kenya", region: "Africa", nr: 0.1, sa: 0, lte: [3, 20, 8], nrBands: ["n78"], offset: -4,
        carriers: [["Safaricom", "639", "02"], ["Airtel", "639", "03"]] },
};

export const PLACES = [
  { id: "clayton", city: "Clayton", cc: "AU", tz: "Australia/Melbourne", lat: -37.911, lon: 145.134, alt: 70, campus: "Monash Clayton",
    spots: ["Matheson Library", "Campus Centre", "Learning and Teaching Building", "Monash Sport", "Menzies Building", "Clayton station"] },
  { id: "caulfield", city: "Caulfield", cc: "AU", tz: "Australia/Melbourne", lat: -37.877, lon: 145.043, alt: 40, campus: "Monash Caulfield",
    spots: ["Caulfield station", "Building H", "Caulfield Library", "Monash Caulfield green"] },
  { id: "parkville", city: "Parkville", cc: "AU", tz: "Australia/Melbourne", lat: -37.784, lon: 144.959, alt: 35, campus: "Monash Parkville",
    spots: ["Royal Parade", "Parkville library", "Manningham building"] },
  { id: "peninsula", city: "Frankston", cc: "AU", tz: "Australia/Melbourne", lat: -38.153, lon: 145.137, alt: 30, campus: "Monash Peninsula",
    spots: ["Peninsula library", "Frankston station", "Building B"] },
  { id: "melbcbd", city: "Melbourne CBD", cc: "AU", tz: "Australia/Melbourne", lat: -37.814, lon: 144.963, alt: 20, campus: null,
    spots: ["Flinders Street", "Southbank", "Docklands", "State Library"] },
  { id: "sydney", city: "Sydney", cc: "AU", tz: "Australia/Sydney", lat: -33.869, lon: 151.209, alt: 25, campus: null,
    spots: ["Newtown", "Parramatta", "Central station", "Bondi"] },
  { id: "perth", city: "Perth", cc: "AU", tz: "Australia/Perth", lat: -31.95, lon: 115.86, alt: 20, campus: null,
    spots: ["Fremantle", "Subiaco", "Northbridge"] },
  { id: "sunway", city: "Bandar Sunway", cc: "MY", tz: "Asia/Kuala_Lumpur", lat: 3.064, lon: 101.6, alt: 40, campus: "Monash Malaysia",
    spots: ["Monash Malaysia library", "Sunway Pyramid", "Sunway Lagoon station"] },
  { id: "bsd", city: "BSD City, Tangerang", cc: "ID", tz: "Asia/Jakarta", lat: -6.302, lon: 106.652, alt: 30, campus: "Monash Indonesia",
    spots: ["Green Office Park", "BSD station", "AEON Mall BSD"] },
  { id: "suzhou", city: "Suzhou", cc: "CN", tz: "Asia/Shanghai", lat: 31.27, lon: 120.74, alt: 5, campus: "Monash Suzhou",
    spots: ["Dushu Lake", "SIP Science Park", "Jinji Lake"] },
  { id: "mumbai", city: "Mumbai", cc: "IN", tz: "Asia/Kolkata", lat: 19.133, lon: 72.913, alt: 15, campus: "IITB-Monash Research Academy",
    spots: ["Powai", "IIT Bombay gate", "Bandra"] },
  { id: "manila", city: "Manila", cc: "PH", tz: "Asia/Manila", lat: 14.554, lon: 121.024, alt: 15, campus: null,
    spots: ["Makati", "BGC", "Ortigas"] },
  { id: "hongkong", city: "Hong Kong", cc: "HK", tz: "Asia/Hong_Kong", lat: 22.32, lon: 114.17, alt: 20, campus: null,
    spots: ["Mong Kok", "Central", "Sha Tin"] },
  { id: "prato", city: "Prato", cc: "IT", tz: "Europe/Rome", lat: 43.88, lon: 11.097, alt: 65, campus: "Monash Prato Centre",
    spots: ["Palazzo Vaj", "Piazza del Comune", "Prato Centrale"] },
  { id: "london", city: "London", cc: "GB", tz: "Europe/London", lat: 51.507, lon: -0.128, alt: 15, campus: null,
    spots: ["Shoreditch", "Camden", "King's Cross"] },
  { id: "saopaulo", city: "São Paulo", cc: "BR", tz: "America/Sao_Paulo", lat: -23.55, lon: -46.63, alt: 760, campus: null,
    spots: ["Avenida Paulista", "Pinheiros", "Vila Madalena"] },
  { id: "santiago", city: "Santiago", cc: "CL", tz: "America/Santiago", lat: -33.45, lon: -70.67, alt: 570, campus: null,
    spots: ["Providencia", "Ñuñoa", "Las Condes"] },
  { id: "newyork", city: "New York", cc: "US", tz: "America/New_York", lat: 40.713, lon: -74.006, alt: 10, campus: null,
    spots: ["Brooklyn", "Midtown", "Subway, Line 6"] },
  { id: "johannesburg", city: "Johannesburg", cc: "ZA", tz: "Africa/Johannesburg", lat: -26.204, lon: 28.047, alt: 1750, campus: null,
    spots: ["Sandton", "Braamfontein", "Rosebank"] },
  { id: "nairobi", city: "Nairobi", cc: "KE", tz: "Africa/Nairobi", lat: -1.286, lon: 36.817, alt: 1795, campus: null,
    spots: ["Westlands", "Nairobi CBD", "Kilimani"] },
];
export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));

// Phones differ in which radio fields their modem reports. That is realistic and
// gives students genuine missing-data problems to work through.
export const DEVICES = [
  { model: "Google Pixel 8", os: "Android 15", nr: true, missing: [] },
  { model: "Samsung Galaxy S24", os: "Android 14", nr: true, missing: ["cqi"] },
  { model: "Samsung Galaxy A15", os: "Android 14", nr: false, missing: ["cqi", "sinr"] },
  { model: "Xiaomi Redmi Note 13", os: "Android 14", nr: true, missing: ["cqi", "ta", "rssi"] },
  { model: "Motorola moto g54", os: "Android 13", nr: true, missing: ["ta"] },
  { model: "OPPO A78", os: "Android 13", nr: false, missing: ["cqi", "ta", "sinr", "neighbours"] },
  { model: "iPhone", os: "iOS", nr: true, ios: true, missing: [] },
];
export const DEVICE_BY_MODEL = Object.fromEntries(DEVICES.map((d) => [d.model, d]));

export const APP_VERSION = "0.9.0-prototype";
export const DB_VERSION = 4;
export const CONSENT_VERSION = "2026-11";

/* ---------- maths helpers ---------- */
export function makeRng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
export function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const pickFrom = (rnd, xs) => xs[Math.floor(rnd() * xs.length)];
export function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
export function uid(prefix, rnd = Math.random) { return prefix + "_" + Math.floor(rnd() * 36 ** 8).toString(36).padStart(8, "0"); }

export const EARFCN = { 1: [0, 599], 2: [600, 1199], 3: [1200, 1949], 4: [1950, 2399], 5: [2400, 2649], 7: [2750, 3449], 8: [3450, 3799], 12: [5010, 5179], 20: [6150, 6449], 28: [9210, 9659], 38: [37750, 38249], 39: [38250, 38649], 40: [38650, 39649], 41: [39650, 41589], 66: [66436, 67335] };
export const NRARFCN = { n28: [151600, 160600], n40: [460000, 480000], n41: [499200, 537999], n71: [123400, 130400], n77: [620000, 680000], n78: [620000, 653333] };
export const inRange = (rnd, [a, b]) => Math.round(a + rnd() * (b - a));

/* ---------- headline signal + quality ---------- */
// The single number shown on a post. Which measure it is depends on the technology.
export function headline(m) {
  if (m.tech === "NR-SA") return { value: m.ssRsrp, label: "SS-RSRP" };
  if (m.tech === "3G") return { value: m.rssi, label: "RSSI" };
  return { value: m.rsrp, label: "RSRP" };
}
export function quality(m) {
  const v = headline(m).value;
  const [good, poor] = m.tech === "3G" ? [-75, -95] : [-80, -100];
  return v > good ? "good" : v >= poor ? "fair" : "poor";
}

/* ---------- simulator ---------- */
// ctx: { place, carrier, device, lat, lon, coarse, environment, floor, spot, runSpeed, takenAt, sessionId, speed, heading, contributor }
export function simulateReading(rnd, ctx) {
  const country = COUNTRIES[ctx.place.cc], d = ctx.device, na = {};
  const m = {
    readingId: uid("rd", rnd), takenAt: ctx.takenAt || new Date().toISOString(), tz: ctx.place.tz,
    country: country.name, city: ctx.place.city, campus: ctx.place.campus, spot: ctx.spot || null,
    environment: ctx.environment, floor: ctx.environment === "indoor" ? ctx.floor ?? 0 : null,
    carrier: ctx.carrier[0], mcc: ctx.carrier[1], mnc: ctx.carrier[2],
    model: d.model, os: d.os, appVersion: APP_VERSION,
    sessionId: ctx.sessionId || null, contributor: ctx.contributor, consentVersion: CONSENT_VERSION, source: ctx.source || "App",
    roaming: rnd() < 0.02,
  };
  if (m.environment !== "indoor") na.floor = "not_applicable";
  if (!m.sessionId) na.sessionId = "not_applicable";
  if (!m.campus) na.campus = "not_applicable";
  if (!m.spot) na.spot = "not_entered";

  // Location
  const indoor = ctx.environment === "indoor";
  let lat = ctx.lat, lon = ctx.lon;
  if (ctx.coarse) { lat = Math.round(lat * 100) / 100; lon = Math.round(lon * 100) / 100; }
  Object.assign(m, {
    lat: +lat.toFixed(ctx.coarse ? 2 : 5), lon: +lon.toFixed(ctx.coarse ? 2 : 5), coarse: !!ctx.coarse,
    accuracy: Math.round(indoor ? 15 + rnd() * 45 : 3 + rnd() * 15),
    altitude: Math.round(ctx.place.alt + (m.floor || 0) * 3.5 + gauss(rnd) * 4),
    speed: +(ctx.speed ?? 0).toFixed(1),
    heading: ctx.speed ? Math.round(ctx.heading ?? rnd() * 360) : null,
  });
  if (!ctx.speed) na.heading = "not_applicable";

  // Technology
  const roll = rnd();
  m.tech = roll < 0.05 ? "3G" : d.nr && rnd() < country.nr ? (rnd() < country.sa ? "NR-SA" : "NR-NSA") : "LTE";

  // Signal: one underlying strength, then the other measures correlate with it.
  const carrierBias = (hashStr(m.carrier + ctx.place.cc) % 9) - 4;
  const envPenalty = indoor ? -9 + (m.floor < 0 ? -14 : 0) : 0;
  const base = -88 + country.offset + carrierBias + envPenalty + gauss(rnd) * 9;
  const lteRsrp = Math.round(clamp(base, -140, -44));
  const sinr = Math.round(clamp((lteRsrp + 112) / 2.2 + gauss(rnd) * 4, -20, 30));
  const lte = {
    rsrp: lteRsrp,
    rsrq: Math.round(clamp(-9 + (lteRsrp + 90) / 8 + gauss(rnd) * 2, -20, -3)),
    rssi: Math.round(clamp(lteRsrp + 27 + gauss(rnd) * 2, -113, -51)),
    sinr,
    cqi: Math.round(clamp((sinr + 6) / 2.4, 0, 15)),
    ta: Math.round(clamp(Math.abs(gauss(rnd)) * 10 + (-lteRsrp - 70) / 2, 0, 1282)),
  };
  const ssRsrp = Math.round(clamp(lteRsrp - 4 + gauss(rnd) * 6, -140, -44));
  const nr = {
    ssRsrp,
    ssRsrq: Math.round(clamp(-11 + (ssRsrp + 90) / 6 + gauss(rnd) * 2, -43, 20)),
    ssSinr: Math.round(clamp(sinr + 3 + gauss(rnd) * 4, -23, 40)),
  };
  const lteKeys = Object.keys(lte), nrKeys = Object.keys(nr);
  if (m.tech === "LTE" || m.tech === "NR-NSA") Object.assign(m, lte);
  if (m.tech === "NR-NSA" || m.tech === "NR-SA") Object.assign(m, nr);
  if (m.tech === "3G") { m.rssi = Math.round(clamp(base + 18, -113, -51)); }
  for (const k of lteKeys) if (m[k] === undefined) na[k] = "not_applicable";
  for (const k of nrKeys) if (m[k] === undefined) na[k] = "not_applicable";

  // Cell identity
  const isNr = m.tech === "NR-SA";
  if (m.tech === "3G") {
    m.band = "B1 (UMTS)"; m.channel = inRange(rnd, [10562, 10838]); na.pci = "not_applicable";
  } else {
    const lteBand = pickFrom(rnd, country.lte), nrBand = pickFrom(rnd, country.nrBands);
    m.band = isNr ? nrBand : m.tech === "NR-NSA" ? `B${lteBand} + ${nrBand}` : `B${lteBand}`;
    m.channel = isNr ? inRange(rnd, NRARFCN[nrBand]) : inRange(rnd, EARFCN[lteBand]);
    m.pci = Math.floor(rnd() * (isNr ? 1008 : 504));
  }
  m.cellId = isNr ? Math.floor(rnd() * 2 ** 34) : Math.floor(rnd() * 2 ** 28);
  m.tac = 1 + Math.floor(rnd() * 65534);
  const nCount = Math.floor(rnd() * 6);
  m.neighbours = Array.from({ length: nCount }, () => `${Math.floor(rnd() * 504)}:${Math.round(clamp(lteRsrp - 4 - rnd() * 18, -140, -44))}`).join("|");

  // Performance (optional active test)
  if (ctx.runSpeed) {
    const s = headline({ ...m }).value ?? lteRsrp;
    const down = m.tech === "3G" ? 0.5 + rnd() * 5
      : m.tech === "LTE" ? Math.max(0.8, (8 + (s + 120) * 1.3) * (0.5 + rnd()))
      : Math.max(5, (50 + (s + 120) * 7) * (0.5 + rnd()));
    Object.assign(m, {
      down: +down.toFixed(1),
      up: +(down * (0.1 + rnd() * 0.15)).toFixed(1),
      latency: Math.round((m.tech === "3G" ? 90 : m.tech === "LTE" ? 32 : 20) + Math.max(0, -s - 95) * 1.5 + rnd() * 15),
      jitter: +(1 + rnd() * (s < -100 ? 25 : 8)).toFixed(1),
      loss: +(s < -105 ? rnd() * 4 : rnd() * 0.6).toFixed(1),
    });
  } else {
    for (const k of ["down", "up", "latency", "jitter", "loss"]) na[k] = "not_run";
  }

  // What this phone's modem doesn't report
  for (const k of d.missing) if (!(k in na)) { delete m[k]; na[k] = "unsupported"; }
  if (ctx.coarse) { /* coordinates are rounded, not withheld */ }

  for (const f of FIELDS) if (m[f.key] === undefined && !na[f.key]) na[f.key] = "unsupported";
  for (const k of Object.keys(na)) m[k] = null;
  m.na = na;
  return m;
}

/* ---------- seed data ---------- */
export const SEED_PEOPLE = [
  ["Bruno Palhano", "clayton"], ["Felipe Munoz", "caulfield"], ["Josh Lim", "manila"], ["Chuck Chin", "hongkong"],
  ["Aubrey Yu", "manila"], ["Mia Thompson", "clayton"], ["Liam Nguyen", "caulfield"], ["Priya Sharma", "mumbai"],
  ["Hana Lee", "parkville"], ["Tom Walsh", "peninsula"], ["Aisyah Rahman", "sunway"], ["Wei Zhang", "suzhou"],
  ["Giulia Rossi", "prato"], ["Rizky Pratama", "bsd"], ["Lucas Souza", "saopaulo"], ["Sofia Rojas", "santiago"],
  ["Oliver Smith", "london"], ["Maya Patel", "newyork"], ["Thabo Nkosi", "johannesburg"], ["Wanjiru Kamau", "nairobi"],
  ["Grace Kim", "sydney"], ["Kai Morgan", "perth"], ["Daniel Tan", "sunway"], ["Emma Wilson", "melbcbd"],
];

export const CAPTIONS = {
  good: [
    "Full strength outside {spot}. Taking another one inside to compare.",
    "First standalone 5G I've seen near {spot}. Speed test was wild.",
    "{spot} at lunchtime and it's still solid. Not what I expected.",
    "Clean reading from {spot}. Adding it to my time-of-day series.",
  ],
  fair: [
    "{spot} is okay but RSRQ keeps dropping. Busy cell or interference?",
    "Signal comes and goes at {spot}. Anyone on a different carrier here?",
    "Peak hour at {spot}. I think the tower is just crowded.",
    "Walking past {spot} for this week's challenge. Middle of the pack.",
  ],
  poor: [
    "{spot} dead zone strikes again. Couldn't load the lecture recording.",
    "Basement of {spot}. Moving one floor up added 15 dB, I measured it.",
    "{spot} is rough tonight. Packet loss everywhere.",
    "Anyone else lose signal completely at {spot}? Want to check it's not my phone.",
  ],
};
export const COMMENT_POOL = [
  "Same here on a different carrier, worse at night.",
  "Can you take another one at 6pm? Curious if it's congestion.",
  "Adding this to my time-of-day analysis.",
  "Interesting, my phone doesn't even report SINR.",
  "That's the strongest reading in the city so far.",
  "Is this indoors? Might explain the RSRQ.",
  "Would love a walk session along that route.",
];

export function seedDb() {
  const rnd = makeRng(20261118), now = Date.now(), DAY = 864e5;
  const users = SEED_PEOPLE.map(([name, placeId], i) => ({
    id: uid("u", rnd), name, email: name.split(" ")[0].toLowerCase() + "." + (1000 + i) + "@student.monash.edu",
    placeId, device: pickFrom(rnd, DEVICES.slice(0, 6)).model, verified: true, passHash: null, role: "student", status: "active",
    settings: { coarse: rnd() < 0.8, showName: rnd() < 0.85 }, joinedAt: new Date(now - (30 + rnd() * 60) * DAY).toISOString(),
  }));
  users.push({
    id: "u_demo", name: "Demo Student", email: "demo@student.monash.edu", placeId: "clayton", device: "Google Pixel 8",
    verified: true, passHash: "demo:monash123", role: "student", status: "active",
    settings: { coarse: true, showName: true }, joinedAt: new Date(now - 20 * DAY).toISOString(),
  });

  const posts = [];
  for (let i = 0; i < 150; i++) {
    const user = pickFrom(rnd, users.slice(0, -1));
    const home = PLACE_BY_ID[user.placeId];
    const sameCountry = PLACES.filter((p) => p.cc === home.cc);
    const place = rnd() < 0.8 ? home : pickFrom(rnd, sameCountry);
    const country = COUNTRIES[place.cc];
    const carrier = pickFrom(rnd, country.carriers);
    const device = DEVICE_BY_MODEL[user.device];
    const takenAt = now - rnd() * 21 * DAY;
    const spot = pickFrom(rnd, place.spots);
    const walk = rnd() < 0.1;
    const environment = walk ? "outdoor" : rnd() < 0.55 ? "indoor" : "outdoor";
    const floor = environment === "indoor" ? pickFrom(rnd, [-1, 0, 0, 1, 1, 2, 3, 4]) : null;
    const runSpeed = rnd() < 0.35;
    const base = { place, carrier, device, coarse: user.settings.coarse, environment, floor, spot, runSpeed, contributor: user.id };

    let readings;
    if (walk) {
      const sessionId = uid("ws", rnd), n = 8 + Math.floor(rnd() * 8);
      let lat = place.lat + (rnd() - 0.5) * 0.02, lon = place.lon + (rnd() - 0.5) * 0.02, heading = rnd() * 360;
      readings = Array.from({ length: n }, (_, k) => {
        heading += (rnd() - 0.5) * 50;
        lat += Math.cos((heading * Math.PI) / 180) * 0.0007; lon += Math.sin((heading * Math.PI) / 180) * 0.0009;
        return simulateReading(rnd, { ...base, coarse: false, lat, lon, sessionId, speed: 1.2 + rnd() * 0.5, heading,
          takenAt: new Date(takenAt + k * 15000).toISOString(), runSpeed: false });
      });
    } else {
      readings = [simulateReading(rnd, { ...base, lat: place.lat + (rnd() - 0.5) * 0.03, lon: place.lon + (rnd() - 0.5) * 0.03, takenAt: new Date(takenAt).toISOString() })];
    }
    const q = quality(readings[0]);
    const likes = users.filter(() => rnd() < 0.12).map((u) => u.id);
    posts.push({
      id: uid("p", rnd), userId: user.id, createdAt: readings[readings.length - 1].takenAt,
      kind: walk ? "walk" : "single", readings, likes, reports: [],
      text: rnd() < 0.45 || walk ? pickFrom(rnd, CAPTIONS[q]).replace("{spot}", spot) : "",
      comments: rnd() < 0.25 ? [{ id: uid("c", rnd), userId: pickFrom(rnd, users).id, text: pickFrom(rnd, COMMENT_POOL), at: new Date(takenAt + 3600e3).toISOString() }] : [],
    });
  }
  posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  // A few open reports so the moderation queue has something in it.
  const REASONS = ["inaccurate", "inaccurate", "inappropriate"];
  for (const p of posts.filter(() => rnd() < 0.04)) {
    const reporters = users.filter((u) => u.id !== p.userId && u.id !== "u_demo" && rnd() < 0.1).slice(0, 3);
    if (!reporters.length) continue;
    p.reports = reporters.map((u) => u.id);
    p.reportReasons = reporters.map(() => pickFrom(rnd, REASONS));
  }

  // Monash staff account. Signs in through "Continue with Monash" and sees restricted data.
  users.push({
    id: "u_admin", name: "Monash Admin", email: "admin@monash.edu", placeId: "clayton", device: "Google Pixel 8",
    verified: true, passHash: "demo:admin123", role: "admin", status: "active",
    settings: { coarse: false, showName: true }, joinedAt: new Date(now - 90 * DAY).toISOString(),
  });
  return { version: DB_VERSION, users, posts, audit: [] };
}

/* ---------- manual entry (copied from the phone's Field Test Mode) ---------- */
export const MANUAL_METRICS = {
  rsrp: [-160, -30], rsrq: [-50, 30], sinr: [-40, 60],
  ssRsrp: [-160, -30], ssRsrq: [-50, 30], ssSinr: [-40, 60], rssi: [-160, -20],
};
const LTE_METRICS = ["rsrp", "rsrq", "sinr", "rssi", "cqi", "ta"];
const NR_METRICS = ["ssRsrp", "ssRsrq", "ssSinr"];

// Validates a manual reading and returns a full record in the same shape as an app reading.
// Throws an Error with a message fit to show the student.
export function manualReading(input, user) {
  if (!user) throw new Error("Select a student.");
  const { tech, environment, altitude } = input;
  if (!["LTE", "NR-NSA", "NR-SA", "3G"].includes(tech)) throw new Error("Select a valid technology.");
  if (!["indoor", "outdoor"].includes(environment)) throw new Error("Select a valid environment.");
  if (!Number.isFinite(altitude) || altitude < -500 || altitude > 10000) throw new Error("Enter a valid altitude.");
  const carrier = typeof input.carrier === "string" ? input.carrier.trim() : "";
  const band = typeof input.band === "string" ? input.band.trim() : "";
  if (!carrier || carrier.length > 60 || band.length > 20) throw new Error("Check the carrier and band.");
  const values = {};
  for (const [key, [min, max]] of Object.entries(MANUAL_METRICS)) {
    const value = input[key] ?? null;
    if (value !== null && (!Number.isFinite(value) || value < min || value > max)) throw new Error("Check the signal metric values.");
    values[key] = value;
  }
  if (Object.values(values).every((v) => v === null)) throw new Error("Enter at least one signal metric.");

  const place = PLACE_BY_ID[user.placeId], country = COUNTRIES[place.cc];
  const known = country.carriers.find(([name]) => name.toLowerCase() === carrier.toLowerCase());
  const m = {
    readingId: uid("rd"), takenAt: new Date().toISOString(), tz: place.tz, country: country.name, city: place.city,
    campus: place.campus, spot: null, environment, floor: null,
    lat: Math.round(place.lat * 100) / 100, lon: Math.round(place.lon * 100) / 100, coarse: true, altitude: Math.round(altitude),
    mcc: known?.[1] ?? null, mnc: known?.[2] ?? null, carrier: known?.[0] ?? carrier, tech, band: band || null,
    model: user.device, os: DEVICE_BY_MODEL[user.device]?.os ?? null, appVersion: APP_VERSION,
    contributor: user.id, consentVersion: CONSENT_VERSION, sessionId: null, source: "Manual",
    ...values,
  };
  const na = {};
  for (const f of FIELDS) {
    if (m[f.key] !== undefined && m[f.key] !== null) continue;
    const k = f.key;
    na[k] = tech === "NR-SA" && LTE_METRICS.includes(k) ? "not_applicable"
      : (tech === "LTE" || tech === "3G") && NR_METRICS.includes(k) ? "not_applicable"
      : ["down", "up", "latency", "jitter", "loss"].includes(k) ? "not_run"
      : ["floor", "sessionId", "heading", "speed"].includes(k) || (k === "campus" && !place.campus) ? "not_applicable"
      : "not_entered";
    m[k] = null;
  }
  m.na = na;
  return m;
}
