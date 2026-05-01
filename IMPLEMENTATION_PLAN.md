# SafeFlow Thailand — Implementation Plan

## Recommended stack

Use:
- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn/ui
- lucide-react
- mock data files

Alternative fast stack:
- Vite + React
- Tailwind
- Framer Motion

---

## Suggested folder structure

```text
safeflow-thailand/
├── README.md
├── DESIGN.md
├── package.json
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── taxi/page.tsx
│   │   ├── planner/page.tsx
│   │   └── itinerary/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── taxi/
│   │   ├── planner/
│   │   ├── itinerary/
│   │   └── ui/
│   ├── data/
│   │   ├── weather.ts
│   │   ├── taxi.ts
│   │   ├── places.ts
│   │   ├── plannerOptions.ts
│   │   └── itinerary.ts
│   ├── lib/
│   │   ├── mockRisk.ts
│   │   ├── mockRecommendation.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
```

---

## Build order

### Phase 1 — Foundation

1. Create app shell
2. Add Tailwind design tokens
3. Add nav
4. Add animated background
5. Add route/page transitions

### Phase 2 — Dashboard

1. Weather hero card
2. Condition metric cards
3. Action tiles
4. Mood chips
5. Mock map panel

### Phase 3 — Taxi checker

1. Form
2. Suspicious signal checkboxes
3. Mock fare calculation
4. Risk result card
5. Thai phrase helper
6. Mini route panel

### Phase 4 — Trip planner

1. Stepper
2. Selectable option cards
3. Budget/time controls
4. Free prompt field
5. Summary sidebar
6. Generate route button

### Phase 5 — Itinerary result

1. Itinerary header
2. Large mock map
3. Animated route pins
4. Timeline
5. Smart score cards
6. AI explanation panel
7. Alternative route tabs

---

## Mock functions

### Taxi risk

```ts
function calculateTaxiRisk(offeredPrice, fairMin, fairMax, signals) {
  let score = 0;

  if (offeredPrice > fairMax * 1.5) score += 40;
  if (offeredPrice > fairMax * 2.5) score += 30;
  if (signals.includes("no meter")) score += 20;
  if (signals.includes("cash only")) score += 15;
  if (signals.includes("pressure")) score += 15;

  if (score >= 70) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}
```

### Trip score

```ts
function calculateRouteScores(userPrefs, route) {
  return {
    crowdComfort: 82,
    foodMatch: 91,
    localAuthenticity: 88,
    accessibilityFit: 76,
    weatherSuitability: 80,
    budgetFit: 86
  };
}
```

---

## Important

The prototype should be beautiful first.
Do not overbuild backend logic.
Use believable mock logic and focus on visual storytelling.
