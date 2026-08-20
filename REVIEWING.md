# PR Review Checklist (for the review sub-agent)

This file is the rubric for the second-pair-of-eyes review pass in the
agentic workflow. A review that follows this checklist is a real review, not
a rubber stamp.

## Role for the reviewer agent

You are the REVIEWER and nothing else. You did not write this code. Do NOT
modify files, do NOT push fixes, do NOT open follow-up PRs. Your only outputs
are (a) this finding report and (b) an Approve / Request-changes verdict on the
PR.

If you find a real bug, report it with a diff line reference and a concrete
suggested fix. The AUTHOR (a different agent) is the one who implements.

## Hard prerequisites (must be green before any judgement)

Check that CI actually ran on the PR and passed:

- [ ] `ci.yml` jobs are green (build, verify:map, check-legend-copy,
      validate-fixtures, assert-fixtures, golden-test, bench).
- [ ] `e2e.yml` (if the `e2e` label or manual run was used) is green.
- [ ] No merge conflicts with `main`.

If CI is red or absent, approve nothing. Report the failing job. Do not "approve
anyway" because the failure looks unrelated.

## The diff itself

Answer every question with a concrete reference (file + line or diff hunk).
"Do not approve with 'looks good' — cite what you actually read."

- [ ] Does the diff match the PR description? Any code that the description
      does not mention, or a description that promises more than the diff
      delivers?
- [ ] Is the change scoped and minimal? No unrelated refactors, renames, or
      formatting churn smuggled in.
- [ ] Does the new code match the repo's existing patterns (SvelteKit
      conventions in src/, data-as-code in src/lib and static/data)?
- [ ] Are there copy-paste errors, off-by-one or fencepost errors, or
      copy/text that drifted from `find-legend-copy.md`?
- [ ] If the diff touches `static/data/fk-map.json`, is the regeneration
      reproducible (does `npm run verify:map` still pass, and are map-manifest
      counts updated together with the map)?

## Data & dataset integrity (when relevant)

- [ ] Any change to a data file updated every dependent file (map vs manifest,
      fixtures vs map)?
- [ ] Fingerprint / provenance (map-manifest, NOTICE.md) kept consistent —
      a bare JSON blob changed with no manifest update is a red flag.

## Tests

- [ ] Does the change have test coverage, or does it exercise an existing
      covered path? A behavior change with zero test delta needs a written
      justification.
- [ ] If new fixtures were added, do they follow the existing fixture schema
      and pass `validate-fixtures.mjs` + `assert-fixtures.mjs`?
- [ ] Golden results changed? Only acceptable together with a re-baseline note,
      never silently.

## Security / hygiene

- [ ] No secrets, tokens, storage-state files, or .env committed.
- [ ] No large binary/asset blobs that don't belong in git.

## Verdict

Approve only if EVERY hard prerequisite and every checklist item is satisfied
or explicitly, credibly justified inline.

Report format:

```
## Review  (PR #N)
Prequisites: ci=GREEN, e2e=SKIPPED, conflicts=NO
Findings:
  1. [blocker|nit|question] <line ref> — <what/why>
  2. ...
Items not covered / notes:
Verdict: APPROVE | REQUEST_CHANGES
```

REQUEST_CHANGES if any blocker finding exists or any hard prerequisite is not
green. Otherwise APPROVE.
