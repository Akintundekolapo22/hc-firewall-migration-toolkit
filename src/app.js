// Healthcare Firewall Migration Planner: browser UI. MIT License.
import * as C from './content.js';
import * as L from './logic.js';
import { loadLocal, saveLocal, clearLocal, downloadText, readFile } from './storage.js';

let state = loadLocal();
let view = 'home';
const main = document.getElementById('main');
const nav = document.getElementById('steps');
const statusEl = document.getElementById('save-status');

// ---------- tiny DOM helper
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return e;
}

// ---------- state paths
function getPath(path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), state); }
function setPath(path, value) {
  const keys = path.split('.'); let o = state;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null) o[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[keys[i]];
  }
  o[keys.at(-1)] = value;
}

let saveTimer;
function changed() {
  state.updated = new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const ok = saveLocal(state);
    statusEl.textContent = ok ? 'Saved on this device' : 'Not saved: browser storage is blocked. Use "Save to file".';
    statusEl.classList.toggle('warn', !ok);
  }, 250);
  updateComputed();
}

// ---------- bound inputs
let uid = 0;
function input(path, { label, type = 'text', placeholder, cls, labelHidden = true, min, max } = {}) {
  const id = 'f' + (++uid);
  const v = getPath(path) ?? '';
  const e = h('input', { id, type, value: v, 'data-bind': path, placeholder, class: cls, min, max });
  if (type === 'checkbox') { e.checked = !!getPath(path); e.removeAttribute('value'); }
  if (!label) return e;
  return labelHidden ? (e.setAttribute('aria-label', label), e) : h('div', { class: 'field' }, h('label', { for: id, text: label }), e);
}
function textarea(path, label, rows = 2) {
  return h('textarea', { 'data-bind': path, 'aria-label': label, rows, text: getPath(path) ?? '' });
}
function select(path, options, label, { blank = '—' } = {}) {
  const v = getPath(path) ?? '';
  const s = h('select', { 'data-bind': path, 'aria-label': label });
  if (blank != null) s.append(h('option', { value: '', text: blank }));
  for (const o of options) {
    const [val, txt] = Array.isArray(o) ? o : [o, o];
    const opt = h('option', { value: val, text: txt }); if (String(val) === String(v)) opt.selected = true; s.append(opt);
  }
  return s;
}

main.addEventListener('input', onBound);
main.addEventListener('change', onBound);
function onBound(ev) {
  const t = ev.target; const path = t.getAttribute && t.getAttribute('data-bind');
  if (!path) return;
  setPath(path, t.type === 'checkbox' ? t.checked : t.value);
  changed();
}

// ---------- computed bits (update without re-rendering, so focus stays put)
function updateComputed() {
  main.querySelectorAll('[data-calc]').forEach(e => {
    const [kind, arg] = e.getAttribute('data-calc').split(':');
    if (kind === 'score') {
      const s = L.riskScore(state.risks[arg]); const lvl = L.riskLevel(s);
      e.textContent = s ?? '–';
      const lv = main.querySelector(`[data-calc="level:${arg}"]`);
      if (lv) { lv.textContent = lvl || '–'; lv.className = 'pill ' + (lvl ? lvl.toLowerCase() : ''); }
    }
    if (kind === 'rulesummary') e.replaceChildren(ruleSummaryView());
    if (kind === 'auditprogress') e.replaceChildren(auditProgressView());
    if (kind === 'readiness') e.replaceChildren(readinessView());
    if (kind === 'matrix') e.replaceChildren(matrixSummary());
  });
  // Update the nav status dot in place. Re-rendering the nav here would swallow clicks:
  // a text field's "change" event fires on blur, i.e. between mousedown and click on a nav link.
  const dot = nav.querySelector('.dot');
  if (dot) { const ready = L.readiness(state).ready; dot.className = 'dot ' + (ready ? 'ok' : 'no'); dot.title = ready ? 'Ready' : 'Not ready'; }
}

// ---------- shared pieces
function section(title, ...kids) { return h('section', { class: 'card' }, h('h2', { text: title }), ...kids); }
function help(text) { return h('p', { class: 'help', text }); }
function tableWrap(t) { return h('div', { class: 'table-wrap' }, t); }
function btn(text, onclick, cls = 'btn') { return h('button', { type: 'button', class: cls, onclick, text }); }
function rowDelete(list, i) {
  return h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Remove row', title: 'Remove row',
    onclick: () => { state[list].splice(i, 1); changed(); render(); } }, '×');
}
function stepHeader(stepId) {
  const s = C.STEPS.find(x => x.id === stepId);
  return h('div', { class: 'step-head' },
    h('p', { class: 'eyebrow', text: `Step ${s.n} of 5 · Framework ${s.phase}` }),
    h('h1', { text: s.title }), h('p', { class: 'lead', text: s.intro }));
}
function stepFooter(stepId) {
  const i = C.STEPS.findIndex(x => x.id === stepId);
  const prev = i > 0 ? C.STEPS[i - 1] : null; const next = C.STEPS[i + 1];
  return h('div', { class: 'step-foot' },
    prev ? btn('← ' + prev.title, () => go(prev.id), 'btn ghost') : btn('← Home', () => go('home'), 'btn ghost'),
    next ? btn(next.title + ' →', () => go(next.id), 'btn primary') : btn('View report →', () => go('report'), 'btn primary'));
}
const RESULT_OPTS = [['pass', 'Pass'], ['fail', 'Fail']];

