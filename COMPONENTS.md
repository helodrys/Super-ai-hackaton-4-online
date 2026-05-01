# SafeFlow Thailand — Component Specification

## Core components

Build reusable components. Avoid dumping all UI into one page.

---

## 1. AppShell

Purpose:
- navbar
- page container
- background system
- route transitions

Props:
- currentPage
- children

Features:
- gradient background
- floating decorative blobs
- responsive nav
- brand wordmark

---

## 2. TopNav

Items:
- Dashboard
- Taxi Checker
- Trip Planner
- My Route

Design:
- glass navbar
- active pill indicator
- CTA button “Plan my trip”
- mobile menu

---

## 3. WeatherHeroCard

Displays:
- city
- weather icon
- temperature
- feels-like
- PM2.5
- short condition summary

Mock example:
```json
{
  "city": "Bangkok",
  "temperature": 32,
  "feelsLike": 38,
  "weather": "Partly cloudy",
  "pm25": 42,
  "airQuality": "Moderate",
  "summary": "Good for indoor culture routes this afternoon."
}
```

Design:
- large premium card
- gradient background
- animated weather icon
- glass inner cards

---

## 4. ConditionMetricCard

Displays:
- label
- value
- icon
- status
- mini trend

Examples:
- Feels Like: 38°C
- PM2.5: Moderate
- Travel Comfort: 76/100
- Rain Risk: Low

---

## 5. FeatureActionTile

Used on dashboard:
- Taxi Scam Checker
- Plan My Trip
- Crowd & Comfort
- Travel Alerts

Design:
- big clickable tile
- gradient border
- hover lift
- animated icon
- short copy

---

## 6. TravelMoodChip

Selectable chips:
- Ancient Thailand
- Hidden Gems
- Foodie Journey
- Cozy & Slow
- Photo Spot Hunt

Design:
- colorful pill
- selected state has glow
- icon or emoji-style visual

---

## 7. MockMapPanel

A stylized map component.

Must show:
- route lines
- pins
- place cards
- city region labels
- animated selected pin

Props:
- pins
- route
- selectedPin

Pin types:
- risk
- recommended
- local
- food
- culture

---

## 8. TaxiCheckForm

Fields:
- pickup
- destination
- offeredPrice
- transportType
- suspiciousSignals

Use:
- text inputs
- select
- checkbox cards
- strong CTA

CTA:
> Check this fare

---

## 9. TaxiRiskResultCard

Displays:
- risk level
- expected price range
- offered price
- suspicious signals
- explanation
- recommended actions

Risk levels:
- Low
- Medium
- High

Design:
- High risk should look serious but not scary
- action buttons at bottom

---

## 10. ThaiPhraseCard

Displays:
- Thai phrase
- translation
- copy button
- mock audio button

Example:
```text
ขอใช้มิเตอร์ได้ไหมครับ/ค่ะ
Can you use the meter?
```

---

## 11. PlannerStepper

Steps:
1. Traveler
2. Needs
3. Vibe
4. Places
5. Food
6. Budget
7. Prompt

Design:
- visual progress
- smooth step transitions
- back/next buttons
- summary sidebar

---

## 12. SelectableOptionCard

Used for:
- traveler profiles
- accessibility options
- vibes
- food
- place types

Props:
- label
- description
- icon
- selected
- onClick

Design:
- card grid
- selected state gradient border
- hover motion

---

## 13. BudgetSelector

Options:
- Budget
- Medium
- Premium
- Luxury

Visual:
- price indicators
- selected glow
- short explanation

---

## 14. ItineraryHeader

Displays:
- route name
- vibe summary
- city
- duration
- budget
- CTA buttons

---

## 15. ItineraryTimeline

Displays 4–6 itinerary stops.

Each stop:
- number
- time
- place name
- category
- image
- reason
- tags
- budget
- comfort note

Design:
- vertical timeline
- animated reveal
- connected route line

---

## 16. SmartScoreCard

Metrics:
- Crowd Comfort
- Food Match
- Local Authenticity
- Accessibility Fit
- Weather Suitability
- Budget Fit

Design:
- radial progress or progress bars
- vibrant but readable

---

## 17. AIExplanationPanel

Explains:
- why route was chosen
- what user preferences influenced it
- what was avoided
- how it supports local businesses

Tone:
- helpful
- personal
- concise

---

## 18. AlternativeRouteTabs

Tabs:
- Main Route
- Rainy Day
- More Local
- Low Walking

Each tab updates mock itinerary data.

---

## Component quality rules

- Every component must have a clear purpose.
- Avoid giant components.
- Use mock data constants.
- Use consistent spacing and rounded corners.
- Use animations only where they improve feeling.
- Keep UI readable.
