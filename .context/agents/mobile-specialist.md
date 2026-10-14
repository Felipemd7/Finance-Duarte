---
type: agent
name: Mobile Specialist
description: Adapt the experience for mobile usage
agentType: mobile-specialist
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

This is a mobile-first responsive web app (no native mobile shell, no React Native/Capacitor) — engage this agent for mobile-web layout, touch interactions, and camera-upload UX, primarily around the receipt scanner and bottom navigation.

## Responsibilities

- Maintain `src/components/MobileNavigation.tsx` and `src/components/BottomNav.tsx` as the primary navigation pattern on small screens
- Ensure the receipt scanner (`ScannerView.tsx`/`AiReceiptScanner`) works well with phone cameras — image capture, compression (`src/utils/imageCompressor.ts`), and upload over potentially slow mobile connections
- Verify Tailwind breakpoints keep tables (Transactions, Supermarket Analytics) usable on narrow viewports, likely via horizontal scroll or responsive stacking

## Best Practices

- Test any UI change at common phone widths (375–430px) in addition to desktop, since the app's primary use case is a phone in a grocery store
- Keep touch targets large enough for one-handed use while shopping

## Key Project Resources

- [../docs/project-overview.md](../docs/project-overview.md)

## Repository Starting Points

- `src/components/MobileNavigation.tsx`, `src/components/BottomNav.tsx`
- `src/components/ScannerView.tsx`
- `src/utils/imageCompressor.ts`

## Key Files

- [src/components/MobileNavigation.tsx](../../src/components/MobileNavigation.tsx)
- [src/components/BottomNav.tsx](../../src/components/BottomNav.tsx)
- [src/utils/imageCompressor.ts](../../src/utils/imageCompressor.ts)

## Architecture Context

- No separate mobile codebase exists — "mobile" here means responsive Tailwind layout of the same React components, not a distinct app

## Key Symbols for This Agent

- `compressImage` — [src/utils/imageCompressor.ts:9](../../src/utils/imageCompressor.ts)
- `MobileNavigationProps` — `src/components/MobileNavigation.tsx:23`

## Documentation Touchpoints

- [../docs/project-overview.md](../docs/project-overview.md)

## Collaboration Checklist

1. Test the change at phone width (~375-430px) first.
2. Verify the scanner flow works end-to-end with a real photo upload.
3. Confirm navigation remains usable with the bottom nav / drawer pattern.

## Hand-off Notes

There is no native app and no plan evident in the repo to build one — "mobile" work here is strictly responsive web; don't introduce React Native/Capacitor tooling without an explicit request.
