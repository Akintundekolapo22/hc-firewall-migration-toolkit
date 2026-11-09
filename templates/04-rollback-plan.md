# Template 4: Rollback Plan

**Framework phases:** written in Phase 1, used in Phase 4 (cutover)

**Use it:** so that, if the new firewall causes problems, everyone knows who decides to switch back, when, and exactly how

**Fillable version:** `fillable/Rollback_Plan.docx`

Write this plan **before** the cutover, rehearse it at least once in a lab, and keep a printed copy in the room during the change.

---

## 1. Scope

| Item | Entry |
|---|---|
| Site and systems covered | |
| Current (source) firewall | |
| New (target) firewall | |
| Cutover window | |
| Plan version and date | |

## 2. Who decides

| Role | Name | Phone | Backup person |
|---|---|---|---|
| Rollback decision owner (one person makes the call) | | | |
| Person who carries out the rollback | | | |
| Clinical or business contact to inform | | | |
| Vendor support contact | | | |

## 3. Rollback triggers

Agree these before the window. If any trigger is met, the decision owner rolls back. There is no debate in the moment.

| Trigger | Threshold for this site |
|---|---|
| A clinical-criticality-1 flow fails its test after cutover | Any failure |
| The EHR or another critical system is unreachable | More than ___ minutes |
| An approved flow is denied, or a blocked flow is allowed, and the cause is not found | Within ___ minutes |
| Cutover tasks are running late | More than ___ minutes behind the plan |
| Logging to the SIEM or syslog server is not working on the new firewall | Not fixed within ___ minutes |
| Other: | |

**Latest time to start a rollback:** ______ (leave enough time to finish before the window ends).

## 4. Before the cutover starts

- [ ] Current firewall configuration exported, and its checksum or file hash recorded: ______________
- [ ] New firewall configuration backed up
- [ ] Current firewall left powered on and unchanged during the window
- [ ] Switch-back method written down step by step (cables, interface states, routing or switch changes)
- [ ] Steps to clear ARP and MAC address caches on switches, routers and key servers written down (after a switch, devices can keep sending traffic to the old firewall's hardware address until these caches are cleared)
- [ ] Test matrix (from Template 1, section D) ready to run, with baseline results recorded
- [ ] Rollback rehearsed in a lab on: ______ (date), and it took ______ minutes

## 5. Rollback steps

Fill in the exact commands or actions for your equipment.

| Step | Action | Done by | Time done |
|---|---|---|---|
| 1 | Announce the rollback to the team and the clinical contact | | |
| 2 | Take the new firewall out of the traffic path: | | |
| 3 | Put the original firewall back in the path: | | |
| 4 | Clear ARP and MAC caches on: | | |
| 5 | Run the full test matrix | | |
| 6 | Compare the original firewall's checksum or configuration export with the one recorded before cutover | | |
| 7 | Confirm logging and monitoring are working | | |
| 8 | Announce that services are restored | | |

## 6. Checking that the rollback worked

| Check | Result |
|---|---|
| Every test matrix result matches the baseline | |
| Checksum or configuration export unchanged | |
| Clinical contact confirms critical systems work | |
| Time from rollback decision to services restored | ______ minutes |

## 7. After a rollback

- Record what triggered it and what was learned.
- Keep the new firewall's configuration and logs for analysis.
- Do not try the cutover again until the cause is fixed and a new go/no-go decision (Template 5) is made.

## 8. Rehearsal and use log

| Date | Lab rehearsal or real rollback? | Time taken | Problems found | Fixed? |
|---|---|---|---|---|
| | | | | |