// ---------- HOME
function viewHome() {
  const r = L.readiness(state);
  const done = r.checks.filter(c => c.ok).length;
  return h('div', {},
    h('div', { class: 'hero' },
      h('h1', { text: 'Plan a safe firewall migration for your clinic or hospital' }),
      h('p', { class: 'lead', text: 'A free, step-by-step planner for small and mid-sized healthcare organizations. Work through the audit, risks, rule review and rollback plan, then make a recorded go/no-go decision.' }),
      h('div', { class: 'hero-actions' },
        btn(state.updated ? 'Continue where you left off →' : 'Start planning →', () => go('audit'), 'btn primary'),
        h('label', { class: 'btn ghost file-btn' }, 'Open a saved file', h('input', { type: 'file', accept: '.json,application/json', class: 'visually-hidden', onchange: loadFromFile })),
      ),
      h('p', { class: 'privacy' }, h('strong', { text: 'Private by design. ' }), 'The planner runs entirely in your browser. Nothing you type is sent anywhere. Do not enter patient information; the planner needs only system and network details.')),
    h('div', { class: 'grid' }, C.STEPS.map(s => h('button', { type: 'button', class: 'step-card', onclick: () => go(s.id) },
      h('span', { class: 'num', text: s.n }), h('strong', { text: s.title }), h('span', { class: 'muted', text: s.phase })))),
    state.updated ? section('Your progress', h('p', { text: `${done} of ${r.checks.length} readiness checks met. Last change: ${new Date(state.updated).toLocaleString()}.` }),
      h('div', { class: 'row' }, btn('Go to readiness check', () => go('gonogo'), 'btn'), eraseButton())) : null,
    section('Prefer paper or Excel?',
      h('p', { text: 'The same five templates are available as documents you can download, print and fill in.' }),
      h('ul', {},
        h('li', {}, h('a', { href: 'fillable/Firewall_Migration_Worksheets.xlsx', text: 'Excel workbook' }), ': audit worksheet, risk register and rule review'),
        h('li', {}, h('a', { href: 'fillable/Rollback_Plan.docx', text: 'Rollback plan (Word)' })),
        h('li', {}, h('a', { href: 'fillable/Go-No-Go_Signoff.docx', text: 'Go / no-go sign-off form (Word)' })))),
    section('Where this comes from',
      h('p', {}, 'The planner puts into practice the five-phase Secure Migration and Operational Stability Framework: ', C.FRAMEWORK_CITATION, ' ', h('a', { href: C.FRAMEWORK_DOI, text: C.FRAMEWORK_DOI })),
      h('p', { class: 'muted', text: 'Not legal advice and not a compliance certification. Adapt every threshold and step to your own systems.' })));
}
function eraseButton() {
  let armed = false;
  const b = btn('Erase and start over', () => {
    if (!armed) { armed = true; b.textContent = 'Click again to erase everything on this device'; b.classList.add('danger'); return; }
    clearLocal(); state = L.newState(); render();
  }, 'btn ghost');
  return b;
}

