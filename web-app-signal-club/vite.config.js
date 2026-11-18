import { defineConfig } from 'vite';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const storage = new URL('./.signal-club/', import.meta.url);
const readingsFile = new URL('readings.ndjson', storage);
const demo = JSON.parse(readFileSync(new URL('./src/demo.json', import.meta.url), 'utf8'));
const students = new Set(demo.students.map(({ id }) => id));
const metrics = {
  rsrp: [-160, -30], rsrq: [-50, 30], sinr: [-40, 60],
  ssRsrp: [-160, -30], ssRsrq: [-50, 30], ssSinr: [-40, 60], rssi: [-160, -20],
};

function validate(input) {
  if (!input || !students.has(input.studentId)) throw new Error('Select a student.');
  const { studentId, tech, environment, altitude } = input;
  if (!['LTE', 'NR-NSA', 'NR-SA', '3G'].includes(tech)) throw new Error('Select a valid technology.');
  if (!['indoor', 'outdoor'].includes(environment)) throw new Error('Select a valid environment.');
  if (!Number.isFinite(altitude) || altitude < -500 || altitude > 10000) throw new Error('Enter a valid altitude.');
  const carrier = typeof input.carrier === 'string' ? input.carrier.trim() : '';
  const band = typeof input.band === 'string' ? input.band.trim() : '';
  if (!carrier || carrier.length > 60 || band.length > 20) throw new Error('Check the carrier and band.');
  const values = {};
  for (const [key, [min, max]] of Object.entries(metrics)) {
    const value = input[key] ?? null;
    if (value !== null && (!Number.isFinite(value) || value < min || value > max)) {
      throw new Error('Check the signal metric values.');
    }
    values[key] = value;
  }
  if (Object.values(values).every(value => value === null)) throw new Error('Enter at least one signal metric.');
  return { id: randomUUID(), takenAt: new Date().toISOString(), studentId, tech, environment,
    altitude, carrier, band: band || null, ...values, source: 'Submitted' };
}

async function readingsApi(req, res, next) {
  if (new URL(req.url, 'http://localhost').pathname !== '/api/readings') return next();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, data) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };

  if (req.method === 'GET') {
    try {
      const records = readFileSync(readingsFile, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
      return send(200, records);
    } catch (error) {
      return error.code === 'ENOENT' ? send(200, []) : send(500, { error: 'Could not load saved readings.' });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return send(405, { error: 'Method not allowed.' });
  }
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
    return send(415, { error: 'Use application/json.' });
  }

  let record;
  try {
    let body = '';
    for await (const chunk of req.iterator({ destroyOnReturn: false })) {
      body += chunk;
      if (body.length > 8192) return send(413, { error: 'Reading is too large.' });
    }
    record = validate(JSON.parse(body));
  } catch (error) {
    return send(400, { error: error instanceof SyntaxError ? 'Invalid JSON.' : error.message });
  }
  try {
    mkdirSync(storage, { recursive: true });
    appendFileSync(readingsFile, JSON.stringify(record) + '\n');
    return send(201, record);
  } catch {
    return send(500, { error: 'Could not save the reading.' });
  }
}

export default defineConfig({
  plugins: [{
    name: 'signal-club-readings',
    configureServer(server) { server.middlewares.use(readingsApi); },
    configurePreviewServer(server) { server.middlewares.use(readingsApi); },
  }],
});
