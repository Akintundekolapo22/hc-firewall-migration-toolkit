// Pure functions: no DOM, no storage. Tested in test/logic.test.mjs.
import { BASELINE_ITEMS, RISKS, ROLLBACK_PREREQS, TRIGGERS, DEFAULT_ROLLBACK_STEPS, GONOGO_CRITERIA, SIGNERS } from './content.js';

export const STATE_VERSION = 1;

export function newState() {
  return {
    app: 'hc-firewall-migration-planner',
    version: STATE_VERSION,
    updated: null,
    project: {},
    baseline: {},
    zones: [],
    flows: [],
    inspections: [],
    risks: RISKS.map(r => ({ ...r, likelihood: '', impact: '', owner: '', status: 'Open', custom: false })),
    rules: [],
    rollback: {
      decisionOwner: '', executor: '', clinicalContact: '', vendorContact: '',
      triggers: Object.fromEntries(TRIGGERS.map(([id, , def]) => [id, def])),
      latestStart: '', prereq: {}, rehearsalDate: '', rehearsalMinutes: '',
      steps: DEFAULT_ROLLBACK_STEPS.map(action => ({ action, detail: '', by: '' })),
      log: [],
    },
    gonogo: { change: '', meeting: '', criteria: {}, issues: [], decision: '', conditions: '', signatures: {} },
  };
}

// ---------- Risk scoring
export function riskScore(r) {
  const l = Number(r.likelihood), i = Number(r.impact);
  if (!Number.isInteger(l) || !Number.isInteger(i) || l < 1 || l > 5 || i < 1 || i > 5) return null;
  return l * i;
}
export function riskLevel(score) {
  if (score == null) return '';
  if (score >= 15) return 'High';
  if (score >= 8) return 'Medium';
  return 'Low';
}
const ADDRESSED = new Set(['Mitigated', 'Accepted', 'Closed']);
export function openHighRisks(risks) {
  return risks.filter(r => riskLevel(riskScore(r)) === 'High' && (!String(r.owner || '').trim() || !ADDRESSED.has(r.status)));
}

// ---------- Rules
export function ruleSummary(rules) {
  const s = { total: rules.length, none: 0, Keep: 0, Unused: 0, Shadowed: 0, 'Over-broad': 0, Duplicate: 0, 'No owner': 0 };
  for (const r of rules) {
    if (!r.finding) s.none++;
    else if (r.finding in s) s[r.finding]++;
  }
  return s;
}

// ---------- Audit
export function auditProgress(state) {
  const answered = BASELINE_ITEMS.filter(([id]) => state.baseline[id]).length;
  const done = BASELINE_ITEMS.filter(([id]) => ['yes', 'na'].includes(state.baseline[id])).length;
  return { answered, done, total: BASELINE_ITEMS.length, zones: state.zones.length, flows: state.flows.length };
}

// ---------- Test matrix
const STAGES = ['before', 'after', 'rollback'];
export function flowResults(flows, stage) {
  if (!STAGES.includes(stage)) throw new Error('unknown stage ' + stage);
  const out = { pass: 0, fail: 0, notRun: 0 };
  for (const f of flows) {
    const v = f[stage];
    if (v === 'pass') out.pass++;
    else if (v === 'fail') out.fail++;
    else out.notRun++;
  }
  return out;
}

