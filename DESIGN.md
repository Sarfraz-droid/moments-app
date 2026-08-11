---
name: Moments
description: A private, media-first photo note for two people.
colors:
  light-background: "#FFFFFF"
  light-surface: "#F5F5F3"
  light-selected: "#ECECEA"
  light-text: "#171717"
  light-muted: "#6F6F6B"
  light-brand: "#C23F35"
  light-brand-soft: "#FFF0ED"
  light-note: "#F7F7F5"
  light-note-ink: "#222220"
  light-divider: "#E5E5E2"
  light-danger: "#C33B31"
  dark-background: "#0C0C0C"
  dark-surface: "#1C1C1B"
  dark-selected: "#292927"
  dark-text: "#F7F7F5"
  dark-muted: "#A4A4A0"
  dark-brand: "#FF7265"
  dark-brand-soft: "#351B18"
  dark-note: "#1A1A19"
  dark-note-ink: "#F4F4F1"
  dark-divider: "#30302E"
  dark-danger: "#FF8178"
  on-brand: "#FFFFFF"
typography:
  display:
    fontFamily: "Poppins_700Bold"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.176
    letterSpacing: "-0.9px"
  title:
    fontFamily: "Poppins_700Bold"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.7px"
  headline:
    fontFamily: "Poppins_600SemiBold"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Poppins_400Regular"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins_600SemiBold"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.429
  caption:
    fontFamily: "Poppins_400Regular"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.333
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "999px"
spacing:
  half: "2px"
  one: "4px"
  two: "8px"
  three: "16px"
  four: "24px"
  five: "32px"
  six: "48px"
components:
  button-primary:
    backgroundColor: "{colors.light-brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
    height: "50px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.light-text}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
    height: "50px"
  text-field:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
    height: "56px"
  note-field:
    backgroundColor: "{colors.light-background}"
    textColor: "{colors.light-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
    height: "132px"
  reaction-chip-selected:
    backgroundColor: "{colors.light-brand-soft}"
    textColor: "{colors.light-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px"
    height: "32px"
  center-send-action:
    backgroundColor: "{colors.light-brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.pill}"
    size: "56px"
    height: "56px"
    width: "56px"
---

# Design System: Moments

## Overview

**Creative North Star: "The Private Photo Note"**

Moments should feel like a photo or tiny note placed directly into one loved person's hand. The interface borrows the immediate legibility and media confidence of Instagram, then removes public-social density: no metrics, ornamental chrome, or competing calls to action. Photos and personal words are the content; the interface stays quiet around them.

The mood is intimate, calm, cute, and grown-up. Friendly Poppins typography, centered titles, neutral surfaces, and a single deep coral interaction color create warmth without turning the app into a scrapbook. Controls are familiar and native, while the large center send action and gesture-led reaction tray give the product a recognizable rhythm of its own.

**Key Characteristics:**

- Media-first composition with full-width square photos and restrained context.
- Flat white or near-neutral surfaces separated by hairlines and tonal shifts.
- One accessible deep coral action color, supported by a pale coral selected state.
- Friendly Poppins typography with minimal centered titles.
- Spacious, centered onboarding with one dominant decision at a time.
- Native sheets and platform symbols for focused actions.
- Reactions stay hidden until relevant; only reactions that exist remain visible.

## Colors

The palette is a warm-neutral light/dark system with deep coral reserved for action, selection, and the couple's private emotional signal.

### Primary

- **Deep Coral** (`light-brand` / `dark-brand`): Primary actions, selected navigation, the Moments mark, the heart reaction, and the quick-send widget.
- **Coral Whisper** (`light-brand-soft` / `dark-brand-soft`): Selected reaction chips, owned avatars, camera emphasis, and quiet error containers.

### Neutral

- **Clear Canvas** (`light-background` / `dark-background`): The uninterrupted app background and temporary overlay surface.
- **Soft Stone** (`light-surface` / `dark-surface`): Input fills, inactive chips, media placeholders, and secondary action rows.
- **Pressed Stone** (`light-selected` / `dark-selected`): Low-emphasis selected or partner-context surfaces.
- **Ink** (`light-text` / `dark-text`): Primary copy and icons.
- **Quiet Ink** (`light-muted` / `dark-muted`): Timestamps, supporting instructions, and inactive navigation.
- **Note Paper** (`light-note` / `dark-note`) with **Note Ink** (`light-note-ink` / `dark-note-ink`): Text-only moments and their legible foreground.
- **Hairline** (`light-divider` / `dark-divider`): Feed boundaries, field outlines, and navigation separation.
- **Danger Coral** (`light-danger` / `dark-danger`): Destructive account actions only.
- **On Coral** (`on-brand`): Content placed directly on the primary action color.

