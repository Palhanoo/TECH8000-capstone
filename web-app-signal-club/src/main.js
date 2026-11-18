import { landPath } from './land-path.js';
import './style.css';
import { loadDb, onDbChange, students as studentsOf, readings as readingsOf, addManualReading } from '../../shared/store.js';

// Students and readings come from the data shared with the other Signal Club apps on this site.
let db = loadDb();
let students, people, countries;
function loadStudents() {
  students = studentsOf(db);
  people = new Map(students.map(student => [student.id, student]));
  countries = [...new Set(students.map(student => student.country))].sort();
}
loadStudents();
const technologies = ['LTE', 'NR-NSA', 'NR-SA', '3G'];
const techLabels = { LTE: '4G LTE', 'NR-NSA': '5G NSA', 'NR-SA': '5G SA', '3G': '3G' };
const metrics = [
  ['rsrp', 'RSRP', 'dBm', -160, -30], ['rsrq', 'RSRQ', 'dB', -50, 30],
  ['sinr', 'SINR', 'dB', -40, 60], ['ssRsrp', 'SS-RSRP', 'dBm', -160, -30],
  ['ssRsrq', 'SS-RSRQ', 'dB', -50, 30], ['ssSinr', 'SS-SINR', 'dB', -40, 60],
  ['rssi', 'RSSI', 'dBm', -160, -20],
];
const icons = {
  signal: '<path d="M4 20v-3m5 3v-7m5 7V9m5 11V4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  chat: '<path d="M20 11a8 8 0 0 1-8 8H4l1.5-4A8 8 0 1 1 20 11Z"/><path d="M8 11h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  flask: '<path d="M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 16h10"/>',
};
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const options = values => values.map(value => `<option>${value}</option>`).join('');
const studentsOptions = () => students.map(({id, name, country}) => `<option value="${id}">${escape(name)} · ${country}</option>`).join('');
const $ = selector => document.querySelector(selector);
const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
const format = (value, unit = '') => value == null ? '—' : `${value}${unit ? ' ' + unit : ''}`;
const flag = code => String.fromCodePoint(...[...code].map(letter => 127397 + letter.charCodeAt(0)));
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

