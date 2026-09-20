# Software delivery process

## Purpose

This repository uses the agent pipeline configured in `.ai/agentic.config.json`. Pull requests target the GitHub repository's default branch (`main`), specifications live in `.ai/specs`, and the full validation gate is `yarn build`.

## Roles and lifecycle

- The author owns implementation and validation.
- A reviewer checks correctness, security, contracts, and repository conventions, then approves or requests changes.
- A QA reviewer exercises user-facing changes and owns `qa-approved`.
- A maintainer owns branch protection, labels, pipeline configuration, and exceptions.

Work proceeds through discovery or intake, implementation, pull request, review, QA when required, and squash merge. A ready PR carries one pipeline label. `review`, `changes-requested`, `qa`, `qa-failed`, `merge-queue`, `blocked`, and `do-not-merge` are mutually exclusive workflow states.

## Merge and QA gates

- Required GitHub checks must be green before merge; local validation is supporting evidence, never a substitute.
- `qa-failed`, `do-not-merge`, and `blocked` always prevent merge. An active `qa` label means testing is underway and also prevents merge.
- A PR with `needs-qa` must also have `qa-approved`. `skip-qa` is reserved for genuinely low-risk, non-user-facing work and must never coexist with `needs-qa`.
- Every QA approval should include `QA head: <sha>`. A later push makes that evidence stale until QA re-tests or reconfirms the tested scope at the new head.
- Self-QA requires documented scenarios and evidence, plus both `qa-approved` and `qa-self-verified`; it is forbidden for `risk-high` changes.

## Labels and claims

Category labels describe the change. Priority labels describe urgency; risk labels describe blast radius. `risk-high` changes need deeper evidence and a second reviewer where authentication, permissions, data isolation, money, migrations, or shared contracts are involved.

Agents actively modifying a tracker item claim it with assignment, `in-progress`, and a claim comment. They release their own claim when finished. `ci-monitoring` is not a claim; it only records that a CI follow-up is pending.

## Validation gate

Run, in order:

1. `yarn build`

Any non-zero result fails validation. Changes to this process must update both this document and `.ai/agentic.config.json`.