**The One Coral Rule.** Deep coral is the only general interaction accent. Do not introduce competing blues, purples, or decorative gradients.

**The Media Keeps Its Color Rule.** The interface stays chromatically restrained so shared photos remain the richest color on the screen.

## Typography

**Display Font:** Poppins Bold (`Poppins_700Bold`)
**Body Font:** Poppins Regular (`Poppins_400Regular`)
**Label Font:** Poppins SemiBold (`Poppins_600SemiBold`)

**Character:** Poppins makes the product approachable and gently playful while remaining clean enough for native utility. Weight and spacing—not a second typeface—create hierarchy.

### Hierarchy

- **Display** (700, 34px, 40px line height): Onboarding statements and major empty-state moments; individual screens may scale it to 32–40px while retaining the same bold face.
- **Title** (700, 30px, 36px line height): Strong screen-level or empty-state titles.
- **Headline** (600, 20px, 28px line height): Composer prompts and section-leading questions.
- **Body** (400, 16px, 24px line height): Captions, explanatory copy, and notes.
- **Label** (600, 14px, 20px line height): Buttons, sender names, field labels, and compact controls.
- **Caption** (400, 12px, 16px line height): Partner context, timestamps, widget metadata, and tab labels.

**The Friendly Restraint Rule.** Keep titles short and use bold Poppins sparingly; long explanatory copy stays regular weight and secondary color.

**The Centered Title Rule.** Center brand headers and spacious onboarding titles. Keep operational content, captions, and form labels left aligned.

## Layout

The system follows a 2, 4, 8, 16, 24, 32, and 48px rhythm. Primary mobile gutters are 16–24px; feed metadata uses 16px while onboarding and account forms use 24px. Form groups cap at 420px and centered explanatory text at roughly 300–360px. General content may grow to the implemented 800px maximum, but media remains the visual anchor.

The home feed uses a slim centered app bar, compact sender context, edge-to-edge square photography, and small reaction/footer zones. Text-only moments inset by 16px into a quiet rounded note surface. The Send composer is a native, nearly full-height form sheet with a centered title, 44px close/send controls, square media preview, and vertically stacked choices. Onboarding is centered and spacious, with a single-column form and one primary action.

Respect safe-area and keyboard insets on both platforms. Interactive targets are at least 44px in the implemented iOS-oriented controls and should reach 48dp on Android where the platform requires it. Expanded layouts may add breathing room and honor the content caps; they must not turn the private feed into a dense dashboard.

**The One-Handed Send Rule.** Keep the center send action prominent and keep composer decisions vertically ordered for quick thumb reach.

## Elevation & Depth

Moments is flat by default. Canvas, notes, inputs, cards, and navigation are separated with neutral fills, clipping, and hairline dividers rather than permanent shadows. Elevation is reserved for temporary or floating controls: the reaction tray uses a soft ambient shadow, and the large center send action lifts above the tab bar. Native sheets provide their own platform depth.

### Shadow Vocabulary

- **Reaction Overlay** (`0 8px 20px rgba(0,0,0,0.12)`, Android elevation 5): Separates the transient reaction tray from the moment beneath it.
- **Primary Float** (`0 6px 14px rgba(0,0,0,0.14)`, Android elevation 6): Gives the 56px center send action enough lift to read above navigation.

**The Flat-by-Default Rule.** If a surface persists at rest, prefer tonal contrast or a hairline. Shadows belong to temporary overlays and the singular floating send action.

## Shapes

The form language is gently rounded, not bubbly. Small informational surfaces use 8px corners, fields and note blocks use 12px, primary buttons and larger containers use 16px, and widgets use 20px. Pills are reserved for reactions, compact overlay controls, and truly circular actions. Square photos stay edge-to-edge in the feed; previews and text moments clip to 12px corners when inset.

Circular geometry has meaning: avatars represent people, the M seal represents Moments, and the 56px coral circle represents sending. Avoid turning every container into a pill or card.

## Components

### Buttons