$('#app').innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="#overview"><span class="brand-mark">${icon('signal')}</span><span>Signal Club<small>NETWORK RESEARCH</small></span></a>
    <nav aria-label="Workspace">
      <a href="#overview">${icon('grid')} Overview</a>
      <a href="#map">${icon('globe')} World map</a>
      <a href="#readings">${icon('data')} Field readings</a>
      <a href="#community">${icon('users')} Community</a>
      <a href="#examples">${icon('flask')} Examples</a>
    </nav>
    <div class="sidebar-footer"><span class="avatar dark">SC</span><div>Student workspace<small>TECH8000 Capstone</small></div></div>
  </aside>
  <main id="overview">
    <header class="top"><span>Workspace <span class="divider">/</span> Network dashboard</span><span class="demo"><i></i> Demo dataset</span></header>
    <div class="content">
      <section class="intro" aria-labelledby="title">
        <div><h1 id="title">Network dashboard</h1><p>Explore mobile signal readings from students around the world.</p></div>
        <button class="primary" id="open-reading">${icon('plus')} Add reading</button>
      </section>
      <section id="stats" class="stats" aria-label="Dataset summary"></section>
      <section class="panel world" id="map" aria-labelledby="map-title">
        <div class="section-heading"><div><h2 id="map-title">World map</h2><p>Select a point to see each student at that location.</p></div></div>
        <figure class="map-frame">
          <div class="map-stage">
            <svg class="world-svg" viewBox="0 0 1000 500" aria-hidden="true">
              <rect class="ocean" width="1000" height="500"></rect>
              <path class="land" d="${landPath}"></path>
            </svg>
            <div id="markers"></div>
          </div>
          <figcaption>City coordinates from the demo dataset. Students within 80 km share a point.</figcaption>
        </figure>
      </section>
      <div class="workspace">
        <div class="research">
          <div class="charts">
            <section class="panel chart"><h2>Signal by altitude</h2><p>4G LTE RSRP (dBm) by elevation (m)</p><div id="scatter"></div></section>
            <section class="panel chart"><h2>Network mix</h2><p>Readings by radio technology</p><div id="mix"></div></section>
          </div>
          <section class="panel readings" id="readings">
            <div class="section-heading"><div><h2>Field readings</h2><p id="reading-count"></p></div><button id="export">${icon('download')} Export CSV</button></div>
            <div class="filters">
              <label>Country<select id="country"><option value="">All countries</option>${options(countries)}</select></label>
              <label>Technology<select id="technology"><option value="">All technologies</option>${options(technologies)}</select></label>
            </div>
            <div class="table-scroll" tabindex="0" role="region" aria-label="Field readings table">
              <table><thead><tr>${['Student / device', 'Carrier', 'Network', 'Band', 'Altitude', 'RSRP', 'RSRQ', 'SINR', 'SS-RSRP', 'SS-RSRQ', 'SS-SINR', 'RSSI', 'Setting', 'Source', 'Date'].map(title => `<th scope="col">${title}</th>`).join('')}</tr></thead><tbody id="rows"></tbody></table>
            </div>
            <p class="data-note" id="api-status" role="status"></p>
          </section>
          <section class="panel examples" id="examples">
            <h2>Research examples</h2>
            <details><summary>Does 4G signal change with altitude?</summary><p>Filter for LTE, then compare points in the altitude chart. Values closer to zero indicate stronger RSRP. Use CSV to compare within the same carrier and indoor or outdoor setting before drawing conclusions.</p></details>
            <details><summary>How does the network mix vary by country?</summary><p>Choose a country and compare the proportions of LTE, 5G NSA and 5G SA. Use the reading counts to check sample size. The demo data illustrates the workflow.</p></details>
            <details><summary>What should I enter from Field Test Mode?</summary><p>Choose the student and record the carrier, technology, band if available, and altitude in metres. Enter LTE RSRP, RSRQ and SINR or their 5G SS equivalents when reported. Leave unavailable metrics blank.</p></details>
          </section>
        </div>
        <section class="panel community" id="community">
          <div class="section-heading"><div><h2>Community</h2><p>Connect with your cohort</p></div><span class="badge" id="student-count"></span></div>
          <label class="search">Find a student<input id="search" type="search" placeholder="Search name or country"></label>
          <div id="directory"></div>
        </section>
      </div>
    </div>
  </main>
  <dialog id="profile" aria-labelledby="profile-title" closedby="any">
    <div class="dialog-heading"><div><h2 id="profile-title"></h2><p id="profile-place"></p></div><button class="close" data-close="profile" aria-label="Close profile" autofocus>${icon('close')}</button></div>
    <ul id="profile-list"></ul>
  </dialog>
  <dialog id="chat" aria-labelledby="chat-title">
    <div class="dialog-heading"><div><h2 id="chat-title"></h2><p id="chat-subtitle"></p></div><button class="close" data-close="chat" aria-label="Close chat">${icon('close')}</button></div>
    <div id="messages" role="log" aria-label="Messages"></div>
    <form id="compose"><input name="message" aria-label="Message" placeholder="Write a message…" required maxlength="1000" autofocus><button class="primary">Send</button></form>
  </dialog>
  <dialog id="capture" aria-labelledby="capture-title">
    <div class="dialog-heading"><div><h2 id="capture-title">Add a field reading</h2><p>Copy the values from your phone’s Field Test Mode.</p></div><button class="close" data-close="capture" aria-label="Close reading form">${icon('close')}</button></div>
    <form id="capture-form">
      <div class="form-grid">
        <label>Student<select name="studentId" required><option value="">Select student</option>${studentsOptions()}</select></label>
        <label>Carrier<input name="carrier" required maxlength="60" placeholder="e.g. Telstra"></label>
        <label>Technology<select name="tech">${options(technologies)}</select></label>
        <label>Environment<select name="environment">${options(['outdoor', 'indoor'])}</select></label>
        <label>Altitude (m)<input name="altitude" type="number" required min="-500" max="10000" step="any"></label>
        <label>Band<input name="band" maxlength="20" placeholder="e.g. B3"></label>
        ${metrics.map(([key, label, unit, min, max]) => `<label>${label} (${unit})<input name="${key}" type="number" min="${min}" max="${max}" step="any"></label>`).join('')}
      </div>
      <p class="data-note">Enter at least one signal metric.</p>
      <p id="capture-status" role="status"></p>
      <button class="primary" type="submit">Save reading</button>
    </form>
  </dialog>