// ---------- Readiness (feeds the go/no-go step)
export function readiness(state) {
  const checks = [];
  const add = (id, label, ok, detail, blocker = true) => checks.push({ id, label, ok, detail, blocker });

  const a = auditProgress(state);
  add('audit', 'Audit baseline complete', a.done === a.total,
    `${a.done} of ${a.total} baseline items done or not applicable`);
  add('zones', 'Zones listed', a.zones > 0, a.zones ? `${a.zones} zone(s)` : 'No zones listed yet');
  add('flows', 'Flows to test listed', a.flows > 0, a.flows ? `${a.flows} flow(s)` : 'No flows listed yet');

  const unrated = state.risks.filter(r => riskScore(r) == null).length;
  add('rated', 'All risks rated', unrated === 0, unrated ? `${unrated} risk(s) not rated yet` : 'All rated');
  const high = openHighRisks(state.risks);
  add('high', 'High risks owned and addressed', high.length === 0,
    high.length ? `Open: ${high.map(r => r.id).join(', ')}` : 'None open');

  const rs = ruleSummary(state.rules);
  add('rules', 'Every rule has a finding', rs.total > 0 && rs.none === 0,
    rs.total ? `${rs.total - rs.none} of ${rs.total} reviewed` : 'No rules entered yet');
  add('owners', 'No rules left without an owner', rs['No owner'] === 0,
    rs['No owner'] ? `${rs['No owner']} rule(s) marked "No owner"` : 'None', false);

  const lab = flowResults(state.flows, 'before');
  add('lab', 'Test matrix passed before cutover', state.flows.length > 0 && lab.pass === state.flows.length,
    state.flows.length ? `${lab.pass} passed, ${lab.fail} failed, ${lab.notRun} not run` : 'No flows to test yet');

  const rb = state.rollback;
  const prereqDone = ROLLBACK_PREREQS.filter(([id]) => rb.prereq[id]).length;
  add('rbOwner', 'Rollback decision owner named', !!String(rb.decisionOwner).trim(), rb.decisionOwner || 'Not named');
  add('rbPrereq', 'Rollback prerequisites done', prereqDone === ROLLBACK_PREREQS.length,
    `${prereqDone} of ${ROLLBACK_PREREQS.length} done`);
  add('rbRehearsed', 'Rollback rehearsed', !!rb.rehearsalDate,
    rb.rehearsalDate ? `Rehearsed ${rb.rehearsalDate}${rb.rehearsalMinutes ? `, ${rb.rehearsalMinutes} min` : ''}` : 'Not rehearsed yet');

  const crit = GONOGO_CRITERIA.filter(([id]) => ['yes', 'na'].includes(state.gonogo.criteria[id]?.met)).length;
  add('criteria', 'Go/no-go criteria met', crit === GONOGO_CRITERIA.length, `${crit} of ${GONOGO_CRITERIA.length} met or not applicable`);

  const required = SIGNERS.filter(([, , req]) => req);
  const signed = required.filter(([id]) => {
    const s = state.gonogo.signatures[id] || {};
    return String(s.name || '').trim() && s.decision === 'Go';
  }).length;
  add('signed', 'Security and operations leads signed "Go"', signed === required.length, `${signed} of ${required.length} required sign-offs`);

  const blockers = checks.filter(c => !c.ok && c.blocker);
  const warnings = checks.filter(c => !c.ok && !c.blocker);
  return { checks, blockers, warnings, ready: blockers.length === 0 };
}

// ---------- CSV
export function toCSV(rows, columns) {
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [columns.map(c => esc(c[1])).join(','), ...rows.map(r => columns.map(c => esc(r[c[0]])).join(','))].join('\r\n');
}

export function parseCSV(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}

// Rules CSV import: columns in this order, header row optional.
export const RULE_IMPORT_COLUMNS = ['rid', 'srcZone', 'src', 'dst', 'svc', 'action', 'hits', 'period', 'lastHit'];
export function rulesFromCSV(text) {
  let rows = parseCSV(text);
  if (rows.length && /rule/i.test(rows[0][0] || '')) rows = rows.slice(1);
  return rows.map(r => Object.fromEntries(RULE_IMPORT_COLUMNS.map((k, i) => [k, (r[i] ?? '').trim()])));
}

// ---------- Loading saved files safely
export function migrate(obj) {
  if (!obj || typeof obj !== 'object' || obj.app !== 'hc-firewall-migration-planner') {
    throw new Error('This file is not a Firewall Migration Planner save file.');
  }
  if (typeof obj.version !== 'number' || obj.version > STATE_VERSION) {
    throw new Error('This file was made by a newer version of the planner.');
  }
  const base = newState();
  const out = { ...base, ...obj };
  out.rollback = { ...base.rollback, ...(obj.rollback || {}) };
  out.rollback.triggers = { ...base.rollback.triggers, ...((obj.rollback || {}).triggers || {}) };
  out.gonogo = { ...base.gonogo, ...(obj.gonogo || {}) };
  for (const k of ['zones', 'flows', 'inspections', 'risks', 'rules']) if (!Array.isArray(out[k])) out[k] = base[k];
  for (const k of ['project', 'baseline']) if (typeof out[k] !== 'object' || out[k] === null) out[k] = {};
  return out;
}
