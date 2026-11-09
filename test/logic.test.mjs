import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newState, riskScore, riskLevel, openHighRisks, ruleSummary, auditProgress, flowResults,
  readiness, toCSV, parseCSV, rulesFromCSV, migrate,
} from '../src/logic.js';
import { BASELINE_ITEMS, ROLLBACK_PREREQS, GONOGO_CRITERIA, RISKS } from '../src/content.js';

test('risk score is likelihood x impact, only for whole numbers 1-5', () => {
  assert.equal(riskScore({ likelihood: '3', impact: '5' }), 15);
  assert.equal(riskScore({ likelihood: 1, impact: 1 }), 1);
  assert.equal(riskScore({ likelihood: '', impact: '4' }), null);
  assert.equal(riskScore({ likelihood: '6', impact: '2' }), null);
  assert.equal(riskScore({ likelihood: '2.5', impact: '2' }), null);
});

test('risk level thresholds: 15+ High, 8-14 Medium, 1-7 Low', () => {
  assert.equal(riskLevel(15), 'High');
  assert.equal(riskLevel(25), 'High');
  assert.equal(riskLevel(14), 'Medium');
  assert.equal(riskLevel(8), 'Medium');
  assert.equal(riskLevel(7), 'Low');
  assert.equal(riskLevel(null), '');
});

test('a high risk counts as open until it has an owner and is addressed', () => {
  const r = { likelihood: '4', impact: '4', owner: '', status: 'Open' };
  assert.equal(openHighRisks([r]).length, 1);
  assert.equal(openHighRisks([{ ...r, owner: 'Ana' }]).length, 1);
  assert.equal(openHighRisks([{ ...r, owner: 'Ana', status: 'Mitigated' }]).length, 0);
  assert.equal(openHighRisks([{ ...r, owner: 'Ana', status: 'Accepted' }]).length, 0);
  assert.equal(openHighRisks([{ ...r, impact: '3', owner: '' }]).length, 0); // 12 = Medium
});

test('new state contains every framework risk, unrated', () => {
  const s = newState();
  assert.equal(s.risks.length, RISKS.length);
  assert.ok(s.risks.every(r => riskScore(r) === null && r.status === 'Open'));
});

test('rule summary counts findings and unreviewed rules', () => {
  const s = ruleSummary([{ finding: 'Keep' }, { finding: 'Shadowed' }, { finding: '' }, {}, { finding: 'Keep' }]);
  assert.equal(s.total, 5);
  assert.equal(s.Keep, 2);
  assert.equal(s.Shadowed, 1);
  assert.equal(s.none, 2);
});

test('audit progress counts done and not-applicable items', () => {
  const s = newState();
  s.baseline = { B01: 'yes', B02: 'na', B03: 'no' };
  const a = auditProgress(s);
  assert.equal(a.answered, 3);
  assert.equal(a.done, 2);
  assert.equal(a.total, BASELINE_ITEMS.length);
});

test('flow results per stage', () => {
  const flows = [{ before: 'pass' }, { before: 'fail' }, {}];
  assert.deepEqual(flowResults(flows, 'before'), { pass: 1, fail: 1, notRun: 1 });
  assert.throws(() => flowResults(flows, 'later'));
});

test('an empty plan is not ready', () => {
  const r = readiness(newState());
  assert.equal(r.ready, false);
  assert.ok(r.blockers.length > 5);
});

function completePlan() {
  const s = newState();
  for (const [id] of BASELINE_ITEMS) s.baseline[id] = 'yes';
  s.zones = [{ zone: 'Clinical' }];
  s.flows = [{ fid: 'F-01', before: 'pass' }];
  s.risks = s.risks.map(r => ({ ...r, likelihood: '2', impact: '2' }));
  s.rules = [{ rid: '1', finding: 'Keep' }];
  s.rollback.decisionOwner = 'IT manager';
  for (const [id] of ROLLBACK_PREREQS) s.rollback.prereq[id] = true;
  s.rollback.rehearsalDate = '2026-11-01';
  for (const [id] of GONOGO_CRITERIA) s.gonogo.criteria[id] = { met: 'yes' };
  s.gonogo.signatures = { sec: { name: 'A', decision: 'Go' }, ops: { name: 'B', decision: 'Go' } };
  return s;
}

test('a complete plan is ready', () => {
  const r = readiness(completePlan());
  assert.equal(r.ready, true, JSON.stringify(r.blockers));
});

test('one open high risk, a failed lab test or a missing signature each block readiness', () => {
  let s = completePlan(); s.risks[0] = { ...s.risks[0], likelihood: '5', impact: '4', owner: '' };
  assert.deepEqual(readiness(s).blockers.map(b => b.id), ['high']);
  s = completePlan(); s.flows[0].before = 'fail';
  assert.deepEqual(readiness(s).blockers.map(b => b.id), ['lab']);
  s = completePlan(); s.gonogo.signatures.ops.decision = 'No-Go';
  assert.deepEqual(readiness(s).blockers.map(b => b.id), ['signed']);
});

test('rules with no owner give a warning, not a blocker', () => {
  const s = completePlan(); s.rules.push({ rid: '2', finding: 'No owner' });
  const r = readiness(s);
  assert.equal(r.ready, true);
  assert.deepEqual(r.warnings.map(w => w.id), ['owners']);
});

test('CSV round trip handles commas, quotes and new lines', () => {
  const rows = [{ a: 'x,y', b: 'say "hi"' }, { a: 'line1\nline2', b: '' }];
  const csv = toCSV(rows, [['a', 'A'], ['b', 'B']]);
  const back = parseCSV(csv);
  assert.deepEqual(back, [['A', 'B'], ['x,y', 'say "hi"'], ['line1\nline2', '']]);
});

test('rules import skips a header row and maps columns in order', () => {
  const rows = rulesFromCSV('Rule ID,Source zone,Source,Destination,Service,Action,Hits\r\nACL-1 line 2,users,10.0.0.0/24,EHR,443,permit,120\n\nACL-1 line 4,users,host 10.0.0.9,EHR,80,permit,0\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].rid, 'ACL-1 line 2');
  assert.equal(rows[1].hits, '0');
  assert.equal(rows[1].period, '');
});

test('loading a saved file rejects other files and fills missing parts', () => {
  assert.throws(() => migrate({ hello: 1 }));
  assert.throws(() => migrate({ app: 'hc-firewall-migration-planner', version: 99 }));
  const m = migrate({ app: 'hc-firewall-migration-planner', version: 1, zones: 'bad', rollback: { decisionOwner: 'X' } });
  assert.deepEqual(m.zones, []);
  assert.equal(m.rollback.decisionOwner, 'X');
  assert.ok(Array.isArray(m.rollback.steps) && m.rollback.steps.length > 0);
});
