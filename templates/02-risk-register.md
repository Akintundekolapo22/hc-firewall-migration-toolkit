# Template 2: Risk Register

**Framework phase:** started in Phase 1, reviewed before every later phase

**Use it:** to list what could go wrong, how likely and serious it is, and what you will do about it

**Fillable version:** `fillable/Firewall_Migration_Worksheets.xlsx`, tab "2 Risk register" (the score is calculated for you)

The first ten risks come from the risk table in the published framework. The last three are added for healthcare settings. Rate each one for your own site; the ratings are left blank on purpose.

## How to score

- **Likelihood:** 1 = rare, 2 = unlikely, 3 = possible, 4 = likely, 5 = almost certain
- **Impact:** 1 = minimal, 2 = minor, 3 = moderate, 4 = major (care delayed or ePHI exposed), 5 = severe (patient care stops or a reportable breach)
- **Score** = Likelihood × Impact. 15 or more = high: it needs a named owner and a mitigation in place before the go/no-go decision. 8 to 14 = medium. 7 or less = low.

## Register

| ID | Risk | Phase where it is handled | Likelihood (1–5) | Impact (1–5) | Score | What it would mean in a healthcare setting | Mitigation | Early warning sign | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Misconfigured rule migration (rated the highest risk in the framework) | Phase 2: laboratory validation | | | | Clinicians lose access to the EHR, or a protected system is exposed | Map every rule; run the full test matrix in a lab and again after cutover | Any test result that differs from the baseline | | |
| R-02 | Shadowed rules and rule conflicts | Phase 1: audit | | | | Rules carried over that never apply, hiding real access | Rule review (Template 3); remove or merge shadowed rules | Rules with zero hits that sit below broader rules | | |
| R-03 | Rollback trigger failure (the switch-back does not happen in time) | Phases 1 and 4 | | | | Long outage of clinical systems | Written triggers and decision owner (Template 4); rollback rehearsed | Validation tests failing with no decision made | | |
| R-04 | SSL/TLS inspection disrupts applications | Phases 2 and 3 | | | | EHR, e-prescribing or portal connections fail | Test inspection in the lab; exempt clinical systems that break, and record the exemption | Certificate or handshake errors in logs | | |
| R-05 | SSL certificate chain misconfiguration | Phase 2 | | | | Browsers and devices reject connections | Check certificate chains and trust stores before cutover | Certificate warnings on test devices | | |
| R-06 | Operational technology (OT) or device traffic disrupted | Phase 3 | | | | Building systems or connected equipment stop communicating | Inventory OT and device flows; include them in the test matrix | Devices dropping offline after changes | | |
| R-07 | Policy differences during parallel operation | Phase 3 | | | | The two firewalls make different allow/deny decisions | Compare decisions from both firewalls' logs; resolve every difference | Mismatched log entries | | |
| R-08 | Off-hours cutover failure | Phase 4 | | | | Problems found when few staff are on site | Staffed maintenance window; vendor support on call; rollback ready | Tasks running behind schedule in the window | | |
| R-09 | Performance degradation | Phase 5 | | | | Slow EHR, imaging or telehealth | Size the new firewall for peak load; monitor after cutover | Rising latency or CPU use | | |
| R-10 | Post-migration rule bloat | Phase 5 | | | | Rule base grows again and becomes hard to manage | Review rules every 90 days | Rule count rising between reviews | | |
| R-11 | Network-connected medical devices lose connectivity | Phases 1 to 4 | | | | Infusion pumps, monitors or imaging cannot send or receive data | Get device lists from clinical engineering; test device flows; involve device vendors | Device alarms or vendor alerts | | |
| R-12 | Vendor remote-access paths break | Phases 1 to 4 | | | | EHR or imaging vendors cannot support systems during an incident | List all vendor VPNs and access paths; test each one | Vendor connection failures | | |
| R-13 | Loss of logs or audit trail during the change | Phases 4 and 5 | | | | Gap in records needed for security monitoring and HIPAA audit controls | Confirm logging on the new firewall before cutover | Missing log entries after cutover | | |

## Review record

| Date | Reviewed by | Changes made |
|---|---|---|
| | | |