// ---------- STEP 1 AUDIT
function auditProgressView() {
  const a = L.auditProgress(state);
  return h('span', { text: `${a.done} of ${a.total} baseline items done · ${a.zones} ${a.zones === 1 ? 'zone' : 'zones'} · ${a.flows} ${a.flows === 1 ? 'flow' : 'flows'}` });
}
function viewAudit() {
  return h('div', {}, stepHeader('audit'),
    h('p', { class: 'progress', 'data-calc': 'auditprogress' }, auditProgressView()),
    section('A. Project details', h('div', { class: 'form-grid' },
      C.PROJECT_FIELDS.map(([k, label]) => input('project.' + k, { label, labelHidden: false })),
      input('project.auditDate', { label: 'Date this audit was completed', type: 'date', labelHidden: false }))),
    section('B. Collect the baseline', help('Mark each item when it is done and saved in your project folder.'),
      tableWrap(h('table', {}, h('thead', {}, h('tr', {}, h('th', { text: 'Item' }), h('th', { text: 'Status' }))),
        h('tbody', {}, C.BASELINE_ITEMS.map(([id, text]) => h('tr', {}, h('td', { text }),
          h('td', {}, select('baseline.' + id, [['yes', 'Done'], ['no', 'Not yet'], ['na', 'Not applicable']], text)))))))),
    section('C. Zones and critical systems', help('Clinical criticality: 1 = patient care stops, 2 = care slowed, 3 = no direct care impact.'),
      editableTable('zones', [
        ['zone', 'Zone'], ['networks', 'Network(s)'], ['systems', 'Main systems', 'wide'],
        ['ephi', 'Holds ePHI?', 'sel', [['Y', 'Yes'], ['N', 'No']]], ['crit', 'Criticality', 'sel', ['1', '2', '3']],
        ['mtd', 'Max downtime'], ['owner', 'Owner']]),
      btn('+ Add zone', () => { state.zones.push({}); changed(); render(); })),
    section('D. Flows that must keep working (or stay blocked)',
      help('Each row is one connection to test. Record results before cutover (in the lab), after cutover, and after any rollback. Include flows that must stay blocked: accidentally opening access is as serious as breaking it.'),
      h('p', { class: 'progress', 'data-calc': 'matrix' }, matrixSummary()),
      editableTable('flows', [
        ['fid', 'ID'], ['src', 'Source'], ['dst', 'Destination'], ['svc', 'Service / port'], ['purpose', 'What it is for', 'wide'],
        ['expect', 'Expected', 'sel', ['Allowed', 'Denied']],
        ['before', 'Before cutover', 'sel', RESULT_OPTS], ['after', 'After cutover', 'sel', RESULT_OPTS], ['rollback', 'After rollback', 'sel', RESULT_OPTS]]),
      h('div', { class: 'row' },
        btn('+ Add flow', () => { state.flows.push({ fid: 'F-' + String(state.flows.length + 1).padStart(2, '0') }); changed(); render(); }),
        btn('Download test matrix (CSV)', () => exportCSV('flows'), 'btn ghost'))),
    section('E. Inspection and security features', help('If a feature has no equivalent on the new firewall, record it as a gap. Do not mark it as covered.'),
      editableTable('inspections', [['feature', 'Feature on current firewall'], ['where', 'Where it applies'], ['equivalent', 'Equivalent on new firewall'],
        ['tested', 'Tested before cutover?', 'sel', [['yes', 'Yes'], ['no', 'No']]], ['note', 'Gap or note', 'wide']]),
      btn('+ Add feature', () => { state.inspections.push({}); changed(); render(); })),
    stepFooter('audit'));
}
function matrixSummary() {
  const n = state.flows.length; if (!n) return h('span', { text: 'No flows yet.' });
  const parts = [['before', 'Before cutover'], ['after', 'After cutover'], ['rollback', 'After rollback']].map(([k, t]) => {
    const r = L.flowResults(state.flows, k); return `${t}: ${r.pass} pass, ${r.fail} fail, ${r.notRun} not run`;
  });
  return h('span', { text: parts.join(' · ') });
}
function editableTable(list, cols) {
  return tableWrap(h('table', { class: 'edit' },
    h('thead', {}, h('tr', {}, cols.map(c => h('th', { text: c[1], class: c[2] === 'wide' ? 'wide' : null })), h('th', { 'aria-label': 'Actions' }))),
    h('tbody', {}, state[list].length ? state[list].map((row, i) => h('tr', {},
      cols.map(([k, label, kind, opts]) => h('td', {}, kind === 'sel' ? select(`${list}.${i}.${k}`, opts, label) : input(`${list}.${i}.${k}`, { label }))),
      h('td', {}, rowDelete(list, i)))) : h('tr', {}, h('td', { colspan: cols.length + 1, class: 'empty', text: 'No rows yet.' })))));
}

