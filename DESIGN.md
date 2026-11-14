---
name: S.U.N.A IV
description: A cinematic orbital atlas with quiet controls and planetary imagery.
colors:
  bg: "#0a0e12"
  ink: "#eeeee7"
  muted: "#a0a7ae"
  line: "#ffffff1c"
  accent: "#f2a477"
  accent-hover: "#ffc29d"
  action-ink: "#182024"
  tab-ink: "#151c21"
  control-ink: "#c2c7cb"
  control-surface: "#0b1118ba"
  panel-surface: "#10171d"
  field-surface: "#131c23"
  hover-surface: "#ffffff10"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(65px,7.7vw,96px)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-.04em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-.02em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "9px"
    fontWeight: 400
    letterSpacing: ".15em"
  action:
    fontFamily: "Manrope, sans-serif"
    fontSize: "11px"
    fontWeight: 800
  watermark:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(160px,22vw,380px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: ".09em"
rounded:
  control: "3px"
  tile: "4px"
  toolbar: "5px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "30px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "15px 19px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  button-icon:
    textColor: "{colors.control-ink}"
    rounded: "{rounded.control}"
    width: "34px"
    height: "34px"
  button-icon-hover:
    backgroundColor: "{colors.hover-surface}"
    textColor: "{colors.accent}"
  view-tab:
    rounded: "{rounded.control}"
    padding: "9px 10px"
  view-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tab-ink}"
  destination-select:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px"
    width: "100%"
  information-panel:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.ink}"
    width: "100%"
    height: "100%"
---

# Design System: S.U.N.A IV

## Overview

**Creative North Star: "Orbital atlas"**

S.U.N.A IV presents a cinematic space journey through real planetary imagery, near-black blue surfaces, ivory typography, and warm peach actions. The interface is quiet around the scene: oversized world names establish identity while compact labels, fine dividers, and small controls provide an atlas-like reading rhythm.

The visual language combines Manrope's clear geometry with a faint, condensed planetary watermark. Motion introduces a change in perspective; the planet imagery supplies the spectacle. This document describes the built source, not a rendered review. Browser verification was unavailable.

**Key Characteristics:**

- Planetary imagery against deep blue-black space.
- Warm peach actions and ivory selected view tabs.
- Compact metadata, restrained borders, and small control corners.
- Brief story entrances and a replayable simulated descent.

## Colors

The palette balances a cool, dark environment with a warm action accent. Frontmatter records the reused values; translucent colors retain their source hex alpha. The sidecar's generated tonal ramps are preview aids, not additional application colors.

### Primary

- **Warm peach** (`accent`): primary actions, focus outlines, selected dots, orbital brand stroke, and interactive highlights.
- **Lit peach** (`accent-hover`): the primary action hover treatment.

### Neutral

- **Deep space** (`bg`): application ground and scene vignettes.
- **Ivory** (`ink`): primary text and selected view backgrounds.
- **Blue-gray** (`muted`): supporting copy and subdued navigation.
- **Atmospheric line** (`line`): header, dock, and content dividers.
- **Dark action ink** (`action-ink`, `tab-ink`): text on light actions and active view tabs.
- **Control gray** (`control-ink`): resting camera-control icons.
- **Glass control blue** (`control-surface`): translucent camera toolbar.
- **Panel blue / Field blue** (`panel-surface`, `field-surface`): information drawer and destination field.
- **Hover veil** (`hover-surface`): the small icon-button hover surface.

**The Warm Signal Rule.** Use peach for actions and state signals; keep long-form copy in the neutral palette.

## Typography

**Display and Body Font:** Manrope, with sans-serif fallback. Local files provide regular (400), semibold (600), and extra-bold (800).

**Watermark Font:** Barlow Condensed, with sans-serif fallback, at semibold (600).

The hierarchy relies on scale rather than many type families. Large headings use tight tracking, while utility labels use small sizes and open tracking. There is no uniform mathematical type scale.

- **Display:** world headings use the frontmatter display role on desktop; mobile sizes are (76px) at up to (800px) and (68px) at up to (480px).
- **Headline:** drawer headings use the frontmatter headline role; narrow phones reduce them to (35px).
- **Title:** story subheadings use the title role; compact layouts use (12–14px).
- **Body:** desktop story copy uses the body role with a typical maximum width of (280px), reduced to (240px) in the middle breakpoint and expanded to (330px) on wide screens. Mobile story copy uses (10px / 1.8).
- **Label:** the frontmatter label role describes desktop status text. Metadata and utility labels span (5–12px) in the implemented responsive rules.
- **Watermark:** the condensed role is decorative, low contrast, unselectable, and hidden from assistive technology. Its desktop opacity is (.027).
- **Numerals:** measurements and telemetry use tabular numbers.

**The Quiet Metadata Rule.** Keep metadata visually subordinate to the world name and action, while retaining clear labels and visible keyboard focus.

## Layout

