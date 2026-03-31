# Operations

## Build Commands

- `npm run build`: generate ESM/UMD bundles and declaration files.
- `npm run build:types`: generate only declaration files.
- `npm run typecheck`: run TypeScript checks without emit.
- `npm run dev`: watch-mode build.

## Versioning

Use Semantic Versioning:

- `MAJOR`: breaking API changes
- `MINOR`: backward-compatible features
- `PATCH`: fixes and small improvements

## Release Checklist

1. Run `npm run typecheck`
2. Run `npm run build`
3. Validate `dist/` artifacts
4. Update changelog/release notes
5. Tag release (`vX.Y.Z`)

## Consumer Compatibility

When changing runtime behavior, validate with at least one real consumer adapter (e.g., React wrapper) before release.
