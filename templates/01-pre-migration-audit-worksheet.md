# Template 1: Pre-Migration Audit Worksheet

**Framework phase:** Phase 1, pre-migration audit and risk assessment

**Use it:** before any migration work starts

**Fillable version:** `fillable/Firewall_Migration_Worksheets.xlsx`, tab "1 Audit"

The goal of this worksheet is simple: know exactly what the current firewall does, and what must keep working, before you change anything.

---

## A. Project details

| Item | Entry |
|---|---|
| Organization and site | |
| Migration lead (name, role) | |
| Security lead | |
| Operations / IT lead | |
| Clinical or business contact | |
| Current (source) firewall: make, model, software version | |
| New (target) firewall: make, model, software version | |
| Planned cutover window (date, start, end) | |
| Date this audit was completed | |

## B. Collect the baseline

Tick each item when it is done and saved in the project folder.

- [ ] Full configuration export of the current firewall, saved and dated
- [ ] Configuration checksum or file hash recorded (for example `show checksum` on Cisco ASA, or a SHA-256 hash of the export file)
- [ ] Network diagram showing every zone, interface and connected network
- [ ] List of all firewall rules, with rule hit counts
- [ ] Hit counts collected over at least 90 days (a short window cannot show that a rule is unused)
- [ ] NAT rules, VPN tunnels (site-to-site and remote access) and routing listed
- [ ] Inspection and security features listed (SSL/TLS inspection, intrusion prevention, application control, protocol inspections)
- [ ] Logging destinations listed (syslog, SIEM) and confirmed working
- [ ] Administrator accounts and access methods listed
- [ ] Licences and support contracts checked for both firewalls
- [ ] Recent backup of the configuration stored away from the firewall

## C. Zones and critical systems

List every zone. Mark which ones hold electronic protected health information (ePHI) and how long each can be down.

| Zone | Network(s) | Main systems (for example EHR, PACS, lab, pharmacy, medical devices, building systems, guest Wi-Fi) | Holds ePHI? (Y/N) | Clinical criticality (1 = patient care stops, 2 = care slowed, 3 = no direct care impact) | Maximum tolerable downtime | System owner |
|---|---|---|---|---|---|---|
| | | | | | | |
| | | | | | | |
| | | | | | | |

## D. Application flows that must keep working

Each row is one connection that must still work after cutover. These rows become the test matrix used before cutover, after cutover and after any rollback.

| Flow ID | Source (zone / host) | Destination (zone / host) | Service / port | What it is for | Owner | Must be allowed or denied? | How it will be tested |
|---|---|---|---|---|---|---|---|
| F-01 | | | | | | | |
| F-02 | | | | | | | |
| F-03 | | | | | | | |

Include flows that must stay **blocked** as well (for example, guest Wi-Fi to the EHR servers). A migration that accidentally opens access is as serious as one that breaks it.

## E. Inspection and security features

| Feature on the current firewall | Where it applies | Equivalent on the new firewall | Will it be tested before cutover? | Gap or note |
|---|---|---|---|---|
| | | | | |

If a feature has no equivalent, record it as a gap. Do not mark it as covered.

## F. Readiness questions

| Question | Yes / No | Notes |
|---|---|---|
| Do clinical departments have downtime procedures (paper forms, read-only EHR copies) they can use during the window? | | |
| Have vendors with remote access (EHR, imaging, medical device vendors) been identified and told about the change? | | |
| Is vendor support for both firewalls available during the window? | | |
| Is there a lab or test environment where the new configuration can be checked first? | | |
| Has the rollback plan (Template 4) been started? | | |
| Has the risk register (Template 2) been started? | | |

## G. Audit sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| Migration lead | | | |
| Security lead | | | |
