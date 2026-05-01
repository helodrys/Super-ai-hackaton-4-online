# SafeFlow Thailand — DESIGN.md

## Design goal

SafeFlow Thailand should feel like a premium travel companion, not a generic SaaS dashboard.

The interface should make users feel:

- excited to explore Thailand
- safe and guided
- personally understood
- curious about better routes
- confident in travel decisions

The product should look polished enough for a hackathon demo, GitHub portfolio, and commercial prototype.

---

## Visual personality

Use these keywords to guide every UI decision:

- cinematic
- tropical
- intelligent
- adventurous
- warm
- trustworthy
- colorful
- fluid
- premium
- local
- modern

Avoid:
- corporate SaaS grayness
- default cards
- boring admin panels
- generic landing page blocks
- empty white dashboards
- low-effort AI app look

---

## Art direction

The app should feel like:

> A smart travel map mixed with a premium consumer app and a light adventure-game interface.

Visual motifs:
- flowing route lines
- glowing map pins
- travel stamps
- soft gradients
- glass cards
- tropical atmosphere
- Thai-inspired warmth without using cliché temple overload
- subtle sun / ocean / city / mountain moods

---

## Color palette

Use a bright but controlled travel palette.

### Primary colors

```css
--teal-deep: #0F766E;
--teal-bright: #14B8A6;
--ocean-blue: #0284C7;
--sky-blue: #38BDF8;
--sunset-coral: #FB7185;
--sunset-orange: #F97316;
--gold: #FACC15;
--leaf-green: #22C55E;
--orchid-purple: #A855F7;
--cream: #FFF7ED;
--sand: #FDE68A;
--ink: #0F172A;
--muted-ink: #475569;
```

### Suggested gradients

```css
background: linear-gradient(135deg, #0F766E 0%, #0284C7 45%, #A855F7 100%);
background: linear-gradient(135deg, #FFF7ED 0%, #E0F2FE 45%, #CCFBF1 100%);
background: linear-gradient(135deg, #FB7185 0%, #F97316 50%, #FACC15 100%);
```

### Color usage

- Teal / ocean blue = trust, safety, intelligence
- Coral / orange / gold = energy, travel, action
- Green = safe, recommended, local-friendly
- Purple = personalization / AI magic
- Cream / warm white = calm premium background
- Deep ink = high readability

---

## Typography

Use a clean modern font pairing.

Recommended:
- Headings: `Plus Jakarta Sans`, `Sora`, or `Clash Display`
- Body: `Inter`, `Manrope`, or `Plus Jakarta Sans`

Typography rules:
- Hero heading should be large and emotional.
- Cards should use short, clear labels.
- Avoid long paragraphs inside UI.
- Use strong hierarchy: headline → short explanation → action.

Example hero copy:

> Ready for a smoother day in Bangkok?

Example supporting copy:

> We scan travel comfort, air quality, weather, and local friction so your day feels effortless.

---

## Layout principles

- Use large spacing.
- Avoid cramped dashboards.
- Important actions should be obvious.
- Use strong visual grouping.
- Make every screen feel intentional.
- Use horizontal cards and map panels to create a travel-app feel.
- Use route lines and pins to connect sections visually.

---

## Card design

Cards should feel tactile and premium.

Recommended card style:
- `rounded-3xl`
- subtle glass background
- soft shadow
- gradient border or glow on hover
- generous padding
- icon / mini visual on top
- clear title + short action text

Example:
```tsx
<div className="rounded-3xl bg-white/75 backdrop-blur-xl border border-white/50 shadow-xl p-6">
```

---

## Button design

Primary CTA:
- gradient background
- strong rounded corners
- hover lift
- glow on hover
- subtle icon movement

Secondary CTA:
- glass / soft white
- border
- hover background change

Danger / risk CTA:
- use coral/red carefully
- clear action language

Button copy examples:
- “Check my taxi price”
- “Plan my trip”
- “Show Thai phrase”
- “Build safer route”
- “Reroute my day”

---

## Map visual style

The map should not look boring.

Mock map design can use:
- gradient terrain background
- curved route lines
- animated pins
- numbered stops
- pulsing selected marker
- route progress glow
- place cards attached to pins

Map colors:
- Red/orange pin = high friction
- Yellow pin = caution
- Green pin = recommended / safer
- Blue pin = local business
- Purple pin = personalized AI pick

---

## Risk visual language

Use risk labels:

- Low = green
- Medium = yellow
- High = coral/red
- Critical = deep red

Never use risk as fear-mongering.
Use calm, actionable language.

Example:

Instead of:
> Dangerous. Do not go.

Use:
> Reroute recommended. This plan may feel uncomfortable right now because of peak-hour crowding and high heat.

---

## Microcopy style

Tone:
- helpful
- calm
- smart
- friendly
- not robotic
- not overly dramatic

Good examples:
- “This route feels smoother right now.”
- “You can still enjoy the area — just shift the order.”
- “This fare looks unusual compared with the expected range.”
- “We found a calmer local option nearby.”

Avoid:
- “AI detected scam with 100% certainty.”
- “This place is dangerous.”
- “You must not go.”
- “Guaranteed safe.”

---

## Accessibility

Even though this is a prototype, keep accessibility in mind.

- high contrast text
- large click targets
- clear focus state
- readable card text
- avoid information only by color
- use labels and icons together

---

## Final design quality checklist

Before finishing, check:

- Does it feel like a travel product, not an admin tool?
- Are the colors memorable but not chaotic?
- Are the main CTAs obvious?
- Does the map feel exciting?
- Are forms enjoyable to use?
- Do cards have visual hierarchy?
- Are animations smooth and intentional?
- Would a judge immediately understand the product?
