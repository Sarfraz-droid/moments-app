# Moments Core App

- Scope: home feed, sending, reactions, onboarding, pairing, account, and shared native components.
- Mode: Operate.
- Audience: two close romantic partners sharing private photos and notes.
- Primary job: see the latest shared moment immediately, send a new one quickly, and react without persistent interface clutter.
- Primary action: send a photo or note to the partner.
- Constraints: preserve auth, pairing, realtime data, notifications, and Android widget behavior; English throughout; iOS and Android native expectations; accessible alternative to long press.
- Direction: polished category-standard native photo sharing, using Instagram as a craft and familiarity benchmark without public-social features.
- Approved composition: `.impeccable/mocks/feed-media-first.png`.
- Memorable moment: a long press softly lifts the moment and reveals a compact native reaction tray; selection gives a single spring confirmation and the tray disappears.

## Implementation inventory

| Visible ingredient | Commitment | Medium |
| --- | --- | --- |
| Top app bar | Small Moments wordmark, partner context, account access | React Native semantic layout |
| Feed moment | Sender row, full-width media or quiet note block, caption, actual reactions only | React Native + `expo-image` |
| Reaction interaction | Hidden by default; long-press tray; tap existing reaction toggles it | React Native Pressable + Moti |
| Navigation | Familiar native Home and Send destinations | Expo Router native tabs |
| Send composer | Media preview, direct camera/gallery choices, note field, one primary send action | React Native controls |
| Onboarding and account | Clear native forms with one primary action per screen | React Native controls |
| Elevation | Flat surfaces, separators, tonal contrast; shadow only for temporary overlays | Theme roles and platform elevation |
