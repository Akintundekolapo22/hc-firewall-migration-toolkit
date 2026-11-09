# Template 5: Go / No-Go Sign-Off Form

**Framework phase:** Phase 4, immediately before production cutover

**Use it:** to make the decision to proceed a recorded, joint decision, signed by both the security and operations leads

**Fillable version:** `fillable/Go-No-Go_Signoff.docx`

Complete this form at a meeting shortly before the cutover window. Every item needs an answer and, where possible, a pointer to the evidence.

---

## A. Change details

| Item | Entry |
|---|---|
| Site | |
| Change or ticket number | |
| Cutover window (date, start, end) | |
| Meeting date and time | |

## B. Readiness checklist

| # | Criterion | Met? (Yes / No / N/A) | Evidence (document, test result, ticket) |
|---|---|---|---|
| 1 | Pre-migration audit complete and signed (Template 1) | | |
| 2 | Risk register reviewed; every high risk (score 15 or more) has an owner and a mitigation in place or formally accepted (Template 2) | | |
| 3 | Rule review complete and approved (Template 3) | | |
| 4 | New firewall configuration tested in a lab; full test matrix passed | | |
| 5 | Inspection features checked; any gaps recorded and accepted | | |
| 6 | Parallel operation completed (the framework calls for at least two weeks), and every difference between the two firewalls resolved, or a documented reason why it was not possible | | |
| 7 | Rollback plan written and rehearsed (Template 4) | | |
| 8 | Maintenance window approved; clinical departments informed and downtime procedures ready | | |
| 9 | Vendors with remote access informed; vendor support available during the window | | |
| 10 | Configuration backups of both firewalls stored safely | | |
| 11 | Logging and monitoring confirmed working on the new firewall | | |
| 12 | Staff for the window confirmed, including the rollback decision owner | | |

## C. Open issues accepted for this cutover

| Issue | Why it is acceptable | Accepted by |
|---|---|---|
| | | |

## D. Decision

- [ ] **GO:** all criteria met
- [ ] **GO WITH CONDITIONS:** conditions listed below
- [ ] **NO-GO:** reasons and next steps listed below

Conditions, reasons or next steps:

&nbsp;

&nbsp;

## E. Signatures

The framework requires joint sign-off by the security and operations teams. A clinical or business representative and the privacy or compliance officer are recommended in healthcare settings.

| Role | Name | Decision (Go / No-Go) | Signature | Date and time |
|---|---|---|---|---|
| Security lead | | | | |
| Operations / IT lead | | | | |
| Clinical or business representative | | | | |
| Privacy / compliance officer (recommended) | | | | |