// ---------- STEP 2 RISKS
function viewRisks() {
  return h('div', {}, stepHeader('risks'),
    section('How to score',
      h('ul', {},
        h('li', { text: 'Likelihood: 1 rare · 2 unlikely · 3 possible · 4 likely · 5 almost certain' }),
        h('li', { text: 'Impact: 1 minimal · 2 minor · 3 moderate · 4 major (care delayed or ePHI exposed) · 5 severe (care stops or a reportable breach)' }),
        h('li', { text: 'Score = likelihood × impact. 15 or more = High · 8 to 14 = Medium · 7 or less = Low.' })),
      help('R-01 to R-10 come from the framework’s risk table. R-11 to R-13 are added for healthcare.')),
    h('div', { class: 'risk-list' }, state.risks.map((r, i) => h('article', { class: 'risk' },
      h('div', { class: 'risk-top' },
        h('div', {}, h('span', { class: 'rid', text: r.id }),
          r.custom ? input(`risks.${i}.risk`, { label: 'Risk', cls: 'risk-title-input', placeholder: 'Describe the risk' }) : h('strong', { text: r.risk }),
          h('div', { class: 'muted small', text: r.custom ? '' : r.phase })),
        h('div', { class: 'scorebox' },
          h('label', {}, 'Likelihood', select(`risks.${i}.likelihood`, ['1', '2', '3', '4', '5'], `Likelihood for ${r.id}`)),
          h('label', {}, 'Impact', select(`risks.${i}.impact`, ['1', '2', '3', '4', '5'], `Impact for ${r.id}`)),
          h('div', {}, h('div', { class: 'small muted', text: 'Score' }), h('div', { class: 'score', 'data-calc': `score:${i}`, text: L.riskScore(r) ?? '–' })),
          h('span', { class: 'pill ' + (L.riskLevel(L.riskScore(r)).toLowerCase() || ''), 'data-calc': `level:${i}`, text: L.riskLevel(L.riskScore(r)) || '–' }))),
      h('div', { class: 'risk-body' },
        h('div', {}, h('div', { class: 'small muted', text: 'In a healthcare setting' }), r.custom ? input(`risks.${i}.hc`, { label: 'Healthcare impact' }) : h('p', { text: r.hc })),
        h('div', {}, h('div', { class: 'small muted', text: 'Mitigation' }), textarea(`risks.${i}.mitigation`, `Mitigation for ${r.id}`)),
        h('div', { class: 'risk-meta' },
          h('label', {}, 'Owner', input(`risks.${i}.owner`, { label: `Owner for ${r.id}` })),
          h('label', {}, 'Status', select(`risks.${i}.status`, C.RISK_STATUSES, `Status for ${r.id}`, { blank: null })),
          r.custom ? rowDelete('risks', i) : null))))),
    h('div', { class: 'row' },
      btn('+ Add a risk', () => { const n = state.risks.length + 1; state.risks.push({ id: 'R-' + String(n).padStart(2, '0'), risk: '', phase: '', hc: '', mitigation: '', warning: '', likelihood: '', impact: '', owner: '', status: 'Open', custom: true }); changed(); render(); }),
      btn('Download risk register (CSV)', () => exportCSV('risks'), 'btn ghost')),
    stepFooter('risks'));
}

// ---------- STEP 3 RULES
function ruleSummaryView() {
  const s = L.ruleSummary(state.rules);
  return h('span', { text: `${s.total} rules · ${s.total - s.none} reviewed · Keep ${s.Keep} · Unused ${s.Unused} · Shadowed ${s.Shadowed} · Over-broad ${s['Over-broad']} · Duplicate ${s.Duplicate} · No owner ${s['No owner']}` });
}
function viewRules() {
  const ta = h('textarea', { rows: 4, 'aria-label': 'Paste rules as CSV', placeholder: 'Rule ID,Source zone,Source,Destination,Service,Action,Hit count,Hit-count period,Last hit' });
  const msg = h('span', { class: 'small muted', role: 'status' });
  return h('div', {}, stepHeader('rules'),
    section('Findings to choose from', h('dl', { class: 'findings' }, C.FINDINGS.map(([k, d]) => [h('dt', { text: k }), h('dd', { text: d })])),
      help('Zero hits over a short period does not prove a rule is unused: some flows run monthly or yearly. Ask the owner before removing anything. If possible, have someone other than the rule author do the review.')),
    section('Import rules (optional)',
      help('Paste rows exported from your firewall or a spreadsheet, in this column order: Rule ID, Source zone, Source, Destination, Service, Action, Hit count, Hit-count period, Last hit. A header row is fine.'),
      ta, h('div', { class: 'row' }, btn('Add these rules', () => {
        const rows = L.rulesFromCSV(ta.value);
        if (!rows.length) { msg.textContent = 'Nothing to import.'; return; }
        state.rules.push(...rows); changed(); render();
      }), msg)),
    section('Rule review',
      h('p', { class: 'progress', 'data-calc': 'rulesummary' }, ruleSummaryView()),
      editableTable('rules', [
        ['rid', 'Rule ID'], ['srcZone', 'Source zone'], ['src', 'Source'], ['dst', 'Destination'], ['svc', 'Service'], ['action', 'Action'],
        ['hits', 'Hits'], ['period', 'Period'], ['owner', 'Business owner'], ['why', 'Why it exists', 'wide'],
        ['finding', 'Finding', 'sel', C.FINDINGS.map(f => f[0])], ['decision', 'Decision', 'wide'], ['newId', 'New policy ID'], ['testId', 'Test ID'], ['reviewer', 'Reviewer']]),
      h('div', { class: 'row' }, btn('+ Add rule', () => { state.rules.push({}); changed(); render(); }),
        btn('Download rule review (CSV)', () => exportCSV('rules'), 'btn ghost'))),
    stepFooter('rules'));
}