`;

let filtered = [];
let activeStudent;
let mapClusters = [];
let conversations = {};
try { conversations = JSON.parse(localStorage.getItem('signal-club-chat') || '{}') ?? {}; } catch { /* use session state */ }

function renderChart(readings) {
  const points = readings.filter(r => Number.isFinite(r.rsrp) && Number.isFinite(r.altitude));
  const min = Math.min(0, ...points.map(r => Math.floor(r.altitude / 500) * 500));
  const max = Math.max(500, ...points.map(r => Math.ceil(r.altitude / 500) * 500));
  const scale = (value, start, end) => (value - start) / (end - start) * 100;
  $('#scatter').innerHTML = points.length ? `
    <div class="plot" role="img" aria-label="Scatter chart of ${points.length} LTE RSRP measurements by altitude. Values are in the field readings table.">
      <div class="y-labels"><span>−30</span><span>−73</span><span>−117</span><span>−160</span></div>
      <div class="plot-area">${points.map(r => `<span class="dot" style="--x:${scale(r.altitude, min, max)}%;--y:${scale(r.rsrp, -160, -30)}%" title="${r.altitude} m · ${r.rsrp} dBm"></span>`).join('')}</div>
      <div class="x-labels"><span>${min}</span><span>${Math.round((min + max) / 2)}</span><span>${max}</span></div>
    </div>` : '<p class="empty">No LTE RSRP values in this selection.</p>';

  const labels = ['4G LTE', '5G NSA', '5G SA', '3G'];
  $('#mix').innerHTML = technologies.map((tech, index) => {
    const count = readings.filter(r => r.tech === tech).length;
    const share = readings.length ? Math.round(count / readings.length * 100) : 0;
    return `<div class="bar-row"><div><span>${labels[index]}</span><strong>${count} <small>(${share}%)</small></strong></div>
      <div class="track"><span style="width:${share}%"></span></div></div>`;
  }).join('');
}

function render() {
  const readings = readingsOf(db).filter(r => people.has(r.contributor)).map(r => ({ ...r, studentId: r.contributor }));
  const stats = [
    ['users', students.length, 'Students'],
    ['globe', countries.length, 'Countries & regions'],
    ['data', readings.length, 'Field readings'],
    ['signal', new Set(readings.map(r => r.carrier)).size, 'Network providers'],
  ];
  $('#stats').innerHTML = stats.map(([symbol, count, label]) => `<article class="panel stat"><span class="stat-icon">${icon(symbol)}</span><div><strong>${count}</strong><span>${label}</span></div></article>`).join('');
  const country = $('#country').value;
  const tech = $('#technology').value;
  filtered = readings.filter(r => (!country || people.get(r.studentId).country === country) && (!tech || tech === r.tech));
  $('#reading-count').textContent = `${filtered.length} of ${readings.length} readings`;
  $('#export').disabled = filtered.length === 0;
  $('#rows').innerHTML = filtered.map(r => {
    const student = people.get(r.studentId);
    return `<tr><th scope="row">${escape(student.name)}<small>${student.device} · ${student.country}</small></th>
      <td>${escape(r.carrier)}</td><td><span class="badge">${r.tech}</span></td><td>${escape(format(r.band))}</td>
      <td>${format(r.altitude, 'm')}</td>${metrics.map(([key, , unit]) => `<td>${format(r[key], unit)}</td>`).join('')}
      <td>${r.environment}</td><td>${r.source}</td><td>${date.format(new Date(r.takenAt))}</td></tr>`;
  }).join('') || '<tr><td colspan="15">No readings match these filters.</td></tr>';
  renderChart(filtered);
}

function kmBetween(a, b) {
  const toRad = degrees => degrees * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function clusterStudents(list) {
  const clusters = [];
  for (const student of list) {
    const match = clusters.find(cluster => cluster.members.some(member => kmBetween(member, student) <= 80));
    if (match) {
      match.members.push(student);
      match.lat = match.members.reduce((sum, member) => sum + member.lat, 0) / match.members.length;
      match.lng = match.members.reduce((sum, member) => sum + member.lng, 0) / match.members.length;
    } else clusters.push({ lat: student.lat, lng: student.lng, members: [student] });
  }
  return clusters;
}

function signalSummary(reading) {
  if (!reading) return 'No readings yet';
  const metric = reading.rsrp != null ? `${reading.rsrp} dBm RSRP`
    : reading.ssRsrp != null ? `${reading.ssRsrp} dBm SS-RSRP`
    : reading.rssi != null ? `${reading.rssi} dBm RSSI` : 'no signal metric';
  return `${techLabels[reading.tech] || reading.tech} · ${reading.carrier} · ${metric} · ${date.format(new Date(reading.takenAt))}`;
}

function renderMap() {
  mapClusters = clusterStudents(students);
  $('#markers').innerHTML = mapClusters.map((cluster, index) => {
    const x = (cluster.lng + 180) / 360 * 100;
    const y = (90 - cluster.lat) / 180 * 100;
    const count = cluster.members.length;
    const label = count === 1
      ? `${cluster.members[0].name}, ${cluster.members[0].city}, ${cluster.members[0].country}`
      : `${count} students: ${cluster.members.map(student => student.name).join(', ')}`;
    return `<button class="pin" type="button" data-cluster="${index}" style="--x:${x}%;--y:${y}%">
      <span class="pin-dot" aria-hidden="true">${count > 1 ? count : ''}</span>
      <span class="visually-hidden">${escape(label)}</span>
    </button>`;
  }).join('');
}

function renderProfile(members) {
  $('#profile-title').textContent = members.length === 1 ? members[0].name : `${members.length} students`;
  $('#profile-place').textContent = [...new Set(members.map(student => `${student.city}, ${student.country}`))].join(' · ');
  const readings = readingsOf(db).filter(reading => people.has(reading.contributor)).map(reading => ({ ...reading, studentId: reading.contributor }));
  $('#profile-list').innerHTML = members.map(student => {
    const own = readings.filter(reading => reading.studentId === student.id)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    return `<li>
      <div class="profile-person">
        <span class="avatar" style="--tone:${students.indexOf(student) % 4}">${student.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>
        <div><strong>${escape(student.name)}</strong><small>${flag(student.code)} ${escape(student.city)}, ${escape(student.country)}</small></div>
        <button class="message" type="button" data-person="${student.id}">${icon('chat')}<span class="visually-hidden">Message ${escape(student.name)}</span></button>
      </div>
      <dl>
        <div><dt>Device</dt><dd>${escape(student.device)}</dd></div>
        <div><dt>Readings</dt><dd>${own.length}</dd></div>
        <div><dt>Latest signal</dt><dd>${escape(signalSummary(own[0]))}</dd></div>
      </dl>
    </li>`;
  }).join('');
}

function openChat(student) {
  activeStudent = student;
  $('#chat-title').textContent = student.name;
  $('#chat-subtitle').textContent = student.country + ' · Demo chat';
  $('#compose').reset();
  $('#chat').showModal();
  renderMessages();
}

function renderDirectory() {
  const query = $('#search').value.trim().toLowerCase();
  $('#student-count').textContent = `${students.length} students`;
  const matches = students.filter(s => `${s.name} ${s.city} ${s.country}`.toLowerCase().includes(query));
  $('#directory').innerHTML = matches.map((s, i) => `<button class="person" type="button" data-person="${s.id}" style="--tone:${i % 4}">
    <span class="avatar">${s.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>
    <span class="person-info"><strong>${escape(s.name)}</strong><small>${flag(s.code)} ${s.country} · ${s.city}</small></span>
    ${icon('chat')}</button>`).join('') || '<p class="empty">No students found.</p>';
}

function renderMessages() {
  const history = conversations[activeStudent.id] || [];
  $('#messages').replaceChildren();
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Start a conversation with ' + activeStudent.name + '.';
    $('#messages').append(empty);
  }
  for (const message of history) {
    const bubble = document.createElement('p');
    bubble.className = 'message';
    bubble.textContent = message;
    const status = document.createElement('small');
    status.textContent = '✓ Sent (demo)';
    bubble.append(status);
    $('#messages').append(bubble);
  }
  $('#messages').scrollTop = $('#messages').scrollHeight;
}

$('#directory').addEventListener('click', event => {
  const button = event.target.closest('[data-person]');
  if (!button) return;
  openChat(people.get(button.dataset.person));
});
$('#markers').addEventListener('click', event => {
  const button = event.target.closest('[data-cluster]');
  if (!button) return;
  renderProfile(mapClusters[button.dataset.cluster].members);
  $('#profile').showModal();
});
$('#profile-list').addEventListener('click', event => {
  const button = event.target.closest('[data-person]');
  if (!button) return;
  const student = people.get(button.dataset.person);
  $('#profile').close();
  openChat(student);
});
$('#compose').addEventListener('submit', event => {
  event.preventDefault();
  const value = event.target.elements.message.value.trim();
  if (!value) return;
  (conversations[activeStudent.id] ??= []).push(value);
  try { localStorage.setItem('signal-club-chat', JSON.stringify(conversations)); } catch { /* keep current session */ }
  event.target.reset();
  renderMessages();
  event.target.elements.message.focus();
});
$('#search').addEventListener('input', renderDirectory);
$('#country').addEventListener('change', render);
$('#technology').addEventListener('change', render);
$('#open-reading').addEventListener('click', () => { $('#capture-status').textContent = ''; $('#capture').showModal(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $('#' + button.dataset.close).close()));
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (event, dialog) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', event => { pressedOutside = outside(event, dialog); });
    dialog.addEventListener('pointerup', event => { if (pressedOutside && outside(event, dialog)) dialog.close(); });
  }
}

$('#export').addEventListener('click', () => {
  const columns = ['studentId', 'country', 'city', 'device', 'carrier', 'tech', 'band', 'altitude', ...metrics.map(([key]) => key), 'environment', 'source', 'takenAt'];
  const csvCell = value => {
    const text = String(value ?? '');
    const safe = typeof value === 'string' && /^[\s]*[=+\-@]|^[\t\r\n]/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const csv = [columns.join(','), ...filtered.map(r => {
    const { country, city, device } = people.get(r.studentId);
    const row = { ...r, country, city, device };
    return columns.map(key => csvCell(row[key])).join(',');
  })].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'signal-club-readings.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('#capture-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const input = Object.fromEntries(new FormData(form));
  for (const key of ['altitude', ...metrics.map(([key]) => key)]) {
    input[key] = input[key] === '' ? null : Number(input[key]);
  }
  try {
    addManualReading(db, input.studentId, input);
    $('#country').value = '';
    $('#technology').value = '';
    render();
    form.reset();
    $('#capture').close();
    $('#api-status').textContent = 'Reading saved. It also appears in the Signal Club app feed.';
    $('#readings').scrollIntoView({ block: 'start' });
  } catch (error) {
    $('#capture-status').textContent = error.message;
  }
});

function updateNavigation() {
  const current = location.hash || '#overview';
  document.querySelectorAll('nav a').forEach(link => {
    if (link.hash === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange', updateNavigation);
updateNavigation();
// The Signal Club app changed the shared data (new reading, new student, deleted post).
onDbChange(fresh => {
  db = fresh;
  loadStudents();
  const country = $('#country').value;
  $('#country').innerHTML = `<option value="">All countries</option>${options(countries)}`;
  $('#country').value = countries.includes(country) ? country : '';
  $('#capture-form').elements.studentId.innerHTML = `<option value="">Select student</option>${studentsOptions()}`;
  renderDirectory();
  renderMap();
  render();
});

renderDirectory();
renderMap();
render();
$('#api-status').textContent = 'Shared with the Signal Club app on this site. Readings are saved in this browser.';
