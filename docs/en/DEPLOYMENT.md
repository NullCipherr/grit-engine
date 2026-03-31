# Deployment

## Package Outputs

Build artifacts:

- `dist/index.js` (ESM)
- `dist/index.umd.js` (UMD)
- `dist/types/**/*.d.ts` (Type declarations)

## Distribution Modes

1. Local workspace (`file:../grit-engine`)
2. Git dependency (`git+https://...`)
3. Private npm-compatible registry

## Pre-Publish Validation

Run:

```bash
npm run typecheck
npm run build
```

Then verify exported entries in `package.json`.

## CI Recommendation

Pipeline stages:

1. Install
2. Typecheck
3. Build
4. Artifact verification
