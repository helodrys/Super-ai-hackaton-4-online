# SafeFlow Thailand — Motion & Interaction Guide

## Motion personality

Motion should feel:
- smooth
- elegant
- travel-like
- fluid
- premium
- responsive

Avoid:
- excessive bouncing
- cheap spinning animations
- slow annoying transitions
- random animation with no purpose

---

## Recommended animation library

Use Framer Motion.

---

## Page transitions

Each page should:
- fade in
- slide up slightly
- maybe blur in softly

Example:
```tsx
initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
transition={{ duration: 0.45, ease: "easeOut" }}
```

---

## Card entrance

Cards should stagger in.

Example:
```tsx
container: {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

item: {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 }
}
```

---

## Hover effects

Cards:
- lift by 4–8px
- subtle shadow increase
- border glow
- icon movement

Buttons:
- slight scale up
- gradient shift
- icon slides right

Map pins:
- pulse softly
- selected pin grows
- route line glows

---

## Loading states

Use mock loading states.

Examples:
- “Scanning your travel vibe...”
- “Checking route comfort...”
- “Matching food and culture...”
- “Building your personal route...”

Animation:
- progress dots
- glowing path line
- small map pins appearing one by one

---

## Trip planner interactions

When selecting cards:
- selected card should animate border gradient
- small checkmark appears
- card background warms slightly
- selected chips should feel satisfying

When moving between steps:
- current step slides out
- next step slides in
- progress bar animates

---

## Itinerary result animation

When itinerary loads:
1. Header fades in
2. Map appears
3. Pins appear one by one
4. Route line draws
5. Timeline cards stagger in
6. Scores count up

This makes result feel “crafted.”

---

## Motion timings

- Micro hover: 150–220ms
- Card reveal: 300–500ms
- Page transition: 350–600ms
- Result generation: 1.2–2.0s mock loading
- Stagger delay: 60–100ms

---

## Do not overdo

If the page feels laggy, reduce animation.
Visual polish should not hurt usability.
