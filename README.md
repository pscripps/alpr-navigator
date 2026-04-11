# ALPR Navigator

50-state coverage of Automatic License Plate Reader statutes. Two tracks: **private enterprise/personal** and **law enforcement**. .

## What this is

An interactive tool for product managers, in-house counsel, compliance teams, or anyone wanting to understand ALPR statutes.

Each state entry covers:
- Deployment status (Prohibited → Consult Legal → Specific Uses Only → Permitted → No Specific Law)
- Data retention requirements
- Data sharing restrictions
- Whether private citizens can sue directly (private right of action)
- Active litigation
- Notable operational requirements

## Two tracks

**Private Enterprise/Personal** — commercial operators, fleet managers, property owners, and individuals using ALPR for non-government purposes.

**Law Enforcement** — police, sheriff, government agencies, and (where the statute extends) their contracted vendors.

Most states regulate these differently. The tool lets you filter by either track or view the worst-case across both.

## Data

`src/data/alpr-statutes.json` is the single source of truth. The React app imports from it directly. To update the data, edit the JSON — the UI regenerates automatically.

Data last verified: April 2026.

## States with enacted statutes

23 states plus DC (DC's statute exists but is unfunded and not yet effective). The remaining states have no ALPR-specific law — other obligations may apply to license plate data, however.

## Running locally

```
npm install
npm run dev
```

## Deployment

This project auto-deploys to GitHub Pages via GitHub Actions on every push to `main`.

## Disclaimer

This tool demonstrates methodology. It is not production compliance software, nor is it legal advice. Always verify against current statute text before relying on it professionally.
