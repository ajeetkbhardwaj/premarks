const fs = require('fs');
const path = require('path');

const originalShowcaseMd = fs.readFileSync(path.join(__dirname, '..', 'slides.md'), 'utf8');

const TEMPLATES = [
  {
    id: 'basic-clean-deck',
    title: 'Clean Minimal Starter',
    field: 'Basic & Starter',
    themeId: 'nordic',
    slideCount: 5,
    summary: 'Simple, distraction-free 5-slide starter with cover, agenda, two-column overview, takeaways, and closing.',
    markdown: `---
marp: true
theme: nordic
size: 16:9
paginate: true
header: 'Presentation Title'
footer: 'Your Name · Date'
transition: fade 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Overview</span>

# Presentation Title

## A clear subtitle explaining what this deck covers

Presenter Name · Team or Organization

---

<!-- _class: agenda animate-in -->

# Agenda

<div class="agenda-list">

<div class="agenda-item" data-fragment="1">
<span class="agenda-num">01</span>
<div>

### Context & Goal
Why we are here and what decision we need today.

</div>
</div>

<div class="agenda-item" data-fragment="2">
<span class="agenda-num">02</span>
<div>

### Key Findings
What changed since our last review and what data shows.

</div>
</div>

<div class="agenda-item" data-fragment="3">
<span class="agenda-num">03</span>
<div>

### Proposed Plan
Concrete milestones, owners, and timeline.

</div>
</div>

<div class="agenda-item" data-fragment="4">
<span class="agenda-num">04</span>
<div>

### Next Steps
Open questions and immediate follow-up items.

</div>
</div>

</div>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1" data-anim="left">

### Core Context

Summarize the main challenge or opportunity in three concise points:

<ul class="stagger-list">
<li>First clear observation with concrete detail</li>
<li>Second supporting point backed by evidence</li>
<li>Third priority item for team alignment</li>
</ul>

</div>

<div class="stack" data-fragment="2" data-anim="right">

<div class="card">

### Primary Takeaway

Replace this card with a short summary, customer quote, or key comparison.

</div>

<div class="callout ok">

**Highlight:** Keep one main idea per slide so audiences scan in under 5 seconds.

</div>

</div>

---

<!-- _class: section animate-in -->

# Key Takeaways

<div class="row-3">

<div class="card" data-fragment="1">

### 01. Simplicity
Focus each slide on one headline and two or three supporting ideas.

</div>

<div class="card" data-fragment="2">

### 02. Clarity
Use plain labels, consistent numbers, and clean visual contrast.

</div>

<div class="card" data-fragment="3">

### 03. Action
Close every section with clear next steps and ownership.

</div>

</div>

---

<!-- transition: rise 0.5s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Thank You</span>

# Questions & Discussion

- Contact: name@example.com
- Slides and notes shared after the meeting
`,
  },
  {
    id: 'basic-project-update',
    title: 'Weekly Project Status',
    field: 'Basic & Starter',
    themeId: 'executive',
    slideCount: 5,
    summary: 'Straightforward weekly team check-in with progress bars, milestone timeline, and blockers.',
    markdown: `---
marp: true
theme: executive
size: 16:9
paginate: true
header: 'Weekly Status · Core Initiative'
footer: 'Team Sync'
transition: fade 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Weekly Check-In</span>

# Project Alpha Status Update

## Sprint 14 progress, milestones, and upcoming priorities

Product & Engineering Team · Week of Nov 27

---

<!-- _class: kpi animate-in -->

# Progress Snapshot

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Sprint Completion</span>
<span class="kpi-value" data-count-to="84" data-suffix="%">84%</span>
<span class="kpi-delta up">On track for Friday release</span>
<div class="meter"><div class="meter-fill" style="width:84%"></div></div>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Tasks Closed</span>
<span class="kpi-value" data-count-to="26">26</span>
<span class="kpi-delta up">5 remaining in QA review</span>
<div class="meter"><div class="meter-fill" style="width:78%"></div></div>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Open Blockers</span>
<span class="kpi-value" data-count-to="1">1</span>
<span class="kpi-delta">Waiting on staging SSL cert</span>
<div class="meter"><div class="meter-fill" style="width:20%"></div></div>
</div>

</div>

---

<!-- _class: section animate-in -->

# Completed vs. In Progress

<div class="row">

<div class="card card-teal" data-fragment="1" data-anim="left">

### Shipped This Week
- Migrated user preferences endpoint to v2 schema
- Reduced dashboard initial query time by 42%
- Finalized onboarding checklist copy with Design

</div>

<div class="card" data-fragment="2" data-anim="right">

### Active Next Week
- Complete end-to-end checkout smoke tests
- Roll out feature flag to 25% of beta workspaces
- Publish updated API webhook payload docs

</div>

</div>

---

<!-- transition: glide 0.5s -->
<!-- _class: timeline-slide animate-in -->

# Upcoming Milestones

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">W1</span>

### Feature Freeze
All PRs merged and staging verified.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">W2</span>

### Internal Dogfood
48-hour live team testing window.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">W3</span>

### Beta Rollout
Invite first 50 pilot customers.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">W4</span>

### General Release
Full launch and changelog announcement.

</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Action Items</span>

# Decisions Needed Today

- Approve staging certificate renewal window (Owner: Ops)
- Confirm beta customer cohort list by Wednesday noon
`,
  },
  {
    id: 'basic-lecture-notes',
    title: 'Classroom & Seminar Notes',
    field: 'Basic & Starter',
    themeId: 'theorem',
    slideCount: 5,
    summary: 'Clean educational deck for lessons, workshops, and study seminars with objectives and examples.',
    markdown: `---
marp: true
theme: theorem
size: 16:9
paginate: true
math: mathjax
header: 'Course 101 · Lecture Notes'
footer: 'Department Seminar'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Lecture 01</span>

# Introduction to the Core Concept

## Foundational principles, worked examples, and key takeaways

Instructor Name · Fall Semester

---

<!-- _class: section animate-in -->

# Learning Objectives

<ul class="stagger-list">
<li>Understand the motivation behind the primary model and its assumptions</li>
<li>Walk through one concrete worked example step by step</li>
<li>Compare trade-offs across alternative approaches</li>
<li>Identify common pitfalls when applying the concept in practice</li>
</ul>

<div class="callout info" data-fragment="1">

**Reading Note:** Review Chapter 2 summary problems before Friday's lab session.

</div>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Core Definition

State the main idea clearly, then pair it with a compact rule or formula:

<div class="theorem-box">

**Key Principle:** Every system balances accuracy against computational or cognitive cost.

</div>

</div>

<div class="stack" data-fragment="2">

### Worked Example

<div class="card">

**Step 1:** Identify known inputs and boundary conditions.

**Step 2:** Apply the primary rule and verify units.

**Step 3:** Interpret what the result means physically or practically.

</div>

</div>

---

<!-- _class: section animate-in -->

# Quick Comparison

<div class="table-wrap" data-fragment="1">

| Method | Strengths | Limitations | Best Used When |
|---|---|---|---|
| Approach A | Fast & intuitive | Approximate on edge cases | Early exploration |
| Approach B | Exact guarantees | Higher setup overhead | Production validation |
| Hybrid | Balanced speed & rigor | Two-step pipeline | Real-world workflows |

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Wrap-Up</span>

# Summary & Study Questions

- How does changing the primary assumption alter the outcome?
- Which limitation matters most for next week's case study?
- Office hours: Thursdays 14:00–16:00
`,
  },
  {
    id: 'basic-lightning-talk',
    title: '5-Minute Lightning Talk',
    field: 'Basic & Starter',
    themeId: 'swiss',
    slideCount: 5,
    summary: 'High-contrast 5-slide punchy talk built for demos, meetups, and concise pitches.',
    markdown: `---
marp: true
theme: swiss
size: 16:9
paginate: true
header: 'Lightning Talk · 5 Minutes'
footer: 'Meetup Demo'
transition: wipe 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">5-Min Lightning Talk</span>

# Ship Faster Without Breaking Craft

## One practical workflow change that cut our review cycle in half

Speaker Name · @handle

---

<!-- _class: quote animate-in -->

> Most delays happen not while building the work, but while waiting to explain it.

<cite>Core Observation</cite>

---

<!-- _class: split-60-40 animate-in -->

<div class="stack" data-fragment="1" data-anim="left">

### What Changed

<ul class="stagger-list">
<li>Replaced long slide specs with plain Markdown decks in Git</li>
<li>Automated preview builds on every pull request</li>
<li>Kept every review deck strictly under 6 slides</li>
</ul>

</div>

<div class="kpi-card" data-fragment="2" data-anim="zoom">
<span class="kpi-label">Review Turnaround</span>
<span class="kpi-value" data-count-to="2.4" data-suffix=" hrs">2.4 hrs</span>
<span class="kpi-delta up">Down from 18 hours previously</span>
<div class="meter"><div class="meter-fill" style="width:86%"></div></div>
</div>

---

<!-- _class: section animate-in -->

# Live Demo Highlights

<div class="row-3">

<div class="card" data-fragment="1" data-anim="pop">

### Instant Diffs
Text-based slides review cleanly alongside code.

</div>

<div class="card" data-fragment="2" data-anim="pop">

### Zero Layout Drift
Shared theme tokens keep every team consistent.

</div>

<div class="card" data-fragment="3" data-anim="pop">

### One-Click Export
Present live or download PowerPoint and PDF anytime.

</div>

</div>

---

<!-- transition: iris 0.55s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Try It Today</span>

# Thanks — Let's Chat

- Repo & starter kit: github.com/example/starter
- Grab me right after this session for questions
`,
  },
  {
    id: 'algebraic-geometry-showcase',
    title: 'Anime Slides: Motion & Geometry',
    field: 'STEM & Math',
    themeId: 'anime',
    slideCount: 18,
    summary: 'Complete showcase of Marp transitions, staggered entrances, MathJax, View Transition morphs, and click-to-reveal fragments.',
    markdown: originalShowcaseMd,
  },
  {
    id: 'quantum-mechanics-lecture',
    title: 'Quantum Harmonic Oscillator',
    field: 'STEM & Math',
    themeId: 'theorem',
    slideCount: 7,
    summary: 'University lecture deck with Dirac bra-ket axioms, ladder operator derivations, energy spectrum tables, and step-by-step proofs.',
    markdown: `---
marp: true
theme: theorem
size: 16:9
paginate: true
math: mathjax
header: 'PHYS 401 · Quantum Mechanics II'
footer: 'Department of Physics · Lecture 08'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Graduate Physics Lecture</span>

# The Quantum Harmonic Oscillator

## Algebraic ladder operators, Fock states, and zero-point energy

Dr. Elena Vance · Theoretical Physics Seminar

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Hamiltonian & Canonical Commutation

<div class="row">

<div class="theorem-box" data-fragment="1">

### Dimensionless Operators

Define position and momentum quadratures:

$$
\\hat{X} = \\sqrt{\\frac{m\\omega}{\\hbar}}\\hat{x}, \\qquad \\hat{P} = \\frac{1}{\\sqrt{m\\hbar\\omega}}\\hat{p}
$$

</div>

<div class="formula-box" data-fragment="2">

### Canonical Commutator

From $[\\hat{x}, \\hat{p}] = i\\hbar$, the rescaled operators obey:

$$
[\\hat{X}, \\hat{P}] = i
$$

</div>

</div>

<div class="proof-box" data-fragment="3">

**Factorization Idea:** Rather than solving Hermite differential equations directly, we factor $\\hat{H} = \\frac{1}{2}\\hbar\\omega(\\hat{X}^2 + \\hat{P}^2)$ into non-Hermitian ladder operators.

</div>

---

<!-- transition: veil 0.55s -->
<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Creation & Annihilation

<div class="formula-box">

$$
\\hat{a} = \\frac{1}{\\sqrt{2}}(\\hat{X} + i\\hat{P}), \\qquad \\hat{a}^\\dagger = \\frac{1}{\\sqrt{2}}(\\hat{X} - i\\hat{P})
$$

</div>

<div class="card">

**Number Operator** $\\hat{N} = \\hat{a}^\\dagger \\hat{a}$ satisfies $[\\hat{a}, \\hat{a}^\\dagger] = 1$ and $[\\hat{N}, \\hat{a}^\\dagger] = \\hat{a}^\\dagger$.

</div>

</div>

<div class="stack" data-fragment="2">

### Spectrum Theorem

<div class="theorem-box">

$$
\\hat{H} = \\hbar\\omega\\left(\\hat{N} + \\frac{1}{2}\\right)
$$

</div>

<blockquote data-fragment="3">
Ground state $|0\\rangle$ is defined by $\\hat{a}|0\\rangle = 0$, guaranteeing a strictly positive zero-point energy $E_0 = \\frac{1}{2}\\hbar\\omega$.
</blockquote>

</div>

---

<!-- _class: section animate-in -->

# Energy Eigenvalues & Degeneracy

<div class="table-wrap" data-fragment="1">

| Quantum Number $n$ | State Vector | Energy $E_n$ | Wavefunction Parity |
|---|---|---|---|
| $0$ | $|0\\rangle$ | $\\frac{1}{2}\\hbar\\omega$ | Even |
| $1$ | $\\hat{a}^\\dagger|0\\rangle$ | $\\frac{3}{2}\\hbar\\omega$ | Odd |
| $2$ | $\\frac{1}{\\sqrt{2}}(\\hat{a}^\\dagger)^2|0\\rangle$ | $\\frac{5}{2}\\hbar\\omega$ | Even |
| $n$ | $\\frac{1}{\\sqrt{n!}}(\\hat{a}^\\dagger)^n|0\\rangle$ | $\\left(n + \\frac{1}{2}\\right)\\hbar\\omega$ | $(-1)^n$ |

</div>

<p data-fragment="2" class="eyebrow">All 1D bound eigenstates are non-degenerate with uniform level spacing ΔE = ℏω</p>

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Numerical Matrix Diagonalization

<div class="row">

<div class="stack" data-fragment="1">

\`\`\`python
import numpy as np

def ladder_hamiltonian(dim: int, omega: float = 1.0):
    """Construct truncated Fock-basis Hamiltonian."""
    n = np.arange(dim)
    H = np.diag(omega * (n + 0.5))
    return H

def anharmonic_perturbation(dim: int, lam: float):
    a = np.diag(np.sqrt(np.arange(1, dim)), k=1)
    x = (a + a.T) / np.sqrt(2.0)
    return ladder_hamiltonian(dim) + lam * (x @ x @ x @ x)
\`\`\`

</div>

<div class="stack" data-fragment="2">

<div class="card">

### Convergence Check

Truncating at $N = 64$ Fock states yields machine-precision ground eigenvalues for $\\lambda \\le 0.1$.

</div>

<div class="card" data-fragment="3">

### Perturbative Shift

First-order correction $\\Delta E_n^{(1)} = \\langle n | \\lambda \\hat{x}^4 | n \\rangle$ grows quadratically with $n$.

</div>

</div>

</div>

---

<!-- _class: quote animate-in -->

> The algebraic method reveals that quantization arises not from boundary conditions alone, but from the non-commutativity of observables.

<cite>Paul Dirac · Principles of Quantum Mechanics</cite>

---

<!-- transition: zoom 0.6s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Next Lecture</span>

# Coherent States & Time Evolution

- Eigenstates of annihilation operator $\\hat{a}|\\alpha\\rangle = \\alpha|\\alpha\\rangle$
- Minimum-uncertainty wavepackets oscillating classically
- Problem Set 4 due Friday at 17:00
`,
  },
  {
    id: 'ml-transformer-paper',
    title: 'Sparse Mixture-of-Experts Scaling',
    field: 'STEM & Math',
    themeId: 'obsidian',
    slideCount: 7,
    summary: 'Machine learning research readout with routing math, PyTorch router implementation, and scaling law comparisons.',
    markdown: `---
marp: true
theme: obsidian
size: 16:9
paginate: true
math: mathjax
header: 'ML Research Group · NeurIPS Preprint'
footer: 'Sparse MoE Architecture · 2026'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Deep Learning Systems</span>

# Scaling Sparse Mixture-of-Experts

## Decoupling parameter capacity from per-token FLOPs

Maya Lin, Arjun Patel · Foundation Model Lab

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Conditional Routing Formulation

<div class="row">

<div class="formula-box" data-fragment="1">

### Top-k Gating Output

$$
y(x) = \\sum_{i \\in \\mathcal{T}_k(x)} \\operatorname{Softmax}(W_g x)_i \\cdot E_i(x)
$$

</div>

<div class="formula-box" data-fragment="2">

### Auxiliary Load-Balancing Loss

$$
\\mathcal{L}_{\\text{aux}} = \\alpha \\cdot N \\sum_{i=1}^{N} f_i \\cdot P_i
$$

</div>

</div>

<div class="row-3" data-fragment="3">

<div class="card">

### 64 Experts
Routed per Transformer FFN layer

</div>

<div class="card">

### Top-2 Active
Only 3.1% parameters active per token

</div>

<div class="card">

### 4.2x Throughput
Higher tokens/sec at iso-quality

</div>

</div>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### PyTorch Capacity-Aware Router

\`\`\`python
def route_tokens(logits, k=2, cap_factor=1.25):
    gates = torch.softmax(logits, dim=-1)
    top_w, top_idx = torch.topk(gates, k=k, dim=-1)
    top_w = top_w / top_w.sum(dim=-1, keepdim=True)
    capacity = int(cap_factor * logits.size(0) * k / logits.size(1))
    return top_w, top_idx, capacity
\`\`\`

</div>

<div class="stack" data-fragment="2">

### Systems Bottlenecks

<div class="card">

**All-to-All Dispatch** overlaps expert GEMMs with NVLink token shuffling via double buffering.

</div>

<div class="card" data-fragment="3">

**Dropless Routing** replaces fixed token dropping with dynamic grouped-GEMM kernels.

</div>

</div>

---

<!-- _class: section animate-in -->

# Iso-FLOP Benchmark Results

<div class="table-wrap" data-fragment="1">

| Model Variant | Total Params | Active Params | Training FLOPs | Validation Loss |
|---|---|---|---|---|
| Dense Baseline | 7.0B | 7.0B | 1.0e22 | 2.148 |
| MoE 16x1.5B (Top-2) | 18.4B | 2.8B | 1.0e22 | 2.031 |
| MoE 64x1.1B (Top-2) | 52.0B | 2.4B | 1.0e22 | 1.974 |
| MoE 64x1.1B + Shared Expert | 53.2B | 3.1B | 1.0e22 | 1.942 |

</div>

<p data-fragment="2" class="eyebrow">Adding 1 shared dense expert stabilizes early training and lowers tail perplexity</p>

---

<!-- transition: veil 0.55s -->
<!-- _class: section animate-in -->

# Ablation Findings

<div class="card-list">

<div class="card" data-fragment="1">

### Router Z-Loss
Penalizing large pre-softmax logits prevents fp16 divergence at 100B+ scale.

</div>

<div class="card" data-fragment="2">

### Fine-Grained Experts
Splitting 8 wide experts into 64 narrow experts improves specialization diversity.

</div>

<div class="card" data-fragment="3">

### Speculative Decoding
Drafting with shared-expert weights boosts inference speed by 1.9x.

</div>

<div class="card" data-fragment="4">

### Quantization Resilience
INT4 weight-only quantization retains 99.3% MMLU accuracy with per-expert scales.

</div>

</div>

---

<!-- _class: quote animate-in -->

> Capacity is cheap in memory when only the right subnetwork wakes up for each token.

<cite>Scaling Laws for Conditional Computation</cite>

---

<!-- transition: zoom 0.6s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Artifacts & Reproducibility</span>

# Checkpoints & Kernels Open-Sourced

- Training configs and Triton grouped-GEMM kernels released under Apache 2.0
- Evaluation harness reproduces all table metrics in under 4 hours on 8xH100
`,
  },
  {
    id: 'distributed-systems-rfc',
    title: 'Event-Sourced Ledger RFC',
    field: 'Engineering & Systems',
    themeId: 'obsidian',
    slideCount: 7,
    summary: 'Production architecture proposal covering dual-write migration, idempotency keys, rollout phases, and risk mitigation.',
    markdown: `---
marp: true
theme: obsidian
size: 16:9
paginate: true
header: 'RFC-042 · Core Payments Infrastructure'
footer: 'Architecture Review Board · Internal'
transition: fade 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Architecture Proposal</span>

# Event-Sourced Ledger Migration

## Eliminating row-lock contention under peak settlement throughput

Platform Storage Team · Q3 Infrastructure Review

---

<!-- transition: rise 0.5s -->
<!-- _class: section animate-in -->

# Current Bottleneck & Target SLOs

<div class="row-3">

<div class="card" data-fragment="1">

### 412 ms P99
Lock wait spikes on hot merchant accounts during batch payout windows

</div>

<div class="card" data-fragment="2">

### 14,500 TPS
Ceiling imposed by synchronous multi-row serializable transactions

</div>

<div class="card" data-fragment="3">

### < 45 ms Target
Target P99 append latency with append-only partitioned log + async projections

</div>

</div>

<blockquote data-fragment="4">
Moving balance verification to an append-only journal decouples write durability from analytical read models.
</blockquote>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Write Path Topology

1. API gateway validates idempotency key
2. Partitioned Raft log appends balanced debit/credit entry
3. Snapshot worker compacts balance state every 5,000 events
4. CDC stream updates read-replica balances in < 80 ms

</div>

<div class="stack" data-fragment="2">

### Idempotent Command Handler

\`\`\`typescript
export async function postEntry(cmd: LedgerCommand) {
  const key = \`idem:\${cmd.tenantId}:\${cmd.idempotencyKey}\`;
  return await journal.appendIfAbsent(key, {
    debitAccount: cmd.sourceId,
    creditAccount: cmd.destId,
    amountMinor: cmd.amountCents,
    currency: cmd.currency,
  });
}
\`\`\`

</div>

---

<!-- _class: section animate-in -->

# Request & Settlement Sequence

\`\`\`mermaid
sequenceDiagram
    participant C as Client API
    participant G as Idempotency Guard
    participant R as Raft Journal
    participant P as Async Projection
    C->>G: POST /entries (idemKey)
    G->>R: Append Debit/Credit Event
    R-->>G: Commit Index + Epoch
    G-->>C: 201 Created (< 40ms)
    R->>P: CDC Stream Update
\`\`\`

---

<!-- _class: section animate-in -->

# Zero-Downtime Rollout Phases

<div class="table-wrap" data-fragment="1">

| Phase | Traffic Scope | Verification Gate | Rollback Trigger |
|---|---|---|---|
| 1. Shadow Write | 100% mirrored async | 0 checksum diffs over 72h | Log lag > 5s |
| 2. Canary Reads | 5% read queries | Balance parity = 100.000% | Any mismatch alert |
| 3. Primary Switch | 25% -> 100% writes | P99 write < 50ms | Error rate > 0.01% |
| 4. Legacy Sunset | Read-only archive | Audit sign-off complete | N/A |

</div>

---

<!-- _class: section animate-in -->

# Failure Modes & Mitigations

<div class="row">

<div class="card" data-fragment="1">

### Out-of-Order Projections
Monotonic sequence numbers per account partition ensure strict causal ordering.

</div>

<div class="card" data-fragment="2">

### Split-Brain Prevention
Fencing tokens issued by consensus epoch block stale writers immediately.

</div>

</div>

<div class="row">

<div class="card" data-fragment="3">

### Replay Timeouts
Hourly materialized checkpoints cap full-account replay under 12 ms.

</div>

<div class="card" data-fragment="4">

### Audit Compliance
Immutable cryptographic hash chains link every journal batch for SOX verification.

</div>

</div>

---

<!-- _class: quote animate-in -->

> Never migrate stateful financial primitives without continuous shadow reconciliation running in production first.

<cite>Core Storage Engineering Principle</cite>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Decision Requested</span>

# Approve Phase 1 Shadow Deployment

- Target start date: Monday sprint kickoff
- Owners: Storage Engine & FinOps SRE
- Full audit report scheduled after 72-hour parity window
`,
  },
  {
    id: 'clinical-biotech-trial',
    title: 'Phase II Biomarker Efficacy Readout',
    field: 'STEM & Math',
    themeId: 'swiss',
    slideCount: 6,
    summary: 'Clinical trial and translational biotech presentation with cohort stratification, survival metrics, and safety tables.',
    markdown: `---
marp: true
theme: swiss
size: 16:9
paginate: true
math: mathjax
header: 'PROTOCOL CLN-204 · Translational Oncology'
footer: 'Biostatistics & Clinical Data Review'
transition: fade 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Phase II Interim Readout</span>

# Targeted Kinase Inhibitor CLN-204

## Biomarker-stratified progression-free survival & safety profile

Clinical Biostatistics Team · Data Cutoff March 2026

---

<!-- transition: rise 0.5s -->
<!-- _class: section animate-in -->

# Trial Design & Cohort Stratification

<div class="row-3">

<div class="card" data-fragment="1">

### $N = 148$ Patients
Enrolled across 19 academic medical centers (2:1 randomization)

</div>

<div class="card" data-fragment="2">

### Primary Endpoint
Blinded independent central review progression-free survival (PFS)

</div>

<div class="card" data-fragment="3">

### Biomarker Stratum
ctDNA allele fraction $\\ge 1.5\\%$ assessed at baseline and Cycle 3

</div>

</div>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Cox Proportional Hazards Model

<div class="formula-box">

$$
h(t \\mid X) = h_0(t)\\exp(\\beta_1 \\cdot \\text{Arm} + \\beta_2 \\cdot \\text{Biomarker})
$$

</div>

<div class="card">

**Stratified Hazard Ratio:** $0.54$ ($95\\%$ CI: $0.38 - 0.77$, $p = 0.0008$).

</div>

</div>

<div class="stack" data-fragment="2">

### Key Efficacy Signals

<div class="card" data-fragment="3">

**Median PFS:** $11.4$ months vs. $6.2$ months in standard-of-care arm.

</div>

<div class="card" data-fragment="4">

**Objective Response Rate:** $48.5\\%$ confirmed partial or complete responses.

</div>

</div>

---

<!-- _class: section animate-in -->

# Safety & Treatment-Emergent Events

<div class="table-wrap" data-fragment="1">

| Adverse Event Term | CLN-204 Any Grade ($n=98$) | CLN-204 Grade $\\ge 3$ | Control Any Grade ($n=50$) |
|---|---|---|---|
| Fatigue | 31.6% | 3.1% | 28.0% |
| Elevated ALT/AST | 18.4% | 4.1% | 6.0% |
| Rash (maculopapular) | 22.4% | 2.0% | 4.0% |
| Neutropenia | 9.2% | 2.0% | 18.0% |
| Discontinuation due to AE | 5.1% | — | 8.0% |

</div>

---

<!-- _class: section animate-in -->

# Translational ctDNA Clearance

- **Early molecular response** at Week 6 strongly predicts durable remission ($r = 0.78$)
- Patients achieving $>90\%$ ctDNA clearance experienced $82\%$ 12-month PFS
- Zero unexpected Grade 4–5 organ toxicities observed across dose cohorts

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Regulatory Next Steps</span>

# Phase III Registrational Study Ready

- End-of-Phase-II briefing package submitted
- Companion diagnostic assay validation underway
- Target global Phase III enrollment launch: Q4 2026
`,
  },
  {
    id: 'q4-executive-strategy',
    title: 'FY27 Platform Growth & Unit Economics',
    field: 'Business & Strategy',
    themeId: 'executive',
    slideCount: 7,
    summary: 'Executive board presentation with tabular KPI grids, segment retention tables, strategic pillars, and capital allocation.',
    markdown: `---
marp: true
theme: executive
size: 16:9
paginate: true
header: 'Board Briefing · Q4 Financial & Operating Review'
footer: 'Confidential · Executive Leadership'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Board of Directors Briefing</span>

# FY27 Growth & Unit Economics

## Scaling enterprise expansion while preserving 79% gross margin

Office of the CEO & CFO · Annual Strategy Review

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# Operating Highlights

<div class="row-3">

<div class="card" data-fragment="1">

### $84.2M ARR
+38% YoY net new recurring revenue driven by multi-year enterprise contracts

</div>

<div class="card" data-fragment="2">

### 124% Net Retention
Seat expansion and workflow add-ons across Fortune 500 accounts

</div>

<div class="card" data-fragment="3">

### 11 Mo CAC Payback
Improved by 3.4 months via product-led mid-market conversion

</div>

</div>

<p data-fragment="4" class="eyebrow">Free cash flow margin reached +14.2% in Q4, two quarters ahead of plan</p>

---

<!-- _class: section animate-in -->

# Segment Performance Breakdown

<div class="table-wrap" data-fragment="1">

| Customer Segment | Ending ARR | YoY Growth | Gross Margin | Net Dollar Retention |
|---|---|---|---|---|
| Enterprise (> $100k) | $46.8M | +49% | 81.4% | 132% |
| Mid-Market ($25k–$100k) | $26.1M | +31% | 78.2% | 118% |
| Self-Serve & Teams | $11.3M | +19% | 74.5% | 104% |
| **Consolidated Total** | **$84.2M** | **+38%** | **79.5%** | **124%** |

</div>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### Three Strategic Priorities

<div class="card">

**01. Vertical Workflow Suites** — Pre-built compliance packs for life sciences and fintech.

</div>

<div class="card">

**02. Partner Co-Sell Motion** — System integrator enablement across EMEA and APAC.

</div>

</div>

<div class="stack" data-fragment="2">

### Capital Allocation Plan

<div class="card" data-fragment="3">

**R&D (34% of Revenue):** Platform reliability, multi-region residency, and API SDKs.

</div>

<div class="card" data-fragment="4">

**Go-To-Market (31%):** Dedicated enterprise solutions architects in 4 regional hubs.

</div>

</div>

---

<!-- transition: veil 0.55s -->
<!-- _class: section animate-in -->

# FY27 Financial Guardrails

- Maintain **Rule of 40 score above 52%** across all four quarters
- Keep infrastructure COGS below **16% of subscription revenue**
- Expand operating cash flow conversion to **18% by Q4 FY27**

---

<!-- _class: quote animate-in -->

> Durable enterprise software compounds when expansion inside existing accounts costs a fifth of net-new acquisition.

<cite>FY27 Operating Charter</cite>

---

<!-- transition: zoom 0.6s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">FY27 Guidance</span>

# Target: $115M Ending ARR

- Q1 pipeline coverage stands at **3.6x** quota target
- Board audit committee review scheduled May 14
`,
  },
  {
    id: 'product-launch-keynote',
    title: 'Spatial Canvas 2.0 Product Launch',
    field: 'Design & Product',
    themeId: 'swiss',
    slideCount: 6,
    summary: 'Crisp keynote deck for product launches, design critiques, and developer feature announcements.',
    markdown: `---
marp: true
theme: swiss
size: 16:9
paginate: true
header: 'Product Launch Keynote · 2026'
footer: 'Design & Engineering Systems'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Release 2.0</span>

# Spatial Canvas

## Real-time multiplayer vector tooling with zero-latency layout constraints

Product Design & Core Runtime Team

---

<!-- transition: rise 0.55s -->
<!-- _class: section animate-in -->

# What Slowed Teams Down

<div class="row">

<div class="card" data-fragment="1">

### Fragmented Handoff
Static mocks drifted from production tokens within 48 hours of sprint start.

</div>

<div class="card" data-fragment="2">

### Frame Budget Spikes
Large component libraries dropped below 20 FPS during pan and zoom operations.

</div>

</div>

---

<!-- _class: section animate-in -->

# Three Architectural Shifts

<div class="row-3">

<div class="card" data-fragment="1">

### WebGPU Renderer
120 FPS panning across 50,000+ vector nodes with sub-pixel anti-aliasing.

</div>

<div class="card" data-fragment="2">

### Live Token Graph
Design variables compile directly to CSS custom properties and Tailwind configs.

</div>

<div class="card" data-fragment="3">

### Branch & Diff
Visual side-by-side diffs for layout, typography, and contrast checks.

</div>

</div>

---

<!-- _class: section animate-in -->

# Before & After Workflow Impact

<div class="table-wrap" data-fragment="1">

| Metric | Canvas 1.0 | Spatial Canvas 2.0 | Delta |
|---|---|---|---|
| Cold Document Load (10k nodes) | 4.8 s | 0.42 s | **11.4x faster** |
| Token-to-PR Sync Time | 2.5 days | Instant webhook | **Zero manual sync** |
| Frame Pacing (99th percentile) | 38 ms | 7.9 ms | **120 Hz locked** |

</div>

---

<!-- _class: quote animate-in -->

> When design tokens and production components share one source of truth, handoff disappears completely.

<cite>Design Systems Architecture Note</cite>

---

<!-- transition: zoom 0.6s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Available Today</span>

# Upgrade Your Workspace

- Zero-migration import from existing SVG and Figma token JSON
- Full CLI and REST API documentation live at docs.example.com
`,
  },
  {
    id: 'urban-history-colloquium',
    title: 'Civic Cartography & Rail Networks',
    field: 'Editorial & Humanities',
    themeId: 'monograph',
    slideCount: 6,
    summary: 'Humanities and archival research colloquium deck with literary serif typography, citations, and comparative timelines.',
    markdown: `---
marp: true
theme: monograph
size: 16:9
paginate: true
header: 'Department of History · Annual Colloquium'
footer: 'Archival Studies · Cambridge'
transition: fade 0.55s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Historiography Seminar</span>

# Civic Cartography & Rail Networks

## How standardized railway timetables reshaped urban space, 1840–1890

Prof. Julian Mercer · Urban & Cultural History

---

<!-- transition: veil 0.6s -->
<!-- _class: quote animate-in -->

> The railway did not merely connect preexisting cities; it invented the modern suburb by replacing miles with minutes.

<cite>Archival Lecture Thesis · Municipal Records Series IV</cite>

---

<!-- _class: split animate-in -->

<div class="stack" data-fragment="1">

### From Solar Time to Standard Time

Prior to 1847, Bristol and London differed by eleven minutes of local solar noon.

Railway clearinghouses demanded synchronized station clocks, producing the first national temporal grid.

</div>

<div class="stack" data-fragment="2">

<div class="card">

### Primary Cartographic Corpus
142 municipal street atlases digitized from Birmingham, Manchester, and Lyon archives.

</div>

<div class="card" data-fragment="3">

### Zoning Transformation
Freight depots displaced residential parishes along radial river corridors.

</div>

</div>

---

<!-- _class: section animate-in -->

# Comparative Metropolitan Expansion

<div class="table-wrap" data-fragment="1">

| City | First Trunk Line | 1851 Population | 1891 Population | Commuter Radius |
|---|---|---|---|---|
| Manchester | 1830 | 303,382 | 505,368 | 14.5 km |
| Lyon | 1854 | 177,190 | 438,077 | 11.2 km |
| Chicago | 1848 | 29,963 | 1,099,850 | 28.0 km |
| Munich | 1839 | 106,715 | 350,594 | 12.8 km |

</div>

---

<!-- _class: section animate-in -->

# Methodological Takeaways

- **Timetable archives** act as quantitative proxies for social mobility and wage access
- **Isochrone mapping** reveals stark class stratification between express and omnibus stops
- **Municipal lithography** shifted from picturesque bird's-eye views to diagrammatic transit schematics

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Colloquium Discussion</span>

# Questions & Archival Appendix

- Full digitized map plates catalogued under Collection MS-1884
- Working paper preprints available upon request
`,
  },
  {
    id: 'startup-seed-pitch',
    title: 'Series A Venture Pitch Deck',
    field: 'Business & Strategy',
    themeId: 'atelier',
    slideCount: 7,
    summary: 'Editorial venture pitch featuring Bento traction cards, animated KPI counters, retention meters, and go-to-market timeline.',
    markdown: `---
marp: true
theme: atelier
size: 16:9
paginate: true
header: 'Confidential · Series A Overview'
footer: 'Atelier Ventures Briefing'
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Series A Briefing</span>

# Meridian Supply Intelligence

## Autonomous inventory orchestration for mid-market manufacturers

Elena Rostova, Co-founder & CEO · Nov 2026

---

<!-- transition: rise 0.55s -->
<!-- _class: bento animate-in -->

# The Supply Chain Blind Spot

<div class="bento-grid">

<div class="card span-2" data-fragment="1" data-anim="left">

### Fragmented ERP Telemetry
Mid-market factories run 6 to 11 disconnected spreadsheets between supplier POs and shop-floor scheduling, causing $14B in annual expediting waste.

</div>

<div class="kpi-card card-accent" data-fragment="2" data-anim="zoom">
<span class="kpi-label">Stockout Cost</span>
<span class="kpi-value" data-count-to="18.4" data-suffix="%">18.4%</span>
<span class="kpi-delta down">Gross margin drag per event</span>
</div>

<div class="card" data-fragment="3">

### 14-Day Lag
Manual supplier lead-time updates miss port delays until parts run out.

</div>

<div class="card span-2 card-teal" data-fragment="4" data-anim="right">

### Meridian's Continuous Graph
Real-time SKU risk scoring ingests EDI, freight AIS, and ERP inventory in under 90 seconds—rebalancing safety stock automatically.

</div>

</div>

---

<!-- _class: kpi animate-in -->

# Traction & Revenue Velocity

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Annual Recurring Revenue</span>
<span class="kpi-value" data-count-to="4.8" data-prefix="$" data-suffix="M">$4.8M</span>
<span class="kpi-delta up">+3.1x YoY net ARR growth</span>
<div class="meter"><div class="meter-fill" style="width:88%"></div></div>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Net Dollar Retention</span>
<span class="kpi-value" data-count-to="136" data-suffix="%">136%</span>
<span class="kpi-delta up">Zero enterprise logo churn</span>
<div class="meter"><div class="meter-fill" style="width:92%"></div></div>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Payback Period</span>
<span class="kpi-value" data-count-to="7.2" data-suffix=" mo">7.2 mo</span>
<span class="kpi-delta up">82% software gross margin</span>
<div class="meter"><div class="meter-fill" style="width:76%"></div></div>
</div>

</div>

---

<!-- transition: wipe 0.55s -->
<!-- _class: section animate-in -->

# Unit Economics & Benchmark Comparison

<div class="table-wrap" data-fragment="1">

| Metric | FY25 Actual | FY26 Current | Top-Quartile Target |
|---|---|---|---|
| Enterprise Customers | 19 | 54 | 110 |
| Average Contract Value | $68k | $89k | $115k |
| Gross Margin | 77.5% | 82.1% | 84.0% |
| Magic Number | 0.94 | 1.42 | 1.30+ |

</div>

---

<!-- transition: glide 0.55s -->
<!-- _class: timeline-slide animate-in -->

# 18-Month Use of Funds ($14M Series A)

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">Q1</span>

### Direct ERP Connectors
Ship native SAP S/4HANA and NetSuite zero-ETL sync.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">Q2</span>

### Autonomous Reorder
Automated PO drafting within buyer-approved guardrails.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">Q3</span>

### DACH Expansion
Open Munich engineering & field sales hub.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">Q4</span>

### $12M ARR Gate
Achieve cash-flow breakeven run-rate by Q4 FY27.

</div>

</div>

---

<!-- _class: quote animate-in -->

> Meridian paid back its annual license in six weeks by catching a single resin bottleneck ahead of Q3 peak production.

<cite>VP of Operations · Apex Precision Molding</cite>

---

<!-- transition: iris 0.6s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Series A Round</span>

# Raising $14M to Automate Global Supply

- Lead & syndicate conversations closing December 2026
- Full data room and customer reference calls available on request
`,
  },
  {
    id: 'keynote-product-reveal',
    title: 'Midnight Product Keynote',
    field: 'Design & Product',
    themeId: 'keynote',
    slideCount: 7,
    summary: 'High-impact dark keynote stage featuring radial spotlights, Bento feature showcase, Mermaid pipeline, and animated metrics.',
    markdown: `---
marp: true
theme: keynote
size: 16:9
paginate: true
header: 'Keynote · Platform Release 3.0'
footer: 'Studio Keynote · Live Reveal'
transition: fade 0.5s
---

<!-- _class: lead animate-zoom -->

<span class="eyebrow">Release 3.0</span>

# Meet Aurora Engine

## Sub-millisecond collaborative rendering built for creative teams

Keynote Address · San Francisco

---

<!-- transition: flip 0.6s -->
<!-- _class: bento animate-in -->

# Built Around Three Breakthroughs

<div class="bento-grid">

<div class="card span-2 card-accent" data-fragment="1" data-anim="left">

### Zero-Copy GPU Compositor
Streams vector paths and raster shaders directly in shared WebGPU buffers—keeping 120 FPS locked on 4K displays.

</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Frame Latency</span>
<span class="kpi-value" data-count-to="4.2" data-suffix=" ms">4.2 ms</span>
<span class="kpi-delta up">4.8x faster than v2</span>
</div>

<div class="card" data-fragment="3" data-anim="zoom">

### Spatial Audio Sync
Frame-accurate timeline scrub with live waveform previews.

</div>

<div class="card" data-fragment="4" data-anim="zoom">

### Instant Branching
Review visual design edits in side-by-side diffs.

</div>

<div class="card card-teal" data-fragment="5" data-anim="right">

### Open Token Export
Compiles directly to CSS variables, Swift, and Compose.

</div>

</div>

---

<!-- transition: veil 0.55s -->
<!-- _class: section animate-in -->

# Streaming Pipeline Architecture

\`\`\`mermaid
flowchart LR
    A[User Input] --> B[CRDT Delta Sync]
    B --> C[Scene Graph Compiler]
    C --> D[WebGPU Compute Pass]
    D --> E[120Hz Display Frame]
\`\`\`

<div class="callout info" data-fragment="1">

**Deterministic Playback:** Every edit compiles into an immutable scene delta so remote viewers stay bit-identical.

</div>

---

<!-- _class: split-60-40 animate-in -->

<div class="stack" data-fragment="1" data-anim="left">

### Developer Plugin SDK

<div class="code-window">
<div class="code-bar"><span>aurora.plugin.ts</span><span>TypeScript</span></div>

\`\`\`typescript
import { defineEffect } from '@aurora/sdk';

export default defineEffect({
  name: 'kinetic-focus',
  durationMs: 420,
  onFrame: ({ layer, progress }) => {
    layer.opacity = progress;
    layer.scale = 0.94 + 0.06 * progress;
  },
});
\`\`\`

</div>

</div>

<div class="stack" data-fragment="2" data-anim="right">

<div class="card">

### Hot Reload in 12 ms
Author custom transitions and shaders with zero browser refresh.

</div>

<div class="card">

### Sandboxed Runtime
Zero DOM access keeps host canvases secure across third-party plugins.

</div>

</div>

---

<!-- _class: kpi animate-in -->

# Real-World Studio Benchmarks

<div class="row">

<div class="card" data-fragment="1">

### Cold Load (10k Layers) — 0.38 s
<div class="meter"><div class="meter-fill" style="width:94%"></div></div>
<small>Previously 3.9 s in Aurora 2.x</small>

</div>

<div class="card" data-fragment="2">

### Memory Footprint — 340 MB
<div class="meter"><div class="meter-fill" style="width:78%"></div></div>
<small>58% reduction via GPU texture paging</small>

</div>

</div>

<div class="row">

<div class="card" data-fragment="3">

### Export Render Speed — 6.4x
<div class="meter"><div class="meter-fill" style="width:89%"></div></div>
<small>Hardware-accelerated headless worker pool</small>

</div>

<div class="card" data-fragment="4">

### Crash-Free Sessions — 99.98%
<div class="meter"><div class="meter-fill" style="width:99%"></div></div>
<small>Measured across 1.2M active hours</small>

</div>

</div>

---

<!-- _class: quote animate-in -->

> Aurora 3.0 turns browser-based design tools from compromise into primary workstation.

<cite>Principal Systems Architect · Beta Partner</cite>

---

<!-- transition: iris 0.65s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">General Availability</span>

# Upgrade in One Click Today

- Available across macOS, Linux, and WebGPU browsers
- Free migration utility imports legacy workspaces in seconds
`,
  },
  {
    id: 'cloud-architecture-blueprint',
    title: 'Cloud Systems Blueprint',
    field: 'Engineering & Systems',
    themeId: 'blueprint',
    slideCount: 7,
    summary: 'Architectural grid theme deck for multi-region cloud topologies, SLO gauges, failover timelines, and Terraform modules.',
    markdown: `---
marp: true
theme: blueprint
size: 16:9
paginate: true
header: 'ARCH-109 · Multi-Region Active-Active'
footer: 'Platform Reliability Engineering'
transition: fade 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">System Architecture Blueprint</span>

# Multi-Region Active-Active Mesh

## Zero-RPO failover across three availability zones with deterministic routing

Cloud Infrastructure Group · Architecture Review

---

<!-- _class: section animate-in -->

# Regional Traffic Topology

\`\`\`mermaid
flowchart LR
    DNS[Geo-Anycast Edge] --> US[us-east4 Primary Mesh]
    DNS --> EU[europe-west1 Primary Mesh]
    DNS --> AP[asia-southeast1 Read/Write]
    US <-->|Raft Consensus| EU
    EU <-->|Async CDC| AP
\`\`\`

---

<!-- transition: glide 0.5s -->
<!-- _class: kpi animate-in -->

# Reliability & Latency Targets

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Availability SLO</span>
<span class="kpi-value" data-count-to="99.995" data-suffix="%">99.995%</span>
<span class="kpi-delta up">Max 26 min/year error budget</span>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Regional Failover</span>
<span class="kpi-value" data-count-to="4.5" data-suffix=" sec">4.5 sec</span>
<span class="kpi-delta up">Automated BGP health drain</span>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Cross-AZ P99</span>
<span class="kpi-value" data-count-to="18" data-suffix=" ms">18 ms</span>
<span class="kpi-delta up">gRPC mTLS connection pooling</span>
</div>

</div>

---

<!-- _class: split-40-60 animate-in -->

<div class="stack" data-fragment="1" data-anim="left">

### Guardrail Policies

<ul class="stagger-list">
<li>Strict pod security admission across all namespaces</li>
<li>Regional circuit breakers trip at 2.5% 5xx threshold</li>
<li>Immutable artifact digests signed via Sigstore</li>
</ul>

</div>

<div class="stack" data-fragment="2" data-anim="right">

<div class="code-window">
<div class="code-bar"><span>mesh-failover.yaml</span><span>Kubernetes</span></div>

\`\`\`yaml
apiVersion: networking.mesh/v1
kind: TrafficPolicy
metadata:
  name: active-active-ingress
spec:
  outlierDetection:
    consecutive5xxErrors: 3
    interval: 5s
    baseEjectionTime: 30s
\`\`\`

</div>

</div>

---

<!-- _class: timeline-slide animate-in -->

# Chaos Game-Day Protocol

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">01</span>

### Fault Injection
Sever primary NAT gateway in staging canary cluster.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">02</span>

### Edge Re-Route
Verify Anycast drains unhealthy PoP within 5 seconds.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">03</span>

### Ledger Audit
Confirm zero split-brain writes or duplicate sequences.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">04</span>

### Auto Recovery
Restore primary and verify gradual 10-50-100% ramp.

</div>

</div>

---

<!-- _class: section animate-in -->

# Cost vs. Resilience Matrix

<div class="table-wrap" data-fragment="1">

| Tier | Replication | RPO / RTO | Monthly Infra Delta |
|---|---|---|---|
| Single Region | Synchronous local AZ | 0 / 15 min | Baseline |
| Warm Standby | Async cross-region snapshot | 30s / 3 min | +28% |
| Active-Active Mesh | Multi-region consensus | 0 / < 5s | +54% |

</div>

---

<!-- transition: zoom 0.55s -->
<!-- _class: closing animate-in -->

<span class="eyebrow">Architecture Sign-Off</span>

# Ready for Production Rollout

- Terraform module PR #412 approved by Security & FinOps
- First live regional failover drill scheduled next Tuesday
`,
  },
  {
    id: 'design-system-guidelines',
    title: 'Design System & Token Audit',
    field: 'Design & Product',
    themeId: 'nordic',
    slideCount: 6,
    summary: 'Clean Scandinavian audit deck for typography scales, WCAG contrast tables, component adoption meters, and migration.',
    markdown: `---
marp: true
theme: nordic
size: 16:9
paginate: true
header: 'Design Systems · Token Governance'
footer: 'UI Foundations Team'
transition: fade 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Design Foundations</span>

# Unified Token & Component Audit

## Consolidating 140 legacy UI styles into 24 semantic primitives

Design Systems Engineering · Q4 Review

---

<!-- _class: bento animate-in -->

# Token Architecture Overview

<div class="bento-grid">

<div class="card span-2" data-fragment="1">

### Three-Tier Semantic Hierarchy
Primitive palette values map to semantic surface/ink roles, which bind cleanly to component tokens across Web, iOS, and Android.

</div>

<div class="kpi-card card-teal" data-fragment="2" data-anim="pop">
<span class="kpi-label">WCAG AA Pass Rate</span>
<span class="kpi-value" data-count-to="100" data-suffix="%">100%</span>
<span class="kpi-delta up">4.5:1+ verified pairs</span>
</div>

<div class="card" data-fragment="3">

### 2 Font Families
Plus Jakarta Sans display paired with DM Sans prose.

</div>

<div class="card" data-fragment="4">

### 4px Spatial Grid
Consistent spacing rhythm from 4px gaps to 48px sections.

</div>

<div class="card" data-fragment="5">

### Zero CSS Drift
Automated Figma-to-PR token sync runs nightly.

</div>

</div>

---

<!-- _class: section animate-in -->

# Component Library Adoption

<div class="row">

<div class="card" data-fragment="1">

### Core Inputs & Forms — 92%
<div class="meter"><div class="meter-fill" style="width:92%"></div></div>
<small>Remaining 8% in legacy billing wizard</small>

</div>

<div class="card" data-fragment="2">

### Navigation & Drawers — 87%
<div class="meter"><div class="meter-fill" style="width:87%"></div></div>
<small>Full keyboard Escape + focus-trap parity</small>

</div>

</div>

<div class="row">

<div class="card" data-fragment="3">

### Data Tables & Lists — 95%
<div class="meter"><div class="meter-fill" style="width:95%"></div></div>
<small>Enforces tabular numerals across all metrics</small>

</div>

<div class="card" data-fragment="4">

### Dark Mode Surfaces — 100%
<div class="meter"><div class="meter-fill" style="width:100%"></div></div>
<small>Zero split-brain text contrast issues</small>

</div>

</div>

---

<!-- _class: section animate-in -->

# Contrast & Accessibility Verification

<div class="table-wrap" data-fragment="1">

| Surface Pair | Foreground | Background | Ratio | Status |
|---|---|---|---|---|
| Primary Body | #1E293B | #F8FAFC | 13.8 : 1 | AAA Pass |
| Secondary Label | #475569 | #FFFFFF | 7.6 : 1 | AAA Pass |
| Primary Action | #FFFFFF | #0D9488 | 4.6 : 1 | AA Pass |
| Dark Mode Body | #E2E8F0 | #0F172A | 12.9 : 1 | AAA Pass |

</div>

---

<!-- _class: timeline-slide animate-in -->

# Legacy Deprecation Plan

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">01</span>

### Codemod Sweep
Replace legacy hex utilities with semantic tokens.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">02</span>

### Visual Regression
Snapshot diff 48 key routes in light and dark modes.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">03</span>

### Bundle Purge
Drop 64 KB of duplicate stylesheet overrides.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">04</span>

### Lint Enforcement
Block non-semantic colors in CI pull requests.

</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Design Governance</span>

# Ship Consistent Interfaces Everywhere

- Docs & interactive playground live in Storybook
- Weekly Design Systems office hours every Wednesday
`,
  },
  {
    id: 'beamer-cambridge-defense',
    title: 'Academic Paper Defense (Beamer)',
    field: 'Academic & Research',
    themeId: 'beamer-madrid',
    slideCount: 7,
    summary: 'Overleaf Beamer Cambridge/Madrid layout with framed title banner, structured footline, theorem/alert blocks, and numbered bibliography.',
    markdown: `---
marp: true
theme: beamer-madrid
math: mathjax
paginate: true
header: "Department of Computer Science · Conference Defense"
footer: "Dr. Elena Vance · MIT / CSAIL | NeurIPS 2026 Oral"
transition: rise 0.45s
---

<!-- _class: lead animate-in -->

<div class="title-banner">

# Certified Lipschitz Bounds for Sparse Transformers

Sub-quadratic attention routing with deterministic robustness guarantees

</div>

<div class="row" style="margin-top:20px">

<div class="card">

**Authors:** Elena Vance, Marcus Chen
**Affiliation:** Applied Mathematics & CSAIL

</div>

<div class="card">

**Venue:** Conference Oral Presentation
**Session:** Optimization & Theory · Room 304

</div>

</div>

<!-- Speaker note: Introduce the paper title, co-authors, and why Lipschitz continuity matters for sparse attention. -->

---

<!-- _class: agenda animate-in -->

# Talk Outline

<div class="agenda-list">

<div class="agenda-item" data-fragment="1">
<span class="agenda-num">01</span>
<div>

### Problem & Bottlenecks
Why standard softmax routing loses stability guarantees.

</div>
</div>

<div class="agenda-item" data-fragment="2">
<span class="agenda-num">02</span>
<div>

### Main Theorem & Proof
Spectral normalization under sparse top-k masks.

</div>
</div>

<div class="agenda-item" data-fragment="3">
<span class="agenda-num">03</span>
<div>

### Empirical Ablations
Throughput, memory, and adversarial accuracy.

</div>
</div>

<div class="agenda-item" data-fragment="4">
<span class="agenda-num">04</span>
<div>

### References & Open Work
Citation index and extension to state-space layers.

</div>
</div>

</div>

---

<!-- _class: section animate-in -->

# Motivation & Structural Blocks

<div class="beamer-block" data-fragment="1">
<div class="beamer-block-title">Definition 1 — Sparse Attention Operator</div>
<div class="beamer-block-body">

Standard multi-head dot-product attention scales quadratically $O(N^2 d)$ with sequence length $N$. Replacing dense softmax with a bounded $k$-sparse projection lowers compute to $O(N k d)$.

</div>
</div>

<div class="beamer-alert" data-fragment="2">
<div class="beamer-block-title">Alert — Why Naive Top-k Breaks Continuity</div>
<div class="beamer-block-body">

Hard top-$k$ indicator masks introduce **jump discontinuities** near tie boundaries, yielding unbounded Lipschitz constants under small input perturbations.

</div>
</div>

<div class="beamer-example" data-fragment="3">
<div class="beamer-block-title">Example — Smooth Margin Coupling</div>
<div class="beamer-block-body">

Introducing a temperature-calibrated margin $\tau > 0$ restores $C^1$ differentiability everywhere while preserving 92% sparsity.

</div>
</div>

---

<!-- _class: section animate-in -->

# Main Theoretical Result

<div class="beamer-block" data-fragment="1">
<div class="beamer-block-title">Theorem 2.1 (Bounded Global Lipschitz Constant)</div>
<div class="beamer-block-body">

If query-key weights satisfy $\\|W_Q\\|_2 \\le \\gamma_Q$ and $\\|W_K\\|_2 \\le \\gamma_K$ on bounded domain $\\|X\\|_\\infty \\le B$, then the sparse attention map $f_\\tau$ satisfies:

$$
\\|f_\\tau(X) - f_\\tau(X')\\|_F \\le \\left(1 + \\frac{4 B^2 \\gamma_Q \\gamma_K}{\\tau}\\right) \\|X - X'\\|_F
$$

</div>
</div>

<div class="proof-box" data-fragment="2">

**Proof Sketch:** Bound the Jacobian of the entropic projection via Danskin's envelope theorem, then apply sub-multiplicativity over residual blocks.

</div>

---

<!-- _class: section animate-in -->

# Empirical Benchmarks & Ablation

<div class="table-wrap" data-fragment="1">

| Attention Variant | Context Len | Latency (ms) | Peak VRAM | Certified Acc (%) |
|---|---|---|---|---|
| Dense Softmax (Baseline) | 16k | 41.2 | 18.4 GB | 61.4% |
| Hard Top-k Sparse | 16k | 11.8 | 6.2 GB | 48.9% |
| **Margin-Coupled (Ours)** | **16k** | **12.4** | **6.4 GB** | **79.3%** |

</div>

<div class="callout ok" data-fragment="2" style="margin-top:16px">

**Key Result:** Our margin-coupled sparse block achieves **3.3x lower latency** than dense attention while improving certified adversarial accuracy by **+17.9 pts**.

</div>

---

<!-- _class: section animate-in -->

# References & Citations

<div class="bib-list">

<div class="bib-item" data-fragment="1">
<span class="bib-key">[1]</span>
<div><strong>Kim, H., &amp; Papadopoulos, A. (2024).</strong> Smooth Sparsemax Projections for Sequence Modeling. <em>Journal of Machine Learning Research</em>, 25(4), 112–148.</div>
</div>

<div class="bib-item" data-fragment="2">
<span class="bib-key">[2]</span>
<div><strong>Tsuzuku, Y., Sato, I., &amp; Sugiyama, M. (2023).</strong> Lipschitz-Margin Training for Provably Robust Neural Networks. <em>Advances in Neural Information Processing Systems</em>.</div>
</div>

<div class="bib-item" data-fragment="3">
<span class="bib-key">[3]</span>
<div><strong>Vance, E., &amp; Chen, M. (2026).</strong> Code, checkpoints, and Coq proof artifacts available at <code>github.com/csail/margin-sparse</code>.</div>
</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Thank You</span>

# Questions & Discussion

- Preprint & proofs: \`arxiv.org/abs/2604.01842\`
- Contact: \`evance@csail.example.edu\`
`,
  },
  {
    id: 'metropolis-thesis-talk',
    title: 'Dissertation Seminar (Metropolis)',
    field: 'Academic & Research',
    themeId: 'metropolis',
    slideCount: 7,
    summary: 'Overleaf Metropolis minimalist layout with dark slate frame headers, amber progress lines, standout dividers, and Mermaid pipeline.',
    markdown: `---
marp: true
theme: metropolis
math: mathjax
paginate: true
footer: "Graduate Colloquium · Systems Verification Lab"
transition: glide 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Doctoral Seminar</span>

# Verifying Distributed Consensus Under Byzantine Clock Drift

Automated temporal safety proofs for geo-replicated state machines

---

<!-- _class: standout animate-in -->

<span class="eyebrow">Section 01</span>

# Bridging TLA+ Models and Production Rust Code

Why timing assumptions silently break real-world consensus deployments.

---

<!-- _class: section animate-in -->

# Literature Gap: Classic vs. Bounded-Drift

<div class="compare-grid">

<div class="compare-card before" data-fragment="1" data-anim="left">
<span class="compare-label">Existing Assumption</span>

### Unbounded Asynchronous Safety
- Ignores physical oscillator skew bounds
- Cannot prove liveness for lease-based reads
- Leaves timeout thresholds as manual magic constants

</div>

<div class="compare-card after" data-fragment="2" data-anim="right">
<span class="compare-label">Our Framework</span>

### Drift-Aware Refinement
- Encodes hardware PTP skew $\\rho \\le 50\\,\\text{ppm}$ directly
- Proves linearizable leader leases mechanically
- Extracts verified timeout bounds straight into Rust

</div>

</div>

---

<!-- _class: section animate-in -->

# End-to-End Verification Pipeline

\`\`\`mermaid
flowchart LR
  Spec[Timed TLA+ Spec] --> Checker[SMT Solver]
  Checker --> Cert[Refinement Proof]
  Cert --> Codegen[Verified Rust State Machine]
\`\`\`

<div class="card" data-fragment="1" style="margin-top:12px">

**Soundness Invariant:** Any lease overlap event violates the drift margin constraint $\\Delta_{\\text{lease}} > (1 + \\rho)\\,T_{\\text{RTT}}$ and fails compilation at CI check time.

</div>

---

<!-- _class: kpi animate-in -->

# Experimental Evaluation Across 5 Regions

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Read Latency P99</span>
<span class="kpi-value" data-count-to="4.2" data-suffix=" ms">4.2 ms</span>
<span class="kpi-delta up">-71% vs. quorum reads</span>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Verified LOC</span>
<span class="kpi-value" data-count-to="14.8" data-suffix="k">14.8k</span>
<span class="kpi-delta up">Zero unverified unsafe blocks</span>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Faults Injected</span>
<span class="kpi-value" data-count-to="1200">1200</span>
<span class="kpi-delta up">0 linearizability violations</span>
</div>

</div>

---

<!-- _class: section animate-in -->

# Appendix: Clock Skew Bound Summary

<div class="formula-box" data-fragment="1">

$$
t_{\\text{expire}}^{(i)} - t_{\\text{grant}}^{(j)} \\ge \\frac{L_{\\min}}{1 + \\rho} - (1 + \\rho)\\,D_{\\max} > 0
$$

</div>

<div class="row" style="margin-top:14px">

<div class="card" data-fragment="2">

### Hardware Support
Tested on AWS Time Sync and Chrony PTP NICs with sub-microsecond bounds.

</div>

<div class="card" data-fragment="3">

### Open Challenges
Extending drift proofs to dynamic cluster membership reconfigurations.

</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Colloquium Discussion</span>

# Thank You — Open for Questions

- Artifact repository & proof scripts ready for peer review
- Feedback welcome on multi-region reconfiguration invariants
`,
  },
  {
    id: 'strategy-swot-competitive',
    title: 'SWOT & Competitive Matrix',
    field: 'Business & Strategy',
    themeId: 'executive',
    slideCount: 6,
    summary: 'Strategic planning deck featuring a 2x2 SWOT quadrant grid, multi-competitor capability table, Bento strategic bets, and 4-quarter roadmap.',
    markdown: `---
marp: true
theme: executive
paginate: true
header: "Corporate Strategy · Annual Planning Review"
footer: "Strategy & Market Intelligence"
transition: wipe 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Strategic Planning</span>

# FY27 Market Positioning &amp; Competitive Response

Diagnostic SWOT analysis, capability benchmarks, and quarterly execution bets

---

<!-- _class: section animate-in -->

# 2x2 Strategic SWOT Matrix

<div class="swot-grid">

<div class="swot-card s" data-fragment="1" data-anim="zoom">

### Strengths (Internal)
- Sub-50ms edge inference latency across 24 regions
- 96% gross dollar retention in mid-market accounts

</div>

<div class="swot-card w" data-fragment="2" data-anim="zoom">

### Weaknesses (Internal)
- Self-serve onboarding drops 38% at team invite step
- Limited native ERP and procurement connectors

</div>

<div class="swot-card o" data-fragment="3" data-anim="zoom">

### Opportunities (External)
- Enterprise AI governance mandates rising in EU &amp; US
- Mid-market consolidation away from legacy point tools

</div>

<div class="swot-card t" data-fragment="4" data-anim="zoom">

### Threats (External)
- Hyperscalers bundling basic telemetry into cloud tiers
- Longer CFO procurement cycles on >$100k contracts

</div>

</div>

---

<!-- _class: section animate-in -->

# Competitive Capability Benchmark

<div class="table-wrap" data-fragment="1">

| Capability Dimension | Premarks Core | Legacy Vendor A | Point Tool B | Open-Source Stack |
|---|---|---|---|---|
| Automated Governance | Full Policy Engine | Add-On Only | None | Manual Scripts |
| Deployment Footprint | Cloud + VPC Hybrid | Multi-Cloud | SaaS Only | Self-Hosted |
| Time to First Value | < 15 Minutes | 6–8 Weeks | 2 Days | 3–5 Days |
| Median Annual TCO | $28,000 | $94,000 | $42,000 | $55,000 (Ops) |

</div>

---

<!-- _class: bento animate-in -->

# Three High-Conviction Strategic Bets

<div class="bento-grid">

<div class="card span-2" data-fragment="1" data-anim="left">

### 1. Frictionless Workspace Onboarding
Replace 9-step setup wizard with single-click SSO + sample workspace provisioning, targeting +25 pts activation lift.

</div>

<div class="kpi-card card-accent" data-fragment="2" data-anim="zoom">
<span class="kpi-label">Pipeline Goal</span>
<span class="kpi-value" data-count-to="3.2" data-suffix="x">3.2x</span>
<span class="kpi-delta up">Qualified enterprise trials</span>
</div>

<div class="card" data-fragment="3">

### 2. Native ERP Connectors
Ship certified SAP and NetSuite sync in Q2 to unlock CFO buyers.

</div>

<div class="card span-2 card-teal" data-fragment="4" data-anim="right">

### 3. Compliance Audit Pack
Bundle SOC2, ISO 42001, and automated lineage logs as a differentiator against low-end challengers.

</div>

</div>

---

<!-- _class: timeline-slide animate-in -->

# Four-Quarter Execution Sequence

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">Q1</span>

### Activation Fix
Ship 1-click SSO onboarding and telemetry funnel.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">Q2</span>

### Ecosystem
Launch ERP connectors and partner co-sell motion.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">Q3</span>

### Compliance Pack
Release automated EU AI governance reporting module.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">Q4</span>

### Global Expansion
Open Frankfurt &amp; Singapore VPC data residency zones.

</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Decision Requested</span>

# Align Capital Around Top 3 Strategic Bets

- Approve $1.4M engineering allocation for ERP &amp; compliance tracks
- Review activation funnel recovery metrics at Q1 mid-quarter check-in
`,
  },
  {
    id: 'agency-case-study',
    title: 'Client Case Study & ROI',
    field: 'Creative & Portfolio',
    themeId: 'editorial-split',
    slideCount: 6,
    summary: 'Editorial studio case study featuring a split-screen cover, oversized hero metric, before-vs-after redesign cards, and verified client quote.',
    markdown: `---
marp: true
theme: editorial-split
paginate: true
footer: "Northlight Studio · Selected Case Study"
transition: veil 0.5s
---

<!-- _class: split-hero animate-in -->

<div class="hero-left">

<span class="eyebrow">Client Case Study</span>

# Reimagining FinLedger's Checkout Experience

How a 10-week product redesign cut abandonment in half across 14 markets.

</div>

<div class="hero-right">

<div class="card">

### Engagement Snapshot
- **Client:** FinLedger Payments
- **Timeline:** 10 Weeks (Discovery to Launch)
- **Scope:** Design System, Checkout Flow, Mobile SDK

</div>

</div>

---

<!-- _class: split-40-60 animate-in -->

<div class="stat-hero" data-fragment="1" data-anim="zoom">
<span class="stat-num" data-count-to="42" data-suffix="%">42%</span>
<span class="stat-caption">Checkout drop-off rate before engagement across European mobile wallets</span>
</div>

<div class="stack" data-fragment="2" data-anim="right">

# The Client Challenge

FinLedger's legacy payment flow required six separate form screens and forced full page reloads on 3DS verification.

- Mobile shoppers abandoned carts at 2.4x the desktop rate
- Support tickets spiked 31% around localized IBAN validation errors
- Engineering maintained 4 inconsistent UI codebases across regions

</div>

---

<!-- _class: timeline-slide animate-in -->

# Three-Stage Studio Methodology

<div class="row-3">

<div class="card" data-fragment="1">

### 01. Field Research
Audited 18,000 anonymized checkout sessions and interviewed 24 enterprise merchants.

</div>

<div class="card card-accent" data-fragment="2">

### 02. Token Architecture
Consolidated four fragmented CSS libraries into one accessible, multi-currency component kit.

</div>

<div class="card card-teal" data-fragment="3">

### 03. Progressive Rollout
Shipped A/B experiments across 5% to 100% traffic with real-time conversion telemetry.

</div>

</div>

---

<!-- _class: section animate-in -->

# Before vs. After Redesign

<div class="compare-grid">

<div class="compare-card before" data-fragment="1" data-anim="left">
<span class="compare-label">Before Redesign</span>

### Legacy 6-Step Form Flow
- 19 required manual input fields per checkout
- Unlocalized postal &amp; IBAN error messages
- 4.6s median interactive load time on 4G mobile

</div>

<div class="compare-card after" data-fragment="2" data-anim="right">
<span class="compare-label">After Launch</span>

### Unified Express Checkout
- Single adaptive sheet with instant wallet detection
- Inline regional formatting and zero-reload 3DS
- 1.3s interactive time with 100% WCAG AA contrast

</div>

</div>

---

<!-- _class: kpi animate-in -->

# Verified 90-Day Business Outcomes

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Conversion Lift</span>
<span class="kpi-value" data-count-to="38" data-prefix="+" data-suffix="%">+38%</span>
<span class="kpi-delta up">Mobile checkout completion</span>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Annual GMV Impact</span>
<span class="kpi-value" data-count-to="24.5" data-prefix="$" data-suffix="M">$24.5M</span>
<span class="kpi-delta up">Incremental processed volume</span>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Support Reduction</span>
<span class="kpi-value" data-count-to="54" data-prefix="-" data-suffix="%">-54%</span>
<span class="kpi-delta up">Payment validation tickets</span>
</div>

</div>

---

<!-- _class: quote animate-in -->

> Northlight turned our highest-friction payment bottleneck into our strongest conversion advantage inside a single quarter.

<cite>Maya Lindqvist, VP of Product at FinLedger Payments</cite>
`,
  },
  {
    id: 'workshop-sprint-retro',
    title: 'Team Workshop & Sprint Retro',
    field: 'Workshops & Teams',
    themeId: 'nordic',
    slideCount: 6,
    summary: 'Facilitator-ready team workshop and agile retrospective board with timeboxed schedule, 3-column retro layout, and breakout exercise box.',
    markdown: `---
marp: true
theme: nordic
paginate: true
header: "Product Engineering · Sprint 42 Retrospective"
footer: "60-Minute Team Workshop"
transition: glide 0.4s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Team Workshop</span>

# Sprint 42 Retrospective &amp; Q3 Cadence Reset

Structured reflection, bottleneck diagnosis, and shared working agreements

<div class="callout info" style="margin-top:16px">

**Prime Directive:** Regardless of what we discover, we assume everyone did the best job possible given what was known at the time.

</div>

---

<!-- _class: agenda animate-in -->

# Timeboxed Session Agenda (60 min)

<div class="agenda-list">

<div class="agenda-item" data-fragment="1">
<span class="agenda-num">10m</span>
<div>

### Check-In &amp; Sprint Metrics
Review shipped scope, incident load, and velocity drift.

</div>
</div>

<div class="agenda-item" data-fragment="2">
<span class="agenda-num">20m</span>
<div>

### Silent Retro Board Writing
Individual sticky capture across What Worked, Friction, and Ideas.

</div>
</div>

<div class="agenda-item" data-fragment="3">
<span class="agenda-num">15m</span>
<div>

### Breakout Root-Cause Pairings
Small groups dissect the top two recurring blockers.

</div>
</div>

<div class="agenda-item" data-fragment="4">
<span class="agenda-num">15m</span>
<div>

### Action Owners &amp; Checkouts
Assign concrete experiments with due dates for Sprint 43.

</div>
</div>

</div>

---

<!-- _class: section animate-in -->

# Sprint 42 Retro Board

<div class="row-3">

<div class="retro-col good" data-fragment="1">

### What Went Well
- Zero-downtime billing schema rollout across EU shards
- Design-eng pairing cut UI QA bugs by 45%
- Automated preview links sped up PM sign-off

</div>

<div class="retro-col warn" data-fragment="2">

### Friction &amp; Blockers
- Flaky E2E CI queue added 35m wait per PR
- Late API contract changes stalled mobile branch
- On-call handoff lacked database runbook links

</div>

<div class="retro-col act" data-fragment="3">

### Experiments to Try
- Freeze API schemas 48h prior to sprint midpoint
- Split visual regression into parallel shard jobs
- Run 15m async Friday runbook hygiene check

</div>

</div>

---

<!-- _class: section animate-in -->

# Breakout Exercise: Elimination Audit

<div class="exercise-box" data-fragment="1">
<div class="exercise-meta">BREAKOUT ACTIVITY · 15 MINUTES · PAIRS OF 3</div>

### Identify One Recurring Ceremony or Handoff to Automate or Drop

1. List every status meeting or manual verification step your squad ran twice this sprint.
2. Circle the single highest-friction step that delayed shipping a pull request.
3. Draft a 1-sentence replacement rule and nominate an owner to test it next week.

</div>

<div class="callout ok" data-fragment="2" style="margin-top:16px">

**Facilitator Tip:** Capture each pair's replacement rule directly in the table on the next slide before wrapping up.

</div>

---

<!-- _class: section animate-in -->

# Sprint 43 Action Commitments

<div class="table-wrap" data-fragment="1">

| Action Item | Owner | Target Date | Success Metric |
|---|---|---|---|
| Parallelize Playwright CI runner into 4 shards | DevOps Squad | Next Wednesday | PR check time < 8 min |
| Publish GraphQL contract diff check in GitHub Actions | Platform Lead | Friday | 0 breaking schema merges |
| Consolidate Tuesday &amp; Thursday triage into async Slack | Product &amp; QA | Immediate | Save 2.5 hrs / engineer |

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Wrap-Up</span>

# Next Retro: Two Weeks From Today

- Action owners post mid-sprint progress update next Wednesday
- Thanks everyone for candid reflection and crisp commitments
`,
  },
  {
    id: 'saas-pricing-packaging',
    title: 'SaaS Pricing & Rollout',
    field: 'Design & Product',
    themeId: 'keynote',
    slideCount: 6,
    summary: 'B2B product pricing and packaging launch deck with 3-tier pricing cards, entitlement matrix, ROI counters, and migration roadmap.',
    markdown: `---
marp: true
theme: keynote
paginate: true
header: "Product Packaging · Commercial Launch"
footer: "Pricing & Packaging Committee"
transition: iris 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Commercial Release</span>

# Introducing Usage-Aligned Tiers for Platform 3.0

Clear plan boundaries, predictable team scaling, and zero surprise overages

---

<!-- _class: section animate-in -->

# Three-Tier Plan Architecture

<div class="pricing-grid">

<div class="pricing-card" data-fragment="1" data-anim="pop">
<div>
<span class="pricing-tier">Starter · Early Teams</span>
<div class="pricing-price">$29 <small style="font-size:14px;font-weight:500">/ seat / mo</small></div>
</div>

- Up to 10 active workspaces
- 50,000 monthly API renders
- Community &amp; email support (48h SLA)

</div>

<div class="pricing-card featured" data-fragment="2" data-anim="pop">
<div>
<span class="pricing-tier">Pro · Scaling Operations</span>
<div class="pricing-price">$79 <small style="font-size:14px;font-weight:500">/ seat / mo</small></div>
</div>

- Unlimited shared workspaces &amp; brand kits
- 500,000 monthly API renders + MCP access
- Priority support (4h SLA) &amp; audit logs

</div>

<div class="pricing-card" data-fragment="3" data-anim="pop">
<div>
<span class="pricing-tier">Enterprise · Custom</span>
<div class="pricing-price">Custom <small style="font-size:14px;font-weight:500">annual</small></div>
</div>

- Dedicated VPC &amp; regional data residency
- Custom rate quotas + SAML / SCIM provisioning
- Named Solutions Engineer &amp; 99.99% SLA

</div>

</div>

---

<!-- _class: section animate-in -->

# Plan Entitlement Matrix

<div class="table-wrap" data-fragment="1">

| Feature &amp; Quota | Starter | Pro | Enterprise |
|---|---|---|---|
| Concurrent Export Workers | 2 workers | 10 workers | Dedicated Cluster |
| SSO &amp; Role-Based Access | Google OAuth | OAuth + Custom Roles | SAML 2.0 + SCIM |
| Audit Log Retention | 14 days | 365 days | 7 years (Immutable) |
| Custom Brand Domains | — | Up to 3 domains | Unlimited |

</div>

---

<!-- _class: kpi animate-in -->

# Modeled Revenue &amp; Customer Payback

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="zoom">
<span class="kpi-label">Net Expansion Lift</span>
<span class="kpi-value" data-count-to="124" data-suffix="%">124%</span>
<span class="kpi-delta up">Projected annual NDR</span>
</div>

<div class="kpi-card" data-fragment="2" data-anim="zoom">
<span class="kpi-label">Self-Serve Upgrade</span>
<span class="kpi-value" data-count-to="18.4" data-suffix="%">18.4%</span>
<span class="kpi-delta up">Starter to Pro conversion</span>
</div>

<div class="kpi-card" data-fragment="3" data-anim="zoom">
<span class="kpi-label">Median Payback</span>
<span class="kpi-value" data-count-to="2.6" data-suffix=" mos">2.6 mos</span>
<span class="kpi-delta up">Customer acquisition payback</span>
</div>

</div>

---

<!-- _class: timeline-slide animate-in -->

# Legacy Customer Migration Plan

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">01</span>

### Price Lock Notice
Grandfather all existing annual contracts for 12 months.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">02</span>

### Usage Calculator
Ship interactive quota preview inside Billing settings.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">03</span>

### Opt-In Bonus
Offer 20% credit bonus for early Pro migration.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">04</span>

### Full Cutover
Enable automated tier metering on new signups.

</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Go-To-Market Ready</span>

# Launch Target: First Monday of Q2

- Pricing FAQ &amp; enterprise calculator finalized with Sales Ops
- Billing webhooks and quota alerts verified in staging
`,
  },
  {
    id: 'annual-impact-report',
    title: 'Annual Impact & ESG Report',
    field: 'Editorial & Humanities',
    themeId: 'botanical-esg',
    slideCount: 6,
    summary: 'Verdant forest institutional annual report featuring tabulated impact counters, progress meters, regional allocations, and governance pledges.',
    markdown: `---
marp: true
theme: botanical-esg
paginate: true
header: "Verdant Stewardship Foundation · Annual Report"
footer: "FY26 Audited Environmental & Community Impact"
transition: rise 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Annual Impact Report</span>

# Restoring Watersheds &amp; Clean Grid Capacity

Audited environmental outcomes, community grants, and 2027 commitments

---

<!-- _class: kpi animate-in -->

# Year in Numbers — Verified Outcomes

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Hectares Restored</span>
<span class="kpi-value" data-count-to="48200">48200</span>
<span class="kpi-delta up">+31% vs. FY25 baseline</span>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Clean Microgrids</span>
<span class="kpi-value" data-count-to="116">116</span>
<span class="kpi-delta up">Serving 84,000 residents</span>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Direct Program Ratio</span>
<span class="kpi-value" data-count-to="91.4" data-suffix="%">91.4%</span>
<span class="kpi-delta up">8.6% admin &amp; audit overhead</span>
</div>

</div>

---

<!-- _class: bento animate-in -->

# Portfolio Goal Attainment

<div class="bento-grid">

<div class="card span-2" data-fragment="1" data-anim="left">

### Coastal Mangrove &amp; Wetland Recovery — 92%
<div class="meter"><div class="meter-fill" style="width:92%"></div></div>
Surpassed 5-year flood buffer target across 14 delta municipalities ahead of schedule.

</div>

<div class="card card-accent" data-fragment="2" data-anim="zoom">

### Verified Audit
100% satellite &amp; field ground-truthed data published openly.

</div>

<div class="card" data-fragment="3">

### Solar Schools — 84%
<div class="meter"><div class="meter-fill" style="width:84%"></div></div>
68 rural schools equipped with battery backup.

</div>

<div class="card span-2 card-teal" data-fragment="4" data-anim="right">

### Zero-Carbon Supply Logistics — 78%
<div class="meter"><div class="meter-fill" style="width:78%"></div></div>
Transitioned regional freight partners to electric rail and green hydrogen corridors.

</div>

</div>

---

<!-- _class: section animate-in -->

# Regional Grant Distribution

<div class="table-wrap" data-fragment="1">

| Geographic Corridor | Active Grants | Capital Deployed | CO2e Abated (Tonnes) |
|---|---|---|---|
| Southeast Asia Basins | 34 programs | $14.2M | 192,400 t |
| East African Highlands | 28 programs | $11.8M | 146,800 t |
| Andean Watersheds | 19 programs | $8.6M | 98,200 t |
| Northern Peatlands | 14 programs | $6.4M | 118,500 t |

</div>

---

<!-- _class: section animate-in -->

# Governance &amp; 2027 Stewardship Pledges

<div class="row">

<div class="card" data-fragment="1">

### Independent Verification
All ecological claims audited quarterly against Gold Standard and Verra open registries.

</div>

<div class="card card-accent" data-fragment="2">

### 2027 Horizon Goal
Scale community-owned microgrid capacity by 2.0x while maintaining &gt;90% direct grant efficiency.

</div>

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Transparency &amp; Open Data</span>

# Full Dataset &amp; Audited Ledger Published Online

- Download raw geospatial boundaries and grant ledgers at \`impact.verdant.org\`
- Thank you to 410 local partner cooperatives across 22 countries
`,
  },
  {
    id: 'engineering-postmortem',
    title: 'Incident Postmortem & SRE Review',
    field: 'Engineering & Systems',
    themeId: 'obsidian',
    slideCount: 6,
    summary: 'Blameless engineering incident review with blast radius KPIs, minute-by-minute UTC timeline, 5-Whys root cause, and remediation tracker.',
    markdown: `---
marp: true
theme: obsidian
paginate: true
header: "Site Reliability Engineering · INC-2026-084"
footer: "Blameless Incident Review · Severity 1"
transition: focus 0.45s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">Postmortem Review</span>

# INC-2026-084: EU-West Checkout Queue Saturation

Blameless root-cause analysis, timeline reconstruction, and systemic safeguards

<div class="callout info" style="margin-top:16px">

**Summary:** A connection pool exhaustion cascade degraded EU-West checkout APIs for 23 minutes during peak traffic before automated traffic shedding restored SLO.

</div>

---

<!-- _class: kpi animate-in -->

# Customer Impact &amp; Detection Metrics

<div class="kpi-grid">

<div class="kpi-card" data-fragment="1" data-anim="pop">
<span class="kpi-label">Total Duration</span>
<span class="kpi-value" data-count-to="23" data-suffix=" min">23 min</span>
<span class="kpi-delta down">14:12 – 14:35 UTC</span>
</div>

<div class="kpi-card" data-fragment="2" data-anim="pop">
<span class="kpi-label">Time to Detect</span>
<span class="kpi-value" data-count-to="90" data-suffix=" sec">90 sec</span>
<span class="kpi-delta up">Automated burn-rate alert</span>
</div>

<div class="kpi-card" data-fragment="3" data-anim="pop">
<span class="kpi-label">Failed Requests</span>
<span class="kpi-value" data-count-to="4.1" data-suffix="%">4.1%</span>
<span class="kpi-delta">EU-West regional traffic only</span>
</div>

</div>

---

<!-- _class: timeline-slide animate-in -->

# Incident Timeline (UTC)

<div class="timeline">

<div class="timeline-step" data-fragment="1">
<span class="timeline-num">14:12</span>

### Config Rollout
Read-replica timeout bumped from 2s to 30s in Terraform.

</div>

<div class="timeline-step" data-fragment="2">
<span class="timeline-num">14:14</span>

### Alert Fires
P99 latency crosses 1,200ms; on-call SRE paged.

</div>

<div class="timeline-step" data-fragment="3">
<span class="timeline-num">14:24</span>

### Mitigation
Circuit breaker engaged; stale replica pool drained.

</div>

<div class="timeline-step" data-fragment="4">
<span class="timeline-num">14:35</span>

### Full Recovery
Error rate returns below 0.02% baseline for 10 min.

</div>

</div>

---

<!-- _class: section animate-in -->

# Root Cause &amp; Contributing Factors

<div class="row">

<div class="card card-accent" data-fragment="1" data-anim="left">

### Trigger Mechanism
Longer 30s query timeouts kept worker threads blocked during a brief index lock, exhausting PgBouncer client slots across all 18 pods.

</div>

<div class="card card-teal" data-fragment="2" data-anim="right">

### Why It Amplified
Client SDKs retried 503 responses immediately without jittered exponential backoff, creating a 3.4x retry storm against recovering nodes.

</div>

</div>

<div class="callout ok" data-fragment="3" style="margin-top:14px">

**What Worked Well:** Multi-burn-rate SLO alerting paged within 90 seconds and regional feature flags isolated the blast radius out of US-East.

</div>

---

<!-- _class: section animate-in -->

# Corrective Action Items

<div class="table-wrap" data-fragment="1">

| Remediation Task | Owner | Priority | Target Date |
|---|---|---|---|
| Enforce strict 2.5s max statement timeout in CI lint | Core Infra | P0 | Complete |
| Add jittered exponential backoff + token bucket to SDK | SDK Team | P1 | Next Tuesday |
| Separate critical checkout PgBouncer pool from analytics | Database Ops | P1 | Next Friday |
| Run automated game-day replica lock chaos drill | SRE Guild | P2 | Month End |

</div>

---

<!-- _class: closing animate-in -->

<span class="eyebrow">Blameless Culture</span>

# Focus on Resilient Systems, Not Individual Error

- Weekly reliability review tracks all P0/P1 action items to closure
- Full trace dashboards archived under SRE Runbook #84
`,
  },
];

const TEMPLATE_MAP = new Map(TEMPLATES.map((t) => [t.id, t]));

module.exports = {
  TEMPLATES,
  TEMPLATE_MAP,
};
