# Template 3: Rule Review Worksheet

**Framework phases:** Phase 1 (audit) and Phase 2 (rule rationalization)

**Use it:** to decide, rule by rule, what moves to the new firewall, what is removed and what is tightened

**Fillable version:** `fillable/Firewall_Migration_Worksheets.xlsx`, tab "3 Rule review"

A migration is the best moment to clean up old rules. Every rule should leave this worksheet with a decision and a reason.

## Findings to choose from

| Finding | Meaning | Usual action |
|---|---|---|
| Keep | Needed, correctly scoped, has an owner | Migrate as is |
| Unused | No hits over at least 90 days, or the system it served is retired | Remove after the owner confirms |
| Shadowed | A rule above it matches the same traffic first, so it never applies | Remove, or merge with the rule above |
| Over-broad | Allows more than needed (for example "any" service or a whole subnet) | Narrow to the services and hosts actually used |
| Duplicate | Same as another rule | Remove one copy |
| No owner | Nobody can explain why it exists | Find an owner or schedule removal; do not migrate silently |

**Two cautions:**

1. Zero hits over a short period does not prove a rule is unused. Some flows run only monthly or yearly (for example, end-of-year reporting or disaster-recovery links). Ask the owner before removing anything.
2. If possible, have someone other than the person who wrote the rules do the review. A second pair of eyes finds problems the author misses.

## Worksheet

| Rule ID / line | Source zone | Source | Destination | Service / port | Action | Hit count (period) | Last hit | Business owner | Why it exists | Finding | Decision | New firewall policy ID | Test ID that proves it | Reviewer | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | |

## Summary

| Count | Number |
|---|---|
| Rules reviewed | |
| Kept | |
| Removed (unused, shadowed, duplicate) | |
| Narrowed | |
| Still without an owner | |

## Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Security lead | | | |
| Operations / IT lead | | | |