The application has a maximum width of (2400px), centered with horizontal overflow clipped. Header, dock, and footer use percentage gutters: (4.2%) on desktop and (5%) at up to (800px). The body minimum width is (360px).

The current explorer uses a scene layer, readable story layer, and utility overlays. Its desktop height is `calc(100svh - 273px)`, bounded by (590px) and (980px). The wide layout changes the calculation and minimum height. The story rail is typically (340px) wide; scene vignettes protect the copy. This composition belongs to the explorer surface rather than a requirement for every future screen.

The world selector and viewing modes share a divided dock on desktop. At up to (800px), the dock stacks, the scene occupies the upper region, the story moves below it, and camera tools become a vertical rail. The explorer uses a fixed height of (760px), then (750px) at up to (480px). The smallest layout puts the mode-picker caption above its tabs and simplifies annotations. Above (1600px), gutters remain proportional while several controls and spacings grow.

Breakpoints are (480px), (800px), (801px), (1150px), and (1600px). Spacing is a small collection of repeated values rather than a strict uniform grid.

## Elevation & Depth

Depth comes primarily from scene rendering, tonal layers, and gradient vignettes. The toolbar has a translucent blue surface and a faint border. The right-hand information panel uses a structural lateral shadow; status toasts use a small floating shadow. Planet thumbnails use inset shadow to suggest a lit sphere.

- **Drawer:** `-20px 0 70px #0005`.
- **Toast:** `0 8px 30px #0005`.
- **Planet thumbnail:** `inset -11px -3px 12px 3px #000d,inset 2px 0 4px #ffffff20`.
- **Modal backdrop:** `#020609b8` with a blur of (6px).

## Shapes

Controls use small, gently softened corners: the frontmatter control radius for buttons, tabs, and fields; the tile radius for world choices and toasts; the toolbar radius for grouped camera controls. Planet thumbnails, status dots, and loading indicators are circular. The information drawer is rectangular and flush to the right edge. Fine (1px) borders establish structure without heavy boxes.

## Components

### Buttons

Primary actions are warm, compact, and directional. The base action has a minimum size of (172px × 46px), a (1px) peach border, the frontmatter padding, and an arrow separated by a (26px) gap. Hover uses lit peach and moves upward by (2px). At up to (800px), padding becomes (12px 16px) and the minimum size becomes (155px × 42px); at (1600px) and above the action grows.

Secondary buttons use a faint white border; hover changes the border and text to peach. Text actions remain unboxed. Camera icon buttons use the frontmatter square dimensions, a light hover veil, and peach for toggled states.

Every keyboard-interactive button, link, select, and input has a peach (2px) focus outline with a (5px) offset. Disabled buttons use opacity (.3) and the default cursor.

### Navigation and view tabs

Header links use muted text, ivory on hover, and a peach (2px) underline for the current item. View tabs are compact icon-and-label buttons. The active tab reverses to ivory with dark ink; other tabs gain a subtle surface on hover. Selected controls expose their state through `aria-pressed`.

### World choices

World choices are softly outlined tiles with circular texture thumbnails, a name, supporting line, and a small index. Selection adds an ivory-tinted surface and border, increases the thumbnail's opacity and saturation, and adds a peach dot. The smallest layout removes the index.

### Inputs / Fields

The destination select uses the field surface, ivory text, a translucent white (1px) border, the frontmatter control radius, and a down chevron. Terrain height uses the native range input with a peach accent; its value is peach and tabular. Neither custom error nor custom disabled field styling is defined.

### Information panel

The modal information panel fills the viewport height and is at most (520px) wide. Its body padding is (72px 50px 40px), reduced to (65px 30px 30px) at the smallest breakpoint. Sections use thin dividers, compact facts, and peach symbols or links. The native dialog provides modal behavior; the close control sits in the top-right corner.

### Journey and feedback

The story entrance lasts (.8s) with `cubic-bezier(.16,1,.3,1)`, moving from (15px) below with blur into a sharp, settled state. The simulated descent lasts (7.4s), with a replay and skip control. Loading feedback uses a (1s) linear spinner. Reduced-motion CSS shortens animations and transitions to (.01ms); the application also skips its initial intro and passes the preference to scenes.

## Do's and Don'ts

### Do:

- **Do** use the extracted neutral palette for readable copy and peach for actions and focus.
- **Do** preserve the small control corners, fine dividers, and clear selected states.
- **Do** keep decorative watermarks separate from meaningful text and accessibility labels.
- **Do** respect reduced motion and retain skip, replay, and camera controls.
- **Do** verify new layouts in a browser; this snapshot was extracted from source.

### Don't:

- **Don't** apply the faint watermark's opacity to content or controls.
- **Don't** replace the defined keyboard focus treatment with an invisible outline.
- **Don't** treat the current explorer composition as the required layout for every new surface.
- **Don't** claim the implemented small-label scale has passed visual or accessibility review.

