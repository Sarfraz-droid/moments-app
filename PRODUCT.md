# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Two people in a close romantic relationship who want a lightweight, private way to stay present in each other's day.

## Product Purpose

Moments lets a couple send small photos and notes directly to each other and surface the latest one on the recipient's home-screen widget. Success means sharing feels immediate, personal, and effortless rather than like maintaining another social feed.

## Positioning

Unlike a general chat or social app, Moments is a private space for exactly two people, centered on one small update at a time and its presence on the partner's home screen.

## Operating Context

Users pair their accounts, send a photo, note, or both, view a shared chronological history, react to individual moments, and rely on the home-screen widget to display the latest received moment. Sending is typically quick and one-handed; viewing and reacting should require minimal interface chrome.

## Capabilities and Constraints

- Supports photo moments, text moments, and photo moments with captions.
- Reactions use a long-press gesture to reveal an emoji picker. The picker hides after selection, and only reactions that have actually been added remain visible.
- Pairing is invite-code based and limited to two people.
- Authentication supports Google, phone, and guest access.
- The app is built with Expo SDK 57 and React Native for Android and iOS.
- The home-screen widget and its instant background updates are currently an Android capability.
- Existing data, authentication, pairing, notification, and widget behavior must remain intact during UI work.

## Brand Commitments

- Product name: Moments.
- Interface language: consistent English.
- Voice: intimate, direct, calm, and uncomplicated.
- The interface should sit comfortably beside Instagram in familiarity and craft while remaining private, simpler, and free of public-social metrics.
- Existing logo and supplied image assets may be refined in presentation but should remain recognizable.

## Evidence on Hand

- Existing application routes and working product flows under `src/app/`.
- Existing logo and application assets under `assets/`.
- No testimonials, commercial claims, benchmarks, or external brand proof are available and none should be invented.

## Product Principles

- Keep the couple and their shared moment at the center.
- Make sending and reacting possible with minimal decisions.
- Reveal controls only when they are relevant.
- Prefer immediate feedback and clear state over decorative motion.
- Preserve privacy and emotional warmth without making the interface visually busy.

## Accessibility & Inclusion

Use familiar native interactions, readable contrast, appropriately sized touch targets, reduced-motion-aware animation, and non-gesture alternatives wherever a gesture is required for discovery or access.
