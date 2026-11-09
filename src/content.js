// Content for the Healthcare Firewall Migration Planner.
// Licensed under CC BY 4.0 (see LICENSE-CONTENT.md). Code that uses it is MIT.
// Based on the Secure Migration and Operational Stability Framework:
// Ogunwola, T. A., & Alozie, C. (2026). Computer Science & IT Research Journal, 7(5), 347-361.
// https://doi.org/10.51594/csitrj.v7i5.2287

export const FRAMEWORK_CITATION =
  'Ogunwola, T. A., & Alozie, C. (2026). Enterprise firewall modernization for business continuity: ' +
  'A framework for secure migration and operational stability. Computer Science & IT Research Journal, 7(5), 347–361.';
export const FRAMEWORK_DOI = 'https://doi.org/10.51594/csitrj.v7i5.2287';

export const STEPS = [
  { id: 'audit', n: 1, title: 'Pre-migration audit', phase: 'Phase 1',
    intro: 'Know exactly what the current firewall does, and what must keep working, before you change anything.' },
  { id: 'risks', n: 2, title: 'Risk register', phase: 'Phase 1, reviewed in every later phase',
    intro: 'Rate each risk for your site. Anything scoring 15 or more needs an owner and a mitigation before go/no-go.' },
  { id: 'rules', n: 3, title: 'Rule review', phase: 'Phases 1 and 2',
    intro: 'Decide, rule by rule, what moves to the new firewall, what is removed and what is tightened.' },
  { id: 'rollback', n: 4, title: 'Rollback plan', phase: 'Written in Phase 1, used in Phase 4',
    intro: 'If the new firewall causes problems, everyone must know who decides to switch back, when, and exactly how.' },
  { id: 'gonogo', n: 5, title: 'Go / no-go', phase: 'Phase 4',
    intro: 'Make the decision to proceed a recorded, joint decision by the security and operations leads.' },
];

export const PROJECT_FIELDS = [
  ['org', 'Organization and site'],
  ['lead', 'Migration lead (name, role)'],
  ['secLead', 'Security lead'],
  ['opsLead', 'Operations / IT lead'],
  ['clinical', 'Clinical or business contact'],
  ['source', 'Current firewall: make, model, software version'],
  ['target', 'New firewall: make, model, software version'],
  ['window', 'Planned cutover window (date, start, end)'],
];

export const BASELINE_ITEMS = [
  ['B01', 'Full configuration export of the current firewall, saved and dated'],
  ['B02', 'Configuration checksum or file hash recorded (for example "show checksum" on Cisco ASA, or a SHA-256 hash of the export)'],
  ['B03', 'Network diagram showing every zone, interface and connected network'],
  ['B04', 'All firewall rules listed, with hit counts'],
  ['B05', 'Hit counts collected over at least 90 days'],
  ['B06', 'NAT rules, VPN tunnels (site-to-site and remote access) and routing listed'],
  ['B07', 'Inspection and security features listed (SSL/TLS inspection, intrusion prevention, application control)'],
  ['B08', 'Logging destinations (syslog, SIEM) listed and confirmed working'],
  ['B09', 'Administrator accounts and access methods listed'],
  ['B10', 'Licences and support contracts checked for both firewalls'],
  ['B11', 'Recent configuration backup stored away from the firewall'],
];

export const RISKS = [
  { id: 'R-01', risk: 'Misconfigured rule migration (rated the highest risk in the framework)', phase: 'Phase 2: laboratory validation',
    hc: 'Clinicians lose access to the EHR, or a protected system is exposed',
    mitigation: 'Map every rule; run the full test matrix in a lab and again after cutover', warning: 'Any test result that differs from the baseline' },
  { id: 'R-02', risk: 'Shadowed rules and rule conflicts', phase: 'Phase 1: audit',
    hc: 'Rules carried over that never apply, hiding real access',
    mitigation: 'Rule review (step 3); remove or merge shadowed rules', warning: 'Rules with zero hits below broader rules' },
  { id: 'R-03', risk: 'Rollback trigger failure (the switch-back does not happen in time)', phase: 'Phases 1 and 4',
    hc: 'Long outage of clinical systems',
    mitigation: 'Written triggers and decision owner (step 4); rollback rehearsed', warning: 'Validation tests failing with no decision made' },
  { id: 'R-04', risk: 'SSL/TLS inspection disrupts applications', phase: 'Phases 2 and 3',
    hc: 'EHR, e-prescribing or portal connections fail',
    mitigation: 'Test inspection in the lab; exempt clinical systems that break, and record the exemption', warning: 'Certificate or handshake errors in logs' },
  { id: 'R-05', risk: 'SSL certificate chain misconfiguration', phase: 'Phase 2',
    hc: 'Browsers and devices reject connections',
    mitigation: 'Check certificate chains and trust stores before cutover', warning: 'Certificate warnings on test devices' },
  { id: 'R-06', risk: 'Operational technology (OT) or device traffic disrupted', phase: 'Phase 3',
    hc: 'Building systems or connected equipment stop communicating',
    mitigation: 'Inventory OT and device flows; include them in the test matrix', warning: 'Devices dropping offline after changes' },
  { id: 'R-07', risk: 'Policy differences during parallel operation', phase: 'Phase 3',
    hc: 'The two firewalls make different allow/deny decisions',
    mitigation: "Compare both firewalls' logs; resolve every difference", warning: 'Mismatched log entries' },
  { id: 'R-08', risk: 'Off-hours cutover failure', phase: 'Phase 4',
    hc: 'Problems found when few staff are on site',
    mitigation: 'Staffed maintenance window; vendor support on call; rollback ready', warning: 'Tasks running behind schedule' },
  { id: 'R-09', risk: 'Performance degradation', phase: 'Phase 5',
    hc: 'Slow EHR, imaging or telehealth',
    mitigation: 'Size the new firewall for peak load; monitor after cutover', warning: 'Rising latency or CPU use' },
  { id: 'R-10', risk: 'Post-migration rule bloat', phase: 'Phase 5',
    hc: 'Rule base grows again and becomes hard to manage',
    mitigation: 'Review rules every 90 days', warning: 'Rule count rising between reviews' },
  { id: 'R-11', risk: 'Network-connected medical devices lose connectivity', phase: 'Phases 1 to 4',
    hc: 'Infusion pumps, monitors or imaging cannot send or receive data',
    mitigation: 'Get device lists from clinical engineering; test device flows; involve device vendors', warning: 'Device alarms or vendor alerts' },
  { id: 'R-12', risk: 'Vendor remote-access paths break', phase: 'Phases 1 to 4',
    hc: 'EHR or imaging vendors cannot support systems during an incident',
    mitigation: 'List all vendor VPNs and access paths; test each one', warning: 'Vendor connection failures' },
  { id: 'R-13', risk: 'Loss of logs or audit trail during the change', phase: 'Phases 4 and 5',
    hc: 'Gap in records needed for security monitoring and HIPAA audit controls',
    mitigation: 'Confirm logging on the new firewall before cutover', warning: 'Missing log entries after cutover' },
];

