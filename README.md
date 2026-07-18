# Regime Atlas

Interactive 50-state + DC surveys of state-law regimes, rendered as a single self-contained page:

- **ALPR** — Automatic License Plate Reader statutes, two tracks (law enforcement / private)
- **Public records** — access, deadlines, fees
- **Wiretap / recording** — consent and interception rules

Live: https://pscripps.github.io/alpr-navigator/

## What this is

A research reader for product managers, in-house counsel, and compliance teams. Pick a regime, pick a legal question; the map re-encodes and the holdings index regroups by answer. Each jurisdiction opens to an authored holding, decision facts, and collapsed litigation / statutory-evidence drawers with citations.

Built as one static HTML file; no backend, no build step in this repo. The atlas is generated from research data by build tooling maintained elsewhere — this repo is the deploy surface.

## Disclaimer

Proof of concept, not legal advice. Statutes evolve; verify against primary sources (linked throughout) before relying on any entry.