- **Shape:** Primary and outlined onboarding actions use gently rounded 16px corners and a 50px minimum height. Compact icon actions use 44px circles.
- **Primary:** Deep coral fill, white Poppins SemiBold label, and 16px vertical padding. Disabled state reduces opacity to 0.5–0.6 without changing hue.
- **Pressed / Focus:** Animated primary controls compress to 0.98 scale and 0.86 opacity over 90ms; reduced-motion mode removes the scale change. Preserve a platform-visible focus treatment.
- **Secondary / Ghost:** Outlined actions use a 1–1.5px Ink border with no fill. Tertiary actions are text-only, secondary-color controls with a full 44–48px hit area.

### Chips

- **Style:** Reaction chips are compact pills with 8px horizontal padding, a 32px minimum height, and a one-pixel border.
- **State:** Unselected reactions use Soft Stone and Hairline. The current user's reaction uses Coral Whisper, Deep Coral, and a Deep Coral border. Do not render reaction chips with a zero count.

### Cards / Containers

- **Corner Style:** Text moments and composer media containers use 12px corners; Android widgets use 20px.
- **Background:** Photo moments use the image itself. Text moments use Note Paper. Inputs and secondary choices use Soft Stone.
- **Shadow Strategy:** Flat at rest; see Elevation & Depth.
- **Border:** Hairline dividers separate feed moments and app bars; inset note and input containers use a one-pixel Hairline border.
- **Internal Padding:** Text moments use 24px; form rows and fields use 16–24px according to density.

### Inputs / Fields

- **Style:** Single-line fields use a Soft Stone fill, one-pixel Hairline border, 12px corners, 24px horizontal padding, and a 56px minimum height. The multiline composer field uses a Clear Canvas fill, 16px padding, and a 132px minimum height.
- **Focus:** Keep the native caret and keyboard behavior, with a clearly visible platform focus indication.
- **Error / Disabled:** Errors use direct, calm copy in Coral Whisper containers or Quiet Ink beneath the field. Disabled actions retain their shape and reduce opacity.

### Navigation

The native tab bar is flat with a top hairline, Home and Profile destinations, and a large 56px coral send action centered and lifted 18px above the bar. Inactive icons and 11px labels use Quiet Ink; the active destination uses Deep Coral. Use platform symbols and preserve safe-area padding. Send remains an action that opens the native form sheet, not a faux feed destination.

### Moment and Reactions

The moment is the signature component: a compact sender row, full-width square photo or inset note block, optional caption, and only the reactions that have actually been added. Tapping the heart control toggles the default `❤️` reaction. Pressing and holding, or invoking the accessibility action, reveals a pill-shaped emoji tray; sliding chooses a reaction, the selected emoji briefly enlarges, and the tray dismisses after selection. Honor reduced motion with instant state changes.

### Widgets

The Android moment widget uses the same flat white/neutral canvas, 20px corners, media-first crop, compact metadata, and reaction chips. Its footer begins with sender metadata and a fully bounded 42px coral quick-camera action; the action sits in the row rather than overlapping an edge so Android RemoteViews does not clip it. The standalone quick-send widget is a single deep coral surface with a white plus and label. Both send shortcuts open the native Send sheet with the camera requested once. Widget typography stays compact and subordinate to the moment.

## Do's and Don'ts

### Do:

- **Do** let shared photos and notes occupy the visual center of gravity.
- **Do** use Deep Coral for primary action, active state, the heart reaction, and brand marks.
- **Do** keep headers minimal and centered, then align operational content for fast scanning.
- **Do** use native sheets, safe areas, platform symbols, and accessible 44–48px touch targets.
- **Do** keep onboarding centered, spacious, and limited to one primary decision per screen.
- **Do** provide a tap and accessibility alternative wherever hold-and-slide reveals reactions.
- **Do** keep widgets visually consistent with the in-app moment and route their send actions through the Send sheet's one-time camera launch.

### Don't:

- **Don't** add public-social metrics, engagement counters, follower language, or feed chrome.
- **Don't** introduce competing accent colors, decorative gradients, or scrapbook ornament.
- **Don't** wrap full-width photos in floating cards or persistent shadows.
- **Don't** show an empty reaction row; reactions appear only after someone adds them.
- **Don't** use pills for ordinary fields and containers; reserve them for reactions and compact controls.
- **Don't** let custom motion override native navigation, sheet behavior, or reduced-motion preferences.