// ---------- STEP 4 ROLLBACK
function viewRollback() {
  const rb = 'rollback.';
  return h('div', {}, stepHeader('rollback'),
    section('Who decides', h('div', { class: 'form-grid' },
      input(rb + 'decisionOwner', { label: 'Rollback decision owner (one person makes the call)', labelHidden: false }),
      input(rb + 'executor', { label: 'Person who carries out the rollback', labelHidden: false }),
      input(rb + 'clinicalContact', { label: 'Clinical or business contact to inform', labelHidden: false }),
      input(rb + 'vendorContact', { label: 'Vendor support contact', labelHidden: false }))),
    section('Rollback triggers', help('Agree these before the window. If any trigger is met, the decision owner rolls back. There is no debate in the moment.'),
      tableWrap(h('table', {}, h('thead', {}, h('tr', {}, h('th', { text: 'Trigger' }), h('th', { text: 'Threshold for this site' }))),
        h('tbody', {}, C.TRIGGERS.map(([id, text]) => h('tr', {}, h('td', { text }), h('td', {}, input(`${rb}triggers.${id}`, { label: text, cls: 'narrow' }))))))),
      input(rb + 'latestStart', { label: 'Latest time to start a rollback (leave time to finish before the window ends)', labelHidden: false })),
    section('Before the cutover starts', h('ul', { class: 'checks' }, C.ROLLBACK_PREREQS.map(([id, text]) => {
      const box = input(`${rb}prereq.${id}`, { type: 'checkbox' }); const lid = 'p' + id; box.id = lid;
      return h('li', {}, box, h('label', { for: lid, text }));
    })),
      h('div', { class: 'form-grid' },
        input(rb + 'rehearsalDate', { label: 'Rollback rehearsed in a lab on', type: 'date', labelHidden: false }),
        input(rb + 'rehearsalMinutes', { label: 'Rehearsal took (minutes)', type: 'number', min: 0, labelHidden: false }))),
    section('Rollback steps', help('Fill in the exact commands or actions for your equipment.'),
      tableWrap(h('table', { class: 'edit' }, h('thead', {}, h('tr', {}, h('th', { text: '#' }), h('th', { text: 'Action', class: 'wide' }), h('th', { text: 'Exact commands or actions', class: 'wide' }), h('th', { text: 'Done by' }))),
        h('tbody', {}, state.rollback.steps.map((s, i) => h('tr', {}, h('td', { text: i + 1 }),
          h('td', {}, input(`${rb}steps.${i}.action`, { label: `Step ${i + 1} action` })),
          h('td', {}, input(`${rb}steps.${i}.detail`, { label: `Step ${i + 1} commands` })),
          h('td', {}, input(`${rb}steps.${i}.by`, { label: `Step ${i + 1} done by` }))))))),
      btn('+ Add step', () => { state.rollback.steps.push({ action: '', detail: '', by: '' }); changed(); render(); })),
    section('Rehearsal and use log', tableWrap(h('table', { class: 'edit' },
      h('thead', {}, h('tr', {}, ['Date', 'Rehearsal or real rollback?', 'Minutes taken', 'Problems found', 'Fixed?'].map(t => h('th', { text: t })), h('th', { 'aria-label': 'Actions' }))),
      h('tbody', {}, state.rollback.log.map((l, i) => h('tr', {},
        h('td', {}, input(`${rb}log.${i}.date`, { label: 'Date', type: 'date' })),
        h('td', {}, select(`${rb}log.${i}.kind`, ['Lab rehearsal', 'Real rollback'], 'Kind')),
        h('td', {}, input(`${rb}log.${i}.minutes`, { label: 'Minutes', type: 'number', cls: 'narrow' })),
        h('td', {}, input(`${rb}log.${i}.problems`, { label: 'Problems found' })),
        h('td', {}, select(`${rb}log.${i}.fixed`, ['Yes', 'No'], 'Fixed?')),
        h('td', {}, h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Remove row', onclick: () => { state.rollback.log.splice(i, 1); changed(); render(); } }, '×'))))))),
      btn('+ Add log entry', () => { state.rollback.log.push({}); changed(); render(); })),
    stepFooter('rollback'));
}

// ---------- STEP 5 GO / NO-GO
function readinessView() {
  const r = L.readiness(state);
  return h('div', {},
    h('p', { class: 'verdict ' + (r.ready ? 'ok' : 'no') },
      r.ready ? 'All readiness checks are met.' : `Not ready yet: ${r.blockers.length} check(s) not met.`),
    h('ul', { class: 'readiness' }, r.checks.map(c => h('li', { class: c.ok ? 'ok' : (c.blocker ? 'no' : 'warn') },
      h('span', { class: 'mark', 'aria-hidden': 'true', text: c.ok ? '✓' : (c.blocker ? '✕' : '!') }),
      h('span', { class: 'visually-hidden', text: c.ok ? 'Met: ' : (c.blocker ? 'Not met: ' : 'Warning: ') }),
      h('strong', { text: c.label }), h('span', { class: 'muted', text: ' — ' + c.detail })))));
}
function viewGoNoGo() {
  const g = 'gonogo.';
  return h('div', {}, stepHeader('gonogo'),
    section('Change details', h('div', { class: 'form-grid' },
      input(g + 'change', { label: 'Change or ticket number', labelHidden: false }),
      input(g + 'meeting', { label: 'Meeting date and time', type: 'datetime-local', labelHidden: false }))),
    section('Readiness check (calculated from steps 1 to 5)', h('div', { 'data-calc': 'readiness' }, readinessView()),
      help('This check helps the meeting. It does not replace the judgement of the people signing.')),
    section('Go / no-go criteria', tableWrap(h('table', { class: 'edit' },
      h('thead', {}, h('tr', {}, h('th', { text: '#' }), h('th', { text: 'Criterion', class: 'wide' }), h('th', { text: 'Met?' }), h('th', { text: 'Evidence (document, test result, ticket)', class: 'wide' }))),
      h('tbody', {}, C.GONOGO_CRITERIA.map(([id, text], i) => h('tr', {}, h('td', { text: i + 1 }), h('td', { text }),
        h('td', {}, select(`${g}criteria.${id}.met`, [['yes', 'Yes'], ['no', 'No'], ['na', 'N/A']], text)),
        h('td', {}, input(`${g}criteria.${id}.evidence`, { label: 'Evidence for ' + text })))))))),
    section('Open issues accepted for this cutover', tableWrap(h('table', { class: 'edit' },
      h('thead', {}, h('tr', {}, h('th', { text: 'Issue', class: 'wide' }), h('th', { text: 'Why it is acceptable', class: 'wide' }), h('th', { text: 'Accepted by' }), h('th', { 'aria-label': 'Actions' }))),
      h('tbody', {}, state.gonogo.issues.map((x, i) => h('tr', {},
        h('td', {}, input(`${g}issues.${i}.issue`, { label: 'Issue' })), h('td', {}, input(`${g}issues.${i}.why`, { label: 'Why acceptable' })),
        h('td', {}, input(`${g}issues.${i}.by`, { label: 'Accepted by' })),
        h('td', {}, h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Remove row', onclick: () => { state.gonogo.issues.splice(i, 1); changed(); render(); } }, '×'))))))),
      btn('+ Add issue', () => { state.gonogo.issues.push({}); changed(); render(); })),
    section('Decision',
      h('div', { class: 'radios', role: 'radiogroup', 'aria-label': 'Decision' }, [['GO', 'Go: all criteria met'], ['GO WITH CONDITIONS', 'Go with conditions'], ['NO-GO', 'No-go']].map(([v, t]) => {
        const id = 'dec-' + v.replace(/\W/g, '');
        const r = h('input', { type: 'radio', name: 'decision', id, value: v, 'data-bind': g + 'decision' }); if (state.gonogo.decision === v) r.checked = true;
        return h('label', { for: id, class: 'radio' }, r, ' ', t);
      })),
      h('label', { class: 'field' }, 'Conditions, reasons or next steps', textarea(g + 'conditions', 'Conditions, reasons or next steps', 3))),
    section('Sign-off', help('The framework requires joint sign-off by the security and operations leads. A clinical representative and the privacy or compliance officer are recommended in healthcare settings. Typing a name here records the decision; keep a signed printout on file.'),
      tableWrap(h('table', { class: 'edit' }, h('thead', {}, h('tr', {}, ['Role', 'Name', 'Decision', 'Date'].map(t => h('th', { text: t })))),
        h('tbody', {}, C.SIGNERS.map(([id, role, req]) => h('tr', {}, h('td', {}, role, req ? h('span', { class: 'req', text: ' (required)' }) : null),
          h('td', {}, input(`${g}signatures.${id}.name`, { label: role + ' name' })),
          h('td', {}, select(`${g}signatures.${id}.decision`, ['Go', 'No-Go'], role + ' decision')),
          h('td', {}, input(`${g}signatures.${id}.date`, { label: role + ' date', type: 'date' })))))))),
    stepFooter('gonogo'));
}

// ---------- REPORT
function kv(rows) { return h('table', { class: 'kv' }, h('tbody', {}, rows.map(([k, v]) => h('tr', {}, h('th', { text: k }), h('td', { text: v || '—' }))))); }
function simpleTable(headers, rows) {
  return tableWrap(h('table', {}, h('thead', {}, h('tr', {}, headers.map(t => h('th', { text: t })))),
    h('tbody', {}, rows.length ? rows.map(r => h('tr', {}, r.map(c => h('td', { text: c ?? '' })))) : h('tr', {}, h('td', { colspan: headers.length, class: 'empty', text: 'None recorded.' })))));
}
function viewReport() {
  const p = state.project; const rb = state.rollback; const g = state.gonogo;
  const label = { yes: 'Done', no: 'Not yet', na: 'N/A', pass: 'Pass', fail: 'Fail' };
  return h('div', { class: 'report' },
    h('div', { class: 'no-print row report-actions' }, btn('Print or save as PDF', () => window.print(), 'btn primary'), btn('Save to file', saveToFile, 'btn ghost')),
    h('h1', { text: 'Firewall migration plan' }),
    h('p', { class: 'muted', text: `${p.org || 'Organization not set'} · Generated ${new Date().toLocaleString()} · Healthcare Firewall Migration Toolkit 1.0.1` }),
    section('Readiness', readinessView(), g.decision ? h('p', {}, h('strong', { text: 'Recorded decision: ' }), g.decision, g.conditions ? ` — ${g.conditions}` : '') : null),
    section('1. Project and audit', kv(C.PROJECT_FIELDS.map(([k, l]) => [l, p[k]]).concat([['Audit completed', p.auditDate]])),
      h('h3', { text: 'Baseline' }), simpleTable(['Item', 'Status'], C.BASELINE_ITEMS.map(([id, t]) => [t, label[state.baseline[id]] || 'Not answered'])),
      h('h3', { text: 'Zones' }), simpleTable(['Zone', 'Networks', 'Systems', 'ePHI', 'Criticality', 'Max downtime', 'Owner'], state.zones.map(z => [z.zone, z.networks, z.systems, z.ephi, z.crit, z.mtd, z.owner])),
      h('h3', { text: 'Test matrix' }), simpleTable(['ID', 'Source', 'Destination', 'Service', 'Expected', 'Before', 'After', 'Rollback'], state.flows.map(f => [f.fid, f.src, f.dst, f.svc, f.expect, label[f.before] || '', label[f.after] || '', label[f.rollback] || ''])),
      h('h3', { text: 'Inspection features' }), simpleTable(['Feature', 'Where', 'Equivalent', 'Tested', 'Note'], state.inspections.map(x => [x.feature, x.where, x.equivalent, x.tested, x.note]))),
    section('2. Risk register', simpleTable(['ID', 'Risk', 'L', 'I', 'Score', 'Level', 'Mitigation', 'Owner', 'Status'],
      state.risks.map(r => { const s = L.riskScore(r); return [r.id, r.risk, r.likelihood, r.impact, s ?? '', L.riskLevel(s), r.mitigation, r.owner, r.status]; }))),
    section('3. Rule review', h('p', {}, ruleSummaryView()), simpleTable(['Rule', 'Source', 'Destination', 'Service', 'Action', 'Hits', 'Finding', 'Decision', 'Reviewer'],
      state.rules.map(r => [r.rid, r.src, r.dst, r.svc, r.action, r.hits, r.finding, r.decision, r.reviewer]))),
    section('4. Rollback plan', kv([['Decision owner', rb.decisionOwner], ['Carried out by', rb.executor], ['Clinical contact', rb.clinicalContact], ['Vendor contact', rb.vendorContact], ['Latest start', rb.latestStart], ['Rehearsed', rb.rehearsalDate ? `${rb.rehearsalDate}${rb.rehearsalMinutes ? `, ${rb.rehearsalMinutes} minutes` : ''}` : '']]),
      h('h3', { text: 'Triggers' }), simpleTable(['Trigger', 'Threshold'], C.TRIGGERS.map(([id, t]) => [t, rb.triggers[id]])),
      h('h3', { text: 'Prerequisites' }), simpleTable(['Item', 'Done'], C.ROLLBACK_PREREQS.map(([id, t]) => [t, rb.prereq[id] ? 'Yes' : 'No'])),
      h('h3', { text: 'Steps' }), simpleTable(['#', 'Action', 'Commands', 'By'], rb.steps.map((s, i) => [i + 1, s.action, s.detail, s.by]))),
    section('5. Go / no-go', kv([['Change', g.change], ['Meeting', g.meeting], ['Decision', g.decision], ['Conditions', g.conditions]]),
      simpleTable(['Criterion', 'Met', 'Evidence'], C.GONOGO_CRITERIA.map(([id, t]) => [t, label[g.criteria[id]?.met] || '', g.criteria[id]?.evidence || ''])),
      h('h3', { text: 'Sign-off' }), simpleTable(['Role', 'Name', 'Decision', 'Date', 'Signature'], C.SIGNERS.map(([id, role]) => { const s = g.signatures[id] || {}; return [role, s.name, s.decision, s.date, '']; }))),
    h('p', { class: 'muted small', text: `Based on ${C.FRAMEWORK_CITATION} ${C.FRAMEWORK_DOI}. Not legal advice and not a compliance certification.` }));
}

// ---------- exports, save, load
const CSV_COLS = {
  flows: [['fid', 'ID'], ['src', 'Source'], ['dst', 'Destination'], ['svc', 'Service'], ['purpose', 'Purpose'], ['expect', 'Expected'], ['before', 'Before cutover'], ['after', 'After cutover'], ['rollback', 'After rollback']],
  risks: [['id', 'ID'], ['risk', 'Risk'], ['phase', 'Phase'], ['likelihood', 'Likelihood'], ['impact', 'Impact'], ['score', 'Score'], ['level', 'Level'], ['hc', 'Healthcare impact'], ['mitigation', 'Mitigation'], ['owner', 'Owner'], ['status', 'Status']],
  rules: [['rid', 'Rule ID'], ['srcZone', 'Source zone'], ['src', 'Source'], ['dst', 'Destination'], ['svc', 'Service'], ['action', 'Action'], ['hits', 'Hit count'], ['period', 'Hit-count period'], ['lastHit', 'Last hit'], ['owner', 'Business owner'], ['why', 'Why it exists'], ['finding', 'Finding'], ['decision', 'Decision'], ['newId', 'New policy ID'], ['testId', 'Test ID'], ['reviewer', 'Reviewer']],
};
function exportCSV(list) {
  let rows = state[list];
  if (list === 'risks') rows = rows.map(r => { const s = L.riskScore(r); return { ...r, score: s ?? '', level: L.riskLevel(s) }; });
  downloadText(`${list === 'flows' ? 'test-matrix' : list === 'risks' ? 'risk-register' : 'rule-review'}.csv`, L.toCSV(rows, CSV_COLS[list]), 'text/csv');
}
function saveToFile() {
  const name = (state.project.org || 'firewall-migration').replace(/[^\w-]+/g, '-').toLowerCase();
  downloadText(`${name}-plan-${new Date().toLocaleDateString('en-CA')}.json`, JSON.stringify(state, null, 2));
}
async function loadFromFile(ev) {
  const f = ev.target.files && ev.target.files[0]; if (!f) return;
  try { state = await readFile(f); saveLocal(state); go('audit'); statusEl.textContent = 'Opened ' + f.name; }
  catch (e) { statusEl.textContent = e.message; statusEl.classList.add('warn'); }
}
document.getElementById('save-file').addEventListener('click', saveToFile);
document.getElementById('open-file').addEventListener('change', loadFromFile);

// On GitHub Pages (user.github.io/repo/), point "Source on GitHub" at the repository.
(() => {
  const a = document.getElementById('source-link'); const m = location.hostname.match(/^([\w-]+)\.github\.io$/i);
  if (a && m) { const repo = location.pathname.split('/').filter(Boolean)[0]; a.href = `https://github.com/${m[1]}/${repo || m[1] + '.github.io'}`; }
})();

// ---------- navigation
function renderNav() {
  const r = L.readiness(state);
  nav.replaceChildren(
    h('a', { href: '#home', class: view === 'home' ? 'active' : null, 'aria-current': view === 'home' ? 'page' : null, text: 'Home' }),
    ...C.STEPS.map(s => h('a', { href: '#' + s.id, class: view === s.id ? 'active' : null, 'aria-current': view === s.id ? 'page' : null },
      h('span', { class: 'n', text: s.n }), h('span', { class: 't', text: s.title }))),
    h('a', { href: '#report', class: 'report-link ' + (view === 'report' ? 'active' : ''), 'aria-current': view === 'report' ? 'page' : null },
      'Report', h('span', { class: 'dot ' + (r.ready ? 'ok' : 'no'), title: r.ready ? 'Ready' : 'Not ready' })));
}
const VIEWS = { home: viewHome, audit: viewAudit, risks: viewRisks, rules: viewRules, rollback: viewRollback, gonogo: viewGoNoGo, report: viewReport };
function render() { uid = 0; main.replaceChildren(VIEWS[view]()); renderNav(); }
function go(v) { if (location.hash !== '#' + v) location.hash = v; else { view = v; render(); } window.scrollTo(0, 0); }
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); view = VIEWS[v] ? v : 'home'; render(); main.focus({ preventScroll: true }); window.scrollTo(0, 0); });
view = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'home';
render();