export const RISK_STATUSES = ['Open', 'Mitigated', 'Accepted', 'Closed'];

export const FINDINGS = [
  ['Keep', 'Needed, correctly scoped, has an owner. Migrate as is.'],
  ['Unused', 'No hits over at least 90 days, or the system it served is retired. Remove after the owner confirms.'],
  ['Shadowed', 'A rule above it matches the same traffic first, so it never applies. Remove or merge.'],
  ['Over-broad', 'Allows more than needed (for example "any" service). Narrow it.'],
  ['Duplicate', 'Same as another rule. Remove one copy.'],
  ['No owner', 'Nobody can explain it. Find an owner or schedule removal; do not migrate silently.'],
];

export const TRIGGERS = [
  ['T1', 'A criticality-1 flow fails its test after cutover', 'Any failure'],
  ['T2', 'The EHR or another critical system is unreachable for more than (minutes)', '15'],
  ['T3', 'An approved flow is denied, or a blocked flow allowed, and the cause is not found within (minutes)', '20'],
  ['T4', 'Cutover tasks are running behind the plan by more than (minutes)', '30'],
  ['T5', 'Logging to the SIEM or syslog server is not working and not fixed within (minutes)', '30'],
];

export const ROLLBACK_PREREQS = [
  ['P1', 'Current firewall configuration exported, and its checksum or file hash recorded'],
  ['P2', 'New firewall configuration backed up'],
  ['P3', 'Current firewall left powered on and unchanged during the window'],
  ['P4', 'Switch-back method written down step by step (cables, interface states, routing or switch changes)'],
  ['P5', "Steps to clear ARP and MAC address caches written down (after a switch, devices can keep sending traffic to the old firewall's hardware address until these caches are cleared)"],
  ['P6', 'Test matrix (step 1, flows) ready to run, with baseline results recorded'],
];

export const DEFAULT_ROLLBACK_STEPS = [
  'Announce the rollback to the team and the clinical contact',
  'Take the new firewall out of the traffic path',
  'Put the original firewall back in the path',
  'Clear ARP and MAC caches on switches, routers and key servers',
  'Run the full test matrix',
  "Compare the original firewall's checksum or configuration export with the one recorded before cutover",
  'Confirm logging and monitoring are working',
  'Announce that services are restored',
];

export const GONOGO_CRITERIA = [
  ['C01', 'Pre-migration audit complete (step 1)'],
  ['C02', 'Every high risk (score 15 or more) has an owner and is mitigated or formally accepted (step 2)'],
  ['C03', 'Rule review complete and approved (step 3)'],
  ['C04', 'New firewall configuration tested in a lab; full test matrix passed'],
  ['C05', 'Inspection features checked; any gaps recorded and accepted'],
  ['C06', 'Parallel operation completed (the framework calls for at least two weeks) and every difference resolved, or a documented reason why not'],
  ['C07', 'Rollback plan written and rehearsed (step 4)'],
  ['C08', 'Maintenance window approved; clinical departments informed and downtime procedures ready'],
  ['C09', 'Vendors with remote access informed; vendor support available during the window'],
  ['C10', 'Configuration backups of both firewalls stored safely'],
  ['C11', 'Logging and monitoring confirmed working on the new firewall'],
  ['C12', 'Staff for the window confirmed, including the rollback decision owner'],
];

export const SIGNERS = [
  ['sec', 'Security lead', true],
  ['ops', 'Operations / IT lead', true],
  ['clin', 'Clinical or business representative', false],
  ['priv', 'Privacy / compliance officer', false],
];
